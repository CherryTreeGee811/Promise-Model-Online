import { routeHandler } from '../router.mjs';
import {
    getIterationsByProject,
    getStridesByIteration,
    getMomentsByStride,
    getMomentsByIteration,
    getProjectMembers,
    getMyPermission,
    progressStride
} from './api.mjs';

import {
    moveMomentToStride,
    updateMomentStatus,
    updateMomentEstimate,
    updateMomentOwner
} from '../moments/api.mjs';

/* ---------- Constants ---------- */
const estimateValues = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

const estimateOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/* ---------- Cached state ---------- */
let cachedMembers = [];
let cachedAllStrides = [];
let cachedCanEdit = false;

/* ---------- Permission ---------- */
function applyPermissionUI(canEdit) {
    document.querySelectorAll(
        '.status-dropdown, .estimate-dropdown, .owner-dropdown, .move-to-backlog-btn, .move-to-stride-from-backlog-btn'
    ).forEach(el => el.disabled = !canEdit);

    document.querySelectorAll('.progress-stride-btn')
        .forEach(btn =>
            btn.classList.toggle('hidden', !canEdit)
        );
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function preserveScroll(fn) {
    const y = window.scrollY;
    fn();
    window.scrollTo(0, y);
}

function findMomentRow(id) {
    return document.querySelector(`tr[data-moment-id="${id}"]`);
}

/* ---------- Dropdown creation ---------- */
function createOption(value, text, selected) {
    const opt = document.createElement('option');
    opt.value = String(value ?? '');
    opt.textContent = text;
    if (selected) opt.selected = true;
    return opt;
}

function populateEstimateSelect(select) {
    const current = select.dataset.currentEstimate || '';
    select.innerHTML = '';
    select.appendChild(createOption('', '–', current === ''));
    estimateOrder.forEach(k =>
        select.appendChild(createOption(k, k, k === current))
    );
}

function populateStatusSelect(select) {
    const current = select.dataset.currentStatus || '';
    const values = ['Todo', 'InProgress', 'Blocked', 'Done'];
    select.innerHTML = '';
    values.forEach(v =>
        select.appendChild(createOption(v, v, v === current))
    );
}

function populateOwnerSelect(select) {
    const current = select.dataset.ownerId || '';
    select.innerHTML = '';
    select.appendChild(createOption('', 'Unassigned', current === ''));

    cachedMembers.forEach(m =>
        select.appendChild(createOption(m.userId, m.userName, String(m.userId) === current))
    );
}

function populateBacklogStrideSelect(select) {
    select.innerHTML = '';
    cachedAllStrides.forEach(s =>
        select.appendChild(createOption(s.id, s.name))
    );
}

function populateSelectsWithin(root) {
    root.querySelectorAll('.estimate-dropdown').forEach(populateEstimateSelect);
    root.querySelectorAll('.status-dropdown').forEach(populateStatusSelect);
    root.querySelectorAll('.owner-dropdown').forEach(populateOwnerSelect);
    root.querySelectorAll('.backlog-target-stride').forEach(populateBacklogStrideSelect);
}

/* ---------- Row creation ---------- */
function createStrideRow(m) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = m.id;

    tr.innerHTML = `
        <td>${m.id}</td>
        <td>${escapeHtml(m.statement)}</td>
        <td>${m.type}</td>
        <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
        <td><select class="estimate-dropdown" data-current-estimate="${m.effortEstimate ?? ''}" data-moment-id="${m.id}"></select></td>
        <td><select class="owner-dropdown" data-owner-id="${m.ownerId ?? ''}" data-moment-id="${m.id}"></select></td>
        <td>
            <select class="status-dropdown" data-current-status="${m.status ?? ''}" data-moment-id="${m.id}"></select>
            <button class="move-to-backlog-btn" data-moment-id="${m.id}">Backlog</button>
            /moments/${m.id}View</a>
        </td>
    `;

    populateSelectsWithin(tr);
    return tr;
}

function createBacklogRow(m) {
    const tr = document.createElement('tr');
    tr.dataset.momentId = m.id;

    tr.innerHTML = `
        <td>${m.id}</td>
        <td>${escapeHtml(m.statement)}</td>
        <td>${m.type}</td>
        <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
        <td>${m.effortEstimate ?? '–'}</td>
        <td>
            <select class="backlog-target-stride"></select>
            <button class="move-to-stride-from-backlog-btn" data-moment-id="${m.id}">Move</button>
        </td>
    `;

    populateSelectsWithin(tr);
    return tr;
}

/* ---------- Event delegation ---------- */
function bindInlineMomentControls(root) {
    if (root.dataset.bound) return;
    root.dataset.bound = '1';

    root.addEventListener('change', async e => {
        const t = e.target;
        const id = parseInt(t.dataset.momentId);

        try {
            if (t.matches('.status-dropdown')) {
                const res = await updateMomentStatus(id, t.value);
                findMomentRow(id)?.querySelector('.status-badge').textContent = res.status;
            }

            if (t.matches('.estimate-dropdown')) {
                await updateMomentEstimate(id, t.value || null);
            }

            if (t.matches('.owner-dropdown')) {
                await updateMomentOwner(id, t.value || null);
            }
        } catch {
            alert('Update failed');
        }
    });

    root.addEventListener('click', async e => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = parseInt(btn.dataset.momentId);

        try {
            if (btn.classList.contains('move-to-backlog-btn')) {
                const updated = await moveMomentToStride(id, null);
                preserveScroll(() => {
                    findMomentRow(id)?.remove();
                    document.querySelector('#backlog-section tbody')
                        ?.appendChild(createBacklogRow(updated));
                });
            }
        } catch {
            alert('Move failed');
        }
    });
}

/* ---------- Main loader ---------- */
export function loadStridesList(projectId, navContentDiv, contentDiv) {
    const board = document.getElementById('stride-board');

    getIterationsByProject(projectId)
        .then(i => getStridesByIteration(i[0].id))
        .then(strides => {
            cachedAllStrides = strides;

            strides.forEach(s => {
                const card = document.createElement('div');
                card.className = 'stride-card';
                card.dataset.strideId = s.id;
                board.appendChild(card);

                getMomentsByStride(s.id).then(ms => {
                    ms.forEach(m => {
                        card.appendChild(createStrideRow(m));
                    });
                });
            });

            populateSelectsWithin(board);
            applyPermissionUI(cachedCanEdit);
            bindInlineMomentControls(board);
        });

    getMyPermission(projectId).then(p => {
        cachedCanEdit = String(p).toLowerCase() === 'edit';
        applyPermissionUI(cachedCanEdit);
    });

    getProjectMembers(projectId).then(m => {
        cachedMembers = m;
        populateSelectsWithin(document);
    });
}