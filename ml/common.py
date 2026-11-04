from __future__ import annotations

from typing import Iterable, Optional

import pandas as pd

COMMON_CONFIG = {
    "forecast_version": "forecast-v1",
    "anomaly_version": "anomaly-v1",
    "root_cause_version": "root-cause-v1",
    "required_forecasting_fields": [
        "timestamp",
        "machine_id",
        "energy_kwh",
        "power_kw",
    ],
    "required_anomaly_fields": [
        "timestamp",
        "machine_id",
        "energy_kwh",
    ],
    "severity_thresholds": {
        "low": 10.0,
        "medium": 20.0,
        "high": 35.0,
        "critical": 50.0,
    },
}

DEFAULT_REQUIRED_FIELDS = COMMON_CONFIG["required_forecasting_fields"]


def make_error(code: str, message: str, **extra):
    payload = {"success": False, "error": {"code": code, "message": message}}
    payload["error"].update(extra)
    return payload


def ensure_columns(frame: pd.DataFrame, required_fields: Iterable[str], context: str = "data") -> tuple[pd.DataFrame | None, dict | None]:
    missing = [field for field in required_fields if field not in frame.columns]
    if missing:
        return None, make_error(
            "MISSING_REQUIRED_FEATURE",
            f"{context} is missing required feature(s): {', '.join(missing)}.",
            missing_features=missing,
        )
    return frame, None


def validate_energy_frame(
    frame: pd.DataFrame,
    required_fields: Optional[list[str]] = None,
    context: str = "energy data",
) -> tuple[pd.DataFrame | None, dict | None]:
    if frame is None or frame.empty:
        return None, make_error("INSUFFICIENT_DATA", f"{context} is empty or missing.")

    required_fields = list(required_fields or DEFAULT_REQUIRED_FIELDS)
    frame = frame.copy()
    frame, error = ensure_columns(frame, required_fields, context)
    if error:
        return None, error

    # timestamp validation
    try:
        frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="raise")
    except Exception as exc:  # pragma: no cover - branch is explicit validation
        return None, make_error("INVALID_INPUT", f"timestamp values are invalid: {exc}")

    if frame["timestamp"].isna().any():
        return None, make_error("INVALID_INPUT", "timestamp contains null values.")

    # normalize identifiers and numbers
    frame["machine_id"] = frame["machine_id"].astype(str).str.strip()
    frame = frame[frame["machine_id"].ne("")].copy()
    if frame.empty:
        return None, make_error("INVALID_INPUT", "machine_id values are empty after validation.")

    numeric_columns = [
        "energy_kwh",
        "power_kw",
        "production_units",
        "machine_load",
        "runtime_hours",
        "idle_time",
        "temperature",
    ]
    for column in numeric_columns:
        if column in frame.columns:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

    for column in required_fields:
        if column in ["energy_kwh", "power_kw", "production_units", "machine_load", "runtime_hours", "idle_time", "temperature"]:
            if frame[column].isna().any():
                return None, make_error(
                    "MISSING_REQUIRED_FEATURE",
                    f"{column} contains missing values and is required for analysis.",
                    missing_feature=column,
                )

    # duplicate and sorting handling
    duplicate_mask = frame.duplicated(subset=["timestamp", "machine_id"], keep="first")
    if duplicate_mask.any():
        frame = frame.loc[~duplicate_mask].copy()

    frame = frame.sort_values("timestamp", kind="mergesort").reset_index(drop=True)

    # outlier and non-positive validation for energy-like fields
    if "energy_kwh" in frame.columns and (frame["energy_kwh"] <= 0).any():
        frame.loc[frame["energy_kwh"] <= 0, "energy_kwh"] = None
        if frame["energy_kwh"].isna().any():
            return None, make_error(
                "INVALID_INPUT",
                "energy_kwh contains non-positive or missing values that cannot be used safely.",
            )

    return frame, None
