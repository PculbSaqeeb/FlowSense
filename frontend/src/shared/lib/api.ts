
/**
 * FlowSense - API Client
 * Handles all HTTP communication with the backend
 */

import type {
  ApiResponse,
  CurrentStatus,
  PredictionSummary,
  PredictionTimeline,
  RecommendationItem,
  MLMetrics,
  SimulationResult,
  HandoffReport,
  BedAvailability,
  EscalationStatus,
} from '@/shared/types';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

class FlowSenseAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'API request failed');
    }

    return result.data;
  }

  private async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'API request failed');
    }

    return result.data;
  }

  // Dashboard
  getDashboardStatus() {
    return this.fetch<CurrentStatus>('/dashboard/status');
  }

  // Predictions
  getCurrentPrediction() {
    return this.fetch<PredictionSummary>('/predictions/current');
  }

  getCustomPrediction(state: Record<string, unknown>) {
    return this.post<PredictionSummary>('/predictions/custom', state);
  }

  simulateScenario(params: Record<string, unknown>) {
    return this.post<SimulationResult>('/predictions/simulate', params);
  }

  getPredictionTimeline(hours: number = 12) {
    return this.fetch<PredictionTimeline[]>(`/predictions/timeline?hours=${hours}`);
  }

  getMLMetrics() {
    return this.fetch<MLMetrics>('/predictions/ml-metrics');
  }

  // Recommendations
  getActiveRecommendations() {
    return this.fetch<RecommendationItem[]>('/recommendations/active');
  }

  // Reports
  getHandoffReport() {
    return this.fetch<HandoffReport>('/reports/handoff');
  }

  // Bed Availability
  getBedAvailability() {
    return this.fetch<BedAvailability>('/beds/availability');
  }

  // Escalation
  getEscalationStatus() {
    return this.fetch<EscalationStatus>('/escalation/status');
  }

  acknowledgeEscalation(alertId: number) {
    return this.post<{ success: boolean }>(`/escalation/acknowledge/${alertId}`);
  }

  // Voice / Chat
  chatWithAI(message: string) {
    return this.post<{ response: string }>('/ai/chat', { message });
  }
}

export const api = new FlowSenseAPI();
