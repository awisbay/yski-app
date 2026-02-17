<?php
/**
 * Fired when the plugin is uninstalled
 *
 * @package Clicky_Foundation
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Check if we should delete data
$delete_data = true; // Could be an option in the future

if ($delete_data) {
    global $wpdb;
    
    // Delete custom tables
    $tables = array(
        $wpdb->prefix . 'clicky_sync_logs',
        $wpdb->prefix . 'clicky_financial_reports',
    );
    
    foreach ($tables as $table) {
        $wpdb->query("DROP TABLE IF EXISTS {$table}");
    }
    
    // Delete all plugin options
    $options = array(
        'clicky_api_url',
        'clicky_api_key',
        'clicky_webhook_secret',
        'clicky_sync_interval',
        'clicky_sync_types',
        'clicky_debug_mode',
        'clicky_last_sync',
        'clicky_sync_status',
        'clicky_version',
    );
    
    foreach ($options as $option) {
        delete_option($option);
    }
    
    // Delete all CPT posts
    $post_types = array('clicky_program', 'clicky_news');
    
    foreach ($post_types as $post_type) {
        $posts = get_posts(array(
            'post_type' => $post_type,
            'numberposts' => -1,
            'post_status' => 'any',
        ));
        
        foreach ($posts as $post) {
            wp_delete_post($post->ID, true); // true = force delete
        }
    }
    
    // Delete transients
    $wpdb->query(
        "DELETE FROM {$wpdb->options} 
         WHERE option_name LIKE '_transient_clicky_%' 
         OR option_name LIKE '_transient_timeout_clicky_%'"
    );
    
    // Clear scheduled events
    wp_clear_scheduled_hook('clicky_sync_content');
}
