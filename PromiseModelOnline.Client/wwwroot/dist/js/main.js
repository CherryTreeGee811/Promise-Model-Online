const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/router.js","js/iteration-create-modal.js"])))=>i.map(i=>d[i]);
function e(){let e=document.querySelector(`#delete-account-form`),t=document.querySelector(`#delete-account-btn`),n=document.querySelector(`#delete-btn-text`),r=document.querySelector(`#delete-spinner`),i=document.querySelector(`#delete-error`),a=document.querySelector(`#delete-success`),o=document.querySelector(`#delete-password`),s=document.querySelector(`#export-data-btn`),c=document.querySelector(`#export-btn-text`),l=document.querySelector(`#export-spinner`),u=document.querySelector(`#export-error`),d=document.querySelector(`#export-link-top`);if(!d||!s)return;d.addEventListener(`click`,e=>{e.preventDefault(),s.scrollIntoView({behavior:`smooth`}),s.focus()}),s.addEventListener(`click`,async()=>{u.classList.add(`d-none`),p(!0);try{let e=await fetch(`/api/users/me/export`,{credentials:`include`});if(!e.ok){let t;try{t=await e.json()}catch{t={}}f(t.message||`Failed to export data.`);return}let t=await e.blob(),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`pmo-data-export.json`,document.body.append(r),r.click(),r.remove(),URL.revokeObjectURL(n)}catch{f(`Network error. Please try again.`)}finally{p(!1)}});function f(e){u&&(u.textContent=e,u.classList.remove(`d-none`))}function p(e){!s||!c||!l||(s.disabled=e,c.classList.toggle(`d-none`,e),l.classList.toggle(`d-none`,!e))}if(!e||!i||!a||!o||!t||!n||!r)return;e.addEventListener(`submit`,async t=>{t.preventDefault(),i.classList.add(`d-none`),a.classList.add(`d-none`);let n=o.value.trim();if(!n){m(`Please enter your password.`);return}h(!0);try{let t=await fetch(`/api/users/me`,{method:`DELETE`,credentials:`include`});if(t.status!==204&&t.status!==404){m(`Failed to delete account data. Please try again.`),h(!1);return}let r=await fetch(`/account/me`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({password:n}),credentials:`include`});r.status===204?(a.textContent=`Your account and all associated data have been permanently deleted. You will be redirected shortly.`,a.classList.remove(`d-none`),e.style.display=`none`,setTimeout(()=>{location.assign(`/`)},3e3)):r.status===401?m(`Incorrect password. Please try again.`):m(`Something went wrong. Please try again.`)}catch{m(`Network error. Please check your connection and try again.`)}finally{h(!1)}});function m(e){i.textContent=e,i.classList.remove(`d-none`)}function h(e){t.disabled=e,n.classList.toggle(`d-none`,e),r.classList.toggle(`d-none`,!e)}}function t(e){let t={...e},n=new Set;return{get:()=>t,set(e){t={...t,...e};for(let e of n)typeof e==`function`&&e()},subscribe(e){return n.add(e),()=>{n.delete(e)}}}}var n=`pmo.auth`;function r(){try{let e=sessionStorage.getItem(n);if(e){let t=JSON.parse(e);return{isAuthenticated:!!t.isAuthenticated,username:t.username||void 0,userId:t.userId??void 0}}}catch{}return{isAuthenticated:!1,username:void 0,userId:void 0}}function i(e){try{sessionStorage.setItem(n,JSON.stringify(e))}catch{}}var a=t(r()),o=a.set.bind(a);a.set=e=>{o(e),i(a.get())};function s(){return a.get().isAuthenticated}function c(){return a.get().username}function l(){return a.get().userId}async function u(e){let t=await m(e);if(t.status!==204){if(!t.ok)throw Error(`HTTP ${t.status}`);return t.json()}}async function d(e){return await u(e)??[]}async function f(e,t){let n=await m(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(n.status!==204){if(!n.ok)throw Error(`HTTP ${n.status}`);return n.json()}}async function p(e,t){let n=await m(e,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(n.status!==204){if(!n.ok)throw Error(`HTTP ${n.status}`);return n.json()}}async function m(e,t={}){let n=await fetch(e,{...t,credentials:`include`,headers:{Accept:`application/json`,...t.headers}});if(n.status===401)throw a.set({isAuthenticated:!1,username:void 0,userId:void 0}),location.pathname.startsWith(`/login`)||location.assign(`/login`),Error(`Unauthorized`);return n}async function h(){try{let e=await fetch(`/api/users/me`,{method:`GET`,credentials:`include`});if(e.ok){let t=await e.json();return a.set({isAuthenticated:!0,username:t.name,userId:t.userId}),!0}}catch{}return a.set({isAuthenticated:!1,username:void 0,userId:void 0}),!1}function g(){return s()?{allowed:!0}:{allowed:!1,redirect:`/login`}}function _(){let e=s()?`
      <a href="/projects" class="btn btn-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2" data-nav>
        <i class="bi bi-folder" aria-hidden="true"></i> Go to Projects
      </a>
      <a href="/moments/my-tasks" class="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2" data-nav>
        <i class="bi bi-check2-square" aria-hidden="true"></i> My Tasks
      </a>
      <a href="/knowledge-base" class="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2" data-nav>
        <i class="bi bi-book" aria-hidden="true"></i> Knowledge Base
      </a>`:`
      <a href="/login" class="btn btn-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i> Login
      </a>
      <a href="/account/register" class="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-person-plus" aria-hidden="true"></i> Register
      </a>`,t=document.querySelector(`#home-cta-area`),n=document.querySelector(`#home-cta-area-bottom`);t&&(t.innerHTML=e),n&&(n.innerHTML=e)}function v(e){return String(e).replaceAll(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function ee(e){return`
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${v(e)}">
                <span class="visually-hidden">${v(e)}</span>
            </div>
        </div>
    `}function y({icon:e,title:t,description:n,button:r,colspan:i}){return`
        <tr class="inline-table-empty-row">
            <td colspan="${i}" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                    ${e?`<div class="empty-table-icon"><i class="bi ${v(e)}"></i></div>`:``}
                    ${t?`<h5 class="fw-semibold text-secondary mb-1">${v(t)}</h5>`:``}
                    ${n?`<p class="text-muted mb-2">${v(n)}</p>`:``}
                    ${r?`<button${r.id?` id="${v(r.id)}"`:``} class="${v(r.class||`btn btn-outline-primary rounded-pill mt-2`)}" type="button">${r.icon?`<i class="bi ${v(r.icon)} me-1"></i> `:``}${v(r.text)}</button>`:``}
                </div>
            </td>
        </tr>
    `}function b({icon:e,title:t,description:n,button:r}){return`
        <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
            ${e?`<div class="empty-table-icon"><i class="bi ${v(e)}"></i></div>`:``}
            ${t?`<h5 class="fw-semibold text-secondary mb-1">${v(t)}</h5>`:``}
            ${n?`<p class="text-muted mb-2">${v(n)}</p>`:``}
            ${r?`<button${r.id?` id="${v(r.id)}"`:``} class="${v(r.class||`btn btn-outline-primary rounded-pill mt-2`)}" type="button">${r.icon?`<i class="bi ${v(r.icon)} me-1"></i> `:``}${v(r.text)}</button>`:``}
        </div>
    `}var te=()=>u(`/api/permissions/pending`),ne=e=>p(`/api/permissions/${e}`,{status:`Active`});function re(e){let t=document.querySelector(`#invitations-list`),n=document.querySelector(`#error-text`);async function r(){try{let e=await te();if(!e||e.length===0){t.innerHTML=b({icon:`bi-envelope`,title:`No pending invitations.`,description:`When someone invites you to a project, it will appear here.`});return}t.innerHTML=`
                <table class="table table-sm table-striped table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Permission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.map(e=>`
                            <tr>
                                <td>${v(e.projectName)}</td>
                                <td>${e.level}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary accept-btn" data-permission-id="${e.permissionId}" type="button">Accept</button>
                                </td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `;for(let e of document.querySelectorAll(`.accept-btn`))e.addEventListener(`click`,async()=>{let n=parseInt(e.dataset.permissionId,10);try{await ne(n);let r=window.scrollY;e.closest(`tr`)?.remove(),t.querySelectorAll(`:scope tbody tr`).length===0&&(t.innerHTML=b({icon:`bi-envelope`,title:`No pending invitations.`,description:`When someone invites you to a project, it will appear here.`})),window.scrollTo(0,r)}catch(e){alert(`Failed to accept invitation`),console.error(e)}})}catch{n.textContent=`Failed to load invitations.`}}r()}async function ie(e,t){if(e===`/invitations`)try{await X(`invitations/list.html`,t),re(t)}catch{await Q(t,`invitations`)()}else Z(t)}function x(e,t,n){return`
    <section id="${e}" class="kb-section">
      <h1>${t}</h1>
      ${n}
    </section>
  `}function ae(){let e=document.querySelector(`#kb-content`);e.innerHTML=[x(`overview`,`The Promise Stack Overview`,`
        <p class="lead">We ship value, not just features. This knowledge base aligns every technical detail with user value.</p>
        <div class="table-responsive mt-3">
          <table class="table table-bordered table-hover align-middle">
            <thead class="table-light">
              <tr><th>Level</th><th>Question</th><th>Definition</th><th>Constraint</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="badge bg-primary">1. Promise</span></td><td>WHY does this exist?</td><td>Core value proposition</td><td>3-5 per product</td></tr>
              <tr><td><span class="badge bg-secondary">2. Epic</span></td><td>WHAT must be possible?</td><td>Major capabilities</td><td>3-5 per Promise</td></tr>
              <tr><td><span class="badge bg-info text-dark">3. Journey</span></td><td>WHEN is this valuable?</td><td>Experience by circumstance</td><td>3-5 per Epic</td></tr>
              <tr><td><span class="badge bg-warning text-dark">4. Flow</span></td><td>HOW does this happen?</td><td>Process sequence</td><td>3-5 per Journey</td></tr>
              <tr><td><span class="badge bg-success">5. Moment</span></td><td>WHO does what?</td><td>Implementation unit</td><td>3-5 per Flow</td></tr>
            </tbody>
          </table>
        </div>
      `),x(`section1`,`Promise 0 (Universal Standards)`,`
        <p>Before detailing specific product features, establish the baseline. Promise 0 represents the universal Definition of Done that every single feature inherits automatically.</p>
        <ul>
          <li><strong>Security:</strong> Documentation on authentication standards, data encryption, and audit logging.</li>
          <li><strong>Accessibility:</strong> Guidelines for WCAG 2.1 AA compliance, screen reader support, and keyboard navigation.</li>
          <li><strong>Performance:</strong> Baselines such as page load times under 2 seconds and API responses under 500ms.</li>
          <li><strong>Compliance & DevOps:</strong> Details on GDPR, testing standards, and CI/CD pipelines.</li>
        </ul>
      `),x(`section2`,`Product Promises (WHY)`,`
        <p>This section acts as the strategic north star. Everything built must trace back to one of the pages in this category.</p>
        <ul>
          <li><strong>Core Value Propositions:</strong> Detail the 3-5 fundamental reasons why someone would choose your product.</li>
          <li><strong>The Promise Pattern:</strong> Ensure each promise is formatted as <code>As a [Persona], [Value Verb] [Outcome]</code>.</li>
          <li><strong>Explicit vs. Implicit Promises:</strong> Document the commitments you are intentionally making, as well as the implicit expectations users have formed from the product&rsquo;s behavior.</li>
        </ul>
      `),x(`section3`,`Epics (WHAT)`,`
        <p>Create a sub-section for each Epic under its parent Promise.</p>
        <ul>
          <li><strong>Major Capabilities:</strong> Document the 3-5 essential capabilities required to fulfill the parent Promise.</li>
          <li><strong>The Epic Test:</strong> Include a section verifying that if this Epic were removed, the parent Promise would fail.</li>
        </ul>
      `),x(`section4`,`Journeys (WHEN)`,`
        <p>Journeys define the circumstances under which the Epics are valuable.</p>
        <ul>
          <li><strong>Circumstance Mapping:</strong> Document the specific situations or arcs for the persona (e.g., &ldquo;First-time rider&rdquo; vs. &ldquo;Daily commuter&rdquo;).</li>
          <li><strong>Constraint Check:</strong> Ensure there are no more than 3-5 Journeys per Epic to prevent scope creep.</li>
        </ul>
      `),x(`section5`,`Flows (HOW)`,`
        <p>Flows are the step-by-step processes that make up a Journey.</p>
        <ul>
          <li><strong>Session Sequences:</strong> Document the distinct processes that a user can complete in a single sitting.</li>
          <li><strong>Start and End Points:</strong> Clearly define the beginning and end of the 3-5 Flows that make up each Journey.</li>
        </ul>
      `),x(`section6`,`Moments (WHO)`,`
        <p>This is the most granular level of your knowledge base, directly translating to your engineering tickets, because this is the only level where code gets written.</p>
        <ul>
          <li><strong>Story Moments:</strong> Document the interactions where a single persona acts and receives user-visible value.</li>
          <li><strong>Job Moments:</strong> Document the behind-the-scenes coordination points between multiple personas or systems.</li>
          <li><strong>The Count Test:</strong> Explicitly count the personas involved to ensure accurate classification between Stories and Jobs.</li>
        </ul>
      `),x(`section7`,`Promise Discovery (The Sandbox)`,`
        <p>Maintain a separate workspace for ideas that are not yet commitments.</p>
        <ul>
          <li><strong>Validation of Concept (VOC):</strong> Track signals, mockups, and early research to answer &ldquo;Is there something here worth building?&rdquo;.</li>
          <li><strong>Testable Value Promise (TVP):</strong> Document specific claims about user value that are ready for testing.</li>
          <li><strong>Core Value Promise (CVP):</strong> Record the evidence gathered that justifies promoting an idea into a fully committed Product Promise.</li>
        </ul>
      `)].join(`
`),oe(),se()}function oe(){let e=document.querySelectorAll(`.kb-nav-link`);for(let t of e)t.addEventListener(`click`,n=>{let r=t.getAttribute(`href`);if(!r||!r.startsWith(`#`))return;n.preventDefault();let i=document.querySelector(r);if(i){i.scrollIntoView({behavior:`smooth`,block:`start`});for(let t of e)t.removeAttribute(`aria-current`);t.setAttribute(`aria-current`,`true`)}})}function se(){let e=document.querySelectorAll(`.kb-nav-link`),t=document.querySelectorAll(`.kb-section[id]`);if(t.length===0)return;let n=!1,r=()=>{n||=(requestAnimationFrame(()=>{let r=window.scrollY+100,i;for(let e of t)r>=e.offsetTop&&(i=e.id);for(let t of e){let e=t.getAttribute(`href`)===`#${i}`;t.setAttribute(`aria-current`,e?`true`:`false`)}n=!1}),!0)};window.addEventListener(`scroll`,r,{passive:!0}),r()}async function ce(e,t,n){try{await X(`knowledge-base.html`,n),await ae()}catch{await Q(n,`knowledge base`)()}}var le=(e,t,n)=>u(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}`),ue=(e,t,n)=>f(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/create`,n),de=()=>u(`/api/moments/assigned-to-me`),fe=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/stride-assignment`,{strideId:r}),pe=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/status`,{newStatus:r}),me=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/estimate`,{estimate:r}),S=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/type`,{newType:r}),he=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/owner`,{userId:r}),ge=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/description`,{description:r}),_e=(e,t,n,r)=>f(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks`,r),ve=(e,t,n,r,i)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks/${r}/completion`,{isCompleted:i});async function ye(e,t){let n=document.querySelector(`#my-tasks-content`),r=document.querySelector(`#error-text`);try{let r=await de();if(!r||r.length===0){n.innerHTML=b({icon:`bi-list-task`,title:`You have no assigned tasks.`,description:`When a moment is assigned to you, it will appear here.`});return}n.innerHTML=`
            <table class="table table-sm table-striped table-hover align-middle">
                <thead>
                    <tr>
                        <th>Statement</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Effort</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.map(e=>`
                        <tr data-moment-id="${e.sequenceNumber}" data-owner="${e.ownerSlug||``}" data-project="${e.projectSlug||``}">
                            <td>${v(e.statement)}</td>
                            <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${e.sequenceNumber}" data-current-type="${e.type}" aria-label="Moment type"><option value="Story" ${e.type===`Story`?`selected`:``}>Story</option><option value="Job" ${e.type===`Job`?`selected`:``}>Job</option></select></td>
                            <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
                            <td>${e.effortEstimate??`–`}</td>
                            <td>${e.ownerSlug&&e.projectSlug?`<a href="/${e.ownerSlug}/${e.projectSlug}/moments/${e.sequenceNumber}" moment-seq="${e.sequenceNumber}" data-owner="${e.ownerSlug}" data-project="${e.projectSlug}" class="btn btn-sm btn-outline-primary">View</a>`:`<a href="/moments/${e.sequenceNumber}" moment-seq="${e.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a>`}</td>
                        </tr>
                    `).join(``)}
                </tbody>
            </table>
        `,n.addEventListener(`change`,async e=>{let t=e.target;if(t.matches(`.moment-type-select`)){let e=t.closest(`tr`),n=e?.dataset.owner,r=e?.dataset.project;if(!n||!r){console.error(`Cannot determine project for moment type update`);return}let i=parseInt(t.dataset.momentId,10),a=t.value,o=t.dataset.currentType||a;try{await S(n,r,i,a),t.dataset.currentType=a}catch(e){t.value=o,console.error(`Failed to update moment type:`,e)}}});for(let r of n.querySelectorAll(`a[moment-seq]`))r.addEventListener(`click`,n=>{if(n.ctrlKey||n.metaKey||n.button===1)return;n.preventDefault();let i=r.dataset.owner,a=r.dataset.project;q(`/${i}/${a}/moments/${r.getAttribute(`moment-seq`)}`,e,t)})}catch(e){r.textContent=`Failed to load your tasks.`,console.error(e)}}async function C(){try{return await u(`/api/notifications`)??[]}catch{return[]}}var w=C,T=C,E=e=>p(`/api/notifications/${e}`,{isRead:!0}),D=()=>p(`/api/notifications`,{isRead:!0,applyToAll:!0}),O=`pmo-toast-container`,k=4e3,A={success:`bi-check-circle-fill`,error:`bi-x-circle-fill`,warning:`bi-exclamation-triangle-fill`,info:`bi-info-circle-fill`},j={success:`bg-success`,error:`bg-danger`,warning:`bg-warning text-dark`,info:`bg-info text-dark`};function M(){let e=document.querySelector(`#pmo-toast-container`);return e||(e=document.createElement(`div`),e.id=O,e.style.cssText=`position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:24rem`,document.body.append(e)),e}function N(e,t=`info`,n=k){let r=M(),i=document.createElement(`div`);i.className=`toast align-items-center border-0 ${j[t]}`,i.setAttribute(`role`,`alert`),i.setAttribute(`aria-live`,`assertive`),i.setAttribute(`aria-atomic`,`true`),i.style.cssText=`display:flex;opacity:0;transition:opacity 0.3s ease`,i.innerHTML=`
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${A[t]}"></i>
        <span>${e}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `,r.append(i),requestAnimationFrame(()=>{i.style.opacity=`1`}),n>0&&setTimeout(()=>{i.style.opacity=`0`,setTimeout(()=>i.remove(),300)},n);let a=i.querySelector(`.btn-close`);a&&a.addEventListener(`click`,()=>{i.style.opacity=`0`,setTimeout(()=>i.remove(),300)})}var P={connection:void 0,onNotificationOrReconnect:void 0,isStarted:!1};async function be(e){if(!P.isStarted){P.onNotificationOrReconnect=typeof e==`function`?e:void 0,P.connection=new signalR.HubConnectionBuilder().withUrl(`/hubs/notifications`).withAutomaticReconnect([0,2e3,5e3,1e4,3e4]).configureLogging(signalR.LogLevel.Warning).build(),P.connection.on(`ReceiveNotification`,e=>{P.onNotificationOrReconnect&&P.onNotificationOrReconnect(e)}),P.connection.onreconnecting(async()=>{N(`Reconnecting to server...`,`warning`,0)}),P.connection.onreconnected(async()=>{N(`Reconnected.`,`success`,3e3),P.onNotificationOrReconnect&&P.onNotificationOrReconnect(void 0)}),P.connection.onclose(async()=>{N(`Connection lost. Real-time updates paused.`,`error`,5e3)});try{await P.connection.start(),P.isStarted=!0}catch(e){console.warn(`SignalR connection failed, notifications will not be real-time:`,e),N(`Unable to connect to notification service.`,`warning`,5e3),delete P.connection}}}var F=`pmo:notifications:unread-updated`,I={isStarted:!1};function L(e){let t=document.querySelector(`#notification-badge`);if(!t)return;let n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.classList.remove(`d-none`)):t.classList.add(`d-none`)}async function R(){try{let e=await w();L(Array.isArray(e)?e.length:0),dispatchEvent(new CustomEvent(F,{detail:{notifications:Array.isArray(e)?e:[]}}))}catch{L(0)}}async function z(){await R()}async function xe(){await R(),!I.isStarted&&(I.isStarted=!0,be(()=>{R()}))}function Se(){return F}function Ce(){let e=location.pathname;for(let t of document.querySelectorAll(`#main-menu a[data-nav]`)){let n=t.getAttribute(`href`);if(!n||n===`#`)return;let r=n===e||n!==`/`&&e.startsWith(n);t.removeAttribute(`aria-current`),r&&t.setAttribute(`aria-current`,`page`)}}function we(e,t,n){let r=e.target.closest(`a[data-nav]`);if(!r)return;let i=r.getAttribute(`href`);!i||i===`#`||(e.preventDefault(),q(i,t,n))}async function Te(e,t){let n=s()?`authenticated.html`:`anonymous.html`;try{let t=await fetch(`/templates/navigation/${n}`);if(!t.ok)throw Error(`Network response was not ok`);e.innerHTML=await t.text(),Ce(),s()&&xe()}catch(t){throw e.innerHTML=`<h1>Error loading template</h1><p>${t.message}</p>`,t}}function Ee(e,t){let n=document.querySelector(`#main-menu`);!n||n.dataset.navBound||(n.dataset.navBound=`1`,n.addEventListener(`click`,n=>we(n,e,t)))}var B={isLiveListenerRegistered:!1};function V(e){let t=document.querySelector(`#notification-badge`);if(!t)return;let n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.style.display=`inline`):t.style.display=`none`}function De(){let e=document.querySelector(`#notification-badge`);if(!e||e.style.display===`none`)return;let t=parseInt(e.textContent||`0`,10);if(!Number.isFinite(t)||t<=0){V(0);return}V(t-1)}function Oe(e){if(!e)return;let t=e.classList.contains(`unread`);e.classList.remove(`unread`);let n=e.querySelector(`td[data-actions="1"]`);n&&(n.textContent=`✓ Read`),t&&De()}function H(e,t){if(e){if(!t||t.length===0){e.innerHTML=b({icon:`bi-bell`,title:`No notifications yet.`,description:`You'll see notifications here when there is activity related to you.`});return}e.innerHTML=`
        <div class="mb-3">
            <button id="mark-all-read" class="btn btn-primary btn-sm" type="button">Mark All as Read</button>
        </div>
        <table class="table table-sm table-striped table-hover align-middle">
            <thead>
                <tr>
                    <th>Message</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${t.map(e=>`
                    <tr class="${e.isRead?``:`unread`}" data-notification-id="${e.id}">
                        <td>${v(e.message)}</td>
                        <td>${e.type}</td>
                        <td>${new Date(e.createdAt).toLocaleString(`en-CA`)}</td>
                        <td data-actions="1">
                            ${e.isRead?`✓ Read`:`<button class="btn btn-sm btn-outline-primary mark-read-btn" type="button" data-id="${e.id}">Read</button>`}
                        </td>
                    </tr>
                `).join(``)}
            </tbody>
        </table>
    `,document.querySelector(`#mark-all-read`)?.addEventListener(`click`,async()=>{try{await D();let t=window.scrollY;for(let t of e.querySelectorAll(`:scope tbody tr`)){t.classList.remove(`unread`);let e=t.querySelector(`:scope > td[data-actions="1"]`);e&&(e.textContent=`✓ Read`)}V(0),window.scrollTo(0,t)}catch(e){alert(`Failed to mark all as read`),console.error(e)}});for(let t of e.querySelectorAll(`.mark-read-btn`))t.addEventListener(`click`,async()=>{let n=parseInt(t.dataset.id,10);try{await E(n);let t=window.scrollY;Oe(e.querySelector(`tr[data-notification-id="${CSS.escape(n)}"]`)),window.scrollTo(0,t)}catch(e){alert(`Failed to mark notification as read`),console.error(e)}})}}async function ke(){let e=document.querySelector(`#notifications-list`),t=document.querySelector(`#error-text`);if(!(!e||!t)){t.textContent=``;try{H(e,await T()),z()}catch{t.textContent=`Failed to load notifications.`}}}function Ae(e){if(!B.isLiveListenerRegistered){B.isLiveListenerRegistered=!0;let e=Se();addEventListener(e,e=>{let t=document.querySelector(`#notifications-list`);if(!t)return;let n=e?.detail?.notifications;H(t,Array.isArray(n)?n:[])})}ke()}async function je(e,t,n){if(e===`/notifications`)try{await X(`notifications/list.html`,n),await Ae(n)}catch{await Q(n,`notifications`)()}else Z(n)}var Me=`modulepreload`,Ne=function(e){return`/dist/`+e},U={},W=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=Ne(t,n),t in U)return;U[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Me,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},G={projectRoutes:void 0};function K(){return G.projectRoutes||=W(()=>import(`./router.js`),__vite__mapDeps([0,1])),G.projectRoutes}var Pe=[{test:e=>e===`/`,handler:async(e,t)=>{await X(`home.html`,t),_()}},{test:e=>e.startsWith(`/projects`),handler:async(e,t)=>{let n=location.pathname;try{let{handleLegacyProjectRoutes:r}=await K();r(n,e,t)}catch{Q(t,`projects`)()}}},{test:e=>e===`/moments/my-tasks`,guard:g,handler:async(e,t)=>{try{await X(`moments/my-tasks.html`,t),ye(e,t)}catch{Q(t,`my tasks`)()}}},{test:e=>e.startsWith(`/notifications`),guard:g,handler:(e,t)=>{je(location.pathname,e,t)}},{test:e=>e.startsWith(`/invitations`),guard:g,handler:(e,t)=>{ie(location.pathname,t)}},{test:e=>e===`/change-password`,guard:g,handler:()=>{location.assign(`/account/change-password`)}},{test:e=>e===`/knowledge-base`,handler:(e,t)=>{ce(location.pathname,e,t)}},{test:e=>e===`/privacy`,handler:(e,t)=>{X(`privacy.html`,t)}},{test:e=>e===`/tos`,handler:(e,t)=>{X(`tos.html`,t)}},{test:e=>e===`/account/delete`,guard:g,handler:async(t,n)=>{await X(`account/delete.html`,n),e()}}];async function Fe(){if(`serviceWorker`in navigator)try{await navigator.serviceWorker.register(`/sw.mjs`,{scope:`/`})}catch(e){console.warn(`SW registration failed:`,e)}}function Ie(){Fe(),document.addEventListener(`DOMContentLoaded`,async()=>{let e=document.querySelector(`#content`),t=document.querySelector(`#main-menu`);await h(),Ee(t,e),document.addEventListener(`click`,n=>{let r=n.target.closest(`a[data-nav]`);if(r){let i=r.getAttribute(`href`);if(i&&i!==`#`){n.preventDefault(),q(i,t,e);return}}n.target.closest(`[data-action="back"]`)&&(n.preventDefault(),history.back())}),document.querySelector(`#home-link`)?.addEventListener(`click`,n=>{n.preventDefault(),q(`/`,t,e)}),addEventListener(`popstate`,()=>{$(t,e)}),$(t,e)})}Ie();async function q(e,t,n){history.pushState({},``,e),await $(t,n)}var Le={"/":`Home`,"/projects":`Projects`,"/notifications":`Notifications`,"/invitations":`Invitations`,"/knowledge-base":`Knowledge Base`,"/moments/my-tasks":`My Tasks`};function J(){let e=document.querySelector(`#main-content`);e&&requestAnimationFrame(()=>e.focus())}function Y(e){let t=document.querySelector(`#page-title`);if(!t)return;let n=Le[e];if(!n){let t=e.split(`/`).filter(Boolean);n=t.length>0?t.at(-1):`Home`,n=n.charAt(0).toUpperCase()+n.slice(1).replaceAll(`-`,` `)}t.textContent=`${n} - Promise Model Online`}async function X(e,t){let n=await fetch(`/templates/${e}`);if(!n.ok)throw Error(`Network response was not ok`);t.innerHTML=await n.text(),Y(location.pathname),J()}function Z(e){X(`404.html`,e)}function Q(e,t){return async()=>{try{e.innerHTML=await(await fetch(`/templates/error.html`)).text(),Y(location.pathname);let n=document.querySelector(`#error-title`),r=document.querySelector(`#error-message`);n&&(n.textContent=`Something went wrong`),r&&(r.textContent=`Failed to load ${t}. Please try again.`),J()}catch{e.innerHTML=`<h1>Something went wrong</h1><p>Please try again.</p>`,Y(location.pathname),J()}}}async function $(e,t){let n=location.pathname;if([`/login`,`/logout`,`/register`].includes(n)){location.assign(n);return}Te(e,t);for(let r of Pe)if(r.test(n)){if(r.guard){let n=r.guard();if(`allowed`in n&&!n.allowed){n.redirect&&q(n.redirect,e,t);return}}r.handler(e,t);return}let r=n.split(`/`).filter(Boolean);if(r.length>=2){let i=r[0],a=r[1],o=`/`+r.slice(2).join(`/`)+(n.includes(`?`)?n.slice(n.indexOf(`?`)):``);if([`account`,`moments`,`knowledge-base`].includes(i))try{await X(`404.html`,t)}catch{t.innerHTML=`<h1>Page not found</h1>`,Y(n),J()}else try{let{handleProjectScopedRoutes:n}=await K();n(i,a,o,e,t)}catch{t.innerHTML=`<h1>Something went wrong</h1><p>Failed to load project. Please try again.</p>`,Y(n),J()}}else try{await X(`404.html`,t)}catch{t.innerHTML=`<h1>Page not found</h1>`,Y(n),J()}}export{t as C,c as S,u as _,le as a,f as b,he as c,ve as d,b as f,m as g,ee as h,_e as i,pe as l,X as loadTemplate,Q as loadTemplateWithError,v as m,fe as n,q as navigate,ge as o,y as p,ue as r,me as s,Z as showNotFound,W as t,S as u,d as v,l as x,p as y};