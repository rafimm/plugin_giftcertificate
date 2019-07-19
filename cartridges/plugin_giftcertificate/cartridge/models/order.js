'use strict';
var base = module.superModule;

var GiftCertificateLineItemsModel = require('*/cartridge/models/giftCertificateLineItems');

var getGcPIInfo = function (gcPIs) {
	var formatMoney = require('dw/util/StringUtils').formatMoney;
	var gc = {};
	var gcObj = [];
	var total = 0;
	if (gcPIs.size() > 0) {
		for (var i = 0; i < gcPIs.size(); i++) {
			var gcPiObj = {};
			var gcPI = gcPIs[i];
			total += gcPI.paymentTransaction.amount;
			gcPiObj.maskedGiftCertifiacte = gcPI.getMaskedGiftCertificateCode();
			gcPiObj.amount = formatMoney(gcPI.paymentTransaction.amount);
			gcPiObj.giftCertCode = gcPI.getGiftCertificateID();
			gcObj.push(gcPiObj);
		}

		gc.gcPIs = gcObj;
		gc.total = parseFloat(total, 2);
	}

	return gc;
};

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
	base.call(this, lineItemContainer, options);
	// eslint-disable-next-line no-undef
	if (!empty(lineItemContainer)) {
		var giftCertificateLineItemsModel = new GiftCertificateLineItemsModel(lineItemContainer.getGiftCertificateLineItems(), 'order');
		this.giftCertificateItems = giftCertificateLineItemsModel.items;
		// eslint-disable-next-line no-undef
		if (!empty(this.items)) {
			this.items.totalQuantity += giftCertificateLineItemsModel.totalQuantity;
		}
		this.gcPIInfo = getGcPIInfo(lineItemContainer.giftCertificatePaymentInstruments);
		this.totalGrossPrice = lineItemContainer.totalGrossPrice;
	} else {
		this.giftCertificateItems = [];
		this.gcPIInfo = [];
	}
}

module.exports = OrderModel;
