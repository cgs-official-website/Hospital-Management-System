export const popupEvent = new EventTarget();

/**
 * Show an alert popup
 * @param {string} message - The message to display
 * @param {string} type - 'error', 'success', 'info', or 'warning'
 */
export const showPopup = (message, type = 'info') => {
  popupEvent.dispatchEvent(new CustomEvent('show', { detail: { message, type } }));
};

/**
 * Show a confirmation popup
 * @param {string} message - The message to display
 * @param {function} onConfirm - Callback if the user clicks Confirm
 */
export const showConfirm = (message, onConfirm) => {
  popupEvent.dispatchEvent(new CustomEvent('confirm', { detail: { message, onConfirm } }));
};
