import Web3 from "web3";
import * as leapCore from "leap-core";
import * as ethers from "ethers";
import RPC from "../../universal/rpc";
import { TOKEN_ADDRESS, RPC_URL } from "../../universal/config";
import {
  showStep,
  turn,
  clearGameField,
  setGameField,
  hideGameField,
  showGameField,
  activateWallet,
  fetchPost
} from "./utility";
import { GAME_SERVER } from "./const";
import wallet from "./wallet";
import { erc20Abi, wordGameAbi } from "./abis";

const { helpers, Tx } = leapCore;

// Create instance of RPC client
//const plasma = helpers.extendWeb3(new Web3(RPC_URL));
const plasma = new ethers.providers.JsonRpcProvider(RPC_URL);
const rpcClient = new RPC({ erc20Abi, leapCore, plasma, ethers });
const plasmaExtended = helpers.extendWeb3(new Web3(RPC_URL));

const {
  getBalance,
  getTokenColor,
  getTokenContract,
  tokenBalanceChange,
  getUnspentOutputs,
  makeTransferWeb3,
  sendRaw,
  getReceipt
} = rpcClient;
const balanceOf = getBalance(TOKEN_ADDRESS);

const fundRound = async ({ wallet, account, round }) => {
  const { roundAddress } = round;
  const roundBet = 100000000;
  const color = await getTokenColor(TOKEN_ADDRESS);
  const utxos = await plasmaExtended.getUnspent(account);
  const inputs = helpers.calcInputs(utxos, account, roundBet, color);
  const outputs = helpers.calcOutputs(
    utxos,
    inputs,
    account,
    roundAddress,
    roundBet,
    color
  );
  const playerTransaction = Tx.transfer(inputs, outputs);
  const signedTransaction = await playerTransaction.signWeb3(wallet);
  return await plasmaExtended.eth.sendSignedTransaction(signedTransaction.hex());
};

const main = async () => {
  console.log("Start Application");

  const allStepsDOM = document.querySelectorAll(".step");
  const allSteps = [].slice.call(allStepsDOM);

  const buttonsDOM = document.querySelectorAll("button");
  const buttons = [].slice.call(buttonsDOM);

  const tokenContract = await getTokenContract(TOKEN_ADDRESS);

  let account = null;

  // Reset view to initial
  showStep("intro");

  buttons.forEach(button => {
    button.addEventListener("click", async () => {
      const parent = button.parentElement;
      const currentStep = parent.dataset.step;
      const progress = parent.querySelector(".progress");

      switch (currentStep) {
        case "intro": {
          showStep("connect-wallet");
          break;
        }

        case "connect-wallet": {
          turn("off", button);
          turn("on", progress);
          const accounts = await activateWallet();
          turn("off", progress);
          if (!accounts) {
            turn("on", button);
          } else {
            account = accounts[0]; // take first account
            console.log(account);
            showStep("game-rules");
          }
          break;
        }

        case "game-rules": {
          showStep("game-round");
          break;
        }

        // This one is the biggest thing, be brave :)
        case "game-round": {
          turn("off", button);
          turn("on", progress);
          clearGameField();

          const endpoint = GAME_SERVER + "/startRound";
          const round = await fetchPost(endpoint, { playerAddress: account });
          const { words, roundAddress } = round;

          setGameField(words);
          showGameField();
          turn("off", progress);

          const wordsButtonsDOM = document.querySelectorAll(".word-toast");
          const wordsButtons = [].slice.call(wordsButtonsDOM);
          console.log(wordsButtons.length);
          wordsButtons.forEach(wordButton => {
            wordButton.addEventListener("click", async () => {
              const tokenContract = getTokenContract(TOKEN_ADDRESS);
              const selectedWord = wordButton.innerHTML;
              const progress = parent.querySelector(".progress");
              hideGameField();
              turn("on", progress);
              const roundBalance = (await balanceOf(roundAddress)).toString();
              console.log("Round Balance:", roundBalance);
              const paymentOptions = { wallet, account, round };
              const fundHash = await fundRound(paymentOptions);
              const newRoundBalance = await tokenBalanceChange(
                {
                  contract: tokenContract,
                  address: roundAddress,
                  prevBalance: roundBalance
                }
              );
              console.log("New Round Balance:", newRoundBalance);

              console.log("Requesting round result for ", roundAddress);
              const endpoint = GAME_SERVER + "/finishRound";
              const status = await fetchPost(endpoint, {
                playerAddress: account,
                word: selectedWord
              });

              const balanceChanged = await tokenBalanceChange({
                address: roundAddress,
                contract: tokenContract
              });

              console.log("Round added to the chain!");
              console.log(status.receiptHash);
              const receipt = await getReceipt(status.receiptHash);
              console.log(receipt);

              if (receipt.to.toLowerCase() === account.toLowerCase()){
                showStep("win");
              } else{
                showStep("lose");
              }

              // Reset frame
              turn('off', progress);
              turn('on', button);
            });
          });
          break;
        }


        case "win":
        case "lose":
          showStep("game-round");
          break;

        default: {
          return;
        }
      }
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  main();
});
