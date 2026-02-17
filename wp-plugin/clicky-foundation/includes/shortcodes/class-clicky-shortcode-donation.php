<?php
/**
 * Donation Form Shortcode
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Donation Form Shortcode class
 */
class Clicky_Shortcode_Donation {

    /**
     * Register shortcode
     */
    public function init() {
        add_shortcode('clicky_donation_form', array($this, 'render'));
    }

    /**
     * Render shortcode
     */
    public function render($atts) {
        $atts = shortcode_atts(array(
            'program_id' => '',
            'amounts' => '50000,100000,250000,500000,1000000',
            'show_program_select' => 'true',
            'button_text' => 'Donasi Sekarang',
            'redirect_url' => '',
        ), $atts, 'clicky_donation_form');
        
        wp_enqueue_style('clicky-public');
        wp_enqueue_script('clicky-public');
        
        ob_start();
        include CLICKY_PLUGIN_DIR . 'templates/shortcode-donation-form.php';
        return ob_get_clean();
    }
}
