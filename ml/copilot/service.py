from __future__ import annotations

import re
from typing import Any

import pandas as pd

from ..anomaly.detect import detect_anomalies
from ..forecasting.predict import forecast_energy
from ..root_cause.analysis import analyze_root_cause
from ..recommendations.engine import generate_recommendation
from .prompts import SYSTEM_PROMPT
from .tools import get_anomalies, get_energy_consumption, get_forecast, get_machine_status, get_root_cause, get_recommendations, compare_scenarios, get_energy_intensity


class CopilotService:
    def __init__(self, frame: pd.DataFrame):
        self.frame = frame.copy()
        self.system_prompt = SYSTEM_PROMPT

    def answer_question(self, question: str, context: dict | None = None) -> dict:
        q = (question or "").strip().lower()
        if not q:
            return {"answer": "I don't have enough data to answer that reliably.", "evidence": [], "confidence": "low", "recommended_action": "Request a more specific question."}

        machine_id = (context or {}).get("machine_id")
        evidence = []
        if "why did energy consumption increase" in q or "increase" in q and "energy" in q:
            subset = self.frame.copy()
            if machine_id is not None:
                subset = subset[subset["machine_id"].astype(str) == str(machine_id)]
            if subset.empty:
                return {"answer": "I don't have enough data to determine this reliably.", "evidence": [], "confidence": "low", "recommended_action": "Provide a specific machine or time window."}
            anomalies = detect_anomalies(subset, machine_id=machine_id)
            if anomalies.get("success") and anomalies["anomalies"]:
                anomaly = anomalies["anomalies"][0]
                root_cause = analyze_root_cause(subset, anomaly)
                recommendation = generate_recommendation(anomaly, root_cause)
                evidence.append({"source": "energy_data", "detail": f"An anomaly was found with {anomaly['actual_energy']} kWh versus an expected {anomaly['expected_energy']} kWh."})
                evidence.append({"source": "root_cause", "detail": root_cause.get("summary", "No evidence summary available.")})
                return {
                    "answer": f"Energy consumption increased primarily during the anomaly period for {machine_id or 'the selected machine'}.",
                    "evidence": evidence,
                    "confidence": "medium",
                    "recommended_action": recommendation["title"],
                }
            return {"answer": "I don't have enough data to determine why the energy increased reliably.", "evidence": [], "confidence": "low", "recommended_action": "Inspect the machine history and check for operating anomalies."}

        if "which machine is consuming the most energy" in q or "most energy" in q:
            if "machine_id" in self.frame.columns:
                summary = self.frame.groupby("machine_id")["energy_kwh"].sum().sort_values(ascending=False)
                top = summary.head(1)
                machine = str(top.index[0])
                value = float(top.iloc[0])
                return {"answer": f"{machine} is consuming the most energy with {value:.2f} kWh total.", "evidence": [{"source": "energy_data", "detail": f"Aggregated consumption for {machine} across the dataset."}], "confidence": "medium", "recommended_action": "Review the top-consuming machine for optimization opportunities."}

        if "tomorrow" in q and "forecast" in q:
            forecast = forecast_energy(self.frame, machine_id=machine_id, horizon_hours=24)
            if forecast.get("success"):
                return {"answer": "The forecast indicates the next 24 hours of expected energy demand.", "evidence": [{"source": "forecast", "detail": f"{len(forecast['forecast'])} hourly forecast values were generated."}], "confidence": "medium", "recommended_action": "Use the forecast for proactive load planning."}
            return {"answer": "I don't have enough historical data to provide a reliable forecast.", "evidence": [], "confidence": "low", "recommended_action": "Collect at least 24 hours of energy history for the machine."}

        if "anomal" in q:
            anomalies = detect_anomalies(self.frame, machine_id=machine_id)
            if anomalies.get("success"):
                return {"answer": f"{len(anomalies['anomalies'])} anomalies were identified.", "evidence": [{"source": "anomaly_data", "detail": "Anomaly checks were performed against recent energy norms."}], "confidence": "medium", "recommended_action": "Prioritize high-severity anomalies for investigation."}

        if "compare" in q and "scenario" in q:
            if machine_id is None:
                return {"answer": "I need a machine identifier to compare scenarios properly.", "evidence": [], "confidence": "low", "recommended_action": "Specify a machine_id and time window."}
            baseline = compare_scenarios(self.frame, machine_id=machine_id)
            return {"answer": f"The compared scenario delta is {baseline.get('delta_kwh', 0):.2f} kWh.", "evidence": [{"source": "scenario", "detail": "Scenario comparison used the recent operating baseline."}], "confidence": "medium", "recommended_action": "Use the delta to estimate optimization potential."}

        if "energy intensity" in q:
            intensity = get_energy_intensity(self.frame, machine_id=machine_id)
            if intensity.get("success"):
                return {"answer": "Energy intensity was calculated from energy consumption relative to production output.", "evidence": [{"source": "energy_intensity", "detail": "Intensity metric was derived using energy_kwh and production_units."}], "confidence": "medium", "recommended_action": "Identify machines with unusually high energy intensity."}

        return {"answer": "I don't have enough data to determine this reliably.", "evidence": [], "confidence": "low", "recommended_action": "Ask a question that references a machine, time window, or operational metric."}
