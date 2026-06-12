<<<<<<< HEAD
import { getMyAssignedMoments, updateMomentType } from './api.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { renderEmptyStateSection } from '../utils/empty-table.mjs';
import { navigate } from '../router.mjs';

export function loadMyTasksPage(navContentDiv, contentDiv) {
    const content = document.getElementById('my-tasks-content');
    const errorEl = document.getElementById('error-text');

    getMyAssignedMoments()
        .then(moments => {
            if (!moments || moments.length === 0) {
                content.innerHTML = renderEmptyStateSection({
                    icon: 'bi-list-task',
                    title: 'You have no assigned tasks.',
                    description: 'When a moment is assigned to you, it will appear here.',
                });
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
                            <tr data-moment-id="${m.sequenceNumber}" data-owner="${m.ownerSlug || ''}" data-project="${m.projectSlug || ''}">
                                <td>${escapeHtml(m.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${m.sequenceNumber}" data-current-type="${m.type}" aria-label="Moment type"><option value="Story" ${m.type === 'Story' ? 'selected' : ''}>Story</option><option value="Job" ${m.type === 'Job' ? 'selected' : ''}>Job</option></select></td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td>${m.effortEstimate ?? '–'}</td>
                                <td>${m.ownerSlug && m.projectSlug
                                    ? `<a href="/${m.ownerSlug}/${m.projectSlug}/moments/${m.sequenceNumber}" moment-seq="${m.sequenceNumber}" data-owner="${m.ownerSlug}" data-project="${m.projectSlug}" class="btn btn-sm btn-outline-primary">View</a>`
                                    : `<a href="/moments/${m.sequenceNumber}" moment-seq="${m.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a>`}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            content.addEventListener('change', async (e) => {
                const target = e.target;
                if (target.matches('.moment-type-select')) {
                    const row = target.closest('tr');
                    const owner = row?.dataset.owner;
                    const project = row?.dataset.project;
                    if (!owner || !project) {
                        console.error('Cannot determine project for moment type update');
                        return;
                    }
                    const momentId = parseInt(target.dataset.momentId, 10);
                    const newType = target.value;
                    const previous = target.dataset.currentType || newType;
                    try {
                        await updateMomentType(owner, project, momentId, newType);
                        target.dataset.currentType = newType;
                    } catch (err) {
                        target.value = previous;
                        console.error('Failed to update moment type:', err);
                    }
                }
            });

            content.querySelectorAll('a[moment-seq]').forEach(link => {
                link.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;
                    e.preventDefault();
                    const owner = link.getAttribute('data-owner');
                    const project = link.getAttribute('data-project');
                    const seq = link.getAttribute('moment-seq');
                    navigate(`/${owner}/${project}/moments/${seq}`, navContentDiv, contentDiv);
                });
            });
        })
        .catch(err => {
            errorEl.textContent = 'Failed to load your tasks.';
            console.error(err);
        });
}
||||||| 1bedf4f
=======
import { getMyTasks } from './api.mjs';

export function loadMyTasksPage(navContentDiv, contentDiv) {
    const content = document.getElementById('my-tasks-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading your tasks…';

    getMyTasks()
        .then(moments => {
            loadingEl.textContent = '';
            if (!moments || moments.length === 0) {
                content.innerHTML = '<p class="no-items">You have no assigned tasks.</p>';
                return;
            }

            content.innerHTML = `
                <table class="promisemodel-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Statement</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Effort</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${moments.map(m => `
                            <tr>
                                <td>${m.id}</td>
                                <td>${escapeHtml(m.statement)}</td>
                                <td>${m.type}</td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td>${m.effortEstimate ?? '–'}</td>
                                <td><a href="/moments/${m.id}" moment-id="${m.id}" class="view-btn">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            content.querySelectorAll('.detail-link[moment-id]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();

                    // allow new tab behavior
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    const momentId = link.getAttribute('moment-id');
                    window.history.pushState({}, '', `/moments/${momentId}`);

                    routeHandler(navContentDiv, contentDiv);
                });
            });
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load your tasks.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
