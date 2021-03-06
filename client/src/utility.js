export const selectActiveStep = () => {
  return document.querySelector(".step--active");
};

export const selectStep = step => {
  return document.querySelector(`.step[data-step="${step}"]`);
};

export const showStep = activeStep => {
  selectActiveStep().classList.remove("step--active");
  selectStep(activeStep).classList.add("step--active");
};

const renderWord = word => `<button class="word-toast">${word}</button>`;
const renderWordSet = words =>
  words.reduce((acc, word) => acc + renderWord(word), "");

export const hideGameField = () => {
  document.querySelector(".game-field").style.display = "none";
};

export const showGameField = () => {
  document.querySelector(".game-field").style.display = "block";
};

//export const gameField = document.querySelector(".game-field");
export const clearGameField = () => {
  document.querySelector(".game-field").innerHTML = "";
};

export const setGameField = words =>
  (document.querySelector(".game-field").innerHTML = renderWordSet(words));

export const turn = (state, node) => {
  if (state === "on") {
    node.style.display = "block";
  } else {
    node.style.display = "none";
  }
};

export const activateWallet = async () => {
  // Let's assume that Metamask is installed and "ethereum" field
  // is exposed on "window" object
  const { ethereum } = window;
  return await ethereum.enable();
};

export const fetchPost = async (endpoint, payload) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const transport = {
    method: "POST",
    mode: "cors",
    cache: "default",
    headers,
    body: JSON.stringify(payload)
  };
  return await fetch(endpoint, transport).then(async response => {
    return await response.json().then(json => json);
  });
};
