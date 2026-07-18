"""
FlowSense - Reports Routes
Shift handoff and other operational reports.
"""

from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/handoff")
async def get_handoff_report():
    """Generate a shift handoff report for incoming staff."""
    try:
        from ..services.state_manager import state_manager
        latest = state_manager._latest_state
        if not latest:
            return {"success": True, "message": "No data yet", "data": None}

        status = latest.get("status", {})
        prediction = latest.get("prediction", {})
        recommendations = latest.get("recommendations", [])
        staff = latest.get("staff", [])
        ed_patients = latest.get("edPatients", [])
        discharge_ready = latest.get("dischargeReady", [])
        surgeries = latest.get("surgeries", [])
        insights = latest.get("insights", [])

        now = datetime.now()
        hour = now.hour
        if 6 <= hour < 18:
            shift_period = "Day -> Night"
            shift_label = "Night Shift (incoming)"
        else:
            shift_period = "Night -> Day"
            shift_label = "Day Shift (incoming)"

        # Build risks from insights
        top_risks = []
        for ins in insights[:3]:
            top_risks.append({
                "risk": ins.get("text", "")[:100],
                "severity": ins.get("priority", "medium"),
                "action": ins.get("suggested_action", "Monitor"),
            })

        # Pending actions from recommendations
        pending_actions = []
        for rec in recommendations[:5]:
            pending_actions.append({
                "action": rec.get("action_name", ""),
                "description": rec.get("action_description", "")[:120],
                "urgency": "high" if rec.get("priority_rank", 99) <= 2 else "medium",
                "revenue_impact": rec.get("expected_revenue_protected", 0),
            })

        # Patient activity
        waiting = len([p for p in ed_patients if p.get("status") == "waiting"])
        in_treatment = len([p for p in ed_patients if p.get("status") == "in_treatment"])

        # Staff changes
        on_duty = [s for s in staff if s.get("is_on_duty", False)]
        ot_available = [s for s in on_duty if s.get("is_available_overtime", False)]

        report = {
            "shift_period": shift_period,
            "shift_label": shift_label,
            "generated_at": now.isoformat(),
            "summary": (
                f"Boarding count is {status.get('boarding_count', 0)} "
                f"({prediction.get('peak_risk_level', 'low')} risk). "
                f"{waiting} patients still waiting. "
                f"PACU is {int(status.get('pacu_occupancy', 0) * 100)}% full. "
                f"{len(discharge_ready)} patients ready for discharge."
            ),
            "top_risks": top_risks,
            "pending_actions": pending_actions,
            "patient_changes": {
                "total_in_ed": len(ed_patients),
                "waiting": waiting,
                "in_treatment": in_treatment,
                "discharge_ready": len(discharge_ready),
                "discharged_today": status.get("discharges_today", 0),
            },
            "staff_changes": {
                "total_on_duty": len(on_duty),
                "nurses_on_duty": len([s for s in on_duty if s.get("role") == "nurse"]),
                "doctors_on_duty": len([s for s in on_duty if s.get("role") == "doctor"]),
                "overtime_available": len(ot_available),
                "overtime_names": [s.get("name", "") for s in ot_available],
            },
            "key_metrics": {
                "current_boarding": status.get("boarding_count", 0),
                "predicted_4h": prediction.get("predicted_boarding_4h", 0),
                "risk_level": prediction.get("peak_risk_level", "low"),
                "pacu_occupancy": status.get("pacu_occupancy", 0),
                "avg_wait_time": status.get("ed_wait_time_avg", 0),
                "surgeries_delayed": status.get("or_delays", 0),
            },
            "surgery_status": {
                "total": len(surgeries),
                "delayed": len([s for s in surgeries if s.get("status") == "delayed"]),
                "in_progress": len([s for s in surgeries if s.get("status") == "in_progress"]),
                "completed": len([s for s in surgeries if s.get("status") == "completed"]),
            },
        }

        return {"success": True, "message": "Handoff report generated", "data": report}
    except Exception as e:
        return {"success": False, "message": "Report unavailable", "data": None}
