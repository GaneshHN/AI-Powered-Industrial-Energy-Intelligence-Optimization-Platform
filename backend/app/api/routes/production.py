from datetime import datetime
from uuid import UUID

from fastapi import Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.api.validation import validate_time_range
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.models import Machine, ProductionLine, ProductionRecord, User
from app.schemas import ProductionRecordCreate

router = create_api_router("/api/production", ["production"])
MAX_SUMMARY_ROWS = 10_000


def _query(factory_id, machine_id, production_line_id, start_time, end_time, shift):
    validate_time_range(start_time, end_time)
    statement = (
        select(ProductionRecord)
        .join(ProductionLine, ProductionLine.id == ProductionRecord.production_line_id)
        .where(ProductionLine.factory_id == factory_id)
    )
    if machine_id:
        statement = statement.where(ProductionRecord.machine_id == machine_id)
    if production_line_id:
        statement = statement.where(ProductionRecord.production_line_id == production_line_id)
    if start_time:
        statement = statement.where(ProductionRecord.timestamp >= start_time)
    if end_time:
        statement = statement.where(ProductionRecord.timestamp <= end_time)
    if shift:
        statement = statement.where(ProductionRecord.shift == shift)
    return statement


@router.get("", summary="List production records")
def list_production(
    factory_id: UUID,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    statement = _query(factory_id, machine_id, production_line_id, start_time, end_time, shift)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(statement.order_by(ProductionRecord.timestamp.desc()).offset((page - 1) * page_size).limit(page_size))
    return success(list(rows), {"page": page, "page_size": page_size, "total": total})


@router.post("", status_code=201, summary="Record measured production")
def create_production(
    payload: ProductionRecordCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    line = db.get(ProductionLine, payload.production_line_id)
    if line is None or line.factory_id != payload.factory_id:
        raise APIError(422, "INVALID_PRODUCTION_LINE", "Production line must belong to the selected factory")
    if payload.machine_id:
        machine = db.get(Machine, payload.machine_id)
        if machine is None or machine.factory_id != payload.factory_id:
            raise APIError(422, "INVALID_MACHINE", "Machine must belong to the selected factory")
    record = ProductionRecord(**payload.model_dump(exclude={"factory_id"}))
    db.add(record)
    db.commit()
    db.refresh(record)
    return success(record)


def _summary(db, statement):
    records = list(db.scalars(statement.order_by(ProductionRecord.timestamp).limit(MAX_SUMMARY_ROWS + 1)))
    if len(records) > MAX_SUMMARY_ROWS:
        raise APIError(422, "TIME_RANGE_TOO_LARGE", "Reduce the time range to retrieve production analytics")
    return records


@router.get("/summary", summary="Summarize production for a factory")
def summary(
    factory_id: UUID,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    records = _summary(db, _query(factory_id, None, None, start_time, end_time, shift))
    return success({"production_units": round(sum(row.production_units for row in records), 3), "record_count": len(records)})


@router.get("/by-machine", summary="Group production by machine")
def by_machine(
    factory_id: UUID,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    records = _summary(db, _query(factory_id, None, None, start_time, end_time, shift))
    groups: dict[UUID | None, float] = {}
    for record in records:
        groups[record.machine_id] = groups.get(record.machine_id, 0) + record.production_units
    return success([{"machine_id": machine_id, "production_units": round(units, 3)} for machine_id, units in groups.items()])


@router.get("/by-shift", summary="Group production by recorded shift")
def by_shift(
    factory_id: UUID,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    records = _summary(db, _query(factory_id, None, None, start_time, end_time, None))
    groups: dict[str, float] = {}
    for record in records:
        groups[record.shift] = groups.get(record.shift, 0) + record.production_units
    return success([{"shift": shift, "production_units": round(units, 3)} for shift, units in sorted(groups.items())])
