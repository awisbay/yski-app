<?php
/**
 * Main plugin class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Clicky_Foundation {
    
    /**
     * Initialize the plugin
     */
    public function init() {
        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Register settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // Register shortcodes
        add_shortcode('clicky_donation_form', array($this, 'render_donation_form'));
    }
    
    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_options_page(
            'Clicky Foundation Settings',
            'Clicky Foundation',
            'manage_options',
            'clicky-foundation',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('clicky_foundation', 'clicky_foundation_api_url');
        register_setting('clicky_foundation', 'clicky_foundation_api_key');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('clicky_foundation');
                do_settings_sections('clicky_foundation');
                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">API URL</th>
                        <td>
                            <input type="url" name="clicky_foundation_api_url" 
                                   value="<?php echo esc_attr(get_option('clicky_foundation_api_url')); ?>" 
                                   class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">API Key</th>
                        <td>
                            <input type="password" name="clicky_foundation_api_key" 
                                   value="<?php echo esc_attr(get_option('clicky_foundation_api_key')); ?>" 
                                   class="regular-text">
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Render donation form shortcode
     */
    public function render_donation_form($atts) {
        // Placeholder for donation form
        return '<div class="clicky-donation-form">Donation form will be rendered here.</div>';
    }
}
