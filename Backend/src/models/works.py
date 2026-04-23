from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from typing import Optional
from src.database.database import Base

class WorksModel(Base):
    __tablename__ = "works"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    address_id: Mapped[int] = mapped_column(ForeignKey("addresses.id", ondelete="CASCADE"))
    type_of_work_id: Mapped[int] = mapped_column(ForeignKey("types_of_works.id", ondelete="CASCADE"))
    technician_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    description: Mapped[Optional[str]] = mapped_column(String, default=None)

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
