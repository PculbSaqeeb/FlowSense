'use client';

import React from 'react';
import { TrendingUp, Users } from 'lucide-react';

interface HeaderImpactStatsProps {
  totalRevenueProtected: number;
  totalPatientsHelped: number;
}

export const HeaderImpactStats = React.memo(function HeaderImpactStats({ totalRevenueProtected, totalPatientsHelped }: HeaderImpactStatsProps) {
  return (
    <div className="hidden md:flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-1.5 glass rounded-lg shrink-0">
      <div className="flex items-center gap-1.5 text-left">
        <TrendingUp className="w-3.5 h-3.5 text-green-400 shrink-0" />
        <div className="leading-tight">
          <div className="text-xs lg:text-sm font-bold text-green-400">
            ${(totalRevenueProtected / 1000).toFixed(0)}K
          </div>
          <div className="text-[8px] lg:text-[9px] text-gray-500">Saved</div>
        </div>
      </div>
      <div className="w-px h-5 bg-white/10" />
      <div className="flex items-center gap-1.5 text-left">
        <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <div className="leading-tight">
          <div className="text-xs lg:text-sm font-bold text-blue-400">{totalPatientsHelped}</div>
          <div className="text-[8px] lg:text-[9px] text-gray-500">Helped</div>
        </div>
      </div>
    </div>
  );
});
