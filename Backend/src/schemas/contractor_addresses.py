from __future__ import annotations
from pydantic import BaseModel
from typing import List

class AddressShort(BaseModel):
    id: int
    address_name: str

    class Config:
        orm_mode = True

class ContractorShort(BaseModel):
    id: int
    name_of_contractor: str

    class Config:
        orm_mode = True