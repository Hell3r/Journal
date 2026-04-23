from sqlalchemy import Table, Column, ForeignKey, UniqueConstraint
from src.database.database import Base

contractor_address_table = Table(
    "contractor_address",
    Base.metadata,
    Column("contractor_id", ForeignKey("contractors.id", ondelete="CASCADE"), primary_key=True),
    Column("address_id", ForeignKey("addresses.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("contractor_id", "address_id", name="uq_contractor_address")
)