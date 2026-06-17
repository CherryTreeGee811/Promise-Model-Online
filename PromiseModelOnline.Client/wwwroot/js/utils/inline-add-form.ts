import { removeInlineEmptyRow, insertRowBeforeAddRow } from './inline-table.ts';
import { patchChildMetrics } from '../projects/detail-stack-graph.ts';

/** Configuration for setting up an inline add-child form on a detail page. */
export interface AddChildConfig {
  /** The `id` of the form element. */
  formId: string;
  /** The `id` of the statement text input. */
  inputId: string;
  /** The `id` of the submit button. */
  submitBtnId: string;
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
 * @param config - Configuration for the add-child form.
 */
export function setupAddChildForm(config: AddChildConfig): void {
  const {
    formId, inputId, submitBtnId, msgId, typeSelectId,
    tbody,
    onCreate, getRowHtml, datasetKey, childMetricsKey,
    items, onSuccess, getExtra
  } = config;

  const form = document.getElementById(formId) as HTMLFormElement | null;
  const statementInput = document.getElementById(inputId) as HTMLInputElement | null;
  const msg = document.getElementById(msgId) as HTMLElement | null;
  const submitBtn = document.getElementById(submitBtnId) as HTMLButtonElement | null;
  const typeSelect = typeSelectId ? document.getElementById(typeSelectId) as HTMLSelectElement | null : null;

  if (!form || !statementInput || !msg || !submitBtn) return;
  if (typeSelectId && !typeSelect) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    msg.textContent = '';

    const statement = statementInput.value.trim();
    if (!statement) {
      msg.textContent = 'Statement is required.';
      return;
    }

    submitBtn.disabled = true;

    try {
      const extra = getExtra ? getExtra() : undefined;
      const created = await onCreate(statement, extra);

      if (created && tbody) {
        removeInlineEmptyRow(tbody);
        const row = document.createElement('tr');
        row.setAttribute(`data-${datasetKey}`, String(created.id));
        row.innerHTML = getRowHtml(created);
        insertRowBeforeAddRow(tbody, row);
        statementInput.value = '';
        if (typeSelect) typeSelect.value = 'Story';
        if (onSuccess) onSuccess();
        patchChildMetrics(childMetricsKey, [...(items || []), created]);
      }
    } catch {
      msg.textContent = `Failed to add ${datasetKey}.`;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/**
 * Disable the add-child form controls when the user lacks Edit permission.
 * @param formId - The `id` of the form element.
 * @param inputId - The `id` of the statement input.
 * @param submitBtnId - The `id` of the submit button.
 * @param typeSelectId - Optional `id` of the type select (moments detail).
 */
export function gateAddChildControls(formId: string, inputId: string, submitBtnId: string, typeSelectId?: string): void {
  const addInput = document.getElementById(inputId) as HTMLInputElement | null;
  const addSubmit = document.getElementById(submitBtnId) as HTMLButtonElement | null;
  if (addInput) addInput.disabled = true;
  if (addSubmit) { addSubmit.disabled = true; addSubmit.title = 'Requires Edit permission.'; }
  if (typeSelectId) {
    const typeEl = document.getElementById(typeSelectId) as HTMLSelectElement | null;
    if (typeEl) typeEl.disabled = true;
  }
}
