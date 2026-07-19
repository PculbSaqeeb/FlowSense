'use client';

import React from 'react';
import { Cloud, CloudRain, CloudLightning, Snowflake, Sun, TrendingUp } from 'lucide-react';
import type { WeatherData } from '@/shared/types';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  isLoading?: boolean;
}

const weatherIcons: Record<string, React.ReactNode> = {
  // Both short ('sun') and full ('sunny') forms work — backend and the
  // WhatIfScenario simulator use different keys, so accept both spellings.
  sun: <Sun className="w-6 h-6 text-yellow-400" />,
  sunny: <Sun className="w-6 h-6 text-yellow-400" />,
  cloud: <Cloud className="w-6 h-6 text-gray-400" />,
  cloudy: <Cloud className="w-6 h-6 text-gray-400" />,
  'cloud-rain': <CloudRain className="w-6 h-6 text-blue-400" />,
  rain: <CloudRain className="w-6 h-6 text-blue-400" />,
  rainy: <CloudRain className="w-6 h-6 text-blue-400" />,
  'cloud-lightning': <CloudLightning className="w-6 h-6 text-purple-400" />,
  stormy: <CloudLightning className="w-6 h-6 text-purple-400" />,
  storm: <CloudLightning className="w-6 h-6 text-purple-400" />,
  snowflake: <Snowflake className="w-6 h-6 text-cyan-400" />,
  snow: <Snowflake className="w-6 h-6 text-cyan-400" />,
};

export const WeatherWidget = React.memo(function WeatherWidget({ weather, isLoading }: WeatherWidgetProps) {
  if (isLoading || !weather) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-2" />
        <div className="h-8 bg-white/10 rounded w-16" />
      </div>
    );
  }

  const impactColor = weather.impact_score > 0.3
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : weather.impact_score > 0.15
    ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    : weather.impact_score > 0
    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    : 'text-green-400 bg-green-500/10 border-green-500/20';

  const impactLabel = weather.impact_score > 0.3
    ? `+${Math.round(weather.impact_score * 100)}% expected`
    : weather.impact_score > 0
    ? `+${Math.round(weather.impact_score * 100)}% expected`
    : 'No impact';

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-500/20 rounded-lg">
          {weatherIcons[weather.icon] || <Cloud className="w-4 h-4 text-gray-400" />}
        </div>
        <h3 className="font-medium text-sm">Weather Impact</h3>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <div className="text-3xl font-bold text-white">
          {weather.temperature}°
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full border ${impactColor} flex items-center gap-1 mb-1`}>
          <TrendingUp className="w-3 h-3" />
          {impactLabel}
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        {weather.historical_note}
      </p>
    </div>
  );
});
