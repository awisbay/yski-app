"""
RBAC (Role-Based Access Control) Models
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RolePermission(Base):
    """Role permissions for RBAC."""
    
    __tablename__ = "role_permissions"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    resource: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    __table_args__ = (
        UniqueConstraint("role", "resource", "action", name="uq_role_resource_action"),
    )
    
    def __repr__(self) -> str:
        return f"<RolePermission(role={self.role}, resource={self.resource}, action={self.action})>"
