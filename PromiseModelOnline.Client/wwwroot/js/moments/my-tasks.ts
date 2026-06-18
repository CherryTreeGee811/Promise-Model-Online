import { navigate } from '../router.ts';

import { getMyAssignedMoments, updateMomentType } from './api.ts';

interface MyTaskMoment {
    sequenceNumber: number;
    statement: string;
    type: string;
    status: string;
    effortEstimate?: string;
    ownerSlug?: string;
    projectSlug?: string;
}

/**
 * @returns {HTMLElement} Empty state element
 */
function buildEmptyState(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'no-items d-flex flex-column align-items-center gap-3 py-5';
    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-table-icon';
    const icon = document.createElement('i');
    icon.className = 'bi bi-list-task';
    iconDiv.append(icon);
    div.append(iconDiv);
    const title = document.createElement('h5');
    title.className = 'fw-semibold text-secondary mb-1';
    title.textContent = 'You have no assigned tasks.';
    div.append(title);
    const desc = document.createElement('p');
    desc.className = 'text-muted mb-2';
    desc.textContent = 'When a moment is assigned to you, it will appear here.';
    div.append(desc);
    return div;
}

/**
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 */
export async function loadMyTasksPage(navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const content = document.querySelector('#my-tasks-content') as HTMLElement;
    if (!content) return;

    const errorElement = document.querySelector('#error-text') as HTMLElement;

    try {
        const moments = await getMyAssignedMoments() as MyTaskMoment[];

        if (!moments || moments.length === 0) {
            content.replaceChildren(buildEmptyState());
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-sm table-striped table-hover align-middle';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Statement', 'Type', 'Status', 'Effort', 'Actions'];
        for (const h of headers) {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.append(th);
        }
        thead.append(headerRow);
        table.append(thead);

        const tbody = document.createElement('tbody');
        for (const m of moments) {
            const tr = document.createElement('tr');
            tr.dataset.momentId = String(m.sequenceNumber);
            tr.dataset.owner = m.ownerSlug || '';
            tr.dataset.project = m.projectSlug || '';

            const tdStatement = document.createElement('td');
            tdStatement.textContent = m.statement;
            tr.append(tdStatement);

            const tdType = document.createElement('td');
            const select = document.createElement('select');
            select.className = 'form-select form-select-sm moment-type-select';
            select.dataset.momentId = String(m.sequenceNumber);
            select.dataset.currentType = m.type;
            select.setAttribute('aria-label', 'Moment type');
            const optStory = document.createElement('option');
            optStory.value = 'Story';
            optStory.textContent = 'Story';
            if (m.type === 'Story') optStory.selected = true;
            select.append(optStory);
            const optJob = document.createElement('option');
            optJob.value = 'Job';
            optJob.textContent = 'Job';
            if (m.type === 'Job') optJob.selected = true;
            select.append(optJob);
            tdType.append(select);
            tr.append(tdType);

            const tdStatus = document.createElement('td');
            const statusSpan = document.createElement('span');
            statusSpan.className = `status-badge status-${(m.status || '').toLowerCase()}`;
            statusSpan.textContent = m.status;
            tdStatus.append(statusSpan);
            tr.append(tdStatus);

            const tdEffort = document.createElement('td');
            tdEffort.textContent = m.effortEstimate ?? '\u{2013}';
            tr.append(tdEffort);

            const tdActions = document.createElement('td');
            if (m.ownerSlug && m.projectSlug) {
                const a = document.createElement('a');
                a.href = `/${m.ownerSlug}/${m.projectSlug}/moments/${m.sequenceNumber}`;
                a.setAttribute('moment-seq', String(m.sequenceNumber));
                a.dataset.owner = m.ownerSlug;
                a.dataset.project = m.projectSlug;
                a.className = 'btn btn-sm btn-outline-primary';
                a.textContent = 'View';
                tdActions.append(a);
            } else {
                const a = document.createElement('a');
                a.href = `/moments/${m.sequenceNumber}`;
                a.setAttribute('moment-seq', String(m.sequenceNumber));
                a.className = 'btn btn-sm btn-outline-primary';
                a.textContent = 'View';
                tdActions.append(a);
            }
            tr.append(tdActions);

            tbody.append(tr);
        }
        table.append(tbody);
        content.replaceChildren(table);

        content.addEventListener('change', async (event) => {
            const target = event.target as HTMLElement;
            if (target.matches('.moment-type-select')) {
                const row = target.closest('tr') as HTMLElement | null;
                const owner = row?.dataset.owner;
                const project = row?.dataset.project;
                if (!owner || !project) {
                    console.error('Cannot determine project for moment type update');
                    return;
                }
                const momentId = parseInt(target.dataset.momentId ?? '', 10);
                const selectElement = target as HTMLSelectElement;
                const newType = selectElement.value;
                const previous = target.dataset.currentType || newType;
                try {
                    await updateMomentType(owner, project, momentId, newType);
                    target.dataset.currentType = newType;
                } catch (error) {
                    selectElement.value = previous;
                    console.error('Failed to update moment type:', error);
                }
            }
        });

        for (const link of content.querySelectorAll('a[moment-seq]') as NodeListOf<HTMLAnchorElement>) {
            link.addEventListener('click', (event: MouseEvent) => {
                if (event.ctrlKey || event.metaKey || event.button === 1) return;
                event.preventDefault();
                const owner = link.dataset.owner;
                const project = link.dataset.project;
                const seq = link.getAttribute('moment-seq');
                void navigate(`/${owner}/${project}/moments/${seq}`, navContentDiv, contentDiv);
            });
        }
    } catch (error) {
        if (errorElement) errorElement.textContent = 'Failed to load your tasks.';
        console.error(error);
    }
}
