"""
Financial Report Pydantic Schemas
"""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
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
