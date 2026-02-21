"""Add extended user profile fields

Revision ID: 014
Revises: 013
Create Date: 2026-02-21 14:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("kunyah_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("occupation", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("province", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("interested_as_donatur", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("interested_as_relawan", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("wants_beneficiary_survey", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("users", "wants_beneficiary_survey")
    op.drop_column("users", "interested_as_relawan")
    op.drop_column("users", "interested_as_donatur")
    op.drop_column("users", "province")
    op.drop_column("users", "city")
    op.drop_column("users", "address")
    op.drop_column("users", "occupation")
    op.drop_column("users", "kunyah_name")
