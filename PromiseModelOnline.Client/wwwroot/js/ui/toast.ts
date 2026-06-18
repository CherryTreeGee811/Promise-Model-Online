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
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:24rem';
    document.body.appendChild(container);
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

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${ICONS[type]}"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  const closeBtn = toast.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    });
  }
}
