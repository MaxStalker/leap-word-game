const wordGameAbi = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_playerAnswer",
        "type": "bytes32"
      },
      {
        "name": "_roundId",
        "type": "bytes32"
      }
    ],
    "name": "roundResult",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "cancelRound",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
export default wordGameAbi;
