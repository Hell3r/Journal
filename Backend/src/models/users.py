from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from typing import List, Optional
from datetime import datetime
from src.database.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    username: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    date_joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    contractor: Mapped[List["ContractorModel"]] = relationship(
        "ContractorModel",
        back_populates="technicians",
        secondary="technician_contractor",
        uselist=True,
        overlaps="technician_contractor,contractor,address,user"
    )

    works: Mapped[List["WorksModel"]] = relationship(
        "WorksModel",
        back_populates="technician"
    )

    curators: Mapped[List["CuratorModel"]] = relationship(
        "CuratorModel",
        back_populates="user"
    )
    technician_contractor: Mapped[List["TechnicianModel"]] = relationship(
        "TechnicianModel",
        back_populates="user"
    )
    contractor_engineer: Mapped[List["ContractorModel"]] = relationship(
        "ContractorModel",
        back_populates="engineer",
        foreign_keys="ContractorModel.engineer_id"
    )

    totp_secret: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    backup_codes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
