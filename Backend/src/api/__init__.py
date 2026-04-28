from fastapi import APIRouter
from src.api.v1.health import router as health_router
from src.api.v1.users import router as users_router
from src.api.v1.customers import router as customer_router
from src.api.v1.curators import router as curator_router
from src.api.v1.addresses import router as addresses_router
from src.api.v1.contractors import router as contractors_router

main_router = APIRouter()
main_router.include_router(health_router)
main_router.include_router(users_router)
main_router.include_router(customer_router)
main_router.include_router(curator_router)
main_router.include_router(addresses_router)
main_router.include_router(contractors_router)

