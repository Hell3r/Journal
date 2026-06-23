from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import List

class AddressShort(BaseModel):
    id: int
    address_name: str

    model_config = ConfigDict(from_attributes=True)

class ContractorShort(BaseModel):
    id: int
    name_of_contractor: str

    model_config = ConfigDict(from_attributes=True)
