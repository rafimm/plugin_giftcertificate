'use strict';

var collections = require('*/cartridge/scripts/util/collections');

/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.GiftCertificateLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createGcliObject(allLineItems, view) {
	var lineItems = [];

	var totalQuantity = 0;
	var subTotal = 0;

	collections.forEach(allLineItems, function (item) {

		totalQuantity += 1;
		subTotal += item.basePrice;

		var params = {
			pview: 'giftCertificateLineItem',
			containerView: view,
			lineItem: item
		};

		lineItems.push(params);
	});

	return { lineItems: lineItems, totalQuantity: totalQuantity, subTotal: subTotal };
}


/**
 * @constructor
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.GiftCertificateLineItem>} giftCertificateLineItems - the gift certificate line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function GiftCertificateLineItems(giftCertificateLineItems, view) {
	// eslint-disable-next-line no-undef
	if (!empty(giftCertificateLineItems)) {
		var gcliObject = createGcliObject(giftCertificateLineItems, view);
		this.items = gcliObject.lineItems;
		this.subTotal = gcliObject.subTotal;
		this.totalQuantity = gcliObject.totalQuantity;
	} else {
		this.items = [];
		this.totalQuantity = 0;
		this.subTotal = 0;
	}
}

module.exports = GiftCertificateLineItems;
