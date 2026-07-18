'use client';

import React, { useMemo } from 'react';
import type { CurrentStatus, EDPatient, DischargeReadyPatient } from '@/shared/types';

interface PatientFlowDiagramProps {
  status: CurrentStatus | null;
  edPatients: EDPatient[];
  dischargeReady: DischargeReadyPatient[];
  isLoading: boolean;
}

export function PatientFlowDiagram({ status, edPatients, dischargeReady, isLoading }: PatientFlowDiagramProps) {
  const flowData = useMemo(() => {
    if (!status) return null;

    const waiting = edPatients.filter(p => p.status === 'waiting').length;
    const inTreatment = edPatients.filter(p => p.status === 'in_treatment').length;
    const admitted = edPatients.filter(p => p.status === 'admitted').length;
    const totalEd = edPatients.length;
    const boarding = status.boarding_count;
    const discharges = status.discharges_today;
    const discharging = dischargeReady.length;

    const smoothFlow = totalEd > 0 ? ((discharges + inTreatment) / Math.max(1, totalEd)) * 100 : 100;
    const bottleneckLevel = boarding > 15 ? 'severe' : boarding > 10 ? 'moderate' : boarding > 5 ? 'mild' : 'none';

    return { waiting, inTreatment, admitted, boarding, discharges, discharging, totalEd, smoothFlow, bottleneckLevel };
  }, [status, edPatients, dischargeReady]);

  if (isLoading || !flowData) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-32 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  const { waiting, inTreatment, admitted, boarding, discharges, discharging, totalEd, bottleneckLevel } = flowData;
  const bottleneckColor = bottleneckLevel === 'severe' ? '#ef4444' : bottleneckLevel === 'moderate' ? '#f59e0b' : bottleneckLevel === 'mild' ? '#eab308' : '#22c55e';

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-sm text-gray-200">Patient Flow Diagram</h3>
          <p className="text-[10px] text-gray-500">Real-time patient movement through the ED</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: bottleneckColor }} />
          <span className="text-[10px] text-gray-400">
            {bottleneckLevel === 'none' ? 'Smooth flow' : `Bottleneck: ${bottleneckLevel}`}
          </span>
        </div>
      </div>

      <svg viewBox="0 0 800 230" className="w-full h-auto max-h-[300px]">
        <defs>
          <linearGradient id="flowGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="flowBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="flowRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="flowAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* ARRIVALS NODE */}
        <rect x="10" y="60" width="100" height="80" rx="8" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5" />
        <text x="60" y="90" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="600">ARRIVALS</text>
        <text x="60" y="110" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{totalEd}</text>
        <text x="60" y="126" textAnchor="middle" fill="#9ca3af" fontSize="8">per hour</text>

        {/* Flow arrow: Arrivals → Triage */}
        <path d="M 110 100 C 140 100, 145 100, 170 100" stroke="url(#flowGreen)" strokeWidth="3" fill="none" markerEnd="url(#arrowGreen)" />
        <circle cx="140" cy="100" r="2" fill="#22c55e">
          <animate attributeName="cx" from="110" to="170" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* TRIAGE NODE */}
        <rect x="170" y="50" width="120" height="100" rx="8" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="230" y="75" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="600">TRIAGE</text>
        <text x="230" y="105" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{totalEd}</text>
        <text x="230" y="120" textAnchor="middle" fill="#9ca3af" fontSize="8">patients total</text>
        <text x="230" y="135" textAnchor="middle" fill="#60a5fa" fontSize="7">{waiting} waiting / {inTreatment} treating</text>

        {/* Flow arrow: Triage → Treatment */}
        <path d="M 290 100 C 320 100, 325 100, 350 100" stroke="url(#flowBlue)" strokeWidth="3" fill="none" />
        <circle cx="320" cy="100" r="2" fill="#3b82f6">
          <animate attributeName="cx" from="290" to="350" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        </circle>

        {/* TREATMENT NODE */}
        <rect x="350" y="60" width="110" height="80" rx="8" fill="rgba(168,85,247,0.15)" stroke="#a855f7" strokeWidth="1.5" />
        <text x="405" y="85" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="600">TREATMENT</text>
        <text x="405" y="108" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{inTreatment}</text>
        <text x="405" y="123" textAnchor="middle" fill="#9ca3af" fontSize="8">in treatment</text>

        {/* Flow arrow: Treatment → Decision */}
        <path d="M 460 100 C 490 100, 495 100, 520 100" stroke="url(#flowBlue)" strokeWidth="3" fill="none" />
        <circle cx="490" cy="100" r="2" fill="#a855f7">
          <animate attributeName="cx" from="460" to="520" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>

        {/* DECISION NODE */}
        <rect x="520" y="65" width="80" height="70" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <text x="560" y="88" textAnchor="middle" fill="#d1d5db" fontSize="9" fontWeight="600">DECISION</text>
        <text x="560" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">?</text>

        {/* OUTCOME 1: Discharge (top) */}
        <path d="M 600 80 C 630 80, 635 40, 670 40" stroke="url(#flowGreen)" strokeWidth="2" fill="none" />
        <circle cx="635" cy="60" r="2" fill="#22c55e">
          <animate attributeName="cx" from="600" to="670" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <rect x="670" y="20" width="120" height="50" rx="8" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5" />
        <text x="730" y="38" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="600">DISCHARGED</text>
        <text x="730" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{discharges}</text>

        {/* OUTCOME 2: Admission (middle) */}
        <path d="M 600 100 L 670 100" stroke="url(#flowAmber)" strokeWidth="2" fill="none" />
        <circle cx="635" cy="100" r="2" fill="#f59e0b">
          <animate attributeName="cx" from="600" to="670" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <rect x="670" y="80" width="120" height="50" rx="8" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="730" y="98" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="600">ADMIT TO BED</text>
        <text x="730" y="115" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{admitted}</text>

        {/* OUTCOME 3: Boarding (bottom) - THE PROBLEM */}
        <path d="M 600 120 C 630 120, 635 160, 670 160" stroke="url(#flowRed)" strokeWidth={bottleneckLevel !== 'none' ? '4' : '2'} fill="none" />
        <circle cx="635" cy="140" r="2" fill="#ef4444">
          <animate attributeName="cx" from="600" to="670" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <rect
          x="670" y="140" width="120" height="50" rx="8"
          fill={bottleneckLevel !== 'none' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)'}
          stroke="#ef4444"
          strokeWidth={bottleneckLevel === 'severe' ? '2.5' : '1.5'}
        >
          {bottleneckLevel === 'severe' && (
            <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
          )}
        </rect>
        <text x="730" y="158" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="600">BOARDING</text>
        <text x="730" y="175" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{boarding}</text>

        {/* Bottleneck glow */}
        {bottleneckLevel !== 'none' && (
          <rect x="668" y="138" width="124" height="54" rx="10" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3">
            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.5s" repeatCount="indefinite" />
          </rect>
        )}

        {/* Discharge Ready label */}
        {discharging > 0 && (
          <g>
            {/* Pulsing glow behind the badge */}
            <rect x="675" y="196" width="110" height="22" rx="11" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.3">
              <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2s" repeatCount="indefinite" />
            </rect>
            {/* Badge body */}
            <rect x="675" y="196" width="110" height="22" rx="11" fill="rgba(34,197,94,0.2)" stroke="#22c55e" strokeWidth="1" />
            {/* Text properly centered */}
            <text x="730" y="211" textAnchor="middle" fill="#86efac" fontSize="8" letterSpacing="0.5">
              {discharging} READY TO DISCHARGE
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
