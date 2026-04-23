from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from typing import List
from src.database.database import Base
from src.models.associations import contractor_address_table

class AddressModel(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    address_name: Mapped[str] = mapped_column(String, nullable=False)

    customer: Mapped["CustomerModel"] = relationship(
        "CustomerModel",
        back_populates="addresses"
    )

    contractors: Mapped[List["ContractorModel"]] = relationship(
        "ContractorModel",
        secondary=contractor_address_table,
        back_populates="addresses"
    )

    systems: Mapped[List["SystemOnAddressModel"]] = relationship(
        "SystemOnAddressModel",
        back_populates="address",
        cascade="all, delete-orphan"
    )

    works: Mapped[List["WorksModel"]] = relationship(
        "WorksModel",
        back_populates="address",
        cascade="all, delete-orphan"
    )
