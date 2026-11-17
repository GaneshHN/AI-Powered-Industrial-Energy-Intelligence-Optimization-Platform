from datetime import datetime
from typing import Literal
from uuid import UUID

from fastapi import Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import accessible_factory_ids, require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.api.validation import validate_time_range
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.integrations import ml_service
from app.models import Anomaly, EnergyReading, Machine, User
from app.schemas import AnomalyDetectRequest

router = create_api_router("/api/anomalies", ["anomalies"])


@router.get("", summary="List accessible anomalies with filters")
def list_anomalies(
    factory_id: UUID | None = None,
    machine_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    status: Literal["new", "reviewed", "resolved"] | None = None,
    severity: Literal["low", "medium", "high", "critical"] | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = accessible_factory_ids(db, user)
    if factory_id:
        require_factory_access(db, user, factory_id)
        ids = [factory_id]
    statement = select(Anomaly).where(Anomaly.factory_id.in_(ids))
    for column, value in ((Anomaly.machine_id, machine_id), (Anomaly.status, status), (Anomaly.severity, severity)):
        if value is not None:
            statement = statement.where(column == value)
    if start_time:
        statement = statement.where(Anomaly.timestamp >= start_time)
    if end_time:
        statement = statement.where(Anomaly.timestamp <= end_time)
    validate_time_range(start_time, end_time)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(statement.order_by(Anomaly.timestamp.desc()).offset((page - 1) * page_size).limit(page_size))
    return success(list(rows), {"page": page, "page_size": page_size, "total": total})


@router.get("/{anomaly_id}", summary="Get an accessible anomaly")
def get_anomaly(
    anomaly_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    anomaly = db.get(Anomaly, anomaly_id)
    if anomaly is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Anomaly not found")
    require_factory_access(db, user, anomaly.factory_id)
    return success(anomaly)


@router.post("/detect", summary="Run anomaly detection through the configured ML service")
async def detect_anomalies(
    payload: AnomalyDetectRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    readings_query = (
        select(EnergyReading, Machine)
        .join(Machine, Machine.id == EnergyReading.machine_id)
        .where(Machine.factory_id == payload.factory_id)
        .order_by(EnergyReading.timestamp)
        .limit(5001)
    )
    if payload.machine_id:
        readings_query = readings_query.where(Machine.id == payload.machine_id)
    if payload.start_time:
        readings_query = readings_query.where(EnergyReading.timestamp >= payload.start_time)
    if payload.end_time:
        readings_query = readings_query.where(EnergyReading.timestamp <= payload.end_time)
    rows = list(db.execute(readings_query))
    if len(rows) > 5000:
        raise APIError(422, "TIME_RANGE_TOO_LARGE", "Reduce the time range to detect anomalies")
    results = await ml_service.detect_anomalies(
        {
            "factory_id": str(payload.factory_id),
            "readings": [
                {
                    "machine_id": str(machine.id),
                    "timestamp": reading.timestamp.isoformat(),
                    "energy_kwh": reading.energy_kwh,
                    "power_kw": reading.power_kw,
                }
                for reading, machine in rows
            ],
        }
    )
    saved = []
    for result in results:
        machine = db.get(Machine, result.machine_id)
        if machine is None or machine.factory_id != payload.factory_id:
            raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned a result for an unknown machine")
        anomaly = Anomaly(factory_id=payload.factory_id, **result.model_dump())
        db.add(anomaly)
        saved.append(anomaly)
    db.commit()
    return success(saved, {"created": len(saved)})
