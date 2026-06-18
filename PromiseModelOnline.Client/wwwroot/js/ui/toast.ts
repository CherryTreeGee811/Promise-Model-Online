const TOAST_CONTAINER_ID = 'pmo-toast-container';
const DEFAULT_DURATION = 4000;

/**
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastType
 */

/** @type {Record<ToastType, string>} */
const ICONS = {
  success: 'bi-check-circle-fill',
  error: 'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

/** @type {Record<ToastType, string>} */
const BG_CLASSES = {
  success: 'bg-success',
  error: 'bg-danger',
  warning: 'bg-warning text-dark',
  info: 'bg-info text-dark',
};

/**
 * Get or create the toast container element.
 * @returns {HTMLElement} The toast container element.
 */
function ensureContainer() {
  let container = document.querySelector('#' + TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div') as HTMLElement;
    container.id = TOAST_CONTAINER_ID;
    (container as HTMLElement).style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:24rem';
    document.body.append(container);
  }
  return container;
}

/**
 * Show a Bootstrap-style toast notification.
 * The toast auto-dismisses after `duration` ms. Pass 0 for a sticky toast.
 * @param {string} message - The notification text.
 * @param {ToastType} [type] - Visual style.
 * @param {number} [duration] - Auto-dismiss timeout in ms.
 * @returns {void}
 */
export function showToast(message, type = 'info', duration = DEFAULT_DURATION) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast align-items-center border-0 ${BG_CLASSES[type]}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.cssText = 'display:flex;opacity:0;transition:opacity 0.3s ease';

  toast.append(
    (() => {
      const flexDiv = document.createElement('div');
      flexDiv.className = 'd-flex';
      const body = document.createElement('div');
      body.className = 'toast-body d-flex align-items-center gap-2';
      const icon = document.createElement('i');
      icon.className = `bi ${ICONS[type]}`;
      body.append(icon);
      const span = document.createElement('span');
      span.textContent = message;
      body.append(span);
      flexDiv.append(body);
      const closeButton_ = document.createElement('button');
      closeButton_.type = 'button';
      closeButton_.className = 'btn-close btn-close-white me-2 m-auto';
      closeButton_.dataset.bsDismiss = 'toast';
      closeButton_.setAttribute('aria-label', 'Close');
      flexDiv.append(closeButton_);
      return flexDiv;
    })()
  );

  container.append(toast);

  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  const closeButton = toast.querySelector('.btn-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    });
  }
}
