import { searchUsers, searchPromises } from './autocomplete.api.mjs';

/**
 * Create an autocomplete dropdown for @-mention and #-reference in a comment textarea.
 * @param {HTMLTextAreaElement} textarea - The textarea element to attach autocomplete to.
 * @param {string} parentType - The parent entity type.
 * @param {number|string} parentId - The parent entity ID.
 * @returns {Object} An object with a destroy method to clean up event listeners.
 */
export function createCommentAutocomplete(textarea, parentType, parentId) {
  const dropdown = document.createElement('div');
  dropdown.className = 'comment-autocomplete';
  dropdown.role = 'listbox';
  dropdown.style.display = 'none';
  document.body.appendChild(dropdown);

  const state = {
    open: false,
    items: [],
    highlightedIndex: -1,
    trigger: null,
    triggerStart: -1,
  };
  let debounceTimer = null;

  /**
   * Detect an @ or # trigger at the cursor position in the textarea.
   * @returns {Object|null} An object with trigger, query, and start properties, or null.
   */
  function getTriggerAtCursor() {
    const pos = textarea.selectionStart;
    const val = textarea.value;

    let wordStart = pos;
    while (wordStart > 0 && !/\s/.test(val[wordStart - 1])) {
      wordStart--;
    }

    const word = val.substring(wordStart, pos);

    if (word.length > 0 && (word[0] === '@' || word[0] === '#')) {
      const trigger = word[0];
      const query = word.substring(1);
      if (trigger === '@' && /^\w*$/.test(query)) {
        return { trigger, query, start: wordStart };
      }
      if (trigger === '#') {
        return { trigger, query, start: wordStart };
      }
    }

    return null;
  }

  /**
   * Compute the bounding rectangle of the character at a given index in the textarea.
   * @param {number} charIndex - The character index.
   * @returns {DOMRect} The bounding rectangle of the character.
   */
  function getCaretRect(charIndex) {
    const mirror = document.createElement('div');
    const computed = window.getComputedStyle(textarea);

    const cssProps = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
      'fontStretch', 'lineHeight', 'letterSpacing', 'wordSpacing',
      'textIndent', 'textTransform', 'wordBreak', 'whiteSpace',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    ];

    const style = mirror.style;
    for (const prop of cssProps) {
      (style)[prop] = computed[prop];
    }
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.visibility = 'hidden';
    style.overflow = 'hidden';
    style.width = textarea.clientWidth + 'px';
    style.height = 'auto';
    style.whiteSpace = 'pre-wrap';
    style.wordWrap = 'break-word';

    const textBefore = textarea.value.substring(0, charIndex);
    mirror.textContent = textBefore;
    const marker = document.createElement('span');
    marker.textContent = textarea.value[charIndex] || '|';
    mirror.appendChild(marker);

    document.body.appendChild(mirror);
    const rect = marker.getBoundingClientRect();
    document.body.removeChild(mirror);

    return rect;
  }

  /**
   * Position the autocomplete dropdown below the trigger character in the textarea.
   */
  function positionDropdown() {
    const textareaRect = textarea.getBoundingClientRect();
    const computed = window.getComputedStyle(textarea);
    const borderTop = parseFloat(computed.borderTopWidth) || 0;
    const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
    const lineHeight = parseFloat(computed.lineHeight) || (parseFloat(computed.fontSize) * 1.2) || 20;

    const charRect = getCaretRect(state.triggerStart);

    const visibleTop = textareaRect.top + borderTop + charRect.top - textarea.scrollTop;
    const visibleLeft = textareaRect.left + borderLeft + charRect.left - textarea.scrollLeft;

    dropdown.style.position = 'fixed';
    dropdown.style.left = visibleLeft + 'px';
    dropdown.style.top = (visibleTop + lineHeight) + 'px';
  }

  /**
   * Fetch autocomplete suggestions from the API based on the trigger info.
   * @param {Object} triggerInfo - The trigger info from getTriggerAtCursor.
   */
  async function fetchSuggestions(triggerInfo) {
    let results;
    try {
      if (triggerInfo.trigger === '@') {
        results = await searchUsers(parentType, parentId, triggerInfo.query);
      } else {
        results = await searchPromises(parentType, parentId, triggerInfo.query);
      }
    } catch {
      close();
      return;
    }

    if (results && results.length > 0) {
      showDropdown(results, triggerInfo);
    } else {
      close();
    }
  }

  /**
   * Show the autocomplete dropdown with the given items.
   * @param {Array} items - The items to display in the dropdown.
   * @param {Object} triggerInfo - The trigger info for positioning.
   */
  function showDropdown(items, triggerInfo) {
    state.items = items;
    state.trigger = triggerInfo.trigger;
    state.triggerStart = triggerInfo.start;
    state.highlightedIndex = 0;
    state.open = true;

    renderDropdown();
    positionDropdown();
    dropdown.style.display = 'block';
  }

  /**
   * Render the dropdown list items and highlight the current selection.
   */
  function renderDropdown() {
    dropdown.innerHTML = '';

    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      const el = document.createElement('div');
      el.className = 'comment-autocomplete__item'
        + (i === state.highlightedIndex ? ' comment-autocomplete__item--highlight' : '');
      el.role = 'option';
      el.ariaSelected = String(i === state.highlightedIndex);

      if (state.trigger === '@') {
        el.textContent = item.name;
      } else {
        el.textContent = '#' + item.entityType + '-' + (item.sequenceNumber ?? item.id) + ' \u2014 ' + item.statement;
      }

      el.dataset.index = i;
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        selectItem(parseInt(this.dataset.index, 10));
      });

      dropdown.appendChild(el);
    }

    const highlightedEl = dropdown.children[state.highlightedIndex];
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Move the highlight to the next item in the dropdown.
   */
  function highlightNext() {
    if (state.items.length === 0) return;
    state.highlightedIndex = (state.highlightedIndex + 1) % state.items.length;
    renderDropdown();
  }

  /**
   * Move the highlight to the previous item in the dropdown.
   */
  function highlightPrev() {
    if (state.items.length === 0) return;
    state.highlightedIndex = (state.highlightedIndex - 1 + state.items.length) % state.items.length;
    renderDropdown();
  }

  /**
   * Select an item from the dropdown by index and insert it into the textarea.
   * @param {number} index - The index of the item to select.
   */
  function selectItem(index) {
    const item = state.items[index];
    if (!item) return;

    if (textarea.value[state.triggerStart] !== state.trigger) {
      close();
      return;
    }

    let insertText;
    if (state.trigger === '@') {
      insertText = '@' + item.name + ' ';
    } else {
      insertText = '#' + item.entityType + '-' + (item.sequenceNumber ?? item.id) + ' ';
    }

    const cursorEnd = textarea.selectionStart;
    const before = textarea.value.substring(0, state.triggerStart);
    const after = textarea.value.substring(cursorEnd);
    textarea.value = before + insertText + after;

    const newCursor = before.length + insertText.length;
    textarea.selectionStart = newCursor;
    textarea.selectionEnd = newCursor;

    close();
    textarea.focus();
  }

  /**
   * Select the currently highlighted dropdown item.
   */
  function selectHighlighted() {
    selectItem(state.highlightedIndex);
  }

  /**
   * Close the autocomplete dropdown and reset state.
   */
  function close() {
    state.open = false;
    state.items = [];
    state.highlightedIndex = -1;
    state.trigger = null;
    state.triggerStart = -1;
    dropdown.style.display = 'none';
  }

  /**
   * Handle textarea input events: debounce and check for triggers.
   */
  function onInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      const trigger = getTriggerAtCursor();
      if (trigger) {
        fetchSuggestions(trigger);
      } else {
        close();
      }
    }, 200);
  }

  /**
   * Handle keyboard events for navigating and selecting from the dropdown.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  function onKeydown(e) {
    if (!state.open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightPrev();
        break;
      case 'Tab':
        e.preventDefault();
        if (state.highlightedIndex >= 0) {
          selectHighlighted();
        } else {
          close();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (state.highlightedIndex >= 0) {
          selectHighlighted();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        textarea.focus();
        break;
    }
  }

  /**
   * Handle textarea blur: close the dropdown after a short delay.
   */
  function onBlur() {
    setTimeout(function () {
      if (document.activeElement !== dropdown && !dropdown.contains(document.activeElement)) {
        close();
      }
    }, 150);
  }

  /**
   * Handle clicks outside the textarea and dropdown to close the dropdown.
   * @param {MouseEvent} e - The mouse event.
   */
  function onClickOutside(e) {
    if (textarea.contains(e.target) || dropdown.contains(e.target)) return;
    close();
  }

  /**
   * Handle form submission to close the dropdown.
   */
  function onFormSubmit() {
    close();
  }

  textarea.addEventListener('input', onInput);
  textarea.addEventListener('keydown', onKeydown);
  textarea.addEventListener('blur', onBlur);
  document.addEventListener('click', onClickOutside);

  const form = textarea.closest('form');
  if (form) {
    form.addEventListener('submit', onFormSubmit);
  }

  return {
    destroy: function () {
      textarea.removeEventListener('input', onInput);
      textarea.removeEventListener('keydown', onKeydown);
      textarea.removeEventListener('blur', onBlur);
      document.removeEventListener('click', onClickOutside);
      if (form) {
        form.removeEventListener('submit', onFormSubmit);
      }
      if (dropdown.parentNode) {
        dropdown.parentNode.removeChild(dropdown);
      }
    },
  };
}
