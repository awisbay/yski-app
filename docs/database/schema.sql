-- ============================================================
-- Yayasan Sahabat Khairat Indonesia - Database Schema
-- Yayasan Sahabat Khairat (sahabatkhairat.or.id)
-- PostgreSQL 16
-- ============================================================

-- ============================================================
-- 1. USERS & RBAC
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   TEXT NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin','pengurus','relawan','sahabat')),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id              SERIAL PRIMARY KEY,
    role            VARCHAR(20) NOT NULL,
    resource        VARCHAR(100) NOT NULL,   -- e.g. 'booking', 'inventory', 'donation'
    action          VARCHAR(50) NOT NULL,     -- e.g. 'create', 'read', 'update', 'delete', 'approve'
    UNIQUE(role, resource, action)
);

-- ============================================================
-- 2. BOOKING PINDAHAN (Anti Double-Booking)
-- ============================================================

CREATE TABLE moving_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id    UUID NOT NULL REFERENCES users(id),
    booking_date    DATE NOT NULL,
    time_slot       VARCHAR(5) NOT NULL CHECK (time_slot IN ('08:00','10:00','13:00','15:00')),

    pickup_address  TEXT NOT NULL,
    pickup_lat      DECIMAL(10,8),
    pickup_lng      DECIMAL(11,8),
    dest_address    TEXT NOT NULL,
    dest_lat        DECIMAL(10,8),
    dest_lng        DECIMAL(11,8),

    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','in_progress','completed','cancelled')),

    approved_by     UUID REFERENCES users(id),
    assigned_to     UUID REFERENCES users(id),  -- relawan
    rejection_reason TEXT,
    notes           TEXT,
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    review_text     TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- ANTI DOUBLE-BOOKING: unique constraint per tanggal + slot
    UNIQUE(booking_date, time_slot)
);

CREATE INDEX idx_booking_date_status ON moving_bookings(booking_date, status);
CREATE INDEX idx_booking_requester ON moving_bookings(requester_id);

-- ============================================================
-- 3. INVENTARIS ALAT KESEHATAN (ALKES)
-- ============================================================

CREATE TABLE medical_equipment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,          -- "Kursi Roda", "Tabung Oksigen"
    description     TEXT,
    image_url       TEXT,
    total_qty       INT NOT NULL DEFAULT 0,
    category        VARCHAR(100),                    -- wheelchair, oxygen_tank, hospital_bed
    condition_notes TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_loans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id    UUID NOT NULL REFERENCES medical_equipment(id),
    borrower_id     UUID NOT NULL REFERENCES users(id),

    status          VARCHAR(20) NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','approved','active','returned','overdue','rejected')),

    approved_by     UUID REFERENCES users(id),
    loan_date       DATE,
    expected_return DATE,
    actual_return   DATE,
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_equipment_status ON equipment_loans(equipment_id, status);

-- View untuk stok real-time
CREATE VIEW equipment_stock AS
SELECT
    me.id,
    me.name,
    me.image_url,
    me.total_qty,
    me.total_qty - COALESCE(active.count, 0) AS available,
    COALESCE(active.count, 0) AS on_loan,
    COALESCE(pending.count, 0) AS pending_requests
FROM medical_equipment me
LEFT JOIN (
    SELECT equipment_id, COUNT(*) as count
    FROM equipment_loans WHERE status IN ('active','approved')
    GROUP BY equipment_id
) active ON me.id = active.equipment_id
LEFT JOIN (
    SELECT equipment_id, COUNT(*) as count
    FROM equipment_loans WHERE status = 'requested'
    GROUP BY equipment_id
) pending ON me.id = pending.equipment_id;

-- ============================================================
-- 4. DONASI & INFAQ
-- ============================================================

CREATE TABLE donations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_code   VARCHAR(20) UNIQUE NOT NULL,    -- "CKY-12345678"
    donor_id        UUID REFERENCES users(id),      -- nullable untuk donatur anonim
    donor_name      VARCHAR(255),

    amount          DECIMAL(15,2) NOT NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('infaq','zakat_mal','zakat_fitrah','sedekah')),
    payment_method  VARCHAR(30) NOT NULL
                    CHECK (payment_method IN ('qris','gopay','ovo','shopeepay','bca_va','mandiri_va','bni_va')),
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','paid','expired','failed','refunded')),

    payment_gateway_ref TEXT,                       -- ref ID dari Midtrans/Xendit
    paid_at         TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donation_status ON donations(payment_status, created_at);

-- ============================================================
-- 5. JEMPUT ZAKAT & KENCLENG
-- ============================================================

CREATE TABLE pickup_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_name  VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20) NOT NULL,

    donation_type   VARCHAR(20) NOT NULL CHECK (donation_type IN ('zakat','kencleng_infaq')),

    pickup_address  TEXT NOT NULL,
    pickup_lat      DECIMAL(10,8),
    pickup_lng      DECIMAL(11,8),

    preferred_date  DATE,                           -- opsional
    preferred_slot  VARCHAR(20),                    -- '09:00-12:00', '13:00-15:00', '16:00-18:00'

    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','scheduled','in_progress','completed','cancelled')),

    scheduled_date  DATE,
    scheduled_slot  VARCHAR(20),
    assigned_to     UUID REFERENCES users(id),      -- relawan
    approved_by     UUID REFERENCES users(id),      -- pengurus

    collected_amount DECIMAL(15,2),
    proof_photo_url TEXT,
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. LELANG BARANG BEKAS (Social Commerce)
-- ============================================================

CREATE TABLE auction_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    starting_price  DECIMAL(15,2) NOT NULL,
    current_price   DECIMAL(15,2),

    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','sold','expired','cancelled')),

    donor_id        UUID REFERENCES users(id),
    winner_id       UUID REFERENCES users(id),

    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auction_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    sort_order      INT DEFAULT 0
);

CREATE TABLE auction_bids (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID NOT NULL REFERENCES auction_items(id),
    bidder_id       UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PROGRAM SOSIAL & BERITA
-- ============================================================

CREATE TABLE programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    cover_image_url TEXT,
    category        VARCHAR(50),                    -- kesehatan, bantuan, edukasi
    status          VARCHAR(20) DEFAULT 'active',
    participant_count INT DEFAULT 0,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    cover_image_url TEXT,
    category        VARCHAR(50),                    -- kesehatan, bantuan, edukasi
    author_id       UUID REFERENCES users(id),
    is_published    BOOLEAN DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. LAPORAN KEUANGAN
-- ============================================================

CREATE TABLE financial_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    total_income    DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_expense   DECIMAL(15,2) NOT NULL DEFAULT 0,
    report_pdf_url  TEXT,
    is_audited      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE financial_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES financial_reports(id),
    category        VARCHAR(100) NOT NULL,          -- donasi_masuk, operasional, penyaluran, dll
    type            VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
    amount          DECIMAL(15,2) NOT NULL,
    description     TEXT,
    reference_id    UUID,                           -- link ke donation/auction/dll
    reference_type  VARCHAR(50),
    entry_date      DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. NOTIFIKASI
-- ============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    type            VARCHAR(50),                    -- booking, donation, pickup, loan, auction
    reference_id    UUID,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 10. SEED DATA: Role Permissions
-- ============================================================

INSERT INTO role_permissions (role, resource, action) VALUES
-- Admin: full access
('admin', 'user', 'create'), ('admin', 'user', 'read'), ('admin', 'user', 'update'), ('admin', 'user', 'delete'),
('admin', 'booking', 'create'), ('admin', 'booking', 'read'), ('admin', 'booking', 'update'), ('admin', 'booking', 'delete'), ('admin', 'booking', 'approve'),
('admin', 'equipment', 'create'), ('admin', 'equipment', 'read'), ('admin', 'equipment', 'update'), ('admin', 'equipment', 'delete'),
('admin', 'loan', 'read'), ('admin', 'loan', 'approve'), ('admin', 'loan', 'update'),
('admin', 'donation', 'read'), ('admin', 'donation', 'update'),
('admin', 'pickup', 'read'), ('admin', 'pickup', 'update'), ('admin', 'pickup', 'approve'),
('admin', 'auction', 'create'), ('admin', 'auction', 'read'), ('admin', 'auction', 'update'), ('admin', 'auction', 'delete'),
('admin', 'news', 'create'), ('admin', 'news', 'read'), ('admin', 'news', 'update'), ('admin', 'news', 'delete'),
('admin', 'program', 'create'), ('admin', 'program', 'read'), ('admin', 'program', 'update'), ('admin', 'program', 'delete'),
('admin', 'financial', 'create'), ('admin', 'financial', 'read'), ('admin', 'financial', 'update'),
('admin', 'notification', 'read'), ('admin', 'notification', 'update'),

-- Pengurus: manage operations
('pengurus', 'booking', 'read'), ('pengurus', 'booking', 'update'), ('pengurus', 'booking', 'approve'),
('pengurus', 'equipment', 'read'), ('pengurus', 'equipment', 'update'),
('pengurus', 'loan', 'read'), ('pengurus', 'loan', 'approve'), ('pengurus', 'loan', 'update'),
('pengurus', 'donation', 'read'),
('pengurus', 'pickup', 'read'), ('pengurus', 'pickup', 'update'), ('pengurus', 'pickup', 'approve'),
('pengurus', 'auction', 'create'), ('pengurus', 'auction', 'read'), ('pengurus', 'auction', 'update'),
('pengurus', 'news', 'create'), ('pengurus', 'news', 'read'), ('pengurus', 'news', 'update'),
('pengurus', 'program', 'create'), ('pengurus', 'program', 'read'), ('pengurus', 'program', 'update'),
('pengurus', 'financial', 'read'),
('pengurus', 'notification', 'read'), ('pengurus', 'notification', 'update'),

-- Relawan: view assigned tasks, update status
('relawan', 'booking', 'read'), ('relawan', 'booking', 'update'),
('relawan', 'pickup', 'read'), ('relawan', 'pickup', 'update'),
('relawan', 'equipment', 'read'),
('relawan', 'news', 'read'),
('relawan', 'program', 'read'), ('relawan', 'program', 'join'),
('relawan', 'auction', 'read'),
('relawan', 'financial', 'read'),
('relawan', 'notification', 'read'), ('relawan', 'notification', 'update'),

-- Sahabat: consumer actions
('sahabat', 'booking', 'create'), ('sahabat', 'booking', 'read'),
('sahabat', 'equipment', 'read'),
('sahabat', 'loan', 'create'), ('sahabat', 'loan', 'read'),
('sahabat', 'donation', 'create'), ('sahabat', 'donation', 'read'),
('sahabat', 'pickup', 'create'), ('sahabat', 'pickup', 'read'),
('sahabat', 'auction', 'read'), ('sahabat', 'auction', 'bid'),
('sahabat', 'news', 'read'),
('sahabat', 'program', 'read'), ('sahabat', 'program', 'join'),
('sahabat', 'financial', 'read'),
('sahabat', 'notification', 'read'), ('sahabat', 'notification', 'update');
