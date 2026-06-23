from fastapi import Depends, APIRouter
import logging
from src.database.deps import  SessionDep
from src.database.database import engine, Base
from sqlalchemy import text, select, func
from src.models.users import UserModel
from src.models.contractors import ContractorModel
from src.models.customers import CustomerModel
from src.models.addresses import AddressModel
from src.models.curators import CuratorModel
from src.models.systems import SystemsModel
from src.models.types_of_works import TypesOfWorksModel
from src.models.systems_on_address import SystemOnAddressModel
from src.models.technician_contractor import TechnicianModel
from src.models.works import WorksModel
from src.models.associations import contractor_address_table

from starlette import status
from src.dependencies.auth import get_current_admin_user

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/v1/health")


@router.get('', tags = ["Проверка Бэкенда"],
            summary= "Проверить работу API",
            status_code= status.HTTP_200_OK)
async def get_health():
    return {"message": "OK"}


@router.get("/db_check", tags = ["Проверка Бэкенда"],
            summary= "Проверить подключение к базе данных",
            status_code= status.HTTP_200_OK)
async def db_check(db: SessionDep):
    try:
        await db.execute(text("SELECT 1"))
        counts = {}
        for label, model in [
            ("users", UserModel),
            ("customers", CustomerModel),
            ("addresses", AddressModel),
            ("contractors", ContractorModel),
            ("curators", CuratorModel),
            ("systems", SystemsModel),
            ("types_of_works", TypesOfWorksModel),
            ("system_on_address", SystemOnAddressModel),
            ("works", WorksModel),
            ("technician_contractor", TechnicianModel),
        ]:
            result = await db.execute(select(func.count()).select_from(model))
            counts[label] = result.scalar_one()
        assoc_count = await db.execute(select(func.count()).select_from(contractor_address_table))
        return {
            "status": "success",
            "message": "Database connection is working",
            "database": str(engine.url),
            "tables": counts,
            "associations": {
                "contractor_address": assoc_count.scalar_one(),
            },
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }


@router.post('/setup_db', tags=["Проверка Бэкенда"], summary= "Инициализация БД")
async def setup_db(_current_user: UserModel = Depends(get_current_admin_user)):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        return {"message": "Database setup successfully"}
