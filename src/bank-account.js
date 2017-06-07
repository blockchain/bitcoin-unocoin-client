'use strict';

module.exports = BankAccount;

function BankAccount (obj) {
  this._type = obj.bank_account_type;
  this._currency = 'INR';
  this._ifsc = obj.bank_ifsc_code;
  this._number = obj.bank_account_number;
  this._bank_name = obj.bank_name;
  this._holder_name = obj.bank_account_name;
}

Object.defineProperties(BankAccount.prototype, {
  'type': {
    configurable: false,
    get: function () {
      return this._type;
    }
  },
  'currency': {
    configurable: false,
    get: function () {
      return this._currency;
    }
  },
  'ifsc': {
    configurable: false,
    get: function () {
      return this._ifsc;
    }
  },
  'number': {
    configurable: false,
    get: function () {
      return this._number;
    }
  },
  'bankName': {
    configurable: false,
    get: function () {
      return this._bank_name;
    }
  },
  'holderName': {
    configurable: false,
    get: function () {
      return this._holder_name;
    }
  }
});
