from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import EnergyReading, Machine, ProductionLine, ProductionRecord


def energy_readings(
    db: Session,
    factory_id: UUID,
    *,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
) -> list[tuple[EnergyReading, Machine]]:
    statement = (
        select(EnergyReading, Machine)
        .join(Machine, EnergyReading.machine_id == Machine.id)
        .where(Machine.factory_id == factory_id)
    )
    if machine_id:
        statement = statement.where(Machine.id == machine_id)
    if production_line_id:
        statement = statement.where(Machine.production_line_id == production_line_id)
    if start_time:
        statement = statement.where(EnergyReading.timestamp >= start_time)
    if end_time:
        statement = statement.where(EnergyReading.timestamp <= end_time)
    rows = list(db.execute(statement.order_by(EnergyReading.timestamp).limit(10_001)).all())
    if shift:
        rows = [row for row in rows if ("night", "day", "evening")[row[0].timestamp.hour // 8] == shift]
    return rows


def production_records(
    db: Session,
    factory_id: UUID,
    *,
    machine_id: UUID | None = None,
    production_line_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    shift: str | None = None,
) -> list[ProductionRecord]:
    statement = (
        select(ProductionRecord)
        .join(ProductionLine, ProductionRecord.production_line_id == ProductionLine.id)
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
    return list(db.scalars(statement.order_by(ProductionRecord.timestamp).limit(10_001)).all())


def summarize_energy(
    readings: list[tuple[EnergyReading, Machine]],
    records: list[ProductionRecord],
    settings: Settings,
) -> dict[str, float]:
    total_energy = sum(reading.energy_kwh for reading, _ in readings)
    production = sum(record.production_units for record in records)
    peak_demand = max((reading.power_kw for reading, _ in readings), default=0.0)
    return {
        "total_energy_kwh": round(total_energy, 3),
        "energy_per_unit": round(total_energy / production, 6) if production else 0.0,
        "peak_demand_kw": round(peak_demand, 3),
        "energy_cost": round(total_energy * settings.energy_cost_per_kwh, 2),
        "estimated_co2_kg": round(total_energy * settings.co2_kg_per_kwh, 3),
        "production_units": round(production, 3),
    }


def readings_by_machine(
    readings: list[tuple[EnergyReading, Machine]],
) -> list[dict[str, object]]:
    groups: dict[UUID, dict[str, object]] = {}
    for reading, machine in readings:
        row = groups.setdefault(
            machine.id,
            {"machine_id": machine.id, "machine_name": machine.name, "energy_kwh": 0.0, "peak_demand_kw": 0.0},
        )
        row["energy_kwh"] = float(row["energy_kwh"]) + reading.energy_kwh
        row["peak_demand_kw"] = max(float(row["peak_demand_kw"]), reading.power_kw)
    return [
        {**row, "energy_kwh": round(float(row["energy_kwh"]), 3), "peak_demand_kw": round(float(row["peak_demand_kw"]), 3)}
        for row in groups.values()
    ]
