// apiUtils.js
import { throttle } from "./eventUtils.js";
/**
 * Sends a message to the background script and returns the response
 * @param {Object} message - The message to send
 * @returns {Promise} - The promise resolving to the response from background script
 */
export async function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response));
  });
}

/**
 * Sends a throttled message to the background script
 * @param {Object} message - The message to send
 * @returns {Promise} - The promise resolving to the response from background script
 */
export async function throttledSendMessage(message) {
  return throttle(async () => {
    return await sendMessage(message);
  }, 3000)();
}

export function showLoadingIndicator(button, loadingText = "Loading...") {
  button.dataset.originalText = button.innerText;
  button.disabled = true;
  button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
}

export function hideLoadingIndicator(button) {
  button.disabled = false;
  button.innerText = button.dataset.originalText || "Button";
}

export function sanitizeInput(input) {
  const element = document.createElement("div");
  element.innerText = input;
  return element.innerHTML
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
