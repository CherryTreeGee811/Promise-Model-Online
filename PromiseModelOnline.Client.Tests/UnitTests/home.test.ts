import { describe, it, expect, beforeEach } from 'vitest';
import { loadHomePage } from '../../PromiseModelOnline.Client/wwwroot/js/home.ts';

describe('loadHomePage', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.head.innerHTML = '';
    });

    it('populates CTA area with anonymous links when not logged in', () => {
        const ctaTop = document.createElement('div');
        ctaTop.id = 'home-cta-area';
        document.body.append(ctaTop);

        const ctaBottom = document.createElement('div');
        ctaBottom.id = 'home-cta-area-bottom';
        document.body.append(ctaBottom);

        loadHomePage();

        const links = ctaTop.querySelectorAll('a');
        expect(links.length).toBeGreaterThanOrEqual(2);
        expect(links[0].getAttribute('href')).toBe('/login');
    });

    it('handles missing CTA elements gracefully', () => {
        expect(() => loadHomePage()).not.toThrow();
    });

    it('handles partial CTA elements (top only)', () => {
        const ctaTop = document.createElement('div');
        ctaTop.id = 'home-cta-area';
        document.body.append(ctaTop);
        expect(() => loadHomePage()).not.toThrow();
    });

    it('handles partial CTA elements (bottom only)', () => {
        const ctaBottom = document.createElement('div');
        ctaBottom.id = 'home-cta-area-bottom';
        document.body.append(ctaBottom);
        expect(() => loadHomePage()).not.toThrow();
    });
});
