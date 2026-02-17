<?php
/**
 * REST API Controller
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * REST Controller class
 */
class Clicky_REST_Controller {

    /**
     * Namespace
     */
    protected $namespace = 'clicky/v1';

    /**
     * Register routes
     */
    public function register_routes() {
        // Sync endpoints
        register_rest_route($this->namespace, '/sync/programs', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'sync_programs'),
                'permission_callback' => array($this, 'check_api_key'),
            ),
        ));

        register_rest_route($this->namespace, '/sync/news', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'sync_news'),
                'permission_callback' => array($this, 'check_api_key'),
            ),
        ));

        register_rest_route($this->namespace, '/sync/financial-reports', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'sync_financial_reports'),
                'permission_callback' => array($this, 'check_api_key'),
            ),
        ));

        // Webhook endpoint
        register_rest_route($this->namespace, '/webhook', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'handle_webhook'),
                'permission_callback' => array($this, 'check_webhook_signature'),
            ),
        ));

        // Status endpoint
        register_rest_route($this->namespace, '/status', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_status'),
                'permission_callback' => '__return_true',
            ),
        ));

        // Public endpoints for shortcodes
        register_rest_route($this->namespace, '/programs', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_programs'),
                'permission_callback' => '__return_true',
            ),
        ));

        register_rest_route($this->namespace, '/news', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_news'),
                'permission_callback' => '__return_true',
            ),
        ));

        register_rest_route($this->namespace, '/financial-reports', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_financial_reports'),
                'permission_callback' => '__return_true',
            ),
        ));
    }

    /**
     * Check API key
     */
    public function check_api_key($request) {
        $api_key = $request->get_header('X-Clicky-API-Key');
        $stored_key = get_option('clicky_api_key');
        
        if (empty($stored_key) || $api_key !== $stored_key) {
            return new WP_Error(
                'rest_forbidden',
                __('Invalid API key.', 'clicky-foundation'),
                array('status' => 403)
            );
        }
        
        return true;
    }

    /**
     * Check webhook signature
     */
    public function check_webhook_signature($request) {
        $signature = $request->get_header('X-Clicky-Signature');
        $secret = get_option('clicky_webhook_secret');
        
        if (empty($secret)) {
            return new WP_Error(
                'rest_forbidden',
                __('Webhook secret not configured.', 'clicky-foundation'),
                array('status' => 403)
            );
        }
        
        $payload = $request->get_body();
        $expected = hash_hmac('sha256', $payload, $secret);
        
        if (!hash_equals($expected, $signature)) {
            return new WP_Error(
                'rest_forbidden',
                __('Invalid webhook signature.', 'clicky-foundation'),
                array('status' => 403)
            );
        }
        
        return true;
    }

    /**
     * Sync programs
     */
    public function sync_programs($request) {
        $data = $request->get_json_params();
        
        if (empty($data) || !is_array($data)) {
            return new WP_Error(
                'rest_invalid_data',
                __('Invalid data format.', 'clicky-foundation'),
                array('status' => 400)
            );
        }
        
        $sync_service = new Clicky_Sync_Service();
        $result = $sync_service->sync_programs_batch($data);
        
        return rest_ensure_response(array(
            'success' => true,
            'processed' => count($data),
            'created' => $result['created'],
            'updated' => $result['updated'],
        ));
    }

    /**
     * Sync news
     */
    public function sync_news($request) {
        $data = $request->get_json_params();
        
        if (empty($data) || !is_array($data)) {
            return new WP_Error(
                'rest_invalid_data',
                __('Invalid data format.', 'clicky-foundation'),
                array('status' => 400)
            );
        }
        
        $sync_service = new Clicky_Sync_Service();
        $result = $sync_service->sync_news_batch($data);
        
        return rest_ensure_response(array(
            'success' => true,
            'processed' => count($data),
            'created' => $result['created'],
            'updated' => $result['updated'],
        ));
    }

    /**
     * Sync financial reports
     */
    public function sync_financial_reports($request) {
        $data = $request->get_json_params();
        
        if (empty($data) || !is_array($data)) {
            return new WP_Error(
                'rest_invalid_data',
                __('Invalid data format.', 'clicky-foundation'),
                array('status' => 400)
            );
        }
        
        $sync_service = new Clicky_Sync_Service();
        $result = $sync_service->sync_financial_reports_batch($data);
        
        return rest_ensure_response(array(
            'success' => true,
            'processed' => count($data),
            'created' => $result['created'],
            'updated' => $result['updated'],
        ));
    }

    /**
     * Handle webhook
     */
    public function handle_webhook($request) {
        $data = $request->get_json_params();
        
        if (empty($data['event']) || empty($data['payload'])) {
            return new WP_Error(
                'rest_invalid_data',
                __('Invalid webhook payload.', 'clicky-foundation'),
                array('status' => 400)
            );
        }
        
        $event = sanitize_text_field($data['event']);
        $payload = $data['payload'];
        
        $sync_service = new Clicky_Sync_Service();
        $result = $sync_service->handle_webhook($event, $payload);
        
        if ($result['success']) {
            return rest_ensure_response(array(
                'success' => true,
                'event' => $event,
            ));
        } else {
            return new WP_Error(
                'webhook_error',
                $result['message'],
                array('status' => 400)
            );
        }
    }

    /**
     * Get status
     */
    public function get_status() {
        return rest_ensure_response(array(
            'version' => CLICKY_VERSION,
            'last_sync' => get_option('clicky_last_sync'),
            'sync_status' => get_option('clicky_sync_status'),
            'api_configured' => !empty(get_option('clicky_api_url')) && !empty(get_option('clicky_api_key')),
        ));
    }

    /**
     * Get programs (public endpoint)
     */
    public function get_programs($request) {
        // Rate limiting check
        if (!$this->check_rate_limit('programs')) {
            return new WP_Error(
                'rate_limit_exceeded',
                __('Rate limit exceeded. Please try again later.', 'clicky-foundation'),
                array('status' => 429)
            );
        }
        
        $args = array(
            'post_type' => 'clicky_program',
            'posts_per_page' => $request->get_param('limit') ?: 10,
            'post_status' => 'publish',
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        $status = $request->get_param('status');
        if ($status) {
            $args['meta_query'] = array(
                array(
                    'key' => '_clicky_program_status',
                    'value' => sanitize_text_field($status),
                ),
            );
        }
        
        $query = new WP_Query($args);
        $programs = array();
        
        while ($query->have_posts()) {
            $query->the_post();
            $programs[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'content' => get_the_content(),
                'excerpt' => get_the_excerpt(),
                'thumbnail' => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
                'target_amount' => floatval(get_post_meta(get_the_ID(), '_clicky_target_amount', true)),
                'collected_amount' => floatval(get_post_meta(get_the_ID(), '_clicky_collected_amount', true)),
                'status' => get_post_meta(get_the_ID(), '_clicky_program_status', true),
                'permalink' => get_permalink(),
            );
        }
        
        wp_reset_postdata();
        
        return rest_ensure_response($programs);
    }

    /**
     * Get news (public endpoint)
     */
    public function get_news($request) {
        // Rate limiting check
        if (!$this->check_rate_limit('news')) {
            return new WP_Error(
                'rate_limit_exceeded',
                __('Rate limit exceeded. Please try again later.', 'clicky-foundation'),
                array('status' => 429)
            );
        }
        
        $args = array(
            'post_type' => 'clicky_news',
            'posts_per_page' => $request->get_param('limit') ?: 10,
            'post_status' => 'publish',
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        $category = $request->get_param('category');
        if ($category) {
            $args['meta_query'] = array(
                array(
                    'key' => '_clicky_news_category',
                    'value' => sanitize_text_field($category),
                ),
            );
        }
        
        $query = new WP_Query($args);
        $news = array();
        
        while ($query->have_posts()) {
            $query->the_post();
            $news[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'content' => get_the_content(),
                'excerpt' => get_the_excerpt(),
                'thumbnail' => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
                'category' => get_post_meta(get_the_ID(), '_clicky_news_category', true),
                'date' => get_the_date(),
                'permalink' => get_permalink(),
            );
        }
        
        wp_reset_postdata();
        
        return rest_ensure_response($news);
    }

    /**
     * Get financial reports (public endpoint)
     */
    public function get_financial_reports($request) {
        global $wpdb;
        
        // Rate limiting check
        if (!$this->check_rate_limit('financial')) {
            return new WP_Error(
                'rate_limit_exceeded',
                __('Rate limit exceeded. Please try again later.', 'clicky-foundation'),
                array('status' => 429)
            );
        }
        
        $table_name = $wpdb->prefix . 'clicky_financial_reports';
        $limit = intval($request->get_param('limit') ?: 10);
        
        $reports = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table_name} 
             WHERE is_published = 1 
             ORDER BY period_start DESC 
             LIMIT %d",
            $limit
        ));
        
        return rest_ensure_response($reports);
    }

    /**
     * Check rate limit (transient-based)
     */
    private function check_rate_limit($endpoint) {
        $ip = $_SERVER['REMOTE_ADDR'];
        $key = 'clicky_rate_limit_' . md5($ip . $endpoint);
        $count = get_transient($key);
        
        if ($count === false) {
            // First request in window
            set_transient($key, 1, MINUTE_IN_SECONDS);
            return true;
        }
        
        if ($count >= 60) { // 60 requests per minute
            return false;
        }
        
        set_transient($key, $count + 1, MINUTE_IN_SECONDS);
        return true;
    }
}
