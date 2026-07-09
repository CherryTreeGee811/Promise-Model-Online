import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLoadD3 = vi.hoisted(() => vi.fn());

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts', () => ({
    loadD3: mockLoadD3,
}));

import {
    processBurndownPoints,
    buildEnhancedPoints,
    handleCrossPoint,
    processSegment,
    drawBurndownChart,
} from '../../PromiseModelOnline.Client/wwwroot/js/utils/burndown.ts';

type BPoint = { date: string; remainingEffort: number; idealRemaining?: number };

function pts(data: Array<{ date: string; remaining: number; ideal?: number }>): BPoint[] {
    return data.map(d => ({ date: d.date, remainingEffort: d.remaining, idealRemaining: d.ideal }));
}

function makeMockD3() {
    const sel: Record<string, ReturnType<typeof vi.fn>> = {
        append: vi.fn(),
        attr: vi.fn(),
        style: vi.fn(),
        text: vi.fn(),
        call: vi.fn(),
        selectAll: vi.fn(),
        select: vi.fn(),
        data: vi.fn(),
        datum: vi.fn(),
        enter: vi.fn(),
        html: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
    };
    for (const k of Object.keys(sel)) (sel[k] as ReturnType<typeof vi.fn>).mockReturnValue(sel);
    const transitionObj = { duration: vi.fn().mockReturnValue(sel) };
    sel.transition = vi.fn().mockReturnValue(transitionObj);

    const mockScale = Object.assign(
        (v: number) => v * 10,
        { domain: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), nice: vi.fn().mockReturnThis(), ticks: vi.fn().mockReturnValue([0, 50, 100]) },
    );

    const pathFn = vi.fn().mockReturnValue('M0,0L10,10');
    const areaFn = vi.fn().mockReturnValue('M0,0L10,10Z');
    const lineGen = { x: vi.fn().mockReturnThis(), y: vi.fn().mockReturnThis(), curve: vi.fn().mockReturnValue(pathFn) };
    const areaGen = { x: vi.fn().mockReturnThis(), y0: vi.fn().mockReturnThis(), y1: vi.fn().mockReturnThis(), curve: vi.fn().mockReturnValue(areaFn) };

    return {
        select: vi.fn().mockReturnValue(sel),
        scaleLinear: vi.fn().mockReturnValue(mockScale),
        axisBottom: vi.fn().mockReturnValue({ tickValues: vi.fn().mockReturnValue({ tickFormat: vi.fn().mockReturnValue('axis') }) }),
        axisLeft: vi.fn().mockReturnValue(sel),
        line: vi.fn().mockReturnValue(lineGen),
        area: vi.fn().mockReturnValue(areaGen),
        curveLinear: Symbol('curveLinear'),
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
});

describe('processBurndownPoints', () => {
    it('sorts by date and returns indices as days', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-03', remaining: 5 }, { date: '2026-06-01', remaining: 12 }, { date: '2026-06-02', remaining: 8 },
        ]));
        expect(r.actualPoints).toEqual([12, 8, 5]);
        expect(r.days).toEqual([0, 1, 2]);
    });

    it('generates ideal line from start when all ideals are 0', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10 }, { date: '2026-06-02', remaining: 7 }, { date: '2026-06-03', remaining: 4 },
        ]));
        expect(r.finalIdeal).toEqual([10, 5, 0]);
    });

    it('uses provided ideals if non-zero', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10, ideal: 10 }, { date: '2026-06-02', remaining: 7, ideal: 5 }, { date: '2026-06-03', remaining: 4, ideal: 0 },
        ]));
        expect(r.finalIdeal).toEqual([10, 5, 0]);
    });

    it('handles single point', () => {
        const r = processBurndownPoints(pts([{ date: '2026-06-01', remaining: 5 }]));
        expect(r.days).toEqual([0]);
        expect(r.lastDay).toBe(0);
    });

    it('handles two points', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10 }, { date: '2026-06-02', remaining: 0 },
        ]));
        expect(r.days).toEqual([0, 1]);
        expect(r.lastDay).toBe(1);
        expect(r.finalIdeal).toEqual([10, 0]);
    });

    it('returns startDate and endDate', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10 }, { date: '2026-06-03', remaining: 4 },
        ]));
        expect(r.startDate).toEqual(new Date('2026-06-01'));
        expect(r.endDate).toEqual(new Date('2026-06-03'));
    });

    it('uses provided ideals when some are non-zero', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10, ideal: 8 }, { date: '2026-06-02', remaining: 7, ideal: 4 }, { date: '2026-06-03', remaining: 4, ideal: 0 },
        ]));
        expect(r.finalIdeal).toEqual([8, 4, 0]);
    });

    it('handles single point with 0 remaining', () => {
        const r = processBurndownPoints(pts([{ date: '2026-06-01', remaining: 0 }]));
        expect(r.actualPoints).toEqual([0]);
        expect(r.lastDay).toBe(0);
        expect(r.finalIdeal).toEqual([0]);
    });

    it('handles all ideals zero with zero start', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 0 }, { date: '2026-06-02', remaining: 0 },
        ]));
        expect(r.finalIdeal).toEqual([0, 0]);
    });

    it('handles all ideals zero with lastDay zero', () => {
        const r = processBurndownPoints(pts([{ date: '2026-06-01', remaining: 5 }]));
        expect(r.finalIdeal).toEqual([0]);
    });

    it('keeps idealRemaining when only first is non-zero', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10, ideal: 10 }, { date: '2026-06-02', remaining: 7, ideal: 0 }, { date: '2026-06-03', remaining: 4, ideal: 0 },
        ]));
        expect(r.finalIdeal).toEqual([10, 0, 0]);
    });

    it('sorts dates correctly', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-05', remaining: 1 }, { date: '2026-06-01', remaining: 10 }, { date: '2026-06-03', remaining: 5 },
        ]));
        expect(r.actualPoints).toEqual([10, 5, 1]);
        expect(r.days).toEqual([0, 1, 2]);
    });

    it('generates ideal line when all ideals are 0 and startRemaining > 0 and lastDay > 0', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10 }, { date: '2026-06-02', remaining: 8 },
        ]));
        expect(r.finalIdeal).toEqual([10, 0]);
    });

    it('returns zeros when startRemaining is 0 and all ideals are 0', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 0, ideal: 0 }, { date: '2026-06-02', remaining: 0, ideal: 0 },
        ]));
        expect(r.finalIdeal).toEqual([0, 0]);
    });

    it('returns ideals as-is when they are not all zero', () => {
        const r = processBurndownPoints(pts([
            { date: '2026-06-01', remaining: 10, ideal: 10 }, { date: '2026-06-02', remaining: 7, ideal: 4 },
        ]));
        expect(r.finalIdeal).toEqual([10, 4]);
    });
});

describe('handleCrossPoint', () => {
    it('adds to behind when diffLeft >= 0 and diffRight >= 0', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        handleCrossPoint(3, 2, { x: 5, y0: 3, y1: 5, behind: true }, behind, ahead);
        expect(behind).toHaveLength(2);
        expect(ahead).toHaveLength(0);
    });

    it('adds to ahead when diffLeft < 0 and diffRight < 0', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        handleCrossPoint(-3, -2, { x: 5, y0: 5, y1: 3, behind: false }, behind, ahead);
        expect(behind).toHaveLength(0);
        expect(ahead).toHaveLength(2);
    });

    it('splits copies when diffLeft >= 0 and diffRight < 0', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        handleCrossPoint(2, -1, { x: 5, y0: 3, y1: 5, behind: false }, behind, ahead);
        expect(behind).toHaveLength(1);
        expect(ahead).toHaveLength(1);
    });

    it('splits copies when diffLeft < 0 and diffRight >= 0', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        handleCrossPoint(-1, 2, { x: 5, y0: 3, y1: 5, behind: false }, behind, ahead);
        expect(behind).toHaveLength(1);
        expect(ahead).toHaveLength(1);
    });

    it('does not mutate the original crossPoint object', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const crossPoint = { x: 5, y0: 3, y1: 5, behind: false };
        handleCrossPoint(2, -1, crossPoint, behind, ahead);
        expect(crossPoint.behind).toBe(false);
    });
});

describe('processSegment', () => {
    const xs = (v: number) => v * 10;
    const ys = (v: number) => 100 - v * 10;

    it('adds left point to behind when actual >= ideal (no crossing)', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        processSegment(0, [0, 1], [10, 8], [5, 5], xs, ys, behind, ahead);
        expect(behind).toHaveLength(1);
        expect(ahead).toHaveLength(0);
    });

    it('adds left point to ahead when actual < ideal (no crossing)', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        processSegment(0, [0, 1], [5, 3], [10, 8], xs, ys, behind, ahead);
        expect(behind).toHaveLength(0);
        expect(ahead).toHaveLength(1);
    });

    it('handles crossing from ahead to behind', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        processSegment(0, [0, 1], [5, 10], [8, 8], xs, ys, behind, ahead);
        expect(behind.length).toBeGreaterThan(0);
        expect(ahead.length).toBeGreaterThan(0);
    });

    it('handles crossing from behind to ahead', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        processSegment(0, [0, 1], [10, 5], [8, 8], xs, ys, behind, ahead);
        expect(behind.length).toBeGreaterThan(0);
        expect(ahead.length).toBeGreaterThan(0);
    });

    it('handles equal values (no crossing)', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        processSegment(0, [0, 1], [8, 8], [8, 8], xs, ys, behind, ahead);
        expect(behind).toHaveLength(1);
        expect(ahead).toHaveLength(0);
    });

    it('processes later segments', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        processSegment(1, [0, 1, 2], [10, 8, 6], [10, 6, 2], xs, ys, behind, ahead);
        expect(behind.length + ahead.length).toBeGreaterThan(0);
    });
});

describe('buildEnhancedPoints', () => {
    const xs = (v: number) => v * 10;
    const ys = (v: number) => 100 - v * 10;

    it('returns both behind and ahead arrays', () => {
        const r = buildEnhancedPoints([0, 1], [10, 5], [10, 5], xs, ys);
        expect(r.enhancedBehind.length + r.enhancedAhead.length).toBeGreaterThan(0);
    });

    it('handles crossing lines', () => {
        const r = buildEnhancedPoints([0, 1, 2], [10, 8, 6], [10, 6, 2], xs, ys);
        expect(r.enhancedAhead.length + r.enhancedBehind.length).toBeGreaterThan(0);
    });

    it('handles single day (no segments to iterate)', () => {
        const r = buildEnhancedPoints([0], [10], [10], xs, ys);
        expect(r.enhancedBehind.length + r.enhancedAhead.length).toBe(1);
    });

    it('all behind when actual >= ideal for all points', () => {
        const r = buildEnhancedPoints([0, 1], [10, 8], [5, 5], xs, ys);
        expect(r.enhancedBehind.length).toBeGreaterThan(0);
        expect(r.enhancedAhead).toHaveLength(0);
    });

    it('all ahead when actual <= ideal for all points', () => {
        const r = buildEnhancedPoints([0, 1], [5, 3], [10, 8], xs, ys);
        expect(r.enhancedAhead.length).toBeGreaterThan(0);
        expect(r.enhancedBehind).toHaveLength(0);
    });

    it('processes multiple segments', () => {
        const r = buildEnhancedPoints([0, 1, 2, 3], [10, 8, 6, 4], [8, 6, 4, 2], xs, ys);
        expect(r.enhancedBehind.length + r.enhancedAhead.length).toBeGreaterThanOrEqual(4);
    });
});

describe('drawBurndownChart', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="chart-container"></div>';
    });

    it('logs error when container not found', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await drawBurndownChart('non-existent-id', []);
        expect(consoleSpy).toHaveBeenCalledWith('Burndown container not found');
        consoleSpy.mockRestore();
    });

    it('shows empty state when points array is empty', async () => {
        const container = document.getElementById('chart-container')!;
        await drawBurndownChart(container, []);
        expect(container.innerHTML).toContain('No burndown data available');
    });

    it('shows empty state when points is null', async () => {
        const container = document.getElementById('chart-container')!;
        await drawBurndownChart(container, null as unknown as []);
        expect(container.innerHTML).toContain('No burndown data available');
    });

    it('renders chart with mocked D3 for valid points', async () => {
        const d3 = makeMockD3();
        mockLoadD3.mockResolvedValue(d3);

        const points = pts([
            { date: '2026-06-01', remaining: 10, ideal: 10 },
            { date: '2026-06-02', remaining: 7, ideal: 5 },
            { date: '2026-06-03', remaining: 4, ideal: 0 },
        ]);

        const container = document.getElementById('chart-container')!;
        await drawBurndownChart(container, points);

        expect(mockLoadD3).toHaveBeenCalled();
        expect(d3.select).toHaveBeenCalled();
    });

    it('accepts string id for container', async () => {
        const d3 = makeMockD3();
        mockLoadD3.mockResolvedValue(d3);

        const points = pts([
            { date: '2026-06-01', remaining: 10 },
            { date: '2026-06-03', remaining: 4 },
        ]);

        await drawBurndownChart('chart-container', points);
        expect(mockLoadD3).toHaveBeenCalled();
    });
});
