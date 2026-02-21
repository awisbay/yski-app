"""Add financial category and transaction ledger tables

Revision ID: 013
Revises: 012
Create Date: 2026-02-21 13:15:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "financial_categories",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_financial_categories_name", "financial_categories", ["name"], unique=True)

    op.create_table(
        "financial_transactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=False),
        sa.Column("transaction_type", sa.String(length=20), nullable=False),
        sa.Column("entry_side", sa.String(length=10), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("requested_by", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_note", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["financial_categories.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["requested_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_financial_transactions_category_id", "financial_transactions", ["category_id"], unique=False)
    op.create_index("ix_financial_transactions_transaction_type", "financial_transactions", ["transaction_type"], unique=False)
    op.create_index("ix_financial_transactions_entry_side", "financial_transactions", ["entry_side"], unique=False)
    op.create_index("ix_financial_transactions_requested_by", "financial_transactions", ["requested_by"], unique=False)
    op.create_index("ix_financial_transactions_status", "financial_transactions", ["status"], unique=False)
    op.create_index("ix_financial_transactions_reviewed_by", "financial_transactions", ["reviewed_by"], unique=False)
    op.create_index("ix_financial_transactions_approved_at", "financial_transactions", ["approved_at"], unique=False)
    op.create_index(
        "idx_financial_transactions_category_status",
        "financial_transactions",
        ["category_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_financial_transactions_category_status", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_approved_at", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_reviewed_by", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_status", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_requested_by", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_entry_side", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_transaction_type", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_category_id", table_name="financial_transactions")
    op.drop_table("financial_transactions")

    op.drop_index("ix_financial_categories_name", table_name="financial_categories")
    op.drop_table("financial_categories")
