const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/router.js","js/iteration-create-modal.js"])))=>i.map(i=>d[i]);
function e(){let e=document.getElementById(`delete-account-form`),t=document.getElementById(`delete-account-btn`),n=document.getElementById(`delete-btn-text`),r=document.getElementById(`delete-spinner`),i=document.getElementById(`delete-error`),a=document.getElementById(`delete-success`),o=document.getElementById(`delete-password`),s=document.getElementById(`export-data-btn`),c=document.getElementById(`export-btn-text`),l=document.getElementById(`export-spinner`),u=document.getElementById(`export-error`),d=document.getElementById(`export-link-top`);if(!d||!s)return;d.addEventListener(`click`,e=>{e.preventDefault(),s.scrollIntoView({behavior:`smooth`}),s.focus()}),s.addEventListener(`click`,async()=>{u.classList.add(`d-none`),p(!0);try{let e=await fetch(`/api/users/me/export`,{credentials:`include`});if(!e.ok){f((await e.json().catch(()=>({}))).message||`Failed to export data.`);return}let t=await e.blob(),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`pmo-data-export.json`,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)}catch{f(`Network error. Please try again.`)}finally{p(!1)}});function f(e){u&&(u.textContent=e,u.classList.remove(`d-none`))}function p(e){!s||!c||!l||(s.disabled=e,c.classList.toggle(`d-none`,e),l.classList.toggle(`d-none`,!e))}if(!e||!i||!a||!o||!t||!n||!r)return;e.addEventListener(`submit`,async t=>{t.preventDefault(),i.classList.add(`d-none`),a.classList.add(`d-none`);let n=o.value.trim();if(!n){m(`Please enter your password.`);return}h(!0);try{let t=await fetch(`/api/users/me`,{method:`DELETE`,credentials:`include`});if(t.status!==204&&t.status!==404){m(`Failed to delete account data. Please try again.`),h(!1);return}let r=await fetch(`/account/me`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({password:n}),credentials:`include`});r.status===204?(a.textContent=`Your account and all associated data have been permanently deleted. You will be redirected shortly.`,a.classList.remove(`d-none`),e.style.display=`none`,setTimeout(()=>{window.location.href=`/`},3e3)):r.status===401?m(`Incorrect password. Please try again.`):m(`Something went wrong. Please try again.`)}catch{m(`Network error. Please check your connection and try again.`)}finally{h(!1)}});function m(e){i.textContent=e,i.classList.remove(`d-none`)}function h(e){t.disabled=e,n.classList.toggle(`d-none`,e),r.classList.toggle(`d-none`,!e)}}function t(e){let t={...e},n=new Set;return{get(){return t},set(e){t={...t,...e},n.forEach(e=>{typeof e==`function`&&e()})},subscribe(e){return n.add(e),()=>{n.delete(e)}}}}var n=`pmo.auth`;function r(){try{let e=sessionStorage.getItem(n);if(e){let t=JSON.parse(e);return{isAuthenticated:!!t.isAuthenticated,username:t.username||null,userId:t.userId??null}}}catch{}return{isAuthenticated:!1,username:null,userId:null}}function i(e){try{sessionStorage.setItem(n,JSON.stringify(e))}catch{}}var a=t(r()),o=a.set.bind(a);a.set=e=>{o(e),i(a.get())};function s(){return a.get().isAuthenticated}function c(){return a.get().username}function l(){return a.get().userId}async function u(e){let t=await m(e);if(t.status===204)return null;if(!t.ok)throw Error(`HTTP ${t.status}`);return t.json()}async function d(e){return await u(e)??[]}async function f(e,t){let n=await m(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(n.status===204)return null;if(!n.ok)throw Error(`HTTP ${n.status}`);return n.json()}async function p(e,t){let n=await m(e,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(n.status===204)return null;if(!n.ok)throw Error(`HTTP ${n.status}`);return n.json()}async function m(e,t={}){let n=await fetch(e,{...t,credentials:`include`,headers:{Accept:`application/json`,...t.headers||{}}});if(n.status===401)throw a.set({isAuthenticated:!1,username:null,userId:null}),window.location.pathname.startsWith(`/login`)||(window.location.href=`/login`),Error(`Unauthorized`);return n}async function h(){try{let e=await fetch(`/api/users/me`,{method:`GET`,credentials:`include`});if(e.ok){let t=await e.json();return a.set({isAuthenticated:!0,username:t.name,userId:t.userId}),!0}}catch{}return a.set({isAuthenticated:!1,username:null,userId:null}),!1}function g(){return s()?{allowed:!0}:{allowed:!1,redirect:`/login`}}function ee(){let e=s()?`
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
      </a>`,t=document.getElementById(`home-cta-area`),n=document.getElementById(`home-cta-area-bottom`);t&&(t.innerHTML=e),n&&(n.innerHTML=e)}function _(e){return String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function te(e){return`
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${_(e)}">
                <span class="visually-hidden">${_(e)}</span>
            </div>
        </div>
    `}function ne({icon:e,title:t,description:n,button:r,colspan:i}){return`
        <tr class="inline-table-empty-row">
            <td colspan="${i}" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                    ${e?`<div class="empty-table-icon"><i class="bi ${_(e)}"></i></div>`:``}
                    ${t?`<h5 class="fw-semibold text-secondary mb-1">${_(t)}</h5>`:``}
                    ${n?`<p class="text-muted mb-2">${_(n)}</p>`:``}
                    ${r?`<button${r.id?` id="${_(r.id)}"`:``} class="${_(r.class||`btn btn-outline-primary rounded-pill mt-2`)}" type="button">${r.icon?`<i class="bi ${_(r.icon)} me-1"></i> `:``}${_(r.text)}</button>`:``}
                </div>
            </td>
        </tr>
    `}function v({icon:e,title:t,description:n,button:r}){return`
        <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
            ${e?`<div class="empty-table-icon"><i class="bi ${_(e)}"></i></div>`:``}
            ${t?`<h5 class="fw-semibold text-secondary mb-1">${_(t)}</h5>`:``}
            ${n?`<p class="text-muted mb-2">${_(n)}</p>`:``}
            ${r?`<button${r.id?` id="${_(r.id)}"`:``} class="${_(r.class||`btn btn-outline-primary rounded-pill mt-2`)}" type="button">${r.icon?`<i class="bi ${_(r.icon)} me-1"></i> `:``}${_(r.text)}</button>`:``}
        </div>
    `}var y=()=>u(`/api/permissions/pending`),b=e=>p(`/api/permissions/${e}`,{status:`Active`});function x(e){let t=document.getElementById(`invitations-list`),n=document.getElementById(`error-text`);async function r(){try{let e=await y();if(!e||e.length===0){t.innerHTML=v({icon:`bi-envelope`,title:`No pending invitations.`,description:`When someone invites you to a project, it will appear here.`});return}t.innerHTML=`
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
                                <td>${_(e.projectName)}</td>
                                <td>${e.level}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary accept-btn" data-permission-id="${e.permissionId}" type="button">Accept</button>
                                </td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `,document.querySelectorAll(`.accept-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{let n=parseInt(e.dataset.permissionId,10);try{await b(n);let r=window.scrollY;e.closest(`tr`)?.remove(),t.querySelectorAll(`tbody tr`).length===0&&(t.innerHTML=v({icon:`bi-envelope`,title:`No pending invitations.`,description:`When someone invites you to a project, it will appear here.`})),window.scrollTo(0,r)}catch(e){alert(`Failed to accept invitation`),console.error(e)}})})}catch{n.textContent=`Failed to load invitations.`}}r()}function re(e,t){e===`/invitations`?X(`invitations/list.html`,t).then(()=>x(t)).catch(Q(t,`invitations`)):Z(t)}function S(e,t,n){return`
    <section id="${e}" class="kb-section">
      <h1>${t}</h1>
      ${n}
    </section>
  `}function ie(){let e=document.getElementById(`kb-content`);e.innerHTML=[S(`overview`,`The Promise Stack Overview`,`
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
      `),S(`section1`,`Promise 0 (Universal Standards)`,`
        <p>Before detailing specific product features, establish the baseline. Promise 0 represents the universal Definition of Done that every single feature inherits automatically.</p>
        <ul>
          <li><strong>Security:</strong> Documentation on authentication standards, data encryption, and audit logging.</li>
          <li><strong>Accessibility:</strong> Guidelines for WCAG 2.1 AA compliance, screen reader support, and keyboard navigation.</li>
          <li><strong>Performance:</strong> Baselines such as page load times under 2 seconds and API responses under 500ms.</li>
          <li><strong>Compliance & DevOps:</strong> Details on GDPR, testing standards, and CI/CD pipelines.</li>
        </ul>
      `),S(`section2`,`Product Promises (WHY)`,`
        <p>This section acts as the strategic north star. Everything built must trace back to one of the pages in this category.</p>
        <ul>
          <li><strong>Core Value Propositions:</strong> Detail the 3-5 fundamental reasons why someone would choose your product.</li>
          <li><strong>The Promise Pattern:</strong> Ensure each promise is formatted as <code>As a [Persona], [Value Verb] [Outcome]</code>.</li>
          <li><strong>Explicit vs. Implicit Promises:</strong> Document the commitments you are intentionally making, as well as the implicit expectations users have formed from the product&rsquo;s behavior.</li>
        </ul>
      `),S(`section3`,`Epics (WHAT)`,`
        <p>Create a sub-section for each Epic under its parent Promise.</p>
        <ul>
          <li><strong>Major Capabilities:</strong> Document the 3-5 essential capabilities required to fulfill the parent Promise.</li>
          <li><strong>The Epic Test:</strong> Include a section verifying that if this Epic were removed, the parent Promise would fail.</li>
        </ul>
      `),S(`section4`,`Journeys (WHEN)`,`
        <p>Journeys define the circumstances under which the Epics are valuable.</p>
        <ul>
          <li><strong>Circumstance Mapping:</strong> Document the specific situations or arcs for the persona (e.g., &ldquo;First-time rider&rdquo; vs. &ldquo;Daily commuter&rdquo;).</li>
          <li><strong>Constraint Check:</strong> Ensure there are no more than 3-5 Journeys per Epic to prevent scope creep.</li>
        </ul>
      `),S(`section5`,`Flows (HOW)`,`
        <p>Flows are the step-by-step processes that make up a Journey.</p>
        <ul>
          <li><strong>Session Sequences:</strong> Document the distinct processes that a user can complete in a single sitting.</li>
          <li><strong>Start and End Points:</strong> Clearly define the beginning and end of the 3-5 Flows that make up each Journey.</li>
        </ul>
      `),S(`section6`,`Moments (WHO)`,`
        <p>This is the most granular level of your knowledge base, directly translating to your engineering tickets, because this is the only level where code gets written.</p>
        <ul>
          <li><strong>Story Moments:</strong> Document the interactions where a single persona acts and receives user-visible value.</li>
          <li><strong>Job Moments:</strong> Document the behind-the-scenes coordination points between multiple personas or systems.</li>
          <li><strong>The Count Test:</strong> Explicitly count the personas involved to ensure accurate classification between Stories and Jobs.</li>
        </ul>
      `),S(`section7`,`Promise Discovery (The Sandbox)`,`
        <p>Maintain a separate workspace for ideas that are not yet commitments.</p>
        <ul>
          <li><strong>Validation of Concept (VOC):</strong> Track signals, mockups, and early research to answer &ldquo;Is there something here worth building?&rdquo;.</li>
          <li><strong>Testable Value Promise (TVP):</strong> Document specific claims about user value that are ready for testing.</li>
          <li><strong>Core Value Promise (CVP):</strong> Record the evidence gathered that justifies promoting an idea into a fully committed Product Promise.</li>
        </ul>
      `)].join(`
`),ae(),oe()}function ae(){let e=document.querySelectorAll(`.kb-nav-link`);e.forEach(t=>{t.addEventListener(`click`,n=>{let r=t.getAttribute(`href`);if(!r||!r.startsWith(`#`))return;n.preventDefault();let i=document.getElementById(r.slice(1));i&&(i.scrollIntoView({behavior:`smooth`,block:`start`}),e.forEach(e=>e.removeAttribute(`aria-current`)),t.setAttribute(`aria-current`,`true`))})})}function oe(){let e=document.querySelectorAll(`.kb-nav-link`),t=document.querySelectorAll(`.kb-section[id]`);if(!t.length)return;let n=!1,r=()=>{n||=(window.requestAnimationFrame(()=>{let r=window.scrollY+100,i=null;t.forEach(e=>{r>=e.offsetTop&&(i=e.id)}),e.forEach(e=>{let t=e.getAttribute(`href`)===`#${i}`;e.setAttribute(`aria-current`,t?`true`:`false`)}),n=!1}),!0)};window.addEventListener(`scroll`,r,{passive:!0}),r()}function se(e,t,n){X(`knowledge-base.html`,n).then(()=>ie()).catch(Q(n,`knowledge base`))}var ce=(e,t,n)=>u(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}`),le=(e,t,n)=>f(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/create`,n),ue=()=>u(`/api/moments/assigned-to-me`),de=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/stride-assignment`,{strideId:r}),fe=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/status`,{newStatus:r}),pe=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/estimate`,{estimate:r}),C=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/type`,{newType:r}),me=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/owner`,{userId:r}),he=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/description`,{description:r}),ge=(e,t,n,r)=>f(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks`,r),_e=(e,t,n,r,i)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks/${r}/completion`,{isCompleted:i});function ve(e,t){let n=document.getElementById(`my-tasks-content`),r=document.getElementById(`error-text`);ue().then(r=>{if(!r||r.length===0){n.innerHTML=v({icon:`bi-list-task`,title:`You have no assigned tasks.`,description:`When a moment is assigned to you, it will appear here.`});return}n.innerHTML=`
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
                                <td>${_(e.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${e.sequenceNumber}" data-current-type="${e.type}" aria-label="Moment type"><option value="Story" ${e.type===`Story`?`selected`:``}>Story</option><option value="Job" ${e.type===`Job`?`selected`:``}>Job</option></select></td>
                                <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
                                <td>${e.effortEstimate??`–`}</td>
                                <td>${e.ownerSlug&&e.projectSlug?`<a href="/${e.ownerSlug}/${e.projectSlug}/moments/${e.sequenceNumber}" moment-seq="${e.sequenceNumber}" data-owner="${e.ownerSlug}" data-project="${e.projectSlug}" class="btn btn-sm btn-outline-primary">View</a>`:`<a href="/moments/${e.sequenceNumber}" moment-seq="${e.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a>`}</td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `,n.addEventListener(`change`,async e=>{let t=e.target;if(t.matches(`.moment-type-select`)){let e=t.closest(`tr`),n=e?.dataset.owner,r=e?.dataset.project;if(!n||!r){console.error(`Cannot determine project for moment type update`);return}let i=parseInt(t.dataset.momentId,10),a=t.value,o=t.dataset.currentType||a;try{await C(n,r,i,a),t.dataset.currentType=a}catch(e){t.value=o,console.error(`Failed to update moment type:`,e)}}}),n.querySelectorAll(`a[moment-seq]`).forEach(n=>{n.addEventListener(`click`,r=>{r.ctrlKey||r.metaKey||r.button===1||(r.preventDefault(),q(`/${n.getAttribute(`data-owner`)}/${n.getAttribute(`data-project`)}/moments/${n.getAttribute(`moment-seq`)}`,e,t))})})}).catch(e=>{r.textContent=`Failed to load your tasks.`,console.error(e)})}async function w(){try{return await u(`/api/notifications`)??[]}catch{return[]}}var ye=w,be=w,T=e=>p(`/api/notifications/${e}`,{isRead:!0}),E=()=>p(`/api/notifications`,{isRead:!0,applyToAll:!0}),D=`pmo-toast-container`,O=4e3,k={success:`bi-check-circle-fill`,error:`bi-x-circle-fill`,warning:`bi-exclamation-triangle-fill`,info:`bi-info-circle-fill`},A={success:`bg-success`,error:`bg-danger`,warning:`bg-warning text-dark`,info:`bg-info text-dark`};function j(){let e=document.getElementById(D);return e||(e=document.createElement(`div`),e.id=D,e.style.cssText=`position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:24rem`,document.body.appendChild(e)),e}function M(e,t=`info`,n=O){let r=j(),i=document.createElement(`div`);i.className=`toast align-items-center border-0 ${A[t]}`,i.setAttribute(`role`,`alert`),i.setAttribute(`aria-live`,`assertive`),i.setAttribute(`aria-atomic`,`true`),i.style.cssText=`display:flex;opacity:0;transition:opacity 0.3s ease`,i.innerHTML=`
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${k[t]}"></i>
        <span>${e}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `,r.appendChild(i),requestAnimationFrame(()=>{i.style.opacity=`1`}),n>0&&setTimeout(()=>{i.style.opacity=`0`,setTimeout(()=>i.remove(),300)},n);let a=i.querySelector(`.btn-close`);a&&a.addEventListener(`click`,()=>{i.style.opacity=`0`,setTimeout(()=>i.remove(),300)})}var N=null,P=null,F=!1;async function xe(e){if(!F){P=typeof e==`function`?e:null,N=new signalR.HubConnectionBuilder().withUrl(`/hubs/notifications`).withAutomaticReconnect([0,2e3,5e3,1e4,3e4]).configureLogging(signalR.LogLevel.Warning).build(),N.on(`ReceiveNotification`,e=>{P&&P(e)}),N.onreconnecting(async()=>{M(`Reconnecting to server...`,`warning`,0)}),N.onreconnected(async()=>{M(`Reconnected.`,`success`,3e3),P&&P(null)}),N.onclose(async()=>{M(`Connection lost. Real-time updates paused.`,`error`,5e3)});try{await N.start(),F=!0}catch(e){console.warn(`SignalR connection failed, notifications will not be real-time:`,e),M(`Unable to connect to notification service.`,`warning`,5e3),N=null}}}var I=`pmo:notifications:unread-updated`,L=!1;function R(e){let t=document.getElementById(`notification-badge`);if(!t)return;let n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.classList.remove(`d-none`)):t.classList.add(`d-none`)}async function z(){try{let e=await ye();R(Array.isArray(e)?e.length:0),window.dispatchEvent(new CustomEvent(I,{detail:{notifications:Array.isArray(e)?e:[]}}))}catch{R(0)}}async function Se(){await z()}async function Ce(){await z(),!L&&(L=!0,xe(()=>{z()}))}function we(){return I}function Te(){let e=window.location.pathname;document.querySelectorAll(`#main-menu a[data-nav]`).forEach(t=>{let n=t.getAttribute(`href`);if(!n||n===`#`)return;let r=n===e||n!==`/`&&e.startsWith(n);t.removeAttribute(`aria-current`),r&&t.setAttribute(`aria-current`,`page`)})}function Ee(e,t,n){let r=e.target.closest(`a[data-nav]`);if(!r)return;let i=r.getAttribute(`href`);!i||i===`#`||(e.preventDefault(),q(i,t,n))}function De(e,t){let n=s()?`authenticated.html`:`anonymous.html`;return fetch(`/templates/navigation/${n}`).then(e=>{if(!e.ok)throw Error(`Network response was not ok`);return e.text()}).then(t=>{e.innerHTML=t,Te(),s()&&Ce()}).catch(t=>{throw e.innerHTML=`<h1>Error loading template</h1><p>${t.message}</p>`,t})}function Oe(e,t){let n=document.getElementById(`main-menu`);!n||n.dataset.navBound||(n.dataset.navBound=`1`,n.addEventListener(`click`,n=>Ee(n,e,t)))}var B=!1;function V(e){let t=document.getElementById(`notification-badge`);if(!t)return;let n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.style.display=`inline`):t.style.display=`none`}function ke(){let e=document.getElementById(`notification-badge`);if(!e||e.style.display===`none`)return;let t=parseInt(e.textContent||`0`,10);if(!Number.isFinite(t)||t<=0){V(0);return}V(t-1)}function Ae(e){if(!e)return;let t=e.classList.contains(`unread`);e.classList.remove(`unread`);let n=e.querySelector(`td[data-actions="1"]`);n&&(n.textContent=`✓ Read`),t&&ke()}function H(e,t){if(e){if(!t||t.length===0){e.innerHTML=v({icon:`bi-bell`,title:`No notifications yet.`,description:`You'll see notifications here when there is activity related to you.`});return}e.innerHTML=`
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
                        <td>${_(e.message)}</td>
                        <td>${e.type}</td>
                        <td>${new Date(e.createdAt).toLocaleString(`en-CA`)}</td>
                        <td data-actions="1">
                            ${e.isRead?`✓ Read`:`<button class="btn btn-sm btn-outline-primary mark-read-btn" type="button" data-id="${e.id}">Read</button>`}
                        </td>
                    </tr>
                `).join(``)}
            </tbody>
        </table>
    `,document.getElementById(`mark-all-read`)?.addEventListener(`click`,async()=>{try{await E();let t=window.scrollY;e.querySelectorAll(`tbody tr`).forEach(e=>{e.classList.remove(`unread`);let t=e.querySelector(`td[data-actions="1"]`);t&&(t.textContent=`✓ Read`)}),V(0),window.scrollTo(0,t)}catch(e){alert(`Failed to mark all as read`),console.error(e)}}),e.querySelectorAll(`.mark-read-btn`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=parseInt(t.dataset.id,10);try{await T(n);let t=window.scrollY;Ae(e.querySelector(`tr[data-notification-id="${n}"]`)),window.scrollTo(0,t)}catch(e){alert(`Failed to mark notification as read`),console.error(e)}})})}}async function je(){let e=document.getElementById(`notifications-list`),t=document.getElementById(`error-text`);if(!(!e||!t)){t.textContent=``;try{H(e,await be()),Se()}catch{t.textContent=`Failed to load notifications.`}}}function Me(e){if(!B){B=!0;let e=we();window.addEventListener(e,e=>{let t=document.getElementById(`notifications-list`);if(!t)return;let n=e?.detail?.notifications;H(t,Array.isArray(n)?n:[])})}je()}function Ne(e,t,n){e===`/notifications`?X(`notifications/list.html`,n).then(()=>Me(n)).catch(Q(n,`notifications`)):Z(n)}var Pe=`modulepreload`,Fe=function(e){return`/dist/`+e},U={},W=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=Fe(t,n),t in U)return;U[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Pe,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},G;function K(){return G||=W(()=>import(`./router.js`),__vite__mapDeps([0,1]))}var Ie=[{test:e=>e===`/`,handler:(e,t)=>{X(`home.html`,t).then(()=>ee())}},{test:e=>e.startsWith(`/projects`),handler:(e,t)=>{let n=window.location.pathname;K().then(({handleLegacyProjectRoutes:r})=>{r(n,e,t)}).catch(Q(t,`projects`))}},{test:e=>e===`/moments/my-tasks`,guard:g,handler:(e,t)=>{X(`moments/my-tasks.html`,t).then(()=>ve(e,t)).catch(Q(t,`my tasks`))}},{test:e=>e.startsWith(`/notifications`),guard:g,handler:(e,t)=>{Ne(window.location.pathname,e,t)}},{test:e=>e.startsWith(`/invitations`),guard:g,handler:(e,t)=>{re(window.location.pathname,t)}},{test:e=>e===`/change-password`,guard:g,handler:()=>{window.location.href=`/account/change-password`}},{test:e=>e===`/knowledge-base`,handler:(e,t)=>{se(window.location.pathname,e,t)}},{test:e=>e===`/privacy`,handler:(e,t)=>{X(`privacy.html`,t)}},{test:e=>e===`/tos`,handler:(e,t)=>{X(`tos.html`,t)}},{test:e=>e===`/account/delete`,guard:g,handler:(t,n)=>{X(`account/delete.html`,n).then(()=>e())}}];`serviceWorker`in navigator&&navigator.serviceWorker.register(`/sw.mjs`,{scope:`/`}).catch(e=>console.warn(`SW registration failed:`,e)),document.addEventListener(`DOMContentLoaded`,async()=>{let e=document.getElementById(`content`),t=document.getElementById(`main-menu`);await h(),Oe(t,e),document.addEventListener(`click`,n=>{let r=n.target.closest(`a[data-nav]`);if(r){let i=r.getAttribute(`href`);if(i&&i!==`#`){n.preventDefault(),q(i,t,e);return}}n.target.closest(`[data-action="back"]`)&&(n.preventDefault(),window.history.back())}),document.getElementById(`home-link`)?.addEventListener(`click`,n=>{n.preventDefault(),q(`/`,t,e)}),window.addEventListener(`popstate`,()=>{$(t,e)}),$(t,e)});function q(e,t,n){return window.history.pushState({},``,e),$(t,n)}var Le={"/":`Home`,"/projects":`Projects`,"/notifications":`Notifications`,"/invitations":`Invitations`,"/knowledge-base":`Knowledge Base`,"/moments/my-tasks":`My Tasks`};function J(){let e=document.getElementById(`main-content`);e&&requestAnimationFrame(()=>e.focus())}function Y(e){let t=document.getElementById(`page-title`);if(!t)return;let n=Le[e];if(!n){let t=e.split(`/`).filter(Boolean);n=t.length?t[t.length-1]:`Home`,n=n.charAt(0).toUpperCase()+n.slice(1).replace(/-/g,` `)}t.textContent=`${n} - Promise Model Online`}function X(e,t){return fetch(`/templates/${e}`).then(e=>{if(!e.ok)throw Error(`Network response was not ok`);return e.text()}).then(e=>{t.innerHTML=e,Y(window.location.pathname),J()})}function Z(e){X(`404.html`,e)}function Q(e,t){return()=>fetch(`/templates/error.html`).then(e=>e.text()).then(n=>{e.innerHTML=n,Y(window.location.pathname);let r=document.getElementById(`error-title`),i=document.getElementById(`error-message`);r&&(r.textContent=`Something went wrong`),i&&(i.textContent=`Failed to load ${t}. Please try again.`),J()}).catch(()=>{e.innerHTML=`<h1>Something went wrong</h1><p>Please try again.</p>`,Y(window.location.pathname),J()})}function $(e,t){let n=window.location.pathname;if(n===`/login`||n===`/logout`||n===`/register`){window.location.href=n;return}De(e,t);for(let r of Ie)if(r.test(n)){if(r.guard){let n=r.guard();if(`allowed`in n&&!n.allowed){n.redirect&&q(n.redirect,e,t);return}}r.handler(e,t);return}let r=n.split(`/`).filter(Boolean);if(r.length>=2){let i=r[0],a=r[1],o=`/`+r.slice(2).join(`/`)+(n.includes(`?`)?n.slice(n.indexOf(`?`)):``);i===`account`||i===`moments`||i===`knowledge-base`?X(`404.html`,t).catch(()=>{t.innerHTML=`<h1>Page not found</h1>`,Y(n),J()}):K().then(({handleProjectScopedRoutes:n})=>{n(i,a,o,e,t)}).catch(()=>{t.innerHTML=`<h1>Something went wrong</h1><p>Failed to load project. Please try again.</p>`,Y(n),J()})}else X(`404.html`,t).catch(()=>{t.innerHTML=`<h1>Page not found</h1>`,Y(n),J()})}export{t as C,c as S,u as _,ce as a,f as b,me as c,_e as d,v as f,m as g,te as h,ge as i,fe as l,X as loadTemplate,Q as loadTemplateWithError,_ as m,de as n,q as navigate,he as o,ne as p,le as r,pe as s,Z as showNotFound,W as t,C as u,d as v,l as x,p as y};