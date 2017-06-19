
let proxyquire = require('proxyquireify')(require);

describe('Quote', function () {
  let q;

  class PaymentMedium {
    getAll () {
      return Promise.resolve([
        {
          inMedium: 'bank'
        }
      ]);
    }
  }

  let Trade = () => {};
  Trade.buy = quote => Promise.resolve({amount: quote.baseAmount});

  let stubs = {
    './payment-medium': PaymentMedium,
    './trade': Trade
  };

  let Quote = proxyquire('../src/quote', stubs);

  describe('class', () => {
    describe('new Quote()', () => {
      it('should construct a Quote', () => {
        q = new Quote(
          -100000000, // Satoshi
          'BTC',
          'INR',
          {
            buy: {
              price: 150000 // 1 BTC == 150,000 INR
            }
          },
          {}, // API
          {}, // delegate
          true // Debug flag
        );

        expect(q.baseCurrency).toEqual('BTC');
        expect(q.quoteCurrency).toEqual('INR');
        expect(q.baseAmount).toEqual(-100000000); // Satoshi
        expect(q.quoteAmount).toEqual(150000); // INR
      });
    });

    describe('getQuote()', function () {
      it('should return a quote', function (done) {
        let checks = function (res) {
          expect(res.constructor.name).toEqual('Quote');
        };

        Quote.getQuote(
          {}, // API
          {
            ticker: {buy: {price: 150000}} // Price ticker
          }, // delegate
          150000,
          'INR',
          'BTC',
          false // Debug flag
        ).then(checks).catch(fail).then(done);
      });
    });
  });

  describe('instance', function () {
    describe('getters', () =>
      it('should work', function () {
        expect(q.expiresAt).toBe(q._expiresAt);
        expect(q.baseCurrency).toBe(q._baseCurrency);
        expect(q.quoteCurrency).toBe(q._quoteCurrency);
        expect(q.baseAmount).toBe(q._baseAmount);
        expect(q.quoteAmount).toBe(q._quoteAmount);
        expect(q.id).toBe(q._id);
      })
    );

    describe('QA expire()', () =>
      it('should set expiration time to 3 seconds in the future', function () {
        let originalExpiration = q.expiresAt;
        q.expire();
        expect(q.expiresAt).not.toEqual(originalExpiration);
      })
    );
  });
});
