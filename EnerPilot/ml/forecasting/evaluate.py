from __future__ import annotations

import pandas as pd

from ..common import COMMON_CONFIG, make_error
from .train import train_forecast_model


def evaluate_forecast_model(frame: pd.DataFrame, machine_id: str | None = None, horizon_hours: int = 24) -> dict:
    if frame is None or frame.empty:
        return make_error("INSUFFICIENT_DATA", "No data available for evaluation.")
    if horizon_hours <= 0:
        return make_error("INVALID_INPUT", "horizon_hours must be greater than zero.")

    training_data = frame.copy()
    if machine_id is not None:
        training_data = training_data[training_data["machine_id"].astype(str) == str(machine_id)].copy()
    if training_data.empty:
        return make_error("INVALID_INPUT", f"No data matching machine_id '{machine_id}'.")

    try:
        model_result = train_forecast_model(training_data, machine_id=machine_id)
        return {
            "success": True,
            "machine_id": machine_id,
            "horizon_hours": horizon_hours,
            "baseline_mae": model_result.baseline_mae,
            "ml_mae": model_result.ml_mae,
            "rmse": model_result.rmse,
            "mape": model_result.mape,
            "model_version": COMMON_CONFIG["forecast_version"],
        }
    except Exception as exc:
        return make_error("MODEL_EVALUATION_FAILED", f"Forecast evaluation failed: {exc}")
