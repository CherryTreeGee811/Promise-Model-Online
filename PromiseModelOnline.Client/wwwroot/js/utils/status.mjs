export function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? "").toLowerCase();

    if (normalized.includes("green")) return "🟢";
    if (normalized.includes("black") || normalized.includes("blocked")) return "⚫️";
    if (
        normalized.includes("orange") ||
        normalized.includes("yellow") ||
        normalized.includes("amber") ||
        normalized.includes("inprogress") ||
        normalized.includes("in-progress")
    ) return "🟠";
    if (normalized.includes("red") || normalized.includes("todo")) return "🔴";

    return "⚪";
}