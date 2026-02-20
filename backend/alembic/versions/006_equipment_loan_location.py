"""Add loan borrow location fields

Revision ID: 006
Revises: 005
Create Date: 2026-02-20 00:00:04.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("equipment_loans", sa.Column("borrow_location", sa.Text(), nullable=True))
    op.add_column("equipment_loans", sa.Column("borrow_lat", sa.String(length=32), nullable=True))
    op.add_column("equipment_loans", sa.Column("borrow_lng", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("equipment_loans", "borrow_lng")
    op.drop_column("equipment_loans", "borrow_lat")
    op.drop_column("equipment_loans", "borrow_location")
