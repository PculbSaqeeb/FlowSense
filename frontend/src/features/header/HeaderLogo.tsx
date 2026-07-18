'use client';

import React from 'react';
import { Activity } from 'lucide-react';

export const HeaderLogo = React.memo(function HeaderLogo() {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="p-1.5 sm:p-2 bg-primary-500/20 rounded-lg">
        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
      </div>
      <div className="leading-none">
        <h1 className="text-base sm:text-xl font-bold gradient-text">FlowSense</h1>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Predicts hospital overcrowding 4-6 hours early</p>
      </div>
    </div>
  );
});
