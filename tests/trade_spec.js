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
      deserializeExtraFields (obj, trade) {
        trade._receive_index = 0;
        trade._account_index = 0;
      },
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

    let _shouldFail = {};

    api = {
      shouldFail (method, code) {
        _shouldFail[method] = code || true;
      },
      authGET (method) {
        if (_shouldFail[method]) {
          return Promise.resolve({
            status_code: _shouldFail[method] || 500,
            message: 'FAIL'
          });
        }
        switch (method) {
          case 'api/blockchain-v1/wallet/deposit_history':
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
        if (_shouldFail[method]) {
          return Promise.resolve({
            status_code: 500,
            message: 'FAIL'
          });
        }
        switch (method) {
          case 'api/blockchain-v1/trading/instant_buyingbtc':
            response = {status_code: 200};
            Object.assign(response, tradeJsonAPI);
            // API uses integer when creating a trade, but string when listing
            response.order_id = parseInt(response.order_id);
            return Promise.resolve(response);
          case 'api/blockchain-v1/wallet/add_reference':
            response = {status_code: 200};
            return Promise.resolve(response);
          case '/api/blockchain-v1/general/inrdepositbankaccount':
            response = {
              status_code: 200,
              bank_account_type: 'Checking',
              bank_ifsc_code: '1234',
              bank_account_number: '5678',
              bank_name: 'Bank of India',
              bank_account_name: 'Unocoin'
            };
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
      let t;

      it('should keep a reference to the API', () => {
        t = new Trade(tradeJsonKV, api, delegate);
        expect(t._api).toBe(api);
      });

      it('should deserialize from KV store (not API)', () => {
        t = new Trade(tradeJsonKV, api, delegate);
        expect(t.id).toBe(tradeJsonKV.id);
        expect(t.inCurrency).toBe('INR');
        expect(t.outCurrency).toBe('BTC');
        expect(t.medium).toBe('bank');
        expect(t.state).toBe('awaiting_reference_number');
      });

      it('should ask the delegate to deserialize extra fields', () => {
        spyOn(delegate, 'deserializeExtraFields');
        t = new Trade(tradeJsonKV, api, delegate);
        expect(delegate.deserializeExtraFields).toHaveBeenCalled();
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

      it('should replace 716 error with empty array', done => {
        api.shouldFail('api/blockchain-v1/wallet/deposit_history', 716);

        let check = function (res) {
          expect(res).toEqual([]);
        };

        Trade.fetchAll(api).then(check).catch(fail).then(done);
      });

      it('should return the message for other erros', done => {
        api.shouldFail('api/blockchain-v1/wallet/deposit_history');

        let check = function (res) {
          expect(res).toEqual('FAIL');
        };

        Trade.fetchAll(api).then(fail).catch(check).then(done);
      });
    });

    describe('buy()', function () {
      let quote;

      beforeEach(function () {
        spyOn(Trade.prototype, '_monitorAddress').and.callFake(function () {});

        quote = {
          id: 101,
          baseAmount: -150000,
          baseCurrency: 'INR',
          quoteAmount: 1,
          quoteCurrency: 'BTC',
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

      it('should return the error upon failure', (done) => {
        api.shouldFail('api/blockchain-v1/trading/instant_buyingbtc');

        let checks = (message) => {
          expect(message).toEqual('FAIL');
        };

        Trade.buy(quote, 'bank').then(fail).catch(checks).then(done);
      });

      it('should use quote baseAmount if baseCurrency is INR', (done) => {
        let checks = function (t) {
          expect(api.authPOST.calls.argsFor(0)[1].amount).toEqual(150000);
        };

        Trade.buy(quote, 'bank')
          .then(checks).catch(fail).then(done);
      });

      it('should use quote quoteAmount if baseCurrency is BTC', (done) => {
        quote.baseAmount = -1;
        quote.baseCurrency = 'BTC';
        quote.quoteAmount = 150000;
        quote.quoteCurrency = 'INR';

        let checks = function (t) {
          expect(api.authPOST.calls.argsFor(0)[1].amount).toEqual(150000);
        };

        Trade.buy(quote, 'bank')
          .then(checks).catch(fail).then(done);
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
        t = new Trade(tradeJsonKV, api, delegate);
        t.setFromAPI(tradeJsonAPI);
      });

      it('should deserialize', () => {
        expect(t.state).toBe('awaiting_reference_number');
        expect(t.inAmount).toEqual(150000);
      });

      it('should map Pending status to "awaiting_reference_number" state if no ref number is set', () => {
        tradeJsonAPI.status = 'Pending';
        tradeJsonAPI.reference_number = undefined;
        t.setFromAPI(tradeJsonAPI);
        expect(t.state).toBe('awaiting_reference_number');
      });

      it('should map Pending status to "awaiting_transfer_in" state if ref number is set', () => {
        tradeJsonAPI.status = 'Pending';
        tradeJsonAPI.reference_number = '1234';
        t.setFromAPI(tradeJsonAPI);
        expect(t.state).toBe('awaiting_transfer_in');
      });

      it('should map Approved status to "processing" state', () => {
        tradeJsonAPI.status = 'Approved';
        t.setFromAPI(tradeJsonAPI);
        expect(t.state).toBe('processing');
      });

      it('should map Completed status to "completed" state', () => {
        tradeJsonAPI.status = 'Completed';
        t.setFromAPI(tradeJsonAPI);
        expect(t.state).toBe('completed');
      });

      it('should fall back to "awaiting_reference_number" for unknown state', () => {
        tradeJsonAPI.status = 'Surprise';
        t.setFromAPI(tradeJsonAPI);
        expect(t.state).toBe('awaiting_reference_number');
      });

      it('should use unix_time field when creating new trade', () => {
        tradeJsonAPI.unix_time = 1498570709;
        tradeJsonAPI.requested_time = undefined;
        t.setFromAPI(tradeJsonAPI);
        expect(t.createdAt).toEqual(new Date(1498570709 * 1000));
      });

      it('should warn if creation time is missing', () => {
        tradeJsonAPI.unix_time = undefined;
        tradeJsonAPI.requested_time = undefined;
        spyOn(window.console, 'warn');
        t.setFromAPI(tradeJsonAPI);
        expect(window.console.warn).toHaveBeenCalled();
      });

      it('should use btc value as receiveAmount before completed', () => {
        tradeJsonAPI.btc = '1.0';
        t.setFromAPI(tradeJsonAPI);
        console.log(t._receiveAmount);
        expect(t._receiveAmount).toEqual(1);
        expect(t.outAmount).toEqual(null);
      });

      it('should use ticker if btc field is missing or 0', () => {
        tradeJsonAPI.btc = undefined;
        t._delegate.ticker = {buy: {price: 75000}};
        t.setFromAPI(tradeJsonAPI);
        expect(t._receiveAmount).toEqual(2);
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

      it('should reject if no matching trade is found', (done) => {
        spyOn(Trade, 'idFromAPI').and.returnValue('no match');

        let checks = res => expect(res).toEqual('TX_NOT_FOUND');

        trade.refresh().then(fail).catch(checks).then(done);
      });
    });

    describe('addReferenceNumber()', () => {
      beforeEach(() => {
        trade._reference_number = undefined;
      });

      it('should update the trade object', done => {
        let checks = function () {
          expect(trade.state).toEqual('awaiting_transfer_in');
        };

        trade.addReferenceNumber('1234').then(checks).catch(fail).then(done);
      });

      it('should save metadata', done => {
        let checks = () => expect(trade._delegate.save).toHaveBeenCalled();

        spyOn(trade._delegate, 'save').and.callThrough();
        trade.addReferenceNumber('1234').then(checks).catch(fail).then(done);
      });

      it('should resolve with trade object', done => {
        let checks = res => expect(res).toEqual(trade);

        let promise = trade.addReferenceNumber('1234').then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should reject if server returns error', (done) => {
        api.shouldFail('api/blockchain-v1/wallet/add_reference');

        let checks = res => expect(res).toEqual('FAIL');

        trade.addReferenceNumber().then(fail).catch(checks).then(done);
      });
    });

    describe('getBankAccountDetails()', () => {
      it('should return bank details', done => {
        let checks = function (res) {
          expect(res).toEqual({mock: 'bank-account'});
        };

        trade.getBankAccountDetails().then(checks).catch(fail).then(done);
      });

      it('should reject if server returns error', (done) => {
        api.shouldFail('/api/blockchain-v1/general/inrdepositbankaccount');

        let checks = res => expect(res).toEqual('FAIL');

        trade.getBankAccountDetails().then(fail).catch(checks).then(done);
      });
    });
  });
});
