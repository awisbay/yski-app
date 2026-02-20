"""Auth security hardening columns

Revision ID: 003
Revises: 002
Create Date: 2026-02-20 00:00:01.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("current_refresh_jti", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "current_refresh_jti")
