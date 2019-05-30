const ethers = require('ethers');

function sliceZero(str) {
  return str.replace("0x", "").toLowerCase();
}
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, "g"), sliceZero(replace));
}
function showLog(data, title, lineCharacter = "-") {
  const LINE = "\n---------------\n".replace(/-/g, lineCharacter);
  console.log(LINE);
  if (title) {
    console.log(title.toUpperCase(), "\n");
  }
  console.log(data);
  console.log(LINE);
}

module.exports = {
  showLog,
  replaceAll,
  sliceZero
};
