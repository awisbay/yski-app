"""
Auction Service - Lelang Barang
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auction import AuctionItem, AuctionImage, AuctionBid
from app.models.user import User
from app.schemas.auction import (
    AuctionItemCreate,
    AuctionItemUpdate,
    AuctionItemActivate,
    AuctionBidCreate,
)
from app.services.notification_service import NotificationService


class AuctionService:
    """Service for managing auctions (lelang barang)."""
    
    MIN_INCREMENT = Decimal("5000.00")  # Rp 5.000 minimum increment
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notification_service = NotificationService(db)
    
    # ============== Item Management ==============
    
    async def create_item(
        self,
        data: AuctionItemCreate,
        donor_id: UUID,
    ) -> AuctionItem:
        """Create a new auction item (draft status)."""
        item = AuctionItem(
            title=data.title,
            description=data.description,
            starting_price=data.starting_price,
            current_price=data.starting_price,
            min_increment=data.min_increment or self.MIN_INCREMENT,
            donor_id=donor_id,
            status="draft",
        )
        self.db.add(item)
        await self.db.flush()
        return item
    
    async def get_item(self, item_id: UUID) -> Optional[AuctionItem]:
        """Get auction item by ID with all relationships."""
        result = await self.db.execute(
            select(AuctionItem)
            .options(
                selectinload(AuctionItem.images),
                selectinload(AuctionItem.bids).selectinload(AuctionBid.bidder),
                selectinload(AuctionItem.donor),
                selectinload(AuctionItem.winner),
            )
            .where(AuctionItem.id == item_id)
        )
        return result.scalar_one_or_none()
    
    async def get_active_items(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> tuple[List[AuctionItem], int]:
        """Get active auctions with pagination."""
        query = (
            select(AuctionItem)
            .options(selectinload(AuctionItem.images))
            .where(AuctionItem.status == "active")
        )
        
        if search:
            query = query.where(AuctionItem.title.ilike(f"%{search}%"))
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Get paginated results
        query = query.order_by(AuctionItem.end_time.asc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        items = result.scalars().all()
        
        return list(items), total
    
    async def update_item(
        self,
        item_id: UUID,
        data: AuctionItemUpdate,
    ) -> AuctionItem:
        """Update auction item (only if in draft status)."""
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")
        
        if item.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Can only update items in draft status",
            )
        
        if data.title is not None:
            item.title = data.title
        if data.description is not None:
            item.description = data.description
        
        await self.db.flush()
        return item
    
    async def activate_item(
        self,
        item_id: UUID,
        data: AuctionItemActivate,
    ) -> AuctionItem:
        """Activate an auction item (change from draft to active)."""
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")
        
        if item.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Can only activate items in draft status",
            )
        
        now = datetime.now(timezone.utc)
        if data.start_time < now:
            raise HTTPException(
                status_code=400,
                detail="Start time must be in the future",
            )
        if data.end_time <= data.start_time:
            raise HTTPException(
                status_code=400,
                detail="End time must be after start time",
            )
        
        item.status = "active"
        item.start_time = data.start_time
        item.end_time = data.end_time
        
        await self.db.flush()
        return item
    
    async def cancel_item(self, item_id: UUID) -> AuctionItem:
        """Cancel an auction."""
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")
        
        if item.status not in ["draft", "active"]:
            raise HTTPException(
                status_code=400,
                detail="Can only cancel items in draft or active status",
            )
        
        item.status = "cancelled"
        await self.db.flush()
        return item
    
    # ============== Bidding ==============
    
    async def place_bid(
        self,
        item_id: UUID,
        bidder_id: UUID,
        data: AuctionBidCreate,
    ) -> AuctionBid:
        """Place a bid on an auction item."""
        # Lock the auction item row to prevent race conditions
        result = await self.db.execute(
            select(AuctionItem)
            .where(AuctionItem.id == item_id)
            .with_for_update()
        )
        item = result.scalar_one_or_none()
        
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")
        
        # Validate auction is active
        if item.status != "active":
            raise HTTPException(status_code=400, detail="Auction is not active")
        
        now = datetime.now(timezone.utc)
        if now < item.start_time:
            raise HTTPException(status_code=400, detail="Auction has not started yet")
        if now > item.end_time:
            raise HTTPException(status_code=400, detail="Auction has ended")
        
        # Validate bidder is not donor
        if bidder_id == item.donor_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot bid on your own donated item",
            )
        
        # Validate bid amount
        min_bid = item.current_price + item.min_increment
        if data.amount < min_bid:
            raise HTTPException(
                status_code=400,
                detail=f"Bid must be at least Rp {min_bid:,.0f}",
            )
        
        # Get previous highest bidder for notification
        prev_bid_result = await self.db.execute(
            select(AuctionBid)
            .where(AuctionBid.auction_item_id == item_id)
            .order_by(AuctionBid.amount.desc())
            .limit(1)
        )
        prev_bid = prev_bid_result.scalar_one_or_none()
        
        # Create bid
        bid = AuctionBid(
            auction_item_id=item_id,
            bidder_id=bidder_id,
            amount=data.amount,
        )
        self.db.add(bid)
        
        # Update current price
        item.current_price = data.amount
        
        await self.db.flush()
        
        # Notify previous highest bidder they have been outbid
        if prev_bid and prev_bid.bidder_id != bidder_id:
            await self.notification_service.create_notification(
                user_id=prev_bid.bidder_id,
                title="Anda Telah Dilewati",
                body=f"Seseorang telah menawar lebih tinggi untuk '{item.title}'",
                type="auction_outbid",
                reference_type="auction",
                reference_id=item_id,
            )
        
        return bid
    
    async def get_my_bids(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[List, int]:
        """Get auctions the user has bid on."""
        # Get distinct auction items user has bid on
        subquery = (
            select(AuctionBid.auction_item_id)
            .where(AuctionBid.bidder_id == user_id)
            .distinct()
            .subquery()
        )
        
        query = (
            select(AuctionItem)
            .options(selectinload(AuctionItem.images))
            .join(subquery, AuctionItem.id == subquery.c.auction_item_id)
        )
        
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        query = query.order_by(AuctionItem.end_time.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        items = result.scalars().all()
        
        return list(items), total
    
    # ============== Auto-Close (Scheduled Job) ==============
    
    async def close_expired_auctions(self) -> int:
        """Close expired auctions and determine winners. Called by scheduled job."""
        now = datetime.now(timezone.utc)
        
        # Find all active auctions past their end_time
        result = await self.db.execute(
            select(AuctionItem)
            .where(
                AuctionItem.status == "active",
                AuctionItem.end_time <= now,
            )
            .with_for_update()
        )
        expired_items = result.scalars().all()
        
        closed_count = 0
        for item in expired_items:
            # Get highest bid
            bid_result = await self.db.execute(
                select(AuctionBid)
                .where(AuctionBid.auction_item_id == item.id)
                .order_by(AuctionBid.amount.desc())
                .limit(1)
            )
            highest_bid = bid_result.scalar_one_or_none()
            
            if highest_bid:
                item.status = "sold"
                item.winner_id = highest_bid.bidder_id
                
                # Notify winner
                await self.notification_service.create_notification(
                    user_id=highest_bid.bidder_id,
                    title="Selamat! Anda Memenangkan Lelang",
                    body=f"Anda memenangkan '{item.title}' dengan harga Rp {highest_bid.amount:,.0f}",
                    type="auction_won",
                    reference_type="auction",
                    reference_id=item.id,
                )
            else:
                item.status = "expired"
            
            closed_count += 1
        
        await self.db.commit()
        return closed_count
