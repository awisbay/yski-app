<?php
/**
 * Sync Logger
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sync Logger class
 */
class Clicky_Sync_Logger {

    /**
     * Log table name
     */
    private $table_name;

    /**
     * Constructor
     */
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'clicky_sync_logs';
    }

    /**
     * Log entry
     */
    public function log($action, $content_type, $external_id = null, $status = 'success', $message = '') {
        global $wpdb;
        
        $wpdb->insert($this->table_name, array(
            'action' => sanitize_text_field($action),
            'content_type' => sanitize_text_field($content_type),
            'external_id' => $external_id ? sanitize_text_field($external_id) : null,
            'status' => sanitize_text_field($status),
            'message' => sanitize_text_field($message),
        ));
    }

    /**
     * Get recent logs
     */
    public function get_logs($limit = 100, $content_type = null) {
        global $wpdb;
        
        $sql = "SELECT * FROM {$this->table_name}";
        $args = array();
        
        if ($content_type) {
            $sql .= " WHERE content_type = %s";
            $args[] = $content_type;
        }
        
        $sql .= " ORDER BY timestamp DESC LIMIT %d";
        $args[] = intval($limit);
        
        if (!empty($args)) {
            $sql = $wpdb->prepare($sql, ...$args);
        }
        
        return $wpdb->get_results($sql);
    }

    /**
     * Clear old logs
     */
    public function clear_old_logs($days = 30) {
        global $wpdb;
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$this->table_name} WHERE timestamp < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $days
        ));
    }
}
