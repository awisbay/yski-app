<?php
/**
 * Equipment List Shortcode
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Equipment List Shortcode class
 */
class Clicky_Shortcode_Equipment {

    /**
     * Register shortcode
     */
    public function init() {
        add_shortcode('clicky_equipment_list', array($this, 'render'));
    }

    /**
     * Render shortcode
     */
    public function render($atts) {
        $atts = shortcode_atts(array(
            'category' => '',
            'limit' => 12,
            'layout' => 'grid',
            'show_availability' => 'true',
        ), $atts, 'clicky_equipment_list');
        
        // Fetch from API
        $api_client = new Clicky_API_Client();
        
        if (!$api_client->is_configured()) {
            return '<p>' . __('Equipment data temporarily unavailable.', 'clicky-foundation') . '</p>';
        }
        
        $cache_key = 'clicky_equipment_' . md5(serialize($atts));
        $equipment = get_transient($cache_key);
        
        if ($equipment === false) {
            $response = $api_client->get_equipment($atts['category']);
            
            if (!$response['success']) {
                return '<p>' . __('Unable to load equipment data.', 'clicky-foundation') . '</p>';
            }
            
            $equipment = $response['data']['data'] ?? $response['data'] ?? array();
            set_transient($cache_key, $equipment, 5 * MINUTE_IN_SECONDS);
        }
        
        if (empty($equipment)) {
            return '<p>' . __('Tidak ada alat kesehatan tersedia.', 'clicky-foundation') . '</p>';
        }
        
        // Limit results
        $equipment = array_slice($equipment, 0, intval($atts['limit']));
        
        wp_enqueue_style('clicky-public');
        
        $layout_class = $atts['layout'] === 'list' ? 'clicky-equipment-list' : 'clicky-equipment-grid';
        
        ob_start();
        ?>
        <div class="<?php echo esc_attr($layout_class); ?>">
            <?php foreach ($equipment as $item) : 
                $available = intval($item['stock_available'] ?? 0);
                $is_available = $available > 0;
            ?>
            <div class="clicky-equipment-card <?php echo $is_available ? '' : 'clicky-unavailable'; ?>">
                <?php if (!empty($item['photo_url'])) : ?>
                <div class="clicky-equipment-image">
                    <img src="<?php echo esc_url($item['photo_url']); ?>" alt="<?php echo esc_attr($item['name']); ?>">
                </div>
                <?php endif; ?>
                
                <div class="clicky-equipment-content">
                    <h4 class="clicky-equipment-name"><?php echo esc_html($item['name']); ?></h4>
                    
                    <?php if (!empty($item['category'])) : ?>
                    <span class="clicky-equipment-category"><?php echo esc_html($item['category']); ?></span>
                    <?php endif; ?>
                    
                    <p class="clicky-equipment-description">
                        <?php echo esc_html(wp_trim_words($item['description'] ?? '', 15)); ?>
                    </p>
                    
                    <?php if ($atts['show_availability'] === 'true') : ?>
                    <div class="clicky-equipment-availability">
                        <?php if ($is_available) : ?>
                            <span class="clicky-badge clicky-available">
                                <?php printf(__('Tersedia: %d', 'clicky-foundation'), $available); ?>
                            </span>
                        <?php else : ?>
                            <span class="clicky-badge clicky-unavailable">
                                <?php _e('Habis', 'clicky-foundation'); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php
        
        return ob_get_clean();
    }
}
