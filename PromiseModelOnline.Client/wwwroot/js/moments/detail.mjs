import { getMomentById, updateMomentDescription, updateMomentEstimate, updateMomentStatus, moveMomentToStride, updateMomentType } from './api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { getAllStrides } from '../strides/api.mjs';
import { getFlowById } from '../flows/api.mjs';
import { getJourneyById } from '../journeys/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';

export function loadMomentDetail(momentId, contentDiv) {
    const detailDiv = document.getElementById('moment-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading moment...';
    errorEl.textContent = '';

    getMomentById(momentId)
        .then(async moment => {
            loadingEl.textContent = '';

            detailDiv.innerHTML = `
                <div class="moment-detail-card">
                    <h2>${escapeHtml(moment.statement)}</h2>
                    <table class="detail-table">
                        <tr>
                            <th>Description</th>
                            <td>
                                <textarea id="moment-description-input" rows="4" style="width:100%">${escapeHtml(moment.description || '')}</textarea>
                                <div style="margin-top:6px"><button id="moment-description-save" class="save-btn">Save</button> <span id="moment-description-msg"></span></div>
                            </td>
                        </tr>
                        <tr><th>Type</th><td>
                            <select id="moment-type-select">
                                <option value="Story" ${moment.type === 'Story' ? 'selected' : ''}>Story</option>
                                <option value="Job" ${moment.type === 'Job' ? 'selected' : ''}>Job</option>
                            </select>
                        </td></tr>
                        <tr><th>Status</th><td>
                            <select id="moment-status-select">
                                ${getStatusOption('Todo', moment.status)}
                                ${getStatusOption('InProgress', moment.status)}
                                ${getStatusOption('Blocked', moment.status)}
                                ${getStatusOption('Done', moment.status)}
                            </select>
                        </td></tr>
                        <tr>
                            <th>Effort Estimate</th>
                            <td>
                                <select id="moment-estimate-select">
                                    <option value="-" ${moment.effortEstimate == null ? 'selected' : ''}>-</option>
                                    <option value="XS"  ${moment.effortEstimate === 'XS'  ? 'selected' : ''}>XS</option>
                                    <option value="S"   ${moment.effortEstimate === 'S'   ? 'selected' : ''}>S</option>
                                    <option value="M"   ${moment.effortEstimate === 'M'   ? 'selected' : ''}>M</option>
                                    <option value="L"   ${moment.effortEstimate === 'L'   ? 'selected' : ''}>L</option>
                                    <option value="XL"  ${moment.effortEstimate === 'XL'  ? 'selected' : ''}>XL</option>
                                    <option value="XXL" ${moment.effortEstimate === 'XXL' ? 'selected' : ''}>XXL</option>
                                    <option value="XXXL"${moment.effortEstimate === 'XXXL'? 'selected' : ''}>XXXL</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Assigned Stride</th>
                            <td>
                                <select id="moment-stride-select">
                                    <option value="">Backlog</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Flow</th>
                            <td id="moment-flow-cell">
                                <a href="/flows/${moment.flowId}" class="detail-link">Flow ${moment.flowId}</a>
                            </td>
                        </tr>
                        <tr><th>Created</th><td>${new Date(moment.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Completed</th><td>${moment.completedAt ? new Date(moment.completedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <div id="moment-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

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
                        descriptionMessage.textContent = 'Saved';
                    } catch (err) {
                        descriptionMessage.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        descriptionSaveButton.disabled = false;
                    }
                });
            }

            // Estimate auto‑save on change
            const estSelect = document.getElementById('moment-estimate-select');
            if (estSelect) {
                estSelect.addEventListener('change', async () => {
                    const estimate = estSelect.value === '-' ? null : estSelect.value;
                    try {
                        await updateMomentEstimate(momentId, estimate);
                    } catch (err) {
                        alert('Failed to update estimate');
                        console.error(err);
                    }
                });
            }

            // Populate strides select
            const strideSelect = document.getElementById('moment-stride-select');
            if (strideSelect) {
                try {
                    const strides = await getAllStrides();
                    // sort by name
                    strides.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
                    strides.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = String(s.id);
                        opt.textContent = s.name || `Stride ${s.id}`;
                        if (String(s.id) === String(moment.assignedStrideId)) opt.selected = true;
                        strideSelect.appendChild(opt);
                    });
                    if (!moment.assignedStrideId) {
                        strideSelect.value = '';
                    }

                    strideSelect.addEventListener('change', async () => {
                        const val = strideSelect.value === '' ? null : parseInt(strideSelect.value, 10);
                        try {
                            const updated = await moveMomentToStride(momentId, val);
                            // reflect assigned stride id
                            const display = updated.assignedStrideId ? String(updated.assignedStrideId) : 'Backlog';
                            // keep select in sync with returned value
                            strideSelect.value = updated.assignedStrideId ? String(updated.assignedStrideId) : '';
                        } catch (err) {
                            alert('Failed to update assigned stride');
                            console.error(err);
                        }
                    });
                } catch (err) {
                    console.error('Failed to load strides', err);
                }
            }

            // Status change handler
            const statusSelect = document.getElementById('moment-status-select');
            const completedCell = detailDiv.querySelector('tr:nth-last-child(1) td');
            if (statusSelect) {
                statusSelect.addEventListener('change', async () => {
                    const prev = statusSelect.value;
                    try {
                        const updated = await updateMomentStatus(momentId, statusSelect.value);
                        // update status and completed fields from returned DTO
                        // update select value and Completed cell from returned DTO
                        statusSelect.value = updated.status;
                        if (updated.completedAt) {
                            const d = new Date(updated.completedAt);
                            completedCell.textContent = d.toLocaleDateString('en-CA');
                        } else {
                            completedCell.textContent = '–';
                        }
                    } catch (err) {
                        statusSelect.value = prev;
                        alert('Failed to update status');
                    }
                });
            }

            // Type change handler
            const typeSelect = document.getElementById('moment-type-select');
            if (typeSelect) {
                typeSelect.addEventListener('change', async () => {
                    const newType = typeSelect.value;
                    try {
                        const updated = await updateMomentType(momentId, newType);
                        // keep UI in sync (server may return DTO)
                        if (updated && updated.type) typeSelect.value = updated.type;
                    } catch (err) {
                        alert('Failed to update type');
                        typeSelect.value = moment.type;
                    }
                });
            }

            // Load parent flow and show its status emoji
            const flowCell = document.getElementById('moment-flow-cell');
            if (flowCell) {
                getFlowById(moment.flowId)
                    .then(flow => {
                        const icon = getStatusIcon(flow.statusColor);
                        flowCell.innerHTML = `<a href="/flows/${flow.id}" class="detail-link">${escapeHtml(flow.statement)}</a> ${icon}`;
                    })
                    .catch(() => {
                        // leave as-is
                    });
            }

            // Back button event
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Comments
            const commentsContainer = document.getElementById('moment-comments');
            loadComments(commentsContainer, 'Moment', momentId);

            getFlowById(moment.flowId)
                .then(flow => getJourneyById(flow.journeyId))
                .then(journey => getEpicById(journey.epicId))
                .then(epic => resolveProjectIdForPromise(epic.productPromiseId, getGraphProjectIdHintFromUrl()))
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `moment-${moment.id}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for moment detail', error);
                });
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load moment details.';
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

function getStatusOption(value, selectedValue) {
    const icon = getStatusIconForStatus(value);
    const selected = value === selectedValue ? 'selected' : '';
    return `<option value="${value}" ${selected}>${icon} ${value}</option>`;
}

function getStatusIconForStatus(status) {
    switch (String(status ?? '')) {
        case 'Todo': return '🔴';
        case 'InProgress': return '🟠';
        case 'Blocked': return '⚫️';
        case 'Done': return '🟢';
        default: return '⚪';
    }
}