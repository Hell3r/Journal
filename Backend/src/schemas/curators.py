from __future__ import annotations
from pydantic import BaseModel
from typing import Optional

class UserShort(BaseModel):
    id: int
    email: str


    class Config:
        orm_mode = True

class CustomerShort(BaseModel):
    id: int
    name_of_org: str
    email: str
    is_active: bool

    class Config:
        orm_mode = True

class CuratorCreate(BaseModel):
    customer_id: int

class CuratorResponse(BaseModel):
    id: int
    customer_id: int
    user_id: int
    is_active: bool
    customer: CustomerShort
    user: UserShort

    class Config:
        orm_mode = True