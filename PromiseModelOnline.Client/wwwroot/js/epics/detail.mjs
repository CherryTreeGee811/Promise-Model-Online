import { routeHandler } from '../router.mjs';
import { getEpicById, getJourneysByEpic, updateEpicDescription } from './api.mjs';
import { addJourney } from '../journeys/api.mjs';
import { getPromiseById } from '../promises/api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.mjs';

export function loadEpicDetail(epicId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('epic-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('epic-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getEpicById(epicId)
        .then(epic => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
                nodeType: 'epic',
                nodeId: epicId,
                projectIdHint: getGraphProjectIdHintFromUrl(),
            });

            detailDiv.innerHTML = `
                <div class="detail-card epic-detail-card">
                    <h2>${escapeHtml(epic.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea">${escapeHtml(epic.description || '')}</textarea>
                            <div class="field-actions"><button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Parent Promise</th>
                            <td id="epic-parent-promise">Loading…</td>
                        </tr>
                        <tr><th>Status</th><td id="epic-status-cell">${getStatusIcon(epic.statusColor)}</td></tr>
                        <tr><th>Created</th><td>${new Date(epic.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${epic.updatedAt ? new Date(epic.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Journeys</h3>
                    <div id="epic-journeys-list">
                        <p>Loading journeys…</p>
                    </div>
                    <div id="epic-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button">← Back</button>
                </div>
            `;

            // Load parent promise name asynchronously and show its status emoji
            const parentCell = document.getElementById('epic-parent-promise');
            getPromiseById(epic.productPromiseId)
                .then(promise => {
                    const icon = getStatusIcon(promise.statusColor);
                    parentCell.innerHTML = `<a href="/promises/${promise.id}" promise-id="${promise.id}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(promise.statement)}</a> ${icon}`;

                    const link = parentCell.querySelector('a.detail-link');

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
                    parentCell.textContent = `Promise ${epic.productPromiseId}`;
                });

            // Load journeys
            const journeysList = document.getElementById('epic-journeys-list');
            getJourneysByEpic(epicId)
                .then(journeys => {
                    patchChildMetrics(`epic-${epicId}`, journeys);
                    const tbody = renderTableWithInlineAddRow(journeysList, {
                        headers: ['Statement', 'Actions'],
                        items: journeys || [],
                        emptyMessage: 'No journeys found for this epic.',
                        renderItemRow: j => `
                            <tr data-journey-id="${j.id}">
                                <td>${escapeHtml(j.statement)}</td>
                                <td><a href="/journeys/${j.id}" journey-id="${j.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,
                        renderAddRow: () => `
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-journey-form" class="inline-add-form">
                                        <input id="add-journey-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Journey Statement...">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-journey-submit" type="submit" form="add-journey-form" class="btn btn-sm btn-outline-primary">Add</button>
                                    <span id="add-journey-msg"></span>
                                </td>
                            </tr>
                        `,
                    });

                    const form = journeysList.querySelector('#add-journey-form');
                    const statementInput = journeysList.querySelector('#add-journey-statement');
                    const msg = journeysList.querySelector('#add-journey-msg');
                    const submitBtn = journeysList.querySelector('#add-journey-submit');

                    if (form && statementInput && msg && submitBtn) {
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
                                const created = await addJourney({
                                    statement,
                                    epicId,
                                    displayOrder: (journeys || []).length + 1,
                                });

                                if (created) {
                                    removeInlineEmptyRow(tbody);
                                    const row = document.createElement('tr');
                                    row.dataset.journeyId = created.id;
                                    row.innerHTML = `
                                        <td>${escapeHtml(created.statement)}</td>
                                        <td><a href="/journeys/${created.id}" journey-id="${created.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                    patchChildMetrics(`epic-${epicId}`, [...(journeys || []), created]);
                                }
                            } catch (err) {
                                msg.textContent = 'Failed to add journey.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
                            }
                        });
                    }

                    journeysList.innerHTML = `
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${journeys.map(j => `
                                    <tr>
                                        <td>${j.id}</td>
                                        <td>${escapeHtml(j.statement)}</td>
                                        <td><a href="/journeys/${j.id}" journey-id="${j.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    journeysList.querySelectorAll('a[journey-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            const journeyId = link.getAttribute('journey-id');
                            window.history.pushState({}, '', `/journeys/${journeyId}`);

                            routeHandler(navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    journeysList.innerHTML = '<p class="error">Failed to load journeys.</p>';
                });

            // Back button
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Description save handler
            const saveBtn = document.getElementById('save-desc');
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault()
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = await updateEpicDescription(epicId, newDesc);
                        epic.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`epic-${epicId}`, {
                            description: epic.description,
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

            // Comments
            const commentsContainer = document.getElementById('epic-comments');
            loadComments(commentsContainer, 'Epic', epicId);

            resolveProjectIdForPromise(epic.productPromiseId, getGraphProjectIdHintFromUrl())
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `epic-${epic.id}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for epic detail', error);
                });
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load epic details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
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