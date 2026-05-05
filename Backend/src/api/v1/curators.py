from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.deps import SessionDep
from src.schemas.curators import CuratorCreate, CuratorResponse
from src.services.CuratorService import CuratorService
from src.dependencies.auth import get_current_admin_user, get_current_user
from src.models.users import UserModel

router = APIRouter(prefix="/v1/curators", tags=["Кураторы"])

@router.post("/", response_model=CuratorResponse, status_code=status.HTTP_201_CREATED, summary="Создать запрос на кураторство")
async def create_curator_request(
    data: CuratorCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = CuratorService(session)
    try:
        curator = await service.create(data, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return curator

@router.get("/", response_model=List[CuratorResponse], summary="Вывод всех кураторов")
async def list_curators(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = Query(None),
    current_user: UserModel = Depends(get_current_user)
):
    service = CuratorService(session)
    if current_user.role != "admin":
        user_filter = current_user.id
    else:
        user_filter = user_id

    curators = await service.get_all(skip=skip, limit=limit, user_filter=user_filter)
    return curators

@router.get("/{curator_id}", response_model=CuratorResponse, summary="Получить куратора по идентификатору")
async def get_curator(
    curator_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = CuratorService(session)
    curator = await service.get_by_id(curator_id)
    if not curator:
        raise HTTPException(status_code=404, detail="Curator not found")
    # Ограничение: пользователь может смотреть только свои заявки (если не админ)
    if current_user.role != "admin" and curator.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return curator

@router.patch("/{curator_id}/activate", response_model=CuratorResponse, summary="Обработать запрос на кураторство (админ)")
async def activate_curator(
    curator_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user)
):
    service = CuratorService(session)
    curator = await service.activate(curator_id)
    if not curator:
        raise HTTPException(status_code=404, detail="Curator not found")
    return curator

@router.delete("/{curator_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить куратора (админ)")
async def delete_curator(
    curator_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user)  # только админ
):
    service = CuratorService(session)
    deleted = await service.delete(curator_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Curator not found")
    return None