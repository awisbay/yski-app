"""Add publishing workflow and SEO fields to news_articles

Revision ID: 012
Revises: 011
Create Date: 2026-02-21 12:01:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "news_articles",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft")
    )
    op.add_column(
        "news_articles",
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "news_articles",
        sa.Column("reviewed_by", sa.UUID(), nullable=True)
    )
    op.add_column(
        "news_articles",
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "news_articles",
        sa.Column("rejection_reason", sa.Text(), nullable=True)
    )
    op.add_column(
        "news_articles",
        sa.Column("meta_title", sa.String(length=200), nullable=True)
    )
    op.add_column(
        "news_articles",
        sa.Column("meta_description", sa.Text(), nullable=True)
    )
    op.add_column(
        "news_articles",
        sa.Column("tags", sa.Text(), nullable=True)
    )
    op.create_foreign_key(
        "fk_news_articles_reviewed_by_users",
        "news_articles",
        "users",
        ["reviewed_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_news_articles_status", "news_articles", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_news_articles_status", table_name="news_articles")
    op.drop_constraint("fk_news_articles_reviewed_by_users", "news_articles", type_="foreignkey")
    op.drop_column("news_articles", "tags")
    op.drop_column("news_articles", "meta_description")
    op.drop_column("news_articles", "meta_title")
    op.drop_column("news_articles", "rejection_reason")
    op.drop_column("news_articles", "reviewed_at")
    op.drop_column("news_articles", "reviewed_by")
    op.drop_column("news_articles", "scheduled_at")
    op.drop_column("news_articles", "status")
