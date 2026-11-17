from uuid import UUID

from fastapi import Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import accessible_factory_ids, require_factory_access
from app.api.openapi import create_api_router
from app.api.responses import success
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import get_current_user
from app.models import Factory, FactoryMembership, ProductionLine, User
from app.schemas import FactoryCreate, FactoryUpdate, ProductionLineCreate

router = create_api_router("/api/factories", ["factories"])


@router.get("", summary="List factories available to the authenticated user")
def list_factories(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = accessible_factory_ids(db, user)
    total = db.scalar(select(func.count()).select_from(Factory).where(Factory.id.in_(ids))) or 0
    rows = db.scalars(
        select(Factory).where(Factory.id.in_(ids)).order_by(Factory.name).offset((page - 1) * page_size).limit(page_size)
    )
    return success(list(rows), {"page": page, "page_size": page_size, "total": total})


@router.post("", status_code=201, summary="Create a factory and make the caller its owner")
def create_factory(
    payload: FactoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    factory = Factory(**payload.model_dump(), created_by=user.id)
    db.add(factory)
    db.flush()
    db.add(FactoryMembership(factory_id=factory.id, user_id=user.id, role="owner"))
    db.commit()
    db.refresh(factory)
    return success(factory)


@router.get("/{factory_id}", summary="Get an accessible factory")
def get_factory(
    factory_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return success(require_factory_access(db, user, factory_id))


@router.put("/{factory_id}", summary="Update an accessible factory")
def update_factory(
    factory_id: UUID,
    payload: FactoryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    factory = require_factory_access(db, user, factory_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(factory, key, value)
    db.commit()
    db.refresh(factory)
    return success(factory)


@router.delete("/{factory_id}", status_code=204, summary="Delete a factory owned by the caller")
def delete_factory(
    factory_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    factory = require_factory_access(db, user, factory_id, owner_only=True)
    db.delete(factory)
    db.commit()


@router.get("/{factory_id}/production-lines", summary="List production lines in an accessible factory")
def list_production_lines(
    factory_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    rows = db.scalars(select(ProductionLine).where(ProductionLine.factory_id == factory_id).order_by(ProductionLine.name))
    return success(list(rows))


@router.post("/{factory_id}/production-lines", status_code=201, summary="Create a production line")
def create_production_line(
    factory_id: UUID,
    payload: ProductionLineCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_factory_access(db, user, factory_id)
    line = ProductionLine(factory_id=factory_id, **payload.model_dump())
    db.add(line)
    db.commit()
    db.refresh(line)
    return success(line)
