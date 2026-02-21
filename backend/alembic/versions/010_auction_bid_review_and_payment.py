"""Add auction bid review and payment verification fields

Revision ID: 010
Revises: 009
Create Date: 2026-02-21 11:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("auction_items", sa.Column("payment_status", sa.String(length=32), nullable=True))
    op.add_column("auction_items", sa.Column("payment_proof_url", sa.Text(), nullable=True))
    op.add_column("auction_items", sa.Column("payment_verified_by", sa.UUID(), nullable=True))
    op.add_column("auction_items", sa.Column("payment_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(
        "fk_auction_items_payment_verified_by_users",
        "auction_items",
        "users",
        ["payment_verified_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_auction_items_payment_verified_by", "auction_items", ["payment_verified_by"], unique=False)

    op.add_column("auction_bids", sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"))
    op.add_column("auction_bids", sa.Column("reviewed_by", sa.UUID(), nullable=True))
    op.add_column("auction_bids", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(
        "fk_auction_bids_reviewed_by_users",
        "auction_bids",
        "users",
        ["reviewed_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_auction_bids_status", "auction_bids", ["status"], unique=False)
    op.create_index("ix_auction_bids_reviewed_by", "auction_bids", ["reviewed_by"], unique=False)

    # Normalize legacy statuses to new buckets.
    op.execute("UPDATE auction_items SET status='ready' WHERE status IN ('draft', 'active', 'expired')")
    op.execute("UPDATE auction_items SET status='sold' WHERE status='sold'")


def downgrade() -> None:
    op.drop_index("ix_auction_bids_reviewed_by", table_name="auction_bids")
    op.drop_index("ix_auction_bids_status", table_name="auction_bids")
    op.drop_constraint("fk_auction_bids_reviewed_by_users", "auction_bids", type_="foreignkey")
    op.drop_column("auction_bids", "reviewed_at")
    op.drop_column("auction_bids", "reviewed_by")
    op.drop_column("auction_bids", "status")

    op.drop_index("ix_auction_items_payment_verified_by", table_name="auction_items")
    op.drop_constraint("fk_auction_items_payment_verified_by_users", "auction_items", type_="foreignkey")
    op.drop_column("auction_items", "payment_verified_at")
    op.drop_column("auction_items", "payment_verified_by")
    op.drop_column("auction_items", "payment_proof_url")
    op.drop_column("auction_items", "payment_status")
