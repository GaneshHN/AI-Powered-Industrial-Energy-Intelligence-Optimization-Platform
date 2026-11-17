from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import APIError
from app.models import Machine, MaintenanceRecord


MAX_SLOTS = 168 * 100
SOLVER_SECONDS = 5.0


def optimize_schedule(
    db: Session,
    factory_id: UUID,
    production_target: float,
    horizon_hours: int,
    max_peak_kw: float | None,
    settings: Settings,
) -> tuple[str, str, dict[str, object] | None]:
    try:
        from ortools.sat.python import cp_model
    except (ImportError, OSError):
        raise APIError(503, "OPTIMIZATION_SERVICE_UNAVAILABLE", "The optimization solver is unavailable") from None

    machines = list(
        db.scalars(
            select(Machine).where(
                Machine.factory_id == factory_id,
                Machine.status.in_(["available", "running"]),
                Machine.production_rate_units_per_hour > 0,
            ).limit(101)
        )
    )
    if len(machines) > 100 or horizon_hours * len(machines) > MAX_SLOTS:
        raise APIError(422, "OPTIMIZATION_LIMIT_EXCEEDED", "The request exceeds the supported optimization size")
    if not machines:
        return "infeasible", "No schedulable machines or the request exceeds solver limits.", None

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    maintenance = list(
        db.scalars(
            select(MaintenanceRecord).where(
                MaintenanceRecord.machine_id.in_([machine.id for machine in machines]),
                MaintenanceRecord.status.in_(["scheduled", "in_progress"]),
                MaintenanceRecord.start_time < now + timedelta(hours=horizon_hours),
                (MaintenanceRecord.end_time.is_(None)) | (MaintenanceRecord.end_time > now),
            )
        )
    )
    blocked: set[tuple[UUID, int]] = set()
    for record in maintenance:
        start = max(record.start_time, now)
        end = min(record.end_time or now + timedelta(hours=horizon_hours), now + timedelta(hours=horizon_hours))
        for slot in range(horizon_hours):
            slot_start = now + timedelta(hours=slot)
            if slot_start < end and slot_start + timedelta(hours=1) > start:
                blocked.add((record.machine_id, slot))

    model = cp_model.CpModel()
    active: dict[tuple[UUID, int], cp_model.IntVar] = {}
    production_terms = []
    energy_terms = []
    for machine in machines:
        production_rate = max(0, round(machine.production_rate_units_per_hour * machine.load_factor * 100))
        energy_rate = max(0, round(machine.rated_power_kw * machine.load_factor * 100))
        for slot in range(horizon_hours):
            variable = model.new_bool_var(f"machine_{machine.id}_{slot}")
            active[(machine.id, slot)] = variable
            if (machine.id, slot) in blocked:
                model.add(variable == 0)
            production_terms.append(production_rate * variable)
            energy_terms.append(energy_rate * variable)
    model.add(sum(production_terms) >= round(production_target * 100))

    peak = model.new_int_var(0, round(sum(m.rated_power_kw for m in machines) * 100), "peak_kw_x100")
    for slot in range(horizon_hours):
        slot_power = sum(
            round(machine.rated_power_kw * machine.load_factor * 100) * active[(machine.id, slot)]
            for machine in machines
        )
        model.add(peak >= slot_power)
        if max_peak_kw is not None:
            model.add(slot_power <= round(max_peak_kw * 100))
    model.minimize(sum(energy_terms) + peak * 10)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = SOLVER_SECONDS
    solver.parameters.num_search_workers = 1
    result_status = solver.solve(model)
    if result_status == cp_model.INFEASIBLE:
        return "infeasible", "No schedule satisfies the production, availability, and peak-demand constraints.", None
    if result_status == cp_model.UNKNOWN:
        return "timeout", "The solver reached its time limit without finding a feasible schedule.", None
    if result_status == cp_model.MODEL_INVALID:
        raise APIError(500, "OPTIMIZATION_ERROR", "The optimization model could not be solved")
    if result_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise APIError(500, "OPTIMIZATION_ERROR", "The solver returned an unsupported status")

    schedule: list[dict[str, object]] = []
    machine_hours: dict[UUID, int] = {}
    for machine in machines:
        slots = [slot for slot in range(horizon_hours) if solver.value(active[(machine.id, slot)])]
        machine_hours[machine.id] = len(slots)
        for slot in slots:
            slot_start = now + timedelta(hours=slot)
            schedule.append(
                {
                    "machine_id": str(machine.id),
                    "start": slot_start.isoformat(),
                    "end": (slot_start + timedelta(hours=1)).isoformat(),
                    "operating_hours": 1,
                    "production_units": machine.production_rate_units_per_hour * machine.load_factor,
                }
            )
    production = sum(
        machine.production_rate_units_per_hour * machine.load_factor * machine_hours[machine.id]
        for machine in machines
    )
    energy = sum(
        machine.rated_power_kw * machine.load_factor * machine_hours[machine.id]
        for machine in machines
    )
    status = "optimal" if result_status == cp_model.OPTIMAL else "feasible"
    return status, "", {
        "schedule": schedule,
        "metrics": {
            "production_units": round(production, 3),
            "energy_kwh": round(energy, 3),
            "peak_demand_kw": round(solver.value(peak) / 100, 3),
            "estimated_cost": round(energy * settings.energy_cost_per_kwh, 2),
        },
    }
