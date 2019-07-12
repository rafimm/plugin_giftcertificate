'use strict';

var server = require('server');

server.get('Purchase', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    
    var giftCertForm = server.forms.getForm('giftcert');
    giftCertForm.clear();

    var actionUrl = URLUtils.https('GiftCert-AddToBasket');

    res.render('checkout/giftcert/giftcertpurchase', {
        giftCertForm: giftCertForm,
        actionUrl: actionUrl
    });

    next();
});

/**
 * Creates a gift certificate in the customer basket using form input values.
 * If a gift certificate is added to a product list, a ProductListItem is added, otherwise a GiftCertificateLineItem
 * is added.
 * __Note:__ the form must be validated before this function is called.
 *
 * @param {module:models/CartModel~CartModel} cart - A CartModel wrapping the current Basket.
 * @return {dw.order.GiftCertificateLineItem} gift certificate line item added to the
 * current basket or product list.
 */
function createGiftCert(cart) {
    var giftCertificateLineItem;
    var purchaseForm = server.forms.getForm('giftcert').purchase;
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function() {
        giftCertificateLineItem = cart.createGiftCertificateLineItem(purchaseForm.amount.value, purchaseForm.recipientEmail.value);
        giftCertificateLineItem.setRecipientName(purchaseForm.recipient.value);
        giftCertificateLineItem.setSenderName(purchaseForm.from.value);
        giftCertificateLineItem.setMessage(purchaseForm.message.value);
        return giftCertificateLineItem;
    });

    if (!giftCertificateLineItem) {
        return null;
    }

    return giftCertificateLineItem;
}

server.post('AddToBasket', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var giftCertForm = server.forms.getForm('giftcert');

    var formErrors = require('*/cartridge/scripts/formErrors');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    // Validates confirmation of email address.
    var recipientEmailForm = giftCertForm.purchase.recipientEmail;
    var confirmRecipientEmailForm = giftCertForm.purchase.confirmRecipientEmail;

    if ((recipientEmailForm.value.toLowerCase() !== confirmRecipientEmailForm.value.toLowerCase())) {
        recipientEmailForm.valid = false;
        confirmRecipientEmailForm.valid = false;
        confirmRecipientEmailForm.error = Resource.msg('error.message.mismatch.email', 'forms', null);
        giftCertForm.valid = false;
    }

    // Validates amount in range.
    var amountForm = giftCertForm.purchase.amount;
    if (amountForm.valid && ((amountForm.value < 5) || (amountForm.value > 5000))) {
        amountForm.valid = false;
        amountForm.error = Resource.msg('error.message.mismatch.email', 'forms', null);
        giftCertForm.valid = false;
    }

    if (giftCertForm.valid) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var giftCertificateLineItem = createGiftCert(currentBasket);
        

        Transaction.wrap(function() {
            COHelpers.recalculateBasket(currentBasket);
        });

        res.redirect('Cart-Show');
    } else {
        res.json({
            fields: formErrors.getFormErrors(giftCertForm)
        });
    }

    return next();

});

module.exports = server.exports();
