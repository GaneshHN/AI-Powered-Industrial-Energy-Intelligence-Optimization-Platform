from __future__ import annotations

import pandas as pd


def analyze_root_cause(frame: pd.DataFrame, anomaly: dict) -> dict:
    machine_id = anomaly.get("machine_id")
    timestamp = anomaly.get("timestamp")
    if frame is None or frame.empty:
        return {"summary": "Insufficient data to determine root cause.", "contributors": [], "confidence": 0.0, "classification": "insufficient_data"}

    relevant = frame[frame["machine_id"].astype(str) == str(machine_id)].copy()
    if relevant.empty:
        return {"summary": "No matching machine history was available for root-cause analysis.", "contributors": [], "confidence": 0.0, "classification": "insufficient_data"}

    relevant = relevant[relevant["timestamp"] <= pd.Timestamp(timestamp)].copy() if timestamp else relevant.copy()
    if relevant.empty:
        return {"summary": "No historical data was available around the anomaly timestamp.", "contributors": [], "confidence": 0.0, "classification": "insufficient_data"}

    relevant = relevant.sort_values("timestamp").reset_index(drop=True)
    recent = relevant.tail(12).copy()

    summary_bits = []
    contributors = []

    if "machine_load" in relevant.columns:
        recent_load = recent["machine_load"].mean()
        baseline_load = relevant["machine_load"].mean()
        if recent_load > baseline_load:
            contributors.append({
                "factor": "machine_load",
                "direction": "increase",
                "evidence": f"Machine load averaged {recent_load:.2f}% versus a historical mean of {baseline_load:.2f}%.",
                "confidence": 0.82,
                "classification": "correlated",
            })
            summary_bits.append("higher machine load")

    if "idle_time" in relevant.columns:
        recent_idle = recent["idle_time"].mean()
        baseline_idle = relevant["idle_time"].mean()
        if recent_idle > baseline_idle:
            contributors.append({
                "factor": "idle_time",
                "direction": "increase",
                "evidence": f"Idle time averaged {recent_idle:.2f}h versus a baseline of {baseline_idle:.2f}h.",
                "confidence": 0.74,
                "classification": "correlated",
            })
            summary_bits.append("extended idle time")

    if "production_units" in relevant.columns:
        recent_prod = recent["production_units"].mean()
        baseline_prod = relevant["production_units"].mean()
        if recent_prod > baseline_prod:
            contributors.append({
                "factor": "production_units",
                "direction": "increase",
                "evidence": f"Production volume was {recent_prod:.2f} units against a baseline of {baseline_prod:.2f} units.",
                "confidence": 0.69,
                "classification": "potential",
            })
            summary_bits.append("increased production output")

    if not contributors:
        contributors.append({
            "factor": "energy_kwh",
            "direction": "increase",
            "evidence": "No single operational variable showed a clear threshold change during the anomaly window.",
            "confidence": 0.42,
            "classification": "observed",
        })
        summary_bits.append("elevated energy consumption without a dominant operational driver")

    summary = "Energy consumption increased primarily due to " + ", ".join(summary_bits[:2]) + "."
    return {
        "summary": summary,
        "contributors": contributors[:5],
        "confidence": round(max(item["confidence"] for item in contributors), 2),
        "classification": "evidence_based",
    }
