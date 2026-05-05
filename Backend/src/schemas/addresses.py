from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional

# Краткие схемы для вложенных объектов
class ContractorShort(BaseModel):
    id: int
    name: Optional[str] = None      # замените на реальное поле

    class Config:
        orm_mode = True

class SystemOnAddressShort(BaseModel):
    id: int
    name: Optional[str] = None      # предположим, есть поле name

    class Config:
        orm_mode = True

class WorksShort(BaseModel):
    id: int
    description: Optional[str] = None  # пример

    class Config:
        orm_mode = True

class TechnicianShort(BaseModel):
    id: int
    full_name: Optional[str] = None

    class Config:
        orm_mode = True


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
    technicians: List[TechnicianShort] = []     # соответствует technician_address

    class Config:
        orm_mode = True