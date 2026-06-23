from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from typing import Optional

from src.schemas.contractor_addresses import AddressShort, ContractorShort


class UserShort(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class TechnicianContractorCreate(BaseModel):
    contractor_id: int
    address_id: int
    technician_id: int


class TechnicianContractorResponse(BaseModel):
    id: int
    contractor_id: int
    address_id: int
    technician_id: int
    contractor: ContractorShort
    address: AddressShort
    user: UserShort

    model_config = ConfigDict(from_attributes=True)
