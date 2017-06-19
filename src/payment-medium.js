var ExchangePaymentMedium = require('bitcoin-exchange-client').PaymentMedium;
var Profile = require('./profile');
var assert = require('assert');

class PaymentMedium extends ExchangePaymentMedium {
  constructor (obj, api, quote, profile) {
    super(api, quote);

    this._fiatMedium = 'bank';

    this._inMedium = 'bank';
    this._outMedium = 'blockchain';

    this._inCurrency = 'INR';
    this._outCurrency = 'BTC';

    // TODO: get these from ticker
    this._inFixedFee = null;
    this._outFixedFee = null;
    this._inPercentageFee = null;
    this._outPercentageFee = null;

    this._minimumInAmounts = {
      INR: 1000
    };

    this.limitInAmounts = {
      // TODO: set INR limit when API provides it, or calculate...
      BTC: profile.currentLimits.bank.inRemaining
    };

    if (quote) {
      this._fee = 0;
      this._total = -quote.baseAmount;
    }
  }

  static getAll (inCurrency, outCurrency, api, quote) {
    // Bank is the only payment type. The Coinify API returns information about
    // trade limits along with their payment types. We mimick this behavior here
    // by calling profiledetails endpoint.

    return Profile.fetch(api).then(profile => {
      // Return bank account as a type
      return Promise.resolve({bank: new PaymentMedium(undefined, api, quote, profile)});
    });
  }

  checkMinimum () {
    return -this._quote.baseAmount >= this._minimumInAmounts[this.inCurrency];
  }

  buy () {
    assert(this.checkMinimum(), 'Less than minimum buy amount');
    return super.buy().then((trade) => {
      return trade;
    });
  }
}

module.exports = PaymentMedium;
