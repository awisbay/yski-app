<?php
/**
 * Fired during plugin activation
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Activator class
 */
class Clicky_Activator {

    /**
     * Activate the plugin
     */
    public static function activate() {
        self::create_tables();
        self::set_default_options();
    }

    /**
     * Create custom database tables
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Sync logs table
        $sync_logs_table = $wpdb->prefix . 'clicky_sync_logs';
        $sql_sync_logs = "CREATE TABLE IF NOT EXISTS {$sync_logs_table} (
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
        ) {$charset_collate};";
        
        // Financial reports table
        $financial_table = $wpdb->prefix . 'clicky_financial_reports';
        $sql_financial = "CREATE TABLE IF NOT EXISTS {$financial_table} (
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
        ) {$charset_collate};";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_sync_logs);
        dbDelta($sql_financial);
    }

    /**
     * Set default options
     */
    private static function set_default_options() {
        $defaults = array(
            'clicky_api_url' => '',
            'clicky_api_key' => '',
            'clicky_webhook_secret' => '',
            'clicky_sync_interval' => 'hourly',
            'clicky_sync_types' => array('programs', 'news'),
            'clicky_debug_mode' => false,
            'clicky_last_sync' => '',
            'clicky_sync_status' => 'never',
            'clicky_version' => CLICKY_VERSION,
        );
        
        foreach ($defaults as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }
    }
}
