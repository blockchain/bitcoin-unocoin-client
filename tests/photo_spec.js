
let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let Photo = proxyquire('../src/photo', stubs);

describe('Photo', function () {
  let photo;
  let api;

  beforeEach(function () {
    api = {
      photoUrl: fileName => `unocoin.com/${fileName}`
    };
  });

  describe('class', () => {
    describe('new Photo()', () => {
      it('should construct an Photo', () => {
        photo = new Photo('base64', api);
        expect(photo.base64).toEqual('base64');
      });

      it('should store URL if filename is provided', () => {
        photo = new Photo('base64', api, 'somefile.jpeg');
        expect(photo.url).toEqual('unocoin.com/somefile.jpeg');
      });
    });
  });
});
