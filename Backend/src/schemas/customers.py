from pydantic import BaseModel, EmailStr
from typing import List, Optional

class AddressBase(BaseModel):
    id: int
    address_name: str

class CuratorBase(BaseModel):
    id: int
    email: str
    is_active: bool

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

    class Config:
        orm_mode = True