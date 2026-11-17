from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.core.config import get_settings
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.models import OptimizationRun, User
from app.schemas import OptimizationRequest
from app.services.optimization import optimize_schedule

router = create_api_router("/api/optimization", ["optimization"])


@router.post("", status_code=201, summary="Find a production schedule within machine and energy constraints")
def optimize(
    payload: OptimizationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, payload.factory_id)
    run = OptimizationRun(
        factory_id=payload.factory_id,
        production_target=payload.production_target,
        status="running",
        request_payload=payload.model_dump(mode="json"),
    )
    db.add(run)
    db.flush()
    status, explanation, result = optimize_schedule(
        db,
        payload.factory_id,
        payload.production_target,
        payload.planning_horizon_hours,
        payload.constraints.max_peak_kw,
        get_settings(),
    )
    run.status = status
    run.explanation = explanation or None
    run.result_payload = result
    run.completed_at = datetime.now(timezone.utc)
    db.commit()
    return success(
        {
            "id": str(run.id),
            "status": status,
            "schedule": result["schedule"] if result else [],
            "metrics": result["metrics"] if result else None,
            "explanation": explanation or None,
        }
    )


def _accessible_run(db: Session, user: User, run_id: UUID) -> OptimizationRun:
    run = db.get(OptimizationRun, run_id)
    if run is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Optimization run not found")
    require_factory_access(db, user, run.factory_id)
    return run


@router.get("/{run_id}", summary="Get an optimization run")
def get_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    run = _accessible_run(db, user, run_id)
    return success(
        {
            "id": str(run.id),
            "status": run.status,
            "result": run.result_payload,
            "explanation": run.explanation,
            "created_at": run.created_at,
            "completed_at": run.completed_at,
        }
    )


@router.get("/{run_id}/result", summary="Get a completed optimization result")
def get_result(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    run = _accessible_run(db, user, run_id)
    if run.result_payload is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Optimization result is not available")
    return success({"status": run.status, **run.result_payload})
