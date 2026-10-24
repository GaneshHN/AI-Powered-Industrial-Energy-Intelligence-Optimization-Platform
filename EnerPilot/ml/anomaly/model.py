from __future__ import annotations

from dataclasses import dataclass

from sklearn.ensemble import IsolationForest


@dataclass
class AnomalyModelBundle:
    model: IsolationForest
    model_version: str = "anomaly-v1"
