var assert = require('assert');

var Exchange = require('bitcoin-exchange-client');
var Helpers = Exchange.Helpers;

class Trade extends Exchange.Trade {
  constructor (obj, api, delegate) {
    super(obj, api, delegate);

    assert(obj || obj === null, 'JSON or null missing');

    this._inCurrency = 'INR';
    this._outCurrency = 'BTC';

    this._medium = 'bank';

    this._createdAt = null;

    if (obj) {
      this._id = obj.id;
      this._state = obj.state;

      this._delegate.deserializeExtraFields(obj, this);
      this._confirmed = obj.confirmed;
      this._txHash = obj.tx_hash;

      this._is_buy = obj.is_buy;
    } else {
      // Assume buy
      this._is_buy = true;
    }

    if (this._is_buy && Helpers.isPositiveInteger(this._account_index) && Helpers.isPositiveInteger(this._receive_index)) {
      this._receiveAddress = this._delegate.getReceiveAddress(this);
    }
  }

  setFromAPI (obj) {
    super.setFromAPI();

    /* istanbul ignore if */
    if (this.debug) {
      console.info('Trade ' + this.id + ' from Unocoin API');
    }

    this._id = this._id || Trade.idFromAPI(obj);

    switch (obj.status) {
      /* Unocoin API only uses 'Pending' and 'Complete'. For consistentcy we
         map these to their equivalent Coinify states. Additional fields are
         used to determine this.

         Currently the API does not support:
         * 'reviewing': we can't tell when Unocoin has received the funds
         * 'cancelled': users can't cancel a trade
         * 'rejected': not possible afaik
         * 'expired': not possible afaik
      */
      case 'Pending':
        if (obj.reference_number) {
          this._state = 'awaiting_transfer_in';
        } else {
          this._state = 'awaiting_reference_number';
        }
        break;
      case 'Completed':
        if (obj.transaction_hash) {
          this._state = 'completed';
        } else {
          this._state = 'processing';
        }
        break;
      default:
        this._state = 'awaiting_reference_number';
    }

    if (obj.unixtime) {
      // API returns unix timestamp when creating a trade
      this._createdAt = new Date(obj.unixtime * 1000);
    } else if (obj.requested_time) {
       // API returns date-time string when listing trades
      this._createdAt = new Date(obj.requested_time);
    } else {
      console.warn('Unexpected missing field: requested_time / unixtime');
      this._createdAt = null;
    }

    this._inAmount = obj.inr;
    this._sendAmount = this._inAmount;

    // TODO: API support (or estimate based on ticker)
    this._outAmount = this._inAmount / 75000 * 100000000;
    this._outAmountExpected = this._outAmount;
  }

  get updatedAt () { return this._updatedAt; }

  get isBuy () {
    return this._is_buy;
  }

  cancel () {
    var self = this;

    var processCancel = function (trade) {
      self._state = trade.state;

      self._delegate.releaseReceiveAddress(self);

      return self._delegate.save.bind(self._delegate)();
    };

    return self._api.authPATCH('trades/' + self._id + '/cancel').then(processCancel);
  }

  btcExpected () {
    if (this.isBuy) {
      if ([
        'completed',
        'completed_test',
        'cancelled',
        'failed',
        'rejected'
      ].indexOf(this.state) > -1) {
        return Promise.resolve(this.outAmountExpected);
      }

      var oneMinuteAgo = new Date(new Date().getTime() - 60 * 1000);

      // Estimate BTC expected based on current exchange rate:
      if (this._lastBtcExpectedGuessAt > oneMinuteAgo) {
        return Promise.resolve(this._lastBtcExpectedGuess);
      } else {
        var processQuote = (quote) => {
          this._lastBtcExpectedGuess = quote.quoteAmount;
          this._lastBtcExpectedGuessAt = new Date();
          return this._lastBtcExpectedGuess;
        };
        return this._getQuote(this._api, this._delegate, -this.inAmount, this.inCurrency, this.outCurrency, this._debug).then(processQuote);
      }
    } else {
      return Promise.reject();
    }
  }

  static buy (quote, medium) {
    const request = (receiveAddress) => {
      return quote.api.authPOST('api/v1/trading/instant_buyingbtc', {
        destination: receiveAddress,
        amount: quote.baseCurrency === 'INR' ? -quote.baseAmount : -quote.quoteAmount
      }).then((res) => {
        if (res.status_code === 200) {
          return res;
        } else {
          return Promise.reject(res.message);
        }
      });
    };
    return super.buy(quote, medium, request);
  }

  static fetchAll (api) {
    return api.authGET('api/v1/wallet/deposit_history').then(res => {
      if (res.status_code === 200) {
        return res.transactions;
      } else {
        return Promise.reject(res.message);
      }
    });
  }

  process () {
    if (['rejected', 'cancelled', 'expired'].indexOf(this.state) > -1) {
      /* istanbul ignore if */
      if (this.debug) {
        console.info('Check if address for ' + this.state + ' trade ' + this.id + ' can be released');
      }
      this._delegate.releaseReceiveAddress(this);
    }
  }

  refresh () {
    /* istanbul ignore if */
    if (this.debug) {
      console.info('Refresh ' + this.state + ' trade ' + this.id);
    }
    return this._api.authGET('trades/' + this._id)
            .then(this.setFromAPI.bind(this))
            .then(this._delegate.save.bind(this._delegate))
            .then(this.self.bind(this));
  }

  addReferenceNumber (ref) {
    let processResult = (res) => {
      if (res.status_code === 200) {
        this._state = 'awaiting_transfer_in';
        return Promise.resolve();
      } else {
        console.error('Failed to set reference number', res.status_code, res.message);
        return Promise.reject();
      }
    };
    return this._api.authPOST('api/v1/wallet/add_reference', {
      inr_transaction_id: this._id,
      ref_num: ref
    })
      .then(processResult)
      .then(this._delegate.save.bind(this._delegate))
      .then(this.self.bind(this));
  }

  static idFromAPI (obj) {
    // order_id is an integer when creating a trade, but a string when listing
    return parseInt(obj.order_id);
  }

  toJSON () {
    var serialized = {
      id: this._id,
      state: this._state,
      tx_hash: this._txHash,
      confirmed: this.confirmed,
      is_buy: this.isBuy
    };

    this._delegate.serializeExtraFields(serialized, this);

    return serialized;
  }
}

module.exports = Trade;
