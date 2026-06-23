from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.addresses import AddressModel
from src.models.curators import CuratorModel
from src.models.systems import SystemsModel
from src.models.systems_on_address import SystemOnAddressModel
from src.models.users import UserModel
from src.schemas.systems import SystemCreate, SystemUpdate


class SystemsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _check_curator_or_admin(self, user: UserModel, customer_id: Optional[int] = None) -> bool:
        if user.role == "admin":
            return True
        if user.role == "curator":
            stmt = select(CuratorModel).where(
                CuratorModel.user_id == user.id,
                CuratorModel.is_active.is_(True),
            )
            if customer_id is not None:
                stmt = stmt.where(CuratorModel.customer_id == customer_id)
            result = await self.session.execute(stmt)
            return result.scalar_one_or_none() is not None
        return False

    async def _eager_stmt(self):
        return select(SystemsModel).options(
            selectinload(SystemsModel.addresses).selectinload(SystemOnAddressModel.address)
        )

    async def create(self, data: SystemCreate, user: UserModel) -> SystemsModel:
        if user.role != "admin":
            raise PermissionError("Only admin can manage systems")

        system = SystemsModel(**data.model_dump())
        self.session.add(system)
        await self.session.commit()
        return await self.get_by_id(system.id)

    async def get_by_id(self, system_id: int) -> Optional[SystemsModel]:
        stmt = await self._eager_stmt()
        stmt = stmt.where(SystemsModel.id == system_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[SystemsModel]:
        stmt = await self._eager_stmt()
        stmt = stmt.offset(skip).limit(limit).order_by(SystemsModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, system_id: int, data: SystemUpdate, user: UserModel) -> Optional[SystemsModel]:
        if user.role != "admin":
            raise PermissionError("Only admin can manage systems")

        system = await self.get_by_id(system_id)
        if not system:
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(system, field, value)

        await self.session.commit()
        return await self.get_by_id(system_id)

    async def delete(self, system_id: int, user: UserModel) -> bool:
        if user.role != "admin":
            raise PermissionError("Only admin can manage systems")

        system = await self.get_by_id(system_id)
        if not system:
            return False

        await self.session.delete(system)
        await self.session.commit()
        return True

    async def add_to_address(self, system_id: int, address_id: int, user: UserModel) -> Optional[SystemOnAddressModel]:
        address = await self.session.get(AddressModel, address_id)
        if not address:
            raise ValueError("Address not found")
        if not await self._check_curator_or_admin(user, address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can manage systems")

        system = await self.session.get(SystemsModel, system_id)
        if not system:
            raise ValueError("System not found")

        stmt = select(SystemOnAddressModel).where(
            SystemOnAddressModel.address_id == address_id,
            SystemOnAddressModel.system_id == system_id,
        )
        result = await self.session.execute(stmt)
        if result.scalar_one_or_none():
            return None

        relation = SystemOnAddressModel(address_id=address_id, system_id=system_id)
        self.session.add(relation)
        await self.session.commit()
        return await self._get_relation(relation.id)

    async def remove_from_address(self, system_id: int, address_id: int, user: UserModel) -> bool:
        address = await self.session.get(AddressModel, address_id)
        if not address:
            raise ValueError("Address not found")
        if not await self._check_curator_or_admin(user, address.customer_id):
            raise PermissionError("Only active curator of this organisation or admin can manage systems")

        stmt = select(SystemOnAddressModel).where(
            SystemOnAddressModel.address_id == address_id,
            SystemOnAddressModel.system_id == system_id,
        )
        result = await self.session.execute(stmt)
        relation = result.scalar_one_or_none()
        if not relation:
            return False

        await self.session.delete(relation)
        await self.session.commit()
        return True

    async def list_addresses(self, system_id: int) -> List[AddressModel]:
        stmt = select(SystemsModel).options(
            selectinload(SystemsModel.addresses).selectinload(SystemOnAddressModel.address)
        ).where(SystemsModel.id == system_id)
        result = await self.session.execute(stmt)
        system = result.scalar_one_or_none()
        if not system:
            raise ValueError("System not found")
        return [relation.address for relation in system.addresses if relation.address is not None]

    async def list_relations_for_address(self, address_id: int) -> List[SystemOnAddressModel]:
        stmt = select(AddressModel).options(
            selectinload(AddressModel.systems).selectinload(SystemOnAddressModel.system)
        ).where(AddressModel.id == address_id)
        result = await self.session.execute(stmt)
        address = result.scalar_one_or_none()
        if not address:
            raise ValueError("Address not found")
        return address.systems

    async def _get_relation(self, relation_id: int) -> Optional[SystemOnAddressModel]:
        stmt = select(SystemOnAddressModel).options(
            selectinload(SystemOnAddressModel.system)
        ).where(SystemOnAddressModel.id == relation_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
