'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BedDouble, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/shared/lib';
import type { BedAvailability } from '@/shared/types';
import { Skeleton } from '@/shared/components';

interface BedAvailabilityTimelineProps {
  isLoading: boolean;
}

export function BedAvailabilityTimeline({ isLoading: parentLoading }: BedAvailabilityTimelineProps) {
  const [data, setData] = useState<BedAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const result = await api.getBedAvailability();
        if (mounted) setData(result);
      } catch {
        if (mounted) setLoading(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (parentLoading || loading) {
    return (
      <div className="glass rounded-xl p-4">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <BedDouble className="w-4 h-4" />
          <span>Bed data unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 relative overflow-hidden group">
      {/* Background ambient glow based on availability */}
      <div 
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${
          data.current_available <= 3 ? 'bg-red-500' : 'bg-blue-500'
        }`}
      />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl border border-blue-500/20 group-hover:border-blue-500/40 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <BedDouble className="w-5 h-5 text-blue-400" />
            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-wide">Bed Availability</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">12-hour forecast & capacity</p>
          </div>
        </div>
        {data.next_free_hour > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in fade-in zoom-in duration-500">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-medium text-amber-300">Next free in {data.next_free_hour}h</span>
          </div>
        )}
      </div>

      {/* Current summary */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-3 text-center shadow-lg relative overflow-hidden group/card">
          <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
            {data.current_available}
          </div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">Available</div>
        </div>
        <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-3 text-center shadow-lg">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-rose-400">
            {data.current_occupied}
          </div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">Occupied</div>
        </div>
        <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-3 text-center shadow-lg">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">
            {data.total_beds}
          </div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">Total</div>
        </div>
      </div>

      {/* Timeline bars */}
      <div className="space-y-2.5 relative z-10">
        {data.timeline.map((hour, idx) => {
          const pct = (hour.beds_occupied / hour.beds_total) * 100;
          const isCritical = hour.status === 'full';
          const isTight = hour.status === 'tight';
          
          const gradColor = isCritical 
            ? 'from-red-500 to-rose-400' 
            : isTight 
              ? 'from-amber-500 to-orange-400' 
              : 'from-emerald-500 to-teal-400';
          
          const glowColor = isCritical 
            ? 'shadow-red-500/40' 
            : isTight 
              ? 'shadow-amber-500/40' 
              : 'shadow-emerald-500/40';

          return (
            <div 
              key={hour.hour} 
              className="flex items-center gap-3 group/row"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-[11px] text-gray-400 w-12 text-right font-medium group-hover/row:text-white transition-colors">{hour.label}</span>
              <div className="flex-1 h-2 bg-gray-800/80 rounded-full overflow-hidden relative shadow-inner">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${gradColor} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out`}
                  style={{ width: `${pct}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px] rounded-full mix-blend-overlay" />
                </div>
              </div>
              <span className={`text-[11px] font-semibold w-12 text-right transition-colors ${
                isCritical ? 'text-red-400' : isTight ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {hour.beds_available} free
              </span>
            </div>
          );
        })}
      </div>

      {/* Rooms freed */}
      {data.rooms_freed.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Incoming Discharges</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.rooms_freed.slice(0, 4).map((room, i) => (
              <div 
                key={i} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-lg transition-all duration-300 text-[10px]"
              >
                <span className="text-gray-300 font-medium">Rm {room.room}</span>
                <div className="w-px h-3 bg-gray-600" />
                <span className={room.free_in_hours <= 1 ? 'text-emerald-400 font-semibold animate-pulse' : 'text-amber-400'}>
                  {room.free_in_hours <= 1 ? 'Now' : `${room.free_in_hours}h`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning if beds are tight */}
      {data.current_available <= 3 && (
        <div className="mt-4 flex items-start gap-3 p-3 bg-gradient-to-r from-red-500/10 to-transparent border-l-2 border-red-500 rounded-r-xl relative z-10">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div>
            <div className="text-[11px] font-bold text-red-300 mb-0.5">Critical Capacity</div>
            <div className="text-[10px] text-red-200/80 leading-snug">
              Only {data.current_available} bed{data.current_available !== 1 ? 's' : ''} available. Priority discharges required.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
