export interface CurrentStatus {
  ed_beds_occupied: number;
  ed_beds_total: number;
  boarding_count: number;
  ed_wait_time_avg: number;
  patients_left_without_seen: number;
  inpatient_census: number;
  inpatient_beds_total: number;
  discharge_ready_count: number;
  discharges_today: number;
  pacu_occupancy: number;
  or_delays: number;
  surgeries_scheduled: number;
  nurses_on_duty: number;
  nurse_patient_ratio: number;
  last_updated: string;
}

export interface TimelineEvent {
  time: string | null;
  event: string;
  status: 'done' | 'current' | 'pending';
  icon: string;
}

export interface EDPatient {
  id: number;
  patient_id: string;
  arrival_time: string;
  triage_level: number;
  chief_complaint: string;
  status: string;
  assigned_floor: number | null;
  wait_time_minutes: number;
  timeline: TimelineEvent[];
}

export interface DischargeReadyPatient {
  patient_id: string;
  floor: number;
  room_number: string;
  doctor_name: string;
  discharge_ready_since: string;
  expected_discharge_time: string | null;
  hours_waiting: number;
  procedure_type: string;
  estimated_discharge_hours: number;
  countdown_status: 'on_track' | 'approaching' | 'overdue';
}

export interface StaffMember {
  id: number;
  employee_id: string;
  name: string;
  role: string;
  department: string;
  is_on_duty: boolean;
  is_available_overtime: boolean;
  shift_end: string | null;
  skills: string[];
  specializations: string[];
  certification_level: string;
}

export interface Surgery {
  id: number;
  surgery_id: string;
  patient_id: string;
  or_number: string;
  surgeon_name: string;
  scheduled_start: string;
  expected_end: string;
  actual_end: string | null;
  pacu_bay: number | null;
  status: string;
  procedure_type: string;
  is_urgent: boolean;
}

export interface BedAvailabilityHour {
  hour: number;
  label: string;
  beds_available: number;
  beds_occupied: number;
  beds_total: number;
  status: 'available' | 'tight' | 'full';
}

export interface BedAvailability {
  current_available: number;
  current_occupied: number;
  total_beds: number;
  next_free_hour: number;
  next_free_label: string;
  timeline: BedAvailabilityHour[];
  rooms_freed: Array<{ room: string; free_in_hours: number; patient_id: string; }>;
}
