from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey
from typing import List, Optional
from src.database.database import Base
from src.models.associations import contractor_address_table

class ContractorModel(Base):
    __tablename__ = "contractors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name_of_contractor: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    engineer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True
    )

    addresses: Mapped[List["AddressModel"]] = relationship(
        "AddressModel",
        secondary=contractor_address_table,
        back_populates="contractors"
    )

    technicians: Mapped[List["UserModel"]] = relationship(
        "UserModel",
        secondary="technician_contractor",
        back_populates="contractor",
        overlaps="technician_contractor,user,address,contractor"
    )
    technician_contractor: Mapped[List["TechnicianModel"]] = relationship(
        "TechnicianModel",
        back_populates="contractor",
        overlaps="technicians,contractor"
    )
    engineer: Mapped[Optional["UserModel"]] = relationship(
        "UserModel",
        back_populates="contractor_engineer",
        foreign_keys=[engineer_id]
    )
