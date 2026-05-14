"""
REST API endpoints for vital sign data.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from core.database import get_db
from models.db_models import VitalReading
from models.schemas import VitalReadingOut, VitalStatsOut

router = APIRouter(prefix="/api/vitals", tags=["Vitals"])


@router.get("/latest", response_model=VitalReadingOut)
def get_latest_reading(patient_id: str = "P001", db: Session = Depends(get_db)):
    """Returns the single most recent reading with ML outputs."""
    reading = (
        db.query(VitalReading)
        .filter(VitalReading.patient_id == patient_id)
        .order_by(desc(VitalReading.timestamp))
        .first()
    )
    if not reading:
        return VitalReadingOut(
            id=0, patient_id=patient_id, timestamp=datetime.utcnow(),
            heart_rate=0, spo2=0, temperature=0, systolic_bp=0,
            diastolic_bp=0, respiratory_rate=0, anomaly_active=False,
            condition_label="NORMAL", rf_confidence=0, iso_score=0,
        )
    return reading


@router.get("/history")
def get_history(
    minutes: int = Query(60, ge=1, le=1440),
    patient_id: str = "P001",
    db: Session = Depends(get_db),
):
    """Returns all readings in the last N minutes."""
    since = datetime.utcnow() - timedelta(minutes=minutes)
    readings = (
        db.query(VitalReading)
        .filter(VitalReading.patient_id == patient_id, VitalReading.timestamp >= since)
        .order_by(VitalReading.timestamp)
        .all()
    )
    return {
        "readings": [VitalReadingOut.model_validate(r).model_dump(mode="json") for r in readings],
        "count": len(readings),
        "time_range": {"from": since.isoformat(), "to": datetime.utcnow().isoformat()},
    }


@router.get("/stats", response_model=VitalStatsOut)
def get_stats(hours: int = Query(24, ge=1, le=168), patient_id: str = "P001", db: Session = Depends(get_db)):
    """Returns aggregate stats for the given time window."""
    since = datetime.utcnow() - timedelta(hours=hours)
    q = db.query(VitalReading).filter(
        VitalReading.patient_id == patient_id,
        VitalReading.timestamp >= since,
    )

    total = q.count()
    if total == 0:
        return VitalStatsOut(
            avg_hr=0, max_hr=0, min_hr=0, avg_spo2=0, min_spo2=0,
            total_readings=0, anomaly_count=0, anomaly_rate_pct=0,
            condition_distribution={"NORMAL": 0, "WARNING": 0, "CRITICAL": 0},
        )

    stats = db.query(
        func.avg(VitalReading.heart_rate),
        func.max(VitalReading.heart_rate),
        func.min(VitalReading.heart_rate),
        func.avg(VitalReading.spo2),
        func.min(VitalReading.spo2),
    ).filter(
        VitalReading.patient_id == patient_id,
        VitalReading.timestamp >= since,
    ).first()

    anomaly_count = q.filter(VitalReading.anomaly_active == True).count()

    # Condition distribution
    dist = {}
    for label in ["NORMAL", "WARNING", "CRITICAL"]:
        dist[label] = q.filter(VitalReading.condition_label == label).count()

    return VitalStatsOut(
        avg_hr=round(float(stats[0] or 0), 1),
        max_hr=round(float(stats[1] or 0), 1),
        min_hr=round(float(stats[2] or 0), 1),
        avg_spo2=round(float(stats[3] or 0), 1),
        min_spo2=round(float(stats[4] or 0), 1),
        total_readings=total,
        anomaly_count=anomaly_count,
        anomaly_rate_pct=round(anomaly_count / total * 100, 2) if total else 0,
        condition_distribution=dist,
    )
