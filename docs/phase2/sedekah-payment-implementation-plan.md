# Sedekah Payment Implementation Plan (VA, GoPay, ShopeePay)

## Tujuan
Menambahkan metode pembayaran Sedekah menggunakan:
- Virtual Account (BCA/BNI/BRI atau sesuai channel gateway)
- GoPay
- ShopeePay

Dengan flow end-to-end yang aman, terukur, dan siap produksi.

## Scope
- Backend API pembuatan transaksi pembayaran
- Integrasi payment gateway (sandbox dan production)
- Webhook callback untuk update status pembayaran
- UI mobile untuk pilih metode, instruksi bayar, dan status pembayaran
- Monitoring, logging, dan rekonsiliasi transaksi

## 1) Pemilihan Gateway
1. Pilih provider utama: Midtrans atau Xendit.
2. Konfirmasi dukungan channel: VA + GoPay + ShopeePay.
3. Siapkan kredensial sandbox dan production.
4. Tetapkan strategi fallback jika satu channel down.

## 2) Data Model
Tambahkan entitas `payment_transactions` (terpisah dari `donations`).

Field inti:
- `id` (UUID)
- `donation_id` (FK)
- `provider` (`midtrans`/`xendit`)
- `payment_method` (`va_bca`, `va_bni`, `va_bri`, `gopay`, `shopeepay`)
- `gateway_reference_id`
- `amount`
- `status` (`pending`, `paid`, `failed`, `expired`, `cancelled`)
- `expires_at`
- `paid_at`
- `raw_request_payload` (JSON)
- `raw_response_payload` (JSON)
- `created_at`, `updated_at`

Tambahan index:
- `gateway_reference_id` unique
- `status`
- `donation_id`

## 3) Backend API
Endpoint yang perlu ditambahkan:

1. `POST /donations/{id}/payment/create`
- Input: `payment_method`
- Output: instruksi pembayaran (VA number / deeplink / QR / expiry)

2. `GET /donations/{id}/payment/status`
- Output: status transaksi payment terbaru untuk donasi tsb

3. `POST /payments/webhook/{provider}`
- Digunakan gateway callback status
- Verifikasi signature wajib

4. (Opsional) `POST /payments/{id}/cancel`
- Untuk channel yang mendukung cancel

## 4) Service Integrasi Gateway
Tambahkan service adapter agar provider-agnostic:
- `PaymentGatewayService` (interface internal)
- `MidtransPaymentService` atau `XenditPaymentService` (implementasi)

Tanggung jawab:
- create charge by channel
- parse response ke format internal
- verify webhook signature
- map status provider ke status internal

## 5) Webhook & Idempotency
Prinsip:
- Webhook adalah source of truth status pembayaran.
- Handler harus idempotent (callback duplikat tidak merusak data).

Aturan:
- Jangan downgrade status final `paid` ke status lain.
- Simpan event log webhook untuk audit.
- Invalid signature -> reject (401/403).

## 6) Update Donation State
Saat payment status `paid`:
1. Update `payment_transactions.status = paid`
2. Update status donasi (`completed/paid` sesuai domain existing)
3. Catat `paid_at`
4. Trigger notifikasi user (in-app, push optional)

## 7) Mobile App Flow
Flow UI:
1. User pilih jenis donasi Sedekah.
2. User pilih metode bayar: VA / GoPay / ShopeePay.
3. App call `POST /payment/create`.
4. Tampilkan instruksi:
- VA: nomor VA + expiry + copy button
- GoPay/ShopeePay: deeplink/redirect + fallback manual instruction
5. Halaman status payment dengan polling ringan + manual refresh.
6. Saat `paid` -> tampilkan sukses dan redirect ke riwayat donasi.

## 8) Keamanan
- Semua API key disimpan di env var.
- Jangan expose secret key ke mobile.
- Validasi signature webhook.
- Batasi log untuk data sensitif.
- Gunakan timeout/retry untuk call gateway.

## 9) Testing
Minimal test coverage:
1. Unit test status mapping provider -> internal.
2. Unit test signature verification.
3. Integration test create payment.
4. Integration test webhook (paid, expired, failed, duplicate callback).
5. Mobile E2E flow untuk VA, GoPay, ShopeePay.

## 10) Rollout Plan
1. Sandbox internal QA.
2. Staging UAT dengan skenario end-to-end.
3. Production bertahap:
- tahap 1: VA dulu
- tahap 2: GoPay + ShopeePay
4. Monitoring KPI:
- payment success rate
- pending > 30 menit
- webhook failure rate

## 11) Pertanyaan Keputusan (Sebelum Implementasi)
1. Provider final: Midtrans atau Xendit?
2. Channel VA yang wajib launch pertama?
3. Durasi expiry transaksi default (misal 24 jam)?
4. Apakah perlu biaya admin ditampilkan ke user?
5. Apakah notifikasi WhatsApp/email juga dibutuhkan selain in-app?

