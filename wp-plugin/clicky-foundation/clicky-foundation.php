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
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('CLICKY_VERSION', '1.0.0');
define('CLICKY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CLICKY_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CLICKY_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Check minimum requirements
 */
function clicky_check_requirements() {
    $php_version = PHP_VERSION;
    $wp_version = get_bloginfo('version');
    
    if (version_compare($php_version, '7.4', '<')) {
        deactivate_plugins(CLICKY_PLUGIN_BASENAME);
        wp_die(
            sprintf(
                __('Yayasan Sahabat Khairat Indonesia requires PHP 7.4 or higher. You are running PHP %s.', 'clicky-foundation'),
                esc_html($php_version)
            ),
            __('Plugin Activation Error', 'clicky-foundation'),
            array('back_link' => true)
        );
    }
    
    if (version_compare($wp_version, '5.8', '<')) {
        deactivate_plugins(CLICKY_PLUGIN_BASENAME);
        wp_die(
            sprintf(
                __('Yayasan Sahabat Khairat Indonesia requires WordPress 5.8 or higher. You are running WordPress %s.', 'clicky-foundation'),
                esc_html($wp_version)
            ),
            __('Plugin Activation Error', 'clicky-foundation'),
            array('back_link' => true)
        );
    }
    
    return true;
}

/**
 * Plugin activation hook
 */
function clicky_activate() {
    clicky_check_requirements();
    
    // Load activator class
    require_once CLICKY_PLUGIN_DIR . 'includes/class-clicky-activator.php';
    Clicky_Activator::activate();
    
    // Flush rewrite rules for CPTs
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'clicky_activate');

/**
 * Plugin deactivation hook
 */
function clicky_deactivate() {
    require_once CLICKY_PLUGIN_DIR . 'includes/class-clicky-deactivator.php';
    Clicky_Deactivator::deactivate();
    
    // Clear scheduled cron events
    wp_clear_scheduled_hook('clicky_sync_content');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'clicky_deactivate');

/**
 * Initialize plugin
 */
function clicky_init() {
    // Load main plugin class
    require_once CLICKY_PLUGIN_DIR . 'includes/class-clicky-foundation.php';
    
    $plugin = new Clicky_Foundation();
    $plugin->init();
}
add_action('plugins_loaded', 'clicky_init');

/**
 * Admin notice for unconfigured API
 */
function clicky_admin_notice() {
    $screen = get_current_screen();
    if (!$screen || $screen->id === 'settings_page_clicky-foundation') {
        return;
    }
    
    $api_url = get_option('clicky_api_url');
    $api_key = get_option('clicky_api_key');
    
    if (empty($api_url) || empty($api_key)) {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p>
                <?php _e('Yayasan Sahabat Khairat Indonesia plugin is not fully configured.', 'clicky-foundation'); ?>
                <a href="<?php echo esc_url(admin_url('options-general.php?page=clicky-foundation')); ?>">
                    <?php _e('Configure Settings', 'clicky-foundation'); ?>
                </a>
            </p>
        </div>
        <?php
    }
}
add_action('admin_notices', 'clicky_admin_notice');
