let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let UnocoinKYC = proxyquire('../src/kyc', stubs);
let o;
let unocoin;

beforeEach(function () {
  o = {
    id: 'id',
    state: 'pending',
    externalId: 'externalId',
    createTime: '2016-07-07T12:10:19Z',
    updateTime: '2016-07-07T12:11:36Z'
  };
  return JasminePromiseMatchers.install();
});

afterEach(() => JasminePromiseMatchers.uninstall());

describe('KYC', function () {
  describe('constructor', function () {
    let api = {};

    it('must put everything in place', function () {
      let k = new UnocoinKYC(o, api, null, unocoin);
      expect(k._api).toBe(api);
      expect(k._id).toBe(o.id);
      expect(k._iSignThisID).toBe(o.externalId);
    });

    it('should warn if there is an unknown state type', function () {
      o.state = 'unknown';
      spyOn(window.console, 'warn');
      // eslint-disable-next-line no-new
      new UnocoinKYC(o, api, null, unocoin);
      expect(window.console.warn).toHaveBeenCalled();
      expect(window.console.warn.calls.argsFor(0)[1]).toEqual('unknown');
    });
  });

  describe('fetch all', () =>
    it('should call authGET with the correct arguments', function (done) {
      unocoin = {
        _kycs: [],
        authGET (method, params) { return Promise.resolve([o, o, o, o]); }
      };
      spyOn(unocoin, 'authGET').and.callThrough();

      let promise = UnocoinKYC.fetchAll(unocoin);
      let testCalls = () => expect(unocoin.authGET).toHaveBeenCalledWith('kyc');
      return promise
        .then(testCalls)
        .then(done)
        .catch(console.log);
    })
  );

  describe('refresh', () =>
    it('should call authGET with the correct arguments ', function (done) {
      unocoin = {
        _kycs: []
      };
      let api = {
        authGET (method) { return Promise.resolve([o, o, o, o]); }
      };
      spyOn(api, 'authGET').and.callThrough();
      let k = new UnocoinKYC(o, api, null, unocoin);

      let promise = k.refresh();
      let testCalls = () => expect(api.authGET).toHaveBeenCalledWith(`kyc/${k._id}`);
      return promise
        .then(testCalls)
        .then(done)
        .catch(console.log);
    })
  );

  describe('trigger', () =>
    it('should authPOST traders/me/kyc with the correct arguments ', function (done) {
      unocoin = {
        _kycs: [],
        authPOST (method) { return Promise.resolve(o); }
      };
      spyOn(unocoin, 'authPOST').and.callThrough();

      let promise = UnocoinKYC.trigger(unocoin);
      let testCalls = () => expect(unocoin.authPOST).toHaveBeenCalledWith('traders/me/kyc');
      return promise
        .then(testCalls)
        .then(done)
        .catch(console.log);
    })
  );

  describe('instance', function () {
    let k;
    beforeEach(function () {
      let api = {};
      k = new UnocoinKYC(o, api, null, unocoin);
    });

    it('should have getters', function () {
      expect(k.id).toBe(o.id);
      expect(k.state).toBe(o.state);
      expect(k.iSignThisID).toBe(o.externalId);
      expect(k.createdAt).toEqual(new Date(o.createTime));
      expect(k.updatedAt).toEqual(new Date(o.updateTime));
    });
  });
});
