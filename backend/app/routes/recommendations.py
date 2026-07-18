"""
FlowSense - Recommendation API Routes
Endpoints for actionable recommendations
"""

from fastapi import APIRouter, HTTPException, Path
from datetime import datetime

from ..schemas.schemas import (
    RecommendationListResponse, RecommendationItem,
    RecommendationActionRequest, RecommendationActionResponse,
    RecommendationStatusEnum
)
from ..services.prediction_engine import predictor
from ..services.recommendation_engine import recommendation_engine
from ..services.data_generator import data_generator, generate_dynamic_hospital_state

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/active", response_model=RecommendationListResponse)
async def get_active_recommendations():
    """
    Get current active recommendations
    
    Returns ranked list of actionable recommendations
    with impact estimates and priority scores
    """
    try:
        state = generate_dynamic_hospital_state()
        arrival_rate = 8.0 + (state["boarding_count"] * 0.5)
        discharge_rate = max(2.0, 6.0 - (state["boarding_count"] * 0.3))
        
        prediction = predictor.predict(
            current_state=state,
            prediction_horizon=6,
            arrival_rate=arrival_rate,
            discharge_rate=discharge_rate,
        )
        
        # Get supporting data from the data generator
        discharge_raw = data_generator.generate_discharge_ready_patients(count=8)
        discharge_ready = [
            {
                "patient_id": p["patient_id"],
                "doctor_name": p["doctor_name"],
                "floor": p["floor"],
            }
            for p in discharge_raw
        ]
        
        staff_raw = data_generator.generate_staff_roster()
        staff = [
            {
                "employee_id": s["employee_id"],
                "is_available_overtime": s.get("is_available_overtime", False),
            }
            for s in staff_raw
        ]
        
        surgeries_raw = data_generator.generate_surgery_schedule(count=8)
        surgeries = [
            {
                "surgery_id": s["surgery_id"],
                "is_urgent": s.get("is_urgent", False),
                "surgeon_name": s.get("surgeon_name", "Unknown"),
            }
            for s in surgeries_raw
        ]
        
        # Generate recommendations
        recommendations = recommendation_engine.generate_recommendations(
            prediction=prediction,
            current_state=state,
            discharge_ready=discharge_ready,
            staff=staff,
            surgeries=surgeries,
        )
        
        # Get combined impact
        combined_impact = recommendation_engine.estimate_combined_impact(recommendations)
        
        # Convert to response format
        items = []
        for rec in recommendations:
            items.append(RecommendationItem(
                id=rec.id,
                action_id=rec.action.action_id,
                action_name=rec.action.action_name,
                action_description=rec.action.action_description,
                target_person=rec.target_person,
                target_department=rec.target_department,
                target_patients=rec.target_patients,
                expected_revenue_protected=rec.expected_revenue_protected,
                expected_patients_helped=rec.expected_patients_helped,
                expected_time_saved=rec.expected_time_saved,
                confidence=rec.confidence,
                priority_rank=rec.priority_rank,
                impact_score=rec.impact_score,
                status=RecommendationStatusEnum.PENDING,
                created_at=rec.created_at,
            ))
        
        return RecommendationListResponse(
            success=True,
            message="Active recommendations retrieved",
            data=items,
            total_count=len(items),
            total_revenue_at_risk=prediction.predicted_boarding * 5000,
            total_revenue_protected=combined_impact["total_revenue_protected"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


@router.post("/{recommendation_id}/execute", response_model=RecommendationActionResponse)
async def execute_recommendation(
    recommendation_id: int = Path(..., description="Recommendation ID"),
    request: RecommendationActionRequest = None
):
    """
    Execute a recommendation
    
    Marks the recommendation as executing and logs the action
    """
    try:
        # In real app, this would update the database
        # For demo, we return a success response
        
        return RecommendationActionResponse(
            success=True,
            message=f"Recommendation {recommendation_id} is now being executed",
            data=RecommendationItem(
                id=recommendation_id,
                action_id="A001",
                action_name="Expedite Discharges",
                action_description="Contact doctors to expedite discharge paperwork",
                target_person="Dr. Smith",
                target_department="Floor 3",
                target_patients=["PT001", "PT002", "PT003"],
                expected_revenue_protected=24000,
                expected_patients_helped=3,
                expected_time_saved=180,
                confidence=0.92,
                priority_rank=1,
                impact_score=0.95,
                status=RecommendationStatusEnum.EXECUTING,
                created_at=datetime.now(),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute recommendation: {str(e)}")


@router.post("/{recommendation_id}/dismiss", response_model=RecommendationActionResponse)
async def dismiss_recommendation(
    recommendation_id: int = Path(..., description="Recommendation ID"),
    request: RecommendationActionRequest = None
):
    """
    Dismiss a recommendation
    
    Marks the recommendation as dismissed
    """
    try:
        return RecommendationActionResponse(
            success=True,
            message=f"Recommendation {recommendation_id} has been dismissed",
            data=RecommendationItem(
                id=recommendation_id,
                action_id="A001",
                action_name="Expedite Discharges",
                action_description="Contact doctors to expedite discharge paperwork",
                target_person="Dr. Smith",
                target_department="Floor 3",
                target_patients=[],
                expected_revenue_protected=0,
                expected_patients_helped=0,
                expected_time_saved=0,
                confidence=0,
                priority_rank=1,
                impact_score=0,
                status=RecommendationStatusEnum.DISMISSED,
                created_at=datetime.now(),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dismiss recommendation: {str(e)}")
