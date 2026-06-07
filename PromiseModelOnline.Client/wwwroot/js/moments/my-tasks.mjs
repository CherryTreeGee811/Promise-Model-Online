import { getMyTasks, updateMomentType } from './api.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { renderEmptyStateSection } from '../utils/empty-table.mjs';
import { navigate } from '../router.mjs';

export function loadMyTasksPage(navContentDiv, contentDiv) {
    const content = document.getElementById('my-tasks-content');
    const errorEl = document.getElementById('error-text');

    getMyTasks()
        .then(moments => {
            if (!moments || moments.length === 0) {
                content.innerHTML = `
                    <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
                        <div class="empty-table-icon"><i class="bi bi-list-task"></i></div>
                        <h5 class="fw-semibold text-secondary mb-1">You have no assigned tasks.</h5>
                        <p class="text-muted mb-2">When a moment is assigned to you, it will appear here.</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <table class="table table-sm table-striped table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Statement</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Effort</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${moments.map(m => `
                            <tr data-moment-id="${m.id}">
                                <td>${escapeHtml(m.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${m.id}" data-current-type="${m.type}" aria-label="Moment type"><option value="Story" ${m.type === 'Story' ? 'selected' : ''}>Story</option><option value="Job" ${m.type === 'Job' ? 'selected' : ''}>Job</option></select></td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td>${m.effortEstimate ?? '–'}</td>
                                <td><a href="/moments/${m.id}" moment-id="${m.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            content.addEventListener('change', async (e) => {
                const target = e.target;
                if (target.matches('.moment-type-select')) {
                    const momentId = parseInt(target.dataset.momentId, 10);
                    const newType = target.value;
                    const previous = target.dataset.currentType || newType;
                    try {
                        await updateMomentType(momentId, newType);
                        target.dataset.currentType = newType;
                    } catch (err) {
                        target.value = previous;
                        console.error('Failed to update moment type:', err);
                    }
                }
            });

            content.querySelectorAll('a[moment-id]').forEach(link => {
                link.addEventListener('click', (e) => {
                    // allow new tab behavior
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    navigate(`/moments/${link.getAttribute('moment-id')}`, navContentDiv, contentDiv);
                });
            });
        })
        .catch(err => {
            errorEl.textContent = 'Failed to load your tasks.';
            console.error(err);
        });
}
