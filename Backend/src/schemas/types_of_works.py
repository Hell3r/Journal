from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from typing import Optional


class TypeOfWorkCreate(BaseModel):
    name: str


class TypeOfWorkUpdate(BaseModel):
    name: Optional[str] = None


class TypeOfWorkResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
