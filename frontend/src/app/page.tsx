'use client';

import React, { useMemo } from 'react';
import { VolumeX } from 'lucide-react';

// Shared
import { useDashboardData } from '@/shared/hooks';
import { useSoundAlerts } from '@/shared/hooks';
import { APP_CONFIG } from '@/shared/constants';
import { Header } from '@/features/header';
import { ErrorBoundary } from '@/shared/components';

// Features - eager imports (direct paths for tree-shaking)
import { StatusCards } from '@/features/status';
import { CrisisTimeline } from '@/features/predictions';
import { StatusBanner } from '@/features/status';
import { WeatherWidget } from '@/features/insights';
import { AIInsightsCard } from '@/features/insights';
import { PatientList } from '@/features/patients';
import { DischargeReadyPanel } from '@/features/patients';
import { SurgeryStatus } from '@/features/patients';

// Features - lazy imports
const PredictionPanel = React.lazy(() => import('@/features/predictions').then(m => ({ default: m.PredictionPanel })));
const RecommendationCards = React.lazy(() => import('@/features/recommendations').then(m => ({ default: m.RecommendationCards })));
const StaffSkillMatrix = React.lazy(() => import('@/features/staff').then(m => ({ default: m.StaffSkillMatrix })));
const ImpactDashboard = React.lazy(() => import('@/features/impact').then(m => ({ default: m.ImpactDashboard })));
const HowItWorks = React.lazy(() => import('@/features/onboarding').then(m => ({ default: m.HowItWorks })));
const MLMetricsPanel = React.lazy(() => import('@/features/predictions').then(m => ({ default: m.MLMetricsPanel })));
const WelcomeModal = React.lazy(() => import('@/features/onboarding').then(m => ({ default: m.WelcomeModal })));
const WhatIfScenario = React.lazy(() => import('@/features/predictions').then(m => ({ default: m.WhatIfScenario })));
const BedAvailabilityTimeline = React.lazy(() => import('@/features/beds').then(m => ({ default: m.BedAvailabilityTimeline })));
const PatientFlowDiagram = React.lazy(() => import('@/features/status').then(m => ({ default: m.PatientFlowDiagram })));
const AIChat = React.lazy(() => import('@/shared/components').then(m => ({ default: m.AIChat })));

function SectionSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl h-48 ${className}`} />;
}

export default function Dashboard() {
  const {
    status,
    prediction,
    timeline,
    recommendations,
    edPatients,
    dischargeReady,
    staff,
    surgeries,
    weather,
    insights,
    impact,
    isLoading,
    error,
    refresh,
    isConnected,
    lastUpdate,
  } = useDashboardData();

  const { soundEnabled, enableSound } = useSoundAlerts(prediction);

  const totalRevenueProtected = useMemo(
    () => recommendations.reduce((sum, r) => sum + r.expected_revenue_protected, 0),
    [recommendations]
  );
  const totalPatientsHelped = useMemo(
    () => recommendations.reduce((sum, r) => sum + r.expected_patients_helped, 0),
    [recommendations]
  );

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {!soundEnabled && (
        <div
          onClick={enableSound}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-800/95 border border-gray-600 rounded-xl cursor-pointer hover:bg-gray-700/95 transition-colors shadow-2xl"
        >
          <VolumeX className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-gray-200">Click anywhere to enable alert sounds</span>
        </div>
      )}

      <Header
        status={status}
        prediction={prediction}
        recommendations={recommendations}
        staff={staff}
        surgeries={surgeries}
        isLoading={isLoading}
        onRefresh={refresh}
        totalRevenueProtected={totalRevenueProtected}
        totalPatientsHelped={totalPatientsHelped}
        isConnected={isConnected}
        lastUpdate={lastUpdate}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
            <button
              onClick={refresh}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <StatusBanner
          prediction={prediction}
          recommendations={recommendations}
          isLoading={isLoading}
        />

        <React.Suspense fallback={<SectionSkeleton className="h-48" />}>
          <div className="mb-6">
            <PatientFlowDiagram
              status={status}
              edPatients={edPatients}
              dischargeReady={dischargeReady}
              isLoading={isLoading}
            />
          </div>
        </React.Suspense>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-200">Current Hospital Status</h2>
              <p className="text-xs text-gray-500">Live metrics from the emergency department</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Updated every 30s</span>
            </div>
          </div>
          <StatusCards status={status} isLoading={isLoading} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-200">AI Boarding Forecast</h2>
                <p className="text-xs text-gray-500">Predicted patient count over next 12 hours</p>
              </div>
              <React.Suspense fallback={<SectionSkeleton />}>
                <PredictionPanel
                  prediction={prediction}
                  timeline={timeline}
                  isLoading={isLoading}
                />
              </React.Suspense>
            </div>

            <React.Suspense fallback={<SectionSkeleton className="h-24" />}>
              <WhatIfScenario status={status} prediction={prediction} weather={weather} />
            </React.Suspense>

            <CrisisTimeline
              timeline={timeline}
              isActive={prediction?.peak_risk_level === 'high' || prediction?.peak_risk_level === 'critical'}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-200">AI Recommended Actions</h2>
                <p className="text-xs text-gray-500">Priority-ranked steps to prevent boarding crises</p>
              </div>
              <React.Suspense fallback={<SectionSkeleton />}>
                <RecommendationCards
                  recommendations={recommendations}
                  totalRevenueAtRisk={prediction ? prediction.current_boarding * (APP_CONFIG.revenuePerBoarding ?? 0) : 0}
                  totalRevenueProtected={totalRevenueProtected}
                  isLoading={isLoading}
                />
              </React.Suspense>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-200">Staff & Shift Handoff</h2>
                <p className="text-xs text-gray-500">Current staffing levels and shift change readiness</p>
              </div>
              <React.Suspense fallback={<SectionSkeleton />}>
                <StaffSkillMatrix staff={staff} isLoading={isLoading} />
              </React.Suspense>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <WeatherWidget weather={weather} isLoading={isLoading} />

            <React.Suspense fallback={<SectionSkeleton className="h-32" />}>
              <BedAvailabilityTimeline isLoading={isLoading} />
            </React.Suspense>

            <SurgeryStatus surgeries={surgeries} isLoading={isLoading} />

            <AIInsightsCard insights={insights} isLoading={isLoading} />

            <React.Suspense fallback={<SectionSkeleton className="h-32" />}>
              <ImpactDashboard impact={impact} isLoading={isLoading} />
            </React.Suspense>

            <PatientList patients={edPatients} isLoading={isLoading} />
            <DischargeReadyPanel patients={dischargeReady} isLoading={isLoading} />

            <React.Suspense fallback={<SectionSkeleton className="h-32" />}>
              <MLMetricsPanel />
            </React.Suspense>
          </div>
        </div>
      </main>

      <React.Suspense fallback={null}>
        <WelcomeModal />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <HowItWorks />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <AIChat />
      </React.Suspense>

    </div>
    </ErrorBoundary>
  );
}
