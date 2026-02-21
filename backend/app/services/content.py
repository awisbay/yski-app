"""
Content Service - Business logic for programs and news
"""

import re
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Program, NewsArticle
from app.schemas.content import ProgramCreate, ProgramUpdate, NewsCreate, NewsUpdate


def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text."""
    # Convert to lowercase and replace spaces with hyphens
    slug = text.lower().strip()
    # Remove non-alphanumeric characters except hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace spaces and underscores with hyphens
    slug = re.sub(r'[\s_]+', '-', slug)
    # Remove multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    return slug[:200]  # Limit length


class ContentService:
    """Service class for content operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # === Program Methods ===
    
    async def get_program_by_id(self, program_id: str) -> Optional[Program]:
        """Get program by ID."""
        try:
            uuid_id = UUID(program_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(Program).where(Program.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def get_program_by_slug(self, slug: str) -> Optional[Program]:
        """Get program by slug."""
        result = await self.db.execute(
            select(Program).where(Program.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def list_programs(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        is_featured: Optional[bool] = None,
    ) -> List[Program]:
        """List programs with filters."""
        query = select(Program)
        
        if status:
            query = query.where(Program.status == status)
        if is_featured is not None:
            query = query.where(Program.is_featured == is_featured)
        
        query = query.order_by(Program.display_order.asc(), Program.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create_program(self, data: ProgramCreate, created_by: UUID) -> Program:
        """Create new program."""
        # Generate unique slug
        base_slug = generate_slug(data.title)
        slug = base_slug
        counter = 1
        
        while await self.get_program_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        program = Program(
            title=data.title,
            slug=slug,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            display_order=data.display_order,
            target_amount=data.target_amount,
            collected_amount=0,
            status="active",
            is_featured=False,
            created_by=created_by
        )
        
        self.db.add(program)
        await self.db.flush()
        await self.db.refresh(program)
        return program
    
    async def update_program(self, program_id: str, data: ProgramUpdate) -> Optional[Program]:
        """Update program."""
        program = await self.get_program_by_id(program_id)
        if not program:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Update slug if title changed
        if 'title' in update_data and update_data['title'] != program.title:
            base_slug = generate_slug(update_data['title'])
            slug = base_slug
            counter = 1
            
            while await self.get_program_by_slug(slug) and slug != program.slug:
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            update_data['slug'] = slug
        
        for field, value in update_data.items():
            setattr(program, field, value)
        
        await self.db.flush()
        await self.db.refresh(program)
        return program
    
    async def delete_program(self, program_id: str) -> bool:
        """Delete program."""
        program = await self.get_program_by_id(program_id)
        if not program:
            return False
        
        await self.db.delete(program)
        await self.db.flush()
        return True
    
    # === News Methods ===
    
    async def get_news_by_id(self, news_id: str) -> Optional[NewsArticle]:
        """Get news by ID."""
        try:
            uuid_id = UUID(news_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(NewsArticle).where(NewsArticle.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def get_news_by_slug(self, slug: str) -> Optional[NewsArticle]:
        """Get news by slug."""
        result = await self.db.execute(
            select(NewsArticle).where(NewsArticle.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def list_news(
        self,
        skip: int = 0,
        limit: int = 10,
        category: Optional[str] = None,
        is_published: Optional[bool] = None,
        news_status: Optional[str] = None,
    ) -> List[NewsArticle]:
        """List news articles with filters."""
        query = select(NewsArticle)

        if category:
            query = query.where(NewsArticle.category == category)
        if is_published is not None:
            query = query.where(NewsArticle.is_published == is_published)
        if news_status:
            query = query.where(NewsArticle.status == news_status)

        query = query.offset(skip).limit(limit).order_by(NewsArticle.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create_news(self, data: NewsCreate, created_by: UUID) -> NewsArticle:
        """Create new news article."""
        # Generate unique slug
        base_slug = generate_slug(data.title)
        slug = base_slug
        counter = 1
        
        while await self.get_news_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        article = NewsArticle(
            title=data.title,
            slug=slug,
            excerpt=data.excerpt or data.content[:200] + "...",
            content=data.content,
            category=data.category,
            is_published=False,
            created_by=created_by
        )
        
        self.db.add(article)
        await self.db.flush()
        await self.db.refresh(article)
        return article
    
    async def update_news(self, news_id: str, data: NewsUpdate) -> Optional[NewsArticle]:
        """Update news article."""
        article = await self.get_news_by_id(news_id)
        if not article:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Update slug if title changed
        if 'title' in update_data and update_data['title'] != article.title:
            base_slug = generate_slug(update_data['title'])
            slug = base_slug
            counter = 1
            
            while await self.get_news_by_slug(slug) and slug != article.slug:
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            update_data['slug'] = slug
        
        for field, value in update_data.items():
            setattr(article, field, value)
        
        await self.db.flush()
        await self.db.refresh(article)
        return article
    
    async def delete_news(self, news_id: str) -> bool:
        """Delete news article."""
        article = await self.get_news_by_id(news_id)
        if not article:
            return False
        
        await self.db.delete(article)
        await self.db.flush()
        return True
    
    async def publish_news(self, news_id: str) -> Optional[NewsArticle]:
        """Publish news article."""
        article = await self.get_news_by_id(news_id)
        if not article:
            return None

        article.is_published = True
        article.status = "published"
        article.published_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(article)
        return article

    async def toggle_publish_news(self, news_id: str) -> Optional[NewsArticle]:
        """Toggle publish/unpublish on a news article."""
        article = await self.get_news_by_id(news_id)
        if not article:
            return None

        if article.is_published:
            article.is_published = False
            article.status = "approved"
            article.published_at = None
        else:
            article.is_published = True
            article.status = "published"
            article.published_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(article)
        return article
