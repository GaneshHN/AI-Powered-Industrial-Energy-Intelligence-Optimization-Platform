from collections import defaultdict
from datetime import datetime
from uuid import UUID

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.api.validation import validate_time_range
from app.core.config import get_settings
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.models import User
from app.models import EnergyReading, Machine
from app.schemas import EnergyReadingCreate
from app.services.energy import energy_readings, production_records, summarize_energy

router = create_api_router("/api/energy", ["energy"])
MAX_ANALYTIC_READINGS = 10_000


def _readings(db, factory_id, machine_id, production_line_id, start_time, end_time, shift=None):
    validate_time_range(start_time, end_time)
    if shift is not None and shift not in {"night", "day", "evening"}:
        raise APIError(422, "INVALID_FILTER", "Shift must be night, day, or evening")
    rows = energy_readings(
        db, factory_id, machine_id=machine_id, production_line_id=production_line_id,
        start_time=start_time, end_time=end_time, shift=shift,
    )
    if len(rows) > MAX_ANALYTIC_READINGS:
        raise APIError(422, "TIME_RANGE_TOO_LARGE", "Reduce the time range to retrieve energy analytics")
    return rows


def _production(db, factory_id, machine_id, production_line_id, start_time, end_time, shift):
    rows = production_records(
        db, factory_id, machine_id=machine_id, production_line_id=production_line_id,
        start_time=start_time, end_time=end_time, shift=shift,
    )
    if len(rows) > MAX_ANALYTIC_READINGS:
        raise APIError(422, "TIME_RANGE_TOO_LARGE", "Reduce the time range to retrieve energy analytics")
    return rows


@router.post("/readings", status_code=201, summary="Insert an authorized machine energy reading")
def create_reading(
    payload: EnergyReadingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    machine = db.get(Machine, payload.machine_id)
    if machine is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Machine not found")
    require_factory_access(db, user, machine.factory_id)
    reading = EnergyReading(**payload.model_dump())
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return success(reading)


@router.get("/summary", summary="Summarize measured energy and derived intensity, cost, and emissions")
def summary(
    factory_id: UUID,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    readings = _readings(db, factory_id, machine_id, production_line_id, start_time, end_time, shift)
    records = _production(db, factory_id, machine_id, production_line_id, start_time, end_time, shift)
    return success(summarize_energy(readings, records, get_settings()))


@router.get("/trend", summary="Return measured energy grouped by UTC hour")
def trend(
    factory_id: UUID,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    rows = _readings(db, factory_id, machine_id, production_line_id, start_time, end_time)
    groups: dict[datetime, dict[str, float]] = defaultdict(lambda: {"energy_kwh": 0.0, "power_kw": 0.0})
    for reading, _ in rows:
        bucket = reading.timestamp.replace(minute=0, second=0, microsecond=0)
        groups[bucket]["energy_kwh"] += reading.energy_kwh
        groups[bucket]["power_kw"] = max(groups[bucket]["power_kw"], reading.power_kw)
    data = [
        {"timestamp": timestamp, "energy_kwh": round(values["energy_kwh"], 3), "peak_demand_kw": round(values["power_kw"], 3)}
        for timestamp, values in sorted(groups.items())
    ]
    return success(data)


@router.get("/by-machine", summary="Group measured energy by machine")
def by_machine(
    factory_id: UUID,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    rows = _readings(db, factory_id, None, production_line_id, start_time, end_time)
    groups: dict[UUID, dict[str, object]] = {}
    for reading, machine in rows:
        row = groups.setdefault(
            machine.id,
            {"machine_id": machine.id, "machine_name": machine.name, "energy_kwh": 0.0, "peak_demand_kw": 0.0},
        )
        row["energy_kwh"] = float(row["energy_kwh"]) + reading.energy_kwh
        row["peak_demand_kw"] = max(float(row["peak_demand_kw"]), reading.power_kw)
    return success(
        [{**row, "energy_kwh": round(float(row["energy_kwh"]), 3), "peak_demand_kw": round(float(row["peak_demand_kw"]), 3)} for row in groups.values()]
    )


@router.get("/by-shift", summary="Group measured energy by eight-hour UTC time blocks")
def by_shift(
    factory_id: UUID,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = Query(default=None, pattern="^(night|day|evening)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    rows = _readings(db, factory_id, machine_id, production_line_id, start_time, end_time, shift)
    groups: dict[str, dict[str, float]] = defaultdict(lambda: {"energy_kwh": 0.0, "peak_demand_kw": 0.0})
    for reading, _ in rows:
        label = ("night", "day", "evening")[reading.timestamp.hour // 8]
        groups[label]["energy_kwh"] += reading.energy_kwh
        groups[label]["peak_demand_kw"] = max(groups[label]["peak_demand_kw"], reading.power_kw)
    return success(
        [{"shift": name, **{key: round(value, 3) for key, value in metrics.items()}} for name, metrics in sorted(groups.items())]
    )


@router.get("/intensity", summary="Calculate measured energy per produced unit")
def intensity(
    factory_id: UUID,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    readings = _readings(db, factory_id, machine_id, production_line_id, start_time, end_time, shift)
    records = _production(db, factory_id, machine_id, production_line_id, start_time, end_time, shift)
    metrics = summarize_energy(readings, records, get_settings())
    return success({"energy_per_unit": metrics["energy_per_unit"], "energy_kwh": metrics["total_energy_kwh"], "production_units": metrics["production_units"]})
