"""
FlowSense - Alert Escalation Route
Tracks escalation levels and allows acknowledgment.
"""

from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/escalation", tags=["escalation"])

# In-memory escalation state (resets on server restart — fine for demo)
_escalations: dict[int, dict] = {}
_ESCALATION_LEVELS = ["none", "nurse", "charge_nurse", "attending", "admin"]
_ESCALATION_INTERVAL_MINUTES = 30


def _get_escalation_level(elapsed_minutes: float) -> str:
    """Determine escalation level based on how long an alert has been active."""
    idx = min(int(elapsed_minutes / _ESCALATION_INTERVAL_MINUTES), len(_ESCALATION_LEVELS) - 1)
    return _ESCALATION_LEVELS[idx]


def update_escalations(prediction_risk: str, current_boarding: int) -> list[dict]:
    """
    Called by state_manager on each push to auto-escalate high/critical alerts.
    Returns list of active escalations for inclusion in SSE payload.
    """
    now = datetime.now()

    # Auto-create escalation for high/critical risk
    if prediction_risk in ("high", "critical") and current_boarding >= 10:
        alert_id = 1  # single consolidated escalation for demo
        if alert_id not in _escalations:
            _escalations[alert_id] = {
                "alert_id": alert_id,
                "first_triggered_at": now.isoformat(),
                "current_level": "nurse",
                "last_escalated_at": now.isoformat(),
                "acknowledged": False,
            }
        else:
            esc = _escalations[alert_id]
            if not esc["acknowledged"]:
                elapsed = (now - datetime.fromisoformat(esc["first_triggered_at"])).total_seconds() / 60
                new_level = _get_escalation_level(elapsed)
                if new_level != esc["current_level"]:
                    esc["current_level"] = new_level
                    esc["last_escalated_at"] = now.isoformat()
    else:
        # Risk dropped — clear escalation
        if 1 in _escalations and not _escalations[1].get("acknowledged", False):
            del _escalations[1]

    return get_active_escalations()


def get_active_escalations() -> list[dict]:
    """Get current active escalations."""
    result = []
    now = datetime.now()
    for alert_id, esc in _escalations.items():
        if esc["acknowledged"]:
            continue
        elapsed = (now - datetime.fromisoformat(esc["first_triggered_at"])).total_seconds() / 60
        current_level = _get_escalation_level(elapsed)
        result.append({
            "alert_id": alert_id,
            "current_level": current_level,
            "triggered_at": esc["first_triggered_at"],
            "last_escalated_at": esc["last_escalated_at"],
            "acknowledged": False,
            "elapsed_minutes": round(elapsed, 0),
        })
    return result


@router.get("/status")
async def get_escalation_status():
    """Get current escalation status."""
    escalations = get_active_escalations()
    return {
        "success": True,
        "message": "Escalation status retrieved",
        "data": {
            "active_escalations": escalations,
            "total_escalated": len(escalations),
        },
    }


@router.post("/acknowledge/{alert_id}")
async def acknowledge_escalation(alert_id: int):
    """Acknowledge an alert to stop escalation."""
    if alert_id in _escalations:
        _escalations[alert_id]["acknowledged"] = True
        return {
            "success": True,
            "message": f"Alert {alert_id} acknowledged",
            "data": {"acknowledged": True},
        }
    return {
        "success": False,
        "message": f"Alert {alert_id} not found",
        "data": {"acknowledged": False},
    }
