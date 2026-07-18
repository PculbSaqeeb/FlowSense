'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, Copy, Check, AlertTriangle, Clock, Users, Activity } from 'lucide-react';
import { api } from '@/shared/lib';
import type { HandoffReport } from '@/shared/types';

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

export function ShiftHandoff() {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<HandoffReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getHandoffReport()
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const copyToClipboard = () => {
    if (!report) return;
    const text = [
      `SHIFT HANDOFF REPORT`,
      `Period: ${report.shift_period} | Generated: ${new Date(report.generated_at).toLocaleString()}`,
      ``,
      `SUMMARY: ${report.summary}`,
      ``,
      `TOP RISKS:`,
      ...report.top_risks.map((r, i) => `${i + 1}. [${r.severity.toUpperCase()}] ${r.risk}`),
      ``,
      `PENDING ACTIONS:`,
      ...report.pending_actions.map((a, i) => `${i + 1}. ${a.action} — ${a.description}`),
      ``,
      `PATIENT ACTIVITY:`,
      `  Waiting: ${report.patient_changes.waiting} | In Treatment: ${report.patient_changes.in_treatment} | Discharge Ready: ${report.patient_changes.discharge_ready}`,
      ``,
      `KEY METRICS:`,
      `  Boarding: ${report.key_metrics.current_boarding} | Risk: ${report.key_metrics.risk_level} | PACU: ${Math.round(report.key_metrics.pacu_occupancy * 100)}%`,
      `  Avg Wait: ${report.key_metrics.avg_wait_time}min | Surgeries Delayed: ${report.key_metrics.surgeries_delayed}`,
      ``,
      `STAFF: ${report.staff_changes.nurses_on_duty} nurses, ${report.staff_changes.doctors_on_duty} doctors, ${report.staff_changes.overtime_available} available for OT`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Shift Handoff</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-400" />
                  Shift Handoff Report
                </h2>
                {report && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {report.shift_period} — {new Date(report.generated_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !report ? (
                <p className="text-center text-gray-500 py-8">Failed to load report</p>
              ) : (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase mb-2">Summary</h3>
                    <p className="text-sm text-gray-200 leading-relaxed">{report.summary}</p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Boarding', value: report.key_metrics.current_boarding, color: 'text-white' },
                      { label: 'Risk Level', value: report.key_metrics.risk_level, color: severityColors[report.key_metrics.risk_level]?.includes('red') ? 'text-red-400' : severityColors[report.key_metrics.risk_level]?.includes('orange') ? 'text-orange-400' : severityColors[report.key_metrics.risk_level]?.includes('blue') ? 'text-blue-400' : 'text-yellow-400' },
                      { label: 'PACU', value: `${Math.round(report.key_metrics.pacu_occupancy * 100)}%`, color: 'text-white' },
                      { label: 'Avg Wait', value: `${report.key_metrics.avg_wait_time}m`, color: 'text-white' },
                      { label: 'Delayed', value: report.key_metrics.surgeries_delayed, color: 'text-orange-400' },
                      { label: 'Predicted 4h', value: report.key_metrics.predicted_4h, color: 'text-primary-400' },
                    ].map((m, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-2 text-center">
                        <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                        <div className="text-[9px] text-gray-500">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top Risks */}
                  {report.top_risks.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-300 uppercase mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-400" /> Top Risks
                      </h3>
                      <div className="space-y-1.5">
                        {report.top_risks.map((r, i) => (
                          <div key={i} className={`rounded-lg border p-2.5 ${severityColors[r.severity] || severityColors.medium}`}>
                            <p className="text-xs leading-relaxed">{r.risk}</p>
                            <p className="text-[10px] opacity-70 mt-1">Action: {r.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Actions */}
                  {report.pending_actions.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-300 uppercase mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" /> Pending Actions
                      </h3>
                      <div className="space-y-1.5">
                        {report.pending_actions.map((a, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-2.5 flex items-start gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              a.urgency === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>{a.urgency}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-200 font-medium">{a.action}</p>
                              <p className="text-[10px] text-gray-400 truncate">{a.description}</p>
                            </div>
                            <span className="text-[10px] text-green-400">${a.revenue_impact.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patient + Staff */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Patients
                      </h4>
                      <div className="space-y-1 text-xs text-gray-300">
                        <div className="flex justify-between"><span>Waiting</span><span className="font-medium">{report.patient_changes.waiting}</span></div>
                        <div className="flex justify-between"><span>In Treatment</span><span className="font-medium">{report.patient_changes.in_treatment}</span></div>
                        <div className="flex justify-between"><span>Discharge Ready</span><span className="font-medium">{report.patient_changes.discharge_ready}</span></div>
                        <div className="flex justify-between"><span>Discharged Today</span><span className="font-medium">{report.patient_changes.discharged_today}</span></div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Staff
                      </h4>
                      <div className="space-y-1 text-xs text-gray-300">
                        <div className="flex justify-between"><span>Nurses</span><span className="font-medium">{report.staff_changes.nurses_on_duty}</span></div>
                        <div className="flex justify-between"><span>Doctors</span><span className="font-medium">{report.staff_changes.doctors_on_duty}</span></div>
                        <div className="flex justify-between"><span>OT Available</span><span className="font-medium text-green-400">{report.staff_changes.overtime_available}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
