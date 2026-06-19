type EmptyTableOptions = { icon?: string; title?: string; description?: string; button?: { id?: string; class?: string; text: string; icon?: string }; colspan: number };

function buildEmptyContent(wrapper: HTMLElement, icon?: string, title?: string, description?: string, button?: { id?: string; class?: string; text: string; icon?: string }): void {
    if (icon) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'empty-table-icon';
        const index = document.createElement('i');
        index.classList.add('bi', icon);
        iconDiv.append(index);
        wrapper.append(iconDiv);
    }
    if (title) {
        const h5 = document.createElement('h5');
        h5.className = 'fw-semibold text-secondary mb-1';
        h5.textContent = title;
        wrapper.append(h5);
    }
    if (description) {
        const p = document.createElement('p');
        p.className = 'text-muted mb-2';
        p.textContent = description;
        wrapper.append(p);
    }
    if (button) {
        const button_ = document.createElement('button');
        button_.className = button.class || 'btn btn-outline-primary rounded-pill mt-2';
        button_.type = 'button';
        if (button.id) button_.id = button.id;
        if (button.icon) {
            const buttonIcon = document.createElement('i');
            buttonIcon.classList.add('bi', button.icon, 'me-1');
            button_.append(buttonIcon, ' ');
        }
        button_.append(button.text);
        wrapper.append(button_);
    }
}

/**
 * Render an HTML table row with an empty-state message and optional CTA button.
 * @param {EmptyTableOptions} options - Configuration for the empty row.
 * @param {string} [options.icon] - Icon class for the empty state.
 * @param {string} [options.title] - Title text for the empty state.
 * @param {string} [options.description] - Description text for the empty state.
 * @param {object} [options.button] - Button configuration.
 * @param {number} options.colspan - Number of columns the row should span.
 * @returns {string} HTML string for the empty table row.
 */
export function renderEmptyTableRow({ icon, title, description, button, colspan }: EmptyTableOptions): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'inline-table-empty-row';
    const td = document.createElement('td');
    td.colSpan = colspan;
    td.className = 'text-center py-5';
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex flex-column align-items-center gap-3';
    buildEmptyContent(wrapper, icon, title, description, button);
    td.append(wrapper);
    tr.append(td);
    return tr;
}

type EmptySectionOptions = { icon?: string; title?: string; description?: string; button?: { id?: string; class?: string; text: string; icon?: string } };

/**
 * Render an HTML div with an empty-state message and optional CTA button.
 * Used for sections that are not inside a table.
 * @param {EmptySectionOptions} options - Configuration for the empty state.
 * @param {string} [options.icon] - Icon class for the empty state.
 * @param {string} [options.title] - Title text for the empty state.
 * @param {string} [options.description] - Description text for the empty state.
 * @param {object} [options.button] - Button configuration.
 * @returns {string} HTML string for the empty state section.
 */
export function renderEmptyStateSection({ icon, title, description, button }: EmptySectionOptions): HTMLElement {
    const div = document.createElement('div');
    div.className = 'no-items d-flex flex-column align-items-center gap-3 py-5';
    buildEmptyContent(div, icon, title, description, button);
    return div;
}
