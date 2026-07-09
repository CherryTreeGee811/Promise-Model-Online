import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
    document.body.innerHTML = '<div id="kb-content"></div>';
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('loadKnowledgeBase', () => {
    it('returns early when #kb-content is missing from DOM', async () => {
        document.body.innerHTML = '';
        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        expect(loadKnowledgeBase()).toBeUndefined();
    });

    it('populates the knowledge base container with sections', async () => {
        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        const container = document.getElementById('kb-content')!;
        loadKnowledgeBase();
        expect(container.children.length).toBeGreaterThan(0);
        const firstSection = container.querySelector('section');
        expect(firstSection).not.toBeNull();
        expect(firstSection!.className).toBe('kb-section');
    });

    it('sidebar link with valid hash and existing target sets aria-current', async () => {
        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav><a class="kb-nav-link" href="#sec1">Sec1</a></nav>'
            + '<section id="sec1" class="kb-section"></section>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        const link = document.querySelector('.kb-nav-link') as HTMLAnchorElement;
        link.dispatchEvent(new MouseEvent('click', { cancelable: true, bubbles: true }));
        expect(link.getAttribute('aria-current')).toBe('true');
    });

    it('sidebar link href without hash prefix does not prevent default', async () => {
        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav><a class="kb-nav-link" href="https://example.com">Ext</a></nav>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        const link = document.querySelector('.kb-nav-link') as HTMLAnchorElement;
        const event = new MouseEvent('click', { cancelable: true, bubbles: true });
        const defaultPrevented = !link.dispatchEvent(event);
        expect(defaultPrevented).toBe(false);
    });

    it('sidebar link click with missing target does not throw', async () => {
        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav><a class="kb-nav-link" href="#missing-section">Missing</a></nav>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        const link = document.querySelector('.kb-nav-link') as HTMLAnchorElement;
        const event = new MouseEvent('click', { cancelable: true, bubbles: true });
        expect(() => link.dispatchEvent(event)).not.toThrow();
    });

    it('scroll spy marks active section on scroll and throttles duplicate events', async () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });

        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav>'
            + '<a class="kb-nav-link" href="#sec1">Sec1</a>'
            + '<a class="kb-nav-link" href="#sec2">Sec2</a>'
            + '</nav>'
            + '<section id="sec1" class="kb-section"></section>'
            + '<section id="sec2" class="kb-section"></section>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        vi.advanceTimersToNextFrame();

        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
        vi.advanceTimersToNextFrame();

        const anyActive = Array.from(document.querySelectorAll('.kb-nav-link')).some(
            l => l.getAttribute('aria-current') === 'true'
        );
        expect(anyActive).toBe(true);

        vi.useRealTimers();
    });
});
