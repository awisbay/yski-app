"""
Content Routes (Programs & News)
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.media import save_upload_file
from app.models.user import User
from app.schemas.content import (
    ProgramCreate, ProgramResponse, ProgramUpdate,
    NewsCreate, NewsResponse, NewsUpdate, NewsReject, NewsGenerateRequest, NewsGenerateResponse,
)
from app.services.ai_content import AIContentService
from app.services.content import ContentService

router = APIRouter()
ALLOWED_PROGRAM_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_PROGRAM_IMAGE_SIZE = 8 * 1024 * 1024
ALLOWED_NEWS_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_NEWS_IMAGE_SIZE = 8 * 1024 * 1024


# === Programs Endpoints ===

@router.get("/programs", response_model=List[ProgramResponse])
async def list_programs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query("active"),
    is_featured: bool = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List all programs."""
    service = ContentService(db)
    programs = await service.list_programs(
        skip=skip, limit=limit, status=status, is_featured=is_featured
    )
    return programs


@router.post("/programs/upload-banner")
async def upload_program_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Upload program banner image and return media URL."""
    banner_url = await save_upload_file(
        file=file,
        subdir="programs/banners",
        allowed_types=ALLOWED_PROGRAM_IMAGE_TYPES,
        max_size_bytes=MAX_PROGRAM_IMAGE_SIZE,
    )
    return {"banner_url": banner_url}


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

@router.post("/programs/{program_id}/publish", response_model=ProgramResponse)
async def toggle_publish_program(
    program_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Toggle publish/unpublish on a program (Admin/Pengurus only)."""
    service = ContentService(db)
    program = await service.get_program_by_id(str(program_id))
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    # Toggle active/hidden via status
    program.status = "active" if program.status != "active" else "hidden"
    await db.flush()
    await db.refresh(program)
    return program


@router.get("/news", response_model=List[NewsResponse])
async def list_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    category: str = Query(None),
    is_published: Optional[bool] = Query(None),
    news_status: str = Query(None, description="Filter by publishing status"),
    db: AsyncSession = Depends(get_db)
):
    """List news articles."""
    service = ContentService(db)
    articles = await service.list_news(
        skip=skip, limit=limit, category=category,
        is_published=is_published, news_status=news_status,
    )
    return articles


@router.post("/news/upload-banner")
async def upload_news_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Upload news banner image and return media URL."""
    banner_url = await save_upload_file(
        file=file,
        subdir="news/banners",
        allowed_types=ALLOWED_NEWS_IMAGE_TYPES,
        max_size_bytes=MAX_NEWS_IMAGE_SIZE,
    )
    return {"banner_url": banner_url}


@router.post("/news/generate-content", response_model=NewsGenerateResponse)
async def generate_news_content(
    payload: NewsGenerateRequest,
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Generate long-form news content from short text using Gemini."""
    service = AIContentService()
    result = await service.generate_news_content(title=payload.title, brief=payload.brief)
    return result


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


@router.post("/news/{news_id}/submit", response_model=NewsResponse)
async def submit_news_for_review(
    news_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a draft article for review."""
    service = ContentService(db)
    article = await service.get_news_by_id(str(news_id))
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    if article.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Article cannot be submitted in its current status")
    article.status = "pending_review"
    await db.flush()
    await db.refresh(article)
    return article


@router.post("/news/{news_id}/approve", response_model=NewsResponse)
async def approve_news(
    news_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending news article (Admin/Pengurus only)."""
    from datetime import timezone
    service = ContentService(db)
    article = await service.get_news_by_id(str(news_id))
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    if article.status != "pending_review":
        raise HTTPException(status_code=400, detail="Article is not pending review")
    article.status = "approved"
    article.reviewed_by = current_user.id
    article.reviewed_at = datetime.now(timezone.utc)
    article.rejection_reason = None
    await db.flush()
    await db.refresh(article)
    return article


@router.post("/news/{news_id}/reject", response_model=NewsResponse)
async def reject_news(
    news_id: UUID,
    body: NewsReject,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending news article with a reason (Admin/Pengurus only)."""
    from datetime import timezone
    service = ContentService(db)
    article = await service.get_news_by_id(str(news_id))
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    if article.status != "pending_review":
        raise HTTPException(status_code=400, detail="Article is not pending review")
    article.status = "rejected"
    article.reviewed_by = current_user.id
    article.reviewed_at = datetime.now(timezone.utc)
    article.rejection_reason = body.reason
    await db.flush()
    await db.refresh(article)
    return article


@router.patch("/news/{news_id}/publish", response_model=NewsResponse)
async def publish_news(
    news_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Toggle publish/unpublish on a news article (Admin/Pengurus only)."""
    service = ContentService(db)
    article = await service.get_news_by_id(str(news_id))
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    article = await service.toggle_publish_news(str(news_id))
    return article
