'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Heart, Clock, CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ImpactSummary } from '@/shared/types';

interface ImpactDashboardProps {
  impact: ImpactSummary | null;
  isLoading?: boolean;
}

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = displayed;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>;
}

export function ImpactDashboard({ impact, isLoading }: ImpactDashboardProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !impact) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-32 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const { today, all_time, daily_history } = impact;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-500/20 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-medium text-sm">Impact Today</h3>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Today's metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-400">
                <AnimatedCounter value={today.revenue_saved} prefix="$" />
              </div>
              <div className="text-[10px] text-gray-400">Revenue Saved</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <Heart className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-400">
                <AnimatedCounter value={today.patients_helped} />
              </div>
              <div className="text-[10px] text-gray-400">Patients Helped</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-400">
                <AnimatedCounter value={today.hours_saved} suffix="h" />
              </div>
              <div className="text-[10px] text-gray-400">Hours Saved</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <CheckCircle className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-orange-400">
                <AnimatedCounter value={today.recommendations_executed} />
              </div>
              <div className="text-[10px] text-gray-400">Actions Taken</div>
            </div>
          </div>

          {/* Trend chart */}
          {daily_history.length > 1 && (
            <div>
              <h4 className="text-xs text-gray-400 mb-2">7-Day Revenue Trend</h4>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily_history.slice(-7)}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={d => d.slice(5)} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                      labelFormatter={l => `Date: ${l}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#greenGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* All-time summary */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase mb-1">All-Time Impact</div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between gap-2 sm:gap-4 text-xs text-gray-300">
              <span>${all_time.revenue_saved.toLocaleString()} saved</span>
              <span>{all_time.patients_helped} patients helped</span>
              <span>{all_time.hours_saved}h reduced</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
