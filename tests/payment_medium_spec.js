let proxyquire = require('proxyquireify')(require);

describe('PaymentMedium', () => {
  let PaymentMedium;
  let o;
  let b;
  let api;
  let quote;
  let profile;

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

    quote = {
      baseCurrency: 'INR',
      baseAmount: -150000,
      quoteCurrency: 'BTC',
      quoteAmount: 100000000,
      _TradeClass: {}
    };

    JasminePromiseMatchers.install();
  });

  afterEach(() => {
    JasminePromiseMatchers.uninstall();
  });

  describe('constructor', function () {
    it('must put everything on place', function () {
      b = new PaymentMedium(o, api, quote, profile);
      expect(b.inMedium).toEqual('bank');
      expect(b.outMedium).toEqual('blockchain');
      expect(b.inCurrency).toEqual('INR');
      expect(b.outCurrency).toEqual('BTC');
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
      quote = {baseAmount: -1000, baseCurrency: 'EUR', quoteAmount: 2};
      b = new PaymentMedium(o, api, quote);
    });
  });
});
