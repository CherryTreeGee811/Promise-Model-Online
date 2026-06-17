const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/list.js","js/main.js","js/iteration-create-modal.js"])))=>i.map(i=>d[i]);
import{S as e,_ as t,a as n,b as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,loadTemplate as d,loadTemplateWithError as f,m as p,n as m,navigate as h,o as g,p as _,r as v,s as y,showNotFound as b,t as x,u as S,x as C,y as w}from"./main.js";import{$ as T,A as E,B as ee,C as D,D as O,E as k,F as A,G as j,H as M,I as te,J as ne,K as re,L as ie,M as ae,N as oe,O as se,P as ce,Q as le,R as ue,S as de,T as fe,U as pe,V as me,W as he,X as ge,Y as _e,Z as ve,_ as ye,a as N,at as be,b as xe,c as P,ct as Se,d as Ce,dt as we,f as Te,ft as Ee,g as F,h as De,ht as Oe,i as ke,it as Ae,j as je,k as Me,l as Ne,lt as Pe,m as Fe,mt as Ie,n as Le,nt as Re,o as I,ot as ze,p as Be,pt as Ve,q as He,rt as Ue,s as We,st as Ge,t as Ke,u as qe,ut as Je,v as Ye,w as Xe,x as Ze,y as Qe,z as $e}from"./iteration-create-modal.js";function et(e,t){let n=document.getElementById(`project-list-table-body`),r=document.getElementById(`error-text`),i=document.getElementById(`success-text`),a=document.getElementById(`add-project-link`);!n||!r||!i||(a&&a.addEventListener(`click`,n=>{n.preventDefault(),h(`/projects/add`,e,t)}),r.textContent=``,i.textContent=``,n.innerHTML=``,be().then(r=>{if(!r||r.length===0){n.innerHTML=v({icon:`bi-folder`,title:`There are no projects yet`,description:`Click "Add Project" to create your first project.`,colspan:2,button:{text:`Create your first project`,icon:`bi-plus-circle`,id:`empty-state-add-project-btn`}});let r=document.getElementById(`empty-state-add-project-btn`);r&&r.addEventListener(`click`,n=>{n.preventDefault(),h(`/projects/add`,e,t)});return}r.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
                <td>${e.name??``}</td>
                <td class="d-flex flex-wrap gap-2">
                    <a href="/${e.ownerSlug}/${e.slug}/strides" class="btn btn-sm btn-outline-primary view-iterations-btn" data-owner-slug="${e.ownerSlug}" data-project-slug="${e.slug}">View Backlog</a>
                    <a href="/${e.ownerSlug}/${e.slug}/graph" class="btn btn-sm btn-outline-secondary graph-btn" data-owner-slug="${e.ownerSlug}" data-project-slug="${e.slug}" title="Open graph view" aria-label="Open graph view">
                        <i class="bi bi-diagram-3" aria-hidden="true"></i>
                    </a>
                    <a href="/${e.ownerSlug}/${e.slug}/settings" class="btn btn-sm btn-outline-secondary settings-btn" data-owner-slug="${e.ownerSlug}" data-project-slug="${e.slug}" title="Open project settings" aria-label="Open project settings">
                        <i class="bi bi-gear" aria-hidden="true"></i>
                    </a>
                    <a href="/${e.ownerSlug}/${e.slug}/share" class="btn btn-sm btn-outline-secondary share-btn" data-owner-slug="${e.ownerSlug}" data-project-slug="${e.slug}" title="Manage sharing permissions" aria-label="Manage sharing permissions">
                        <i class="bi bi-share" aria-hidden="true"></i>
                    </a>
                    <a href="/${e.ownerSlug}/${e.slug}/history" class="btn btn-sm btn-outline-secondary audit-log-btn" data-owner-slug="${e.ownerSlug}" data-project-slug="${e.slug}" title="View project activity" aria-label="View project activity">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </a>
                </td>
            `,n.appendChild(t)}),n.querySelectorAll(`.view-iterations-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),h(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/strides`,e,t)})}),n.querySelectorAll(`.graph-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),h(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/graph`,e,t)})}),n.querySelectorAll(`.settings-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),h(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/settings`,e,t)})}),n.querySelectorAll(`.share-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),h(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/share`,e,t)})}),n.querySelectorAll(`.audit-log-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),h(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/history`,e,t)})})}).catch(e=>{e.message.includes(`404`)?r.textContent=`Endpoint not found`:e.message.includes(`500`)?r.textContent=`Internal server error`:r.textContent=`Unknown error`}))}function tt(e,t){e&&(e.innerHTML=`
        <div class="table-responsive summary-table-wrap">
            <table class="table table-sm table-striped table-hover align-middle mb-0 detail-table summary-table">
            <tbody class="table-group-divider">
                ${t.map(e=>`
                    ${e.isGap?`<tr class="summary-gap"><td colspan="2" class="border-0 py-2"></td></tr>`:`<tr>
                            <th scope="row" class="summary-key text-muted fw-semibold">${l(e.label)}</th>
                            <td class="summary-value">${l(e.value)}</td>
                        </tr>`}
                `).join(``)}
            </tbody>
            </table>
        </div>
    `)}function nt(e,t){let n=document.getElementById(`add-project-form`),r=document.getElementById(`cancel-add-project-link`),i=document.getElementById(`project-name-input`),a=document.getElementById(`project-description-input`),o=document.getElementById(`first-promise-panel`),s=document.getElementById(`first-promise-input`),c=document.getElementById(`create-project-btn`),l=document.getElementById(`create-project-btn-spinner`),u=document.getElementById(`create-project-btn-label`),d=document.getElementById(`import-project-btn`),f=document.getElementById(`import-project-btn-spinner`),p=document.getElementById(`import-project-btn-icon`),m=document.getElementById(`import-project-btn-label`),g=document.getElementById(`clear-import-btn`),_=document.getElementById(`import-project-input`),v=document.getElementById(`project-import-summary-panel`),y=document.getElementById(`error-text`),b=document.getElementById(`success-text`);if(!n||!i||!a||!o||!s||!c||!l||!u||!d||!f||!p||!m||!g||!_||!v||!y||!b)return;let x=`scratch`,S=!1;function C(){y.textContent=``,y.style.display=`none`,b.textContent=``,b.style.display=`none`}function w(){return x===`import`?`Import Project`:`Create Project`}function T(){return x===`import`?`Importing Project...`:`Creating Project...`}function E(e){c.disabled=e,l.classList.toggle(`d-none`,!e),u.textContent=e?T():w()}function D(e,t=`Reading Project...`){d.disabled=e,f.classList.toggle(`d-none`,!e),p.classList.toggle(`d-none`,e),m.textContent=e?t:`Import Project...`}function O(e,t=`submit`){S=e,E(e&&t===`submit`),D(e&&t===`import`,t===`submit`?`Importing Project...`:`Reading Project...`),c.disabled=e,g.disabled=e,d.disabled=e,i.disabled=e,a.disabled=e,s.disabled=e,e||k(x)}function k(e){x=e;let t=e===`import`,n=!!_.files?.[0];o.hidden=t,i.readOnly=t,a.readOnly=t,u.textContent=S?T():w(),g.hidden=!t||!n,g.style.display=g.hidden?`none`:``}function A(){_.value=``,v.innerHTML=``,i.value=``,a.value=``,m.textContent=`Import Project...`,p.classList.remove(`d-none`),f.classList.add(`d-none`),d.disabled=!1,k(`scratch`),M()}let j=document.querySelector(`h1`);function M(){let e=i.value.trim(),t=x===`import`?`Import`:`Create`;e?j.textContent=`${t} '${e}'`:j.textContent=`${t} Project`}i.addEventListener(`input`,M);function te(e){let t=e.project,n=Array.isArray(t.productPromises)?t.productPromises:[],r=n.flatMap(e=>Array.isArray(e.epics)?e.epics:[]),i=r.flatMap(e=>Array.isArray(e.journeys)?e.journeys:[]),a=i.flatMap(e=>Array.isArray(e.flows)?e.flows:[]),o=a.flatMap(e=>Array.isArray(e.moments)?e.moments:[]),s=Array.isArray(t.iterations)?t.iterations:[],c=s.flatMap(e=>Array.isArray(e.strides)?e.strides:[]);return{promises:n.length,epics:r.length,journeys:i.length,flows:a.length,moments:o.length,iterations:s.length,strides:c.length,promiseStackTotal:n.length+r.length+i.length+a.length+o.length}}function ne(e,t){let n=e.project,r=te(e);tt(v,[{label:`Schema Version`,value:e.schemaVersion??`Unknown`},{label:`Exported At`,value:e.exportedAt?new Date(e.exportedAt).toLocaleString():`Unknown`},{label:`Project Name`,value:n.name??``},{label:`Project Description`,value:n.description??``},{label:`Promises`,value:r.promises},{label:`Epics`,value:r.epics},{label:`Journeys`,value:r.journeys},{label:`Flows`,value:r.flows},{label:`Moments`,value:r.moments},{label:`Promise Stack Total`,value:r.promiseStackTotal},{isGap:!0},{label:`Iterations`,value:r.iterations},{label:`Strides`,value:r.strides}])}async function re(e){let t;try{t=JSON.parse(await e.text())}catch{throw Error(`The selected file is not valid JSON.`)}if(!t||typeof t!=`object`||!t.project)throw Error(`The selected file does not look like a project export.`);return t}async function ie(){C();let n=i.value.trim(),r=a.value.trim(),o=s.value.trim();if(!n){y.textContent=`Project name is required.`,y.style.display=`block`;return}if(!o){y.textContent=`The first Product Promise is required when creating from scratch.`,y.style.display=`block`;return}try{O(!0,`submit`);let i=await Re({name:n,description:r||null});await ee(i.ownerSlug,i.slug,{statement:o,description:null,displayOrder:0}),h(`/${i.ownerSlug}/${i.slug}/graph`,e,t)}catch(e){y.textContent=e.message||`Failed to create project.`,y.style.display=`block`}finally{O(!1,`submit`)}}async function ae(){C();let n=_.files?.[0];if(!n){y.textContent=`Choose a project export to import.`,y.style.display=`block`;return}try{O(!0,`submit`);let r=await we(n),{ownerSlug:i,slug:a}=r??{},o=Array.isArray(r?.warnings)?r.warnings:Array.isArray(r?.Warnings)?r.Warnings:[];b.textContent=o.length>0?`Project imported with ${o.length} warning(s).`:`Project imported successfully.`,b.style.display=`block`,h(i&&a?`/${i}/${a}/graph`:`/projects`,e,t)}catch(e){y.textContent=e.message||`Failed to import project.`,y.style.display=`block`}finally{O(!1,`submit`)}}n.addEventListener(`submit`,async e=>{if(e.preventDefault(),x===`import`){await ae();return}await ie()}),d.addEventListener(`click`,()=>{_.click()}),_.addEventListener(`change`,async()=>{C();let e=_.files?.[0];if(!e){A();return}try{O(!0,`import`);let t=await re(e);i.value=t.project.name??``,a.value=t.project.description??``,k(`import`),M(),ne(t,e)}catch(e){A(),y.textContent=e.message||`Failed to read imported project.`,y.style.display=`block`}finally{O(!1,`import`)}}),g.addEventListener(`click`,()=>{C(),A(),i.focus()}),r&&r.addEventListener(`click`,n=>{n.preventDefault(),h(`/projects`,e,t)}),k(`scratch`),M()}function rt(){let e=window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);return e?{owner:e[1],project:e[2]}:{owner:null,project:null}}function L(e,t,n){let r=String(e??``).trim(),i=String(t??``).trim(),a=String(n??``).trim();return!r||!i||!a?null:`/${r}/${i}/graph?focus=${encodeURIComponent(a)}`}function it(e,t){if(!e||!t)return;let n=e.querySelector(`#graph-view-link`);if(!n){n=document.createElement(`a`),n.id=`graph-view-link`,n.className=`btn btn-outline-secondary btn-sm align-items-center gap-2`,n.innerHTML=`<i class="bi bi-diagram-3" aria-hidden="true"></i><span> Graph View</span>`;let t=e.querySelector(`#back-link`);t?.parentElement?(t.insertAdjacentElement(`beforebegin`,n),t.insertAdjacentText(`beforebegin`,` `)):e.appendChild(n)}n.href=t}function at(e,t){let n=document.getElementById(e);if(n)return n;let r=document.createElement(`div`);return r.innerHTML=t.trim(),n=r.firstElementChild,n&&document.body.appendChild(n),n}function ot(e){return new Date(e).toISOString().slice(0,10)}function st(e,t){let n=new Date(e);return n.setDate(n.getDate()+t),n}function ct(e=[]){let t=new Date,n=Array.isArray(e)&&e.length>0?e.map(e=>new Date(e?.endDate)).filter(e=>Number.isFinite(e.getTime())).sort((e,t)=>t.getTime()-e.getTime())[0]:null,r=n?st(n,1):t,i=st(r,13);return{startDate:ot(r),endDate:ot(i),durationDays:14}}function lt({owner:e,project:t,iterationId:n,iterations:r=[],existingStrides:i=[],onCreated:a}){let o=at(`stride-create-modal`,`
        <div class="modal fade" id="stride-create-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <form id="stride-create-form">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Stride</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label" for="stride-create-name">Name</label>
                                    <input id="stride-create-name" class="form-control" type="text" maxlength="200" required placeholder="Stride 1">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-iteration">Iteration</label>
                                    <select id="stride-create-iteration" class="form-select"></select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-duration">Duration Days</label>
                                    <input id="stride-create-duration" class="form-control" type="number" min="1" step="1" value="14">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-start">Start Date</label>
                                    <input id="stride-create-start" class="form-control" type="date" required>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-end">End Date</label>
                                    <input id="stride-create-end" class="form-control" type="date" required>
                                </div>
                            </div>
                            <div id="stride-create-error" class="text-danger small mt-3 d-none"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="stride-create-submit">Create Stride</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `),s=o?.querySelector(`#stride-create-form`),c=o?.querySelector(`#stride-create-name`),u=o?.querySelector(`#stride-create-iteration`),d=o?.querySelector(`#stride-create-duration`),f=o?.querySelector(`#stride-create-start`),p=o?.querySelector(`#stride-create-end`),m=o?.querySelector(`#stride-create-error`),h=o?.querySelector(`#stride-create-submit`);if(!s||!c||!u||!d||!f||!p||!m||!h)return;s.replaceWith(s.cloneNode(!0));let g=o.querySelector(`#stride-create-form`),_=o.querySelector(`#stride-create-name`),v=o.querySelector(`#stride-create-iteration`),y=o.querySelector(`#stride-create-duration`),b=o.querySelector(`#stride-create-start`),x=o.querySelector(`#stride-create-end`),S=o.querySelector(`#stride-create-error`),C=o.querySelector(`#stride-create-submit`);v.innerHTML=(Array.isArray(r)?r:[]).map(e=>`
        <option value="${e.id}" ${String(e.id)===String(n)?`selected`:``}>
            ${l(e.name)}
        </option>
    `).join(``);let w=ct(i);_.value=``,y.value=String(w.durationDays),b.value=w.startDate,x.value=w.endDate,S.textContent=``,S.classList.add(`d-none`),C.disabled=!1,C.textContent=`Create Stride`,y.addEventListener(`input`,()=>{let e=Math.max(1,Number.parseInt(y.value,10)||1),t=new Date(b.value);if(!Number.isFinite(t.getTime()))return;let n=new Date(t);n.setDate(n.getDate()+e-1),x.value=n.toISOString().slice(0,10)}),b.addEventListener(`change`,()=>{let e=Math.max(1,Number.parseInt(y.value,10)||1),t=new Date(b.value);if(!Number.isFinite(t.getTime()))return;let n=new Date(t);n.setDate(n.getDate()+e-1),x.value=n.toISOString().slice(0,10)}),g.addEventListener(`submit`,async n=>{n.preventDefault();let r=_.value.trim(),i=Number.parseInt(v.value,10),s=Math.max(1,Number.parseInt(y.value,10)||1),c=b.value,l=x.value;if(!r){S.textContent=`Stride name is required.`,S.classList.remove(`d-none`),_.focus();return}if(!i){S.textContent=`Select an iteration for this stride.`,S.classList.remove(`d-none`),v.focus();return}C.disabled=!0,C.textContent=`Creating...`;try{await j(e,t,{name:r,iterationId:i,startDate:c,endDate:l,durationDays:s,isActive:!0}),window.bootstrap?.Modal?.getOrCreateInstance(o)?.hide(),await a?.()}catch(e){S.textContent=e?.message||`Failed to create stride.`,S.classList.remove(`d-none`)}finally{C.disabled=!1,C.textContent=`Create Stride`}}),window.bootstrap?.Modal?.getOrCreateInstance(o)?.show()}var ut={XS:1,S:2,M:3,L:5,XL:8,XXL:13,XXXL:21},dt=[],R=[],z=[],ft=!1,pt=null,mt=null,ht=!1;function gt(e){document.querySelectorAll(`.status-dropdown, .estimate-dropdown, .owner-dropdown, .moment-type-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn`).forEach(t=>t.disabled=!e),document.querySelectorAll(`.progress-stride-btn`).forEach(t=>{e?t.classList.remove(`hidden`):t.classList.add(`hidden`)})}function _t(e){let t=window.scrollY,n=e();return window.scrollTo(0,t),n}function vt(e){let t=new Date(e?.startDate);return Number.isFinite(t?.getTime?.())?t.getTime():0}function yt(e){let t=Array.isArray(R)?[...R]:[];t.sort((e,t)=>vt(e)-vt(t));let n=t.findIndex(t=>String(t?.id)===String(e));return n<0?null:t[n+1]?.id??null}function bt(e){return(e?.querySelector?.(`.status-dropdown`)?.value??e?.querySelector?.(`.status-badge`)?.textContent??``).trim()===`Done`}function xt(e){let t=e?.querySelector?.(`.stride-moments .no-items`);t&&t.remove()}function St(e){if(!e)return;let t=e.querySelector(`.stride-moments`);t&&(e.querySelectorAll(`table.promisemodel-table tbody tr[data-moment-id]`).length>0||(t.innerHTML=m({icon:`bi-clock`,title:`No moments assigned.`,description:`Move moments from the backlog into this stride.`})))}function B(e){let t=e?.querySelector?.(`.stride-total-effort`);if(!t)return;let n=0;e.querySelectorAll(`table.promisemodel-table tbody tr[data-moment-id]`).forEach(e=>{let t=e.querySelector(`.estimate-dropdown`)?.value;n+=ut[t]??0}),t.textContent=`Total Effort: ${n}`}function Ct(e){let t=document.querySelector(`.stride-card[data-stride-id="${e}"]`);if(!t)return{moved:0,targetVisible:!1};let n=yt(e),r=n?document.querySelector(`.stride-card[data-stride-id="${n}"]`):null,i=Array.from(t.querySelectorAll(`tr[data-moment-id]`)).filter(e=>!bt(e));if(i.length===0)return B(t),St(t),{moved:0,targetVisible:!!r};if(!r)return i.forEach(e=>e.remove()),B(t),St(t),{moved:i.length,targetVisible:!1};xt(r);let a=Yt(n);return a?(i.forEach(e=>a.appendChild(e)),B(t),B(r),St(t),{moved:i.length,targetVisible:!0}):(i.forEach(e=>e.remove()),B(t),St(t),{moved:i.length,targetVisible:!1})}function wt(e,t){return`<select class="estimate-dropdown" data-moment-id="${e}" data-current-estimate="${t??``}" aria-label="Effort estimate"></select>`}function Tt(e,t){return`<select class="owner-dropdown" data-moment-id="${e}" data-owner-id="${t??``}" aria-label="Owner"></select>`}function Et(e,t){return`<select class="moment-type-dropdown form-select form-select-sm" data-moment-id="${e}" data-current-type="${t}" aria-label="Moment type">
        <option value="Story" ${t===`Story`?`selected`:``}>Story</option>
        <option value="Job" ${t===`Job`?`selected`:``}>Job</option>
    </select>`}function Dt(e,t){return`<select class="status-dropdown" data-moment-id="${e}" data-current-status="${t??``}" aria-label="Status"></select>`}function Ot(e,t){let n=e?.querySelector(`.status-badge`);if(!n)return;let r=t??``;n.textContent=r,Array.from(n.classList).filter(e=>e.startsWith(`status-`)&&e!==`status-badge`).forEach(e=>n.classList.remove(e)),n.classList.add(`status-${String(r).toLowerCase()}`)}function kt(e){return e?.querySelector(`.stride-moments, .backlog-content`)??null}function At(e){let t=e?`bi-chevron-down`:`bi-chevron-up`,n=e?`Expand board`:`Collapse board`;return`
        <button class="stride-toggle-btn" type="button" aria-label="${n}" title="${n}" aria-pressed="${String(!e)}">
            <i class="bi ${t}" aria-hidden="true"></i>
        </button>
    `}function jt(e,t,n=``){return`
        <div class="stride-header">
            <div class="stride-header-main">
                ${At(t)}
                <h3>${l(e)}</h3>
            </div>
            ${n?`<div class="stride-header-actions ms-auto">${n}</div>`:``}
        </div>
    `}function Mt(e,t){if(!e)return;e.classList.toggle(`is-collapsed`,t);let n=kt(e);n&&n.classList.toggle(`hidden`,t);let r=e.querySelector(`.stride-toggle-btn`),i=r?.querySelector(`.bi`);if(r&&i){let e=t?`bi-chevron-down`:`bi-chevron-up`,n=t?`Expand board`:`Collapse board`;i.className=`bi ${e}`,r.setAttribute(`aria-label`,n),r.setAttribute(`title`,n),r.setAttribute(`aria-pressed`,String(!t))}}function Nt(e){!e||e.dataset.boundCollapseToggles===`1`||(e.dataset.boundCollapseToggles=`1`,e.addEventListener(`click`,e=>{let t=e.target.closest(`.stride-toggle-btn`);if(!t)return;let n=t.closest(`[data-collapsible-board]`);n&&Mt(n,!n.classList.contains(`is-collapsed`))}))}function Pt(){let e=document.querySelector(`.header`)?.offsetHeight??0;document.querySelectorAll(`[data-collapsible-board]`).forEach(t=>{t.style.setProperty(`--stride-sticky-top`,`${e}px`);let n=t.querySelector(`.stride-header`)?.offsetHeight??0;t.style.setProperty(`--stride-header-height`,`${n}px`)})}function Ft(){ht||(ht=!0,window.addEventListener(`resize`,Pt))}function It(e){let t=document.getElementById(`stride-scrollspy-nav`);if(!t)return;if(!Array.isArray(e)||e.length<=1){t.innerHTML=``,t.classList.add(`d-none`);return}t.classList.remove(`d-none`),t.innerHTML=`
        <div class="position-sticky top-0 bg-body border rounded p-2 shadow-sm">
            <div class="small text-uppercase text-secondary mb-2">Current Strides</div>
            <nav id="stride-scrollspy-links" class="nav nav-pills flex-wrap gap-2"></nav>
        </div>
    `;let n=t.querySelector(`#stride-scrollspy-links`);e.forEach((e,t)=>{let r=document.createElement(`a`);r.className=`nav-link py-1 px-2`,r.href=`#stride-card-${e.id}`,r.textContent=e.name,n.appendChild(r)});let r=document.createElement(`a`);r.className=`nav-link py-1 px-2`,r.href=`#backlog-section`,r.textContent=`Backlog`,n.appendChild(r);let i=window.bootstrap?.ScrollSpy;i&&i.getOrCreateInstance(document.body,{target:`#stride-scrollspy-links`,offset:140})?.refresh?.(),t.dataset.boundScrollspyClick!==`1`&&(t.dataset.boundScrollspyClick=`1`,t.addEventListener(`click`,e=>{let t=e.target.closest(`a.nav-link`);if(!t)return;let n=t.getAttribute(`href`)||``;if(!n.startsWith(`#`))return;let r=document.querySelector(n);r&&(e.preventDefault(),r.scrollIntoView({behavior:`smooth`,block:`start`}),window.history.replaceState({},``,n))}))}function Lt(e){let t=L(pt,mt,`moment-${e}`);return t?`
        <a href="${t}" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-label="Open graph view focused on moment ${e}">
            <i class="bi bi-diagram-3" aria-hidden="true"></i>
            <span>Graph View</span>
        </a>
    `:``}function Rt(e,t,n,r){let i=document.getElementById(e);return i||(i=document.createElement(`div`),i.className=`modal fade`,i.id=e,i.tabIndex=-1,i.setAttribute(`aria-hidden`,`true`),i.innerHTML=`
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${t}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-0" id="${e}-text"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn ${r}" id="${e}-confirm">${n}</button>
                </div>
            </div>
        </div>
    `,document.body.appendChild(i),i)}function zt(){return Rt(`move-to-backlog-modal`,`Move to Backlog?`,`Move to Backlog`,`btn-danger`)}function Bt(e,t){let n=zt(),r=n.querySelector(`#move-to-backlog-modal-text`),i=n.querySelector(`#move-to-backlog-modal-confirm`);if(!r||!i)return;r.textContent=`Move ${Gt(e)} to the Backlog?`;let a=i.cloneNode(!0);i.parentElement.replaceChild(a,i),a.addEventListener(`click`,async()=>{a.disabled=!0;try{await t(),window.bootstrap?.Modal?.getOrCreateInstance(n)?.hide()}catch(e){console.error(e),alert(`Failed to move moment`)}finally{a.disabled=!1}},{once:!0}),window.bootstrap?.Modal?.getOrCreateInstance(n)?.show()}function Vt(){return Rt(`move-to-stride-modal`,`Move to Stride?`,`Move`,`btn-primary`)}function Ht(){return Rt(`progress-stride-modal`,`Progress Stride?`,`Progress`,`btn-success`)}function Ut(e){let t=Ht(),n=t.querySelector(`#progress-stride-modal-text`),r=t.querySelector(`#progress-stride-modal-confirm`);if(!n||!r)return Promise.resolve(window.confirm(`Move all unfinished moments to the next stride?`));let i=document.querySelector(`.stride-card[data-stride-id="${e}"]`)?.querySelector(`.stride-header h3`)?.textContent?.trim();return n.textContent=i?`Move all unfinished moments in ${i} to the next stride?`:`Move all unfinished moments to the next stride?`,new Promise(e=>{let n=!1,i=t=>{n||(n=!0,e(t))},a=window.bootstrap?.Modal?.getOrCreateInstance(t);r.addEventListener(`click`,()=>{i(!0),a?.hide()},{once:!0}),t.addEventListener(`hidden.bs.modal`,()=>i(!1),{once:!0}),a?.show()})}function Wt(e,t,n){let r=Vt(),i=r.querySelector(`#move-to-stride-modal-text`),a=r.querySelector(`#move-to-stride-modal-confirm`);if(!i||!a)return;i.textContent=`Move ${Gt(e)} to the selected stride?`;let o=a.cloneNode(!0);a.parentElement.replaceChild(o,a),o.addEventListener(`click`,async()=>{o.disabled=!0;try{await n(),window.bootstrap?.Modal?.getOrCreateInstance(r)?.hide()}catch(e){console.error(e),alert(`Failed to move moment`)}finally{o.disabled=!1}},{once:!0}),window.bootstrap?.Modal?.getOrCreateInstance(r)?.show()}function Gt(e){let t=Kt(e)?.querySelector(`td`),n=String(t?.textContent??``).trim();return n?n.slice(0,35):`moment ${e}`}function Kt(e){return document.querySelector(`tr[data-moment-id="${e}"]`)}function qt(){let e=document.getElementById(`backlog-section`);return e?e.querySelector(`.backlog-content table.promisemodel-table tbody`)||(e.innerHTML=`
        <div class="stride-card backlog-board is-collapsed" data-collapsible-board="1">
            ${jt(`Backlog`,!0)}
            <div class="stride-moments backlog-content hidden">
                <table class="promisemodel-table">
                    <thead>
                        <tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `,e.querySelector(`.backlog-content table.promisemodel-table tbody`)):null}function Jt(e){let t=document.createElement(`tr`);return t.dataset.momentId=e.sequenceNumber,t.innerHTML=`
        <td>${l(e.statement)}</td>
        <td>${Et(e.sequenceNumber,e.type)}</td>
        <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
        <td>${e.effortEstimate??`–`}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${e.sequenceNumber}"></select>
                <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${e.sequenceNumber}" type="button">Move</button>
                ${Lt(e.sequenceNumber)}
                <a href="/${pt}/${mt}/moments/${e.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `,on(t.querySelector(`.backlog-target-stride`)),t}function Yt(e){let t=document.querySelector(`.stride-card[data-stride-id="${e}"]`);if(!t)return null;let n=t.querySelector(`table.promisemodel-table tbody`);if(n)return n;let r=t.querySelector(`.stride-moments`);return r?(r.innerHTML=`
        <table class="promisemodel-table">
            <thead>
                <tr>
                    <th>Statement</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Effort</th>
                    <th>Owner</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `,t.querySelector(`table.promisemodel-table tbody`)):null}function Xt(e){let t=document.createElement(`tr`);t.dataset.momentId=e.sequenceNumber,t.innerHTML=`
        <td>${l(e.statement)}</td>
        <td>${Et(e.sequenceNumber,e.type)}</td>
        <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
        <td>${wt(e.sequenceNumber,e.effortEstimate)}</td>
        <td>${Tt(e.sequenceNumber,e.ownerId)}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                ${Dt(e.sequenceNumber,e.status)}
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${e.sequenceNumber}" data-current-estimate="${e.effortEstimate??``}"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${e.sequenceNumber}" type="button">Backlog</button>
                ${Lt(e.sequenceNumber)}
                <a href="/${pt}/${mt}/moments/${e.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;let n=t.querySelector(`.estimate-dropdown`),r=t.querySelector(`.estimate-dropdown-mobile`),i=t.querySelector(`.owner-dropdown`),a=t.querySelector(`.status-dropdown`);return n&&nn(n),r&&nn(r),a&&rn(a),i&&an(i),t}function Zt(e,t,n,r,i){e&&e.dataset.bound!==`1`&&(e.dataset.bound=`1`,e.addEventListener(`change`,async e=>{let r=e.target;if(r.matches(`.status-dropdown`)){let e=parseInt(r.dataset.momentId,10),i=r.value;try{let i=await _(t,n,e,r.value);Ot(Kt(e),i.status)}catch{r.value=i,alert(`Failed to update status`)}}if(r.matches(`.estimate-dropdown`)||r.matches(`.estimate-dropdown-mobile`)){let e=parseInt(r.dataset.momentId,10),i=r.value;try{await a(t,n,e,r.value===``?null:r.value);let i=Kt(e),o=i?i.closest(`.stride-card`):null;o&&B(o)}catch{r.value=i,alert(`Failed to update estimate`)}}if(r.matches(`.owner-dropdown`)){let e=parseInt(r.dataset.momentId,10),i=r.value;try{r.value=(await o(t,n,e,r.value?parseInt(r.value,10):null)).ownerId??``}catch{r.value=i,alert(`Failed to update owner`)}}if(r.matches(`.moment-type-dropdown`)){let e=parseInt(r.dataset.momentId,10),i=r.value,a=r.dataset.currentType||i;try{await p(t,n,e,i),r.dataset.currentType=i}catch{r.value=a,alert(`Failed to update type`)}}}),e.addEventListener(`click`,async e=>{let a=e.target.closest(`a[data-moment-view]`);if(a){e.preventDefault(),h(a.getAttribute(`href`),r,i);return}let o=e.target.closest(`.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn`);if(o){if(o.classList.contains(`move-to-backlog-btn`)){let e=parseInt(o.dataset.momentId,10);Bt(e,async()=>{let r=await g(t,n,e,null);_t(()=>{let t=Kt(e),n=t?t.closest(`.stride-card`):null;t&&t.remove();let i=qt();i&&i.appendChild(Jt(r)),n&&(B(n),St(n))})})}if(o.classList.contains(`move-to-stride-from-backlog-btn`)){let e=parseInt(o.dataset.momentId,10),r=o.closest(`tr`)?.querySelector(`.backlog-target-stride`),i=r?parseInt(r.value,10):null;if(!i)return;Wt(e,i,async()=>{let r=await g(t,n,e,i);_t(()=>{Kt(e)?.remove();let t=Yt(i),n=document.querySelector(`.stride-card[data-stride-id="${i}"]`);t&&t.appendChild(Xt(r)),n&&(B(n),xt(n))})})}if(o.classList.contains(`progress-stride-btn`)){let e=parseInt(o.dataset.strideId,10);if(!await Ut(e))return;try{await T(t,n,e);let r=document.getElementById(`success-text`);r&&(r.textContent=``);let{moved:i,targetVisible:a}=_t(()=>Ct(e));r&&(i===0?r.textContent=`Stride progressed. No unfinished moments to move.`:a?r.textContent=`Stride progressed. Moved ${i} moment(s) to the next stride.`:r.textContent=`Stride progressed. Moved ${i} moment(s) to the next stride (not shown on this page).`)}catch{alert(`Failed to progress stride`)}}}}))}function Qt(e){return e.reduce((e,t)=>e+(ut[t.effortEstimate]||0),0)}function $t(e,t,r,i,a){let o=document.getElementById(`stride-board`),s=document.getElementById(`backlog-section`),c=document.getElementById(`error-text`),u=document.getElementById(`project-title`),d=document.getElementById(`create-stride-btn`),f=document.getElementById(`create-stride-btn-label`);pt=e,mt=t,o.innerHTML=n(`Loading strides`),c.textContent=``,s&&(s.innerHTML=``),Nt(o),Nt(s),Ft();let p=a?.permission===`Edit`;d&&(p?d.dataset.bound!==`1`&&(d.dataset.bound=`1`,d.addEventListener(`click`,()=>{if(!z.length){Ke(e,t,()=>$t(e,t,r,i));return}let n=z[0];lt({owner:e,project:t,iterationId:n.id,iterations:z,existingStrides:R,onCreated:()=>$t(e,t,r,i)})})):d.classList.add(`d-none`)),Promise.all([Je(e,t).catch(()=>null),re(e,t)]).then(([n,a])=>{if(z=Array.isArray(a)?[...a].sort((e,t)=>t.id-e.id):[],!z.length){o.innerHTML=m({icon:`bi-repeat`,title:`No iterations found for this project.`,description:`Create the first iteration to start planning your work.`}),u&&(u.innerHTML=`<h2>${l(n?.name??`Project ${e}/${t}`)}</h2>`),f&&(f.textContent=`Create First Iteration`);return}let s=z[0];u.innerHTML=`<h2>${l(n?.name??`Project ${e}/${t}`)} – ${l(s.name)}</h2>`,f&&(f.textContent=`New Stride`);let c=document.getElementById(`iteration-history-link`);return c&&c.addEventListener(`click`,()=>{h(`/${e}/${t}/iterations`,r,i)}),Promise.all([le(e,t,s.id),He(e,t,s.id,!0)]).then(([e,t])=>({strides:e,backlogMoments:t}))}).then(n=>{if(!n)return;let{strides:r,backlogMoments:i}=n;if(o.innerHTML=``,!r||r.length===0)o.innerHTML=m({icon:`bi-kanban`,title:`No strides found for this iteration.`,description:`Create a stride to organize your moments into sprints.`});else{It(r);let n=r.map(n=>ne(e,t,n.id).then(e=>({stride:n,moments:e})).catch(e=>(console.error(`Failed to load moments for stride`,n.id,e),{stride:n,moments:[]})));return Promise.all(n).then(e=>({results:e,backlogMoments:i,strides:r}))}return{results:[],backlogMoments:i,strides:[]}}).then(n=>{if(!n)return;let{results:a,backlogMoments:c,strides:u}=n;if(a.forEach(({stride:n,moments:r},i)=>{let a=i!==0,s=document.createElement(`div`);s.className=`stride-card${a?` is-collapsed`:``}`,s.dataset.strideId=n.id,s.id=`stride-card-${n.id}`,s.dataset.collapsibleBoard=`1`;let c=Qt(r);s.innerHTML=`
                    <div class="stride-header">
                        <div class="stride-header-main">
                            ${At(a)}
                            <h3>${l(n.name)}</h3>
                            <span class="stride-dates">${cn(n.startDate)} – ${cn(n.endDate)}</span>
                            <span class="stride-duration">(${n.durationDays} days)</span>
                            <span class="stride-countdown" data-end-date="${n.endDate}"></span>
                            <span class="stride-total-effort">Total Effort: ${c}</span>
                        </div>
                        <div class="stride-header-actions ms-auto">
                            <button class="progress-stride-btn btn btn-outline-success btn-sm hidden" data-stride-id="${n.id}" type="button"><span aria-hidden="true">🧟</span> Progress</button>
                        </div>
                    </div>
                    <div class="stride-moments${a?` hidden`:``}">
                        ${r.length===0?m({icon:`bi-clock`,title:`No moments assigned.`,description:`Move moments from the backlog into this stride.`}):`<table class="promisemodel-table">
                                <thead>
                                    <tr>
                                        <th>Statement</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Effort</th>
                                        <th>Owner</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                     ${r.map(n=>`
                                        <tr data-moment-id="${n.sequenceNumber}">
                                            <td>${l(n.statement)}</td>
                                            <td>${Et(n.sequenceNumber,n.type)}</td>
                                            <td><span class="status-badge status-${(n.status||``).toLowerCase()}">${n.status}</span></td>
                                            <td>
                                                <select class="estimate-dropdown" data-moment-id="${n.sequenceNumber}" data-current-estimate="${n.effortEstimate??``}" aria-label="Effort estimate"></select>
                                            </td>
                                            <td>
                                                <select class="owner-dropdown" data-moment-id="${n.sequenceNumber}" data-owner-id="${n.ownerId??``}" aria-label="Owner"></select>
                                            </td>
            <td>
                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                    <select class="status-dropdown form-select form-select-sm" data-moment-id="${n.sequenceNumber}" data-current-status="${n.status??``}" aria-label="Status"></select>
                    <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${n.sequenceNumber}" data-current-estimate="${n.effortEstimate??``}" aria-label="Effort estimate"><option value="">–</option></select>
                    <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${n.sequenceNumber}" type="button">Backlog</button>
                    ${Lt(n.sequenceNumber)}
                    <a href="/${e}/${t}/moments/${n.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                </div>
            </td>
                                        </tr>
                                    `).join(``)}
                                </tbody>
                            </table>`}
                    </div>
                `,o.appendChild(s),sn(s)}),s){let n=u&&u.length>0;!c||c.length===0?s.innerHTML=`
                        <div class="stride-card backlog-board${n?` is-collapsed`:``}" data-collapsible-board="1">
                            ${jt(`Backlog`,n)}
                            <div class="stride-moments backlog-content${n?` hidden`:``}">
                                ${m({icon:`bi-inbox`,title:`No unassigned moments.`,description:`Create new moments or assign existing ones to this project.`})}
                            </div>
                        </div>
                    `:(s.innerHTML=`
                        <div class="stride-card backlog-board${n?` is-collapsed`:``}" data-collapsible-board="1">
                            ${jt(`Backlog`,n)}
                            <div class="stride-moments backlog-content${n?` hidden`:``}">
                                <table class="promisemodel-table">
                                    <thead><tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        ${c.map(n=>`
                                            <tr data-moment-id="${n.sequenceNumber}">
                                                <td>${l(n.statement)}</td>
                                                <td>${Et(n.sequenceNumber,n.type)}</td>
                                                <td><span class="status-badge status-${(n.status||``).toLowerCase()}">${n.status}</span></td>
                                                <td>${n.effortEstimate??`–`}</td>
                                                <td>
                                                    <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                        <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${n.sequenceNumber}"></select>
                                                        <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${n.sequenceNumber}" type="button">Move</button>
                                                        ${Lt(n.sequenceNumber)}
                                                        <a href="/${e}/${t}/moments/${n.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join(``)}
                                    </tbody>
                                </table>
                            </div>
                        </div>`,sn(s))}requestAnimationFrame(Pt),ge(e,t).then(e=>{dt=Array.isArray(e)?e:[],document.querySelectorAll(`.owner-dropdown`).forEach(e=>an(e))}).catch(e=>console.error(`Failed to load project members`,e)),_e(e,t).then(e=>{ft=e&&(e.toLowerCase()===`edit`||e.toLowerCase()===`owner`),gt(ft)}).catch(e=>console.error(`Failed to get permission`,e)),ln(),R=Array.isArray(u)?u:[],It(R),document.querySelectorAll(`.backlog-target-stride`).forEach(e=>on(e)),en(e,t,r,i)}).catch(e=>{o.innerHTML=``,c.textContent=`Failed to load data.`,console.error(e)})}function en(e,t,n,r){let i=document.getElementById(`stride-board`),a=document.getElementById(`backlog-section`);Zt(i,e,t,n,r),Zt(a,e,t,n,r)}function V(e,t,n){let r=document.createElement(`option`);return r.value=String(e??``),r.textContent=t??``,n&&(r.selected=!0),r}var tn=[`XS`,`S`,`M`,`L`,`XL`,`XXL`,`XXXL`];function nn(e){if(!e)return;let t=e.getAttribute(`data-current-estimate`)||e.value||``;e.innerHTML=``,e.appendChild(V(``,`–`,t===``)),tn.forEach(n=>e.appendChild(V(n,n,String(t)===String(n))))}function rn(e){if(!e)return;let t=e.getAttribute(`data-current-status`)||e.value||``;e.innerHTML=``;for(let n of xe)e.appendChild(V(n.value,`${n.icon} ${n.label}`,t===n.value))}function an(e){if(!e)return;let t=e.value||e.getAttribute(`data-owner-id`)||``;e.innerHTML=``,e.appendChild(V(``,`Unassigned`,t===``)),(dt||[]).forEach(n=>e.appendChild(V(String(n.userId),n.userName,String(t)===String(n.userId)))),[...e.options].some(e=>e.value===String(t))||(e.value=``)}function on(e){if(!e)return;let t=e.value||``;e.innerHTML=``,(R||[]).forEach(n=>e.appendChild(V(String(n.id),n.name,String(t)===String(n.id)))),[...e.options].some(e=>e.value===String(t))||(e.value=e.options[0]&&e.options[0].value||``)}function sn(e){e&&(e.querySelectorAll(`.estimate-dropdown`).forEach(nn),e.querySelectorAll(`.estimate-dropdown-mobile`).forEach(nn),e.querySelectorAll(`.status-dropdown`).forEach(rn),e.querySelectorAll(`.owner-dropdown`).forEach(an),e.querySelectorAll(`.backlog-target-stride`).forEach(on))}function cn(e){return e?new Date(e).toLocaleDateString(`en-CA`,{month:`short`,day:`numeric`,year:`numeric`}):`N/A`}function ln(){document.querySelectorAll(`.stride-countdown`).forEach(e=>{let t=new Date(e.dataset.endDate),n=Math.ceil((t-new Date)/(1e3*60*60*24));e.classList.remove(`stride-countdown--ended`,`stride-countdown--ending`,`stride-countdown--healthy`),n<0?(e.textContent=`Ended`,e.classList.add(`stride-countdown--ended`)):n===0?(e.textContent=`Ends today`,e.classList.add(`stride-countdown--ending`)):n<=3?(e.textContent=`${n} day${n>1?`s`:``} left`,e.classList.add(`stride-countdown--ending`)):(e.textContent=`${n} days left`,e.classList.add(`stride-countdown--healthy`))})}function un(e,t,n,r,i){d(`strides/list.html`,r).then(()=>$t(e,t,n,r,i)).catch(f(r,`strides`))}function dn(e,t){let n=document.getElementById(e);if(n)return n;let r=document.createElement(`div`);return r.innerHTML=t.trim(),n=r.firstElementChild,n&&document.body.appendChild(n),n}function fn(){return dn(`revoke-modal`,`
        <div class="modal fade" id="revoke-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Revoke Permission</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0" id="revoke-modal-text">Revoke this permission?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="revoke-modal-confirm">Revoke</button>
                    </div>
                </div>
            </div>
        </div>
    `)}function pn(e,t,n,r){let i=document.getElementById(`error-text`),a=document.getElementById(`loading-text`),o=document.getElementById(`success-text`),s=document.getElementById(`permissions-section`);function c(n){!n||n.dataset.bound===`1`||(n.dataset.bound=`1`,n.addEventListener(`click`,async()=>{let r=parseInt(n.dataset.permissionId);if(!Number.isFinite(r))return;let a=fn(),s=a.querySelector(`#revoke-modal-confirm`);if(!s)return;let c=s.cloneNode(!0);s.parentElement.replaceChild(c,s),c.addEventListener(`click`,async()=>{c.disabled=!0;try{await Ve(e,t,r),window.bootstrap?.Modal?.getOrCreateInstance(a)?.hide();let i=window.scrollY;n.closest(`tr`)?.remove(),o.textContent=`Permission revoked.`,o.classList.remove(`d-none`),window.scrollTo(0,i)}catch(e){i.textContent=`Failed to revoke permission.`,i.classList.remove(`d-none`),console.error(e)}finally{c.disabled=!1}},{once:!0}),window.bootstrap?.Modal?.getOrCreateInstance(a)?.show()}))}let u={items:[],highlightedIndex:-1,open:!1};function d(){let e=document.getElementById(`invite-autocomplete`);e&&(e.style.display=`none`,e.innerHTML=``),u={items:[],highlightedIndex:-1,open:!1}}function f(){let e=document.getElementById(`invite-autocomplete`);if(e){e.innerHTML=``;for(let t=0;t<u.items.length;t++){let n=u.items[t],r=document.createElement(`div`);r.className=`comment-autocomplete__item`+(t===u.highlightedIndex?` comment-autocomplete__item--highlight`:``),r.role=`option`,r.ariaSelected=String(t===u.highlightedIndex),r.textContent=n.name+` (`+n.email+`)`,r.dataset.index=t,r.addEventListener(`mousedown`,function(e){e.preventDefault(),p(parseInt(this.dataset.index,10))}),e.appendChild(r)}if(u.items.length>0){let t=e.children[u.highlightedIndex];t&&t.scrollIntoView({block:`nearest`})}}}function p(e){let t=u.items[e];if(!t)return;let n=document.getElementById(`invite-email`);n&&(n.value=t.email),d(),n?.focus()}async function m(e){if(e.length<1){d();return}let t;try{t=await Ie(e)}catch{d();return}if(t&&t.length>0){u.items=t,u.highlightedIndex=0,u.open=!0;let e=document.getElementById(`invite-autocomplete`);e&&(e.style.display=`block`),f()}else d()}function h(){let e=document.getElementById(`invite-email`),t=document.getElementById(`invite-autocomplete`);if(!e||!t)return;let n=null;e.addEventListener(`input`,function(){n&&clearTimeout(n);let e=this.value.trim();if(!e){d();return}n=setTimeout(function(){m(e)},200)}),e.addEventListener(`keydown`,function(e){if(!(!u.open||u.items.length===0))switch(e.key){case`ArrowDown`:e.preventDefault(),u.highlightedIndex=(u.highlightedIndex+1)%u.items.length,f();break;case`ArrowUp`:e.preventDefault(),u.highlightedIndex=(u.highlightedIndex-1+u.items.length)%u.items.length,f();break;case`Enter`:e.preventDefault(),u.highlightedIndex>=0&&p(u.highlightedIndex);break;case`Tab`:u.highlightedIndex>=0?p(u.highlightedIndex):d();break;case`Escape`:e.preventDefault(),d();break}}),e.addEventListener(`blur`,function(){setTimeout(function(){document.activeElement!==t&&!t.contains(document.activeElement)&&d()},150)})}function g({owner:e,project:t,onInvited:n}){let r=dn(`invite-modal`,`
            <div class="modal fade" id="invite-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <form id="invite-modal-form">
                            <div class="modal-header">
                                <h5 class="modal-title">Invite a User</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3 position-relative">
                                    <label class="form-label" for="invite-email">Email or username</label>
                                    <input type="text" id="invite-email" class="form-control" placeholder="Enter name or email" required autocomplete="off">
                                    <div id="invite-autocomplete" class="comment-autocomplete" role="listbox" style="display:none;"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="invite-level">Permission</label>
                                    <select id="invite-level" class="form-select">
                                        <option value="View">View</option>
                                        <option value="Comment">Comment</option>
                                        <option value="Edit">Edit</option>
                                    </select>
                                </div>
                                <div id="invite-modal-error" class="text-danger small d-none"></div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="invite-modal-submit">Send Invitation</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `),i=r?.querySelector(`#invite-modal-form`),a=r?.querySelector(`#invite-email`),s=r?.querySelector(`#invite-level`),c=r?.querySelector(`#invite-modal-error`),l=r?.querySelector(`#invite-modal-submit`);if(!i||!a||!s||!c||!l)return;i.replaceWith(i.cloneNode(!0));let u=r.querySelector(`#invite-modal-form`),f=r.querySelector(`#invite-email`),p=r.querySelector(`#invite-level`),m=r.querySelector(`#invite-modal-error`),g=r.querySelector(`#invite-modal-submit`);f.value=``,p.value=`View`,m.textContent=``,m.classList.add(`d-none`),g.disabled=!1,g.textContent=`Send Invitation`,d(),h(),u.addEventListener(`submit`,async i=>{i.preventDefault();let a=f.value.trim(),s=p.value;if(a){g.disabled=!0,g.textContent=`Sending...`,m.classList.add(`d-none`);try{await Ee(e,t,{email:a,level:s}),window.bootstrap?.Modal?.getOrCreateInstance(r)?.hide(),o.textContent=`Invitation sent.`,o.classList.remove(`d-none`),await n?.()}catch(e){m.textContent=e?.message||`Failed to invite user.`,m.classList.remove(`d-none`)}finally{g.disabled=!1,g.textContent=`Send Invitation`}}}),window.bootstrap?.Modal?.getOrCreateInstance(r)?.show()}async function _(){try{let n=r?.isOwner===!0,u=await Pe(e,t);a.classList.add(`d-none`),i.classList.add(`d-none`),o.classList.add(`d-none`);let d=u&&u.length>0?u.map(e=>`
                        <tr data-permission-id="${e.id}">
                            <td>${l(e.userName)}</td>
                            <td>${e.level}</td>
                            <td>${e.status}</td>
                            <td>${n?`<button class="btn btn-outline-danger btn-sm revoke-btn" data-permission-id="${e.id}">Revoke</button>`:`-`}</td>
                        </tr>`).join(``):v({icon:`bi-share`,title:`No permissions configured`,description:n?`Invite a user to get started.`:``,colspan:4,button:n?{text:`Invite`,icon:`bi-plus-circle`,id:`empty-state-invite-btn`}:void 0});s.innerHTML=`
                <div class="d-flex justify-content-between align-items-center">
                    <h2>Current Permissions</h2>
                    ${n?`<button id="invite-btn-top" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Invite</button>`:``}
                </div>
                <table class="table table-striped table-sm promisemodel-table">
                    <thead><tr><th>User</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${d}</tbody>
                </table>
                ${n?``:`<p class="text-muted mt-4">Only the project owner can manage permissions.</p>`}`,document.querySelectorAll(`.revoke-btn`).forEach(e=>{c(e)}),document.getElementById(`invite-btn-top`)?.addEventListener(`click`,()=>{g({owner:e,project:t,onInvited:_})}),document.getElementById(`empty-state-invite-btn`)?.addEventListener(`click`,()=>{g({owner:e,project:t,onInvited:_})})}catch{a.classList.add(`d-none`),i.textContent=`Failed to load permissions.`,i.classList.remove(`d-none`)}}_()}function mn(e,n,r){return t(`/api/comments/search-users?${new URLSearchParams({parentType:e,parentId:n,search:r})}`)}function hn(e,n,r){return t(`/api/comments/search-promises?${new URLSearchParams({parentType:e,parentId:n,search:r})}`)}function H(e,t,n){let r=document.createElement(`div`);r.className=`comment-autocomplete`,r.role=`listbox`,r.style.display=`none`,document.body.appendChild(r);let i={open:!1,items:[],highlightedIndex:-1,trigger:null,triggerStart:-1},a=null;function o(){let t=e.selectionStart,n=e.value,r=t;for(;r>0&&!/\s/.test(n[r-1]);)r--;let i=n.substring(r,t);if(i.length>0&&(i[0]===`@`||i[0]===`#`)){let e=i[0],t=i.substring(1);if(e===`@`&&/^\w*$/.test(t)||e===`#`)return{trigger:e,query:t,start:r}}return null}function s(t){let n=document.createElement(`div`),r=window.getComputedStyle(e),i=[`fontFamily`,`fontSize`,`fontWeight`,`fontStyle`,`fontVariant`,`fontStretch`,`lineHeight`,`letterSpacing`,`wordSpacing`,`textIndent`,`textTransform`,`wordBreak`,`whiteSpace`,`paddingTop`,`paddingRight`,`paddingBottom`,`paddingLeft`,`borderTopWidth`,`borderRightWidth`,`borderBottomWidth`,`borderLeftWidth`],a=n.style;for(let e of i)a[e]=r[e];a.position=`fixed`,a.top=`0`,a.left=`0`,a.visibility=`hidden`,a.overflow=`hidden`,a.width=e.clientWidth+`px`,a.height=`auto`,a.whiteSpace=`pre-wrap`,a.wordWrap=`break-word`,n.textContent=e.value.substring(0,t);let o=document.createElement(`span`);o.textContent=e.value[t]||`|`,n.appendChild(o),document.body.appendChild(n);let s=o.getBoundingClientRect();return document.body.removeChild(n),s}function c(){let t=e.getBoundingClientRect(),n=window.getComputedStyle(e),a=parseFloat(n.borderTopWidth)||0,o=parseFloat(n.borderLeftWidth)||0,c=parseFloat(n.lineHeight)||parseFloat(n.fontSize)*1.2||20,l=s(i.triggerStart),u=t.top+a+l.top-e.scrollTop,d=t.left+o+l.left-e.scrollLeft;r.style.position=`fixed`,r.style.left=d+`px`,r.style.top=u+c+`px`}async function l(e){let r;try{r=e.trigger===`@`?await mn(t,n,e.query):await hn(t,n,e.query)}catch{g();return}r&&r.length>0?u(r,e):g()}function u(e,t){i.items=e,i.trigger=t.trigger,i.triggerStart=t.start,i.highlightedIndex=0,i.open=!0,d(),c(),r.style.display=`block`}function d(){r.innerHTML=``;for(let e=0;e<i.items.length;e++){let t=i.items[e],n=document.createElement(`div`);n.className=`comment-autocomplete__item`+(e===i.highlightedIndex?` comment-autocomplete__item--highlight`:``),n.role=`option`,n.ariaSelected=String(e===i.highlightedIndex),i.trigger===`@`?n.textContent=t.name:n.textContent=`#`+t.entityType+`-`+(t.sequenceNumber??t.id)+` — `+t.statement,n.dataset.index=e,n.addEventListener(`mousedown`,function(e){e.preventDefault(),m(parseInt(this.dataset.index,10))}),r.appendChild(n)}let e=r.children[i.highlightedIndex];e&&e.scrollIntoView({block:`nearest`})}function f(){i.items.length!==0&&(i.highlightedIndex=(i.highlightedIndex+1)%i.items.length,d())}function p(){i.items.length!==0&&(i.highlightedIndex=(i.highlightedIndex-1+i.items.length)%i.items.length,d())}function m(t){let n=i.items[t];if(!n)return;if(e.value[i.triggerStart]!==i.trigger){g();return}let r;r=i.trigger===`@`?`@`+n.name+` `:`#`+n.entityType+`-`+(n.sequenceNumber??n.id)+` `;let a=e.selectionStart,o=e.value.substring(0,i.triggerStart),s=e.value.substring(a);e.value=o+r+s;let c=o.length+r.length;e.selectionStart=c,e.selectionEnd=c,g(),e.focus()}function h(){m(i.highlightedIndex)}function g(){i.open=!1,i.items=[],i.highlightedIndex=-1,i.trigger=null,i.triggerStart=-1,r.style.display=`none`}function _(){a&&clearTimeout(a),a=setTimeout(function(){let e=o();e?l(e):g()},200)}function v(t){if(i.open)switch(t.key){case`ArrowDown`:t.preventDefault(),f();break;case`ArrowUp`:t.preventDefault(),p();break;case`Tab`:t.preventDefault(),i.highlightedIndex>=0?h():g();break;case`Enter`:t.preventDefault(),i.highlightedIndex>=0&&h();break;case`Escape`:t.preventDefault(),g(),e.focus();break}}function y(){setTimeout(function(){document.activeElement!==r&&!r.contains(document.activeElement)&&g()},150)}function b(t){e.contains(t.target)||r.contains(t.target)||g()}function x(){g()}e.addEventListener(`input`,_),e.addEventListener(`keydown`,v),e.addEventListener(`blur`,y),document.addEventListener(`click`,b);let S=e.closest(`form`);return S&&S.addEventListener(`submit`,x),{destroy:function(){e.removeEventListener(`input`,_),e.removeEventListener(`keydown`,v),e.removeEventListener(`blur`,y),document.removeEventListener(`click`,b),S&&S.removeEventListener(`submit`,x),r.parentNode&&r.parentNode.removeChild(r)}}}var gn=window.tippy,U=null,W=null,_n=null,vn={root:`Promise`,promise:`Epic`,epic:`Journey`,journey:`Flow`,flow:`Moment`};function yn(e,t){let n=G(e);if(n===`root`)return`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}`;let r=Number.parseInt(t,10);if(Number.isNaN(r))return null;switch(n){case`promise`:return`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}/promises/${r}`;case`epic`:return`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}/epics/${r}`;case`journey`:return`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}/journeys/${r}`;case`flow`:return`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}/flows/${r}`;case`moment`:return`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}/moments/${r}`;default:return null}}function G(e){return String(e??``).trim().toLowerCase()}function bn(e){let t=e?.payload??{};return String(t.statement??t.name??`#${t.id??``}`).trim()}function xn(e){return vn[G(e)]??null}function Sn(e){let t=G(e.nodeType),n=`/api/projects/${encodeURIComponent(U)}/${encodeURIComponent(W)}`;switch(t){case`root`:return{entityLabel:`Promise`,endpoint:`${n}/promises/create`,parentField:`projectId`};case`promise`:return{entityLabel:`Epic`,endpoint:`${n}/epics/create`,parentField:`productPromiseId`};case`epic`:return{entityLabel:`Journey`,endpoint:`${n}/journeys/create`,parentField:`epicId`};case`journey`:return{entityLabel:`Flow`,endpoint:`${n}/flows/create`,parentField:`journeyId`};case`flow`:return{entityLabel:`Moment`,endpoint:`${n}/moments/create`,parentField:`flowId`};default:return null}}function Cn(e){let t=G(e.nodeType),n=(Number.parseInt(e.childCount??0,10)||0)+1;switch(t){case`root`:return{statement:`New Promise`,description:``,displayOrder:n};case`promise`:return{statement:`New Epic`,description:``,displayOrder:n};case`epic`:return{statement:`New Journey`,description:``,displayOrder:n};case`journey`:return{statement:`New Flow`,description:``,displayOrder:n};case`flow`:return{statement:`New Moment`,description:``,displayOrder:n};default:return null}}async function wn(e,t){let{headers:n,...r}=t,i=await s(e,{mode:`cors`,...r,headers:{Accept:`application/json`,"Accept-Language":`en-CA`,...n??{}}});if(i.ok)return i.status===204?null:i.json();i.status===401&&document.getElementById(`login-link`)?.click();let a=`HTTP error! status: ${i.status}`;try{let e=await i.json();a=e?.message||e?.title||e?.detail||a}catch{}throw Error(a)}function Tn(e,t){let n=document.getElementById(e);if(n)return n;let r=document.createElement(`div`);return r.innerHTML=t.trim(),n=r.firstElementChild,n&&document.body.appendChild(n),n}function En(e){let t=Tn(`graph-delete-confirmation-modal`,`
        <div class="modal fade" id="graph-delete-confirmation-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="graph-delete-confirmation-modal-title">Delete item</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="graph-delete-confirmation-modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="graph-delete-confirmation-confirm">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `);if(!t)return Promise.resolve(window.confirm(`Delete ${e}? This cannot be undone.`));let n=t.querySelector(`#graph-delete-confirmation-modal-title`),r=t.querySelector(`#graph-delete-confirmation-modal-body`),i=t.querySelector(`#graph-delete-confirmation-confirm`);return!n||!r||!i?Promise.resolve(window.confirm(`Delete ${e}? This cannot be undone.`)):(n.textContent=`Delete ${e}`,r.textContent=`Delete ${e}? This cannot be undone.`,new Promise(e=>{let n=!1,r=t=>{n||(n=!0,e(t))},a=window.bootstrap?.Modal?.getOrCreateInstance(t);i.addEventListener(`click`,()=>{r(!0),a?.hide()},{once:!0}),t.addEventListener(`hidden.bs.modal`,()=>r(!1),{once:!0}),a?.show()}))}function Dn({name:e,label:t,type:n=`text`,value:r=``,placeholder:i=``,rows:a=3}){let o=document.createElement(`label`);o.className=`graph-context-menu-form__field`;let s=document.createElement(`span`);s.className=`graph-context-menu-form__label`,s.textContent=t;let c;return n===`textarea`?(c=document.createElement(`textarea`),c.rows=a):(c=document.createElement(`input`),c.type=n),c.name=e,c.className=`graph-context-menu-form__control`,c.value=r,c.placeholder=i,o.append(s,c),{field:o,input:c}}function On({name:e,label:t,value:n=``,options:r=[]}){let i=document.createElement(`label`);i.className=`graph-context-menu-form__field`;let a=document.createElement(`span`);a.className=`graph-context-menu-form__label`,a.textContent=t;let o=document.createElement(`select`);o.name=e,o.className=`graph-context-menu-form__control`;for(let e of r){let t=document.createElement(`option`);t.value=e.value,t.textContent=e.label,t.selected=String(e.value)===String(n),o.appendChild(t)}return i.append(a,o),{field:i,select:o}}function kn(){return[{value:`Story`,label:`Story`},{value:`Job`,label:`Job`}]}function An(e){let t=e?.payload??{},n=String(t.status??t.Status??``).trim();if(n){let e=xe.find(e=>e.value.toLowerCase()===n.toLowerCase());if(e)return e.value}let r=String(t.statusColor??t.StatusColor??``).trim().toLowerCase();return r.includes(`green`)||r.includes(`done`)?`Done`:r.includes(`black`)||r.includes(`blocked`)?`Blocked`:r.includes(`orange`)||r.includes(`yellow`)||r.includes(`amber`)||r.includes(`inprogress`)||r.includes(`in-progress`)?`InProgress`:(r.includes(`red`)||r.includes(`todo`),`Todo`)}function jn(){return[{value:`-`,label:`-`},{value:`XS`,label:`XS`},{value:`S`,label:`S`},{value:`M`,label:`M`},{value:`L`,label:`L`},{value:`XL`,label:`XL`},{value:`XXL`,label:`XXL`},{value:`XXXL`,label:`XXXL`}]}function Mn(e=[]){return[{value:``,label:`Backlog`},...e.map(e=>({value:String(e.id),label:e.name?`Stride #${e.id} - ${e.name}`:`Stride #${e.id}`}))]}function Nn(e,t,n,r,i,a){let o=Sn(e),s=Cn(e);if(!o||!s)return null;let c=document.createElement(`form`);c.className=`graph-context-menu-form graph-context-menu-form--moment`;let l=document.createElement(`div`);l.className=`graph-context-menu-form__title`,l.textContent=`Create Moment`;let u=document.createElement(`div`);u.className=`graph-context-menu-form__subtitle`,u.textContent=`Moments carry status, type, estimate, and stride assignment at creation time.`;let d=Dn({name:`statement`,label:`Statement`,value:s.statement,placeholder:`New Moment`}),f=Dn({name:`description`,label:`Description`,type:`textarea`,value:s.description,placeholder:`Optional description`,rows:3}),p=On({name:`type`,label:`Type`,value:`Story`,options:kn()}),m=On({name:`status`,label:`Status`,value:`Todo`,options:xe.map(e=>({value:e.value,label:`${e.icon} ${e.label}`}))}),h=On({name:`effortEstimate`,label:`Effort Estimate`,value:``,options:jn()}),g=On({name:`assignedStrideId`,label:`Assigned Stride`,value:``,options:Mn(r?.()??[])}),_=document.createElement(`div`);_.className=`graph-context-menu-form__actions`;let v=document.createElement(`button`);v.type=`button`,v.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,v.textContent=`Cancel`,v.addEventListener(`click`,e=>{e.preventDefault(),a()});let y=document.createElement(`button`);return y.type=`submit`,y.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,y.textContent=`Create Moment`,_.append(v,y),c.append(l,u,d.field,f.field,p.field,m.field,h.field,g.field,_),H(f.input,e.nodeType,e.payload?.id),c.addEventListener(`submit`,async t=>{t.preventDefault(),y.disabled=!0,y.textContent=`Creating Moment...`;let n=d.input.value.trim(),r=f.input.value.trim();if(!n){y.disabled=!1,y.textContent=`Create Moment`,d.input.focus();return}let s={statement:n,description:r||null,flowId:e.payload?.id,type:p.select.value,status:m.select.value,effortEstimate:h.select.value===`-`?null:h.select.value||null,assignedStrideId:g.select.value?Number.parseInt(g.select.value,10):null,displayOrder:(Number.parseInt(e.childCount??0,10)||0)+1};try{await wn(o.endpoint,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(s)}),a(),await i?.()}catch(e){throw y.disabled=!1,y.textContent=`Create Moment`,e}}),c}function Pn(e,t,n){let r=e?.payload?.sequenceNumber;if(r==null)return null;let i=document.createElement(`form`);i.className=`graph-context-menu-form graph-context-menu-form--moment`;let a=document.createElement(`div`);a.className=`graph-context-menu-form__title`,a.textContent=`Change Moment Status`;let o=document.createElement(`div`);o.className=`graph-context-menu-form__subtitle`,o.textContent=`Update the moment status without leaving the graph.`;let s=On({name:`status`,label:`Status`,value:An(e),options:xe.map(e=>({value:e.value,label:`${e.icon} ${e.label}`}))}),c=document.createElement(`div`);c.className=`graph-context-menu-form__actions`;let l=document.createElement(`button`);l.type=`button`,l.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,l.textContent=`Cancel`,l.addEventListener(`click`,e=>{e.preventDefault(),n()});let u=document.createElement(`button`);return u.type=`submit`,u.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,u.textContent=`Save Status`,c.append(l,u),i.append(a,o,s.field,c),i.addEventListener(`submit`,async e=>{e.preventDefault(),u.disabled=!0,u.textContent=`Saving Status...`;try{await _(U,W,r,s.select.value),n(),await t?.()}catch(e){throw u.disabled=!1,u.textContent=`Save Status`,e}}),i}function Fn(e,t,n,r,i,a){let o=Sn(e),s=Cn(e);if(!o||!s)return null;if(o.entityLabel===`Moment`)return Nn(e,t,n,r,i,a);let c=document.createElement(`form`);c.className=`graph-context-menu-form`;let l=document.createElement(`div`);l.className=`graph-context-menu-form__title`,l.textContent=`Create ${o.entityLabel}`;let u=document.createElement(`div`);u.className=`graph-context-menu-form__subtitle`,u.textContent=`Add a new ${o.entityLabel.toLowerCase()} beneath this card.`;let d=Dn({name:`statement`,label:`Statement`,value:s.statement,placeholder:`New ${o.entityLabel}`}),f=Dn({name:`description`,label:`Description`,type:`textarea`,value:s.description,placeholder:`Optional description`,rows:4}),p=document.createElement(`div`);p.className=`graph-context-menu-form__actions`;let m=document.createElement(`button`);m.type=`button`,m.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,m.textContent=`Cancel`,m.addEventListener(`click`,e=>{e.preventDefault(),a()});let h=document.createElement(`button`);return h.type=`submit`,h.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,h.textContent=`Create ${o.entityLabel}`,p.append(m,h),c.append(l,u,d.field,f.field,p),H(f.input,e.nodeType,e.payload?.id),c.addEventListener(`submit`,async t=>{t.preventDefault(),h.disabled=!0,h.textContent=`Creating ${o.entityLabel}...`;let n=d.input.value.trim(),r=f.input.value.trim();if(!n){h.disabled=!1,h.textContent=`Create ${o.entityLabel}`,d.input.focus();return}let s=(Number.parseInt(e.childCount??0,10)||0)+1,c={statement:n,description:r||null,displayOrder:s};o.parentField===`projectId`||(c[o.parentField]=e.payload?.id);try{await wn(o.endpoint,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(c)}),a(),await i?.()}catch(e){throw h.disabled=!1,h.textContent=`Create ${o.entityLabel}`,e}}),c}function In(e,t,n,r,i,a,o,s,c,l,u,d){let f=d?.permission===`Edit`,p=[],m=xn(e.nodeType),h=Number.parseInt(e?.childCount??0,10)||0,g=Number.parseInt(e?._hiddenDescendantCount??0,10)||0,_=h>0||g>0,v=_&&!!c?.(e);return m&&p.push({id:`create-child`,label:`Create New ${m}`,danger:!1,disabled:!f,disabledReason:`Requires Edit permission.`,handler:async()=>{o(e,t,n,r)}}),_&&p.push({id:v?`reveal-children`:`hide-children`,label:v?`Reveal Children`:`Hide Children`,danger:!1,handler:async()=>{await l?.(e,!v)}}),v&&g>0&&p.push({id:`reveal-next-level`,label:`Reveal Next Level`,danger:!1,handler:async()=>{await u?.(e)}}),G(e.nodeType)===`moment`&&p.push({id:`change-status`,label:`Change Status`,danger:!1,disabled:!f,disabledReason:`Requires Edit permission.`,handler:async()=>{s(e,r)}}),p.push({id:`delete`,label:`Delete`,danger:!0,disabled:!f,disabledReason:`Requires Edit permission.`,handler:async()=>{let t=bn(e)||G(e.nodeType)||`item`,n=e.nodeType===`root`?`project`:t;if(a?.(),!await En(n))return;if(G(e.nodeType)===`root`){await wn(yn(`root`),{method:`DELETE`}),await i?.();return}let o=yn(e.nodeType,e.payload?.id);if(!o)throw Error(`Unable to determine the delete route for this node.`);await wn(o,{method:`DELETE`}),await r?.()}}),p}function Ln(e){let t=document.createElement(`div`);t.className=`graph-context-menu`;for(let n of e){let e=document.createElement(`button`);e.type=`button`,e.className=`graph-context-menu__item${n.danger?` graph-context-menu__item--danger`:``}`,e.textContent=n.label,n.disabled&&(e.disabled=!0,e.className+=` graph-context-menu__item--disabled`,n.disabledReason&&(e.title=n.disabledReason)),e.addEventListener(`click`,async e=>{e.preventDefault(),e.stopPropagation(),!n.disabled&&await n.handler()}),t.appendChild(e)}return t}function Rn({owner:e,project:t,getAvailableStrides:n,onGraphMutated:r,onProjectDeleted:i,isNodeChildrenHidden:a,setNodeChildrenHidden:o,revealNextLevel:s,permission:c}={}){U=e,W=t,_n=c;let l=null,u=document.createElement(`div`),d=document.createElement(`div`),f=()=>{let e=document.getElementById(`graph-viewport`);return e&&document.fullscreenElement===e?e:document.body},p=gn(document.createElement(`div`),{trigger:`manual`,appendTo:f,content:document.createElement(`div`),allowHTML:!1,interactive:!0,hideOnClick:!0,placement:`right-start`,theme:`graph-menu`,animation:!1,offset:[8,8],onHidden(e){e.setContent(document.createElement(`div`))}}),m=gn(u,{trigger:`manual`,appendTo:f,content:d,allowHTML:!1,interactive:!0,hideOnClick:!0,placement:`bottom-start`,theme:`graph-menu`,animation:!1,offset:[0,8],getReferenceClientRect:()=>l??new DOMRect(0,0,0,0),onHidden(){d.replaceChildren()}});function h(){p.hide()}function g(){h(),m.hide()}function _(){g()}function v(){p.destroy(),m.destroy(),d.replaceChildren()}function y(e,t,r,i){let a=l??new DOMRect(0,0,0,0),o=new DOMRect(a.right+12,a.top,1,1),s=Fn(e,t,r,n,i,g);s&&(p.setProps({getReferenceClientRect:()=>o}),p.setContent(s),p.show())}function b(e,t){let n=l??new DOMRect(0,0,0,0),r=new DOMRect(n.right+12,n.top,1,1),i=Pn(e,t,g);i&&(p.setProps({getReferenceClientRect:()=>r}),p.setContent(i),p.show())}function x(n,c){let u=Number(n?.clientX??0),f=Number(n?.clientY??0);l=new DOMRect(u,f,1,1);let p=In(c,e,t,r,i,g,y,b,a,o,s,_n);d.replaceChildren(Ln(p)),m.setProps({getReferenceClientRect:()=>l}),m.show()}return{hide:_,destroy:v,open:x}}var K={owner:null,project:null,d3:null,rawTree:null,filteredTree:null,totalRenderableNodes:0,availableStrides:[],filters:Yn(),zoomTransform:null,userZoomTransform:null,focusNodeId:null,suppressZoomStateUpdate:!1,zoomBehavior:null,filterDebounceId:null,applyTimer:null,contextMenu:null,pageShowRefreshHandler:null,collapsedNodeIds:new Set,hasRendered:!1,animationSpeed:.25};function zn(e){return Array.isArray(e?.children)&&e.children.length>0}function Bn(e){return!!e&&K.collapsedNodeIds.has(e)}function Vn(e,t){e&&(t?K.collapsedNodeIds.add(e):K.collapsedNodeIds.delete(e))}function Hn(e){return zn(e)?e.children.reduce((e,t)=>e+qe(t),0):0}function Un(){if(!K.rawTree){K.collapsedNodeIds.clear();return}let e=new Set;for(let t of K.collapsedNodeIds){let n=Te(K.rawTree,t);n&&zn(n)&&e.add(t)}K.collapsedNodeIds=e}function Wn(){if(!K.rawTree)return;let e=new Set;for(let t of K.rawTree.children??[])zn(t)&&e.add(t.id);K.collapsedNodeIds=e}function Gn(e){if(!K.rawTree||!e?.id)return;let t=Te(K.rawTree,e.id);if(t){Vn(t.id,!1);for(let e of t.children??[])zn(e)&&Vn(e.id,!0)}}function Kn(){K.collapsedNodeIds.clear()}function qn(){try{let e=F(new URLSearchParams(window.location.search).get(`debugGraphFocus`));return e===`1`||e===`true`||e===`yes`||e===`on`?!0:window.localStorage?.getItem(`pmo.debugGraphFocus`)===`1`}catch{return!1}}function Jn(e,t){qn()&&console.info(`[graph-focus]`,e,t)}function Yn(){return{search:``,includeChildren:!1,types:new Set(P),effort:`all`,stride:`all`,status:`all`,assignment:`all`}}function Xn(e){if(e==null)return new Set(P);let t=new Set;for(let n of String(e).split(`,`)){let e=F(n);P.includes(e)&&t.add(e)}return Zn(t)}function Zn(e){let t=Array.from(e??[]).filter(e=>Ne.has(e));if(t.length===0)return new Set;let n=t.map(e=>Ne.get(e)),r=Math.min(...n),i=Math.max(...n);return new Set(P.slice(r,i+1))}function Qn(e){let t=F(e);return!t||t===`all`?`all`:[`done`,`blocked`,`inprogress`,`todo`,`other`].includes(t)?t:t.includes(`green`)||t.includes(`done`)?`done`:t.includes(`black`)||t.includes(`blocked`)?`blocked`:t.includes(`orange`)||t.includes(`yellow`)||t.includes(`amber`)||t.includes(`inprogress`)||t.includes(`in-progress`)?`inprogress`:t.includes(`red`)||t.includes(`todo`)?`todo`:`other`}function $n(e){return F(e)===`assigned-to-me`?`assigned-to-me`:`all`}function er(e){let t=F(e);return t===`all`||t===`unestimated`?t:[`xs`,`s`,`m`,`l`,`xl`,`xxl`,`xxxl`].includes(t)?t.toUpperCase():`all`}function tr(e){let t=F(e);return t===`all`||t===`backlog`||/^\d+$/.test(t)?t:`all`}function nr(e){switch(e){case`promise`:return`Promise`;case`epic`:return`Epic`;case`journey`:return`Journey`;case`flow`:return`Flow`;case`moment`:return`Moment`;default:return e}}function rr(e){return Ce(`moment`,e,[])}function ir(e){return Ce(`flow`,e,(e.moments??[]).map(rr))}function ar(e){return Ce(`journey`,e,(e.flows??[]).map(ir))}function or(e){return Ce(`epic`,e,(e.journeys??[]).map(ar))}function sr(e){return Ce(`promise`,e,(e.epics??[]).map(or))}function cr(e,t){if(e.nodeType===`root`||!t.types.has(e.nodeType)||t.search&&!(e._searchText??De(e)).includes(t.search)||t.status!==`all`&&(e._statusBucket??Ze(e.payload?.statusColor))!==t.status)return!1;if(t.assignment===`assigned-to-me`){if(e.nodeType!==`moment`)return!1;let t=C();if(t==null||e.payload?.ownerId!==t)return!1}if(t.effort!==`all`){if(e.nodeType!==`moment`)return!1;let n=e._effortBucket??Be(e.payload?.effortEstimate);if(t.effort!==n)return!1}if(t.stride!==`all`){if(e.nodeType!==`moment`)return!1;let n=e._strideBucket??Fe(e.payload);if(t.stride!==n)return!1}return!0}function lr(e,t){e.nodeType!==`root`&&(t.visibleNodes+=1);let n=Bn(e.id),r=n?Hn(e):0;return r>0&&(t.hiddenNodes+=r),{...e,_searchMatched:!1,_isCollapsed:n,_hiddenDescendantCount:r,children:n?[]:(e.children??[]).map(e=>lr(e,t))}}function ur(e,t,n,r=!1){let i=Bn(e.id),a=i?Hn(e):0,o=!r&&t.search&&(e._searchText??De(e)).includes(t.search);if(o&&t.includeChildren&&!i)return n.directMatches+=1,{...lr(e,n),_searchMatched:!0};a>0&&(n.hiddenNodes+=a);let s=i?[]:(e.children??[]).map(e=>ur(e,t,n)).filter(Boolean),c=!r&&cr(e,t);return c&&(n.directMatches+=1),r?{...e,_searchMatched:!1,_isCollapsed:i,_hiddenDescendantCount:a,children:s}:c||s.length>0?(n.visibleNodes+=1,{...e,_searchMatched:!!(o&&t.search),_isCollapsed:i,_hiddenDescendantCount:a,children:s}):null}function dr(){let e=new URLSearchParams(window.location.search),t=F(e.get(`q`)),n=e.get(`children`)===`1`||e.get(`children`)===`true`,r=Qn(e.get(`status`)),i=$n(e.get(`assignment`)),a=er(e.get(`effort`)),o=tr(e.get(`stride`)),s=e.get(`types`);return{search:t,includeChildren:n,status:r,assignment:i,effort:a,stride:o,types:s===null?new Set(P):Zn(Xn(s))}}function fr(){let e=new URLSearchParams(window.location.search);return String(e.get(`focus`)??``).trim()||null}function pr(e){let t=new URLSearchParams;e.search&&t.set(`q`,e.search),e.includeChildren&&t.set(`children`,`1`);let n=P.filter(t=>e.types.has(t));n.length>0&&n.length<P.length?t.set(`types`,n.join(`,`)):n.length===0&&t.set(`types`,``),e.status!==`all`&&t.set(`status`,e.status),e.assignment!==`all`&&t.set(`assignment`,e.assignment),e.effort!==`all`&&t.set(`effort`,e.effort),e.stride!==`all`&&t.set(`stride`,e.stride),K.focusNodeId&&t.set(`focus`,K.focusNodeId);let r=`${window.location.pathname}${t.toString()?`?${t.toString()}`:``}${window.location.hash||``}`;window.history.replaceState({owner:K.owner,project:K.project},``,r)}function mr(){let e=document.getElementById(`graph-filter-bar`);if(!e)return;let t=[`<option value="all" ${K.filters.stride===`all`?`selected`:``}>All strides</option>`,`<option value="backlog" ${K.filters.stride===`backlog`?`selected`:``}>Backlog</option>`,...K.availableStrides.map(e=>{let t=e.name?`Stride #${e.id} - ${l(e.name)}`:`Stride #${e.id}`;return`<option value="${String(e.id)}" ${String(K.filters.stride)===String(e.id)?`selected`:``}>${t}</option>`})].join(``),n=P.map(e=>`
            <label class="graph-filter-chip">
                <input type="checkbox" data-filter-type value="${e}" ${K.filters.types.has(e)?`checked`:``} />
                <span>${nr(e)}</span>
            </label>
        `).join(``);e.innerHTML=`
        <div class="graph-filter-row">
            <div class="graph-filter-search-group">
                <label class="graph-filter-field">
                    <span>Search</span>
                    <input id="graph-filter-search" class="graph-filter-input" type="search" placeholder="Search statements or descriptions" value="${l(K.filters.search)}" />
                </label>

                <div class="graph-filter-field graph-filter-checkbox-field">
                    <span>Search options</span>
                    <div class="form-check form-switch graph-filter-switch">
                        <input id="graph-filter-include-children" class="form-check-input" type="checkbox" role="switch" ${K.filters.includeChildren?`checked`:``} />
                        <label class="form-check-label graph-filter-switch-label" for="graph-filter-include-children">Include Children</label>
                    </div>
                </div>
            </div>

            <label class="graph-filter-field">
                <span>Effort estimate</span>
                <select id="graph-filter-effort" class="graph-filter-select">
                    <option value="all" ${K.filters.effort===`all`?`selected`:``}>All efforts</option>
                    <option value="unestimated" ${K.filters.effort===`unestimated`?`selected`:``}>Unestimated</option>
                    <option value="XS" ${K.filters.effort===`XS`?`selected`:``}>XS</option>
                    <option value="S" ${K.filters.effort===`S`?`selected`:``}>S</option>
                    <option value="M" ${K.filters.effort===`M`?`selected`:``}>M</option>
                    <option value="L" ${K.filters.effort===`L`?`selected`:``}>L</option>
                    <option value="XL" ${K.filters.effort===`XL`?`selected`:``}>XL</option>
                    <option value="XXL" ${K.filters.effort===`XXL`?`selected`:``}>XXL</option>
                    <option value="XXXL" ${K.filters.effort===`XXXL`?`selected`:``}>XXXL</option>
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Stride</span>
                <select id="graph-filter-stride" class="graph-filter-select">
                    ${t}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Moment status</span>
                <select id="graph-filter-status" class="graph-filter-select">
                    <option value="all" ${K.filters.status===`all`?`selected`:``}>All statuses</option>
                    ${xe.map(e=>{let t=e.value.toLowerCase();return`<option value="${t}" ${K.filters.status===t?`selected`:``}>${e.icon} ${e.label}</option>`}).join(``)}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Assigned to me</span>
                <select id="graph-filter-assignment" class="graph-filter-select">
                    <option value="all" ${K.filters.assignment===`all`?`selected`:``}>All</option>
                    <option value="assigned-to-me" ${K.filters.assignment===`assigned-to-me`?`selected`:``}>Assigned to me</option>
                </select>
            </label>
        </div>

        <div class="graph-filter-bottom">
            <fieldset class="graph-filter-types">
                <legend class="graph-filter-group-label">Promise types</legend>
                <div class="graph-filter-chip-list">
                    ${n}
                </div>
            </fieldset>

            <div class="graph-filter-bottom-row">
                <div id="graph-filter-summary" class="graph-filter-summary" aria-live="polite"></div>

                <div class="graph-filter-actions">
                    <button id="graph-filter-reset" type="button" class="btn btn-outline-danger btn-sm">Reset</button>
                    <button id="graph-filter-hide-all" type="button" class="btn btn-outline-secondary btn-sm">Hide All</button>
                    <button id="graph-filter-expand-all" type="button" class="btn btn-outline-secondary btn-sm">Expand All</button>
                    <button id="graph-filter-refresh" type="button" class="btn btn-outline-primary btn-sm">Refresh</button>
                </div>
            </div>
        </div>
    `,gr()}function hr(e){let t=document.getElementById(`graph-loading-state`);t&&(t.hidden=!e,t.classList.toggle(`d-none`,!e),t.setAttribute(`aria-hidden`,e?`false`:`true`))}function q(e,t,n,r){let i=document.getElementById(e);i&&i.addEventListener(t,()=>{n(i,K.filters),(r?J:yr)()})}function gr(){q(`graph-filter-search`,`input`,(e,t)=>{t.search=F(e.value)}),q(`graph-filter-include-children`,`change`,(e,t)=>{t.includeChildren=e.checked},!0),q(`graph-filter-effort`,`change`,(e,t)=>{t.effort=er(e.value)},!0),q(`graph-filter-stride`,`change`,(e,t)=>{t.stride=tr(e.value)},!0),q(`graph-filter-status`,`change`,(e,t)=>{t.status=Qn(e.value)},!0),q(`graph-filter-assignment`,`change`,(e,t)=>{t.assignment=$n(e.value)},!0);let e=document.getElementById(`graph-filter-reset`),t=document.getElementById(`graph-filter-hide-all`),n=document.getElementById(`graph-filter-expand-all`),r=document.getElementById(`graph-filter-refresh`);document.querySelectorAll(`[data-filter-type]`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target,n=!!t.checked,r=new Set(K.filters.types);if(!n&&P.every(e=>r.has(e))){let e=P.indexOf(t.value);if(e>=0)for(let t=e;t<P.length;t++){let e=P[t],n=document.querySelector(`[data-filter-type][value="${e}"]`);n&&(n.checked=!1),r.delete(e)}}else n?r.add(t.value):r.delete(t.value);let i=Zn(r);K.filters.types=i,vr(),J()})}),e&&e.addEventListener(`click`,()=>{K.filters=Yn(),Kn(),vr(),J()}),t&&t.addEventListener(`click`,()=>{Wn(),J(0)}),n&&n.addEventListener(`click`,()=>{Kn(),J(0)}),r&&r.addEventListener(`click`,()=>{Tr()})}var _r=[[`graph-filter-search`,`value`,`search`],[`graph-filter-include-children`,`checked`,`includeChildren`],[`graph-filter-effort`,`value`,`effort`],[`graph-filter-stride`,`value`,`stride`],[`graph-filter-status`,`value`,`status`],[`graph-filter-assignment`,`value`,`assignment`]];function vr(){_r.forEach(([e,t,n])=>{let r=document.getElementById(e);r&&(r[t]=K.filters[n])}),document.querySelectorAll(`[data-filter-type]`).forEach(e=>{e.checked=K.filters.types.has(e.value)})}function yr(){K.filterDebounceId&&window.clearTimeout(K.filterDebounceId),K.filterDebounceId=window.setTimeout(()=>{wr()},150)}function J(e=40){K.applyTimer&&window.clearTimeout(K.applyTimer),K.applyTimer=window.setTimeout(()=>{K.applyTimer=null,wr()},e)}function br(e){let t=document.getElementById(`graph-filter-summary`);if(!t)return;if(!K.rawTree){t.textContent=`Loading graph...`;return}if(e.visibleNodes===0){t.textContent=`No promises match the current filters.`;return}let n=`${e.visibleNodes} visible promise${e.visibleNodes===1?``:`s`}`,r=`${K.totalRenderableNodes} total promise${K.totalRenderableNodes===1?``:`s`}`;if(e.directMatches===e.visibleNodes){t.textContent=`Showing ${n} of ${r}${e.hiddenNodes>0?` (${e.hiddenNodes} hidden)`:``}.`;return}t.textContent=`Showing ${n} of ${r} (${e.directMatches} direct match${e.directMatches===1?``:`es`}${e.hiddenNodes>0?`, ${e.hiddenNodes} hidden`:``}).`}function xr(e){if(!e)return null;if(e._searchMatched)return e;for(let t of e.children??[]){let e=xr(t);if(e)return e}return null}function Sr(e,t,n){if(!e||!t||!n)return;let r=n.select(t);document.getElementById(`graph-zoom-in`)?.addEventListener(`click`,()=>{r.transition().duration(200).call(e.scaleBy,1.4)}),document.getElementById(`graph-zoom-out`)?.addEventListener(`click`,()=>{r.transition().duration(200).call(e.scaleBy,.7)}),document.getElementById(`graph-zoom-reset`)?.addEventListener(`click`,()=>{r.transition().duration(200).call(e.transform,n.zoomIdentity)}),document.getElementById(`graph-fullscreen-btn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`graph-viewport`);document.fullscreenElement?document.exitFullscreen?.()?.catch(()=>{}):e.requestFullscreen?.()?.catch(()=>{})})}function Cr(e,t,n,r=null,i=null,a=!1){let o=document.getElementById(`graph-content`),s=document.getElementById(`graph-viewport`);if(!o)return;K.contextMenu?.hide();let c=document.getElementById(`graph-animation-speed`);K.animationSpeed=c&&Number.parseFloat(c.value)||1;let l=Qe(o,t,n,{owner:K.owner,project:K.project,focusNodeId:i?.id??null,focusNodeData:i,animate:a,animationSpeed:K.animationSpeed,enableZoom:!0,compact:!1,renderRootCard:!0,restoreTransform:r,viewportElement:s,clipPathIdPrefix:`graph-card-clip`,emptyMessage:`No cards match the current filters.`,onZoom:(e,t={})=>{K.zoomTransform=e,t.user&&!K.suppressZoomStateUpdate&&(K.userZoomTransform=e)},onContextMenu:(e,t)=>{K.contextMenu?.open(e,t)}});l?.zoom&&(K.zoomBehavior=l.zoom,Sr(l.zoom,l.node,t))}function wr(){if(!K.rawTree||!K.d3)return;let e={visibleNodes:0,directMatches:0,hiddenNodes:0};K.filteredTree=ur(K.rawTree,K.filters,e,!0);let t=K.hasRendered;pr(K.filters);let n=document.getElementById(`graph-content`);if(K.filteredTree){let r=K.filters.search?xr(K.filteredTree):K.focusNodeId?Te(K.filteredTree,K.focusNodeId):K.userZoomTransform?null:K.filteredTree;Jn(`apply-filters-focus-selection`,{requestedFocusNodeId:K.focusNodeId,selectedFocusNodeId:r?.id??null,selectedFocusNodeType:r?.nodeType??null,hasUserZoomTransform:!!K.userZoomTransform,searchFilter:K.filters.search,includeChildren:K.filters.includeChildren,visibleNodeCount:e.visibleNodes,directMatches:e.directMatches,hiddenNodeCount:e.hiddenNodes});let i=r?null:K.userZoomTransform??K.zoomTransform;Cr(n,K.d3,K.filteredTree,i,r,t)}else Ye(n,`No cards match the current filters.`);K.hasRendered=!0,br(e)}async function Tr(){let e=document.getElementById(`error-text`),t=document.getElementById(`success-text`);hr(!0),e&&(e.textContent=``),t&&(t.textContent=``);try{let e=await Ge(K.owner,K.project),n={id:e.id??e.Id,name:e.name??e.Name,description:e.description??e.Description},r=(e.promises??e.Promises??[]).map(sr);K.rawTree=ye(r,K.owner,K.project,n),Un(),K.totalRenderableNodes=qe(K.rawTree),wr(),t&&(t.textContent=`Loaded ${r.length} top-level promise${r.length===1?``:`s`}.`)}catch(t){console.error(`Error loading project graph:`,t),e&&(e.textContent=`Unable to load the project graph.`)}finally{hr(!1)}}async function Er(e,t){let n=await ve(e,t);K.availableStrides=(Array.isArray(n)?n:[]).sort((e,t)=>{let n=new Date(e.startDate??0).getTime(),r=new Date(t.startDate??0).getTime();return n===r?Number(e.id)-Number(t.id):n-r})}async function Dr(e,t,n,r){let i=document.getElementById(`error-text`),a=document.getElementById(`success-text`);K.pageShowRefreshHandler&&=(window.removeEventListener(`pageshow`,K.pageShowRefreshHandler),null),K.owner=e,K.project=t,K.d3=window.d3,K.filters=dr(),K.focusNodeId=fr(),K.zoomTransform=null,K.userZoomTransform=null,K.suppressZoomStateUpdate=!1,K.rawTree=null,K.filteredTree=null,K.totalRenderableNodes=0,K.availableStrides=[],K.collapsedNodeIds=new Set,K.hasRendered=!1,K.contextMenu?.destroy(),K.contextMenu=Rn({owner:e,project:t,getAvailableStrides:()=>K.availableStrides,onGraphMutated:Tr,isNodeChildrenHidden:e=>Bn(e?.id),setNodeChildrenHidden:async(e,t)=>{let n=e?.id;n&&(Vn(n,t),J(0))},revealNextLevel:async e=>{Gn(e),J(0)},onProjectDeleted:()=>{window.location.assign(`/projects`)},permission:r}),K.pageShowRefreshHandler=e=>{e.persisted&&Tr()},window.addEventListener(`pageshow`,K.pageShowRefreshHandler),document.removeEventListener(`fullscreenchange`,K._onFullscreenChange),K._onFullscreenChange=()=>{let e=document.getElementById(`graph-fullscreen-btn`);if(!e)return;let t=e.querySelector(`i`);document.fullscreenElement?(t?.classList.replace(`bi-arrows-angle-expand`,`bi-arrows-angle-contract`),e.setAttribute(`aria-label`,`Exit fullscreen`)):(t?.classList.replace(`bi-arrows-angle-contract`,`bi-arrows-angle-expand`),e.setAttribute(`aria-label`,`Fullscreen`)),wr()},document.addEventListener(`fullscreenchange`,K._onFullscreenChange),await Er(e,t),mr(),vr(),i&&(i.textContent=``),a&&(a.textContent=``),hr(!0),await Tr()}function Or(e,{showEntity:t=!1}={}){return!e||e.length===0?m({icon:`bi-activity`,title:`No activity recorded yet.`,description:`Changes made to this project will appear here.`}):`
        <div class="table-responsive">
            <table class="table table-striped table-hover table-sm align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th scope="col">Time</th>
                        <th scope="col">User</th>
                        <th scope="col">Event Type</th>
                        <th scope="col">Change</th>
                        <th scope="col">Items Affected</th>
                        <th scope="col">Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${e.map(e=>`
        <tr>
            <td>
                <time class="audit-time" title="${l(Ar(e.occurredAtUtc))}">${l(jr(e.occurredAtUtc))}</time>
            </td>
            <td>${l(Ir(e))}</td>
            <td>${l(Lr(e))}</td>
            <td>${l(Rr(e))}</td>
            <td>${l(zr(e))}</td>
            <td>
                <a href="#" class="audit-show-details-link" data-audit-details="${l(Vr(e))}">show details</a>
            </td>
        </tr>
    `).join(``)}
                </tbody>
            </table>
        </div>
    `}function kr(){return`
        <div class="modal fade" id="audit-details-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="audit-details-modal-title">Audit details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="audit-details-modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `}function Ar(e){if(!e)return`Unknown`;let t=new Date(e);return Number.isNaN(t.getTime())?String(e):t.toLocaleString(void 0,{year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!0})}function jr(e){if(!e)return`Unknown`;let t=new Date(e);if(Number.isNaN(t.getTime()))return String(e);if(t.getTime()>Date.now())return`just now`;let n=Math.max(0,Math.round((Date.now()-t.getTime())/1e3)),r=n,i=new Intl.RelativeTimeFormat(void 0,{numeric:`auto`});for(let[e,t]of[[`year`,3600*24*365],[`month`,3600*24*30],[`week`,3600*24*7],[`day`,3600*24],[`hour`,3600],[`minute`,60],[`second`,1]])if(r>=t||e===`second`){let r=Math.round(n/t);return i.format(-r,e)}return i.format(0,`second`)}function Mr(e){return`${Lr(e)} ${zr(e)}`}function Nr(e){return`
        <dl class="row mb-0">
            <dt class="col-sm-3">Time</dt>
            <dd class="col-sm-9"><time title="${l(Ar(e.occurredAtUtc))}">${l(Ar(e.occurredAtUtc))}</time></dd>
            <dt class="col-sm-3">User</dt>
            <dd class="col-sm-9">${l(Ir(e))}</dd>
            <dt class="col-sm-3">Event Type</dt>
            <dd class="col-sm-9">${l(Lr(e))}</dd>
            <dt class="col-sm-3">Change</dt>
            <dd class="col-sm-9">${l(Rr(e))}</dd>
            <dt class="col-sm-3">Items Affected</dt>
            <dd class="col-sm-9">${l(zr(e))}</dd>
            <dt class="col-sm-3">Details</dt>
            <dd class="col-sm-9">${Fr(e.changes)}</dd>
        </dl>
    `}function Pr(e){return{title:Mr(e),html:Nr(e)}}function Fr(e){if(!Array.isArray(e)||e.length===0)return`<span class="text-muted">No field details</span>`;let t=e.filter(e=>!Br(e.fieldName));return t.length===0?`<span class="text-muted">No visible field changes</span>`:`<ul class="mb-0 ps-3">${t.map(e=>`
        <li>${l(e.fieldName)}: ${l(Hr(e.before))} → ${l(Hr(e.after))}</li>
    `).join(``)}</ul>`}function Ir(e){return e.actorEmail||e.actorSubject||e.actorUserId||`System`}function Lr(e){return e.actionType===`StatusChanged`?`Status Changed`:e.actionType===`Created`?`Created`:e.actionType===`Deleted`?`Deleted`:`Updated`}function Rr(e){let t=Array.isArray(e.changes)?e.changes.filter(e=>!Br(e.fieldName)):[];if(e.actionType===`StatusChanged`){let e=t.find(e=>e.fieldName===`Status`);if(e)return`${Hr(e.before)} → ${Hr(e.after)}`}return e.actionType===`Created`?`Created`:e.actionType===`Deleted`?`Deleted`:t.length===0?`Updated`:t.map(e=>e.fieldName).join(`, `)}function zr(e){return`${e.entityType} #${e.entityId}`}function Br(e){return String(e).toLowerCase()===`updatedat`}function Vr(e){return btoa(unescape(encodeURIComponent(JSON.stringify(Pr(e)))))}function Hr(e){return e==null||e===``?`blank`:typeof e==`object`?JSON.stringify(e):String(e)}function Y(e,t,n,r,i){let a=``,o=``;function s(a){t.innerHTML=a||``,t.style.display=``,e.style.display=`none`,r&&(r.style.display=`none`),n.style.display=``,i&&(i.style.display=`none`)}function c(){a=e.value,o=t.innerHTML,t.style.display=`none`,e.style.display=``,n.style.display=`none`,r&&(r.style.display=``),i&&(i.style.display=``),e.focus()}return t.style.display=``,e.style.display=`none`,n.style.display=``,r&&(r.style.display=`none`),i&&(i.style.display=`none`),n.addEventListener(`click`,c),i&&i.addEventListener(`click`,()=>{e.value=a,s(o)}),{showView:s,showSavedPopover(e){if(!r){s(e);return}if(typeof bootstrap<`u`&&bootstrap.Popover){let t=new bootstrap.Popover(r,{trigger:`manual`,placement:`top`,content:`Saved!`,customClass:`inline-edit-saved-popover`});t.show(),setTimeout(()=>{t.dispose(),s(e)},1500)}else s(e)}}}var X={};async function Z(e,n,r,i){try{let a=await t(`/api/comments/entity-map?parentType=${e}&parentId=${n}`);if(Object.keys(X).forEach(e=>delete X[e]),X._owner=r??null,X._project=i??null,Array.isArray(a))for(let e of a)X[`${e.entityType}-${e.sequenceNumber}`]={dbId:e.id,statusColor:e.statusColor}}catch{}}function Ur(e){let t=String(e??``).toLowerCase();return t.includes(`green`)?`🟢`:t.includes(`black`)||t.includes(`blocked`)?`⚫️`:t.includes(`orange`)||t.includes(`yellow`)||t.includes(`amber`)||t.includes(`inprogress`)||t.includes(`in-progress`)?`🟠`:t.includes(`red`)||t.includes(`todo`)?`🔴`:`⚪`}function Q(e){let t=l(e);return t=t.replace(/#(promise|epic|journey|flow|moment)-(\d+)/g,(e,t,n)=>{let r=X[`${t}-${n}`],i=X._owner,a=X._project,o=`${t}s`;if(r!=null){let t=Ur(r.statusColor);return i&&a?`<a href="/${i}/${a}/${o}/${n}" class="promise-ref">${e} ${t}</a>`:`<a href="/${o}/${r.dbId}" class="promise-ref">${e} ${t}</a>`}return i&&a?`<a href="/${i}/${a}/${o}/${n}" class="promise-ref promise-ref--legacy">${e}</a>`:`<a href="/${o}/${n}" class="promise-ref promise-ref--legacy">${e}</a>`}),t=t.replace(/@(\w+)/g,`<span class="mention">@$1</span>`),t}function Wr(e,t,n,r,i){let a=document.getElementById(`project-settings-form`),o=document.getElementById(`project-title-input`),s=document.getElementById(`project-description-input`),c=document.getElementById(`project-summary-panel`),u=document.getElementById(`project-summary-loading`),d=document.getElementById(`error-text`),f=document.getElementById(`success-text`),p=document.getElementById(`export-project-btn`),m=document.getElementById(`delete-project-btn`),g=document.getElementById(`delete-project-btn-spinner`),_=document.getElementById(`delete-project-btn-label`),v=document.getElementById(`project-delete-confirmation-input`),y=document.getElementById(`project-delete-confirmation-text`),b=document.getElementById(`save-project-settings-btn`),x=document.getElementById(`project-title-view`),S=document.getElementById(`edit-project-title-btn`),C=document.getElementById(`project-description-view`),w=document.getElementById(`edit-project-desc-btn`),T=null,E=null;o&&x&&S&&(T=Y(o,x,S)),s&&C&&w&&(E=Y(s,C,w,b));function ee(){let e=i?.permission===`Edit`,t=i?.isOwner===!0;if(!e){let e=document.getElementById(`edit-project-title-btn`),t=document.getElementById(`edit-project-desc-btn`),n=document.getElementById(`save-project-settings-btn`),r=document.getElementById(`project-title-input`),i=document.getElementById(`project-description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0),i&&(i.disabled=!0)}if(!t){let e=document.querySelector(`.detail-card:last-child`);if(e){let t=e.querySelector(`#delete-project-btn`),n=e.querySelector(`#project-delete-confirmation-input`);t&&(t.disabled=!0,t.title=`Only the project owner can delete this project.`),n&&(n.disabled=!0)}}}let D=null,O={counts:{promises:0,epics:0,journeys:0,flows:0,moments:0,totalPromises:0},memberCount:0,firstPromise:null},k=null,A=null;if(!a||!o||!s||!c||!u||!d||!f||!p||!m||!v||!y)return;function j(){d.textContent=``,f.textContent=``}function M(e){u.hidden=!e,c.hidden=e}function te(){if(typeof bootstrap>`u`||!bootstrap.Popover){f.textContent=`Exported!`,window.setTimeout(()=>{f.textContent===`Exported!`&&(f.textContent=``)},2e3);return}A||=new bootstrap.Popover(p,{trigger:`manual`,placement:`top`,content:`Exported!`}),A.show(),k&&window.clearTimeout(k),k=window.setTimeout(()=>{A?.hide()},2e3)}function ne(e){return`delete ${e}`}function re(e){let t=ne(e);y.textContent=t,v.value=``,m.disabled=!0,m.dataset.confirmationPhrase=t}function ie(e){m.disabled=e,g.classList.toggle(`d-none`,!e),_.textContent=e?`Deleting Project...`:`Delete Project`}function ae(){let e=m.dataset.confirmationPhrase||``;m.disabled=v.value!==e}function oe(e,t,n){tt(c,[{label:`Created`,value:Kr(e.createdAt)},{label:`Team Members`,value:n},{label:`Promises`,value:t.promises},{label:`Epics`,value:t.epics},{label:`Journeys`,value:t.journeys},{label:`Flows`,value:t.flows},{label:`Moments`,value:t.moments},{label:`Total Promises`,value:t.totalPromises}])}async function se(e){M(!0);try{let[t,i]=await Promise.all([Ge(n,r),ge(n,r).catch(()=>[])]),a=(t.promises??[]).flatMap(e=>e.epics??[]),o=a.flatMap(e=>e.journeys??[]),s=o.flatMap(e=>e.flows??[]),c=s.flatMap(e=>e.moments??[]);O={counts:{promises:(t.promises??[]).length,epics:a.length,journeys:o.length,flows:s.length,moments:c.length,totalPromises:(t.promises??[]).length+a.length+o.length+s.length+c.length},memberCount:i.length,firstPromise:(t.promises??[])[0]??null},oe(e,O.counts,O.memberCount)}catch(t){O={counts:{promises:0,epics:0,journeys:0,flows:0,moments:0,totalPromises:0},memberCount:0,firstPromise:null},oe(e,O.counts,O.memberCount),console.warn(`Failed to load project summary:`,t)}finally{M(!1)}}async function ce(){try{let e=await Je(n,r);D=e,o.value=e.name??``,s.value=e.description??``,T&&T.showView(l(e.name??``)),E&&E.showView(Q(e.description??``)),re(e.name??``),await se(e),O.firstPromise&&H(s,`Promise`,O.firstPromise.id)}catch(e){d.textContent=`Failed to load project settings.`,console.error(e)}}a.addEventListener(`submit`,async e=>{e.preventDefault(),j();let t=o.value.trim(),i=s.value.trim();if(!t){d.textContent=`Project title is required.`;return}try{let e=await Oe(n,r,{name:t,description:i||null});D=e,o.value=e.name??``,s.value=e.description??``,T&&T.showView(l(e.name??``)),E&&E.showSavedPopover(Q(e.description??``)),re(e.name??``),oe(e,O.counts,O.memberCount),f.textContent=`Project settings saved.`}catch(e){d.textContent=e.message||`Failed to save project settings.`}}),v.addEventListener(`input`,ae),p.addEventListener(`click`,async()=>{j();try{Gr(await Ae(n,r),`project-${n}-${r}-export.json`),te()}catch(e){d.textContent=e.message||`Failed to export project.`}}),m.addEventListener(`click`,async()=>{if(j(),!D){d.textContent=`Project is not loaded yet.`;return}if(v.value!==m.dataset.confirmationPhrase){d.textContent=`Type the exact confirmation phrase to delete the project.`;return}ie(!0);try{await Ue(n,r),h(`/projects`,e,t)}catch(e){d.textContent=e.message||`Failed to delete project.`}finally{ie(!1)}}),ee(),ce()}function Gr(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),1e3)}function Kr(e){return Ar(e)}var qr=25;function Jr(e,t,n,r){let i=document.getElementById(`project-title`),a=document.getElementById(`error-text`),o=document.getElementById(`audit-history-list`),s=document.getElementById(`audit-history-loading`),c=document.getElementById(`audit-history-pagination`),l=document.getElementById(`back-to-projects-btn`),u=`project-history-audit-modal-container`,d=1,f=0,p=!1,m=0;if(!i||!a||!o||!s||!c||!l)return;y();async function g(){try{let e=await Je(n,r);i.textContent=e?.name?`${e.name} activity`:`Project ${n}/${r} activity`}catch{i.textContent=`Project ${n}/${r} activity`}}function _(){return Math.max(1,Math.ceil(m/qr))}function v(){let e=_(),t=d<=1,n=d>=e;c.innerHTML=`
            <nav aria-label="Audit history pages">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item ${t?`disabled`:``}">
                        <button class="page-link" type="button" data-page-action="previous" ${t?`disabled`:``}>Previous</button>
                    </li>
                    <li class="page-item active" aria-current="page">
                        <span class="page-link">Page ${d} of ${e}</span>
                    </li>
                    <li class="page-item ${n?`disabled`:``}">
                        <button class="page-link" type="button" data-page-action="next" ${n?`disabled`:``}>Next</button>
                    </li>
                </ul>
            </nav>
        `,c.querySelectorAll(`[data-page-action]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.pageAction;n===`previous`&&d>1&&(--d,x()),n===`next`&&d<e&&(d+=1,x())})})}function y(){let e=document.getElementById(u);e||(e=document.createElement(`div`),e.id=u,document.body.appendChild(e)),e.innerHTML=kr()}function b(e){let t=Pr(e),n=document.getElementById(`audit-details-modal-title`),r=document.getElementById(`audit-details-modal-body`),i=document.getElementById(`audit-details-modal`);!n||!r||!i||(n.textContent=t.title,r.innerHTML=t.html,typeof bootstrap<`u`&&bootstrap.Modal&&bootstrap.Modal.getOrCreateInstance(i).show())}async function x(e=!1){if(!p){p=!0,a.textContent=``,e&&(d=1,f=0,o.innerHTML=``),s.hidden=!1,o.hidden=!0;try{f=(d-1)*qr;let{items:e,totalCount:t}=await ze(n,r,qr,f);m=t,o.innerHTML=Or(e,{showEntity:!0}),S(e),v()}catch(t){e?o.innerHTML=`<p class="text-danger mb-0">Failed to load audit history.</p>`:a.textContent=`Failed to load more audit history.`,console.warn(`Failed to load project audit history page:`,t)}finally{p=!1,s.hidden=!0,o.hidden=!1}}}function S(e){o.querySelectorAll(`.audit-show-details-link`).forEach((t,n)=>{t.addEventListener(`click`,t=>{t.preventDefault(),b(e[n])})})}g().then(()=>x(!0)),l.addEventListener(`click`,()=>{h(`/projects`,e,t)})}function Yr(e,{headers:t,items:n,emptyMessage:r,emptyConfig:i,renderItemRow:a,renderAddRow:o=()=>``}){let s=t.length,c=n&&n.length?n.map(a).join(``):i?v({colspan:s,...i}):`<tr class="inline-table-empty-row"><td class="no-items" colspan="${s}">${l(r)}</td></tr>`,u=o?o():``;return e.innerHTML=`
        <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle mb-0 promisemodel-table">
            <thead class="table-light">
                <tr>${t.map(e=>`<th>${l(e)}</th>`).join(``)}</tr>
            </thead>
            <tbody>
                ${c}
                ${u}
            </tbody>
        </table>
        </div>
    `,e.querySelector(`tbody`)}function Xr(e,t){let n=e.querySelector(`tr[data-inline-add-row="1"]`);if(n){e.insertBefore(t,n);return}e.appendChild(t)}function Zr(e){e.querySelector(`.inline-table-empty-row`)?.remove()}var Qr=(e,n,r,i)=>t(`/api/comments?type=${r}&parentId=${i}`),$r=(e,t,n)=>r(`/api/comments`,n),ei={View:0,Comment:1,Edit:2,Owner:3};function ti(e,t){return(ei[e]??0)>=(ei[t]??0)}async function $(e,t){try{let n=await Se(e,t);return n?typeof n==`string`?{permission:n,isOwner:n===`Owner`}:{permission:n.permission??null,isOwner:n.isOwner===!0}:{permission:null,isOwner:!1}}catch{return{permission:null,isOwner:!1}}}function ni(e,t,n,r,i,a){let o=ti(a?.permission,`Comment`);e.innerHTML=`
        <h3>Comments</h3>
        <div id="comments-list" class="comments-list"></div>
        ${o?`
        <form id="comment-form" class="comment-form" aria-label="Add a comment">
            <label for="comment-textarea" class="sr-only">Your comment</label>
            <textarea id="comment-textarea" class="form-control mb-2" rows="3" required placeholder="Write a comment... Use @name to mention someone, #type-id to reference a promise/epic/journey/flow/moment."></textarea>
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>`:``}
    `;let s=e.querySelector(`#comments-list`),c=e.querySelector(`#comment-form`),l=e.querySelector(`#comment-textarea`);l&&H(l,t,n);let u=Z(t,n,r,i);Promise.all([Qr(r,i,t,n),u]).then(([e])=>ri(s,e,o)).catch(()=>{s.removeAttribute(`role`),s.removeAttribute(`aria-label`),s.innerHTML=`<p class="error">Failed to load comments.</p>`}),c&&c.addEventListener(`submit`,async e=>{e.preventDefault();let a=l.value.trim();if(a)try{let e=window.scrollY;ii(s,await $r(r,i,{parentType:t,parentId:n,text:a})),l.value=``,window.scrollTo(0,e)}catch(e){alert(`Failed to post comment.`),console.error(e)}})}function ri(e,t,n){if(e.innerHTML=``,!t||t.length===0){e.innerHTML=m({icon:`bi-chat-dots`,title:`No comments yet.`,description:n?`Be the first to share your thoughts.`:``});return}t.forEach(t=>e.appendChild(ai(t)))}function ii(e,t){let n=e.querySelector(`.no-items`);n&&n.remove(),e.appendChild(ai(t))}function ai(e){let t=document.createElement(`div`);return t.className=`comment-item`,t.innerHTML=`
        <div class="comment-meta">
            <strong>${l(e.userName||e.authorName||`Unknown`)}</strong> – ${new Date(e.createdAt).toLocaleString(`en-CA`)}
        </div>
        <div class="comment-text">${Q(e.text)}</div>
        ${e.mentionedUsers&&e.mentionedUsers.length?`<div class="comment-mentions">Mentions: ${e.mentionedUsers.join(`, `)}</div>`:``}
        ${e.replies&&e.replies.length?`<div class="comment-replies">${e.replies.map(e=>`
            <div class="comment-item reply">
                <strong>${l(e.userName||e.authorName||`Unknown`)}</strong>: ${l(e.text)}
            </div>
        `).join(``)}</div>`:``}
    `,t}var oi=(e,n,r,i)=>t(`/api/reactions?type=${r}&itemId=${i}`),si=(e,t,n)=>r(`/api/reactions`,n),ci=(e,t,n)=>w(`/api/reactions/${n}`,{});function li(){return e()}var ui=[`👍`,`👎`,`❤️`,`😀`,`🎉`,`🚀`,`👀`];function di(e,t,n,r,i,a){e.innerHTML=`
        <div class="reactions-bar">
            <span class="reactions-summary" id="reactions-summary"></span>
            ${a?.permission===`Comment`||a?.permission===`Edit`?`<span class="reactions-picker">
                ${ui.map(e=>`<button class="btn btn-outline-secondary btn-sm emote-btn" data-emote="${e}" title="${e}" aria-label="React with ${e}">${e}</button>`).join(``)}
            </span>`:``}
        </div>
    `;let o=e.querySelector(`#reactions-summary`),s=e.querySelectorAll(`.emote-btn`),c=li(),l={counts:{},myReactionId:null,myEmote:null};function u(){o.textContent=ui.filter(e=>l.counts[e]).map(e=>`${e} ${l.counts[e]}`).join(` `)||`No reactions yet.`}async function d(){try{let e=await oi(r,i,t,n);if(l.counts={},(e||[]).forEach(e=>{l.counts[e.emote]=(l.counts[e.emote]||0)+1}),c){let t=(e||[]).find(e=>String(e.userName)===String(c));l.myReactionId=t?.id??null,l.myEmote=t?.emote??null}u()}catch{o.textContent=`Failed to load reactions.`}}d(),s.forEach(e=>{e.addEventListener(`click`,async()=>{let a=e.dataset.emote;try{let e=window.scrollY,o=l.myReactionId?await ci(r,i,l.myReactionId,a):await si(r,i,{parentType:t,parentId:n,emote:a}),s=l.myEmote,c=o?.emote??a;s&&s!==c&&(l.counts[s]=Math.max(0,(l.counts[s]||0)-1)),(!s||s!==c)&&(l.counts[c]=(l.counts[c]||0)+1),l.myReactionId=o?.id??l.myReactionId,l.myEmote=c,u(),window.scrollTo(0,e)}catch{alert(`Failed to react`)}})})}function fi(){let e=document.getElementById(`back-link`);e&&e.addEventListener(`click`,()=>window.history.back())}function pi(e,t,n,r,i,a){let o=document.getElementById(`${t.toLowerCase()}-comments`);o&&ni(o,t,n,r,i,a);let s=document.getElementById(`reactions-section`);s||(s=document.createElement(`div`),s.id=`reactions-section`),e&&(s.parentNode||e.appendChild(s),di(s,t,n,r,i,a))}function mi(e,t,n,r,i,a){let o=document.getElementById(`promise-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`promise-detail-loading`);Le(),c&&(c.hidden=!1),s.textContent=``,M(e,t,n).then(n=>Promise.all([Promise.resolve(n),Z(`Promise`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),o.innerHTML=`
                <div class="detail-card promise-detail-card">
                    <h2>${l(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${Q(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${l(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr><th scope="row">Status</th><td>${de(s.statusColor)}</td></tr>
                        <tr><th scope="row">Created</th><td>${new Date(s.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Updated</th><td>${s.updatedAt?new Date(s.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                    </table>
                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics…</p>
                    </div>
                    <div id="promise-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `,c&&(c.hidden=!0);let u=document.getElementById(`description-input`),d=document.getElementById(`description-view`),f=document.getElementById(`edit-desc-btn`),p=document.getElementById(`save-desc`),m=document.getElementById(`cancel-desc`),g=null;u&&d&&f&&(H(u,`Promise`,s.id),g=Y(u,d,f,p,m)),ke({nodeType:`promise`,nodeId:n,owner:e,project:t});let _=document.getElementById(`promise-epics-list`);me(e,t,n).then(a=>{N(`promise-${s.sequenceNumber}`,a);let c=Yr(_,{headers:[`Statement`,`Actions`],items:a||[],emptyMessage:`No epics found for this promise.`,renderItemRow:n=>`
                            <tr data-epic-id="${n.id}">
                                <td>${l(n.statement)}</td>
                                <td><a href="/${e}/${t}/epics/${n.sequenceNumber}" epic-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,renderAddRow:()=>`
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-epic-form" class="inline-add-form">
                                        <input id="add-epic-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Epic Statement..." aria-label="New epic statement">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-epic-submit" type="submit" form="add-epic-form" class="btn btn-sm btn-outline-primary">Add</button>
                                    <span id="add-epic-msg"></span>
                                </td>
                            </tr>
                        `}),u=_.querySelector(`#add-epic-form`),d=_.querySelector(`#add-epic-statement`),f=_.querySelector(`#add-epic-msg`),p=_.querySelector(`#add-epic-submit`);u&&d&&f&&p&&u.addEventListener(`submit`,async r=>{r.preventDefault(),f.textContent=``;let i=d.value.trim();if(!i){f.textContent=`Statement is required.`;return}p.disabled=!0;try{let r=await A(e,t,{statement:i,productPromiseId:n,displayOrder:(a||[]).length+1});if(r){Zr(c);let n=document.createElement(`tr`);n.dataset.epicId=r.id,n.innerHTML=`
                                        <td>${l(r.statement)}</td>
                                        <td><a href="/${e}/${t}/epics/${r.sequenceNumber}" epic-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,Xr(c,n),d.value=``,N(`promise-${s.sequenceNumber}`,[...a||[],r])}}catch(e){f.textContent=`Failed to add epic.`,console.error(e)}finally{p.disabled=!1}}),_.innerHTML=`
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th scope="col">Statement</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${a.map(n=>`
                                    <tr>
                                        <td>${l(n.statement)}</td>
                                        <td><a href="/${e}/${t}/epics/${n.sequenceNumber}" epic-id="${n.id}" epic-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,o.querySelectorAll(`a[epic-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),h(`/${e}/${t}/epics/${n.getAttribute(`epic-seq`)}`,r,i))})})}).catch(()=>{_.innerHTML=`<p class="error">Failed to load epics.</p>`}),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-epic-statement`),i=document.getElementById(`add-epic-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`)}})(),pi(o,`Promise`,s.id,e,t,a);let{owner:v,project:y}=rt();v&&y&&it(o,L(v,y,`promise-${s.sequenceNumber}`)),fi();let b=document.getElementById(`desc-save-msg`);p&&p.addEventListener(`click`,async r=>{r.preventDefault(),b.textContent=``,p.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await he(e,t,n,i))?.description??(i.trim()?i:null),I(`promise-${s.sequenceNumber}`,{description:s.description}),g&&g.showSavedPopover(Q(s.description||``))}catch(e){b.textContent=`Save failed`,console.error(e)}finally{p.disabled=!1}}),c&&(c.hidden=!0)}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load promise details.`,console.error(e)})}function hi(e,t,n,r,i,a){let o=document.getElementById(`epic-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`epic-detail-loading`);Le(),c&&(c.hidden=!1),s.textContent=``,te(e,t,n).then(n=>Promise.all([Promise.resolve(n),Z(`Epic`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),ke({nodeType:`epic`,nodeId:n,owner:e,project:t}),o.innerHTML=`
                <div class="detail-card epic-detail-card">
                    <h2>${l(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${Q(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${l(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Parent Promise</th>
                            <td id="epic-parent-promise">Loading…</td>
                        </tr>
                        <tr><th scope="row">Status</th><td>${de(s.statusColor)}</td></tr>
                        <tr><th scope="row">Created</th><td>${new Date(s.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Updated</th><td>${s.updatedAt?new Date(s.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                    </table>
                    <h3>Journeys</h3>
                    <div id="epic-journeys-list">
                        <p>Loading journeys…</p>
                    </div>
                    <div id="epic-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `;let u=document.getElementById(`description-input`),d=document.getElementById(`description-view`),f=document.getElementById(`edit-desc-btn`),p=document.getElementById(`save-desc`),m=document.getElementById(`cancel-desc`),g=null;u&&d&&f&&(H(u,`Epic`,s.id),g=Y(u,d,f,p,m));let _=document.getElementById(`epic-parent-promise`);pe(e,t,s.productPromiseId).then(n=>{let a=D(n.statusColor),o=Xe(n.statusColor);_.innerHTML=`<a href="/${e}/${t}/promises/${n.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${l(n.statement)}</a> <span aria-hidden="true">${a}</span><span class="sr-only">${o}</span>`;let s=_.querySelector(`a.detail-link`);s&&s.addEventListener(`click`,e=>{e.ctrlKey||e.metaKey||e.button===1||(e.preventDefault(),h(s.getAttribute(`href`),r,i))})}).catch(()=>{_.textContent=`Promise ${s.productPromiseId}`});let v=document.getElementById(`epic-journeys-list`);ue(e,t,n).then(a=>{N(`epic-${s.sequenceNumber}`,a);let o=Yr(v,{headers:[`Statement`,`Actions`],items:a||[],emptyMessage:`No journeys found for this epic.`,renderItemRow:n=>`
                            <tr data-journey-id="${n.id}">
                                <td>${l(n.statement)}</td>
                                <td><a href="/${e}/${t}/journeys/${n.sequenceNumber}" journey-id="${n.id}" journey-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,renderAddRow:()=>`
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-journey-form" class="inline-add-form">
                                        <input id="add-journey-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Journey Statement..." aria-label="New journey statement">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-journey-submit" type="submit" form="add-journey-form" class="btn btn-sm btn-outline-primary">Add</button>
                                    <span id="add-journey-msg"></span>
                                </td>
                            </tr>
                        `}),c=v.querySelector(`#add-journey-form`),u=v.querySelector(`#add-journey-statement`),d=v.querySelector(`#add-journey-msg`),f=v.querySelector(`#add-journey-submit`);c&&u&&d&&f&&c.addEventListener(`submit`,async r=>{r.preventDefault(),d.textContent=``;let i=u.value.trim();if(!i){d.textContent=`Statement is required.`;return}f.disabled=!0;try{let r=await E(e,t,{statement:i,epicId:n,displayOrder:(a||[]).length+1});if(r){Zr(o);let n=document.createElement(`tr`);n.dataset.journeyId=r.id,n.innerHTML=`
                                        <td>${l(r.statement)}</td>
                                        <td><a href="/${e}/${t}/journeys/${r.sequenceNumber}" journey-id="${r.id}" journey-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,Xr(o,n),u.value=``,N(`epic-${s.sequenceNumber}`,[...a||[],r])}}catch(e){d.textContent=`Failed to add journey.`,console.error(e)}finally{f.disabled=!1}}),v.innerHTML=`
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${a.map(n=>`
                                    <tr>
                                        <td>${l(n.statement)}</td>
                                        <td><a href="/${e}/${t}/journeys/${n.sequenceNumber}" journey-id="${n.id}" journey-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,v.querySelectorAll(`a[journey-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),h(`/${e}/${t}/journeys/${n.getAttribute(`journey-seq`)}`,r,i))})})}).catch(()=>{v.innerHTML=`<p class="error">Failed to load journeys.</p>`}),fi(),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-journey-statement`),i=document.getElementById(`add-journey-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`)}})(),pi(o,`Epic`,s.id,e,t,a);let y=document.getElementById(`desc-save-msg`);p&&p.addEventListener(`click`,async r=>{r.preventDefault(),y.textContent=``,p.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await $e(e,t,n,i))?.description??(i.trim()?i:null),I(`epic-${s.sequenceNumber}`,{description:s.description}),g&&g.showSavedPopover(Q(s.description||``))}catch(e){y.textContent=`Save failed`,console.error(e)}finally{p.disabled=!1}});let{owner:b,project:x}=rt();b&&x&&it(o,L(b,x,`epic-${s.sequenceNumber}`))}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load epic details.`,console.error(e)})}function gi(e,t,n,r,i,a){let o=document.getElementById(`journey-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`journey-detail-loading`);Le(),c&&(c.hidden=!1),s.textContent=``,ae(e,t,n).then(n=>Promise.all([Promise.resolve(n),Z(`Journey`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),ke({nodeType:`journey`,nodeId:n,owner:e,project:t}),o.innerHTML=`
                <div class="detail-card journey-detail-card">
                    <h2>${l(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${Q(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${l(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Epic</th>
                            <td id="journey-epic-cell">
                                <a href="/${e}/${t}/epics/${s.epicId}" class="detail-link link-primary text-decoration-none fw-semibold">Epic ${s.epicId}</a>
                            </td>
                        </tr>
                        <tr><th scope="row">Status</th><td>${de(s.statusColor)}</td></tr>
                        <tr><th scope="row">Created</th><td>${new Date(s.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Updated</th><td>${s.updatedAt?new Date(s.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                    </table>
                    <h3>Flows</h3>
                    <div id="journey-flows-list">
                        <p>Loading flows...</p>
                    </div>
                    <div id="journey-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `;let u=document.getElementById(`description-input`),d=document.getElementById(`description-view`),f=document.getElementById(`edit-desc-btn`),p=document.getElementById(`save-desc`),m=document.getElementById(`cancel-desc`),g=null;u&&d&&f&&(H(u,`Journey`,s.id),g=Y(u,d,f,p,m));let _=o.querySelector(`a.detail-link[epic-id]`);_&&_.addEventListener(`click`,n=>{n.ctrlKey||n.metaKey||n.button===1||(n.preventDefault(),h(`/${e}/${t}/epics/${_.getAttribute(`epic-seq`)}`,r,i))});let v=document.getElementById(`journey-flows-list`);je(e,t,n).then(a=>{N(`journey-${s.sequenceNumber}`,a);let o=Yr(v,{headers:[`Statement`,`Actions`],items:a||[],emptyMessage:`No flows found for this journey.`,renderItemRow:n=>`
                            <tr data-flow-id="${n.id}">
                                <td>${l(n.statement)}</td>
                                <td><a href="/${e}/${t}/flows/${n.sequenceNumber}" flow-id="${n.id}" flow-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,renderAddRow:()=>`
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-flow-form" class="inline-add-form">
                                        <input id="add-flow-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Flow Statement..." aria-label="New flow statement">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-flow-submit" type="submit" form="add-flow-form" class="btn btn-sm btn-outline-primary">Add</button>
                                    <span id="add-flow-msg"></span>
                                </td>
                            </tr>
                        `}),c=v.querySelector(`#add-flow-form`),u=v.querySelector(`#add-flow-statement`),d=v.querySelector(`#add-flow-msg`),f=v.querySelector(`#add-flow-submit`);c&&u&&d&&f&&c.addEventListener(`submit`,async r=>{r.preventDefault(),d.textContent=``;let i=u.value.trim();if(!i){d.textContent=`Statement is required.`;return}f.disabled=!0;try{let r=await k(e,t,{statement:i,journeyId:n,displayOrder:(a||[]).length+1});if(r){Zr(o);let n=document.createElement(`tr`);n.dataset.flowId=r.id,n.innerHTML=`
                                        <td>${l(r.statement)}</td>
                                        <td><a href="/${e}/${t}/flows/${r.sequenceNumber}" flow-id="${r.id}" flow-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,Xr(o,n),u.value=``,N(`journey-${s.sequenceNumber}`,[...a||[],r])}}catch(e){d.textContent=`Failed to add flow.`,console.error(e)}finally{f.disabled=!1}}),v.innerHTML=`
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${a.map(n=>`
                                    <tr>
                                        <td>${l(n.statement)}</td>
                                        <td><a href="/${e}/${t}/flows/${n.sequenceNumber}" flow-id="${n.id}" flow-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,v.querySelectorAll(`a[flow-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),h(`/${e}/${t}/flows/${n.getAttribute(`flow-seq`)}`,r,i))})})}).catch(()=>{v.innerHTML=`<p class="error">Failed to load flows.</p>`}),fi();let y=document.getElementById(`journey-epic-cell`);ie(e,t,s.epicId).then(n=>{let a=D(n.statusColor),o=Xe(n.statusColor);y.innerHTML=`<a href="/${e}/${t}/epics/${n.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${l(n.statement)}</a> <span aria-hidden="true">${a}</span><span class="sr-only">${o}</span>`;let s=y.querySelector(`a.detail-link`);s&&s.addEventListener(`click`,e=>{e.ctrlKey||e.metaKey||e.button===1||(e.preventDefault(),h(s.getAttribute(`href`),r,i))})}).catch(()=>{});let b=document.getElementById(`desc-save-msg`);p&&p.addEventListener(`click`,async r=>{r.preventDefault(),b.textContent=``,p.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await ce(e,t,n,i))?.description??(i.trim()?i:null),I(`journey-${s.sequenceNumber}`,{description:s.description}),g&&g.showSavedPopover(Q(s.description||``))}catch(e){b.textContent=`Save failed`,console.error(e)}finally{p.disabled=!1}}),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-flow-statement`),i=document.getElementById(`add-flow-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`)}})(),pi(o,`Journey`,s.id,e,t,a);let{owner:x,project:S}=rt();x&&S&&it(o,L(x,S,`journey-${s.sequenceNumber}`)),c&&(c.hidden=!0)}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load journey details.`,console.error(e)})}function _i(e,t,n,r,i,a){let o=document.getElementById(`flow-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`flow-detail-loading`);Le(),c&&(c.hidden=!1),s.textContent=``,O(e,t,n).then(n=>Promise.all([Promise.resolve(n),Z(`Flow`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),ke({nodeType:`flow`,nodeId:n,owner:e,project:t}),o.innerHTML=`
                <div class="detail-card flow-detail-card">
                    <h2>${l(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${Q(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${l(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Journey</th>
                            <td id="flow-journey-cell">
                                <a href="/${e}/${t}/journeys/${s.journeyId}" class="detail-link link-primary text-decoration-none fw-semibold">Journey ${s.journeyId}</a>
                            </td>
                        </tr>
                        <tr><th scope="row">Status</th><td>${de(s.statusColor)}</td></tr>
                        <tr><th scope="row">Created</th><td>${new Date(s.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Updated</th><td>${s.updatedAt?new Date(s.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                    </table>
                    <h3>Moments</h3>
                    <div id="flow-moments-list">
                        <p>Loading moments...</p>
                    </div>
                    <div id="flow-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `;let u=document.getElementById(`description-input`),d=document.getElementById(`description-view`),f=document.getElementById(`edit-desc-btn`),m=document.getElementById(`save-desc`),g=document.getElementById(`cancel-desc`),_=null;u&&d&&f&&(H(u,`Flow`,s.id),_=Y(u,d,f,m,g));let v=o.querySelector(`.detail-link[journey-id]`);v&&v.addEventListener(`click`,n=>{n.ctrlKey||n.metaKey||n.button===1||(n.preventDefault(),h(`/${e}/${t}/journeys/${v.getAttribute(`journey-seq`)}`,r,i))});let b=document.getElementById(`flow-moments-list`);se(e,t,n).then(a=>{N(`flow-${s.sequenceNumber}`,a);let o=Yr(b,{headers:[`Statement`,`Type`,`Status`,`Actions`],items:a||[],emptyMessage:`No moments found for this flow.`,renderItemRow:n=>`
                            <tr data-moment-id="${n.sequenceNumber}">
                                <td>${l(n.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${n.sequenceNumber}" data-current-type="${n.type}" aria-label="Moment type"><option value="Story" ${n.type===`Story`?`selected`:``}>Story</option><option value="Job" ${n.type===`Job`?`selected`:``}>Job</option></select></td>
                                <td><span class="status-badge status-${(n.status||``).toLowerCase()}">${n.status}</span></td>
                                <td><a href="/${e}/${t}/moments/${n.sequenceNumber}" moment-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,renderAddRow:()=>`
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-moment-form" class="inline-add-form">
                                        <input id="add-moment-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Moment Statement..." aria-label="New moment statement">
                                    </form>
                                </td>
                                <td>
                                    <select id="add-moment-type" class="form-select form-select-sm" form="add-moment-form">
                                        <option value="Story">Story</option>
                                        <option value="Job">Job</option>
                                    </select>
                                </td>
                                <td><span class="status-badge status-todo">Todo</span></td>
                                <td>
                                    <button id="add-moment-submit" type="submit" form="add-moment-form" class="btn btn-sm btn-outline-primary">Add</button>
                                    <span id="add-moment-msg"></span>
                                </td>
                            </tr>
                        `}),c=b.querySelector(`#add-moment-form`),u=b.querySelector(`#add-moment-statement`),d=b.querySelector(`#add-moment-type`),f=b.querySelector(`#add-moment-msg`),m=b.querySelector(`#add-moment-submit`);c&&u&&d&&f&&m&&c.addEventListener(`submit`,async r=>{r.preventDefault(),f.textContent=``;let i=u.value.trim();if(!i){f.textContent=`Statement is required.`;return}m.disabled=!0;try{let r=await y(e,t,{statement:i,flowId:n,type:d.value,status:`Todo`,displayOrder:(a||[]).length+1});if(r){Zr(o);let n=document.createElement(`tr`);n.dataset.momentId=r.id,n.innerHTML=`
                                        <td>${l(r.statement)}</td>
                                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${r.sequenceNumber}" data-current-type="${r.type}" aria-label="Moment type"><option value="Story" ${r.type===`Story`?`selected`:``}>Story</option><option value="Job" ${r.type===`Job`?`selected`:``}>Job</option></select></td>
                                        <td><span class="status-badge status-${(r.status||``).toLowerCase()}">${r.status}</span></td>
                                        <td><a href="/${e}/${t}/moments/${r.sequenceNumber}" moment-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,Xr(o,n),u.value=``,d.value=`Story`,N(`flow-${s.sequenceNumber}`,[...a||[],r])}}catch(e){f.textContent=`Failed to add moment.`,console.error(e)}finally{m.disabled=!1}}),b.innerHTML=`
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th>Statement</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${a.map(n=>`
                                    <tr data-moment-id="${n.sequenceNumber}">
                                        <td>${l(n.statement)}</td>
                                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${n.sequenceNumber}" data-current-type="${n.type}" aria-label="Moment type"><option value="Story" ${n.type===`Story`?`selected`:``}>Story</option><option value="Job" ${n.type===`Job`?`selected`:``}>Job</option></select></td>
                                        <td><span class="status-badge status-${(n.status||``).toLowerCase()}">${n.status}</span></td>
                                        <td><a href="/${e}/${t}/moments/${n.sequenceNumber}" moment-id="${n.id}" moment-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,b.addEventListener(`change`,async n=>{let r=n.target;if(r.matches(`.moment-type-select`)){let n=parseInt(r.dataset.momentId,10),i=r.value,a=r.dataset.currentType||i;try{await p(e,t,n,i),r.dataset.currentType=i}catch(e){r.value=a,console.error(`Failed to update moment type:`,e)}}}),b.querySelectorAll(`a[moment-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),h(`/${e}/${t}/moments/${n.getAttribute(`moment-seq`)}`,r,i))})})}).catch(()=>{b.innerHTML=`<p class="error">Failed to load moments.</p>`}),fi();let x=document.getElementById(`flow-journey-cell`);oe(e,t,s.journeyId).then(n=>{let a=D(n.statusColor),o=Xe(n.statusColor);x.innerHTML=`<a href="/${e}/${t}/journeys/${n.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${l(n.statement)}</a> <span aria-hidden="true">${a}</span><span class="sr-only">${o}</span>`;let s=x.querySelector(`a.detail-link`);s&&s.addEventListener(`click`,e=>{e.ctrlKey||e.metaKey||e.button===1||(e.preventDefault(),h(s.getAttribute(`href`),r,i))})}).catch(()=>{});let S=document.getElementById(`desc-save-msg`);m&&m.addEventListener(`click`,async r=>{r.preventDefault(),S.textContent=``,m.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await Me(e,t,n,i))?.description??(i.trim()?i:null),I(`flow-${s.sequenceNumber}`,{description:s.description}),_&&_.showSavedPopover(Q(s.description||``))}catch(e){S.textContent=`Save failed`,console.error(e)}finally{m.disabled=!1}}),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-moment-statement`),i=document.getElementById(`add-moment-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`);let a=document.getElementById(`add-moment-type`);a&&(a.disabled=!0)}})(),pi(o,`Flow`,s.id,e,t,a);let{owner:C,project:w}=rt();C&&w&&it(o,L(C,w,`flow-${s.sequenceNumber}`))}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load flow details.`,console.error(e)})}function vi(e,t,n,r,i,o){let s=document.getElementById(`moment-detail-content`),c=document.getElementById(`error-text`),d=document.getElementById(`moment-detail-loading`);Le(),d&&(d.hidden=!1),c.textContent=``,u(e,t,n).then(n=>Promise.all([Promise.resolve(n),Z(`Moment`,n.id,e,t)])).then(async([c])=>{d&&(d.hidden=!0),ke({nodeType:`moment`,nodeId:n,owner:e,project:t}),s.innerHTML=`
                <div class="detail-card moment-detail-card">
                    <h2>${l(c.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr>
                            <th scope="row"><label for="moment-description-input">Description</label></th>
                            <td>
                                <div class="inline-edit-wrapper">
                                    <p id="moment-description-view" class="inline-edit-view">${Q(c.description||``)}</p>
                                    <button id="edit-moment-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                    <textarea id="moment-description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${l(c.description||``)}</textarea>
                                </div>
                                <div class="field-actions"><button id="moment-description-cancel" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="moment-description-save" class="btn btn-primary btn-sm" type="button">Save</button> <span id="moment-description-msg"></span></div>
                            </td>
                        </tr>
                        <tr><th scope="row"><label for="moment-type-select">Type</label></th><td>
                            <select id="moment-type-select" class="form-select form-select-sm">
                                <option value="Story" ${c.type===`Story`?`selected`:``}>Story</option>
                                <option value="Job" ${c.type===`Job`?`selected`:``}>Job</option>
                            </select>
                        </td></tr>
                        <tr><th scope="row"><label for="moment-status-select">Status</label></th><td>
                            <select id="moment-status-select" class="form-select form-select-sm">
                                ${fe(`Todo`,c.status)}
                                ${fe(`InProgress`,c.status)}
                                ${fe(`Blocked`,c.status)}
                                ${fe(`Done`,c.status)}
                            </select>
                        </td></tr>
                        <tr>
                            <th scope="row"><label for="moment-estimate-select">Effort Estimate</label></th>
                            <td>
                                <select id="moment-estimate-select" class="form-select form-select-sm">
                                    <option value="-" ${c.effortEstimate==null?`selected`:``}>-</option>
                                    <option value="XS"  ${c.effortEstimate===`XS`?`selected`:``}>XS</option>
                                    <option value="S"   ${c.effortEstimate===`S`?`selected`:``}>S</option>
                                    <option value="M"   ${c.effortEstimate===`M`?`selected`:``}>M</option>
                                    <option value="L"   ${c.effortEstimate===`L`?`selected`:``}>L</option>
                                    <option value="XL"  ${c.effortEstimate===`XL`?`selected`:``}>XL</option>
                                    <option value="XXL" ${c.effortEstimate===`XXL`?`selected`:``}>XXL</option>
                                    <option value="XXXL"${c.effortEstimate===`XXXL`?`selected`:``}>XXXL</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="moment-stride-select">Assigned Stride</label></th>
                            <td>
                                <select id="moment-stride-select" class="form-select form-select-sm">
                                    <option value="">Backlog</option>
                                </select>
                            </td>
                        </tr>
                        <tr><th scope="row">Created</th><td>${new Date(c.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Completed</th><td>${c.completedAt?new Date(c.completedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                    </table>
                    <h3>Moment Tasks</h3>
                    <div id="moment-tasks"></div>
                    <div id="moment-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `;let u=document.getElementById(`moment-description-input`),f=document.getElementById(`moment-description-view`),m=document.getElementById(`edit-moment-desc-btn`),v=document.getElementById(`moment-description-save`),y=document.getElementById(`moment-description-cancel`),b=null;u&&f&&m&&(H(u,`Moment`,c.id),b=Y(u,f,m,v,y)),(function(){if(!ti(o?.permission,`Edit`)){let e=document.getElementById(`edit-moment-desc-btn`),t=document.getElementById(`moment-description-save`),n=document.getElementById(`moment-description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`moment-type-select`),i=document.getElementById(`moment-status-select`),a=document.getElementById(`moment-estimate-select`),o=document.getElementById(`moment-stride-select`);r&&(r.disabled=!0,r.title=`Requires Edit permission.`),i&&(i.disabled=!0,i.title=`Requires Edit permission.`),a&&(a.disabled=!0,a.title=`Requires Edit permission.`),o&&(o.disabled=!0,o.title=`Requires Edit permission.`)}})(),yi(document.getElementById(`moment-tasks`),n,c.tasks,c,o,e,t);let x=document.getElementById(`moment-description-input`),C=document.getElementById(`moment-description-msg`);v&&x&&C&&v.addEventListener(`click`,async()=>{C.textContent=``,v.disabled=!0;let r=x.value;try{c.description=(await S(e,t,n,r))?.description??(r.trim()?r:null),I(`moment-${c.sequenceNumber}`,{description:c.description}),b&&b.showSavedPopover(Q(c.description||``))}catch(e){C.textContent=`Save failed`,console.error(e)}finally{v.disabled=!1}}),s.addEventListener(`click`,n=>{let a=n.target.closest(`a.detail-link`);a&&(n.ctrlKey||n.metaKey||n.button===1||(n.preventDefault(),h(`/${e}/${t}/flows/${a.getAttribute(`flow-seq`)}`,r,i)))});let w=document.getElementById(`moment-estimate-select`);w&&w.addEventListener(`change`,async()=>{let r=w.value===`-`?null:w.value;try{await a(e,t,n,r),c.effortEstimate=r,I(`moment-${c.sequenceNumber}`,{effortEstimate:r})}catch(e){alert(`Failed to update estimate`),console.error(e)}});let T=document.getElementById(`moment-stride-select`);if(T)try{let r=await ve(e,t);r.sort((e,t)=>String(e.name||``).localeCompare(String(t.name||``))),r.forEach(e=>{let t=document.createElement(`option`);t.value=String(e.id),t.textContent=e.name||`Stride ${e.id}`,String(e.id)===String(c.assignedStrideId)&&(t.selected=!0),T.appendChild(t)}),c.assignedStrideId||(T.value=``),T.addEventListener(`change`,async()=>{let r=T.value===``?null:parseInt(T.value,10);try{let i=await g(e,t,n,r);c.assignedStrideId=i.assignedStrideId,I(`moment-${c.sequenceNumber}`,{assignedStrideId:i.assignedStrideId}),T.value=i.assignedStrideId?String(i.assignedStrideId):``}catch(e){alert(`Failed to update assigned stride`),console.error(e)}})}catch(e){console.error(`Failed to load strides`,e)}let E=document.getElementById(`moment-status-select`),ee=s.querySelector(`tr:nth-last-child(1) td`);E&&E.addEventListener(`change`,async()=>{let r=E.value;try{let r=await _(e,t,n,E.value);c.status=r.status,c.statusColor=r.statusColor,c.completedAt=r.completedAt,E.value=r.status,await We(),r.completedAt?ee.textContent=new Date(r.completedAt).toLocaleDateString(`en-CA`):ee.textContent=`–`}catch{E.value=r,alert(`Failed to update status`)}});let D=document.getElementById(`moment-type-select`);D&&D.addEventListener(`change`,async()=>{let r=D.value;try{let i=await p(e,t,n,r);i&&i.type&&(c.type=i.type,D.value=i.type,I(`moment-${c.sequenceNumber}`,{type:i.type}))}catch{alert(`Failed to update type`),D.value=c.type}}),fi(),pi(s,`Moment`,c.id,e,t,o);let{owner:O,project:k}=rt();O&&k&&it(s,L(O,k,`moment-${c.sequenceNumber}`))}).catch(e=>{d&&(d.hidden=!0),c.textContent=`Failed to load moment details.`,console.error(e)})}function yi(e,t,n,r,a,o,s){if(!e)return;let c=Yr(e,{headers:[`Name`,`Description`,`Completion Status`],items:Array.isArray(n)?n:[],emptyMessage:`No moment tasks found.`,renderItemRow:e=>`
            <tr data-moment-task-id="${e.id}">
                <td>${l(e.name||``)}</td>
                <td>${Q(e.description)}</td>
                <td>
                    <label class="moment-task-completion">
                            <input type="checkbox" class="moment-task-complete-checkbox form-check-input" data-moment-task-id="${e.id}" ${e.isCompleted?`checked`:``} />
                        <span>${e.isCompleted?`Completed`:`Open`}</span>
                    </label>
                </td>
            </tr>
        `,renderAddRow:()=>`
            <tr data-inline-add-row="1">
                <td>
                    <input id="add-moment-task-name" class="form-control form-control-sm" type="text" maxlength="200" required placeholder="New task name...">
                </td>
                <td>
                    <input id="add-moment-task-description" class="form-control form-control-sm" type="text" maxlength="500" placeholder="Task description...">
                </td>
                <td>
                    <div class="inline-add-actions">
                        <label class="moment-task-completion">
                            <input id="add-moment-task-completed" type="checkbox" />
                            <span>Completed</span>
                        </label>
                        <button id="add-moment-task-submit" type="button" class="btn btn-sm btn-outline-primary">Add</button>
                        <span id="add-moment-task-msg"></span>
                    </div>
                </td>
            </tr>
        `}),u=e.querySelector(`#add-moment-task-name`),d=e.querySelector(`#add-moment-task-description`),f=e.querySelector(`#add-moment-task-completed`),p=e.querySelector(`#add-moment-task-submit`),m=e.querySelector(`#add-moment-task-msg`);d&&H(d,`Moment`,r.id),ti(a?.permission,`Edit`)||(u&&(u.disabled=!0),d&&(d.disabled=!0),f&&(f.disabled=!0),p&&(p.disabled=!0,p.title=`Requires Edit permission.`)),p&&u&&d&&f&&m&&p.addEventListener(`click`,async()=>{m.textContent=``;let e=u.value.trim();if(!e){m.textContent=`Name is required.`;return}p.disabled=!0;try{let n=await i(o,s,t,{name:e,description:d.value.trim(),isCompleted:f.checked});if(n){Zr(c);let e=document.createElement(`tr`);e.dataset.momentTaskId=n.id,e.innerHTML=`
                        <td>${l(n.name||``)}</td>
                        <td>${Q(n.description||``)}</td>
                        <td>
                            <label class="moment-task-completion">
                                <input type="checkbox" class="moment-task-complete-checkbox" data-moment-task-id="${n.id}" ${n.isCompleted?`checked`:``} />
                                <span>${n.isCompleted?`Completed`:`Open`}</span>
                            </label>
                        </td>
                    `,Xr(c,e),u.value=``,d.value=``,f.checked=!1,Array.isArray(r.tasks)||(r.tasks=[]),r.tasks.push(n),bi(t,r),xi(c,t,r,null,o,s)}}catch(e){m.textContent=`Failed to add task.`,console.error(e)}finally{p.disabled=!1}}),xi(c,t,r,a,o,s)}function bi(e,t){I(`moment-${t.sequenceNumber}`,{tasks:Array.isArray(t?.tasks)?[...t.tasks]:[]})}function xi(e,t,n,r,i,a){if(!e)return;let o=ti(r?.permission,`Edit`);e.querySelectorAll(`.moment-task-complete-checkbox`).forEach(e=>{if(e.dataset.bound!==`1`){if(e.dataset.bound=`1`,!o){e.disabled=!0,e.title=`Requires Edit permission.`;return}e.addEventListener(`change`,async()=>{let r=Number.parseInt(String(e.dataset.momentTaskId??``),10),o=e.closest(`tr`)?.querySelector(`.moment-task-completion span`),s=!e.checked;e.disabled=!0;try{let s=await c(i,a,t,r,e.checked);if(s){e.checked=!!s.isCompleted,o&&(o.textContent=s.isCompleted?`Completed`:`Open`);let i=(n.tasks??[]).find(e=>Number(e.id)===r);i&&(i.isCompleted=s.isCompleted,bi(t,n))}else o&&(o.textContent=e.checked?`Completed`:`Open`)}catch(t){e.checked=s,o&&(o.textContent=s?`Completed`:`Open`),alert(`Failed to update task completion`),console.error(t)}finally{e.disabled=!1}})}})}function Si(e,t,n){switch(e){case`/projects`:d(`projects/list.html`,n).then(()=>et(t,n)).catch(f(n,`project list`));break;case`/projects/add`:d(`projects/add.html`,n).then(()=>nt(t,n)).catch(f(n,`add project form`));break;default:b(n)}}function Ci(e,t,n,r,i){let a=n.replace(/^\/+/,``).replace(/\/+$/,``),o=a?a.split(`/`):[];if(o.length===0){$(e,t).then(n=>{un(e,t,r,i,n)});return}let s=o[0],c=o[1];switch(!0){case s===`strides`:$(e,t).then(n=>{un(e,t,r,i,n)});break;case s===`graph`:Promise.all([d(`projects/graph.html`,i),$(e,t)]).then(([,n])=>Dr(e,t,i,n)).catch(f(i,`graph page`));break;case s===`settings`:Promise.all([d(`projects/settings.html`,i),$(e,t)]).then(([,n])=>Wr(r,i,e,t,n)).catch(f(i,`project settings`));break;case s===`share`:Promise.all([d(`projects/share.html`,i),$(e,t)]).then(([,n])=>pn(e,t,i,n)).catch(f(i,`share page`));break;case s===`history`:d(`projects/history.html`,i).then(()=>Jr(r,i,e,t)).catch(f(i,`project activity`));break;case s===`iterations`:Promise.all([d(`iterations/list.html`,i),$(e,t)]).then(([,n])=>{x(()=>import(`./list.js`).then(r=>{r.loadIterationHistory(e,t,n)}),__vite__mapDeps([0,1,2]))}).catch(f(i,`iterations`));break;case s===`promises`&&!!c:Promise.all([d(`promises/detail.html`,i),$(e,t)]).then(([,n])=>mi(e,t,c,r,i,n)).catch(f(i,`promise`));break;case s===`epics`&&!!c:Promise.all([d(`epics/detail.html`,i),$(e,t)]).then(([,n])=>hi(e,t,c,r,i,n)).catch(f(i,`epic`));break;case s===`journeys`&&!!c:Promise.all([d(`journeys/detail.html`,i),$(e,t)]).then(([,n])=>gi(e,t,c,r,i,n)).catch(f(i,`journey`));break;case s===`flows`&&!!c:Promise.all([d(`flows/detail.html`,i),$(e,t)]).then(([,n])=>_i(e,t,c,r,i,n)).catch(f(i,`flow`));break;case s===`moments`&&!!c:Promise.all([d(`moments/detail.html`,i),$(e,t)]).then(([,n])=>vi(e,t,c,r,i,n)).catch(f(i,`moment`));break;default:b(i)}}export{Si as handleLegacyProjectRoutes,Ci as handleProjectScopedRoutes};