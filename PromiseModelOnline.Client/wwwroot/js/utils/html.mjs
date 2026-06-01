export function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

export function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('"', "&quot;");
}