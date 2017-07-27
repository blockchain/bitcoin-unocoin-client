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

    let _shouldFail = {};

    api = {
      shouldFail: (method) => {
        _shouldFail[method] = true;
      },
      authGET: (method) => {
        if (_shouldFail[method]) {
          return Promise.resolve({
            status_code: 714,
            user_status: 2,
            message: 'FAIL'
          });
        } else {
          return Promise.resolve({
            status_code: 200,
            message: 'Unverified User',
            user_status: 1
          });
        }
      },
      authPOST: (method) => {
        if (_shouldFail[method]) {
          return Promise.resolve({
            status_code: 714,
            user_status: 2,
            message: 'FAIL'
          });
        } else {
          return Promise.resolve({
            status_code: 200,
            user_status: 2
          });
        }
      }
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
          expect(api.authGET).toHaveBeenCalledWith('api/blockchain-v1/wallet/profiledetails');
        };

        Profile.fetch(api).then(checks).then(done);
      });

      it('should return error message if it fails', done => {
        api.shouldFail('api/blockchain-v1/wallet/profiledetails');
        spyOn(api, 'authGET').and.callThrough();

        let checks = (res) => {
          expect(res).toEqual('FAIL');
        };

        Profile.fetch(api).then(fail).catch(checks).then(done);
      });

      it('populates the profile', function (done) {
        let checks = (p) => {
          expect(p.level).toEqual(1);
        };
        Profile.fetch(api).then(checks).then(done);
      });
    });
  });

  describe('level 1', () => {
    let profile;

    beforeEach(() => {
      profile = new Profile(newUserObj, api);
    });

    it('should not be read-only', () => {
      expect(profile.readOnly).toBeFalsy();
    });

    it('should not be dirty by default', () => {
      expect(profile.dirty).toBeFalsy();
    });

    it('should be dirty if a field is changed', () => {
      profile.fullName = 'John Do';
      expect(profile.dirty).toBeTruthy();
    });

    it('should not be dirty if a field is not changed', () => {
      profile.fullName = 'John Do';
      profile.mobile = '1234567893';
      profile.pancard = 'BAD876G570';
      profile.bankAccountNumber = '123';
      profile.ifsc = '456';
      profile._dirty = false; // Pretend we saved

      profile.fullName = 'John Do';
      profile.mobile = '1234567893';
      profile.pancard = 'BAD876G570';
      profile.bankAccountNumber = '123';
      profile.ifsc = '456';
      expect(profile.dirty).toBeFalsy();
    });

    describe('photos complete', () => {
      it('should check address, pancard and photo present', () => {
        expect(profile.photosComplete).toBeFalsy();
        profile._photos = {
          address: 'base64',
          pancard: 'base64',
          photo: 'base64'
        };
        expect(profile.photosComplete).toBeTruthy();
      });
    });

    describe('address complete', () => {
      it('should check mobile, pancard full name and address details present', () => {
        expect(profile.identityComplete).toBeFalsy();
        profile.mobile = '123';
        profile.pancard = '456';
        profile.fullName = 'John Do';
        profile._address = {complete: true};
        expect(profile.identityComplete).toBeTruthy();
      });
    });

    describe('info complete', () => {
      it('should check IFSC and bank account', () => {
        expect(profile.bankInfoComplete).toBeFalsy();
        profile.ifsc = '123';
        profile.bankAccountNumber = '456';
        profile.submittedBankInfo = true;
        expect(profile.bankInfoComplete).toBeTruthy();
      });
    });

    describe('complete', () => {
      it('should check all the things', () => {
        expect(profile.complete).toBeFalsy();

        spyOnProperty(profile, 'photosComplete').and.returnValue(true);
        spyOnProperty(profile, 'identityComplete').and.returnValue(true);
        spyOnProperty(profile, 'bankInfoComplete').and.returnValue(true);

        expect(profile.complete).toBeTruthy();
      });
    });

    describe('verify()', () => {
      beforeEach(() => {
        profile.fullName = 'John Do';
        profile.mobile = '+91234567893';
        profile.pancard = 'BAD876G570';
        profile.bankAccountNumber = '123';
        profile.submittedBankInfo = true;
        profile.ifsc = '456';
        profile._photos = {
          address: {base64: 'base64'},
          pancard: {base64: 'base64'},
          photo: {base64: 'base64'}
        };
        profile._address = {
          street: '1',
          state: 'K',
          city: 'Bangalore',
          zipcode: '123',
          country: 'IN',
          complete: true,
          didSave: () => {}
        };

        spyOn(api, 'authPOST').and.callThrough();
      });

      it('calls settings/uploaduserprofile', done => {
        let checks = () => {
          expect(api.authPOST).toHaveBeenCalled();
          expect(api.authPOST.calls.argsFor(0)[0]).toEqual(('api/blockchain-v1/settings/uploaduserprofile'));
        };

        profile.verify().then(checks).catch(fail).then(done);
      });

      it('should set readOnly to true', (done) => {
        let checks = () => {
          expect(profile.readOnly).toBeTruthy();
        };

        profile.verify().then(checks).catch(fail).then(done);
      });

      it('should set dirty to false', (done) => {
        let checks = () => {
          expect(profile.dirty).toBeFalsy();
        };

        profile.verify().then(checks).catch(fail).then(done);
      });

      describe('fails', () => {
        beforeEach(() => {
          api.shouldFail('api/blockchain-v1/settings/uploaduserprofile');
        });

        it('should return the error message', (done) => {
          let checks = (message) => {
            expect(message).toEqual('FAIL');
          };

          profile.verify().then(fail).catch(checks).then(done);
        });

        it('should leave readOnly false', (done) => {
          let checks = () => {
            expect(profile.readOnly).toBeFalsy();
          };

          profile.verify().then(fail).catch(checks).then(done);
        });

        it('should remain dirty', (done) => {
          let checks = () => {
            expect(profile.dirty).toBeTruthy();
          };

          profile.verify().then(fail).catch(checks).then(done);
        });
      });
    });

    describe('addPhoto', () => {
      it('should create a photo object', () => {
        profile.addPhoto('address', 'abc');
        expect(profile._photos.address).toBeDefined();
      });

      it('should support address, pandcard and photo', () => {
        profile.addPhoto('address', 'abc');
        expect(profile._photos.address).toBeDefined();

        profile.addPhoto('pancard', 'abc');
        expect(profile._photos.pancard).toBeDefined();

        profile.addPhoto('photo', 'abc');
        expect(profile._photos.photo).toBeDefined();
      });

      it('should fail for unknown photo type', () => {
        expect(() => {
          profile.addPhoto('unknown', 'abc');
        }).toThrow();
      });
    });
  });

  describe('level 2', () => {
    let profile;

    beforeEach(() => {
      profile = new Profile(pendingVerificationUserObj, api);
    });

    it('should be read-only', () => {
      expect(profile.readOnly).toBeTruthy();
    });
  });

  describe('level 3', () => {
    let profile;

    beforeEach(() => {
      profile = new Profile(verifiedUserObj, api);
    });

    it('should be read-only', () => {
      expect(profile.readOnly).toBeTruthy();
    });

    it('sets the current limits', () => {
      expect(profile.currentLimits.bank.inRemaining).toEqual(1000);
    });
  });
});
