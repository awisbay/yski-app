<?php
/**
 * API Client for FastAPI backend
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * API Client class
 */
class Clicky_API_Client {

    /**
     * API base URL
     */
    private $base_url;

    /**
     * API key
     */
    private $api_key;

    /**
     * Debug mode
     */
    private $debug;

    /**
     * Constructor
     */
    public function __construct() {
        $this->base_url = rtrim(get_option('clicky_api_url'), '/');
        $this->api_key = get_option('clicky_api_key');
        $this->debug = get_option('clicky_debug_mode', false);
    }

    /**
     * Check if API is configured
     */
    public function is_configured() {
        return !empty($this->base_url) && !empty($this->api_key);
    }

    /**
     * Get programs from API
     */
    public function get_programs($updated_after = null) {
        $url = $this->base_url . '/programs';
        
        if ($updated_after) {
            $url = add_query_arg('updated_after', $updated_after, $url);
        }
        
        return $this->get($url);
    }

    /**
     * Get news from API
     */
    public function get_news($updated_after = null) {
        $url = $this->base_url . '/news';
        
        if ($updated_after) {
            $url = add_query_arg('updated_after', $updated_after, $url);
        }
        
        return $this->get($url);
    }

    /**
     * Get financial reports from API
     */
    public function get_financial_reports($updated_after = null) {
        $url = $this->base_url . '/financial/reports';
        
        if ($updated_after) {
            $url = add_query_arg('updated_after', $updated_after, $url);
        }
        
        return $this->get($url);
    }

    /**
     * Get equipment list
     */
    public function get_equipment($category = null) {
        $url = $this->base_url . '/equipment';
        
        if ($category) {
            $url = add_query_arg('category', $category, $url);
        }
        
        return $this->get($url);
    }

    /**
     * Test connection
     */
    public function test_connection() {
        return $this->get($this->base_url . '/health');
    }

    /**
     * GET request
     */
    private function get($url) {
        $args = array(
            'headers' => array(
                'X-Clicky-API-Key' => $this->api_key,
                'Accept' => 'application/json',
            ),
            'timeout' => 30,
        );
        
        if ($this->debug) {
            error_log('Clicky API Request: GET ' . $url);
        }
        
        $response = wp_remote_get($url, $args);
        
        return $this->handle_response($response);
    }

    /**
     * POST request
     */
    private function post($url, $data) {
        $args = array(
            'headers' => array(
                'X-Clicky-API-Key' => $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($data),
            'timeout' => 30,
        );
        
        if ($this->debug) {
            error_log('Clicky API Request: POST ' . $url . ' Body: ' . json_encode($data));
        }
        
        $response = wp_remote_post($url, $args);
        
        return $this->handle_response($response);
    }

    /**
     * Handle API response
     */
    private function handle_response($response) {
        if (is_wp_error($response)) {
            if ($this->debug) {
                error_log('Clicky API Error: ' . $response->get_error_message());
            }
            return array(
                'success' => false,
                'error' => $response->get_error_message(),
            );
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($this->debug) {
            error_log('Clicky API Response: ' . $code . ' Body: ' . $body);
        }
        
        if ($code >= 200 && $code < 300) {
            return array(
                'success' => true,
                'data' => $data,
                'code' => $code,
            );
        } else {
            return array(
                'success' => false,
                'error' => $data['detail'] ?? 'HTTP Error ' . $code,
                'code' => $code,
            );
        }
    }
}
