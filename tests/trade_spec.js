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
      id: '1142',
      requested_time: '2017-06-09 19:58:48',
      inr: 150000,
      reference_number: '',
      transaction_hash: '',
      bitcoin_address: '',
      status: 'Pending'
    };

    tradeJsonAPI2 = JSON.parse(JSON.stringify(tradeJsonAPI));
    tradeJsonAPI2.id = '1143';
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('class', () =>
    describe('new Trade()', function () {
      beforeEach(function () {
        api = {};
      });

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
    })
  );

  describe('instance', function () {
    let profile;
    let trade;

    beforeEach(function () {
      api = {
        authGET (method) {
          return Promise.resolve({
            id: 1,
            defaultCurrency: 'EUR',
            email: 'john@do.com',
            profile,
            feePercentage: 3,
            currentLimits: {
              bank: {
                in: {
                  daily: 0,
                  yearly: 0
                },
                out: {
                  daily: 100,
                  yearly: 1000
                }
              }
            },

            requirements: [],
            level: {name: '1'},
            nextLevel: {name: '2'},
            state: 'awaiting_transfer_in'
          });
        },
        authPOST () { return Promise.resolve('something'); }
      };
      spyOn(api, 'authGET').and.callThrough();
      spyOn(api, 'authPOST').and.callThrough();
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

    xdescribe('buy()', function () {
      let quote;

      beforeEach(function () {
        spyOn(Trade.prototype, '_monitorAddress').and.callFake(function () {});
        api.authPOST = () => Promise.resolve(tradeJsonAPI);

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
        spyOn(api, 'authPOST').and.callThrough();
        let testTrade = function (t) {
          expect(api.authPOST).toHaveBeenCalled();
          expect(t.id).toEqual(1142);
        };

        let promise = Trade.buy(quote, 'bank')
          .then(testTrade);

        expect(promise).toBeResolved(done);
      });

      it('should watch the address', function (done) {
        let checks = trade => expect(trade._monitorAddress).toHaveBeenCalled();

        let promise = Trade.buy(quote, 'bank')
          .then(checks);

        expect(promise).toBeResolved(done);
      });
    });

    xdescribe('fetchAll()', function () {
      beforeEach(() => spyOn(delegate, 'releaseReceiveAddress').and.callThrough());

      it('should fetch all the trades', function (done) {
        api.authGET = () => Promise.resolve([tradeJsonAPI, tradeJsonAPI2]);

        let check = function (res) {
          expect(res.length).toBe(2);
        };

        Trade.fetchAll(api).then(check).catch(fail).then(done);
      });
    });

    xdescribe('refresh()', function () {
      beforeEach(function () {
        api.authGET = () => Promise.resolve({});
        spyOn(api, 'authGET').and.callThrough();
      });

      it('should authGET /trades/:id and update the trade object', function (done) {
        let checks = function () {
          expect(api.authGET).toHaveBeenCalledWith(`trades/${trade._id}`);
          expect(trade.set).toHaveBeenCalled();
        };

        trade.set = () => Promise.resolve(trade);
        spyOn(trade, 'set').and.callThrough();

        let promise = trade.refresh().then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should save metadata', function (done) {
        let checks = () => expect(trade._delegate.save).toHaveBeenCalled();

        trade.set = () => Promise.resolve(trade);
        spyOn(trade._delegate, 'save').and.callThrough();
        let promise = trade.refresh().then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should resolve with trade object', function (done) {
        let checks = res => expect(res).toEqual(trade);

        trade.set = () => Promise.resolve(trade);
        let promise = trade.refresh().then(checks);

        expect(promise).toBeResolved(done);
      });
    });
  });
});
