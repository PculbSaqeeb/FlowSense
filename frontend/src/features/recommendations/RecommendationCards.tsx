'use client';

import React from 'react';
import { 
  Zap, Phone, Users, Calendar, ArrowRight,
  CheckCircle, Clock, DollarSign
} from 'lucide-react';
import { Skeleton } from '@/shared/components';
import type { RecommendationCardsProps } from '@/shared/types';
import { ACTION_CONFIG } from '@/shared/constants';

const actionIcons: Record<string, React.ReactNode> = {
  A001: <Phone className="w-5 h-5" />,
  A002: <Zap className="w-5 h-5" />,
  A003: <Users className="w-5 h-5" />,
  A004: <Calendar className="w-5 h-5" />,
  A005: <Zap className="w-5 h-5" />,
  A006: <ArrowRight className="w-5 h-5" />,
};

const getActionStyle = (actionId: string) => {
  const config = ACTION_CONFIG[actionId];
  return config ? `${config.color} ${config.bgColor}` : 'text-gray-400 bg-gray-500/10';
};

export const RecommendationCards = React.memo(function RecommendationCards({
  recommendations,
  totalRevenueAtRisk,
  totalRevenueProtected,
  onExecute,
  onDismiss,
  isLoading,
}: RecommendationCardsProps) {

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-1/3" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-400" />
          Recommended Actions
          {recommendations.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
          )}
        </h2>
        <div className="text-sm text-gray-400">
          {recommendations.length} actions
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="text-xs text-red-400 mb-1">Money at Risk</div>
          <div className="text-xl font-bold text-red-400">
            ${(totalRevenueAtRisk / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-xs text-green-400 mb-1">Can Be Saved</div>
          <div className="text-xl font-bold text-green-400">
            ${(totalRevenueProtected / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      {/* Recommendation List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:bg-white/10 transition-all group"
          >
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {/* Top Row: Icon, Title, and Priority Badge */}
              <div className="flex items-start gap-3">
                {/* Action Icon */}
                <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${getActionStyle(rec.action_id)}`}>
                  {actionIcons[rec.action_id] || <Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 sm:mb-1">
                    <span className="font-semibold text-white/80 shrink-0 text-xs sm:text-sm">#{rec.priority_rank}</span>
                    <h3 className="font-semibold text-white truncate text-sm sm:text-base">{rec.action_name}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 hidden sm:block">
                    {rec.action_description}
                  </p>
                </div>

                {/* Priority Badge */}
                <div className="text-right shrink-0 pt-0.5">
                  <div className={`text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg whitespace-nowrap ${
                    rec.impact_score > 0.8 ? 'text-green-400 bg-green-500/10' :
                    rec.impact_score > 0.6 ? 'text-yellow-400 bg-yellow-500/10' : 'text-orange-400 bg-orange-500/10'
                  }`}>
                    {rec.impact_score > 0.8 ? 'Do First' : rec.impact_score > 0.6 ? 'Do Soon' : 'Can Wait'}
                  </div>
                </div>
              </div>

              {/* Bottom Row / Details */}
              <div className="sm:pl-[52px]">
                <p className="text-xs text-gray-400 mb-3 line-clamp-2 sm:hidden">
                  {rec.action_description}
                </p>

                {/* Target Info */}
                {rec.target_person && (
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="bg-black/20 border border-white/5 px-2 py-1 rounded-md text-gray-300">
                      <span className="text-gray-500 mr-1">To:</span> 
                      {rec.target_person}
                    </span>
                    {rec.target_department && (
                      <span className="bg-black/20 border border-white/5 px-2 py-1 rounded-md text-gray-400">
                        {rec.target_department}
                      </span>
                    )}
                  </div>
                )}

                {/* Impact Metrics */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {rec.expected_revenue_protected > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-md">
                      <DollarSign className="w-3 h-3 shrink-0" />
                      Save ${(rec.expected_revenue_protected / 1000).toFixed(0)}K
                    </span>
                  )}
                  {rec.expected_patients_helped > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">
                      <Users className="w-3 h-3 shrink-0" />
                      Help {rec.expected_patients_helped}
                    </span>
                  )}
                  {rec.expected_time_saved > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3 shrink-0" />
                      Save {rec.expected_time_saved}m
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md">
                    {Math.round(rec.confidence * 100)}% sure
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400/50" />
          <p>No urgent actions needed</p>
          <p className="text-sm">Hospital flow is normal</p>
        </div>
      )}
    </div>
  );
});
