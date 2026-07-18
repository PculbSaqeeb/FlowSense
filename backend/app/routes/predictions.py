"""
FlowSense - Prediction API Routes
Endpoints for boarding predictions
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime

from ..schemas.schemas import (
    PredictionResponse, PredictionSummary, 
    PredictionTimelineResponse, PredictionTimeline,
    RiskLevelEnum
)
from ..services.prediction_engine import predictor
from ..services.ml_engine import ml_engine
from ..services.data_generator import generate_dynamic_hospital_state

router = APIRouter(prefix="/predictions", tags=["Predictions"])


class CustomPredictionRequest(BaseModel):
    boarding_count: int = Field(default=8, ge=0, le=50)
    ed_beds_occupied: int = Field(default=28, ge=0, le=30)
    inpatient_census: int = Field(default=145, ge=0, le=200)
    discharge_ready_count: int = Field(default=6, ge=0, le=30)
    pacu_occupancy: float = Field(default=0.85, ge=0.0, le=1.0)
    nurse_patient_ratio: float = Field(default=6.0, ge=1.0, le=15.0)
    weather_condition: str = Field(default="rainy")
    temperature: int = Field(default=45, ge=-20, le=120)
    arrival_rate: float = Field(default=12.0, ge=0, le=50)
    discharge_rate: float = Field(default=3.0, ge=0, le=30)


def _build_current_state(data: dict) -> dict:
    return {
        "boarding_count": data.get("boarding_count", 8),
        "ed_beds_occupied": data.get("ed_beds_occupied", 28),
        "ed_beds_total": 30,
        "inpatient_census": data.get("inpatient_census", 145),
        "discharge_ready_count": data.get("discharge_ready_count", 6),
        "pacu_occupancy": data.get("pacu_occupancy", 0.85),
        "nurse_patient_ratio": data.get("nurse_patient_ratio", 6.0),
        "weather_condition": data.get("weather_condition", "rainy"),
        "temperature": data.get("temperature", 45),
        "triage_distribution": {1: 0.05, 2: 0.15, 3: 0.35, 4: 0.30, 5: 0.15},
        "complaint_categories": {
            "injury": 0.15, "cardiac_respiratory": 0.20, "symptoms": 0.25,
            "gi": 0.10, "mental_health": 0.10, "other": 0.20,
        },
        "avg_patient_age": 48.0,
        "avg_length_of_stay": 4.2,
        "avg_pain_grade": 3.5,
        "critical_count": max(1, int(data.get("ed_beds_occupied", 28) * 0.05)),
        "mental_health_count": max(1, int(data.get("ed_beds_occupied", 28) * 0.08)),
        "avg_triage_level": 3.0,
    }


@router.get("/current", response_model=PredictionResponse)
async def get_current_prediction():
    """
    Get current boarding prediction using dynamically generated hospital state
    """
    try:
        state = generate_dynamic_hospital_state()
        arrival_rate = 8.0 + (state["boarding_count"] * 0.5)
        discharge_rate = max(2.0, 6.0 - (state["boarding_count"] * 0.3))
        
        predictions = predictor.predict_timeline(
            current_state=state,
            horizons=[4, 6, 8, 12],
            arrival_rate=arrival_rate,
            discharge_rate=discharge_rate,
        )
        
        peak_risk, peak_time = predictor.get_peak_risk(predictions)
        
        time_to_critical = predictor.estimate_time_to_critical(
            state, arrival_rate=arrival_rate, discharge_rate=discharge_rate, threshold=15
        )
        
        summary = PredictionSummary(
            current_boarding=state["boarding_count"],
            predicted_boarding_4h=predictions[0].predicted_boarding if len(predictions) > 0 else 0,
            predicted_boarding_6h=predictions[1].predicted_boarding if len(predictions) > 1 else 0,
            predicted_boarding_8h=predictions[2].predicted_boarding if len(predictions) > 2 else 0,
            predicted_boarding_12h=predictions[3].predicted_boarding if len(predictions) > 3 else 0,
            peak_risk_level=RiskLevelEnum(peak_risk) if peak_risk in {"low","medium","high","critical"} else RiskLevelEnum.LOW,
            peak_risk_time=peak_time,
            confidence_score=predictions[1].confidence_score if len(predictions) > 1 else 0.8,
            time_to_critical=time_to_critical,
        )
        
        return PredictionResponse(
            success=True,
            message="Prediction retrieved successfully",
            data=summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get prediction: {str(e)}")


@router.post("/custom", response_model=PredictionResponse)
async def get_custom_prediction(request: CustomPredictionRequest):
    """
    Get prediction for custom hospital state - for live demo and verification.
    
    Change any input value and see the prediction change in real-time.
    This proves the ML model is actually computing predictions, not returning cached data.
    """
    try:
        state = _build_current_state(request.model_dump())
        arrival_rate = request.arrival_rate
        discharge_rate = request.discharge_rate
        
        predictions = predictor.predict_timeline(
            current_state=state,
            horizons=[4, 6, 8, 12],
            arrival_rate=arrival_rate,
            discharge_rate=discharge_rate,
        )
        
        peak_risk, peak_time = predictor.get_peak_risk(predictions)
        
        time_to_critical = predictor.estimate_time_to_critical(
            state, arrival_rate=arrival_rate, discharge_rate=discharge_rate, threshold=15
        )
        
        summary = PredictionSummary(
            current_boarding=state["boarding_count"],
            predicted_boarding_4h=predictions[0].predicted_boarding if len(predictions) > 0 else 0,
            predicted_boarding_6h=predictions[1].predicted_boarding if len(predictions) > 1 else 0,
            predicted_boarding_8h=predictions[2].predicted_boarding if len(predictions) > 2 else 0,
            predicted_boarding_12h=predictions[3].predicted_boarding if len(predictions) > 3 else 0,
            peak_risk_level=RiskLevelEnum(peak_risk) if peak_risk in {"low","medium","high","critical"} else RiskLevelEnum.LOW,
            peak_risk_time=peak_time,
            confidence_score=predictions[1].confidence_score if len(predictions) > 1 else 0.8,
            time_to_critical=time_to_critical,
        )
        
        return PredictionResponse(
            success=True,
            message="Custom prediction computed",
            data=summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute prediction: {str(e)}")


@router.get("/timeline", response_model=PredictionTimelineResponse)
async def get_prediction_timeline(
    hours: int = Query(default=12, ge=4, le=24, description="Number of hours to forecast")
):
    """
    Get prediction timeline for the next N hours using dynamic state
    """
    try:
        state = generate_dynamic_hospital_state()
        arrival_rate = 8.0 + (state["boarding_count"] * 0.5)
        discharge_rate = max(2.0, 6.0 - (state["boarding_count"] * 0.3))
        
        timeline = []
        for hour_offset in range(1, hours + 1):
            prediction = predictor.predict(
                current_state=state,
                prediction_horizon=hour_offset,
                arrival_rate=arrival_rate,
                discharge_rate=discharge_rate,
            )
            
            timeline.append(PredictionTimeline(
                timestamp=prediction.timestamp,
                prediction_horizon=prediction.prediction_horizon,
                predicted_boarding=prediction.predicted_boarding,
                confidence_score=prediction.confidence_score,
                risk_level=RiskLevelEnum(prediction.risk_level) if prediction.risk_level in {"low","medium","high","critical"} else RiskLevelEnum.LOW,
            ))
        
        return PredictionTimelineResponse(
            success=True,
            message=f"Prediction timeline for next {hours} hours retrieved",
            data=timeline,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get timeline: {str(e)}")


@router.get("/ml-metrics")
async def get_ml_metrics():
    """
    Get ML model training metrics and performance data.
    """
    try:
        summary = ml_engine.get_model_summary()
        
        if not summary.get("trained"):
            return {
                "success": True,
                "message": "ML models not yet trained",
                "data": {"trained": False},
            }
        
        state = generate_dynamic_hospital_state()
        arrival_rate = 8.0 + (state["boarding_count"] * 0.5)
        discharge_rate = max(2.0, 6.0 - (state["boarding_count"] * 0.3))
        
        test_horizons = [1, 2, 4, 6, 8, 12]
        predictions_for_test = []
        for h in test_horizons:
            pred = ml_engine.predict(state, h, arrival_rate, discharge_rate)
            predictions_for_test.append({
                "horizon_hours": h,
                "predicted_boarding": pred.predicted_boarding,
                "confidence": pred.confidence_score,
                "risk_level": pred.risk_level,
            })
        
        best_model = summary.get("best_model", "")
        models_list = summary.get("models", [])
        if not models_list:
            return {"success": True, "message": "No trained models", "data": {"trained": True, "models": []}}
        best_model_data = next(
            (m for m in models_list if m["name"] == best_model), 
            models_list[0]
        )
        
        return {
            "success": True,
            "message": "ML model metrics retrieved",
            "data": {
                "trained": True,
                "trained_at": summary["trained_at"],
                "total_samples": summary["total_samples"],
                "best_model": summary["best_model"],
                "ensemble_weights": summary["ensemble_weights"],
                "cross_val_scores": summary["cross_val_scores"],
                "models": summary["models"],
                "feature_names": summary["feature_names"],
                "top_features": best_model_data["top_features"],
                "current_predictions": predictions_for_test,
                "input_state": state,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get ML metrics: {str(e)}")


class ScenarioRequest(BaseModel):
    """Extended prediction request with intervention parameters."""
    # Current state
    boarding_count: int = Field(default=8, ge=0, le=50)
    ed_beds_occupied: int = Field(default=28, ge=0, le=30)
    inpatient_census: int = Field(default=145, ge=0, le=200)
    discharge_ready_count: int = Field(default=6, ge=0, le=30)
    pacu_occupancy: float = Field(default=0.85, ge=0.0, le=1.0)
    nurse_patient_ratio: float = Field(default=6.0, ge=1.0, le=15.0)
    weather_condition: str = Field(default="rainy")
    temperature: int = Field(default=45, ge=-20, le=120)
    arrival_rate: float = Field(default=12.0, ge=0, le=50)
    discharge_rate: float = Field(default=3.0, ge=0, le=30)
    # Interventions
    extra_nurses: int = Field(default=0, ge=0, le=10)
    extra_beds: int = Field(default=0, ge=0, le=15)
    expedite_discharges: bool = False
    cancel_elective_surgery: bool = False


@router.post("/simulate")
async def simulate_scenario(request: ScenarioRequest):
    """Run what-if scenario with interventions and return before/after comparison."""
    try:
        # Build baseline state
        baseline_state = _build_current_state(request.model_dump())
        baseline_state["ed_beds_total"] = 30
        base_arrival = request.arrival_rate
        base_discharge = request.discharge_rate

        # Baseline prediction
        baseline_predictions = predictor.predict_timeline(
            current_state=baseline_state, horizons=[4, 6, 8, 12],
            arrival_rate=base_arrival, discharge_rate=base_discharge,
        )
        baseline_pred = {
            "current_boarding": request.boarding_count,
            "predicted_4h": round(baseline_predictions[0].predicted_boarding, 1) if baseline_predictions else 0,
            "predicted_6h": round(baseline_predictions[1].predicted_boarding, 1) if len(baseline_predictions) > 1 else 0,
            "predicted_8h": round(baseline_predictions[2].predicted_boarding, 1) if len(baseline_predictions) > 2 else 0,
            "predicted_12h": round(baseline_predictions[3].predicted_boarding, 1) if len(baseline_predictions) > 3 else 0,
            "risk_level": "low",
            "confidence": round(baseline_predictions[1].confidence_score, 2) if len(baseline_predictions) > 1 else 0.8,
        }
        peak_risk, _ = predictor.get_peak_risk(baseline_predictions)
        baseline_pred["risk_level"] = peak_risk

        # Build simulated state with interventions
        sim_state = dict(baseline_state)
        sim_arrival = base_arrival
        sim_discharge = base_discharge

        # Apply interventions
        if request.extra_nurses > 0:
            current_nurses = max(1, int(request.ed_beds_occupied / max(1, request.nurse_patient_ratio)))
            new_nurses = current_nurses + request.extra_nurses
            sim_state["nurse_patient_ratio"] = round(request.ed_beds_occupied / max(1, new_nurses), 1)

        if request.extra_beds > 0:
            sim_state["ed_beds_occupied"] = max(0, request.ed_beds_occupied - request.extra_beds)
            sim_state["boarding_count"] = max(0, request.boarding_count - request.extra_beds)

        if request.expedite_discharges:
            sim_discharge = base_discharge + 3.0
            sim_state["discharge_ready_count"] = max(0, request.discharge_ready_count - 3)

        if request.cancel_elective_surgery:
            sim_state["pacu_occupancy"] = max(0.3, request.pacu_occupancy - 0.20)

        # Simulated prediction
        sim_predictions = predictor.predict_timeline(
            current_state=sim_state, horizons=[4, 6, 8, 12],
            arrival_rate=sim_arrival, discharge_rate=sim_discharge,
        )
        sim_pred = {
            "current_boarding": sim_state["boarding_count"],
            "predicted_4h": round(sim_predictions[0].predicted_boarding, 1) if sim_predictions else 0,
            "predicted_6h": round(sim_predictions[1].predicted_boarding, 1) if len(sim_predictions) > 1 else 0,
            "predicted_8h": round(sim_predictions[2].predicted_boarding, 1) if len(sim_predictions) > 2 else 0,
            "predicted_12h": round(sim_predictions[3].predicted_boarding, 1) if len(sim_predictions) > 3 else 0,
            "risk_level": "low",
            "confidence": round(sim_predictions[1].confidence_score, 2) if len(sim_predictions) > 1 else 0.8,
        }
        sim_peak_risk, _ = predictor.get_peak_risk(sim_predictions)
        sim_pred["risk_level"] = sim_peak_risk

        # Calculate impact delta
        boarding_reduction = baseline_pred["predicted_6h"] - sim_pred["predicted_6h"]
        revenue_delta = max(0, boarding_reduction) * 5000
        risk_improvement = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        risk_delta = risk_improvement.get(baseline_pred["risk_level"], 0) - risk_improvement.get(sim_pred["risk_level"], 0)

        # Generate recommendations for simulated state
        from ..services.recommendation_engine import recommendation_engine
        rec_pred = predictor.predict(
            current_state=sim_state, prediction_horizon=6,
            arrival_rate=sim_arrival, discharge_rate=sim_discharge,
        )
        discharge_ready = [
            {"patient_id": f"PT{i:03d}", "doctor_name": f"Dr. Smith", "floor": 3}
            for i in range(1, sim_state.get("discharge_ready_count", 6) + 1)
        ]
        import random
        staff = [{"employee_id": f"N{i:03d}", "is_available_overtime": random.random() < 0.25} for i in range(1, 13)]
        surgeries = [{"surgery_id": f"SG{i:03d}", "is_urgent": random.random() < 0.2, "surgeon_name": "Dr. Wilson"} for i in range(1, 7)]
        recs = recommendation_engine.generate_recommendations(
            prediction=rec_pred, current_state=sim_state,
            discharge_ready=discharge_ready, staff=staff, surgeries=surgeries,
        )

        return {
            "success": True,
            "message": "Scenario simulated",
            "data": {
                "baseline": baseline_pred,
                "simulated": sim_pred,
                "impact": {
                    "boarding_reduction": round(boarding_reduction, 1),
                    "revenue_protected": round(revenue_delta, 0),
                    "risk_improvement": risk_delta,
                    "risk_change": f"{baseline_pred['risk_level']} -> {sim_pred['risk_level']}" if risk_delta != 0 else "No change",
                },
                "simulated_state": {
                    "nurse_patient_ratio": sim_state.get("nurse_patient_ratio"),
                    "ed_beds_occupied": sim_state.get("ed_beds_occupied"),
                    "pacu_occupancy": sim_state.get("pacu_occupancy"),
                    "discharge_ready_count": sim_state.get("discharge_ready_count"),
                },
                "recommendations": [
                    {
                        "action_name": r.action.action_name,
                        "action_description": r.reasoning[:120],
                        "expected_revenue_protected": round(r.expected_revenue_protected, 0),
                        "expected_patients_helped": r.expected_patients_helped,
                        "priority_rank": r.priority_rank,
                    }
                    for r in recs[:4]
                ],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
