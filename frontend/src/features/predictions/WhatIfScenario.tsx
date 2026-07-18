'use client';

import React, { useState, useCallback } from 'react';
import { FlaskConical, Users, BedDouble, Zap, Scissors, Play, ArrowRight, TrendingDown, Loader2 } from 'lucide-react';
import { api } from '@/shared/lib';
import type { SimulationResult, CurrentStatus, PredictionSummary, WeatherData } from '@/shared/types';

interface WhatIfScenarioProps {
  status: CurrentStatus | null;
  prediction: PredictionSummary | null;
  weather?: WeatherData | null;
}

export function WhatIfScenario({ status, prediction, weather }: WhatIfScenarioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [extraNurses, setExtraNurses] = useState(0);
  const [extraBeds, setExtraBeds] = useState(0);
  const [expediteDischarges, setExpediteDischarges] = useState(false);
  const [cancelElective, setCancelElective] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const boarding = status?.boarding_count ?? 8;
      const simResult = await api.simulateScenario({
        boarding_count: boarding,
        ed_beds_occupied: status?.ed_beds_occupied ?? 28,
        inpatient_census: status?.inpatient_census ?? 145,
        discharge_ready_count: status?.discharge_ready_count ?? 6,
        pacu_occupancy: status?.pacu_occupancy ?? 0.85,
        nurse_patient_ratio: status?.nurse_patient_ratio ?? 6.0,
        weather_condition: weather?.condition ?? 'sunny',
        temperature: weather?.temperature ?? 70,
        arrival_rate: 8.0 + (boarding * 0.5),
        discharge_rate: Math.max(2.0, 6.0 - (boarding * 0.3)),
        extra_nurses: extraNurses,
        extra_beds: extraBeds,
        expedite_discharges: expediteDischarges,
        cancel_elective_surgery: cancelElective,
      });
      setResult(simResult);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [status, extraNurses, extraBeds, expediteDischarges, cancelElective, weather]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full glass rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-gray-200">What-If Scenario Simulator</h3>
            <p className="text-xs text-gray-500">Test interventions before applying them</p>
          </div>
          <div className="ml-auto text-xs text-gray-500 group-hover:text-cyan-400 transition-colors">
            Click to open
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/20 rounded-lg">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="font-medium text-sm text-gray-200">What-If Scenario Simulator</h3>
        </div>
        <button
          onClick={() => { setIsOpen(false); setResult(null); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SliderControl
          icon={<Users className="w-3.5 h-3.5" />}
          label="Extra Nurses"
          value={extraNurses}
          onChange={setExtraNurses}
          min={0}
          max={10}
          color="blue"
        />
        <SliderControl
          icon={<BedDouble className="w-3.5 h-3.5" />}
          label="Extra Beds"
          value={extraBeds}
          onChange={setExtraBeds}
          min={0}
          max={15}
          color="green"
        />
        <ToggleControl
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Expedite Discharges"
          checked={expediteDischarges}
          onChange={setExpediteDischarges}
          color="amber"
        />
        <ToggleControl
          icon={<Scissors className="w-3.5 h-3.5" />}
          label="Cancel Elective Surgery"
          checked={cancelElective}
          onChange={setCancelElective}
          color="purple"
        />
      </div>

      <button
        onClick={runSimulation}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm font-medium transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {loading ? 'Simulating...' : 'Run Simulation'}
      </button>

      {result && (
        <div className="space-y-3 pt-2 border-t border-white/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ComparisonCard
              title="Boarding Count"
              before={result.baseline.predicted_6h}
              after={result.simulated.predicted_6h}
              unit="patients"
              lowerBetter
            />
            <ComparisonCard
              title="Revenue Impact"
              before={0}
              after={result.impact.revenue_protected}
              unit="$"
              isRevenue
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Before</div>
              <div className={`text-sm font-bold mt-0.5 ${getRiskColor(result.baseline.risk_level)}`}>
                {result.baseline.risk_level.toUpperCase()}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">After</div>
              <div className={`text-sm font-bold mt-0.5 ${getRiskColor(result.simulated.risk_level)}`}>
                {result.simulated.risk_level.toUpperCase()}
              </div>
            </div>
          </div>

          {result.impact.risk_change !== 'No change' && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <TrendingDown className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-300">
                Risk improved: {result.impact.risk_change}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SliderControl({ icon, label, value, onChange, min, max, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'accent-blue-500',
    green: 'accent-green-500',
  };
  return (
    <div className="bg-white/5 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {icon}
          {label}
        </div>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 ${colorMap[color] ?? 'accent-cyan-500'}`}
      />
    </div>
  );
}

function ToggleControl({ icon, label, checked, onChange, color }: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        {icon}
        {label}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? (bgMap[color] ?? 'bg-cyan-500') : 'bg-white/20'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function ComparisonCard({ title, before, after, unit, lowerBetter, isRevenue }: {
  title: string;
  before: number;
  after: number;
  unit: string;
  lowerBetter?: boolean;
  isRevenue?: boolean;
}) {
  const diff = isRevenue ? after : before - after;
  const improved = isRevenue ? after > 0 : (lowerBetter ? diff > 0 : diff < 0);

  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="flex items-end gap-2">
        <div className="text-lg font-bold text-white">
          {isRevenue ? `$${after.toLocaleString()}` : after.toFixed(0)}
        </div>
        {!isRevenue && (
          <div className="text-xs text-gray-500 mb-0.5">from {before.toFixed(0)}</div>
        )}
      </div>
      {diff !== 0 && (
        <div className={`text-[10px] mt-1 ${improved ? 'text-green-400' : 'text-red-400'}`}>
          {isRevenue
            ? `$${Math.abs(diff).toLocaleString()} protected`
            : `${Math.abs(diff).toFixed(0)} ${unit} ${improved ? 'reduced' : 'increased'}`
          }
        </div>
      )}
    </div>
  );
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    default: return 'text-green-400';
  }
}
