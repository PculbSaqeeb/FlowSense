"""
FlowSense - Bed Availability Prediction Route
Predicts when beds will free up based on discharge-ready patients.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/beds", tags=["beds"])


@router.get("/availability")
async def get_bed_availability():
    """
    Predict bed availability for the next 12 hours based on
    discharge-ready patients and current occupancy.
    """
    try:
        from ..services.state_manager import state_manager
        state = state_manager._latest_state

        total_beds = 30
        occupied = state.get("ed_beds_occupied", 28) if state else 28
        boarding = state.get("boarding_count", 8) if state else 8
        discharge_ready = state.get("discharge_ready_count", 6) if state else 6

        available = max(0, total_beds - occupied)
        now = datetime.now()

        # Build 12-hour timeline
        timeline = []
        rooms_freed = []

        for h in range(13):
            hour_time = now + timedelta(hours=h)
            label = hour_time.strftime("%I%p").lstrip("0").lower()

            # Simulate bed freeing: discharge-ready patients free up gradually
            # First 2 hours: 40% discharge, hours 3-6: 30%, hours 7-12: rest
            if h == 0:
                freed_by_hour = 0
            elif h <= 2:
                freed_by_hour = int(discharge_ready * 0.4 * (h / 2))
            elif h <= 6:
                freed_by_hour = int(discharge_ready * 0.4 + discharge_ready * 0.3 * ((h - 2) / 4))
            else:
                freed_by_hour = int(discharge_ready * 0.7 + discharge_ready * 0.3 * ((h - 6) / 6))

            freed_by_hour = min(freed_by_hour, discharge_ready)
            beds_available = min(total_beds, available + freed_by_hour)
            beds_occupied = total_beds - beds_available

            if beds_available <= 0:
                status = "full"
            elif beds_available <= 3:
                status = "tight"
            else:
                status = "available"

            timeline.append({
                "hour": h,
                "label": label,
                "beds_available": beds_available,
                "beds_occupied": beds_occupied,
                "beds_total": total_beds,
                "status": status,
            })

        # Rooms that will free up (simulated)
        room_names = ["301A", "302B", "304C", "305A", "306B", "308C"]
        for i in range(min(discharge_ready, len(room_names))):
            free_hour = 1 + (i * 2)  # stagger: 1h, 3h, 5h, etc.
            rooms_freed.append({
                "room": room_names[i],
                "free_in_hours": free_hour,
                "patient_id": f"PT{100 + i:03d}",
            })

        # Next free hour
        next_free = 0
        for t in timeline:
            if t["beds_available"] > available:
                next_free = t["hour"]
                break

        next_free_label = f"in {next_free}h" if next_free > 0 else "Now"

        return {
            "success": True,
            "message": "Bed availability predicted",
            "data": {
                "current_available": available,
                "current_occupied": occupied,
                "total_beds": total_beds,
                "next_free_hour": next_free,
                "next_free_label": next_free_label,
                "timeline": timeline,
                "rooms_freed": rooms_freed,
            },
        }
    except Exception as e:
        return {
            "success": False,
            "message": "Bed availability unavailable",
            "data": {
                "current_available": 2,
                "current_occupied": 28,
                "total_beds": 30,
                "next_free_hour": 2,
                "next_free_label": "in 2h",
                "timeline": [],
                "rooms_freed": [],
            },
        }
