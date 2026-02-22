"""Add purpose column to moving_bookings

Revision ID: 004
Revises: 003
Create Date: 2026-02-20 00:00:02.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("moving_bookings", sa.Column("purpose", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("moving_bookings", "purpose")
