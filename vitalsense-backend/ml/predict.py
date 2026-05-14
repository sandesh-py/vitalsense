"""
ML inference module.
Loads persisted models and provides prediction functions.
Uses a lazy-loading singleton pattern to avoid reloading on every call.
"""

import numpy as np
import joblib
from pathlib import Path
from config import MODEL_DIR

# ── Lazy-loaded singletons ──
_classifier = None
_anomaly_detector = None
_clf_report = None
_feature_names = None


def _load_classifier():
    global _classifier, _clf_report, _feature_names
    if _classifier is None:
        path = MODEL_DIR / "classifier.pkl"
        if not path.exists():
            raise FileNotFoundError(f"Classifier not found at {path}. Run training first.")
        data = joblib.load(path)
        _classifier = data["model"]
        _clf_report = data.get("report", {})
        _feature_names = data.get("features", [])
    return _classifier


def _load_anomaly_detector():
    global _anomaly_detector
    if _anomaly_detector is None:
        path = MODEL_DIR / "anomaly_detector.pkl"
        if not path.exists():
            raise FileNotFoundError(f"Anomaly detector not found at {path}. Run training first.")
        data = joblib.load(path)
        _anomaly_detector = data["model"]
    return _anomaly_detector


def models_exist() -> bool:
    """Check if trained model files exist."""
    return (MODEL_DIR / "classifier.pkl").exists() and (MODEL_DIR / "anomaly_detector.pkl").exists()


def compute_rolling_features(recent_readings: list[dict]) -> dict:
    """
    Compute rolling window features from the last N readings.
    Returns a dict with the additional feature columns.
    """
    if not recent_readings:
        return {"hr_rolling_mean_10": 75.0, "hr_rolling_std_10": 0.0, "spo2_rolling_min_5": 97.0}

    hrs = [r.get("heart_rate", 75.0) for r in recent_readings[-10:]]
    spo2s = [r.get("spo2", 97.0) for r in recent_readings[-5:]]

    return {
        "hr_rolling_mean_10": round(float(np.mean(hrs)), 2),
        "hr_rolling_std_10": round(float(np.std(hrs)), 2) if len(hrs) > 1 else 0.0,
        "spo2_rolling_min_5": round(float(min(spo2s)), 1),
    }


def _build_feature_vector(vitals: dict, rolling: dict) -> np.ndarray:
    """Build feature array in the correct order."""
    return np.array([[
        vitals.get("heart_rate", 75.0),
        vitals.get("spo2", 97.0),
        vitals.get("temperature", 36.6),
        vitals.get("systolic_bp", 120),
        vitals.get("diastolic_bp", 78),
        vitals.get("respiratory_rate", 16),
        rolling.get("hr_rolling_mean_10", 75.0),
        rolling.get("hr_rolling_std_10", 0.0),
        rolling.get("spo2_rolling_min_5", 97.0),
    ]])


def predict_condition(vitals: dict, rolling: dict = None) -> dict:
    """
    Predict patient condition using Random Forest.
    Returns: { label: str, confidence: float, probabilities: dict }
    """
    clf = _load_classifier()
    if rolling is None:
        rolling = compute_rolling_features([])

    X = _build_feature_vector(vitals, rolling)
    label = clf.predict(X)[0]
    proba = clf.predict_proba(X)[0]
    classes = clf.classes_

    prob_dict = {str(c): round(float(p), 4) for c, p in zip(classes, proba)}
    confidence = round(float(max(proba)), 4)

    return {
        "label": label,
        "confidence": confidence,
        "probabilities": prob_dict,
    }


def detect_anomaly(vitals: dict, rolling: dict = None) -> dict:
    """
    Detect anomaly using Isolation Forest.
    Returns: { is_anomaly: bool, score: float, threshold: float }
    """
    iso = _load_anomaly_detector()
    if rolling is None:
        rolling = compute_rolling_features([])

    X = _build_feature_vector(vitals, rolling)
    score = float(iso.decision_function(X)[0])
    prediction = int(iso.predict(X)[0])  # 1 = normal, -1 = anomaly

    return {
        "is_anomaly": prediction == -1,
        "score": round(score, 4),
        "threshold": round(float(iso.offset_), 4),
    }


def get_feature_importance() -> list[dict]:
    """Return feature importance from the trained Random Forest."""
    clf = _load_classifier()
    importances = clf.feature_importances_
    features = _feature_names or [
        "heart_rate", "spo2", "temperature", "systolic_bp",
        "diastolic_bp", "respiratory_rate",
        "hr_rolling_mean_10", "hr_rolling_std_10", "spo2_rolling_min_5",
    ]
    items = sorted(
        [{"feature": f, "importance": round(float(imp), 4)} for f, imp in zip(features, importances)],
        key=lambda x: x["importance"],
        reverse=True,
    )
    for rank, item in enumerate(items, 1):
        item["rank"] = rank
    return items


def get_classification_report() -> dict:
    """Return the sklearn classification report as structured JSON."""
    _load_classifier()
    return _clf_report or {}
