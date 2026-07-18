'use client';

import React from 'react';
import { HeaderLogo } from '@/features/header';
import { HeaderImpactStats } from '@/features/header';
import { HeaderActions } from '@/features/header';
import type { CurrentStatus, PredictionSummary, RecommendationItem, StaffMember, Surgery } from '@/shared/types';

interface HeaderProps {
  status: CurrentStatus | null;
  prediction: PredictionSummary | null;
  recommendations: RecommendationItem[];
  staff: StaffMember[];
  surgeries: Surgery[];
  isLoading: boolean;
  onRefresh: () => void;
  totalRevenueProtected: number;
  totalPatientsHelped: number;
  isConnected?: boolean;
  lastUpdate?: string | null;
}

export function Header({
  status,
  prediction,
  recommendations,
  staff,
  surgeries,
  isLoading,
  onRefresh,
  totalRevenueProtected,
  totalPatientsHelped,
  isConnected,
  lastUpdate,
}: HeaderProps) {
  return (
    <header className="glass border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <HeaderLogo />
          <div className="flex-1" />

          {/* Live status indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          <HeaderImpactStats
            totalRevenueProtected={totalRevenueProtected}
            totalPatientsHelped={totalPatientsHelped}
          />
          <HeaderActions
            status={status}
            prediction={prediction}
            recommendations={recommendations}
            staff={staff}
            surgeries={surgeries}
            isLoading={isLoading}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </header>
  );
}
