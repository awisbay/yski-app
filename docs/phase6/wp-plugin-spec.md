# WordPress Plugin Specification: clicky-foundation

## Plugin Architecture

### File Structure

```
wp-plugin/clicky-foundation/
├── clicky-foundation.php          # Main plugin file (bootstrap)
├── readme.txt                     # WP plugin repository readme
├── uninstall.php                  # Cleanup on uninstall
│
├── includes/
│   ├── class-clicky-loader.php    # Hook/filter registration
│   ├── class-clicky-activator.php # Activation logic
│   ├── class-clicky-deactivator.php
│   │
│   ├── admin/
│   │   ├── class-clicky-admin.php       # Admin menu & pages
│   │   ├── class-clicky-settings.php    # Settings API integration
│   │   └── class-clicky-sync-log.php    # Sync log admin page
│   │
│   ├── api/
│   │   ├── class-clicky-rest-controller.php  # REST API base
│   │   ├── class-clicky-sync-endpoint.php    # Sync endpoints
│   │   ├── class-clicky-webhook-endpoint.php # Webhook handler
│   │   └── class-clicky-public-endpoint.php  # Public data endpoints
│   │
│   ├── cpt/
│   │   ├── class-clicky-cpt-program.php    # Program CPT
│   │   └── class-clicky-cpt-news.php       # News CPT
│   │
│   ├── sync/
│   │   ├── class-clicky-sync-service.php   # Main sync orchestrator
│   │   ├── class-clicky-api-client.php     # FastAPI HTTP client
│   │   └── class-clicky-sync-logger.php    # Sync logging
│   │
│   └── shortcodes/
│       ├── class-clicky-shortcode-donation.php
│       ├── class-clicky-shortcode-financial.php
│       ├── class-clicky-shortcode-equipment.php
│       ├── class-clicky-shortcode-program.php
│       └── class-clicky-shortcode-news.php
│
├── templates/
│   ├── shortcode-donation-form.php
│   ├── shortcode-financial-report.php
│   ├── shortcode-equipment-list.php
│   ├── shortcode-program-progress.php
│   └── shortcode-news-feed.php
│
├── assets/
│   ├── css/
│   │   ├── clicky-admin.css
│   │   ├── clicky-public.css
│   │   └── clicky-public.min.css
│   └── js/
│       ├── clicky-admin.js
│       ├── clicky-public.js
│       └── clicky-public.min.js
│
└── languages/
    └── clicky-foundation-id_ID.po  # Indonesian translations
```

### Plugin Header

```php
<?php
/**
 * Plugin Name: Yayasan Sahabat Khairat Indonesia
 * Plugin URI: https://clickyfoundation.id
 * Description: Integrasi WordPress untuk Yayasan Sahabat Khairat - sinkronisasi konten, shortcodes, dan laporan keuangan.
 * Version: 1.0.0
 * Author: Yayasan Sahabat Khairat
 * Author URI: https://sahabatkhairat.or.id
 * Text Domain: clicky-foundation
 * Domain Path: /languages
 * Requires PHP: 7.4
 * Requires at least: 5.8
 */

define('CLICKY_VERSION', '1.0.0');
define('CLICKY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CLICKY_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CLICKY_PLUGIN_BASENAME', plugin_basename(__FILE__));
```

---

## Settings Page

### Option Keys

| Option Key | Type | Default | Description |
|-----------|------|---------|-------------|
| `clicky_api_url` | string | `""` | FastAPI base URL |
| `clicky_api_key` | string | `""` | API authentication key |
| `clicky_webhook_secret` | string | `""` | Webhook signature secret |
| `clicky_sync_interval` | string | `"hourly"` | Cron schedule |
| `clicky_sync_types` | array | `["programs","news"]` | Content types to sync |
| `clicky_debug_mode` | boolean | `false` | Enable debug logging |
| `clicky_last_sync` | string | `""` | Last sync ISO timestamp |
| `clicky_sync_status` | string | `""` | Last sync status |

### Settings Registration

```php
class Clicky_Settings {
    public function register() {
        register_setting('clicky_settings', 'clicky_api_url', [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting('clicky_settings', 'clicky_api_key', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        // ... more settings
    }
}
```

---

## Custom Post Types

### clicky_program

```php
register_post_type('clicky_program', [
    'labels' => [
        'name' => 'Program Yayasan',
        'singular_name' => 'Program',
        'add_new_item' => 'Tambah Program Baru',
        'edit_item' => 'Edit Program',
    ],
    'public' => true,
    'has_archive' => true,
    'show_in_rest' => true,
    'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
    'menu_icon' => 'dashicons-heart',
    'rewrite' => ['slug' => 'program'],
]);
```

### Meta Fields

| Meta Key | Type | Description |
|----------|------|-------------|
| `_clicky_external_id` | UUID | ID dari FastAPI (readonly) |
| `_clicky_target_amount` | decimal | Target dana program |
| `_clicky_collected_amount` | decimal | Dana terkumpul |
| `_clicky_program_status` | string | active / completed / cancelled |
| `_clicky_last_synced` | datetime | Timestamp sync terakhir |
| `_clicky_locally_modified` | boolean | Flag edit lokal |

---

## Webhook Handling

### Signature Verification

```php
public function verify_webhook_signature($request) {
    $payload = $request->get_body();
    $signature = $request->get_header('X-Clicky-Signature');
    $secret = get_option('clicky_webhook_secret');

    $expected = hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}
```

### Event Types

| Event | Action |
|-------|--------|
| `program.created` | Create new clicky_program CPT |
| `program.updated` | Update existing clicky_program |
| `program.deleted` | Trash clicky_program |
| `news.created` | Create new clicky_news CPT |
| `news.updated` | Update existing clicky_news |
| `news.deleted` | Trash clicky_news |
| `financial_report.published` | Insert/update custom table |
| `donation.received` | Update program collected_amount |

---

## Shortcode Examples

### [clicky_donation_form]

```php
// Usage: [clicky_donation_form program_id="uuid" amounts="50000,100000,500000"]

function render_donation_form($atts) {
    $atts = shortcode_atts([
        'program_id' => '',
        'amounts' => '50000,100000,250000,500000',
        'show_program_select' => 'true',
        'button_text' => 'Donasi Sekarang',
        'redirect_url' => '',
    ], $atts);

    ob_start();
    include CLICKY_PLUGIN_DIR . 'templates/shortcode-donation-form.php';
    return ob_get_clean();
}
```

### [clicky_financial_report]

```php
// Usage: [clicky_financial_report limit="5" show_chart="true"]
// Output: Table with income/expense + pie chart (Chart.js)
```

---

## Security Considerations

- **Nonce Verification:** All form submissions verified with `wp_verify_nonce()`
- **Capability Checks:** Admin pages check `manage_options` capability
- **Input Sanitization:** All inputs sanitized with `sanitize_text_field()`, `absint()`, `esc_url_raw()`
- **Output Escaping:** All output escaped with `esc_html()`, `esc_attr()`, `esc_url()`
- **SQL Injection:** Use `$wpdb->prepare()` for all custom queries
- **API Key Storage:** Stored in `wp_options`, not exposed in frontend
- **Webhook Verification:** HMAC-SHA256 signature check on all webhooks
- **Rate Limiting:** Public REST endpoints limited via transient-based counter

---

## Database Tables

### Sync Log Table

```sql
CREATE TABLE {prefix}clicky_sync_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    external_id VARCHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    message TEXT,
    response_code INT,
    INDEX idx_timestamp (timestamp),
    INDEX idx_content_type (content_type)
);
```

### Financial Reports Table

```sql
CREATE TABLE {prefix}clicky_financial_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(36) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_expense DECIMAL(15,2) NOT NULL DEFAULT 0,
    pdf_url TEXT,
    is_published TINYINT(1) NOT NULL DEFAULT 0,
    synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_external_id (external_id),
    INDEX idx_period (period_start, period_end)
);
```
