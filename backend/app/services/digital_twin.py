from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import APIError
from app.models import Machine, MaintenanceRecord
from app.schemas import ScheduleItem


def simulate_schedule(
    db: Session,
    factory_id: UUID,
    schedule: list[ScheduleItem],
    production_target: float,
    settings: Settings,
) -> dict[str, float | list[dict[str, object]]]:
    machine_ids = {item.machine_id for item in schedule}
    machines = {
        machine.id: machine
        for machine in db.scalars(
            select(Machine).where(Machine.factory_id == factory_id, Machine.id.in_(machine_ids))
        )
    }
    if len(machines) != len(machine_ids):
        raise APIError(422, "INVALID_SCHEDULE", "Every scheduled machine must belong to the selected factory")

    intervals: dict[UUID, list[tuple[float, float]]] = {}
    production = energy = peak_demand = 0.0
    demand_events: list[tuple[float, float]] = []
    details: list[dict[str, object]] = []
    now = datetime.now(timezone.utc)
    for item in schedule:
        machine = machines[item.machine_id]
        if machine.status in {"maintenance", "offline"}:
            raise APIError(422, "MACHINE_UNAVAILABLE", f"Machine {machine.name} is not available")
        start_hour = item.start.hour + item.start.minute / 60
        duration = item.operating_hours or (
            (item.end.hour + item.end.minute / 60) - start_hour
        )
        if duration <= 0 or duration > 24 or start_hour + duration > 24:
            raise APIError(422, "INVALID_SCHEDULE", "Schedule intervals must fit within a single 24-hour day")
        end_hour = start_hour + duration
        for previous_start, previous_end in intervals.setdefault(machine.id, []):
            if start_hour < previous_end and end_hour > previous_start:
                raise APIError(422, "INVALID_SCHEDULE", f"Overlapping schedule for machine {machine.name}")
        intervals[machine.id].append((start_hour, end_hour))
        machine_production = machine.production_rate_units_per_hour * item.load * duration
        running_energy = machine.rated_power_kw * machine.load_factor * item.load * duration
        idle_energy = machine.rated_power_kw * machine.idle_power_factor * (1 - item.load) * duration
        production += machine_production
        energy += running_energy + idle_energy
        demand = machine.rated_power_kw * machine.load_factor * item.load
        demand_events.extend(((start_hour, demand), (end_hour, -demand)))
        details.append(
            {
                "machine_id": str(machine.id),
                "operating_hours": round(duration, 3),
                "production_units": round(machine_production, 3),
                "energy_kwh": round(running_energy + idle_energy, 3),
            }
        )
        start = now.replace(hour=item.start.hour, minute=item.start.minute, second=0, microsecond=0)
        end = start + timedelta(hours=duration)
        maintenance = db.scalar(
            select(MaintenanceRecord.id).where(
                MaintenanceRecord.machine_id == machine.id,
                MaintenanceRecord.status.in_(["scheduled", "in_progress"]),
                MaintenanceRecord.start_time < end,
                (MaintenanceRecord.end_time.is_(None)) | (MaintenanceRecord.end_time > start),
            ).limit(1)
        )
        if maintenance:
            raise APIError(422, "MAINTENANCE_CONFLICT", f"Schedule conflicts with maintenance for {machine.name}")

    current_demand = 0.0
    for _, delta in sorted(demand_events, key=lambda event: (event[0], event[1])):
        current_demand += delta
        peak_demand = max(peak_demand, current_demand)

    if production < production_target:
        raise APIError(422, "PRODUCTION_TARGET_NOT_MET", "The schedule cannot meet the requested production target")
    return {
        "production_units": round(production, 3),
        "energy_kwh": round(energy, 3),
        "peak_demand_kw": round(peak_demand, 3),
        "estimated_cost": round(energy * settings.energy_cost_per_kwh, 2),
        "machine_details": details,
    }
