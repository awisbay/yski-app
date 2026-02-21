"""
User Service - Business logic for user management
"""

from typing import Optional, List
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


class UserService:
    """Service class for user operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        try:
            uuid_id = UUID(user_id)
        except ValueError:
            return None
            
        result = await self.db.execute(
            select(User).where(User.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def list(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[User]:
        """List users with pagination and filters."""
        query = select(User)

        if search:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )

        if role:
            query = query.where(User.role == role)

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create(self, user_data: UserCreate, role: str = "sahabat") -> User:
        """Create a new user."""
        user = User(
            full_name=user_data.full_name,
            kunyah_name=user_data.kunyah_name,
            email=user_data.email,
            phone=user_data.phone,
            occupation=user_data.occupation,
            address=user_data.address,
            city=user_data.city,
            province=user_data.province,
            interested_as_donatur=user_data.interested_as_donatur,
            interested_as_relawan=user_data.interested_as_relawan,
            wants_beneficiary_survey=user_data.wants_beneficiary_survey,
            password_hash=get_password_hash(user_data.password),
            avatar_url=user_data.avatar_url,
            role=role,
            is_active=True
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def update(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """Update user."""
        user = await self.get_by_id(user_id)
        if not user:
            return None
        
        update_data = user_data.model_dump(exclude_unset=True)
        if "email" in update_data:
            existing = await self.get_by_email(update_data["email"])
            if existing and str(existing.id) != str(user.id):
                raise HTTPException(status_code=409, detail="Email already registered")
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def deactivate(self, user_id: str) -> bool:
        """Soft delete / deactivate user."""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False
        await self.db.flush()
        return True
