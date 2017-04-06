'use strict';

module.exports = UnocoinKYC;

function UnocoinKYC (obj, api, delegate, unocoin) {
  // delegate and unocoin are not used
  this._api = api;
  this._id = obj.id;
  this._createdAt = new Date(obj.createTime);
  this._updatedAt = new Date(obj.updateTime);
  this.set(obj);
}

UnocoinKYC.prototype.set = function (obj) {
  if ([
    'pending',
    'rejected',
    'failed',
    'expired',
    'completed',
    'reviewing',
    'documentsRequested'
  ].indexOf(obj.state) === -1) {
    console.warn('Unknown state:', obj.state);
  }
  this._state = obj.state;
  this._iSignThisID = obj.externalId;
  this._updatedAt = new Date(obj.updateTime);
  return this;
};

Object.defineProperties(UnocoinKYC.prototype, {
  'id': {
    configurable: false,
    get: function () {
      return this._id;
    }
  },
  'state': {
    configurable: false,
    get: function () {
      return this._state;
    }
  },
  'iSignThisID': {
    configurable: false,
    get: function () {
      return this._iSignThisID;
    }
  },
  'createdAt': {
    configurable: false,
    get: function () {
      return this._createdAt;
    }
  },
  'updatedAt': {
    configurable: false,
    get: function () {
      return this._updatedAt;
    }
  }
});

UnocoinKYC.prototype.refresh = function () {
  return this._api.authGET('kyc/' + this._id)
                  .then(this.set.bind(this));
};

UnocoinKYC.trigger = function (api) {
  var processKYC = function (res) {
    var kyc = new UnocoinKYC(res, api, null, null);
    return kyc;
  };

  return api.authPOST('traders/me/kyc').then(processKYC);
};

UnocoinKYC.fetchAll = function (api) {
  return api.authGET('kyc');
};
