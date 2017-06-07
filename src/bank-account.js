class BankAccount {
  constructor (obj) {
    this._type = obj.bank_account_type;
    this._currency = 'INR';
    this._ifsc = obj.bank_ifsc_code;
    this._number = obj.bank_account_number;
    this._bank_name = obj.bank_name;
    this._holder_name = obj.bank_account_name;
  }

  get type () {
    return this._type;
  }

  get currency () {
    return this._currency;
  }

  get ifsc () {
    return this._ifsc;
  }

  get number () {
    return this._number;
  }

  get bankName () {
    return this._bank_name;
  }

  get holderName () {
    return this._holder_name;
  }
}

module.exports = BankAccount;
