// @ts-nocheck
/**
 * Set up an inline-edit toggle between a display view and a hidden input field.
 * @param {HTMLElement} inputEl - The hidden input element.
 * @param {HTMLElement} viewEl - The visible display element.
 * @param {HTMLElement} editBtn - Button to switch from view mode to edit mode.
 * @param {HTMLElement | null} saveBtn - Button to save (optional; shows "Saved!" popover if provided).
 * @param {HTMLElement | null} cancelBtn - Button to cancel and restore previous value.
 * @returns {object} An object with `showView` and `showSavedPopover` helper methods.
 */
export function setupInlineEdit(inputEl: HTMLElement, viewEl: HTMLElement, editBtn: HTMLElement, saveBtn: HTMLElement | null, cancelBtn: HTMLElement | null): { showView: (value: string) => void; showSavedPopover: (value: string) => void } {
  let cancelValue = '';
  let cancelViewHtml = '';

  /**
   * Switch from edit mode back to view mode, displaying the given value.
   * @param {string} value - The HTML content to display.
   */
  function showView(value: string): void {
    viewEl.innerHTML = value || '';
    viewEl.style.display = '';
    inputEl.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    editBtn.style.display = '';
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  /**
   * Switch from view mode to edit mode, showing the input field.
   */
  function showEdit(): void {
    cancelValue = (inputEl as HTMLInputElement).value;
    cancelViewHtml = viewEl.innerHTML;
    viewEl.style.display = 'none';
    inputEl.style.display = '';
    editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = '';
    if (cancelBtn) cancelBtn.style.display = '';
    inputEl.focus();
  }

  viewEl.style.display = '';
  inputEl.style.display = 'none';
  editBtn.style.display = '';
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';

  editBtn.addEventListener('click', showEdit);

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      (inputEl as HTMLInputElement).value = cancelValue;
      showView(cancelViewHtml);
    });
  }

  return {
    showView,
    showSavedPopover(value: string): void {
      if (!saveBtn) {
        showView(value);
        return;
      }
      if (typeof bootstrap !== 'undefined' && (bootstrap as any).Popover) {
        const popover = new (bootstrap as any).Popover(saveBtn, {
          trigger: 'manual',
          placement: 'top',
          content: 'Saved!',
          customClass: 'inline-edit-saved-popover',
        });
        popover.show();
        setTimeout(() => {
          popover.dispose();
          showView(value);
        }, 1500);
      } else {
        showView(value);
      }
    },
  };
}
