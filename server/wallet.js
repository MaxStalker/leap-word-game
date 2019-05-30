const ethers = require('ethers');
const { WALLET_MNEMONIC } = require('./config');

const wallet = new ethers.Wallet.fromMnemonic(WALLET_MNEMONIC);

module.exports = wallet;
