# API Contract: Auctions (Lelang Barang)

> Base URL: `/api/v1/auctions`

---

## GET /auctions

List active auction items.

**Auth:** Required (any role)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | string | `active` | Filter: `draft`, `active`, `sold`, `expired`, `cancelled` |
| `search` | string | - | Search by title |

**Response: 200 OK**
```json
{
  "data": {
    "items": [
      {
        "id": "au1-uuid-...",
        "title": "Sepeda Lipat Bekas Pakai",
        "description": "Sepeda lipat dalam kondisi baik, cocok untuk transportasi harian",
        "starting_price": 200000.00,
        "current_price": 350000.00,
        "min_increment": 5000.00,
        "donor_id": "uuid-donor-...",
        "donor_name": "Bapak Hasan",
        "winner_id": null,
        "winner_name": null,
        "status": "active",
        "start_time": "2026-02-15T08:00:00Z",
        "end_time": "2026-02-22T20:00:00Z",
        "images": [
          {
            "id": "img1-uuid-...",
            "image_url": "https://storage.clicky.or.id/auctions/sepeda-1.jpg",
            "sort_order": 0,
            "created_at": "2026-02-15T07:00:00Z"
          },
          {
            "id": "img2-uuid-...",
            "image_url": "https://storage.clicky.or.id/auctions/sepeda-2.jpg",
            "sort_order": 1,
            "created_at": "2026-02-15T07:00:00Z"
          }
        ],
        "bid_count": 5,
        "created_at": "2026-02-14T10:00:00Z",
        "updated_at": "2026-02-18T14:00:00Z"
      }
    ],
    "total": 3
  }
}
```

---

## GET /auctions/my-bids

Get current user's bids across all auctions.

**Auth:** Required (any role)

**Response: 200 OK**
```json
{
  "data": [
    {
      "auction_item_id": "au1-uuid-...",
      "auction_title": "Sepeda Lipat Bekas Pakai",
      "auction_status": "active",
      "auction_image_url": "https://storage.clicky.or.id/auctions/sepeda-1.jpg",
      "my_bid_amount": 300000.00,
      "current_price": 350000.00,
      "is_winning": false,
      "bid_count": 5,
      "end_time": "2026-02-22T20:00:00Z"
    }
  ]
}
```

---

## GET /auctions/{item_id}

Get auction item detail with bid history.

**Auth:** Required (any role)

**Response: 200 OK**
```json
{
  "data": {
    "id": "au1-uuid-...",
    "title": "Sepeda Lipat Bekas Pakai",
    "description": "Sepeda lipat dalam kondisi baik, cocok untuk transportasi harian",
    "starting_price": 200000.00,
    "current_price": 350000.00,
    "min_increment": 5000.00,
    "donor_id": "uuid-donor-...",
    "donor_name": "Bapak Hasan",
    "winner_id": null,
    "winner_name": null,
    "status": "active",
    "start_time": "2026-02-15T08:00:00Z",
    "end_time": "2026-02-22T20:00:00Z",
    "images": [ "...array of images..." ],
    "bid_count": 5,
    "bids": [
      {
        "id": "bid1-uuid-...",
        "bidder_id": "uuid-bidder-1",
        "bidder_name": "Ahmad",
        "amount": 350000.00,
        "created_at": "2026-02-18T14:00:00Z"
      },
      {
        "id": "bid2-uuid-...",
        "bidder_id": "uuid-bidder-2",
        "bidder_name": "Siti",
        "amount": 300000.00,
        "created_at": "2026-02-17T11:00:00Z"
      }
    ],
    "is_highest_bidder": false,
    "my_max_bid": 250000.00,
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-18T14:00:00Z"
  }
}
```

---

## POST /auctions

Create a new auction item.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "title": "Mesin Cuci Bekas",
  "description": "Mesin cuci 1 tabung, masih berfungsi normal",
  "starting_price": 150000.00,
  "min_increment": 10000.00
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "au2-uuid-...",
    "title": "Mesin Cuci Bekas",
    "description": "Mesin cuci 1 tabung, masih berfungsi normal",
    "starting_price": 150000.00,
    "current_price": 150000.00,
    "min_increment": 10000.00,
    "donor_id": "uuid-admin-...",
    "donor_name": "Admin YSKI",
    "status": "draft",
    "images": [],
    "bid_count": 0,
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": "2026-02-18T10:00:00Z"
  },
  "message": "Auction item created successfully"
}
```

---

## PUT /auctions/{item_id}

Update auction item (draft only).

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "title": "Mesin Cuci Bekas - Samsung",
  "description": "Updated description"
}
```

**Response: 200 OK** — Updated auction object.

**Error: 400**
```json
{
  "detail": "Cannot update active auction",
  "code": "AUCTION_ACTIVE"
}
```

---

## POST /auctions/{item_id}/activate

Activate a draft auction with time window.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "start_time": "2026-02-20T08:00:00Z",
  "end_time": "2026-02-27T20:00:00Z"
}
```

**Validation:**
- `start_time` must be in the future
- `end_time` must be after `start_time`
- Minimum auction duration: 24 hours
- Item must have at least 1 image

**Response: 200 OK**
```json
{
  "data": {
    "...auction object...",
    "status": "active",
    "start_time": "2026-02-20T08:00:00Z",
    "end_time": "2026-02-27T20:00:00Z"
  },
  "message": "Auction activated successfully"
}
```

---

## POST /auctions/{item_id}/bid

Place a bid on an auction item.

**Auth:** Required (sahabat, relawan, pengurus — any non-donor)

**Request Body:**
```json
{
  "amount": 400000.00
}
```

**Validation Rules:**
- Auction must be `active` and within time window
- `amount` must be ≥ `current_price` + `min_increment`
- Bidder cannot be the item donor
- Bid is processed atomically (SELECT FOR UPDATE)

**Response: 200 OK**
```json
{
  "data": {
    "id": "bid3-uuid-...",
    "bidder_id": "uuid-bidder-...",
    "bidder_name": "Ahmad",
    "amount": 400000.00,
    "created_at": "2026-02-18T15:00:00Z"
  },
  "message": "Bid placed successfully"
}
```

**Side Effects:**
- `current_price` updated to new bid amount
- Notification sent to previous highest bidder ("You've been outbid")
- Notification sent to item donor ("New bid received")

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | BID_TOO_LOW | Amount < current_price + min_increment |
| 400 | AUCTION_NOT_ACTIVE | Auction is not active |
| 400 | AUCTION_EXPIRED | Auction end_time has passed |
| 403 | SELF_BID | Cannot bid on own donated item |

---

## Status Workflow

```
draft ──→ active     (admin/pengurus activates with time window)
active ──→ sold      (auto-close: has bids at end_time → winner assigned)
active ──→ expired   (auto-close: no bids at end_time)
draft ──→ cancelled  (admin cancels before activation)
active ──→ cancelled (admin cancels during auction)
```

**Auto-Close Job (Celery Beat):**
- Runs every 1 minute
- Checks for active auctions past `end_time`
- If bids exist: status → `sold`, `winner_id` → highest bidder
- If no bids: status → `expired`
- Notifications sent to winner and donor

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | BID_TOO_LOW | Bid amount is below minimum |
| 400 | AUCTION_NOT_ACTIVE | Auction is not active |
| 400 | AUCTION_EXPIRED | Auction has ended |
| 400 | AUCTION_ACTIVE | Cannot modify active auction |
| 400 | NO_IMAGES | Cannot activate auction without images |
| 403 | SELF_BID | Cannot bid on own item |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | AUCTION_NOT_FOUND | Auction item ID does not exist |
