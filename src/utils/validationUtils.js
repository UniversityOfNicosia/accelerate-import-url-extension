// validationUtils.js

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid email, false otherwise
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}
