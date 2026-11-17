from datetime import datetime, timedelta, timezone
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
from app.models import EnergyReading, Machine, MaintenanceRecord, ProductionLine, ProductionRecord, User
from app.schemas import MachineCreate, MachineUpdate

router = create_api_router("/api/machines", ["machines"])
DETAIL_QUERY_LIMIT = 10_000


@router.get("", summary="List machines with optional factory, line, and status filters")
def list_machines(
    factory_id: UUID | None = None,
    production_line_id: UUID | None = None,
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = accessible_factory_ids(db, user)
    if factory_id:
        require_factory_access(db, user, factory_id)
        ids = [factory_id]
    statement = select(Machine).where(Machine.factory_id.in_(ids))
    if production_line_id:
        line = db.get(ProductionLine, production_line_id)
        if line is None or line.factory_id not in ids:
            raise APIError(404, "RESOURCE_NOT_FOUND", "Production line not found")
        statement = statement.where(Machine.production_line_id == production_line_id)
    if status:
        if status not in {"available", "running", "maintenance", "offline"}:
            raise APIError(422, "INVALID_FILTER", "Invalid machine status")
        statement = statement.where(Machine.status == status)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(statement.order_by(Machine.name).offset((page - 1) * page_size).limit(page_size))
    return success(list(rows), {"page": page, "page_size": page_size, "total": total})


@router.post("", status_code=201, summary="Create a machine in an accessible factory")
def create_machine(
    payload: MachineCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    if payload.production_line_id:
        line = db.get(ProductionLine, payload.production_line_id)
        if line is None or line.factory_id != payload.factory_id:
            raise APIError(422, "INVALID_PRODUCTION_LINE", "Production line must belong to the selected factory")
    machine = Machine(**payload.model_dump())
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return success(machine)


@router.get("/{machine_id}", summary="Get machine details and recent operational metrics")
def get_machine(
    machine_id: UUID,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Machine not found")
    require_factory_access(db, user, machine.factory_id)
    end = end_time or datetime.now(timezone.utc)
    start = start_time or end - timedelta(hours=24)
    validate_time_range(start, end)
    readings = list(
        db.scalars(
            select(EnergyReading)
            .where(EnergyReading.machine_id == machine_id, EnergyReading.timestamp >= start, EnergyReading.timestamp <= end)
            .order_by(EnergyReading.timestamp)
            .limit(DETAIL_QUERY_LIMIT + 1)
        )
    )
    if len(readings) > DETAIL_QUERY_LIMIT:
        raise APIError(422, "TIME_RANGE_TOO_LARGE", "Reduce the time range to retrieve machine details")
    total_energy = sum(item.energy_kwh for item in readings)
    runtime = min((total_energy / (machine.rated_power_kw * machine.load_factor)) if machine.load_factor else 0, 24 * 366)
    duration = max((end - start).total_seconds() / 3600, 0)
    production = db.scalar(
        select(func.coalesce(func.sum(ProductionRecord.production_units), 0))
        .where(ProductionRecord.machine_id == machine_id, ProductionRecord.timestamp >= start, ProductionRecord.timestamp <= end)
    )
    maintenance = list(
        db.scalars(
            select(MaintenanceRecord)
            .where(MaintenanceRecord.machine_id == machine_id, MaintenanceRecord.start_time <= end)
            .order_by(MaintenanceRecord.start_time.desc())
            .limit(20)
        )
    )
    metrics = {
        "energy_kwh": round(total_energy, 3),
        "power_kw": round(max((item.power_kw for item in readings), default=0), 3),
        "utilization_percent": round(min(runtime / duration * 100, 100), 2) if duration else 0,
        "runtime_hours_estimated": round(runtime, 3),
        "idle_hours_estimated": round(max(duration - runtime, 0), 3),
        "production_units": float(production or 0),
        "maintenance": maintenance,
        "metrics_are_estimates": True,
    }
    return success({"machine": machine, **metrics})


@router.patch("/{machine_id}", summary="Update an accessible machine")
def update_machine(
    machine_id: UUID,
    payload: MachineUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Machine not found")
    require_factory_access(db, user, machine.factory_id)
    updates = payload.model_dump(exclude_unset=True)
    if "production_line_id" in updates and updates["production_line_id"]:
        line = db.get(ProductionLine, updates["production_line_id"])
        if line is None or line.factory_id != machine.factory_id:
            raise APIError(422, "INVALID_PRODUCTION_LINE", "Production line must belong to the machine's factory")
    for key, value in updates.items():
        setattr(machine, key, value)
    db.commit()
    db.refresh(machine)
    return success(machine)
