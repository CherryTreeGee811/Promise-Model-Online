import { getMyTasks } from './api.mjs';
import { routeHandler } from '../router.mjs';

export function loadMyTasksPage(navContentDiv, contentDiv) {
    const content = document.getElementById('my-tasks-content');
    const errorEl = document.getElementById('error-text');

    getMyTasks()
        .then(moments => {
            if (!moments || moments.length === 0) {
                content.innerHTML = '<p class="no-items">You have no assigned tasks.</p>';
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
                            <tr>
                                <td>${escapeHtml(m.statement)}</td>
                                <td>${m.type}</td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td>${m.effortEstimate ?? '–'}</td>
                                <td><a href="/moments/${m.id}" moment-id="${m.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            content.querySelectorAll('a[moment-id]').forEach(link => {
                link.addEventListener('click', (e) => {
                    // allow new tab behavior
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    const momentId = link.getAttribute('moment-id');
                    window.history.pushState({}, '', `/moments/${momentId}`);

                    routeHandler(navContentDiv, contentDiv);
                });
            });
        })
        .catch(err => {
            errorEl.textContent = 'Failed to load your tasks.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}