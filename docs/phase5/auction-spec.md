# Lelang Barang (Auction) Specification

> Community auction system where donated items are auctioned to raise funds for the foundation.

## Database Schema

```sql
CREATE TABLE auction_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    starting_price  DECIMAL(12, 2) NOT NULL,
    current_price   DECIMAL(12, 2) NOT NULL,
    min_increment   DECIMAL(12, 2) NOT NULL DEFAULT 5000.00,  -- Rp 5.000

    -- People
    donor_id        UUID NOT NULL REFERENCES users(id),
    winner_id       UUID REFERENCES users(id),

    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',

    -- Timing
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auction_items_status ON auction_items(status);
CREATE INDEX idx_auction_items_end_time ON auction_items(end_time);
CREATE INDEX idx_auction_items_donor ON auction_items(donor_id);

CREATE TABLE auction_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auction_images_item ON auction_images(auction_item_id);

CREATE TABLE auction_bids (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID NOT NULL REFERENCES auction_items(id),
    bidder_id       UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(12, 2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auction_bids_item ON auction_bids(auction_item_id);
CREATE INDEX idx_auction_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX idx_auction_bids_amount ON auction_bids(auction_item_id, amount DESC);
```

## Status Flow

```
draft ──> active ──> sold
              │
              ├──> expired  (no bids at end_time)
              │
              └──> cancelled
```

- **draft**: Item created by admin/pengurus, not yet visible to public.
- **active**: Auction is live, visible to all users, bids accepted.
- **sold**: Auction ended with at least one bid; highest bidder wins.
- **expired**: Auction ended with zero bids.
- **cancelled**: Admin cancelled the auction before it ended.

## Bidding Rules

1. Bid amount must be strictly greater than `current_price`.
2. Bid amount must be at least `current_price + min_increment` (default Rp 5.000).
3. Bidder cannot bid on their own donated item (`bidder_id != donor_id`).
4. Auction must have status `active` and current time must be between `start_time` and `end_time`.
5. A user can place multiple bids on the same item (each must exceed the current price).

## Concurrency Control

Use `SELECT FOR UPDATE` on the `auction_items` row when placing a bid to prevent race conditions where two users bid simultaneously.

```python
# app/services/auction_service.py (bid placement pseudocode)

async def place_bid(
    self, item_id: UUID, bidder_id: UUID, amount: Decimal
) -> AuctionBid:
    # Lock the auction item row
    item = await self.db.execute(
        select(AuctionItem)
        .where(AuctionItem.id == item_id)
        .with_for_update()
    )
    item = item.scalar_one_or_none()

    if item is None:
        raise HTTPException(404, "Auction item not found")

    if item.status != "active":
        raise HTTPException(400, "Auction is not active")

    if datetime.now(timezone.utc) > item.end_time:
        raise HTTPException(400, "Auction has ended")

    if bidder_id == item.donor_id:
        raise HTTPException(400, "Cannot bid on your own item")

    min_bid = item.current_price + item.min_increment
    if amount < min_bid:
        raise HTTPException(
            400,
            f"Bid must be at least Rp {min_bid:,.0f}"
        )

    # Create bid record
    bid = AuctionBid(
        auction_item_id=item_id,
        bidder_id=bidder_id,
        amount=amount,
    )
    self.db.add(bid)

    # Update current price
    item.current_price = amount
    item.updated_at = datetime.now(timezone.utc)

    await self.db.flush()
    await self.db.commit()

    # Notify previous highest bidder they have been outbid
    await self._notify_outbid(item_id, bidder_id)

    return bid
```

## Auto-Close (Scheduled Job)

A scheduled job runs every minute (or every 5 minutes) to close expired auctions:

```python
async def close_expired_auctions(db: AsyncSession):
    now = datetime.now(timezone.utc)

    # Find all active auctions past their end_time
    items = await db.execute(
        select(AuctionItem)
        .where(
            AuctionItem.status == "active",
            AuctionItem.end_time <= now,
        )
        .with_for_update()
    )

    for item in items.scalars():
        # Get highest bid
        highest_bid = await db.execute(
            select(AuctionBid)
            .where(AuctionBid.auction_item_id == item.id)
            .order_by(AuctionBid.amount.desc())
            .limit(1)
        )
        highest_bid = highest_bid.scalar_one_or_none()

        if highest_bid:
            item.status = "sold"
            item.winner_id = highest_bid.bidder_id
            # Send push notification to winner
            await notify_auction_won(item, highest_bid)
        else:
            item.status = "expired"

    await db.commit()
```

## Images

- Multiple images per item, stored in MinIO under `auction-images/{item_id}/`.
- Each image has a `sort_order` for display ordering.
- First image (sort_order=0) is used as the thumbnail in list views.
- Max 5 images per item, max 5MB per image.
- Accepted formats: JPEG, PNG, WebP.

## API Endpoints

| Method | Path                              | Role(s)          | Description                        |
|--------|-----------------------------------|------------------|------------------------------------|
| GET    | /auctions                         | Any authenticated| List active auctions (paginated)   |
| GET    | /auctions/{id}                    | Any authenticated| Auction detail with bid history    |
| POST   | /auctions                         | Pengurus, Admin  | Create auction item (draft)        |
| PATCH  | /auctions/{id}/activate           | Pengurus, Admin  | Set status to active               |
| POST   | /auctions/{id}/images             | Pengurus, Admin  | Upload images                      |
| POST   | /auctions/{id}/bid                | Sahabat          | Place a bid                        |
| PATCH  | /auctions/{id}/cancel             | Admin            | Cancel auction                     |
| GET    | /auctions/my-bids                 | Sahabat          | List auctions user has bid on      |

## Winner Flow

1. Auction ends, scheduled job marks item as `sold`, sets `winner_id`.
2. Push notification sent to winner: "Selamat! Anda memenangkan lelang {title} dengan harga Rp {amount}."
3. Winner receives payment instructions (transfer to foundation account).
4. Admin confirms payment, arranges item delivery/pickup.
