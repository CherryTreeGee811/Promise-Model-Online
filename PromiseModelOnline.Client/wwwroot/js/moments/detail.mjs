import {
    getMomentById,
    updateMomentEstimate,
    updateMomentStatus,
    moveMomentToStride,
    updateMomentType,
    updateMomentDescription,
} from './api.mjs';

import { loadComments } from '../comments/comments.mjs';
import { getFlowById } from '../flows/api.mjs';
import { navigate } from "../router.mjs";

import { escapeHtml } from "../utils/html.mjs";
import { getStatusIcon } from "../utils/status.mjs";
import { formatDate } from "../utils/date.mjs";

import { getJourneyById } from '../journeys/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { getPromiseById } from '../promises/api.mjs';

import {
    getIterationsByProject,
    getStridesByIterationId
} from '../strides/api.mjs';

import {
    insertRowBeforeAddRow, 
    removeInlineEmptyRow, 
    renderTableWithInlineAddRow
} from '../utils/inline-table.mjs';

import { 
    patchDetailStackGraphNode,
    destroyDetailStackGraph,
    mountDetailStackGraph,
    refreshDetailStackGraph
} from '../projects/detail-stack-graph.mjs';

import {
    getGraphProjectIdHintFromUrl,
    buildGraphViewHref,
    resolveProjectIdForPromise,
    upsertGraphViewButton
} from '../projects/graph-link.mjs';

import { renderMomentTasks } from './moment-tasks.mjs';

export function loadMomentDetail(momentId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('moment-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('moment-detail-loading');

    if (!detailDiv) {
        console.error("moment-detail-content not found");
        return;
    }

    if (loadingEl) loadingEl.hidden = false;
    if (errorEl) errorEl.textContent = '';
    destroyDetailStackGraph();
    getMomentById(momentId)
        .then(async moment => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
                nodeType: 'moment',
                nodeId: momentId,
                projectIdHint: getGraphProjectIdHintFromUrl(),
            });

            detailDiv.innerHTML = `
                <div class="detail-card moment-detail-card">
                    <h2>${escapeHtml(moment.statement)}</h2>

                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr>
                            <th>Description</th>
                            <td>
                                <textarea id="moment-description-input" rows="4" class="form-control detail-textarea">${escapeHtml(moment.description || '')}</textarea>
                                <div class="field-actions">
                                    <button id="moment-description-save" class="btn btn-primary btn-sm" type="button">
                                        Save
                                    </button>
                                    <span id="moment-description-msg"></span>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <th>Type</th>
                            <td>
                                <select id="moment-type-select" class="form-select form-select-sm">
                                    <option value="Story" ${moment.type === 'Story' ? 'selected' : ''}>Story</option>
                                    <option value="Job" ${moment.type === 'Job' ? 'selected' : ''}>Job</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <th>Status</th>
                            <td>
                                <select id="moment-status-select" class="form-select form-select-sm">
                                    <option value="Todo" ${moment.status === 'Todo' ? 'selected' : ''}>🔴 Todo</option>
                                    <option value="InProgress" ${moment.status === 'InProgress' ? 'selected' : ''}>🟠 InProgress</option>
                                    <option value="Blocked" ${moment.status === 'Blocked' ? 'selected' : ''}>⚫ Blocked</option>
                                    <option value="Done" ${moment.status === 'Done' ? 'selected' : ''}>🟢 Done</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <th>Effort Estimate</th>
                            <td>
                                <select id="moment-estimate-select" class="form-select form-select-sm">
                                    <option value="">–</option>
                                    <option value="XS" ${moment.effortEstimate === 'XS' ? 'selected' : ''}>XS</option>
                                    <option value="S" ${moment.effortEstimate === 'S' ? 'selected' : ''}>S</option>
                                    <option value="M" ${moment.effortEstimate === 'M' ? 'selected' : ''}>M</option>
                                    <option value="L" ${moment.effortEstimate === 'L' ? 'selected' : ''}>L</option>
                                    <option value="XL" ${moment.effortEstimate === 'XL' ? 'selected' : ''}>XL</option>
                                    <option value="XXL" ${moment.effortEstimate === 'XXL' ? 'selected' : ''}>XXL</option>
                                    <option value="XXXL" ${moment.effortEstimate === 'XXXL' ? 'selected' : ''}>XXXL</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <th>Assigned Stride</th>
                            <td>
                                <select id="moment-stride-select" class="form-select form-select-sm">
                                    <option value="">Backlog</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <th>Flow</th>
                            <td id="moment-flow-cell">
                                ${
                                    moment.flowId
                                        ? `<a href="/flows/${moment.flowId}" flow-id="${moment.flowId}" class="detail-link"></a>`
                                        : `<span>—</span>`
                                }
                            </td>
                        </tr>

                        <tr>
                            <th>Created</th>
                            <td>${formatDate(moment.createdAt, '–')}</td>
                        </tr>

                        <tr>
                            <th>Completed</th>
                            <td id="completed-cell">
                                ${formatDate(moment.completedAt, '–')}
                            </td>
                        </tr>
                    </table>

                    <h3>Moment Tasks</h3>
                    <div id="moment-tasks"></div>

                    <div id="moment-comments"></div>

                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button">
                        ← Back
                    </button>
                </div>
            `;

            const tasksContainer = document.getElementById('moment-tasks');
            if (tasksContainer) {
                renderMomentTasks(tasksContainer, momentId, moment.tasks, moment);
            }

            const descriptionSaveButton = document.getElementById('moment-description-save');
            const descriptionInput = document.getElementById('moment-description-input');
            const descriptionMessage = document.getElementById('moment-description-msg');
            if (descriptionSaveButton && descriptionInput && descriptionMessage) {
                descriptionSaveButton.addEventListener('click', async () => {
                    descriptionMessage.textContent = '';
                    descriptionSaveButton.disabled = true;

                    const newDescription = descriptionInput.value;
                    try {
                        const updated = await updateMomentDescription(momentId, newDescription);
                        moment.description = updated?.description ?? (newDescription.trim() ? newDescription : null);
                        patchDetailStackGraphNode(`moment-${momentId}`, {
                            description: moment.description,
                        });
                        await refreshDetailStackGraph();
                        descriptionMessage.textContent = 'Saved';
                    } catch (err) {
                        descriptionMessage.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        descriptionSaveButton.disabled = false;
                    }
                });
            }
            
            // Navigation links
            detailDiv.onclick = null;
            detailDiv.addEventListener("click", (e) => {
                const flowLink = e.target.closest("a.detail-link");
                if (!flowLink) return;

                if (e.ctrlKey || e.metaKey || e.button === 1) return;

                e.preventDefault();
                const flowId = flowLink.getAttribute("flow-id");
                navigate(`/flows/${flowId}`, navContentDiv, contentDiv);
            });

            // Estimate update
            const estSelect = document.getElementById('moment-estimate-select');
            if (estSelect) {
                estSelect.addEventListener('change', async () => {
                    const estimate = estSelect.value || null;

                    try {
                        await updateMomentEstimate(momentId, estimate);

                        moment.effortEstimate = estimate;

                        patchDetailStackGraphNode(`moment-${momentId}`, {
                            effortEstimate: estimate
                        });

                    } catch (err) {
                        console.error(err);
                    }
                });
            }

            // Stride population (safe async chain)
            const strideSelect = document.getElementById('moment-stride-select');
            if (strideSelect && moment.flowId) {
                try {
                    const flow = await getFlowById(moment.flowId);
                    const journey = await getJourneyById(flow.journeyId);
                    const epic = await getEpicById(journey.epicId);
                    const promise = await getPromiseById(epic.productPromiseId);

                    const iterations = await getIterationsByProject(promise.projectId);
                    const latest = iterations.sort((a,b) => b.id - a.id)[0];

                    const strides = await getStridesByIterationId(latest.id);

                    strides.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.id;
                        opt.textContent = s.name || `Stride ${s.id}`;
                        if (s.id === moment.assignedStrideId) opt.selected = true;
                        strideSelect.appendChild(opt);
                    });

                    // Persist stride selection
                    strideSelect.addEventListener('change', async () => {
                        const val = strideSelect.value === '' ? null : parseInt(strideSelect.value, 10);

                        try {
                            const updated = await moveMomentToStride(momentId, val);

                            moment.assignedStrideId = updated.assignedStrideId;

                            patchDetailStackGraphNode(`moment-${momentId}`, {
                                assignedStrideId: updated.assignedStrideId
                            });

                            strideSelect.value = updated.assignedStrideId
                                ? String(updated.assignedStrideId)
                                : '';

                        } catch (err) {
                            console.error('Failed to update assigned stride', err);
                        }
                    });

                } catch (err) {
                    console.warn("Strides load failed (non-blocking)", err);
                }
            }

            // Status update
            const statusSelect = document.getElementById('moment-status-select');
            const completedCell = document.getElementById('completed-cell');

            if (statusSelect) {
                statusSelect.addEventListener('change', async () => {
                    const prev = statusSelect.value;
                    try {
                        const updated = await updateMomentStatus(momentId, statusSelect.value);

                        moment.status = updated.status;
                        moment.statusColor = updated.statusColor;
                        moment.completedAt = updated.completedAt;

                        statusSelect.value = updated.status;

                        await refreshDetailStackGraph();
                        if (completedCell) {
                            completedCell.textContent = updated.completedAt
                                ? formatDate(updated.completedAt, '–')
                                : '–';
                        }
                    } catch {
                        statusSelect.value = prev;
                    }
                });
            }

            // Type update
            const typeSelect = document.getElementById('moment-type-select');
            if (typeSelect) {
                typeSelect.addEventListener('change', async () => {
                    try {
                        const updated = await updateMomentType(momentId, typeSelect.value);
                        if (updated?.type) typeSelect.value = updated.type;
                    } catch {
                        typeSelect.value = moment.type;
                    }
                });
            }

            // Flow display
            const flowCell = document.getElementById('moment-flow-cell');
            if (flowCell && moment.flowId) {
                try {
                    const flow = await getFlowById(moment.flowId);
                    flowCell.innerHTML = `
                        <a href="/flows/${flow.id}" flow-id="${flow.id}" class="detail-link">
                            ${escapeHtml(flow.statement)}
                        </a> ${getStatusIcon(flow.statusColor)}
                    `;
                } catch {
                    flowCell.innerHTML = '—';
                }
            }

            // Back button
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => window.history.back());
            }

            // Comments
            const commentsContainer = document.getElementById('moment-comments');
            if (commentsContainer) {
                loadComments(commentsContainer, 'Moment', momentId);
            }

            // Graph View button (deep-link into graph view)
            if (moment.flowId) {
                getFlowById(moment.flowId)
                    .then(flow => getJourneyById(flow.journeyId))
                    .then(journey => getEpicById(journey.epicId))
                    .then(epic => resolveProjectIdForPromise(
                        epic.productPromiseId,
                        getGraphProjectIdHintFromUrl()
                    ))
                    .then(projectId => {
                        const href = buildGraphViewHref(projectId, `moment-${moment.id}`);
                        upsertGraphViewButton(detailDiv, href);
                    })
                    .catch(err => {
                        console.error('Unable to resolve graph link for moment detail', err);
                    });
            }
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            if (errorEl) errorEl.textContent = 'Failed to load moment details.';
            console.error(err);
        });
}