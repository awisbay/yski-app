"""
Financial report models for transparency feature.
"""
from sqlalchemy import Column, ForeignKey, Numeric, String, Text, Date, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class FinancialReport(Base, UUIDMixin, TimestampMixin):
    """Financial report for a specific period."""
    __tablename__ = "financial_reports"

    title = Column(String(255), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    total_income = Column(Numeric(15, 2), nullable=False, default=0)
    total_expense = Column(Numeric(15, 2), nullable=False, default=0)

    pdf_url = Column(Text, nullable=True)
    is_audited = Column(Boolean, nullable=False, default=False)
    is_published = Column(Boolean, nullable=False, default=False)

    generated_by = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    entries = relationship("FinancialEntry", back_populates="report", cascade="all, delete-orphan")
    generator = relationship("User", back_populates="generated_reports")

    # Indexes
    __table_args__ = (
        Index('idx_financial_reports_period', 'period_start', 'period_end'),
    )

    def __repr__(self):
        return f"<FinancialReport(id={self.id}, title={self.title})>"


class FinancialEntry(Base, UUIDMixin, TimestampMixin):
    """Individual financial entry (income or expense)."""
    __tablename__ = "financial_entries"

    report_id = Column(
        ForeignKey("financial_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Category: donasi_masuk, zakat_masuk, lelang_masuk, lain_lain_masuk,
    #           penyaluran_bantuan, operasional, gaji_relawan, pemeliharaan_alkes, lain_lain_keluar
    category = Column(String(50), nullable=False, index=True)

    # Type: income or expense
    type = Column(String(10), nullable=False, index=True)  # 'income' or 'expense'

    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=True)

    # Reference to source (donation, auction, etc.)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(String(36), nullable=True)

    entry_date = Column(Date, nullable=False, index=True)

    # Relationships
    report = relationship("FinancialReport", back_populates="entries")

    def __repr__(self):
        return f"<FinancialEntry(id={self.id}, type={self.type}, amount={self.amount})>"


class FinancialCategory(Base, UUIDMixin, TimestampMixin):
    """Manual category for financial transaction grouping."""

    __tablename__ = "financial_categories"

    name = Column(String(80), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    transactions = relationship("FinancialTransaction", back_populates="category")

    def __repr__(self):
        return f"<FinancialCategory(id={self.id}, name={self.name})>"


class FinancialTransaction(Base, UUIDMixin, TimestampMixin):
    """Ledger-like transaction with approval flow."""

    __tablename__ = "financial_transactions"

    category_id = Column(
        ForeignKey("financial_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    transaction_type = Column(String(20), nullable=False, index=True)  # request_fund | income_report
    entry_side = Column(String(10), nullable=False, index=True)  # debit | credit
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=True)
    requested_by = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", server_default="pending", index=True)
    reviewed_by = Column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_note = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True, index=True)

    category = relationship("FinancialCategory", back_populates="transactions")
    requester = relationship("User", foreign_keys=[requested_by], back_populates="requested_financial_transactions")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="approved_financial_transactions")

    __table_args__ = (
        Index("idx_financial_transactions_category_status", "category_id", "status"),
        Index("idx_financial_transactions_approved_at", "approved_at"),
    )

    def __repr__(self):
        return f"<FinancialTransaction(id={self.id}, type={self.transaction_type}, status={self.status})>"
