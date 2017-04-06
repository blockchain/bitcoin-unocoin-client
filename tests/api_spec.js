let proxyquire = require('proxyquireify')(require);

let stubs = {
};

const API = proxyquire('../src/api', stubs);

describe('Unocoin API', function () {
  let api;

  beforeEach(() => JasminePromiseMatchers.install());

  afterEach(() => JasminePromiseMatchers.uninstall());

  describe('class', () =>
    describe('new API()', () =>
      it('should have a null _offlineToken', function () {
        api = new API();
        expect(api._offlineToken).toEqual(null);
      })
    )
  );

  describe('instance', function () {
    beforeEach(function () {
      api = new API();
      api._offlineToken = 'offline-token';
    });

    describe('Getter', function () {
      describe('hasAccount', () =>
        it('should use offline_token to see if user has account', function () {
          api._offlineToken = undefined;
          expect(api.hasAccount).toEqual(false);

          api._offlineToken = 'token';
          expect(api.hasAccount).toEqual(true);
        })
      );

      describe('isLoggedIn', function () {
        beforeEach(function () {
          api._offlineToken = 'offline_token';
        });

        it('checks if there is an offline token', function () {
          expect(api.isLoggedIn).toEqual(true);

          api._offlineToken = undefined;
          expect(api.isLoggedIn).toEqual(false);
        });
      });
    });

    describe('_url', () => {
      it('should use unocoin.co in production', () => {
        api._production = true;
        expect(api._url()).toEqual('https://unocoin.co/');
      });

      it('should use sandbox for testing', () => {
        api._production = false;
        expect(api._url()).toEqual('https://sandbox.unocoin.co/');
      });

      it('should include the endpoint', () => {
        api._production = true;
        expect(api._url('endpoint')).toEqual('https://unocoin.co/endpoint');
      });
    });

    describe('login', function () {
      it('should just resolve', function (done) {
        let promise = api.login();
        expect(promise).toBeResolved(done);
      });
    });

    describe('REST', function () {
      beforeEach(() => spyOn(api, '_request'));

      describe('GET', () =>
        it('should make a GET request', function () {
          api.GET('/trades');
          expect(api._request).toHaveBeenCalled();
          expect(api._request.calls.argsFor(0)[0]).toEqual('GET');
        })
      );

      describe('POST', () =>
        it('should make a POST request', function () {
          api.POST('/trades');
          expect(api._request).toHaveBeenCalled();
          expect(api._request.calls.argsFor(0)[0]).toEqual('POST');
        })
      );

      describe('PATCH', () =>
        it('should make a PATCH request', function () {
          api.PATCH('/trades');
          expect(api._request).toHaveBeenCalled();
          expect(api._request.calls.argsFor(0)[0]).toEqual('PATCH');
        })
      );

      describe('authenticated', function () {
        beforeEach(function () {
          return spyOn(api, 'login').and.callThrough();
        });

        it('should refuse if no offline token is present for GET', function () {
          api._offlineToken = null;
          api.authGET('/trades');

          expect(api._request).not.toHaveBeenCalled();
        });

        it('should refuse if no offline token is present for POST', function () {
          api._offlineToken = null;
          api.authPOST('/trades');

          expect(api._request).not.toHaveBeenCalled();
        });

        it('should refuse if no offline token is present for PATCH', function () {
          api._offlineToken = null;
          api.authPATCH('/trades');

          expect(api._request).not.toHaveBeenCalled();
        });

        describe('GET', () =>
          it('should make a GET request', function () {
            api.authGET('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('GET');
            expect(api._request.calls.argsFor(0)[4]).toEqual(true);
          })
        );

        describe('POST', () =>
          it('should make a POST request', function () {
            api.authPOST('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('POST');
            expect(api._request.calls.argsFor(0)[4]).toEqual(true);
          })
        );

        describe('PATCH', () =>
          it('should make a PATCH request', function () {
            api.authPATCH('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('PATCH');
            expect(api._request.calls.argsFor(0)[4]).toEqual(true);
          })
        );
      });
    });
  });
});
