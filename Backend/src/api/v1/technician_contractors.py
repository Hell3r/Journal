from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.database.deps import SessionDep
from src.dependencies.auth import get_current_user
from src.models.users import UserModel
from src.schemas.technician_contractors import (
    TechnicianContractorCreate,
    TechnicianContractorResponse,
)
from src.services.TechnicianContractorService import TechnicianContractorService

router = APIRouter(prefix="/v1/technician-contractors", tags=["Техники подрядчика"])


@router.get("/", response_model=List[TechnicianContractorResponse], summary="Получить список назначений техник-подрядчик")
async def list_technician_assignments(
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    contractor_id: Optional[int] = Query(None),
    address_id: Optional[int] = Query(None),
    technician_id: Optional[int] = Query(None),
):
    service = TechnicianContractorService(session)
    return await service.get_all(
        current_user,
        skip=skip,
        limit=limit,
        contractor_id=contractor_id,
        address_id=address_id,
        technician_id=technician_id,
    )


@router.get("/{assignment_id}", response_model=TechnicianContractorResponse, summary="Получить назначение по идентификатору")
async def get_technician_assignment(
    assignment_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TechnicianContractorService(session)
    assignment = await service.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if not await service.can_access_assignment(current_user, assignment):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return assignment


@router.get("/contractors/{contractor_id}", response_model=List[TechnicianContractorResponse], summary="Получить назначения подрядчика")
async def get_assignments_by_contractor(
    contractor_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TechnicianContractorService(session)
    return await service.get_all(current_user, contractor_id=contractor_id)


@router.get("/addresses/{address_id}", response_model=List[TechnicianContractorResponse], summary="Получить назначения адреса")
async def get_assignments_by_address(
    address_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TechnicianContractorService(session)
    return await service.get_all(current_user, address_id=address_id)


@router.get("/technicians/{technician_id}", response_model=List[TechnicianContractorResponse], summary="Получить назначения техника")
async def get_assignments_by_technician(
    technician_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TechnicianContractorService(session)
    return await service.get_all(current_user, technician_id=technician_id)


@router.post("/", response_model=TechnicianContractorResponse, status_code=status.HTTP_201_CREATED, summary="Назначить техника подрядчику и адресу")
async def create_technician_assignment(
    data: TechnicianContractorCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TechnicianContractorService(session)
    try:
        assignment = await service.create(data, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not assignment:
        raise HTTPException(status_code=409, detail="Assignment already exists")
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Снять назначение техника")
async def delete_technician_assignment(
    assignment_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user),
):
    service = TechnicianContractorService(session)
    try:
        deleted = await service.delete(assignment_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return None
