var Unocoin = require('../src/unocoin');
var picture = require('./helpers/picture.js');
var delegate = require('./helpers/delegate');

var prompt = require('prompt');

console.log('Bitcoin Unocoin Client Demo - Verify');

if (!process.env.OFFLINE_TOKEN) {
  console.error('OFFLINE_TOKEN missing');
  process.exit(1);
}

var unocoin = new Unocoin({
  user: 'some_user_id',
  offline_token: process.env.OFFLINE_TOKEN,
  auto_login: true,
  trades: []
}, delegate);

delegate.trades = unocoin.trades;

unocoin.debug = true;

console.log('Fetching profile details');
unocoin.fetchProfile().then((profile) => {
  console.log('Level', profile.level);

  if (profile.level > 1) {
    console.log('Name', profile.fullName);
    console.log('Mobile', profile.mobile);
    console.log('Address', profile.address);
  }

  if (profile.level === 1) {
    prompt.get(['name'], (err, result) => {
      if (err) {
        // Ignore
      }

      let unique = new Date().getTime().toString();

      profile.fullName = result.name;

      profile.mobile = unique.slice(0, 10);
      profile.pancard = unique.slice(0, 10);
      profile.address.street = 'Abc #1024 6th cross Bangalore';
      profile.address.city = 'Bangalore';
      profile.address.state = 'Karnataka';
      profile.address.zipcode = '560011';

      profile.bankAccountNumber = unique.slice(0, 4);
      profile.ifsc = 'VYSY0002270';

      profile.addPhoto('pancard', picture);
      profile.addPhoto('address', picture);
      profile.addPhoto('id', picture);
      profile.addPhoto('photo', picture);

      profile.verify().then(() => {
        console.log('Use admin panel to approve');
      });
    });
  }

  if (profile.level === 2) {
    console.log('Use admin panel to approve');
  }

  if (profile.level === 3) {
    console.log('Verified!');
  }
});
