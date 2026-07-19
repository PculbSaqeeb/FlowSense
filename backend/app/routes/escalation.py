"""
FlowSense - Alert Escalation Route
Tracks escalation levels and allows acknowledgment.

Concurrency note: ``_escalations`` is mutated from two threads —
the SSE background loop (running in a thread executor) calls
``update_escalations`` while the event-loop thread serves
``acknowledge_escalation`` and ``get_escalation_status`` HTTP routes.
A module-level ``threading.Lock`` guards all reads and writes to keep
the dict stable across iterations / mutations.
"""

import threading
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/escalation", tags=["escalation"])

# In-memory escalation state (resets on server restart — fine for demo)
_escalations: dict[int, dict] = {}
_escalations_lock = threading.Lock()
_ESCALATION_LEVELS = ["none", "nurse", "charge_nurse", "attending", "admin"]
_ESCALATION_INTERVAL_MINUTES = 30


def _get_escalation_level(elapsed_minutes: float) -> str:
    """Determine escalation level based on how long an alert has been active."""
    idx = min(int(elapsed_minutes / _ESCALATION_INTERVAL_MINUTES), len(_ESCALATION_LEVELS) - 1)
    return _ESCALATION_LEVELS[idx]


def update_escalations(prediction_risk: str, current_boarding: int) -> list[dict]:
    """
    Called by state_manager on each push to auto-escalate high/critical alerts.
    Returns list of active escalations for inclusion in SSE payload. Thread-safe.
    """
    now = datetime.now()

    with _escalations_lock:
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
            # Risk dropped — clear escalation. Snapshot the keys to delete
            # so we don't mutate the dict while iterating.
            to_delete = [
                aid for aid, esc in _escalations.items()
                if not esc.get("acknowledged", False)
            ]
            for aid in to_delete:
                del _escalations[aid]

        # Build the snapshot under the lock so iteration is safe.
        escalations = [
            {
                "alert_id": aid,
                "current_level": _get_escalation_level(
                    (now - datetime.fromisoformat(esc["first_triggered_at"])).total_seconds() / 60
                ),
                "triggered_at": esc["first_triggered_at"],
                "last_escalated_at": esc["last_escalated_at"],
                "acknowledged": False,
                "elapsed_minutes": round(
                    (now - datetime.fromisoformat(esc["first_triggered_at"])).total_seconds() / 60, 0
                ),
            }
            for aid, esc in _escalations.items()
            if not esc.get("acknowledged", False)
        ]

    return escalations


def get_active_escalations() -> list[dict]:
    """Get current active escalations (thread-safe)."""
    with _escalations_lock:
        now = datetime.now()
        result = []
        for alert_id, esc in _escalations.items():
            if esc.get("acknowledged", False):
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
    with _escalations_lock:
        if alert_id in _escalations:
            _escalations[alert_id]["acknowledged"] = True
            acknowledged = True
        else:
            acknowledged = False

    if acknowledged:
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
