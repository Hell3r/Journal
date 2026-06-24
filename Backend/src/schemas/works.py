from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from pydantic import Field
from datetime import datetime


class AddressShort(BaseModel):
    id: int
    address_name: str
    systems: List["SystemOnAddressShort"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TypeOfWorkShort(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class SystemShort(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class SystemOnAddressShort(BaseModel):
    id: int
    address_id: int
    system_id: int
    system: Optional[SystemShort] = None

    model_config = ConfigDict(from_attributes=True)


class UserShort(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WorkCreate(BaseModel):
    address_id: int
    system_id: int
    type_of_work_id: int
    technician_id: int
    description: Optional[str] = None


class WorkCreateForAddress(BaseModel):
    system_id: int
    type_of_work_id: int
    technician_id: int
    description: Optional[str] = None


class WorkUpdate(BaseModel):
    address_id: Optional[int] = None
    system_id: Optional[int] = None
    type_of_work_id: Optional[int] = None
    technician_id: Optional[int] = None
    description: Optional[str] = None


class WorkResponse(BaseModel):
    id: int
    address_id: int
    type_of_work_id: int
    technician_id: int
    description: Optional[str] = None
    created_at: datetime
    system_name: Optional[str] = None
    system: Optional[SystemShort] = None
    address: AddressShort
    type_of_work: TypeOfWorkShort
    technician: UserShort

    model_config = ConfigDict(from_attributes=True)
