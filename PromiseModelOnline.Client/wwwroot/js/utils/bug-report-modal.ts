import { apiPost } from '../api.ts';
import { showToast } from '../ui/toast.ts';
import { ensureModal } from './html.ts';
import { getFormattedConsoleLogs, clearConsoleLogs } from './console-capture.ts';

interface BugReportFormElements {
    form: HTMLFormElement;
    titleInput: HTMLInputElement;
    descriptionInput: HTMLTextAreaElement;
    errorElement: HTMLElement;
    submitButton: HTMLButtonElement;
}

function getElements(modalElement: HTMLElement): BugReportFormElements | undefined {
    const form = modalElement.querySelector('#bug-report-form') as HTMLFormElement | null;
    const titleInput = modalElement.querySelector('#bug-report-title') as HTMLInputElement | null;
    const descriptionInput = modalElement.querySelector('#bug-report-description') as HTMLTextAreaElement | null;
    const errorElement = modalElement.querySelector('#bug-report-error') as HTMLElement | null;
    const submitButton = modalElement.querySelector('#bug-report-submit') as HTMLButtonElement | null;
    if (!form || !titleInput || !descriptionInput || !errorElement || !submitButton) return;
    return { form, titleInput, descriptionInput, errorElement, submitButton };
}

export function openBugReportModal(): void {
    const modalElement = ensureModal('bug-report-modal', `
        <div class="modal fade" id="bug-report-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <form id="bug-report-form" novalidate>
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-bug me-2"></i>Report a Bug</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label" for="bug-report-title">Title</label>
                                <input id="bug-report-title" class="form-control" type="text" maxlength="200" required placeholder="Brief summary of the issue">
                            </div>
                            <div class="mb-3">
                                <label class="form-label" for="bug-report-description">Description</label>
                                <textarea id="bug-report-description" class="form-control" rows="6" required placeholder="Steps to reproduce, expected vs actual behaviour, and any other relevant details"></textarea>
                            </div>
                            <div id="bug-report-error" class="text-danger small mt-2 d-none"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-danger" id="bug-report-submit">Submit Bug Report</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `);

    if (!modalElement) return;
    const elements = getElements(modalElement);
    if (!elements) return;

    elements.form.replaceWith(elements.form.cloneNode(true));
    const fresh = getElements(modalElement);
    if (!fresh) return;

    fresh.errorElement.classList.add('d-none');
    fresh.submitButton.disabled = false;
    fresh.submitButton.textContent = 'Submit Bug Report';

    fresh.form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = fresh.titleInput.value.trim();
        const description = fresh.descriptionInput.value.trim();

        if (!title) {
            fresh.errorElement.textContent = 'Title is required.';
            fresh.errorElement.classList.remove('d-none');
            fresh.titleInput.focus();
            return;
        }

        if (!description) {
            fresh.errorElement.textContent = 'Description is required.';
            fresh.errorElement.classList.remove('d-none');
            fresh.descriptionInput.focus();
            return;
        }

        const consoleLogs = getFormattedConsoleLogs();
        fresh.submitButton.disabled = true;
        fresh.submitButton.textContent = 'Submitting...';

        try {
            const result = await apiPost<{ issueUrl?: string | null; message?: string }>('/api/bug-reports', { title, description, consoleLogs });
            clearConsoleLogs();
            bootstrap?.Modal?.getOrCreateInstance(modalElement)?.hide();
            if (result?.issueUrl) {
                showToast('Bug report submitted. Thank you!', 'success');
            } else if (result?.message) {
                showToast(result.message, 'warning');
            } else {
                showToast('Bug report submitted.', 'success');
            }
        } catch (error: unknown) {
            console.error('Bug report failed:', error);
            fresh.errorElement.textContent = (error as Record<string, unknown> | undefined)?.message as string || 'Failed to submit bug report.';
            fresh.errorElement.classList.remove('d-none');
        } finally {
            fresh.submitButton.disabled = false;
            fresh.submitButton.textContent = 'Submit Bug Report';
        }
    });

    bootstrap?.Modal?.getOrCreateInstance(modalElement)?.show();
}
