'use client';

import React, { useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart 
} from 'recharts';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Skeleton, SkeletonBar } from '@/shared/components';
import type { PredictionPanelProps } from '@/shared/types';
import { CHART_CONFIG, getRiskLevel } from '@/shared/constants';

const riskColors: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const riskBgColors: Record<string, string> = {
  low: 'bg-green-500/20 border-green-500/30',
  medium: 'bg-yellow-500/20 border-yellow-500/30',
  high: 'bg-orange-500/20 border-orange-500/30',
  critical: 'bg-red-500/20 border-red-500/30',
};

export function PredictionPanel({ prediction, timeline, isLoading }: PredictionPanelProps) {
  const chartData = useMemo(() => timeline.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric' }),
    boarding: item.predicted_boarding,
    confidence: Math.round(item.confidence_score * 100),
    risk: item.risk_level,
  })), [timeline]);
  if (isLoading || !prediction) {
    return (
      <div className="glass rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3">
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
        <SkeletonBar className="h-56" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background gradient based on peak risk */}
      <div className={`absolute inset-0 opacity-10 pointer-events-none ${
        prediction.peak_risk_level === 'critical' ? 'bg-gradient-to-br from-red-500 to-orange-500' :
        prediction.peak_risk_level === 'high' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
        prediction.peak_risk_level === 'medium' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
        'bg-gradient-to-br from-emerald-500 to-cyan-500'
      }`} />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          Boarding Prediction
          {(prediction.peak_risk_level === 'high' || prediction.peak_risk_level === 'critical') && (
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              prediction.peak_risk_level === 'critical' ? 'bg-red-500' : 'bg-orange-500'
            }`} />
          )}
        </h2>
        <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${riskBgColors[prediction.peak_risk_level] ?? riskBgColors.low}`}>
          <span className={riskColors[prediction.peak_risk_level] ?? riskColors.low}>
            {prediction.peak_risk_level.toUpperCase()} RISK
          </span>
        </div>
      </div>

      {/* Prediction Summary Cards */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <div className={`rounded-lg p-2.5 sm:p-3 border ${riskBgColors[getRiskLevel(prediction.predicted_boarding_4h)]}`}>
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">4-Hour</div>
          <div className={`text-lg sm:text-xl font-bold ${riskColors[getRiskLevel(prediction.predicted_boarding_4h)]}`}>
            {Math.round(prediction.predicted_boarding_4h)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">patients</div>
        </div>
        <div className={`rounded-lg p-2.5 sm:p-3 border ${riskBgColors[getRiskLevel(prediction.predicted_boarding_6h)]}`}>
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">6-Hour</div>
          <div className={`text-lg sm:text-xl font-bold ${riskColors[getRiskLevel(prediction.predicted_boarding_6h)]}`}>
            {Math.round(prediction.predicted_boarding_6h)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">patients</div>
        </div>
        <div className={`rounded-lg p-2.5 sm:p-3 border ${riskBgColors[getRiskLevel(prediction.predicted_boarding_8h)]}`}>
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">8-Hour</div>
          <div className={`text-lg sm:text-xl font-bold ${riskColors[getRiskLevel(prediction.predicted_boarding_8h)]}`}>
            {Math.round(prediction.predicted_boarding_8h)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">patients</div>
        </div>
        <div className={`rounded-lg p-2.5 sm:p-3 border ${riskBgColors[getRiskLevel(prediction.predicted_boarding_12h)]}`}>
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">12-Hour</div>
          <div className={`text-lg sm:text-xl font-bold ${riskColors[getRiskLevel(prediction.predicted_boarding_12h)]}`}>
            {Math.round(prediction.predicted_boarding_12h)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">patients</div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="relative h-56 sm:h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="boardingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.gridStroke} />
            <XAxis 
              dataKey="time" 
              stroke={CHART_CONFIG.axisStroke}
              tick={CHART_CONFIG.tickStyle}
            />
            <YAxis 
              stroke={CHART_CONFIG.axisStroke}
              tick={CHART_CONFIG.tickStyle}
              domain={CHART_CONFIG.yDomain}
            />
            <Tooltip
              contentStyle={CHART_CONFIG.tooltipStyle}
              labelStyle={CHART_CONFIG.labelStyle}
            />
            <Area
              type="monotone"
              dataKey="boarding"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#boardingGradient)"
            />
            <ReferenceLine 
              y={15} 
              stroke="#ef4444" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ 
                value: 'CRISIS THRESHOLD (15+)', 
                fill: '#ef4444', 
                fontSize: 11,
                fontWeight: 'bold',
                position: 'insideTopLeft'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time to Critical */}
      {prediction.time_to_critical !== null && prediction.time_to_critical > 0 && (
        <div className="relative flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <Clock className="w-5 h-5 text-orange-400" />
          <div>
            <div className="text-sm font-medium text-orange-400">
              Time to Critical: {Math.floor(prediction.time_to_critical / 60)}h {prediction.time_to_critical % 60}m
            </div>
            <div className="text-xs text-gray-400">
              Boarding expected to reach crisis level (15+ patients)
            </div>
          </div>
        </div>
      )}

      {/* Confidence Score */}
      <div className="relative mt-4 flex items-center gap-2 text-sm text-gray-400">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span>AI is {Math.round(prediction.confidence_score * 100)}% confident in this prediction</span>
      </div>
    </div>
  );
}
