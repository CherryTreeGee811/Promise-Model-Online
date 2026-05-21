import { getJourneyById, getFlowsByJourney, updateJourney } from './api.mjs';
import { addFlow } from '../flows/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';

export function loadJourneyDetail(journeyId, contentDiv) {
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
                            <textarea id="description-input" rows="4" style="width:100%">${escapeHtml(journey.description || '')}</textarea>
                            <div style="margin-top:6px"><button id="save-desc" class="save-btn">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Epic</th>
                            <td id="journey-epic-cell">
                                <a href="/epics/${journey.epicId}" class="detail-link">Epic ${journey.epicId}</a>
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

            const flowsList = document.getElementById('journey-flows-list');
            getFlowsByJourney(journeyId)
                .then(flows => {
                    const tbody = renderTableWithInlineAddRow(flowsList, {
                        headers: ['Statement', 'Actions'],
                        items: flows || [],
                        emptyMessage: 'No flows found for this journey.',
                        renderItemRow: f => `
                            <tr data-flow-id="${f.id}">
                                <td>${escapeHtml(f.statement)}</td>
                                <td><a href="/flows/${f.id}" class="view-btn">View</a></td>
                            </tr>
                        `,
                        renderAddRow: () => `
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-flow-form" class="inline-add-form" style="margin:0;">
                                        <input id="add-flow-statement" type="text" maxlength="500" required placeholder="New Flow Statement..." style="width:100%;">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-flow-submit" type="submit" form="add-flow-form" class="view-btn">Add</button>
                                    <span id="add-flow-msg"></span>
                                </td>
                            </tr>
                        `,
                    });

                    const form = flowsList.querySelector('#add-flow-form');
                    const statementInput = flowsList.querySelector('#add-flow-statement');
                    const msg = flowsList.querySelector('#add-flow-msg');
                    const submitBtn = flowsList.querySelector('#add-flow-submit');

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
                                const created = await addFlow({
                                    statement,
                                    journeyId,
                                    displayOrder: (flows || []).length + 1,
                                });

                                if (created) {
                                    removeInlineEmptyRow(tbody);
                                    const row = document.createElement('tr');
                                    row.dataset.flowId = created.id;
                                    row.innerHTML = `
                                        <td>${escapeHtml(created.statement)}</td>
                                        <td><a href="/flows/${created.id}" class="view-btn">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                }
                            } catch (err) {
                                msg.textContent = 'Failed to add flow.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
                            }
                        });
                    }
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
                    epicCell.innerHTML = `<a href="/epics/${epic.id}" class="detail-link">${escapeHtml(epic.statement)}</a> ${icon}`;
                })
                .catch(() => {
                    // keep default link
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