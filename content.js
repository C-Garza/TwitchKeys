let chatWindow = document.querySelector("[data-a-target='chat-scroller'");
let chatInput = document.querySelector("[data-a-target='chat-input'");
let chatSendButton = document.querySelector("[data-a-target='chat-send-button']");
let chatLeaderBoard = document.querySelector("[data-test-selector='channel-leaderboard-container']");
let twitchKeysButton = document.createElement("button");
let keysMap = {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "0": "10"
};


// HYDRATE MENU WITH VALUES
const getInitValues = (inputs) => {
  for(let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    chrome.storage.sync.get([input.name], (value) => {
      let userValue = value[input.name];
      if(!userValue) {
        input.value = "";
        return;
      }
      input.value = userValue;
    });
  }
};

// TRIGGER HEADER MESSAGE
const triggerHeaderMessage = (headerMessage, headerTimeout, msg) => {
  if(headerMessage.classList.contains("tkextension__header__message--active")) headerMessage.classList.remove("tkextension__header__message--active");
  window.clearTimeout(headerTimeout);
  headerMessage.offsetHeight;
  headerMessage.textContent = msg;
  headerMessage.classList.add("tkextension__header__message--active");
  headerTimeout = window.setTimeout(() => {headerMessage.classList.remove("tkextension__header__message--active")}, 2000);
};

// ADD TWITCHKEYS BUTTON TO DOM
const addTwitchKeysButton = () => {
  twitchKeysButton.classList.add("tw-core-button", "tw-button-icon", "tkextension__twitch-keys-button");
  twitchKeysButton.title = "TwitchKeys Menu";
  chatSendButton.parentNode.insertBefore(twitchKeysButton, chatSendButton.parentNode.firstChild);
};

// GET SAVED KEY VALUE IN STORAGE
const getKeyValue = (key) => {
  return new Promise((res, rej) => {
    try {
      chrome.storage.sync.get(`key${key}`, (value) => {
        if(value[`key${key}`] === undefined) res("");
        res(value[`key${key}`]);
      });
    }
    catch (err) {
      rej(err);
    }
  });
};

// ADD KEY VALUE TO CHAT INPUT
const addHotKeyValue = (emote) => {
  chatInput.value += emote + " ";
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));
  return;
};

// CHECK IF CTRL IS HELD DOWN
const handleChatKeyDown = (e) => {
  if(e.ctrlKey && keysMap[e.key]) {
    e.preventDefault();
    isOn = true;
  }
};

// CHECK IF HOTKEY IS PRESSED
const handleChatKeyUp = async (e) => {
  let value = "";
  if(!e.ctrlKey) return;
  if(isOn && keysMap[e.key]) {
    value = await getKeyValue(keysMap[e.key]);
    if(!value.length) return;
    addHotKeyValue(value);
  }
};

// DETECT DOM ADDING/REMOVAL AND RESELECT DOM ELEMENTS (Site is an SPA)
const observer = new window.MutationObserver(function(mutations_list) {
  for(const {addedNodes, removedNodes} of mutations_list) {
    // REMOVE UNNECESSARY MUTATIONS
    if (!addedNodes || !removedNodes || (addedNodes.length === 0 && removedNodes.length === 0)) {
      continue;
    }

    // CHECK REMOVED NODES AND REMOVE LISTENERS
    for(const node of removedNodes) {
      if(node.nodeType !== Node.ELEMENT_NODE) continue;
      if(node.childElementCount === 0) continue;

      for(const childNode of node.querySelectorAll("[id],[class]")) {
        if(childNode.getAttribute("data-test-selector") === "chat-input-buttons-container") {
          chatInput.removeEventListener("keydown", handleChatKeyDown);
          chatInput.removeEventListener("keyup", handleChatKeyUp);
        }
      }
    }

    // CHECK ADDED NODES AND RESELECT DOM ELEMENTS
    for(const node of addedNodes) {
      if(node.nodeType !== Node.ELEMENT_NODE) continue;
      if(node.childElementCount === 0) continue;

      for(const childNode of node.querySelectorAll("[id],[class]")) {
        if(childNode.getAttribute("data-test-selector") === "chat-input-buttons-container") {
          chatInput = document.querySelector("[data-a-target='chat-input'");
          chatSendButton = document.querySelector("[data-a-target='chat-send-button']");
          chatWindow = document.querySelector("[data-a-target='chat-scroller'");
          chatLeaderBoard = document.querySelector("[data-test-selector='channel-leaderboard-container']");
      
          chatInput.addEventListener("keydown", handleChatKeyDown);
          chatInput.addEventListener("keyup", handleChatKeyUp);
      
          addTwitchKeysButton();
        }
      }
    }
  }
});

// TWITCHKEYS HOTKEYS LOGIC
addTwitchKeysButton();

chatInput.addEventListener("keydown", handleChatKeyDown);
chatInput.addEventListener("keyup", handleChatKeyUp);

observer.observe(document.getElementById("root"), { childList: true, subtree: true });

// INJECT HTML AND JS INTO PAGE
fetch(chrome.runtime.getURL("/content.html")).then(res => {
  return res.text();
}).then(html => {
  document.body.insertAdjacentHTML('beforeend', html);

  // INSERT TWITCHKEYS BUTTON
  let container = document.querySelector(".tkextension__container");
  let twitchKeysButton = document.querySelector(".tkextension__twitch-keys-button");

  // SELECTED ELEMENTS
  let form = document.getElementById("tkextension__keys-form");
  let inputs = document.querySelectorAll("#tkextension__keys-form .tkextension__input");
  let formButtonsContainer = document.querySelector(".tkextension__form__buttons");
  let saveButton = document.getElementById("tkextension__hotkeys__save");
  let clearButton = document.getElementById("tkextension__hotkeys__clear--all");
  let formButtonsMessage = document.querySelector(".tkextension__form__buttons__confirm");
  let headerMessage = document.querySelector(".tkextension__header__message");
  let headerTimeout = null;
  
  // ADJUST TWITCHKEYS MENU SIZE DEPENDING ON CHAT SIZE
  const setContainerSize = () => {
    chatLeaderBoard = document.querySelector("[data-test-selector='channel-leaderboard-container']");
    if(chatLeaderBoard !== null) {
      container.style.top = `calc(100px + ${chatLeaderBoard.getBoundingClientRect().height}px)`;
    }
    else {
      container.style.top = `100px`;
    }
    container.style.width = `calc(${chatWindow.getBoundingClientRect().width}px - 4px)`;
    container.style.height = `${chatWindow.getBoundingClientRect().height}px`;
  };

  // CHECK IF ELEMENT IS VISIBLE
  const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );

  // TOGGLE CLEAR BUTTON PROMPT BUTTONS
  const clearButtonConfirmationMessage = () => {
    saveButton.classList.toggle("tkextension__hidden");
    clearButton.classList.toggle("tkextension__hidden");
    formButtonsMessage.classList.toggle("tkextension__hidden");
  };

  // TWITCHKEYS POPUP MENU LOGIC
  getInitValues(inputs);
  setContainerSize();

  // RESIZE TWITCHKEYS MENU ON RESIZE
  window.addEventListener("resize", (e) => {
    setContainerSize();
  });

  // CLOSE ON OUTSIDE CLICK
  window.addEventListener("click", e => {
    let target = e.target;
    if(!container.contains(target) && isVisible(container)) {
      container.classList.toggle("tkextension__container--visible");
    }
  });
  
  // HANDLE TWITCHKEYS BUTTON CLICK
  twitchKeysButton.addEventListener("click", (e) => {
    e.stopPropagation();
    setContainerSize();
    container.classList.toggle("tkextension__container--visible");
  });
  
  // HANDLE WHEN ENTER KEY IS PRESSED ON INPUT
  form.addEventListener("keyup", (e) => {
    if(e.key === "Enter") saveButton.click();
  });

  // HANDLE BUTTON CLICKS IN TWITCHKEYS MENU
  formButtonsContainer.addEventListener("click", e => {
    let input = "";
    let target = e.target;
    if(target.closest("button")) {
      // IF SAVE BUTTON
      if(target.id === "tkextension__hotkeys__save") {
        for(let i = 0; i < inputs.length; i++) {
          input = inputs[i];
          chrome.storage.sync.set({[input.name]: input.value});
        }
        triggerHeaderMessage(headerMessage, headerTimeout, "Saved!");
      }
      // IF CLEAR BUTTON
      else if(target.id === "tkextension__hotkeys__clear--all") {
        clearButtonConfirmationMessage();
      }
      // IF CLEAR CANCEL BUTTON
      else if(target.id === "tkextension__hotkeys__clear--cancel") {
        clearButtonConfirmationMessage();
      }
      // IF CLEAR CONFIRM BUTTON
      else if(target.id === "tkextension__hotkeys__clear--confirm") {
        chrome.storage.sync.clear(() => {
          getInitValues(inputs);
          clearButtonConfirmationMessage();
          triggerHeaderMessage(headerMessage, headerTimeout, "Cleared!");
        });
      }
    }
  });
});