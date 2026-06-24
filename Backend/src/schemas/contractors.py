from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class AddressShort(BaseModel):
    id: int
    address_name: str

    model_config = ConfigDict(from_attributes=True)


class UserShort(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TechnicianShort(BaseModel):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ContractorCreate(BaseModel):
    name_of_contractor: str
    engineer_id: Optional[int] = None
    is_active: bool = True


class ContractorUpdate(BaseModel):
    name_of_contractor: Optional[str] = None
    engineer_id: Optional[int] = None
    is_active: Optional[bool] = None


class ContractorResponse(BaseModel):
    id: int
    name_of_contractor: str
    is_active: bool
    engineer_id: Optional[int] = None
    engineer: Optional[UserShort] = None
    addresses: List[AddressShort] = Field(default_factory=list)
    technicians: List[UserShort] = Field(default_factory=list)
    technician_contractor: List[TechnicianShort] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
