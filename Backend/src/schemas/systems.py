from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from pydantic import Field


class SystemCreate(BaseModel):
    name: str


class SystemUpdate(BaseModel):
    name: Optional[str] = None


class SystemShort(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class SystemOnAddressResponse(BaseModel):
    id: int
    address_id: int
    system_id: int
    system: SystemShort

    model_config = ConfigDict(from_attributes=True)


class SystemResponse(BaseModel):
    id: int
    name: str
    addresses: List[SystemOnAddressResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
