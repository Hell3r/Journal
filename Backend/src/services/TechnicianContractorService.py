from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.addresses import AddressModel
from src.models.contractors import ContractorModel
from src.models.curators import CuratorModel
from src.models.technician_contractor import TechnicianModel
from src.models.users import UserModel
from src.schemas.technician_contractors import TechnicianContractorCreate


class TechnicianContractorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _allowed_customer_ids(self, user: UserModel) -> Optional[List[int]]:
        if user.role == "admin":
            return None
        if user.role != "curator":
            return []
        stmt = select(CuratorModel.customer_id).where(
            CuratorModel.user_id == user.id,
            CuratorModel.is_active.is_(True),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def _can_access_address(self, user: UserModel, address: AddressModel) -> bool:
        allowed_customer_ids = await self._allowed_customer_ids(user)
        if allowed_customer_ids is None:
            return True
        return address.customer_id in allowed_customer_ids

    async def can_access_assignment(self, user: UserModel, assignment: TechnicianModel) -> bool:
        address = assignment.address or await self.session.get(AddressModel, assignment.address_id)
        if not address:
            return False
        return await self._can_access_address(user, address)

    def _base_stmt(self):
        return select(TechnicianModel).options(
            selectinload(TechnicianModel.user),
            selectinload(TechnicianModel.address),
            selectinload(TechnicianModel.contractor),
        )

    async def create(self, data: TechnicianContractorCreate, user: UserModel) -> Optional[TechnicianModel]:
        contractor_stmt = select(ContractorModel).options(
            selectinload(ContractorModel.addresses)
        ).where(ContractorModel.id == data.contractor_id)
        contractor_result = await self.session.execute(contractor_stmt)
        contractor = contractor_result.scalar_one_or_none()
        if not contractor:
            raise ValueError("Contractor not found")

        address = await self.session.get(AddressModel, data.address_id)
        if not address:
            raise ValueError("Address not found")

        technician = await self.session.get(UserModel, data.technician_id)
        if not technician:
            raise ValueError("Technician not found")
        if not technician.is_active:
            raise ValueError("Technician is not active")

        if not await self._can_access_address(user, address):
            raise PermissionError("Only active curator of this organisation or admin can manage technician assignments")

        if address not in contractor.addresses:
            raise ValueError("Address is not assigned to this contractor")

        existing = await self.session.execute(
            select(TechnicianModel).where(
                TechnicianModel.contractor_id == data.contractor_id,
                TechnicianModel.address_id == data.address_id,
                TechnicianModel.technician_id == data.technician_id,
            )
        )
        if existing.scalar_one_or_none():
            return None

        assignment = TechnicianModel(**data.model_dump())
        self.session.add(assignment)
        await self.session.commit()
        return await self.get_by_id(assignment.id)

    async def get_by_id(self, assignment_id: int) -> Optional[TechnicianModel]:
        stmt = self._base_stmt().where(TechnicianModel.id == assignment_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        user: UserModel,
        skip: int = 0,
        limit: int = 100,
        contractor_id: Optional[int] = None,
        address_id: Optional[int] = None,
        technician_id: Optional[int] = None,
    ) -> List[TechnicianModel]:
        stmt = self._base_stmt()
        if contractor_id is not None:
            stmt = stmt.where(TechnicianModel.contractor_id == contractor_id)
        if address_id is not None:
            stmt = stmt.where(TechnicianModel.address_id == address_id)
        if technician_id is not None:
            stmt = stmt.where(TechnicianModel.technician_id == technician_id)

        allowed_customer_ids = await self._allowed_customer_ids(user)
        if allowed_customer_ids is not None:
            if not allowed_customer_ids:
                return []
            stmt = stmt.join(AddressModel, TechnicianModel.address_id == AddressModel.id).where(
                AddressModel.customer_id.in_(allowed_customer_ids)
            )

        stmt = stmt.offset(skip).limit(limit).order_by(TechnicianModel.id.asc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def delete(self, assignment_id: int, user: UserModel) -> bool:
        assignment = await self.get_by_id(assignment_id)
        if not assignment:
            return False

        if not await self.can_access_assignment(user, assignment):
            raise PermissionError("Only active curator of this organisation or admin can manage technician assignments")

        await self.session.delete(assignment)
        await self.session.commit()
        return True
