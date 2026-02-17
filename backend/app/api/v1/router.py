"""
API Router - Aggregates all v1 endpoints
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.equipment import router as equipment_router
from app.api.v1.donations import router as donations_router
from app.api.v1.pickups import router as pickups_router
from app.api.v1.content import router as content_router

# Phase 5: Advanced Features
from app.api.v1.auction import router as auction_router
from app.api.v1.financial import router as financial_router
from app.api.v1.notifications import router as notifications_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(equipment_router, prefix="/equipment", tags=["Equipment"])
api_router.include_router(donations_router, prefix="/donations", tags=["Donations"])
api_router.include_router(pickups_router, prefix="/pickups", tags=["Pickups"])
api_router.include_router(content_router, prefix="/content", tags=["Content"])

# Phase 5 Routes
api_router.include_router(auction_router, prefix="/auctions", tags=["Auctions"])
api_router.include_router(financial_router, prefix="/financial", tags=["Financial Reports"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
