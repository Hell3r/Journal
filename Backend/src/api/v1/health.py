from fastapi import Depends, APIRouter
import logging
from src.database.deps import  SessionDep
from src.database.database import engine, Base
from sqlalchemy import text
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
from src.models.associations import Table

from starlette import status

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
        result = db.execute(text("SELECT 1"))
        return {
            "status": "success",
            "message": "Database connection is working",
            "database": str(engine.url)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }


@router.post('/setup_db', tags=["Проверка Бэкенда"], summary= "Инициализация БД")
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        return {"message": "Database setup successfully"}