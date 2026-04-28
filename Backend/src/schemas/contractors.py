from __future__ import annotations
from pydantic import BaseModel, validator
from typing import List, Optional

class AddressShort(BaseModel):
    id: int
    address_name: str

    class Config:
        orm_mode = True

class UserShort(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None

    class Config:
        orm_mode = True

class TechnicianShort(BaseModel):
    id: int
    name: Optional[str] = None

    class Config:
        orm_mode = True


class ContractorCreate(BaseModel):
    name_of_contractor: str
    engineer_id: Optional[int] = None   # инженер, привязанный к подрядчику
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
    engineer: Optional[UserShort] = None    # объект пользователя-инженера
    addresses: List[AddressShort] = []
    technicians: List[UserShort] = []
    technician_contractor: List[TechnicianShort] = []

    @validator("technicians", pre=True)
    def ensure_list(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return [v]

class Config:
        orm_mode = True

