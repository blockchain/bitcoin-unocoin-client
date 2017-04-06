'use strict';

var assert = require('assert');

module.exports = ExchangeRate;

function ExchangeRate (unocoin) {
  this._unocoin = unocoin;
}

ExchangeRate.prototype.get = function (baseCurrency, quoteCurrency) {
  var self = this;
  var performChecks = function () {
    assert(baseCurrency, 'Base currency required');
    assert(quoteCurrency, 'Quote currency required');
  };
  var getRate = function () {
    return self._unocoin.GET('rates/approximate', {
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency
    });
  };
  var processRate = function (res) {
    return res.rate;
  };
  return Promise.resolve()
    .then(performChecks)
    .then(getRate)
    .then(processRate);
};
