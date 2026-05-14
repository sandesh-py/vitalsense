"""
REST API endpoints for alert events.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from core.database import get_db
from models.db_models import AlertEvent
from models.schemas import AlertEventOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/", response_model=list[AlertEventOut])
def get_alerts(
    limit: int = Query(20, ge=1, le=100),
    resolved: bool | None = None,
    db: Session = Depends(get_db),
):
    """Returns recent alert events, filterable by resolved status."""
    q = db.query(AlertEvent).order_by(desc(AlertEvent.timestamp))
    if resolved is not None:
        q = q.filter(AlertEvent.resolved == resolved)
    return q.limit(limit).all()


@router.get("/{alert_id}", response_model=AlertEventOut)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Returns a single alert event by ID."""
    alert = db.query(AlertEvent).get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/resolve", response_model=AlertEventOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Marks an alert as resolved."""
    alert = db.query(AlertEvent).get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert
