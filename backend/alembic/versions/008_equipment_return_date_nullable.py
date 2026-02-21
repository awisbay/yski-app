"""Make equipment_loans.return_date nullable

Revision ID: 008
Revises: 007
Create Date: 2026-02-21 23:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("equipment_loans", "return_date", existing_type=sa.DateTime(timezone=True), nullable=True)


def downgrade() -> None:
    op.alter_column("equipment_loans", "return_date", existing_type=sa.DateTime(timezone=True), nullable=False)
