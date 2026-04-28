from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.contractors import ContractorModel
from src.models.curators import CuratorModel
from src.models.users import UserModel
from src.schemas.contractors import ContractorCreate, ContractorUpdate

class ContractorService:
    def __init__(self, session: AsyncSession):
        self.session = session


    async def _check_curator_or_admin(self, user: UserModel) -> bool:
        """Пользователь должен быть admin или активным куратором."""
        if user.role == "admin":
            return True
        if user.role == "curator":
            stmt = select(CuratorModel).where(
                CuratorModel.user_id == user.id,
                CuratorModel.is_active == True
            )
            result = await self.session.execute(stmt)
            return result.scalar_one_or_none() is not None
        return False

    # ── Eager loading ──────────────────────────────────────────────
    async def _eager_stmt(self):
        """Загружаем все связи, включая engineer."""
        return select(ContractorModel).options(
            selectinload(ContractorModel.addresses),
            selectinload(ContractorModel.technicians),
            selectinload(ContractorModel.technician_contractor),
            selectinload(ContractorModel.engineer)    # новый relationship
        )

    # ── CRUD ───────────────────────────────────────────────────────
    async def create(self, data: ContractorCreate, user: UserModel) -> ContractorModel:
        if not await self._check_curator_or_admin(user):
            raise PermissionError("Only admin or active curator can create contractor")

        # Если передан engineer_id, можно проверить существование пользователя
        if data.engineer_id:
            user_exists = await self.session.get(UserModel, data.engineer_id)
            if not user_exists:
                raise ValueError("Engineer user not found")

        contractor = ContractorModel(**data.dict())
        self.session.add(contractor)
        await self.session.commit()
        # Получаем объект с eager load
        stmt = await self._eager_stmt()
        stmt = stmt.where(ContractorModel.id == contractor.id)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_by_id(self, contractor_id: int) -> Optional[ContractorModel]:
        stmt = await self._eager_stmt()
        stmt = stmt.where(ContractorModel.id == contractor_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ContractorModel]:
        stmt = await self._eager_stmt()
        stmt = stmt.offset(skip).limit(limit).order_by(ContractorModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, contractor_id: int, data: ContractorUpdate, user: UserModel) -> Optional[ContractorModel]:
        if not await self._check_curator_or_admin(user):
            raise PermissionError("Only admin or active curator can update contractor")

        contractor = await self.get_by_id(contractor_id)
        if not contractor:
            return None

        update_data = data.dict(exclude_unset=True)

        # Если меняют engineer_id, проверим существование
        if "engineer_id" in update_data and update_data["engineer_id"] is not None:
            user_exists = await self.session.get(UserModel, update_data["engineer_id"])
            if not user_exists:
                raise ValueError("Engineer user not found")

        for field, value in update_data.items():
            setattr(contractor, field, value)

        await self.session.commit()
        return await self.get_by_id(contractor_id)

    async def delete(self, contractor_id: int, user: UserModel) -> bool:
        if not await self._check_curator_or_admin(user):
            raise PermissionError("Only admin or active curator can delete contractor")

        contractor = await self.get_by_id(contractor_id)
        if not contractor:
            return False
        await self.session.delete(contractor)
        await self.session.commit()
        return True