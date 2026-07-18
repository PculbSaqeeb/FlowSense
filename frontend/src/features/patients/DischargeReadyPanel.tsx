'use client';

import React, { useMemo } from 'react';
import { Clock, UserCheck, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/shared/components';
import type { DischargeReadyPanelProps } from '@/shared/types';

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  overdue: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'OVERDUE' },
  approaching: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'APPROACHING' },
  on_track: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'On Track' },
};

export const DischargeReadyPanel = React.memo(function DischargeReadyPanel({ patients, isLoading }: DischargeReadyPanelProps) {
  const sorted = useMemo(() => [...patients].sort((a, b) => {
    const order = { overdue: 0, approaching: 1, on_track: 2 };
    return (order[a.countdown_status] ?? 2) - (order[b.countdown_status] ?? 2);
  }), [patients]);
  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-green-400" />
          Discharge Ready
        </h3>
        <span className="text-sm text-gray-400">{patients.length} patients</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sorted.map((patient) => {
          const config = statusConfig[patient.countdown_status] || statusConfig.on_track;
          const remaining = Math.max(0, (patient.estimated_discharge_hours || 4) - patient.hours_waiting);
          const progress = Math.min(100, (patient.hours_waiting / (patient.estimated_discharge_hours || 4)) * 100);

          return (
            <div
              key={patient.patient_id}
              className={`rounded-lg p-3 border ${config.border} ${config.bg}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{patient.patient_id}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {patient.room_number}
                  </span>
                </div>
                <span className={`text-[10px] font-medium ${config.color} flex items-center gap-1`}>
                  {patient.countdown_status === 'overdue' ? <AlertTriangle className="w-3 h-3" /> :
                   patient.countdown_status === 'on_track' ? <CheckCircle className="w-3 h-3" /> : null}
                  {config.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                <span>{patient.doctor_name}</span>
                <span className="uppercase">{patient.procedure_type}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: config.color.includes('red') ? '#ef4444' :
                      config.color.includes('orange') ? '#f97316' : '#22c55e',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{patient.hours_waiting.toFixed(1)}h elapsed</span>
                </div>
                <span className={config.color}>
                  {remaining > 0 ? `${remaining.toFixed(1)}h remaining` : 'Should be free now'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {patients.length > 0 && (
        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <ArrowRight className="w-4 h-4" />
            <span>
              Expediting {patients.length} discharges could free {patients.length} beds
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
