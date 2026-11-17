from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.core.database import get_db
from app.core.security import get_current_user
from app.integrations import ml_service
from app.models import Alert, Anomaly, EnergyReading, Machine, ProductionLine, ProductionRecord, Recommendation, User
from app.schemas import CopilotRequest

router = create_api_router("/api/copilot", ["copilot"])


@router.post("", summary="Ask the AI service a question grounded in authorized factory data")
async def ask_copilot(
    payload: CopilotRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    energy = db.scalar(
        select(func.coalesce(func.sum(EnergyReading.energy_kwh), 0))
        .join(Machine, Machine.id == EnergyReading.machine_id)
        .where(Machine.factory_id == payload.factory_id)
    )
    production = db.scalar(
        select(func.coalesce(func.sum(ProductionRecord.production_units), 0))
        .join(ProductionLine, ProductionLine.id == ProductionRecord.production_line_id)
        .where(ProductionLine.factory_id == payload.factory_id)
    )
    machines = list(
        db.scalars(select(Machine).where(Machine.factory_id == payload.factory_id).limit(100))
    )
    anomalies = list(
        db.scalars(
            select(Anomaly).where(Anomaly.factory_id == payload.factory_id).order_by(Anomaly.timestamp.desc()).limit(20)
        )
    )
    recommendations = list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.factory_id == payload.factory_id)
            .order_by(Recommendation.created_at.desc())
            .limit(20)
        )
    )
    alerts = list(
        db.scalars(
            select(Alert)
            .where(Alert.factory_id == payload.factory_id)
            .order_by(Alert.created_at.desc())
            .limit(20)
        )
    )
    answer = await ml_service.copilot(
        {
            "question": payload.question,
            "context": {
                "factory_id": str(payload.factory_id),
                "energy_readings_total_kwh": float(energy or 0),
                "production_records_total_units": float(production or 0),
                "machines": [{"id": str(row.id), "name": row.name, "status": row.status} for row in machines],
                "recent_anomalies": [
                    {"id": str(row.id), "machine_id": str(row.machine_id), "severity": row.severity, "status": row.status}
                    for row in anomalies
                ],
                "recommendations": [
                    {"id": str(row.id), "title": row.title, "status": row.status, "priority": row.priority}
                    for row in recommendations
                ],
                "alerts": [
                    {"id": str(row.id), "title": row.title, "severity": row.severity, "status": row.status, "is_read": row.is_read}
                    for row in alerts
                ],
            },
            "allowed_tools": [
                "get_energy_consumption",
                "get_machine_status",
                "get_anomalies",
                "get_recommendations",
                "get_alerts",
                "get_production_summary",
            ],
        }
    )
    return success(answer)
