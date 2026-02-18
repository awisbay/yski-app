"""
FastAPI Dependencies - Authentication, Database, RBAC
"""

from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.rbac import RolePermission
from sqlalchemy import select

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extract and validate user from JWT access token.
    
    Args:
        token: JWT access token from Authorization header
        db: Database session
        
    Returns:
        User: Authenticated user instance
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception
    
    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_optional_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Extract user from JWT access token if present, otherwise return None.
    Used for endpoints that support both authenticated and anonymous access.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        return None

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure user is active.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User: Active user instance
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_role(*allowed_roles: str):
    """
    Dependency factory that checks if the current user has one of the allowed roles.
    
    Args:
        *allowed_roles: Variable number of allowed role strings
        
    Returns:
        Callable: Dependency function that validates user role
        
    Example:
        @router.get("/admin-only")
        async def admin_endpoint(
            current_user: User = Depends(require_role("admin"))
        ):
            return {"message": "Hello Admin!"}
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this role"
            )
        return current_user
    return role_checker


async def check_permission(
    db: AsyncSession,
    role: str,
    resource: str,
    action: str,
) -> bool:
    """
    Check if a role has permission for a specific resource and action.
    
    Args:
        db: Database session
        role: User role to check
        resource: Resource name (e.g., 'bookings', 'users')
        action: Action name (e.g., 'create', 'read', 'update')
        
    Returns:
        bool: True if permission exists, False otherwise
    """
    result = await db.execute(
        select(RolePermission).where(
            RolePermission.role == role,
            RolePermission.resource == resource,
            RolePermission.action == action,
        )
    )
    return result.scalar_one_or_none() is not None


class PermissionChecker:
    """
    Class-based permission checker for more complex permission scenarios.
    
    Example:
        @router.post("/bookings/{booking_id}/approve")
        async def approve_booking(
            booking_id: str,
            current_user: User = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
            _=Depends(PermissionChecker("bookings", "approve"))
        ):
            # User has 'bookings:approve' permission
            pass
    """
    
    def __init__(self, resource: str, action: str):
        self.resource = resource
        self.action = action
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> bool:
        has_perm = await check_permission(db, current_user.role, self.resource, self.action)
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {self.resource}:{self.action}"
            )
        return True
