"""
REST API endpoints for analytics — time-series, feature importance, classification report.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from core.database import get_db
from models.db_models import VitalReading
from models.schemas import TimeSeriesOut, TimeSeriesBucket, FeatureImportanceItem
from ml.predict import get_feature_importance, get_classification_report

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

METRIC_COLUMNS = {
    "heart_rate": VitalReading.heart_rate,
    "spo2": VitalReading.spo2,
    "temperature": VitalReading.temperature,
    "systolic_bp": VitalReading.systolic_bp,
    "diastolic_bp": VitalReading.diastolic_bp,
    "respiratory_rate": VitalReading.respiratory_rate,
}


@router.get("/timeseries", response_model=TimeSeriesOut)
def get_timeseries(
    metric: str = Query("heart_rate", description="Metric column name"),
    hours: int = Query(24, ge=1, le=168),
    bucket: str = Query("5min", description="Bucket size: 1min, 5min, 15min, 1hr"),
    db: Session = Depends(get_db),
):
    """Returns time-bucketed averages for trend charts."""
    if metric not in METRIC_COLUMNS:
        return TimeSeriesOut(metric=metric, buckets=[])

    col = METRIC_COLUMNS[metric]
    since = datetime.utcnow() - timedelta(hours=hours)

    readings = (
        db.query(VitalReading.timestamp, col)
        .filter(VitalReading.timestamp >= since)
        .order_by(VitalReading.timestamp)
        .all()
    )

    if not readings:
        return TimeSeriesOut(metric=metric, buckets=[])

    # Parse bucket size
    bucket_map = {"1min": 60, "5min": 300, "15min": 900, "1hr": 3600}
    bucket_seconds = bucket_map.get(bucket, 300)

    # Group into buckets
    buckets = {}
    for ts, val in readings:
        # Round timestamp down to bucket boundary
        epoch = int(ts.timestamp())
        bucket_key = epoch - (epoch % bucket_seconds)
        if bucket_key not in buckets:
            buckets[bucket_key] = []
        buckets[bucket_key].append(float(val))

    result = []
    for bk in sorted(buckets.keys()):
        vals = buckets[bk]
        result.append(TimeSeriesBucket(
            time=datetime.utcfromtimestamp(bk).isoformat(),
            avg=round(sum(vals) / len(vals), 2),
            min=round(min(vals), 2),
            max=round(max(vals), 2),
        ))

    return TimeSeriesOut(metric=metric, buckets=result)


@router.get("/feature-importance", response_model=list[FeatureImportanceItem])
def feature_importance():
    """Returns feature importance from the trained Random Forest model."""
    return get_feature_importance()


@router.get("/classification-report")
def classification_report_endpoint():
    """Returns the sklearn classification_report as structured JSON."""
    return get_classification_report()
