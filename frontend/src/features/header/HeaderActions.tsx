'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, MoreVertical, FlaskConical, Download, Bell, X } from 'lucide-react';
import type { CurrentStatus, PredictionSummary, RecommendationItem, StaffMember, Surgery } from '@/shared/types';

const PredictionVerifier = React.lazy(() => import('@/features/predictions').then(m => ({ default: m.PredictionVerifier })));
const ReportExport = React.lazy(() => import('@/features/reports').then(m => ({ default: m.ReportExport })));
const AlertPanel = React.lazy(() => import('@/features/alerts').then(m => ({ default: m.AlertPanel })));
const ShiftHandoff = React.lazy(() => import('@/features/reports').then(m => ({ default: m.ShiftHandoff })));

interface HeaderActionsProps {
  status: CurrentStatus | null;
  prediction: PredictionSummary | null;
  recommendations: RecommendationItem[];
  staff: StaffMember[];
  surgeries: Surgery[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function HeaderActions({
  status,
  prediction,
  recommendations,
  staff,
  surgeries,
  isLoading,
  onRefresh,
}: HeaderActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCountChange = (e: any) => setNotificationCount(e.detail);
    window.addEventListener('alert-count-changed', handleCountChange);
    return () => window.removeEventListener('alert-count-changed', handleCountChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Desktop (lg+): show inline action buttons */}
      <div className="hidden lg:flex items-center gap-2">
        <React.Suspense fallback={null}>
          <PredictionVerifier />
        </React.Suspense>

        <React.Suspense fallback={null}>
          <ReportExport
            status={status}
            prediction={prediction}
            recommendations={recommendations}
            staff={staff}
            surgeries={surgeries}
          />
        </React.Suspense>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-2 glass rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs hidden xl:inline">Refresh</span>
        </button>

      </div>
      <React.Suspense fallback={null}>
        <AlertPanel prediction={prediction} />
      </React.Suspense>

      {/* Mobile/Tablet (<lg): 3-dot menu with full dropdown */}
      <div className="relative lg:hidden" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded-xl transition-all duration-200 ${
            menuOpen
              ? 'bg-primary-500/20 border border-primary-500/30'
              : 'bg-white/5 hover:bg-white/10 border border-transparent'
          }`}
          aria-label="Menu"
        >
          {menuOpen ? (
            <X className="w-5 h-5 text-primary-400" />
          ) : (
            <MoreVertical className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMenuOpen(false)}
            />

            <div className="absolute right-0 top-12 w-72 md:w-96 rounded-xl z-50 overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">
              <div className="p-2 space-y-0.5">

                <div 
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => {
                    const btn = e.currentTarget.querySelector('button');
                    if (btn && !btn.contains(e.target as Node)) btn.click();
                  }}
                >
                  <span className="text-sm pointer-events-none">Test Prediction</span>
                  <div className="flex items-center gap-2">
                    <div className="pointer-events-none" onClick={(e) => e.stopPropagation()}>
                      <React.Suspense fallback={null}>
                        <PredictionVerifier compact />
                      </React.Suspense>
                    </div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => {
                    const btn = e.currentTarget.querySelector('button');
                    if (btn && !btn.contains(e.target as Node)) btn.click();
                  }}
                >
                  <span className="text-sm pointer-events-none">Export Report</span>
                  <div className="flex items-center gap-2">
                    <div className="pointer-events-none" onClick={(e) => e.stopPropagation()}>
                      <React.Suspense fallback={null}>
                        <ReportExport
                          status={status}
                          prediction={prediction}
                          recommendations={recommendations}
                          staff={staff}
                          surgeries={surgeries}
                        />
                      </React.Suspense>
                    </div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    setMenuOpen(false);
                    const btn = document.getElementById('main-alert-btn');
                    if (btn) btn.click();
                  }}
                >
                  <span className="text-sm pointer-events-none">Notifications</span>
                  <div className="relative pointer-events-none px-3 py-2 glass rounded-lg">
                    <Bell className="w-4 h-4 text-gray-300" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                </div>


              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
