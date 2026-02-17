"""
Financial Report API Routes - Laporan Keuangan
"""
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.financial import (
    FinancialReportCreate,
    FinancialReportUpdate,
    FinancialReportPublish,
    FinancialEntryCreate,
    FinancialReportResponse,
    FinancialReportDetailResponse,
    FinancialReportListResponse,
    FinancialEntryResponse,
    FinancialDashboardResponse,
)
from app.services.financial_service import FinancialService

router = APIRouter()


# ============== Dashboard ==============

@router.get("/dashboard", response_model=FinancialDashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get financial dashboard data."""
    service = FinancialService(db)
    data = await service.get_dashboard_data()
    return data


# ============== Reports ==============

@router.get("/reports", response_model=FinancialReportListResponse)
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List published financial reports."""
    service = FinancialService(db)
    reports, total = await service.get_published_reports(skip=skip, limit=limit)
    return {"reports": reports, "total": total}


@router.get("/reports/{report_id}", response_model=FinancialReportDetailResponse)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get financial report detail."""
    service = FinancialService(db)
    report = await service.get_report(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not report.is_published and current_user.role not in ["admin", "pengurus"]:
        raise HTTPException(status_code=403, detail="Report not published yet")
    
    return {
        **report.__dict__,
        "generator_name": report.generator.full_name if report.generator else "Unknown",
        "entries": report.entries,
    }


@router.post("/reports", response_model=FinancialReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: FinancialReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Generate a new financial report (Pengurus/Admin only)."""
    service = FinancialService(db)
    report = await service.generate_report(
        period_start=data.period_start,
        period_end=data.period_end,
        generated_by=current_user.id,
    )
    
    return {
        **report.__dict__,
        "generator_name": current_user.full_name,
    }


@router.patch("/reports/{report_id}/publish", response_model=FinancialReportResponse)
async def publish_report(
    report_id: UUID,
    data: FinancialReportPublish,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Publish or unpublish a report (Admin only)."""
    service = FinancialService(db)
    report = await service.publish_report(report_id, is_published=data.is_published)
    
    return {
        **report.__dict__,
        "generator_name": report.generator.full_name if report.generator else "Unknown",
    }


# ============== Entries (Manual) ==============

@router.post("/reports/{report_id}/entries", response_model=FinancialEntryResponse)
async def add_entry(
    report_id: UUID,
    data: FinancialEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Add a manual entry to a report (Pengurus/Admin only)."""
    service = FinancialService(db)
    entry = await service.add_manual_entry(
        report_id=report_id,
        category=data.category,
        entry_type=data.type,
        amount=data.amount,
        description=data.description,
        entry_date=data.entry_date,
    )
    
    return entry
