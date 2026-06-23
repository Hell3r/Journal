from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class UserShort(BaseModel):
    id: int
    email: str

    model_config = ConfigDict(from_attributes=True)


class CustomerShort(BaseModel):
    id: int
    name_of_org: str
    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CuratorCreate(BaseModel):
    customer_id: int


class CuratorResponse(BaseModel):
    id: int
    customer_id: int
    user_id: int
    is_active: bool
    customer: CustomerShort
    user: UserShort

    model_config = ConfigDict(from_attributes=True)
