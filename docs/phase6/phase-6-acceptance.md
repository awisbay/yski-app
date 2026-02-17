# Phase 6: Acceptance Criteria / Exit Criteria

> All criteria must be met before moving to Phase 7.

## Plugin Foundation

- [ ] Plugin activates cleanly on WordPress 5.8+ / PHP 7.4+
- [ ] Custom tables (`clicky_sync_logs`, `clicky_financial_reports`) created on activation
- [ ] Plugin deactivation clears all scheduled cron events
- [ ] Plugin uninstall removes all data (tables, options, transients, CPT posts)
- [ ] Admin notice displays if API URL is not configured
- [ ] Settings page is accessible at Settings > Clicky Foundation

## Settings & Configuration

- [ ] API Base URL, API Key, and Webhook Secret can be saved and retrieved
- [ ] "Test Connection" button successfully pings FastAPI health endpoint
- [ ] "Test Connection" shows clear error message when API is unreachable
- [ ] Sync interval selection works (15min/30min/hourly/daily)
- [ ] Content type checkboxes control which types are synced
- [ ] Debug mode toggle enables/disables verbose logging
- [ ] "Force Sync Now" triggers immediate sync and updates last sync timestamp
- [ ] All settings inputs are sanitized and validated
- [ ] Nonce verification prevents CSRF attacks

## Custom Post Types

- [ ] `clicky_program` CPT is registered and visible in WP admin sidebar
- [ ] `clicky_news` CPT is registered and visible in WP admin sidebar
- [ ] Program meta boxes display correctly (target, collected, status, external ID, last synced)
- [ ] News meta boxes display correctly (category, external ID, last synced, source)
- [ ] Admin columns show custom data and are sortable
- [ ] Financial reports are stored in custom table and viewable in admin page

## Content Sync

- [ ] Cron-based sync pulls programs from FastAPI and creates/updates CPT posts
- [ ] Cron-based sync pulls news from FastAPI and creates/updates CPT posts
- [ ] Cron-based sync pulls financial reports into custom table
- [ ] Incremental sync only fetches data modified since last sync
- [ ] Sync correctly handles: new content, updated content, deleted content
- [ ] Last sync timestamp is updated after each successful sync
- [ ] Sync logs are written to `clicky_sync_logs` table

## Webhook Handling

- [ ] Webhook endpoint accepts POST requests from FastAPI
- [ ] HMAC-SHA256 signature verification rejects invalid webhooks
- [ ] `program.created` webhook creates new program CPT
- [ ] `program.updated` webhook updates existing program CPT
- [ ] `program.deleted` webhook trashes program CPT
- [ ] `news.created/updated/deleted` webhooks work correctly
- [ ] `financial_report.published` webhook updates custom table
- [ ] `donation.received` webhook updates program `collected_amount`
- [ ] Invalid webhook payloads return 400 error
- [ ] All webhook events are logged

## Error Handling & Resilience

- [ ] Failed API calls retry with exponential backoff (up to 3 attempts)
- [ ] Circuit breaker pauses sync when API is consistently down
- [ ] Admin email notification sent after 3 consecutive failures
- [ ] Locally modified content is preserved during normal sync
- [ ] Force Sync overrides locally modified content
- [ ] Conflict admin notices display when manual resolution needed

## REST API (WP-Side)

- [ ] All registered endpoints respond correctly under `clicky/v1` namespace
- [ ] Sync endpoints require `X-Clicky-API-Key` authentication
- [ ] Public endpoints return correct JSON data for shortcodes
- [ ] Health check endpoint returns plugin version, last sync status, connection state
- [ ] Rate limiting prevents abuse on public endpoints

## Shortcodes

- [ ] `[clicky_donation_form]` renders functional donation form
- [ ] `[clicky_financial_report]` renders income/expense table with optional chart
- [ ] `[clicky_equipment_list]` renders equipment grid with availability badges
- [ ] `[clicky_program_progress]` renders program cards with progress bars
- [ ] `[clicky_news_feed]` renders news cards with thumbnails
- [ ] All shortcodes are responsive (mobile, tablet, desktop)
- [ ] CSS/JS only loaded on pages that use shortcodes (conditional loading)
- [ ] Shortcodes show fallback message when API is unavailable
- [ ] Shortcode output is cached via transients for performance

## Testing

- [ ] PHPUnit tests pass for: activation, settings, CPT registration, shortcode output
- [ ] Integration test: full sync cycle (FastAPI → WP) works for all content types
- [ ] Integration test: webhook delivery and processing end-to-end
- [ ] Manual test: activate on fresh WP → configure → sync → shortcodes render
- [ ] Manual test: responsive rendering on mobile viewport
- [ ] Manual test: deactivate/reactivate preserves data
- [ ] Manual test: uninstall cleans up all data

## Security

- [ ] All form submissions use nonce verification
- [ ] Admin pages check `manage_options` capability
- [ ] All inputs sanitized with appropriate WP functions
- [ ] All outputs escaped with `esc_html()`, `esc_attr()`, `esc_url()`
- [ ] Custom queries use `$wpdb->prepare()` (SQL injection prevention)
- [ ] API key is not exposed in frontend source code
- [ ] Webhook signature verification prevents unauthorized pushes

---

*Last updated: 2026-02-18*
