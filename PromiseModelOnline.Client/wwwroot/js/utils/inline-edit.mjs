/**
 * Set up an inline-edit toggle between a view element and an input element.
 *
 * Handles show/hide of view/edit states, cancellation, and a "Saved!" popover
 * on the save button after successful updates.
 *
 * @param {HTMLElement} inputEl - The input field shown during edit mode.
 * @param {HTMLElement} viewEl - The element shown during view mode.
 * @param {HTMLElement} editBtn - The button that triggers edit mode.
 * @param {HTMLElement|null} saveBtn - The button that triggers save.
 * @param {HTMLElement|null} cancelBtn - The button that reverts to view mode.
 * @returns {{showView: Function, showSavedPopover: Function}} Control methods.
 */
export function setupInlineEdit(inputEl, viewEl, editBtn, saveBtn, cancelBtn) {
  let cancelValue = '';
  let cancelViewHtml = '';

  /**
   * Switch to view mode, hiding the input and showing the view element.
   * @param {string} value - The HTML content to display in the view element.
   * @returns {void}
   */
  function showView(value) {
    viewEl.innerHTML = value || '';
    viewEl.style.display = '';
    inputEl.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    editBtn.style.display = '';
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  /**
   * Switch to edit mode, hiding the view element and showing the input.
   * @returns {void}
   */
  function showEdit() {
    cancelValue = inputEl.value;
    cancelViewHtml = viewEl.innerHTML;
    viewEl.style.display = 'none';
    inputEl.style.display = '';
    editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = '';
    if (cancelBtn) cancelBtn.style.display = '';
    inputEl.focus();
  }

  // Initialize display states — preserve existing server-rendered content
  viewEl.style.display = '';
  inputEl.style.display = 'none';
  editBtn.style.display = '';
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';

  editBtn.addEventListener('click', showEdit);

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      inputEl.value = cancelValue;
      showView(cancelViewHtml);
    });
  }

  return {
    showView,
    /**
     * Display a "Saved!" popover on the save button, then revert to view mode.
     * @param {string} value - The HTML content to display after saving.
     * @returns {void}
     */
    showSavedPopover(value) {
      if (!saveBtn) {
        showView(value);
        return;
      }
      if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
        const popover = new bootstrap.Popover(saveBtn, {
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
