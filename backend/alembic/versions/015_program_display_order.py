"""Add display_order to programs

Revision ID: 015
Revises: 014
Create Date: 2026-02-21 16:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("programs", sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_programs_display_order", "programs", ["display_order"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_programs_display_order", table_name="programs")
    op.drop_column("programs", "display_order")
