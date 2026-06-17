const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/router.js","js/iteration-create-modal.js"])))=>i.map(i=>d[i]);
function e(e){let t={...e},n=new Set;return{get(){return t},set(e){t={...t,...e},n.forEach(e=>{typeof e==`function`&&e()})},subscribe(e){return n.add(e),()=>{n.delete(e)}}}}var t=`pmo.auth`;function n(){try{let e=sessionStorage.getItem(t);if(e){let t=JSON.parse(e);return{isAuthenticated:!!t.isAuthenticated,username:t.username||null,userId:t.userId??null}}}catch{}return{isAuthenticated:!1,username:null,userId:null}}function r(e){try{sessionStorage.setItem(t,JSON.stringify(e))}catch{}}var i=e(n()),a=i.set.bind(i);i.set=e=>{a(e),r(i.get())};function o(){return i.get().isAuthenticated}function s(){return i.get().username}function c(){return i.get().userId}function l(){let e=o()?`
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
      </a>`,t=document.getElementById(`home-cta-area`),n=document.getElementById(`home-cta-area-bottom`);t&&(t.innerHTML=e),n&&(n.innerHTML=e)}async function u(e){let t=await m(e);if(t.status===204)return null;if(!t.ok)throw Error(`HTTP ${t.status}`);return t.json()}async function d(e){return await u(e)??[]}async function f(e,t){let n=await m(e,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(n.status===204)return null;if(!n.ok)throw Error(`HTTP ${n.status}`);return n.json()}async function p(e,t){let n=await m(e,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify(t)});if(n.status===204)return null;if(!n.ok)throw Error(`HTTP ${n.status}`);return n.json()}async function m(e,t={}){let n=await fetch(e,{...t,credentials:`include`,headers:{Accept:`application/json`,...t.headers||{}}});if(n.status===401)throw i.set({isAuthenticated:!1,username:null,userId:null}),window.location.pathname.startsWith(`/login`)||(window.location.href=`/login`),Error(`Unauthorized`);return n}async function h(){try{let e=await fetch(`/api/users/me`,{method:`GET`,credentials:`include`});if(e.ok){let t=await e.json();return i.set({isAuthenticated:!0,username:t.name,userId:t.userId}),!0}}catch{}return i.set({isAuthenticated:!1,username:null,userId:null}),!1}async function g(){try{return await u(`/api/notifications`)??[]}catch{return[]}}var ee=g,te=g,_=e=>p(`/api/notifications/${e}`,{isRead:!0}),v=()=>p(`/api/notifications`,{isRead:!0,applyToAll:!0}),y=null,b=null;async function ne(e){if(!y){b=typeof e==`function`?e:null,y=new signalR.HubConnectionBuilder().withUrl(`/hubs/notifications`).withAutomaticReconnect([0,2e3,5e3,1e4,3e4]).configureLogging(signalR.LogLevel.Warning).build(),y.on(`ReceiveNotification`,e=>{b&&b(e)}),y.onreconnected(async()=>{b&&b(null)});try{await y.start()}catch(e){console.warn(`SignalR connection failed, notifications will not be real-time:`,e),y=null}}}var x=`pmo:notifications:unread-updated`,S=!1;function C(e){let t=document.getElementById(`notification-badge`);if(!t)return;let n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.classList.remove(`d-none`)):t.classList.add(`d-none`)}async function w(){try{let e=await ee();C(Array.isArray(e)?e.length:0),window.dispatchEvent(new CustomEvent(x,{detail:{notifications:Array.isArray(e)?e:[]}}))}catch{C(0)}}async function re(){await w()}function ie(){w(),!S&&(S=!0,ne(()=>{w()}))}function ae(){return x}function oe(){let e=window.location.pathname;document.querySelectorAll(`#main-menu a[data-nav]`).forEach(t=>{let n=t.getAttribute(`href`);if(!n||n===`#`)return;let r=n===e||n!==`/`&&e.startsWith(n);t.removeAttribute(`aria-current`),r&&t.setAttribute(`aria-current`,`page`)})}function se(e,t,n){let r=e.target.closest(`a[data-nav]`);if(!r)return;let i=r.getAttribute(`href`);!i||i===`#`||(e.preventDefault(),q(i,t,n))}function ce(e,t){let n=o()?`authenticated.html`:`anonymous.html`;return fetch(`/templates/navigation/${n}`).then(e=>{if(!e.ok)throw Error(`Network response was not ok`);return e.text()}).then(t=>{e.innerHTML=t,oe(),o()&&ie()}).catch(t=>{throw e.innerHTML=`<h1>Error loading template</h1><p>${t.message}</p>`,t})}function T(e,t){let n=document.getElementById(`main-menu`);!n||n.dataset.navBound||(n.dataset.navBound=`1`,n.addEventListener(`click`,n=>se(n,e,t)))}var E=(e,t,n)=>u(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}`),le=(e,t,n)=>f(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/create`,n),ue=()=>u(`/api/moments/assigned-to-me`),de=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/stride-assignment`,{strideId:r}),fe=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/status`,{newStatus:r}),pe=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/estimate`,{estimate:r}),D=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/type`,{newType:r}),O=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/owner`,{userId:r}),k=(e,t,n,r)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/description`,{description:r}),A=(e,t,n,r)=>f(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks`,r),j=(e,t,n,r,i)=>p(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks/${r}/completion`,{isCompleted:i});function M(e){return String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function N(e){return`
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${M(e)}">
                <span class="visually-hidden">${M(e)}</span>
            </div>
        </div>
    `}function P({icon:e,title:t,description:n,button:r,colspan:i}){return`
        <tr class="inline-table-empty-row">
            <td colspan="${i}" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                    ${e?`<div class="empty-table-icon"><i class="bi ${M(e)}"></i></div>`:``}
                    ${t?`<h5 class="fw-semibold text-secondary mb-1">${M(t)}</h5>`:``}
                    ${n?`<p class="text-muted mb-2">${M(n)}</p>`:``}
                    ${r?`<button${r.id?` id="${M(r.id)}"`:``} class="${M(r.class||`btn btn-outline-primary rounded-pill mt-2`)}" type="button">${r.icon?`<i class="bi ${M(r.icon)} me-1"></i> `:``}${M(r.text)}</button>`:``}
                </div>
            </td>
        </tr>
    `}function F({icon:e,title:t,description:n,button:r}){return`
        <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
            ${e?`<div class="empty-table-icon"><i class="bi ${M(e)}"></i></div>`:``}
            ${t?`<h5 class="fw-semibold text-secondary mb-1">${M(t)}</h5>`:``}
            ${n?`<p class="text-muted mb-2">${M(n)}</p>`:``}
            ${r?`<button${r.id?` id="${M(r.id)}"`:``} class="${M(r.class||`btn btn-outline-primary rounded-pill mt-2`)}" type="button">${r.icon?`<i class="bi ${M(r.icon)} me-1"></i> `:``}${M(r.text)}</button>`:``}
        </div>
    `}function I(e,t){let n=document.getElementById(`my-tasks-content`),r=document.getElementById(`error-text`);ue().then(r=>{if(!r||r.length===0){n.innerHTML=F({icon:`bi-list-task`,title:`You have no assigned tasks.`,description:`When a moment is assigned to you, it will appear here.`});return}n.innerHTML=`
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
                                <td>${M(e.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${e.sequenceNumber}" data-current-type="${e.type}" aria-label="Moment type"><option value="Story" ${e.type===`Story`?`selected`:``}>Story</option><option value="Job" ${e.type===`Job`?`selected`:``}>Job</option></select></td>
                                <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
                                <td>${e.effortEstimate??`–`}</td>
                                <td>${e.ownerSlug&&e.projectSlug?`<a href="/${e.ownerSlug}/${e.projectSlug}/moments/${e.sequenceNumber}" moment-seq="${e.sequenceNumber}" data-owner="${e.ownerSlug}" data-project="${e.projectSlug}" class="btn btn-sm btn-outline-primary">View</a>`:`<a href="/moments/${e.sequenceNumber}" moment-seq="${e.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a>`}</td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `,n.addEventListener(`change`,async e=>{let t=e.target;if(t.matches(`.moment-type-select`)){let e=t.closest(`tr`),n=e?.dataset.owner,r=e?.dataset.project;if(!n||!r){console.error(`Cannot determine project for moment type update`);return}let i=parseInt(t.dataset.momentId,10),a=t.value,o=t.dataset.currentType||a;try{await D(n,r,i,a),t.dataset.currentType=a}catch(e){t.value=o,console.error(`Failed to update moment type:`,e)}}}),n.querySelectorAll(`a[moment-seq]`).forEach(n=>{n.addEventListener(`click`,r=>{r.ctrlKey||r.metaKey||r.button===1||(r.preventDefault(),q(`/${n.getAttribute(`data-owner`)}/${n.getAttribute(`data-project`)}/moments/${n.getAttribute(`moment-seq`)}`,e,t))})})}).catch(e=>{r.textContent=`Failed to load your tasks.`,console.error(e)})}var L=!1;function R(e){let t=document.getElementById(`notification-badge`);if(!t)return;let n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.style.display=`inline`):t.style.display=`none`}function z(){let e=document.getElementById(`notification-badge`);if(!e||e.style.display===`none`)return;let t=parseInt(e.textContent||`0`,10);if(!Number.isFinite(t)||t<=0){R(0);return}R(t-1)}function B(e){if(!e)return;let t=e.classList.contains(`unread`);e.classList.remove(`unread`);let n=e.querySelector(`td[data-actions="1"]`);n&&(n.textContent=`✓ Read`),t&&z()}function V(e,t){if(e){if(!t||t.length===0){e.innerHTML=F({icon:`bi-bell`,title:`No notifications yet.`,description:`You'll see notifications here when there is activity related to you.`});return}e.innerHTML=`
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
                        <td>${M(e.message)}</td>
                        <td>${e.type}</td>
                        <td>${new Date(e.createdAt).toLocaleString(`en-CA`)}</td>
                        <td data-actions="1">
                            ${e.isRead?`✓ Read`:`<button class="btn btn-sm btn-outline-primary mark-read-btn" type="button" data-id="${e.id}">Read</button>`}
                        </td>
                    </tr>
                `).join(``)}
            </tbody>
        </table>
    `,document.getElementById(`mark-all-read`)?.addEventListener(`click`,async()=>{try{await v();let t=window.scrollY;e.querySelectorAll(`tbody tr`).forEach(e=>{e.classList.remove(`unread`);let t=e.querySelector(`td[data-actions="1"]`);t&&(t.textContent=`✓ Read`)}),R(0),window.scrollTo(0,t)}catch(e){alert(`Failed to mark all as read`),console.error(e)}}),e.querySelectorAll(`.mark-read-btn`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=parseInt(t.dataset.id,10);try{await _(n);let t=window.scrollY;B(e.querySelector(`tr[data-notification-id="${n}"]`)),window.scrollTo(0,t)}catch(e){alert(`Failed to mark notification as read`),console.error(e)}})})}}async function me(){let e=document.getElementById(`notifications-list`),t=document.getElementById(`error-text`);if(!(!e||!t)){t.textContent=``;try{V(e,await te()),re()}catch{t.textContent=`Failed to load notifications.`}}}function he(e){if(!L){L=!0;let e=ae();window.addEventListener(e,e=>{let t=document.getElementById(`notifications-list`);if(!t)return;let n=e?.detail?.notifications;V(t,Array.isArray(n)?n:[])})}me()}function ge(e,t,n){e===`/notifications`?X(`notifications/list.html`,n).then(()=>he(n)).catch(Q(n,`notifications`)):Z(n)}var _e=()=>u(`/api/permissions/pending`),ve=e=>p(`/api/permissions/${e}`,{status:`Active`});function ye(e){let t=document.getElementById(`invitations-list`),n=document.getElementById(`error-text`);async function r(){try{let e=await _e();if(!e||e.length===0){t.innerHTML=F({icon:`bi-envelope`,title:`No pending invitations.`,description:`When someone invites you to a project, it will appear here.`});return}t.innerHTML=`
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
                                <td>${M(e.projectName)}</td>
                                <td>${e.level}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary accept-btn" data-permission-id="${e.permissionId}" type="button">Accept</button>
                                </td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `,document.querySelectorAll(`.accept-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{let n=parseInt(e.dataset.permissionId,10);try{await ve(n);let r=window.scrollY;e.closest(`tr`)?.remove(),t.querySelectorAll(`tbody tr`).length===0&&(t.innerHTML=F({icon:`bi-envelope`,title:`No pending invitations.`,description:`When someone invites you to a project, it will appear here.`})),window.scrollTo(0,r)}catch(e){alert(`Failed to accept invitation`),console.error(e)}})})}catch{n.textContent=`Failed to load invitations.`}}r()}function be(e,t){e===`/invitations`?X(`invitations/list.html`,t).then(()=>ye(t)).catch(Q(t,`invitations`)):Z(t)}function H(e,t,n){return`
    <section id="${e}" class="kb-section">
      <h1>${t}</h1>
      ${n}
    </section>
  `}function xe(){let e=document.getElementById(`kb-content`);e.innerHTML=[H(`overview`,`The Promise Stack Overview`,`
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
      `),H(`section1`,`Promise 0 (Universal Standards)`,`
        <p>Before detailing specific product features, establish the baseline. Promise 0 represents the universal Definition of Done that every single feature inherits automatically.</p>
        <ul>
          <li><strong>Security:</strong> Documentation on authentication standards, data encryption, and audit logging.</li>
          <li><strong>Accessibility:</strong> Guidelines for WCAG 2.1 AA compliance, screen reader support, and keyboard navigation.</li>
          <li><strong>Performance:</strong> Baselines such as page load times under 2 seconds and API responses under 500ms.</li>
          <li><strong>Compliance & DevOps:</strong> Details on GDPR, testing standards, and CI/CD pipelines.</li>
        </ul>
      `),H(`section2`,`Product Promises (WHY)`,`
        <p>This section acts as the strategic north star. Everything built must trace back to one of the pages in this category.</p>
        <ul>
          <li><strong>Core Value Propositions:</strong> Detail the 3-5 fundamental reasons why someone would choose your product.</li>
          <li><strong>The Promise Pattern:</strong> Ensure each promise is formatted as <code>As a [Persona], [Value Verb] [Outcome]</code>.</li>
          <li><strong>Explicit vs. Implicit Promises:</strong> Document the commitments you are intentionally making, as well as the implicit expectations users have formed from the product&rsquo;s behavior.</li>
        </ul>
      `),H(`section3`,`Epics (WHAT)`,`
        <p>Create a sub-section for each Epic under its parent Promise.</p>
        <ul>
          <li><strong>Major Capabilities:</strong> Document the 3-5 essential capabilities required to fulfill the parent Promise.</li>
          <li><strong>The Epic Test:</strong> Include a section verifying that if this Epic were removed, the parent Promise would fail.</li>
        </ul>
      `),H(`section4`,`Journeys (WHEN)`,`
        <p>Journeys define the circumstances under which the Epics are valuable.</p>
        <ul>
          <li><strong>Circumstance Mapping:</strong> Document the specific situations or arcs for the persona (e.g., &ldquo;First-time rider&rdquo; vs. &ldquo;Daily commuter&rdquo;).</li>
          <li><strong>Constraint Check:</strong> Ensure there are no more than 3-5 Journeys per Epic to prevent scope creep.</li>
        </ul>
      `),H(`section5`,`Flows (HOW)`,`
        <p>Flows are the step-by-step processes that make up a Journey.</p>
        <ul>
          <li><strong>Session Sequences:</strong> Document the distinct processes that a user can complete in a single sitting.</li>
          <li><strong>Start and End Points:</strong> Clearly define the beginning and end of the 3-5 Flows that make up each Journey.</li>
        </ul>
      `),H(`section6`,`Moments (WHO)`,`
        <p>This is the most granular level of your knowledge base, directly translating to your engineering tickets, because this is the only level where code gets written.</p>
        <ul>
          <li><strong>Story Moments:</strong> Document the interactions where a single persona acts and receives user-visible value.</li>
          <li><strong>Job Moments:</strong> Document the behind-the-scenes coordination points between multiple personas or systems.</li>
          <li><strong>The Count Test:</strong> Explicitly count the personas involved to ensure accurate classification between Stories and Jobs.</li>
        </ul>
      `),H(`section7`,`Promise Discovery (The Sandbox)`,`
        <p>Maintain a separate workspace for ideas that are not yet commitments.</p>
        <ul>
          <li><strong>Validation of Concept (VOC):</strong> Track signals, mockups, and early research to answer &ldquo;Is there something here worth building?&rdquo;.</li>
          <li><strong>Testable Value Promise (TVP):</strong> Document specific claims about user value that are ready for testing.</li>
          <li><strong>Core Value Promise (CVP):</strong> Record the evidence gathered that justifies promoting an idea into a fully committed Product Promise.</li>
        </ul>
      `)].join(`
`),Se(),Ce()}function Se(){let e=document.querySelectorAll(`.kb-nav-link`);e.forEach(t=>{t.addEventListener(`click`,n=>{let r=t.getAttribute(`href`);if(!r||!r.startsWith(`#`))return;n.preventDefault();let i=document.getElementById(r.slice(1));i&&(i.scrollIntoView({behavior:`smooth`,block:`start`}),e.forEach(e=>e.removeAttribute(`aria-current`)),t.setAttribute(`aria-current`,`true`))})})}function Ce(){let e=document.querySelectorAll(`.kb-nav-link`),t=document.querySelectorAll(`.kb-section[id]`);if(!t.length)return;let n=!1,r=()=>{n||=(window.requestAnimationFrame(()=>{let r=window.scrollY+100,i=null;t.forEach(e=>{r>=e.offsetTop&&(i=e.id)}),e.forEach(e=>{let t=e.getAttribute(`href`)===`#${i}`;e.setAttribute(`aria-current`,t?`true`:`false`)}),n=!1}),!0)};window.addEventListener(`scroll`,r,{passive:!0}),r()}function we(e,t,n){X(`knowledge-base.html`,n).then(()=>xe()).catch(Q(n,`knowledge base`))}function Te(){let e=document.getElementById(`delete-account-form`),t=document.getElementById(`delete-account-btn`),n=document.getElementById(`delete-btn-text`),r=document.getElementById(`delete-spinner`),i=document.getElementById(`delete-error`),a=document.getElementById(`delete-success`),o=document.getElementById(`delete-password`),s=document.getElementById(`export-data-btn`),c=document.getElementById(`export-btn-text`),l=document.getElementById(`export-spinner`),u=document.getElementById(`export-error`),d=document.getElementById(`export-link-top`);if(!d||!s)return;d.addEventListener(`click`,e=>{e.preventDefault(),s.scrollIntoView({behavior:`smooth`}),s.focus()}),s.addEventListener(`click`,async()=>{u.classList.add(`d-none`),p(!0);try{let e=await fetch(`/api/users/me/export`,{credentials:`include`});if(!e.ok){f((await e.json().catch(()=>({}))).message||`Failed to export data.`);return}let t=await e.blob(),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`pmo-data-export.json`,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)}catch{f(`Network error. Please try again.`)}finally{p(!1)}});function f(e){u&&(u.textContent=e,u.classList.remove(`d-none`))}function p(e){!s||!c||!l||(s.disabled=e,c.classList.toggle(`d-none`,e),l.classList.toggle(`d-none`,!e))}if(!e||!i||!a||!o||!t||!n||!r)return;e.addEventListener(`submit`,async t=>{t.preventDefault(),i.classList.add(`d-none`),a.classList.add(`d-none`);let n=o.value.trim();if(!n){m(`Please enter your password.`);return}h(!0);try{let t=await fetch(`/api/users/me`,{method:`DELETE`,credentials:`include`});if(t.status!==204&&t.status!==404){m(`Failed to delete account data. Please try again.`),h(!1);return}let r=await fetch(`/account/me`,{method:`DELETE`,headers:{"Content-Type":`application/json`},body:JSON.stringify({password:n}),credentials:`include`});r.status===204?(a.textContent=`Your account and all associated data have been permanently deleted. You will be redirected shortly.`,a.classList.remove(`d-none`),e.style.display=`none`,setTimeout(()=>{window.location.href=`/`},3e3)):r.status===401?m(`Incorrect password. Please try again.`):m(`Something went wrong. Please try again.`)}catch{m(`Network error. Please check your connection and try again.`)}finally{h(!1)}});function m(e){i.textContent=e,i.classList.remove(`d-none`)}function h(e){t.disabled=e,n.classList.toggle(`d-none`,e),r.classList.toggle(`d-none`,!e)}}var Ee=`modulepreload`,De=function(e){return`/dist/`+e},U={},W=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=De(t,n),t in U)return;U[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Ee,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},G;function K(){return G||=W(()=>import(`./router.js`),__vite__mapDeps([0,1]))}`serviceWorker`in navigator&&navigator.serviceWorker.register(`/sw.mjs`,{scope:`/`}).catch(()=>{}),document.addEventListener(`DOMContentLoaded`,async()=>{let e=document.getElementById(`content`),t=document.getElementById(`main-menu`);await h(),T(t,e),document.addEventListener(`click`,n=>{let r=n.target.closest(`a[data-nav]`);if(r){let i=r.getAttribute(`href`);if(i&&i!==`#`){n.preventDefault(),q(i,t,e);return}}n.target.closest(`[data-action="back"]`)&&(n.preventDefault(),window.history.back())}),document.getElementById(`home-link`)?.addEventListener(`click`,n=>{n.preventDefault(),q(`/`,t,e)}),window.addEventListener(`popstate`,()=>{$(t,e)}),$(t,e)});function q(e,t,n){return window.history.pushState({},``,e),$(t,n)}var Oe={"/":`Home`,"/projects":`Projects`,"/notifications":`Notifications`,"/invitations":`Invitations`,"/knowledge-base":`Knowledge Base`,"/moments/my-tasks":`My Tasks`};function J(){let e=document.getElementById(`main-content`);e&&requestAnimationFrame(()=>e.focus())}function Y(e){let t=document.getElementById(`page-title`);if(!t)return;let n=Oe[e];if(!n){let t=e.split(`/`).filter(Boolean);n=t.length?t[t.length-1]:`Home`,n=n.charAt(0).toUpperCase()+n.slice(1).replace(/-/g,` `)}t.textContent=`${n} - Promise Model Online`}function X(e,t){return fetch(`/templates/${e}`).then(e=>{if(!e.ok)throw Error(`Network response was not ok`);return e.text()}).then(e=>{t.innerHTML=e,Y(window.location.pathname),J()})}function Z(e){X(`404.html`,e)}function Q(e,t){return()=>fetch(`/templates/error.html`).then(e=>e.text()).then(n=>{e.innerHTML=n,Y(window.location.pathname);let r=document.getElementById(`error-title`),i=document.getElementById(`error-message`);r&&(r.textContent=`Something went wrong`),i&&(i.textContent=`Failed to load ${t}. Please try again.`),J()}).catch(()=>{e.innerHTML=`<h1>Something went wrong</h1><p>Please try again.</p>`,Y(window.location.pathname),J()})}function $(e,t){let n=window.location.pathname;if(n===`/login`||n===`/logout`||n===`/register`){window.location.href=n;return}switch(ce(e,t),!0){case n===`/`:X(`home.html`,t).then(()=>l());break;case n.startsWith(`/projects`):K().then(({handleLegacyProjectRoutes:r})=>{r(n,e,t)}).catch(Q(t,`projects`));break;case n===`/moments/my-tasks`:X(`moments/my-tasks.html`,t).then(()=>I(e,t)).catch(Q(t,`my tasks`));break;case n.startsWith(`/notifications`):ge(n,e,t);break;case n.startsWith(`/invitations`):be(n,t);break;case n===`/change-password`:if(!o()){q(`/login`,e,t);break}window.location.href=`/account/change-password`;break;case n===`/knowledge-base`:we(n,e,t);break;case n===`/privacy`:X(`privacy.html`,t);break;case n===`/tos`:X(`tos.html`,t);break;case n===`/account/delete`:X(`account/delete.html`,t).then(()=>Te());break;default:{let r=n.split(`/`).filter(Boolean);if(r.length>=2){let i=r[0],a=r[1],o=`/`+r.slice(2).join(`/`)+(n.includes(`?`)?n.slice(n.indexOf(`?`)):``);i===`account`||i===`moments`||i===`knowledge-base`?X(`404.html`,t).catch(()=>{t.innerHTML=`<h1>Page not found</h1>`,Y(n),J()}):K().then(({handleProjectScopedRoutes:n})=>{n(i,a,o,e,t)}).catch(()=>{t.innerHTML=`<h1>Something went wrong</h1><p>Failed to load project. Please try again.</p>`,Y(n),J()})}else X(`404.html`,t).catch(()=>{t.innerHTML=`<h1>Page not found</h1>`,Y(n),J()})}}}export{e as C,s as S,u as _,N as a,f as b,A as c,pe as d,O as f,m as g,j as h,M as i,E as l,X as loadTemplate,Q as loadTemplateWithError,D as m,F as n,q as navigate,de as o,fe as p,P as r,le as s,Z as showNotFound,W as t,k as u,d as v,c as x,p as y};