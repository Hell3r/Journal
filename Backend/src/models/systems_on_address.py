from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer, Column, ForeignKey
from datetime import date, datetime
from typing import List, Optional


class SystemOnAddressModel(Base):
    __tablename__ = "system_on_address"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    address_id: Mapped[int] = mapped_column(ForeignKey("addresses.id", ondelete="CASCADE"))
    system_id: Mapped[int] = mapped_column(ForeignKey("systems.id", ondelete="CASCADE"))

    address: Mapped["AddressModel"] = relationship(
        "AddressModel",
        back_populates="systems"
    )

    system: Mapped["SystemsModel"] = relationship(
        "SystemsModel",
        back_populates="addresses"
    )