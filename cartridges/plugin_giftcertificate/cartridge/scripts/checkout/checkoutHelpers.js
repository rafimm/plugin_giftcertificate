'use strict';

var base = module.superModule;

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Money = require('dw/value/Money');

var giftCertHelper = require('*/cartridge/scripts/helpers/giftCertHelpers');

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {Object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
	var result = { error: false };

	try {
		Transaction.begin();
		var placeOrderStatus = OrderMgr.placeOrder(order);
		if (placeOrderStatus === Status.ERROR) {
			throw new Error();
		}

		if (fraudDetectionStatus.status === 'flag') {
			order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
		} else {
			order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
		}

		order.setExportStatus(Order.EXPORT_STATUS_READY);

		// Creates gift certificates for all gift certificate line items in the order
		// and sends an email to the gift certificate receiver

		order.getGiftCertificateLineItems().toArray().map(function (lineItem) {
			return giftCertHelper.createGiftCertificateFromLineItem(lineItem, order.getOrderNo());
		}).forEach(giftCertHelper.sendGiftCertificateEmail);

		Transaction.commit();
	} catch (e) {
		Transaction.wrap(function () { OrderMgr.failOrder(order); });
		result.error = true;
	}

	return result;
}

/**
 * Calculates the amount to be paid by a non-gift certificate payment instrument based on the given basket.
 * The function subtracts the amount of all redeemed gift certificates from the order total and returns this
 * value.
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.value.Money} The amount to be paid by a non-gift certificate payment instrument.
 */
function getNonGiftCertificateAmount(currentBasket) {
	// The total redemption amount of all gift certificate payment instruments in the basket.
	var giftCertTotal = new Money(0.0, currentBasket.getCurrencyCode());

	// Gets the list of all gift certificate payment instruments
	var gcPaymentInstrs = currentBasket.getGiftCertificatePaymentInstruments();
	var iter = gcPaymentInstrs.iterator();
	var orderPI = null;

	// Sums the total redemption amount.
	while (iter.hasNext()) {
		orderPI = iter.next();
		giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
	}

	// Gets the order total.
	var orderTotal = currentBasket.getTotalGrossPrice();

	// Calculates the amount to charge for the payment instrument.
	// This is the remaining open order total that must be paid.
	var amountOpen = orderTotal.subtract(giftCertTotal);

	// Returns the open amount to be paid.
	return amountOpen;
}

/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
function calculatePaymentTransaction(currentBasket) {
	var PaymentInstrument = require('dw/order/PaymentInstrument');
	var result = { error: false };

	// Gets all payment instruments for the basket.
	var iter = currentBasket.getPaymentInstruments().iterator();
	var paymentInstrument = null;
	var nonGCPaymentInstrument = null;
	var giftCertTotal = new Money(0.0, currentBasket.getCurrencyCode());

	// Locates a non-gift certificate payment instrument if one exists.
	while (iter.hasNext()) {
		paymentInstrument = iter.next();
		if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.getPaymentMethod())) {
			giftCertTotal = giftCertTotal.add(paymentInstrument.getPaymentTransaction().getAmount());
			continue;
		}

		// Captures the non-gift certificate payment instrument.
		nonGCPaymentInstrument = paymentInstrument;
		break;
	}

	var orderTotal = currentBasket.totalGrossPrice;

	// If a gift certificate payment and non-gift certificate payment
	// instrument are found, the function returns true.
	if (!nonGCPaymentInstrument) {
		// If there are no other payment types and the gift certificate
		// does not cover the open amount, then return false.
		if (giftCertTotal < orderTotal) {
			result.error = false;
			return result;
		}
		result.error = true;
		return result;
	}

	try {
		Transaction.wrap(function () {
			// Calculates the amount to be charged for the
			// non-gift certificate payment instrument.
			var amount = getNonGiftCertificateAmount(currentBasket);

			// now set the non-gift certificate payment instrument total.
			if (amount.value <= 0.0) {
				var zero = new Money(0, amount.getCurrencyCode());
				nonGCPaymentInstrument.getPaymentTransaction().setAmount(zero);
			} else {
				nonGCPaymentInstrument.getPaymentTransaction().setAmount(amount);
			}
		});
	} catch (e) {
		result.error = true;
	}

	return result;
}

module.exports = {
	getFirstNonDefaultShipmentWithProductLineItems: base.getFirstNonDefaultShipmentWithProductLineItems,
	ensureNoEmptyShipments: base.ensureNoEmptyShipments,
	getProductLineItem: base.getProductLineItem,
	isShippingAddressInitialized: base.isShippingAddressInitialized,
	prepareShippingForm: base.prepareShippingForm,
	prepareBillingForm: base.prepareBillingForm,
	copyCustomerAddressToShipment: base.copyCustomerAddressToShipment,
	copyCustomerAddressToBilling: base.copyCustomerAddressToBilling,
	copyShippingAddressToShipment: base.copyShippingAddressToShipment,
	copyBillingAddressToBasket: base.copyBillingAddressToBasket,
	validateFields: base.validateFields,
	validateShippingForm: base.validateShippingForm,
	validateBillingForm: base.validateBillingForm,
	validatePayment: base.validatePayment,
	validateCreditCard: base.validateCreditCard,
	calculatePaymentTransaction: calculatePaymentTransaction,
	recalculateBasket: base.recalculateBasket,
	handlePayments: base.handlePayments,
	createOrder: base.createOrder,
	placeOrder: placeOrder,
	savePaymentInstrumentToWallet: base.savePaymentInstrumentToWallet,
	getRenderedPaymentInstruments: base.getRenderedPaymentInstruments,
	sendConfirmationEmail: base.sendConfirmationEmail,
	ensureValidShipments: base.ensureValidShipments,
	setGift: base.setGift
};
