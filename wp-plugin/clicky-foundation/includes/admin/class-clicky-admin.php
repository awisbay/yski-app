<?php
/**
 * Admin functionality
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin class
 */
class Clicky_Admin {

    /**
     * Initialize admin
     */
    public function init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_clicky_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_clicky_force_sync', array($this, 'ajax_force_sync'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('Clicky Foundation Settings', 'clicky-foundation'),
            __('Clicky Foundation', 'clicky-foundation'),
            'manage_options',
            'clicky-foundation',
            array($this, 'render_settings_page')
        );
        
        // Add Financial Reports submenu
        add_submenu_page(
            'edit.php?post_type=clicky_program',
            __('Financial Reports', 'clicky-foundation'),
            __('Financial Reports', 'clicky-foundation'),
            'manage_options',
            'clicky-financial-reports',
            array($this, 'render_financial_reports_page')
        );
        
        // Add Sync Logs submenu
        add_submenu_page(
            'edit.php?post_type=clicky_program',
            __('Sync Logs', 'clicky-foundation'),
            __('Sync Logs', 'clicky-foundation'),
            'manage_options',
            'clicky-sync-logs',
            array($this, 'render_sync_logs_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // API Settings
        register_setting('clicky_settings', 'clicky_api_url', array(
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => '',
        ));
        
        register_setting('clicky_settings', 'clicky_api_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => '',
        ));
        
        register_setting('clicky_settings', 'clicky_webhook_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => '',
        ));
        
        // Sync Settings
        register_setting('clicky_settings', 'clicky_sync_interval', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_sync_interval'),
            'default' => 'hourly',
        ));
        
        register_setting('clicky_settings', 'clicky_sync_types', array(
            'type' => 'array',
            'sanitize_callback' => array($this, 'sanitize_sync_types'),
            'default' => array('programs', 'news'),
        ));
        
        register_setting('clicky_settings', 'clicky_debug_mode', array(
            'type' => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default' => false,
        ));
    }

    /**
     * Sanitize sync interval
     */
    public function sanitize_sync_interval($value) {
        $allowed = array('15min', '30min', 'hourly', 'daily');
        return in_array($value, $allowed) ? $value : 'hourly';
    }

    /**
     * Sanitize sync types
     */
    public function sanitize_sync_types($value) {
        $allowed = array('programs', 'news', 'financial_reports');
        return array_intersect((array) $value, $allowed);
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_assets($hook) {
        if ($hook !== 'settings_page_clicky-foundation') {
            return;
        }
        
        wp_enqueue_style(
            'clicky-admin-css',
            CLICKY_PLUGIN_URL . 'assets/css/clicky-admin.css',
            array(),
            CLICKY_VERSION
        );
        
        wp_enqueue_script(
            'clicky-admin-js',
            CLICKY_PLUGIN_URL . 'assets/js/clicky-admin.js',
            array('jquery'),
            CLICKY_VERSION,
            true
        );
        
        wp_localize_script('clicky-admin-js', 'clicky_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('clicky_admin_nonce'),
        ));
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        $last_sync = get_option('clicky_last_sync');
        $sync_status = get_option('clicky_sync_status');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php if ($last_sync) : ?>
            <div class="clicky-status-box">
                <h3><?php _e('Sync Status', 'clicky-foundation'); ?></h3>
                <p>
                    <strong><?php _e('Last Sync:', 'clicky-foundation'); ?></strong>
                    <?php echo esc_html(human_time_diff(strtotime($last_sync), current_time('timestamp')) . ' ago'); ?>
                    (<?php echo esc_html($last_sync); ?>)
                </p>
                <p>
                    <strong><?php _e('Status:', 'clicky-foundation'); ?></strong>
                    <span class="clicky-status-<?php echo esc_attr($sync_status); ?>">
                        <?php echo esc_html(ucfirst($sync_status)); ?>
                    </span>
                </p>
            </div>
            <?php endif; ?>
            
            <form method="post" action="options.php">
                <?php wp_nonce_field('clicky_settings_nonce', 'clicky_nonce'); ?>
                <?php settings_fields('clicky_settings'); ?>
                
                <h2><?php _e('API Configuration', 'clicky-foundation'); ?></h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="clicky_api_url"><?php _e('API Base URL', 'clicky-foundation'); ?></label>
                        </th>
                        <td>
                            <input type="url" id="clicky_api_url" name="clicky_api_url" 
                                   value="<?php echo esc_attr(get_option('clicky_api_url')); ?>" 
                                   class="regular-text"
                                   placeholder="https://api.clickyfoundation.org/api/v1">
                            <p class="description">
                                <?php _e('The base URL of your FastAPI backend.', 'clicky-foundation'); ?>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="clicky_api_key"><?php _e('API Key', 'clicky-foundation'); ?></label>
                        </th>
                        <td>
                            <input type="password" id="clicky_api_key" name="clicky_api_key" 
                                   value="<?php echo esc_attr(get_option('clicky_api_key')); ?>" 
                                   class="regular-text">
                            <p class="description">
                                <?php _e('API key for authentication with FastAPI backend.', 'clicky-foundation'); ?>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="clicky_webhook_secret"><?php _e('Webhook Secret', 'clicky-foundation'); ?></label>
                        </th>
                        <td>
                            <input type="password" id="clicky_webhook_secret" name="clicky_webhook_secret" 
                                   value="<?php echo esc_attr(get_option('clicky_webhook_secret')); ?>" 
                                   class="regular-text">
                            <p class="description">
                                <?php _e('Secret key for validating incoming webhooks.', 'clicky-foundation'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <h2><?php _e('Sync Settings', 'clicky-foundation'); ?></h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="clicky_sync_interval"><?php _e('Sync Interval', 'clicky-foundation'); ?></label>
                        </th>
                        <td>
                            <select id="clicky_sync_interval" name="clicky_sync_interval">
                                <?php
                                $intervals = array(
                                    '15min' => __('Every 15 minutes', 'clicky-foundation'),
                                    '30min' => __('Every 30 minutes', 'clicky-foundation'),
                                    'hourly' => __('Hourly', 'clicky-foundation'),
                                    'daily' => __('Daily', 'clicky-foundation'),
                                );
                                $current = get_option('clicky_sync_interval', 'hourly');
                                foreach ($intervals as $value => $label) {
                                    printf(
                                        '<option value="%s" %s>%s</option>',
                                        esc_attr($value),
                                        selected($current, $value, false),
                                        esc_html($label)
                                    );
                                }
                                ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Content Types to Sync', 'clicky-foundation'); ?></th>
                        <td>
                            <?php
                            $sync_types = (array) get_option('clicky_sync_types', array('programs', 'news'));
                            $types = array(
                                'programs' => __('Programs', 'clicky-foundation'),
                                'news' => __('News', 'clicky-foundation'),
                                'financial_reports' => __('Financial Reports', 'clicky-foundation'),
                            );
                            foreach ($types as $value => $label) {
                                printf(
                                    '<label><input type="checkbox" name="clicky_sync_types[]" value="%s" %s> %s</label><br>',
                                    esc_attr($value),
                                    checked(in_array($value, $sync_types), true, false),
                                    esc_html($label)
                                );
                            }
                            ?>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Debug Mode', 'clicky-foundation'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="clicky_debug_mode" value="1" 
                                    <?php checked(get_option('clicky_debug_mode'), true); ?>>
                                <?php _e('Enable debug logging', 'clicky-foundation'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <?php submit_button(null, 'primary', 'submit', false); ?>
                    <button type="button" class="button" id="clicky-test-connection">
                        <?php _e('Test Connection', 'clicky-foundation'); ?>
                    </button>
                    <button type="button" class="button" id="clicky-force-sync">
                        <?php _e('Force Sync Now', 'clicky-foundation'); ?>
                    </button>
                </p>
            </form>
            
            <div id="clicky-ajax-response"></div>
        </div>
        <?php
    }

    /**
     * AJAX test connection
     */
    public function ajax_test_connection() {
        check_ajax_referer('clicky_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized', 'clicky-foundation')));
        }
        
        $api_url = get_option('clicky_api_url');
        $api_key = get_option('clicky_api_key');
        
        if (empty($api_url) || empty($api_key)) {
            wp_send_json_error(array('message' => __('API URL and Key are required.', 'clicky-foundation')));
        }
        
        $response = wp_remote_get($api_url . '/health', array(
            'headers' => array(
                'X-Clicky-API-Key' => $api_key,
            ),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        $code = wp_remote_retrieve_response_code($response);
        
        if ($code === 200) {
            wp_send_json_success(array('message' => __('Connection successful!', 'clicky-foundation')));
        } else {
            wp_send_json_error(array('message' => sprintf(__('HTTP Error: %d', 'clicky-foundation'), $code)));
        }
    }

    /**
     * AJAX force sync
     */
    public function ajax_force_sync() {
        check_ajax_referer('clicky_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized', 'clicky-foundation')));
        }
        
        // Trigger sync
        do_action('clicky_sync_content');
        
        wp_send_json_success(array('message' => __('Sync triggered. Check sync logs for details.', 'clicky-foundation')));
    }

    /**
     * Render financial reports page
     */
    public function render_financial_reports_page() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'clicky_financial_reports';
        $reports = $wpdb->get_results("SELECT * FROM {$table_name} ORDER BY period_start DESC");
        
        ?>
        <div class="wrap">
            <h1><?php _e('Financial Reports', 'clicky-foundation'); ?></h1>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Title', 'clicky-foundation'); ?></th>
                        <th><?php _e('Period', 'clicky-foundation'); ?></th>
                        <th><?php _e('Income', 'clicky-foundation'); ?></th>
                        <th><?php _e('Expense', 'clicky-foundation'); ?></th>
                        <th><?php _e('Status', 'clicky-foundation'); ?></th>
                        <th><?php _e('Synced At', 'clicky-foundation'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($reports) : ?>
                        <?php foreach ($reports as $report) : ?>
                        <tr>
                            <td><?php echo esc_html($report->title); ?></td>
                            <td><?php echo esc_html($report->period_start . ' - ' . $report->period_end); ?></td>
                            <td>Rp <?php echo number_format($report->total_income, 0, ',', '.'); ?></td>
                            <td>Rp <?php echo number_format($report->total_expense, 0, ',', '.'); ?></td>
                            <td><?php echo $report->is_published ? __('Published', 'clicky-foundation') : __('Draft', 'clicky-foundation'); ?></td>
                            <td><?php echo esc_html($report->synced_at); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    <?php else : ?>
                        <tr>
                            <td colspan="6"><?php _e('No financial reports found.', 'clicky-foundation'); ?></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    /**
     * Render sync logs page
     */
    public function render_sync_logs_page() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'clicky_sync_logs';
        $logs = $wpdb->get_results("SELECT * FROM {$table_name} ORDER BY timestamp DESC LIMIT 100");
        
        ?>
        <div class="wrap">
            <h1><?php _e('Sync Logs', 'clicky-foundation'); ?></h1>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Timestamp', 'clicky-foundation'); ?></th>
                        <th><?php _e('Action', 'clicky-foundation'); ?></th>
                        <th><?php _e('Content Type', 'clicky-foundation'); ?></th>
                        <th><?php _e('External ID', 'clicky-foundation'); ?></th>
                        <th><?php _e('Status', 'clicky-foundation'); ?></th>
                        <th><?php _e('Message', 'clicky-foundation'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($logs) : ?>
                        <?php foreach ($logs as $log) : ?>
                        <tr class="clicky-log-<?php echo esc_attr($log->status); ?>">
                            <td><?php echo esc_html($log->timestamp); ?></td>
                            <td><?php echo esc_html($log->action); ?></td>
                            <td><?php echo esc_html($log->content_type); ?></td>
                            <td><?php echo esc_html($log->external_id); ?></td>
                            <td>
                                <span class="clicky-status-<?php echo esc_attr($log->status); ?>">
                                    <?php echo esc_html(ucfirst($log->status)); ?>
                                </span>
                            </td>
                            <td><?php echo esc_html($log->message); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    <?php else : ?>
                        <tr>
                            <td colspan="6"><?php _e('No sync logs found.', 'clicky-foundation'); ?></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
}
