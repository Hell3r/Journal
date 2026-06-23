from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.users import UserModel
from src.schemas.users import UserCreate, UserUpdate
from src.services.AuthService import get_password_hash


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _ensure_unique(self, username: str, email: str, user_id: Optional[int] = None) -> None:
        username_stmt = select(UserModel).where(UserModel.username == username)
        email_stmt = select(UserModel).where(UserModel.email == email)
        if user_id is not None:
            username_stmt = username_stmt.where(UserModel.id != user_id)
            email_stmt = email_stmt.where(UserModel.id != user_id)

        username_result = await self.session.execute(username_stmt)
        if username_result.scalar_one_or_none():
            raise ValueError("User with this username already exists")

        email_result = await self.session.execute(email_stmt)
        if email_result.scalar_one_or_none():
            raise ValueError("User with this email already exists")

    async def create(self, data: UserCreate) -> UserModel:
        await self._ensure_unique(data.username, data.email)
        user = UserModel(
            username=data.username,
            email=data.email,
            phone=data.phone,
            role=data.role,
            is_active=data.is_active,
            password_hash=get_password_hash(data.password),
            date_joined=data.date_joined,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> Optional[UserModel]:
        return await self.session.get(UserModel, user_id)

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[UserModel]:
        stmt = select(UserModel).offset(skip).limit(limit).order_by(UserModel.id.asc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, user_id: int, data: UserUpdate) -> Optional[UserModel]:
        user = await self.get_by_id(user_id)
        if not user:
            return None

        update_data = data.model_dump(exclude_unset=True)
        next_username = update_data.get("username", user.username)
        next_email = update_data.get("email", user.email)
        if next_username != user.username or next_email != user.email:
            await self._ensure_unique(next_username, next_email, user_id=user_id)

        password = update_data.pop("password", None)
        if password:
            user.password_hash = get_password_hash(password)

        for field, value in update_data.items():
            setattr(user, field, value)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def activate(self, user_id: int) -> Optional[UserModel]:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        user.is_active = True
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        user = await self.get_by_id(user_id)
        if not user:
            return False
        await self.session.delete(user)
        await self.session.commit()
        return True
