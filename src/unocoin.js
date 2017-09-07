var Exchange = require('bitcoin-exchange-client');
var Profile = require('./profile');
var Trade = require('./trade');
var PaymentMedium = require('./payment-medium');
var Quote = require('./quote');
var API = require('./api');

var assert = require('assert');

class Unocoin extends Exchange.Exchange {
  constructor (obj, delegate) {
    const api = new API('https://app-api.unocoin.com/');

    super(obj, delegate, api, Trade, Quote, PaymentMedium);

    assert(delegate.getToken, 'delegate.getToken() required');

    this._user = obj.user;
    this._auto_login = obj.auto_login;
    this._offlineToken = obj.offline_token;

    this._api._offlineToken = this._offlineToken;

    this._profile = null;

    this._buyCurrencies = ['INR'];
    this._sellCurrencies = ['INR'];
  }

  get profile () {
    return this._profile;
  }

  get hasAccount () { return Boolean(this._offlineToken); }

  get buyCurrencies () { return this._buyCurrencies; }

  get sellCurrencies () { return this._sellCurrencies; }

  get bank () { return this._bank; }

  toJSON () {
    var unocoin = {
      user: this._user,
      offline_token: this._offlineToken,
      auto_login: this._auto_login,
      trades: this._TradeClass.filteredTrades(this._trades)
    };

    return unocoin;
  }

  // Email must be set and verified
  signup () {
    var self = this;
    var runChecks = function () {
      assert(self.delegate, 'ExchangeDelegate required');
      assert(self.delegate.email(), 'email required');
      assert(self.delegate.isEmailVerified(), 'email must be verified');
    };

    var doSignup = function (emailToken) {
      assert(emailToken, 'email token missing');
      return this._api.POST('api/blockchain-v1/authentication/register', {
        email_id: self.delegate.email()
      }, {
        Authorization: `Bearer ${emailToken}`
      });
    };

    var process = function (res) {
      switch (res.status_code) {
        case 200:
          return res.access_token;
        case 724:
          return Promise.reject({error: 'user is already registered', message: res.message});
        default:
          return Promise.reject({error: res.status_code, message: res.message});
      }
    };

    var saveMetadata = function (accessToken) {
      this._user = self.delegate.email();
      this._offlineToken = accessToken;
      this._api._offlineToken = this._offlineToken;
      return this._delegate.save.bind(this._delegate)().then(function () { return; });
    };

    var getToken = function () {
      return this.delegate.getToken.bind(this.delegate)('unocoin', {walletAge: true});
    };

    return Promise.resolve().then(runChecks.bind(this))
                            .then(getToken.bind(this))
                            .then(doSignup.bind(this))
                            .then(process.bind(this))
                            .then(saveMetadata.bind(this));
  }

  fetchProfile () {
    return Profile.fetch(this.api).then(profile => {
      this._profile = profile;
      return profile;
    });
  }

  getBuyCurrencies () {
    return Promise.resolve(this._buyCurrencies);
  }

  getSellCurrencies () {
    return Promise.resolve(this._sellCurrencies);
  }

  getTrades () {
    return this.getTicker().then(() => {
      return super.getTrades(Quote);
    });
  }

  getBuyQuote (amount, baseCurrency, quoteCurrency) {
    return this.getTicker().then(() => {
      return super.getBuyQuote(amount, baseCurrency, quoteCurrency);
    });
  }

  getTicker () {
    let price = () => this.delegate.ticker.buy;

    let process = (res) => {
      // Store ticker on delegate so other classes can access it
      this.delegate.ticker = {
        buy: {
          price: res.buy,
          fee: res.buy_btc_fee,
          tax: res.buy_btc_tax
        },
        updatedAt: new Date()
      };
    };

    if (this.delegate.ticker && new Date() - this.delegate.ticker.updatedAt < 60 * 1000) {
      return Promise.resolve().then(price);
    } else {
      return this._api.POST('api/blockchain-v1/general/rates').then(process).then(price);
    }
  }

  static new (delegate) {
    assert(delegate, 'Unocoin.new requires delegate');
    var object = {
      auto_login: true
    };
    var unocoin = new Unocoin(object, delegate);
    return unocoin;
  }
}

module.exports = Unocoin;
