from sqlalchemy import select
from typing import Optional
from typing_extensions import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.deps import SessionDep
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import json
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel
from src.models.users import UserModel

env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
pwd_context_backup = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/users/login")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

token_blacklist = {}
pending_2fa_auth = {}

class TokenData(BaseModel):
    username: Optional[str] = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_user_by_username(username: str, session: AsyncSession):
    result = await session.execute(
        select(UserModel).where(UserModel.username == username)
    )
    return result.scalar_one_or_none()

async def authenticate_user(username: str, password: str, session: AsyncSession):
    user = await get_user_by_username(username, session)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user


async def add_to_blacklist(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        expiry = datetime.fromtimestamp(payload["exp"])
        token_blacklist[token] = expiry
    except JWTError:
        pass

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep
) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token in token_blacklist:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        raise credentials_exception from e
    user = await get_user_by_username(token_data.username, session)
    if user is None:
        raise credentials_exception
    return user

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def check_username_exists(username: str, session: AsyncSession) -> bool:
    result = await session.execute(
        select(UserModel).where(UserModel.username == username)
    )
    return result.scalar_one_or_none() is not None

async def check_email_exists(email: str, session: AsyncSession) -> bool:
    result = await session.execute(
        select(UserModel).where(UserModel.email == email)
    )
    return result.scalar_one_or_none() is not None


def generate_totp_secret() -> str:
    return pyotp.random_base32()

def get_totp_uri(secret: str, username: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name="Journal")

def verify_totp_code(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int = 10) -> list:
    return [secrets.token_hex(4).upper() for _ in range(count)]

def hash_backup_codes(codes: list) -> str:
    hashed = [pwd_context_backup.hash(code) for code in codes]
    return json.dumps(hashed)

def verify_backup_code(backup_codes_json: str, raw_code: str) -> bool:
    if not backup_codes_json:
        return False
    hashed_codes = json.loads(backup_codes_json)
    for hashed in hashed_codes:
        if pwd_context_backup.verify(raw_code, hashed):
            return True
    return False

def remove_used_backup_code(backup_codes_json: str, raw_code: str) -> str:
    hashed_codes = json.loads(backup_codes_json)
    for i, hashed in enumerate(hashed_codes):
        if pwd_context_backup.verify(raw_code, hashed):
            del hashed_codes[i]
            return json.dumps(hashed_codes)
    return backup_codes_json

def create_2fa_temp_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    pending_2fa_auth[token] = {
        "user_id": user_id,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }
    return token

def get_user_id_from_2fa_temp_token(token: str) -> Optional[int]:
    data = pending_2fa_auth.get(token)
    if data and data["expires"] > datetime.utcnow():
        return data["user_id"]
    return None

def delete_2fa_temp_token(token: str):
    pending_2fa_auth.pop(token, None)

def generate_qr_base64(secret: str, username: str) -> str:
    uri = get_totp_uri(secret, username)  # передаём username
    qr = qrcode.make(uri)
    buffered = BytesIO()
    qr.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()