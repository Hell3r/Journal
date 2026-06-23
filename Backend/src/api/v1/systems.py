from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from src.database.deps import SessionDep
from src.dependencies.auth import get_current_admin_user, get_current_user
from src.models.users import UserModel
from src.schemas.systems import (
    SystemCreate,
    SystemOnAddressResponse,
    SystemResponse,
    SystemUpdate,
)
from src.schemas.works import AddressShort
from src.services.SystemsService import SystemsService

router = APIRouter(prefix="/v1/systems", tags=["Системы"])


@router.post("/", response_model=SystemResponse, status_code=status.HTTP_201_CREATED, summary="Создать систему")
async def create_system(
    data: SystemCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = SystemsService(session)
    try:
        return await service.create(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/", response_model=List[SystemResponse], summary="Получить все системы")
async def list_systems(
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    service = SystemsService(session)
    return await service.get_all(skip=skip, limit=limit)


@router.get("/{system_id}", response_model=SystemResponse, summary="Получить систему по идентификатору")
async def get_system(
    system_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = SystemsService(session)
    system = await service.get_by_id(system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return system


@router.patch("/{system_id}", response_model=SystemResponse, summary="Обновить систему")
async def update_system(
    system_id: int,
    data: SystemUpdate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user),
):
    service = SystemsService(session)
    try:
        system = await service.update(system_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return system


@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить систему")
async def delete_system(
    system_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user),
):
    service = SystemsService(session)
    try:
        deleted = await service.delete(system_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="System not found")
    return None


@router.get("/{system_id}/addresses", response_model=List[AddressShort], summary="Получить адреса системы")
async def list_addresses_of_system(
    system_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = SystemsService(session)
    try:
        return await service.list_addresses(system_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{system_id}/addresses/{address_id}", response_model=SystemOnAddressResponse, status_code=status.HTTP_201_CREATED, summary="Добавить систему к адресу")
async def add_system_to_address(
    system_id: int,
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = SystemsService(session)
    try:
        relation = await service.add_to_address(system_id=system_id, address_id=address_id, user=current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not relation:
        raise HTTPException(status_code=409, detail="System already assigned to this address")
    return relation


@router.delete("/{system_id}/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить систему с адреса")
async def remove_system_from_address(
    system_id: int,
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = SystemsService(session)
    try:
        removed = await service.remove_from_address(system_id=system_id, address_id=address_id, user=current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not removed:
        raise HTTPException(status_code=404, detail="System was not assigned to this address")
    return None
