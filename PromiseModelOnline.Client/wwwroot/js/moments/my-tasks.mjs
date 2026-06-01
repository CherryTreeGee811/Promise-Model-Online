import { getMyTasks } from './api.mjs';
import { navigate } from "../router.mjs";
import { escapeHtml } from "../utils/html.mjs";

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

            content.querySelectorAll(".view-btn[moment-id]").forEach(link => {
                link.addEventListener('click', (e) => {
                    // allow new tab behavior
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;
                    
                    e.preventDefault();

                    const momentId = link.getAttribute('moment-id');
                    navigate(`/moments/${momentId}`, navContentDiv, contentDiv);
                });
            });
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load your tasks.';
            console.error(err);
        });
}