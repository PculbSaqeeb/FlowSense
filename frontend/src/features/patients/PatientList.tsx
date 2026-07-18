'use client';

import React from 'react';
import { Clock, User } from 'lucide-react';
import { Skeleton } from '@/shared/components';
import type { PatientListProps } from '@/shared/types';
import { TRIAGE_CONFIG, PATIENT_STATUS_COLORS } from '@/shared/constants';

export function PatientList({ patients, isLoading }: PatientListProps) {
  const getTriageColor = (level: number) => TRIAGE_CONFIG[level]?.color ?? TRIAGE_CONFIG[5].color;
  const getStatusColor = (status: string) => PATIENT_STATUS_COLORS[status] ?? 'text-gray-400';

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-12" />
              </div>
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
          <User className="w-4 h-4 text-primary-400" />
          ED Patients
        </h3>
        <span className="text-sm text-gray-400">{patients.length} patients</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {patients.slice(0, 10).map((patient) => (
          <div
            key={patient.id}
            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getTriageColor(patient.triage_level)}`}>
                  {patient.triage_level}
                </span>
                <span className="text-sm font-medium text-white">
                  {patient.patient_id}
                </span>
              </div>
              <span className={`text-xs ${getStatusColor(patient.status)}`}>
                {patient.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="truncate min-w-0">{patient.chief_complaint}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{patient.wait_time_minutes}min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {patients.length > 10 && (
        <div className="mt-3 text-center text-xs text-gray-500">
          + {patients.length - 10} more patients
        </div>
      )}
    </div>
  );
}
