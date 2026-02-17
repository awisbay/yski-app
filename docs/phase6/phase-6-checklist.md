# Phase 6: WordPress Integration - Checklist

**Objective:** Membangun custom WordPress plugin `clicky-foundation` untuk sinkronisasi konten antara FastAPI backend dan website WordPress, termasuk shortcodes untuk menampilkan data yayasan di halaman website.

**Estimated Duration:** 1 minggu

**Prerequisite:** Phase 5 (Advanced Features) selesai -- semua API endpoints tersedia.

---

## WP Plugin Skeleton

- [ ] Buat file utama `clicky-foundation.php` dengan plugin header
- [ ] Implementasi `register_activation_hook()` -- buat custom tables, set default options, flush rewrite rules
- [ ] Implementasi `register_deactivation_hook()` -- clear cron events, flush rewrite rules
- [ ] Implementasi `register_uninstall_hook()` -- drop tables, delete options, clean transients
- [ ] Buat settings page di WP Admin (Settings > Clicky Foundation)
- [ ] Register admin menu item dengan icon custom
- [ ] Buat `includes/` directory structure
- [ ] Implementasi autoloader untuk class-based architecture
- [ ] Set minimum requirements check (PHP 7.4+, WP 5.8+)
- [ ] Buat admin notice jika API belum dikonfigurasi

## Settings Page

- [ ] Field: API Base URL (`https://api.clickyfoundation.org/api/v1`)
- [ ] Field: API Key / Secret Token
- [ ] Field: Webhook Secret (shared secret untuk validasi webhooks)
- [ ] Field: Sync Interval (dropdown: 15 min, 30 min, hourly, daily)
- [ ] Field: Content Types to Sync (checkboxes: Programs, News, Financial Reports)
- [ ] Field: Debug Mode toggle
- [ ] Tombol "Test Connection" untuk verifikasi koneksi ke FastAPI
- [ ] Tombol "Force Sync Now" untuk trigger manual sync
- [ ] Display last sync timestamp dan status
- [ ] Sanitize dan validate semua input
- [ ] Nonce verification pada form submission

## Custom Post Types

### clicky_program
- [ ] Register CPT `clicky_program` dengan label "Program Yayasan"
- [ ] Supports: title, editor, thumbnail, excerpt, custom-fields
- [ ] Meta box: Target Dana (`_clicky_target_amount`)
- [ ] Meta box: Dana Terkumpul (`_clicky_collected_amount`)
- [ ] Meta box: Status Program (active, completed, cancelled)
- [ ] Meta box: External ID (UUID dari FastAPI, readonly)
- [ ] Meta box: Last Synced (datetime, readonly)
- [ ] Custom taxonomy: `clicky_program_category`
- [ ] Custom admin columns: Target, Terkumpul, Status, Last Synced

### clicky_news
- [ ] Register CPT `clicky_news` dengan label "Berita Yayasan"
- [ ] Supports: title, editor, thumbnail, excerpt, custom-fields
- [ ] Meta box: Kategori Berita (umum, kegiatan, laporan, pengumuman)
- [ ] Meta box: External ID (UUID dari FastAPI, readonly)
- [ ] Meta box: Last Synced (datetime, readonly)
- [ ] Meta box: Source (local / synced)
- [ ] Custom admin columns: Category, Source, Last Synced

### Financial Reports (Custom Table)
- [ ] Buat custom table `{prefix}clicky_financial_reports`
- [ ] Fields: id, external_id, title, period_start, period_end, total_income, total_expense, pdf_url, is_published, synced_at
- [ ] Admin page untuk melihat daftar laporan keuangan

## REST API Endpoints (WP-Side)

- [ ] Register REST namespace: `clicky/v1`
- [ ] `POST /clicky/v1/sync/programs` -- receive program data dari FastAPI
- [ ] `POST /clicky/v1/sync/news` -- receive news data dari FastAPI
- [ ] `POST /clicky/v1/sync/financial-reports` -- receive financial report data
- [ ] `POST /clicky/v1/webhook` -- receive event webhooks dari FastAPI
- [ ] `GET /clicky/v1/status` -- health check (plugin version, last sync, connection status)
- [ ] `GET /clicky/v1/programs` -- public endpoint untuk shortcodes
- [ ] `GET /clicky/v1/news` -- public endpoint untuk shortcodes
- [ ] `GET /clicky/v1/financial-reports` -- public endpoint untuk shortcodes
- [ ] Authentication via `X-Clicky-API-Key` header
- [ ] Webhook signature verification (`X-Clicky-Signature`)
- [ ] Rate limiting untuk public endpoints

## Content Sync Engine

### Cron-Based Sync (Pull dari FastAPI)
- [ ] Register custom WP-Cron event: `clicky_sync_content`
- [ ] Schedule berdasarkan interval setting (default: hourly)
- [ ] Implement `sync_programs()` -- fetch programs, create/update CPT
- [ ] Implement `sync_news()` -- fetch news, create/update CPT
- [ ] Implement `sync_financial_reports()` -- fetch reports, update table
- [ ] Track sync state: last_synced timestamp per content type
- [ ] Incremental sync (fetch only updated data via `?updated_after=`)

### Webhook Handlers (Push dari FastAPI)
- [ ] Handler: `program.created` / `program.updated` / `program.deleted`
- [ ] Handler: `news.created` / `news.updated` / `news.deleted`
- [ ] Handler: `financial_report.published`
- [ ] Handler: `donation.received` -- update program progress
- [ ] Validate webhook payload structure
- [ ] Log all incoming webhooks

### Conflict Resolution
- [ ] Strategy: "FastAPI is source of truth"
- [ ] Detect locally modified content (`_clicky_locally_modified` flag)
- [ ] Locally modified content preserved during sync (except force sync)
- [ ] Admin notice for conflicts needing manual resolution

### Error Handling & Retry
- [ ] Exponential backoff for failed API calls (1s, 2s, 4s, 8s, max 60s)
- [ ] Maximum 3 retry attempts per sync operation
- [ ] Log errors to custom table `{prefix}clicky_sync_logs`
- [ ] Admin email notification after 3 consecutive failures
- [ ] Circuit breaker: pause sync 5 min if API down

## Shortcodes

### [clicky_donation_form]
- [ ] Parameters: `program_id`, `amounts`, `show_program_select`, `button_text`, `redirect_url`
- [ ] Template: form with program select, amount input, payment method
- [ ] AJAX submission to FastAPI donation endpoint
- [ ] Client-side validation, nonce verification
- [ ] Responsive design

### [clicky_financial_report]
- [ ] Parameters: `period`, `limit`, `show_chart`, `show_download`
- [ ] Template: income/expense table, progress bar, pie chart (Chart.js)
- [ ] Cached output with transient
- [ ] Responsive table

### [clicky_equipment_list]
- [ ] Parameters: `category`, `limit`, `layout` (grid/list), `show_availability`
- [ ] Template: card grid with photo, name, availability badge
- [ ] Pagination or "Load More"
- [ ] Responsive grid

### [clicky_program_progress]
- [ ] Parameters: `program_id`, `limit`, `status`, `show_donate_button`
- [ ] Template: cards with title, description, progress bar, percentage
- [ ] "Donasi" button links to donation form with program pre-selected

### [clicky_news_feed]
- [ ] Parameters: `limit`, `category`, `layout`, `show_thumbnail`, `excerpt_length`
- [ ] Template: news cards with thumbnail, title, excerpt, date
- [ ] "Read More" link to single post

### Global Shortcode Tasks
- [ ] Enqueue CSS/JS only on pages using shortcodes (conditional loading)
- [ ] Minified CSS dan JS for production
- [ ] Fallback message jika API tidak tersedia

## Auth Bridge (Optional SSO)
- [ ] WP user creation on Clicky App registration (via webhook)
- [ ] Auto-login to WP using Clicky App token
- [ ] Role mapping: Admin->administrator, Pengurus->editor, Relawan->author, Sahabat->subscriber
- [ ] Logout propagation

## Testing

### Unit Testing (PHPUnit)
- [ ] Plugin activation creates tables correctly
- [ ] Settings saves and retrieves values
- [ ] CPT registration works
- [ ] Shortcode output renders correct HTML
- [ ] REST API endpoints return correct format
- [ ] Webhook signature verification works
- [ ] Sync service creates/updates posts correctly

### Integration Testing
- [ ] Full sync cycle (FastAPI -> WP) for all content types
- [ ] Webhook delivery and processing end-to-end
- [ ] Donation form submission through shortcode
- [ ] Shortcode rendering in multiple themes
- [ ] Concurrent sync operations don't create duplicates

### Manual Testing
- [ ] Activate plugin on fresh WP installation
- [ ] Configure settings and test connection
- [ ] Trigger manual sync -- data appears as CPT
- [ ] Insert each shortcode on a page -- renders correctly
- [ ] Test responsive on mobile viewport
- [ ] Deactivate/reactivate -- data preserved
- [ ] Uninstall plugin -- all data cleaned up
