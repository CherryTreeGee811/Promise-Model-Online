export function formatDate(value, fallback = "–") {
    return value ? new Date(value).toLocaleDateString("en-CA") : fallback;
}

export function formatDateTime(value, fallback = "–") {
    return value ? new Date(value).toLocaleString("en-CA") : fallback;
}