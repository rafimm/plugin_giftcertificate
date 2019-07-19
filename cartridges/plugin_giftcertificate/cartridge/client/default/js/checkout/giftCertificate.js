/**
 * Checks if user has entered gift certificate or not.
 * @return {boolean} true/false
 */
var validateGiftCert = function () {
	var elm = $('.giftCertCode');
	if (elm.length === 0 || elm.val().length === 0) {
		var errorMessage = $('.gift-cert-wrapper').data('missing-error');
		$('#giftCertInvalidMessage').html(errorMessage);
		elm.addClass('is-invalid');
		return true;
	}

	$('#giftCertInvalidMessage').html('');
	elm.removeClass('is-invalid');
	return false;
};


module.exports = {
	addGiftCertToBasket: function () {
		$('body').on('click', '.submit-giftCert', function (e) {
			e.preventDefault();
			if (validateGiftCert()) {
				return false;
			}
			var activeTabId = $('.tab-pane.active').attr('id');
			var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
			var paymentInfoForm = $(paymentInfoSelector).serialize();

			$('body').trigger('checkout:serializeBilling', {
				form: $(paymentInfoSelector),
				data: paymentInfoForm,
				callback: function (data) {
					if (data) {
						paymentInfoForm = data;
					}
				}
			});

			var paymentForm = paymentInfoForm;
			var $balance = $('.balance');
			$.ajax({
				url: $(this).data('url'),
				type: 'post',
				dataType: 'json',
				data: paymentForm,
				success: function (data) {
					if (data.error) {
						if (data.redirectUrl) {
							window.location.href = data.redirectUrl;
						} else if (data.errorMessage) {
							$balance.html(data.errorMessage).removeClass('success').addClass('error');
							return;
						}
					} else {
						var giftCertHtmlObj = $(data.renderedGiftCertHtml).find('.gift-cert-form');
						$('.gift-cert-form').replaceWith(giftCertHtmlObj);
					}
				}
			});

			return false;
		});
	},
	checkBalance: function () {
		$('body').on('click', '.check-balance', function (e) {
			e.preventDefault();
			if (validateGiftCert()) {
				return false;
			}

			var giftCertCode = $('.giftCertCode').val();
			var $balance = $('.balance');
			var url = $(this).data('url');

			$.ajax({
				url: url,
				type: 'get',
				dataType: 'json',
				data: { giftCertCode: giftCertCode },
				success: function (data) {
					if (!data.giftCertificate) {
						$balance.html(data.error).removeClass('success').addClass('error');
						return;
					}
					$balance.html(data.giftCertificate.balance).removeClass('error').addClass('success');
				}
			});

			return false;
		});
	},
	deleteGiftCert: function () {
		$('body').on('click', '.giftcert-pi span', function (e) {
			e.preventDefault();
			var url = $(this).parent('.remove').attr('href');
			var $balance = $('.balance');
			$.ajax({
				url: url,
				type: 'get',
				dataType: 'json',
				success: function (data) {
					if (data.error) {
						$balance.html(data.errorMessage).removeClass('success').addClass('error');
					} else {
						var giftCertHtmlObj = $(data.renderedGiftCertHtml).find('.gift-cert-form');
						$('.gift-cert-form').replaceWith(giftCertHtmlObj);
					}
				}
			});
		});
	}
};
