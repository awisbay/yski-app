<?php
/**
 * News Custom Post Type
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * News CPT class
 */
class Clicky_CPT_News {

    /**
     * Initialize
     */
    public function init() {
        add_action('init', array($this, 'register_cpt'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post', array($this, 'save_meta_boxes'));
        add_filter('manage_clicky_news_posts_columns', array($this, 'add_admin_columns'));
        add_action('manage_clicky_news_posts_custom_column', array($this, 'render_admin_columns'), 10, 2);
    }

    /**
     * Register Custom Post Type
     */
    public function register_cpt() {
        $labels = array(
            'name'                  => __('Berita Yayasan', 'clicky-foundation'),
            'singular_name'         => __('Berita', 'clicky-foundation'),
            'menu_name'             => __('Berita', 'clicky-foundation'),
            'name_admin_bar'        => __('Berita', 'clicky-foundation'),
            'add_new'               => __('Tambah Baru', 'clicky-foundation'),
            'add_new_item'          => __('Tambah Berita Baru', 'clicky-foundation'),
            'new_item'              => __('Berita Baru', 'clicky-foundation'),
            'edit_item'             => __('Edit Berita', 'clicky-foundation'),
            'view_item'             => __('Lihat Berita', 'clicky-foundation'),
            'all_items'             => __('Semua Berita', 'clicky-foundation'),
            'search_items'          => __('Cari Berita', 'clicky-foundation'),
            'not_found'             => __('Tidak ada berita ditemukan.', 'clicky-foundation'),
            'not_found_in_trash'    => __('Tidak ada berita di tong sampah.', 'clicky-foundation'),
        );

        $args = array(
            'labels'                => $labels,
            'public'                => true,
            'publicly_queryable'    => true,
            'show_ui'               => true,
            'show_in_menu'          => true,
            'menu_icon'             => 'dashicons-media-document',
            'query_var'             => true,
            'rewrite'               => array('slug' => 'berita'),
            'capability_type'       => 'post',
            'has_archive'           => true,
            'hierarchical'          => false,
            'menu_position'         => 26,
            'supports'              => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'show_in_rest'          => true,
        );

        register_post_type('clicky_news', $args);
    }

    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        add_meta_box(
            'clicky_news_details',
            __('Detail Berita', 'clicky-foundation'),
            array($this, 'render_meta_box'),
            'clicky_news',
            'normal',
            'high'
        );
    }

    /**
     * Render meta box
     */
    public function render_meta_box($post) {
        wp_nonce_field('clicky_news_meta', 'clicky_news_meta_nonce');
        
        $category = get_post_meta($post->ID, '_clicky_news_category', true);
        $external_id = get_post_meta($post->ID, '_clicky_external_id', true);
        $last_synced = get_post_meta($post->ID, '_clicky_last_synced', true);
        $source = get_post_meta($post->ID, '_clicky_source', true);
        
        $categories = array(
            'umum' => __('Umum', 'clicky-foundation'),
            'kegiatan' => __('Kegiatan', 'clicky-foundation'),
            'laporan' => __('Laporan', 'clicky-foundation'),
            'pengumuman' => __('Pengumuman', 'clicky-foundation'),
        );
        ?>
        <table class="form-table">
            <tr>
                <th><label for="clicky_news_category"><?php _e('Kategori Berita', 'clicky-foundation'); ?></label></th>
                <td>
                    <select id="clicky_news_category" name="clicky_news_category">
                        <?php foreach ($categories as $key => $label) : ?>
                            <option value="<?php echo esc_attr($key); ?>" <?php selected($category, $key); ?>>
                                <?php echo esc_html($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th><?php _e('Source', 'clicky-foundation'); ?></th>
                <td>
                    <code><?php echo esc_html($source ?: 'local'); ?></code>
                    <p class="description"><?php _e('local = created in WP, synced = from FastAPI', 'clicky-foundation'); ?></p>
                </td>
            </tr>
            <tr>
                <th><?php _e('External ID', 'clicky-foundation'); ?></th>
                <td>
                    <code><?php echo esc_html($external_id ?: '-'); ?></code>
                    <p class="description"><?php _e('ID dari sistem FastAPI (read-only).', 'clicky-foundation'); ?></p>
                </td>
            </tr>
            <tr>
                <th><?php _e('Last Synced', 'clicky-foundation'); ?></th>
                <td>
                    <?php echo esc_html($last_synced ?: '-'); ?>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Save meta boxes
     */
    public function save_meta_boxes($post_id) {
        if (!isset($_POST['clicky_news_meta_nonce'])) {
            return;
        }
        
        if (!wp_verify_nonce($_POST['clicky_news_meta_nonce'], 'clicky_news_meta')) {
            return;
        }
        
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        if (isset($_POST['clicky_news_category'])) {
            update_post_meta($post_id, '_clicky_news_category', sanitize_text_field($_POST['clicky_news_category']));
        }
    }

    /**
     * Add admin columns
     */
    public function add_admin_columns($columns) {
        $new_columns = array();
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'title') {
                $new_columns['category'] = __('Kategori', 'clicky-foundation');
                $new_columns['source'] = __('Source', 'clicky-foundation');
                $new_columns['synced'] = __('Last Sync', 'clicky-foundation');
            }
        }
        return $new_columns;
    }

    /**
     * Render admin columns
     */
    public function render_admin_columns($column, $post_id) {
        switch ($column) {
            case 'category':
                $category = get_post_meta($post_id, '_clicky_news_category', true);
                $labels = array(
                    'umum' => __('Umum', 'clicky-foundation'),
                    'kegiatan' => __('Kegiatan', 'clicky-foundation'),
                    'laporan' => __('Laporan', 'clicky-foundation'),
                    'pengumuman' => __('Pengumuman', 'clicky-foundation'),
                );
                echo $category ? esc_html($labels[$category] ?? $category) : '-';
                break;
                
            case 'source':
                $source = get_post_meta($post_id, '_clicky_source', true);
                echo $source === 'synced' 
                    ? '<span style="color: blue;">↔️ Synced</span>' 
                    : '<span style="color: green;">📝 Local</span>';
                break;
                
            case 'synced':
                $synced = get_post_meta($post_id, '_clicky_last_synced', true);
                echo $synced ? esc_html(human_time_diff(strtotime($synced), current_time('timestamp')) . ' ago') : '-';
                break;
        }
    }
}
