from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.database.deps import SessionDep
from src.schemas.addresses import AddressCreate, AddressUpdate, AddressResponse
from src.services.AddressService import AddressService
from src.services.SystemsService import SystemsService
from src.services.WorksService import WorksService
from src.schemas.systems import SystemOnAddressResponse
from src.schemas.works import WorkResponse, WorkCreateForAddress, WorkCreate
from src.dependencies.auth import get_current_user
from src.dependencies.auth import get_current_admin_user
from src.models.users import UserModel

router = APIRouter(prefix="/v1/addresses", tags=["Адреса"])

@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED, summary="Создать адрес")
async def create_address(
    data: AddressCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = AddressService(session)
    try:
        address = await service.create(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return address

@router.get("/", response_model=List[AddressResponse], summary="Получить все адреса")
async def list_addresses(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = Query(None),
    current_user: UserModel = Depends(get_current_user)
):
    service = AddressService(session)
    addresses = await service.get_all(skip=skip, limit=limit, customer_id=customer_id)
    return addresses

@router.get("/{address_id}", response_model=AddressResponse, summary="Получить адрес по идентификатору")
async def get_address(
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = AddressService(session)
    address = await service.get_by_id(address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    return address

@router.patch("/{address_id}", response_model=AddressResponse, summary="Обновить адрес")
async def update_address(
    address_id: int,
    data: AddressUpdate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = AddressService(session)
    try:
        address = await service.update(address_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    return address

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить адрес (админ)")
async def delete_address(
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user)
):
    service = AddressService(session)
    try:
        deleted = await service.delete(address_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Address not found")
    return None


@router.get("/{address_id}/systems", response_model=List[SystemOnAddressResponse], summary="Получить системы на адресе")
async def list_systems_of_address(
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = SystemsService(session)
    try:
        return await service.list_relations_for_address(address_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{address_id}/systems/{system_id}", response_model=SystemOnAddressResponse, status_code=status.HTTP_201_CREATED, summary="Добавить систему на адрес")
async def add_system_to_address(
    address_id: int,
    system_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
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


@router.delete("/{address_id}/systems/{system_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить систему с адреса")
async def remove_system_from_address(
    address_id: int,
    system_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
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


@router.get("/{address_id}/works", response_model=List[WorkResponse], summary="Получить работы на адресе")
async def list_works_of_address(
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = WorksService(session)
    return await service.get_all(address_id=address_id)


@router.post("/{address_id}/works", response_model=WorkResponse, status_code=status.HTTP_201_CREATED, summary="Создать работу на адресе")
async def create_work_for_address(
    address_id: int,
    data: WorkCreateForAddress,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = WorksService(session)
    try:
        payload = WorkCreate(address_id=address_id, **data.model_dump())
        work = await service.create(payload, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return work
