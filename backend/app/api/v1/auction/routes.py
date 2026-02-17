"""
Auction API Routes - Lelang Barang
"""
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.auction import (
    AuctionItemCreate,
    AuctionItemUpdate,
    AuctionItemActivate,
    AuctionBidCreate,
    AuctionItemResponse,
    AuctionItemDetailResponse,
    AuctionItemListResponse,
    AuctionImageResponse,
    AuctionBidResponse,
    MyBidResponse,
)
from app.services.auction_service import AuctionService

router = APIRouter()


# ============== Item Routes ==============

@router.get("", response_model=AuctionItemListResponse)
async def list_auctions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List active auctions."""
    service = AuctionService(db)
    items, total = await service.get_active_items(skip=skip, limit=limit, search=search)
    return {"items": items, "total": total}


@router.get("/my-bids", response_model=AuctionItemListResponse)
async def list_my_bids(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List auctions the current user has bid on."""
    service = AuctionService(db)
    items, total = await service.get_my_bids(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return {"items": items, "total": total}


@router.get("/{item_id}", response_model=AuctionItemDetailResponse)
async def get_auction(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get auction item detail."""
    service = AuctionService(db)
    item = await service.get_item(item_id)
    
    if not item:
        raise HTTPException(status_code=404, detail="Auction item not found")
    
    # Calculate is_highest_bidder and my_max_bid
    is_highest_bidder = False
    my_max_bid = None
    
    if item.bids:
        highest_bid = max(item.bids, key=lambda b: b.amount)
        if highest_bid.bidder_id == current_user.id:
            is_highest_bidder = True
        
        user_bids = [b.amount for b in item.bids if b.bidder_id == current_user.id]
        if user_bids:
            my_max_bid = max(user_bids)
    
    # Build response
    response = {
        **item.__dict__,
        "donor_name": item.donor.full_name if item.donor else "Unknown",
        "winner_name": item.winner.full_name if item.winner else None,
        "bid_count": len(item.bids),
        "images": item.images,
        "bids": [
            {
                **bid.__dict__,
                "bidder_name": bid.bidder.full_name if bid.bidder else "Unknown",
            }
            for bid in sorted(item.bids, key=lambda b: b.amount, reverse=True)[:10]
        ],
        "is_highest_bidder": is_highest_bidder,
        "my_max_bid": my_max_bid,
    }
    
    return response


@router.post("", response_model=AuctionItemResponse, status_code=status.HTTP_201_CREATED)
async def create_auction(
    data: AuctionItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Create a new auction item (Pengurus/Admin only)."""
    service = AuctionService(db)
    item = await service.create_item(data=data, donor_id=current_user.id)
    await db.commit()
    
    return {
        **item.__dict__,
        "donor_name": current_user.full_name,
        "winner_name": None,
        "bid_count": 0,
        "images": [],
    }


@router.patch("/{item_id}", response_model=AuctionItemResponse)
async def update_auction(
    item_id: UUID,
    data: AuctionItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Update an auction item (Pengurus/Admin only)."""
    service = AuctionService(db)
    item = await service.update_item(item_id=item_id, data=data)
    await db.commit()
    
    return {
        **item.__dict__,
        "donor_name": current_user.full_name,
        "winner_name": None,
        "bid_count": len(item.bids) if item.bids else 0,
        "images": item.images if item.images else [],
    }


@router.patch("/{item_id}/activate", response_model=AuctionItemResponse)
async def activate_auction(
    item_id: UUID,
    data: AuctionItemActivate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    """Activate an auction item (Pengurus/Admin only)."""
    service = AuctionService(db)
    item = await service.activate_item(item_id=item_id, data=data)
    await db.commit()
    
    return {
        **item.__dict__,
        "donor_name": current_user.full_name,
        "winner_name": None,
        "bid_count": len(item.bids) if item.bids else 0,
        "images": item.images if item.images else [],
    }


@router.patch("/{item_id}/cancel", response_model=AuctionItemResponse)
async def cancel_auction(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Cancel an auction (Admin only)."""
    service = AuctionService(db)
    item = await service.cancel_item(item_id=item_id)
    await db.commit()
    
    return {
        **item.__dict__,
        "donor_name": current_user.full_name,
        "winner_name": None,
        "bid_count": len(item.bids) if item.bids else 0,
        "images": item.images if item.images else [],
    }


# ============== Bid Routes ==============

@router.post("/{item_id}/bid", response_model=AuctionBidResponse, status_code=status.HTTP_201_CREATED)
async def place_bid(
    item_id: UUID,
    data: AuctionBidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Place a bid on an auction item."""
    service = AuctionService(db)
    bid = await service.place_bid(
        item_id=item_id,
        bidder_id=current_user.id,
        data=data,
    )
    await db.commit()
    
    return {
        **bid.__dict__,
        "bidder_name": current_user.full_name,
    }
