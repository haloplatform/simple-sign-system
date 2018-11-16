[![npm scoped](https://img.shields.io/npm/v/@haloplatform/simple-sign-system.svg?style=for-the-badge)](https://www.npmjs.com/package/@haloplatform/simple-sign-system)

# simple-sign-system
This allows the signing of a transaction and data via a simple npm module. Also allows recovery of signed data. Requires web3 1.x.


REQUIREMENT = Web3js 1.x. Does not work with Web3 0.x.x!!!

## Usage

Install:

- npm `npm install @haloplatform/simple-sign-system`
- yarn `yarn add @haloplatform/simple-sign-system`


Import & Use:

```
const sss = require('@haloplatform/simple-sign-system);
const sss = new SimpleSignSystem();

sss.signTx(tx, privateKey, web3).then((tx) => {
    console.log(tx.serialized);
});

sss.signAndSend(tx, privateKey, web3, true).then((result) => {
    console.log(result.transactionHash);
});
```


## Some Docs


Available functions:

- `signTx`: signs a transaction to use via web3.sendSignedTransaction
- `signAndSend`: signs a transaction an uses passed web3 to send it. (web3 must already be setup with account info and provider);
- `send`: sends a signed transaction.
- `signData`: signs data the same as our feather client and extension.
- `recoverData`: recovers data signed by this system or our feather client / extension.


This is experimental code, use at your own risk.