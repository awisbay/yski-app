"""
Auction API Routes - Lelang Barang
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user, require_role
from app.core.media import save_upload_file
from app.models.user import User
from app.schemas.auction import (
    AuctionItemCreate,
    AuctionItemUpdate,
    AuctionBidCreate,
    AuctionItemResponse,
    AuctionItemDetailResponse,
    AuctionItemListResponse,
    AuctionBidResponse,
    AuctionBidApproveRequest,
    AuctionPaymentVerifyRequest,
)
from app.services.auction_service import AuctionService

router = APIRouter()

ALLOWED_AUCTION_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_AUCTION_IMAGE_SIZE = 8 * 1024 * 1024


def _build_item_response(item) -> dict:
    return {
        **item.__dict__,
        "donor_name": item.donor.full_name if item.donor else "Unknown",
        "winner_name": item.winner.full_name if item.winner else None,
        "bid_count": len(item.bids) if item.bids else 0,
        "images": item.images or [],
    }


@router.get("", response_model=AuctionItemListResponse)
async def list_auctions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List auctions by status bucket: ready, bidding, sold (or all)."""
    service = AuctionService(db)
    items, total = await service.list_items(skip=skip, limit=limit, search=search, status=status_filter)
    return {"items": [_build_item_response(item) for item in items], "total": total}


@router.get("/my-bids", response_model=AuctionItemListResponse)
async def list_my_bids(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AuctionService(db)
    items, total = await service.get_my_bids(user_id=current_user.id, skip=skip, limit=limit)
    return {"items": [_build_item_response(item) for item in items], "total": total}


@router.get("/{item_id}", response_model=AuctionItemDetailResponse)
async def get_auction(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AuctionService(db)
    item = await service.get_item(item_id)

    if not item:
        raise HTTPException(status_code=404, detail="Auction item not found")

    is_highest_bidder = False
    my_max_bid = None
    if item.bids:
        highest_bid = max(item.bids, key=lambda b: b.amount)
        if highest_bid.bidder_id == current_user.id:
            is_highest_bidder = True
        user_bids = [b.amount for b in item.bids if b.bidder_id == current_user.id]
        if user_bids:
            my_max_bid = max(user_bids)

    return {
        **_build_item_response(item),
        "bids": [
            {
                **bid.__dict__,
                "bidder_name": bid.bidder.full_name if bid.bidder else "Unknown",
            }
            for bid in sorted(item.bids, key=lambda b: b.amount, reverse=True)[:20]
        ],
        "is_highest_bidder": is_highest_bidder,
        "my_max_bid": my_max_bid,
    }


@router.post("", response_model=AuctionItemResponse, status_code=status.HTTP_201_CREATED)
async def create_auction(
    data: AuctionItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    service = AuctionService(db)
    item = await service.create_item(data=data, donor_id=current_user.id)
    await db.commit()
    return _build_item_response(item)


@router.post("/upload-photo")
async def upload_auction_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    photo_url = await save_upload_file(
        file=file,
        subdir="auctions/photos",
        allowed_types=ALLOWED_AUCTION_IMAGE_TYPES,
        max_size_bytes=MAX_AUCTION_IMAGE_SIZE,
    )
    return {"photo_url": photo_url}


@router.patch("/{item_id}", response_model=AuctionItemResponse)
async def update_auction(
    item_id: UUID,
    data: AuctionItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    service = AuctionService(db)
    item = await service.update_item(item_id=item_id, data=data)
    await db.commit()
    return _build_item_response(item)


@router.post("/{item_id}/bid", response_model=AuctionBidResponse, status_code=status.HTTP_201_CREATED)
async def place_bid(
    item_id: UUID,
    data: AuctionBidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AuctionService(db)
    bid = await service.place_bid(item_id=item_id, bidder_id=current_user.id, data=data)
    await db.commit()
    return {
        **bid.__dict__,
        "bidder_name": current_user.full_name,
    }


@router.patch("/{item_id}/approve-bid", response_model=AuctionItemResponse)
async def approve_bid(
    item_id: UUID,
    data: AuctionBidApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    service = AuctionService(db)
    item = await service.approve_bid(item_id=item_id, bid_id=data.bid_id, reviewer_id=current_user.id)
    await db.commit()
    return _build_item_response(item)


@router.post("/{item_id}/upload-payment-proof", response_model=AuctionItemResponse)
async def upload_payment_proof(
    item_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proof_url = await save_upload_file(
        file=file,
        subdir="auctions/payments",
        allowed_types=ALLOWED_AUCTION_IMAGE_TYPES,
        max_size_bytes=MAX_AUCTION_IMAGE_SIZE,
    )
    service = AuctionService(db)
    item = await service.upload_payment_proof(item_id=item_id, user_id=current_user.id, proof_url=proof_url)
    await db.commit()
    return _build_item_response(item)


@router.patch("/{item_id}/verify-payment", response_model=AuctionItemResponse)
async def verify_payment(
    item_id: UUID,
    data: AuctionPaymentVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "pengurus")),
):
    service = AuctionService(db)
    item = await service.verify_payment(item_id=item_id, verifier_id=current_user.id, status=data.status)
    await db.commit()
    return _build_item_response(item)
