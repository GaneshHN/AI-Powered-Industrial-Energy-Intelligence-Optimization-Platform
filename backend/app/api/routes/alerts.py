from datetime import datetime
from typing import Literal
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
from app.models import Alert, User
from app.schemas import AlertUpdate

router = create_api_router("/api/alerts", ["alerts"])


@router.get("", summary="List alerts for accessible factories")
def list_alerts(
    factory_id: UUID | None = None,
    machine_id: UUID | None = None,
    type: str | None = None,
    severity: Literal["low", "medium", "high", "critical"] | None = None,
    status: Literal["open", "acknowledged", "resolved"] | None = None,
    is_read: bool | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = accessible_factory_ids(db, user)
    if factory_id:
        require_factory_access(db, user, factory_id)
        ids = [factory_id]
    statement = select(Alert).where(Alert.factory_id.in_(ids))
    for column, value in ((Alert.machine_id, machine_id), (Alert.type, type), (Alert.severity, severity), (Alert.status, status), (Alert.is_read, is_read)):
        if value is not None:
            statement = statement.where(column == value)
    if start_time:
        statement = statement.where(Alert.created_at >= start_time)
    if end_time:
        statement = statement.where(Alert.created_at <= end_time)
    validate_time_range(start_time, end_time)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(statement.order_by(Alert.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return success(list(rows), {"page": page, "page_size": page_size, "total": total})


@router.get("/{alert_id}", summary="Get an alert")
def get_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(Alert, alert_id)
    if row is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Alert not found")
    require_factory_access(db, user, row.factory_id)
    return success(row)


@router.patch("/{alert_id}", summary="Update alert read state or status")
def update_alert(
    alert_id: UUID,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(Alert, alert_id)
    if row is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Alert not found")
    require_factory_access(db, user, row.factory_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return success(row)
