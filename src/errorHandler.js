// errorHandler.js

/**
 * Handles errors by logging them and showing a notification
 * @param {Error} error - The error object
 * @param {Notification} notification - The notification instance
 */
export function handleError(error, notification) {
  console.error(error);
  notification.show(
    `Unexpected error [E500]: ${error.message}. Please try again later. If the problem continues, contact support at support@example.com for assistance.`,
    "error"
  );
}
