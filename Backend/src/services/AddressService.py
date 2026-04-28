from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.addresses import AddressModel
from src.models.curators import CuratorModel
from src.models.users import UserModel
from src.schemas.addresses import AddressCreate, AddressUpdate

class AddressService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_with_eager(self, stmt):
        return stmt.options(
            selectinload(AddressModel.contractors),
            selectinload(AddressModel.systems),
            selectinload(AddressModel.works),
            selectinload(AddressModel.technician_address)   # relationship имя technician_address
        )

    async def _check_curator_access(self, user: UserModel, customer_id: int) -> bool:
        if user.role == "admin":
            return True
        if user.role == "curator":
            stmt = select(CuratorModel).where(
                CuratorModel.user_id == user.id,
                CuratorModel.customer_id == customer_id,
                CuratorModel.is_active == True
            )
            result = await self.session.execute(stmt)
            return result.scalar_one_or_none() is not None
        return False

    async def create(self, data: AddressCreate, user: UserModel) -> AddressModel:
        if not await self._check_curator_access(user, data.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can create address")

        address = AddressModel(**data.dict())
        self.session.add(address)
        await self.session.commit()
        # Загружаем связи для ответа
        stmt = select(AddressModel).where(AddressModel.id == address.id)
        stmt = await self._get_with_eager(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_by_id(self, address_id: int) -> Optional[AddressModel]:
        stmt = select(AddressModel).where(AddressModel.id == address_id)
        stmt = await self._get_with_eager(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100,
                      customer_id: Optional[int] = None) -> List[AddressModel]:
        stmt = select(AddressModel)
        if customer_id is not None:
            stmt = stmt.where(AddressModel.customer_id == customer_id)
        stmt = await self._get_with_eager(stmt)
        stmt = stmt.offset(skip).limit(limit).order_by(AddressModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, address_id: int, data: AddressUpdate, user: UserModel) -> Optional[AddressModel]:
        address = await self.get_by_id(address_id)
        if not address:
            return None
        if not await self._check_curator_access(user, address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can update address")

        for field, value in data.dict(exclude_unset=True).items():
            setattr(address, field, value)
        await self.session.commit()
        # Перезагружаем с eager load
        return await self.get_by_id(address_id)

    async def delete(self, address_id: int, user: UserModel) -> bool:
        # Удаление только для админа – проверяем роль
        if user.role != "admin":
            raise PermissionError("Only admin can delete address")
        address = await self.get_by_id(address_id)
        if not address:
            return False
        await self.session.delete(address)
        await self.session.commit()
        return True