'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, Clock, 
  Activity, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import type { PredictionTimeline } from '@/shared/types';
import { getRiskLevel } from '@/shared/constants';

interface CrisisTimelineProps {
  timeline: PredictionTimeline[];
  isActive: boolean;
}

interface TimelineEvent {
  hour: number;
  boarding: number;
  risk: string;
  event: string;
  isCritical: boolean;
  timeLabel: string;
}

export function CrisisTimeline({ timeline, isActive }: CrisisTimelineProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const events: TimelineEvent[] = useMemo(() => {
    if (timeline.length === 0) return [];
    const now = new Date();
    
    return timeline.map((item, i) => {
      const futureTime = new Date(now.getTime() + item.prediction_horizon * 60 * 60 * 1000);
      const hours = futureTime.getHours();
      const minutes = futureTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      
      const boarding = item.predicted_boarding;
      const risk = getRiskLevel(boarding);
      let event = '';
      let isCritical = false;

      if (risk === 'critical') { event = 'Redirect ambulances away'; isCritical = true; }
      else if (risk === 'high') { event = 'Act now — crisis close'; isCritical = true; }
      else if (risk === 'medium') { event = 'Getting busier fast'; }
      else { event = 'Running smoothly'; }

      return {
        hour: item.prediction_horizon,
        boarding,
        risk: item.risk_level,
        event,
        isCritical,
        timeLabel: `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`,
      };
    });
  }, [timeline]);

  const maxBoarding = useMemo(() => Math.max(...events.map(e => e.boarding), 1), [events]);
  const peakIndex = useMemo(() => {
    const idx = events.findIndex(e => e.boarding === maxBoarding);
    return idx >= 0 ? idx : 0;
  }, [events, maxBoarding]);
  const trend = useMemo(() => {
    if (events.length < 2) return 'stable';
    const last = events[events.length - 1]?.boarding ?? 0;
    const first = events[0]?.boarding ?? 0;
    if (last > first + 2) return 'up';
    if (last < first - 2) return 'down';
    return 'stable';
  }, [events]);

  useEffect(() => {
    if (!isActive || events.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev >= events.length - 1 ? 0 : prev + 1));
    }, 3500); // Slower interval for better reading
    return () => clearInterval(interval);
  }, [isActive, events.length]);

  const getRiskColors = (risk: string) => {
    switch (risk) {
      case 'critical': return { bar: 'from-red-600 to-red-400', glow: 'shadow-red-500/30', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
      case 'high': return { bar: 'from-orange-600 to-orange-400', glow: 'shadow-orange-500/30', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      case 'medium': return { bar: 'from-yellow-600 to-yellow-400', glow: 'shadow-yellow-500/30', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
      default: return { bar: 'from-emerald-600 to-emerald-400', glow: 'shadow-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    }
  };

  if (events.length === 0) return null;

  const displayIndex = hoveredIndex ?? activeIndex;
  const displayEvent = events[displayIndex] || events[0];
  const displayColors = getRiskColors(displayEvent.risk);

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 overflow-hidden relative">
      {/* Subtle background gradient based on peak risk */}
      <div className={`absolute inset-0 opacity-10 ${
        maxBoarding >= 15 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
        maxBoarding >= 10 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
        'bg-gradient-to-br from-emerald-500 to-cyan-500'
      }`} />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${displayColors.bg} border ${displayColors.border} transition-colors duration-300`}>
            <Activity className={`w-5 h-5 ${displayColors.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              Boarding Forecast
              {maxBoarding >= 10 && (
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  maxBoarding >= 15 ? 'bg-red-500' : maxBoarding >= 12 ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
              )}
            </h3>
            <p className="text-sm text-gray-400">Predictions for the next {events.length} hours</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full shadow-lg shadow-red-500/10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400 font-bold tracking-wider">LIVE</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${displayColors.border} ${displayColors.bg}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-red-400" /> :
             trend === 'down' ? <ArrowDownRight className="w-4 h-4 text-emerald-400" /> :
             <Minus className="w-4 h-4 text-gray-400" />}
            <span className={`text-xs font-semibold ${
              trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-gray-400'
            }`}>
              {trend === 'up' ? 'Rising Trend' : trend === 'down' ? 'Falling Trend' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Event Detail */}
      <div className={`relative mb-8 p-5 rounded-xl border-2 transition-all duration-300 shadow-lg ${displayColors.bg} ${displayColors.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`w-4 h-4 ${displayColors.text}`} />
              <span className="text-sm font-medium text-gray-300">
                In {displayEvent.hour} {displayEvent.hour === 1 ? 'hour' : 'hours'} ({displayEvent.timeLabel})
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold ${displayColors.text} transition-colors duration-300`}>
                {Math.round(displayEvent.boarding)}
              </span>
              <span className="text-base font-medium text-gray-400">patients waiting</span>
            </div>
          </div>
          <div className="sm:text-right bg-black/20 p-3 rounded-lg border border-white/5">
            <div className={`text-sm font-bold uppercase tracking-widest ${displayColors.text}`}>
              {displayEvent.risk} RISK
            </div>
            <div className="text-sm text-gray-300 mt-1 font-medium">{displayEvent.event}</div>
          </div>
        </div>
      </div>

      {/* Bar Chart Timeline */}
      <div className="relative mt-2 sm:mt-4">
        <div className="overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[600px] sm:min-w-0">
            {/* Y-axis bars */}
            <div className="flex items-end gap-1.5 sm:gap-2 h-16 sm:h-20">
              {events.map((event, i) => {
                const height = (event.boarding / maxBoarding) * 100;
                const colors = getRiskColors(event.risk);
                const isActiveBar = i === activeIndex;
                const isHovered = i === hoveredIndex;
                
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer group"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Value label and Peak Icon */}
                    <div className="relative flex flex-col items-center">
                      {i === peakIndex && (
                        <AlertTriangle className={`absolute -top-4 sm:-top-5 w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.text === 'text-red-400' ? 'text-red-400' : colors.text === 'text-orange-400' ? 'text-orange-400' : colors.text === 'text-yellow-400' ? 'text-yellow-400' : 'text-emerald-400'}`} />
                      )}
                      <span className={`text-xs sm:text-sm font-bold transition-all duration-300 ${
                        isActiveBar || isHovered ? `${colors.text} scale-110` : 'text-gray-400'
                      }`}>
                        {Math.round(event.boarding)}
                      </span>
                    </div>
                    
                    {/* Bar */}
                    <div className="w-full relative" style={{ height: '100%' }}>
                      <div className="absolute bottom-0 w-full rounded-t-md sm:rounded-t-lg transition-all duration-500 ease-out"
                        style={{ height: `${Math.max(height, 8)}%` }}>
                        <div className={`absolute inset-0 rounded-t-md sm:rounded-t-lg bg-gradient-to-t ${colors.bar} transition-all duration-300 ${
                          isActiveBar ? `shadow-xl ${colors.glow} border-t-2 border-white/30` : 'opacity-80'
                        } ${isHovered && !isActiveBar ? 'opacity-100 scale-y-105 origin-bottom' : ''}`}>
                          {/* Shine effect on active */}
                          {isActiveBar && (
                            <div className="absolute inset-0 rounded-t-md sm:rounded-t-lg bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis time labels */}
            <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {events.map((event, i) => {
                const isActiveBar = i === activeIndex;
                const isHovered = i === hoveredIndex;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center text-center">
                    <span className={`text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                      isActiveBar || isHovered ? 'text-white' : 'text-gray-400'
                    }`}>
                      {event.timeLabel}
                    </span>
                    <span className={`text-xs transition-all duration-300 ${
                      isActiveBar || isHovered ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      +{event.hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom summary bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-black/20 border border-white/10 rounded-xl">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            <span className="text-xs font-medium text-gray-300">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20" />
            <span className="text-xs font-medium text-gray-300">Elevated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20" />
            <span className="text-xs font-medium text-gray-300">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
            <span className="text-xs font-medium text-gray-300">Critical</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
          <span className="text-xs text-gray-400">Peak expected at:</span>
          <span className={`text-sm font-bold ${getRiskColors(events[peakIndex]?.risk || 'low').text}`}>
            {events[peakIndex]?.timeLabel || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
