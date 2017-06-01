var Unocoin = require('../src/unocoin');
var delegate = require('./helpers/delegate');

console.log('Bitcoin Unocoin Client Demo - Trades');

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

console.log('Fetching previous trades');
unocoin.getTrades().then((trades) => {
  if (trades.length > 0) {
    for (let trade of trades) {
      console.log(`Trade ${trade.id} for ${trade.inAmount} on ${trade.createdAt}: ${trade.state}`);
    }
  } else {
    console.log('No trades found');
  }
});
