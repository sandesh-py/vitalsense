from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VitalReadingOut(BaseModel):
    id: int
    patient_id: str
    timestamp: datetime
    heart_rate: float
    spo2: float
    temperature: float
    systolic_bp: int
    diastolic_bp: int
    respiratory_rate: int
    anomaly_active: bool
    anomaly_type: Optional[str] = None
    condition_label: str
    rf_confidence: float
    iso_score: float

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: int
    timestamp: datetime
    patient_id: str
    alert_type: str
    severity: str
    triggered_value: float
    threshold_value: float
    resolved: bool
    resolved_at: Optional[datetime] = None
    message: str

    model_config = {"from_attributes": True}


class VitalStatsOut(BaseModel):
    avg_hr: float
    max_hr: float
    min_hr: float
    avg_spo2: float
    min_spo2: float
    total_readings: int
    anomaly_count: int
    anomaly_rate_pct: float
    condition_distribution: dict


class TimeSeriesBucket(BaseModel):
    time: str
    avg: float
    min: float
    max: float


class TimeSeriesOut(BaseModel):
    metric: str
    buckets: list[TimeSeriesBucket]


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    rank: int


class HealthCheckOut(BaseModel):
    status: str
    version: str
    model_loaded: bool
    ws_clients: int
    uptime_seconds: float

    model_config = {"protected_namespaces": ()}


class WSMessage(BaseModel):
    type: str  # vitals | alert | history | heartbeat
    timestamp: str
    patient_id: str
    data: dict
