export interface RecommendationItem {
  id: number;
  action_id: string;
  action_name: string;
  action_description: string;
  target_person: string | null;
  target_department: string | null;
  target_patients: string[];
  expected_revenue_protected: number;
  expected_patients_helped: number;
  expected_time_saved: number;
  confidence: number;
  priority_rank: number;
  impact_score: number;
  status: string;
  created_at: string;
}

export interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'danger';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface WeatherData {
  condition: string;
  temperature: number;
  impact_score: number;
  historical_note: string;
  icon: string;
}

export interface AIInsight {
  category: string;
  priority: string;
  text: string;
  metric: string;
  suggested_action: string;
}

export interface ImpactSummary {
  today: {
    revenue_saved: number;
    patients_helped: number;
    hours_saved: number;
    recommendations_executed: number;
  };
  all_time: {
    revenue_saved: number;
    patients_helped: number;
    hours_saved: number;
  };
  daily_history: Array<{
    date: string;
    revenue: number;
    patients: number;
    hours: number;
  }>;
}

export type EscalationLevel = 'none' | 'nurse' | 'charge_nurse' | 'attending' | 'admin';

export interface EscalationInfo {
  alert_id: number;
  current_level: EscalationLevel;
  triggered_at: string;
  last_escalated_at: string;
  acknowledged: boolean;
  elapsed_minutes?: number;
}

export interface EscalationStatus {
  active_escalations: EscalationInfo[];
  total_escalated: number;
}

export interface WeatherData {
  condition: string;
  temperature: number;
  impact_score: number;
  historical_note: string;
  icon: string;
}

export interface AIInsight {
  category: string;
  priority: string;
  text: string;
  metric: string;
  suggested_action: string;
}

export interface ImpactSummary {
  today: { revenue_saved: number; patients_helped: number; hours_saved: number; recommendations_executed: number; };
  all_time: { revenue_saved: number; patients_helped: number; hours_saved: number; };
  daily_history: Array<{ date: string; revenue: number; patients: number; hours: number; }>;
}

export interface HandoffReport {
  shift_period: string;
  shift_label: string;
  generated_at: string;
  summary: string;
  top_risks: Array<{ risk: string; severity: string; action: string; }>;
  pending_actions: Array<{ action: string; description: string; urgency: string; revenue_impact: number; }>;
  patient_changes: { total_in_ed: number; waiting: number; in_treatment: number; discharge_ready: number; discharged_today: number; };
  staff_changes: { total_on_duty: number; nurses_on_duty: number; doctors_on_duty: number; overtime_available: number; overtime_names: string[]; };
  key_metrics: { current_boarding: number; predicted_4h: number; risk_level: string; pacu_occupancy: number; avg_wait_time: number; surgeries_delayed: number; };
  surgery_status: { total: number; delayed: number; in_progress: number; completed: number; };
}
