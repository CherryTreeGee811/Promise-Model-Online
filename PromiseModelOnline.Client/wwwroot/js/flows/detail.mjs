import { getFlowById, getMomentsByFlow, updateFlowDescription } from './api.mjs';
import { addMoment } from '../moments/api.mjs';
import { getJourneyById } from '../journeys/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';

export function loadFlowDetail(flowId, contentDiv) {
    const detailDiv = document.getElementById('flow-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading flow...';
    errorEl.textContent = '';

    getFlowById(flowId)
        .then(flow => {
            loadingEl.textContent = '';
            detailDiv.innerHTML = `
                <div class="flow-detail-card">
                    <h2>${escapeHtml(flow.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4" style="width:100%">${escapeHtml(flow.description || '')}</textarea>
                            <div style="margin-top:6px"><button id="save-desc" class="save-btn">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Journey</th>
                            <td id="flow-journey-cell">
                                <a href="/journeys/${flow.journeyId}" class="detail-link">Journey ${flow.journeyId}</a>
                            </td>
                        </tr>
                        <tr><th>Status</th><td id="flow-status-cell">${getStatusIcon(flow.statusColor)}</td></tr>
                        <tr><th>Created</th><td>${new Date(flow.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Moments</h3>
                    <div id="flow-moments-list">
                        <p>Loading moments...</p>
                    </div>
                    <div id="flow-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            // Load moments for this flow
            const momentsList = document.getElementById('flow-moments-list');
            getMomentsByFlow(flowId)
                .then(moments => {
                    const tbody = renderTableWithInlineAddRow(momentsList, {
                        headers: ['Statement', 'Type', 'Status', 'Actions'],
                        items: moments || [],
                        emptyMessage: 'No moments found for this flow.',
                        renderItemRow: m => `
                            <tr data-moment-id="${m.id}">
                                <td>${escapeHtml(m.statement)}</td>
                                <td>${m.type}</td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td><a href="/moments/${m.id}" class="view-btn">View</a></td>
                            </tr>
                        `,
                        renderAddRow: () => `
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-moment-form" class="inline-add-form" style="margin:0;">
                                        <input id="add-moment-statement" type="text" maxlength="500" required placeholder="New Moment Statement..." style="width:100%;">
                                    </form>
                                </td>
                                <td>
                                    <select id="add-moment-type" form="add-moment-form" style="width:100%;">
                                        <option value="Story">Story</option>
                                        <option value="Job">Job</option>
                                    </select>
                                </td>
                                <td><span class="status-badge status-todo">Todo</span></td>
                                <td>
                                    <button id="add-moment-submit" type="submit" form="add-moment-form" class="view-btn">Add</button>
                                    <span id="add-moment-msg"></span>
                                </td>
                            </tr>
                        `,
                    });

                    const form = momentsList.querySelector('#add-moment-form');
                    const statementInput = momentsList.querySelector('#add-moment-statement');
                    const typeSelect = momentsList.querySelector('#add-moment-type');
                    const msg = momentsList.querySelector('#add-moment-msg');
                    const submitBtn = momentsList.querySelector('#add-moment-submit');

                    if (form && statementInput && typeSelect && msg && submitBtn) {
                        form.addEventListener('submit', async event => {
                            event.preventDefault();
                            msg.textContent = '';

                            const statement = statementInput.value.trim();
                            if (!statement) {
                                msg.textContent = 'Statement is required.';
                                return;
                            }

                            submitBtn.disabled = true;

                            try {
                                const created = await addMoment({
                                    statement,
                                    flowId,
                                    type: typeSelect.value,
                                    status: 'Todo',
                                    displayOrder: (moments || []).length + 1,
                                });

                                if (created) {
                                    removeInlineEmptyRow(tbody);
                                    const row = document.createElement('tr');
                                    row.dataset.momentId = created.id;
                                    row.innerHTML = `
                                        <td>${escapeHtml(created.statement)}</td>
                                        <td>${created.type}</td>
                                        <td><span class="status-badge status-${(created.status || '').toLowerCase()}">${created.status}</span></td>
                                        <td><a href="/moments/${created.id}" class="view-btn">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                    typeSelect.value = 'Story';
                                }
                            } catch (err) {
                                msg.textContent = 'Failed to add moment.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
                            }
                        });
                    }
                })
                .catch(() => {
                    momentsList.innerHTML = '<p class="error">Failed to load moments.</p>';
                });

            // Back button event
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Load parent journey to show its status emoji
            const journeyCell = document.getElementById('flow-journey-cell');
            getJourneyById(flow.journeyId)
                .then(journey => {
                    const icon = getStatusIcon(journey.statusColor);
                    journeyCell.innerHTML = `<a href="/journeys/${journey.id}" class="detail-link">${escapeHtml(journey.statement)}</a> ${icon}`;
                })
                .catch(() => {
                    // leave link as-is
                });

            // Description save handler
            const saveBtn = document.getElementById('save-desc');
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = await updateFlowDescription(flowId, newDesc);
                        flow.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        descMsg.textContent = 'Saved';
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }

            const commentsContainer = document.getElementById('flow-comments');
            loadComments(commentsContainer, 'Flow', flowId);

            getJourneyById(flow.journeyId)
                .then(journey => getEpicById(journey.epicId))
                .then(epic => resolveProjectIdForPromise(epic.productPromiseId, getGraphProjectIdHintFromUrl()))
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `flow-${flow.id}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for flow detail', error);
                });
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load flow details.';
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