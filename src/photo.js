class Photo {
  constructor (base64, api, filename) {
    this._base64 = base64;

    if (api && filename) {
      this._url = api.photoUrl(filename);
    } else {
      this._url = null;
    }
  }

  get base64 () {
    return this._base64;
  }

  get url () {
    return this._url;
  }
}

module.exports = Photo;
