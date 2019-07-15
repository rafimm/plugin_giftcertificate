var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');

module.exports = function () {
	$('form.giftcert').submit(function (e) {
		var form = $(this);
		e.preventDefault();
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
				} else {
					createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
				}

				form.spinner().stop();
			}
		});
		return false;
	});
};
