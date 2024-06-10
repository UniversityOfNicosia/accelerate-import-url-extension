// domUtils.js

/**
 * Sets an input error message and focuses the input element
 * @param {HTMLElement} input - The input element to set error on
 * @param {string} message - The message to display in the error
 * @param {HTMLElement} container - The container to append the error message to
 */
export function setInputError(input, message, container) {
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", `${input.id}Error`);
  const error = document.getElementById(`${input.id}Error`);
  if (error) {
    error.textContent = message;
  } else {
    const errorMessage = document.createElement("div");
    errorMessage.id = `${input.id}Error`;
    errorMessage.className = "error-message";
    errorMessage.setAttribute("role", "alert");
    errorMessage.setAttribute("aria-live", "polite");
    errorMessage.textContent = message;
    input.parentNode.appendChild(errorMessage); // Place error message near the field
  }
  input.focus();
}

/**
 * Clears an input error message
 * @param {HTMLElement} input - The input element to clear error on
 */
export function clearInputError(input) {
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  const error = document.getElementById(`${input.id}Error`);
  if (error) {
    error.remove();
  }
}

/**
 * Updates UI language by translating text content
 * @param {string} language - The language to switch to ('en' or 'el')
 */
export function updateUILanguage(language) {
  const elements = {
    "login-title": { en: "Login", el: "Σύνδεση" },
    loginButton: { en: "Login", el: "Σύνδεση" },
    logoutButton: { en: "Logout", el: "Αποσύνδεση" },
    saveUrlButton: {
      en: "Save Current URL",
      el: "Αποθήκευση URL",
    },
    email: { en: "Email", el: "Ηλεκτρονικό Ταχυδρομείο" },
    password: { en: "Password", el: "Κωδικός" },
    withImagesCheckboxLabel: {en: "With images", el: "Με εικόνες"}
  };

  document.documentElement.lang = language;
  Object.keys(elements).forEach((key) => {
    const element = document.getElementById(key);
    if (element) {
      if (element.tagName === "INPUT") {
        element.placeholder = elements[key][language];
        element.setAttribute("aria-label", elements[key][language]);
      } else {
        element.innerText = elements[key][language];
      }
    }
  });

  // Notify user of successful language switch
  const notificationContainer = document.getElementById(
    "notification-container"
  );
  const notification = new Notification(notificationContainer);
  const languageText = language === "el" ? "Greek" : "English";
  notification.show(`Language changed to ${languageText}`, "success");
}
