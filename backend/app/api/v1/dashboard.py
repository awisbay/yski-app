"""
Dashboard Metrics Routes — Admin/Pengurus only
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.auction import AuctionItem, AuctionBid
from app.models.booking import MovingBooking
from app.models.content import NewsArticle, Program
from app.models.donation import Donation
from app.models.equipment import MedicalEquipment, EquipmentLoan
from app.models.financial import FinancialReport
from app.models.pickup import PickupRequest
from app.models.user import User

router = APIRouter()


def _month_label(year: int, month: int) -> str:
    return date(year, month, 1).strftime("%b %Y")


@router.get("/overview")
async def get_overview(
    current_user=Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Overall counts + trends for all modules."""

    # --- counts ---
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))
    ).scalar_one()

    total_donations_amount: Decimal = (
        await db.execute(
            select(func.coalesce(func.sum(Donation.amount), 0)).where(
                Donation.payment_status == "paid"
            )
        )
    ).scalar_one()

    active_auctions = (
        await db.execute(
            select(func.count(AuctionItem.id)).where(
                AuctionItem.status.in_(["bidding", "ready"])
            )
        )
    ).scalar_one()

    pending_bookings = (
        await db.execute(
            select(func.count(MovingBooking.id)).where(
                MovingBooking.status == "pending"
            )
        )
    ).scalar_one()

    equipment_on_loan = (
        await db.execute(
            select(func.count(EquipmentLoan.id)).where(
                EquipmentLoan.status == "borrowed"
            )
        )
    ).scalar_one()

    unread_pickups = (
        await db.execute(
            select(func.count(PickupRequest.id)).where(
                PickupRequest.status == "pending"
            )
        )
    ).scalar_one()

    # --- donation trend last 12 months ---
    now = datetime.now(timezone.utc)
    donation_trend: List[Dict] = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        total = (
            await db.execute(
                select(func.coalesce(func.sum(Donation.amount), 0)).where(
                    and_(
                        Donation.payment_status == "paid",
                        extract("year", Donation.created_at) == y,
                        extract("month", Donation.created_at) == m,
                    )
                )
            )
        ).scalar_one()
        donation_trend.append({"label": _month_label(y, m), "amount": float(total)})

    # --- bookings by status ---
    booking_statuses = (
        await db.execute(
            select(MovingBooking.status, func.count(MovingBooking.id)).group_by(
                MovingBooking.status
            )
        )
    ).all()
    bookings_by_status = [{"status": s, "count": c} for s, c in booking_statuses]

    return {
        "totals": {
            "users": total_users,
            "active_users": active_users,
            "donations_amount": float(total_donations_amount),
            "active_auctions": active_auctions,
            "pending_bookings": pending_bookings,
            "equipment_on_loan": equipment_on_loan,
            "pending_pickups": unread_pickups,
        },
        "donation_trend": donation_trend,
        "bookings_by_status": bookings_by_status,
    }


@router.get("/users/metrics")
async def get_user_metrics(
    current_user=Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Users by role, active vs inactive, new signups per month."""

    roles = (
        await db.execute(
            select(User.role, func.count(User.id)).group_by(User.role)
        )
    ).all()
    by_role = [{"role": r, "count": c} for r, c in roles]

    active = (
        await db.execute(
            select(func.count(User.id)).where(User.is_active == True)
        )
    ).scalar_one()
    inactive = (
        await db.execute(
            select(func.count(User.id)).where(User.is_active == False)
        )
    ).scalar_one()

    now = datetime.now(timezone.utc)
    signups: List[Dict] = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        cnt = (
            await db.execute(
                select(func.count(User.id)).where(
                    and_(
                        extract("year", User.created_at) == y,
                        extract("month", User.created_at) == m,
                    )
                )
            )
        ).scalar_one()
        signups.append({"label": _month_label(y, m), "count": cnt})

    return {
        "by_role": by_role,
        "active": active,
        "inactive": inactive,
        "signups_per_month": signups,
    }


@router.get("/donations/metrics")
async def get_donation_metrics(
    current_user=Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Totals by type, by month, top donors."""

    by_type = (
        await db.execute(
            select(
                Donation.donation_type,
                func.count(Donation.id),
                func.coalesce(func.sum(Donation.amount), 0),
            )
            .where(Donation.payment_status == "paid")
            .group_by(Donation.donation_type)
        )
    ).all()
    by_type_data = [
        {"type": t, "count": c, "amount": float(a)} for t, c, a in by_type
    ]

    now = datetime.now(timezone.utc)
    monthly: List[Dict] = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        total = (
            await db.execute(
                select(func.coalesce(func.sum(Donation.amount), 0)).where(
                    and_(
                        Donation.payment_status == "paid",
                        extract("year", Donation.created_at) == y,
                        extract("month", Donation.created_at) == m,
                    )
                )
            )
        ).scalar_one()
        monthly.append({"label": _month_label(y, m), "amount": float(total)})

    total_all = (
        await db.execute(
            select(func.coalesce(func.sum(Donation.amount), 0)).where(
                Donation.payment_status == "paid"
            )
        )
    ).scalar_one()

    return {
        "total_amount": float(total_all),
        "by_type": by_type_data,
        "monthly_trend": monthly,
    }


@router.get("/auctions/metrics")
async def get_auction_metrics(
    current_user=Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Active auctions, total sold value, by status."""

    by_status = (
        await db.execute(
            select(AuctionItem.status, func.count(AuctionItem.id)).group_by(
                AuctionItem.status
            )
        )
    ).all()
    by_status_data = [{"status": s, "count": c} for s, c in by_status]

    total_sold = (
        await db.execute(
            select(func.coalesce(func.sum(AuctionItem.current_price), 0)).where(
                AuctionItem.status == "sold"
            )
        )
    ).scalar_one()

    pending_payments = (
        await db.execute(
            select(func.count(AuctionItem.id)).where(
                AuctionItem.status == "payment_pending"
            )
        )
    ).scalar_one()

    return {
        "by_status": by_status_data,
        "total_sold_value": float(total_sold),
        "pending_payments": pending_payments,
    }


@router.get("/bookings/metrics")
async def get_booking_metrics(
    current_user=Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Bookings by status, by month."""

    by_status = (
        await db.execute(
            select(MovingBooking.status, func.count(MovingBooking.id)).group_by(
                MovingBooking.status
            )
        )
    ).all()
    by_status_data = [{"status": s, "count": c} for s, c in by_status]

    now = datetime.now(timezone.utc)
    weekly: List[Dict] = []
    for week in range(7, -1, -1):
        from datetime import timedelta

        week_start = (now - timedelta(weeks=week + 1)).date()
        week_end = (now - timedelta(weeks=week)).date()
        cnt = (
            await db.execute(
                select(func.count(MovingBooking.id)).where(
                    and_(
                        MovingBooking.booking_date >= week_start,
                        MovingBooking.booking_date < week_end,
                    )
                )
            )
        ).scalar_one()
        weekly.append({"label": str(week_start), "count": cnt})

    return {
        "by_status": by_status_data,
        "weekly_trend": weekly,
    }


@router.get("/equipment/metrics")
async def get_equipment_metrics(
    current_user=Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Equipment by condition, loan status breakdown."""

    by_category = (
        await db.execute(
            select(MedicalEquipment.category, func.count(MedicalEquipment.id)).where(
                MedicalEquipment.is_active == True
            ).group_by(MedicalEquipment.category)
        )
    ).all()

    by_condition = (
        await db.execute(
            select(MedicalEquipment.condition, func.count(MedicalEquipment.id)).where(
                MedicalEquipment.is_active == True
            ).group_by(MedicalEquipment.condition)
        )
    ).all()

    loan_by_status = (
        await db.execute(
            select(EquipmentLoan.status, func.count(EquipmentLoan.id)).group_by(
                EquipmentLoan.status
            )
        )
    ).all()

    total_equipment = (
        await db.execute(
            select(func.count(MedicalEquipment.id)).where(MedicalEquipment.is_active == True)
        )
    ).scalar_one()

    on_loan = (
        await db.execute(
            select(func.count(EquipmentLoan.id)).where(EquipmentLoan.status == "borrowed")
        )
    ).scalar_one()

    pending_loans = (
        await db.execute(
            select(func.count(EquipmentLoan.id)).where(EquipmentLoan.status == "pending")
        )
    ).scalar_one()

    return {
        "total_equipment": total_equipment,
        "on_loan": on_loan,
        "pending_loans": pending_loans,
        "by_category": [{"category": c, "count": n} for c, n in by_category],
        "by_condition": [{"condition": c, "count": n} for c, n in by_condition],
        "loan_by_status": [{"status": s, "count": c} for s, c in loan_by_status],
    }
