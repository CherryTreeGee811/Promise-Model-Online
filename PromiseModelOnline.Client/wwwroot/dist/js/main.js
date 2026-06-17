const tt="modulepreload",et=function(e){return"/"+e},O={},nt=function(t,n,o){let a=Promise.resolve();if(n&&n.length>0){let i=function(d){return Promise.all(d.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),u=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));a=i(n.map(d=>{if(d=et(d),d in O)return;O[d]=!0;const p=d.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${f}`))return;const m=document.createElement("link");if(m.rel=p?"stylesheet":tt,p||(m.as="script"),m.crossOrigin="",m.href=d,u&&m.setAttribute("nonce",u),document.head.appendChild(m),p)return new Promise((v,w)=>{m.addEventListener("load",v),m.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(i){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=i,window.dispatchEvent(r),!r.defaultPrevented)throw i}return a.then(i=>{for(const r of i||[])r.status==="rejected"&&s(r.reason);return t().catch(s)})},U="pmo.auth";let x=!1,C=null,A=null;function ot(){try{const e=sessionStorage.getItem(U);if(e){const t=JSON.parse(e);x=!!t.isAuthenticated,C=t.username||null,A=t.userId??null}}catch{}}function st(){try{sessionStorage.setItem(U,JSON.stringify({isAuthenticated:x,username:C,userId:A}))}catch{}}function at({isAuthenticated:e,username:t,userId:n}){x=!0,C=t||null,A=n??null,st()}function D(){x=!1,C=null,A=null;try{sessionStorage.removeItem(U)}catch{}}function R(){return x}function qt(){return C}function Ut(){return A}ot();function it(){const t=R()?`
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
      </a>`,n=document.getElementById("home-cta-area"),o=document.getElementById("home-cta-area-bottom");n&&(n.innerHTML=t),o&&(o.innerHTML=t)}async function P(e){const t=await F(e);if(t.status===204)return null;if(!t.ok)throw new Error(`HTTP ${t.status}`);return t.json()}async function Ft(e){return await P(e)??[]}async function G(e,t){const n=await F(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(n.status===204)return null;if(!n.ok)throw new Error(`HTTP ${n.status}`);return n.json()}async function g(e,t){const n=await F(e,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(n.status===204)return null;if(!n.ok)throw new Error(`HTTP ${n.status}`);return n.json()}async function F(e,t={}){const n=await fetch(e,{...t,credentials:"include",headers:{Accept:"application/json",...t.headers}});if(n.status===401)throw D(),window.location.pathname.startsWith("/login")||(window.location.href="/login"),new Error("Unauthorized");return n}async function rt(){try{const e=await fetch("/api/users/me",{method:"GET",credentials:"include"});if(e.ok){const t=await e.json();return at({isAuthenticated:!0,username:t.name,userId:t.userId}),!0}}catch{}return D(),!1}async function K(){try{return await P("/api/notifications")??[]}catch{return[]}}const ct=K,lt=K,dt=e=>g(`/api/notifications/${e}`,{isRead:!0}),ut=()=>g("/api/notifications",{isRead:!0,applyToAll:!0});let E=null,T=null;async function mt(e){if(!E){T=typeof e=="function"?e:null,E=new signalR.HubConnectionBuilder().withUrl("/hubs/notifications").withAutomaticReconnect([0,2e3,5e3,1e4,3e4]).configureLogging(signalR.LogLevel.Warning).build(),E.on("ReceiveNotification",t=>{T&&T(t)}),E.onreconnected(async()=>{T&&T(null)});try{await E.start()}catch(t){console.warn("SignalR connection failed, notifications will not be real-time:",t),E=null}}}const z="pmo:notifications:unread-updated";let W=!1;function J(e){const t=document.getElementById("notification-badge");if(!t)return;const n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.classList.remove("d-none")):t.classList.add("d-none")}async function H(){try{const e=await ct(),t=Array.isArray(e)?e.length:0;J(t),window.dispatchEvent(new CustomEvent(z,{detail:{notifications:Array.isArray(e)?e:[]}}))}catch{J(0)}}async function pt(){await H()}function ht(){H(),!W&&(W=!0,mt(()=>{H()}))}function ft(){return z}function gt(){const e=window.location.pathname;document.querySelectorAll("#main-menu a[data-nav]").forEach(t=>{const n=t.getAttribute("href");if(!n||n==="#")return;const o=n===e||n!=="/"&&e.startsWith(n);t.removeAttribute("aria-current"),o&&t.setAttribute("aria-current","page")})}function bt(e,t,n){const o=e.target.closest("a[data-nav]");if(!o)return;const a=o.getAttribute("href");!a||a==="#"||(e.preventDefault(),L(a,t,n))}function yt(e,t){const n=R()?"authenticated.html":"anonymous.html";return fetch(`/templates/navigation/${n}`).then(o=>{if(!o.ok)throw new Error("Network response was not ok");return o.text()}).then(o=>{e.innerHTML=o,gt(),R()&&ht()}).catch(o=>{throw e.innerHTML=`<h1>Error loading template</h1><p>${o.message}</p>`,o})}function wt(e,t){const n=document.getElementById("main-menu");!n||n.dataset.navBound||(n.dataset.navBound="1",n.addEventListener("click",o=>bt(o,e,t)))}const Ot=(e,t,n)=>P(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}`),Wt=(e,t,n)=>G(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/create`,n),vt=()=>P("/api/moments/assigned-to-me"),Jt=(e,t,n,o)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/stride-assignment`,{strideId:o}),Vt=(e,t,n,o)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/status`,{newStatus:o}),_t=(e,t,n,o)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/estimate`,{estimate:o}),Et=(e,t,n,o)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/type`,{newType:o}),Yt=(e,t,n,o)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/owner`,{userId:o}),Dt=(e,t,n,o)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/description`,{description:o}),Gt=(e,t,n,o)=>G(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks`,o),Kt=(e,t,n,o,a)=>g(`/api/projects/${encodeURIComponent(e)}/${encodeURIComponent(t)}/moments/${n}/tasks/${o}/completion`,{isCompleted:a});function l(e){return String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function zt(e){return`
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${l(e)}">
                <span class="visually-hidden">${l(e)}</span>
            </div>
        </div>
    `}function Qt({icon:e,title:t,description:n,button:o,colspan:a}){const s=e?`<div class="empty-table-icon"><i class="bi ${l(e)}"></i></div>`:"",i=t?`<h5 class="fw-semibold text-secondary mb-1">${l(t)}</h5>`:"",r=n?`<p class="text-muted mb-2">${l(n)}</p>`:"",u=o?`<button${o.id?` id="${l(o.id)}"`:""} class="${l(o.class||"btn btn-outline-primary rounded-pill mt-2")}" type="button">${o.icon?`<i class="bi ${l(o.icon)} me-1"></i> `:""}${l(o.text)}</button>`:"";return`
        <tr class="inline-table-empty-row">
            <td colspan="${a}" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                    ${s}
                    ${i}
                    ${r}
                    ${u}
                </div>
            </td>
        </tr>
    `}function B({icon:e,title:t,description:n,button:o}){const a=e?`<div class="empty-table-icon"><i class="bi ${l(e)}"></i></div>`:"",s=t?`<h5 class="fw-semibold text-secondary mb-1">${l(t)}</h5>`:"",i=n?`<p class="text-muted mb-2">${l(n)}</p>`:"",r=o?`<button${o.id?` id="${l(o.id)}"`:""} class="${l(o.class||"btn btn-outline-primary rounded-pill mt-2")}" type="button">${o.icon?`<i class="bi ${l(o.icon)} me-1"></i> `:""}${l(o.text)}</button>`:"";return`
        <div class="no-items d-flex flex-column align-items-center gap-3 py-5">
            ${a}
            ${s}
            ${i}
            ${r}
        </div>
    `}function $t(e,t){const n=document.getElementById("my-tasks-content"),o=document.getElementById("error-text");vt().then(a=>{if(!a||a.length===0){n.innerHTML=B({icon:"bi-list-task",title:"You have no assigned tasks.",description:"When a moment is assigned to you, it will appear here."});return}n.innerHTML=`
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
                        ${a.map(s=>`
                            <tr data-moment-id="${s.sequenceNumber}" data-owner="${s.ownerSlug||""}" data-project="${s.projectSlug||""}">
                                <td>${l(s.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${s.sequenceNumber}" data-current-type="${s.type}" aria-label="Moment type"><option value="Story" ${s.type==="Story"?"selected":""}>Story</option><option value="Job" ${s.type==="Job"?"selected":""}>Job</option></select></td>
                                <td><span class="status-badge status-${(s.status||"").toLowerCase()}">${s.status}</span></td>
                                <td>${s.effortEstimate??"–"}</td>
                                <td>${s.ownerSlug&&s.projectSlug?`<a href="/${s.ownerSlug}/${s.projectSlug}/moments/${s.sequenceNumber}" moment-seq="${s.sequenceNumber}" data-owner="${s.ownerSlug}" data-project="${s.projectSlug}" class="btn btn-sm btn-outline-primary">View</a>`:`<a href="/moments/${s.sequenceNumber}" moment-seq="${s.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a>`}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `,n.addEventListener("change",async s=>{const i=s.target;if(i.matches(".moment-type-select")){const r=i.closest("tr"),u=r==null?void 0:r.dataset.owner,d=r==null?void 0:r.dataset.project;if(!u||!d){console.error("Cannot determine project for moment type update");return}const p=parseInt(i.dataset.momentId,10),f=i.value,m=i.dataset.currentType||f;try{await Et(u,d,p,f),i.dataset.currentType=f}catch(v){i.value=m,console.error("Failed to update moment type:",v)}}}),n.querySelectorAll("a[moment-seq]").forEach(s=>{s.addEventListener("click",i=>{if(i.ctrlKey||i.metaKey||i.button===1)return;i.preventDefault();const r=s.getAttribute("data-owner"),u=s.getAttribute("data-project"),d=s.getAttribute("moment-seq");L(`/${r}/${u}/moments/${d}`,e,t)})})}).catch(a=>{o.textContent="Failed to load your tasks.",console.error(a)})}let V=!1;function M(e){const t=document.getElementById("notification-badge");if(!t)return;const n=Number.isFinite(e)?e:0;n>0?(t.textContent=String(n),t.style.display="inline"):t.style.display="none"}function kt(){const e=document.getElementById("notification-badge");if(!e||e.style.display==="none")return;const t=parseInt(e.textContent||"0",10);if(!Number.isFinite(t)||t<=0){M(0);return}M(t-1)}function It(e){if(!e)return;const t=e.classList.contains("unread");e.classList.remove("unread");const n=e.querySelector('td[data-actions="1"]');n&&(n.textContent="✓ Read"),t&&kt()}function Q(e,t){var n;if(e){if(!t||t.length===0){e.innerHTML=B({icon:"bi-bell",title:"No notifications yet.",description:"You'll see notifications here when there is activity related to you."});return}e.innerHTML=`
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
                ${t.map(o=>`
                    <tr class="${o.isRead?"":"unread"}" data-notification-id="${o.id}">
                        <td>${l(o.message)}</td>
                        <td>${o.type}</td>
                        <td>${new Date(o.createdAt).toLocaleString("en-CA")}</td>
                        <td data-actions="1">
                            ${o.isRead?"✓ Read":`<button class="btn btn-sm btn-outline-primary mark-read-btn" type="button" data-id="${o.id}">Read</button>`}
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `,(n=document.getElementById("mark-all-read"))==null||n.addEventListener("click",async()=>{try{await ut();const o=window.scrollY;e.querySelectorAll("tbody tr").forEach(a=>{a.classList.remove("unread");const s=a.querySelector('td[data-actions="1"]');s&&(s.textContent="✓ Read")}),M(0),window.scrollTo(0,o)}catch(o){alert("Failed to mark all as read"),console.error(o)}}),e.querySelectorAll(".mark-read-btn").forEach(o=>{o.addEventListener("click",async()=>{const a=parseInt(o.dataset.id,10);try{await dt(a);const s=window.scrollY,i=e.querySelector(`tr[data-notification-id="${a}"]`);It(i),window.scrollTo(0,s)}catch(s){alert("Failed to mark notification as read"),console.error(s)}})})}}async function Tt(){const e=document.getElementById("notifications-list"),t=document.getElementById("error-text");if(!(!e||!t)){t.textContent="";try{const n=await lt();Q(e,n),pt()}catch{t.textContent="Failed to load notifications."}}}function Lt(e){if(!V){V=!0;const t=ft();window.addEventListener(t,n=>{var s;const o=document.getElementById("notifications-list");if(!o)return;const a=(s=n==null?void 0:n.detail)==null?void 0:s.notifications;Q(o,Array.isArray(a)?a:[])})}Tt()}function St(e,t,n){e==="/notifications"?h("notifications/list.html",n).then(()=>Lt()).catch(S(n,"notifications")):X(n)}const xt=()=>P("/api/permissions/pending"),Ct=e=>g(`/api/permissions/${e}`,{status:"Active"});function At(e){const t=document.getElementById("invitations-list"),n=document.getElementById("error-text");async function o(){try{const a=await xt();if(!a||a.length===0){t.innerHTML=B({icon:"bi-envelope",title:"No pending invitations.",description:"When someone invites you to a project, it will appear here."});return}t.innerHTML=`
                <table class="table table-sm table-striped table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Permission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${a.map(s=>`
                            <tr>
                                <td>${l(s.projectName)}</td>
                                <td>${s.level}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary accept-btn" data-permission-id="${s.permissionId}" type="button">Accept</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `,document.querySelectorAll(".accept-btn").forEach(s=>{s.addEventListener("click",async()=>{const i=parseInt(s.dataset.permissionId,10);try{await Ct(i);const r=window.scrollY,u=s.closest("tr");u==null||u.remove(),t.querySelectorAll("tbody tr").length===0&&(t.innerHTML=B({icon:"bi-envelope",title:"No pending invitations.",description:"When someone invites you to a project, it will appear here."})),window.scrollTo(0,r)}catch(r){alert("Failed to accept invitation"),console.error(r)}})})}catch{n.textContent="Failed to load invitations."}}o()}function Pt(e,t){e==="/invitations"?h("invitations/list.html",t).then(()=>At()).catch(S(t,"invitations")):X(t)}function y(e,t,n){return`
    <section id="${e}" class="kb-section">
      <h1>${t}</h1>
      ${n}
    </section>
  `}function jt(){const e=document.getElementById("kb-content");e.innerHTML=[y("overview","The Promise Stack Overview",`
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
      `),y("section1","Promise 0 (Universal Standards)",`
        <p>Before detailing specific product features, establish the baseline. Promise 0 represents the universal Definition of Done that every single feature inherits automatically.</p>
        <ul>
          <li><strong>Security:</strong> Documentation on authentication standards, data encryption, and audit logging.</li>
          <li><strong>Accessibility:</strong> Guidelines for WCAG 2.1 AA compliance, screen reader support, and keyboard navigation.</li>
          <li><strong>Performance:</strong> Baselines such as page load times under 2 seconds and API responses under 500ms.</li>
          <li><strong>Compliance &amp; DevOps:</strong> Details on GDPR, testing standards, and CI/CD pipelines.</li>
        </ul>
      `),y("section2","Product Promises (WHY)",`
        <p>This section acts as the strategic north star. Everything built must trace back to one of the pages in this category.</p>
        <ul>
          <li><strong>Core Value Propositions:</strong> Detail the 3-5 fundamental reasons why someone would choose your product.</li>
          <li><strong>The Promise Pattern:</strong> Ensure each promise is formatted as <code>As a [Persona], [Value Verb] [Outcome]</code>.</li>
          <li><strong>Explicit vs. Implicit Promises:</strong> Document the commitments you are intentionally making, as well as the implicit expectations users have formed from the product&rsquo;s behavior.</li>
        </ul>
      `),y("section3","Epics (WHAT)",`
        <p>Create a sub-section for each Epic under its parent Promise.</p>
        <ul>
          <li><strong>Major Capabilities:</strong> Document the 3-5 essential capabilities required to fulfill the parent Promise.</li>
          <li><strong>The Epic Test:</strong> Include a section verifying that if this Epic were removed, the parent Promise would fail.</li>
        </ul>
      `),y("section4","Journeys (WHEN)",`
        <p>Journeys define the circumstances under which the Epics are valuable.</p>
        <ul>
          <li><strong>Circumstance Mapping:</strong> Document the specific situations or arcs for the persona (e.g., &ldquo;First-time rider&rdquo; vs. &ldquo;Daily commuter&rdquo;).</li>
          <li><strong>Constraint Check:</strong> Ensure there are no more than 3-5 Journeys per Epic to prevent scope creep.</li>
        </ul>
      `),y("section5","Flows (HOW)",`
        <p>Flows are the step-by-step processes that make up a Journey.</p>
        <ul>
          <li><strong>Session Sequences:</strong> Document the distinct processes that a user can complete in a single sitting.</li>
          <li><strong>Start and End Points:</strong> Clearly define the beginning and end of the 3-5 Flows that make up each Journey.</li>
        </ul>
      `),y("section6","Moments (WHO)",`
        <p>This is the most granular level of your knowledge base, directly translating to your engineering tickets, because this is the only level where code gets written.</p>
        <ul>
          <li><strong>Story Moments:</strong> Document the interactions where a single persona acts and receives user-visible value.</li>
          <li><strong>Job Moments:</strong> Document the behind-the-scenes coordination points between multiple personas or systems.</li>
          <li><strong>The Count Test:</strong> Explicitly count the personas involved to ensure accurate classification between Stories and Jobs.</li>
        </ul>
      `),y("section7","Promise Discovery (The Sandbox)",`
        <p>Maintain a separate workspace for ideas that are not yet commitments.</p>
        <ul>
          <li><strong>Validation of Concept (VOC):</strong> Track signals, mockups, and early research to answer &ldquo;Is there something here worth building?&rdquo;.</li>
          <li><strong>Testable Value Promise (TVP):</strong> Document specific claims about user value that are ready for testing.</li>
          <li><strong>Core Value Promise (CVP):</strong> Record the evidence gathered that justifies promoting an idea into a fully committed Product Promise.</li>
        </ul>
      `)].join(`
`),Rt(),Bt()}function Rt(){const e=document.querySelectorAll(".kb-nav-link");e.forEach(t=>{t.addEventListener("click",n=>{const o=t.getAttribute("href");if(!o||!o.startsWith("#"))return;n.preventDefault();const a=document.getElementById(o.slice(1));a&&(a.scrollIntoView({behavior:"smooth",block:"start"}),e.forEach(s=>s.removeAttribute("aria-current")),t.setAttribute("aria-current","true"))})})}function Bt(){const e=document.querySelectorAll(".kb-nav-link"),t=document.querySelectorAll(".kb-section[id]");if(!t.length)return;let n=!1;const o=()=>{n||(window.requestAnimationFrame(()=>{const a=window.scrollY+100;let s=null;t.forEach(i=>{const r=i.offsetTop;a>=r&&(s=i.id)}),e.forEach(i=>{const r=i.getAttribute("href")===`#${s}`;i.setAttribute("aria-current",r?"true":"false")}),n=!1}),n=!0)};window.addEventListener("scroll",o,{passive:!0}),o()}function Nt(e,t,n){h("knowledge-base.html",n).then(()=>jt()).catch(S(n,"knowledge base"))}function Ht(){const e=document.getElementById("delete-account-form"),t=document.getElementById("delete-account-btn"),n=document.getElementById("delete-btn-text"),o=document.getElementById("delete-spinner"),a=document.getElementById("delete-error"),s=document.getElementById("delete-success"),i=document.getElementById("delete-password"),r=document.getElementById("export-data-btn"),u=document.getElementById("export-btn-text"),d=document.getElementById("export-spinner"),p=document.getElementById("export-error");document.getElementById("export-link-top").addEventListener("click",c=>{c.preventDefault(),r.scrollIntoView({behavior:"smooth"}),r.focus()}),r.addEventListener("click",async()=>{p.classList.add("d-none"),v(!0);try{const c=await fetch("/api/users/me/export",{credentials:"include"});if(!c.ok){const Z=await c.json().catch(()=>({}));m(Z.message||"Failed to export data.");return}const j=await c.blob(),I=URL.createObjectURL(j),b=document.createElement("a");b.href=I,b.download="pmo-data-export.json",document.body.appendChild(b),b.click(),b.remove(),URL.revokeObjectURL(I)}catch{m("Network error. Please try again.")}finally{v(!1)}});function m(c){p.textContent=c,p.classList.remove("d-none")}function v(c){r.disabled=c,u.classList.toggle("d-none",c),d.classList.toggle("d-none",!c)}e.addEventListener("submit",async c=>{c.preventDefault(),a.classList.add("d-none"),s.classList.add("d-none");const j=i.value.trim();if(!j){w("Please enter your password.");return}N(!0);try{const I=await fetch("/api/users/me",{method:"DELETE",credentials:"include"});if(I.status!==204&&I.status!==404){w("Failed to delete account data. Please try again."),N(!1);return}const b=await fetch("/account/me",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:j}),credentials:"include"});b.status===204?(s.textContent="Your account and all associated data have been permanently deleted. You will be redirected shortly.",s.classList.remove("d-none"),e.style.display="none",setTimeout(()=>{window.location.href="/"},3e3)):b.status===401?w("Incorrect password. Please try again."):w("Something went wrong. Please try again.")}catch{w("Network error. Please check your connection and try again.")}finally{N(!1)}});function w(c){a.textContent=c,a.classList.remove("d-none")}function N(c){t.disabled=c,n.classList.toggle("d-none",c),o.classList.toggle("d-none",!c)}}let _;function Y(){return _||(_=nt(()=>import("./router.js").then(e=>e.r),[]))}"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.mjs",{scope:"/"}).catch(()=>{});document.addEventListener("DOMContentLoaded",async()=>{var n;const e=document.getElementById("content"),t=document.getElementById("main-menu");await rt(),wt(t,e),document.addEventListener("click",o=>{const a=o.target.closest("a[data-nav]");if(a){const i=a.getAttribute("href");if(i&&i!=="#"){o.preventDefault(),L(i,t,e);return}}o.target.closest('[data-action="back"]')&&(o.preventDefault(),window.history.back())}),(n=document.getElementById("home-link"))==null||n.addEventListener("click",o=>{o.preventDefault(),L("/",t,e)}),window.addEventListener("popstate",()=>{q(t,e)}),q(t,e)});function L(e,t,n){return window.history.pushState({},"",e),q(t,n)}const Mt={"/":"Home","/projects":"Projects","/notifications":"Notifications","/invitations":"Invitations","/knowledge-base":"Knowledge Base","/moments/my-tasks":"My Tasks"};function $(){const e=document.getElementById("main-content");e&&requestAnimationFrame(()=>e.focus())}function k(e){const t=document.getElementById("page-title");if(!t)return;let n=Mt[e];if(!n){const o=e.split("/").filter(Boolean);n=o.length?o[o.length-1]:"Home",n=n.charAt(0).toUpperCase()+n.slice(1).replace(/-/g," ")}t.textContent=`${n} - Promise Model Online`}function h(e,t){return fetch(`/templates/${e}`).then(n=>{if(!n.ok)throw new Error("Network response was not ok");return n.text()}).then(n=>{t.innerHTML=n,k(window.location.pathname),$()})}function X(e){h("404.html",e)}function S(e,t){return()=>fetch("/templates/error.html").then(n=>n.text()).then(n=>{e.innerHTML=n,k(window.location.pathname);const o=document.getElementById("error-title"),a=document.getElementById("error-message");o&&(o.textContent="Something went wrong"),a&&(a.textContent=`Failed to load ${t}. Please try again.`),$()}).catch(()=>{e.innerHTML="<h1>Something went wrong</h1><p>Please try again.</p>",k(window.location.pathname),$()})}function q(e,t){const n=window.location.pathname;if(n==="/login"||n==="/logout"||n==="/register"){window.location.href=n;return}switch(yt(e),!0){case n==="/":h("home.html",t).then(()=>it());break;case n.startsWith("/projects"):Y().then(({handleLegacyProjectRoutes:o})=>{o(n,e,t)}).catch(S(t,"projects"));break;case n==="/moments/my-tasks":h("moments/my-tasks.html",t).then(()=>$t(e,t)).catch(S(t,"my tasks"));break;case n.startsWith("/notifications"):St(n,e,t);break;case n.startsWith("/invitations"):Pt(n,t);break;case n==="/change-password":if(!R()){L("/login",e,t);break}window.location.href="/account/change-password";break;case n==="/knowledge-base":Nt(n,e,t);break;case n==="/privacy":h("privacy.html",t);break;case n==="/tos":h("tos.html",t);break;case n==="/account/delete":h("account/delete.html",t).then(()=>Ht());break;default:{const o=n.split("/").filter(Boolean);if(o.length>=2){const a=o[0],s=o[1],i="/"+o.slice(2).join("/")+(n.includes("?")?n.slice(n.indexOf("?")):"");a==="account"||a==="moments"||a==="knowledge-base"?h("404.html",t).catch(()=>{t.innerHTML="<h1>Page not found</h1>",k(n),$()}):Y().then(({handleProjectScopedRoutes:r})=>{r(a,s,i,e,t)}).catch(()=>{t.innerHTML="<h1>Something went wrong</h1><p>Failed to load project. Please try again.</p>",k(n),$()})}else h("404.html",t).catch(()=>{t.innerHTML="<h1>Page not found</h1>",k(n),$()})}}}export{nt as _,F as a,P as b,g as c,G as d,l as e,Ft as f,zt as g,B as h,_t as i,Yt as j,Et as k,Jt as l,h as m,L as n,S as o,Ut as p,Ot as q,Qt as r,qt as s,Wt as t,Vt as u,Dt as v,Gt as w,Kt as x,X as y};
