from fastapi import APIRouter
from src.api.v1.health import router as health_router
from src.api.v1.users import router as users_router
from src.api.v1.customers import router as customer_router
from src.api.v1.curators import router as curator_router
from src.api.v1.addresses import router as addresses_router
from src.api.v1.contractors import router as contractors_router
from src.api.v1.technician_contractors import router as technician_contractors_router
from src.api.v1.systems import router as systems_router
from src.api.v1.types_of_works import router as types_of_works_router
from src.api.v1.works import router as works_router

main_router = APIRouter()
main_router.include_router(health_router)
main_router.include_router(users_router)
main_router.include_router(customer_router)
main_router.include_router(curator_router)
main_router.include_router(addresses_router)
main_router.include_router(contractors_router)
main_router.include_router(technician_contractors_router)
main_router.include_router(systems_router)
main_router.include_router(types_of_works_router)
main_router.include_router(works_router)
