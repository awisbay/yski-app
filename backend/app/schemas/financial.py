"""
Financial Report Pydantic Schemas
"""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Literal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# ============== Financial Entry Schemas ==============

class FinancialEntryBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., pattern="^(income|expense)$")
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    entry_date: date


class FinancialEntryCreate(FinancialEntryBase):
    pass


class FinancialEntryResponse(FinancialEntryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime


# ============== Financial Report Schemas ==============

class FinancialReportBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    period_start: date
    period_end: date


class FinancialReportCreate(FinancialReportBase):
    pass


class FinancialReportUpdate(BaseModel):
    is_audited: Optional[bool] = None


class FinancialReportPublish(BaseModel):
    is_published: bool = True


class FinancialReportResponse(FinancialReportBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    total_income: Decimal
    total_expense: Decimal
    pdf_url: Optional[str] = None
    is_audited: bool
    is_published: bool
    generated_by: UUID
    generator_name: str
    created_at: datetime
    updated_at: datetime


class FinancialReportDetailResponse(FinancialReportResponse):
    entries: List[FinancialEntryResponse] = []


class FinancialReportListResponse(BaseModel):
    reports: List[FinancialReportResponse]
    total: int


# ============== Dashboard Data ==============

class CategoryBreakdown(BaseModel):
    category: str
    amount: Decimal
    percentage: float


class MonthlyTrend(BaseModel):
    month: str  # Format: "2026-01"
    income: Decimal
    expense: Decimal


class FinancialDashboardResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    income_by_category: List[CategoryBreakdown]
    expense_by_category: List[CategoryBreakdown]
    monthly_trend: List[MonthlyTrend]


# ============== Finance Category & Transaction ==============

TransactionType = Literal["request_fund", "income_report"]
EntrySide = Literal["debit", "credit"]
TransactionStatus = Literal["pending", "approved", "rejected"]


class FinanceCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)


class FinanceCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    is_active: bool
    created_at: datetime


class FinancialTransactionCreate(BaseModel):
    category_id: UUID
    transaction_type: TransactionType
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: Optional[str] = Field(default=None, max_length=1000)


class FinancialTransactionReview(BaseModel):
    status: Literal["approved", "rejected"]
    reviewed_note: Optional[str] = Field(default=None, max_length=1000)


class FinancialTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID
    category_name: str
    transaction_type: TransactionType
    entry_side: EntrySide
    amount: Decimal
    description: Optional[str]
    requested_by: UUID
    requester_name: str
    status: TransactionStatus
    reviewed_by: Optional[UUID]
    reviewer_name: Optional[str]
    reviewed_at: Optional[datetime]
    reviewed_note: Optional[str]
    approved_at: Optional[datetime]
    created_at: datetime


class FinancialTransactionListResponse(BaseModel):
    transactions: List[FinancialTransactionResponse]
    total: int


class FinancialBalanceCategory(BaseModel):
    category_id: UUID
    category_name: str
    total_credit: Decimal
    total_debit: Decimal
    balance: Decimal


class FinancialBalanceResponse(BaseModel):
    total_credit: Decimal
    total_debit: Decimal
    current_balance: Decimal
    by_category: List[FinancialBalanceCategory]
