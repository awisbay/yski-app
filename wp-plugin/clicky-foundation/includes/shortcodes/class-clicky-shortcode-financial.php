<?php
/**
 * Financial Report Shortcode
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Financial Report Shortcode class
 */
class Clicky_Shortcode_Financial {

    /**
     * Register shortcode
     */
    public function init() {
        add_shortcode('clicky_financial_report', array($this, 'render'));
    }

    /**
     * Render shortcode
     */
    public function render($atts) {
        global $wpdb;
        
        $atts = shortcode_atts(array(
            'period' => '',
            'limit' => 5,
            'show_chart' => 'true',
            'show_download' => 'true',
        ), $atts, 'clicky_financial_report');
        
        // Try cache
        $cache_key = 'clicky_financial_' . md5(serialize($atts));
        $output = get_transient($cache_key);
        
        if ($output !== false) {
            return $output;
        }
        
        $table_name = $wpdb->prefix . 'clicky_financial_reports';
        
        $sql = "SELECT * FROM {$table_name} WHERE is_published = 1";
        
        if ($atts['period']) {
            $sql .= $wpdb->prepare(" AND period_start >= %s", sanitize_text_field($atts['period']));
        }
        
        $sql .= " ORDER BY period_start DESC LIMIT " . intval($atts['limit']);
        
        $reports = $wpdb->get_results($sql);
        
        if (empty($reports)) {
            return '<p>' . __('Tidak ada laporan keuangan ditemukan.', 'clicky-foundation') . '</p>';
        }
        
        wp_enqueue_style('clicky-public');
        
        if ($atts['show_chart'] === 'true') {
            wp_enqueue_script('chart-js', 'https://cdn.jsdelivr.net/npm/chart.js', array(), null, true);
        }
        
        ob_start();
        ?>
        <div class="clicky-financial-reports">
            <?php foreach ($reports as $report) : 
                $net = $report->total_income - $report->total_expense;
            ?>
            <div class="clicky-financial-report">
                <h4 class="clicky-report-title"><?php echo esc_html($report->title); ?></h4>
                <p class="clicky-report-period">
                    <?php echo esc_html($report->period_start . ' - ' . $report->period_end); ?>
                </p>
                
                <div class="clicky-report-summary">
                    <div class="clicky-report-income">
                        <span class="clicky-label"><?php _e('Pemasukan', 'clicky-foundation'); ?></span>
                        <span class="clicky-amount clicky-positive">
                            Rp <?php echo number_format($report->total_income, 0, ',', '.'); ?>
                        </span>
                    </div>
                    <div class="clicky-report-expense">
                        <span class="clicky-label"><?php _e('Pengeluaran', 'clicky-foundation'); ?></span>
                        <span class="clicky-amount clicky-negative">
                            Rp <?php echo number_format($report->total_expense, 0, ',', '.'); ?>
                        </span>
                    </div>
                    <div class="clicky-report-net">
                        <span class="clicky-label"><?php _e('Saldo', 'clicky-foundation'); ?></span>
                        <span class="clicky-amount <?php echo $net >= 0 ? 'clicky-positive' : 'clicky-negative'; ?>">
                            Rp <?php echo number_format($net, 0, ',', '.'); ?>
                        </span>
                    </div>
                </div>
                
                <?php if ($atts['show_download'] === 'true' && $report->pdf_url) : ?>
                <a href="<?php echo esc_url($report->pdf_url); ?>" class="clicky-download-btn" target="_blank">
                    <?php _e('Unduh PDF', 'clicky-foundation'); ?>
                </a>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>
        <?php
        
        $output = ob_get_clean();
        
        // Cache for 5 minutes
        set_transient($cache_key, $output, 5 * MINUTE_IN_SECONDS);
        
        return $output;
    }
}
