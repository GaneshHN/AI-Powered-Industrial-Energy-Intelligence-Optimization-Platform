from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.core.config import get_settings
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.models import EnergyReading, Machine, ProductionRecord, Simulation, SimulationInput, SimulationResult, User
from app.schemas import SimulationRequest
from app.services.digital_twin import simulate_schedule

router = create_api_router("/api/simulation", ["simulation"])


@router.post("", status_code=201, summary="Run and store a digital-twin scenario")
def create_simulation(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    result = simulate_schedule(
        db, payload.factory_id, payload.schedule, payload.production_target, get_settings()
    )
    comparison = None
    if payload.compare_with_current:
        end = datetime.now(timezone.utc)
        start = end - timedelta(hours=24)
        readings = list(
            db.scalars(
                select(EnergyReading)
                .join(Machine, Machine.id == EnergyReading.machine_id)
                .where(Machine.factory_id == payload.factory_id, EnergyReading.timestamp >= start, EnergyReading.timestamp <= end)
                .limit(10_001)
            )
        )
        if len(readings) > 10_000:
            raise APIError(422, "TIME_RANGE_TOO_LARGE", "Reduce baseline range before comparing scenarios")
        production = db.scalar(
            select(func.coalesce(func.sum(ProductionRecord.production_units), 0))
            .join(Machine, ProductionRecord.machine_id == Machine.id)
            .where(
                Machine.factory_id == payload.factory_id,
                ProductionRecord.timestamp >= start,
                ProductionRecord.timestamp <= end,
            )
        )
        if not readings:
            raise APIError(422, "BASELINE_UNAVAILABLE", "Measured energy data is required for scenario comparison")
        baseline_energy = sum(row.energy_kwh for row in readings)
        baseline_peak = max(row.power_kw for row in readings)
        alternative_energy = float(result["energy_kwh"])
        alternative_peak = float(result["peak_demand_kw"])
        comparison = {
            "current": {
                "production_units": float(production or 0),
                "energy_kwh": round(baseline_energy, 3),
                "peak_demand_kw": round(baseline_peak, 3),
            },
            "alternative": {
                "production_units": result["production_units"],
                "energy_kwh": alternative_energy,
                "peak_demand_kw": alternative_peak,
            },
            "difference": {
                "energy_kwh": round(alternative_energy - baseline_energy, 3),
                "peak_demand_kw": round(alternative_peak - baseline_peak, 3),
            },
        }

    simulation = Simulation(
        factory_id=payload.factory_id,
        name=payload.name,
        description=payload.description,
        created_by=user.id,
    )
    db.add(simulation)
    db.flush()
    db.add(SimulationInput(simulation_id=simulation.id, payload=payload.model_dump(mode="json")))
    db.add(
        SimulationResult(
            simulation_id=simulation.id,
            production_units=float(result["production_units"]),
            energy_kwh=float(result["energy_kwh"]),
            peak_demand_kw=float(result["peak_demand_kw"]),
            estimated_cost=float(result["estimated_cost"]),
            metrics={**result, "comparison": comparison},
        )
    )
    db.commit()
    return success({"id": str(simulation.id), "status": simulation.status, "result": {**result, "comparison": comparison}})


def _accessible_simulation(db: Session, user: User, simulation_id: UUID) -> Simulation:
    row = db.get(Simulation, simulation_id)
    if row is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Simulation not found")
    require_factory_access(db, user, row.factory_id)
    return row


@router.get("/{simulation_id}", summary="Get a stored simulation")
def get_simulation(
    simulation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _accessible_simulation(db, user, simulation_id)
    inputs = db.scalar(select(SimulationInput).where(SimulationInput.simulation_id == row.id))
    result = db.scalar(select(SimulationResult).where(SimulationResult.simulation_id == row.id))
    return success({"simulation": row, "inputs": inputs.payload if inputs else None, "result": result.metrics if result else None})


@router.get("/{simulation_id}/result", summary="Get calculated simulation metrics")
def get_simulation_result(
    simulation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _accessible_simulation(db, user, simulation_id)
    result = db.scalar(select(SimulationResult).where(SimulationResult.simulation_id == row.id))
    if result is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Simulation result not found")
    return success(result.metrics)
