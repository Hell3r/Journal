from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from src.database.deps import SessionDep
from src.dependencies.auth import get_current_admin_user, get_current_user
from src.models.users import UserModel
from src.schemas.types_of_works import TypeOfWorkCreate, TypeOfWorkResponse, TypeOfWorkUpdate
from src.services.TypeOfWorksService import TypeOfWorksService

router = APIRouter(prefix="/v1/types-of-works", tags=["Типы работ"])


@router.post("/", response_model=TypeOfWorkResponse, status_code=status.HTTP_201_CREATED, summary="Создать тип работы")
async def create_type_of_work(
    data: TypeOfWorkCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user),
):
    service = TypeOfWorksService(session)
    try:
        return await service.create(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/", response_model=List[TypeOfWorkResponse], summary="Получить все типы работ")
async def list_type_of_works(
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TypeOfWorksService(session)
    return await service.get_all()


@router.get("/{type_of_work_id}", response_model=TypeOfWorkResponse, summary="Получить тип работы по идентификатору")
async def get_type_of_work(
    type_of_work_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TypeOfWorksService(session)
    item = await service.get_by_id(type_of_work_id)
    if not item:
        raise HTTPException(status_code=404, detail="Type of work not found")
    return item


@router.patch("/{type_of_work_id}", response_model=TypeOfWorkResponse, summary="Обновить тип работы")
async def update_type_of_work(
    type_of_work_id: int,
    data: TypeOfWorkUpdate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user),
):
    service = TypeOfWorksService(session)
    try:
        item = await service.update(type_of_work_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not item:
        raise HTTPException(status_code=404, detail="Type of work not found")
    return item


@router.delete("/{type_of_work_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить тип работы")
async def delete_type_of_work(
    type_of_work_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user),
):
    service = TypeOfWorksService(session)
    try:
        deleted = await service.delete(type_of_work_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Type of work not found")
    return None
