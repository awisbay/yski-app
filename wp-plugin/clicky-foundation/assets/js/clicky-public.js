/**
 * Yayasan Sahabat Khairat Indonesia - Public Scripts
 */
(function($) {
    'use strict';

    // Amount button selection
    $(document).on('click', '.clicky-amount-btn', function(e) {
        e.preventDefault();
        var amount = $(this).data('amount');
        
        $('.clicky-amount-btn').removeClass('active');
        $(this).addClass('active');
        $('#clicky_amount').val(amount);
    });

    // Donation form submission
    $(document).on('submit', '#clicky-donation-form', function(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $response = $('#clicky-form-response');
        var $submitBtn = $form.find('.clicky-submit-btn');
        
        // Disable submit button
        $submitBtn.prop('disabled', true).text('Processing...');
        
        // Get form data
        var formData = {
            action: 'clicky_create_donation',
            nonce: $form.find('[name="clicky_nonce"]').val(),
            program_id: $form.find('[name="program_id"]').val(),
            amount: $form.find('[name="amount"]').val(),
            donor_name: $form.find('[name="donor_name"]').val(),
            donor_email: $form.find('[name="donor_email"]').val(),
            donor_phone: $form.find('[name="donor_phone"]').val(),
            message: $form.find('[name="message"]').val(),
            payment_method: $form.find('[name="payment_method"]:checked').val(),
        };
        
        // Validate
        if (!formData.amount || parseInt(formData.amount) < 10000) {
            $response.html('<div class="clicky-error">Minimum donation amount is Rp 10.000</div>');
            $submitBtn.prop('disabled', false).text($submitBtn.data('original-text') || 'Donasi Sekarang');
            return;
        }
        
        // Submit to API
        $.ajax({
            url: clicky_ajax.api_url + '/donations',
            method: 'POST',
            headers: {
                'X-Clicky-API-Key': '' // API key should be handled server-side
            },
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                $response.html('<div class="clicky-success">Thank you! Please check your email for payment instructions.</div>');
                $form[0].reset();
                $('.clicky-amount-btn').removeClass('active');
            },
            error: function(xhr) {
                var error = xhr.responseJSON?.detail || 'An error occurred. Please try again.';
                $response.html('<div class="clicky-error">' + error + '</div>');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).text('Donasi Sekarang');
            }
        });
    });

})(jQuery);
