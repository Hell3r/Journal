from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class ContractorShort(BaseModel):
    id: int
    name_of_contractor: Optional[str] = None

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


class TypeOfWorkShort(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserShort(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WorksShort(BaseModel):
    id: int
    description: Optional[str] = None
    address_id: int
    system_id: Optional[int] = None
    type_of_work_id: int
    technician_id: int
    system_name: Optional[str] = None
    system: Optional[SystemShort] = None
    type_of_work: Optional[TypeOfWorkShort] = None
    technician: Optional[UserShort] = None

    model_config = ConfigDict(from_attributes=True)


class TechnicianShort(BaseModel):
    id: int

    model_config = ConfigDict(from_attributes=True)


class AddressCreate(BaseModel):
    address_name: str
    customer_id: int


class AddressUpdate(BaseModel):
    address_name: Optional[str] = None


class AddressResponse(BaseModel):
    id: int
    customer_id: int
    address_name: str
    contractors: List[ContractorShort] = Field(default_factory=list)
    systems: List[SystemOnAddressShort] = Field(default_factory=list)
    works: List[WorksShort] = Field(default_factory=list)
    technicians: List[TechnicianShort] = Field(default_factory=list, alias="technician_address")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
