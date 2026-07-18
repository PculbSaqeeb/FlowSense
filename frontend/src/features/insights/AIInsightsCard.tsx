'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, AlertTriangle, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIInsight } from '@/shared/types';

interface AIInsightsCardProps {
  insights: AIInsight[];
  isLoading?: boolean;
}

const priorityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  high: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  medium: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: <Info className="w-3.5 h-3.5" />,
  },
  low: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <Info className="w-3.5 h-3.5" />,
  },
};

function TypingText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    setDone(false);
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-3 bg-white/40 ml-0.5 animate-pulse" />}
    </span>
  );
}

export function AIInsightsCard({ insights, isLoading }: AIInsightsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (isLoading || !insights.length) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="h-4 bg-white/10 rounded w-28" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
        </div>
      </div>
    );
  }

  const visibleInsights = showAll ? insights : insights.slice(0, 3);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="font-medium text-sm">AI Insights</h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
            {insights.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
          {visibleInsights.map((insight, i) => {
            const config = priorityConfig[insight.priority] || priorityConfig.medium;
            return (
              <div
                key={i}
                className={`rounded-lg border p-3 ${config.bg} ${config.border}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium uppercase ${config.color}`}>
                        {insight.priority}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase">
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <TypingText text={insight.text} speed={10} />
                    </p>
                    {insight.suggested_action && (
                      <p className="text-[10px] text-gray-500 mt-1.5 italic">
                        → {insight.suggested_action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {insights.length > 3 && !showAll && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
              className="w-full text-center text-xs text-purple-400 hover:text-purple-300 py-1 transition-colors"
            >
              Show {insights.length - 3} more insights
            </button>
          )}
        </div>
      )}
    </div>
  );
}
