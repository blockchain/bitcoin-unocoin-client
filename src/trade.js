var assert = require('assert');

var Exchange = require('bitcoin-exchange-client');

class Trade extends Exchange.Trade {
  constructor (obj, api, delegate) {
    super(api, delegate);

    assert(obj, 'JSON missing');
    this._id = obj.order_id || obj.id;
    this.set(obj);
  }

  get updatedAt () { return this._updatedAt; }

  get isBuy () {
    return this._is_buy;
  }

  set (obj) {
    //   'awaiting_transfer_in',
    //   'processing',
    //   'reviewing',
    //   'completed',
    //   'completed_test',
    //   'cancelled',
    //   'rejected',
    //   'expired'

    // TODO: use API state field when available
    this._state = obj.state || 'awaiting_reference_number';

    this._is_buy = true; // Assume buy

    this._inCurrency = 'INR';
    this._outCurrency = 'BTC';

    this._medium = 'bank';

    // TODO: API support (or pass value in from request)
    this._inAmount = 75000;// obj.amount;
    this._sendAmount = this._inAmount;

    // TODO: API support (or estimate based on ticker)
    this._outAmount = this._inAmount / 75000 * 100000000;
    this._outAmountExpected = this._outAmount;

    if (obj.confirmed === Boolean(obj.confirmed)) {
      this._delegate.deserializeExtraFields(obj, this);
      this._receiveAddress = this._delegate.getReceiveAddress(this);
      this._confirmed = obj.confirmed;
      this._txHash = obj.tx_hash;
    } else { // Contructed from Unocoin API
      /* istanbul ignore if */
      if (this.debug) {
        // This log only happens if .set() is called after .debug is set.
        console.info('Trade ' + this.id + ' from Unocoin API');
      }
    }
    return this;
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
        reference_number: 'placeholder',
        amount: quote.baseCurrency === 'INR' ? -quote.baseAmount : -quote.quoteAmount
      });
    };
    return super.buy(quote, medium, request);
  }

  static fetchAll (api) {
    return api.authGET('trades');
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
            .then(this.set.bind(this))
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

  // TODO: move to bitcoin-exchange-client once trade states are settled.
  static filteredTrades (trades) {
    return trades.filter(function (trade) {
      // Only consider transactions that are complete or that we're still
      // expecting payment for:
      return [
        'awaiting_reference_number',
        'awaiting_transfer_in',
        'processing',
        'reviewing',
        'completed',
        'completed_test'
      ].indexOf(trade.state) > -1;
    });
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
