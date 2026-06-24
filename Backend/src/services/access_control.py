from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.curators import CuratorModel
from src.models.users import UserModel


async def get_allowed_customer_ids(session: AsyncSession, user: UserModel) -> Optional[list[int]]:
    if user.role == "admin":
        return None
    if user.role != "curator":
        return []

    stmt = select(CuratorModel.customer_id).where(
        CuratorModel.user_id == user.id,
        CuratorModel.is_active.is_(True),
    )
    result = await session.execute(stmt)
    customer_ids = list(result.scalars().all())
    return list(dict.fromkeys(customer_ids))


async def can_access_customer(session: AsyncSession, user: UserModel, customer_id: int) -> bool:
    allowed_customer_ids = await get_allowed_customer_ids(session, user)
    if allowed_customer_ids is None:
        return True
    return customer_id in allowed_customer_ids


async def is_active_curator(session: AsyncSession, user: UserModel) -> bool:
    if user.role == "admin":
        return True
    allowed_customer_ids = await get_allowed_customer_ids(session, user)
    return bool(allowed_customer_ids)
