import { renderEmptyStateSection } from './empty-table.mjs';
import { loadD3 } from '../projects/detail-stack-graph.mjs';

/**
 * Draws a burndown chart inside the given container using D3.js.
 * Expects each point to have: { date: string|Date, remainingEffort: number, idealRemaining?: number }
 * @param {HTMLElement|string} container - DOM element or its ID where the chart will be rendered.
 * @param {Array<{date: string|Date, remainingEffort: number, idealRemaining?: number}>} points - Burndown data points.
 */
export async function drawBurndownChart(container, points) {
    const element = typeof container === 'string' ? document.getElementById(container) : container;
    if (!element) {
        console.error('Burndown container not found');
        return;
    }

    element.innerHTML = '';

    if (!points || points.length === 0) {
        element.innerHTML = renderEmptyStateSection({
            icon: 'bi-graph-down',
            title: 'No burndown data available.',
            description: 'Burndown data will appear once moments have status updates.',
        });
        return;
    }

    const d3 = await loadD3();

    // Sort by date
    const sorted = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted[sorted.length - 1].date);

    const days = sorted.map((_, idx) => idx);
    const actualPoints = sorted.map(p => p.remainingEffort);
    const idealPoints = sorted.map(p => p.idealRemaining ?? 0);

    const startRemaining = actualPoints[0];
    const lastDay = days[days.length - 1];

    let finalIdeal = idealPoints;
    if (idealPoints.every(v => v === 0) && startRemaining > 0 && lastDay > 0) {
        finalIdeal = days.map(day => Math.max(0, startRemaining - (startRemaining / lastDay) * day));
    }

    const width = element.clientWidth || 800;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(element)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('display', 'block')
        .style('background', 'white')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    svg.append('text')
        .attr('x', 0)
        .attr('y', -12)
        .attr('text-anchor', 'start')
        .style('font-size', '26px')
        .style('font-weight', '100')
        .style('fill', '#6c757d')
        .style('letter-spacing', '-0.2px')
        .text('Burndown');

    const xScale = d3.scaleLinear().domain([0, lastDay]).range([0, innerWidth]).nice();
    const yMax = Math.max(...actualPoints, ...finalIdeal, 1) * 1.05;
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice();

    // Y axis line (no ticks)
    svg.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

    // X axis with only first and last ticks (formatted dates)
    const xAxisGroup = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${innerHeight})`);

    const tickValues = [0, lastDay];
    const tickLabels = [
        startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    ];

    const xAxisCustom = d3.axisBottom(xScale)
        .tickValues(tickValues)
        .tickFormat((d, i) => tickLabels[i]);

    xAxisGroup.call(xAxisCustom)
        .style('font-size', '11px')
        .style('font-weight', '500');

    xAxisGroup.selectAll('.tick line')
        .attr('y2', 6)
        .attr('stroke', '#cbd5e1');

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1');

    // X axis label
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 35)
        .attr('text-anchor', 'middle')
        .style('fill', '#6c757d')
        .style('font-size', '11px')
        .text('Stride Day');

    // Horizontal grid lines
    const yTicks = yScale.ticks(6);
    svg.selectAll('.grid-y')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e9ecef')
        .attr('stroke-dasharray', '4 4');

    // --- Build enhanced data arrays with interpolated crossing points ---
    const enhancedBehind = [];
    const enhancedAhead = [];

    for (let i = 0; i < days.length - 1; i++) {
        const leftDay = days[i];
        const rightDay = days[i+1];
        const actualLeft = actualPoints[i];
        const actualRight = actualPoints[i+1];
        const idealLeft = finalIdeal[i];
        const idealRight = finalIdeal[i+1];

        const diffLeft = actualLeft - idealLeft;
        const diffRight = actualRight - idealRight;

        // Add the left point
        const leftPoint = {
            x: xScale(leftDay),
            y0: yScale(idealLeft),
            y1: yScale(actualLeft),
            behind: diffLeft >= 0
        };
        if (leftPoint.behind) enhancedBehind.push(leftPoint);
        else enhancedAhead.push(leftPoint);

        // If crossing occurs between leftDay and rightDay
        if (diffLeft * diffRight < 0) {
            // Linear interpolation factor
            const t = Math.abs(diffLeft) / (Math.abs(diffLeft) + Math.abs(diffRight));
            const crossDay = leftDay + t * (rightDay - leftDay);
            const crossIdeal = idealLeft + t * (idealRight - idealLeft);
            const crossActual = actualLeft + t * (actualRight - actualLeft);

            const crossPoint = {
                x: xScale(crossDay),
                y0: yScale(crossIdeal),
                y1: yScale(crossActual),
                behind: diffRight >= 0   // after crossing, the new side
            };

            // Add the crossing point to BOTH arrays (but only the side it belongs to after crossing)
            // However, to make the areas meet perfectly, we add it to both as a shared vertex.
            // The area generator will still separate correctly because the point belongs to both
            // but the behind/ahead status differs. To avoid double-draw, we add to the side that
            // continues after crossing. The other side will end exactly at this point.
            // Simpler: add to the side that becomes true after crossing, and also add a duplicate
            // with opposite flag? Actually, we just need the path to touch. Adding the same point
            // to both arrays will cause the areas to share a boundary point – that's perfect.
            // But we must ensure the point is added to the *current* side's array as well, so
            // the area from the left side reaches exactly to the crossing.
            // Let's add it to both, but with the 'behind' flag set appropriately.
            const behindCopy = { ...crossPoint, behind: true };
            const aheadCopy = { ...crossPoint, behind: false };
            // Add to the appropriate arrays based on the flag of the side that is ending.
            // The left side ends here, so we add it to the left side's array.
            if (diffLeft >= 0) {
                enhancedBehind.push(behindCopy);
            } else {
                enhancedAhead.push(aheadCopy);
            }
            // Then start the new side with the same point as its first vertex.
            if (diffRight >= 0) {
                enhancedBehind.push(behindCopy);
            } else {
                enhancedAhead.push(aheadCopy);
            }
        }
    }
    // Add the last point
    const lastIdx = days.length - 1;
    const lastPoint = {
        x: xScale(days[lastIdx]),
        y0: yScale(finalIdeal[lastIdx]),
        y1: yScale(actualPoints[lastIdx]),
        behind: (actualPoints[lastIdx] - finalIdeal[lastIdx]) >= 0
    };
    if (lastPoint.behind) enhancedBehind.push(lastPoint);
    else enhancedAhead.push(lastPoint);

    // Now separate into arrays with nulls for D3's .defined()
    const behindData = enhancedBehind.map(d => d);
    const aheadData = enhancedAhead.map(d => d);

    // Area generator
    const areaGen = d3.area()
        .x(d => d.x)
        .y0(d => d.y0)
        .y1(d => d.y1)
        .curve(d3.curveLinear);

    // Draw behind area (red)
    if (behindData.length >= 2) {
        svg.append('path')
            .datum(behindData)
            .attr('class', 'area-behind')
            .attr('d', areaGen)
            .attr('fill', '#dc3545')
            .attr('fill-opacity', 0.18)
            .attr('stroke', 'none');
    }

    // Draw ahead area (green)
    if (aheadData.length >= 2) {
        svg.append('path')
            .datum(aheadData)
            .attr('class', 'area-ahead')
            .attr('d', areaGen)
            .attr('fill', '#28a745')
            .attr('fill-opacity', 0.2)
            .attr('stroke', 'none');
    }

    // Lines (same as before)
    const lineGen = d3.line()
        .x((d, i) => xScale(days[i]))
        .y(d => yScale(d))
        .curve(d3.curveLinear);

    svg.append('path')
        .datum(finalIdeal)
        .attr('class', 'ideal-line')
        .attr('d', d => lineGen(d))
        .attr('fill', 'none')
        .attr('stroke', '#6c757d')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6 4')
        .attr('opacity', 0.7);

    svg.append('path')
        .datum(actualPoints)
        .attr('class', 'actual-line')
        .attr('d', d => lineGen(d))
        .attr('fill', 'none')
        .attr('stroke', '#dc3545')
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round');

    // Tooltip (same)
    const tooltip = d3.select('body').append('div')
        .attr('class', 'burndown-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.75)')
        .style('color', '#fff')
        .style('padding', '6px 12px')
        .style('border-radius', '20px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('transition', 'opacity 0.2s')
        .style('z-index', '1000')
        .style('font-family', 'system-ui, -apple-system, sans-serif');

    svg.selectAll('.actual-point')
        .data(sorted)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => xScale(days[i]))
        .attr('cy', d => yScale(d.remainingEffort))
        .attr('r', 5)
        .attr('fill', '#dc3545')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            const formattedDate = new Date(d.date).toLocaleDateString();
            d3.select(this).attr('r', 8);
            tooltip.transition().duration(150).style('opacity', 0.9);
            tooltip.html(`<strong>${formattedDate}</strong><br/>Remaining: ${d.remainingEffort} pts`)
                .style('left', (event.pageX + 12) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mousemove', function(event) {
            tooltip.style('left', (event.pageX + 12) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('r', 5);
            tooltip.transition().duration(200).style('opacity', 0);
        });

    const observer = new MutationObserver(() => {
        if (!document.body.contains(element)) {
            tooltip.remove();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}