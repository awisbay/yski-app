<?php
/**
 * Main plugin class
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main plugin class
 */
class Clicky_Foundation {

    /**
     * Initialize the plugin
     */
    public function init() {
        $this->load_dependencies();
        $this->setup_admin();
        $this->setup_cpts();
        $this->setup_rest_api();
        $this->setup_sync();
        $this->setup_shortcodes();
        $this->setup_assets();
    }

    /**
     * Load dependencies
     */
    private function load_dependencies() {
        // Admin
        require_once CLICKY_PLUGIN_DIR . 'includes/admin/class-clicky-admin.php';
        
        // CPTs
        require_once CLICKY_PLUGIN_DIR . 'includes/cpt/class-clicky-cpt-program.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/cpt/class-clicky-cpt-news.php';
        
        // REST API
        require_once CLICKY_PLUGIN_DIR . 'includes/api/class-clicky-rest-controller.php';
        
        // Sync
        require_once CLICKY_PLUGIN_DIR . 'includes/sync/class-clicky-api-client.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/sync/class-clicky-sync-logger.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/sync/class-clicky-sync-service.php';
        
        // Shortcodes
        require_once CLICKY_PLUGIN_DIR . 'includes/shortcodes/class-clicky-shortcode-donation.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/shortcodes/class-clicky-shortcode-program.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/shortcodes/class-clicky-shortcode-news.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/shortcodes/class-clicky-shortcode-financial.php';
        require_once CLICKY_PLUGIN_DIR . 'includes/shortcodes/class-clicky-shortcode-equipment.php';
    }

    /**
     * Setup admin
     */
    private function setup_admin() {
        $admin = new Clicky_Admin();
        $admin->init();
    }

    /**
     * Setup custom post types
     */
    private function setup_cpts() {
        $program_cpt = new Clicky_CPT_Program();
        $program_cpt->init();
        
        $news_cpt = new Clicky_CPT_News();
        $news_cpt->init();
    }

    /**
     * Setup REST API
     */
    private function setup_rest_api() {
        add_action('rest_api_init', function() {
            $controller = new Clicky_REST_Controller();
            $controller->register_routes();
        });
    }

    /**
     * Setup sync service
     */
    private function setup_sync() {
        $sync_service = new Clicky_Sync_Service();
        $sync_service->init_cron();
        
        // Schedule cleanup of old logs
        if (!wp_next_scheduled('clicky_cleanup_logs')) {
            wp_schedule_event(time(), 'daily', 'clicky_cleanup_logs');
        }
        
        add_action('clicky_cleanup_logs', function() {
            $logger = new Clicky_Sync_Logger();
            $logger->clear_old_logs(30);
        });
    }

    /**
     * Setup shortcodes
     */
    private function setup_shortcodes() {
        $shortcodes = array(
            new Clicky_Shortcode_Donation(),
            new Clicky_Shortcode_Program(),
            new Clicky_Shortcode_News(),
            new Clicky_Shortcode_Financial(),
            new Clicky_Shortcode_Equipment(),
        );
        
        foreach ($shortcodes as $shortcode) {
            $shortcode->init();
        }
    }

    /**
     * Setup assets
     */
    private function setup_assets() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_public_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }

    /**
     * Enqueue public assets
     */
    public function enqueue_public_assets() {
        // Only register, enqueue when shortcode is used
        wp_register_style(
            'clicky-public',
            CLICKY_PLUGIN_URL . 'assets/css/clicky-public.css',
            array(),
            CLICKY_VERSION
        );
        
        wp_register_script(
            'clicky-public',
            CLICKY_PLUGIN_URL . 'assets/js/clicky-public.js',
            array('jquery'),
            CLICKY_VERSION,
            true
        );
        
        wp_localize_script('clicky-public', 'clicky_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'api_url' => get_option('clicky_api_url'),
        ));
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ($hook !== 'settings_page_clicky-foundation') {
            return;
        }
        
        wp_enqueue_style(
            'clicky-admin',
            CLICKY_PLUGIN_URL . 'assets/css/clicky-admin.css',
            array(),
            CLICKY_VERSION
        );
        
        wp_enqueue_script(
            'clicky-admin',
            CLICKY_PLUGIN_URL . 'assets/js/clicky-admin.js',
            array('jquery'),
            CLICKY_VERSION,
            true
        );
        
        wp_localize_script('clicky-admin', 'clicky_admin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('clicky_admin_nonce'),
            'strings' => array(
                'testing' => __('Testing connection...', 'clicky-foundation'),
                'syncing' => __('Syncing...', 'clicky-foundation'),
                'success' => __('Success!', 'clicky-foundation'),
                'error' => __('Error occurred.', 'clicky-foundation'),
            ),
        ));
    }
}
