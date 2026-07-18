'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/shared/lib';
import { useLiveDashboard } from './useLiveDashboard';
import type { UseDashboardData, CurrentStatus, PredictionSummary, PredictionTimeline, RecommendationItem } from '@/shared/types';

export function useDashboardData(): UseDashboardData {
  const sse = useLiveDashboard();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollData, setPollData] = useState<{
    status: CurrentStatus | null;
    prediction: PredictionSummary | null;
    timeline: PredictionTimeline[];
    recommendations: RecommendationItem[];
  } | null>(null);

  // Mark loaded when first SSE data arrives
  useEffect(() => {
    if (sse.lastUpdate && isLoading) {
      setIsLoading(false);
      setError(null);
    }
  }, [sse.lastUpdate, isLoading]);

  // Polling fallback if SSE doesn't connect within 5 seconds
  useEffect(() => {
    if (sse.isConnected) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!sse.isConnected) {
        const fetchData = async () => {
          try {
            const [statusData, predictionData, timelineData, recommendationsData] =
              await Promise.all([
                api.getDashboardStatus(),
                api.getCurrentPrediction(),
                api.getPredictionTimeline(12),
                api.getActiveRecommendations(),
              ]);
            setPollData({
              status: statusData,
              prediction: predictionData,
              timeline: timelineData,
              recommendations: recommendationsData,
            });
            setIsLoading(false);
            setError(null);
          } catch (err) {
            console.error('[Polling] Failed to fetch data:', err);
            setError('Failed to load data');
          }
        };
        fetchData();
        pollingRef.current = setInterval(fetchData, 60_000);
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sse.isConnected]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    sse.reconnect();
  }, [sse.reconnect]);

  // Prefer SSE data, fall back to polling data
  return {
    status: sse.status ?? pollData?.status ?? null,
    prediction: sse.prediction ?? pollData?.prediction ?? null,
    timeline: sse.timeline.length > 0 ? sse.timeline : (pollData?.timeline ?? []),
    recommendations: sse.recommendations.length > 0 ? sse.recommendations : (pollData?.recommendations ?? []),
    edPatients: sse.edPatients,
    dischargeReady: sse.dischargeReady,
    staff: sse.staff,
    surgeries: sse.surgeries,
    weather: sse.weather,
    insights: sse.insights,
    impact: sse.impact,
    isLoading,
    error,
    refresh,
    isConnected: sse.isConnected,
    lastUpdate: sse.lastUpdate,
  };
}
