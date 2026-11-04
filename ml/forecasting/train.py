from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from .features import build_forecasting_features, maybe_feature_columns


@dataclass
class ForecastTrainingResult:
    model: RandomForestRegressor
    features: list[str]
    baseline_mae: float
    ml_mae: float
    rmse: float
    mape: float


def train_forecast_model(frame: pd.DataFrame, machine_id: str | None = None) -> ForecastTrainingResult:
    features_df = build_forecasting_features(frame, machine_id=machine_id)
    if features_df.empty:
        raise ValueError("Not enough valid data to train forecasting model.")

    feature_columns = maybe_feature_columns(features_df)
    if not feature_columns:
        raise ValueError("No supported forecasting features were available for the supplied dataset.")

    target = "energy_kwh"
    X = features_df[feature_columns]
    y = features_df[target]

    baseline_prediction = y.shift(1).fillna(y.mean())
    baseline_mae = mean_absolute_error(y, baseline_prediction)

    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X, y)

    predicted = model.predict(X)
    ml_mae = mean_absolute_error(y, predicted)
    rmse = float(np.sqrt(mean_squared_error(y, predicted)))
    mape = np.mean(np.abs((y - predicted) / np.maximum(y, 1e-6))) * 100.0

    return ForecastTrainingResult(
        model=model,
        features=feature_columns,
        baseline_mae=float(baseline_mae),
        ml_mae=float(ml_mae),
        rmse=float(rmse),
        mape=float(mape),
    )
