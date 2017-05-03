var Address = require('./address');
var Limits = require('./limits');
var Photo = require('./photo');
var assert = require('assert');

class Profile {
  constructor (obj, api) {
    this._api = api;
    this._did_fetch = false;

    this._readOnly = false;
    this._dirty = false;

    this._photos = {
      pancard: null,
      address: null,
      id: null,
      photo: null
    };

    if (obj.user_status > 1) {
      this._readOnly = true;
    }

    // Unverified user:
    // let obj = {
    //   objult: 'notify',
    //   message: 'Unverified User',
    //   user_status: 1,
    //   status_code: 200
    // };

    // Pending verification:
    // let obj = {
    //   objult: 'notify',
    //   user_status: 2,
    //   name: 'John Do',
    //   phone_number: '1234567893',
    //   addobjs: 'Abc #1024 6th cross',
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
    // let obj = {
    //   objult: 'notify',
    //   status: 'Verified User',
    //   user_status: 3,
    //   id: '206',
    //   name: 'John Do',
    //   phone_number: '1234567893',
    //   addobjs: 'Abc #1024 6th cross',
    //   state_city_pin: 'Karnataka*Bangalore*560011',
    //   pancard_number: 'BAD876G570',
    //   photo: 'yes',
    //   passport: 'yes',
    //   pancard: 'yes',
    //   adhar_dl: 'yes',
    //   photo_img: 'unocoin20170407@sprovoost.nl_photo_1491565885.png',
    //   max_buy_limit: '1000',
    //   max_sell_limit: '10000',
    //   user_buy_limit: 1000,
    //   user_sell_limit: 10000,
    //   status_code: 200
    // };

    this._full_name = obj.name || null;

    this._mobile = obj.phone_number ? '+91' + obj.phone_number : null;

    this._pancard_number = obj.pancard_number || null;

    if (obj.state_city_pin) {
      let [state, city, pin] = obj.state_city_pin.split('*');

      this._address = new Address({
        street: obj.address,
        city: city,
        state: state, // TODO: convert to ISO-3116-2
        zipcode: pin
      });
    } else {
      this._address = new Address(null);
    }

    this._address.readOnly = this._readOnly;

    if (obj.photo_img) {
      this._photos.photo = new Photo(null, this._api, obj.photo_img);
    }

    if (obj.passport) {
      this._photos.id = true;
    }

    if (obj.pancard) {
      this._photos.pancard = true;
    }

    if (obj.adhar_dl) { // Address proof picture?
      this._photos.address = true;
    }

    this._level = obj.user_status;
    // TODO: this ignoobj max_buy_limit (daily?)
    this._currentLimits = new Limits({
      bank: {
        in: obj.user_buy_limit || 0
      }
    });
  }

  get readOnly () {
    return this._readOnly;
  }

  get dirty () {
    return this._dirty || this._address.dirty;
  }

  get photosComplete () {
    return Boolean(this._photos.id && this._photos.address && this._photos.pancard && this.photos.photo);
  }

  get complete () {
    return Boolean(
      this.photosComplete &&
      this.address.complete &&
      this.fullName &&
      this.mobile &&
      this.pancard
    );
  }

  get address () {
    return this._address;
  }

  get fullName () {
    return this._full_name;
  }

  set fullName (val) {
    assert(!this.readOnly, 'Ready only');
    if (this._full_name !== val) {
      this._dirty = true;
    }
    this._full_name = val;
  }

  get mobile () {
    return this._mobile;
  }

  set mobile (val) {
    assert(!this.readOnly, 'Ready only');
    if (this._mobile !== val) {
      this._dirty = true;
    }
    this._mobile = val;
  }

  get pancard () {
    return this._pancard_number;
  }

  set pancard (val) {
    assert(!this.readOnly, 'Ready only');
    if (this._pancard_number !== val) {
      this._pancard_number = true;
    }
    this._pancard_number = val;
  }

  get photos () {
    return this._photos;
  }

  get level () {
    return this._level;
  }

  get currentLimits () {
    return this._currentLimits;
  }

  addPhoto (type, base64) {
    switch (type) {
      case 'pancard':
        this._photos.pancard = new Photo(base64);
        break;
      case 'address':
        this._photos.address = new Photo(base64);
        break;
      case 'id':
        this._photos.id = new Photo(base64);
        break;
      case 'photo':
        this._photos.photo = new Photo(base64);
        break;
      default:
        assert(false, 'specify pancard, address, id or photo');
        break;
    }
    this._dirty = true;
  }

  verify () {
    assert(this.complete, 'Missing info, always check "complete" first');
    assert(!this.readOnly, 'Profile is read-only');
    this._dirty = false;
    this._address.didSave();
    this._address.readOnly = true;
  }

  static fetch (api) {
    return api.authGET('api/v1/wallet/profiledetails').then(function (res) {
      return new Profile(res, api);
    });
  }
}

module.exports = Profile;
