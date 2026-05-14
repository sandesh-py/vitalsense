"""
ML model training script.
Generates synthetic labeled data and trains:
  - RandomForestClassifier for condition classification (NORMAL/WARNING/CRITICAL)
  - IsolationForest for anomaly detection
"""

import sys
import os
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Allow imports when run as a script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from data.generator import new_generator
from config import MODEL_DIR


def label_condition(row) -> str:
    """Assign condition labels based on clinical thresholds."""
    if row["heart_rate"] > 130 or row["heart_rate"] < 45 or row["spo2"] < 90 or row["temperature"] > 39:
        return "CRITICAL"
    if row["heart_rate"] > 105 or row["heart_rate"] < 52 or row["spo2"] < 94 or row["temperature"] > 38:
        return "WARNING"
    return "NORMAL"


def compute_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add rolling window features to the dataframe."""
    df["hr_rolling_mean_10"] = df["heart_rate"].rolling(window=10, min_periods=1).mean()
    df["hr_rolling_std_10"] = df["heart_rate"].rolling(window=10, min_periods=1).std().fillna(0)
    df["spo2_rolling_min_5"] = df["spo2"].rolling(window=5, min_periods=1).min()
    return df


FEATURE_COLS = [
    "heart_rate", "spo2", "temperature", "systolic_bp",
    "diastolic_bp", "respiratory_rate",
    "hr_rolling_mean_10", "hr_rolling_std_10", "spo2_rolling_min_5",
]


def train_models():
    """Generate training data, train models, save to disk."""
    print("\n  [*] Generating 5000 synthetic training samples...")
    gen = new_generator()
    samples = gen.generate_batch(5000)
    df = pd.DataFrame(samples)

    # Add rolling features
    df = compute_rolling_features(df)

    # Label conditions
    df["condition_label"] = df.apply(label_condition, axis=1)

    print(f"  [OK] Data generated -- distribution:")
    print(f"    NORMAL:   {(df['condition_label'] == 'NORMAL').sum()}")
    print(f"    WARNING:  {(df['condition_label'] == 'WARNING').sum()}")
    print(f"    CRITICAL: {(df['condition_label'] == 'CRITICAL').sum()}")

    X = df[FEATURE_COLS].values
    y = df["condition_label"].values

    # ── Train Random Forest Classifier ──
    print("\n  [*] Training RandomForestClassifier...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    report = classification_report(y_test, y_pred)
    print("\n  -- Classification Report --")
    print(report)

    # Save structured report for API
    report_dict = classification_report(y_test, y_pred, output_dict=True)

    clf_path = MODEL_DIR / "classifier.pkl"
    joblib.dump({"model": clf, "report": report_dict, "features": FEATURE_COLS}, clf_path)
    print(f"  [OK] Classifier saved -> {clf_path}")

    # ── Train Isolation Forest ──
    print("\n  [*] Training IsolationForest...")
    iso = IsolationForest(contamination=0.08, random_state=42, n_jobs=-1)
    iso.fit(X)

    iso_path = MODEL_DIR / "anomaly_detector.pkl"
    joblib.dump({"model": iso, "features": FEATURE_COLS}, iso_path)
    print(f"  [OK] Anomaly detector saved -> {iso_path}")

    # Feature importance
    importances = clf.feature_importances_
    fi = sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1], reverse=True)
    print("\n  -- Feature Importance --")
    for rank, (feat, imp) in enumerate(fi, 1):
        print(f"    {rank}. {feat}: {imp:.4f}")

    print("\n  [OK] All models trained and saved successfully!\n")
    return clf, iso


if __name__ == "__main__":
    train_models()
