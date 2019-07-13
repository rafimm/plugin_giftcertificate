'use strict';

var cart = require('base/cart/cart');


module.exports = function () {
	cart();

	// function used to remove gift card from basket and refresh the cart page
	$('body').on('click', '.remove-gift-certificate', function (e) {
		e.preventDefault();
		alert();
	});
};
