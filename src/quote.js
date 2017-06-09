var PaymentMedium = require('./payment-medium');
var Exchange = require('bitcoin-exchange-client');
var Trade = require('./trade');

class Quote extends Exchange.Quote {
  // Amount should be in Rupee or Satoshi
  constructor (baseAmount, baseCurrency, quoteCurrency, ticker, api, delegate, debug) {
    super(api, delegate, Trade, PaymentMedium, debug);
    // Some random unique UUID will do: http://stackoverflow.com/a/2117523
    this._id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16 | 0;
      let v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    // There's no actual expiration, just setting it to 15 minutes so that
    // the UI refreshes it often enough.
    this._expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);

    this._baseAmount = baseAmount;
    this._baseCurrency = baseCurrency;
    this._quoteCurrency = quoteCurrency;

    let buyPrice = ticker.buy.price; // Price per Bitcoin

    // TODO: Fee calculation is probably wrong, but currently not used...
    let buyBeforeFees = ticker.buy.price /
          (1.00 + (ticker.buy.fee + ticker.buy.tax / 100.0) / 100.0);
    let buyFee = ticker.buy.price - buyBeforeFees; // Fee per 1 BTC

    // Assuming buy:
    if (baseCurrency === 'INR') {
      this._quoteAmount = Math.round(-this.baseAmount * 100000000.0 / buyPrice);
      this._feeCurrency = 'BTC';
      this._feeAmount = -Math.round(buyFee);
    } else {
      this._quoteAmount = Math.round(-baseAmount * buyPrice / 100000000);
      this._feeCurrency = 'INR';
      this._feeAmount = -Math.round(buyFee);
    }
  }

  // Unocoin API does not have the concept of quotes. Instead, we just get the
  // latest price and wrap in a Quote object.
  static getQuote (api, delegate, amount, baseCurrency, quoteCurrency, debug) {
    const process = (ticker) => {
      return new Quote(amount, baseCurrency, quoteCurrency, ticker, api, delegate);
    };

    const getQuote = function () {
      return process(delegate.ticker);
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
