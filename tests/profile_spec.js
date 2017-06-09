let proxyquire = require('proxyquireify')(require);

describe('Profile', function () {
  let newUserObj, pendingVerificationUserObj, verifiedUserObj;
  let api;

  let Photo = () => {};

  let stubs = {
    './photo': Photo
  };

  let Profile = proxyquire('../src/profile', stubs);

  beforeEach(() => {
    JasminePromiseMatchers.install();

    api = {
      authGET: () => Promise.resolve({
        status_code: 200,
        message: 'Unverified User',
        user_status: 1
      })
    };

    newUserObj = {
      message: 'Unverified User',
      user_status: 1
    };

    pendingVerificationUserObj = {
      user_status: 2,
      name: 'John Do',
      phone_number: '1234567893',
      addobjs: 'Abc #1024 6th cross',
      state_city_pin: 'Karnataka*Bangalore*560011',
      pancard_number: 'BAD876G570',
      photo: 'yes',
      passport: 'yes',
      pancard: 'yes',
      adhar_dl: 'yes',
      status: 'Verification Pending'
    };

    verifiedUserObj = {
      status: 'Verified User',
      user_status: 3,
      id: '206',
      name: 'John Do',
      phone_number: '1234567893',
      addobjs: 'Abc #1024 6th cross',
      state_city_pin: 'Karnataka*Bangalore*560011',
      pancard_number: 'BAD876G570',
      photo: 'yes',
      passport: 'yes',
      pancard: 'yes',
      adhar_dl: 'yes',
      photo_img: 'photo_1234567890.png',
      max_buy_limit: '1000',
      max_sell_limit: '10000',
      user_buy_limit: 1000,
      user_sell_limit: 10000
    };
  });

  afterEach(() => {
    JasminePromiseMatchers.uninstall();
  });

  describe('class', () => {
    describe('new Profile()', () => {
      it('should keep a reference to API object', function () {
        let p = new Profile(newUserObj, api);
        expect(p._api).toBe(api);
      });

      it('should process a user without any details', () => {
        let p = new Profile(newUserObj, api);
        expect(p.level).toEqual(1);
      });

      it('should process a user pending verification', () => {
        let p = new Profile(pendingVerificationUserObj, api);
        expect(p.level).toEqual(2);
      });

      it('should process a verified user', () => {
        let p = new Profile(verifiedUserObj, api);
        expect(p.level).toEqual(3);
      });
    });

    describe('fetch()', function () {
      it('calls wallet/profiledetails', done => {
        spyOn(api, 'authGET').and.callThrough();

        let checks = () => {
          expect(api.authGET).toHaveBeenCalledWith('api/v1/wallet/profiledetails');
        };

        Profile.fetch(api).then(checks).then(done);
      });

      it('populates the profile', function (done) {
        let checks = (p) => {
          expect(p.level).toEqual(1);
        };
        Profile.fetch(api).then(checks).then(done);
      });
    });
  });

  describe('instance', function () {
    // let newUserProfile;

    beforeEach(function () {
      // let newUserProfile = new Profile(newUserObj);
    });
  });
});
