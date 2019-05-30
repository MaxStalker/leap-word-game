const got = require("got");

async function requestFaucet(address, color) {
  console.log(`Requesting faucet for ${address} token ${color}`);
  const faucet =
    "https://dlsb7da2r7.execute-api.eu-west-1.amazonaws.com/staging/address";
  try {
    const response = await got(faucet, {
      method: "POST",
      json: true,
      body: {
        address,
        color
      }
    });
    const { body } = response;
    console.log(body);
    return body;
  } catch (error) {
    console.log(error.body.errorMessage);
    return false;
  }
}

module.exports = requestFaucet;
