let proxyquire = require('proxyquireify')(require);

describe('Trade', function () {
  let BankAccount = () => ({mock: 'bank-account'});

  let stubs = {
    './bank-account': BankAccount
  };

  let Trade = proxyquire('../src/trade', stubs);

  let tradeJsonKV;

  let tradeJsonAPI;
  let tradeJsonAPI2;

  let api;

  let delegate;

  beforeEach(function () {
    jasmine.clock().install();

    delegate = {
      reserveReceiveAddress () {
        return { receiveAddress: '1abcd', commit () {} };
      },
      removeLabeledAddress () {},
      releaseReceiveAddress () {},
      save () { return Promise.resolve(); },
      deserializeExtraFields () {},
      getReceiveAddress () {},
      serializeExtraFields () {},
      monitorAddress () {}
    };

    // Trades stored in KV store:
    tradeJsonKV = {
      id: 1142,
      state: 'awaiting_reference_number',
      is_buy: true
    };

    // Trades stored in API:

    tradeJsonAPI = {
      order_id: '1142', // string when listing trades, integer when creating trade!
      requested_time: '2017-06-09 19:58:48',
      inr: 150000,
      reference_number: '',
      transaction_hash: '',
      bitcoin_address: '',
      status: 'Pending'
    };

    tradeJsonAPI2 = JSON.parse(JSON.stringify(tradeJsonAPI));
    tradeJsonAPI2.id = '1143';

    let response;
    api = {
      authGET (method) {
        switch (method) {
          case 'api/v1/wallet/deposit_history':
            response = {
              status_code: 200,
              transactions: [tradeJsonAPI, tradeJsonAPI2]
            };
            return Promise.resolve(response);
          default:
            return Promise.reject();
        }
      },
      authPOST (method) {
        switch (method) {
          case 'api/v1/trading/instant_buyingbtc':
            response = {status_code: 200};
            Object.assign(response, tradeJsonAPI);
            // API uses integer when creating a trade, but string when listing
            response.order_id = parseInt(response.order_id);
            return Promise.resolve(response);
          default:
            return Promise.reject();
        }
      }
    };
    spyOn(api, 'authPOST').and.callThrough();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('class', () => {
    describe('new Trade()', function () {
      it('should keep a reference to the API', () => {
        let t = new Trade(tradeJsonKV, api, delegate);
        expect(t._api).toBe(api);
      });

      it('should deserialize from KV store (not API)', () => {
        let t = new Trade(tradeJsonKV, api, delegate);
        expect(t.id).toBe(tradeJsonKV.id);
        expect(t.inCurrency).toBe('INR');
        expect(t.outCurrency).toBe('BTC');
        expect(t.medium).toBe('bank');
        expect(t.state).toBe('awaiting_reference_number');
      });
    });

    describe('fetchAll()', function () {
      beforeEach(() => spyOn(delegate, 'releaseReceiveAddress').and.callThrough());

      it('should fetch all the trades', function (done) {
        let check = function (res) {
          expect(res.length).toBe(2);
        };

        Trade.fetchAll(api).then(check).catch(fail).then(done);
      });
    });

    describe('buy()', function () {
      let quote;

      beforeEach(function () {
        spyOn(Trade.prototype, '_monitorAddress').and.callFake(function () {});

        quote = {
          id: 101,
          expiresAt: new Date(new Date().getTime() + 100000),
          api,
          delegate,
          debug: true,
          _TradeClass: Trade
        };
      });

      it('should check that quote  is still valid', function () {
        quote.expiresAt = new Date(new Date().getTime() - 100000);
        expect(() => { Trade.buy(quote, 'bank'); }).toThrow();
      });

      it('should POST the quote and resolve the trade', function (done) {
        let testTrade = function (t) {
          expect(api.authPOST).toHaveBeenCalled();
          expect(t.id).toEqual(1142);
        };

        Trade.buy(quote, 'bank')
          .then(testTrade).catch(fail).then(done);
      });

      it('should watch the address', function (done) {
        let checks = trade => expect(trade._monitorAddress).toHaveBeenCalled();

        let promise = Trade.buy(quote, 'bank')
          .then(checks);

        expect(promise).toBeResolved(done);
      });
    });
  });

  describe('instance', function () {
    let trade;

    beforeEach(function () {
      trade = new Trade(tradeJsonKV, api, delegate);
      trade.setFromAPI(tradeJsonAPI);
    });

    describe('setFromAPI', () => {
      let t;
      beforeEach(() => {
        spyOn(delegate, 'deserializeExtraFields');
        t = new Trade(tradeJsonKV, api, delegate);
        t.setFromAPI(tradeJsonAPI);
      });

      it('should deserialize', () => {
        expect(t.state).toBe('awaiting_reference_number');
        expect(t.inAmount).toEqual(150000);
      });

      it('should ask the delegate to deserialize extra fields', () => {
        expect(delegate.deserializeExtraFields).toHaveBeenCalled();
      });
    });

    describe('serialize', function () {
      it('should store several fields', function () {
        trade._txHash = 'hash';
        expect(JSON.stringify(trade)).toEqual(JSON.stringify({
          id: 1142,
          state: 'awaiting_reference_number',
          tx_hash: 'hash',
          confirmed: false,
          is_buy: true
        }));
      });

      it('should ask the delegate to store more fields', function () {
        spyOn(trade._delegate, 'serializeExtraFields');
        JSON.stringify(trade);
        expect(trade._delegate.serializeExtraFields).toHaveBeenCalled();
      });

      it('should serialize any fields added by the delegate', function () {
        trade._delegate.serializeExtraFields = t => { t.extra_field = 'test'; };

        let s = JSON.stringify(trade);
        expect(JSON.parse(s).extra_field).toEqual('test');
      });
    });

    describe('isBuy', function () {
      it('should equal _is_buy if set', function () {
        trade._is_buy = false;
        expect(trade.isBuy).toEqual(false);

        trade._is_buy = true;
        expect(trade.isBuy).toEqual(true);
      });

      it('should be true if in currency is INR', function () {
        // Currently inCurrency is set to true by constructor
        trade = new Trade(tradeJsonKV, api, delegate);
        expect(trade.isBuy).toEqual(true);

        // trade._inCurrency = 'BTC';
        // expect(trade.isBuy).toEqual(false);
      });
    });

    describe('refresh()', function () {
      it('should update the trade object', function (done) {
        let checks = function () {
          expect(trade.setFromAPI).toHaveBeenCalled();
        };

        trade.setFromAPI = () => Promise.resolve(trade);
        spyOn(trade, 'setFromAPI').and.callThrough();

        trade.refresh().then(checks).catch(fail).then(done);
      });

      it('should save metadata', function (done) {
        let checks = () => expect(trade._delegate.save).toHaveBeenCalled();

        trade.setFromAPI = () => Promise.resolve(trade);
        spyOn(trade._delegate, 'save').and.callThrough();
        let promise = trade.refresh().then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should resolve with trade object', function (done) {
        let checks = res => expect(res).toEqual(trade);

        trade.setFromAPI = () => Promise.resolve(trade);
        let promise = trade.refresh().then(checks);

        expect(promise).toBeResolved(done);
      });
    });
  });
});
