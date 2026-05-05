from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from src.database.database import Base

class CuratorModel(Base):
    __tablename__ = "curators"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    is_active: Mapped[bool] = mapped_column(default=False)

    customer: Mapped["CustomerModel"] = relationship(
        "CustomerModel",
        back_populates="curators"
    )

    user: Mapped["UserModel"] = relationship(
        "UserModel",
        back_populates="curators"
    )

    @property
    def email(self) -> Optional[str]:
        return self.user.email if self.user else None