"""Add time_slots column to moving_bookings

Revision ID: 005
Revises: 004
Create Date: 2026-02-20 00:00:03.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("moving_bookings", sa.Column("time_slots", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("moving_bookings", "time_slots")
