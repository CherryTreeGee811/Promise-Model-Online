export function loadKnowledgeBase() {
    const kbContent = document.getElementById('kb-content');

    kbContent.innerHTML = `
        <section id="overview" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">The Promise Stack Overview</h1>
            <p class="lead text-muted">We ship value, not just features. This knowledge base aligns every technical detail with user value.</p>
            <div class="table-responsive mt-4">
                <table class="table table-bordered table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Level</th>
                            <th>Question</th>
                            <th>Definition</th>
                            <th>Constraint</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><span class="badge bg-primary">1. Promise</span></td><td>WHY does this exist?</td><td>Core value proposition</td><td>3-5 per product</td></tr>
                        <tr><td><span class="badge bg-secondary">2. Epic</span></td><td>WHAT must be possible?</td><td>Major capabilities delivering the promise</td><td>3-5 per Promise</td></tr>
                        <tr><td><span class="badge bg-info text-dark">3. Journey</span></td><td>WHEN is this valuable?</td><td>Complete experience by circumstance</td><td>3-5 per Epic</td></tr>
                        <tr><td><span class="badge bg-warning text-dark">4. Flow</span></td><td>HOW does this happen?</td><td>Process sequence completed in a single session</td><td>3-5 per Journey</td></tr>
                        <tr><td><span class="badge bg-success">5. Moment</span></td><td>WHO does what?</td><td>Implementation unit where code is written</td><td>3-5 per Flow</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section id="section1" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 1: Promise 0 (Universal Standards)</h1>
            <p>Before detailing specific product features, establish the baseline. Promise 0 represents the universal Definition of Done that every single feature inherits automatically.</p>
            <ul class="lh-lg">
                <li><strong>Security:</strong> Documentation on authentication standards, data encryption, and audit logging.</li>
                <li><strong>Accessibility:</strong> Guidelines for WCAG 2.1 AA compliance, screen reader support, and keyboard navigation.</li>
                <li><strong>Performance:</strong> Baselines such as page load times under 2 seconds and API responses under 500ms.</li>
                <li><strong>Compliance & DevOps:</strong> Details on GDPR, testing standards, and CI/CD pipelines.</li>
            </ul>
        </section>

        <section id="section2" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 2: Level 1 - Product Promises (WHY)</h1>
            <p>This section acts as the strategic north star. Everything built must trace back to one of the pages in this category.</p>
            <ul class="lh-lg">
                <li><strong>Core Value Propositions:</strong> Detail the 3-5 fundamental reasons why someone would choose your product.</li>
                <li><strong>The Promise Pattern:</strong> Ensure each promise is formatted as "As a [Persona], [Value Verb] [Outcome]".</li>
                <li><strong>Explicit vs. Implicit Promises:</strong> Document the commitments you are intentionally making, as well as the implicit expectations users have formed from the product's behavior.</li>
            </ul>
        </section>

        <section id="section3" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 3: Level 2 - Epics (WHAT)</h1>
            <p>Create a sub-section for each Epic under its parent Promise.</p>
            <ul class="lh-lg">
                <li><strong>Major Capabilities:</strong> Document the 3-5 essential capabilities required to fulfill the parent Promise.</li>
                <li><strong>The Epic Test:</strong> Include a section verifying that if this Epic were removed, the parent Promise would fail.</li>
            </ul>
        </section>

        <section id="section4" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 4: Level 3 - Journeys (WHEN)</h1>
            <p>Journeys define the circumstances under which the Epics are valuable.</p>
            <ul class="lh-lg">
                <li><strong>Circumstance Mapping:</strong> Document the specific situations or arcs for the persona (e.g., "First-time rider" vs. "Daily commuter").</li>
                <li><strong>Constraint Check:</strong> Ensure there are no more than 3-5 Journeys per Epic to prevent scope creep.</li>
            </ul>
        </section>

        <section id="section5" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 5: Level 4 - Flows (HOW)</h1>
            <p>Flows are the step-by-step processes that make up a Journey.</p>
            <ul class="lh-lg">
                <li><strong>Session Sequences:</strong> Document the distinct processes that a user can complete in a single sitting.</li>
                <li><strong>Start and End Points:</strong> Clearly define the beginning and end of the 3-5 Flows that make up each Journey.</li>
            </ul>
        </section>

        <section id="section6" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 6: Level 5 - Moments (WHO)</h1>
            <p>This is the most granular level of your knowledge base, directly translating to your engineering tickets, because this is the only level where code gets written.</p>
            <ul class="lh-lg">
                <li><strong>Story Moments:</strong> Document the interactions where a single persona acts and receives user-visible value.</li>
                <li><strong>Job Moments:</strong> Document the behind-the-scenes coordination points between multiple personas or systems.</li>
                <li><strong>The Count Test:</strong> Explicitly count the personas involved to ensure accurate classification between Stories and Jobs.</li>
            </ul>
        </section>

        <section id="section7" class="mb-5 p-4 bg-white shadow-sm rounded border">
            <h1 class="border-bottom border-primary border-2 pb-2 mb-4 fs-3 fw-semibold">Section 7: Promise Discovery (The Sandbox)</h1>
            <p>Maintain a separate workspace for ideas that are not yet commitments.</p>
            <ul class="lh-lg">
                <li><strong>Validation of Concept (VOC):</strong> Track signals, mockups, and early research to answer "Is there something here worth building?".</li>
                <li><strong>Testable Value Promise (TVP):</strong> Document specific claims about user value that are ready for testing.</li>
                <li><strong>Core Value Promise (CVP):</strong> Record the evidence gathered that justifies promoting an idea into a fully committed Product Promise.</li>
            </ul>
        </section>
    `;

    initSidebarScroll();
    initScrollSpy();
}

function initSidebarScroll() {
    const navLinks = document.querySelectorAll('#navbar-kb .nav-link');
    const mainEl = document.querySelector('main[data-bs-spy="scroll"]');

    if (!mainEl) return;

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            const hash = link.getAttribute('href');
            if (!hash || !hash.startsWith('#')) return;

            e.preventDefault();

            const target = document.getElementById(hash.slice(1));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initScrollSpy() {
    const mainEl = document.querySelector('main[data-bs-spy="scroll"]');
    if (!mainEl) return;

    const ScrollSpy = window.bootstrap?.ScrollSpy;
    if (ScrollSpy) {
        const instance = ScrollSpy.getInstance(mainEl);
        if (instance) instance.refresh();
    }
}
