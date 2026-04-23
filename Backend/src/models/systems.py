from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from typing import List
from src.database.database import Base

class SystemsModel(Base):
    __tablename__ = "systems"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    addresses: Mapped[List["SystemOnAddressModel"]] = relationship(
        "SystemOnAddressModel",
        back_populates="system",
        cascade="all, delete-orphan"
    )
