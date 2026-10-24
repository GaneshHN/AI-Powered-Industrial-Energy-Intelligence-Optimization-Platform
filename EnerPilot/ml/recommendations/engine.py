from __future__ import annotations


def generate_recommendation(anomaly: dict, root_cause: dict) -> dict:
    machine_id = anomaly.get("machine_id", "unknown")
    severity = anomaly.get("severity", "medium")
    contributors = root_cause.get("contributors", []) or []
    reasons = []
    for item in contributors[:2]:
        reasons.append(item.get("factor", "machine operating conditions"))

    reason_text = " and ".join(reasons) if reasons else "operating conditions"
    title = f"Review {machine_id} operating conditions"
    priority = severity if severity in {"low", "medium", "high", "critical"} else "medium"

    return {
        "title": title,
        "priority": priority,
        "reason": f"The strongest observed contributors were {reason_text} during the anomaly period.",
        "affected_machine": machine_id,
        "action_type": "investigation",
        "requires_simulation": True,
        "expected_impact": "Potential energy reduction if the contributing factors are corrected.",
    }
