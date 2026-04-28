from __future__ import annotations
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.contractors import ContractorModel
from src.models.addresses import AddressModel
from src.models.curators import CuratorModel
from src.models.users import UserModel

class ContractorAddressService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _check_curator_or_admin(self, user: UserModel) -> bool:
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

    async def add_address(self, contractor_id: int, address_id: int, user: UserModel) -> bool:
        if not await self._check_curator_or_admin(user):
            raise PermissionError("Only admin or active curator can manage contractor addresses")

        stmt = select(ContractorModel).options(
            selectinload(ContractorModel.addresses)
        ).where(ContractorModel.id == contractor_id)
        result = await self.session.execute(stmt)
        contractor = result.scalar_one_or_none()
        if not contractor:
            raise ValueError("Contractor not found")

        # Загружаем адрес отдельно
        address = await self.session.get(AddressModel, address_id)
        if not address:
            raise ValueError("Address not found")

        if address not in contractor.addresses:
            contractor.addresses.append(address)
            await self.session.commit()
            return True
        return False

    async def remove_address(self, contractor_id: int, address_id: int, user: UserModel) -> bool:
        if not await self._check_curator_or_admin(user):
            raise PermissionError("Only admin or active curator can manage contractor addresses")

        stmt = select(ContractorModel).options(
            selectinload(ContractorModel.addresses)
        ).where(ContractorModel.id == contractor_id)
        result = await self.session.execute(stmt)
        contractor = result.scalar_one_or_none()
        if not contractor:
            raise ValueError("Contractor not found")

        address = await self.session.get(AddressModel, address_id)
        if not address:
            raise ValueError("Address not found")

        if address in contractor.addresses:
            contractor.addresses.remove(address)
            await self.session.commit()
            return True
        return False

    async def remove_address(self, contractor_id: int, address_id: int, user: UserModel) -> bool:
        if not await self._check_curator_or_admin(user):
            raise PermissionError("Only admin or active curator can manage contractor addresses")

        contractor = await self.session.get(ContractorModel, contractor_id)
        if not contractor:
            raise ValueError("Contractor not found")
        address = await self.session.get(AddressModel, address_id)
        if not address:
            raise ValueError("Address not found")

        if address in contractor.addresses:
            contractor.addresses.remove(address)
            await self.session.commit()
            return True
        return False

    async def get_addresses(self, contractor_id: int) -> List[AddressModel]:
        stmt = select(ContractorModel).options(
            selectinload(ContractorModel.addresses)
        ).where(ContractorModel.id == contractor_id)
        result = await self.session.execute(stmt)
        contractor = result.scalar_one_or_none()
        if not contractor:
            raise ValueError("Contractor not found")
        return contractor.addresses

    async def get_contractors(self, address_id: int) -> List[ContractorModel]:
        stmt = select(AddressModel).options(
            selectinload(AddressModel.contractors)
        ).where(AddressModel.id == address_id)
        result = await self.session.execute(stmt)
        address = result.scalar_one_or_none()
        if not address:
            raise ValueError("Address not found")
        return address.contractors