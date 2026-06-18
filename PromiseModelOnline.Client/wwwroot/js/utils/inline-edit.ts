// @ts-nocheck
/**
 * Set up an inline-edit toggle between a display view and a hidden input field.
 * @param {HTMLElement} inputElement - The hidden input element.
 * @param {HTMLElement} viewElement - The visible display element.
 * @param {HTMLElement} editButton - Button to switch from view mode to edit mode.
 * @param {HTMLElement } saveButton - Button to save (optional; shows "Saved!" popover if provided).
 * @param {HTMLElement } cancelButton - Button to cancel and restore previous value.
 * @returns {object} An object with `showView` and `showSavedPopover` helper methods.
 */
export function setupInlineEdit(inputElement: HTMLElement, viewElement: HTMLElement, editButton: HTMLElement, saveButton: HTMLElement | null, cancelButton: HTMLElement | null): { showView: (value: string) => void; showSavedPopover: (value: string) => void } {
  let cancelValue = '';
  let cancelViewHtml = '';

  /**
   * Switch from edit mode back to view mode, displaying the given value.
   * @param {string} value - The HTML content to display.
   */
  function showView(value: string): void {
    viewElement.innerHTML = value || '';
    viewElement.style.display = '';
    inputElement.style.display = 'none';
    if (saveButton) saveButton.style.display = 'none';
    editButton.style.display = '';
    if (cancelButton) cancelButton.style.display = 'none';
  }

  /**
   * Switch from view mode to edit mode, showing the input field.
   */
  function showEdit(): void {
    cancelValue = (inputElement as HTMLInputElement).value;
    cancelViewHtml = viewElement.innerHTML;
    viewElement.style.display = 'none';
    inputElement.style.display = '';
    editButton.style.display = 'none';
    if (saveButton) saveButton.style.display = '';
    if (cancelButton) cancelButton.style.display = '';
    inputElement.focus();
  }

  viewElement.style.display = '';
  inputElement.style.display = 'none';
  editButton.style.display = '';
  if (saveButton) saveButton.style.display = 'none';
  if (cancelButton) cancelButton.style.display = 'none';

  editButton.addEventListener('click', showEdit);

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      (inputElement as HTMLInputElement).value = cancelValue;
      showView(cancelViewHtml);
    });
  }

  return {
    showView,
    showSavedPopover(value: string): void {
      if (!saveButton) {
        showView(value);
        return;
      }
      if (typeof bootstrap !== 'undefined' && (bootstrap as any).Popover) {
        const popover = new (bootstrap as any).Popover(saveButton, {
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
