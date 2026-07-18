'use client';

import React from 'react';
import type { Surgery } from '@/shared/types';

interface SurgeryStatusProps {
  surgeries: Surgery[];
  isLoading: boolean;
}

export function SurgeryStatus({ surgeries, isLoading }: SurgeryStatusProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-sm">Surgery Status</h3>
            <p className="text-[10px] text-gray-500">Today&apos;s surgical schedule</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center gap-1.5">
              <div className="h-7 w-10 bg-white/10 rounded" />
              <div className="h-2.5 w-14 bg-white/5 rounded" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary-400">{surgeries.length}</div>
              <div className="text-[10px] text-gray-400">Scheduled</div>
            </>
          )}
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center gap-1.5">
              <div className="h-7 w-10 bg-white/10 rounded" />
              <div className="h-2.5 w-14 bg-white/5 rounded" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-orange-400">{surgeries.filter(s => s.status === 'delayed').length}</div>
              <div className="text-[10px] text-gray-400">Delayed</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
