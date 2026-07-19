'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { PredictionSummary } from '@/shared/types';

export function useSoundAlerts(prediction: PredictionSummary | null) {
  const audioContextRef = useRef<AudioContext | null>(null);
  // Track every setTimeout we schedule so we can clear them on unmount
  // and avoid the (mild) audio-after-unmount leak.
  const timersRef = useRef<number[]>([]);
  const lastBoardingRef = useRef<number>(0);
  const lastRiskRef = useRef<string>('');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const scheduleTone = useCallback((tone: () => void, delayMs: number) => {
    const id = window.setTimeout(tone, delayMs);
    timersRef.current.push(id);
  }, []);

  const enableSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        // Safari <14.5 and older iOS expose webkitAudioContext only.
        const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
        if (Ctor) audioContextRef.current = new Ctor();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setSoundEnabled(true);
    } catch {}
  }, []);

  // Listen for user gesture to enable sound
  useEffect(() => {
    const handler = () => enableSound();
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [enableSound]);

  const playTone = useCallback((frequency: number, duration: number, volume: number = 0.5) => {
    if (!soundEnabled) return;
    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }, [soundEnabled]);

  // Auto-play based on prediction changes
  useEffect(() => {
    if (!prediction || !soundEnabled) return;

    const currentBoarding = prediction.current_boarding;
    const currentRisk = prediction.peak_risk_level;
    const prevBoarding = lastBoardingRef.current;
    const prevRisk = lastRiskRef.current;

    // Track transitions out of the initial sentinel state too — a real
    // 0 → N jump should fire an alert, not be silently suppressed.
    const isFirstUpdate = prevRisk === '';
    const boardingChanged = !isFirstUpdate && currentBoarding !== prevBoarding;
    const riskChanged = !isFirstUpdate && currentRisk !== prevRisk;
    const boardingJump = currentBoarding - prevBoarding;

    lastBoardingRef.current = currentBoarding;
    lastRiskRef.current = currentRisk;

    // First load — no sound
    if (isFirstUpdate) return;

    // LARGE: risk escalated to critical or high
    if (riskChanged && (currentRisk === 'critical' || (currentRisk === 'high' && prevRisk !== 'critical'))) {
      playTone(880, 250, 0.6);
      scheduleTone(() => playTone(1047, 250, 0.65), 280);
      scheduleTone(() => playTone(1319, 350, 0.7), 560);
      return;
    }

    // MEDIUM: boarding jumped 3+
    if (boardingChanged && boardingJump >= 3) {
      playTone(659, 200, 0.5);
      scheduleTone(() => playTone(784, 250, 0.55), 220);
      return;
    }

    // SMALL: any boarding change
    if (boardingChanged) {
      playTone(523, 200, 0.4);
      return;
    }
  }, [prediction, soundEnabled, playTone, scheduleTone]);

  // Cleanup on unmount: close the AudioContext and clear every pending
  // tone timer so we don't keep playing notes after the component is gone.
  useEffect(() => {
    return () => {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current = [];
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  return { soundEnabled, enableSound };
}
