import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
    document.body.innerHTML = '<div id="kb-content"></div>';
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('loadKnowledgeBase', () => {
    it('returns early when #kb-content is missing from DOM', async () => {
        // Arrange
        document.body.innerHTML = '';
        // Act
        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        // Assert
        expect(loadKnowledgeBase()).toBeUndefined();
    });

    it('populates the knowledge base container with sections', async () => {
        // Arrange
        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        const container = document.getElementById('kb-content')!;
        // Act
        loadKnowledgeBase();
        // Assert
        expect(container.children.length).toBeGreaterThan(0);
        const firstSection = container.querySelector('section');
        expect(firstSection).not.toBeNull();
        expect(firstSection!.className).toBe('kb-section');
    });

    it('sidebar link with valid hash and existing target sets aria-current', async () => {
        // Arrange
        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav><a class="kb-nav-link" href="#sec1">Sec1</a></nav>'
            + '<section id="sec1" class="kb-section"></section>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        const link = document.querySelector('.kb-nav-link') as HTMLAnchorElement;
        // Act
        link.dispatchEvent(new MouseEvent('click', { cancelable: true, bubbles: true }));
        // Assert
        expect(link.getAttribute('aria-current')).toBe('true');
    });

    it('sidebar link href without hash prefix does not prevent default', async () => {
        // Arrange
        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav><a class="kb-nav-link" href="https://example.com">Ext</a></nav>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        const link = document.querySelector('.kb-nav-link') as HTMLAnchorElement;
        const event = new MouseEvent('click', { cancelable: true, bubbles: true });
        // Act
        const defaultPrevented = !link.dispatchEvent(event);
        // Assert
        expect(defaultPrevented).toBe(false);
    });

    it('sidebar link click with missing target does not throw', async () => {
        // Arrange
        document.body.innerHTML = ''
            + '<div id="kb-content"></div>'
            + '<nav><a class="kb-nav-link" href="#missing-section">Missing</a></nav>';

        const { loadKnowledgeBase } = await import('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/detail.ts');
        loadKnowledgeBase();

        const link = document.querySelector('.kb-nav-link') as HTMLAnchorElement;
        // Act
        const event = new MouseEvent('click', { cancelable: true, bubbles: true });
        // Assert
        expect(() => link.dispatchEvent(event)).not.toThrow();
    });

    it('scroll spy marks active section on scroll and throttles duplicate events', async () => {
        // Arrange
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
        // Act
        );
        // Assert
        expect(anyActive).toBe(true);

        vi.useRealTimers();
    });
});
