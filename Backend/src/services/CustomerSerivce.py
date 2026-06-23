from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.curators import CuratorModel
from src.models.customers import CustomerModel
from src.schemas.customers import CustomerCreate, CustomerUpdate

class CustomerService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: CustomerCreate) -> CustomerModel:
        existing = await self.session.execute(
            select(CustomerModel).where(CustomerModel.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Customer with this email already exists")

        customer = CustomerModel(**data.model_dump())
        self.session.add(customer)
        await self.session.commit()
        await self.session.refresh(customer, attribute_names=['addresses', 'curators'])
        return customer

    async def get_by_id(self, customer_id: int) -> Optional[CustomerModel]:
        stmt = (
            select(CustomerModel)
            .options(selectinload(CustomerModel.addresses), selectinload(CustomerModel.curators).selectinload(CuratorModel.user))
            .where(CustomerModel.id == customer_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[CustomerModel]:
        stmt = (
            select(CustomerModel)
            .options(selectinload(CustomerModel.addresses), selectinload(CustomerModel.curators).selectinload(CuratorModel.user))
            .offset(skip)
            .limit(limit)
            .order_by(CustomerModel.id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, customer_id: int, data: CustomerUpdate) -> Optional[CustomerModel]:
        customer = await self.get_by_id(customer_id)
        if not customer:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"] != customer.email:
            existing = await self.session.execute(
                select(CustomerModel).where(CustomerModel.email == update_data["email"], CustomerModel.id != customer_id)
            )
            if existing.scalar_one_or_none():
                raise ValueError("Customer with this email already exists")

        for field, value in update_data.items():
            setattr(customer, field, value)
        await self.session.commit()
        await self.session.refresh(customer, attribute_names=['addresses', 'curators'])
        return customer

    async def delete(self, customer_id: int) -> bool:
        customer = await self.get_by_id(customer_id)
        if not customer:
            return False
        await self.session.delete(customer)
        await self.session.commit()
        return True

    async def activate(self, customer_id: int) -> Optional[CustomerModel]:
        customer = await self.get_by_id(customer_id)
        if not customer:
            return None
        customer.is_active = True
        await self.session.commit()
        await self.session.refresh(customer, attribute_names=['addresses', 'curators'])
        return customer
