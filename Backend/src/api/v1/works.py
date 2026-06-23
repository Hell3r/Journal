from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.database.deps import SessionDep
from src.dependencies.auth import get_current_user
from src.models.users import UserModel
from src.schemas.works import WorkCreate, WorkResponse, WorkUpdate
from src.services.WorksService import WorksService

router = APIRouter(prefix="/v1/works", tags=["Работы"])


@router.post("/", response_model=WorkResponse, status_code=status.HTTP_201_CREATED, summary="Создать работу")
async def create_work(
    data: WorkCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = WorksService(session)
    try:
        return await service.create(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=List[WorkResponse], summary="Получить все работы")
async def list_works(
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    address_id: Optional[int] = Query(None),
):
    service = WorksService(session)
    return await service.get_all(skip=skip, limit=limit, address_id=address_id)


@router.get("/{work_id}", response_model=WorkResponse, summary="Получить работу по идентификатору")
async def get_work(
    work_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = WorksService(session)
    work = await service.get_by_id(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work


@router.patch("/{work_id}", response_model=WorkResponse, summary="Обновить работу")
async def update_work(
    work_id: int,
    data: WorkUpdate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = WorksService(session)
    try:
        work = await service.update(work_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work


@router.delete("/{work_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить работу")
async def delete_work(
    work_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = WorksService(session)
    try:
        deleted = await service.delete(work_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Work not found")
    return None
