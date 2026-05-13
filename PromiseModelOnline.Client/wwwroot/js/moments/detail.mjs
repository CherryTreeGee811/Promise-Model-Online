import { getMomentById, updateMomentEstimate } from './api.mjs';
import { loadComments } from '../comments/comments.mjs';

export function loadMomentDetail(momentId, contentDiv) {
    const detailDiv = document.getElementById('moment-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading moment...';
    errorEl.textContent = '';

    getMomentById(momentId)
        .then(moment => {
            loadingEl.textContent = '';
            detailDiv.innerHTML = `
                <div class="moment-detail-card">
                    <h2>${escapeHtml(moment.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${moment.id}</td></tr>
                        <tr><th>Type</th><td>${moment.type}</td></tr>
                        <tr><th>Status</th><td>${moment.status}</td></tr>
                        <tr>
                            <th>Effort Estimate</th>
                            <td>
                                <select id="moment-estimate-select">
                                    <option value="">–</option>
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
                            <td>${moment.assignedStrideId ?? 'Backlog'}</td>
                        </tr>
                        <tr>
                            <th>Flow</th>
                            <td>
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

            // Estimate auto‑save on change
            const estSelect = document.getElementById('moment-estimate-select');
            if (estSelect) {
                estSelect.addEventListener('change', async () => {
                    const estimate = estSelect.value === '' ? null : estSelect.value;
                    try {
                        await updateMomentEstimate(momentId, estimate);
                    } catch (err) {
                        alert('Failed to update estimate');
                        console.error(err);
                    }
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