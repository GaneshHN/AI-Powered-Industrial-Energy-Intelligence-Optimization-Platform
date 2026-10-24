from __future__ import annotations

import pandas as pd

from ..common import COMMON_CONFIG, make_error


def _severity_for_deviation(value: float) -> str:
    thresholds = COMMON_CONFIG["severity_thresholds"]
    if value >= thresholds["critical"]:
        return "critical"
    if value >= thresholds["high"]:
        return "high"
    if value >= thresholds["medium"]:
        return "medium"
    if value >= thresholds["low"]:
        return "low"
    return "info"


def severity_for_deviation(deviation_percent: float) -> str:
    return _severity_for_deviation(float(deviation_percent))


def detect_anomalies(frame: pd.DataFrame, machine_id: str | None = None, threshold: float | None = None) -> dict:
    if frame is None or frame.empty:
        return make_error("INSUFFICIENT_DATA", "No data available for anomaly detection.")

    if threshold is None:
        threshold = 15.0

    filtered = frame.copy()
    if machine_id is not None:
        filtered = filtered[filtered["machine_id"].astype(str) == str(machine_id)].copy()
    if filtered.empty:
        return make_error("INVALID_INPUT", f"No data found for machine_id '{machine_id}'.")

    if "energy_kwh" not in filtered.columns:
        return make_error("MISSING_REQUIRED_FEATURE", "energy_kwh is required for anomaly detection.")

    try:
        filtered = filtered.sort_values("timestamp").reset_index(drop=True)
        rolling_mean = filtered["energy_kwh"].shift(1).rolling(window=12, min_periods=3).mean()
        rolling_std = filtered["energy_kwh"].shift(1).rolling(window=12, min_periods=3).std().fillna(0)
        reference = filtered["energy_kwh"].combine(rolling_mean, lambda x, y: y if pd.notna(y) else x)
        deviation = ((filtered["energy_kwh"] - reference) / reference.replace(0, pd.NA)) * 100.0
        mask = (deviation.abs() >= threshold) | (filtered["energy_kwh"] >= reference * 1.25)
        flagged = filtered.loc[mask].copy()
        anomalies = []
        for _, row in flagged.iterrows():
            actual = float(row["energy_kwh"])
            expected = float(reference.loc[row.name]) if row.name in reference.index else actual
            deviation_percent = float(((actual - expected) / expected) * 100.0 if expected else 0.0)
            anomalies.append({
                "machine_id": str(row["machine_id"]),
                "timestamp": pd.Timestamp(row["timestamp"]).isoformat(),
                "expected_energy": float(expected),
                "actual_energy": actual,
                "deviation_percent": round(abs(deviation_percent), 2),
                "anomaly_score": round(min(abs(deviation_percent) / 100.0, 1.0), 2),
                "severity": severity_for_deviation(abs(deviation_percent)),
                "status": "open",
            })
        return {
            "success": True,
            "machine_id": machine_id,
            "anomalies": anomalies,
            "model_version": COMMON_CONFIG["anomaly_version"],
        }
    except Exception as exc:
        return make_error("MODEL_INFERENCE_FAILED", f"Anomaly detection failed: {exc}")
