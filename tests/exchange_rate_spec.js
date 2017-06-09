let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let ExchangeRate = proxyquire('../src/exchange-rate', stubs);

describe('Unocoin: Exchange Rate', function () {
  beforeEach(() => JasminePromiseMatchers.install());

  afterEach(() => JasminePromiseMatchers.uninstall());

  describe('constructor', () =>
    it('unocoin reference must be preserved', function () {
      let fakeUnocoin = {};
      let e = new ExchangeRate(fakeUnocoin);
      expect(e._unocoin).toBe(fakeUnocoin);
    })
  );

  describe('get', () =>
    it('must obtain the right rate', function (done) {
      let unocoin = {
        GET (method, object) {
          return {
            then (cb) {
              return cb({ rate: 1000 });
            }
          };
        }
      };

      let baseC = 'litecoin';
      let quoteC = 'dogecoin';
      let e = new ExchangeRate(unocoin);
      let promise = e.get(baseC, quoteC);
      expect(promise).toBeResolvedWith(1000, done);
    })
  );

  describe('get', () =>
    it('unocoin.GET must be called', function (done) {
      let unocoin = {
        GET (method, object) {
          return {
            then (cb) {
              return cb({ rate: 1000 });
            }
          };
        }
      };
      spyOn(unocoin, 'GET').and.callThrough();
      let baseC = 'litecoin';
      let quoteC = 'dogecoin';
      let e = new ExchangeRate(unocoin);
      let promise = e.get(baseC, quoteC);
      let argument = {
        baseCurrency: baseC,
        quoteCurrency: quoteC
      };
      let testCalls = () => expect(unocoin.GET).toHaveBeenCalledWith('rates/approximate', argument);
      return promise
        .then(testCalls)
        .then(done);
    })
  );
});
