'use strict';

var server = require('server');
var checkoutServices = module.superModule;

server.extend(checkoutServices);

var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.get('RemoveGiftCertificate', server.middleware.https, function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var giftCertCode = req.querystring.giftCertificateID;

    if (!empty(giftCertCode)) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var paymentForm = server.forms.getForm('billing');

        var response = Transaction.wrap(function () {
            COHelpers.removeGiftCertificatePaymentInstrument(currentBasket, giftCertCode);
            basketCalculationHelpers.calculateTotals(currentBasket);
            return true;
        });

        paymentForm.clear();
        var renderedGiftCertHtml = COHelpers.getRenderedGCInstruments(req, currentBasket, paymentForm);

        if (response) {
            res.json({
                success: true,
                renderedGiftCertHtml: renderedGiftCertHtml,
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

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.get('CheckBalance', server.middleware.https, function (req, res, next) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
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
server.post('AddGiftCertificate', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var formErrors = require('*/cartridge/scripts/formErrors');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var gc, newGCPaymentInstrument;

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var paymentForm = server.forms.getForm('billing');
    var giftCertCode = paymentForm.giftCertFields.giftCertCode;

    if (empty(giftCertCode.value)) {
		giftCertCode.valid = false;
		giftCertCode.error = Resource.msg('billinggiftcert.giftcertinvalid', 'giftcert', null);
        paymentForm.valid = false;
        
        res.json({
            fields: formErrors.getFormErrors(paymentForm)
        });

        return next();
	}

    if (!empty(giftCertCode.value)) {
        gc = GiftCertificateMgr.getGiftCertificateByCode(giftCertCode.value);

        if (!gc || !gc.isEnabled() || (gc.getStatus() === gc.STATUS_PENDING)) {// make sure exists
            result = Resource.msg('billinggiftcert.giftcertinvalid', 'giftcert', null);
        } else if (gc.getStatus() === gc.STATUS_REDEEMED) {// make sure it has not been fully redeemed
            result = Resource.msg('billinggiftcert.giftcertnofunds', 'giftcert', null);
        } else if (gc.balance.currencyCode !== currentBasket.getCurrencyCode()) {// make sure the GC is in the right currency
            result = Resource.msg('billing.GIFTCERTIFICATE_CURRENCY_MISMATCH', 'giftcert', null);
        } else {
            newGCPaymentInstrument = Transaction.wrap(function () {
                gcPaymentInstrument = COHelpers.createGiftCertificatePaymentInstrument(currentBasket, gc);
                basketCalculationHelpers.calculateTotals(currentBasket);
                return gcPaymentInstrument;
            });

            paymentForm.clear();
            var renderedGiftCertHtml = COHelpers.getRenderedGCInstruments(req, currentBasket, paymentForm);

            res.json({
                renderedGiftCertHtml: renderedGiftCertHtml,
                error: false
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



module.exports = server.exports();
