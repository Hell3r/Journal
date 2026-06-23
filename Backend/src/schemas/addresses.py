from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class ContractorShort(BaseModel):
    id: int
    name_of_contractor: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SystemOnAddressShort(BaseModel):
    id: int

    model_config = ConfigDict(from_attributes=True)


class WorksShort(BaseModel):
    id: int
    description: Optional[str] = None

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
    contractors: List[ContractorShort] = []
    systems: List[SystemOnAddressShort] = []
    works: List[WorksShort] = []
    technicians: List[TechnicianShort] = Field(default_factory=list, alias="technician_address")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
