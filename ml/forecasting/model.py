from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestRegressor


@dataclass
class ForecastModelBundle:
    model: RandomForestRegressor
    feature_columns: list[str]
    model_version: str = "forecast-v1"

    def predict(self, features: np.ndarray) -> np.ndarray:
        return self.model.predict(features)
