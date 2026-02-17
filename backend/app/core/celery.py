"""
Celery configuration for background tasks
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "yski_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.notifications", "app.tasks.reports"],
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
    "cleanup-expired-bookings": {
        "task": "app.tasks.bookings.cleanup_expired",
        "schedule": 300.0,  # Every 5 minutes
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
