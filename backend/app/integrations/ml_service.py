from typing import Any

import httpx
from pydantic import ValidationError

from app.core.config import get_settings
from app.core.errors import APIError
from app.schemas import (
    CopilotAnswer,
    MLAnomalyItem,
    MLForecastItem,
    MLRecommendationItem,
    MLRootCauseResponse,
)


async def _post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    base_url = get_settings().ml_service_url
    if not base_url:
        raise APIError(503, "ML_SERVICE_UNAVAILABLE", "The AI service is not configured")
    try:
        async with httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=15.0) as client:
            response = await client.post(path, json=payload)
            response.raise_for_status()
            result = response.json()
    except httpx.TimeoutException:
        raise APIError(504, "ML_SERVICE_TIMEOUT", "The AI service timed out") from None
    except (httpx.HTTPError, ValueError):
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned an invalid response") from None
    if not isinstance(result, dict):
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned an invalid response")
    return result


async def forecast(payload: dict[str, Any]) -> list[MLForecastItem]:
    response = await _post("/forecast", payload)
    rows = response.get("forecasts")
    if not isinstance(rows, list) or len(rows) > 500:
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned an invalid forecast")
    try:
        return [MLForecastItem.model_validate(row) for row in rows]
    except (ValidationError, TypeError):
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned an invalid forecast") from None


async def detect_anomalies(payload: dict[str, Any]) -> list[MLAnomalyItem]:
    response = await _post("/anomalies/detect", payload)
    rows = response.get("anomalies")
    if not isinstance(rows, list) or len(rows) > 1000:
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned invalid anomaly results")
    try:
        return [MLAnomalyItem.model_validate(row) for row in rows]
    except (ValidationError, TypeError):
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned invalid anomaly results") from None


async def generate_recommendations(payload: dict[str, Any]) -> list[MLRecommendationItem]:
    response = await _post("/recommendations", payload)
    rows = response.get("recommendations")
    if not isinstance(rows, list) or len(rows) > 500:
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned invalid recommendations")
    try:
        return [MLRecommendationItem.model_validate(row) for row in rows]
    except (ValidationError, TypeError):
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned invalid recommendations") from None


async def analyze_root_cause(payload: dict[str, Any]) -> MLRootCauseResponse:
    response = await _post("/root-cause/analyze", payload)
    try:
        return MLRootCauseResponse.model_validate(response)
    except ValidationError:
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned an invalid root-cause analysis") from None


async def copilot(payload: dict[str, Any]) -> CopilotAnswer:
    response = await _post("/copilot", payload)
    try:
        return CopilotAnswer.model_validate(response)
    except ValidationError:
        raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned an invalid answer") from None
