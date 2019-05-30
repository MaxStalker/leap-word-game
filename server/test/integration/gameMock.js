// Import modules to interact with wallets
const ethers = require("ethers");
const { HOUSE_MNEMONIC, PLAYER_MNEMONIC } = require("./mnemonics");

// Import RPC client
const rpcClient = require("../../rpcClient");
const { TOKEN_ADDRESS } = require("../../../universal/config");

// Utility
const { showLog } = require("../../utils/generic");
const requestFaucet = require("../../utils/faucet");

// Game logic
const { generateNewRound, finishRound } = require("../../game");

async function checkBalances(balanceOf, { playerAddress, houseAddress }) {
  const initialHouseBalance = await balanceOf(houseAddress);
  const initialPlayerBalance = await balanceOf(playerAddress);
  showLog({ playerAddress, houseAddress }, "Addresses");
  showLog(
    { house: initialHouseBalance, player: initialPlayerBalance },
    "Initial Balances"
  );

  if (parseInt(initialPlayerBalance) === 0) {
    console.log("Player Balance is zero, requesting faucet...");
    const faucetResponse = await requestFaucet(playerAddress, 0);
    showLog({ faucetResponse }, "Player Faucet");
  }

  if (parseInt(initialHouseBalance) === 0) {
    console.log("House Balance is zero, requesting faucet...");
    const faucetResponse = await requestFaucet(houseAddress, 0);
    showLog({ faucetResponse }, "Player Faucet");
  }
}

async function main() {
  const { getTokenContract, getTokenColor, getBalance } = rpcClient;
  const tokenContract = await getTokenContract(TOKEN_ADDRESS);
  const tokenColor = await getTokenColor(TOKEN_ADDRESS);

  // Get carried function to check token balance
  const balanceOf = getBalance(TOKEN_ADDRESS);

  // Setup House Wallet
  const houseWallet = new ethers.Wallet.fromMnemonic(HOUSE_MNEMONIC);
  const houseAddress = houseWallet.address;
  const housePrivateKey = houseWallet.privateKey;

  // Setup Player Wallet
  const playerWallet = new ethers.Wallet.fromMnemonic(PLAYER_MNEMONIC);
  const playerAddress = playerWallet.address;
  const playerPrivateKey = playerWallet.privateKey;

  await checkBalances(balanceOf, { playerAddress, houseAddress });

  const roundBet = 100000000;
  const round = await generateNewRound({
    houseWallet,
    playerAddress,
    roundBet,
    tokenAddress: TOKEN_ADDRESS
  });
  const { roundScript, codeBuffer, ...roundData } = round;
  const { answer, roundId, roundAddress, roundBalance } = roundData;
  showLog(roundData, "Round generated");

  const { makeTransfer, tokenBalanceChange } = rpcClient;
  const playerTransfer = await makeTransfer({
    from: playerAddress,
    to: roundAddress,
    color: tokenColor,
    amount: roundBet,
    privateKey: playerPrivateKey
  });

  const roundBalanceAfterPlayer = await tokenBalanceChange({
    contract: tokenContract,
    address: roundAddress
  });

  showLog(
    {
      roundBalance,
      roundBalanceAfterPlayer
    },
    "Round Balance Change"
  );

  const roundEnd = await finishRound({
    word: answer,
    houseWallet,
    tokenAddress: TOKEN_ADDRESS,
    round,
    roundBet
  });

  showLog({ roundEnd }, "Receipt");

  // Let's wait for tokenBalance change before we fetch receipt
  const newBalance = await tokenBalanceChange({
    contract: tokenContract,
    address: roundAddress
  });

  const { getReceipt } = rpcClient;
  const { receiptHash } = roundEnd;
  const receipt = await getReceipt(receiptHash);
  const roundWinner =
    receipt.to.toLowerCase() === playerAddress.toLowerCase()
      ? "Player"
      : "House";
  console.log(`Winner is ${roundWinner}`);
  process.exit(0);
}

main();
