class Address {
  constructor (obj) {
    this._street = obj.street;
    this._city = obj.city;
    this._state = obj.state;
    this._zipcode = obj.zipcode;
    this._country = obj.country;
  }


  get city () {
    return this._city;
  }

  get country () {
    return this._country;
  }

  // ISO 3166-2, the part after the dash
  get state () {
    return this._state;
  }

  get street () {
    return this._street;
  }

  get zipcode () {
    return this._zipcode;
  }
}

module.exports = Address;
