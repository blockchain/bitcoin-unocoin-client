
let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let Address = proxyquire('../src/address', stubs);

describe('UnocoinAddress', function () {
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

  describe('instance', () =>
    describe('getters', () =>
      it('should work', function () {
        expect(a.street).toBe(aObj.street);
        expect(a.city).toBe(aObj.city);
        expect(a.state).toBe(aObj.state);
        expect(a.zipcode).toBe(aObj.zipcode);
        expect(a.country).toBe(aObj.country);
      })
    )
  );
});
