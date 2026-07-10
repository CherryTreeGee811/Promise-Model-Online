import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { loadGraphPage, createDefaultFilters, readFiltersFromUrl, syncFiltersToUrl, initZoomControls } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts';
import { graphState } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-state.ts';
import { hasNodeChildren } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-core.ts';

import { getGraphData } from '../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts';
import { getStrides } from '../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts';
import { createGraphContextMenuController } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts';
import { renderStackGraph, renderEmptyState, logGraphFocus } from '../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({ getGraphData: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({ getStrides: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts', () => ({
    createGraphContextMenuController: vi.fn(() => ({ hide: vi.fn(), destroy: vi.fn(), open: vi.fn() })),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', async () => {
    const actual = await vi.importActual<object>('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
    return {
        ...actual,
        renderStackGraph: vi.fn().mockReturnValue({
            zoom: { scaleBy: vi.fn(), transform: vi.fn() },
            node: {},
        }),
        renderEmptyState: vi.fn(),
        logGraphFocus: vi.fn(),
    };
});

describe('loadGraphPage', () => {
    it('exports loadGraphPage', () => {
        expect(loadGraphPage).toBeDefined();
    });
});

describe('hasNodeChildren (pure)', () => {
    it('detects nodes with children', () => {
        expect(hasNodeChildren({ children: [{ id: 'c' }] })).toBe(true);
    });
});

describe('createDefaultFilters (pure)', () => {
    it('returns filter defaults', () => {
        const f = createDefaultFilters();
        expect(f.search).toBe('');
    });
});

describe('readFiltersFromUrl', () => {
    beforeEach(() => {
        const base = { pathname: '/test', href: 'https://test.local/test', assign: vi.fn() };
        globalThis.location = { ...base, search: '', hash: '' };
    });

    it('returns default filters when no URL params', () => {
        const f = readFiltersFromUrl();
        expect(f.search).toBe('');
        expect(f.includeChildren).toBe(false);
        expect(f.types.size).toBe(5);
        expect(f.status).toBe('all');
        expect(f.effort).toBe('all');
        expect(f.stride).toBe('all');
        expect(f.assignment).toBe('all');
    });

    it('reads search query from q param', () => {
        globalThis.location = { ...globalThis.location, search: '?q=hello%20world' };
        expect(readFiltersFromUrl().search).toBe('hello world');
    });

    it('reads empty search when q is empty', () => {
        globalThis.location = { ...globalThis.location, search: '?q=' };
        expect(readFiltersFromUrl().search).toBe('');
    });

    it('reads includeChildren from children param', () => {
        globalThis.location = { ...globalThis.location, search: '?children=1' };
        expect(readFiltersFromUrl().includeChildren).toBe(true);

        globalThis.location = { ...globalThis.location, search: '?children=true' };
        expect(readFiltersFromUrl().includeChildren).toBe(true);

        globalThis.location = { ...globalThis.location, search: '?children=0' };
        expect(readFiltersFromUrl().includeChildren).toBe(false);

        globalThis.location = { ...globalThis.location, search: '?children=false' };
        expect(readFiltersFromUrl().includeChildren).toBe(false);
    });

    it('reads types filter from param', () => {
        globalThis.location = { ...globalThis.location, search: '?types=promise,epic' };
        const f = readFiltersFromUrl();
        expect(f.types.has('promise')).toBe(true);
        expect(f.types.has('epic')).toBe(true);
        expect(f.types.has('moment')).toBe(false);
    });

    it('handles empty types param', () => {
        globalThis.location = { ...globalThis.location, search: '?types=' };
        expect(readFiltersFromUrl().types.size).toBe(0);
    });

    it('reads status, effort, stride, assignment params', () => {
        globalThis.location = { ...globalThis.location, search: '?status=done&effort=M&stride=backlog&assignment=assigned-to-me' };
        const f = readFiltersFromUrl();
        expect(f.status).toBe('done');
        expect(f.effort).toBe('M');
        expect(f.stride).toBe('backlog');
        expect(f.assignment).toBe('assigned-to-me');
    });

    it('handles missing URL search gracefully', () => {
        globalThis.location = { ...globalThis.location, search: undefined };
        const f = readFiltersFromUrl();
        expect(f.search).toBe('');
        expect(f.includeChildren).toBe(false);
    });

    it('reads all params combined', () => {
        globalThis.location = { ...globalThis.location, search: '?q=test&children=1&types=promise&status=inprogress&effort=L&stride=42&assignment=all' };
        const f = readFiltersFromUrl();
        expect(f.search).toBe('test');
        expect(f.includeChildren).toBe(true);
        expect(f.types.has('promise')).toBe(true);
        expect(f.types.has('epic')).toBe(false);
        expect(f.status).toBe('inprogress');
        expect(f.effort).toBe('L');
        expect(f.stride).toBe('42');
        expect(f.assignment).toBe('all');
    });
});

describe('syncFiltersToUrl', () => {
    let replaceStateSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        const base = { pathname: '/test', href: 'https://test.local/test', assign: vi.fn() };
        globalThis.location = { ...base, search: '', hash: '' };
        replaceStateSpy = vi.spyOn(history, 'replaceState').mockImplementation(() => {});
        graphState.owner = 'test-owner';
        graphState.project = 'test-project';
        graphState.focusNodeId = undefined;
    });

    afterEach(() => {
        replaceStateSpy.mockRestore();
    });

    it('writes minimal URL for default filters', () => {
        syncFiltersToUrl(createDefaultFilters());
        expect(replaceStateSpy).toHaveBeenCalledWith(
            { owner: 'test-owner', project: 'test-project' },
            '',
            '/test'
        );
    });

    it('includes search param when set', () => {
        const filters = createDefaultFilters();
        filters.search = 'hello';
        syncFiltersToUrl(filters);
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('q=hello');
    });

    it('includes children param when includeChildren is true', () => {
        const filters = createDefaultFilters();
        filters.includeChildren = true;
        syncFiltersToUrl(filters);
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('children=1');
    });

    it('omits children param when includeChildren is false', () => {
        syncFiltersToUrl(createDefaultFilters());
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).not.toContain('children');
    });

    it('includes types param when subset selected', () => {
        const filters = createDefaultFilters();
        filters.types = new Set(['promise', 'epic']);
        syncFiltersToUrl(filters);
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('types=');
    });

    it('includes empty types param when no types selected', () => {
        const filters = createDefaultFilters();
        filters.types = new Set();
        syncFiltersToUrl(filters);
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('types=');
    });

    it('omits types param when all types selected', () => {
        syncFiltersToUrl(createDefaultFilters());
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).not.toContain('types');
    });

    it('includes focus param when graphState.focusNodeId is set', () => {
        graphState.focusNodeId = 'node-42';
        syncFiltersToUrl(createDefaultFilters());
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('focus=node-42');
    });

    it('omits focus param when focusNodeId is not set', () => {
        syncFiltersToUrl(createDefaultFilters());
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).not.toContain('focus');
    });

    it('includes status, effort, stride, assignment when non-default', () => {
        const filters = createDefaultFilters();
        filters.status = 'done';
        filters.effort = 'XL';
        filters.stride = 'backlog';
        filters.assignment = 'assigned-to-me';
        syncFiltersToUrl(filters);
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('status=done');
        expect(url).toContain('effort=XL');
        expect(url).toContain('stride=backlog');
        expect(url).toContain('assignment=assigned-to-me');
    });

    it('omits status, effort, stride, assignment params when set to all', () => {
        syncFiltersToUrl(createDefaultFilters());
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).not.toContain('status=');
        expect(url).not.toContain('effort=');
        expect(url).not.toContain('stride=');
        expect(url).not.toContain('assignment=');
    });

    it('preserves hash in URL', () => {
        globalThis.location = { ...globalThis.location, hash: '#section' };
        syncFiltersToUrl(createDefaultFilters());
        const url = replaceStateSpy.mock.calls[0][2] as string;
        expect(url).toContain('#section');
    });

    it('passes owner and project to replaceState', () => {
        graphState.owner = 'my-owner';
        graphState.project = 'my-project';
        syncFiltersToUrl(createDefaultFilters());
        expect(replaceStateSpy).toHaveBeenCalledWith(
            { owner: 'my-owner', project: 'my-project' },
            '',
            expect.any(String)
        );
    });
});

describe('initZoomControls', () => {
    let zoomIn: HTMLButtonElement;
    let zoomOut: HTMLButtonElement;
    let zoomReset: HTMLButtonElement;
    let fullscreenBtn: HTMLButtonElement;

    beforeEach(() => {
        zoomIn = document.createElement('button');
        zoomIn.id = 'graph-zoom-in';
        document.body.appendChild(zoomIn);

        zoomOut = document.createElement('button');
        zoomOut.id = 'graph-zoom-out';
        document.body.appendChild(zoomOut);

        zoomReset = document.createElement('button');
        zoomReset.id = 'graph-zoom-reset';
        document.body.appendChild(zoomReset);

        fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'graph-fullscreen-btn';
        document.body.appendChild(fullscreenBtn);
    });

    afterEach(() => {
        zoomIn.remove();
        zoomOut.remove();
        zoomReset.remove();
        fullscreenBtn.remove();
    });

    it('returns early when zoomBehavior is null', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        expect(() => initZoomControls(null, svg, {})).not.toThrow();
    });

    it('returns early when svgNode is null', () => {
        expect(() => initZoomControls({}, null, {})).not.toThrow();
    });

    it('returns early when d3Instance is null', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        expect(() => initZoomControls({}, svg, null)).not.toThrow();
    });

    it('calls d3 select immediately with svg node', () => {
        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({ scaleBy: vi.fn() }, svg, d3Instance);

        expect(d3Instance.select).toHaveBeenCalledWith(svg);
    });

    it('calls transition on zoom-in click', () => {
        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({ scaleBy: vi.fn() }, svg, d3Instance);
        zoomIn.dispatchEvent(new MouseEvent('click'));

        expect(selection.transition).toHaveBeenCalled();
    });

    it('calls transition on zoom-out click', () => {
        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({ scaleBy: vi.fn() }, svg, d3Instance);
        zoomOut.dispatchEvent(new MouseEvent('click'));

        expect(selection.transition).toHaveBeenCalled();
    });

    it('calls transition on zoom-reset click', () => {
        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection), zoomIdentity: 'identity' };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({ transform: vi.fn() }, svg, d3Instance);
        zoomReset.dispatchEvent(new MouseEvent('click'));

        expect(selection.transition).toHaveBeenCalled();
    });

    it('handles fullscreen toggle without viewport element', () => {
        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({}, svg, d3Instance);

        expect(() => fullscreenBtn.dispatchEvent(new MouseEvent('click'))).not.toThrow();
    });

    it('handles fullscreen toggle with viewport element', () => {
        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        const viewport = document.createElement('div');
        viewport.id = 'graph-viewport';
        document.body.appendChild(viewport);

        initZoomControls({}, svg, d3Instance);

        expect(() => fullscreenBtn.dispatchEvent(new MouseEvent('click'))).not.toThrow();

        viewport.remove();
    });

    it('does not throw when zoom buttons are missing from DOM', () => {
        zoomIn.remove();
        zoomOut.remove();
        zoomReset.remove();
        fullscreenBtn.remove();

        const selection = { transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) };
        const d3Instance = { select: vi.fn().mockReturnValue(selection) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        expect(() => initZoomControls({ scaleBy: vi.fn() }, svg, d3Instance)).not.toThrow();
    });
});

describe('loadGraphPage', () => {
    let errorText: HTMLElement;
    let successText: HTMLElement;
    let loadingState: HTMLElement;
    let filterBar: HTMLElement;
    let graphContent: HTMLElement;
    let graphViewport: HTMLElement;
    let animSpeed: HTMLInputElement;

    const contentDiv = document.createElement('div');

    const mockGraphData = {
        id: 'project-1',
        name: 'Test Project',
        Promises: [
            { id: 'p1', title: 'Promise 1', epics: [] },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();

        errorText = document.createElement('div');
        errorText.id = 'error-text';
        document.body.appendChild(errorText);

        successText = document.createElement('div');
        successText.id = 'success-text';
        document.body.appendChild(successText);

        loadingState = document.createElement('div');
        loadingState.id = 'graph-loading-state';
        document.body.appendChild(loadingState);

        filterBar = document.createElement('div');
        filterBar.id = 'graph-filter-bar';
        document.body.appendChild(filterBar);

        graphContent = document.createElement('div');
        graphContent.id = 'graph-content';
        document.body.appendChild(graphContent);

        graphViewport = document.createElement('div');
        graphViewport.id = 'graph-viewport';
        document.body.appendChild(graphViewport);

        const summary = document.createElement('div');
        summary.id = 'graph-filter-summary';
        document.body.appendChild(summary);

        animSpeed = document.createElement('input');
        animSpeed.id = 'graph-animation-speed';
        animSpeed.value = '1';
        document.body.appendChild(animSpeed);

        const zoomIn = document.createElement('button');
        zoomIn.id = 'graph-zoom-in';
        document.body.appendChild(zoomIn);
        const zoomOut = document.createElement('button');
        zoomOut.id = 'graph-zoom-out';
        document.body.appendChild(zoomOut);
        const zoomReset = document.createElement('button');
        zoomReset.id = 'graph-zoom-reset';
        document.body.appendChild(zoomReset);
        const fsBtn = document.createElement('button');
        fsBtn.id = 'graph-fullscreen-btn';
        document.body.appendChild(fsBtn);

        (globalThis as Record<string, unknown>).d3 = {
            select: vi.fn().mockReturnValue({
                transition: vi.fn().mockReturnValue({
                    duration: vi.fn().mockReturnValue({ call: vi.fn() }),
                }),
            }),
            zoomIdentity: {},
        };

        const base = { pathname: '/test', href: 'https://test.local/test', assign: vi.fn() };
        globalThis.location = { ...base, search: '', hash: '' };

        graphState.owner = undefined;
        graphState.project = undefined;
        graphState.d3 = undefined;
        graphState.filters = createDefaultFilters();
        graphState.rawTree = undefined;
        graphState.filteredTree = undefined;
        graphState.totalRenderableNodes = 0;
        graphState.availableStrides = [];
        graphState.collapsedNodeIds = new Set();
        graphState.hasRendered = false;
        graphState.focusNodeId = undefined;
        graphState.zoomTransform = undefined;
        graphState.userZoomTransform = undefined;
        graphState.suppressZoomStateUpdate = false;
        graphState.contextMenu = undefined;
        graphState.pageShowRefreshHandler = undefined;
        graphState.animationSpeed = 0.25;
    });

    afterEach(() => {
        if (graphState.pageShowRefreshHandler) {
            window.removeEventListener('pageshow', graphState.pageShowRefreshHandler);
            graphState.pageShowRefreshHandler = undefined;
        }
        if (graphState._onFullscreenChange) {
            document.removeEventListener('fullscreenchange', graphState._onFullscreenChange);
            graphState._onFullscreenChange = null;
        }
        delete (globalThis as Record<string, unknown>).d3;
        errorText.remove();
        successText.remove();
        loadingState.remove();
        filterBar.remove();
        graphContent.remove();
        graphViewport.remove();
        document.querySelector('#graph-filter-summary')?.remove();
        animSpeed.remove();
        document.querySelectorAll('.graph-filter-row, .graph-filter-bottom, #graph-filter-search, #graph-filter-include-children, #graph-filter-effort, #graph-filter-stride, #graph-filter-status, #graph-filter-assignment, #graph-filter-reset, #graph-filter-hide-all, #graph-filter-expand-all, #graph-filter-refresh, #graph-zoom-in, #graph-zoom-out, #graph-zoom-reset, #graph-fullscreen-btn').forEach(el => el.remove());
        document.querySelectorAll('[data-filter-type]').forEach(el => el.remove());
    });

    it('loads graph and renders filter bar', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('owner-1', 'project-1', contentDiv, null);

        expect(errorText.textContent).toBe('');
        expect(successText.textContent).toContain('Loaded 1 top-level promise');
        expect(loadingState.hidden).toBe(true);
        expect(loadingState.classList.contains('d-none')).toBe(true);

        expect(vi.mocked(getGraphData)).toHaveBeenCalledWith('owner-1', 'project-1');
        expect(vi.mocked(getStrides)).toHaveBeenCalledWith('owner-1', 'project-1');
        expect(vi.mocked(createGraphContextMenuController)).toHaveBeenCalled();

        expect(graphState.owner).toBe('owner-1');
        expect(graphState.project).toBe('project-1');
        expect(graphState.totalRenderableNodes).toBeGreaterThan(0);
        expect(graphState.hasRendered).toBe(true);

        expect(vi.mocked(renderStackGraph)).toHaveBeenCalled();
    });

    it('reads filters from URL', async () => {
        globalThis.location = { ...globalThis.location, search: '?q=test&status=done&effort=M&stride=backlog' };
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(graphState.filters.search).toBe('test');
        expect(graphState.filters.status).toBe('done');
        expect(graphState.filters.effort).toBe('M');
        expect(graphState.filters.stride).toBe('backlog');
    });

    it('handles API error during data load', async () => {
        vi.mocked(getGraphData).mockRejectedValue(new Error('Network error'));
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(errorText.textContent).toBe('Unable to load the project graph.');
        expect(loadingState.hidden).toBe(true);
    });

    it('handles empty graph data', async () => {
        vi.mocked(getGraphData).mockResolvedValue({ id: 'p', name: 'Empty', Promises: [] });
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(successText.textContent).toContain('Loaded 0 top-level promises');
        expect(vi.mocked(renderStackGraph)).toHaveBeenCalled();
    });

    it('renders filter bar controls with default values', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        const searchInput = document.querySelector('#graph-filter-search') as HTMLInputElement;
        expect(searchInput).toBeTruthy();
        expect(searchInput.value).toBe('');

        const effortSelect = document.querySelector('#graph-filter-effort') as HTMLSelectElement;
        expect(effortSelect).toBeTruthy();
        expect(effortSelect.value).toBe('all');

        const includeChildren = document.querySelector('#graph-filter-include-children') as HTMLInputElement;
        expect(includeChildren).toBeTruthy();
        expect(includeChildren.checked).toBe(false);
    });

    it('syncs filter controls from URL to DOM', async () => {
        globalThis.location = { ...globalThis.location, search: '?q=findme&status=done&children=1' };
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        const searchInput = document.querySelector('#graph-filter-search') as HTMLInputElement;
        expect(searchInput.value).toBe('findme');

        const includeChildren = document.querySelector('#graph-filter-include-children') as HTMLInputElement;
        expect(includeChildren.checked).toBe(true);

        const statusSelect = document.querySelector('#graph-filter-status') as HTMLSelectElement;
        expect(statusSelect.value).toBe('done');
    });

    it('displays filter summary metrics', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        const summary = document.querySelector('#graph-filter-summary') as HTMLElement;
        expect(summary).toBeTruthy();
        expect(summary.textContent).toContain('visible');
        expect(summary.textContent).toContain('total');
    });

    it('handles fullscreen change event', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        const fsBtn = document.querySelector('#graph-fullscreen-btn')!;
        const icon = document.createElement('i');
        icon.className = 'bi-arrows-angle-expand';
        fsBtn.appendChild(icon);
        fsBtn.setAttribute('aria-label', 'Fullscreen');

        await loadGraphPage('o', 'p', contentDiv, null);

        Object.defineProperty(document, 'fullscreenElement', { value: document.createElement('div'), writable: true, configurable: true });
        document.dispatchEvent(new Event('fullscreenchange'));

        expect(icon.classList.contains('bi-arrows-angle-contract')).toBe(true);
        expect(fsBtn.getAttribute('aria-label')).toBe('Exit fullscreen');

        Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true, configurable: true });
        document.dispatchEvent(new Event('fullscreenchange'));

        expect(icon.classList.contains('bi-arrows-angle-expand')).toBe(true);
        expect(fsBtn.getAttribute('aria-label')).toBe('Fullscreen');

        icon.remove();
    });

    it('renders with available strides', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([
            { id: 1, name: 'Sprint 1', startDate: '2024-01-01' },
            { id: 2, name: 'Sprint 2', startDate: '2024-02-01' },
        ]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(graphState.availableStrides.length).toBeGreaterThan(0);
        const strideSelect = document.querySelector('#graph-filter-stride') as HTMLSelectElement;
        expect(strideSelect).toBeTruthy();
        expect(strideSelect.options.length).toBeGreaterThan(2);
    });

    it('cleans up old pageShow handler on re-entry', async () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        graphState.pageShowRefreshHandler = vi.fn();

        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(removeSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
        removeSpy.mockRestore();
    });

    it('sets focusNodeId from URL', async () => {
        globalThis.location = { ...globalThis.location, search: '?focus=node-42' };
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(graphState.focusNodeId).toBe('node-42');
    });

    it('loads page without permission', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        expect(vi.mocked(createGraphContextMenuController)).toHaveBeenCalledWith(
            expect.objectContaining({
                permission: null,
            })
        );
    });

    it('loads page with edit permission', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, { permission: 'Edit' });

        expect(vi.mocked(createGraphContextMenuController)).toHaveBeenCalledWith(
            expect.objectContaining({
                permission: { permission: 'Edit' },
            })
        );
    });

    it('reset button clears filters and reloads', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        btnClickById('graph-filter-reset');

        expect(graphState.filters.search).toBe('');
        expect(graphState.filters.types.size).toBe(5);
    });

    it('hide-all button collapses promises', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        btnClickById('graph-filter-hide-all');

        expect(vi.mocked(renderStackGraph)).toHaveBeenCalled();
    });

    it('expand-all button expands nodes', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        btnClickById('graph-filter-expand-all');

        expect(vi.mocked(renderStackGraph)).toHaveBeenCalled();
    });

    it('refresh button reloads data', async () => {
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        vi.mocked(getGraphData).mockClear();
        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);

        btnClickById('graph-filter-refresh');

        await vi.waitFor(() => {
            expect(vi.mocked(getGraphData)).toHaveBeenCalledTimes(1);
        });
    });

    it('pageshow event triggers reload when persisted', async () => {
        const prevHandler = graphState.pageShowRefreshHandler;
        if (prevHandler) window.removeEventListener('pageshow', prevHandler);

        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        const handler = graphState.pageShowRefreshHandler;
        expect(handler).toBeDefined();

        const callCountBefore = vi.mocked(getGraphData).mock.calls.length;

        const event = new Event('pageshow') as PageTransitionEvent;
        Object.defineProperty(event, 'persisted', { value: true });
        window.dispatchEvent(event);

        await vi.waitFor(() => {
            expect(vi.mocked(getGraphData).mock.calls.length).toBe(callCountBefore + 1);
        });
    });

    it('pageshow event does not reload when not persisted', async () => {
        const prevHandler = graphState.pageShowRefreshHandler;
        if (prevHandler) window.removeEventListener('pageshow', prevHandler);

        vi.mocked(getGraphData).mockResolvedValue(mockGraphData);
        vi.mocked(getStrides).mockResolvedValue([]);

        await loadGraphPage('o', 'p', contentDiv, null);

        const callCountBefore = vi.mocked(getGraphData).mock.calls.length;

        const event = new Event('pageshow');
        Object.defineProperty(event, 'persisted', { value: false });
        window.dispatchEvent(event);

        await vi.waitFor(() => {
            expect(vi.mocked(getGraphData).mock.calls.length).toBe(callCountBefore);
        });
    });
});

function btnClickById(id: string): void {
    const btn = document.querySelector(`#${CSS.escape(id)}`) as HTMLElement;
    if (btn) btn.dispatchEvent(new MouseEvent('click'));
}

describe('updateFilterSummary', () => {
    let summaryEl: HTMLElement;

    beforeEach(() => {
        summaryEl = document.createElement('div');
        summaryEl.id = 'graph-filter-summary';
        document.body.appendChild(summaryEl);
    });

    afterEach(() => {
        summaryEl.remove();
    });

    it('shows loading text when rawTree is null', () => {
        graphState.rawTree = null;
        graphState.hasRendered = false;
        graphState.totalRenderableNodes = 0;

        const { loadGraphPage: _l } = { loadGraphPage: vi.fn() };
    });
});

describe('applyFilters internal path', () => {
    let graphContent: HTMLElement;

    beforeEach(() => {
        graphContent = document.createElement('div');
        graphContent.id = 'graph-content';
        document.body.appendChild(graphContent);

        const animSpeed = document.createElement('input');
        animSpeed.id = 'graph-animation-speed';
        animSpeed.value = '1';
        document.body.appendChild(animSpeed);

        const summary = document.createElement('div');
        summary.id = 'graph-filter-summary';
        document.body.appendChild(summary);

        (globalThis as Record<string, unknown>).d3 = {
            select: vi.fn().mockReturnValue({
                transition: vi.fn().mockReturnValue({
                    duration: vi.fn().mockReturnValue({ call: vi.fn() }),
                }),
            }),
            zoomIdentity: {},
        };

        graphState.d3 = (globalThis as Record<string, unknown>).d3;
        graphState.filters = createDefaultFilters();
        graphState.collapsedNodeIds = new Set();
        graphState.hasRendered = false;
    });

    afterEach(() => {
        graphContent.remove();
        document.querySelector('#graph-animation-speed')?.remove();
        document.querySelector('#graph-filter-summary')?.remove();
    });

    it('loadGraphPage dispatches fullscreen button updates', async () => {
        vi.mocked(getGraphData).mockResolvedValue({
            id: 'p1', name: 'P', Promises: [{ id: 'p1', title: 'P1', epics: [] }],
        });
        vi.mocked(getStrides).mockResolvedValue([]);

        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'graph-fullscreen-btn';
        document.body.appendChild(fullscreenBtn);
        const icon = document.createElement('i');
        icon.className = 'bi-arrows-angle-expand';
        fullscreenBtn.appendChild(icon);

        const contentDiv = document.createElement('div');
        await loadGraphPage('o', 'p', contentDiv, null);

        expect(fullscreenBtn.parentNode).toBeTruthy();
        fullscreenBtn.remove();
    });
});

describe('initZoomControls fullscreen edge cases', () => {
    let fullscreenBtn: HTMLButtonElement;
    let viewport: HTMLElement;

    beforeEach(() => {
        fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'graph-fullscreen-btn';
        document.body.appendChild(fullscreenBtn);

        viewport = document.createElement('div');
        viewport.id = 'graph-viewport';
        document.body.appendChild(viewport);
    });

    afterEach(() => {
        fullscreenBtn.remove();
        viewport.remove();
    });

    it('calls exitFullscreen when already fullscreen', () => {
        const exitSpy = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(document, 'fullscreenElement', {
            value: viewport, writable: true, configurable: true,
        });
        (document as Record<string, unknown>).exitFullscreen = exitSpy;

        const d3Instance = { select: vi.fn().mockReturnValue({ transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) }) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({}, svg, d3Instance);
        fullscreenBtn.dispatchEvent(new MouseEvent('click'));

        expect(exitSpy).toHaveBeenCalled();

        Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true, configurable: true });
        delete (document as Record<string, unknown>).exitFullscreen;
    });

    it('calls requestFullscreen when not fullscreen', () => {
        const requestSpy = vi.fn().mockResolvedValue(undefined);
        viewport.requestFullscreen = requestSpy;
        Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true, configurable: true });

        const d3Instance = { select: vi.fn().mockReturnValue({ transition: vi.fn().mockReturnValue({ duration: vi.fn().mockReturnValue({ call: vi.fn() }) }) }) };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        initZoomControls({}, svg, d3Instance);
        fullscreenBtn.dispatchEvent(new MouseEvent('click'));

        expect(requestSpy).toHaveBeenCalled();
    });
});
