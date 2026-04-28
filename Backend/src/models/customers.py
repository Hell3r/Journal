from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from typing import List
from src.database.database import Base

class CustomerModel(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name_of_org: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)

    addresses: Mapped[List["AddressModel"]] = relationship(
        "AddressModel",
        back_populates="customer",
        cascade="all, delete-orphan"
    )

    curators: Mapped[List["CuratorModel"]] = relationship(
        "CuratorModel",
        back_populates="customer",
        cascade="all, delete-orphan"
    )
