from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.deps import SessionDep
from src.schemas.addresses import AddressCreate, AddressUpdate, AddressResponse
from src.services.AddressService import AddressService
from src.dependencies.auth import get_current_user
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
    current_user: UserModel = Depends(get_current_user)
):
    service = AddressService(session)
    try:
        deleted = await service.delete(address_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Address not found")