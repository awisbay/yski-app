# Notification System Specification

> In-app and push notification system for real-time updates on bookings, donations, auctions, and more.

## Database Schema

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),

    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL,

    -- Reference to the related entity
    reference_type  VARCHAR(50),  -- 'booking', 'donation', 'pickup', 'loan', 'auction'
    reference_id    UUID,

    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE push_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token           TEXT NOT NULL UNIQUE,
    device_type     VARCHAR(10) NOT NULL,  -- 'ios', 'android'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
```

## Notification Types

| Type                  | Trigger                                           | Title Example                                    |
|-----------------------|---------------------------------------------------|--------------------------------------------------|
| booking_approved      | Pengurus approves a booking                       | "Booking Disetujui"                              |
| booking_rejected      | Pengurus rejects a booking                        | "Booking Ditolak"                                |
| booking_assigned      | Relawan assigned to booking                       | "Relawan Ditugaskan"                             |
| booking_completed     | Booking marked completed                          | "Pindahan Selesai"                               |
| donation_confirmed    | Donation payment confirmed                        | "Donasi Dikonfirmasi"                            |
| pickup_scheduled      | Zakat pickup scheduled                            | "Jadwal Penjemputan Zakat"                       |
| pickup_completed      | Zakat pickup completed                            | "Penjemputan Selesai"                            |
| loan_approved         | Equipment loan approved                           | "Peminjaman Disetujui"                           |
| loan_returned         | Equipment returned and confirmed                  | "Pengembalian Dikonfirmasi"                      |
| loan_overdue          | Equipment loan past due date                      | "Peminjaman Jatuh Tempo"                         |
| auction_outbid        | Another user placed a higher bid                  | "Anda Telah Dilewati"                            |
| auction_won           | User won an auction                               | "Selamat! Anda Memenangkan Lelang"               |
| auction_ended         | Auction user participated in has ended            | "Lelang Telah Berakhir"                          |

## Push Token Management

```python
# Register push token on mobile app login
async def register_push_token(
    self, user_id: UUID, token: str, device_type: str
) -> PushToken:
    # Upsert: if token exists, update user_id; if user has old token, replace
    existing = await self.db.execute(
        select(PushToken).where(PushToken.token == token)
    )
    push_token = existing.scalar_one_or_none()

    if push_token:
        push_token.user_id = user_id
        push_token.updated_at = datetime.now(timezone.utc)
    else:
        push_token = PushToken(
            user_id=user_id,
            token=token,
            device_type=device_type,
        )
        self.db.add(push_token)

    await self.db.commit()
    return push_token
```

## Notification Service

```python
# app/services/notification_service.py

import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class NotificationService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_and_send(
        self,
        user_id: UUID,
        title: str,
        body: str,
        type: str,
        reference_type: str = None,
        reference_id: UUID = None,
    ) -> Notification:
        # 1. Store in database (in-app notification)
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            type=type,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        self.db.add(notification)
        await self.db.commit()

        # 2. Send push notification via Expo
        await self._send_push(user_id, title, body)

        return notification

    async def _send_push(self, user_id: UUID, title: str, body: str):
        # Get user's push tokens
        tokens = await self.db.execute(
            select(PushToken.token).where(PushToken.user_id == user_id)
        )
        token_list = [row[0] for row in tokens.all()]

        if not token_list:
            return

        messages = [
            {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
            }
            for token in token_list
        ]

        async with httpx.AsyncClient() as client:
            await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={"Content-Type": "application/json"},
            )

    async def get_notifications(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> dict:
        # Get notifications
        q = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(q)
        notifications = result.scalars().all()

        # Get unread count
        unread_q = select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        unread_count = (await self.db.execute(unread_q)).scalar()

        return {
            "notifications": notifications,
            "unread_count": unread_count,
        }

    async def mark_read(self, notification_id: UUID, user_id: UUID):
        notification = await self.db.get(Notification, notification_id)
        if notification and notification.user_id == user_id:
            notification.is_read = True
            await self.db.commit()

    async def mark_all_read(self, user_id: UUID):
        await self.db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True)
        )
        await self.db.commit()
```

## Trigger Points

Each trigger point calls `NotificationService.create_and_send()`:

1. **Booking approved/rejected**: In `BookingService.approve()` / `.reject()`
2. **Relawan assigned**: In `BookingService.assign_relawan()`
3. **Booking completed**: In `BookingService.update_status()` when status becomes `completed`
4. **Donation paid**: In payment webhook handler when donation confirmed
5. **Pickup scheduled/completed**: In `PickupService.schedule()` / `.complete()`
6. **Loan approved/returned**: In `EquipmentService.approve_loan()` / `.confirm_return()`
7. **Loan overdue**: In scheduled overdue check job
8. **Auction outbid**: In `AuctionService.place_bid()` (notify previous highest bidder)
9. **Auction won/ended**: In auction auto-close scheduled job

## API Endpoints

| Method | Path                              | Role(s)          | Description                        |
|--------|-----------------------------------|------------------|------------------------------------|
| GET    | /notifications                    | Any authenticated| List user's notifications          |
| PATCH  | /notifications/{id}/read          | Owner            | Mark single notification as read   |
| PATCH  | /notifications/read-all           | Any authenticated| Mark all notifications as read     |
| GET    | /notifications/unread-count       | Any authenticated| Get unread notification count      |
| POST   | /notifications/push-token         | Any authenticated| Register push token                |
| DELETE | /notifications/push-token         | Any authenticated| Remove push token (on logout)      |

## Mobile Integration

On the React Native side:

```typescript
// Register for push notifications on login
import * as Notifications from 'expo-notifications';

async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  });

  await api.post('/notifications/push-token', {
    token: token.data,
    device_type: Platform.OS,
  });
}
```

## Unread Badge

- The unread count is returned with the notification list response.
- Mobile app displays badge count on the notification tab icon.
- Badge count is also set via push notification payload for OS-level badge display.
