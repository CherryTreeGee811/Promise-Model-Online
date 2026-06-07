export function setupInlineEdit(inputEl, viewEl, editBtn, saveBtn) {
  function showView(value) {
    viewEl.innerHTML = value || '';
    viewEl.style.display = '';
    inputEl.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    editBtn.style.display = '';
  }

  function showEdit() {
    viewEl.style.display = 'none';
    inputEl.style.display = '';
    editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = '';
    inputEl.focus();
  }

  // Initialize display states — preserve existing server-rendered content
  viewEl.style.display = '';
  inputEl.style.display = 'none';
  editBtn.style.display = '';
  if (saveBtn) saveBtn.style.display = 'none';

  editBtn.addEventListener('click', showEdit);

  return {
    showView,
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
