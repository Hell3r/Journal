from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.curators import CuratorModel
from src.models.customers import CustomerModel
from src.models.users import UserModel
from src.schemas.curators import CuratorCreate

class CuratorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: CuratorCreate, user_id: int) -> CuratorModel:
        stmt_cust = select(CustomerModel).where(CustomerModel.id == data.customer_id)
        result = await self.session.execute(stmt_cust)
        customer = result.scalar_one_or_none()
        if not customer:
            raise ValueError("Customer not found")

        stmt_exist = select(CuratorModel).where(
            CuratorModel.customer_id == data.customer_id,
            CuratorModel.user_id == user_id
        )
        exist_result = await self.session.execute(stmt_exist)
        if exist_result.scalar_one_or_none():
            raise ValueError("Curator request already exists for this user and customer")

        curator = CuratorModel(
            customer_id=data.customer_id,
            user_id=user_id,
            is_active=False
        )
        self.session.add(curator)
        await self.session.commit()
        await self.session.refresh(curator, attribute_names=['customer', 'user'])
        return curator

    async def get_by_id(self, curator_id: int) -> Optional[CuratorModel]:
        stmt = (
            select(CuratorModel)
            .options(selectinload(CuratorModel.customer), selectinload(CuratorModel.user))
            .where(CuratorModel.id == curator_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self, skip: int = 0, limit: int = 100, user_filter: Optional[int] = None
    ) -> List[CuratorModel]:
        stmt = select(CuratorModel).options(
            selectinload(CuratorModel.customer),
            selectinload(CuratorModel.user)
        )
        if user_filter is not None:
            stmt = stmt.where(CuratorModel.user_id == user_filter)

        stmt = stmt.offset(skip).limit(limit).order_by(CuratorModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def delete(self, curator_id: int) -> bool:
        curator = await self.get_by_id(curator_id)
        if not curator:
            return False
        await self.session.delete(curator)
        await self.session.commit()
        return True

    async def activate(self, curator_id: int) -> Optional[CuratorModel]:
        stmt = (
            select(CuratorModel)
            .options(selectinload(CuratorModel.user))
            .where(CuratorModel.id == curator_id)
        )
        result = await self.session.execute(stmt)
        curator = result.scalar_one_or_none()

        if not curator:
            return None

        curator.is_active = True

        user = curator.user
        if user and user.role != "curator":
            user.role = "curator"
            self.session.add(user)

        await self.session.commit()
        await self.session.refresh(curator, attribute_names=['customer', 'user'])
        return curator