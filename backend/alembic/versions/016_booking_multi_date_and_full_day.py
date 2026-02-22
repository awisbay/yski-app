"""Add multi-date and full-day fields to moving_bookings

Revision ID: 016
Revises: 015
Create Date: 2026-02-22 14:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("moving_bookings", sa.Column("booking_dates", sa.Text(), nullable=True))
    op.add_column("moving_bookings", sa.Column("is_full_day", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("moving_bookings", "is_full_day")
    op.drop_column("moving_bookings", "booking_dates")
