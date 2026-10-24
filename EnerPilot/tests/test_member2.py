import pandas as pd

from ml import (
    CopilotService,
    analyze_root_cause,
    detect_anomalies,
    evaluate_forecast_model,
    forecast_energy,
    generate_recommendation,
    validate_energy_frame,
)


def _build_energy_data():
    timestamps = pd.date_range("2026-10-01 00:00:00", periods=96, freq="h")
    rows = []
    for i, ts in enumerate(timestamps):
        base = 300 + (i % 24) * 6 + (1 if i % 48 < 24 else 0)
        load = 50 + 30 * ((i % 24) / 24) + (10 if i % 36 < 12 else 0)
        energy = base + (10 if i % 20 == 0 else 0)
        rows.append(
            {
                "timestamp": ts,
                "machine_id": "CNC-03",
                "energy_kwh": energy,
                "power_kw": energy * 0.9,
                "production_units": 100 + (i % 12) * 5,
                "machine_load": load,
                "runtime_hours": 1.0,
                "idle_time": 0.1 if i % 12 else 0.5,
                "temperature": 42 + (i % 8),
                "maintenance_status": "ok",
                "shift": "day" if 6 <= ts.hour < 18 else "night",
                "production_line": "L1",
            }
        )
    # add a clear anomaly spike at the end
    spike_ts = timestamps[-1] + pd.Timedelta(hours=1)
    rows.append(
        {
            "timestamp": spike_ts,
            "machine_id": "CNC-03",
            "energy_kwh": 650,
            "power_kw": 590,
            "production_units": 120,
            "machine_load": 88,
            "runtime_hours": 1.0,
            "idle_time": 0.9,
            "temperature": 58,
            "maintenance_status": "ok",
            "shift": "day",
            "production_line": "L1",
        }
    )
    return pd.DataFrame(rows)


def test_validation_and_forecast():
    data = _build_energy_data()
    cleaned, error = validate_energy_frame(data, required_fields=["timestamp", "machine_id", "energy_kwh", "power_kw"])
    assert error is None
    assert cleaned is not None

    forecast = forecast_energy(cleaned, machine_id="CNC-03", horizon_hours=6)
    assert forecast["success"] is True
    assert len(forecast["forecast"]) == 6
    assert forecast["model_version"] == "forecast-v1"

    metrics = evaluate_forecast_model(cleaned, machine_id="CNC-03", horizon_hours=6)
    assert metrics["success"] is True
    assert "baseline_mae" in metrics
    assert "ml_mae" in metrics


def test_anomaly_and_root_cause():
    data = _build_energy_data()
    cleaned, _ = validate_energy_frame(data, required_fields=["timestamp", "machine_id", "energy_kwh", "power_kw"])
    anomalies = detect_anomalies(cleaned, machine_id="CNC-03")
    assert anomalies["success"] is True
    assert len(anomalies["anomalies"]) >= 1

    anomaly = anomalies["anomalies"][0]
    root_cause = analyze_root_cause(cleaned, anomaly)
    assert root_cause["summary"]
    assert root_cause["contributors"]
    assert root_cause["contributors"][0]["classification"] in {"observed", "correlated", "potential"}

    recommendation = generate_recommendation(anomaly, root_cause)
    assert recommendation["priority"] in {"low", "medium", "high", "critical"}
    assert recommendation["action_type"]


def test_copilot_answering():
    data = _build_energy_data()
    service = CopilotService(data)
    answer = service.answer_question("Why did energy consumption increase yesterday?", context={"machine_id": "CNC-03"})
    assert answer["answer"]
    assert isinstance(answer["evidence"], list)
    assert answer["confidence"] in {"low", "medium", "high"}
    assert answer["recommended_action"]
