// This will be used to generate sets of words for each round
const getWords = require("random-words");

// Crypto modules
const ethers = require("ethers");
const { Tx, Input, Output } = require("leap-core");
const { ripemd160 } = require("ethereumjs-util");

// Compiled artefact and masks for our WordGame contract
const wordGame = require("../build/contracts/WordGame");
const { TOKEN_ADDR, ROUND_ID, PLAYER, HOUSE, ANSWER } = require("./masks");

// Generic and RPC utility methods
const { replaceAll, sliceZero, showLog } = require("../utils/generic");
const { rpcMessages } = require("../../universal/config");
const rpcClient = require("../rpcClient");

// Get messages we need from rpcMessages
const { CHECK_CONDITION, RAW_TX } = rpcMessages;

// Method to start round
const generateNewRound = async (params) => {
  const { utils } = ethers;
  const { houseWallet, playerAddress, tokenAddress, roundBet = 100000000 } = params;
  const {
    getTokenColor,
    getTokenContract,
    makeTransfer,
    tokenBalanceChange,
    getUnspentOutputs
  } = rpcClient;

  // House params
  const houseAddress = houseWallet.address;
  const housePrivateKey = houseWallet.privateKey;

  // Token Color
  const tokenColor = await getTokenColor(tokenAddress);
  const tokenContract = await getTokenContract(tokenAddress);

  // We gonna use timestamp for a nounce
  const time = new Date().getTime().toString();
  const roundId = utils.formatBytes32String(time);
  const words = getWords({ exactly: 4, maxLength: 8 });
  const pick = Math.floor(Math.random() * 4);
  const answer = words[pick];
  const answerBytes32 = utils.formatBytes32String(answer);

  // Prepare Game
  let codeBuffer = wordGame.deployedBytecode;
  codeBuffer = replaceAll(codeBuffer, ROUND_ID, sliceZero(roundId));
  codeBuffer = replaceAll(codeBuffer, TOKEN_ADDR, sliceZero(tokenAddress));
  codeBuffer = replaceAll(codeBuffer, ANSWER, sliceZero(answerBytes32));
  codeBuffer = replaceAll(codeBuffer, PLAYER, sliceZero(playerAddress));
  codeBuffer = replaceAll(codeBuffer, HOUSE, sliceZero(houseAddress));

  const roundScript = Buffer.from(codeBuffer.replace("0x", ""), "hex");
  const roundBuffer = ripemd160(codeBuffer, false);
  const roundAddress = `0x${roundBuffer.toString("hex")}`;

  // Fund round condition
  // Please note, that currently funding transaction need to be paid in LEAP
  //const gasFee = 15000000; // set any number here we can get proper value here later
  const gasFee = 6000000;
  const gasTransaction = await makeTransfer(
    {
      privateKey: housePrivateKey,
      color: tokenColor,
      from: houseAddress,
      to: roundAddress,
      amount: gasFee
    }
  );
  const roundBalance = await tokenBalanceChange({
    contract: tokenContract,
    address: roundAddress,
    prevBalance: 0
  });

  // Let's return all the info we have about round so we can use it later
  return {
    words,
    answer,
    roundId,
    roundAddress,
    roundScript,
    roundBalance,
    codeBuffer
  };
};

const finishRound = async ( params ) => {
  const { utils } = ethers;
  const { word, houseWallet, tokenAddress, round, roundBet } = params;
  const { codeBuffer, roundId, roundAddress } = round;
  const {
    getTokenColor,
    getTokenContract,
    getBalance,
    getUnspentOutputs,
    makeTransfer,
    tokenBalanceChange,
    checkCondition,
    sendRaw
  } = rpcClient;

  // House params
  const houseAddress = houseWallet.address;
  const housePrivateKey = houseWallet.privateKey;

  // Token Color
  const tokenColor = await getTokenColor(tokenAddress);
  const tokenContract = await getTokenContract(tokenAddress);
  const roundBalance = await getBalance(tokenAddress)(roundAddress);

  const houseTransaction = await makeTransfer(
    {
      privateKey: housePrivateKey,
      color: tokenColor,
      from: houseAddress,
      to: roundAddress,
      amount: roundBet
    },
  );

  const newRoundBalance = await tokenBalanceChange({
    contract: tokenContract,
    address: roundAddress,
    prevBalance: roundBalance
  });
  console.log({
    balance: roundBalance.toString(),
    newBalance: newRoundBalance.toString()
  });

  const roundScript = Buffer.from(codeBuffer.replace("0x", ""), "hex");
  const utxos = await getUnspentOutputs(roundAddress, tokenColor);
  const inputs = [
    new Input({
      prevout: utxos[0].outpoint,
      script: roundScript
    }),
    new Input({
      prevout: utxos[1].outpoint
    }),
    new Input({
      prevout: utxos[2].outpoint
    })
  ];
  const outputs = [];
  const unlockTransaction = Tx.spendCond(inputs, outputs);

  // Add Player Answer
  const wordGameABI = new ethers.utils.Interface(wordGame.abi);
  const answerBytes32 = ethers.utils.formatBytes32String(word);
  const msgData = wordGameABI.functions.roundResult.encode([
    answerBytes32,
    roundId
  ]);
  unlockTransaction.inputs[0].setMsgData(msgData);
  unlockTransaction.signAll(housePrivateKey); // TODO: check if we need sign here at all

  const checkUnlockTransaction = await checkCondition(unlockTransaction);
  showLog(checkUnlockTransaction, "Condition Check Result");

  // If you set wrong message or mess up your contract code  you will get error
  if (!checkUnlockTransaction.outputs) {
    showLog("Spending condition code or message data is wrong", "", "***");
    process.exit(1);
  }
  for (let i = 0; i < checkUnlockTransaction.outputs.length; i++) {
    unlockTransaction.outputs[i] = new Output.fromJSON(
      checkUnlockTransaction.outputs[i]
    );
  }

  const checkUnlockingScriptNew = await checkCondition(unlockTransaction);
  showLog(checkUnlockingScriptNew, "New Check");
  const finalHash = await sendRaw(unlockTransaction);
  return { receiptHash: finalHash, roundBalance: newRoundBalance };
};

module.exports = {
  generateNewRound,
  finishRound
};
