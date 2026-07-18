'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, AlertTriangle, Info, CheckCircle, Shield } from 'lucide-react';
import type { Alert, AlertPanelProps, EscalationInfo } from '@/shared/types';
import { api } from '@/shared/lib';

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'danger': return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'warning': return <Shield className="w-4 h-4 text-amber-400" />;
    case 'info': return <Info className="w-4 h-4 text-blue-400" />;
    case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  }
};

const getAlertBg = (type: Alert['type']) => {
  switch (type) {
    case 'danger': return 'bg-[#0a0a0a] border border-red-500/20 border-l-[4px] border-l-red-500';
    case 'warning': return 'bg-[#0a0a0a] border border-amber-500/20 border-l-[4px] border-l-amber-500';
    case 'info': return 'bg-[#0a0a0a] border border-blue-500/20 border-l-[4px] border-l-blue-500';
    case 'success': return 'bg-[#0a0a0a] border border-emerald-500/20 border-l-[4px] border-l-emerald-500';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getEscalationColor = (level: string) => {
  switch (level) {
    case 'admin': return 'bg-red-500/30 text-red-300';
    case 'attending': return 'bg-orange-500/30 text-orange-300';
    case 'charge_nurse': return 'bg-amber-500/30 text-amber-300';
    case 'nurse': return 'bg-blue-500/30 text-blue-300';
    default: return 'bg-gray-500/30 text-gray-300';
  }
};

const formatEscalationLevel = (level: string) => {
  switch (level) {
    case 'charge_nurse': return 'Charge Nurse';
    case 'attending': return 'Attending Physician';
    default: return level.charAt(0).toUpperCase() + level.slice(1);
  }
};

function ToastItem({ alert, onClose }: { alert: Alert, onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  const [exiting, setExiting] = useState(false);
  onCloseRef.current = onClose;
  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onCloseRef.current(), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className={`w-full sm:w-80 shadow-2xl shadow-black/60 rounded-xl px-4 py-3 ${getAlertBg(alert.type)} backdrop-blur-xl transition-all duration-300 ${exiting ? 'animate-[toast-out_0.3s_ease-in_forwards]' : 'animate-[toast-in_0.4s_ease-out_forwards]'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white/5">
          {getAlertIcon(alert.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white leading-relaxed">{alert.message}</p>
          <p className="text-[10px] text-gray-400 mt-1">{formatTime(alert.timestamp)}</p>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AlertPanel({ prediction, escalations: escalationsProp }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [escalations, setEscalations] = useState<EscalationInfo[]>(escalationsProp ?? []);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Keep track of the last values we alerted for, to prevent duplicate alerts on refresh
  const lastAlertStateRef = useRef({ boarding: -1, risk: '', timeToCritical: -1 });

  useEffect(() => { setMounted(true); }, []);

  // Fetch escalation status periodically
  useEffect(() => {
    let mounted = true;
    const fetchEscalations = async () => {
      try {
        const status = await api.getEscalationStatus();
        if (mounted && status?.active_escalations) {
          setEscalations(status.active_escalations);
        }
      } catch {
        // ignore
      }
    };
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!prediction) return;

    const boarding = prediction.current_boarding;
    const risk = prediction.peak_risk_level;
    const timeToCritical = prediction.time_to_critical ?? -1;

    // Check if the state actually changed in a way that warrants a new alert
    const lastState = lastAlertStateRef.current;
    if (
      lastState.boarding === boarding && 
      lastState.risk === risk && 
      lastState.timeToCritical === timeToCritical
    ) {
      return; // No changes, do not generate duplicate alerts
    }

    const isFirstLoad = lastState.boarding === -1;

    // Update last state
    lastAlertStateRef.current = { boarding, risk, timeToCritical };

    const newAlerts: Alert[] = [];
    const predicted4h = Math.round(prediction.predicted_boarding_4h);
    const predicted6h = Math.round(prediction.predicted_boarding_6h);

    if (risk === 'critical') {
      newAlerts.push({
        id: Date.now(),
        type: 'danger',
        message: `${boarding} patients waiting for beds right now. This could reach ${predicted4h} patients within 4 hours. Hospital is under heavy pressure — action needed immediately.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    } else if (risk === 'high') {
      newAlerts.push({
        id: Date.now() + 1,
        type: 'warning',
        message: `${boarding} patients are waiting for beds. If nothing changes, this may grow to ${predicted4h} in 4 hours and ${predicted6h} in 6 hours. Consider taking action soon.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    } else if (risk === 'medium') {
      newAlerts.push({
        id: Date.now() + 3,
        type: 'info',
        message: `${boarding} patients waiting for beds. Numbers may rise to ${predicted4h} within 4 hours. Keep an eye on the situation.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    } else {
      newAlerts.push({
        id: Date.now() + 4,
        type: 'success',
        message: `${boarding} patients waiting for beds. Things look stable — expected to stay around ${predicted4h} in 4 hours. No action needed right now.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    if (prediction.time_to_critical !== null && prediction.time_to_critical < 6) {
      newAlerts.push({
        id: Date.now() + 2,
        type: 'danger',
        message: `Hospital could reach crisis level in just ${prediction.time_to_critical} hours if things stay the same. Please act now.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
      
      // Show toast ONLY if it's NOT the first load
      if (!isFirstLoad) {
        setToasts(prev => [...newAlerts, ...prev]);
      }
    }
  }, [prediction]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const dismissAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-primary-500/20 border border-primary-500/30'
            : 'bg-white/5 hover:bg-white/10 border border-transparent'
        }`}
      >
        <Bell className={`w-5 h-5 ${isOpen ? 'text-primary-400' : 'text-gray-400'}`} />
        {mounted && unacknowledgedCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
            {unacknowledgedCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 rounded-xl z-50 overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unacknowledgedCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-medium rounded">
                    {unacknowledgedCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Escalation Section */}
          {escalations && escalations.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-700 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-300">Auto-Escalation Active</span>
              </div>
              {escalations.map((esc) => (
                <div key={esc.alert_id} className="flex items-center justify-between bg-red-500/10 rounded-lg px-2.5 py-1.5 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Escalated to:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getEscalationColor(esc.current_level)}`}>
                      {formatEscalationLevel(esc.current_level)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500">{Math.round(esc.elapsed_minutes)}m ago</span>
                    <button
                      onClick={async () => {
                        try {
                          await api.acknowledgeEscalation(esc.alert_id);
                          setEscalations(prev => prev.filter(e => e.alert_id !== esc.alert_id));
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-[9px] px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-colors"
                    >
                      Ack
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alert List */}
          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">All clear</p>
                <p className="text-xs text-gray-500 mt-1">No alerts right now</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`group rounded-lg px-3 py-2.5 transition-all ${getAlertBg(alert.type)}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-200 leading-relaxed">{alert.message}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{formatTime(alert.timestamp)}</p>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-700">
              <button
                onClick={() => { setAlerts([]); setIsOpen(false); }}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toasts Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem alert={toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
