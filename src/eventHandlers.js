// eventHandlers.js
import {
  showLoadingIndicator,
  hideLoadingIndicator,
  sanitizeInput,
  throttledSendMessage as sendMessage,
} from "./utils/apiUtils.js";
import { setInputError, clearInputError } from "./utils/domUtils.js";
import { validateEmail } from "./utils/validationUtils.js";
import { config } from "./config.js";
import Notification from "./components/notificationComponent.js";

const notificationContainer = document.getElementById("notification-container");
const notification = new Notification(notificationContainer);

let loginAttempts = 0;


export function handleLogout() {
  chrome.storage.local.remove("token", function () {
    if (chrome.runtime.lastError) {
      console.error("Error removing auth token:", chrome.runtime.lastError);
    } else {
      console.log("Auth token removed");
    }
  });
}


export async function isTokenValid(){

  const response = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "check_token"
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject({
            type: "network",
            message: chrome.runtime.lastError.message,
          });
        } else {
          resolve(response);
        }
      }
    );
  });

  return response.isTokenValid;

}

/**
 * Handles the login process
 * @param {HTMLElement} button - The login button element
 */
export async function handleLogin(button) {
  console.log("Handing login");
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  if (!validateEmail(email.value)) {
    setInputError(
      email,
      "Email error [E301]: Invalid format. Enter a valid email such as user@example.com.",
      notificationContainer
    );
    return;
  } else {
    clearInputError(email);
  }

  if (!password.value) {
    setInputError(
      password,
      "Password error [E302]: Password cannot be empty. Please enter your password.",
      notificationContainer
    );
    return;
  } else {
    clearInputError(password);
  }

  showLoadingIndicator(button, "Logging in...");

  try {
    const sanitizedEmail = sanitizeInput(email.value);
    const sanitizedPassword = sanitizeInput(password.value);

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "login",
          credentials: { email: sanitizedEmail, password: sanitizedPassword },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject({
              type: "network",
              message: chrome.runtime.lastError.message,
            });
          } else {
            resolve(response);
          }
        }
      );
    });

    notification.show(
      response.success ? "Log in successfully" : "Error logging in",
      response.success ? "success" : "error"
    );
  } catch (error) {
    console.log("Trying to login");
    notification.show(
      `Login error [E101]: ${error.message}. Please ensure your email and password are correct. If you've forgotten your credentials, use the "Forgot Password" option. If the issue persists, contact support at support@example.com.`,
      "error"
    );
  } finally {
    hideLoadingIndicator(button);
    button.innerText = "Login";
  }
}

/**
 * Handles saving the current URL
 * @param {HTMLElement} button - The save URL button element
 */
export async function handleSaveUrl(button, withImages) {
  showLoadingIndicator(button, "Saving URL...");

  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "save_url",
          withImages,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject({
              type: "network",
              message: chrome.runtime.lastError.message,
            });
          } else {
            resolve(response);
          }
        }
      );
    });
    notification.show(response.message, response.success ? "success" : "error");
  } catch (error) {
    notification.show(
      `Save URL error [E202]: ${error.message}. Ensure the URL is correctly formatted and points to a valid resource. If the issue persists, please contact support at support@example.com.`,
      "error"
    );
  } finally {
    hideLoadingIndicator(button);
  }

  return true;
}

/**
 * Handles the email input validation on change
 * @param {string} value - The email input value
 */
export function handleEmailInput(value) {
  if (!validateEmail(value)) {
    setInputError(
      document.getElementById("email"),
      "Email error [E301]: Invalid format. Enter a valid email such as user@example.com.",
      notificationContainer
    );
  } else {
    clearInputError(document.getElementById("email"));
  }
}

/**
 * Handles the password input validation on change
 * @param {string} value - The password input value
 */
export function handlePasswordInput(value) {
  if (value === "") {
    setInputError(
      document.getElementById("password"),
      "Password error [E302]: Password cannot be empty. Please enter your password.",
      notificationContainer
    );
  } else {
    clearInputError(document.getElementById("password"));
  }
}
