export interface PredictionSummary {
  current_boarding: number;
  predicted_boarding_4h: number;
  predicted_boarding_6h: number;
  predicted_boarding_8h: number;
  predicted_boarding_12h: number;
  peak_risk_level: string;
  peak_risk_time: string;
  confidence_score: number;
  time_to_critical: number | null;
}

export interface PredictionTimeline {
  timestamp: string;
  prediction_horizon: number;
  predicted_boarding: number;
  confidence_score: number;
  risk_level: string;
}

export interface MLModel {
  name: string;
  r2_score: number;
  mae: number;
  rmse: number;
  training_samples: number;
  training_time_ms: number;
  top_features: Record<string, number>;
}

export interface MLPrediction {
  horizon_hours: number;
  predicted_boarding: number;
  confidence: number;
  risk_level: string;
}

export interface MLMetrics {
  trained: boolean;
  trained_at?: string;
  total_samples?: number;
  best_model?: string;
  ensemble_weights?: Record<string, number>;
  cross_val_scores?: Record<string, number>;
  models?: MLModel[];
  feature_names?: string[];
  top_features?: Record<string, number>;
  current_predictions?: MLPrediction[];
}

export interface SimulationBaseline {
  current_boarding: number;
  predicted_4h: number;
  predicted_6h: number;
  predicted_8h: number;
  predicted_12h: number;
  risk_level: string;
  confidence: number;
}

export interface SimulationImpact {
  boarding_reduction: number;
  revenue_protected: number;
  risk_improvement: number;
  risk_change: string;
}

export interface SimulationResult {
  baseline: SimulationBaseline;
  simulated: SimulationBaseline;
  impact: SimulationImpact;
  simulated_state: {
    nurse_patient_ratio: number | null;
    ed_beds_occupied: number | null;
    pacu_occupancy: number | null;
    discharge_ready_count: number | null;
  };
  recommendations: Array<{
    action_name: string;
    action_description: string;
    expected_revenue_protected: number;
    expected_patients_helped: number;
    priority_rank: number;
  }>;
}

export interface HourlyDataPoint {
  timestamp: string;
  avg_boarding: number;
  avg_wait: number;
  avg_pacu: number;
  avg_arrivals: number;
  avg_discharges: number;
  data_points: number;
}

export interface PatternData {
  busiest_hours: Array<{
    hour: number;
    avg_boarding: number;
    avg_arrivals: number;
    avg_wait: number;
  }>;
  worst_days: Array<{
    day: string;
    day_index: number;
    avg_boarding: number;
    avg_arrivals: number;
  }>;
  summary: {
    total_data_points: number;
    overall_avg_boarding: number;
    overall_avg_wait: number;
    peak_boarding: number;
    min_boarding: number;
  };
}