from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    email: str
    phone: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    date_joined: Optional[datetime] = Field(default_factory=datetime.now)

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    date_joined: datetime
    model_config = ConfigDict(from_attributes=True)

class UserPublic(UserBase):
    id: int
    date_joined: datetime
    is_2fa_enabled: bool

    model_config = ConfigDict(from_attributes=True)

class Enable2FARequest(BaseModel):
    password: str

class Verify2FARequest(BaseModel):
    code: str

class Disable2FARequest(BaseModel):
    code: str

class TwoFactorAuthRequest(BaseModel):
    temp_token: str
    code: str