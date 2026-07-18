'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  CurrentStatus,
  PredictionSummary,
  PredictionTimeline,
  RecommendationItem,
  EDPatient,
  DischargeReadyPatient,
  StaffMember,
  Surgery,
  WeatherData,
  AIInsight,
  ImpactSummary,
} from '@/shared/types';

const getSseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/stream`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:8000/api/v1/stream`;
  }
  return 'http://localhost:8000/api/v1/stream';
};

const SSE_URL = getSseUrl();
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

interface SSEState {
  status: CurrentStatus | null;
  prediction: PredictionSummary | null;
  timeline: PredictionTimeline[];
  recommendations: RecommendationItem[];
  edPatients: EDPatient[];
  dischargeReady: DischargeReadyPatient[];
  staff: StaffMember[];
  surgeries: Surgery[];
  weather: WeatherData | null;
  insights: AIInsight[];
  impact: ImpactSummary | null;
  isConnected: boolean;
  lastUpdate: string | null;
  error: string | null;
}

const INITIAL_STATE: SSEState = {
  status: null,
  prediction: null,
  timeline: [],
  recommendations: [],
  edPatients: [],
  dischargeReady: [],
  staff: [],
  surgeries: [],
  weather: null,
  insights: [],
  impact: null,
  isConnected: false,
  lastUpdate: null,
  error: null,
};

export function useLiveDashboard(): SSEState & { reconnect: () => void } {
  const [state, setState] = useState<SSEState>(INITIAL_STATE);

  const reconnectAttempt = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(SSE_URL);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttempt.current = 0;
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    es.addEventListener('update', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(e.data);
        setState({
          status: data.status || null,
          prediction: data.prediction || null,
          timeline: data.timeline || [],
          recommendations: data.recommendations || [],
          edPatients: data.edPatients || [],
          dischargeReady: data.dischargeReady || [],
          staff: data.staff || [],
          surgeries: data.surgeries || [],
          weather: data.weather || null,
          insights: data.insights || [],
          impact: data.impact || null,
          isConnected: true,
          lastUpdate: data.timestamp || new Date().toISOString(),
          error: null,
        });
      } catch {
        // silent parse error
      }
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      setState(prev => ({ ...prev, isConnected: false }));

      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
      reconnectAttempt.current++;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect, connectCountRef.current]);

  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    reconnectAttempt.current = 0;
    setState(INITIAL_STATE);
    connectCountRef.current++;
    // Force re-run of connect effect
    setTimeout(connect, 50);
  }, [connect]);

  return { ...state, reconnect };
}
