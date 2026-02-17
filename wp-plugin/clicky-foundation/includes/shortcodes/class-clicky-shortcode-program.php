<?php
/**
 * Program Progress Shortcode
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Program Progress Shortcode class
 */
class Clicky_Shortcode_Program {

    /**
     * Register shortcode
     */
    public function init() {
        add_shortcode('clicky_program_progress', array($this, 'render'));
    }

    /**
     * Render shortcode
     */
    public function render($atts) {
        $atts = shortcode_atts(array(
            'program_id' => '',
            'limit' => 6,
            'status' => 'active',
            'show_donate_button' => 'true',
        ), $atts, 'clicky_program_progress');
        
        // Try to get from cache
        $cache_key = 'clicky_programs_' . md5(serialize($atts));
        $output = get_transient($cache_key);
        
        if ($output !== false) {
            return $output;
        }
        
        $args = array(
            'post_type' => 'clicky_program',
            'posts_per_page' => intval($atts['limit']),
            'post_status' => 'publish',
        );
        
        if ($atts['program_id']) {
            $args['meta_query'] = array(
                array('key' => '_clicky_external_id', 'value' => sanitize_text_field($atts['program_id'])),
            );
        }
        
        if ($atts['status']) {
            $args['meta_query'][] = array(
                'key' => '_clicky_program_status',
                'value' => sanitize_text_field($atts['status']),
            );
        }
        
        $query = new WP_Query($args);
        
        if (!$query->have_posts()) {
            return '<p>' . __('Tidak ada program ditemukan.', 'clicky-foundation') . '</p>';
        }
        
        wp_enqueue_style('clicky-public');
        
        ob_start();
        ?>
        <div class="clicky-programs-grid">
            <?php while ($query->have_posts()) : $query->the_post(); 
                $target = floatval(get_post_meta(get_the_ID(), '_clicky_target_amount', true));
                $collected = floatval(get_post_meta(get_the_ID(), '_clicky_collected_amount', true));
                $external_id = get_post_meta(get_the_ID(), '_clicky_external_id', true);
                $progress = $target > 0 ? min(100, ($collected / $target) * 100) : 0;
            ?>
            <div class="clicky-program-card">
                <?php if (has_post_thumbnail()) : ?>
                <div class="clicky-program-image">
                    <?php the_post_thumbnail('medium'); ?>
                </div>
                <?php endif; ?>
                
                <div class="clicky-program-content">
                    <h3 class="clicky-program-title"><?php the_title(); ?></h3>
                    <div class="clicky-program-description">
                        <?php echo wp_trim_words(get_the_excerpt(), 20); ?>
                    </div>
                    
                    <div class="clicky-program-progress">
                        <div class="clicky-progress-bar">
                            <div class="clicky-progress-fill" style="width: <?php echo esc_attr($progress); ?>%"></div>
                        </div>
                        <div class="clicky-progress-stats">
                            <span class="clicky-progress-percent"><?php echo number_format($progress, 1); ?>%</span>
                            <span class="clicky-progress-amount">
                                Rp <?php echo number_format($collected, 0, ',', '.'); ?> / 
                                Rp <?php echo number_format($target, 0, ',', '.'); ?>
                            </span>
                        </div>
                    </div>
                    
                    <?php if ($atts['show_donate_button'] === 'true') : ?>
                    <a href="<?php echo esc_url(add_query_arg('program', $external_id, '/donasi')); ?>" 
                       class="clicky-donate-btn">
                        <?php _e('Donasi Sekarang', 'clicky-foundation'); ?>
                    </a>
                    <?php endif; ?>
                </div>
            </div>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
        <?php
        
        $output = ob_get_clean();
        
        // Cache for 5 minutes
        set_transient($cache_key, $output, 5 * MINUTE_IN_SECONDS);
        
        return $output;
    }
}
