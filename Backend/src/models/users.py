from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from typing import List, Optional
from datetime import datetime
from src.database.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    date_joined: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False)

    contractor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("contractors.id", ondelete="SET NULL")
    )

    contractor: Mapped[Optional["ContractorModel"]] = relationship(
        "ContractorModel",
        back_populates="technicians"
    )

    works: Mapped[List["WorksModel"]] = relationship(
        "WorksModel",
        back_populates="technician"
    )

    curators: Mapped[List["CuratorModel"]] = relationship(
        "CuratorModel",
        back_populates="user"
    )