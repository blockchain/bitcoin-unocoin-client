var assert = require('assert');
var Exchange = require('bitcoin-exchange-client');

class API extends Exchange.API {
  constructor () {
    super();
    this._offlineToken = null;
  }

  get isLoggedIn () {
    return Boolean(this.offlineToken);
  }
  get offlineToken () { return this._offlineToken; }
  get hasAccount () { return Boolean(this.offlineToken); }

  // Todo: move login abstraction to exchange client
  login () {
    return Promise.resolve();
  }

  photoUrl (filename) {
    return this._url(`photos/${filename}`);
  }

  _url (endpoint) {
    endpoint = endpoint || '';
    return `https://${this._production ? 'www' : 'sandbox'}.unocoin.${this._production ? 'com' : 'co'}/${endpoint}`;
  }

  _request (method, endpoint, data, extraHeaders = {}, authorized) {
    assert(!authorized || this.isLoggedIn, "Can't make authorized request if not logged in");

    let headers = extraHeaders;

    if (authorized) {
      headers['Authorization'] = 'Bearer ' + this._offlineToken;
    }

    return super._request(method, this._url(endpoint), data, headers);
  }

  // Todo: move authRequest abstraction to exchange client
  _authRequest (method, endpoint, data, extraHeaders) {
    var doRequest = function () {
      return this._request(method, endpoint, data, extraHeaders, true);
    };

    if (this.isLoggedIn) {
      return doRequest.bind(this)();
    } else {
      return this.login().then(doRequest.bind(this));
    }
  }

  GET (endpoint, data, extraHeaders) {
    return this._request('GET', endpoint, data, extraHeaders);
  }

  authGET (endpoint, data, extraHeaders) {
    return this._authRequest('GET', endpoint, data, extraHeaders);
  }

  POST (endpoint, data, extraHeaders) {
    return this._request('POST', endpoint, data, extraHeaders);
  }

  authPOST (endpoint, data, extraHeaders) {
    return this._authRequest('POST', endpoint, data, extraHeaders);
  }

  PATCH (endpoint, data, extraHeaders) {
    return this._request('PATCH', endpoint, data, extraHeaders);
  }

  authPATCH (endpoint, data, extraHeaders) {
    return this._authRequest('PATCH', endpoint, data, extraHeaders);
  }

  DELETE (endpoint, data, extraHeaders) {
    return this._authRequest('DELETE', endpoint, data, extraHeaders);
  }

  authDELETE (endpoint, data, extraHeaders) {
    return this._authRequest('DELETE', endpoint, data, extraHeaders);
  }

}

module.exports = API;
