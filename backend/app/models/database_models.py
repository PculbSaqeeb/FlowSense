"""
FlowSense - Database Models
SQLAlchemy models for hospital flow prediction system
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, 
    JSON
)
from sqlalchemy.sql import func
from ..core.database import Base


class HospitalMetrics(Base):
    """Hourly hospital metrics snapshot"""
    __tablename__ = "hospital_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    
    ed_beds_occupied = Column(Integer, default=0)
    boarding_count = Column(Integer, default=0)
    ed_wait_time_avg = Column(Float, default=0.0)
    patients_left_without_seen = Column(Integer, default=0)
    arrivals_this_hour = Column(Integer, default=0)
    
    inpatient_census = Column(Integer, default=0)
    discharges_today = Column(Integer, default=0)
    discharge_ready_count = Column(Integer, default=0)
    
    surgeries_scheduled = Column(Integer, default=0)
    surgeries_completed = Column(Integer, default=0)
    pacu_occupancy = Column(Float, default=0.0)
    or_delays = Column(Integer, default=0)
    
    nurses_on_duty = Column(Integer, default=0)
    nurse_patient_ratio = Column(Float, default=0.0)
    staff_overtime_hours = Column(Float, default=0.0)
    
    weather_condition = Column(String(50), nullable=True)
    temperature = Column(Float, nullable=True)
    is_holiday = Column(Boolean, default=False)
    is_weekend = Column(Boolean, default=False)
    local_events = Column(JSON, nullable=True)
    
    arrival_rate = Column(Float, default=0.0)
    discharge_rate = Column(Float, default=0.0)
    bed_utilization = Column(Float, default=0.0)
    
    def __repr__(self):
        return f"<HospitalMetrics {self.timestamp} - Boarding: {self.boarding_count}>"
