const ethers = require('ethers');
const leapCore = require('leap-core');
const RPC = require('../universal/rpc');
const { RPC_URL, TOKEN_ADDRESS } = require('../universal/config');

// Load ERC20 interface
let IERC20;
try {
  IERC20 = require("./build/contracts/IERC20");
} catch (e) {
  console.error(`Please run "truffle compile" first`);
  return;
}
const erc20Abi = IERC20.abi;

const plasma = new ethers.providers.JsonRpcProvider(RPC_URL);
const rpcClient = new RPC({ plasma, erc20Abi, ethers, leapCore});

module.exports = rpcClient;
