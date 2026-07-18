"""
FlowSense - Pydantic Schemas
Request/Response models for API validation
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============== Base Schemas ==============

class BaseResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============== Enums ==============

class RiskLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecommendationStatusEnum(str, Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    DISMISSED = "dismissed"


# ============== Dashboard Schemas ==============

class CurrentStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    ed_beds_occupied: int
    ed_beds_total: int
    boarding_count: int
    ed_wait_time_avg: float
    patients_left_without_seen: int
    inpatient_census: int
    inpatient_beds_total: int
    discharge_ready_count: int
    discharges_today: int
    pacu_occupancy: float
    or_delays: int
    surgeries_scheduled: int
    nurses_on_duty: int
    nurse_patient_ratio: float
    last_updated: datetime


class DashboardResponse(BaseResponse):
    data: CurrentStatus


# ============== Prediction Schemas ==============

class PredictionTimeline(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    timestamp: datetime
    prediction_horizon: int
    predicted_boarding: float
    confidence_score: float
    risk_level: RiskLevelEnum


class PredictionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    current_boarding: int
    predicted_boarding_4h: float
    predicted_boarding_6h: float
    predicted_boarding_8h: float
    predicted_boarding_12h: float
    peak_risk_level: RiskLevelEnum
    peak_risk_time: datetime
    confidence_score: float
    time_to_critical: Optional[int]


class PredictionResponse(BaseResponse):
    data: PredictionSummary


class PredictionTimelineResponse(BaseResponse):
    data: List[PredictionTimeline]


# ============== Recommendation Schemas ==============

class RecommendationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    action_id: str
    action_name: str
    action_description: Optional[str]
    target_person: Optional[str]
    target_department: Optional[str]
    target_patients: Optional[List[str]]
    expected_revenue_protected: float
    expected_patients_helped: int
    expected_time_saved: int
    confidence: float
    priority_rank: int
    impact_score: float
    status: RecommendationStatusEnum
    created_at: datetime


class RecommendationListResponse(BaseResponse):
    data: List[RecommendationItem]
    total_count: int
    total_revenue_at_risk: float
    total_revenue_protected: float


class RecommendationActionRequest(BaseModel):
    action: str = Field(..., pattern="^(execute|dismiss)$")
    notes: Optional[str] = None


class RecommendationActionResponse(BaseResponse):
    data: RecommendationItem
    message: str


# ============== Patient Schemas ==============

class TimelineEvent(BaseModel):
    time: Optional[str] = None
    event: str
    status: str  # done, current, pending
    icon: str


class EDPatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    patient_id: str
    arrival_time: datetime
    triage_level: int
    chief_complaint: str
    status: str
    assigned_floor: Optional[int]
    wait_time_minutes: Optional[int]
    timeline: List[TimelineEvent] = []


class EDPatientListResponse(BaseResponse):
    data: List[EDPatientResponse]
    total_count: int


class DischargeReadyPatient(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    patient_id: str
    floor: int
    room_number: str
    doctor_name: str
    discharge_ready_since: datetime
    expected_discharge_time: Optional[datetime]
    hours_waiting: float
    procedure_type: str = "general"
    estimated_discharge_hours: float = 4.0
    countdown_status: str = "on_track"


class DischargeReadyResponse(BaseResponse):
    data: List[DischargeReadyPatient]
    total_count: int


# ============== Staff Schemas ==============

class StaffMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    employee_id: str
    name: str
    role: str
    department: str
    is_on_duty: bool
    is_available_overtime: bool
    shift_end: Optional[datetime]
    skills: List[str] = []
    specializations: List[str] = []
    certification_level: str = "basic"


class StaffListResponse(BaseResponse):
    data: List[StaffMemberResponse]
    total_on_duty: int
    available_overtime: int


# ============== Surgery Schemas ==============

class SurgeryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    surgery_id: str
    patient_id: str
    or_number: str
    surgeon_name: str
    scheduled_start: datetime
    expected_end: datetime
    actual_end: Optional[datetime]
    pacu_bay: Optional[int]
    status: str
    procedure_type: str
    is_urgent: bool


class SurgeryListResponse(BaseResponse):
    data: List[SurgeryResponse]
    total_scheduled: int
    total_delayed: int


# ============== Demo Schemas ==============

class DemoScenarioRequest(BaseModel):
    scenario_type: str = Field(..., pattern="^(monday_surge|flu_outbreak|mass_casualty|normal_day)$")
    custom_params: Optional[Dict[str, Any]] = None


class DemoScenarioResponse(BaseResponse):
    data: Dict[str, Any]
    scenario_name: str
    description: str
