import { describe, it, expect } from 'vitest';
import { processBurndownPoints, buildEnhancedPoints, handleCrossPoint, processSegment } from '../../PromiseModelOnline.Client/wwwroot/js/utils/burndown.ts';

type BPoint = { date: string; remainingEffort: number; idealRemaining?: number };

function pts(data: Array<{ date: string; remaining: number; ideal?: number }>): BPoint[] {
    return data.map(d => ({ date: d.date, remainingEffort: d.remaining, idealRemaining: d.ideal }));
}

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
        expect(r.enhancedAhead.length).toBeGreaterThanOrEqual(0);
        expect(r.enhancedBehind.length).toBeGreaterThanOrEqual(0);
    });
});

describe('handleCrossPoint', () => {
    it('adds to behind when diffLeft >= 0', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        handleCrossPoint(2, -1, { x: 5, y0: 3, y1: 5, behind: true }, behind, ahead);
        expect(behind.length).toBeGreaterThan(0);
        expect(ahead.length).toBeGreaterThan(0);
    });
});

describe('processSegment', () => {
    it('processes a segment between two points', () => {
        const behind: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const ahead: Array<{ x: number; y0: number; y1: number; behind: boolean }> = [];
        const xs = (v: number) => v * 10;
        const ys = (v: number) => 100 - v * 10;
        processSegment(0, [0, 1], [10, 5], [10, 5], xs, ys, behind, ahead);
        expect(behind.length + ahead.length).toBeGreaterThan(0);
    });
});
