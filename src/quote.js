var PaymentMedium = require('./payment-medium');
var Exchange = require('bitcoin-exchange-client');
var Trade = require('./trade');

class Quote extends Exchange.Quote {
  constructor (obj, api, delegate, debug) {
    super(api, delegate, Trade, PaymentMedium, debug);

    var expiresAt = obj.expiresAt;

    this._id = obj.id;
    this._baseCurrency = obj.baseCurrency;
    this._quoteCurrency = obj.quoteCurrency;
    this._expiresAt = expiresAt;

    this._feeCurrency = obj.feeCurrency;

    if (this._baseCurrency === 'BTC') {
      this._baseAmount = Math.round(obj.baseAmount * 100000000);
      this._quoteAmount = Math.round(obj.quoteAmount);
      this._feeAmount = Math.round(obj.feeAmount);
    } else {
      this._baseAmount = Math.round(obj.baseAmount);
      this._quoteAmount = Math.round(obj.quoteAmount * 100000000);
      this._feeAmount = Math.round(obj.feeAmount * 100000000);
    }
  }

  // Unocoin API does not have the concept of quotes. Instead, we just get the
  // latest price and wrap in a Quote object.
  static getQuote (api, delegate, amount, baseCurrency, quoteCurrency, debug) {
    const processQuote = (ticker) => {
      let pseudoQuote = {};

      // Some random unique UUID will do: http://stackoverflow.com/a/2117523
      pseudoQuote.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = Math.random() * 16 | 0;
        let v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      // There's no actual expiration, just setting it to 15 minutes so that
      // the UI refreshes it often enough.
      pseudoQuote.expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);

      pseudoQuote.baseCurrency = baseCurrency;
      pseudoQuote.quoteCurrency = quoteCurrency;

      let buyPrice = ticker.buy;
      pseudoQuote.baseAmount = amount;

      let buyBeforeFees = ticker.buy / (1.00 + (ticker.buy_btc_fee + ticker.buy_btc_tax / 100.0) / 100.0);
      let buyFee = ticker.buy - buyBeforeFees;

      // Assuming buy:

      if (baseCurrency === 'INR') {
        pseudoQuote.quoteAmount = -amount / buyPrice;
        pseudoQuote.feeCurrency = 'BTC';
        pseudoQuote.feeAmount = -Math.round(buyFee);
      } else {
        pseudoQuote.quoteAmount = -amount * buyPrice;
        pseudoQuote.feeCurrency = 'INR';
        pseudoQuote.feeAmount = -Math.round(buyFee);
      }

      return new Quote(pseudoQuote, api, delegate);
    };

    const getQuote = (_baseAmount) => {
      var getQuote = function () {
        return api.POST('trade?all');
      };

      return getQuote().then(processQuote);
    };

    return super.getQuote(amount, baseCurrency, quoteCurrency, ['BTC', 'INR'], debug)
             .then(getQuote);
  }

  // QA tool
  expire () {
    this._expiresAt = new Date(new Date().getTime() + 3 * 1000);
  }
}

module.exports = Quote;
