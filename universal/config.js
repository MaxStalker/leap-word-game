//const RPC_URL = "https://testnet-node1.leapdao.org"; // Testnet RPC
//const TOKEN_ADDRESS = "0xD2D0F8a6ADfF16C2098101087f9548465EC96C98"; // Testnet LEAP

const RPC_URL = "https://staging-testnet.leapdao.org/rpc"; // Staging RPC
const TOKEN_ADDRESS = "0x0666eBbF26CDE07EA79FeCAe15e5f18394EBC149"; // Staging LEAP

// RPC Calls
const GET_COLOR = "plasma_getColor";
const GET_UNSPENT = "plasma_unspent";
const RAW_TX = "eth_sendRawTransaction";
const GET_TX = "eth_getTransactionByHash";
const GET_RECEIPT = "eth_getTransactionReceipt";
const CHECK_CONDITION = "checkSpendingCondition";

module.exports = {
  RPC_URL,
  TOKEN_ADDRESS,
  rpcMessages: {
    GET_COLOR,
    GET_UNSPENT,
    RAW_TX,
    GET_TX,
    GET_RECEIPT,
    CHECK_CONDITION
  }
};
