from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from typing import List
from src.database.database import Base

class TypesOfWorksModel(Base):
    __tablename__ = "types_of_works"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    works: Mapped[List["WorksModel"]] = relationship(
        "WorksModel",
        back_populates="type_of_work"
    )