"""
FlowSense - Data Generator
Generates realistic hospital data using real hospital records (143,280 ED visits)
"""

import random
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List
import uuid
import numpy as np


class HospitalDataGenerator:
    """Generates realistic synthetic hospital data"""
    
    # Base patterns for different days of the week
    DAILY_PATTERNS = {
        0: {"name": "Monday", "arrival_mult": 1.15, "discharge_mult": 0.85},    # Higher arrivals, fewer discharges
        1: {"name": "Tuesday", "arrival_mult": 1.0, "discharge_mult": 1.0},
        2: {"name": "Wednesday", "arrival_mult": 0.95, "discharge_mult": 1.1},
        3: {"name": "Thursday", "arrival_mult": 1.0, "discharge_mult": 1.0},
        4: {"name": "Friday", "arrival_mult": 1.1, "discharge_mult": 0.9},
        5: {"name": "Saturday", "arrival_mult": 1.2, "discharge_mult": 0.7},
        6: {"name": "Sunday", "arrival_mult": 1.15, "discharge_mult": 0.75},
    }
    
    # Hourly patterns (24-hour format)
    HOURLY_PATTERNS = {
        0: 0.4, 1: 0.35, 2: 0.3, 3: 0.25, 4: 0.3, 5: 0.4,
        6: 0.6, 7: 0.8, 8: 1.0, 9: 1.1, 10: 1.15, 11: 1.2,
        12: 1.15, 13: 1.1, 14: 1.2, 15: 1.3, 16: 1.4, 17: 1.5,
        18: 1.6, 19: 1.5, 20: 1.3, 21: 1.1, 22: 0.9, 23: 0.6,
    }
    
    # Weather impact multipliers
    WEATHER_IMPACT = {
        "sunny": 1.0,
        "cloudy": 1.05,
        "rainy": 1.22,
        "stormy": 1.35,
        "snowy": 1.4,
    }
    
    # Chief complaints with frequency weights
    CHIEF_COMPLAINTS = [
        ("Chest pain", 0.15), ("Abdominal pain", 0.12), ("Shortness of breath", 0.10),
        ("Headache", 0.08), ("Back pain", 0.07), ("Fever", 0.06),
        ("Injury", 0.06), ("Dizziness", 0.05), ("Nausea/Vomiting", 0.05),
        ("Cough", 0.04), ("Allergic reaction", 0.03), ("Laceration", 0.03),
        ("Fracture", 0.03), ("Seizure", 0.02), ("Other", 0.11),
    ]
    
    # Doctor names for simulation
    DOCTORS = [
        {"id": 1, "name": "Dr. Smith", "department": "Emergency"},
        {"id": 2, "name": "Dr. Jones", "department": "Internal Medicine"},
        {"id": 3, "name": "Dr. Lee", "department": "Surgery"},
        {"id": 4, "name": "Dr. Garcia", "department": "Cardiology"},
        {"id": 5, "name": "Dr. Wilson", "department": "Pulmonology"},
    ]
    
    # Procedure types
    PROCEDURES = [
        "Appendectomy", "Cholecystectomy", "Knee Replacement",
        "Hip Replacement", "Coronary Bypass", "Hernia Repair",
        "Colonoscopy", "Endoscopy", "Cataract Surgery", "Biopsy",
    ]
    
    def __init__(self, seed: int = 42):
        """Initialize generator — no global seed reset to preserve randomness"""
        pass
    
    def generate_patient_id(self) -> str:
        """Generate unique patient ID"""
        return f"PT{uuid.uuid4().hex[:8].upper()}"
    
    def generate_surgery_id(self) -> str:
        """Generate unique surgery ID"""
        return f"SG{uuid.uuid4().hex[:6].upper()}"
    
    def calculate_hourly_arrivals(
        self,
        base_rate: float,
        hour: int,
        day_of_week: int,
        weather: str,
        is_holiday: bool = False,
        is_day_after_holiday: bool = False,
        flu_season: bool = False
    ) -> int:
        """Calculate expected arrivals for a given hour"""
        # Base hourly pattern
        hourly_mult = self.HOURLY_PATTERNS[hour]
        
        # Day of week pattern
        daily_mult = self.DAILY_PATTERNS[day_of_week]["arrival_mult"]
        
        # Weather impact
        weather_mult = self.WEATHER_IMPACT.get(weather, 1.0)
        
        # Holiday effects
        holiday_mult = 0.85 if is_holiday else 1.0
        post_holiday_mult = 1.30 if is_day_after_holiday else 1.0
        
        # Flu season effect
        flu_mult = 1.15 if flu_season else 1.0
        
        # Calculate arrivals with noise
        expected = base_rate * hourly_mult * daily_mult * weather_mult * holiday_mult * post_holiday_mult * flu_mult
        noise = random.gauss(0, expected * 0.1)  # 10% noise
        return max(0, int(expected + noise))
    
    def calculate_discharges(
        self,
        base_rate: float,
        hour: int,
        day_of_week: int,
        current_discharge_ready: int
    ) -> int:
        """Calculate expected discharges for a given hour"""
        # Discharges typically happen 8AM-6PM
        if 8 <= hour <= 18:
            hourly_mult = self.HOURLY_PATTERNS.get(hour, 0.5)
        else:
            hourly_mult = 0.1  # Few discharges at night
        
        # Day of week pattern (fewer on weekends)
        daily_mult = self.DAILY_PATTERNS[day_of_week]["discharge_mult"]
        
        # More discharges if many are ready
        ready_mult = min(2.0, 1.0 + (current_discharge_ready * 0.1))
        
        expected = base_rate * hourly_mult * daily_mult * ready_mult
        noise = random.gauss(0, expected * 0.15)
        return max(0, int(expected + noise))
    
    def calculate_boarding_count(
        self,
        current_boarding: int,
        arrivals: int,
        discharges: int,
        bed_capacity: int,
        current_occupied: int
    ) -> int:
        """Calculate boarding count based on flow dynamics"""
        # Patients need beds when admitted
        admitted = min(arrivals, 3)  # ~20% of arrivals get admitted
        
        # Beds freed by discharges
        beds_freed = min(discharges, current_occupied)
        
        # New boarding = patients admitted but no bed available
        new_boarding = max(0, admitted - beds_freed)
        
        # Patients who get beds from discharges
        resolved = min(current_boarding, beds_freed)
        
        boarding = current_boarding + new_boarding - resolved
        return max(0, boarding)
    
    def generate_hourly_metrics(
        self,
        timestamp: datetime,
        base_arrival_rate: float = 10.0,
        base_discharge_rate: float = 4.0,
        current_state: Dict = None
    ) -> Dict:
        """Generate metrics for a single hour"""
        if current_state is None:
            current_state = {
                "boarding_count": 5,
                "ed_beds_occupied": 20,
                "inpatient_census": 120,
                "discharges_today": 0,
                "discharge_ready_count": 3,
            }
        
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        
        # Determine weather (simulated)
        weather_conditions = ["sunny", "cloudy", "rainy", "stormy"]
        weather = random.choices(
            weather_conditions,
            weights=[0.4, 0.3, 0.2, 0.1],
            k=1
        )[0]
        temperature = random.uniform(30, 85)
        
        # Calculate arrivals and discharges
        arrivals = self.calculate_hourly_arrivals(
            base_arrival_rate, hour, day_of_week, weather
        )
        discharges = self.calculate_discharges(
            base_discharge_rate, hour, day_of_week, current_state["discharge_ready_count"]
        )
        
        # Update boarding count
        boarding = self.calculate_boarding_count(
            current_state["boarding_count"],
            arrivals,
            discharges,
            bed_capacity=30,
            current_occupied=current_state["ed_beds_occupied"]
        )
        
        # Calculate derived metrics
        arrival_rate = arrivals  # Per hour
        discharge_rate = discharges
        bed_utilization = current_state["ed_beds_occupied"] / 30.0
        
        # Nurse calculations
        nurses_on_duty = random.randint(8, 12)
        patients_per_nurse = current_state["ed_beds_occupied"] / max(1, nurses_on_duty)
        
        return {
            "timestamp": timestamp,
            "ed_beds_occupied": max(0, min(30, current_state["ed_beds_occupied"] + arrivals - discharges)),
            "boarding_count": boarding,
            "ed_wait_time_avg": random.uniform(20, 60),
            "patients_left_without_seen": random.randint(0, 2),
            "arrivals_this_hour": arrivals,
            "inpatient_census": current_state["inpatient_census"] + (arrivals // 5) - discharges,
            "discharges_today": current_state["discharges_today"] + discharges,
            "discharge_ready_count": max(0, current_state["discharge_ready_count"] + 2 - discharges),
            "surgeries_scheduled": random.randint(4, 8),
            "surgeries_completed": random.randint(2, 5),
            "pacu_occupancy": random.uniform(0.4, 0.9),
            "or_delays": random.randint(0, 2),
            "nurses_on_duty": nurses_on_duty,
            "nurse_patient_ratio": patients_per_nurse,
            "staff_overtime_hours": random.uniform(0, 8),
            "weather_condition": weather,
            "temperature": temperature,
            "is_holiday": False,
            "is_weekend": day_of_week >= 5,
            "local_events": None,
            "arrival_rate": arrival_rate,
            "discharge_rate": discharge_rate,
            "bed_utilization": bed_utilization,
        }
    
    def generate_ed_patients(self, count: int = 15) -> List[Dict]:
        """Generate current ED patients using real hospital patterns"""
        patients = []
        base_time = datetime.now()
        hour = base_time.hour
        
        # Get real patterns for this hour
        patterns = load_hospital_patterns()
        hour_data = patterns.get('hourly', {}).get(str(hour), {})
        triage_mix = hour_data.get('triage_mix', {'2': 0.5, '3': 0.3, '4': 0.15, '1': 0.05})
        complaint_mix = hour_data.get('complaint_mix', {'symptoms': 0.3, 'injury': 0.1, 'other': 0.6})
        
        # Build weighted lists from real patterns
        triage_levels = []
        for level_str, weight in triage_mix.items():
            triage_levels.extend([int(level_str)] * max(1, int(weight * 100)))
        
        # Real chief complaint categories mapped to readable names
        complaint_map = {
            'symptoms': ['Chest pain', 'Shortness of breath', 'Headache', 'Dizziness', 'Fatigue'],
            'injury': ['Fall injury', 'Motor vehicle accident', 'Work injury', 'Sports injury'],
            'cardiac_respiratory': ['Chest pain', 'Heart palpitations', 'Difficulty breathing', 'Cough'],
            'gi': ['Abdominal pain', 'Nausea/Vomiting', 'Diarrhea', 'Heartburn'],
            'mental_health': ['Anxiety', 'Depression', 'Confusion', 'Behavioral issue'],
            'other': ['Fever', 'Infection', 'Allergic reaction', 'Medication issue', 'General weakness'],
        }
        
        for i in range(count):
            arrival_time = base_time - timedelta(minutes=random.randint(5, 180))
            
            # Use real triage distribution
            triage_level = random.choice(triage_levels) if triage_levels else random.randint(2, 4)
            
            # Use real complaint mix
            complaint_cat = random.choices(
                list(complaint_mix.keys()),
                weights=list(complaint_mix.values()),
                k=1
            )[0] if complaint_mix else 'other'
            chief_complaint = random.choice(complaint_map.get(complaint_cat, complaint_map['other']))
            
            status = random.choice(["waiting", "in_treatment"])
            wait_minutes = (base_time - arrival_time).total_seconds() / 60

            # Generate patient timeline
            timeline = self._generate_patient_timeline(arrival_time, triage_level, status, wait_minutes)

            patients.append({
                "patient_id": self.generate_patient_id(),
                "arrival_time": arrival_time,
                "triage_level": triage_level,
                "chief_complaint": chief_complaint,
                "status": status,
                "assigned_floor": None,
                "doctor_id": random.choice(self.DOCTORS)["id"],
                "wait_time_minutes": int(wait_minutes),
                "timeline": timeline,
            })
        
        return patients
    
    def _generate_patient_timeline(self, arrival_time, triage_level, status, wait_minutes):
        """Generate a realistic treatment timeline for an ED patient."""
        events = []
        events.append({
            "time": arrival_time.strftime("%I:%M %p"),
            "event": "Arrived at ER",
            "status": "done",
            "icon": "arrival",
        })

        triage_offset = timedelta(minutes=random.randint(5, 15))
        triage_time = arrival_time + triage_offset
        events.append({
            "time": triage_time.strftime("%I:%M %p"),
            "event": f"Triage Level {triage_level} — {'Critical' if triage_level == 1 else 'Urgent' if triage_level <= 2 else 'Standard' if triage_level <= 4 else 'Non-urgent'}",
            "status": "done",
            "icon": "triage",
        })

        if status == "in_treatment":
            treatment_time = triage_time + timedelta(minutes=random.randint(10, 30))
            events.append({
                "time": treatment_time.strftime("%I:%M %p"),
                "event": "Treatment started",
                "status": "done",
                "icon": "treatment",
            })
            events.append({
                "time": None,
                "event": "Awaiting bed assignment",
                "status": "current",
                "icon": "waiting",
            })
        else:
            events.append({
                "time": None,
                "event": "Waiting for treatment",
                "status": "current",
                "icon": "waiting",
            })

        return events

    def generate_discharge_ready_patients(self, count: int = 5) -> List[Dict]:
        """Generate discharge-ready inpatient patients with discharge time estimates."""
        patients = []
        base_time = datetime.now()
        
        floors = [3, 4, 5]

        # Procedure type → average hours to discharge from PACU to home
        procedure_discharge_times = {
            "cardiac": 4.5, "respiratory": 3.0, "gi": 5.0,
            "neurological": 6.0, "orthopedic": 8.0, "general": 4.0,
            "infection": 3.5, "trauma": 7.0, "pediatric": 2.5, "other": 4.0,
        }
        procedure_names = list(procedure_discharge_times.keys())
        
        for i in range(count):
            floor = random.choice(floors)
            doctor = random.choice(self.DOCTORS)
            ready_time = base_time - timedelta(minutes=random.randint(10, 180))
            proc_type = random.choice(procedure_names)
            avg_hours = procedure_discharge_times[proc_type]
            estimated_hours = round(avg_hours * random.uniform(0.7, 1.3), 1)
            hours_waiting = round((base_time - ready_time).total_seconds() / 3600, 1)

            if hours_waiting > estimated_hours * 1.2:
                countdown_status = "overdue"
            elif hours_waiting > estimated_hours * 0.7:
                countdown_status = "approaching"
            else:
                countdown_status = "on_track"

            expected_discharge = ready_time + timedelta(hours=estimated_hours)

            patients.append({
                "patient_id": self.generate_patient_id(),
                "floor": floor,
                "room_number": f"{floor}{random.randint(1,20):02d}",
                "doctor_name": doctor["name"],
                "doctor_id": doctor["id"],
                "discharge_ready_since": ready_time,
                "expected_discharge_time": expected_discharge,
                "procedure_type": proc_type,
                "estimated_discharge_hours": estimated_hours,
                "hours_waiting": hours_waiting,
                "countdown_status": countdown_status,
            })
        
        return patients
    
    def generate_surgery_schedule(self, count: int = 6) -> List[Dict]:
        """Generate surgery schedule"""
        surgeries = []
        base_time = datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
        
        for i in range(count):
            start_time = base_time + timedelta(hours=i * 2)
            end_time = start_time + timedelta(hours=random.randint(1, 3))
            
            surgeries.append({
                "surgery_id": self.generate_surgery_id(),
                "patient_id": self.generate_patient_id(),
                "or_number": f"OR{random.randint(1, 5)}",
                "surgeon_id": random.choice(self.DOCTORS)["id"],
                "surgeon_name": random.choice(self.DOCTORS)["name"],
                "scheduled_start": start_time,
                "expected_end": end_time,
                "actual_end": None,
                "pacu_bay": random.randint(1, 4),
                "status": random.choice(["scheduled", "in_progress", "completed"]),
                "procedure_type": random.choice(self.PROCEDURES),
                "is_urgent": random.random() < 0.2,
            })
        
        return surgeries
    
    def generate_staff_roster(self) -> List[Dict]:
        """Generate staff roster with skills and certifications."""
        staff = []

        SKILL_SETS = {
            "nurse": {
                "required": ["BLS"],
                "possible": ["ACLS", "TNCC", "PALS", "CCRN"],
                "specializations": ["cardiac", "pediatric", "trauma", "mental_health", "general"],
            },
            "doctor": {
                "required": ["BLS", "ACLS"],
                "possible": ["ATLS", "PALS", "TLS"],
                "specializations": ["emergency", "cardiac", "surgery", "pulmonology", "internal_medicine"],
            },
        }
        
        # Nurses
        nurse_names = ["Sarah Johnson", "Michael Chen", "Emily Davis", "James Wilson",
                      "Lisa Anderson", "David Martinez", "Jennifer Taylor", "Robert Brown",
                      "Amanda White", "Christopher Lee", "Michelle Garcia", "Daniel Kim"]
        
        for i, name in enumerate(nurse_names):
            shift_hour = random.choice([7, 19])
            skills_config = SKILL_SETS["nurse"]
            skills = list(skills_config["required"])
            extra_skills = random.sample(skills_config["possible"], k=random.randint(0, 2))
            skills.extend(extra_skills)
            specializations = random.sample(skills_config["specializations"], k=random.randint(1, 2))
            cert_level = "advanced" if len(skills) >= 4 else "intermediate" if len(skills) >= 2 else "basic"

            staff.append({
                "employee_id": f"N{i+1:03d}",
                "name": name,
                "role": "nurse",
                "department": "Emergency",
                "shift_start": datetime.now().replace(hour=shift_hour),
                "shift_end": datetime.now().replace(hour=(shift_hour + 12) % 24),
                "is_on_duty": True,
                "is_available_overtime": random.random() < 0.3,
                "skills": skills,
                "specializations": specializations,
                "certification_level": cert_level,
            })
        
        # Doctors
        for doc in self.DOCTORS:
            skills_config = SKILL_SETS["doctor"]
            skills = list(skills_config["required"])
            extra_skills = random.sample(skills_config["possible"], k=random.randint(0, 2))
            skills.extend(extra_skills)
            specializations = [doc.get("department", "emergency").lower().replace(" ", "_")]
            cert_level = "advanced" if len(skills) >= 4 else "intermediate" if len(skills) >= 2 else "basic"

            staff.append({
                "employee_id": f"D{doc['id']:03d}",
                "name": doc["name"],
                "role": "doctor",
                "department": doc["department"],
                "shift_start": datetime.now().replace(hour=7),
                "shift_end": datetime.now().replace(hour=19),
                "is_on_duty": True,
                "is_available_overtime": random.random() < 0.2,
                "skills": skills,
                "specializations": specializations,
                "certification_level": cert_level,
            })
        
        return staff
    
    def generate_demo_scenario(self, scenario_type: str = "monday_surge") -> Dict:
        """Generate a complete demo scenario"""
        base_time = datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)
        
        if scenario_type == "monday_surge":
            # Monday 2PM with flu surge
            scenario = {
                "name": "Monday Flu Surge",
                "description": "Post-holiday Monday with flu season surge - classic boarding crisis scenario",
                "timestamp": base_time,
                "base_arrival_rate": 14,  # Higher than normal (10)
                "base_discharge_rate": 3,  # Lower than normal (4)
                "weather": "rainy",
                "is_day_after_holiday": True,
                "flu_season": True,
                "initial_state": {
                    "boarding_count": 8,
                    "ed_beds_occupied": 28,
                    "inpatient_census": 145,
                    "discharges_today": 6,
                    "discharge_ready_count": 6,
                    "pacu_occupancy": 0.85,
                    "nurses_on_duty": 9,
                    "nurse_patient_ratio": 6.0,
                }
            }
        elif scenario_type == "normal_day":
            scenario = {
                "name": "Normal Wednesday",
                "description": "Typical Wednesday - moderate patient volume",
                "timestamp": base_time.replace(hour=10),
                "base_arrival_rate": 10,
                "base_discharge_rate": 4,
                "weather": "sunny",
                "is_day_after_holiday": False,
                "flu_season": False,
                "initial_state": {
                    "boarding_count": 4,
                    "ed_beds_occupied": 22,
                    "inpatient_census": 130,
                    "discharges_today": 8,
                    "discharge_ready_count": 3,
                    "pacu_occupancy": 0.6,
                    "nurses_on_duty": 10,
                    "nurse_patient_ratio": 4.5,
                }
            }
        elif scenario_type == "flu_outbreak":
            scenario = {
                "name": "Flu Season Peak",
                "description": "January flu season with high volume",
                "timestamp": base_time.replace(hour=16),
                "base_arrival_rate": 16,
                "base_discharge_rate": 3,
                "weather": "snowy",
                "is_day_after_holiday": False,
                "flu_season": True,
                "initial_state": {
                    "boarding_count": 12,
                    "ed_beds_occupied": 29,
                    "inpatient_census": 152,
                    "discharges_today": 4,
                    "discharge_ready_count": 8,
                    "pacu_occupancy": 0.95,
                    "nurses_on_duty": 8,
                    "nurse_patient_ratio": 7.0,
                }
            }
        else:  # mass_casualty
            scenario = {
                "name": "Mass Casualty Event",
                "description": "Multi-car accident - 15 patients arriving simultaneously",
                "timestamp": base_time.replace(hour=14),
                "base_arrival_rate": 30,
                "base_discharge_rate": 2,
                "weather": "sunny",
                "is_day_after_holiday": False,
                "flu_season": False,
                "initial_state": {
                    "boarding_count": 6,
                    "ed_beds_occupied": 25,
                    "inpatient_census": 135,
                    "discharges_today": 5,
                    "discharge_ready_count": 4,
                    "pacu_occupancy": 0.7,
                    "nurses_on_duty": 10,
                    "nurse_patient_ratio": 5.0,
                }
            }
        
        # Generate timeline data for this scenario
        timeline = []
        current_state = scenario["initial_state"].copy()
        
        for hour in range(12):  # 12-hour forecast
            future_time = scenario["timestamp"] + timedelta(hours=hour)
            metrics = self.generate_hourly_metrics(
                future_time,
                base_arrival_rate=scenario["base_arrival_rate"],
                base_discharge_rate=scenario["base_discharge_rate"],
                current_state=current_state
            )
            timeline.append(metrics)
            current_state.update({
                "boarding_count": metrics["boarding_count"],
                "ed_beds_occupied": metrics["ed_beds_occupied"],
                "inpatient_census": metrics["inpatient_census"],
                "discharges_today": metrics["discharges_today"],
                "discharge_ready_count": metrics["discharge_ready_count"],
            })
        
        scenario["timeline"] = timeline
        
        # Generate supporting data
        scenario["ed_patients"] = self.generate_ed_patients(count=18)
        scenario["discharge_ready"] = self.generate_discharge_ready_patients(count=6)
        scenario["surgery_schedule"] = self.generate_surgery_schedule(count=5)
        scenario["staff_roster"] = self.generate_staff_roster()
        
        return scenario


# Singleton instance
data_generator = HospitalDataGenerator()

# Aggregated hospital patterns cache (10KB instead of 113MB)
_patterns_cache = None

def load_hospital_patterns() -> Dict:
    """Load aggregated hospital patterns (10KB) instead of raw data (113MB)"""
    global _patterns_cache
    
    if _patterns_cache is not None:
        return _patterns_cache
    
    patterns_file = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'hospital_patterns.json')
    
    if not os.path.exists(patterns_file):
        print(f"[Data Generator] Patterns file not found: {patterns_file}")
        return {}
    
    with open(patterns_file, 'r') as f:
        _patterns_cache = json.load(f)
    
    print(f"[Data Generator] Loaded hospital patterns ({os.path.getsize(patterns_file) / 1024:.1f}KB)")
    return _patterns_cache


def get_real_data_stats(hour: int = None, day_of_week: int = None) -> Dict:
    """Get statistics from aggregated hospital patterns for a specific hour"""
    patterns = load_hospital_patterns()
    
    if not patterns or 'hourly' not in patterns:
        return {}
    
    hour_str = str(hour) if hour is not None else str(datetime.now().hour)
    hour_data = patterns['hourly'].get(hour_str, {})
    
    if not hour_data:
        return {}
    
    # Calculate simulated patient count based on relative volume
    # Average hospital sees ~10 patients/hour, scale by relative volume
    base_volume = 10
    relative_vol = hour_data.get('patient_volume', 1.0)
    patients_this_hour = max(3, min(20, int(base_volume * relative_vol + np.random.normal(0, 2))))
    
    # Get admission rate from overall stats
    admission_rate = patterns.get('overall', {}).get('admission_rate', 0.3)
    
    # Get complaint mix as counts (scale to patients_this_hour)
    complaint_mix = hour_data.get('complaint_mix', {})
    complaint_categories = {}
    for cat, rate in complaint_mix.items():
        complaint_categories[cat] = max(0, min(15, int(patients_this_hour * rate)))
    
    # Get triage mix
    triage_mix = hour_data.get('triage_mix', {})
    triage_distribution = {}
    for level_str, rate in triage_mix.items():
        triage_distribution[int(level_str)] = max(0, min(15, int(patients_this_hour * rate)))
    
    # Calculate counts from rates
    critical_count = max(0, min(10, int(patients_this_hour * hour_data.get('critical_rate', 0.01))))
    mental_health_count = max(0, min(10, int(patients_this_hour * hour_data.get('mental_health_rate', 0.01))))
    admitted_count = max(0, min(15, int(patients_this_hour * admission_rate)))
    discharged_count = max(0, min(15, patients_this_hour - admitted_count))
    
    return {
        'count': patients_this_hour,
        'avg_triage': hour_data.get('avg_triage', 2.5),
        'triage_distribution': triage_distribution,
        'complaint_categories': complaint_categories,
        'avg_los': hour_data.get('avg_los', 4.0),
        'avg_age': hour_data.get('avg_age', 45.0),
        'avg_pain': hour_data.get('avg_pain', 3.0),
        'critical_count': critical_count,
        'mental_health_count': mental_health_count,
        'admitted_count': admitted_count,
        'discharged_count': discharged_count,
        'admission_rate': admission_rate,
    }


def generate_dynamic_hospital_state() -> dict:
    """Generate a realistic hospital state with varied risk levels for demo."""
    now = datetime.now()
    hour = now.hour
    day_of_week = now.weekday()
    
    # Get real data statistics for this hour
    real_stats = get_real_data_stats(hour, day_of_week)
    
    # Random surge multiplier: 15% chance of surge, 5% chance of crisis
    surge_roll = random.random()
    if surge_roll < 0.05:
        surge_mult = random.uniform(2.5, 3.5)   # Crisis
    elif surge_roll < 0.20:
        surge_mult = random.uniform(1.5, 2.5)   # Surge
    else:
        surge_mult = random.uniform(0.7, 1.3)   # Normal variation
    
    if real_stats and real_stats.get('count', 0) > 0:
        patients_this_hour = real_stats['count']
        avg_triage = real_stats['avg_triage']
        admission_rate = real_stats['admission_rate']
        
        # Calculate boarding with WIDE random spread
        boarding_base = patients_this_hour * admission_rate * 0.3
        time_factor = 1.0 + 0.3 * np.sin((hour - 6) / 12 * np.pi)
        boarding = int(boarding_base * time_factor * surge_mult + np.random.normal(0, 5))
        boarding = max(2, min(22, boarding))
        
        # ED beds occupied — wider range
        ed_occupied = min(30, max(10, int(patients_this_hour * 0.7 * surge_mult + np.random.normal(0, 5))))
        
        # Discharges
        if 8 <= hour <= 18:
            discharges = random.randint(3, 12)
        else:
            discharges = random.randint(1, 5)
        
        # Discharge ready count — varies more
        discharge_ready = max(1, min(12, int(real_stats['admitted_count'] * 0.4 * random.uniform(0.5, 1.8))))
        
        # PACU occupancy — wider range
        pacu_occupancy = round(random.uniform(0.45, 0.98), 2)
        
        # Nurse-patient ratio — wider range
        nurses_on_duty = random.randint(6, 14)
        nurse_ratio = round(ed_occupied / max(1, nurses_on_duty), 1)
        
        # Weather
        weather = random.choice(["sunny", "cloudy", "rainy", "stormy"])
        temperature = random.randint(25, 95)
        
        # Wait time — scales with boarding
        ed_wait = max(10, int(boarding * 4 + np.random.normal(0, 8)))
        
        # OR delays — more in surge
        or_delays = max(0, int(boarding * 0.3 * surge_mult + np.random.normal(0, 1)))
        
        # Surge adjustments
        if surge_mult > 1.5:
            nurse_ratio = round(nurse_ratio * random.uniform(1.1, 1.4), 1)
            pacu_occupancy = round(min(0.99, pacu_occupancy * random.uniform(1.05, 1.2)), 2)
        
        return {
            'boarding_count': boarding,
            'ed_beds_occupied': ed_occupied,
            'ed_beds_total': 30,
            'inpatient_census': random.randint(125, 160),
            'discharge_ready_count': discharge_ready,
            'pacu_occupancy': pacu_occupancy,
            'nurse_patient_ratio': nurse_ratio,
            'weather_condition': weather,
            'temperature': temperature,
            'avg_triage_level': round(avg_triage, 1),
            'avg_patient_age': round(real_stats['avg_age'], 1),
            'avg_length_of_stay': round(real_stats['avg_los'], 1),
            'avg_pain_grade': round(real_stats['avg_pain'], 1),
            'critical_count': real_stats['critical_count'],
            'mental_health_count': real_stats['mental_health_count'],
            'complaint_categories': real_stats['complaint_categories'],
            'patients_this_hour': patients_this_hour,
            'admission_rate': round(admission_rate, 2),
            'ed_wait_time_avg': ed_wait,
            'or_delays': or_delays,
            'discharges_today': discharges,
        }
    else:
        # Fallback — fully random
        boarding = random.randint(3, 20)
        ed_occupied = random.randint(12, 30)
        nurses = random.randint(6, 14)
        return {
            "boarding_count": boarding,
            "ed_beds_occupied": ed_occupied,
            "ed_beds_total": 30,
            "inpatient_census": random.randint(125, 160),
            "discharge_ready_count": random.randint(2, 10),
            "pacu_occupancy": round(random.uniform(0.45, 0.98), 2),
            "nurse_patient_ratio": round(ed_occupied / max(1, nurses), 1),
            "weather_condition": random.choice(["sunny", "cloudy", "rainy", "stormy"]),
            "temperature": random.randint(25, 95),
            "ed_wait_time_avg": max(10, int(boarding * 4 + np.random.normal(0, 8))),
            "or_delays": max(0, int(boarding * 0.3 + np.random.normal(0, 1))),
            "discharges_today": random.randint(2, 12),
        }

