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

    this._bankAccountNumber = null;

    this._ifsc = null;

    this._level = obj.user_status;
    // TODO: this ignoobj max_buy_limit (daily?)
    this._currentLimits = new Limits({
      bank: {
        in: obj.user_buy_limit || 0
      }
    });

    this._submittedBankInfo = false;
  }

  get readOnly () {
    return this._readOnly;
  }

  get dirty () {
    return this._dirty || this._address.dirty;
  }

  get photosComplete () {
    return Boolean(this._photos.address && this._photos.pancard && this.photos.photo);
  }

  get identityComplete () {
    return this.level > 1 || Boolean(
      this.mobile &&
      this.pancard &&
      this.fullName &&
      this.address.complete
    );
  }

  get bankInfoComplete () {
    return this.level > 1 || Boolean(
      this.ifsc &&
      this.bankAccountNumber &&
      this._submittedBankInfo
    );
  }

  get complete () {
    return this.level > 1 || Boolean(
      this.photosComplete &&
      this.identityComplete &&
      this.bankInfoComplete
    );
  }

  get address () {
    return this._address;
  }

  get fullName () {
    return this._full_name;
  }

  set fullName (val) {
    assert(!this.readOnly, 'Read only');
    if (this._full_name !== val) {
      this._dirty = true;
    }
    this._full_name = val;
  }

  get mobile () {
    return this._mobile;
  }

  set mobile (val) {
    assert(!this.readOnly, 'Read only');
    if (this._mobile !== val) {
      this._dirty = true;
    }
    this._mobile = val;
  }

  get pancard () {
    return this._pancard_number;
  }

  set pancard (val) {
    assert(!this.readOnly, 'Read only');
    if (this._pancard_number !== val) {
      this._dirty = true;
    }
    this._pancard_number = val;
  }

  get bankAccountNumber () {
    return this._bank_account_number;
  }

  set bankAccountNumber (val) {
    assert(!this.readOnly, 'Read only');
    if (this._bank_account_number !== val) {
      this._dirty = true;
    }
    this._bank_account_number = val;
  }

  get ifsc () {
    return this._ifsc;
  }

  set ifsc (val) {
    assert(!this.readOnly, 'Read only');
    if (this._ifsc !== val) {
      this._dirty = true;
    }
    this._ifsc = val;
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

  get submittedBankInfo () {
    return this._submittedBankInfo;
  }

  set submittedBankInfo (val) {
    this._submittedBankInfo = val;
  }

  addPhoto (type, base64) {
    switch (type) {
      case 'address':
        this._photos.address = new Photo(base64);
        break;
      case 'pancard':
        this._photos.pancard = new Photo(base64);
        break;
      case 'photo':
        this._photos.photo = new Photo(base64);
        break;
      default:
        assert(false, 'specify address, pancard or photo');
    }
    this._dirty = true;
  }

  verify () {
    assert(this.level < 2, 'Already submitted');
    assert(this.complete, 'Missing info, always check "complete" first');
    assert(!this.readOnly, 'Profile is read-only');

    let payload = {
      name: this.fullName,
      mobile: this.mobile.replace(/\+91/g, '').replace(/ /g, ''),
      pannumber: this.pancard,
      address: this.address.street,
      state: this.address.state,
      city: this.address.city,
      pincode: this.address.zipcode,
      bank_accnum: this.bankAccountNumber,
      ifsc: this.ifsc,
      pancard_photo: this.photos.pancard.base64.split(',')[1],
      photo: this.photos.photo.base64.split(',')[1],
      address_proof: this.photos.address.base64.split(',')[1]
    };

    return this._api.authPOST('api/blockchain-v1/settings/uploaduserprofile', payload).then(res => {
      if (res.status_code === 200) {
        this._dirty = false;
        this._address.didSave();

        // TODO: refresh profile to be on the safe side
        this._level = 2;
        this._readOnly = true;
        this._address.readOnly = true;
      } else {
        return Promise.reject(res.message);
      }
    });
  }

  static fetch (api) {
    return api.authGET('api/blockchain-v1/wallet/profiledetails').then(res => {
      if (res.status_code === 200) {
        return new Profile(res, api);
      } else {
        return Promise.reject(res.message);
      }
    });
  }
}

module.exports = Profile;
