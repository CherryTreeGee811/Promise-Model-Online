import { formatDate } from "./date.mjs";

export function drawBurndownChart(canvas, points) {
    if (!canvas || !points || points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 30;

    const chartWidth = w - pad * 2;
    const chartHeight = h - pad * 2;
    const stepDenominator = Math.max(points.length - 1, 1);

    ctx.clearRect(0, 0, w, h);

    const maxEffort = Math.max(
        ...points.map(p =>
            Math.max(p.remainingEffort ?? 0, p.idealRemaining ?? 0)
        ),
        1
    );

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Ideal line
    ctx.beginPath();
    ctx.strokeStyle = "#3498db";
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;

    points.forEach((p, i) => {
        const x = pad + (i / stepDenominator) * chartWidth;
        const y = h - pad - ((p.idealRemaining ?? 0) / maxEffort) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();
    ctx.setLineDash([]);

    // Actual line
    ctx.beginPath();
    ctx.strokeStyle = "#e74c3c";
    ctx.lineWidth = 2;

    points.forEach((p, i) => {
        const x = pad + (i / stepDenominator) * chartWidth;
        const y = h - pad - ((p.remainingEffort ?? 0) / maxEffort) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Labels
    ctx.fillStyle = "#333";
    ctx.font = "10px Arial";

    const dateLabelOptions = {
        month: "short",
        day: "numeric"
    };

    const firstDate = formatDate(points[0]?.date, "", dateLabelOptions);
    const lastDate = formatDate(points[points.length - 1]?.date, "", dateLabelOptions);

    ctx.fillText(firstDate, pad, h - pad + 15);
    ctx.fillText(lastDate, w - pad - 40, h - pad + 15);

    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Effort", -h / 2, 15);
    ctx.restore();
}