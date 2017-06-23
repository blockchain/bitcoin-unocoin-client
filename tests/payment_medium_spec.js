let proxyquire = require('proxyquireify')(require);

describe('PaymentMedium', () => {
  let PaymentMedium;
  let o;
  let p;
  let api;
  let quote;
  let profile;
  let delegate;

  beforeEach(() => {
    profile = {
      currentLimits: {
        bank: {
          inRemaining: 1000000
        }
      }
    };

    let Profile = {
      fetch: () => Promise.resolve(profile)
    };

    let stubs = {
      './profile': Profile
    };

    PaymentMedium = proxyquire('../src/payment-medium', stubs);

    api = {};

    delegate = {
      trades: [],
      save: () => Promise.resolve()
    };

    quote = {
      baseCurrency: 'INR',
      baseAmount: -150000,
      quoteCurrency: 'BTC',
      quoteAmount: 100000000,
      _TradeClass: {
        buy: () => Promise.resolve({})
      },
      delegate: delegate
    };

    JasminePromiseMatchers.install();
  });

  afterEach(() => {
    JasminePromiseMatchers.uninstall();
  });

  describe('constructor', function () {
    it('must put everything on place', function () {
      p = new PaymentMedium(o, api, quote, profile);
      expect(p.inMedium).toEqual('bank');
      expect(p.outMedium).toEqual('blockchain');
      expect(p.inCurrency).toEqual('INR');
      expect(p.outCurrency).toEqual('BTC');
    });

    it('should work without quote', function () {
      p = new PaymentMedium(null, api, null, profile);
      expect(p.inMedium).toEqual('bank');
    });
  });

  describe('getAll()', function () {
    beforeEach(() => {
      api = {
        authPOST (method, params) {
          switch (method) {
            default:
              return Promise.reject();
          }
        }
      };
    });

    it('should return {bank: ...} for buy', function (done) {
      let promise = PaymentMedium.getAll('INR', 'BTC', api, quote);

      let testCalls = res => {
        expect(res.bank).toBeDefined();
      };

      return promise
        .then(testCalls)
        .catch(fail)
        .then(done);
    });

    it('should ignore exceeding the buy limit', function (done) {
      quote.baseAmount = -1500000;
      quote.quoteAmount = 1000000000;
      let promise = PaymentMedium.getAll('INR', 'BTC', api, quote);

      let testCalls = res => {
        expect(res.bank).toBeDefined();
      };

      return promise
        .then(testCalls)
        .catch(fail)
        .then(done);
    });
  });

  describe('instance', function () {
    beforeEach(function () {
      p = new PaymentMedium(o, api, quote, profile);
    });

    describe('checkMinimum', () => {
      it('should check baseAmount against minimumInAmounts', () => {
        expect(p.checkMinimum()).toEqual(true);

        p._quote.baseAmount = -999;
        expect(p.checkMinimum()).toEqual(false);
      });
    });

    describe('buy()', () => {
      it('should check the minimum amount', (done) => {
        spyOn(p, 'checkMinimum').and.callThrough();
        p.buy().catch(fail).then(done);
        expect(p.checkMinimum).toHaveBeenCalled();
      });
    });
  });
});
