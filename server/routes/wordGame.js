const express = require("express");
const router = express.Router();

const { TOKEN_ADDRESS } = require("../../universal/config");
const rpcClient = require("../rpcClient");
const wallet = require("../wallet");

const { generateNewRound, finishRound } = require("../game");

// For the sake of simplicity we will store active rounds inside memory
// Please not that all data will be wiped out, when server is restarted.
// Don't hesitate to update this to DB solution - Redis, for example
const rounds = {};

// We will hardcode round bet size, but it can be easily added to a list
// of params we get from POST request
const ROUND_BET = 100000000;

// Endpoint to start round
router.post("/startRound", async (req, res) => {
  const { playerAddress } = req.body;
  const params = {
    houseWallet: wallet,
    playerAddress,
    tokenAddress: TOKEN_ADDRESS,
    roundBet: ROUND_BET
  };

  let round;
  try {
    round = await generateNewRound(params);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }

  // Store round in memory
  rounds[playerAddress] = round;

  // Send result back to client
  const { roundAddress, words } = round;
  res.status(200).send({ roundAddress, words });
});

// Endpoint to finish round
router.post("/finishRound", async (req, res) => {
  const { playerAddress } = req.body;
  const round = rounds[playerAddress];
  if (!round) {
    res.status(500).send({ message: "Round does not exist" });
    return ;
  }

  console.log(round);
  const { word } = req.body;
  const params = {
    word,
    round,
    houseWallet: wallet,
    roundBet: ROUND_BET,
    tokenAddress: TOKEN_ADDRESS
  };
  const roundStatus = await finishRound(params);
  console.log(roundStatus);
  res.status(200).send(roundStatus);
});

module.exports = router
