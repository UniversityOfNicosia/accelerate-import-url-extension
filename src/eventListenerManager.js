// eventListenerManager.js

class EventListenerManager {
  constructor() {
    this.listeners = [];
  }

  /**
   * Adds an event listener and tracks it for later removal
   * @param {HTMLElement} target - The target element to add the listener to
   * @param {string} type - The event type
   * @param {Function} listener - The event listener function
   * @param {Object} [options] - Optional options for addEventListener
   */
  addEventListener(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    this.listeners.push({ target, type, listener });
  }

  /**
   * Removes all tracked event listeners to prevent memory leaks
   */
  removeEventListeners() {
    for (const { target, type, listener } of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners = [];
  }
}

export default EventListenerManager;
