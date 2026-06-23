from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional


class AddressBase(BaseModel):
    id: int
    address_name: str

    model_config = ConfigDict(from_attributes=True)


class CuratorBase(BaseModel):
    id: int
    email: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CustomerCreate(BaseModel):
    name_of_org: str
    email: EmailStr


class CustomerUpdate(BaseModel):
    name_of_org: Optional[str] = None
    email: Optional[EmailStr] = None


class CustomerResponse(BaseModel):
    id: int
    name_of_org: str
    email: str
    is_active: bool
    addresses: List[AddressBase] = []
    curators: List[CuratorBase] = []

    model_config = ConfigDict(from_attributes=True)
