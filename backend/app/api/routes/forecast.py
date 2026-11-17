from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.api.validation import validate_time_range
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.integrations import ml_service
from app.models import EnergyReading, Forecast, Machine, User

router = create_api_router("/api/forecast", ["forecast"])


@router.get("", summary="Request a forecast from the configured ML service")
async def get_forecast(
    machine_id: UUID | None = None,
    factory_id: UUID | None = None,
    horizon_hours: int = Query(default=24, ge=1, le=720),
    start_time: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if machine_id is None and factory_id is None:
        raise APIError(422, "INVALID_FILTER", "Provide machine_id or factory_id")
    if machine_id is not None:
        machine = db.get(Machine, machine_id)
        if machine is None or (factory_id is not None and factory_id != machine.factory_id):
            raise APIError(404, "RESOURCE_NOT_FOUND", "Machine not found")
        require_factory_access(db, user, machine.factory_id)
        machines = [machine]
    else:
        require_factory_access(db, user, factory_id)
        machines = list(
            db.scalars(select(Machine).where(Machine.factory_id == factory_id).order_by(Machine.id).limit(101))
        )
        if len(machines) > 100:
            raise APIError(422, "FACTORY_TOO_LARGE", "Forecast requests support at most 100 machines")
        if not machines:
            raise APIError(404, "RESOURCE_NOT_FOUND", "No machines were found in this factory")

    end = start_time or datetime.now(timezone.utc)
    validate_time_range(end, end)
    readings = list(
        db.scalars(
            select(EnergyReading)
            .where(
                EnergyReading.machine_id.in_([machine.id for machine in machines]),
                EnergyReading.timestamp <= end,
            )
            .order_by(EnergyReading.timestamp.desc())
            .limit(5001)
        )
    )
    if len(readings) > 5000:
        raise APIError(422, "FORECAST_INPUT_TOO_LARGE", "Reduce the requested factory forecast input")
    histories: dict[UUID, list[dict[str, object]]] = {machine.id: [] for machine in machines}
    for reading in reversed(readings):
        histories[reading.machine_id].append(
            {
                "timestamp": reading.timestamp.isoformat(),
                "energy_kwh": reading.energy_kwh,
                "power_kw": reading.power_kw,
            }
        )
    results = await ml_service.forecast(
        {
            "machine_id": str(machine_id) if machine_id else None,
            "factory_id": str(factory_id or machines[0].factory_id),
            "horizon_hours": horizon_hours,
            "start_time": end.isoformat(),
            "machines": [
                {"machine_id": str(machine.id), "history": histories[machine.id]}
                for machine in machines
            ],
        }
    )
    machine_ids = {machine.id for machine in machines}
    stored = []
    for item in results:
        result_machine_id = item.machine_id or (machine_id if len(machines) == 1 else None)
        if result_machine_id not in machine_ids:
            raise APIError(502, "ML_SERVICE_ERROR", "The AI service returned a forecast for an unknown machine")
        stored.append(
            Forecast(
                machine_id=result_machine_id,
                forecast_timestamp=item.forecast_timestamp,
                predicted_energy_kwh=item.predicted_energy_kwh,
                lower_bound=item.lower_bound,
                upper_bound=item.upper_bound,
                model_version=item.model_version,
            )
        )
    db.add_all(stored)
    db.commit()
    return success(
        stored,
        {
            "factory_id": str(factory_id or machines[0].factory_id),
            "machine_id": str(machine_id) if machine_id else None,
            "horizon_hours": horizon_hours,
        },
    )
