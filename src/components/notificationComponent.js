// notificationComponent.js

class Notification {
  constructor(container) {
    this.container = container;
  }

  /**
   * Shows a notification with the specified message and type
   * @param {string} message - The message to display
   * @param {string} type - The type of the notification ('info', 'success', 'error')
   */
  show(message, type = "info") {
    if (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    const fragment = document.createDocumentFragment();

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    const icon = type === "success" ? "✔️" : type === "error" ? "❌" : "ℹ️";
    notification.innerHTML = `<span class="notification-icon">${icon}</span> ${message} <button class="close-btn">✖</button>`;
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");
    notification.setAttribute("aria-atomic", "true");
    notification.tabIndex = -1;

    const closeButton = notification.querySelector(".close-btn");
    closeButton.addEventListener("click", () =>
      this.container.removeChild(notification)
    );

    fragment.appendChild(notification);
    this.container.appendChild(fragment);

    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    const duration = type === "error" ? 5000 : 3000;
    setTimeout(() => {
      if (this.container.firstChild === notification) {
        notification.classList.add("notification-hide");
        requestAnimationFrame(() => {
          if (this.container.firstChild === notification)
            this.container.removeChild(notification);
        });
      }
    }, duration);
  }
}

export default Notification;
