/**
 * Set up an inline-edit toggle between a display view and a hidden input field.
 * @param {HTMLElement} inputElement - The hidden input element.
 * @param {HTMLElement} viewElement - The visible display element.
 * @param {HTMLElement} editButton - Button to switch from view mode to edit mode.
 * @param {HTMLElement } saveButton - Button to save (optional; shows "Saved!" popover if provided).
 * @param {HTMLElement } cancelButton - Button to cancel and restore previous value.
 * @returns {object} An object with `showView` and `showSavedPopover` helper methods.
 */
export function setupInlineEdit(inputElement: HTMLElement, viewElement: HTMLElement, editButton: HTMLElement, saveButton?: HTMLElement, cancelButton?: HTMLElement): { showView: (value: string) => void; showSavedPopover: (value: string) => void } {
  let cancelValue = '';
  let cancelViewHtml = '';

  /**
   * Switch from edit mode back to view mode, displaying the given value.
   * @param {string} value - The HTML content to display.
   */
  function showView(value: string): void {
    viewElement.textContent = value || '';
    viewElement.classList.remove('d-none');
    inputElement.classList.add('d-none');
    if (saveButton) saveButton.classList.add('d-none');
    editButton.classList.remove('d-none');
    if (cancelButton) cancelButton.classList.add('d-none');
  }

  /**
   * Switch from view mode to edit mode, showing the input field.
   */
  function showEdit(): void {
    cancelValue = (inputElement as HTMLInputElement).value;
    cancelViewHtml = viewElement.innerHTML || '';
    viewElement.classList.add('d-none');
    inputElement.classList.remove('d-none');
    editButton.classList.add('d-none');
    if (saveButton) saveButton.classList.remove('d-none');
    if (cancelButton) cancelButton.classList.remove('d-none');
    inputElement.focus();
  }

  viewElement.classList.remove('d-none');
  inputElement.classList.add('d-none');
  editButton.classList.remove('d-none');
  if (saveButton) saveButton.classList.add('d-none');
  if (cancelButton) cancelButton.classList.add('d-none');

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
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Saved!';
      (saveButton as HTMLButtonElement).disabled = true;
      setTimeout(() => {
        saveButton.textContent = originalText;
        (saveButton as HTMLButtonElement).disabled = false;
        showView(value);
      }, 1500);
    },
  };
}
