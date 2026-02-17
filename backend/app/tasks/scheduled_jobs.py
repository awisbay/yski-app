"""
Scheduled Jobs for Phase 5
Runs via Celery Beat or APScheduler
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.services.auction_service import AuctionService
from app.services.equipment_service import EquipmentService
from app.services.donation_service import DonationService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


async def close_expired_auctions():
    """
    Close expired auctions and determine winners.
    Run every 5 minutes.
    """
    logger.info("Running job: close_expired_auctions")
    
    async with AsyncSessionLocal() as db:
        try:
            service = AuctionService(db)
            closed_count = await service.close_expired_auctions()
            logger.info(f"Closed {closed_count} expired auctions")
        except Exception as e:
            logger.error(f"Error closing expired auctions: {e}")
            await db.rollback()


async def check_overdue_loans():
    """
    Check for overdue equipment loans and notify borrowers.
    Run once daily.
    """
    logger.info("Running job: check_overdue_loans")
    
    async with AsyncSessionLocal() as db:
        try:
            # Get all active loans past due date
            from sqlalchemy import select
            from app.models.equipment import EquipmentLoan
            
            result = await db.execute(
                select(EquipmentLoan).where(
                    EquipmentLoan.status == "active",
                    EquipmentLoan.due_date < datetime.now(timezone.utc),
                )
            )
            overdue_loans = result.scalars().all()
            
            notification_service = NotificationService(db)
            
            for loan in overdue_loans:
                # Update status to overdue
                loan.status = "overdue"
                
                # Send notification to borrower
                await notification_service.create_notification(
                    user_id=loan.borrower_id,
                    title="Peminjaman Jatuh Tempo",
                    body=f"Peminjaman alat Anda telah melewati tanggal pengembalian. Silakan kembalikan sesegera mungkin.",
                    type="loan_overdue",
                    reference_type="loan",
                    reference_id=loan.id,
                )
                logger.info(f"Marked loan {loan.id} as overdue")
            
            await db.commit()
            logger.info(f"Processed {len(overdue_loans)} overdue loans")
        except Exception as e:
            logger.error(f"Error checking overdue loans: {e}")
            await db.rollback()


async def expire_unpaid_donations():
    """
    Expire donations that haven't been paid past the deadline.
    Run once hourly.
    """
    logger.info("Running job: expire_unpaid_donations")
    
    async with AsyncSessionLocal() as db:
        try:
            from sqlalchemy import select
            from app.models.donation import Donation
            
            # Expire donations pending for more than 24 hours
            from datetime import timedelta
            
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
            
            result = await db.execute(
                select(Donation).where(
                    Donation.status == "pending",
                    Donation.created_at < cutoff_time,
                )
            )
            expired_donations = result.scalars().all()
            
            for donation in expired_donations:
                donation.status = "cancelled"
                logger.info(f"Expired donation {donation.id}")
            
            await db.commit()
            logger.info(f"Expired {len(expired_donations)} unpaid donations")
        except Exception as e:
            logger.error(f"Error expiring donations: {e}")
            await db.rollback()


# Celery task wrappers (for Celery integration)
try:
    from celery import Celery
    
    celery_app = Celery("scheduled_jobs")
    
    @celery_app.task
    def close_expired_auctions_task():
        """Celery task wrapper for close_expired_auctions."""
        import asyncio
        asyncio.run(close_expired_auctions())
    
    @celery_app.task
    def check_overdue_loans_task():
        """Celery task wrapper for check_overdue_loans."""
        import asyncio
        asyncio.run(check_overdue_loans())
    
    @celery_app.task
    def expire_unpaid_donations_task():
        """Celery task wrapper for expire_unpaid_donations."""
        import asyncio
        asyncio.run(expire_unpaid_donations())

except ImportError:
    # Celery not installed, skip task definitions
    pass
