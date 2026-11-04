from __future__ import annotations

import pandas as pd

from ..common import COMMON_CONFIG, make_error
from .predict import _prepare_forecast_history
from .train import train_forecast_model


def evaluate_forecast_model(frame: pd.DataFrame, machine_id: str | None = None, horizon_hours: int = 24, start_time: str | None = None, scope: str | None = None) -> dict:
    if frame is None or frame.empty:
        return make_error("INSUFFICIENT_DATA", "No data available for evaluation.")
    if horizon_hours <= 0:
        return make_error("INVALID_INPUT", "horizon_hours must be greater than zero.")

    training_data, resolved_machine_id, error = _prepare_forecast_history(frame, machine_id=machine_id, start_time=start_time, scope=scope)
    if error:
        return error

    try:
        model_result = train_forecast_model(training_data, machine_id=resolved_machine_id)
        return {
            "success": True,
            "machine_id": resolved_machine_id,
            "horizon_hours": horizon_hours,
            "baseline_mae": model_result.baseline_mae,
            "ml_mae": model_result.ml_mae,
            "rmse": model_result.rmse,
            "mape": model_result.mape,
            "model_version": COMMON_CONFIG["forecast_version"],
        }
    except Exception as exc:
        return make_error("MODEL_EVALUATION_FAILED", f"Forecast evaluation failed: {exc}")
