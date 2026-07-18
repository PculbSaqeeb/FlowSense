"""
FlowSense - Background State Manager
Generates hospital state on a timer and pushes to SSE subscribers.
Rotates through scenarios so the dashboard always shows varied risk levels.
Persists metrics to SQLite for historical analytics.
"""

import asyncio
import random
from datetime import datetime
from typing import Dict, List, Optional
from ..services.data_generator import generate_dynamic_hospital_state, HospitalDataGenerator
from ..services.prediction_engine import predictor
from ..services.recommendation_engine import recommendation_engine
from ..models.database_models import HospitalMetrics
from ..core.database import db_manager

# Scenario rotation — ensures all risk levels appear within ~2 minutes
SCENARIOS = [
    {"name": "normal",    "boarding_range": (2, 6),   "ed_range": (10, 18),  "surge_mult": 0.9},
    {"name": "normal",    "boarding_range": (4, 8),   "ed_range": (15, 22),  "surge_mult": 1.0},
    {"name": "busy",      "boarding_range": (8, 12),  "ed_range": (20, 26),  "surge_mult": 1.3},
    {"name": "surge",     "boarding_range": (12, 16), "ed_range": (24, 28),  "surge_mult": 1.8},
    {"name": "busy",      "boarding_range": (6, 10),  "ed_range": (18, 24),  "surge_mult": 1.1},
    {"name": "crisis",    "boarding_range": (16, 22), "ed_range": (26, 30),  "surge_mult": 2.5},
]

WEATHER_IMPACT = {
    "sunny":  {"score": 0.0,  "note": "Clear weather — no expected impact on ER volume", "icon": "sun"},
    "cloudy": {"score": 0.05, "note": "Overcast conditions — minimal impact expected", "icon": "cloud"},
    "rainy":  {"score": 0.23, "note": "Rainy days see 23% more ER visits based on Texas hospital data", "icon": "cloud-rain"},
    "stormy": {"score": 0.35, "note": "Storms increase ER visits by 35% — trauma and weather-related injuries spike", "icon": "cloud-lightning"},
    "snowy":  {"score": 0.40, "note": "Snow and ice increases falls and vehicle accidents — 40% more ER visits historically", "icon": "snowflake"},
}


class ImpactTracker:
    """Tracks cumulative financial and patient impact over time."""

    def __init__(self):
        self.total_revenue_saved: float = 0.0
        self.total_patients_helped: int = 0
        self.total_hours_saved: int = 0
        self.recommendations_executed: int = 0
        self.daily_history: List[Dict] = []
        self._current_date: Optional[str] = None
        self._daily_revenue: float = 0.0
        self._daily_patients: int = 0
        self._daily_hours: int = 0

    def record_cycle(self, recommendations: List[Dict], risk_level: str):
        """Record impact from a single state cycle."""
        today = datetime.now().strftime("%Y-%m-%d")

        # Reset daily counters at midnight
        if self._current_date and self._current_date != today:
            self.daily_history.append({
                "date": self._current_date,
                "revenue": round(self._daily_revenue, 0),
                "patients": self._daily_patients,
                "hours": self._daily_hours,
            })
            # Keep last 30 days
            if len(self.daily_history) > 30:
                self.daily_history = self.daily_history[-30:]
            self._daily_revenue = 0.0
            self._daily_patients = 0
            self._daily_hours = 0

        self._current_date = today

        # Simulate: each cycle, top recommendation has 25-35% chance of execution
        # Higher risk = higher execution probability
        exec_prob = {"low": 0.15, "medium": 0.25, "high": 0.35, "critical": 0.45}.get(risk_level, 0.25)

        if recommendations and random.random() < exec_prob:
            top = recommendations[0]
            revenue = top.get("expected_revenue_protected", 0) * 0.3
            patients = top.get("expected_patients_helped", 0)
            hours = top.get("expected_time_saved", 0)
            self.total_revenue_saved += revenue
            self.total_patients_helped += patients
            self.total_hours_saved += hours
            self.recommendations_executed += 1
            self._daily_revenue += revenue
            self._daily_patients += patients
            self._daily_hours += hours

    def get_summary(self) -> Dict:
        return {
            "today": {
                "revenue_saved": round(self._daily_revenue, 0),
                "patients_helped": self._daily_patients,
                "hours_saved": self._daily_hours,
                "recommendations_executed": self.recommendations_executed,
            },
            "all_time": {
                "revenue_saved": round(self.total_revenue_saved, 0),
                "patients_helped": self.total_patients_helped,
                "hours_saved": self.total_hours_saved,
            },
            "daily_history": self.daily_history,
        }


def generate_insights(state: Dict, prediction: Dict, recommendations: List[Dict],
                      staff: List[Dict], surgeries: List[Dict]) -> List[Dict]:
    """Generate plain-English AI insights from current hospital state."""
    insights = []
    boarding = state.get("boarding_count", 0)
    pacu = state.get("pacu_occupancy", 0)
    nurse_ratio = state.get("nurse_patient_ratio", 5)
    discharge_ready = state.get("discharge_ready_count", 0)
    weather = state.get("weather_condition", "sunny")
    ttc = prediction.get("time_to_critical")
    risk = prediction.get("peak_risk_level", "low")

    # Crisis/timing insight
    if ttc and ttc < 120:
        insights.append({
            "category": "risk", "priority": "critical",
            "text": f"Hospital could reach crisis level within {ttc // 60}h {(ttc % 60)}m. "
                    f"Current boarding is {boarding} patients. Immediate action recommended.",
            "metric": "boarding",
            "suggested_action": "Execute top priority recommendation now",
        })
    elif boarding >= 15:
        insights.append({
            "category": "risk", "priority": "critical",
            "text": f"{boarding} patients are waiting for beds right now — crisis level. "
                    f"Without action, ambulance diversions may be needed within the hour.",
            "metric": "boarding",
            "suggested_action": "Open overflow area and call overtime staff",
        })
    elif boarding >= 10:
        insights.append({
            "category": "risk", "priority": "high",
            "text": f"Boarding count is {boarding} and trending upward. "
                    f"If the trend continues, crisis level could be reached in the next few hours.",
            "metric": "boarding",
            "suggested_action": "Expedite discharges to free beds",
        })

    # PACU insight
    if pacu > 0.85:
        pacu_pct = int(pacu * 100)
        beds_needed = max(1, int((pacu - 0.7) * 20))
        insights.append({
            "category": "bottleneck", "priority": "high",
            "text": f"Recovery room is {pacu_pct}% full — blocking new surgeries. "
                    f"Freeing {beds_needed} PACU beds would allow surgeries to proceed and reduce downstream boarding.",
            "metric": "pacu",
            "suggested_action": "Move stable PACU patients to floor beds",
        })
    elif pacu > 0.75:
        pacu_pct = int(pacu * 100)
        insights.append({
            "category": "bottleneck", "priority": "medium",
            "text": f"Recovery room is {pacu_pct}% full. At this rate, new surgeries may need to be delayed.",
            "metric": "pacu",
            "suggested_action": "Monitor PACU closely",
        })

    # Nurse insight
    if nurse_ratio > 5.5:
        nurses_needed = max(1, int((nurse_ratio - 4.0) * 2))
        new_ratio = round(nurse_ratio * 0.7, 1)
        ot_nurses = len([s for s in staff if s.get("is_available_overtime", False)])
        insights.append({
            "category": "staff", "priority": "high" if nurse_ratio > 6.5 else "medium",
            "text": f"Each nurse is covering {nurse_ratio:.1f} patients — above the safe threshold of 4. "
                    f"Calling in {nurses_needed} overtime nurses would bring the ratio down to ~{new_ratio}. "
                    f"{ot_nurses} nurses are currently available for overtime.",
            "metric": "staff",
            "suggested_action": f"Call {min(nurses_needed, ot_nurses)} overtime nurses",
        })

    # Discharge insight
    if discharge_ready >= 5:
        beds_freed = min(discharge_ready, 6)
        revenue = beds_freed * 8000
        insights.append({
            "category": "action", "priority": "high",
            "text": f"{discharge_ready} patients are ready to go home but still occupying beds. "
                    f"Focused discharge effort could free up to {beds_freed} beds, "
                    f"preventing an estimated ${revenue:,} in boarding costs.",
            "metric": "discharge",
            "suggested_action": "Contact discharge doctors for paperwork status",
        })

    # Weather insight
    if weather in ("rainy", "stormy", "snowy"):
        wi = WEATHER_IMPACT.get(weather, {})
        increase = int(wi.get("score", 0) * 100)
        insights.append({
            "category": "pattern", "priority": "medium",
            "text": f"{wi.get('note', '')}. Expect {increase}% more ER volume than normal. "
                    f"Consider opening the quick-treat area proactively.",
            "metric": "weather",
            "suggested_action": "Open fast-track / quick-treat area",
        })

    # Day-of-week pattern
    today = datetime.now()
    if today.weekday() in (0, 5, 6):  # Mon, Sat, Sun
        day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][today.weekday()]
        insights.append({
            "category": "pattern", "priority": "low",
            "text": f"{day_name}s are historically busier than average. "
                    f"Consider pre-positioning extra staff for the expected surge.",
            "metric": "pattern",
            "suggested_action": "Review staffing levels for the rest of the shift",
        })

    # Surgery insight
    delayed_surgeries = [s for s in surgeries if s.get("status") == "delayed"]
    if delayed_surgeries:
        insights.append({
            "category": "surgery", "priority": "medium",
            "text": f"{len(delayed_surgeries)} surgeries are currently delayed. "
                    f"Each hour of delay costs approximately $2,000 in OR idle time. "
                    f"Resolving PACU bottleneck could unblock these surgeries.",
            "metric": "surgery",
            "suggested_action": "Prioritize PACU discharge to free OR capacity",
        })

    # Sort by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    insights.sort(key=lambda x: priority_order.get(x["priority"], 99))

    return insights[:5]  # Max 5 insights


class StateManager:
    """Background task that generates hospital state and pushes to SSE clients."""

    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []
        self._task: asyncio.Task | None = None
        self._latest_state: Dict = {}
        self._interval: int = 30  # seconds
        self._cycle_count: int = 0
        self._data_gen: Optional[HospitalDataGenerator] = None
        self._impact_tracker = ImpactTracker()
        self._db_save_count: int = 0

    @property
    def is_running(self) -> bool:
        return self._task is not None and not self._task.done()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        if self._latest_state:
            try:
                q.put_nowait(self._latest_state)
            except asyncio.QueueFull:
                pass
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    def _generate_full_state(self) -> Dict:
        """Generate complete hospital state with scenario rotation."""
        scenario = SCENARIOS[self._cycle_count % len(SCENARIOS)]
        self._cycle_count += 1

        # Get base state from real data
        state = generate_dynamic_hospital_state()

        # Override with scenario values for guaranteed variety
        state["boarding_count"] = random.randint(*scenario["boarding_range"])
        state["ed_beds_occupied"] = random.randint(*scenario["ed_range"])
        state["discharge_ready_count"] = random.randint(2, 10)
        state["nurse_patient_ratio"] = round(random.uniform(3.5, 8.5), 1)
        state["pacu_occupancy"] = round(random.uniform(0.5, 0.98), 2)
        state["inpatient_census"] = random.randint(130, 160)
        state["ed_wait_time_avg"] = max(10, int(state["boarding_count"] * 4 + random.randint(-8, 8)))
        state["or_delays"] = max(0, int(state["boarding_count"] * 0.3 + random.randint(-1, 2)))
        state["discharges_today"] = random.randint(2, 12)

        # Scenario-aware arrival/discharge rates
        # Normal: balanced flow (discharge can exceed arrival)
        # Busy/Surge/Crisis: increasingly positive net flow
        scenario_name = scenario["name"]
        if scenario_name == "normal":
            arrival_rate = random.uniform(6.0, 9.0)
            discharge_rate = random.uniform(6.0, 9.0)
        elif scenario_name == "busy":
            arrival_rate = random.uniform(10.0, 14.0)
            discharge_rate = random.uniform(4.0, 7.0)
        else:  # surge or crisis
            arrival_rate = 8.0 + (state["boarding_count"] * 0.5)
            discharge_rate = max(2.0, 6.0 - (state["boarding_count"] * 0.3))

        # Predictions
        try:
            predictions = predictor.predict_timeline(
                current_state=state, horizons=[4, 6, 8, 12],
                arrival_rate=arrival_rate, discharge_rate=discharge_rate,
            )
            peak_risk, peak_time = predictor.get_peak_risk(predictions)
            time_to_critical = predictor.estimate_time_to_critical(
                state, arrival_rate=arrival_rate, discharge_rate=discharge_rate, threshold=15
            )
            prediction = {
                "current_boarding": state["boarding_count"],
                "predicted_boarding_4h": round(predictions[0].predicted_boarding, 1) if len(predictions) > 0 else 0,
                "predicted_boarding_6h": round(predictions[1].predicted_boarding, 1) if len(predictions) > 1 else 0,
                "predicted_boarding_8h": round(predictions[2].predicted_boarding, 1) if len(predictions) > 2 else 0,
                "predicted_boarding_12h": round(predictions[3].predicted_boarding, 1) if len(predictions) > 3 else 0,
                "peak_risk_level": peak_risk,
                "peak_risk_time": peak_time.isoformat() if isinstance(peak_time, datetime) else str(peak_time),
                "confidence_score": round(predictions[1].confidence_score, 2) if len(predictions) > 1 else 0.8,
                "time_to_critical": time_to_critical,
            }
            timeline = [
                {
                    "timestamp": p.timestamp.isoformat() if hasattr(p, "timestamp") else datetime.now().isoformat(),
                    "prediction_horizon": p.prediction_horizon if hasattr(p, "prediction_horizon") else 0,
                    "predicted_boarding": round(p.predicted_boarding, 1),
                    "confidence_score": round(p.confidence_score, 2),
                    "risk_level": p.risk_level if hasattr(p, "risk_level") else "low",
                }
                for p in predictions
            ]
        except Exception as e:
            print(f"[SSE] Prediction error: {e}")
            prediction = {
                "current_boarding": state["boarding_count"],
                "predicted_boarding_4h": 0, "predicted_boarding_6h": 0,
                "predicted_boarding_8h": 0, "predicted_boarding_12h": 0,
                "peak_risk_level": "low", "peak_risk_time": datetime.now().isoformat(),
                "confidence_score": 0, "time_to_critical": None,
            }
            timeline = []

        # Recommendations
        staff = []
        surgeries = []
        try:
            rec_pred = predictor.predict(
                current_state=state, prediction_horizon=6,
                arrival_rate=arrival_rate, discharge_rate=discharge_rate,
            )
            discharge_ready = [
                {"patient_id": f"PT{i:03d}", "doctor_name": f"Dr. {'Smith' if i % 3 == 0 else 'Jones' if i % 3 == 1 else 'Lee'}", "floor": 3 + (i % 3)}
                for i in range(1, max(2, state.get("discharge_ready_count", 6) + 1))
            ]
            staff = [
                {"employee_id": f"N{i:03d}", "is_available_overtime": random.random() < 0.25}
                for i in range(1, 13)
            ] + [
                {"employee_id": f"D{i:03d}", "is_available_overtime": random.random() < 0.15}
                for i in range(1, 6)
            ]
            surgeries = [
                {"surgery_id": f"SG{i:03d}", "is_urgent": random.random() < 0.2, "surgeon_name": f"Dr. {'Wilson' if i % 2 == 0 else 'Lee'}"}
                for i in range(1, 7)
            ]
            recs = recommendation_engine.generate_recommendations(
                prediction=rec_pred, current_state=state,
                discharge_ready=discharge_ready, staff=staff, surgeries=surgeries,
            )
            recommendations = [
                {
                    "id": i + 1,
                    "action_id": r.action.action_id,
                    "action_name": r.action.action_name,
                    "action_description": r.reasoning,
                    "target_person": r.target_person,
                    "target_department": r.target_department,
                    "target_patients": r.target_patients or [],
                    "expected_revenue_protected": round(r.expected_revenue_protected, 0),
                    "expected_patients_helped": r.expected_patients_helped,
                    "expected_time_saved": r.expected_time_saved,
                    "confidence": round(r.confidence, 2),
                    "priority_rank": r.priority_rank,
                    "impact_score": round(r.impact_score, 2),
                    "status": "pending",
                    "created_at": datetime.now().isoformat(),
                }
                for i, r in enumerate(recs)
            ]
        except Exception as e:
            print(f"[SSE] Recommendations error: {e}")
            recommendations = []

        # Dashboard status
        now = datetime.now()
        ed_wait = max(15, int(state["boarding_count"] * 3.5 + (state["nurse_patient_ratio"] - 4) * 8))
        status = {
            "ed_beds_occupied": state["ed_beds_occupied"],
            "ed_beds_total": state.get("ed_beds_total", 30),
            "boarding_count": state["boarding_count"],
            "ed_wait_time_avg": ed_wait,
            "patients_left_without_seen": max(0, int(state["boarding_count"] * 0.15)),
            "inpatient_census": state.get("inpatient_census", 145),
            "inpatient_beds_total": 180,
            "discharge_ready_count": state.get("discharge_ready_count", 6),
            "discharges_today": max(2, int(state["boarding_count"] * 0.4)),
            "pacu_occupancy": state.get("pacu_occupancy", 0.85),
            "or_delays": max(0, int(state["boarding_count"] * 0.2)),
            "surgeries_scheduled": 6,
            "nurses_on_duty": max(6, int(30 / max(1, state.get("nurse_patient_ratio", 5)))),
            "nurse_patient_ratio": state.get("nurse_patient_ratio", 5.0),
            "last_updated": now.isoformat(),
        }

        # ED patients
        if self._data_gen is None:
            self._data_gen = HospitalDataGenerator()
        gen = self._data_gen
        ed_count = max(8, min(22, state["ed_beds_occupied"] + random.randint(-2, 3)))
        raw_ed = gen.generate_ed_patients(count=ed_count)
        ed_patients = [
            {
                "id": i + 1,
                "patient_id": p.get("patient_id", f"PT{i+1:03d}"),
                "arrival_time": str(p.get("arrival_time", "")),
                "triage_level": p.get("triage_level", 3),
                "chief_complaint": p.get("chief_complaint", "General"),
                "status": p.get("status", "waiting"),
                "assigned_floor": p.get("assigned_floor"),
                "wait_time_minutes": p.get("wait_time_minutes", max(5, (state.get("boarding_count", 8) * 5) + (i * 3))),
                "timeline": p.get("timeline", []),
            }
            for i, p in enumerate(raw_ed)
        ]

        # Discharge ready
        dr_count = max(2, min(10, state.get("discharge_ready_count", 6) + random.randint(-1, 2)))
        raw_dr = gen.generate_discharge_ready_patients(count=dr_count)
        discharge_ready_list = [
            {
                "patient_id": p.get("patient_id", f"PT{i+1:03d}"),
                "floor": p.get("floor", 3),
                "room_number": p.get("room_number", f"{300+i+1}"),
                "doctor_name": p.get("doctor_name", f"Dr. {'Smith' if i % 3 == 0 else 'Jones' if i % 3 == 1 else 'Lee'}"),
                "discharge_ready_since": str(p.get("discharge_ready_since", "")),
                "expected_discharge_time": str(p.get("expected_discharge_time", "")),
                "hours_waiting": max(0.5, round((state.get("boarding_count", 8) * 0.3) + i * 0.5, 1)),
                "procedure_type": p.get("procedure_type", "general"),
                "estimated_discharge_hours": p.get("estimated_discharge_hours", 4.0),
                "countdown_status": p.get("countdown_status", "on_track"),
            }
            for i, p in enumerate(raw_dr)
        ]

        # Staff
        raw_staff = gen.generate_staff_roster()
        staff_list = [
            {
                "id": i + 1,
                "employee_id": s.get("employee_id", f"N{i+1:03d}"),
                "name": s.get("name", f"Nurse {i+1}"),
                "role": s.get("role", "nurse"),
                "department": s.get("department", "Emergency"),
                "is_on_duty": s.get("is_on_duty", True),
                "is_available_overtime": s.get("is_available_overtime", i < 2),
                "shift_end": str(s.get("shift_end", "")),
                "skills": s.get("skills", ["BLS"]),
                "specializations": s.get("specializations", ["general"]),
                "certification_level": s.get("certification_level", "basic"),
            }
            for i, s in enumerate(raw_staff)
        ]

        # Surgery schedule
        raw_surg = gen.generate_surgery_schedule(count=6)
        surgeries = [
            {
                "id": i + 1,
                "surgery_id": s.get("surgery_id", f"SG{i+1:03d}"),
                "patient_id": s.get("patient_id", f"PT{i+1:03d}"),
                "or_number": s.get("or_number", f"OR{i+1}"),
                "surgeon_name": s.get("surgeon_name", f"Dr. {'Wilson' if i % 2 == 0 else 'Lee'}"),
                "scheduled_start": str(s.get("scheduled_start", "")),
                "expected_end": str(s.get("expected_end", "")),
                "actual_end": str(s.get("actual_end", "")) if s.get("actual_end") else None,
                "pacu_bay": s.get("pacu_bay", i + 1),
                "status": s.get("status", "scheduled"),
                "procedure_type": s.get("procedure_type", "General"),
                "is_urgent": s.get("is_urgent", False),
            }
            for i, s in enumerate(raw_surg)
        ]

        # Weather impact
        weather_cond = state.get("weather_condition", "sunny")
        weather_data = WEATHER_IMPACT.get(weather_cond, WEATHER_IMPACT["sunny"])

        # AI Insights
        insights = generate_insights(state, prediction, recommendations, staff, surgeries)

        # Record impact
        self._impact_tracker.record_cycle(recommendations, prediction.get("peak_risk_level", "low"))

        # Escalation tracking
        try:
            from ..routes.escalation import update_escalations
            escalation_status = update_escalations(
                prediction_risk=prediction.get("peak_risk_level", "low"),
                current_boarding=prediction.get("current_boarding", 0),
            )
        except Exception:
            escalation_status = []

        full_state = {
            "status": status,
            "prediction": prediction,
            "timeline": timeline,
            "recommendations": recommendations,
            "edPatients": ed_patients,
            "dischargeReady": discharge_ready_list,
            "staff": staff_list,
            "surgeries": surgeries,
            "weather": {
                "condition": weather_cond,
                "temperature": state.get("temperature", 70),
                "impact_score": weather_data["score"],
                "historical_note": weather_data["note"],
                "icon": weather_data["icon"],
            },
            "insights": insights,
            "impact": self._impact_tracker.get_summary(),
            "escalations": escalation_status,
            "timestamp": datetime.now().isoformat(),
        }

        return full_state

    async def _save_metrics(self, state: Dict, prediction: Dict):
        """Persist hospital metrics to database for historical analytics."""
        try:
            status = state.get("status", {})
            metric = HospitalMetrics(
                timestamp=datetime.now(),
                ed_beds_occupied=status.get("ed_beds_occupied", 0),
                boarding_count=status.get("boarding_count", 0),
                ed_wait_time_avg=float(status.get("ed_wait_time_avg", 0)),
                patients_left_without_seen=status.get("patients_left_without_seen", 0),
                inpatient_census=status.get("inpatient_census", 0),
                discharges_today=status.get("discharges_today", 0),
                discharge_ready_count=status.get("discharge_ready_count", 0),
                surgeries_scheduled=status.get("surgeries_scheduled", 6),
                pacu_occupancy=status.get("pacu_occupancy", 0),
                or_delays=status.get("or_delays", 0),
                nurses_on_duty=status.get("nurses_on_duty", 0),
                nurse_patient_ratio=status.get("nurse_patient_ratio", 5.0),
                weather_condition=state.get("weather", {}).get("condition", "sunny"),
                temperature=state.get("weather", {}).get("temperature", 70),
                is_weekend=datetime.now().weekday() >= 5,
                arrival_rate=8.0 + (status.get("boarding_count", 0) * 0.5),
                discharge_rate=max(2.0, 6.0 - (status.get("boarding_count", 0) * 0.3)),
                bed_utilization=status.get("ed_beds_occupied", 0) / max(1, status.get("ed_beds_total", 30)),
            )
            await db_manager.insert_one(metric)
        except Exception as e:
            print(f"[WARNING] DB write failed: {e}")

    async def _broadcast(self, data: Dict):
        """Send data to all subscribers."""
        dead: List[asyncio.Queue] = []
        for q in self._subscribers:
            try:
                q.put_nowait(data)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self._subscribers.remove(q)

    async def _run(self):
        """Background loop: generate state every N seconds, retrain model every 5 min."""
        from ..services.ml_engine import ml_engine
        print(f"[SSE] State manager started (interval={self._interval}s)")
        retrain_interval = 300
        cycles_since_retrain = 0
        loop = asyncio.get_event_loop()
        while True:
            try:
                state = await loop.run_in_executor(None, self._generate_full_state)
                self._latest_state = state
                await self._broadcast(state)
                cycles_since_retrain += 1
                self._db_save_count += 1

                # Save to DB every cycle (every 30s)
                if self._db_save_count % 2 == 0:  # Every 60s to reduce DB writes
                    await self._save_metrics(state, state.get("prediction", {}))

                # Retrain model periodically
                if cycles_since_retrain * self._interval >= retrain_interval:
                    try:
                        print("[SSE] Retraining ML model...")
                        await loop.run_in_executor(None, ml_engine.train, 180)
                        print("[SSE] ML model retrained successfully")
                    except Exception as e:
                        print(f"[SSE] Retrain failed: {e}")
                    cycles_since_retrain = 0

                print(f"[SSE] State pushed to {len(self._subscribers)} clients")
            except Exception as e:
                print(f"[SSE] Error generating state: {e}")
            await asyncio.sleep(self._interval)

    def start(self):
        if not self.is_running:
            self._task = asyncio.create_task(self._run())

    def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()


# Singleton
state_manager = StateManager()
