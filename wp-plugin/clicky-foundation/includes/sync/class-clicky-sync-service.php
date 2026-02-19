<?php
/**
 * Sync Service
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sync Service class
 */
class Clicky_Sync_Service {

    /**
     * API client
     */
    private $api_client;

    /**
     * Logger
     */
    private $logger;

    /**
     * Max retry attempts
     */
    private $max_retries = 3;

    /**
     * Circuit breaker transient key
     */
    private $circuit_key = 'clicky_sync_circuit_open';

    /**
     * Constructor
     */
    public function __construct() {
        $this->api_client = new Clicky_API_Client();
        $this->logger = new Clicky_Sync_Logger();
    }

    /**
     * Initialize cron
     */
    public function init_cron() {
        add_action('clicky_sync_content', array($this, 'run_sync'));
        
        if (!wp_next_scheduled('clicky_sync_content')) {
            $interval = get_option('clicky_sync_interval', 'hourly');
            $timestamp = strtotime('+1 hour');
            wp_schedule_event($timestamp, $interval, 'clicky_sync_content');
        }
    }

    /**
     * Run full sync
     */
    public function run_sync() {
        // Check circuit breaker
        if (get_transient($this->circuit_key)) {
            $this->logger->log('sync', 'all', null, 'warning', 'Circuit breaker open - sync paused');
            return;
        }
        
        if (!$this->api_client->is_configured()) {
            $this->logger->log('sync', 'all', null, 'error', 'API not configured');
            return;
        }
        
        $sync_types = (array) get_option('clicky_sync_types', array('programs', 'news'));
        $success = true;
        
        if (in_array('programs', $sync_types)) {
            $result = $this->sync_programs();
            if (!$result) $success = false;
        }
        
        if (in_array('news', $sync_types)) {
            $result = $this->sync_news();
            if (!$result) $success = false;
        }
        
        if (in_array('financial_reports', $sync_types)) {
            $result = $this->sync_financial_reports();
            if (!$result) $success = false;
        }
        
        // Update last sync
        update_option('clicky_last_sync', current_time('mysql'));
        update_option('clicky_sync_status', $success ? 'success' : 'failed');
        
        // Circuit breaker logic
        if (!$success) {
            $failures = get_option('clicky_consecutive_failures', 0) + 1;
            update_option('clicky_consecutive_failures', $failures);
            
            if ($failures >= 3) {
                // Open circuit for 5 minutes
                set_transient($this->circuit_key, true, 5 * MINUTE_IN_SECONDS);
                $this->send_failure_notification($failures);
            }
        } else {
            update_option('clicky_consecutive_failures', 0);
        }
    }

    /**
     * Sync programs
     */
    public function sync_programs() {
        $last_sync = get_option('clicky_last_sync_programs');
        
        $response = $this->make_request_with_retry(function() use ($last_sync) {
            return $this->api_client->get_programs($last_sync);
        });
        
        if (!$response['success']) {
            $this->logger->log('sync', 'programs', null, 'error', $response['error']);
            return false;
        }
        
        $programs = $response['data']['data'] ?? $response['data'] ?? array();
        $result = $this->sync_programs_batch($programs);
        
        update_option('clicky_last_sync_programs', current_time('mysql'));
        
        $this->logger->log('sync', 'programs', null, 'success', 
            sprintf('Created: %d, Updated: %d', $result['created'], $result['updated']));
        
        return true;
    }

    /**
     * Sync programs batch
     */
    public function sync_programs_batch($programs) {
        $created = 0;
        $updated = 0;
        
        foreach ($programs as $program) {
            $result = $this->sync_single_program($program);
            if ($result === 'created') $created++;
            if ($result === 'updated') $updated++;
        }
        
        return array('created' => $created, 'updated' => $updated);
    }

    /**
     * Sync single program
     */
    private function sync_single_program($data) {
        $external_id = $data['id'];
        
        // Check if already exists
        $existing = get_posts(array(
            'post_type' => 'clicky_program',
            'meta_query' => array(
                array('key' => '_clicky_external_id', 'value' => $external_id),
            ),
            'posts_per_page' => 1,
        ));
        
        $post_data = array(
            'post_title' => sanitize_text_field($data['title']),
            'post_content' => wp_kses_post($data['description'] ?? ''),
            'post_status' => 'publish',
            'post_type' => 'clicky_program',
        );
        
        if (!empty($existing)) {
            // Check if locally modified
            $locally_modified = get_post_meta($existing[0]->ID, '_clicky_locally_modified', true);
            if ($locally_modified) {
                $this->logger->log('sync', 'programs', $external_id, 'skipped', 'Locally modified');
                return 'skipped';
            }
            
            $post_data['ID'] = $existing[0]->ID;
            wp_update_post($post_data);
            $post_id = $existing[0]->ID;
            $action = 'updated';
        } else {
            $post_id = wp_insert_post($post_data);
            $action = 'created';
        }
        
        // Update meta
        update_post_meta($post_id, '_clicky_external_id', $external_id);
        update_post_meta($post_id, '_clicky_target_amount', floatval($data['target_amount'] ?? 0));
        update_post_meta($post_id, '_clicky_collected_amount', floatval($data['collected_amount'] ?? 0));
        update_post_meta($post_id, '_clicky_program_status', sanitize_text_field($data['status'] ?? 'active'));
        update_post_meta($post_id, '_clicky_last_synced', current_time('mysql'));
        update_post_meta($post_id, '_clicky_locally_modified', false);
        
        // Handle thumbnail if provided
        if (!empty($data['thumbnail_url'])) {
            $this->attach_thumbnail($post_id, $data['thumbnail_url']);
        }
        
        return $action;
    }

    /**
     * Sync news
     */
    public function sync_news() {
        $last_sync = get_option('clicky_last_sync_news');
        
        $response = $this->make_request_with_retry(function() use ($last_sync) {
            return $this->api_client->get_news($last_sync);
        });
        
        if (!$response['success']) {
            $this->logger->log('sync', 'news', null, 'error', $response['error']);
            return false;
        }
        
        $news = $response['data']['data'] ?? $response['data'] ?? array();
        $result = $this->sync_news_batch($news);
        
        update_option('clicky_last_sync_news', current_time('mysql'));
        
        $this->logger->log('sync', 'news', null, 'success', 
            sprintf('Created: %d, Updated: %d', $result['created'], $result['updated']));
        
        return true;
    }

    /**
     * Sync news batch
     */
    public function sync_news_batch($news_items) {
        $created = 0;
        $updated = 0;
        
        foreach ($news_items as $news) {
            $result = $this->sync_single_news($news);
            if ($result === 'created') $created++;
            if ($result === 'updated') $updated++;
        }
        
        return array('created' => $created, 'updated' => $updated);
    }

    /**
     * Sync single news
     */
    private function sync_single_news($data) {
        $external_id = $data['id'];
        
        $existing = get_posts(array(
            'post_type' => 'clicky_news',
            'meta_query' => array(
                array('key' => '_clicky_external_id', 'value' => $external_id),
            ),
            'posts_per_page' => 1,
        ));
        
        $post_data = array(
            'post_title' => sanitize_text_field($data['title']),
            'post_content' => wp_kses_post($data['content'] ?? ''),
            'post_status' => 'publish',
            'post_type' => 'clicky_news',
            'post_date' => $data['published_at'] ?? current_time('mysql'),
        );
        
        if (!empty($existing)) {
            $locally_modified = get_post_meta($existing[0]->ID, '_clicky_locally_modified', true);
            if ($locally_modified) {
                $this->logger->log('sync', 'news', $external_id, 'skipped', 'Locally modified');
                return 'skipped';
            }
            
            $post_data['ID'] = $existing[0]->ID;
            wp_update_post($post_data);
            $post_id = $existing[0]->ID;
            $action = 'updated';
        } else {
            $post_id = wp_insert_post($post_data);
            $action = 'created';
        }
        
        update_post_meta($post_id, '_clicky_external_id', $external_id);
        update_post_meta($post_id, '_clicky_news_category', sanitize_text_field($data['category'] ?? 'umum'));
        update_post_meta($post_id, '_clicky_last_synced', current_time('mysql'));
        update_post_meta($post_id, '_clicky_source', 'synced');
        update_post_meta($post_id, '_clicky_locally_modified', false);
        
        if (!empty($data['thumbnail_url'])) {
            $this->attach_thumbnail($post_id, $data['thumbnail_url']);
        }
        
        return $action;
    }

    /**
     * Sync financial reports
     */
    public function sync_financial_reports() {
        $last_sync = get_option('clicky_last_sync_financial');
        
        $response = $this->make_request_with_retry(function() use ($last_sync) {
            return $this->api_client->get_financial_reports($last_sync);
        });
        
        if (!$response['success']) {
            $this->logger->log('sync', 'financial_reports', null, 'error', $response['error']);
            return false;
        }
        
        $reports = $response['data']['data'] ?? $response['data'] ?? array();
        $result = $this->sync_financial_reports_batch($reports);
        
        update_option('clicky_last_sync_financial', current_time('mysql'));
        
        $this->logger->log('sync', 'financial_reports', null, 'success', 
            sprintf('Created: %d, Updated: %d', $result['created'], $result['updated']));
        
        return true;
    }

    /**
     * Sync financial reports batch
     */
    public function sync_financial_reports_batch($reports) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'clicky_financial_reports';
        $created = 0;
        $updated = 0;
        
        foreach ($reports as $report) {
            $data = array(
                'external_id' => $report['id'],
                'title' => sanitize_text_field($report['title']),
                'period_start' => $report['period_start'],
                'period_end' => $report['period_end'],
                'total_income' => floatval($report['total_income'] ?? 0),
                'total_expense' => floatval($report['total_expense'] ?? 0),
                'pdf_url' => esc_url_raw($report['pdf_url'] ?? ''),
                'is_published' => !empty($report['is_published']) ? 1 : 0,
                'synced_at' => current_time('mysql'),
            );
            
            // Check if exists
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table_name} WHERE external_id = %s",
                $report['id']
            ));
            
            if ($existing) {
                $wpdb->update($table_name, $data, array('external_id' => $report['id']));
                $updated++;
            } else {
                $wpdb->insert($table_name, $data);
                $created++;
            }
        }
        
        return array('created' => $created, 'updated' => $updated);
    }

    /**
     * Handle webhook
     */
    public function handle_webhook($event, $payload) {
        $this->logger->log('webhook', 'event', null, 'success', $event);
        
        switch ($event) {
            case 'program.created':
            case 'program.updated':
                $this->sync_single_program($payload);
                break;
                
            case 'program.deleted':
                $this->delete_program($payload['id']);
                break;
                
            case 'news.created':
            case 'news.updated':
                $this->sync_single_news($payload);
                break;
                
            case 'news.deleted':
                $this->delete_news($payload['id']);
                break;
                
            case 'financial_report.published':
                $this->sync_financial_reports_batch(array($payload));
                break;
                
            case 'donation.received':
                $this->update_program_collected_amount($payload['program_id'], $payload['amount']);
                break;
                
            default:
                return array('success' => false, 'message' => 'Unknown event: ' . $event);
        }
        
        return array('success' => true);
    }

    /**
     * Delete program
     */
    private function delete_program($external_id) {
        $existing = get_posts(array(
            'post_type' => 'clicky_program',
            'meta_query' => array(
                array('key' => '_clicky_external_id', 'value' => $external_id),
            ),
            'posts_per_page' => 1,
        ));
        
        if (!empty($existing)) {
            wp_trash_post($existing[0]->ID);
        }
    }

    /**
     * Delete news
     */
    private function delete_news($external_id) {
        $existing = get_posts(array(
            'post_type' => 'clicky_news',
            'meta_query' => array(
                array('key' => '_clicky_external_id', 'value' => $external_id),
            ),
            'posts_per_page' => 1,
        ));
        
        if (!empty($existing)) {
            wp_trash_post($existing[0]->ID);
        }
    }

    /**
     * Update program collected amount
     */
    private function update_program_collected_amount($program_id, $amount) {
        $existing = get_posts(array(
            'post_type' => 'clicky_program',
            'meta_query' => array(
                array('key' => '_clicky_external_id', 'value' => $program_id),
            ),
            'posts_per_page' => 1,
        ));
        
        if (!empty($existing)) {
            $current = floatval(get_post_meta($existing[0]->ID, '_clicky_collected_amount', true));
            update_post_meta($existing[0]->ID, '_clicky_collected_amount', $current + floatval($amount));
        }
    }

    /**
     * Make request with retry
     */
    private function make_request_with_retry($callback) {
        $attempt = 0;
        $delay = 1;
        
        while ($attempt < $this->max_retries) {
            $result = $callback();
            
            if ($result['success']) {
                return $result;
            }
            
            $attempt++;
            
            if ($attempt < $this->max_retries) {
                sleep(min($delay, 60)); // Exponential backoff, max 60s
                $delay *= 2;
            }
        }
        
        return $result;
    }

    /**
     * Attach thumbnail
     */
    private function attach_thumbnail($post_id, $url) {
        // Download and attach image (simplified)
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $tmp = download_url($url);
        
        if (!is_wp_error($tmp)) {
            $file_array = array(
                'name' => basename($url),
                'tmp_name' => $tmp,
            );
            
            $id = media_handle_sideload($file_array, $post_id);
            
            if (!is_wp_error($id)) {
                set_post_thumbnail($post_id, $id);
            }
        }
    }

    /**
     * Send failure notification
     */
    private function send_failure_notification($failures) {
        $admin_email = get_option('admin_email');
        $subject = sprintf('[%s] Sync Failed %d times', get_bloginfo('name'), $failures);
        $message = sprintf(
            "Yayasan Sahabat Khairat Indonesia sync has failed %d consecutive times.\n\n" .
            "The circuit breaker has been activated for 5 minutes.\n\n" .
            "Please check the sync logs for more details: %s",
            $failures,
            admin_url('edit.php?post_type=clicky_program&page=clicky-sync-logs')
        );
        
        wp_mail($admin_email, $subject, $message);
    }
}
