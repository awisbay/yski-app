"""
Auction Service - Lelang Barang
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auction import AuctionBid, AuctionImage, AuctionItem
from app.models.user import User
from app.schemas.auction import AuctionBidCreate, AuctionItemCreate, AuctionItemUpdate
from app.services.notification_service import NotificationService


class AuctionService:
    """Service for managing auctions (lelang barang)."""

    MIN_INCREMENT = Decimal("5000.00")

    def __init__(self, db: AsyncSession):
        self.db = db
        self.notification_service = NotificationService(db)

    async def create_item(self, data: AuctionItemCreate, donor_id: UUID) -> AuctionItem:
        """Create auction item and mark it ready for bidding."""
        item = AuctionItem(
            title=data.title,
            description=data.description,
            starting_price=data.starting_price,
            current_price=data.starting_price,
            min_increment=data.min_increment or self.MIN_INCREMENT,
            donor_id=donor_id,
            status="ready",
            payment_status=None,
        )
        self.db.add(item)
        await self.db.flush()

        if data.image_url:
            self.db.add(
                AuctionImage(
                    auction_item_id=item.id,
                    image_url=data.image_url,
                    sort_order=0,
                )
            )
            await self.db.flush()

        return await self.get_item(item.id)

    async def get_item(self, item_id: UUID) -> Optional[AuctionItem]:
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

    async def list_items(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[List[AuctionItem], int]:
        query = select(AuctionItem).options(selectinload(AuctionItem.images), selectinload(AuctionItem.bids))

        if search:
            query = query.where(AuctionItem.title.ilike(f"%{search}%"))

        if status == "ready":
            query = query.where(AuctionItem.status == "ready")
        elif status == "bidding":
            query = query.where(AuctionItem.status.in_(["bidding", "payment_pending"]))
        elif status == "sold":
            query = query.where(AuctionItem.status == "sold")

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar() or 0

        query = query.order_by(AuctionItem.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update_item(self, item_id: UUID, data: AuctionItemUpdate) -> AuctionItem:
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")

        if item.status not in ["ready", "bidding"]:
            raise HTTPException(status_code=400, detail="Item tidak bisa diubah pada status saat ini")

        if data.title is not None:
            item.title = data.title
        if data.description is not None:
            item.description = data.description

        if data.image_url:
            existing = item.images[0] if item.images else None
            if existing:
                existing.image_url = data.image_url
            else:
                self.db.add(
                    AuctionImage(
                        auction_item_id=item.id,
                        image_url=data.image_url,
                        sort_order=0,
                    )
                )

        await self.db.flush()
        return await self.get_item(item_id)

    async def place_bid(self, item_id: UUID, bidder_id: UUID, data: AuctionBidCreate) -> AuctionBid:
        result = await self.db.execute(select(AuctionItem).where(AuctionItem.id == item_id).with_for_update())
        item = result.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")

        if item.status not in ["ready", "bidding"]:
            raise HTTPException(status_code=400, detail="Barang lelang tidak sedang dibuka untuk penawaran")

        if bidder_id == item.donor_id:
            raise HTTPException(status_code=400, detail="Tidak bisa bid untuk barang sendiri")

        min_bid = item.current_price + item.min_increment
        if data.amount < min_bid:
            raise HTTPException(status_code=400, detail=f"Bid minimal Rp {min_bid:,.0f}")

        prev_bid_result = await self.db.execute(
            select(AuctionBid)
            .where(AuctionBid.auction_item_id == item_id, AuctionBid.status.in_(["pending", "approved"]))
            .order_by(AuctionBid.amount.desc())
            .limit(1)
        )
        prev_bid = prev_bid_result.scalar_one_or_none()

        bid = AuctionBid(
            auction_item_id=item_id,
            bidder_id=bidder_id,
            amount=data.amount,
            status="pending",
        )
        self.db.add(bid)

        item.current_price = data.amount
        item.status = "bidding"

        await self.db.flush()

        if prev_bid and prev_bid.bidder_id != bidder_id:
            await self.notification_service.create_notification(
                user_id=prev_bid.bidder_id,
                title="Tawaran Anda Dilewati",
                body=f"Ada tawaran lebih tinggi untuk '{item.title}'.",
                type="auction_outbid",
                reference_type="auction",
                reference_id=item_id,
            )

        return bid

    async def approve_bid(self, item_id: UUID, bid_id: UUID, reviewer_id: UUID) -> AuctionItem:
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")

        if item.status not in ["bidding", "ready"]:
            raise HTTPException(status_code=400, detail="Barang lelang tidak dalam fase penawaran")

        approved_bid = None
        for bid in item.bids:
            if bid.id == bid_id:
                approved_bid = bid
                break

        if not approved_bid:
            raise HTTPException(status_code=404, detail="Bid tidak ditemukan")

        now = datetime.now(timezone.utc)
        for bid in item.bids:
            bid.reviewed_by = reviewer_id
            bid.reviewed_at = now
            bid.status = "approved" if bid.id == bid_id else "rejected"

        item.winner_id = approved_bid.bidder_id
        item.current_price = approved_bid.amount
        item.status = "payment_pending"
        item.payment_status = "awaiting_payment"

        await self.db.flush()

        await self.notification_service.create_notification(
            user_id=approved_bid.bidder_id,
            title="Bid Anda Disetujui",
            body=f"Anda memenangkan sementara '{item.title}'. Silakan upload bukti transfer.",
            type="auction_won",
            reference_type="auction",
            reference_id=item.id,
        )

        return await self.get_item(item_id)

    async def upload_payment_proof(self, item_id: UUID, user_id: UUID, proof_url: str) -> AuctionItem:
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")

        if item.winner_id != user_id:
            raise HTTPException(status_code=403, detail="Hanya pemenang bid yang bisa upload bukti transfer")

        if item.status != "payment_pending":
            raise HTTPException(status_code=400, detail="Barang ini belum masuk tahap pembayaran")

        item.payment_proof_url = proof_url
        item.payment_status = "awaiting_verification"
        await self.db.flush()

        # Notify admin + pengurus to verify payment proof.
        result = await self.db.execute(
            select(User.id).where(User.role.in_(["admin", "pengurus"]), User.is_active == True)  # noqa: E712
        )
        manager_ids = [row[0] for row in result.all()]
        if manager_ids:
            await self.notification_service.create_bulk_notifications(
                user_ids=manager_ids,
                title="Bukti Pembayaran Lelang",
                body=f"Pemenang lelang '{item.title}' sudah upload bukti transfer.",
                type="info",
                reference_type="auction",
                reference_id=item.id,
            )

        return await self.get_item(item_id)

    async def verify_payment(self, item_id: UUID, verifier_id: UUID, status: str) -> AuctionItem:
        item = await self.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Auction item not found")

        if item.status != "payment_pending":
            raise HTTPException(status_code=400, detail="Barang bukan pada tahap verifikasi pembayaran")

        if status not in ["paid", "rejected"]:
            raise HTTPException(status_code=400, detail="Status verifikasi tidak valid")

        item.payment_status = status
        item.payment_verified_by = verifier_id
        item.payment_verified_at = datetime.now(timezone.utc)

        if status == "paid":
            item.status = "sold"
            if item.winner_id:
                await self.notification_service.create_notification(
                    user_id=item.winner_id,
                    title="Pembayaran Lelang Diterima",
                    body=f"Pembayaran untuk '{item.title}' telah dikonfirmasi.",
                    type="success",
                    reference_type="auction",
                    reference_id=item.id,
                )
        else:
            item.payment_status = "rejected"
            if item.winner_id:
                await self.notification_service.create_notification(
                    user_id=item.winner_id,
                    title="Pembayaran Lelang Ditolak",
                    body=f"Bukti transfer '{item.title}' ditolak. Silakan upload ulang.",
                    type="warning",
                    reference_type="auction",
                    reference_id=item.id,
                )

        await self.db.flush()
        return await self.get_item(item_id)

    async def get_my_bids(self, user_id: UUID, skip: int = 0, limit: int = 20) -> tuple[List[AuctionItem], int]:
        subquery = (
            select(AuctionBid.auction_item_id)
            .where(AuctionBid.bidder_id == user_id)
            .distinct()
            .subquery()
        )

        query = (
            select(AuctionItem)
            .options(selectinload(AuctionItem.images), selectinload(AuctionItem.bids))
            .join(subquery, AuctionItem.id == subquery.c.auction_item_id)
        )

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar() or 0

        query = query.order_by(AuctionItem.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def close_expired_auctions(self) -> int:
        """Legacy scheduler: no-op for manual review flow."""
        return 0
