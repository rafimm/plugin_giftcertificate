'use strict';

var cart = require('base/cart/cart');


module.exports = function () {
	cart();

	// function used to remove gift card from basket and refresh the cart page
	$('body').on('click', '.remove-gift-certificate', function (e) {
		e.preventDefault();
		var url = $(this).data('action');
		var uuid = $(this).data('uuid');
		url = url + '?giftCertificateLineItemUUID=' + uuid;
		$.spinner().start();
		$.ajax({
			url: url,
			type: 'get',
			dataType: 'json',
			success: function (data) {
				$.spinner().stop();
				if (data.success) {
					window.location.href = data.url;
				} 
			},
			error: function (err) {
				$.spinner().stop();
			}
		});
	});
};
