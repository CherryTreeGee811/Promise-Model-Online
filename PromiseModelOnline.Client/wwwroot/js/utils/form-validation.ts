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
  /** Validate a single field. Returns the error message or null. */
  validateField(fieldId: string): string | null;
  /** Clear all validation errors from the form. */
  clearErrors(): void;
  /** Clear validation error from a single field. */
  clearFieldError(fieldId: string): void;
  /** Remove all event listeners and error elements. */
  destroy(): void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Get the trimmed value of a form element.
 * @param {HTMLElement} el - The form element.
 * @returns {string} The element's value.
 */
function getElementValue(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim();
  }
  if (el instanceof HTMLSelectElement) {
    return el.value;
  }
  return (el as HTMLInputElement).value?.trim() ?? '';
}

/**
 * Set or clear the validation state on a form element.
 * @param {HTMLElement} el - The form element.
 * @param {boolean} valid - Whether the element is valid.
 * @param {string} message - The error message to display when invalid.
 */
function setValidity(el: HTMLElement, valid: boolean, message: string): void {
  el.classList.toggle('is-invalid', !valid);
  if (valid) {
    el.classList.remove('is-invalid');
  }

  const existing = el.parentElement?.querySelector('.invalid-feedback') as HTMLElement | null;
  if (valid) {
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
  el.parentElement?.appendChild(feedback);
}

/**
 * Evaluate a single validation rule against a value.
 * @param {string} value - The field value to validate.
 * @param {ValidationRule} rule - The validation rule to apply.
 * @param {Record<string, string>} allValues - All form field values for cross-field rules.
 * @returns {string | null} The error message, or null if valid.
 */
function evaluateRule(value: string, rule: ValidationRule, allValues: Record<string, string>): string | null {
  switch (rule.type) {
    case 'required':
      return value.length === 0 ? rule.message : null;

    case 'minLength':
      return value.length < (rule.value as number) ? rule.message : null;

    case 'maxLength':
      return value.length > (rule.value as number) ? rule.message : null;

    case 'pattern': {
      // eslint-disable-next-line security/detect-non-literal-regexp
      const regex = rule.value instanceof RegExp ? rule.value : new RegExp(rule.value as string);
      return regex.test(value) ? null : rule.message;
    }


    case 'email':
      return value.length > 0 && !EMAIL_REGEX.test(value) ? rule.message : null;

    case 'match':
      return value !== allValues[rule.matchField ?? ''] ? rule.message : null;

    default:
      return null;
  }
}

/**
 * Create a form validator that applies field-level validation rules, displays
 * inline Bootstrap `invalid-feedback` messages, and clears errors on input.
 * @param {string} formId - The `id` of the form element.
 * @param {FieldRules} rules - Map of field IDs to arrays of validation rules.
 * @returns {FormValidator} A {@link FormValidator} instance bound to the form.
 */
export function createValidator(formId: string, rules: FieldRules): FormValidator {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  if (!form) {
    throw new Error(`Form with id "${formId}" not found.`);
  }

  const fields = new Map<string, HTMLElement>();

  for (const fieldId of Object.keys(rules)) {
    const el = document.getElementById(fieldId);
    if (el) {
      fields.set(fieldId, el);
    }
  }

  /**
   * Get the current values of all registered form fields.
   * @returns {Record<string, string>} Map of field IDs to values.
   */
  function getValues(): Record<string, string> {
    const values: Record<string, string> = {};
    for (const [id, el] of fields) {
      values[id] = getElementValue(el);
    }
    return values;
  }

  /**
   * Validate a single field and update its UI state.
   * @param {string} fieldId - The field ID to validate.
   * @returns {string | null} The error message, or null if valid.
   */
  function validateField(fieldId: string): string | null {
    const el = fields.get(fieldId);
    if (!el) return null;

    const value = getElementValue(el);
    const fieldRules = rules[fieldId];
    if (!fieldRules) return null;

    const allValues = getValues();

    for (const rule of fieldRules) {
      const error = evaluateRule(value, rule, allValues);
      if (error !== null) {
        setValidity(el, false, error);
        return error;
      }
    }

    setValidity(el, true, '');
    return null;
  }

  /**
   * Validate all registered fields.
   * @returns {ValidationResult} Validation result with overall validity and field errors.
   */
  function validate(): ValidationResult {
    const errors: Record<string, string> = {};
    let valid = true;

    for (const fieldId of Object.keys(rules)) {
      const error = validateField(fieldId);
      if (error !== null) {
        errors[fieldId] = error;
        valid = false;
      }
    }

    return { valid, errors };
  }

  /**
   * Clear the validation error on a single field.
   * @param {string} fieldId - The field ID to clear.
   */
  function clearFieldError(fieldId: string): void {
    const el = fields.get(fieldId);
    if (!el) return;
    el.classList.remove('is-invalid');
    el.parentElement?.querySelector('.invalid-feedback')?.remove();
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
    for (const [fieldId, el] of fields) {
      const handler = inputHandlers.get(fieldId);
      if (handler) {
        el.removeEventListener('input', handler);
        el.removeEventListener('blur', handler);
      }
      clearFieldError(fieldId);
    }
    fields.clear();
    inputHandlers.clear();
  }

  for (const [fieldId, el] of fields) {
    const handler = () => {
      const error = validateField(fieldId);
      if (error === null) {
        el.classList.remove('is-invalid');
        el.parentElement?.querySelector('.invalid-feedback')?.remove();
      }
    };
    inputHandlers.set(fieldId, handler);
    el.addEventListener('input', handler);
    el.addEventListener('blur', handler);
  }

  return { validate, validateField, clearErrors, clearFieldError, destroy };
}
