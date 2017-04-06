var Unocoin = require('./src/unocoin');
var prompt = require('prompt');

var fetch = require('isomorphic-fetch');

console.log('Bitcoin Unocoin Client Demo');

var unocoin;

var delegate = {
  save: () => {
    return Promise.resolve();
  },
  email: () => email,
  isEmailVerified: () => true,
  getToken: () => {
    console.log('Obtaining signed email token from Blockchain.info');
    let url = `https://blockchain.info/wallet/signed-token?fields=email&partner=unocoin&guid=${walletIdentifier}&sharedKey=${sharedKey}`;

    const processResponse = (response) => response.json();

    return fetch(url)
      .then(processResponse)
      .then((result) => result.token)
      .catch((e) => {
        console.error(e);
      });
  },
  monitorAddress: (address, callback) => {},
  checkAddress: (address) => {},
  getReceiveAddress: (trade) => {
    return receiveAddress;
  },
  reserveReceiveAddress: () => {
    return {
      receiveAddress: receiveAddress,
      commit: () => {}
    };
  },
  releaseReceiveAddress: () => {},
  serializeExtraFields: (obj, trade) => {},
  deserializeExtraFields: (obj, trade) => {}
};

if (process.env.OFFLINE_TOKEN) {
  var receiveAddress;

  unocoin = new Unocoin({
    user: 'some_user_id',
    offline_token: process.env.OFFLINE_TOKEN,
    auto_login: true,
    trades: []
  }, delegate);

  delegate.trades = unocoin.trades;

  unocoin.debug = true;

  console.log('Fetching previous trades');
  unocoin.getTrades().then((trades) => {
    if (trades.length > 0) {
      for (let trade of trades) {
        console.log(`Trade ${trade.id} for ${trade.inAmount} on ${trade.createdAt}`);
      }
    } else {
      console.log('No trades found');
    }

    console.log('Get quote for €10.00 worth of Bitcoin');
    unocoin.getBuyQuote(10 * 100, 'EUR', 'BTC').then((quote) => {
      console.log(`${quote.quoteAmount / 100000000} ${quote.quoteCurrency} expires ${quote.expiresAt}`);

      quote.getPaymentMediums().then((paymentMediums) => {
        console.log(`Bank fee: €${(paymentMediums.bank.fee / 100).toFixed(2)}`);
        prompt.get(['receive_address'], (err, result) => {
          if (err) {
            // Ignore
          }
          receiveAddress = result.receive_address;
          paymentMediums.bank.buy().then((trade) => {
            console.log(`Created trade ${trade.id}`);
          });
        });
      });
    });
  });
} else {
  unocoin = Unocoin.new(delegate);
  unocoin.partnerId = 19;
  unocoin.debug = true;
  delegate.trades = unocoin.trades;

  var walletIdentifier;
  var sharedKey;
  var email;

  console.log('Please create a Blockchain wallet with a unique email and verify your email');
  console.log('Get the wallet identifier: Blockchain.MyWallet.wallet.guid');
  console.log('Get the shared key: Blockchain.MyWallet.wallet.sharedKey');

  prompt.get(['email', 'walletIdentifier', 'sharedKey'], function (err, result) {
    if (err) {
      // Ignore
    }
    email = result.email;
    walletIdentifier = result.walletIdentifier;
    sharedKey = result.sharedKey;

    unocoin.signup('NL', 'EUR').then(() => {
      console.log('To continue the demo with this Unocoin account:');
      console.log(`OFFLINE_TOKEN=${unocoin._offlineToken} node demo.js`);
    });
  });
}
