var Unocoin = require('../src/unocoin');
var delegate = require('./helpers/delegate');

var prompt = require('prompt');

console.log('Bitcoin Unocoin Client Demo');

var unocoin = Unocoin.new(delegate);
unocoin.debug = true;

console.log('Please create a Blockchain wallet with a unique email and verify your email');
console.log('Get the wallet identifier: Blockchain.MyWallet.wallet.guid');
console.log('Get the shared key: Blockchain.MyWallet.wallet.sharedKey');

prompt.get(['email', 'walletIdentifier', 'sharedKey'], function (err, result) {
  if (err) {
    // Ignore
  }
  delegate.demo.setEmail(result.email);
  delegate.demo.setWalletIdentifier(result.walletIdentifier);
  delegate.demo.setSharedKey(result.sharedKey);

  unocoin.signup().then(() => {
    console.log('To continue the demo with this Unocoin account:');
    console.log(`OFFLINE_TOKEN=${unocoin._offlineToken} node demos/verify.js`);
    console.log(`OFFLINE_TOKEN=${unocoin._offlineToken} node demos/buy.js`);
  }).catch((e) => {
    console.error(e.message || e);
  });
});
