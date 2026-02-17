<?php
/**
 * News Feed Shortcode
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * News Feed Shortcode class
 */
class Clicky_Shortcode_News {

    /**
     * Register shortcode
     */
    public function init() {
        add_shortcode('clicky_news_feed', array($this, 'render'));
    }

    /**
     * Render shortcode
     */
    public function render($atts) {
        $atts = shortcode_atts(array(
            'limit' => 5,
            'category' => '',
            'layout' => 'list',
            'show_thumbnail' => 'true',
            'excerpt_length' => 30,
        ), $atts, 'clicky_news_feed');
        
        $args = array(
            'post_type' => 'clicky_news',
            'posts_per_page' => intval($atts['limit']),
            'post_status' => 'publish',
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        if ($atts['category']) {
            $args['meta_query'] = array(
                array(
                    'key' => '_clicky_news_category',
                    'value' => sanitize_text_field($atts['category']),
                ),
            );
        }
        
        $query = new WP_Query($args);
        
        if (!$query->have_posts()) {
            return '<p>' . __('Tidak ada berita ditemukan.', 'clicky-foundation') . '</p>';
        }
        
        wp_enqueue_style('clicky-public');
        
        $layout_class = $atts['layout'] === 'grid' ? 'clicky-news-grid' : 'clicky-news-list';
        
        ob_start();
        ?>
        <div class="<?php echo esc_attr($layout_class); ?>">
            <?php while ($query->have_posts()) : $query->the_post(); 
                $category = get_post_meta(get_the_ID(), '_clicky_news_category', true);
            ?>
            <article class="clicky-news-item">
                <?php if ($atts['show_thumbnail'] === 'true' && has_post_thumbnail()) : ?>
                <div class="clicky-news-thumbnail">
                    <a href="<?php the_permalink(); ?>">
                        <?php the_post_thumbnail('thumbnail'); ?>
                    </a>
                </div>
                <?php endif; ?>
                
                <div class="clicky-news-content">
                    <?php if ($category) : ?>
                    <span class="clicky-news-category"><?php echo esc_html(ucfirst($category)); ?></span>
                    <?php endif; ?>
                    
                    <h4 class="clicky-news-title">
                        <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                    </h4>
                    
                    <div class="clicky-news-meta">
                        <time datetime="<?php echo get_the_date('c'); ?>">
                            <?php echo get_the_date(); ?>
                        </time>
                    </div>
                    
                    <div class="clicky-news-excerpt">
                        <?php echo wp_trim_words(get_the_excerpt(), intval($atts['excerpt_length'])); ?>
                    </div>
                    
                    <a href="<?php the_permalink(); ?>" class="clicky-read-more">
                        <?php _e('Baca Selengkapnya', 'clicky-foundation'); ?> →
                    </a>
                </div>
            </article>
            <?php endwhile; wp_reset_postdata(); ?>
        </div>
        <?php
        
        return ob_get_clean();
    }
}
