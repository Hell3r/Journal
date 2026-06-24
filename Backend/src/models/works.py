from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, func
from typing import Optional
from datetime import datetime
from src.database.database import Base

class WorksModel(Base):
    __tablename__ = "works"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    address_id: Mapped[int] = mapped_column(ForeignKey("addresses.id", ondelete="CASCADE"))
    type_of_work_id: Mapped[int] = mapped_column(ForeignKey("types_of_works.id", ondelete="CASCADE"))
    technician_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    system_id: Mapped[Optional[int]] = mapped_column(ForeignKey("systems.id", ondelete="SET NULL"), nullable=True)

    description: Mapped[Optional[str]] = mapped_column(String, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    address: Mapped["AddressModel"] = relationship(
        "AddressModel",
        back_populates="works"
    )

    type_of_work: Mapped["TypesOfWorksModel"] = relationship(
        "TypesOfWorksModel",
        back_populates="works"
    )

    technician: Mapped["UserModel"] = relationship(
        "UserModel",
        back_populates="works"
    )
    system: Mapped[Optional["SystemsModel"]] = relationship(
        "SystemsModel",
    )

    @property
    def system_name(self) -> Optional[str]:
        return self.system.name if self.system else None
