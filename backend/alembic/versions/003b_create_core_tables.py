"""Create core business tables

Revision ID: 003b
Revises: 003
Create Date: 2026-02-20 00:00:01.500000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "003b"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # programs (no dependency on other business tables)
    # ------------------------------------------------------------------
    op.create_table(
        "programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("target_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("collected_amount", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_programs_slug", "programs", ["slug"], unique=True)
    op.create_index("ix_programs_status", "programs", ["status"], unique=False)

    # ------------------------------------------------------------------
    # donations
    # ------------------------------------------------------------------
    op.create_table(
        "donations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("donation_code", sa.String(length=20), nullable=False),
        sa.Column("donor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("donor_name", sa.String(length=100), nullable=False),
        sa.Column("donor_email", sa.String(length=255), nullable=True),
        sa.Column("donor_phone", sa.String(length=20), nullable=True),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("donation_type", sa.String(length=30), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("payment_status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("proof_url", sa.String(length=500), nullable=True),
        sa.Column("verified_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["donor_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.ForeignKeyConstraint(["verified_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("donation_code"),
    )
    op.create_index("ix_donations_donation_code", "donations", ["donation_code"], unique=True)
    op.create_index("ix_donations_payment_status", "donations", ["payment_status"], unique=False)

    # ------------------------------------------------------------------
    # moving_bookings
    # NOTE: purpose added by 004, time_slots by 005, rejection_reason by 007,
    #       booking_dates + is_full_day by 016
    # ------------------------------------------------------------------
    op.create_table(
        "moving_bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("booking_code", sa.String(length=16), nullable=False),
        sa.Column("booking_date", sa.Date(), nullable=False),
        sa.Column("time_slot", sa.String(length=5), nullable=False),
        sa.Column("requester_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("requester_name", sa.String(length=255), nullable=False),
        sa.Column("requester_phone", sa.String(length=20), nullable=False),
        sa.Column("pickup_address", sa.Text(), nullable=False),
        sa.Column("pickup_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("pickup_lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("dropoff_address", sa.Text(), nullable=False),
        sa.Column("dropoff_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("dropoff_lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("rating", sa.SmallInteger(), nullable=True),
        sa.Column("review_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["requester_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_code"),
        sa.UniqueConstraint("booking_date", "time_slot", name="uq_booking_date_slot"),
    )
    op.create_index("ix_moving_bookings_booking_code", "moving_bookings", ["booking_code"], unique=True)
    op.create_index("ix_moving_bookings_status", "moving_bookings", ["status"], unique=False)

    # ------------------------------------------------------------------
    # medical_equipment
    # ------------------------------------------------------------------
    op.create_table(
        "medical_equipment",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(length=500), nullable=True),
        sa.Column("total_stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("available_stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("condition", sa.String(length=20), nullable=False, server_default="good"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_medical_equipment_category", "medical_equipment", ["category"], unique=False)

    # ------------------------------------------------------------------
    # equipment_loans
    # NOTE: borrow_location/lat/lng added by 006, return_date made nullable by 008
    # ------------------------------------------------------------------
    op.create_table(
        "equipment_loans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("equipment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("borrower_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("borrower_name", sa.String(length=100), nullable=False),
        sa.Column("borrower_phone", sa.String(length=20), nullable=False),
        sa.Column("borrow_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("return_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["equipment_id"], ["medical_equipment.id"]),
        sa.ForeignKeyConstraint(["borrower_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_equipment_loans_status", "equipment_loans", ["status"], unique=False)

    # ------------------------------------------------------------------
    # pickup_requests
    # NOTE: amount/item_description/item_photo_url/accepted_at/eta_*/responder_*
    #       added by 009; status altered from String(20) to String(32) by 009
    # ------------------------------------------------------------------
    op.create_table(
        "pickup_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("request_code", sa.String(length=16), nullable=False),
        sa.Column("requester_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("requester_name", sa.String(length=100), nullable=False),
        sa.Column("requester_phone", sa.String(length=20), nullable=False),
        sa.Column("pickup_type", sa.String(length=20), nullable=False),
        sa.Column("pickup_address", sa.Text(), nullable=False),
        sa.Column("pickup_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("pickup_lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("preferred_date", sa.Date(), nullable=True),
        sa.Column("preferred_time_slot", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("scheduled_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("proof_url", sa.String(length=500), nullable=True),
        sa.Column("collected_amount", sa.Numeric(15, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["requester_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"]),
        sa.ForeignKeyConstraint(["scheduled_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_code"),
    )
    op.create_index("ix_pickup_requests_request_code", "pickup_requests", ["request_code"], unique=True)
    op.create_index("ix_pickup_requests_status", "pickup_requests", ["status"], unique=False)

    # ------------------------------------------------------------------
    # auction_items
    # NOTE: payment_status/proof_url/payment_verified_by/at added by 010
    # ------------------------------------------------------------------
    op.create_table(
        "auction_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("starting_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("current_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("min_increment", sa.Numeric(12, 2), nullable=False, server_default="5000.00"),
        sa.Column("donor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("winner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="ready"),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["donor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["winner_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auction_items_donor_id", "auction_items", ["donor_id"], unique=False)
    op.create_index("ix_auction_items_winner_id", "auction_items", ["winner_id"], unique=False)
    op.create_index("ix_auction_items_status", "auction_items", ["status"], unique=False)
    op.create_index("ix_auction_items_end_time", "auction_items", ["end_time"], unique=False)

    # ------------------------------------------------------------------
    # auction_images
    # ------------------------------------------------------------------
    op.create_table(
        "auction_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auction_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["auction_item_id"], ["auction_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auction_images_auction_item_id", "auction_images", ["auction_item_id"], unique=False)

    # ------------------------------------------------------------------
    # auction_bids
    # NOTE: status/reviewed_by/reviewed_at added by 010
    # ------------------------------------------------------------------
    op.create_table(
        "auction_bids",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auction_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("bidder_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["auction_item_id"], ["auction_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bidder_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auction_bids_auction_item_id", "auction_bids", ["auction_item_id"], unique=False)
    op.create_index("ix_auction_bids_bidder_id", "auction_bids", ["bidder_id"], unique=False)

    # ------------------------------------------------------------------
    # news_articles
    # NOTE: status/scheduled_at/reviewed_by/reviewed_at/rejection_reason/
    #       meta_title/meta_description/tags added by 012
    # ------------------------------------------------------------------
    op.create_table(
        "news_articles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="general"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_news_articles_slug", "news_articles", ["slug"], unique=True)
    op.create_index("ix_news_articles_is_published", "news_articles", ["is_published"], unique=False)

    # ------------------------------------------------------------------
    # financial_reports
    # ------------------------------------------------------------------
    op.create_table(
        "financial_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("total_income", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("total_expense", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("pdf_url", sa.Text(), nullable=True),
        sa.Column("is_audited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("generated_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["generated_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_financial_reports_period", "financial_reports", ["period_start", "period_end"], unique=False)

    # ------------------------------------------------------------------
    # financial_entries
    # ------------------------------------------------------------------
    op.create_table(
        "financial_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        sa.Column("reference_id", sa.String(length=36), nullable=True),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["report_id"], ["financial_reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_financial_entries_report_id", "financial_entries", ["report_id"], unique=False)
    op.create_index("ix_financial_entries_category", "financial_entries", ["category"], unique=False)
    op.create_index("ix_financial_entries_type", "financial_entries", ["type"], unique=False)
    op.create_index("ix_financial_entries_entry_date", "financial_entries", ["entry_date"], unique=False)

    # ------------------------------------------------------------------
    # notifications
    # ------------------------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("reference_type", sa.String(length=50), nullable=True),
        sa.Column("reference_id", sa.String(length=36), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)
    op.create_index("ix_notifications_type", "notifications", ["type"], unique=False)

    # ------------------------------------------------------------------
    # push_tokens
    # ------------------------------------------------------------------
    op.create_table(
        "push_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.Text(), nullable=False),
        sa.Column("device_type", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_push_tokens_user_id", "push_tokens", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("push_tokens")
    op.drop_table("notifications")
    op.drop_table("financial_entries")
    op.drop_table("financial_reports")
    op.drop_table("news_articles")
    op.drop_table("auction_bids")
    op.drop_table("auction_images")
    op.drop_table("auction_items")
    op.drop_table("pickup_requests")
    op.drop_table("equipment_loans")
    op.drop_table("medical_equipment")
    op.drop_table("moving_bookings")
    op.drop_table("donations")
    op.drop_table("programs")
