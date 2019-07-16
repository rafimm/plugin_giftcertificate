'use strict';

var base = module.superModule;

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');

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
	calculatePaymentTransaction: base.calculatePaymentTransaction,
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
