<?php
/**
 * Donation Form Template
 *
 * @package Clicky_Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

$amounts = explode(',', $atts['amounts']);
$show_program = $atts['show_program_select'] === 'true';
?>
<div class="clicky-donation-form-wrapper">
    <form id="clicky-donation-form" class="clicky-form">
        <?php wp_nonce_field('clicky_donation_nonce', 'clicky_nonce'); ?>
        
        <?php if ($show_program) : 
            $programs = get_posts(array(
                'post_type' => 'clicky_program',
                'posts_per_page' => -1,
                'post_status' => 'publish',
                'meta_query' => array(
                    array('key' => '_clicky_program_status', 'value' => 'active'),
                ),
            ));
        ?>
        <div class="clicky-form-group">
            <label for="clicky_program"><?php _e('Pilih Program', 'clicky-foundation'); ?></label>
            <select id="clicky_program" name="program_id" required>
                <option value=""><?php _e('-- Pilih Program --', 'clicky-foundation'); ?></option>
                <?php foreach ($programs as $program) : 
                    $external_id = get_post_meta($program->ID, '_clicky_external_id', true);
                ?>
                <option value="<?php echo esc_attr($external_id); ?>" <?php selected($atts['program_id'], $external_id); ?>>
                    <?php echo esc_html($program->post_title); ?>
                </option>
                <?php endforeach; ?>
            </select>
        </div>
        <?php else : ?>
        <input type="hidden" name="program_id" value="<?php echo esc_attr($atts['program_id']); ?>">
        <?php endif; ?>
        
        <div class="clicky-form-group">
            <label><?php _e('Nominal Donasi', 'clicky-foundation'); ?></label>
            <div class="clicky-amount-presets">
                <?php foreach ($amounts as $amount) : ?>
                <button type="button" class="clicky-amount-btn" data-amount="<?php echo esc_attr(trim($amount)); ?>">
                    Rp <?php echo number_format(trim($amount), 0, ',', '.'); ?>
                </button>
                <?php endforeach; ?>
            </div>
            <input type="number" id="clicky_amount" name="amount" class="clicky-amount-input" 
                   placeholder="<?php _e('Atau masukkan nominal lain', 'clicky-foundation'); ?>" required>
        </div>
        
        <div class="clicky-form-group">
            <label for="clicky_donor_name"><?php _e('Nama Lengkap', 'clicky-foundation'); ?></label>
            <input type="text" id="clicky_donor_name" name="donor_name" required>
        </div>
        
        <div class="clicky-form-group">
            <label for="clicky_donor_email"><?php _e('Email', 'clicky-foundation'); ?></label>
            <input type="email" id="clicky_donor_email" name="donor_email" required>
        </div>
        
        <div class="clicky-form-group">
            <label for="clicky_donor_phone"><?php _e('No. Telepon', 'clicky-foundation'); ?></label>
            <input type="tel" id="clicky_donor_phone" name="donor_phone" required>
        </div>
        
        <div class="clicky-form-group">
            <label for="clicky_message"><?php _e('Pesan (Opsional)', 'clicky-foundation'); ?></label>
            <textarea id="clicky_message" name="message" rows="3"></textarea>
        </div>
        
        <div class="clicky-form-group">
            <label><?php _e('Metode Pembayaran', 'clicky-foundation'); ?></label>
            <div class="clicky-payment-methods">
                <label class="clicky-payment-option">
                    <input type="radio" name="payment_method" value="bank_transfer" checked>
                    <span><?php _e('Transfer Bank', 'clicky-foundation'); ?></span>
                </label>
            </div>
        </div>
        
        <button type="submit" class="clicky-submit-btn">
            <?php echo esc_html($atts['button_text']); ?>
        </button>
        
        <div id="clicky-form-response"></div>
    </form>
</div>
