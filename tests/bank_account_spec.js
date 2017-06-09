let proxyquire = require('proxyquireify')(require);

let Address = obj => ({street: obj.street});

let stubs = {
  './address': Address
};

let BankAccount = proxyquire('../src/bank-account', stubs);
let o;

beforeEach(function () {
  JasminePromiseMatchers.install();

  o = {
    bank_name: 'State Bank of Mysore',
    bank_account_name: 'Unocoin Technologies Private Limited',
    bank_account_number: '064174292872',
    bank_ifsc_code: 'SBMY0040557',
    bank_account_type: 'Current Account',
    bank_branch: null
  };
});

afterEach(() => JasminePromiseMatchers.uninstall());

describe('Bank account', function () {
  describe('constructor', () =>
    it('should deserialize object', function () {
      let b = new BankAccount(o);
      expect(b.type).toEqual('Current Account');
      expect(b.currency).toEqual('INR');
      expect(b.ifsc).toEqual('SBMY0040557');
      expect(b.number).toEqual('064174292872');

      expect(b.bankName).toEqual('State Bank of Mysore');
      expect(b.holderName).toEqual('Unocoin Technologies Private Limited');
    })
  );
});
