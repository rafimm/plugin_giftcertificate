'use strict';

var server = require('server');
var checkout = module.superModule;

server.extend(checkout);

// Main entry point for Checkout
server.append('Begin', function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();

        var currentStage = res.getViewData().currentStage;
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

