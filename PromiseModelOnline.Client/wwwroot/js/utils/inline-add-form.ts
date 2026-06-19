import { patchChildMetrics } from '../projects/detail-stack-graph.ts';

import { removeInlineEmptyRow, insertRowBeforeAddRow } from './inline-table.ts';

/** Configuration for setting up an inline add-child form on a detail page. */
export interface AddChildConfig {
  /** The `id` of the form element. */
  formId: string;
  /** The `id` of the statement text input. */
  inputId: string;
  /** The `id` of the submit button. */
  submitButtonId: string;
  /** The `id` of the message span for validation/api errors. */
  msgId: string;
  /** Optional `id` of a type select element (used by moments detail). */
  typeSelectId?: string;
  owner: string;
  project: string;
  /** The table body element to insert new rows into. */
  tbody: HTMLElement | null;
  /**
   * Create the child entity via the API.
   * @param statement - The trimmed statement text.
   * @param extra - Optional extra value from {@link getExtra} (e.g. moment type).
   * @returns The created entity, or null.
   */
  onCreate: (statement: string, extra?: string) => Promise<Record<string, unknown> | null>;
  /**
   * Return the HTML for a new table row representing the created entity.
   * @param created - The entity returned by {@link onCreate}.
   * @returns Row HTML string.
   */
  getRowHtml: (created: Record<string, unknown>) => string;
  /** Key used for the `data-*` attribute on the new row (e.g. `"epic"` → `data-epic-id`). */
  datasetKey: string;
  /** The child-metrics key for the stack graph (e.g. `"epic-3"`). */
  childMetricsKey: string;
  /** Current list of items; used to derive `displayOrder` and update metrics. */
  items?: Record<string, unknown>[];
  /** Optional callback fired after a successful creation and DOM update. */
  onSuccess?: () => void;
  /** Optional function that returns the current value of an extra field (e.g. moment type select). */
  getExtra?: () => string;
}

/**
 * Set up an inline add-child form on a detail page.
 * Handles form submission, validation, API call, row insertion, metrics update, and error display.
 * @param {AddChildConfig} config - Configuration for the add-child form.
 */
export function setupAddChildForm(config: AddChildConfig): void {
  const {
    formId, inputId, submitButtonId, msgId, typeSelectId,
    tbody,
    onCreate, getRowHtml, datasetKey, childMetricsKey,
    items, onSuccess, getExtra
  } = config;

  const form = document.querySelector('#' + formId) as HTMLFormElement | null;
  const statementInput = document.querySelector('#' + inputId) as HTMLInputElement | null;
  const message = document.querySelector('#' + msgId) as HTMLElement | null;
  const submitButton = document.querySelector('#' + submitButtonId) as HTMLButtonElement | null;

  if (!form || !statementInput || !message || !submitButton) return;

  const typeSelect = typeSelectId ? document.querySelector('#' + typeSelectId) as HTMLSelectElement | null : undefined;
  if (typeSelectId && !typeSelect) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';

    const statement = statementInput.value.trim();
    if (!statement) {
      message.textContent = 'Statement is required.';
      return;
    }

    submitButton.disabled = true;

    try {
      const extra = getExtra ? getExtra() : undefined;
      const created = await onCreate(statement, extra);

      if (created && tbody) {
        insertCreatedRow(tbody, created, datasetKey, getRowHtml, typeSelect);
        statementInput.value = '';
        if (typeSelect) typeSelect.value = 'Story';
        if (onSuccess) onSuccess();
        patchChildMetrics(childMetricsKey, [...(items || []), created]);
      }
    } catch {
      message.textContent = `Failed to add ${datasetKey}.`;
    } finally {
      submitButton.disabled = false;
    }
  });
}

/**
 * @param {HTMLTableSectionElement} tbody - The table body to insert into
 * @param {Record<string, unknown>} created - The created entity
 * @param {string} datasetKey - The data attribute key prefix
 * @param {(created: Record<string, unknown>) => string} getRowHtml - Function to get row HTML
 * @param {HTMLSelectElement | undefined} typeSelect - Optional type select element to reset
 */
function insertCreatedRow(tbody: HTMLTableSectionElement, created: Record<string, unknown>, datasetKey: string, getRowHtml: (created: Record<string, unknown>) => string, typeSelect: HTMLSelectElement | undefined): void {
  removeInlineEmptyRow(tbody);
  const row = document.createElement('tr');
  row.setAttribute('data-' + datasetKey, String(created.id));
  const parser = new DOMParser();
  const document_ = parser.parseFromString('<table><tbody>' + getRowHtml(created) + '</tbody></table>', 'text/html');
  const parsedRow = document_.querySelector('tr');
  if (parsedRow) {
    row.replaceChildren(...parsedRow.children);
    const attributeNames = parsedRow.getAttributeNames?.() ?? [];
    for (const attribute of attributeNames) {
      if (attribute.startsWith('data-')) row.setAttribute(attribute, parsedRow.getAttribute(attribute)!);
    }
  }
  insertRowBeforeAddRow(tbody, row);
}

/**
 * Disable the add-child form controls when the user lacks Edit permission.
 * @param {string} formId - The `id` of the form element.
 * @param {string} inputId - The `id` of the statement input.
 * @param {string} submitButtonId - The `id` of the submit button.
 * @param {string} [typeSelectId] - Optional `id` of the type select (moments detail).
 */
export function gateAddChildControls(formId: string, inputId: string, submitButtonId: string, typeSelectId?: string): void {
  const inputElement = document.querySelector('#' + inputId) as HTMLInputElement | null;
  const submitElement = document.querySelector('#' + submitButtonId) as HTMLButtonElement | null;
  if (inputElement) inputElement.disabled = true;
  if (submitElement) { submitElement.disabled = true; submitElement.title = 'Requires Edit permission.'; }
  if (typeSelectId) {
    const typeElement = document.querySelector('#' + typeSelectId) as HTMLSelectElement | null;
    if (typeElement) typeElement.disabled = true;
  }
}
