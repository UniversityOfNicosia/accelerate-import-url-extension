// popup.js
import { debounce } from "./utils/eventUtils.js";
import {
  handleLogin,
  handleLogout,
  handleSaveUrl,
  handleEmailInput,
  handlePasswordInput, isTokenValid,
} from "./eventHandlers.js";
import { updateUILanguage } from "./utils/domUtils.js";
import { sanitizeInput } from "./utils/apiUtils.js";
import { config } from "./config.js";
import Notification from "./components/notificationComponent.js";
import EventListenerManager from "./eventListenerManager.js";

const notificationContainer = document.getElementById("notification-container");
const notification = new Notification(notificationContainer);
const eventListenerManager = new EventListenerManager();

let loginAttempts = 0;
let sessionTimeout;

// Function to get the token
function getToken(callback) {
  chrome.storage.local.get(["token"], function (result) {
    callback(result.token);
  });
}

function toogleLoginView() {

  const loginForm = document.getElementById("loginForm");
  const loggedInView = document.getElementById("loggedInView");

  isTokenValid()
    .then((isValid) => {
      if (isValid) {
        loginForm.style.display = "none";
        loggedInView.style.display = "block";
      } else {
        loginForm.style.display = "block";
        loggedInView.style.display = "none";
      }

    });
  // chrome.storage.local.get(["token"], function (result) {
  //
  //
  //   if (result.token) {
  //     loginForm.style.display = "none";
  //     loggedInView.style.display = "block";
  //   } else {
  //     loginForm.style.display = "block";
  //     loggedInView.style.display = "none";
  //   }
  // });
}

function debugUrl() {
  chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
    if (chrome.runtime.lastError) {
      reject(
        new Error(
          `Error querying tabs: ${chrome.runtime.lastError.message}`
        )
      );
    } else {
      console.log(tabs)
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup DOM loaded");
  const loginButton = document.getElementById("loginButton");
  const saveUrlButton = document.getElementById("saveUrlButton");
  const languageSelect = document.getElementById("languageSelect");
  const logoutButton = document.getElementById("logoutButton");
  const debugButton = document.getElementById("debugButton");



  toogleLoginView();

  if (
    !loginButton ||
    !saveUrlButton ||
    !languageSelect ||
    !notificationContainer
  ) {
    notification.show(
      "Initialization error [E001]: Error initializing UI elements. Please refresh the page or contact support.",
      "error"
    );
    return;
  }




  chrome.storage.local.get(["language"], (result) => {
    if (result.language) {
      languageSelect.value = result.language;
      updateUILanguage(result.language);
    }
  });

  // resetSessionTimeout();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  eventListenerManager.addEventListener(
    emailInput,
    "input",
    debounce(function () {
      handleEmailInput(this.value);
    }, 300)
  );

  eventListenerManager.addEventListener(
    passwordInput,
    "input",
    debounce(function () {
      handlePasswordInput(this.value);
    }, 300)
  );

  eventListenerManager.addEventListener(debugButton, "click", function(){
    debugUrl()
  })

  eventListenerManager.addEventListener(logoutButton, "click", function () {
    chrome.storage.local.remove("token", function () {
      toogleLoginView();
    });
  });

  eventListenerManager.addEventListener(loginButton, "click", async () => {
    if (loginAttempts >= config.maxLoginAttempts) {
      notification.show(
        "Login attempts error [E102]: Too many login attempts. Please wait and try again.",
        "error"
      );
      return;
    }

    loginAttempts++;
    setTimeout(() => {
      loginAttempts--;
    }, config.loginCooldownPeriod);

    await handleLogin(loginButton);
    toogleLoginView();
  });

  eventListenerManager.addEventListener(logoutButton, "click", () => {
    handleLogout(loginButton);
  });

  eventListenerManager.addEventListener(saveUrlButton, "click", async () => {
    const withImagesCheckbox = document.getElementById("withImagesCheckbox");
    const includeImages = withImagesCheckbox.checked;

    await handleSaveUrl(saveUrlButton, includeImages);
  });

  eventListenerManager.addEventListener(languageSelect, "change", () => {
    const language = sanitizeInput(languageSelect.value);
    chrome.storage.local.set({ language: language }, () => {
      updateUILanguage(language);
    });
  });

  // eventListenerManager.addEventListener(
  //   document,
  //   "mousemove",
  //   resetSessionTimeout,
  //   { passive: true }
  // );
  // eventListenerManager.addEventListener(
  //   document,
  //   "keypress",
  //   resetSessionTimeout
  // );
});

// /**
//  * Resets the session timeout, logging out the user after a period of inactivity
//  */
// function resetSessionTimeout() {
//   if (sessionTimeout) {
//     clearTimeout(sessionTimeout);
//   }
//   sessionTimeout = setTimeout(() => {
//     alert(
//       "Session timeout [E103]: Your session has expired. Please log in again to continue."
//     );
//     // Add logic to log out the user
//   }, config.sessionTimeout);
// }
