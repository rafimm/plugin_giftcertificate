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
	}
};
