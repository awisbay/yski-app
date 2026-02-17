"""
Content (Program & News) Pydantic Schemas
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


# Program Schemas
class ProgramBase(BaseModel):
    title: str
    description: str
    target_amount: Optional[Decimal] = None


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[Decimal] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None


class ProgramResponse(ProgramBase):
    id: UUID
    slug: str
    thumbnail_url: Optional[str] = None
    collected_amount: Decimal
    status: str
    is_featured: bool
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# News Schemas
class NewsBase(BaseModel):
    title: str
    excerpt: Optional[str] = None
    content: str
    category: str = "general"


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class NewsResponse(NewsBase):
    id: UUID
    slug: str
    thumbnail_url: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
