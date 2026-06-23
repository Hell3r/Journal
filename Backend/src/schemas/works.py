from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from typing import Optional


class AddressShort(BaseModel):
    id: int
    address_name: str

    model_config = ConfigDict(from_attributes=True)


class TypeOfWorkShort(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserShort(BaseModel):
    id: int
    email: str
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WorkCreate(BaseModel):
    address_id: int
    type_of_work_id: int
    technician_id: int
    description: Optional[str] = None


class WorkCreateForAddress(BaseModel):
    type_of_work_id: int
    technician_id: int
    description: Optional[str] = None


class WorkUpdate(BaseModel):
    address_id: Optional[int] = None
    type_of_work_id: Optional[int] = None
    technician_id: Optional[int] = None
    description: Optional[str] = None


class WorkResponse(BaseModel):
    id: int
    address_id: int
    type_of_work_id: int
    technician_id: int
    description: Optional[str] = None
    address: AddressShort
    type_of_work: TypeOfWorkShort
    technician: UserShort

    model_config = ConfigDict(from_attributes=True)
