from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.types_of_works import TypesOfWorksModel
from src.schemas.types_of_works import TypeOfWorkCreate, TypeOfWorkUpdate
from src.models.users import UserModel


class TypeOfWorksService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _ensure_admin(self, user: UserModel):
        if user.role != "admin":
            raise PermissionError("Only admin can manage types of works")

    async def create(self, data: TypeOfWorkCreate, user: UserModel) -> TypesOfWorksModel:
        await self._ensure_admin(user)
        item = TypesOfWorksModel(**data.model_dump())
        self.session.add(item)
        await self.session.commit()
        return await self.get_by_id(item.id)

    async def get_by_id(self, item_id: int) -> Optional[TypesOfWorksModel]:
        return await self.session.get(TypesOfWorksModel, item_id)

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[TypesOfWorksModel]:
        stmt = select(TypesOfWorksModel).offset(skip).limit(limit).order_by(TypesOfWorksModel.id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, item_id: int, data: TypeOfWorkUpdate, user: UserModel) -> Optional[TypesOfWorksModel]:
        await self._ensure_admin(user)
        item = await self.get_by_id(item_id)
        if not item:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        await self.session.commit()
        return await self.get_by_id(item_id)

    async def delete(self, item_id: int, user: UserModel) -> bool:
        await self._ensure_admin(user)
        item = await self.get_by_id(item_id)
        if not item:
            return False
        await self.session.delete(item)
        await self.session.commit()
        return True
