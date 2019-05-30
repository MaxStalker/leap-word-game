import Web3 from "web3";
const wallet = window.ethereum ? new Web3(window.ethereum) : null;

export default wallet;
