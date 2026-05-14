"""
VitalSense API — FastAPI entry point.
Real-time health monitoring and anomaly detection backend.
"""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import PORT, FRONTEND_URL
from core.database import init_db
from core.monitor import monitor_tick
from ml.predict import models_exist
from ml.train import train_models
from api.websocket import router as ws_router, manager
from api.vitals import router as vitals_router
from api.alerts import router as alerts_router
from api.analytics import router as analytics_router

scheduler = AsyncIOScheduler()
_start_time = time.time()


def print_banner():
    print("""
+======================================================+
|              VitalSense API v1.0.0                   |
|      Real-Time Health Monitoring & Anomaly Detection |
+======================================================+
|  REST API:     http://localhost:{:<5}               |
|  WebSocket:    ws://localhost:{:<5}/ws/vitals       |
|  Swagger UI:   http://localhost:{:<5}/docs          |
|  Frontend:     {:<38} |
+------------------------------------------------------+
|  Endpoints:                                          |
|    GET  /                        Health check        |
|    GET  /api/vitals/latest       Latest reading      |
|    GET  /api/vitals/history      Historical data     |
|    GET  /api/vitals/stats        Aggregate stats     |
|    GET  /api/alerts              Alert events        |
|    GET  /api/analytics/timeseries Time-series data   |
|    GET  /api/analytics/feature-importance            |
|    GET  /api/analytics/classification-report         |
|    WS   /ws/vitals               Live stream         |
+======================================================+
""".format(PORT, PORT, PORT, FRONTEND_URL))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    print("\n  >> Starting VitalSense backend...")

    # 1. Initialize database
    init_db()

    # 2. Train models if they don't exist
    if not models_exist():
        print("\n  [*] No trained models found -- training now...")
        train_models()
    else:
        print("  [OK] ML models loaded from disk")

    # 3. Start background monitor
    scheduler.add_job(monitor_tick, "interval", seconds=1, id="vital_monitor", max_instances=1)
    scheduler.start()
    print("  [OK] Background monitor started (1s interval)")

    print_banner()
    print("  [OK] VitalSense backend running -- monitoring active\n")

    yield

    # Shutdown
    print("\n  [!] Shutting down VitalSense...")
    scheduler.shutdown(wait=False)
    print("  [OK] Scheduler stopped")


app = FastAPI(
    title="VitalSense API",
    description="Real-time health monitoring and anomaly detection system powered by data mining.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(vitals_router)
app.include_router(alerts_router)
app.include_router(analytics_router)
app.include_router(ws_router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "model_loaded": models_exist(),
        "ws_clients": manager.client_count,
        "uptime_seconds": round(time.time() - _start_time, 1),
    }
