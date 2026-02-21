"""Extend pickup request fields for modern flow

Revision ID: 009
Revises: 008
Create Date: 2026-02-21 10:25:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("pickup_requests", "status", existing_type=sa.String(length=20), type_=sa.String(length=32), existing_nullable=False)
    op.add_column("pickup_requests", sa.Column("amount", sa.Numeric(15, 2), nullable=True))
    op.add_column("pickup_requests", sa.Column("item_description", sa.Text(), nullable=True))
    op.add_column("pickup_requests", sa.Column("item_photo_url", sa.String(length=500), nullable=True))
    op.add_column("pickup_requests", sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("pickup_requests", sa.Column("eta_minutes", sa.Integer(), nullable=True))
    op.add_column("pickup_requests", sa.Column("eta_distance_km", sa.Numeric(8, 2), nullable=True))
    op.add_column("pickup_requests", sa.Column("responder_lat", sa.Numeric(10, 7), nullable=True))
    op.add_column("pickup_requests", sa.Column("responder_lng", sa.Numeric(10, 7), nullable=True))


def downgrade() -> None:
    op.drop_column("pickup_requests", "responder_lng")
    op.drop_column("pickup_requests", "responder_lat")
    op.drop_column("pickup_requests", "eta_distance_km")
    op.drop_column("pickup_requests", "eta_minutes")
    op.drop_column("pickup_requests", "accepted_at")
    op.drop_column("pickup_requests", "item_photo_url")
    op.drop_column("pickup_requests", "item_description")
    op.drop_column("pickup_requests", "amount")
    op.alter_column("pickup_requests", "status", existing_type=sa.String(length=32), type_=sa.String(length=20), existing_nullable=False)
