# VitalSense Backend

Real-time health monitoring and anomaly detection system powered by FastAPI, scikit-learn, and WebSockets.

## Quick Start

### Backend Setup
```bash
cd vitalsense-backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (separate terminal)
```bash
cd SmartWatch_Vitalsign
npm install axios
npm run dev
```

### Verify Backend Working
- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/
- **WebSocket**: ws://localhost:8000/ws/vitals

## Architecture

```
vitalsense-backend/
├── main.py              # FastAPI app entry point
├── config.py            # Settings loader
├── models/
│   ├── db_models.py     # SQLAlchemy ORM models
│   └── schemas.py       # Pydantic schemas
├── data/
│   └── generator.py     # Simulated vital sign data generator
├── ml/
│   ├── train.py         # Model training script
│   ├── predict.py       # Inference functions
│   └── saved_models/    # Persisted .pkl model files
├── api/
│   ├── vitals.py        # REST endpoints for vitals
│   ├── alerts.py        # REST endpoints for alerts
│   ├── analytics.py     # Analytics endpoints
│   └── websocket.py     # WebSocket streaming
└── core/
    ├── database.py      # DB connection
    └── monitor.py       # Background monitoring loop
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Health check |
| GET | /api/vitals/latest | Latest vital reading |
| GET | /api/vitals/history | Historical readings |
| GET | /api/vitals/stats | Aggregate statistics |
| GET | /api/alerts | Alert events |
| PATCH | /api/alerts/{id}/resolve | Resolve an alert |
| GET | /api/analytics/timeseries | Time-bucketed trends |
| GET | /api/analytics/feature-importance | RF feature importance |
| GET | /api/analytics/classification-report | Model performance |
| WS | /ws/vitals | Real-time vital stream |

## ML Models

- **RandomForestClassifier**: Classifies readings as NORMAL / WARNING / CRITICAL
- **IsolationForest**: Detects anomalous patterns in vital sign data

Models are automatically trained on first startup if `.pkl` files don't exist.
