import { routeHandler } from '../router.mjs';
import { getJourneyById, getFlowsByJourney, updateJourney } from './api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { loadComments } from '../comments/comments.mjs';

export function loadJourneyDetail(journeyId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('journey-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading journey...';
    errorEl.textContent = '';

    getJourneyById(journeyId)
        .then(journey => {
            loadingEl.textContent = '';
            detailDiv.innerHTML = `
                <div class="journey-detail-card">
                    <h2>${escapeHtml(journey.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${journey.id}</td></tr>
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4">${escapeHtml(journey.description || '')}</textarea>
                            <div class="save-btn-div"><button id="save-desc" class="save-btn">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Epic</th>
                            <td id="journey-epic-cell">
                                <a href="/epics/${journey.epicId}" epic-id="${journey.epicId}" class="detail-link">Epic ${journey.epicId}</a>
                            </td>
                        </tr>
                        <tr><th>Status</th><td id="journey-status-cell">${getStatusIcon(journey.statusColor)}</td></tr>
                        <tr><th>Created</th><td>${new Date(journey.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${journey.updatedAt ? new Date(journey.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Flows</h3>
                    <div id="journey-flows-list">
                        <p>Loading flows...</p>
                    </div>
                    <div id="journey-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            const epicLink = detailDiv.querySelector('a.detail-link[epic-id]');
            if (epicLink) {
                epicLink.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    const epicId = epicLink.getAttribute('epic-id');
                    window.history.pushState({}, '', `/epics/${epicId}`);

                    routeHandler(navContentDiv, contentDiv);
                });
            }
            
            const flowsList = document.getElementById('journey-flows-list');
            getFlowsByJourney(journeyId)
                .then(flows => {
                    if (!flows || flows.length === 0) {
                        flowsList.innerHTML = '<p class="no-items">No flows found for this journey.</p>';
                        return;
                    }
                    flowsList.innerHTML = `
                        <table class="promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${flows.map(f => `
                                    <tr>
                                        <td>${f.id}</td>
                                        <td>${escapeHtml(f.statement)}</td>
                                        <td><a href="/flows/${f.id}" flow-id="${f.id}" class="view-btn">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    flowsList.querySelectorAll('.view-btn[flow-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;
                            e.preventDefault();
                            const flowId = link.getAttribute('flow-id');
                            window.history.pushState({}, '', `/flows/${flowId}`);

                            routeHandler(navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    flowsList.innerHTML = '<p class="error">Failed to load flows.</p>';
                });

            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Load epic to show its status emoji
            const epicCell = document.getElementById('journey-epic-cell');
            getEpicById(journey.epicId)
                .then(epic => {
                    const icon = getStatusIcon(epic.statusColor);
                    epicCell.innerHTML = `<a href="/epics/${epic.id}" epic-id="${epic.id}" class="detail-link">${escapeHtml(epic.statement)}</a> ${icon}`;
                    const link = epicCell.querySelector('a.detail-link');

                    if (link) {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            const href = link.getAttribute('href');
                            window.history.pushState({}, '', href);

                            routeHandler(navContentDiv, contentDiv);
                        });
                    }
                })
                .catch(() => {
                    // keep default link
                });

            // Description save handler
            const saveBtn = document.getElementById('save-desc');
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = { ...journey, description: newDesc };
                        await updateJourney(updated);
                        descMsg.textContent = 'Saved';
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }

            const commentsContainer = document.getElementById('journey-comments');
            loadComments(commentsContainer, 'Journey', journeyId);

            loadingEl.textContent = '';
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load journey details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '🟢';
    if (normalized.includes('black') || normalized.includes('blocked')) return '⚫️';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '🟠';
    if (normalized.includes('red') || normalized.includes('todo')) return '🔴';
    return '⚪';
}