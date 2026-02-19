# Phase 6: WordPress Integration - Backlog

> Daftar task dan acceptance criteria detail untuk Phase 6.

**Prerequisite:** Phase 5 selesai — semua API endpoints tersedia.

---

## Epic 1: Plugin Skeleton & Admin Configuration

### US-6.01: Plugin Activation & Setup
**Sebagai** admin WordPress,
**Saya ingin** menginstall dan mengaktifkan plugin Yayasan Sahabat Khairat Indonesia,
**Agar** website WordPress bisa terkoneksi dengan backend FastAPI.

**Acceptance Criteria:**
- [ ] Plugin muncul di daftar Plugins WordPress
- [ ] Aktivasi membuat custom tables (`clicky_sync_logs`, `clicky_financial_reports`)
- [ ] Aktivasi men-set default options (sync interval: hourly, debug: off)
- [ ] Admin notice muncul jika API URL belum dikonfigurasi
- [ ] Deaktivasi membersihkan cron events
- [ ] Uninstall menghapus semua data plugin (tables, options, transients)
- [ ] Minimum requirements check: PHP 7.4+, WP 5.8+

### US-6.02: Settings Page
**Sebagai** admin WordPress,
**Saya ingin** mengkonfigurasi koneksi API dan sync settings,
**Agar** plugin bisa berkomunikasi dengan backend Yayasan Sahabat Khairat Indonesia.

**Acceptance Criteria:**
- [ ] Settings page tersedia di Settings > Yayasan Sahabat Khairat Indonesia
- [ ] Field API Base URL dengan validasi URL format
- [ ] Field API Key dengan input type password (masked)
- [ ] Field Webhook Secret dengan input type password
- [ ] Dropdown Sync Interval (15 min, 30 min, hourly, daily)
- [ ] Checkboxes Content Types to Sync (Programs, News, Financial Reports)
- [ ] Toggle Debug Mode
- [ ] Tombol "Test Connection" — menampilkan success/error message
- [ ] Tombol "Force Sync Now" — trigger immediate sync
- [ ] Display last sync timestamp dan status (success/failed)
- [ ] Semua input di-sanitize dan di-validate
- [ ] Nonce verification pada form submission

---

## Epic 2: Custom Post Types

### US-6.03: Program CPT
**Sebagai** admin WordPress,
**Saya ingin** data program yayasan tampil sebagai Custom Post Type,
**Agar** bisa di-manage dan ditampilkan di website.

**Acceptance Criteria:**
- [ ] CPT `clicky_program` terdaftar dengan label "Program Yayasan"
- [ ] Supports: title, editor, thumbnail, excerpt, custom-fields
- [ ] Meta box Target Dana (`_clicky_target_amount`)
- [ ] Meta box Dana Terkumpul (`_clicky_collected_amount`) — read-only
- [ ] Meta box Status Program (active, completed, cancelled)
- [ ] Meta box External ID (UUID dari FastAPI) — read-only
- [ ] Meta box Last Synced timestamp — read-only
- [ ] Custom taxonomy: `clicky_program_category`
- [ ] Admin columns: Target, Terkumpul, Status, Last Synced
- [ ] Sortable dan filterable columns

### US-6.04: News CPT
**Sebagai** admin WordPress,
**Saya ingin** berita yayasan tampil sebagai Custom Post Type,
**Agar** bisa di-manage dan ditampilkan di website.

**Acceptance Criteria:**
- [ ] CPT `clicky_news` terdaftar dengan label "Berita Yayasan"
- [ ] Supports: title, editor, thumbnail, excerpt, custom-fields
- [ ] Meta box Kategori Berita (umum, kegiatan, laporan, pengumuman)
- [ ] Meta box External ID (UUID) — read-only
- [ ] Meta box Last Synced — read-only
- [ ] Meta box Source (local / synced) — read-only
- [ ] Admin columns: Category, Source, Last Synced

### US-6.05: Financial Reports Custom Table
**Sebagai** admin WordPress,
**Saya ingin** laporan keuangan tersimpan di custom table,
**Agar** data keuangan bisa ditampilkan via shortcode di website.

**Acceptance Criteria:**
- [ ] Custom table `{prefix}clicky_financial_reports` dibuat saat aktivasi
- [ ] Fields: id, external_id, title, period_start, period_end, total_income, total_expense, pdf_url, is_published, synced_at
- [ ] Admin page "Laporan Keuangan" menampilkan daftar reports
- [ ] Reports sortable by period, amount

---

## Epic 3: Content Sync Engine

### US-6.06: Cron-Based Sync (Pull)
**Sebagai** sistem,
**Saya ingin** konten di-sync secara periodik dari FastAPI ke WordPress,
**Agar** website selalu menampilkan data terbaru.

**Acceptance Criteria:**
- [ ] WP-Cron event `clicky_sync_content` terjadwal sesuai interval setting
- [ ] `sync_programs()` — fetch programs dari FastAPI, create/update CPT
- [ ] `sync_news()` — fetch news, create/update CPT
- [ ] `sync_financial_reports()` — fetch reports, update custom table
- [ ] Incremental sync: hanya fetch data yang berubah (`?updated_after=`)
- [ ] Track `last_synced` timestamp per content type
- [ ] New content creates new CPT post, existing content updates
- [ ] Deleted content di-trash (soft delete)

### US-6.07: Webhook Handlers (Push)
**Sebagai** backend FastAPI,
**Saya ingin** mengirim webhook ke WordPress saat data berubah,
**Agar** perubahan langsung ter-reflect di website tanpa menunggu cron.

**Acceptance Criteria:**
- [ ] Webhook endpoint: `POST /wp-json/clicky/v1/webhook`
- [ ] HMAC-SHA256 signature verification (`X-Clicky-Signature`)
- [ ] Handler: `program.created` / `program.updated` / `program.deleted`
- [ ] Handler: `news.created` / `news.updated` / `news.deleted`
- [ ] Handler: `financial_report.published`
- [ ] Handler: `donation.received` — update program collected_amount
- [ ] Payload structure validation
- [ ] All webhooks logged to `clicky_sync_logs`

### US-6.08: Conflict Resolution & Error Handling
**Sebagai** admin,
**Saya ingin** sync conflicts ditangani dengan baik,
**Agar** tidak ada data yang hilang tanpa sengaja.

**Acceptance Criteria:**
- [ ] Strategy: FastAPI adalah source of truth
- [ ] Locally modified content (`_clicky_locally_modified` flag) preserved during sync
- [ ] Force Sync overrides locally modified content
- [ ] Admin notice untuk conflicts yang perlu manual resolution
- [ ] Exponential backoff untuk failed API calls (1s → 2s → 4s → 8s, max 60s)
- [ ] Maximum 3 retry attempts per sync operation
- [ ] Errors logged to `clicky_sync_logs` table
- [ ] Admin email notification setelah 3 consecutive failures
- [ ] Circuit breaker: pause sync 5 menit jika API down

---

## Epic 4: REST API (WP-Side)

### US-6.09: WP REST Endpoints
**Sebagai** backend FastAPI,
**Saya ingin** WordPress memiliki REST endpoints untuk menerima data,
**Agar** sync bisa dilakukan secara programmatic.

**Acceptance Criteria:**
- [ ] REST namespace: `clicky/v1`
- [ ] `POST /clicky/v1/sync/programs` — receive program data
- [ ] `POST /clicky/v1/sync/news` — receive news data
- [ ] `POST /clicky/v1/sync/financial-reports` — receive financial data
- [ ] `POST /clicky/v1/webhook` — receive event webhooks
- [ ] `GET /clicky/v1/status` — health check (version, last sync, status)
- [ ] `GET /clicky/v1/programs` — public endpoint untuk shortcodes
- [ ] `GET /clicky/v1/news` — public endpoint untuk shortcodes
- [ ] `GET /clicky/v1/financial-reports` — public endpoint
- [ ] Authentication via `X-Clicky-API-Key` header
- [ ] Rate limiting untuk public endpoints (transient-based counter)

---

## Epic 5: Shortcodes

### US-6.10: Donation Form Shortcode
**Sebagai** pengunjung website,
**Saya ingin** bisa berdonasi langsung dari halaman WordPress,
**Agar** tidak perlu install aplikasi mobile untuk berdonasi.

**Acceptance Criteria:**
- [ ] Shortcode: `[clicky_donation_form]`
- [ ] Parameters: `program_id`, `amounts`, `show_program_select`, `button_text`, `redirect_url`
- [ ] Form: program select, amount input (preset + custom), payment method
- [ ] AJAX submission to FastAPI donation endpoint
- [ ] Client-side validation + nonce verification
- [ ] Success/error feedback message
- [ ] Responsive design (mobile & desktop)

### US-6.11: Financial Report Shortcode
**Sebagai** pengunjung website,
**Saya ingin** melihat laporan keuangan yayasan di website,
**Agar** bisa memastikan transparansi pengelolaan dana.

**Acceptance Criteria:**
- [ ] Shortcode: `[clicky_financial_report]`
- [ ] Parameters: `period`, `limit`, `show_chart`, `show_download`
- [ ] Table: income/expense per kategori
- [ ] Pie chart visualization (Chart.js)
- [ ] PDF download link (jika tersedia)
- [ ] Cached output via transient (5 min TTL)
- [ ] Responsive table dan chart

### US-6.12: Equipment List Shortcode
**Sebagai** pengunjung website,
**Saya ingin** melihat daftar alat kesehatan yang tersedia,
**Agar** bisa tahu alat apa yang bisa dipinjam.

**Acceptance Criteria:**
- [ ] Shortcode: `[clicky_equipment_list]`
- [ ] Parameters: `category`, `limit`, `layout` (grid/list), `show_availability`
- [ ] Card grid: foto, nama, ketersediaan badge (tersedia/habis)
- [ ] Pagination atau "Load More"
- [ ] Responsive grid (3 col desktop, 2 col tablet, 1 col mobile)

### US-6.13: Program Progress Shortcode
**Sebagai** pengunjung website,
**Saya ingin** melihat progress program yayasan,
**Agar** bisa ikut berpartisipasi melalui donasi.

**Acceptance Criteria:**
- [ ] Shortcode: `[clicky_program_progress]`
- [ ] Parameters: `program_id`, `limit`, `status`, `show_donate_button`
- [ ] Card: title, description, progress bar, percentage
- [ ] "Donasi" button mengarah ke donation form dengan program pre-selected
- [ ] Responsive layout

### US-6.14: News Feed Shortcode
**Sebagai** pengunjung website,
**Saya ingin** melihat berita terbaru yayasan,
**Agar** bisa mengikuti kegiatan dan dampak yayasan.

**Acceptance Criteria:**
- [ ] Shortcode: `[clicky_news_feed]`
- [ ] Parameters: `limit`, `category`, `layout`, `show_thumbnail`, `excerpt_length`
- [ ] Card: thumbnail, title, excerpt, date
- [ ] "Read More" link ke single post
- [ ] Responsive layout

---

## Epic 6: Auth Bridge (Optional)

### US-6.15: WordPress-Clicky SSO
**Sebagai** pengguna Clicky App,
**Saya ingin** otomatis login ke website WordPress,
**Agar** tidak perlu membuat akun terpisah.

**Acceptance Criteria:**
- [ ] WP user creation on Clicky App registration (via webhook)
- [ ] Auto-login to WP menggunakan Clicky App token
- [ ] Role mapping: Admin→administrator, Pengurus→editor, Relawan→author, Sahabat→subscriber
- [ ] Logout propagation (logout di app = logout di WP)

---

## Task Priority Matrix

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Plugin skeleton + settings | 1 hari |
| P0 | Custom Post Types registration | 0.5 hari |
| P0 | Cron-based sync engine | 1 hari |
| P1 | Webhook handlers | 1 hari |
| P1 | WP REST API endpoints | 0.5 hari |
| P1 | Shortcodes (all 5) | 1.5 hari |
| P2 | Conflict resolution & error handling | 0.5 hari |
| P2 | Auth bridge SSO | 1 hari |
| P2 | Testing (PHPUnit + integration) | 1 hari |

**Total estimated effort: ~8 hari (1 minggu + buffer)**

---

*Last updated: 2026-02-18*
