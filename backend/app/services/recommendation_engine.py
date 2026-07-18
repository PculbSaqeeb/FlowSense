"""
FlowSense - Recommendation Engine
Generates actionable recommendations based on predictions
"""

from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
from .prediction_engine import PredictionResult


@dataclass
class Action:
    """Represents an available action"""
    action_id: str
    action_name: str
    action_description: str
    category: str  # discharge, staff, overflow, surgery, diversion
    
    # Requirements
    requires_discharge_ready: bool = False
    requires_overflow_space: bool = False
    requires_off_duty_staff: bool = False
    requires_or_schedule: bool = False
    
    # Impact
    base_revenue_protected: float = 0.0
    base_patients_helped: int = 0
    base_time_saved: int = 0  # Minutes
    
    # Execution
    execution_time: int = 30  # Minutes to execute
    cost: float = 0.0


@dataclass
class RecommendationResult:
    """A generated recommendation"""
    id: int
    action: Action
    target_person: Optional[str] = None
    target_department: Optional[str] = None
    target_patients: List[str] = field(default_factory=list)
    
    # Calculated impact
    expected_revenue_protected: float = 0.0
    expected_patients_helped: int = 0
    expected_time_saved: int = 0
    confidence: float = 0.0
    
    # Priority
    priority_rank: int = 0
    impact_score: float = 0.0
    
    # Context
    prediction_id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)
    reasoning: str = ""


class RecommendationEngine:
    """
    Generates actionable recommendations based on predictions and current state.
    """
    
    # Available actions in the hospital
    ACTIONS = {
        "A001": Action(
            action_id="A001",
            action_name="Send Patients Home Faster",
            action_description="Contact doctors to finish discharge paperwork so patients who are ready can leave",
            category="discharge",
            requires_discharge_ready=True,
            base_revenue_protected=8000,
            base_patients_helped=1,
            base_time_saved=60,
            execution_time=90,
            cost=0.0,
        ),
        "A002": Action(
            action_id="A002",
            action_name="Open Extra Beds",
            action_description="Set up Conference Room B as a temporary treatment area to handle the extra patients",
            category="overflow",
            requires_overflow_space=True,
            base_revenue_protected=5000,
            base_patients_helped=1,
            base_time_saved=45,
            execution_time=45,
            cost=500.0,
        ),
        "A003": Action(
            action_id="A003",
            action_name="Call In Extra Nurses",
            action_description="Reach out to nurses who are off duty to come in and help with the extra workload",
            category="staff",
            requires_off_duty_staff=True,
            base_revenue_protected=2000,
            base_patients_helped=1,
            base_time_saved=30,
            execution_time=60,
            cost=800.0,
        ),
        "A004": Action(
            action_id="A004",
            action_name="Reschedule Planned Surgeries",
            action_description="Postpone surgeries that can wait so the recovery room has space for ER overflow",
            category="surgery",
            requires_or_schedule=True,
            base_revenue_protected=15000,
            base_patients_helped=2,
            base_time_saved=120,
            execution_time=30,
            cost=0.0,
        ),
        "A005": Action(
            action_id="A005",
            action_name="Open Quick-Treat Area",
            action_description="Open the fast-track area for minor cases so the main ER has more room for serious patients",
            category="diversion",
            base_revenue_protected=3000,
            base_patients_helped=4,
            base_time_saved=20,
            execution_time=15,
            cost=200.0,
        ),
        "A006": Action(
            action_id="A006",
            action_name="Redirect Ambulances",
            action_description="Ask ambulances to take new patients to nearby hospitals until things calm down",
            category="diversion",
            base_revenue_protected=1000,
            base_patients_helped=1,
            base_time_saved=10,
            execution_time=10,
            cost=0.0,
        ),
    }
    
    def __init__(self):
        """Initialize recommendation engine"""
        self.recommendation_counter = 0
    
    def check_feasibility(
        self,
        action: Action,
        current_state: Dict,
        discharge_ready: List[Dict],
        staff: List[Dict],
        surgeries: List[Dict]
    ) -> bool:
        """Check if an action is feasible given current state"""
        
        if action.requires_discharge_ready:
            if not discharge_ready or len(discharge_ready) < 2:
                return False
        
        if action.requires_overflow_space:
            # Check if overflow room is available
            # In real system, check room status
            pass
        
        if action.requires_off_duty_staff:
            available_overtime = [s for s in staff if s.get("is_available_overtime", False)]
            if len(available_overtime) < 1:
                return False
        
        if action.requires_or_schedule:
            non_urgent = [s for s in surgeries if not s.get("is_urgent", True)]
            if len(non_urgent) < 1:
                return False
        
        return True
    
    def calculate_impact(
        self,
        action: Action,
        prediction: PredictionResult,
        current_state: Dict,
        discharge_ready: List[Dict]
    ) -> Dict:
        """Calculate expected impact of an action"""
        
        # Base impact
        revenue = action.base_revenue_protected
        patients = action.base_patients_helped
        time_saved = action.base_time_saved
        
        # Adjust based on prediction severity
        if prediction.risk_level == "critical":
            revenue *= 1.5
            patients = max(patients, 3)
        elif prediction.risk_level == "high":
            revenue *= 1.2
            patients = max(patients, 2)
        
        # Adjust for discharge-ready patients
        if action.action_id == "A001" and discharge_ready:
            revenue = len(discharge_ready) * 8000
            patients = len(discharge_ready)
            time_saved = len(discharge_ready) * 60
        
        # Calculate confidence
        confidence = prediction.confidence_score
        
        # Adjust confidence based on feasibility
        if action.category == "discharge":
            confidence *= 0.95  # High confidence in discharge actions
        elif action.category == "staff":
            confidence *= 0.85  # Staff availability can vary
        elif action.category == "surgery":
            confidence *= 0.90  # Surgery delays are controllable
        
        return {
            "revenue_protected": round(revenue, 2),
            "patients_helped": patients,
            "time_saved": time_saved,
            "confidence": round(confidence, 2),
        }
    
    def calculate_priority_score(
        self,
        impact: Dict,
        execution_time: int,
        cost: float,
        risk_level: str
    ) -> float:
        """Calculate priority score for ranking"""
        
        # Weights
        revenue_weight = 0.4
        patients_weight = 0.3
        confidence_weight = 0.2
        speed_weight = 0.1
        
        # Normalize values
        revenue_score = min(1.0, impact["revenue_protected"] / 50000)
        patients_score = min(1.0, impact["patients_helped"] / 5)
        confidence_score = impact["confidence"]
        speed_score = max(0, 1.0 - (execution_time / 120))  # Faster is better
        
        # Risk multiplier
        risk_multiplier = {
            "low": 0.8,
            "medium": 1.0,
            "high": 1.2,
            "critical": 1.5,
        }.get(risk_level, 1.0)
        
        # Calculate score
        score = (
            revenue_score * revenue_weight +
            patients_score * patients_weight +
            confidence_score * confidence_weight +
            speed_score * speed_weight
        ) * risk_multiplier
        
        # Penalize high-cost actions
        if cost > 0:
            cost_penalty = min(0.2, cost / 10000)
            score *= (1 - cost_penalty)
        
        return round(score, 2)
    
    def generate_recommendations(
        self,
        prediction: PredictionResult,
        current_state: Dict,
        discharge_ready: List[Dict],
        staff: List[Dict],
        surgeries: List[Dict]
    ) -> List[RecommendationResult]:
        """
        Generate ranked recommendations based on prediction and current state
        
        Args:
            prediction: Current prediction result
            current_state: Current hospital state
            discharge_ready: List of discharge-ready patients
            staff: List of staff members
            surgeries: List of scheduled surgeries
        
        Returns:
            List of RecommendationResult sorted by priority
        """
        recommendations = []
        
        # Check each action
        for action_id, action in self.ACTIONS.items():
            # Check feasibility
            if not self.check_feasibility(action, current_state, discharge_ready, staff, surgeries):
                continue
            
            # Calculate impact
            impact = self.calculate_impact(
                action, prediction, current_state, discharge_ready
            )
            
            # Skip if impact is negligible
            if impact["revenue_protected"] == 0 and impact["patients_helped"] == 0:
                continue
            
            # Calculate priority score
            priority_score = self.calculate_priority_score(
                impact,
                action.execution_time,
                action.cost,
                prediction.risk_level
            )
            
            # Determine target
            target_person, target_department, target_patients = self._determine_target(
                action, discharge_ready, staff, surgeries
            )
            
            # Generate reasoning
            reasoning = self._generate_reasoning(
                action, prediction, current_state, target_patients
            )
            
            self.recommendation_counter += 1
            
            recommendation = RecommendationResult(
                id=self.recommendation_counter,
                action=action,
                target_person=target_person,
                target_department=target_department,
                target_patients=target_patients,
                expected_revenue_protected=impact["revenue_protected"],
                expected_patients_helped=impact["patients_helped"],
                expected_time_saved=impact["time_saved"],
                confidence=impact["confidence"],
                priority_rank=0,  # Will be set after sorting
                impact_score=priority_score,
                prediction_id=None,
                created_at=datetime.now(),
                reasoning=reasoning,
            )
            
            recommendations.append(recommendation)
        
        # Sort by priority score and assign ranks
        recommendations.sort(key=lambda r: r.impact_score, reverse=True)
        for i, rec in enumerate(recommendations):
            rec.priority_rank = i + 1
        
        return recommendations
    
    def _determine_target(
        self,
        action: Action,
        discharge_ready: List[Dict],
        staff: List[Dict],
        surgeries: List[Dict]
    ) -> tuple:
        """Determine target person/department/patients for action"""
        
        target_person = None
        target_department = None
        target_patients = []
        
        if action.action_id == "A001":  # Expedite Discharges
            # Group by doctor
            doctor_counts = {}
            for patient in discharge_ready:
                doctor = patient.get("doctor_name", "Unknown")
                if doctor not in doctor_counts:
                    doctor_counts[doctor] = []
                doctor_counts[doctor].append(patient["patient_id"])
            
            # Pick doctor with most discharge-ready patients
            if doctor_counts:
                target_person = max(doctor_counts, key=lambda k: len(doctor_counts[k]))
                target_patients = doctor_counts[target_person]
                target_department = "Floor"
        
        elif action.action_id == "A003":  # Call Off-Duty Staff
            available = [s for s in staff if s.get("is_available_overtime", False)]
            if available:
                target_person = "Off-duty Nurses"
                target_department = "Emergency"
        
        elif action.action_id == "A004":  # Delay Elective Surgeries
            non_urgent = [s for s in surgeries if not s.get("is_urgent", True)]
            if non_urgent:
                target_person = non_urgent[0].get("surgeon_name", "OR Scheduler")
                target_department = "Surgery"
                target_patients = [s.get("patient_id", s.get("surgery_id", "")) for s in non_urgent[:2]]
        
        return target_person, target_department, target_patients
    
    def _generate_reasoning(
        self,
        action: Action,
        prediction: PredictionResult,
        current_state: Dict,
        target_patients: List[str]
    ) -> str:
        """Generate simple, plain-language reasoning for recommendation"""
        
        reasoning_parts = []
        
        # Add prediction context — plain language
        boarding = prediction.current_boarding
        predicted = prediction.predicted_boarding
        hours = prediction.prediction_horizon
        reasoning_parts.append(
            f"Right now {boarding} patients are waiting for beds. "
            f"This could grow to {predicted} within {hours} hours."
        )
        
        # Add action-specific reasoning — simple words
        if action.action_id == "A001":
            reasoning_parts.append(
                f"Sending home {len(target_patients)} patients who are ready will free up beds "
                f"for the ones who are still waiting."
            )
        
        elif action.action_id == "A002":
            reasoning_parts.append(
                "Opening the extra room gives 4 more beds to treat patients who are stuck."
            )
        
        elif action.action_id == "A003":
            reasoning_parts.append(
                "More nurses means each nurse has fewer patients, so everyone gets seen faster."
            )
        
        elif action.action_id == "A004":
            reasoning_parts.append(
                "Putting off surgeries that can wait frees up the recovery room, "
                f"which helps clear the backup in the ER."
            )
        
        elif action.action_id == "A005":
            reasoning_parts.append(
                "Treating minor cases in a separate area keeps the main ER free for serious emergencies."
            )
        
        elif action.action_id == "A006":
            reasoning_parts.append(
                "Redirecting ambulances temporarily gives the hospital breathing room to catch up."
            )
        
        # Add contributing factors — plain language
        if prediction.contributing_factors:
            factors = prediction.contributing_factors[:2]
            factor_text = "; ".join(factors)
            reasoning_parts.append(f"What's making it busy: {factor_text}")
        
        return " ".join(reasoning_parts)
    
    def estimate_combined_impact(
        self,
        recommendations: List[RecommendationResult]
    ) -> Dict:
        """Estimate combined impact of all recommendations"""
        
        total_revenue = sum(r.expected_revenue_protected for r in recommendations)
        total_patients = sum(r.expected_patients_helped for r in recommendations)
        total_cost = sum(r.action.cost for r in recommendations)
        total_time_saved = sum(r.expected_time_saved for r in recommendations)
        
        return {
            "total_revenue_protected": round(total_revenue, 2),
            "total_patients_helped": total_patients,
            "total_cost": round(total_cost, 2),
            "net_impact": round(total_revenue - total_cost, 2),
            "total_time_saved_minutes": total_time_saved,
        }


# Singleton instance
recommendation_engine = RecommendationEngine()
