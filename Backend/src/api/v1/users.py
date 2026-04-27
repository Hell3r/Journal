from typing_extensions import List
from fastapi import APIRouter, HTTPException, status, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from src.models.users import UserModel
from src.database.deps import SessionDep
from datetime import datetime
from src.schemas.users import (
    UserCreate, UserUpdate, UserPublic,
    Enable2FARequest, Verify2FARequest, Disable2FARequest, TwoFactorAuthRequest
)
from src.services.AuthService import (
    add_to_blacklist, oauth2_scheme, create_access_token, authenticate_user,
    get_current_user, get_user_by_username, verify_password, get_password_hash,
    generate_totp_secret, verify_totp_code, generate_backup_codes, hash_backup_codes,
    verify_backup_code, remove_used_backup_code, create_2fa_temp_token,
    get_user_id_from_2fa_temp_token, delete_2fa_temp_token, generate_qr_base64
)
import logging
from src.schemas.users import UserCreate, UserResponse, UserPublic

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/users")

pending_2fa_secrets = {}

@router.post("/login", tags = ["Авторизация"], summary = "Логин")
async def login_user(
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный username или пароль")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт не активирован")

    if not user.is_2fa_enabled:
        access_token = create_access_token(data={"sub": user.username})  # <-- sub = username
        user.last_login = datetime.utcnow()
        await session.commit()
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_info": {
                "username": user.username,
                "email": user.email,
                "user_id": user.id,
                "role": user.role,
                "is_active": user.is_active,
                "date_joined": user.date_joined,
            }
        }
    else:
        temp_token = create_2fa_temp_token(user.id)
        return {
            "2fa_required": True,
            "temp_token": temp_token,
            "message": "Для завершения входа введите одноразовый код из аутентификатора"
        }

@router.post("/login/2fa", tags = ["2FA"], summary="Логин с  включенной 2FA")
async def login_2fa(
    request: TwoFactorAuthRequest,
    session: SessionDep
):
    user_id = get_user_id_from_2fa_temp_token(request.temp_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Недействительный или истекший временный токен")

    result = await session.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_2fa_enabled:
        raise HTTPException(status_code=401, detail="2FA не активирована для этого пользователя")

    valid = verify_totp_code(user.totp_secret, request.code)
    if not valid and user.backup_codes:
        if verify_backup_code(user.backup_codes, request.code):
            valid = True
            new_backup_json = remove_used_backup_code(user.backup_codes, request.code)
            user.backup_codes = new_backup_json
            await session.commit()

    if not valid:
        raise HTTPException(status_code=401, detail="Неверный код")

    access_token = create_access_token(data={"sub": user.username})
    user.last_login = datetime.utcnow()
    await session.commit()
    delete_2fa_temp_token(request.temp_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "username": user.username,
            "email": user.email,
            "user_id": user.id,
            "role": user.role,
            "is_active": user.is_active,
            "date_joined": user.date_joined,
        }
    }

@router.post("/logout", tags=["Авторизация"], summary="Выход")
async def logout_user(
    session: SessionDep,
    response: Response,
    token: str = Depends(oauth2_scheme),
):
    await add_to_blacklist(token)
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}


@router.post("/2fa/enable", tags = ["2FA"], summary="Включить 2FA для пользователя")
async def enable_2fa(
    req: Enable2FARequest,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    if not verify_password(req.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный пароль")
    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA уже включена")

    secret = generate_totp_secret()
    pending_2fa_secrets[current_user.id] = secret
    qr_base64 = generate_qr_base64(secret, current_user.username)  # передаём username
    return {
        "secret": secret,
        "qr_code": qr_base64,
        "message": "Отсканируйте QR-код в приложении-аутентификаторе"
    }

@router.post("/2fa/verify-and-activate", tags = ["2FA"], summary="Верифицировать код 2FA в первый раз")
async def verify_and_activate_2fa(
    req: Verify2FARequest,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA уже активирована")
    secret = pending_2fa_secrets.get(current_user.id)
    if not secret:
        raise HTTPException(status_code=400, detail="Сначала запросите секрет через /2fa/enable")
    if not verify_totp_code(secret, req.code):
        raise HTTPException(status_code=401, detail="Неверный код")
    current_user.totp_secret = secret
    current_user.is_2fa_enabled = True
    backup_codes = generate_backup_codes(10)
    current_user.backup_codes = hash_backup_codes(backup_codes)
    await session.commit()
    del pending_2fa_secrets[current_user.id]
    return {
        "message": "2FA успешно активирована",
        "backup_codes": backup_codes,
        "warning": "Сохраните эти коды в надёжном месте."
    }

@router.post("/2fa/disable", tags = ["2FA"], summary="Отключить 2FA")
async def disable_2fa(
    req: Disable2FARequest,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    if not current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA не активирована")
    valid = verify_totp_code(current_user.totp_secret, req.code)
    if not valid and current_user.backup_codes:
        valid = verify_backup_code(current_user.backup_codes, req.code)
    if not valid:
        raise HTTPException(status_code=401, detail="Неверный код")
    current_user.totp_secret = None
    current_user.is_2fa_enabled = False
    current_user.backup_codes = None
    await session.commit()
    return {"message": "2FA отключена"}


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED, tags=["Пользователи"], summary="Создать пользователя")
async def register_user(
        user_data: UserCreate,
        session: SessionDep
):
    existing_username = await session.execute(
        select(UserModel).where(UserModel.username == user_data.username)
    )
    if existing_username.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким username уже существует"
        )

    existing_email = await session.execute(
        select(UserModel).where(UserModel.email == user_data.email)
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    hashed_password = get_password_hash(user_data.password)

    new_user = UserModel(
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        is_active=user_data.is_active,
        contractor_id=user_data.contractor_id,
        password_hash=hashed_password,
        date_joined=user_data.date_joined or datetime.utcnow(),
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user