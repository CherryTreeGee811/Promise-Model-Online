/** Validation rule type identifiers. */
export type RuleType = 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'match';

/**
 * A single validation rule with type, optional value, and error message.
 * For `match` rules, `matchField` references another field ID to compare against.
 */
export interface ValidationRule {
  type: RuleType;
  value?: number | string | RegExp;
  message: string;
  matchField?: string;
}

/** Map of field IDs to their validation rules. */
export interface FieldRules {
  [fieldId: string]: ValidationRule[];
}

/** Result of a full form validation pass. */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/** API for a form validator instance created by {@link createValidator}. */
export interface FormValidator {
  /** Validate all fields. Returns whether the form is valid and a map of field errors. */
  validate(): ValidationResult;
  /** Validate a single field. Returns the error message or undefined. */
  validateField(fieldId: string): string | undefined;
  /** Clear all validation errors from the form. */
  clearErrors(): void;
  /** Clear validation error from a single field. */
  clearFieldError(fieldId: string): void;
  /** Remove all event listeners and error elements. */
  destroy(): void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

/**
 * Get the trimmed value of a form element.
 * @param {HTMLElement} element - The form element.
 * @returns {string} The element's value.
 */
function getElementValue(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value.trim();
  }
  if (element instanceof HTMLSelectElement) {
    return element.value;
  }
  return (element as HTMLInputElement).value?.trim() ?? '';
}

/**
 * Set or clear the validation state on a form element.
 * @param {HTMLElement} element - The form element.
 * @param {boolean} isValid - Whether the element is valid.
 * @param {string} message - The error message to display when invalid.
 */
function setValidity(element: HTMLElement, isValid: boolean, message: string): void {
  element.classList.toggle('is-invalid', !isValid);
  if (isValid) {
    element.classList.remove('is-invalid');
  }

  const existing = element.parentElement?.querySelector('.invalid-feedback') as HTMLElement | null;
  if (isValid) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.textContent = message;
    return;
  }

  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback';
  feedback.textContent = message;
  element.parentElement?.append(feedback);
}

/**
 * Evaluate a single validation rule against a value.
 * @param {string} value - The field value to validate.
 * @param {ValidationRule} rule - The validation rule to apply.
 * @param {Record<string, string>} allValues - All form field values for cross-field rules.
 * @returns {string | undefined} The error message, or undefined if valid.
 */
const ruleHandlers: Record<string, (value: string, rule: ValidationRule, allValues: Record<string, string>) => string | undefined> = {
  required: (v, r) => v.length === 0 ? r.message : undefined,
  minLength: (v, r) => v.length < (r.value as number) ? r.message : undefined,
  maxLength: (v, r) => v.length > (r.value as number) ? r.message : undefined,
  pattern: (v, r) => {
    const regex = r.value instanceof RegExp ? r.value : new RegExp(r.value as string);
    return regex.test(v) ? undefined : r.message;
  },
  email: (v, r) => v.length > 0 && !EMAIL_REGEX.test(v) ? r.message : undefined,
  match: (v, r, all) => v === all[r.matchField ?? ''] ? undefined : r.message,
};

function evaluateRule(value: string, rule: ValidationRule, allValues: Record<string, string>): string | undefined {
  const handler = ruleHandlers[rule.type];
  return handler ? handler(value, rule, allValues) : undefined;
}

/**
 * Create a form validator that applies field-level validation rules, displays
 * inline Bootstrap `invalid-feedback` messages, and clears errors on input.
 * @param {string} formId - The `id` of the form element.
 * @param {FieldRules} rules - Map of field IDs to arrays of validation rules.
 * @returns {FormValidator} A {@link FormValidator} instance bound to the form.
 */
export function createValidator(formId: string, rules: FieldRules): FormValidator {
  const form = document.querySelector('#' + formId) as HTMLFormElement | null;
  if (!form) {
    throw new Error(`Form with id "${formId}" not found.`);
  }

  const fields = new Map<string, HTMLElement>();

  for (const fieldId of Object.keys(rules)) {
    const element = document.querySelector('#' + fieldId);
    if (element) {
      fields.set(fieldId, element as HTMLElement);
    }
  }

  /**
   * Get the current values of all registered form fields.
   * @returns {Record<string, string>} Map of field IDs to values.
   */
  function getValues(): Record<string, string> {
    const values: Record<string, string> = {};
    for (const [id, element] of fields) {
      values[id] = getElementValue(element);
    }
    return values;
  }

  /**
   * Validate a single field and update its UI state.
   * @param {string} fieldId - The field ID to validate.
   * @returns {string | undefined} The error message, or undefined if valid.
   */
  function validateField(fieldId: string): string | undefined {
    const element = fields.get(fieldId);
    if (!element) return;

    const value = getElementValue(element);
    const fieldRules = rules[fieldId];
    if (!fieldRules) return;

    const allValues = getValues();

    for (const rule of fieldRules) {
      const error = evaluateRule(value, rule, allValues);
      if (error !== undefined) {
        setValidity(element, false, error);
        return error;
      }
    }

    setValidity(element, true, '');
  }

  /**
   * Validate all registered fields.
   * @returns {ValidationResult} Validation result with overall validity and field errors.
   */
  function validate(): ValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const fieldId of Object.keys(rules)) {
      const error = validateField(fieldId);
      if (error !== undefined) {
        errors[fieldId] = error;
        isValid = false;
      }
    }

    return { valid: isValid, errors };
  }

  /**
   * Clear the validation error on a single field.
   * @param {string} fieldId - The field ID to clear.
   */
  function clearFieldError(fieldId: string): void {
    const element = fields.get(fieldId);
    if (!element) return;
    element.classList.remove('is-invalid');
    element.parentElement?.querySelector('.invalid-feedback')?.remove();
  }

  /**
   * Clear validation errors on all registered fields.
   */
  function clearErrors(): void {
    for (const fieldId of Object.keys(rules)) {
      clearFieldError(fieldId);
    }
  }

  const inputHandlers = new Map<string, () => void>();

  /**
   * Remove all event listeners and error elements.
   */
  function destroy(): void {
    for (const [fieldId, element] of fields) {
      const handler = inputHandlers.get(fieldId);
      if (handler) {
        element.removeEventListener('input', handler);
        element.removeEventListener('blur', handler);
      }
      clearFieldError(fieldId);
    }
    fields.clear();
    inputHandlers.clear();
  }

  for (const [fieldId, element] of fields) {
    const handler = () => {
      const error = validateField(fieldId);
      if (error === undefined) {
        element.classList.remove('is-invalid');
        element.parentElement?.querySelector('.invalid-feedback')?.remove();
      }
    };
    inputHandlers.set(fieldId, handler);
    element.addEventListener('input', handler);
    element.addEventListener('blur', handler);
  }

  return { validate, validateField, clearErrors, clearFieldError, destroy };
}
