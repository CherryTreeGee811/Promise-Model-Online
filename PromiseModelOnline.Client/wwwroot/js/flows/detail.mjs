import { routeHandler } from '../router.mjs';
import { getFlowById, getMomentsByFlow, updateFlowDescription } from './api.mjs';
import { addMoment } from '../moments/api.mjs';
import { getJourneyById } from '../journeys/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.mjs';

export function loadFlowDetail(flowId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('flow-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('flow-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getFlowById(flowId)
        .then(flow => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
                nodeType: 'flow',
                nodeId: flowId,
                projectIdHint: getGraphProjectIdHintFromUrl(),
            });

            detailDiv.innerHTML = `
                <div class="detail-card flow-detail-card">
                    <h2>${escapeHtml(flow.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea">${escapeHtml(flow.description || '')}</textarea>
                            <div class="field-actions"><button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Journey</th>
                            <td id="flow-journey-cell">
                                <a href="/journeys/${flow.journeyId}" journey-id="${flow.journeyId}" class="detail-link link-primary text-decoration-none fw-semibold">Journey ${flow.journeyId}</a>
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
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button">← Back</button>
                </div>
            `;

            const journeyLink = detailDiv.querySelector('.detail-link[journey-id]');
            if (journeyLink) {
                journeyLink.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    const journeyId = journeyLink.getAttribute('journey-id');
                    window.history.pushState({}, '', `/journeys/${journeyId}`);

                    routeHandler(navContentDiv, contentDiv);
                });
            }

            // Load moments for this flow
            const momentsList = document.getElementById('flow-moments-list');
            getMomentsByFlow(flowId)
                .then(moments => {
                    patchChildMetrics(`flow-${flowId}`, moments);
                    const tbody = renderTableWithInlineAddRow(momentsList, {
                        headers: ['Statement', 'Type', 'Status', 'Actions'],
                        items: moments || [],
                        emptyMessage: 'No moments found for this flow.',
                        renderItemRow: m => `
                            <tr data-moment-id="${m.id}">
                                <td>${escapeHtml(m.statement)}</td>
                                <td>${m.type}</td>
                                <td><span class="badge rounded-pill text-bg-secondary status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td><a href="/moments/${m.id}" moment-id="${m.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,
                        renderAddRow: () => `
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-moment-form" class="inline-add-form">
                                        <input id="add-moment-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Moment Statement...">
                                    </form>
                                </td>
                                <td>
                                    <select id="add-moment-type" class="form-select form-select-sm" form="add-moment-form">
                                        <option value="Story">Story</option>
                                        <option value="Job">Job</option>
                                    </select>
                                </td>
                                <td><span class="status-badge status-todo">Todo</span></td>
                                <td>
                                    <button id="add-moment-submit" type="submit" form="add-moment-form" class="btn btn-sm btn-outline-primary">Add</button>
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
                                        <td><span class="badge rounded-pill text-bg-secondary status-badge status-${(created.status || '').toLowerCase()}">${created.status}</span></td>
                                        <td><a href="/moments/${created.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                    typeSelect.value = 'Story';
                                    patchChildMetrics(`flow-${flowId}`, [...(moments || []), created]);
                                }
                            } catch (err) {
                                msg.textContent = 'Failed to add moment.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
                            }
                        });
                    }

                    momentsList.innerHTML = `
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${moments.map(m => `
                                    <tr>
                                        <td>${m.id}</td>
                                        <td>${escapeHtml(m.statement)}</td>
                                        <td>${m.type}</td>
                                        <td><span class="badge rounded-pill text-bg-secondary status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                        <td><a href="/moments/${m.id}" moment-id="${m.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    momentsList.querySelectorAll('a[moment-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            const momentId = link.getAttribute('moment-id');
                            window.history.pushState({}, '', `/moments/${momentId}`);

                            routeHandler(navContentDiv, contentDiv);
                        });
                    });
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
                    journeyCell.innerHTML = `<a href="/journeys/${journey.id}" journey-id="${journey.id}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(journey.statement)}</a> ${icon}`;
                    
                    const link = journeyCell.querySelector('a.detail-link');
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
                    // leave link as-is
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
                        const updated = await updateFlowDescription(flowId, newDesc);
                        flow.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`flow-${flowId}`, {
                            description: flow.description,
                        });
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
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load flow details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>'\"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;'
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