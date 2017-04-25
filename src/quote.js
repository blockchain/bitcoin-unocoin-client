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

    if (this._baseCurrency === 'BTC') {
      this._baseAmount = Math.round(obj.baseAmount * 100000000);
      this._quoteAmount = Math.round(obj.quoteAmount);
    } else {
      this._baseAmount = Math.round(obj.baseAmount);
      this._quoteAmount = Math.round(obj.quoteAmount * 100000000);
    }
  }

  // Unocoin API does not have the concept of quotes. Instead, we just get the
  // latest price and wrap in a Quote object.
  static getQuote (api, delegate, amount, baseCurrency, quoteCurrency, debug) {
    const processQuote = (prices) => {
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

      let buyPrice = parseInt(prices.buybtc, 10);
      pseudoQuote.baseAmount = amount;

      // Assuming buy:
      if (baseCurrency === 'INR') {
        pseudoQuote.quoteAmount = amount / buyPrice;
      } else {
        pseudoQuote.quoteAmount = amount * buyPrice;
      }

      return new Quote(pseudoQuote, api, delegate);
    };

    const getQuote = (_baseAmount) => {
      var getAnonymousQuote = function () {
        // Not supported yet, using hardcoded account as temporary workaround:
        return api.POST('/api/v1/general/prices', {}, {
          Authorization: 'Bearer: 06656025315290cc7ce582972cf82a67a2298f86'
        });
      };

      var getQuote = function () {
        // TODO: user ticker instead
        return api.authPOST('/api/v1/general/prices');
      };

      if (!api.hasAccount) {
        return getAnonymousQuote().then(processQuote);
      } else {
        return getQuote().then(processQuote);
      }
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
