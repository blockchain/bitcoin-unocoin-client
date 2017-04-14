var Address = require('./address');
var Limits = require('./limits');

module.exports = UnocoinProfile;

function UnocoinProfile (api) {
  this._api = api;
  this._did_fetch;
}

Object.defineProperties(UnocoinProfile.prototype, {
  'fullName': {
    configurable: false,
    get: function () {
      return this._full_name;
    }
  },
  'email': {
    configurable: false,
    get: function () {
      return this._email;
    }
  },
  'mobile': {
    configurable: false,
    get: function () {
      return this._mobile;
    }
  },
  'level': {
    configurable: false,
    get: function () {
      return this._level;
    }
  },
  'currentLimits': {
    configurable: false,
    get: function () {
      return this._currentLimits;
    }
  }
});

UnocoinProfile.prototype.fetch = function () {
  var parentThis = this;
  return this._api.authGET('api/v1/wallet/profiledetails').then(function (res) {
    // Mock response pending CORS fix...
  }).catch(function () {
    // Unverified user:
    // let res = {
    //   result: 'notify',
    //   message: 'Unverified User',
    //   user_status: 1,
    //   status_code: 200
    // };

    // Pending verification:
    // let res = {
    //   result: 'notify',
    //   user_status: 2,
    //   name: 'John Do',
    //   phone_number: '1234567893',
    //   address: 'Abc #1024 6th cross',
    //   state_city_pin: 'Karnataka*Bangalore*560011',
    //   pancard_number: 'BAD876G570',
    //   photo: 'yes',
    //   passport: 'yes',
    //   pancard: 'yes',
    //   adhar_dl: 'yes',
    //   status: 'Verification Pending',
    //   status_code: 200
    // };

    // Verified user:
    let res = {
      result: 'notify',
      status: 'Verified User',
      user_status: 3,
      id: '206',
      name: 'John Do',
      phone_number: '1234567893',
      address: 'Abc #1024 6th cross',
      state_city_pin: 'Karnataka*Bangalore*560011',
      pancard_number: 'BAD876G570',
      photo: 'yes',
      passport: 'yes',
      pancard: 'yes',
      adhar_dl: 'yes',
      photo_img: 'unocoin20170407@sprovoost.nl_photo_1491565885.png',
      max_buy_limit: '1000',
      max_sell_limit: '10000',
      user_buy_limit: 1000,
      user_sell_limit: 10000,
      status_code: 200
    };

    parentThis._full_name = res.name;

    // TODO: wait for this to be added to API, otherwise use unocoin.user
    // parentThis._email = res.email;

    parentThis._mobile = '+91' + res.phone_number;

    let [state, city, pin] = res.state_city_pin.split('*');

    parentThis.address = new Address({
      street: res.address,
      city: city,
      state: state, // TODO: convert to ISO-3116-2
      zipcode: pin,
      country: 'IN'
    });

    parentThis._level = res.user_status;
    // TODO: this ignores max_buy_limit (daily?)
    parentThis._currentLimits = new Limits({
      bank: {
        in: res.user_buy_limit || 0
      }
    });

    parentThis._did_fetch = true;

    return parentThis;
  });
};
