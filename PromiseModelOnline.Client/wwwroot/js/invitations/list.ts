import { showToast } from '../ui/toast.ts';
import { renderEmptyStateSection } from '../utils/empty-table.ts';

import { getPendingInvitations, acceptInvitation } from './api.ts';

interface Invitation {
  projectName: string;
  level: string;
  permissionId: string | number;
}

/**
 * @returns {HTMLElement} The empty state element
 */
function buildEmptyState(): HTMLElement {
    return renderEmptyStateSection({
        icon: 'bi-envelope',
        title: 'No pending invitations.',
        description: 'When someone invites you to a project, it will appear here.',
    });
}

/**
 * @param {HTMLElement} _contentDiv - Content container
 */
export function loadInvitationsPage(_contentDiv: HTMLElement): void {
    const listDiv = document.querySelector('#invitations-list') as HTMLElement;
    const errorElement = document.querySelector('#error-text') as HTMLElement;

    /**
     *
     */
    async function refresh() {
        try {
            const invitations = await getPendingInvitations() as Invitation[];

            if (!invitations || invitations.length === 0) {
                listDiv.replaceChildren(buildEmptyState());
                return;
            }

            const table = document.createElement('table');
            table.className = 'table table-sm table-striped table-hover align-middle';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headers = ['Project', 'Permission', 'Actions'];
            for (const h of headers) {
                const th = document.createElement('th');
                th.textContent = h;
                headerRow.append(th);
            }
            thead.append(headerRow);
            table.append(thead);

            const tbody = document.createElement('tbody');
            for (const inv of invitations) {
                const tr = document.createElement('tr');

                const tdProject = document.createElement('td');
                tdProject.textContent = inv.projectName;
                tr.append(tdProject);

                const tdPerm = document.createElement('td');
                tdPerm.textContent = inv.level;
                tr.append(tdPerm);

                const tdActions = document.createElement('td');
                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-outline-primary accept-btn';
                button.type = 'button';
                button.dataset.permissionId = String(inv.permissionId);
                button.textContent = 'Accept';
                tdActions.append(button);
                tr.append(tdActions);

                tbody.append(tr);
            }
            table.append(tbody);
            listDiv.replaceChildren(table);

            for (const button of listDiv.querySelectorAll('.accept-btn')) {
                button.addEventListener('click', async () => {
                    const id = Number((button as HTMLElement).dataset.permissionId!);
                    try {
                        await acceptInvitation(id);
                        const y = window.scrollY;
                        const row = button.closest('tr');
                        row?.remove();

                        const remaining = listDiv.querySelectorAll(':scope tbody tr').length;
                        if (remaining === 0) {
                            listDiv.replaceChildren(buildEmptyState());
                        }
                        window.scrollTo(0, y);
                    } catch (error) {
                        showToast('Failed to accept invitation', 'error');
                        console.error(error);
                    }
                });
            }
        } catch {
            if (errorElement) errorElement.textContent = 'Failed to load invitations.';
        }
    }

    void refresh();
}
