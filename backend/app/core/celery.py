"""
Celery configuration for background tasks
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "yski_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.scheduled_jobs"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    worker_prefetch_multiplier=1,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "close-expired-auctions": {
        "task": "app.tasks.scheduled_jobs.close_expired_auctions_task",
        "schedule": 300.0,  # Every 5 minutes
    },
    "check-overdue-loans": {
        "task": "app.tasks.scheduled_jobs.check_overdue_loans_task",
        "schedule": 86400.0,  # Once daily
    },
    "expire-unpaid-donations": {
        "task": "app.tasks.scheduled_jobs.expire_unpaid_donations_task",
        "schedule": 3600.0,  # Once hourly
    },
}

# Create task placeholders (will be implemented in later phases)
@celery_app.task
def send_notification(user_id: str, title: str, body: str):
    """Send push notification to user."""
    pass


@celery_app.task
def generate_financial_report(start_date: str, end_date: str):
    """Generate financial report."""
    pass
