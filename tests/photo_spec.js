
let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let Photo = proxyquire('../src/photo', stubs);

describe('Photo', function () {
  let photo;
  let api;

  beforeEach(function () {
    api = {};
  });

  describe('class', () =>
    describe('new Photo()', () =>
      it('should construct an Photo', function () {
        photo = new Photo('base64', api);
        expect(photo.base64).toEqual('base64');
      })
    )
  );
});
