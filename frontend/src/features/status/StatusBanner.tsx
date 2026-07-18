'use client';

import React from 'react';
import { 
  AlertTriangle, CheckCircle, Clock, TrendingUp, 
  Shield 
} from 'lucide-react';
import { Skeleton } from '@/shared/components';
import type { PredictionSummary, RecommendationItem } from '@/shared/types';

interface StatusBannerProps {
  prediction: PredictionSummary | null;
  recommendations: RecommendationItem[];
  isLoading: boolean;
}

export function StatusBanner({ prediction, recommendations, isLoading }: StatusBannerProps) {
  if (isLoading || !prediction) {
    return (
      <div className="mb-6 glass rounded-xl p-4 animate-pulse">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const boarding = prediction.current_boarding;
  const predicted4h = prediction.predicted_boarding_4h;
  const risk = prediction.peak_risk_level;
  
  const getStatus = () => {
    if (risk === 'critical') return {
      color: 'from-red-600 to-red-500',
      borderColor: 'border-red-500/30',
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      title: 'HOSPITAL UNDER HEAVY PRESSURE',
      sentence: `${boarding} patients waiting for beds. Could reach ${Math.round(predicted4h)} within 4 hours.`,
      action: 'Take action now to prevent crisis',
    };
    if (risk === 'high') return {
      color: 'from-orange-600 to-orange-500',
      borderColor: 'border-orange-500/30',
      icon: <Clock className="w-6 h-6 text-white" />,
      title: 'BUSY — ACT SOON',
      sentence: `${boarding} patients waiting for beds. Situation may get worse if nothing changes.`,
      action: `${recommendations.length} things you can do right now`,
    };
    if (risk === 'medium') return {
      color: 'from-yellow-600 to-yellow-500',
      borderColor: 'border-yellow-500/30',
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      title: 'WATCHING CLOSELY',
      sentence: `${boarding} patients waiting. Things may pick up — stay alert.`,
      action: 'Keep monitoring, be ready to act',
    };
    return {
      color: 'from-emerald-600 to-emerald-500',
      borderColor: 'border-emerald-500/30',
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      title: 'ALL CLEAR',
      sentence: `${boarding} patients waiting. Hospital is running smoothly.`,
      action: 'No action needed',
    };
  };

  const status = getStatus();

  return (
    <div className="mb-6">
      {/* Main Status */}
      <div className={`bg-gradient-to-r ${status.color} rounded-xl p-5 ${status.borderColor} border`} role="alert" aria-live="polite">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl relative shrink-0">
              {status.icon}
              {(risk === 'high' || risk === 'critical') && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-xl font-black text-white tracking-wide truncate">{status.title}</h2>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5 line-clamp-2">{status.sentence}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block shrink-0">
            <div className="text-3xl font-black text-white">{boarding}</div>
            <div className="text-xs text-white/70">patients now</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      {risk !== 'low' && recommendations.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-400 overflow-hidden">
          <Shield className="w-4 h-4 text-gray-500" />
          <span>AI recommends:</span>
          {recommendations.slice(0, 2).map((rec, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-xs text-gray-300">
              {rec.action_name}
              {i === 0 && recommendations.length > 1 && <span className="text-gray-600">•</span>}
            </span>
          ))}
          {recommendations.length > 2 && (
            <span className="text-xs text-gray-500">+{recommendations.length - 2} more</span>
          )}
        </div>
      )}
    </div>
  );
}
