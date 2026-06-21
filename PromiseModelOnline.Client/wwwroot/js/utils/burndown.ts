import { loadD3 } from '../projects/detail-stack-graph.ts';

import { renderEmptyStateSection } from './empty-table.ts';

type BurndownPoint = { date: string | Date; remainingEffort: number; idealRemaining?: number };

interface D3Sel {
    append: (s: string) => D3Sel;
    attr: (a: string, b?: unknown) => D3Sel;
    style: (a: string, b?: unknown) => D3Sel;
    text: (v?: unknown) => D3Sel;
    call: (function_: unknown, ...arguments_: unknown[]) => D3Sel;
    selectAll: (s: string) => D3Sel;
    select: (s: string) => D3Sel;
    data: (d: unknown[]) => D3Sel;
    datum: (d: unknown) => D3Sel;
    enter: () => D3Sel;
    html: (v: string) => D3Sel;
    transition: () => { duration: (ms: number) => D3Sel };
    on: (event: string, handler: (...eventData: unknown[]) => void) => D3Sel;
}

interface D3Scale {
    domain: (d: number[]) => D3Scale;
    range: (d: number[]) => D3Scale;
    nice: () => D3Scale & ((v: number) => number);
    ticks: (n: number) => number[];
    (v: number): number;
}

interface D3Chart {
    select: (s: string | HTMLElement | EventTarget) => D3Sel;
    scaleLinear: () => D3Scale;
    axisBottom: (s: unknown) => { tickValues: (v: number[]) => { tickFormat: (f: (d: number, index: number) => string) => unknown } };
    axisLeft: (s: unknown) => unknown;
    line: () => { x: (f: (d: unknown, index: number) => number) => { y: (f: (d: unknown) => number) => { curve: (c: unknown) => (d: unknown[]) => string } } };
    area: () => { x: (f: (d: unknown) => number) => { y0: (f: (d: unknown) => number) => { y1: (f: (d: unknown) => number) => { curve: (c: unknown) => (d: unknown[]) => string } } } };
    curveLinear: unknown;
}

/**
 * @param {HTMLElement} element - The container element
 * @param {BurndownPoint[]} points - The burndown data points
 * @returns {boolean} Whether burndown data exists
 */
function hasBurndownData(element: HTMLElement, points: BurndownPoint[]): boolean {
    element.replaceChildren();
    if (!points || points.length === 0) {
        element.replaceChildren(renderEmptyStateSection({
            icon: 'bi-graph-down',
            title: 'No burndown data available.',
            description: 'Burndown data will appear once moments have status updates.',
        }));
        return false;
    }
    return true;
}

/**
 * @param {BurndownPoint[]} points - The burndown data points
 * @returns {{startDate: Date, endDate: Date, days: number[], actualPoints: number[], finalIdeal: number[], lastDay: number}} Processed burndown data
 */
export function processBurndownPoints(points: BurndownPoint[]): { startDate: Date; endDate: Date; days: number[]; actualPoints: number[]; finalIdeal: number[]; lastDay: number } {
    const sorted = points.toSorted((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted.at(-1)!.date);
    const days = sorted.map((_, index) => index);
    const actualPoints = sorted.map(p => p.remainingEffort);
    const idealPoints = sorted.map(p => p.idealRemaining ?? 0);
    const startRemaining = actualPoints[0];
    const lastDay = days.at(-1)!;
    const finalIdeal = idealPoints.every(v => v === 0) && startRemaining > 0 && lastDay > 0
        ? days.map(day => Math.max(0, startRemaining - (startRemaining / lastDay) * day))
        : idealPoints;
    return { startDate, endDate, days, actualPoints, finalIdeal, lastDay };
}

/**
 * @param {object} svg - The D3 SVG selection
 * @param {object} d3 - The D3 module
 * @param {object} xScale - The D3 x-scale
 * @param {number[]} days - The day numbers
 * @param {BurndownPoint[]} sorted - The sorted burndown points
 */
function addBurndownTooltip(svg: D3Sel, d3: D3Chart, xScale: (v: number) => number, days: number[], sorted: BurndownPoint[]): void {
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
        .attr('cx', (_d: BurndownPoint, index: number) => xScale(days[index]))
        .attr('cy', (d: BurndownPoint) => xScale(d.remainingEffort))
        .attr('r', 5)
        .attr('fill', '#dc3545')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')
        .on('mouseover', ((event: unknown, d: BurndownPoint) => {
            const formattedDate = new Date(d.date).toLocaleDateString();
            d3.select((event as MouseEvent).currentTarget as SVGCircleElement).attr('r', 8);
            tooltip.transition().duration(150).style('opacity', 0.9);
            tooltip.html('<strong>' + formattedDate + '</strong><br/>Remaining: ' + d.remainingEffort + ' pts')
                .style('left', ((event as MouseEvent).pageX + 12) + 'px')
                .style('top', ((event as MouseEvent).pageY - 28) + 'px');
        }) as (...eventData: unknown[]) => void)
        .on('mousemove', ((event: unknown) => {
            tooltip.style('left', ((event as MouseEvent).pageX + 12) + 'px')
                .style('top', ((event as MouseEvent).pageY - 28) + 'px');
        }) as (...eventData: unknown[]) => void)
        .on('mouseout', ((event: unknown) => {
            d3.select((event as MouseEvent).currentTarget as SVGCircleElement).attr('r', 5);
            tooltip.transition().duration(200).style('opacity', 0);
        }) as (...eventData: unknown[]) => void);
}

/**
 * @param {object} svg - The D3 SVG selection
 * @param {object} data - The data points
 * @param {object} lineGen - The D3 line generator
 * @param {string} className - CSS class name
 * @param {string} stroke - Stroke color
 * @param {number} width - Stroke width
 * @param {string} fill - Fill color
 */
function drawLine(svg: D3Sel, data: number[], lineGen: (d: unknown[]) => string, className: string, stroke: string, width: number, fill: string): void {
    svg.append('path')
        .datum(data)
        .attr('class', className)
        .attr('d', (_d: Record<string, unknown>) => lineGen(data))
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', width)
        .attr('stroke-linecap', 'round');
}

/**
 * @param {object} svg - The D3 SVG selection
 * @param {object} data - The data points
 * @param {object} areaGen - The D3 area generator
 * @param {string} className - CSS class name
 * @param {string} fill - Fill color
 * @param {number} opacity - Fill opacity
 */
function drawArea(svg: D3Sel, data: Array<{ x: number; y0: number; y1: number; behind: boolean }>, areaGen: (d: unknown[]) => string, className: string, fill: string, opacity: number): void {
    if (data.length < 2) return;
    svg.append('path')
        .datum(data)
        .attr('class', className)
        .attr('d', areaGen(data))
        .attr('fill', fill)
        .attr('fill-opacity', opacity)
        .attr('stroke', 'none');
}

/**
 * @param {number} diffLeft - Difference at the left point
 * @param {number} diffRight - Difference at the right point
 * @param {{ x: number; y0: number; y1: number; behind: boolean }} crossPoint - The crossing point
 * @param {number} crossPoint.x - The x-coordinate
 * @param {number} crossPoint.y0 - The y0-coordinate (ideal)
 * @param {number} crossPoint.y1 - The y1-coordinate (actual)
 * @param {boolean} crossPoint.behind - Whether actual is above ideal
 * @param {Array<{ x: number; y0: number; y1: number; behind: boolean }>} behind - Array of behind-points
 * @param {Array<{ x: number; y0: number; y1: number; behind: boolean }>} ahead - Array of ahead-points
 */
export function handleCrossPoint(diffLeft: number, diffRight: number, crossPoint: { x: number; y0: number; y1: number; behind: boolean }, behind: Array<{ x: number; y0: number; y1: number; behind: boolean }>, ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }>): void {
    const behindCopy = { ...crossPoint, behind: true };
    const aheadCopy = { ...crossPoint, behind: false };
    if (diffLeft >= 0) behind.push(behindCopy);
    else ahead.push(aheadCopy);
    if (diffRight >= 0) behind.push(behindCopy);
    else ahead.push(aheadCopy);
}

/**
 * @param {number} index - The segment index
 * @param {number[]} days - The day numbers
 * @param {number[]} actualPoints - The actual remaining effort points
 * @param {number[]} finalIdeal - The ideal remaining effort points
 * @param {object} xScale - The D3 x-scale
 * @param {object} yScale - The D3 y-scale
 * @param {Array<{ x: number; y0: number; y1: number; behind: boolean }>} behind - Array of behind-points
 * @param {Array<{ x: number; y0: number; y1: number; behind: boolean }>} ahead - Array of ahead-points
 */
export function processSegment(index: number, days: number[], actualPoints: number[], finalIdeal: number[], xScale: (v: number) => number, yScale: (v: number) => number, behind: Array<{ x: number; y0: number; y1: number; behind: boolean }>, ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }>): void {
    const leftDay = days[index];
    const rightDay = days[index + 1];
    const actualLeft = actualPoints[index];
    const actualRight = actualPoints[index + 1];
    const idealLeft = finalIdeal[index];
    const idealRight = finalIdeal[index + 1];

    const diffLeft = actualLeft - idealLeft;
    const diffRight = actualRight - idealRight;

    const leftPoint = {
        x: xScale(leftDay),
        y0: yScale(idealLeft),
        y1: yScale(actualLeft),
        behind: diffLeft >= 0
    };
    if (leftPoint.behind) behind.push(leftPoint);
    else ahead.push(leftPoint);

    if (diffLeft * diffRight < 0) {
        const t = Math.abs(diffLeft) / (Math.abs(diffLeft) + Math.abs(diffRight));
        const crossDay = leftDay + t * (rightDay - leftDay);
        const crossIdeal = idealLeft + t * (idealRight - idealLeft);
        const crossActual = actualLeft + t * (actualRight - actualLeft);

        handleCrossPoint(diffLeft, diffRight, {
            x: xScale(crossDay),
            y0: yScale(crossIdeal),
            y1: yScale(crossActual),
            behind: diffRight >= 0
        }, behind, ahead);
    }
}

/**
 * @param {number[]} days - The day numbers
 * @param {number[]} actualPoints - The actual remaining effort points
 * @param {number[]} finalIdeal - The ideal remaining effort points
 * @param {object} xScale - The D3 x-scale
 * @param {object} yScale - The D3 y-scale
 * @returns {{ enhancedBehind: Array<{ x: number; y0: number; y1: number; behind: boolean }>; enhancedAhead: Array<{ x: number; y0: number; y1: number; behind: boolean }> }} Enhanced behind/ahead points
 */
export function buildEnhancedPoints(days: number[], actualPoints: number[], finalIdeal: number[], xScale: (v: number) => number, yScale: (v: number) => number): { enhancedBehind: Array<{ x: number; y0: number; y1: number; behind: boolean }>; enhancedAhead: Array<{ x: number; y0: number; y1: number; behind: boolean }> } {
    const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
    const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];

    for (let index = 0; index < days.length - 1; index++) {
        processSegment(index, days, actualPoints, finalIdeal, xScale, yScale, behind, ahead);
    }
    const lastIndex = days.length - 1;
    const lastPoint = {
        x: xScale(days[lastIndex]),
        y0: yScale(finalIdeal[lastIndex]),
        y1: yScale(actualPoints[lastIndex]),
        behind: actualPoints[lastIndex] >= finalIdeal[lastIndex]
    };
    if (lastPoint.behind) behind.push(lastPoint);
    else ahead.push(lastPoint);

    return { enhancedBehind: behind, enhancedAhead: ahead };
}

/**
 * Draw an SVG burndown chart into the given container using D3.
 * @param {HTMLElement | string} container - DOM element or element ID to render into
 * @param {BurndownPoint[]} points - Ordered burndown data points
 * @returns {Promise<void>} Promise that resolves when the chart is rendered
 */
export async function drawBurndownChart(container: HTMLElement | string, points: BurndownPoint[]): Promise<void> {
    const element = typeof container === 'string' ? document.querySelector('#' + container) : container;
    if (!element) {
        console.error('Burndown container not found');
        return;
    }

    if (!hasBurndownData(element as HTMLElement, points)) return;

    const d3 = await loadD3() as D3Chart;
    const { startDate, endDate, days, actualPoints, finalIdeal, lastDay } = processBurndownPoints(points);

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

    svg.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

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
        .tickFormat((_d: number, index: number) => tickLabels[index]);

    xAxisGroup.call(xAxisCustom)
        .style('font-size', '11px')
        .style('font-weight', '500');

    xAxisGroup.selectAll('.tick line')
        .attr('y2', 6)
        .attr('stroke', '#cbd5e1');

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1');

    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 35)
        .attr('text-anchor', 'middle')
        .style('fill', '#6c757d')
        .style('font-size', '11px')
        .text('Stride Day');

    const yTicks = yScale.ticks(6);
    svg.selectAll('.grid-y')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', (d: number) => yScale(d))
        .attr('y2', (d: number) => yScale(d))
        .attr('stroke', '#e9ecef')
        .attr('stroke-dasharray', '4 4');

    const { enhancedBehind, enhancedAhead } = buildEnhancedPoints(days, actualPoints, finalIdeal, xScale, yScale);

    const behindData = enhancedBehind.map(d => d);
    const aheadData = enhancedAhead.map(d => d);

    const areaGen = d3.area().x((d: unknown) => (d as { x: number }).x).y0((d: unknown) => (d as { y0: number }).y0).y1((d: unknown) => (d as { y1: number }).y1).curve(d3.curveLinear) as (d: unknown[]) => string;
    drawArea(svg, behindData, areaGen, 'area-behind', '#dc3545', 0.18);
    drawArea(svg, aheadData, areaGen, 'area-ahead', '#28a745', 0.2);

    const lineGen = d3.line().x((_d: unknown, _index: number) => xScale(days[_index])).y((d: unknown) => yScale(d as number)).curve(d3.curveLinear) as (d: unknown[]) => string;
    drawLine(svg, finalIdeal, lineGen, 'ideal-line', '#6c757d', 2, 'none');
    drawLine(svg, actualPoints, lineGen, 'actual-line', '#dc3545', 2.5, 'none');

    addBurndownTooltip(svg, d3, xScale, days, points);

    const observer = new MutationObserver(() => {
        if (document.body.contains(element)) {
        	return;
        }

        const tooltipElement = document.querySelector('.burndown-tooltip');
        if (tooltipElement) tooltipElement.remove();
        observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
