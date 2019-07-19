'use strict';

/* API Includes */
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

/**
 * Authorizes a payment using a gift certificate. The payment is authorized by redeeming the gift certificate and
 * simply setting the order no as transaction ID.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} pmntInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} pmntProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, pmntInstrument, pmntProcessor) {
	var orderNo = orderNumber;
	var paymentInstrument = pmntInstrument;
	var paymentProcessor = pmntProcessor;
	var serverErrors = [];
	var fieldErrors = {};
	var error = false;

	try {
		Transaction.wrap(function () {
			paymentInstrument.paymentTransaction.transactionID = orderNo;
			paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
			var status = GiftCertificateMgr.redeemGiftCertificate(paymentInstrument);

			if (status.isError()) {
				error = true;
				serverErrors.push(
					Resource.msg('error.technical', 'checkout', null)
				);
			}
		});
	} catch (e) {
		error = true;
		serverErrors.push(
			Resource.msg('error.technical', 'checkout', null)
		);
	}

	return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Authorize = Authorize;
