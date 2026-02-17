<?php
/**
 * Fired during plugin deactivation
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Deactivator class
 */
class Clicky_Deactivator {

    /**
     * Deactivate the plugin
     */
    public static function deactivate() {
        // Clear scheduled cron events
        self::clear_cron_events();
        
        // Clear transients
        self::clear_transients();
    }

    /**
     * Clear scheduled cron events
     */
    private static function clear_cron_events() {
        $timestamp = wp_next_scheduled('clicky_sync_content');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'clicky_sync_content');
        }
        
        wp_clear_scheduled_hook('clicky_sync_content');
    }

    /**
     * Clear plugin transients
     */
    private static function clear_transients() {
        global $wpdb;
        
        $wpdb->query(
            "DELETE FROM {$wpdb->options} 
             WHERE option_name LIKE '_transient_clicky_%' 
             OR option_name LIKE '_transient_timeout_clicky_%'"
        );
    }
}
