import { getProject } from '../projects/api.ts';
import { getStridesByIteration } from '../strides/api.ts';
import { drawBurndownChart } from '../utils/burndown.ts';
import { openIterationCreateModal } from '../utils/iteration-create-modal.ts';

import { getIterations, getBurndown } from './api.ts';

interface Iteration {
    id: number;
    name: string;
    createdAt: string;
}

interface Stride {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    durationDays: number;
}

interface ProjectData {
    name?: string;
}

/**
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString: string): string {
    return dateString ? new Date(dateString).toLocaleDateString('en-CA') : 'N/A';
}

/**
 * @param {string} message - Loading message text
 * @returns {HTMLElement} Loading spinner element
 */
function buildLoadingSpinner(message: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex w-100 justify-content-center align-items-center py-5';
    wrapper.setAttribute('aria-live', 'polite');
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', message);
    const srSpan = document.createElement('span');
    srSpan.className = 'visually-hidden';
    srSpan.textContent = message;
    spinner.append(srSpan);
    wrapper.append(spinner);
    return wrapper;
}

/**
 * @param {string} icon - Bootstrap icon class
 * @param {string} title - Title text
 * @param {string} [description] - Optional description text
 * @returns {HTMLElement} Empty state element
 */
function buildEmptyState(icon: string, title: string, description?: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'no-items d-flex flex-column align-items-center gap-3 py-5';
    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-table-icon';
    const iconElement = document.createElement('i');
    iconElement.className = `bi ${icon}`;
    iconDiv.append(iconElement);
    div.append(iconDiv);
    const titleElement = document.createElement('h5');
    titleElement.className = 'fw-semibold text-secondary mb-1';
    titleElement.textContent = title;
    div.append(titleElement);
    if (description) {
        const descElement = document.createElement('p');
        descElement.className = 'text-muted mb-2';
        descElement.textContent = description;
        div.append(descElement);
    }
    return div;
}

/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {{ permission: string } | undefined} permission - Permission object
 */
async function loadBurndownChart(owner: string, project: string, iterationId: number, burndownCanvas: HTMLElement | null): Promise<void> {
    const BURNDOWN_TIMEOUT_MS = 10_000;
    const timeoutPromise = new Promise<{ date: string; remainingEffort: number }[]>((_, reject) => {
        setTimeout(() => reject(new Error('Burndown request timed out')), BURNDOWN_TIMEOUT_MS);
    });
    try {
        const points = await Promise.race([getBurndown(owner, project, iterationId) as Promise<{ date: string; remainingEffort: number }[]>, timeoutPromise]);
        if (points && points.length > 0) {
            if (burndownCanvas) void drawBurndownChart(burndownCanvas, points);
        } else {
            if (burndownCanvas) burndownCanvas.replaceChildren(buildEmptyState(
                'bi-graph-down',
                'No burndown data available for this iteration.',
                'Burndown data will appear once moments have status updates.',
            ));
        }
    } catch (error) {
        console.error('Iteration burndown error', error);
        if (burndownCanvas) {
            burndownCanvas.replaceChildren();
            const p = document.createElement('p');
            p.className = 'error';
            p.textContent = 'Failed to load iteration burndown.';
            burndownCanvas.append(p);
        }
    }
}

function showIterationView(iteration: Iteration, viewDiv: HTMLElement | null, detailDiv: HTMLElement | null, burndownCanvas: HTMLElement | null, strideDetailsDiv: HTMLElement | null, owner: string, project: string): void {
    const iterationId = iteration.id;
    if (viewDiv) viewDiv.classList.add('d-none');
    if (detailDiv) detailDiv.classList.remove('d-none');
    const titleElement = document.querySelector('#iteration-title') as HTMLElement;
    if (titleElement) titleElement.textContent = iteration.name;
    if (burndownCanvas) burndownCanvas.replaceChildren(buildLoadingSpinner('Loading burndown chart'));
    if (strideDetailsDiv) strideDetailsDiv.replaceChildren(buildLoadingSpinner('Loading strides'));
    void loadBurndownChart(owner, project, iterationId, burndownCanvas);
}

async function loadIterationData(owner: string, project: string, errorElement: HTMLElement | null, listDiv: HTMLElement | null): Promise<{ projectData: ProjectData | undefined; iterations: Iteration[] } | undefined> {
    try {
        return await loadIterationsWithTimeout(owner, project);
    } catch {
        if (errorElement) errorElement.textContent = 'Error loading iterations.';
        if (listDiv) listDiv.replaceChildren();
        return;
    }
}

function renderIterationList(iterations: Iteration[], listDiv: HTMLElement | null, formatDate: (d: string) => string, showDetail: (iteration: Iteration) => Promise<void>): void {
    try {
        iterations.sort((a, b) => b.id - a.id);
        const table = buildIterationsTable(iterations, formatDate);
        if (listDiv) listDiv.replaceChildren(table);
        bindIterationViewButtons(iterations, showDetail);
    } catch (error) {
        if (listDiv) listDiv.replaceChildren();
        console.error(error);
    }
}

function setupIterationCreateButton(button: HTMLElement | null, canEdit: boolean, owner: string, project: string, permission: { permission: string } | undefined): void {
    if (!button) return;
    if (!canEdit) {
        button.classList.add('d-none');
    } else if (button.dataset.bound !== '1') {
        button.dataset.bound = '1';
        button.addEventListener('click', async () => {
            openIterationCreateModal(owner, project, () => loadIterationHistory(owner, project, permission));
        });
    }
}

async function loadIterationsWithTimeout(owner: string, project: string): Promise<{ projectData: ProjectData | undefined; iterations: Iteration[] }> {
    const LOAD_TIMEOUT_MS = 15_000;

    const listTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Iteration list request timed out')), LOAD_TIMEOUT_MS);
    });

    const projectPromise = (async (): Promise<ProjectData | undefined> => {
        try {
            return await getProject(owner, project) as ProjectData;
        } catch {}
    })();

    const [projectData, iterations] = await Promise.race([
        Promise.all([
            projectPromise,
            getIterations(owner, project) as Promise<Iteration[]>,
        ]),
        listTimeoutPromise,
    ]) as [ProjectData | undefined, Iteration[]];

    return { projectData, iterations };
}

/** @param {Iteration[]} iterationList @param {HTMLElement | null} listDiv @returns {boolean} true if empty */
/** @param {Iteration} iteration @param {(d: string) => string} formatDate */
function createIterationRow(iteration: Iteration, formatDate: (d: string) => string): HTMLTableRowElement {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = iteration.name;
    tr.append(tdName);
    const tdCreated = document.createElement('td');
    tdCreated.textContent = formatDate(iteration.createdAt);
    tr.append(tdCreated);
    const tdActions = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'view-iteration-btn btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2';
    button.type = 'button';
    button.dataset.iterationId = String(iteration.id);
    const iconI = document.createElement('i');
    iconI.className = 'bi bi-eye';
    iconI.setAttribute('aria-hidden', 'true');
    button.append(iconI, ' View');
    tdActions.append(button);
    tr.append(tdActions);
    return tr;
}

function isEmptyIterations(iterationList: Iteration[], listDiv: HTMLElement | null): boolean {
    if (!iterationList || iterationList.length === 0) {
        if (listDiv) listDiv.replaceChildren(buildEmptyState(
            'bi-arrow-repeat',
            'No iterations found.',
            'Create an iteration to start organizing your strides.',
        ));
        return true;
    }
    return false;
}

/** @param {Iteration[]} iterations */
function buildIterationsTable(iterations: Iteration[], formatDate: (d: string) => string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive';
    const table = document.createElement('table');
    table.className = 'table table-sm table-striped table-hover align-middle';

    const thead = document.createElement('thead');
    thead.className = 'table-light';
    const headerRow = document.createElement('tr');
    for (const header of ['Name', 'Created', 'Actions']) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = header;
        headerRow.append(th);
    }
    thead.append(headerRow);
    table.append(thead);

    const tbody = document.createElement('tbody');
    for (const iteration of iterations) {
        tbody.append(createIterationRow(iteration, formatDate));
    }
    table.append(tbody);
    wrapper.append(table);
    return wrapper;
}

function bindIterationViewButtons(iterations: Iteration[], showDetail: (iteration: Iteration) => Promise<void>): void {
    for (const button of document.querySelectorAll('.view-iteration-btn')) {
        button.addEventListener('click', () => {
            const id = parseInt((button as HTMLElement).dataset.iterationId!, 10);
            const iteration = iterations.find(item => item.id === id);
            void showDetail(iteration ?? { id, name: 'Iteration #' + id, createdAt: '' });
        });
    }
}

export async function loadIterationHistory(owner: string, project: string, permission: { permission: string } | undefined): Promise<void> {
    const viewDiv = document.querySelector('#iterations-view') as HTMLElement;
    const listDiv = document.querySelector('#iterations-list') as HTMLElement;
    const detailDiv = document.querySelector('#iteration-detail') as HTMLElement;
    const errorElement = document.querySelector('#error-text') as HTMLElement;
    const projectTitle = document.querySelector('#project-title') as HTMLElement;
    const iterationCreateButton = document.querySelector('#create-iteration-btn') as HTMLElement;

    const canEdit = permission?.permission === 'Edit';

    if (detailDiv) detailDiv.classList.add('d-none');
    if (errorElement) errorElement.textContent = '';

    setupIterationCreateButton(iterationCreateButton, canEdit, owner, project, permission);

    if (listDiv) listDiv.replaceChildren(buildLoadingSpinner('Loading iterations'));

    const data = await loadIterationData(owner, project, errorElement, listDiv);
    if (!data) return;

    const { projectData, iterations } = data;

    if (projectTitle) {
        projectTitle.textContent = projectData?.name ?? `Project ${owner}/${project}`;
    }

    if (isEmptyIterations(iterations, listDiv)) return;

    renderIterationList(iterations, listDiv, formatDate, showIterationDetail);

    /**
     * @param {Iteration} iteration - The iteration to show
     */
    async function showIterationDetail(iteration: Iteration): Promise<void> {
        const iterationId = iteration.id;

        showIterationView(iteration, viewDiv, detailDiv, burndownCanvas, strideDetailsDiv, owner, project);

        try {
            const strides = await getStridesByIteration(owner, project, iterationId) as Stride[];
            if (!strides || strides.length === 0) {
                if (strideDetailsDiv) strideDetailsDiv.replaceChildren(buildEmptyState(
                    'bi-kanban',
                    'No strides in this iteration.',
                    'Create strides to organize your work within this iteration.',
                ));
                return;
            }

            strides.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-responsive';
            const table = document.createElement('table');
            table.className = 'table table-sm table-striped table-hover align-middle mb-0';

            const thead = document.createElement('thead');
            thead.className = 'table-light';
            const headerRow = document.createElement('tr');
            const headers = ['Stride', 'Start Date', 'End Date', 'Duration'];
            for (const header of headers) {
                const th = document.createElement('th');
                th.scope = 'col';
        th.textContent = header;
                headerRow.append(th);
            }
            thead.append(headerRow);
            table.append(thead);

            const tbody = document.createElement('tbody');
            for (const s of strides) {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = s.name;
                tr.append(tdName);

                const tdStart = document.createElement('td');
                tdStart.textContent = formatDate(s.startDate);
                tr.append(tdStart);

                const tdEnd = document.createElement('td');
                tdEnd.textContent = formatDate(s.endDate);
                tr.append(tdEnd);

                const tdDuration = document.createElement('td');
                tdDuration.textContent = `${s.durationDays} days`;
                tr.append(tdDuration);

                tbody.append(tr);
            }
            table.append(tbody);
            tableWrapper.append(table);
            if (strideDetailsDiv) strideDetailsDiv.replaceChildren(tableWrapper);
        } catch (error) {
            if (strideDetailsDiv) {
                strideDetailsDiv.replaceChildren();
                const p = document.createElement('p');
                p.className = 'error';
                p.textContent = 'Failed to load strides.';
                strideDetailsDiv.append(p);
            }
            console.error(error);
        }
    }

    const backButton = document.querySelector('#back-to-iterations-btn') as HTMLElement;
    if (backButton) {
        backButton.addEventListener('click', () => {
            if (detailDiv) detailDiv.classList.add('d-none');
            if (viewDiv) viewDiv.classList.remove('d-none');
        });
    }
}
