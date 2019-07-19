'use strict';

var server = require('server');
var checkoutServices = module.superModule;

server.extend(checkoutServices);

var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Rednerd the gift certificate form to edit an existing added certificate
 */
server.get('RemoveGiftCertificate', server.middleware.https, function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var giftCertCode = req.querystring.giftCertificateID;

    if (!empty(giftCertCode)) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();

        var response = Transaction.wrap(function () {
            COHelpers.removeGiftCertificatePaymentInstrument(currentBasket, giftCertCode);
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
server.post('AddGiftCertificate', server.middleware.https, function (req, res, next) {
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var Locale = require('dw/util/Locale');
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

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
                gcPaymentInstrument = COHelpers.createGiftCertificatePaymentInstrument(currentBasket, gc);
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



module.exports = server.exports();
