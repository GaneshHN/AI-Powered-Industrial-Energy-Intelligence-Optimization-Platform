# EnerPilot Member 2 AI/ML Handoff

## 1. Completed AI Features

This implementation provides the Member 2 AI/ML layer for EnerPilot in a modular structure under `ml/`.

### Forecasting
- Historical data validation and machine filtering
- Feature engineering for temporal and operating signals
- Baseline and Random Forest forecasting flow
- Forecast evaluation with MAE, RMSE, and MAPE
- Forecast inference with `machine_id` and optional `start_time` / `scope` handling

### Anomaly Detection
- Rolling-baseline deviation detection
- Severity scoring with configurable thresholds
- Output payload with expected vs actual energy and anomaly score

### Root Cause Analysis
- Recent historical comparison around anomaly timestamps
- Contributor ranking based on machine/production/operating factors
- Evidence-based summaries that distinguish observed/correlated/potential contributors

### Recommendations
- Structured recommendation payload with priority, reason, affected machine, and action type
- Simulation suggestion flag without claiming guaranteed savings

### Copilot
- Tool-grounded natural-language question answering
- Supported tool patterns for energy demand, machine status, forecast, anomalies, root cause, recommendations, scenarios, and intensity
- Structured responses with `answer`, `evidence`, `confidence`, and `recommended_action`

## 2. Model Versions

| Component | Model/version | Notes |
| --- | --- | --- |
| Forecasting | `forecast-v1` | Random Forest regressor-based prototype |
| Anomaly detection | `anomaly-v1` | Rolling-window baseline scoring |
| Root cause | `root-cause-v1` | Evidence-driven contributor analysis |

## 3. Model Features and Training Approach

### Forecasting features
The forecasting flow creates only supported features from available data, including:
- `hour`
- `day_of_week`
- `day_of_month`
- `month`
- `shift`
- `machine_load`
- `runtime_hours`
- `idle_time`
- `production_units`
- `energy_per_unit`
- `rolling_energy_mean_6`
- `rolling_energy_std_6`
- `lag_energy_1`
- `lag_energy_2`
- `lag_energy_24`
- `production_rate`
- `utilization_rate`

### Training approach
- Baseline comparison and ML evaluation are both present
- Forecasting uses a Random Forest regressor for the ML model
- No deep-learning architecture is used for this prototype

### Evaluation metrics
Measured and returned by `evaluate_forecast_model`:
- `baseline_mae`
- `ml_mae`
- `rmse`
- `mape`

## 4. Input Data Requirements

### Required fields
The system validates required fields before inference. The default required fields are:
- `timestamp`
- `machine_id`
- `energy_kwh`
- `power_kw`

### Optional but supported fields
- `production_units`
- `machine_load`
- `runtime_hours`
- `idle_time`
- `temperature`
- `maintenance_status`
- `shift`
- `production_line`

### Data expectations
- `timestamp`: valid datetime values
- `machine_id`: non-empty string identifier
- `energy_kwh`: numeric, > 0 after validation
- `power_kw`: numeric when required by forecasting
- duplicate timestamps per machine are removed
- missing critical values trigger structured error responses

## 5. Output Schemas

### Forecast output
```python
{
  "success": True,
  "machine_id": "CNC-03",
  "horizon_hours": 24,
  "forecast": [
    {"timestamp": "2026-10-10T10:00:00", "predicted_energy_kwh": 420.5}
  ],
  "model_version": "forecast-v1",
}
```

### Anomaly output
```python
{
  "success": True,
  "machine_id": "CNC-03",
  "anomalies": [
    {
      "machine_id": "CNC-03",
      "timestamp": "2026-10-10T14:00:00",
      "expected_energy": 420.0,
      "actual_energy": 505.0,
      "deviation_percent": 20.2,
      "anomaly_score": 0.91,
      "severity": "high",
      "status": "open",
    }
  ],
  "model_version": "anomaly-v1",
}
```

### Root-cause output
```python
{
  "summary": "Energy consumption increased primarily due to higher machine load.",
  "contributors": [
    {
      "factor": "machine_load",
      "direction": "increase",
      "evidence": "Machine load averaged ...",
      "confidence": 0.82,
      "classification": "correlated",
    }
  ],
  "confidence": 0.82,
  "classification": "evidence_based",
}
```

### Recommendation output
```python
{
  "title": "Review CNC-03 operating conditions",
  "priority": "high",
  "reason": "The strongest observed contributors were machine_load and idle_time during the anomaly period.",
  "affected_machine": "CNC-03",
  "action_type": "investigation",
  "requires_simulation": True,
  "expected_impact": "Potential energy reduction if the contributing factors are corrected.",
}
```

### Copilot output
```python
{
  "answer": "Energy consumption increased primarily during the anomaly period for CNC-03.",
  "evidence": [{"source": "energy_data", "detail": "..."}],
  "confidence": "medium",
  "recommended_action": "Review CNC-03 operating conditions",
}
```

## 6. Error Contract

Structured errors follow the pattern:
```python
{
  "success": False,
  "error": {
    "code": "INSUFFICIENT_HISTORY",
    "message": "At least 24 hours of historical data is required for this forecast."
  }
}
```

Relevant error categories used by the implementation include:
- `INSUFFICIENT_DATA`
- `INVALID_INPUT`
- `MISSING_REQUIRED_FEATURE`
- `MODEL_INFERENCE_FAILED`
- `MODEL_EVALUATION_FAILED`
- `INSUFFICIENT_HISTORY`

## 7. Service Contracts / API Surface

### Member 2 AI service contract
The module exposes public functions via `ml/__init__.py` and the subpackages.

- `validate_energy_frame(...)`
- `forecast_energy(...)`
- `evaluate_forecast_model(...)`
- `detect_anomalies(...)`
- `analyze_root_cause(...)`
- `generate_recommendation(...)`
- `CopilotService.answer_question(...)`

### Member 3 backend integration
Member 3 can wrap these as HTTP endpoints or service calls without changing the underlying module payloads.

### Member 1 frontend expectations
- Forecast payload should include `forecast` and `model_version`
- Anomaly payload should include `anomalies`
- Root cause payload should include `summary` and `contributors`
- Copilot payload should include `answer`, `evidence`, `confidence`, and `recommended_action`

## 8. Environment Variables

This workspace does not require hardcoded secrets or external AI credentials for the default implementation.

If a future LLM integration is added, server-side variables should be used only when required, for example:
- `OPENAI_API_KEY`
- `MODEL_PROVIDER`
- `MODEL_NAME`
- `MODEL_STORAGE_PATH`
- `DATABASE_URL`

Never expose these to the browser or commit them into source control.

## 9. Dependencies

Current project dependencies:
- `pandas>=2.0.0`
- `numpy>=1.26.0`
- `scikit-learn>=1.4.0`
- `pytest>=8.0.0`

No additional AI/LLM SDK is required for the current deterministic Member 2 prototype.

## 10. Known Limitations

This workspace contains a self-contained Member 2 scaffold and not the complete EnerPilot multi-member repository. As a result:
- It is not yet integrated with a real backend database or external service layer
- It does not yet coordinate with Member 1/3/4 runtime contracts in an actual shared application
- It does not include a production-grade model artifact storage strategy or persistent training registry
- It is a prototype for AI/ML functionality, not a full end-to-end production deployment

## 11. Integration Requirements for Other Members

### Member 1 (Frontend)
- Consume structured payloads from the AI service layer
- Render forecast, anomaly, root-cause, and Copilot results using the documented schemas
- Handle empty / low-confidence responses gracefully

### Member 3 (Backend)
- Expose HTTP endpoints for the service contracts above
- Validate inbound request payloads before calling ML logic
- Propagate consistent `success`/`error` shapes to API consumers

### Member 4 (Data pipeline)
- Provide validated industrial data with expected fields
- Ensure `timestamp`, `machine_id`, and energy metrics are present where required
- Surface missing or malformed records before they reach inference

## 12. Summary

The Member 2 AI/ML layer is implemented as a modular, explainable industrial energy intelligence package with deterministic validation, forecasting, anomaly detection, evidence-based root cause analysis, recommendation generation, and tool-grounded Copilot responses. It is designed for clean integration with the broader EnerPilot application, while remaining honest about the fact that the full multi-member repo and runtime stack were not present in this workspace.
