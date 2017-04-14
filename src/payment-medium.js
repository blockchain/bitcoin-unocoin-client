var ExchangePaymentMedium = require('bitcoin-exchange-client').PaymentMedium;
var PaymentAccount = require('./payment-account');

class PaymentMedium extends ExchangePaymentMedium {
  constructor (obj, api, quote) {
    super(api, quote);

    this._inMedium = 'bank';
    this._outMedium = 'blockchain';

    this._inCurrencies = ['INR', 'BTC'];
    this._outCurrencies = ['BTC', 'INR'];

    this._inCurrency = 'INR';
    this._outCurrency = 'BTC';

    this._inFixedFee = 0;
    this._outFixedFee = 0;
    this._inPercentageFee = 0;
    this._outPercentageFee = 0;

    if (quote) {
      this._fee = 0;
      this._total = -quote.baseAmount;
    }
  }

  static getAll (inCurrency, outCurrency, api, quote) {
    // Return bank account as a type
    return Promise.resolve({bank: new PaymentMedium(undefined, api, quote)});
  }

  // Currently there's no need to register specific bank accounts with Unocoin,
  // so this abstraction is a bit overkill.
  getAccounts () {
    return Promise.resolve([new PaymentAccount(this._api, this.fiatMedium, this._quote)]);
  }

  // Avoid the need for getAccounts()...
  buy () {
    return this.getAccounts().then(accounts => {
      return accounts[0].buy();
    });
  }
}

module.exports = PaymentMedium;
