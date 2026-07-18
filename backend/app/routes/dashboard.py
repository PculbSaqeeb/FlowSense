"""
FlowSense - Dashboard API Routes
Endpoints for real-time hospital status
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime

from ..schemas.schemas import (
    DashboardResponse, CurrentStatus, 
    EDPatientListResponse, EDPatientResponse, TimelineEvent,
    DischargeReadyResponse, DischargeReadyPatient,
    StaffListResponse, StaffMemberResponse,
    SurgeryListResponse, SurgeryResponse
)
from ..services.data_generator import data_generator, generate_dynamic_hospital_state

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/status", response_model=DashboardResponse)
async def get_dashboard_status():
    """
    Get current hospital status using real hospital data patterns
    
    Returns real-time metrics including:
    - ED bed occupancy
    - Boarding count
    - PACU occupancy
    - Staff ratios
    - Discharge readiness
    """
    try:
        # Generate dynamic state from real hospital data
        state = generate_dynamic_hospital_state()
        
        # Derive all values from state for consistency
        boarding = state.get("boarding_count", 8)
        ed_occupied = state.get("ed_beds_occupied", 25)
        nurse_ratio = state.get("nurse_patient_ratio", 5.0)
        nurses = max(6, int(ed_occupied / max(1, nurse_ratio)))
        
        # Map to CurrentStatus schema — all derived from state
        status = CurrentStatus(
            ed_beds_occupied=ed_occupied,
            ed_beds_total=state.get("ed_beds_total", 30),
            boarding_count=boarding,
            ed_wait_time_avg=state.get("ed_wait_time_avg", max(15, int(boarding * 4))),
            patients_left_without_seen=max(0, int(boarding * 0.15)),
            inpatient_census=state.get("inpatient_census", 145),
            inpatient_beds_total=180,
            discharge_ready_count=state.get("discharge_ready_count", 6),
            discharges_today=state.get("discharges_today", max(2, int(boarding * 0.4))),
            pacu_occupancy=state.get("pacu_occupancy", 0.85),
            or_delays=state.get("or_delays", max(0, int(boarding * 0.3))),
            surgeries_scheduled=state.get("surgeries_scheduled", 6),
            nurses_on_duty=nurses,
            nurse_patient_ratio=nurse_ratio,
            last_updated=datetime.now(),
        )
        
        return DashboardResponse(
            success=True,
            message="Dashboard status retrieved successfully",
            data=status,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard status: {str(e)}")


@router.get("/patients/ed", response_model=EDPatientListResponse)
async def get_ed_patients():
    """Get current ED patients"""
    try:
        patients_data = data_generator.generate_ed_patients(count=18)
        
        patients = []
        for p in patients_data:
            wait_time = (datetime.now() - p["arrival_time"]).total_seconds() / 60
            timeline_events = [
                TimelineEvent(time=e.get("time"), event=e.get("event", ""), status=e.get("status", "done"), icon=e.get("icon", "info"))
                for e in p.get("timeline", [])
            ]
            patients.append(EDPatientResponse(
                id=hash(p["patient_id"]) % 10000,
                patient_id=p["patient_id"],
                arrival_time=p["arrival_time"],
                triage_level=p["triage_level"],
                chief_complaint=p["chief_complaint"],
                status=p["status"],
                assigned_floor=p.get("assigned_floor"),
                wait_time_minutes=int(wait_time),
                timeline=timeline_events,
            ))
        
        return EDPatientListResponse(
            success=True,
            message="ED patients retrieved successfully",
            data=patients,
            total_count=len(patients),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get ED patients: {str(e)}")


@router.get("/patients/discharge-ready", response_model=DischargeReadyResponse)
async def get_discharge_ready_patients():
    """Get patients ready for discharge"""
    try:
        patients_data = data_generator.generate_discharge_ready_patients(count=6)
        
        patients = []
        for p in patients_data:
            hours_waiting = (datetime.now() - p["discharge_ready_since"]).total_seconds() / 3600
            patients.append(DischargeReadyPatient(
                patient_id=p["patient_id"],
                floor=p["floor"],
                room_number=p["room_number"],
                doctor_name=p["doctor_name"],
                discharge_ready_since=p["discharge_ready_since"],
                expected_discharge_time=p.get("expected_discharge_time"),
                hours_waiting=round(hours_waiting, 1),
                procedure_type=p.get("procedure_type", "general"),
                estimated_discharge_hours=p.get("estimated_discharge_hours", 4.0),
                countdown_status=p.get("countdown_status", "on_track"),
            ))
        
        return DischargeReadyResponse(
            success=True,
            message="Discharge-ready patients retrieved successfully",
            data=patients,
            total_count=len(patients),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get discharge-ready patients: {str(e)}")


@router.get("/staff/on-duty", response_model=StaffListResponse)
async def get_staff_on_duty():
    """Get staff currently on duty"""
    try:
        staff_data = data_generator.generate_staff_roster()
        
        staff = []
        for s in staff_data:
            staff.append(StaffMemberResponse(
                id=hash(s["employee_id"]) % 10000,
                employee_id=s["employee_id"],
                name=s["name"],
                role=s["role"],
                department=s["department"],
                is_on_duty=s["is_on_duty"],
                is_available_overtime=s["is_available_overtime"],
                shift_end=s.get("shift_end"),
                skills=s.get("skills", ["BLS"]),
                specializations=s.get("specializations", ["general"]),
                certification_level=s.get("certification_level", "basic"),
            ))
        
        on_duty = [s for s in staff if s.is_on_duty]
        overtime = [s for s in staff if s.is_available_overtime]
        
        return StaffListResponse(
            success=True,
            message="Staff on duty retrieved successfully",
            data=staff,
            total_on_duty=len(on_duty),
            available_overtime=len(overtime),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get staff: {str(e)}")


@router.get("/surgery/schedule", response_model=SurgeryListResponse)
async def get_surgery_schedule():
    """Get today's surgery schedule"""
    try:
        surgeries_data = data_generator.generate_surgery_schedule(count=6)
        
        surgeries = []
        for s in surgeries_data:
            surgeries.append(SurgeryResponse(
                id=hash(s["surgery_id"]) % 10000,
                surgery_id=s["surgery_id"],
                patient_id=s["patient_id"],
                or_number=s["or_number"],
                surgeon_name=s["surgeon_name"],
                scheduled_start=s["scheduled_start"],
                expected_end=s["expected_end"],
                actual_end=s.get("actual_end"),
                pacu_bay=s.get("pacu_bay"),
                status=s["status"],
                procedure_type=s["procedure_type"],
                is_urgent=s["is_urgent"],
            ))
        
        delayed = [s for s in surgeries if s.status == "delayed"]
        
        return SurgeryListResponse(
            success=True,
            message="Surgery schedule retrieved successfully",
            data=surgeries,
            total_scheduled=len(surgeries),
            total_delayed=len(delayed),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get surgery schedule: {str(e)}")
