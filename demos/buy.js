var Unocoin = require('../src/unocoin');
var delegate = require('./helpers/delegate');

var prompt = require('prompt');

console.log('Bitcoin Unocoin Client Demo - Buy');

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

console.log('Get quote for ₹1000 worth of Bitcoin');
unocoin.getBuyQuote(1000, 'INR', 'BTC').then((quote) => {
  console.log(`${-quote.quoteAmount / 100000000} ${quote.quoteCurrency} expires ${quote.expiresAt}`);

  quote.getPaymentMediums().then((paymentMediums) => {
    console.log(`Bank fee: €${(paymentMediums.bank.fee).toFixed(2)}`);
    prompt.get(['receive_address'], (err, result) => {
      if (err) {
        // Ignore
      }
      delegate.demo.setReceiveAddress(result.receive_address);
      paymentMediums.bank.buy().then((trade) => {
        console.log(`Created trade ${trade.id}`);
        // Add reference number after user made payment:
        trade.addReferenceNumber('2017-04').then(res => {
          console.log('Added reference number to trade');
        });
      });
    });
  });
});
