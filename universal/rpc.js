const { rpcMessages } = require("./config");
const {
  GET_COLOR,
  GET_TX,
  GET_UNSPENT,
  RAW_TX,
  CHECK_CONDITION,
  GET_RECEIPT
} = rpcMessages;

class RPC {
  constructor({ erc20Abi, leapCore, ethers, plasma }) {
    // Dependency injection
    this.ethers = ethers;
    this.erc20Abi = erc20Abi;
    this.leapCore = leapCore;

    // Plasma
    this.plasma = plasma;

    // Caches for colors and contracts
    this.colors = {};
    this.contracts = {};

    // Bind methods to instance
    this.checkCondition = this.checkCondition.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.getReceipt = this.getReceipt.bind(this);
    this.getTokenColor = this.getTokenColor.bind(this);
    this.getTokenContract = this.getTokenContract.bind(this);
    this.getTransaction = this.getTransaction.bind(this);
    this.getUnspentOutputs = this.getUnspentOutputs.bind(this);
    this.makeTransfer = this.makeTransfer.bind(this);
    this.sendRaw = this.sendRaw.bind(this);
    this.tokenBalanceChange = this.tokenBalanceChange.bind(this);
  }

  async getTokenColor(tokenAddress) {
    const { plasma } = this;
    const storedColor = this.colors[tokenAddress];
    if (storedColor) {
      return storedColor;
    }
    const tokenColor = parseInt(
      await plasma.send(GET_COLOR, [tokenAddress], 16)
    );
    this.colors[tokenAddress] = tokenColor;
    return tokenColor;
  }
  getTokenContract(tokenAddress) {
    const { ethers, erc20Abi, plasma } = this;
    const storedContract = this.contracts[tokenAddress];
    if (storedContract) {
      return storedContract;
    }
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, plasma);
    this.contracts[tokenAddress] = tokenContract;
    return tokenContract;
  }
  getBalance(tokenAddress) {
    const { plasma } = this;
    const { getTokenContract } = this;
    return async function(address) {
      const contract = getTokenContract(tokenAddress, plasma);
      return await contract.balanceOf(address);
    };
  }
  async getTransaction(txHash) {
    return this.plasma.send(GET_TX, [txHash]);
  }
  async getUnspentOutputs(from, color) {
    const { plasma, leapCore } = this;
    const { Output, Outpoint } = leapCore;
    const raw = await plasma.send(GET_UNSPENT, [from, color]);
    return raw.map(utxo => ({
      output: Output.fromJSON(utxo.output),
      outpoint: Outpoint.fromRaw(utxo.outpoint) // TODO check if we can use JSON
    }));
  }
  async makeTransfer(options) {
    const { plasma, leapCore } = this;
    const { getUnspentOutputs } = this;
    const { Tx } = leapCore;
    const { from, to, color, amount, privateKey } = options;
    const utxos = await getUnspentOutputs(from, color, plasma);
    const rawTx = Tx.transferFromUtxos(utxos, from, to, amount, color)
      .signAll(privateKey)
      .hex();
    try {
      return await plasma.send(RAW_TX, [rawTx]);
    } catch (e) {
      console.log("Error during send");
      console.log(e.message);
    }
  }
  async tokenBalanceChange(options) {
    const {
      contract,
      address,
      prevBalance,
      showProgress = true,
      maxTries = 15
    } = options;

    let currentBalance;
    let tempBalance;

    if (prevBalance) {
      tempBalance = prevBalance.toString();
      currentBalance = prevBalance;
    } else {
      tempBalance = (await contract.balanceOf(address)).toString();
      currentBalance = tempBalance;
    }

    let i = 0;
    do {
      i++;
      await new Promise(resolve => setInterval(resolve, 1000));
      currentBalance = (await contract.balanceOf(address)).toString();
      if (showProgress) {
        if (process && process.stdout) {
          process.stdout.write(
            `\r   🕐 Waiting for balance change. Seconds passed: ${i}`
          );
        } else {
          console.log(`🕐 Waiting for balance change. Seconds passed: ${i}`);
        }
      }
    } while (currentBalance === tempBalance && i < maxTries);

    const formattedBalance = currentBalance.toString();
    showProgress && console.log(`\n   ✅ Balance changed: ${formattedBalance}`);

    return currentBalance;
  }
  async checkCondition(condition) {
    const { plasma } = this;
    return await plasma.send(CHECK_CONDITION, [condition.hex()]);
  }
  async sendRaw(tx) {
    const { plasma } = this;
    return await plasma.send(RAW_TX, [tx.hex()]);
  }
  async getReceipt(hash) {
    const { plasma } = this;
    return await plasma.send(GET_RECEIPT, [hash]);
  }
}

module.exports = RPC;
