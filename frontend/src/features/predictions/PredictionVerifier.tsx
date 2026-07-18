'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FlaskConical, Play, RotateCcw, ChevronDown, X } from 'lucide-react';
import { api } from '@/shared/lib';
import type { PredictionSummary } from '@/shared/types';

import { createPortal } from 'react-dom';

const PRESETS = [
  { name: 'Quiet Day', emoji: '☀️', boarding: 5, ed_beds: 22, arrival: 8, discharge: 5, weather: 'sunny', nurse_ratio: 4.5 },
  { name: 'Busy Day', emoji: '📅', boarding: 10, ed_beds: 26, arrival: 14, discharge: 3, weather: 'cloudy', nurse_ratio: 6.0 },
  { name: 'Heavy Pressure', emoji: '🚨', boarding: 18, ed_beds: 29, arrival: 18, discharge: 2, weather: 'stormy', nurse_ratio: 7.5 },
  { name: 'Flu Season', emoji: '🤒', boarding: 14, ed_beds: 28, arrival: 20, discharge: 3, weather: 'rainy', nurse_ratio: 6.5 },
];

export function PredictionVerifier({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionSummary | null>(null);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inputs, setInputs] = useState({
    boarding_count: 8,
    ed_beds_occupied: 26,
    inpatient_census: 145,
    discharge_ready_count: 6,
    pacu_occupancy: 0.85,
    nurse_patient_ratio: 6.0,
    weather_condition: 'rainy',
    temperature: 45,
    arrival_rate: 12.0,
    discharge_rate: 3.0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setIsOpen(false);
  };

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomPrediction(inputs);
      setResult(data);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setInputs(prev => ({
      ...prev,
      boarding_count: preset.boarding,
      ed_beds_occupied: preset.ed_beds,
      arrival_rate: preset.arrival,
      discharge_rate: preset.discharge,
      weather_condition: preset.weather,
      nurse_patient_ratio: preset.nurse_ratio,
    }));
    setResult(null);
  };

  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border border-red-500/40';
      case 'high': return 'text-orange-400 bg-orange-500/20 border border-orange-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/40';
      default: return 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
      >
        <FlaskConical className="w-4 h-4 text-purple-400" />
        <span className={`text-sm text-gray-200 ${compact ? 'hidden' : ''}`}>Test Prediction</span>
      </button>

      {isOpen && mounted && createPortal(
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-6 transition-all duration-300"
        >
          <div 
            className="bg-[#111318]/95 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-[880px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 shrink-0 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <FlaskConical className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Test the AI Model</h2>
                  <p className="text-[11px] text-gray-400">Change values, see prediction change</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="px-5 py-2.5 border-b border-gray-700/50 shrink-0">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white transition-all"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto min-h-0">
              {/* Left - Inputs */}
              <div className="p-4 sm:p-5 md:border-r border-gray-700/50">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Change These Values</h3>
                
                <div className="space-y-2">
                  {[
                    { key: 'boarding_count', label: 'Patients waiting for bed', hint: 'Patients stuck in ER', min: 0, max: 50, step: 1 },
                    { key: 'ed_beds_occupied', label: 'ER beds in use', hint: 'Out of 30 beds', min: 0, max: 30, step: 1 },
                    { key: 'inpatient_census', label: 'Hospital beds filled', hint: 'Total patients in hospital', min: 0, max: 200, step: 1 },
                    { key: 'discharge_ready_count', label: 'Ready to go home', hint: 'Waiting for discharge', min: 0, max: 30, step: 1 },
                    { key: 'arrival_rate', label: 'New patients / hour', hint: 'How fast they arrive', min: 0, max: 50, step: 1 },
                    { key: 'discharge_rate', label: 'Discharges / hour', hint: 'How fast they leave', min: 0, max: 30, step: 1 },
                    { key: 'nurse_patient_ratio', label: 'Nurse : Patient', hint: '1 nurse per X patients', min: 1, max: 15, step: 0.5 },
                  ].map(({ key, label, hint, min, max, step }) => (
                    <div key={key} className="bg-gray-800/60 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-xs text-gray-300">{label}</label>
                        <input
                          type="number"
                          value={inputs[key as keyof typeof inputs]}
                          onChange={(e) => setInputs(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                          min={min}
                          max={max}
                          step={step}
                          className="w-24 sm:w-20 bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
                        />
                      </div>
                      <p className="text-[9px] text-gray-500">{hint}</p>
                    </div>
                  ))}

                  {/* Weather */}
                  <div className="bg-gray-800/60 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-xs text-gray-300">Weather</label>
                      <div className="relative">
                        <select
                          value={inputs.weather_condition}
                          onChange={(e) => setInputs(prev => ({ ...prev, weather_condition: e.target.value }))}
                          className="appearance-none w-24 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 pr-6 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="sunny">☀️ Sunny</option>
                          <option value="cloudy">☁️ Cloudy</option>
                          <option value="rainy">🌧️ Rainy</option>
                          <option value="stormy">⛈️ Stormy</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500">Bad weather = more patients</p>
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={isLoading}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                >
                  {isLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isLoading ? 'Thinking...' : 'See What AI Predicts'}
                </button>
              </div>

              {/* Right - Output */}
              <div className="p-4 sm:p-5 bg-gray-800/20">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Prediction Result</h3>
                
                {result ? (
                  <div className="space-y-3">
                    {/* Risk Badge */}
                    <div className={`p-3 rounded-xl text-center ${getRiskStyle(result.peak_risk_level)}`}>
                      <div className="text-xl font-black uppercase">{result.peak_risk_level}</div>
                      <div className="text-xs mt-0.5 opacity-80">Risk Level</div>
                      <div className="text-[10px] mt-0.5 opacity-60">Peak at {result.peak_risk_time}</div>
                    </div>

                    {/* Forecast Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { label: 'Now', value: result.current_boarding },
                        { label: '4 Hours', value: result.predicted_boarding_4h },
                        { label: '6 Hours', value: result.predicted_boarding_6h },
                        { label: '8 Hours', value: result.predicted_boarding_8h },
                        { label: '12 Hours', value: result.predicted_boarding_12h },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700">
                          <div className={`text-lg font-bold ${value >= 15 ? 'text-red-400' : value >= 10 ? 'text-orange-400' : value >= 7 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {Math.round(value)}
                          </div>
                          <div className="text-[9px] text-gray-500">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-700">
                        <span className="text-xs text-gray-400">AI Confidence</span>
                        <span className="text-xs font-bold text-white">{Math.round(result.confidence_score * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-700">
                        <span className="text-xs text-gray-400">Time Until Crisis</span>
                        <span className={`text-xs font-bold ${result.time_to_critical != null && result.time_to_critical < 240 ? 'text-red-400' : 'text-white'}`}>
                          {result.time_to_critical != null ? (result.time_to_critical === 0 ? 'CRITICAL NOW' : `${Math.floor(result.time_to_critical / 60)}h ${result.time_to_critical % 60}m`) : 'Not soon'}
                        </span>
                      </div>
                    </div>

                    {/* Proof */}
                    <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        <span className="text-gray-400 font-medium">How:</span> You set boarding={inputs.boarding_count}, 
                        arrival={inputs.arrival_rate}/hr, weather={inputs.weather_condition}. 
                        AI model (trained on 4,320 records) computed this.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-3 border border-gray-700">
                      <FlaskConical className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">No prediction yet</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">Change values and click the button</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
