<?php
/**
 * Program Custom Post Type
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Program CPT class
 */
class Clicky_CPT_Program {

    /**
     * Initialize
     */
    public function init() {
        add_action('init', array($this, 'register_cpt'));
        add_action('init', array($this, 'register_taxonomy'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post', array($this, 'save_meta_boxes'));
        add_filter('manage_clicky_program_posts_columns', array($this, 'add_admin_columns'));
        add_action('manage_clicky_program_posts_custom_column', array($this, 'render_admin_columns'), 10, 2);
    }

    /**
     * Register Custom Post Type
     */
    public function register_cpt() {
        $labels = array(
            'name'                  => __('Program Yayasan', 'clicky-foundation'),
            'singular_name'         => __('Program', 'clicky-foundation'),
            'menu_name'             => __('Program', 'clicky-foundation'),
            'name_admin_bar'        => __('Program', 'clicky-foundation'),
            'add_new'               => __('Tambah Baru', 'clicky-foundation'),
            'add_new_item'          => __('Tambah Program Baru', 'clicky-foundation'),
            'new_item'              => __('Program Baru', 'clicky-foundation'),
            'edit_item'             => __('Edit Program', 'clicky-foundation'),
            'view_item'             => __('Lihat Program', 'clicky-foundation'),
            'all_items'             => __('Semua Program', 'clicky-foundation'),
            'search_items'          => __('Cari Program', 'clicky-foundation'),
            'parent_item_colon'     => __('Program Induk:', 'clicky-foundation'),
            'not_found'             => __('Tidak ada program ditemukan.', 'clicky-foundation'),
            'not_found_in_trash'    => __('Tidak ada program di tong sampah.', 'clicky-foundation'),
        );

        $args = array(
            'labels'                => $labels,
            'public'                => true,
            'publicly_queryable'    => true,
            'show_ui'               => true,
            'show_in_menu'          => true,
            'menu_icon'             => 'dashicons-heart',
            'query_var'             => true,
            'rewrite'               => array('slug' => 'program'),
            'capability_type'       => 'post',
            'has_archive'           => true,
            'hierarchical'          => false,
            'menu_position'         => 25,
            'supports'              => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'show_in_rest'          => true,
        );

        register_post_type('clicky_program', $args);
    }

    /**
     * Register taxonomy
     */
    public function register_taxonomy() {
        $labels = array(
            'name'          => __('Kategori Program', 'clicky-foundation'),
            'singular_name' => __('Kategori', 'clicky-foundation'),
        );

        $args = array(
            'labels'        => $labels,
            'hierarchical'  => true,
            'public'        => true,
            'show_ui'       => true,
            'show_in_rest'  => true,
            'rewrite'       => array('slug' => 'program-category'),
        );

        register_taxonomy('clicky_program_category', array('clicky_program'), $args);
    }

    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        add_meta_box(
            'clicky_program_details',
            __('Detail Program', 'clicky-foundation'),
            array($this, 'render_meta_box'),
            'clicky_program',
            'normal',
            'high'
        );
    }

    /**
     * Render meta box
     */
    public function render_meta_box($post) {
        wp_nonce_field('clicky_program_meta', 'clicky_program_meta_nonce');
        
        $target_amount = get_post_meta($post->ID, '_clicky_target_amount', true);
        $collected_amount = get_post_meta($post->ID, '_clicky_collected_amount', true);
        $status = get_post_meta($post->ID, '_clicky_program_status', true);
        $external_id = get_post_meta($post->ID, '_clicky_external_id', true);
        $last_synced = get_post_meta($post->ID, '_clicky_last_synced', true);
        $locally_modified = get_post_meta($post->ID, '_clicky_locally_modified', true);
        
        $statuses = array(
            'active' => __('Aktif', 'clicky-foundation'),
            'completed' => __('Selesai', 'clicky-foundation'),
            'cancelled' => __('Dibatalkan', 'clicky-foundation'),
        );
        ?>
        <table class="form-table">
            <tr>
                <th><label for="clicky_target_amount"><?php _e('Target Dana (Rp)', 'clicky-foundation'); ?></label></th>
                <td>
                    <input type="number" id="clicky_target_amount" name="clicky_target_amount" 
                           value="<?php echo esc_attr($target_amount); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th><label for="clicky_collected_amount"><?php _e('Dana Terkumpul (Rp)', 'clicky-foundation'); ?></label></th>
                <td>
                    <input type="number" id="clicky_collected_amount" name="clicky_collected_amount" 
                           value="<?php echo esc_attr($collected_amount); ?>" class="regular-text" readonly>
                    <p class="description"><?php _e('Diperbarui otomatis dari sistem.', 'clicky-foundation'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="clicky_program_status"><?php _e('Status Program', 'clicky-foundation'); ?></label></th>
                <td>
                    <select id="clicky_program_status" name="clicky_program_status">
                        <?php foreach ($statuses as $key => $label) : ?>
                            <option value="<?php echo esc_attr($key); ?>" <?php selected($status, $key); ?>>
                                <?php echo esc_html($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
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
            <?php if ($locally_modified) : ?>
            <tr>
                <th><?php _e('Status', 'clicky-foundation'); ?></th>
                <td>
                    <span style="color: orange;">⚠️ <?php _e('Locally Modified', 'clicky-foundation'); ?></span>
                </td>
            </tr>
            <?php endif; ?>
        </table>
        
        <?php if ($target_amount > 0) : 
            $progress = min(100, ($collected_amount / $target_amount) * 100);
        ?>
        <div style="margin-top: 20px;">
            <h4><?php _e('Progress', 'clicky-foundation'); ?></h4>
            <div style="background: #f0f0f0; border-radius: 4px; height: 24px; overflow: hidden;">
                <div style="background: #4CAF50; height: 100%; width: <?php echo esc_attr($progress); ?>%; "></div>
            </div>
            <p><?php echo number_format($progress, 1); ?>% (Rp <?php echo number_format($collected_amount, 0, ',', '.'); ?> / Rp <?php echo number_format($target_amount, 0, ',', '.'); ?>)</p>
        </div>
        <?php endif; ?>
        <?php
    }

    /**
     * Save meta boxes
     */
    public function save_meta_boxes($post_id) {
        if (!isset($_POST['clicky_program_meta_nonce'])) {
            return;
        }
        
        if (!wp_verify_nonce($_POST['clicky_program_meta_nonce'], 'clicky_program_meta')) {
            return;
        }
        
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Save editable fields
        if (isset($_POST['clicky_target_amount'])) {
            update_post_meta($post_id, '_clicky_target_amount', floatval($_POST['clicky_target_amount']));
        }
        
        if (isset($_POST['clicky_program_status'])) {
            update_post_meta($post_id, '_clicky_program_status', sanitize_text_field($_POST['clicky_program_status']));
        }
        
        // Mark as locally modified
        update_post_meta($post_id, '_clicky_locally_modified', true);
    }

    /**
     * Add admin columns
     */
    public function add_admin_columns($columns) {
        $new_columns = array();
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'title') {
                $new_columns['target'] = __('Target', 'clicky-foundation');
                $new_columns['collected'] = __('Terkumpul', 'clicky-foundation');
                $new_columns['status'] = __('Status', 'clicky-foundation');
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
            case 'target':
                $amount = get_post_meta($post_id, '_clicky_target_amount', true);
                echo $amount ? 'Rp ' . number_format($amount, 0, ',', '.') : '-';
                break;
                
            case 'collected':
                $amount = get_post_meta($post_id, '_clicky_collected_amount', true);
                echo $amount ? 'Rp ' . number_format($amount, 0, ',', '.') : '-';
                break;
                
            case 'status':
                $status = get_post_meta($post_id, '_clicky_program_status', true);
                $labels = array(
                    'active' => '<span style="color: green;">● Aktif</span>',
                    'completed' => '<span style="color: blue;">● Selesai</span>',
                    'cancelled' => '<span style="color: red;">● Dibatalkan</span>',
                );
                echo $status ? $labels[$status] ?? esc_html($status) : '-';
                break;
                
            case 'synced':
                $synced = get_post_meta($post_id, '_clicky_last_synced', true);
                echo $synced ? esc_html(human_time_diff(strtotime($synced), current_time('timestamp')) . ' ago') : '-';
                break;
        }
    }
}
