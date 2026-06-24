from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.addresses import AddressModel
from src.models.contractors import ContractorModel
from src.models.systems_on_address import SystemOnAddressModel
from src.models.works import WorksModel
from src.models.users import UserModel
from src.schemas.addresses import AddressCreate, AddressUpdate
from src.services.access_control import can_access_customer, get_allowed_customer_ids

class AddressService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _get_with_eager(self, stmt):
        return stmt.options(
            selectinload(AddressModel.contractors),
            selectinload(AddressModel.systems).selectinload(SystemOnAddressModel.system),
            selectinload(AddressModel.works).selectinload(WorksModel.type_of_work),
            selectinload(AddressModel.works).selectinload(WorksModel.technician),
            selectinload(AddressModel.works).selectinload(WorksModel.system),
            selectinload(AddressModel.technician_address)   # relationship имя technician_address
        )

    async def _allowed_address_ids_for_engineer(self, user: UserModel) -> List[int]:
        stmt = select(ContractorModel).options(selectinload(ContractorModel.addresses)).where(
            ContractorModel.engineer_id == user.id,
            ContractorModel.is_active.is_(True),
        )
        result = await self.session.execute(stmt)
        contractors = result.scalars().all()
        seen = []
        for contractor in contractors:
            for address in contractor.addresses:
                if address.id not in seen:
                    seen.append(address.id)
        return seen

    async def create(self, data: AddressCreate, user: UserModel) -> AddressModel:
        if not await can_access_customer(self.session, user, data.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can create address")

        address = AddressModel(**data.model_dump())
        self.session.add(address)
        await self.session.commit()
        # Загружаем связи для ответа
        stmt = select(AddressModel).where(AddressModel.id == address.id)
        stmt = self._get_with_eager(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_by_id(self, address_id: int, user: Optional[UserModel] = None) -> Optional[AddressModel]:
        stmt = select(AddressModel).where(AddressModel.id == address_id)
        stmt = self._get_with_eager(stmt)
        result = await self.session.execute(stmt)
        address = result.scalar_one_or_none()
        if not address or user is None:
          return address
        if user.role == "engineer":
            allowed_address_ids = await self._allowed_address_ids_for_engineer(user)
            if address.id not in allowed_address_ids:
                return None
            return address
        if not await can_access_customer(self.session, user, address.customer_id):
            return None
        return address

    async def get_all(self, skip: int = 0, limit: int = 100,
                      customer_id: Optional[int] = None,
                      user: Optional[UserModel] = None) -> List[AddressModel]:
        stmt = select(AddressModel)
        if customer_id is not None:
            stmt = stmt.where(AddressModel.customer_id == customer_id)
        elif user is not None:
            allowed_customer_ids = await get_allowed_customer_ids(self.session, user)
            if allowed_customer_ids is None:
                pass
            elif user.role == "engineer":
                allowed_address_ids = await self._allowed_address_ids_for_engineer(user)
                if not allowed_address_ids:
                    return []
                stmt = stmt.where(AddressModel.id.in_(allowed_address_ids))
            elif not allowed_customer_ids:
                return []
            else:
                stmt = stmt.where(AddressModel.customer_id.in_(allowed_customer_ids))
        stmt = self._get_with_eager(stmt)
        stmt = stmt.offset(skip).limit(limit).order_by(AddressModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, address_id: int, data: AddressUpdate, user: UserModel) -> Optional[AddressModel]:
        address = await self.get_by_id(address_id)
        if not address:
            return None
        if not await can_access_customer(self.session, user, address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can update address")

        for field, value in data.model_dump(exclude_unset=True).items():
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
