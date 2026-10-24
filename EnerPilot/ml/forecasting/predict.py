from __future__ import annotations

import pandas as pd

from ..common import COMMON_CONFIG, make_error
from .features import build_forecasting_features, maybe_feature_columns
from .train import train_forecast_model


def forecast_energy(frame: pd.DataFrame, machine_id: str | None = None, horizon_hours: int = 24, start_time: str | None = None) -> dict:
    if horizon_hours <= 0:
        return make_error("INVALID_INPUT", "horizon_hours must be greater than zero.")
    if frame is None or frame.empty:
        return make_error("INSUFFICIENT_DATA", "No data available for forecasting.")

    if machine_id is None and "machine_id" in frame.columns:
        machine_ids = sorted(frame["machine_id"].dropna().unique().tolist())
        if len(machine_ids) == 1:
            machine_id = machine_ids[0]

    filtered = frame.copy()
    if machine_id is not None:
        filtered = filtered[filtered["machine_id"].astype(str) == str(machine_id)].copy()
    if filtered.empty:
        return make_error("INVALID_INPUT", f"No data found for machine_id '{machine_id}'.")

    try:
        history = filtered.copy()
        history["timestamp"] = pd.to_datetime(history["timestamp"])
        history = history.sort_values("timestamp").reset_index(drop=True)
        if len(history) < 24:
            return make_error("INSUFFICIENT_HISTORY", "At least 24 hours of historical data is required for this forecast.")

        training = train_forecast_model(history, machine_id=machine_id)
        last_row = history.iloc[-1].copy()
        future_rows = []
        for step in range(1, horizon_hours + 1):
            next_ts = last_row["timestamp"] + pd.Timedelta(hours=step)
            row = last_row.copy()
            row["timestamp"] = next_ts
            future_rows.append(row)

        future_df = pd.DataFrame(future_rows)
        features_df = build_forecasting_features(pd.concat([history, future_df], ignore_index=True), machine_id=machine_id)
        if features_df.empty:
            return make_error("MODEL_INFERENCE_FAILED", "Forecast feature generation produced no usable rows.")

        feature_columns = maybe_feature_columns(features_df)
        if not feature_columns:
            return make_error("MODEL_INFERENCE_FAILED", "Forecast model cannot be trained with the available feature set.")

        prediction_rows = features_df.tail(horizon_hours).copy()
        prediction_values = training.model.predict(prediction_rows[feature_columns])
        forecast = []
        for idx, value in enumerate(prediction_values):
            timestamp = prediction_rows.iloc[idx]["timestamp"]
            forecast.append({
                "timestamp": timestamp.isoformat(),
                "predicted_energy_kwh": float(value),
            })

        return {
            "success": True,
            "machine_id": machine_id,
            "horizon_hours": horizon_hours,
            "forecast": forecast,
            "model_version": COMMON_CONFIG["forecast_version"],
        }
    except Exception as exc:
        return make_error("MODEL_INFERENCE_FAILED", f"Forecasting failed: {exc}")
