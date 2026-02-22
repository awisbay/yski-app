"""
Financial Report Service - Laporan Keuangan
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func, extract, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.financial import (
    FinancialReport,
    FinancialEntry,
    FinancialCategory,
    FinancialTransaction,
)
from app.models.donation import Donation
from app.models.auction import AuctionItem
from app.models.user import User


class FinancialService:
    """Service for generating financial reports and managing transparency."""
    
    # Income categories mapping
    INCOME_CATEGORIES = {
        "infaq": "donasi_masuk",
        "sedekah": "donasi_masuk",
        "wakaf": "donasi_masuk",
        "zakat": "zakat_masuk",
    }
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ============== Report Generation ==============
    
    async def generate_report(
        self,
        period_start: date,
        period_end: date,
        generated_by: UUID,
    ) -> FinancialReport:
        """Generate a new financial report for the specified period."""
        # Create the report record
        report = FinancialReport(
            title=f"Laporan Keuangan {period_start.strftime('%B %Y')}",
            period_start=period_start,
            period_end=period_end,
            generated_by=generated_by,
        )
        self.db.add(report)
        await self.db.flush()
        
        # Aggregate income from donations
        await self._aggregate_donations(report, period_start, period_end)
        
        # Aggregate income from auctions
        await self._aggregate_auctions(report, period_start, period_end)
        
        # Calculate totals
        await self._calculate_totals(report)
        
        await self.db.commit()
        return report
    
    async def _aggregate_donations(
        self,
        report: FinancialReport,
        period_start: date,
        period_end: date,
    ):
        """Aggregate completed donations into financial entries."""
        from app.models.donation import Donation
        
        result = await self.db.execute(
            select(Donation)
            .where(
                Donation.payment_status == "completed",
                Donation.verified_at >= datetime.combine(period_start, datetime.min.time()),
                Donation.verified_at <= datetime.combine(period_end, datetime.max.time()),
            )
        )
        donations = result.scalars().all()
        
        for donation in donations:
            category = self.INCOME_CATEGORIES.get(
                donation.donation_type,
                "donasi_masuk",
            )
            
            entry = FinancialEntry(
                report_id=report.id,
                category=category,
                type="income",
                amount=donation.amount,
                description=f"Donasi {donation.donation_type} dari user",
                reference_type="donation",
                reference_id=str(donation.id),
                entry_date=donation.verified_at.date(),
            )
            self.db.add(entry)
    
    async def _aggregate_auctions(
        self,
        report: FinancialReport,
        period_start: date,
        period_end: date,
    ):
        """Aggregate sold auction items into financial entries."""
        from app.models.auction import AuctionItem
        
        result = await self.db.execute(
            select(AuctionItem)
            .where(
                AuctionItem.status == "sold",
                AuctionItem.end_time >= datetime.combine(period_start, datetime.min.time()),
                AuctionItem.end_time <= datetime.combine(period_end, datetime.max.time()),
            )
        )
        auctions = result.scalars().all()
        
        for auction in auctions:
            entry = FinancialEntry(
                report_id=report.id,
                category="lelang_masuk",
                type="income",
                amount=auction.current_price,
                description=f"Lelang: {auction.title}",
                reference_type="auction",
                reference_id=str(auction.id),
                entry_date=auction.end_time.date(),
            )
            self.db.add(entry)
    
    async def _calculate_totals(self, report: FinancialReport):
        """Calculate total income and expense for a report."""
        # Get total income
        income_result = await self.db.execute(
            select(func.sum(FinancialEntry.amount))
            .where(
                FinancialEntry.report_id == report.id,
                FinancialEntry.type == "income",
            )
        )
        report.total_income = income_result.scalar() or Decimal("0")
        
        # Get total expense
        expense_result = await self.db.execute(
            select(func.sum(FinancialEntry.amount))
            .where(
                FinancialEntry.report_id == report.id,
                FinancialEntry.type == "expense",
            )
        )
        report.total_expense = expense_result.scalar() or Decimal("0")
    
    # ============== Manual Entry Management ==============
    
    async def add_manual_entry(
        self,
        report_id: UUID,
        category: str,
        entry_type: str,
        amount: Decimal,
        description: Optional[str],
        entry_date: date,
    ) -> FinancialEntry:
        """Add a manual entry (typically for expenses)."""
        # Verify report exists and is not published
        report = await self.get_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if report.is_published:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify published report",
            )
        
        entry = FinancialEntry(
            report_id=report_id,
            category=category,
            type=entry_type,
            amount=amount,
            description=description,
            entry_date=entry_date,
        )
        self.db.add(entry)
        await self.db.flush()
        
        # Recalculate totals
        await self._calculate_totals(report)
        await self.db.commit()
        
        return entry
    
    # ============== Report Retrieval ==============
    
    async def get_report(self, report_id: UUID) -> Optional[FinancialReport]:
        """Get financial report by ID."""
        result = await self.db.execute(
            select(FinancialReport)
            .options(selectinload(FinancialReport.entries))
            .where(FinancialReport.id == report_id)
        )
        return result.scalar_one_or_none()
    
    async def get_published_reports(
        self,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[List[FinancialReport], int]:
        """Get published financial reports."""
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).where(FinancialReport.is_published == True)
        )
        total = count_result.scalar()
        
        # Get paginated results
        result = await self.db.execute(
            select(FinancialReport)
            .where(FinancialReport.is_published == True)
            .order_by(FinancialReport.period_start.desc())
            .offset(skip)
            .limit(limit)
        )
        reports = result.scalars().all()
        
        return list(reports), total
    
    async def publish_report(self, report_id: UUID, is_published: bool = True):
        """Publish or unpublish a report."""
        report = await self.get_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report.is_published = is_published
        await self.db.commit()
        return report
    
    # ============== Dashboard Data ==============
    
    async def get_dashboard_data(self) -> dict:
        """Get aggregated data for the financial dashboard."""
        # Total income and expense (all time)
        income_result = await self.db.execute(
            select(func.sum(FinancialEntry.amount))
            .where(FinancialEntry.type == "income")
        )
        total_income = income_result.scalar() or Decimal("0")
        
        expense_result = await self.db.execute(
            select(func.sum(FinancialEntry.amount))
            .where(FinancialEntry.type == "expense")
        )
        total_expense = expense_result.scalar() or Decimal("0")
        
        # Income by category
        income_by_category = await self._get_breakdown_by_category("income")
        
        # Expense by category
        expense_by_category = await self._get_breakdown_by_category("expense")
        
        # Monthly trend (last 12 months)
        monthly_trend = await self._get_monthly_trend()
        
        return {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": total_income - total_expense,
            "income_by_category": income_by_category,
            "expense_by_category": expense_by_category,
            "monthly_trend": monthly_trend,
        }
    
    async def _get_breakdown_by_category(self, entry_type: str) -> List[dict]:
        """Get amount breakdown by category for a specific entry type."""
        result = await self.db.execute(
            select(
                FinancialEntry.category,
                func.sum(FinancialEntry.amount).label("total"),
            )
            .where(FinancialEntry.type == entry_type)
            .group_by(FinancialEntry.category)
            .order_by(func.sum(FinancialEntry.amount).desc())
        )
        
        total_result = await self.db.execute(
            select(func.sum(FinancialEntry.amount))
            .where(FinancialEntry.type == entry_type)
        )
        total = total_result.scalar() or Decimal("1")  # Avoid division by zero
        
        breakdown = []
        for row in result.all():
            category, amount = row
            breakdown.append({
                "category": category,
                "amount": amount,
                "percentage": round(float(amount / total) * 100, 2),
            })
        
        return breakdown
    
    async def _get_monthly_trend(self) -> List[dict]:
        """Get monthly income/expense trend for the last 12 months."""
        # Calculate date range
        end_date = datetime.now().date().replace(day=1)
        start_date = (end_date - timedelta(days=365)).replace(day=1)
        
        result = await self.db.execute(
            select(
                extract('year', FinancialEntry.entry_date).label('year'),
                extract('month', FinancialEntry.entry_date).label('month'),
                FinancialEntry.type,
                func.sum(FinancialEntry.amount).label('total'),
            )
            .where(FinancialEntry.entry_date >= start_date)
            .group_by('year', 'month', FinancialEntry.type)
            .order_by('year', 'month')
        )
        
        # Organize data by month
        monthly_data = {}
        for row in result.all():
            year, month, entry_type, amount = row
            month_key = f"{int(year):04d}-{int(month):02d}"
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {"income": Decimal("0"), "expense": Decimal("0")}
            
            monthly_data[month_key][entry_type] = amount
        
        # Fill in missing months
        trend = []
        current = start_date
        while current <= end_date:
            month_key = current.strftime("%Y-%m")
            data = monthly_data.get(month_key, {"income": Decimal("0"), "expense": Decimal("0")})
            trend.append({
                "month": month_key,
                "income": data["income"],
                "expense": data["expense"],
            })
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        
        return trend

    # ============== Modern Finance (Transaction + Balance) ==============

    async def ensure_default_categories(self) -> None:
        """Seed baseline categories for first-time setup."""
        defaults = ["Pick-up", "Kesehatan", "Operasional"]
        result = await self.db.execute(select(FinancialCategory.name))
        existing = {name for (name,) in result.all()}
        for name in defaults:
            if name not in existing:
                self.db.add(FinancialCategory(name=name, is_active=True))
        await self.db.flush()
        await self.db.commit()

    async def list_categories(self) -> List[FinancialCategory]:
        await self.ensure_default_categories()
        result = await self.db.execute(
            select(FinancialCategory)
            .where(FinancialCategory.is_active == True)
            .order_by(FinancialCategory.name.asc())
        )
        return list(result.scalars().all())

    async def create_category(self, name: str) -> FinancialCategory:
        normalized_name = " ".join(name.strip().split())
        if not normalized_name:
            raise HTTPException(status_code=400, detail="Nama kategori wajib diisi")

        result = await self.db.execute(
            select(FinancialCategory).where(
                func.lower(FinancialCategory.name) == normalized_name.lower()
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            if not existing.is_active:
                existing.is_active = True
                await self.db.commit()
                await self.db.refresh(existing)
            return existing

        category = FinancialCategory(name=normalized_name, is_active=True)
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def create_transaction(
        self,
        *,
        category_id: UUID,
        transaction_type: str,
        amount: Decimal,
        description: Optional[str],
        requester: User,
    ) -> FinancialTransaction:
        category = await self.db.get(FinancialCategory, category_id)
        if not category or not category.is_active:
            raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")

        if transaction_type not in {"request_fund", "income_report"}:
            raise HTTPException(status_code=400, detail="Jenis transaksi tidak valid")

        entry_side = "debit" if transaction_type == "request_fund" else "credit"
        is_admin = requester.role in {"admin", "superadmin"}
        now = datetime.utcnow()

        transaction = FinancialTransaction(
            category_id=category_id,
            transaction_type=transaction_type,
            entry_side=entry_side,
            amount=amount,
            description=description,
            requested_by=requester.id,
            status="approved" if is_admin else "pending",
            reviewed_by=requester.id if is_admin else None,
            reviewed_at=now if is_admin else None,
            approved_at=now if is_admin else None,
            reviewed_note="Auto-approved by admin" if is_admin else None,
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def list_transactions(
        self,
        *,
        skip: int = 0,
        limit: int = 30,
        status_filter: Optional[str] = None,
        transaction_type: Optional[str] = None,
        category_id: Optional[UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> tuple[List[FinancialTransaction], int]:
        filters = []
        if status_filter:
            filters.append(FinancialTransaction.status == status_filter)
        if transaction_type:
            filters.append(FinancialTransaction.transaction_type == transaction_type)
        if category_id:
            filters.append(FinancialTransaction.category_id == category_id)
        if date_from:
            filters.append(FinancialTransaction.created_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            filters.append(FinancialTransaction.created_at <= datetime.combine(date_to, datetime.max.time()))

        where_clause = and_(*filters) if filters else None

        count_query = select(func.count()).select_from(FinancialTransaction)
        data_query = (
            select(FinancialTransaction)
            .options(
                selectinload(FinancialTransaction.category),
                selectinload(FinancialTransaction.requester),
                selectinload(FinancialTransaction.reviewer),
            )
            .order_by(FinancialTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        if where_clause is not None:
            count_query = count_query.where(where_clause)
            data_query = data_query.where(where_clause)

        total_result = await self.db.execute(count_query)
        result = await self.db.execute(data_query)
        return list(result.scalars().all()), int(total_result.scalar() or 0)

    async def review_transaction(
        self,
        *,
        transaction_id: UUID,
        status: str,
        reviewed_note: Optional[str],
        reviewer: User,
    ) -> FinancialTransaction:
        transaction = await self.db.get(FinancialTransaction, transaction_id)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
        if transaction.status != "pending":
            raise HTTPException(status_code=400, detail="Transaksi sudah diproses")

        now = datetime.utcnow()
        transaction.status = status
        transaction.reviewed_by = reviewer.id
        transaction.reviewed_at = now
        transaction.reviewed_note = reviewed_note
        transaction.approved_at = now if status == "approved" else None

        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_balances(self) -> dict:
        await self.ensure_default_categories()

        credit_expr = func.sum(
            case((FinancialTransaction.entry_side == "credit", FinancialTransaction.amount), else_=0)
        ).label("total_credit")
        debit_expr = func.sum(
            case((FinancialTransaction.entry_side == "debit", FinancialTransaction.amount), else_=0)
        ).label("total_debit")

        per_category_result = await self.db.execute(
            select(
                FinancialCategory.id,
                FinancialCategory.name,
                credit_expr,
                debit_expr,
            )
            .outerjoin(
                FinancialTransaction,
                and_(
                    FinancialTransaction.category_id == FinancialCategory.id,
                    FinancialTransaction.status == "approved",
                ),
            )
            .where(FinancialCategory.is_active == True)
            .group_by(FinancialCategory.id, FinancialCategory.name)
            .order_by(FinancialCategory.name.asc())
        )

        by_category = []
        total_credit = Decimal("0")
        total_debit = Decimal("0")
        for category_id, category_name, category_credit, category_debit in per_category_result.all():
            category_credit = category_credit or Decimal("0")
            category_debit = category_debit or Decimal("0")
            total_credit += category_credit
            total_debit += category_debit
            by_category.append(
                {
                    "category_id": category_id,
                    "category_name": category_name,
                    "total_credit": category_credit,
                    "total_debit": category_debit,
                    "balance": category_credit - category_debit,
                }
            )

        return {
            "total_credit": total_credit,
            "total_debit": total_debit,
            "current_balance": total_credit - total_debit,
            "by_category": by_category,
        }
