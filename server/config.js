const dotenv = require("dotenv");
dotenv.config();

// Get WALLET_MNEMONI from .env file
const { WALLET_MNEMONIC } = process.env;

module.exports = {
  WALLET_MNEMONIC,
};
