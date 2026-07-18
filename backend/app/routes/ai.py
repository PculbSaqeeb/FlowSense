"""
FlowSense - AI Chat Route
Natural language hospital intelligence.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(req: ChatRequest):
    """Process a voice/text command and return a natural language response."""
    try:
        from ..services.state_manager import state_manager
        latest = state_manager._latest_state
        if not latest:
            return {"success": True, "data": {"response": "No hospital data available yet. Please wait a moment."}}

        msg = req.message.lower().strip()
        current = latest.get("status", {})
        prediction = latest.get("prediction", {})
        recommendations = latest.get("recommendations", [])
        patients = latest.get("edPatients", [])

        response = ""

        if any(w in msg for w in ["risk", "level", "crisis", "danger"]):
            risk = prediction.get("peak_risk_level", "unknown")
            boarding = current.get("boarding_count", 0)
            p4h = prediction.get("predicted_boarding_4h", 0)
            p6h = prediction.get("predicted_boarding_6h", 0)
            response = (
                f"Current risk level is {risk}. "
                f"Boarding count is {boarding}. "
                f"Predicted to be {p4h} in 4 hours and {p6h} in 6 hours. "
            )
            if risk in ("critical", "high"):
                response += "Immediate action is recommended."
            elif risk == "medium":
                response += "Situation is elevated. Monitor closely."
            else:
                response += "Situation is stable for now."

        elif any(w in msg for w in ["how many", "boarding", "patient", "count", "wait"]):
            boarding = current.get("boarding_count", 0)
            beds_occ = current.get("ed_beds_occupied", 0)
            beds_total = current.get("ed_beds_total", 0)
            wait = current.get("ed_wait_time_avg", 0)
            response = (
                f"Currently {boarding} patients are boarding. "
                f"ED beds occupied: {beds_occ} of {beds_total}. "
                f"Average wait time is {wait} minutes."
            )
            if boarding >= 15:
                response += " This is above the crisis threshold of 15."

        elif any(w in msg for w in ["what should", "recommend", "do", "action", "suggest"]):
            if recommendations:
                top = recommendations[0]
                response = (
                    f"Top recommendation: {top.get('action_name', 'Unknown')}. "
                    f"{top.get('action_description', '')} "
                    f"This would help {top.get('expected_patients_helped', 0)} patients "
                    f"and protect ${top.get('expected_revenue_protected', 0):,} in revenue."
                )
                if len(recommendations) > 1:
                    response += f" There are {len(recommendations)} total recommendations available."
            else:
                response = "No active recommendations. The department is running smoothly."

        elif any(w in msg for w in ["predict", "forecast", "future", "next", "hours"]):
            p4h = prediction.get("predicted_boarding_4h", 0)
            p6h = prediction.get("predicted_boarding_6h", 0)
            risk = prediction.get("peak_risk_level", "unknown")
            response = (
                f"Boarding forecast: {p4h} patients in 4 hours, {p6h} in 6 hours. "
                f"Risk level is predicted to be {risk}. "
            )
            if p4h > 15 or p6h > 15:
                response += "Warning: boarding is expected to exceed crisis threshold."
            else:
                response += "Boarding is expected to stay below crisis levels."

        elif any(w in msg for w in ["bed", "availability", "room", "free"]):
            beds_occ = current.get("ed_beds_occupied", 0)
            beds_total = current.get("ed_beds_total", 30)
            available = beds_total - beds_occ
            response = (
                f"Currently {available} of {beds_total} ED beds are available. "
                f"{beds_occ} beds are occupied. "
            )
            if available <= 3:
                response += "Bed availability is very low. Consider expediting discharges."

        elif any(w in msg for w in ["staff", "nurse", "doctor", "team", "shift"]):
            staff_list = latest.get("staff", [])
            total_staff = len(staff_list)
            nurses = sum(1 for s in staff_list if "nurse" in s.get("role", "").lower())
            response = (
                f"There are {total_staff} staff members on duty, including {nurses} nurses. "
            )
            if total_staff < 15:
                response += "Staffing is below optimal levels."

        elif any(w in msg for w in ["surgery", "surgical", "procedure"]):
            surgeries = latest.get("surgeries", [])
            active = sum(1 for s in surgeries if s.get("status") == "in_progress")
            response = (
                f"There are {len(surgeries)} surgeries scheduled today. "
                f"{active} currently in progress."
            )

        elif any(w in msg for w in ["hello", "hi", "hey"]):
            boarding = current.get("boarding_count", 0)
            risk = prediction.get("peak_risk_level", "unknown")
            response = (
                f"Hello! I am FlowSense AI assistant. "
                f"Current boarding count is {boarding} with {risk} risk level. "
                f"How can I help you?"
            )

        elif any(w in msg for w in ["help", "command", "what can you"]):
            response = (
                "You can ask me about: "
                "risk level and crisis status, "
                "how many patients are boarding, "
                "what actions to take, "
                "bed availability, "
                "staff on duty, "
                "surgery schedule, "
                "or predictions for the next few hours."
            )

        elif any(w in msg for w in ["thank", "thanks"]):
            response = "You are welcome! Let me know if you need anything else."

        else:
            boarding = current.get("boarding_count", 0)
            risk = prediction.get("peak_risk_level", "unknown")
            response = (
                f"I heard: {req.message}. "
                f"Currently {boarding} patients are boarding with {risk} risk level. "
                f"Try asking about risk level, boarding count, recommendations, or bed availability."
            )

        return {"success": True, "data": {"response": response}}

    except Exception as e:
        return {"success": True, "data": {"response": f"Sorry, I encountered an error: {str(e)}"}}
