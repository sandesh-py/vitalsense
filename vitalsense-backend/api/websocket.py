"""
WebSocket connection manager for real-time vital sign streaming.
"""

import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import desc
from core.database import SessionLocal
from models.db_models import VitalReading
from models.schemas import VitalReadingOut

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send a message to all connected clients."""
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    @property
    def client_count(self) -> int:
        return len(self.active_connections)


# Module-level singleton
manager = ConnectionManager()


def _get_history(limit: int = 60) -> list[dict]:
    """Fetch last N readings from DB for chart initialization."""
    db = SessionLocal()
    try:
        readings = (
            db.query(VitalReading)
            .order_by(desc(VitalReading.timestamp))
            .limit(limit)
            .all()
        )
        # Reverse so oldest is first (chronological order)
        readings.reverse()
        return [
            VitalReadingOut.model_validate(r).model_dump(mode="json")
            for r in readings
        ]
    finally:
        db.close()


@router.websocket("/ws/vitals")
async def vitals_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send last 60 readings as history on connect
        history = _get_history(60)
        await websocket.send_json({
            "type": "history",
            "timestamp": datetime.utcnow().isoformat(),
            "patient_id": "P001",
            "data": {"readings": history, "count": len(history)},
        })

        # Keep connection alive — listen for client pings
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                    "patient_id": "P001",
                    "data": {"status": "ok"},
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
