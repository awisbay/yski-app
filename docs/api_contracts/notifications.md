# API Contract: Notifications

> Base URL: `/api/v1/notifications`

---

## POST /notifications/push-token

Register Expo push notification token.

**Auth:** Required (any role)

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "ios"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `token` | string | Yes | Valid Expo push token format |
| `device_type` | string | Yes | `ios` or `android` |

**Response: 201 Created**
```json
{
  "data": {
    "id": "pt1-uuid-...",
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "device_type": "ios",
    "created_at": "2026-02-18T10:00:00Z"
  },
  "message": "Push token registered successfully"
}
```

**Notes:**
- If token already exists for this user, it is updated (upsert)
- On logout, token should be deleted

---

## GET /notifications

List current user's notifications.

**Auth:** Required (any role)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `is_read` | bool | - | Filter read/unread |
| `type` | string | - | Filter: `booking`, `donation`, `pickup`, `loan`, `auction` |

**Response: 200 OK**
```json
{
  "data": {
    "notifications": [
      {
        "id": "n1-uuid-...",
        "user_id": "uuid-user-...",
        "title": "Booking Disetujui",
        "body": "Booking pindahan Anda untuk tanggal 25 Feb 2026 telah disetujui",
        "type": "booking",
        "reference_type": "moving_booking",
        "reference_id": "uuid-booking-...",
        "is_read": false,
        "created_at": "2026-02-18T14:00:00Z"
      },
      {
        "id": "n2-uuid-...",
        "user_id": "uuid-user-...",
        "title": "Donasi Terverifikasi",
        "body": "Donasi infaq sebesar Rp 100.000 telah diverifikasi. Jazakallahu khairan!",
        "type": "donation",
        "reference_type": "donation",
        "reference_id": "uuid-donation-...",
        "is_read": true,
        "created_at": "2026-02-17T10:00:00Z"
      }
    ],
    "unread_count": 3,
    "total": 25
  }
}
```

---

## PUT /notifications/{id}/read

Mark a notification as read.

**Auth:** Required (notification owner)

**Request Body:**
```json
{
  "is_read": true
}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "n1-uuid-...",
    "is_read": true
  },
  "message": "Notification marked as read"
}
```

---

## GET /notifications/unread-count

Get unread notification count (for badge display).

**Auth:** Required (any role)

**Response: 200 OK**
```json
{
  "data": {
    "count": 3
  }
}
```

---

## Notification Types & Triggers

### Booking Notifications

| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| Booking created | Admin, Pengurus | Booking Baru | `{name}` mengajukan booking pindahan tanggal `{date}` |
| Booking approved | Requester | Booking Disetujui | Booking pindahan Anda untuk `{date}` telah disetujui |
| Booking rejected | Requester | Booking Ditolak | Booking pindahan Anda untuk `{date}` ditolak. Alasan: `{reason}` |
| Booking assigned | Relawan | Tugas Baru | Anda ditugaskan untuk booking pindahan tanggal `{date}` |
| Booking completed | Requester | Booking Selesai | Layanan pindahan Anda telah selesai. Berikan rating! |

### Donation Notifications

| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| Donation created | Admin, Pengurus | Donasi Masuk | Donasi `{type}` sebesar Rp `{amount}` dari `{name}` |
| Donation verified | Donor | Donasi Terverifikasi | Donasi `{type}` sebesar Rp `{amount}` telah diverifikasi. Jazakallahu khairan! |
| Donation expired | Donor | Donasi Kedaluwarsa | Donasi Anda belum dikonfirmasi dan telah kedaluwarsa |

### Pickup Notifications

| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| Pickup requested | Admin, Pengurus | Permintaan Jemput | Permintaan jemput `{type}` dari `{name}` di `{address}` |
| Pickup scheduled | Requester | Jadwal Jemput | Penjemputan dijadwalkan `{date}` `{slot}` |
| Pickup scheduled | Relawan | Tugas Jemput | Anda ditugaskan menjemput `{type}` di `{address}` pada `{date}` |
| Pickup completed | Requester | Jemput Selesai | Penjemputan `{type}` telah selesai. Terima kasih! |

### Equipment Loan Notifications

| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| Loan requested | Admin, Pengurus | Permintaan Pinjam | `{name}` mengajukan pinjaman `{equipment}` |
| Loan approved | Borrower | Pinjaman Disetujui | Pinjaman `{equipment}` disetujui. Silakan ambil di kantor |
| Loan rejected | Borrower | Pinjaman Ditolak | Pinjaman `{equipment}` ditolak. Alasan: `{reason}` |
| Loan overdue | Borrower | Pinjaman Terlambat | Pinjaman `{equipment}` sudah melewati tanggal pengembalian |
| Loan overdue | Admin, Pengurus | Pinjaman Terlambat | `{name}` belum mengembalikan `{equipment}` (jatuh tempo `{date}`) |

### Auction Notifications

| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| New bid | Donor (item owner) | Bid Baru | `{bidder}` menawar `{item}` sebesar Rp `{amount}` |
| Outbid | Previous highest bidder | Anda Tersaingi | Tawaran Anda di `{item}` telah disaingi. Harga sekarang Rp `{amount}` |
| Auction won | Winner | Selamat! Anda Menang | Anda memenangkan lelang `{item}` dengan harga Rp `{amount}` |
| Auction ended (sold) | Donor | Lelang Terjual | `{item}` terjual ke `{winner}` seharga Rp `{amount}` |
| Auction ended (expired) | Donor | Lelang Berakhir | `{item}` tidak mendapat tawaran dan telah berakhir |
| Auction ending soon | All bidders | Lelang Segera Berakhir | Lelang `{item}` berakhir dalam 1 jam! |

### Financial Notifications

| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| Report published | All users | Laporan Keuangan Baru | Laporan keuangan periode `{period}` telah dipublikasikan |

---

## Push Notification Delivery

```
1. Event occurs (booking approved, donation verified, etc.)
2. Service creates Notification record in database
3. Celery task queued to send push notification
4. Worker fetches user's push tokens from push_tokens table
5. Worker sends via Expo Push API
6. Success/failure logged
7. If delivery fails, retry up to 3 times
8. Invalid tokens (DeviceNotRegistered) auto-cleaned from DB
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_TOKEN | Push token format invalid |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 403 | FORBIDDEN | Cannot mark another user's notification |
| 404 | NOTIFICATION_NOT_FOUND | Notification ID does not exist |
