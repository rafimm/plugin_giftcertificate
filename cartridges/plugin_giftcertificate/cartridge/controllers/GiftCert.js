'use strict';

var server = require('server');

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');


var giftCertHelper = require('*/cartridge/scripts/helpers/giftCertHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

/**
 * Renders form for adding gift certificate
 */
server.get('Purchase', function (req, res, next) {
    var giftCertForm = server.forms.getForm('giftcert');
    giftCertForm.clear();

    var actionUrl = URLUtils.https('GiftCert-AddToBasket');
    res.render('checkout/giftcert/giftcertpurchase', {
        giftCertForm: giftCertForm,
        actionUrl: actionUrl,
        action: 'add'
    });

    next();
});

/**
 * Adds a gift certificate in basket
 */
server.post('AddToBasket', server.middleware.https, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var giftCertForm = giftCertHelper.processAddToBasket(server.forms.getForm('giftcert'));

    if (giftCertForm.valid) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var giftCertificateLineItem = giftCertHelper.createGiftCert(currentBasket);

        if (empty(giftCertificateLineItem)) {
            res.setStatusCode(500);
            res.json({
                success: false,
                errorMessage: Resource.msg('giftcert.server.error', 'forms', null)
            });

            return next();
        }
        
        Transaction.wrap(function() {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        res.json({
            success: true,
            redirectUrl: URLUtils.https('Cart-Show').toString()
        });
    } else {
        res.json({
            fields: formErrors.getFormErrors(giftCertForm)
        });
    }

    return next();

});

/**
 * Adds a gift certificate in basket
 */
server.post('Update', server.middleware.https, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');

    var giftCertForm = giftCertHelper.processAddToBasket(server.forms.getForm('giftcert'));

    if (giftCertForm.valid) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var giftCertificateLineItem = giftCertHelper.updateGiftCert(currentBasket);

        if (empty(giftCertificateLineItem)) {
            res.setStatusCode(500);
            res.json({
                success: false,
                errorMessage: Resource.msg('giftcert.server.update.error', 'forms', null)
            });

            return next();
        }
        
        Transaction.wrap(function() {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        res.json({
            success: true,
            redirectUrl: URLUtils.https('Cart-Show').toString()
        });
        
    } else {
        res.json({
            fields: formErrors.getFormErrors(giftCertForm)
        });
    }

    return next();

});

/**
 * Removes the gift certificate from the basket
 */
server.get('RemoveGiftCertLineItem', server.middleware.https, function (req, res, next) {
    var CartModel = require('*/cartridge/models/cart');
    var giftCertificateLineItemUUID = req.querystring.uuid;
    var giftCertificateLineItem = null;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var giftCertificateLineItems = currentBasket.getGiftCertificateLineItems();
    if (giftCertificateLineItems.length > 0 && !empty(giftCertificateLineItemUUID)) {
        giftCertificateLineItem = giftCertHelper.getGiftCertificateLineItemByUUID(giftCertificateLineItems, giftCertificateLineItemUUID);
    }
    
    var giftItemDeleted = false;
    if (!empty(giftCertificateLineItem)) {
        Transaction.wrap(function () {
            currentBasket.removeGiftCertificateLineItem(giftCertificateLineItem);
            basketCalculationHelpers.calculateTotals(currentBasket);
            giftItemDeleted = true;
        });
    }

    if (giftItemDeleted) {
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel,
            giftLineItemAvailable: giftCertificateLineItems > 1 ? true : false
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.get('Edit', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var giftCertificateLineItem = null;
    var giftCertificateLineItemUUID = req.querystring.uuid;
    var giftCertificateLineItems = currentBasket.getGiftCertificateLineItems();

    if (giftCertificateLineItems.length > 0 && !empty(giftCertificateLineItemUUID)) {
        giftCertificateLineItem = giftCertHelper.getGiftCertificateLineItemByUUID(giftCertificateLineItems, giftCertificateLineItemUUID);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
        return next();
    }

    var giftCertForm = server.forms.getForm('giftcert');
    giftCertForm.clear();
    if (!empty(giftCertificateLineItem)) {
        var giftLineItemObj = giftCertHelper.getGiftLineItemObj(giftCertificateLineItem);
        giftCertForm.copyFrom(giftLineItemObj);
    }
    
    var actionUrl = URLUtils.https('GiftCert-Update');
    var renderedHtml  = giftCertHelper.editGCLIHtmlRenderedHtml(giftCertForm, actionUrl);
    
    res.json({
        renderedTemplate: renderedHtml
    });

    return next();
    
});

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.get('CheckBalance', server.middleware.https, function (req, res, next) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var giftCertCode = req.querystring.giftCertCode;

    // fetch the gift certificate
    var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertCode);

    if (giftCertificate && giftCertificate.isEnabled()) {
        res.json({
            giftCertificate: {
                ID: giftCertificate.getGiftCertificateCode(),
                balance: Resource.msgf('billing.giftcertbalance','giftcert', null, formatMoney(giftCertificate.getBalance()))
            }
        });
    } else {
        res.json({
            error: Resource.msg('billing.giftcertinvalid', 'giftcert', null)
        });
    }

    return next();
});

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.post('AddGiftCertificate', server.middleware.https, function (req, res, next) {
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var Locale = require('dw/util/Locale');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var gc, newGCPaymentInstrument;

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var giftCertCode = req.form.giftCertCode;

    if (!empty(giftCertCode)) {
        gc = GiftCertificateMgr.getGiftCertificateByCode(giftCertCode);

        if (!gc || !gc.isEnabled() || (gc.getStatus() === gc.STATUS_PENDING)) {// make sure exists
            result = Resource.msg('billinggiftcert.giftcertinvalid', 'giftcert', null);
        } else if (gc.getStatus() === gc.STATUS_REDEEMED) {// make sure it has not been fully redeemed
            result = Resource.msg('billinggiftcert.giftcertnofunds', 'giftcert', null);
        } else if (gc.balance.currencyCode !== currentBasket.getCurrencyCode()) {// make sure the GC is in the right currency
            result = Resource.msg('billing.GIFTCERTIFICATE_CURRENCY_MISMATCH', 'giftcert', null);
        } else {
            newGCPaymentInstrument = Transaction.wrap(function () {
                gcPaymentInstrument = giftCertHelper.createGiftCertificatePaymentInstrument(currentBasket, gc);
                basketCalculationHelpers.calculateTotals(currentBasket);
                return gcPaymentInstrument;
            });

            var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
            var currentLocale = Locale.getLocale(req.locale.id);

            var basketModel = new OrderModel(
                currentBasket,
                { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
            );

            res.json({
                order: basketModel,
                customer: new AccountModel(req.currentCustomer),
                error: false,
                giftCert: gcPaymentInstrument
            });

            return next();
        }
    }

    res.json({
        error: true,
        errorMessage: result
    });

    return next();
});

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.get('RemoveGiftCertificate', server.middleware.https, function (req, res, next) {
    var giftCertCode = req.querystring.giftCertificateID;

    if (!empty(giftCertCode)) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();

        var response = Transaction.wrap(function () {
            giftCertHelper.removeGiftCertificatePaymentInstrument(currentBasket, giftCertCode);
            basketCalculationHelpers.calculateTotals(currentBasket);
            return true;
        });
        if (response) {
            res.json({
                success: true
            });
        }
    } else {
        res.json({
            error: true,
            errorMessage: Resource.msg('billinggiftcert.giftcertinvalid', 'giftcert', null)
        });
    }

    return next();
});



module.exports = server.exports();
