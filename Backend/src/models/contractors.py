from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from typing import List
from src.database.database import Base
from .associations import contractor_address_table

class ContractorModel(Base):
    __tablename__ = "contractors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name_of_contractor: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    addresses: Mapped[List["AddressModel"]] = relationship(
        "AddressModel",
        secondary=contractor_address_table,
        back_populates="contractors"
    )

    technicians: Mapped[List["UserModel"]] = relationship(
        "UserModel",
        back_populates="contractor"
    )
