'use strict';
var base = module.superModule;

var GiftCertificateLineItemsModel = require('*/cartridge/models/giftCertificateLineItems');

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
		// this.totals.subTotal += parseFloat(giftCertificateLineItemsModel.subTotal);
	} else {
		this.giftCertificateItems = [];
	}
}

module.exports = OrderModel;
