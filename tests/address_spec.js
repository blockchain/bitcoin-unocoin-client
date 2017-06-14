
let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let Address = proxyquire('../src/address', stubs);

describe('Address', function () {
  let aObj;
  let a;

  beforeEach(function () {
    aObj = {
      street: 'Abc #1024 6th cross',
      city: 'Bangalore',
      state: 'Karnataka',
      zipcode: '560011',
      country: 'IN'
    };
    a = new Address(aObj);
  });

  describe('class', () =>
    describe('new Address()', () =>
      it('should construct an Address', function () {
        expect(a._street).toBe(aObj.street);
        expect(a._city).toBe(aObj.city);
        expect(a._state).toBe(aObj.state);
        expect(a._zipcode).toBe(aObj.zipcode);
        expect(a._country).toBe(aObj.country);
      })
    )
  );

  describe('instance', () => {
    describe('getters', () => {
      it('should work', function () {
        expect(a.street).toBe(aObj.street);
        expect(a.city).toBe(aObj.city);
        expect(a.state).toBe(aObj.state);
        expect(a.zipcode).toBe(aObj.zipcode);
        expect(a.country).toBe(aObj.country);
      });

      describe('complete', () => {
        it('should be false if e.g. city is not set', () => {
          a._city = undefined;
          expect(a.complete).toEqual(false);
        });

        it('should be true if all fields are set', () => {
          expect(a.complete).toEqual(true);
        });
      });
    });

    describe('setters', () => {
      describe('city', () => {
        it('should set dirty', () => {
          a.city = 'Delhi';
          expect(a.dirty).toEqual(true);
        });

        it('should not set dirty if value didnt change', () => {
          a.city = 'Bangalore';
          expect(a.dirty).toEqual(false);
        });
      });

      describe('country', () => {
        it('should set dirty', () => {
          a.country = 'AU';
          expect(a.dirty).toEqual(true);
        });

        it('should not set dirty if value didnt change', () => {
          a.country = 'IN';
          expect(a.dirty).toEqual(false);
        });
      });

      describe('state', () => {
        it('should set dirty', () => {
          a.state = 'Kerala';
          expect(a.dirty).toEqual(true);
        });

        it('should not set dirty if value didnt change', () => {
          a.state = 'Karnataka';
          expect(a.dirty).toEqual(false);
        });
      });

      describe('street', () => {
        it('should set dirty', () => {
          a.street = 'Abc #1024 7th cross';
          expect(a.dirty).toEqual(true);
        });

        it('should not set dirty if value didnt change', () => {
          a.street = 'Abc #1024 6th cross';
          expect(a.dirty).toEqual(false);
        });
      });

      describe('zipcode', () => {
        it('should set dirty', () => {
          a.zipcode = '560012';
          expect(a.dirty).toEqual(true);
        });

        it('should not set dirty if value didnt change', () => {
          a.zipcode = '560011';
          expect(a.dirty).toEqual(false);
        });
      });
    });

    describe('didSave', () => {
      // This method is called by profile.js after it's synced with the API
      beforeEach(() => {
        a.city = 'Delhi'; // this sets a._dirty to true
      });

      it('should unset dirty', () => {
        a.didSave();
        expect(a.dirty).toEqual(false);
      });
    });
  });
});
