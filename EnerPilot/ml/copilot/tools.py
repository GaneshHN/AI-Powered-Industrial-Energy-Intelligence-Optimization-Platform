from __future__ import annotations

from typing import Any

import pandas as pd


def get_energy_consumption(frame: pd.DataFrame, start_time: str, end_time: str, machine_id: str | None = None) -> dict:
    if frame is None or frame.empty:
        return {"success": False, "error": {"code": "INSUFFICIENT_DATA", "message": "No energy data is available."}}
    start = pd.Timestamp(start_time)
    end = pd.Timestamp(end_time)
    subset = frame[(frame["timestamp"] >= start) & (frame["timestamp"] <= end)].copy()
    if machine_id is not None:
        subset = subset[subset["machine_id"].astype(str) == str(machine_id)]
    return {"success": True, "rows": subset.to_dict(orient="records")}


def get_machine_status(frame: pd.DataFrame, machine_id: str | None = None) -> dict:
    if frame is None or frame.empty:
        return {"success": False, "error": {"code": "INSUFFICIENT_DATA", "message": "No machine status data is available."}}
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
    return {"success": True, "root_cause": root_cause}


def get_recommendations(recommendations: list[dict]) -> dict:
    return {"success": True, "recommendations": recommendations}


def compare_scenarios(frame: pd.DataFrame, machine_id: str, baseline_hours: int = 24, target_hours: int = 24) -> dict:
    subset = frame[frame["machine_id"].astype(str) == str(machine_id)].copy()
    if subset.empty:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": f"No data found for machine_id '{machine_id}'."}}
    baseline = subset.tail(baseline_hours)["energy_kwh"].mean() if baseline_hours else subset["energy_kwh"].mean()
    target = subset.tail(target_hours)["energy_kwh"].mean() if target_hours else baseline
    return {"success": True, "baseline_average_kwh": float(baseline), "target_average_kwh": float(target), "delta_kwh": float(target - baseline)}


def get_energy_intensity(frame: pd.DataFrame, machine_id: str | None = None) -> dict:
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
