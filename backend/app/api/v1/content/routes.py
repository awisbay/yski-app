"""
Content Routes (Programs & News)
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.content import ProgramCreate, ProgramResponse, ProgramUpdate, NewsCreate, NewsResponse, NewsUpdate
from app.services.content import ContentService

router = APIRouter()


# === Programs Endpoints ===

@router.get("/programs", response_model=List[ProgramResponse])
async def list_programs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    is_featured: bool = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List all programs."""
    service = ContentService(db)
    programs = await service.list_programs(
        skip=skip, limit=limit, status=status, is_featured=is_featured
    )
    return programs


@router.get("/programs/featured", response_model=List[ProgramResponse])
async def get_featured_programs(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get featured programs."""
    service = ContentService(db)
    programs = await service.list_programs(is_featured=True, limit=limit)
    return programs


@router.get("/programs/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get program by ID."""
    service = ContentService(db)
    program = await service.get_program_by_id(str(program_id))
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.post("/programs", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    program_data: ProgramCreate,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Create new program (Admin/Pengurus only)."""
    service = ContentService(db)
    program = await service.create_program(program_data, current_user.id)
    return program


@router.put("/programs/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: UUID,
    program_data: ProgramUpdate,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Update program (Admin/Pengurus only)."""
    service = ContentService(db)
    program = await service.update_program(str(program_id), program_data)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
    program_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Delete program (Admin/Pengurus only)."""
    service = ContentService(db)
    success = await service.delete_program(str(program_id))
    if not success:
        raise HTTPException(status_code=404, detail="Program not found")
    return None


# === News Endpoints ===

@router.get("/news", response_model=List[NewsResponse])
async def list_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    category: str = Query(None),
    is_published: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """List news articles."""
    service = ContentService(db)
    articles = await service.list_news(
        skip=skip, limit=limit, category=category, is_published=is_published
    )
    return articles


@router.get("/news/{news_id}", response_model=NewsResponse)
async def get_news(
    news_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get news article by ID."""
    service = ContentService(db)
    article = await service.get_news_by_id(str(news_id))
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    return article


@router.post("/news", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
async def create_news(
    news_data: NewsCreate,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Create new news article (Admin/Pengurus only)."""
    service = ContentService(db)
    article = await service.create_news(news_data, current_user.id)
    return article


@router.put("/news/{news_id}", response_model=NewsResponse)
async def update_news(
    news_id: UUID,
    news_data: NewsUpdate,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Update news article (Admin/Pengurus only)."""
    service = ContentService(db)
    article = await service.update_news(str(news_id), news_data)
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    return article


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
    news_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Delete news article (Admin/Pengurus only)."""
    service = ContentService(db)
    success = await service.delete_news(str(news_id))
    if not success:
        raise HTTPException(status_code=404, detail="News article not found")
    return None


@router.patch("/news/{news_id}/publish", response_model=NewsResponse)
async def publish_news(
    news_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Publish news article (Admin/Pengurus only)."""
    service = ContentService(db)
    article = await service.publish_news(str(news_id))
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    return article
