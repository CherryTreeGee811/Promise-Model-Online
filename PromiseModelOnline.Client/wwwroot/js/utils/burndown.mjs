export function drawBurndownChart(canvas, points) {
    if (!points || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height, pad = 30;
    ctx.clearRect(0, 0, w, h);

    const maxEffort = Math.max(...points.map(p => Math.max(p.remainingEffort, p.idealRemaining)), 1);

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Ideal line
    ctx.beginPath();
    ctx.strokeStyle = '#3498db';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const y = h - pad - (p.idealRemaining / maxEffort) * (h - pad * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual line
    ctx.beginPath();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const y = h - pad - (p.remainingEffort / maxEffort) * (h - pad * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    const firstDate = points[0]?.date ? new Date(points[0].date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '';
    const lastDate = points[points.length-1]?.date ? new Date(points[points.length-1].date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '';
    ctx.fillText(firstDate, pad, h - pad + 15);
    ctx.fillText(lastDate, w - pad - 40, h - pad + 15);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Effort', -h / 2, 15);
    ctx.restore();
}