from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Index
from core.database import Base


class VitalReading(Base):
    __tablename__ = "vital_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, default="P001", index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    heart_rate = Column(Float, nullable=False)
    spo2 = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    systolic_bp = Column(Integer, nullable=False)
    diastolic_bp = Column(Integer, nullable=False)
    respiratory_rate = Column(Integer, nullable=False)
    anomaly_active = Column(Boolean, default=False)
    anomaly_type = Column(String, nullable=True)
    condition_label = Column(String, default="NORMAL")  # NORMAL / WARNING / CRITICAL
    rf_confidence = Column(Float, default=0.0)
    iso_score = Column(Float, default=0.0)

    __table_args__ = (
        Index("idx_patient_time", "patient_id", "timestamp"),
    )


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    patient_id = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)  # TACHYCARDIA / HYPOXIA / FEVER / HYPERTENSION
    severity = Column(String, nullable=False)  # WARNING / CRITICAL
    triggered_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    message = Column(String, nullable=False)
