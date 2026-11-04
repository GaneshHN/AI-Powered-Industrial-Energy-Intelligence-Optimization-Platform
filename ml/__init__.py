"""EnerPilot machine learning and AI modules."""

from .common import COMMON_CONFIG, DEFAULT_REQUIRED_FIELDS, make_error, validate_energy_frame
from .forecasting import build_forecasting_features, evaluate_forecast_model, forecast_energy, train_forecast_model
from .anomaly import detect_anomalies, severity_for_deviation
from .root_cause import analyze_root_cause
from .recommendations import generate_recommendation
from .copilot import CopilotService, SYSTEM_PROMPT, get_anomalies, get_energy_consumption, get_forecast, get_machine_status, get_root_cause, get_recommendations, compare_scenarios, get_energy_intensity

__all__ = [
    "COMMON_CONFIG",
    "DEFAULT_REQUIRED_FIELDS",
    "make_error",
    "validate_energy_frame",
    "build_forecasting_features",
    "train_forecast_model",
    "forecast_energy",
    "evaluate_forecast_model",
    "detect_anomalies",
    "severity_for_deviation",
    "analyze_root_cause",
    "generate_recommendation",
    "CopilotService",
    "SYSTEM_PROMPT",
    "get_energy_consumption",
    "get_machine_status",
    "get_forecast",
    "get_anomalies",
    "get_root_cause",
    "get_recommendations",
    "compare_scenarios",
    "get_energy_intensity",
]
