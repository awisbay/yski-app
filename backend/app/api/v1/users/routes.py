"""
User Management Routes
"""

import csv
import io
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.schemas.user import UserResponse, UserUpdate, UserCreate, UserRoleUpdate
from app.services.user import UserService
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile."""
    service = UserService(db)
    updated_user = await service.update(str(current_user.id), user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return updated_user


@router.get("/export")
async def export_users(
    search: str = Query(None),
    role: str = Query(None),
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Export users as CSV (Admin/Pengurus only)."""
    service = UserService(db)
    users = await service.list(skip=0, limit=10000, search=search, role=role)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Full Name", "Email", "Phone", "Role", "Is Active", "Last Login", "Created At"])
    for u in users:
        writer.writerow([
            str(u.id),
            u.full_name,
            u.email,
            u.phone or "",
            u.role,
            u.is_active,
            u.last_login_at.isoformat() if u.last_login_at else "",
            u.created_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )


@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Search by name or email"),
    role: str = Query(None, description="Filter by role"),
    is_active: bool = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """List all users with pagination and filters (Admin/Pengurus)."""
    service = UserService(db)
    users = await service.list(skip=skip, limit=limit, search=search, role=role, is_active=is_active)
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID (Admin/Pengurus)."""
    service = UserService(db)
    user = await service.get_by_id(str(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    role: str = Query("sahabat", description="Role for the new user"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user with specific role (Admin only)."""
    service = UserService(db)
    
    # Check if email exists
    existing = await service.get_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    user = await service.create(user_data, role=role)
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update any user (Admin only)."""
    service = UserService(db)
    updated_user = await service.update(str(user_id), user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a user (Admin only - soft delete)."""
    service = UserService(db)
    success = await service.deactivate(str(user_id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return None


@router.put("/{user_id}/role", response_model=UserResponse)
async def change_user_role(
    user_id: UUID,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Change user role (Admin only)."""
    service = UserService(db)
    user = await service.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role_data.role
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate (soft-delete) a user (Admin only)."""
    service = UserService(db)
    user = await service.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Reactivate a user (Admin only)."""
    service = UserService(db)
    user = await service.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = True
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/{user_id}/reset-password")
async def admin_reset_password(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Initiate admin-triggered password reset email (Admin only)."""
    from app.services.password_reset import PasswordResetService, send_password_reset_email

    service = UserService(db)
    user = await service.get_by_id(str(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is inactive")

    reset_service = PasswordResetService(db)
    _, reset_url = await reset_service.issue_token(user)
    try:
        send_password_reset_email(user.email, reset_url)
    except Exception:
        pass  # Email failure is non-fatal

    return {"message": f"Password reset email sent to {user.email}"}
