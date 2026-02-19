/**
 * Yayasan Sahabat Khairat Indonesia - Admin Scripts
 */
(function($) {
    'use strict';

    // Test Connection
    $('#clicky-test-connection').on('click', function(e) {
        e.preventDefault();
        
        var $btn = $(this);
        var $response = $('#clicky-ajax-response');
        
        $btn.prop('disabled', true).text(clicky_admin.strings.testing);
        $response.empty();
        
        $.ajax({
            url: clicky_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'clicky_test_connection',
                nonce: clicky_admin.nonce
            },
            success: function(response) {
                if (response.success) {
                    $response.html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                } else {
                    $response.html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                }
            },
            error: function() {
                $response.html('<div class="notice notice-error"><p>' + clicky_admin.strings.error + '</p></div>');
            },
            complete: function() {
                $btn.prop('disabled', false).text('Test Connection');
            }
        });
    });

    // Force Sync
    $('#clicky-force-sync').on('click', function(e) {
        e.preventDefault();
        
        var $btn = $(this);
        var $response = $('#clicky-ajax-response');
        
        $btn.prop('disabled', true).text(clicky_admin.strings.syncing);
        $response.empty();
        
        $.ajax({
            url: clicky_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'clicky_force_sync',
                nonce: clicky_admin.nonce
            },
            success: function(response) {
                if (response.success) {
                    $response.html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                } else {
                    $response.html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                }
            },
            error: function() {
                $response.html('<div class="notice notice-error"><p>' + clicky_admin.strings.error + '</p></div>');
            },
            complete: function() {
                $btn.prop('disabled', false).text('Force Sync Now');
            }
        });
    });

})(jQuery);
