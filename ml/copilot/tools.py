from __future__ import annotations

import pandas as pd


def get_energy_consumption(frame: pd.DataFrame, start_time: str, end_time: str, machine_id: str | None = None) -> dict:
    if frame is None or frame.empty:
        return {"success": False, "error": {"code": "INSUFFICIENT_DATA", "message": "No energy data is available."}}
    if "timestamp" not in frame.columns:
        return {"success": False, "error": {"code": "MISSING_REQUIRED_FEATURE", "message": "timestamp is required for energy queries."}}
    try:
        start = pd.Timestamp(start_time)
        end = pd.Timestamp(end_time)
    except Exception:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "start_time and end_time must be valid timestamps."}}
    if start > end:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "start_time must be earlier than or equal to end_time."}}
    subset = frame[(frame["timestamp"] >= start) & (frame["timestamp"] <= end)].copy()
    if machine_id is not None:
        subset = subset[subset["machine_id"].astype(str) == str(machine_id)]
    return {"success": True, "rows": subset.to_dict(orient="records")}


def get_machine_status(frame: pd.DataFrame, machine_id: str | None = None) -> dict:
    if frame is None or frame.empty:
        return {"success": False, "error": {"code": "INSUFFICIENT_DATA", "message": "No machine status data is available."}}
    if "machine_id" not in frame.columns:
        return {"success": False, "error": {"code": "MISSING_REQUIRED_FEATURE", "message": "machine_id is required for machine status queries."}}
    subset = frame.copy()
    if machine_id is not None:
        subset = subset[subset["machine_id"].astype(str) == str(machine_id)]
    if subset.empty:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": f"No data found for machine_id '{machine_id}'."}}
    return {"success": True, "rows": subset.tail(5).to_dict(orient="records")}


def get_forecast(forecast: dict) -> dict:
    if not forecast.get("success"):
        return {"success": False, "error": forecast.get("error", {"code": "INVALID_INPUT", "message": "Forecast unavailable."})}
    return {"success": True, "forecast": forecast["forecast"]}


def get_anomalies(anomalies: dict) -> dict:
    if not anomalies.get("success"):
        return {"success": False, "error": anomalies.get("error", {"code": "INVALID_INPUT", "message": "Anomaly data unavailable."})}
    return {"success": True, "anomalies": anomalies["anomalies"]}


def get_root_cause(root_cause: dict) -> dict:
    if root_cause is None:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "Root-cause data unavailable."}}
    return {"success": True, "root_cause": root_cause}


def get_recommendations(recommendations: list[dict]) -> dict:
    if recommendations is None:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "Recommendations unavailable."}}
    return {"success": True, "recommendations": recommendations}


def compare_scenarios(frame: pd.DataFrame, machine_id: str, baseline_hours: int = 24, target_hours: int = 24) -> dict:
    if frame is None or frame.empty:
        return {"success": False, "error": {"code": "INSUFFICIENT_DATA", "message": "No machine data is available for scenario comparison."}}
    if baseline_hours <= 0 or target_hours <= 0:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "baseline_hours and target_hours must be greater than zero."}}
    if "machine_id" not in frame.columns or "energy_kwh" not in frame.columns:
        return {"success": False, "error": {"code": "MISSING_REQUIRED_FEATURE", "message": "machine_id and energy_kwh are required for scenario comparison."}}
    subset = frame[frame["machine_id"].astype(str) == str(machine_id)].copy()
    if subset.empty:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": f"No data found for machine_id '{machine_id}'."}}
    baseline = subset.tail(baseline_hours)["energy_kwh"].mean() if baseline_hours else subset["energy_kwh"].mean()
    target = subset.tail(target_hours)["energy_kwh"].mean() if target_hours else baseline
    return {"success": True, "baseline_average_kwh": float(baseline), "target_average_kwh": float(target), "delta_kwh": float(target - baseline)}


def get_energy_intensity(frame: pd.DataFrame, machine_id: str | None = None) -> dict:
    if frame is None or frame.empty:
        return {"success": False, "error": {"code": "INSUFFICIENT_DATA", "message": "No machine data available for intensity analysis."}}
    subset = frame.copy()
    if machine_id is not None:
        subset = subset[subset["machine_id"].astype(str) == str(machine_id)]
    if subset.empty:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "No machine data available for intensity analysis."}}
    if "energy_kwh" in subset.columns and "production_units" in subset.columns:
        subset = subset.copy()
        subset["energy_intensity"] = subset["energy_kwh"] / subset["production_units"].replace(0, pd.NA)
        return {"success": True, "energy_intensity": subset[["machine_id", "timestamp", "energy_intensity"]].to_dict(orient="records")}
    return {"success": False, "error": {"code": "MISSING_REQUIRED_FEATURE", "message": "energy_kwh and production_units are required for intensity analysis."}}
