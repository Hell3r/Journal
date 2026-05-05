from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.deps import SessionDep
from src.schemas.contractors import ContractorCreate, ContractorUpdate, ContractorResponse
from src.schemas.contractor_addresses import AddressShort, ContractorShort
from src.services.ContractorService import ContractorService
from src.services.ContractorAddressService import ContractorAddressService
from src.dependencies.auth import get_current_user
from src.models.users import UserModel

router = APIRouter(prefix="/v1/contractors", tags=["Организации (Подрядчики)"])

# ── CRUD подрядчиков ─────────────────────────────────────────────
@router.post("/", response_model=ContractorResponse, status_code=status.HTTP_201_CREATED, summary="Создать подрядчика")
async def create_contractor(
    data: ContractorCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorService(session)
    try:
        contractor = await service.create(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return contractor

@router.get("/", response_model=List[ContractorResponse], summary="Получить список подрядчиков")
async def list_contractors(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorService(session)
    return await service.get_all(skip=skip, limit=limit)

@router.get("/{contractor_id}", response_model=ContractorResponse, summary="Получить подрядчика по идентификатору")
async def get_contractor(
    contractor_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorService(session)
    contractor = await service.get_by_id(contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return contractor

@router.patch("/{contractor_id}", response_model=ContractorResponse, summary="Обновить подрядчика")
async def update_contractor(
    contractor_id: int,
    data: ContractorUpdate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorService(session)
    try:
        contractor = await service.update(contractor_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return contractor

@router.delete("/{contractor_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить подрядчика")
async def delete_contractor(
    contractor_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorService(session)
    try:
        deleted = await service.delete(contractor_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Contractor not found")


# ── Управление адресами подрядчика внутри того же роутера ────────
@router.post("/{contractor_id}/addresses/{address_id}", status_code=status.HTTP_201_CREATED, summary="Добавить адрес для подрядчика")
async def add_address_to_contractor(
    contractor_id: int,
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorAddressService(session)
    try:
        created = await service.add_address(contractor_id, address_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if not created:
        raise HTTPException(status_code=409, detail="Address already assigned to this contractor")
    return {"detail": "Address added"}

@router.delete("/{contractor_id}/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить адрес у подрядчика")
async def remove_address_from_contractor(
    contractor_id: int,
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorAddressService(session)
    try:
        removed = await service.remove_address(contractor_id, address_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if not removed:
        raise HTTPException(status_code=404, detail="Address was not assigned to this contractor")
    return

@router.get("/{contractor_id}/addresses", response_model=List[AddressShort], summary="Получить адреса подрядчика")
async def list_addresses_of_contractor(
    contractor_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorAddressService(session)
    try:
        addresses = await service.get_addresses(contractor_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return addresses

@router.get("/addresses/{address_id}/contractors", response_model=List[ContractorShort], summary="Получить подрядчиков на адресе")
async def list_contractors_of_address(
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = ContractorAddressService(session)
    try:
        contractors = await service.get_contractors(address_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return contractors