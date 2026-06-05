function section(id, title, content) {
  return `
    <section id="${id}" class="kb-section">
      <h1>${title}</h1>
      ${content}
    </section>
  `;
}

export function loadKnowledgeBase() {
    const kbContent = document.getElementById('kb-content');

    kbContent.innerHTML = [
      section('overview', 'The Promise Stack Overview', `
        <p class="lead">We ship value, not just features. This knowledge base aligns every technical detail with user value.</p>
      section('section1', 'Promise 0 (Universal Standards)', `
      section('section2', 'Product Promises (WHY)', `
      section('section3', 'Epics (WHAT)', `
      section('section4', 'Journeys (WHEN)', `
      section('section5', 'Flows (HOW)', `
      section('section6', 'Moments (WHO)', `
      section('section7', 'Promise Discovery (The Sandbox)', `
        <p>Maintain a separate workspace for ideas that are not yet commitments.</p>
        <ul>
          <li><strong>Validation of Concept (VOC):</strong> Track signals, mockups, and early research to answer &ldquo;Is there something here worth building?&rdquo;.</li>
          <li><strong>Testable Value Promise (TVP):</strong> Document specific claims about user value that are ready for testing.</li>
          <li><strong>Core Value Promise (CVP):</strong> Record the evidence gathered that justifies promoting an idea into a fully committed Product Promise.</li>
        </ul>
      `),
    ].join('\n');

    initSidebarScroll();
    initScrollSpy();
}

function initSidebarScroll() {
    const navLinks = document.querySelectorAll('.kb-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            const hash = link.getAttribute('href');
            if (!hash || !hash.startsWith('#')) return;
            e.preventDefault();

            const target = document.getElementById(hash.slice(1));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navLinks.forEach(l => l.removeAttribute('aria-current'));
                link.setAttribute('aria-current', 'true');
            }
        });
    });
}

function initScrollSpy() {
    const navLinks = document.querySelectorAll('.kb-nav-link');
    const sections = document.querySelectorAll('.kb-section[id]');
    if (!sections.length) return;

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY + 100;
                let currentId = null;
                sections.forEach(section => {
                    const top = section.offsetTop;
                    if (scrollY >= top) currentId = section.id;
                });
                navLinks.forEach(link => {
                    const isCurrent = link.getAttribute('href') === `#${currentId}`;
                    link.setAttribute('aria-current', isCurrent ? 'true' : 'false');
                });
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}
