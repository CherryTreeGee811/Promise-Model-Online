import { searchUsers, searchPromises } from './autocomplete.api.ts';

interface AutocompleteItem {
  name?: string;
  entityType?: string;
  sequenceNumber?: number;
  id?: number | string;
  statement?: string;
}

interface AutocompleteState {
  open: boolean;
  items: AutocompleteItem[];
  highlightedIndex: number;
  trigger?: string;
  triggerStart: number;
}

/**
 * Create an autocomplete dropdown for @-mention and #-reference in a comment textarea.
 * @param {HTMLTextAreaElement} textarea - The textarea element to attach autocomplete to.
 * @param {string} parentType - The parent entity type.
 * @param {number|string} parentId - The parent entity ID.
 * @returns {{ destroy: () => void }} An object with a destroy method to clean up event listeners.
 */
export function createCommentAutocomplete(textarea: HTMLTextAreaElement, parentType: string, parentId: string | number) {
  const dropdown = document.createElement('div');
  dropdown.className = 'comment-autocomplete';
  dropdown.role = 'listbox';
  dropdown.style.display = 'none';
  document.body.append(dropdown);

  const state: AutocompleteState = {
    open: false,
    items: [],
    highlightedIndex: -1,
    triggerStart: -1,
  };
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Detect an @ or # trigger at the cursor position in the textarea.
   * @returns {object | undefined} The trigger info with trigger, query, and start, or undefined.
   */
  function getTriggerAtCursor(): void | { trigger: string; query: string; start: number } {
    const pos = textarea.selectionStart;
    const value = textarea.value;

    let wordStart = pos;
    while (wordStart > 0 && !/\s/.test(value[wordStart - 1])) {
      wordStart--;
    }

    const word = value.slice(wordStart, pos);

    if (word.length > 0 && (word.at(0) === '@' || word.at(0) === '#')) {
      const trigger = word.at(0);
      const query = word.slice(1);
      if (trigger === '@' && /^\w*$/.test(query)) {
        return { trigger, query, start: wordStart };
      }
      if (trigger === '#') {
        return { trigger, query, start: wordStart };
      }
    }

  }

  /**
   * Compute the bounding rectangle of the character at a given index in the textarea.
   * @param {number} charIndex - The character index.
   * @returns {DOMRect} The bounding rectangle of the character.
   */
  function getCaretRect(charIndex: number) {
    const mirror = document.createElement('div');
    const computed = getComputedStyle(textarea);

    const cssProperties = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
      'fontStretch', 'lineHeight', 'letterSpacing', 'wordSpacing',
      'textIndent', 'textTransform', 'wordBreak', 'whiteSpace',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    ];

    const style = mirror.style;
    for (const property of cssProperties) {
      (style as unknown as Record<string, string>)[property] = (computed as unknown as Record<string, string>)[property];
    }
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.visibility = 'hidden';
    style.overflow = 'hidden';
    style.width = textarea.clientWidth + 'px';
    style.height = 'auto';
    style.whiteSpace = 'pre-wrap';
    style.overflowWrap = 'break-word';

    const textBefore = textarea.value.slice(0, Math.max(0, charIndex));
    mirror.textContent = textBefore;
    const marker = document.createElement('span');
    marker.textContent = textarea.value[charIndex] || '|';
    mirror.append(marker);

    document.body.append(mirror);
    const rect = marker.getBoundingClientRect();
    mirror.remove();

    return rect;
  }

  /** Position the autocomplete dropdown below the trigger character in the textarea. */
  function positionDropdown() {
    const textareaRect = textarea.getBoundingClientRect();
    const computed = getComputedStyle(textarea);
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
    const borderLeft = Number.parseFloat(computed.borderLeftWidth) || 0;
    const lineHeight = Number.parseFloat(computed.lineHeight) || (Number.parseFloat(computed.fontSize) * 1.2) || 20;

    const charRect = getCaretRect(state.triggerStart);

    const visibleTop = textareaRect.top + borderTop + charRect.top - textarea.scrollTop;
    const visibleLeft = textareaRect.left + borderLeft + charRect.left - textarea.scrollLeft;

    dropdown.style.position = 'fixed';
    dropdown.style.left = visibleLeft + 'px';
    dropdown.style.top = (visibleTop + lineHeight) + 'px';
  }

  /**
   * Fetch autocomplete suggestions from the API based on the trigger info.
   * @param {{ trigger: string, query: string, start: number }} triggerInfo - The trigger info.
   */
  async function fetchSuggestions(triggerInfo: { trigger: string; query: string; start: number }) {
    let results;
    try {
      results = triggerInfo.trigger === '@' ? (await searchUsers(parentType, parentId, triggerInfo.query)) : (await searchPromises(parentType, parentId, triggerInfo.query));
    } catch {
      close();
      return;
    }

    if (results && (results as unknown[]).length > 0) {
      showDropdown(results as AutocompleteItem[], triggerInfo);
    } else {
      close();
    }
  }

  /**
   * Show the autocomplete dropdown with the given items.
   * @param {Array} items - The items to display in the dropdown.
   * @param {{ trigger: string, query: string, start: number }} triggerInfo - The trigger info for positioning.
   */
  function showDropdown(items: AutocompleteItem[], triggerInfo: { trigger: string; query: string; start: number }) {
    state.items = items;
    state.trigger = triggerInfo.trigger;
    state.triggerStart = triggerInfo.start;
    state.highlightedIndex = 0;
    state.open = true;

    renderDropdown();
    positionDropdown();
    dropdown.style.display = 'block';
  }

  /** Render the dropdown list items and highlight the current selection. */
  function renderDropdown() {
     
    dropdown.replaceChildren();

    for (let index = 0; index < state.items.length; index++) {
      const item = state.items[index];
      const element = document.createElement('div');
      element.className = 'comment-autocomplete__item'
        + (index === state.highlightedIndex ? ' comment-autocomplete__item--highlight' : '');
      element.role = 'option';
      element.ariaSelected = String(index === state.highlightedIndex);

      element.textContent = state.trigger === '@' ? item.name ?? '' : '#' + (item.entityType ?? '') + '-' + (item.sequenceNumber ?? item.id ?? '') + ' \u{2014} ' + (item.statement ?? '');

      element.dataset.index = String(index);
      element.addEventListener('mousedown', function (event) {
        event.preventDefault();
        selectItem(parseInt(element.dataset.index!, 10));
      });

      dropdown.append(element);
    }

    const highlightedElement = /** @type {HTMLElement} */ (dropdown.children[state.highlightedIndex]);
    if (highlightedElement) {
      highlightedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  /** Move the highlight to the next item in the dropdown. */
  function highlightNext() {
    if (state.items.length === 0) return;
    state.highlightedIndex = (state.highlightedIndex + 1) % state.items.length;
    renderDropdown();
  }

  /** Move the highlight to the previous item in the dropdown. */
  function highlightPrevious() {
    if (state.items.length === 0) return;
    state.highlightedIndex = (state.highlightedIndex - 1 + state.items.length) % state.items.length;
    renderDropdown();
  }

  /**
   * Select an item from the dropdown by index and insert it into the textarea.
   * @param {number} index - The index of the item to select.
   */
  function selectItem(index: number) {
    const item = state.items[index];
    if (!item) return;

    if (textarea.value[state.triggerStart] !== state.trigger) {
      close();
      return;
    }

    const insertText = (state.trigger === '@' ? '@' + (item.name ?? '') : '#' + (item.entityType ?? '') + '-' + (item.sequenceNumber ?? item.id ?? '')) + ' ';

    const cursorEnd = textarea.selectionStart;
    const before = textarea.value.slice(0, Math.max(0, state.triggerStart));
    const after = textarea.value.slice(Math.max(0, cursorEnd));
    textarea.value = before + insertText + after;

    const newCursor = before.length + insertText.length;
    textarea.selectionStart = newCursor;
    textarea.selectionEnd = newCursor;

    close();
    textarea.focus();
  }

  /** Select the currently highlighted dropdown item. */
  function selectHighlighted() {
    selectItem(state.highlightedIndex);
  }

  /** Close the autocomplete dropdown and reset state. */
  function close() {
    state.open = false;
    state.items = [];
    state.highlightedIndex = -1;
    delete state.trigger;
    state.triggerStart = -1;
    dropdown.style.display = 'none';
  }

  /** Handle textarea input events: debounce and check for triggers. */
  function onInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      const trigger = getTriggerAtCursor();
      if (trigger) {
        void fetchSuggestions(trigger);
      } else {
        close();
      }
    }, 200);
  }

  /**
   * Handle keyboard events for navigating and selecting from the dropdown.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  function onKeydown(event: KeyboardEvent) {
    if (!state.open) return;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        highlightNext();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        highlightPrevious();
        break;
      }
      case 'Tab': {
        event.preventDefault();
        if (state.highlightedIndex >= 0) {
          selectHighlighted();
        } else {
          close();
        }
        break;
      }
      case 'Enter': {
        event.preventDefault();
        if (state.highlightedIndex >= 0) {
          selectHighlighted();
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        close();
        textarea.focus();
        break;
      }
    }
  }

  /** Handle textarea blur: close the dropdown after a short delay. */
  function onBlur() {
    setTimeout(function () {
      if (document.activeElement !== dropdown && !dropdown.contains(document.activeElement)) {
        close();
      }
    }, 150);
  }

  /**
   * Handle clicks outside the textarea and dropdown to close the dropdown.
   * @param {MouseEvent} event - The mouse event.
   */
  function onClickOutside(event: MouseEvent) {
    if (textarea.contains(event.target as Node) || dropdown.contains(event.target as Node)) return;
    close();
  }

  /** Handle form submission to close the dropdown. */
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
        dropdown.remove();
      }
    },
  };
}
