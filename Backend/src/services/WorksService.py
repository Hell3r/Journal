from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.addresses import AddressModel
from src.models.curators import CuratorModel
from src.models.types_of_works import TypesOfWorksModel
from src.models.users import UserModel
from src.models.works import WorksModel
from src.schemas.works import WorkCreate, WorkUpdate


class WorksService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _check_curator_or_admin(self, user: UserModel, customer_id: int) -> bool:
        if user.role == "admin":
            return True
        if user.role == "curator":
            stmt = select(CuratorModel).where(
                CuratorModel.user_id == user.id,
                CuratorModel.customer_id == customer_id,
                CuratorModel.is_active.is_(True),
            )
            result = await self.session.execute(stmt)
            return result.scalar_one_or_none() is not None
        return False

    async def _eager_stmt(self):
        return select(WorksModel).options(
            selectinload(WorksModel.address),
            selectinload(WorksModel.type_of_work),
            selectinload(WorksModel.technician),
        )

    async def create(self, data: WorkCreate, user: UserModel) -> WorksModel:
        address = await self.session.get(AddressModel, data.address_id)
        if not address:
            raise ValueError("Address not found")
        if not await self._check_curator_or_admin(user, address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can manage works")

        if not await self.session.get(TypesOfWorksModel, data.type_of_work_id):
            raise ValueError("Type of work not found")
        if not await self.session.get(UserModel, data.technician_id):
            raise ValueError("Technician not found")

        work = WorksModel(**data.model_dump())
        self.session.add(work)
        await self.session.commit()
        return await self.get_by_id(work.id)

    async def get_by_id(self, work_id: int) -> Optional[WorksModel]:
        stmt = await self._eager_stmt()
        stmt = stmt.where(WorksModel.id == work_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100, address_id: Optional[int] = None) -> List[WorksModel]:
        stmt = await self._eager_stmt()
        if address_id is not None:
            stmt = stmt.where(WorksModel.address_id == address_id)
        stmt = stmt.offset(skip).limit(limit).order_by(WorksModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, work_id: int, data: WorkUpdate, user: UserModel) -> Optional[WorksModel]:
        work = await self.get_by_id(work_id)
        if not work:
            return None

        update_data = data.model_dump(exclude_unset=True)
        target_address_id = update_data.get("address_id", work.address_id)
        address = await self.session.get(AddressModel, target_address_id)
        if not address:
            raise ValueError("Address not found")
        if not await self._check_curator_or_admin(user, address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can manage works")

        if "type_of_work_id" in update_data and not await self.session.get(TypesOfWorksModel, update_data["type_of_work_id"]):
            raise ValueError("Type of work not found")
        if "technician_id" in update_data and not await self.session.get(UserModel, update_data["technician_id"]):
            raise ValueError("Technician not found")

        for field, value in update_data.items():
            setattr(work, field, value)

        await self.session.commit()
        return await self.get_by_id(work_id)

    async def delete(self, work_id: int, user: UserModel) -> bool:
        work = await self.get_by_id(work_id)
        if not work:
            return False
        if not await self._check_curator_or_admin(user, work.address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can manage works")

        await self.session.delete(work)
        await self.session.commit()
        return True
