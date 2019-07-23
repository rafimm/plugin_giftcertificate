'use strict';

var server = require('server');
var checkout = module.superModule;

server.extend(checkout);

var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

// Main entry point for Checkout
server.append('Begin', function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();

        var currentStage = res.getViewData().currentStage;

        if (currentStage === 'shipping') {
            Transaction.wrap(function () {
                COHelpers.updateGiftCertificateShipments(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }
        
        var productLineItemExist = true;
        if (currentBasket.getProductLineItems().size() === 0) {
            currentStage = 'payment';
            productLineItemExist = false;
        }

        

        res.setViewData({
            currentStage: currentStage,
            productLineItemExist: productLineItemExist
        })

        return next();
    }
);

module.exports = server.exports();

