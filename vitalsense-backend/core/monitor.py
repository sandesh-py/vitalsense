"""
Background monitoring loop.
Runs every 1 second via APScheduler to:
  1. Generate a vital sign reading
  2. Compute rolling features from recent DB history
  3. Run ML classification and anomaly detection
  4. Save to database
  5. Create alert events when anomalies are detected
  6. Broadcast via WebSocket
"""

import asyncio
from datetime import datetime
from sqlalchemy import desc
from core.database import SessionLocal
from models.db_models import VitalReading, AlertEvent
from models.schemas import VitalReadingOut
from data.generator import generate_reading
from ml.predict import predict_condition, detect_anomaly, compute_rolling_features
from api.websocket import manager

# Track active alert state and streaks for stability
_active_alert_type = None
_anomaly_streak = 0
_normal_streak = 0
STABILITY_THRESHOLD = 3


def _get_recent_readings(db, n: int = 10) -> list[dict]:
    """Fetch the last N readings from the database."""
    readings = (
        db.query(VitalReading)
        .order_by(desc(VitalReading.timestamp))
        .limit(n)
        .all()
    )
    readings.reverse()
    return [
        {
            "heart_rate": r.heart_rate,
            "spo2": r.spo2,
            "temperature": r.temperature,
            "systolic_bp": r.systolic_bp,
            "diastolic_bp": r.diastolic_bp,
            "respiratory_rate": r.respiratory_rate,
        }
        for r in readings
    ]


ANOMALY_THRESHOLDS = {
    "TACHYCARDIA": {"field": "heart_rate", "threshold": 120, "severity_threshold": 140},
    "HYPOXIA": {"field": "spo2", "threshold": 94, "severity_threshold": 90, "invert": True},
    "FEVER": {"field": "temperature", "threshold": 38.0, "severity_threshold": 39.0},
    "HYPERTENSION": {"field": "systolic_bp", "threshold": 140, "severity_threshold": 160},
}


def _determine_severity(anomaly_type: str, vitals: dict) -> str:
    """Determine if an anomaly is WARNING or CRITICAL."""
    info = ANOMALY_THRESHOLDS.get(anomaly_type)
    if not info:
        return "WARNING"
    val = vitals.get(info["field"], 0)
    sev = info["severity_threshold"]
    if info.get("invert"):
        return "CRITICAL" if val < sev else "WARNING"
    return "CRITICAL" if val > sev else "WARNING"


def _get_threshold(anomaly_type: str) -> float:
    info = ANOMALY_THRESHOLDS.get(anomaly_type, {})
    return info.get("threshold", 0)


def _get_triggered_value(anomaly_type: str, vitals: dict) -> float:
    info = ANOMALY_THRESHOLDS.get(anomaly_type, {})
    return vitals.get(info.get("field", "heart_rate"), 0)


async def monitor_tick():
    """One iteration of the monitoring loop."""
    global _active_alert_type, _anomaly_streak, _normal_streak

    db = SessionLocal()
    try:
        # 1. Generate new reading
        vitals = generate_reading()

        # 2. Get recent readings for rolling features
        recent = _get_recent_readings(db, 10)
        rolling = compute_rolling_features(recent + [vitals])

        # 3. ML inference
        condition = predict_condition(vitals, rolling)
        anomaly = detect_anomaly(vitals, rolling)

        # 4. Save reading to DB
        reading = VitalReading(
            patient_id=vitals["patient_id"],
            timestamp=datetime.utcnow(),
            heart_rate=vitals["heart_rate"],
            spo2=vitals["spo2"],
            temperature=vitals["temperature"],
            systolic_bp=vitals["systolic_bp"],
            diastolic_bp=vitals["diastolic_bp"],
            respiratory_rate=vitals["respiratory_rate"],
            anomaly_active=vitals["anomaly_active"],
            anomaly_type=vitals["anomaly_type"],
            condition_label=condition["label"],
            rf_confidence=condition["confidence"],
            iso_score=anomaly["score"],
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        # 5. Alert logic
        alert_msg = None
        if vitals["anomaly_active"] and vitals["anomaly_type"]:
            _normal_streak = 0
            _anomaly_streak += 1
            
            if _anomaly_streak >= STABILITY_THRESHOLD:
                atype = vitals["anomaly_type"]
                if _active_alert_type != atype:
                    # New anomaly — create alert
                    _active_alert_type = atype
                    severity = _determine_severity(atype, vitals)
                    triggered_val = _get_triggered_value(atype, vitals)
                    threshold_val = _get_threshold(atype)

                    alert = AlertEvent(
                        patient_id=vitals["patient_id"],
                        alert_type=atype,
                        severity=severity,
                        triggered_value=triggered_val,
                        threshold_value=threshold_val,
                        message=f"{atype} detected: {triggered_val} (threshold: {threshold_val})",
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)

                    alert_msg = {
                        "type": "alert",
                        "timestamp": datetime.utcnow().isoformat(),
                        "patient_id": vitals["patient_id"],
                        "data": {
                            "alert_id": alert.id,
                            "alert_type": atype,
                            "severity": severity,
                            "triggered_value": triggered_val,
                            "threshold_value": threshold_val,
                            "message": alert.message,
                        },
                    }
        else:
            _anomaly_streak = 0
            _normal_streak += 1
            
            if _normal_streak >= STABILITY_THRESHOLD:
                # Anomaly resolved — update active alerts
                if _active_alert_type is not None:
                    unresolved = (
                        db.query(AlertEvent)
                        .filter(AlertEvent.alert_type == _active_alert_type, AlertEvent.resolved == False)
                        .all()
                    )
                    for a in unresolved:
                        a.resolved = True
                        a.resolved_at = datetime.utcnow()
                    db.commit()
                    _active_alert_type = None

        # 6. Broadcast via WebSocket
        reading_out = VitalReadingOut.model_validate(reading).model_dump(mode="json")
        vitals_msg = {
            "type": "vitals",
            "timestamp": datetime.utcnow().isoformat(),
            "patient_id": vitals["patient_id"],
            "data": {
                **reading_out,
                "ml": {
                    "condition": condition,
                    "anomaly": anomaly,
                },
            },
        }

        await manager.broadcast(vitals_msg)
        if alert_msg:
            await manager.broadcast(alert_msg)

    except Exception as e:
        print(f"  [!] Monitor error: {e}")
        db.rollback()
    finally:
        db.close()
