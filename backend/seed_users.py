"""
Seed script to create test users for all roles
Usage: python seed_users.py
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


SEED_USERS = [
    {
        "full_name": "Admin YSKI",
        "email": "admin@yski.org",
        "phone": "+628110001001",
        "role": "admin",
        "password": "Admin@123",
    },
    {
        "full_name": "Pengurus YSKI",
        "email": "pengurus@yski.org",
        "phone": "+628110001002",
        "role": "pengurus",
        "password": "Pengurus@123",
    },
    {
        "full_name": "Relawan YSKI",
        "email": "relawan@yski.org",
        "phone": "+628110001003",
        "role": "relawan",
        "password": "Relawan@123",
    },
    {
        "full_name": "Sahabat YSKI",
        "email": "sahabat@yski.org",
        "phone": "+628110001004",
        "role": "sahabat",
        "password": "Sahabat@123",
    },
]


async def seed_users():
    """Create test users for all roles."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        for user_data in SEED_USERS:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"  [SKIP] {user_data['role']:10s} | {user_data['email']} (already exists)")
                continue

            user = User(
                full_name=user_data["full_name"],
                email=user_data["email"],
                phone=user_data["phone"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True,
            )
            session.add(user)
            print(f"  [CREATED] {user_data['role']:10s} | {user_data['email']}")

        await session.commit()

    await engine.dispose()
    print("\nDone! All seed users are ready.")


if __name__ == "__main__":
    print("Seeding users...\n")
    asyncio.run(seed_users())
