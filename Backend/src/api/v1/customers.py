from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.deps import SessionDep
from src.schemas.customers import CustomerCreate, CustomerUpdate, CustomerResponse
from src.services.CustomerSerivce import CustomerService
from src.dependencies.auth import get_current_admin_user, get_current_user
from src.models.users import UserModel

router = APIRouter(prefix="/v1/customers", tags=["Организации (Заказчики)"])

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED, summary = "Создать нового заказчика")
async def create_customer(
    data: CustomerCreate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = CustomerService(session)
    customer = await service.create(data)
    return customer

@router.get("/", response_model=List[CustomerResponse], summary= "Получить всех заказчиков")
async def list_customers(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_user)
):
    service = CustomerService(session)
    customers = await service.get_all(skip=skip, limit=limit)
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse, summary="Получить заказчика по идентификатору")
async def get_customer(
    customer_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = CustomerService(session)
    customer = await service.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/{customer_id}", response_model=CustomerResponse, summary="Обновить данные заказчика")
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    service = CustomerService(session)
    customer = await service.update(customer_id, data)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить заказчика (админ)")
async def delete_customer(
    customer_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user)
):
    service = CustomerService(session)
    deleted = await service.delete(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")

@router.patch("/{customer_id}/activate", response_model=CustomerResponse, summary="Активировать заказчика (админ)")
async def activate_customer(
    customer_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_admin_user)
):
    service = CustomerService(session)
    customer = await service.activate(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer