let headerContainer = document.querySelector(".header__container");
let headerMessage = document.querySelector(".header__message");
let form = document.querySelector("#keys-form");
let inputs = document.querySelectorAll("#keys-form .input");
let formButtonsContainer = document.querySelector(".form__buttons");
let saveButton = document.getElementById("hotkeys__save");
let clearButton = document.getElementById("hotkeys__clear--all");
let formButtonsMessage = document.querySelector(".form__buttons__confirm");
let headerTimeout = null;

// TRIGGER HEADER MESSAGE
const triggerHeaderMessage = (msg) => {
  if(headerMessage.classList.contains("header__message--active")) headerMessage.classList.remove("header__message--active");
  window.clearTimeout(headerTimeout);
  saveButton.offsetHeight;
  headerMessage.textContent = msg;
  headerMessage.classList.add("header__message--active");
  headerTimeout = window.setTimeout(() => {headerMessage.classList.remove("header__message--active")}, 2000);
};

// HYDRATE MENU WITH VALUES
const getInitValues = () => {
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

// TOGGLE CLEAR BUTTON PROMPT BUTTONS
const clearButtonConfirmationMessage = () => {
  saveButton.classList.toggle("hidden");
  clearButton.classList.toggle("hidden");
  formButtonsMessage.classList.toggle("hidden");
};

// HANDLE WHEN ENTER KEY IS PRESSED ON INPUT
form.addEventListener("keyup", (e) => {
  if(e.key === "Enter") saveButton.click();
});

// HANDLE BUTTON CLICKS IN TWITCHKEYS MENU
formButtonsContainer.addEventListener("click", e => {
  let input = "";
  let target = e.target;
  if(target.closest("button")) {
    if(target.id === "hotkeys__save") {
      for(let i = 0; i < inputs.length; i++) {
        input = inputs[i];
        chrome.storage.sync.set({[input.name]: input.value});
      }
      triggerHeaderMessage("Saved!");
    }
    else if(target.id === "hotkeys__clear--all") {
      clearButtonConfirmationMessage();
    }
    else if(target.id === "hotkeys__clear--cancel") {
      clearButtonConfirmationMessage();
    }
    else if(target.id === "hotkeys__clear--confirm") {
      chrome.storage.sync.clear(() => {
        getInitValues();
        clearButtonConfirmationMessage();
        triggerHeaderMessage("Cleared!");
      });
    }
  }
});

getInitValues();