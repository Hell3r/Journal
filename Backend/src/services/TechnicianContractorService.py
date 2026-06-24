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

    async def _allowed_contractor_ids(self, user: UserModel) -> Optional[List[int]]:
        if user.role == "admin":
            return None
        if user.role != "engineer":
            return []

        stmt = select(ContractorModel.id).where(
            ContractorModel.engineer_id == user.id,
            ContractorModel.is_active.is_(True),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def _can_access_address(self, user: UserModel, address: AddressModel) -> bool:
        allowed_customer_ids = await self._allowed_customer_ids(user)
        if allowed_customer_ids is None:
            return True
        return address.customer_id in allowed_customer_ids

    async def _can_manage_contractor_assignment(self, user: UserModel, contractor: ContractorModel, address: AddressModel) -> bool:
        if user.role == "admin":
            return True
        if user.role == "engineer":
            contractor_address_ids = {item.id for item in contractor.addresses}
            return contractor.engineer_id == user.id and address.id in contractor_address_ids
        if user.role == "curator":
            contractor_address_ids = {item.id for item in contractor.addresses}
            return await self._can_access_address(user, address) and address.id in contractor_address_ids
        return False

    async def can_access_assignment(self, user: UserModel, assignment: TechnicianModel) -> bool:
        address = assignment.address or (await self.session.get(AddressModel, assignment.address_id) if assignment.address_id else None)
        contractor = assignment.contractor or await self.session.get(ContractorModel, assignment.contractor_id)
        if not contractor:
            return False
        if address is None:
            return user.role == "admin" or (user.role == "engineer" and contractor.engineer_id == user.id)
        return await self._can_manage_contractor_assignment(user, contractor, address)

    def _base_stmt(self):
        return select(TechnicianModel).options(
            selectinload(TechnicianModel.user),
            selectinload(TechnicianModel.address),
            selectinload(TechnicianModel.contractor).selectinload(ContractorModel.addresses),
        )

    async def create(self, data: TechnicianContractorCreate, user: UserModel) -> Optional[TechnicianModel]:
        contractor_stmt = select(ContractorModel).options(
            selectinload(ContractorModel.addresses)
        ).where(ContractorModel.id == data.contractor_id)
        contractor_result = await self.session.execute(contractor_stmt)
        contractor = contractor_result.scalar_one_or_none()
        if not contractor:
            raise ValueError("Contractor not found")

        address = None
        if data.address_id is not None:
            address = await self.session.get(AddressModel, data.address_id)
            if not address:
                raise ValueError("Address not found")

        technician = await self.session.get(UserModel, data.technician_id)
        if not technician:
            raise ValueError("Technician not found")
        if not technician.is_active:
            raise ValueError("Technician is not active")

        if user.role == "engineer":
            if contractor.engineer_id != user.id:
                raise PermissionError("Engineer can manage only their contractor")
            if data.address_id is not None and address.id not in {item.id for item in contractor.addresses}:
                raise PermissionError("Address is not assigned to this contractor")
        elif user.role == "curator":
            if data.address_id is None:
                raise PermissionError("Curator can assign technicians only to objects")
            if not await self._can_manage_contractor_assignment(user, contractor, address):
                raise PermissionError("Only active curator of this organisation or admin can manage technician assignments")
        elif user.role != "admin":
            raise PermissionError("Only active curator of this organisation or admin can manage technician assignments")

        if data.address_id is not None and address not in contractor.addresses:
            raise ValueError("Address is not assigned to this contractor")

        if technician.role == "user":
            technician.role = "technician"
            self.session.add(technician)

        address_clause = TechnicianModel.address_id.is_(None) if data.address_id is None else TechnicianModel.address_id == data.address_id
        existing = await self.session.execute(
            select(TechnicianModel).where(
                TechnicianModel.contractor_id == data.contractor_id,
                TechnicianModel.technician_id == data.technician_id,
                address_clause,
            )
        )
        if existing.scalar_one_or_none():
            return None

        assignment = TechnicianModel(**data.model_dump(exclude_unset=True))
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

        if user.role == "engineer":
            allowed_contractor_ids = await self._allowed_contractor_ids(user)
            if not allowed_contractor_ids:
                return []
            stmt = stmt.where(TechnicianModel.contractor_id.in_(allowed_contractor_ids))
        elif user.role == "curator":
            allowed_customer_ids = await self._allowed_customer_ids(user)
            if not allowed_customer_ids:
                return []
            stmt = stmt.join(AddressModel, TechnicianModel.address_id == AddressModel.id).where(
                AddressModel.customer_id.in_(allowed_customer_ids)
            )
        elif user.role != "admin":
            return []

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
