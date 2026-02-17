<?php
/**
 * Plugin Name: Clicky Foundation
 * Description: WordPress integration plugin for Clicky Foundation App (YSKI)
 * Version: 1.0.0
 * Author: YSKI Team
 * Text Domain: clicky-foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CLICKY_FOUNDATION_VERSION', '1.0.0');
define('CLICKY_FOUNDATION_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CLICKY_FOUNDATION_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Plugin activation hook
 */
function clicky_foundation_activate() {
    // Set default options
    add_option('clicky_foundation_api_url', '');
    add_option('clicky_foundation_api_key', '');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'clicky_foundation_activate');

/**
 * Plugin deactivation hook
 */
function clicky_foundation_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'clicky_foundation_deactivate');

/**
 * Initialize plugin
 */
function clicky_foundation_init() {
    // Load includes
    require_once CLICKY_FOUNDATION_PLUGIN_DIR . 'includes/class-clicky-foundation.php';
    
    // Initialize
    $plugin = new Clicky_Foundation();
    $plugin->init();
}
add_action('plugins_loaded', 'clicky_foundation_init');
