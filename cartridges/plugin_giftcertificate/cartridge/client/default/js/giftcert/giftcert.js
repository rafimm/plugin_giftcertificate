var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');

/**
 * Used to initiate ajax call and update the form
 * @param {Object} form - gift certificate form
 * @param {boolean} isUpdate - boolean value to check if it is update action
 * @return {boolean} false
 */
var updateGiftCertForm = function (form, isUpdate) {
	var url = form.attr('action');
	form.spinner().start();
	$.ajax({
		url: url,
		type: 'post',
		dataType: 'json',
		data: form.serialize(),
		success: function (data) {
			form.spinner().stop();
			if (!data.success) {
				formValidation(form, data);
			} else {
				location.href = data.redirectUrl;
			}
		},
		error: function (err) {
			if (err.responseJSON.redirectUrl) {
				window.location.href = err.responseJSON.redirectUrl;
			} else if (isUpdate) {
				$('.error-gift-certificate').html('');
				createErrorNotification($('.error-gift-certificate'), err.responseJSON.errorMessage);
				$('.html, body').animate({
					scrollTop: $('.error-gift-certificate').offset().top
				}, 1000);
			} else {
				createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
			}
			form.spinner().stop();
		}
	});
	return false;
};

/**
 * Checks if user has entered gift certificate or not.
 * @return {boolean} true/false
 */
var validateGiftCert = function () {
	if ($('.giftCertCode').length === 0 || $('.giftCertCode').val().length === 0) {
		var errorMessage = $('.gift-cert-wrapper').data('missing-error');
		$('.balance').html(errorMessage).removeClass('success').addClass('error');
		return true;
	}

	return false;
};

module.exports = {
	addToBasket: function () {
		$('form.giftcert').submit(function (e) {
			var form = $(this);
			e.preventDefault();
			updateGiftCertForm(form, false);
		});
	},
	updateGiftCertificate: function () {
		$('body').on('click', '.update-gift-certificate', function (e) {
			var form = $(this).parent('.giftcert');
			e.preventDefault();
			updateGiftCertForm(form, true);
		});
	},
	addGiftCertToBasket: function () {
		$('body').on('click', '.submit-giftCert', function (e) {
			e.preventDefault();
			if (validateGiftCert()) {
				return false;
			}
			var giftCertCode = $('.giftCertCode').val();
			var url = $(this).data('url');
			var $balance = $('.balance');
			$.ajax({
				url: url,
				type: 'post',
				dataType: 'json',
				data: { giftCertCode: giftCertCode },
				success: function (data) {
					if (data.error) {
						if (data.redirectUrl) {
							window.location.href = data.redirectUrl;
						} else if (data.errorMessage) {
							$balance.html(data.errorMessage).removeClass('success').addClass('error');
							return;
						}
					} else {
						$('body').trigger('checkout:updateCheckoutView',
							{
								order: data.order,
                        		customer: data.customer,
                        		options: { keepOpen: true }
							}
						);
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
			var $this = $(this);
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
						$this.parents().eq(1).remove();
					}
				}
			});
		});
	}
};
