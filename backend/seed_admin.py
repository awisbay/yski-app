"""
Seed script to create initial admin user
Usage: python seed_admin.py
"""

import asyncio
import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings


async def seed_admin():
    """Create admin user from environment variables."""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@yski.org")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")
    
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.email == admin_email)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"Admin user {admin_email} already exists")
            await engine.dispose()
            return
        
        # Create admin user
        admin = User(
            full_name=admin_name,
            email=admin_email,
            phone=None,
            password_hash=get_password_hash(admin_password),
            avatar_url=None,
            role="admin",
            is_active=True
        )
        
        session.add(admin)
        await session.commit()
        print(f"Admin user {admin_email} created successfully")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_admin())
