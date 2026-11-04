from __future__ import annotations

import pandas as pd


def build_forecasting_features(frame: pd.DataFrame, machine_id: str | None = None) -> pd.DataFrame:
    frame = frame.copy()
    if machine_id is not None:
        frame = frame[frame["machine_id"] == machine_id].copy()
    if frame.empty:
        return frame

    frame = frame.sort_values("timestamp").reset_index(drop=True)
    frame["hour"] = frame["timestamp"].dt.hour
    frame["day_of_week"] = frame["timestamp"].dt.day_of_week
    frame["day_of_month"] = frame["timestamp"].dt.day
    frame["month"] = frame["timestamp"].dt.month

    if "shift" in frame.columns:
        frame["shift"] = frame["shift"].astype(str).str.lower()
        shift_map = {"day": 1, "night": 0, "morning": 1, "evening": 2}
        frame["shift"] = frame["shift"].map(lambda value: shift_map.get(value, 0))

    for column in ["machine_load", "runtime_hours", "idle_time", "production_units", "temperature"]:
        if column in frame.columns:
            frame[f"{column}_lag_1"] = frame[column].shift(1)
            frame[f"{column}_lag_2"] = frame[column].shift(2)

    if "energy_kwh" in frame.columns:
        frame["lag_energy_1"] = frame["energy_kwh"].shift(1)
        frame["lag_energy_2"] = frame["energy_kwh"].shift(2)
        frame["lag_energy_24"] = frame["energy_kwh"].shift(24)
        frame["rolling_energy_mean_6"] = frame["energy_kwh"].shift(1).rolling(window=6, min_periods=1).mean()
        frame["rolling_energy_std_6"] = frame["energy_kwh"].shift(1).rolling(window=6, min_periods=1).std().fillna(0)
        if "production_units" in frame.columns:
            frame["energy_per_unit"] = frame["energy_kwh"] / frame["production_units"].replace(0, pd.NA)
        else:
            frame["energy_per_unit"] = 0.0

    if "production_units" in frame.columns and "runtime_hours" in frame.columns:
        frame["production_rate"] = frame["production_units"] / frame["runtime_hours"].replace(0, pd.NA)
    if "machine_load" in frame.columns:
        frame["utilization_rate"] = frame["machine_load"] / 100.0

    frame = frame.dropna(axis=0, how="any").reset_index(drop=True)
    return frame


def maybe_feature_columns(frame: pd.DataFrame) -> list[str]:
    candidates = [
        "hour",
        "day_of_week",
        "day_of_month",
        "month",
        "shift",
        "machine_load",
        "runtime_hours",
        "idle_time",
        "production_units",
        "energy_per_unit",
        "rolling_energy_mean_6",
        "rolling_energy_std_6",
        "lag_energy_1",
        "lag_energy_2",
        "lag_energy_24",
        "production_rate",
        "utilization_rate",
    ]
    return [column for column in candidates if column in frame.columns]
