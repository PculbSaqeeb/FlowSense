import { CurrentStatus, EDPatient, DischargeReadyPatient, StaffMember, Surgery } from './hospital';
import { BedAvailability } from './hospital';
import { PredictionSummary, PredictionTimeline } from './predictions';
import { RecommendationItem, EscalationInfo, WeatherData, AIInsight, ImpactSummary } from './dashboard';

export interface StatusCardsProps {
  status: CurrentStatus | null;
  isLoading: boolean;
}

export interface PredictionPanelProps {
  prediction: PredictionSummary | null;
  timeline: PredictionTimeline[];
  isLoading: boolean;
}

export interface RecommendationCardsProps {
  recommendations: RecommendationItem[];
  totalRevenueAtRisk: number;
  totalRevenueProtected: number;
  onExecute?: (id: number) => void;
  onDismiss?: (id: number) => void;
  isLoading: boolean;
}

export interface PatientListProps {
  patients: EDPatient[];
  isLoading: boolean;
}

export interface DischargeReadyPanelProps {
  patients: DischargeReadyPatient[];
  isLoading: boolean;
}

export interface AlertPanelProps {
  prediction: {
    current_boarding: number;
    predicted_boarding_4h: number;
    predicted_boarding_6h: number;
    peak_risk_level: string;
    time_to_critical: number | null;
  } | null;
  escalations?: EscalationInfo[];
}

export interface MLMetricsPanelProps {
  className?: string;
}

export interface UseDashboardData {
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
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isConnected?: boolean;
  lastUpdate?: string | null;
}