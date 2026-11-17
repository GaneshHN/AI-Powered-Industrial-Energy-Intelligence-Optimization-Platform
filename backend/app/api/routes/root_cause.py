from uuid import UUID

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.integrations import ml_service
from app.models import Anomaly, EnergyReading, Machine, MaintenanceRecord, ProductionRecord, RootCauseAnalysis, User
from app.schemas import RootCauseRequest

router = create_api_router("/api/root-cause", ["root-cause"])


@router.get("/{anomaly_id}", summary="Get stored root-cause analysis for an anomaly")
def get_root_cause(
    anomaly_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    anomaly = db.get(Anomaly, anomaly_id)
    if anomaly is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Anomaly not found")
    require_factory_access(db, user, anomaly.factory_id)
    analysis = db.scalar(select(RootCauseAnalysis).where(RootCauseAnalysis.anomaly_id == anomaly_id))
    if analysis is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Root-cause analysis not found")
    return success(analysis)


@router.post("/analyze", summary="Request and store ML root-cause analysis")
async def analyze(
    payload: RootCauseRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    anomaly = db.get(Anomaly, payload.anomaly_id)
    if anomaly is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Anomaly not found")
    require_factory_access(db, user, anomaly.factory_id)
    machine = db.get(Machine, anomaly.machine_id)
    readings = list(
        db.scalars(
            select(EnergyReading)
            .where(EnergyReading.machine_id == anomaly.machine_id)
            .order_by(EnergyReading.timestamp.desc())
            .limit(100)
        )
    )
    maintenance = list(
        db.scalars(
            select(MaintenanceRecord)
            .where(MaintenanceRecord.machine_id == anomaly.machine_id)
            .order_by(MaintenanceRecord.start_time.desc())
            .limit(20)
        )
    )
    production = list(
        db.scalars(
            select(ProductionRecord)
            .where(ProductionRecord.machine_id == anomaly.machine_id)
            .order_by(ProductionRecord.timestamp.desc())
            .limit(100)
        )
    )
    result = await ml_service.analyze_root_cause(
        {
            "anomaly": {
                "id": str(anomaly.id),
                "machine_id": str(anomaly.machine_id),
                "timestamp": anomaly.timestamp.isoformat(),
                "expected_energy_kwh": anomaly.expected_energy_kwh,
                "actual_energy_kwh": anomaly.actual_energy_kwh,
                "deviation_percent": anomaly.deviation_percent,
            },
            "machine": {"name": machine.name, "type": machine.machine_type, "status": machine.status} if machine else None,
            "recent_readings": [
                {"timestamp": row.timestamp.isoformat(), "energy_kwh": row.energy_kwh, "power_kw": row.power_kw}
                for row in reversed(readings)
            ],
            "recent_maintenance": [
                {
                    "maintenance_type": row.maintenance_type,
                    "start_time": row.start_time.isoformat(),
                    "end_time": row.end_time.isoformat() if row.end_time else None,
                    "status": row.status,
                }
                for row in maintenance
            ],
            "recent_production": [
                {"timestamp": row.timestamp.isoformat(), "production_units": row.production_units, "shift": row.shift}
                for row in reversed(production)
            ],
        }
    )
    analysis = db.scalar(select(RootCauseAnalysis).where(RootCauseAnalysis.anomaly_id == anomaly.id))
    if analysis is None:
        analysis = RootCauseAnalysis(anomaly_id=anomaly.id, **result.model_dump())
        db.add(analysis)
    else:
        for key, value in result.model_dump().items():
            setattr(analysis, key, value)
    db.commit()
    db.refresh(analysis)
    return success(analysis)
