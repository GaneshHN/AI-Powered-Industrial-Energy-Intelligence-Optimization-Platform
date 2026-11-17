from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import APIError
from app.models import Factory, FactoryMembership, User


def require_factory_access(
    db: Session,
    user: User,
    factory_id: UUID,
    *,
    owner_only: bool = False,
) -> Factory:
    membership = db.scalar(
        select(FactoryMembership).where(
            FactoryMembership.factory_id == factory_id,
            FactoryMembership.user_id == user.id,
        )
    )
    if membership is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Factory not found")
    if owner_only and membership.role != "owner":
        raise APIError(403, "PERMISSION_DENIED", "Factory owner permission is required")
    factory = db.get(Factory, factory_id)
    if factory is None:
        raise APIError(404, "RESOURCE_NOT_FOUND", "Factory not found")
    return factory


def accessible_factory_ids(db: Session, user: User) -> list[UUID]:
    return list(
        db.scalars(
            select(FactoryMembership.factory_id).where(FactoryMembership.user_id == user.id)
        )
    )
