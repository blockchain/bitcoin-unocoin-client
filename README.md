# Bitcoin Unocoin Javascript Client [![Build Status](https://travis-ci.org/blockchain/bitcoin-unocoin-client.png?branch=master)](https://travis-ci.org/blockchain/bitcoin-unocoin-client) [![Coverage Status](https://coveralls.io/repos/blockchain/bitcoin-unocoin-client/badge.svg?branch=master&service=github)](https://coveralls.io/github/blockchain/bitcoin-unocoin-client?branch=master)

This is used by [My-Wallet-V3](https://github.com/blockchain/My-Wallet-V3/).

## Install

`npm install bitcoin-unocoin-client --save`

## Usage

Three things are needed:

1. `delegate` object (see [example](https://github.com/blockchain/My-Wallet-V3/blob/master/src/exchange-delegate.js)) with functions that provide the following:
 * save() -> e.g. `function () { return JSON.stringify(this._unocoin);` }
 * `email()` -> String : the users email address
 * `isEmailVerified()` -> Boolean : whether the users email is verified
 * `getToken()` -> stringify : JSON web token {email: 'me@example.com'}
 * `monitorAddress(address, callback)` : `callback(amount)` if btc received
 * `checkAddress(address)` : look for existing transaction at address
 * `getReceiveAddress(trade)` : return the trades receive address
 * `reserveReceiveAddress()`
 * `releaseReceiveAddress()`
 * `serializeExtraFields(obj, trade)` : e.g. `obj.account_index = ...`
 * `deserializeExtraFields(obj, trade)`

2. Unocoin partner identifier

```js
var object = {user: 1, offline_token: 'token'};
var unocoin = new Unocoin(object, delegate);
unocoin.partnerId = ...;
unocoin.delegate.save.bind(unocoin.delegate)();
delegate.trades = unocoin.trades
// "{"user":1,"offline_token":"token"}"
```

To see a demo switch to Node 7.2 or higher and run:

```sh
nvm use 7.2
node demo.js
```

## Development

### Modifying bitcoin-exchange-client

To use a local version of bitcoin-exchange-client, create a symlink:

```sh
cd ..
rm -rf bitcoin-unocoin-client/node_modules/bitcoin-exchange-client
ln -s ../../bitcoin-exchange-client bitcoin-unocoin-client/node_modules/bitcoin-exchange-client
```

### Testing inside my-wallet-v3

To use a local version of this repo inside my-wallet-v3, create a symlink:

```sh
cd ..
rm -rf My-Wallet-V3/node_modules/bitcoin-unocoin-client
ln -s ../../bitcoin-unocoin-client My-Wallet-V3/node_modules/bitcoin-unocoin-client
```

Note that Grunt won't detect these changes.

## Release

Change version in `package.json`.

```sh
git commit -a -m "v0.1.0"
git push
git tag -s v0.1.0
git push --tags
make changelog
```

Add the relevant sections of Changelog.md to the tag on Github and mark it as pre-release.

```sh
npm publish
```
