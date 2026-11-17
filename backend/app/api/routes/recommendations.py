from typing import Literal
from uuid import UUID

from fastapi import Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import accessible_factory_ids, require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.integrations import ml_service
from app.models import Anomaly, EnergyReading, Machine, Recommendation, User
from app.schemas import RecommendationGenerateRequest, RecommendationUpdate

router = create_api_router("/api/recommendations", ["recommendations"])


@router.post("/generate", status_code=201, summary="Generate recommendations using the configured ML service")
async def generate_recommendations(
    payload: RecommendationGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    machines = list(
        db.scalars(select(Machine).where(Machine.factory_id == payload.factory_id).limit(100))
    )
    readings = list(
        db.execute(
            select(EnergyReading, Machine)
            .join(Machine, Machine.id == EnergyReading.machine_id)
            .where(Machine.factory_id == payload.factory_id)
            .order_by(EnergyReading.timestamp.desc())
            .limit(5000)
        )
    )
    anomalies = list(
        db.scalars(
            select(Anomaly)
            .where(Anomaly.factory_id == payload.factory_id)
            .order_by(Anomaly.timestamp.desc())
            .limit(100)
        )
    )
    results = await ml_service.generate_recommendations(
        {
            "factory_id": str(payload.factory_id),
            "machines": [{"id": str(row.id), "name": row.name, "status": row.status} for row in machines],
            "recent_energy_readings": [
                {
                    "machine_id": str(machine.id),
                    "timestamp": reading.timestamp.isoformat(),
                    "energy_kwh": reading.energy_kwh,
                    "power_kw": reading.power_kw,
                }
                for reading, machine in readings
            ],
            "recent_anomalies": [
                {"machine_id": str(row.machine_id), "severity": row.severity, "status": row.status}
                for row in anomalies
            ],
        }
    )
    machine_ids = {machine.id for machine in machines}
    saved = []
    for result in results:
        if result.machine_id is not None and result.machine_id not in machine_ids:
            raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned a recommendation for an unknown machine")
        recommendation = Recommendation(
            factory_id=payload.factory_id,
            status="new",
            **result.model_dump(),
        )
        db.add(recommendation)
        saved.append(recommendation)
    db.commit()
    return success(saved, {"created": len(saved)})


@router.get("", summary="List recommendations for accessible factories")
def list_recommendations(
    factory_id: UUID | None = None,
    machine_id: UUID | None = None,
    status: Literal["new", "reviewed", "accepted", "dismissed", "completed"] | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = accessible_factory_ids(db, user)
    if factory_id:
        require_factory_access(db, user, factory_id)
        ids = [factory_id]
    statement = select(Recommendation).where(Recommendation.factory_id.in_(ids))
    if machine_id:
        statement = statement.where(Recommendation.machine_id == machine_id)
    if status:
        statement = statement.where(Recommendation.status == status)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(statement.order_by(Recommendation.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return success(list(rows), {"page": page, "page_size": page_size, "total": total})


@router.get("/{recommendation_id}", summary="Get a recommendation")
def get_recommendation(
    recommendation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(Recommendation, recommendation_id)
    if row is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Recommendation not found")
    require_factory_access(db, user, row.factory_id)
    return success(row)


@router.patch("/{recommendation_id}", summary="Update recommendation status")
def update_recommendation(
    recommendation_id: UUID,
    payload: RecommendationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(Recommendation, recommendation_id)
    if row is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Recommendation not found")
    require_factory_access(db, user, row.factory_id)
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return success(row)
