from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer, Column, ForeignKey
from datetime import date, datetime
from typing import List, Optional

class TechnicianModel(Base):
    __tablename__ = "technician_contractor"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey("contractors.id", ondelete="CASCADE"))
    address_id: Mapped[int] = mapped_column(ForeignKey("addresses.id", ondelete="CASCADE"))
    technician_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))


    user: Mapped["UserModel"] = relationship("UserModel", back_populates="technician_contractor")
    address: Mapped["AddressModel"] = relationship("AddressModel", back_populates="technician_address")
    contractor: Mapped["ContractorModel"] = relationship("ContractorModel", back_populates="technician_contractor")
    works: Mapped["WorksModel"] = relationship("WorksModel", back_populates="technician")
