'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/shared/lib';
import type { MLMetrics, MLMetricsPanelProps } from '@/shared/types';

export function MLMetricsPanel({ className = '' }: MLMetricsPanelProps) {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.getMLMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch ML metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className={`glass rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary-400 animate-pulse" />
          <span className="font-medium text-sm">Loading ML Models...</span>
        </div>
      </div>
    );
  }

  if (!metrics?.trained) {
    return (
      <div className={`glass rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-sm">ML Models Not Trained</span>
        </div>
      </div>
    );
  }

  const bestModel = metrics.models?.find(m => m.name === metrics.best_model);

  return (
    <div className={`glass rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <span className="font-medium text-sm">AI Prediction Engine</span>
            <div className="text-xs text-gray-400">
              {metrics.models?.length ?? 0} models trained on {metrics.total_samples?.toLocaleString()} samples
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Quick Stats - always visible */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-400">
            {bestModel ? Math.max(0, bestModel.r2_score * 100).toFixed(0) : '--'}%
          </div>
          <div className="text-[10px] text-gray-400" title="How well the model predicts (higher = better)">Model Fit</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-primary-400">
            {bestModel ? bestModel.mae.toFixed(1) : '--'}
          </div>
          <div className="text-[10px] text-gray-400" title="Average prediction error (patients)">Avg Error</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-400">
            {bestModel ? bestModel.rmse.toFixed(1) : '--'}
          </div>
          <div className="text-[10px] text-gray-400" title="How spread out the errors are">Error Spread</div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
          {/* Model Comparison */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> 3 AI Models Compared
            </h4>
            <div className="space-y-2">
              {metrics.models?.map((model) => (
                <div
                  key={model.name}
                  className={`p-2 rounded-lg text-xs ${
                    model.name === metrics.best_model
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium capitalize">
                      {model.name.replace('_', ' ')}
                      {model.name === metrics.best_model && (
                        <span className="ml-1 text-green-400 text-[10px]">⭐ BEST</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-3 text-gray-400">
                    <span title="Prediction fit">{Math.max(0, model.r2_score * 100).toFixed(0)}% fit</span>
                    <span title="Average error">±{model.mae.toFixed(1)} off</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Features */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-2">
              What Matters Most for Predictions
            </h4>
            <div className="space-y-1">
              {Object.entries(metrics.top_features || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([feature, importance]) => {
                  const maxVal = Math.max(
                    ...Object.values(metrics.top_features || {}).map(Number)
                  );
                  const prettyName = feature
                    .replace(/_/g, ' ')
                    .replace('current ', '')
                    .replace('weather encoded', 'weather')
                    .replace('bed utilization', 'bed usage');
                  return (
                    <div key={feature} className="flex items-center gap-2 text-xs">
                      <span className="w-28 sm:w-36 text-gray-400 truncate capitalize shrink-0">{prettyName}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${(importance / maxVal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Training Info */}
          <div className="text-[10px] text-gray-500 border-t border-white/5 pt-2">
            Trained: {new Date(metrics.trained_at!).toLocaleString()} | 
            Data: {metrics.total_samples?.toLocaleString()} hospital records | 
            Best Model: {metrics.best_model?.replace('_', ' ')}
          </div>
        </div>
      )}
    </div>
  );
}
