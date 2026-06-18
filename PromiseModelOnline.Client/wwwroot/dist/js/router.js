const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/list.js","js/main.js","js/iteration-create-modal.js"])))=>i.map(i=>d[i]);
import{C as e,S as t,_ as n,a as r,b as i,c as a,d as o,f as s,g as c,h as l,i as u,l as d,loadTemplate as f,loadTemplateWithError as p,m,n as h,navigate as g,o as _,p as v,r as y,s as b,showNotFound as x,t as S,u as C,x as w,y as T}from"./main.js";import{$ as E,A as D,B as O,C as k,D as A,E as j,F as M,G as ee,H as te,I as ne,J as re,K as ie,L as ae,M as oe,N as se,O as ce,P as le,Q as ue,R as de,S as fe,T as pe,U as me,V as he,W as ge,X as _e,Y as ve,Z as ye,_ as be,at as xe,b as Se,c as N,ct as Ce,d as we,dt as Te,et as Ee,f as De,ft as Oe,g as ke,h as Ae,ht as je,i as Me,it as Ne,j as Pe,k as Fe,l as Ie,lt as Le,m as Re,mt as ze,nt as Be,o as Ve,ot as He,p as Ue,pt as We,q as Ge,rt as Ke,s as P,st as qe,t as Je,tt as Ye,u as F,ut as Xe,v as I,w as Ze,x as Qe,y as $e,z as et}from"./iteration-create-modal.js";function tt(e,t,r){return n(`/api/comments/search-users?${new URLSearchParams({parentType:e,parentId:t,search:r})}`)}function nt(e,t,r){return n(`/api/comments/search-promises?${new URLSearchParams({parentType:e,parentId:t,search:r})}`)}function L(e,t,n){let r=document.createElement(`div`);r.className=`comment-autocomplete`,r.role=`listbox`,r.style.display=`none`,document.body.appendChild(r);let i={open:!1,items:[],highlightedIndex:-1,trigger:null,triggerStart:-1},a=null;function o(){let t=e.selectionStart,n=e.value,r=t;for(;r>0&&!/\s/.test(n[r-1]);)r--;let i=n.substring(r,t);if(i.length>0&&(i[0]===`@`||i[0]===`#`)){let e=i[0],t=i.substring(1);if(e===`@`&&/^\w*$/.test(t)||e===`#`)return{trigger:e,query:t,start:r}}return null}function s(t){let n=document.createElement(`div`),r=window.getComputedStyle(e),i=[`fontFamily`,`fontSize`,`fontWeight`,`fontStyle`,`fontVariant`,`fontStretch`,`lineHeight`,`letterSpacing`,`wordSpacing`,`textIndent`,`textTransform`,`wordBreak`,`whiteSpace`,`paddingTop`,`paddingRight`,`paddingBottom`,`paddingLeft`,`borderTopWidth`,`borderRightWidth`,`borderBottomWidth`,`borderLeftWidth`],a=n.style;for(let e of i)a[e]=r[e];a.position=`fixed`,a.top=`0`,a.left=`0`,a.visibility=`hidden`,a.overflow=`hidden`,a.width=e.clientWidth+`px`,a.height=`auto`,a.whiteSpace=`pre-wrap`,a.wordWrap=`break-word`,n.textContent=e.value.substring(0,t);let o=document.createElement(`span`);o.textContent=e.value[t]||`|`,n.appendChild(o),document.body.appendChild(n);let s=o.getBoundingClientRect();return document.body.removeChild(n),s}function c(){let t=e.getBoundingClientRect(),n=window.getComputedStyle(e),a=parseFloat(n.borderTopWidth)||0,o=parseFloat(n.borderLeftWidth)||0,c=parseFloat(n.lineHeight)||parseFloat(n.fontSize)*1.2||20,l=s(i.triggerStart),u=t.top+a+l.top-e.scrollTop,d=t.left+o+l.left-e.scrollLeft;r.style.position=`fixed`,r.style.left=d+`px`,r.style.top=u+c+`px`}async function l(e){let r;try{r=e.trigger===`@`?await tt(t,n,e.query):await nt(t,n,e.query)}catch{g();return}r&&r.length>0?u(r,e):g()}function u(e,t){i.items=e,i.trigger=t.trigger,i.triggerStart=t.start,i.highlightedIndex=0,i.open=!0,d(),c(),r.style.display=`block`}function d(){r.innerHTML=``;for(let e=0;e<i.items.length;e++){let t=i.items[e],n=document.createElement(`div`);n.className=`comment-autocomplete__item`+(e===i.highlightedIndex?` comment-autocomplete__item--highlight`:``),n.role=`option`,n.ariaSelected=String(e===i.highlightedIndex),i.trigger===`@`?n.textContent=t.name:n.textContent=`#`+t.entityType+`-`+(t.sequenceNumber??t.id)+` — `+t.statement,n.dataset.index=e,n.addEventListener(`mousedown`,function(e){e.preventDefault(),m(parseInt(this.dataset.index,10))}),r.appendChild(n)}let e=r.children[i.highlightedIndex];e&&e.scrollIntoView({block:`nearest`})}function f(){i.items.length!==0&&(i.highlightedIndex=(i.highlightedIndex+1)%i.items.length,d())}function p(){i.items.length!==0&&(i.highlightedIndex=(i.highlightedIndex-1+i.items.length)%i.items.length,d())}function m(t){let n=i.items[t];if(!n)return;if(e.value[i.triggerStart]!==i.trigger){g();return}let r;r=i.trigger===`@`?`@`+n.name+` `:`#`+n.entityType+`-`+(n.sequenceNumber??n.id)+` `;let a=e.selectionStart,o=e.value.substring(0,i.triggerStart),s=e.value.substring(a);e.value=o+r+s;let c=o.length+r.length;e.selectionStart=c,e.selectionEnd=c,g(),e.focus()}function h(){m(i.highlightedIndex)}function g(){i.open=!1,i.items=[],i.highlightedIndex=-1,i.trigger=null,i.triggerStart=-1,r.style.display=`none`}function _(){a&&clearTimeout(a),a=setTimeout(function(){let e=o();e?l(e):g()},200)}function v(t){if(i.open)switch(t.key){case`ArrowDown`:t.preventDefault(),f();break;case`ArrowUp`:t.preventDefault(),p();break;case`Tab`:t.preventDefault(),i.highlightedIndex>=0?h():g();break;case`Enter`:t.preventDefault(),i.highlightedIndex>=0&&h();break;case`Escape`:t.preventDefault(),g(),e.focus();break}}function y(){setTimeout(function(){document.activeElement!==r&&!r.contains(document.activeElement)&&g()},150)}function b(t){e.contains(t.target)||r.contains(t.target)||g()}function x(){g()}e.addEventListener(`input`,_),e.addEventListener(`keydown`,v),e.addEventListener(`blur`,y),document.addEventListener(`click`,b);let S=e.closest(`form`);return S&&S.addEventListener(`submit`,x),{destroy:function(){e.removeEventListener(`input`,_),e.removeEventListener(`keydown`,v),e.removeEventListener(`blur`,y),document.removeEventListener(`click`,b),S&&S.removeEventListener(`submit`,x),r.parentNode&&r.parentNode.removeChild(r)}}}function rt(){let e=window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);return e?{owner:e[1],project:e[2]}:{owner:null,project:null}}function R(e,t,n){let r=String(e??``).trim(),i=String(t??``).trim(),a=String(n??``).trim();return!r||!i||!a?null:`/${r}/${i}/graph?focus=${encodeURIComponent(a)}`}function it(e,t){if(!e||!t)return;let n=e.querySelector(`#graph-view-link`);if(!n){n=document.createElement(`a`),n.id=`graph-view-link`,n.className=`btn btn-outline-secondary btn-sm align-items-center gap-2`,n.innerHTML=`<i class="bi bi-diagram-3" aria-hidden="true"></i><span> Graph View</span>`;let t=e.querySelector(`#back-link`);t?.parentElement?(t.insertAdjacentElement(`beforebegin`,n),t.insertAdjacentText(`beforebegin`,` `)):e.appendChild(n)}n.href=t}var z={};async function B(e,t,r,i){try{let a=await n(`/api/comments/entity-map?parentType=${e}&parentId=${t}`);if(Object.keys(z).forEach(e=>delete z[e]),z._owner=r??null,z._project=i??null,Array.isArray(a))for(let e of a)z[`${e.entityType}-${e.sequenceNumber}`]={dbId:e.id,statusColor:e.statusColor}}catch{}}function at(e){let t=String(e??``).toLowerCase();return t.includes(`green`)?`🟢`:t.includes(`black`)||t.includes(`blocked`)?`⚫️`:t.includes(`orange`)||t.includes(`yellow`)||t.includes(`amber`)||t.includes(`inprogress`)||t.includes(`in-progress`)?`🟠`:t.includes(`red`)||t.includes(`todo`)?`🔴`:`⚪`}function V(e){let t=m(e);return t=t.replace(/#(promise|epic|journey|flow|moment)-(\d+)/g,(e,t,n)=>{let r=z[`${t}-${n}`],i=z._owner,a=z._project,o=`${t}s`;if(r!=null){let t=at(r.statusColor??``);return i&&a?`<a href="/${i}/${a}/${o}/${n}" class="promise-ref">${e} ${t}</a>`:`<a href="/${o}/${r.dbId}" class="promise-ref">${e} ${t}</a>`}return i&&a?`<a href="/${i}/${a}/${o}/${n}" class="promise-ref promise-ref--legacy">${e}</a>`:`<a href="/${o}/${n}" class="promise-ref promise-ref--legacy">${e}</a>`}),t=t.replace(/@(\w+)/g,`<span class="mention">@$1</span>`),t}var ot={View:0,Comment:1,Edit:2,Owner:3};function st(e,t){return(ot[e]??0)>=(ot[t]??0)}async function H(e,t){try{let n=await Ce(e,t);return n?typeof n==`string`?{permission:n,isOwner:n===`Owner`}:{permission:n.permission??void 0,isOwner:n.isOwner===!0}:{permission:void 0,isOwner:!1}}catch{return{permission:void 0,isOwner:!1}}}var ct=(e,t,r,i)=>n(`/api/comments?type=${r}&parentId=${i}`),lt=(e,t,n)=>i(`/api/comments`,n);function ut(e,t,n,r,i,a){let o=st(a?.permission,`Comment`);e.innerHTML=`
        <h3>Comments</h3>
        <div id="comments-list" class="comments-list"></div>
        ${o?`
        <form id="comment-form" class="comment-form" aria-label="Add a comment">
            <label for="comment-textarea" class="sr-only">Your comment</label>
            <textarea id="comment-textarea" class="form-control mb-2" rows="3" required placeholder="Write a comment... Use @name to mention someone, #type-id to reference a promise/epic/journey/flow/moment."></textarea>
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>`:``}
    `;let s=e.querySelector(`#comments-list`),c=e.querySelector(`#comment-form`),l=e.querySelector(`#comment-textarea`);l&&L(l,t,n);let u=B(t,n,r,i);Promise.all([ct(r,i,t,n),u]).then(([e])=>dt(s,e,o)).catch(()=>{s.removeAttribute(`role`),s.removeAttribute(`aria-label`),s.innerHTML=`<p class="error">Failed to load comments.</p>`}),c&&c.addEventListener(`submit`,async e=>{e.preventDefault();let a=l.value.trim();if(a)try{let e=window.scrollY;ft(s,await lt(r,i,{parentType:t,parentId:n,text:a})),l.value=``,window.scrollTo(0,e)}catch(e){alert(`Failed to post comment.`),console.error(e)}})}function dt(e,t,n){if(e.innerHTML=``,!t||t.length===0){e.innerHTML=s({icon:`bi-chat-dots`,title:`No comments yet.`,description:n?`Be the first to share your thoughts.`:``});return}t.forEach(t=>e.appendChild(pt(t)))}function ft(e,t){let n=e.querySelector(`.no-items`);n&&n.remove(),e.appendChild(pt(t))}function pt(e){let t=document.createElement(`div`);return t.className=`comment-item`,t.innerHTML=`
        <div class="comment-meta">
            <strong>${m(e.userName||e.authorName||`Unknown`)}</strong> – ${new Date(e.createdAt).toLocaleString(`en-CA`)}
        </div>
        <div class="comment-text">${V(e.text)}</div>
        ${e.mentionedUsers&&e.mentionedUsers.length?`<div class="comment-mentions">Mentions: ${e.mentionedUsers.join(`, `)}</div>`:``}
        ${e.replies&&e.replies.length?`<div class="comment-replies">${e.replies.map(e=>`
            <div class="comment-item reply">
                <strong>${m(e.userName||e.authorName||`Unknown`)}</strong>: ${m(e.text)}
            </div>
        `).join(``)}</div>`:``}
    `,t}var mt=(e,t,r,i)=>n(`/api/reactions?type=${r}&itemId=${i}`),ht=(e,t,n)=>i(`/api/reactions`,n),gt=(e,t,n)=>T(`/api/reactions/${n}`,{}),_t=[`👍`,`👎`,`❤️`,`😀`,`🎉`,`🚀`,`👀`];function vt(e,n,r,i,a,o){e.innerHTML=`
        <div class="reactions-bar">
            <span class="reactions-summary" id="reactions-summary"></span>
            ${o?.permission===`Comment`||o?.permission===`Edit`?`<span class="reactions-picker">
                ${_t.map(e=>`<button class="btn btn-outline-secondary btn-sm emote-btn" data-emote="${e}" title="${e}" aria-label="React with ${e}">${e}</button>`).join(``)}
            </span>`:``}
        </div>
    `;let s=e.querySelector(`#reactions-summary`),c=e.querySelectorAll(`.emote-btn`),l=t(),u={counts:{},myReactionId:null,myEmote:null};function d(){s.textContent=_t.filter(e=>u.counts[e]).map(e=>`${e} ${u.counts[e]}`).join(` `)||`No reactions yet.`}async function f(){try{let e=await mt(i,a,n,r);if(u.counts={},(e||[]).forEach(e=>{u.counts[e.emote]=(u.counts[e.emote]||0)+1}),l){let t=(e||[]).find(e=>String(e.userName)===String(l));u.myReactionId=t?.id??null,u.myEmote=t?.emote??null}d()}catch{s.textContent=`Failed to load reactions.`}}f(),c.forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.emote;try{let e=window.scrollY,o=u.myReactionId?await gt(i,a,u.myReactionId,t):await ht(i,a,{parentType:n,parentId:r,emote:t}),s=u.myEmote,c=o?.emote??t;s&&s!==c&&(u.counts[s]=Math.max(0,(u.counts[s]||0)-1)),(!s||s!==c)&&(u.counts[c]=(u.counts[c]||0)+1),u.myReactionId=o?.id??u.myReactionId,u.myEmote=c,d(),window.scrollTo(0,e)}catch{alert(`Failed to react`)}})})}function yt(){let e=document.getElementById(`back-link`);e&&e.addEventListener(`click`,()=>window.history.back())}function bt(e,t,n,r,i,a){let o=document.getElementById(`${t.toLowerCase()}-comments`);o&&ut(o,t,n,r,i,a);let s=document.getElementById(`reactions-section`);s||(s=document.createElement(`div`),s.id=`reactions-section`),e&&(s.parentNode||e.appendChild(s),vt(s,t,n,r,i,a))}function U(e,t,n,r,i){let a=``,o=``;function s(a){t.innerHTML=a||``,t.style.display=``,e.style.display=`none`,r&&(r.style.display=`none`),n.style.display=``,i&&(i.style.display=`none`)}function c(){a=e.value,o=t.innerHTML,t.style.display=`none`,e.style.display=``,n.style.display=`none`,r&&(r.style.display=``),i&&(i.style.display=``),e.focus()}return t.style.display=``,e.style.display=`none`,n.style.display=``,r&&(r.style.display=`none`),i&&(i.style.display=`none`),n.addEventListener(`click`,c),i&&i.addEventListener(`click`,()=>{e.value=a,s(o)}),{showView:s,showSavedPopover(e){if(!r){s(e);return}if(typeof bootstrap<`u`&&bootstrap.Popover){let t=new bootstrap.Popover(r,{trigger:`manual`,placement:`top`,content:`Saved!`,customClass:`inline-edit-saved-popover`});t.show(),setTimeout(()=>{t.dispose(),s(e)},1500)}else s(e)}}}function xt(e,{headers:t,items:n,emptyMessage:r,emptyConfig:i,renderItemRow:a,renderAddRow:o=()=>``}){let s=t.length,c=n&&n.length?n.map(a).join(``):i?v({colspan:s,...i}):`<tr class="inline-table-empty-row"><td class="no-items" colspan="${s}">${m(r)}</td></tr>`,l=o?o():``;return e.innerHTML=`
        <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle mb-0 promisemodel-table">
            <thead class="table-light">
                <tr>${t.map(e=>`<th>${m(e)}</th>`).join(``)}</tr>
            </thead>
            <tbody>
                ${c}
                ${l}
            </tbody>
        </table>
        </div>
    `,e.querySelector(`tbody`)}function St(e,t){let n=e.querySelector(`tr[data-inline-add-row="1"]`);if(n){e.insertBefore(t,n);return}e.appendChild(t)}function Ct(e){e.querySelector(`.inline-table-empty-row`)?.remove()}function wt(e,t,n,r,i,a){let o=document.getElementById(`epic-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`epic-detail-loading`);Me(),c&&(c.hidden=!1),s.textContent=``,me(e,t,n).then(n=>Promise.all([Promise.resolve(n),B(`Epic`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),Ve({nodeType:`epic`,nodeId:n,owner:e,project:t}),o.innerHTML=`
                <div class="detail-card epic-detail-card">
                    <h2>${m(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${V(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${m(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Parent Promise</th>
                            <td id="epic-parent-promise">Loading…</td>
                        </tr>
                        <tr><th scope="row">Status</th><td>${Ze(s.statusColor)}</td></tr>
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
            `;let l=document.getElementById(`description-input`),u=document.getElementById(`description-view`),d=document.getElementById(`edit-desc-btn`),f=document.getElementById(`save-desc`),p=document.getElementById(`cancel-desc`),h=null;l&&u&&d&&(L(l,`Epic`,s.id),h=U(l,u,d,f,p));let _=document.getElementById(`epic-parent-promise`);Pe(e,t,s.productPromiseId).then(n=>{let a=pe(n.statusColor),o=j(n.statusColor);_.innerHTML=`<a href="/${e}/${t}/promises/${n.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${m(n.statement)}</a> <span aria-hidden="true">${a}</span><span class="sr-only">${o}</span>`;let s=_.querySelector(`a.detail-link`);s&&s.addEventListener(`click`,e=>{e.ctrlKey||e.metaKey||e.button===1||(e.preventDefault(),g(s.getAttribute(`href`),r,i))})}).catch(()=>{_.textContent=`Promise ${s.productPromiseId}`});let v=document.getElementById(`epic-journeys-list`);ee(e,t,n).then(a=>{P(`epic-${s.sequenceNumber}`,a);let o=xt(v,{headers:[`Statement`,`Actions`],items:a||[],emptyMessage:`No journeys found for this epic.`,renderItemRow:n=>`
                            <tr data-journey-id="${n.id}">
                                <td>${m(n.statement)}</td>
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
                        `}),c=v.querySelector(`#add-journey-form`),l=v.querySelector(`#add-journey-statement`),u=v.querySelector(`#add-journey-msg`),d=v.querySelector(`#add-journey-submit`);c&&l&&u&&d&&c.addEventListener(`submit`,async r=>{r.preventDefault(),u.textContent=``;let i=l.value.trim();if(!i){u.textContent=`Statement is required.`;return}d.disabled=!0;try{let r=await se(e,t,{statement:i,epicId:n,displayOrder:(a||[]).length+1});if(r){Ct(o);let n=document.createElement(`tr`);n.dataset.journeyId=r.id,n.innerHTML=`
                                        <td>${m(r.statement)}</td>
                                        <td><a href="/${e}/${t}/journeys/${r.sequenceNumber}" journey-id="${r.id}" journey-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,St(o,n),l.value=``,P(`epic-${s.sequenceNumber}`,[...a||[],r])}}catch(e){u.textContent=`Failed to add journey.`,console.error(e)}finally{d.disabled=!1}}),v.innerHTML=`
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
                                        <td>${m(n.statement)}</td>
                                        <td><a href="/${e}/${t}/journeys/${n.sequenceNumber}" journey-id="${n.id}" journey-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,v.querySelectorAll(`a[journey-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),g(`/${e}/${t}/journeys/${n.getAttribute(`journey-seq`)}`,r,i))})})}).catch(()=>{v.innerHTML=`<p class="error">Failed to load journeys.</p>`}),yt(),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-journey-statement`),i=document.getElementById(`add-journey-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`)}})(),bt(o,`Epic`,s.id,e,t,a);let y=document.getElementById(`desc-save-msg`);f&&f.addEventListener(`click`,async r=>{r.preventDefault(),y.textContent=``,f.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await ie(e,t,n,i))?.description??(i.trim()?i:null),N(`epic-${s.sequenceNumber}`,{description:s.description}),h&&h.showSavedPopover(V(s.description||``))}catch(e){y.textContent=`Save failed`,console.error(e)}finally{f.disabled=!1}});let{owner:b,project:x}=rt();b&&x&&it(o,R(b,x,`epic-${s.sequenceNumber}`))}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load epic details.`,console.error(e)})}function Tt(e,t,n,r,i,a){let o=document.getElementById(`flow-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`flow-detail-loading`);Me(),c&&(c.hidden=!1),s.textContent=``,et(e,t,n).then(n=>Promise.all([Promise.resolve(n),B(`Flow`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),Ve({nodeType:`flow`,nodeId:n,owner:e,project:t}),o.innerHTML=`
                <div class="detail-card flow-detail-card">
                    <h2>${m(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${V(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${m(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Journey</th>
                            <td id="flow-journey-cell">
                                <a href="/${e}/${t}/journeys/${s.journeyId}" class="detail-link link-primary text-decoration-none fw-semibold">Journey ${s.journeyId}</a>
                            </td>
                        </tr>
                        <tr><th scope="row">Status</th><td>${Ze(s.statusColor)}</td></tr>
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
            `;let l=document.getElementById(`description-input`),u=document.getElementById(`description-view`),d=document.getElementById(`edit-desc-btn`),f=document.getElementById(`save-desc`),p=document.getElementById(`cancel-desc`),h=null;l&&u&&d&&(L(l,`Flow`,s.id),h=U(l,u,d,f,p));let _=o.querySelector(`.detail-link[journey-id]`);_&&_.addEventListener(`click`,n=>{n.ctrlKey||n.metaKey||n.button===1||(n.preventDefault(),g(`/${e}/${t}/journeys/${_.getAttribute(`journey-seq`)}`,r,i))});let v=document.getElementById(`flow-moments-list`);O(e,t,n).then(a=>{P(`flow-${s.sequenceNumber}`,a);let o=xt(v,{headers:[`Statement`,`Type`,`Status`,`Actions`],items:a||[],emptyMessage:`No moments found for this flow.`,renderItemRow:n=>`
                            <tr data-moment-id="${n.sequenceNumber}">
                                <td>${m(n.statement)}</td>
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
                        `}),c=v.querySelector(`#add-moment-form`),l=v.querySelector(`#add-moment-statement`),u=v.querySelector(`#add-moment-type`),d=v.querySelector(`#add-moment-msg`),f=v.querySelector(`#add-moment-submit`);c&&l&&u&&d&&f&&c.addEventListener(`submit`,async r=>{r.preventDefault(),d.textContent=``;let i=l.value.trim();if(!i){d.textContent=`Statement is required.`;return}f.disabled=!0;try{let r=await y(e,t,{statement:i,flowId:n,type:u.value,status:`Todo`,displayOrder:(a||[]).length+1});if(r){Ct(o);let n=document.createElement(`tr`);n.dataset.momentId=r.id,n.innerHTML=`
                                        <td>${m(r.statement)}</td>
                                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${r.sequenceNumber}" data-current-type="${r.type}" aria-label="Moment type"><option value="Story" ${r.type===`Story`?`selected`:``}>Story</option><option value="Job" ${r.type===`Job`?`selected`:``}>Job</option></select></td>
                                        <td><span class="status-badge status-${(r.status||``).toLowerCase()}">${r.status}</span></td>
                                        <td><a href="/${e}/${t}/moments/${r.sequenceNumber}" moment-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,St(o,n),l.value=``,u.value=`Story`,P(`flow-${s.sequenceNumber}`,[...a||[],r])}}catch(e){d.textContent=`Failed to add moment.`,console.error(e)}finally{f.disabled=!1}}),v.innerHTML=`
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
                                        <td>${m(n.statement)}</td>
                                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${n.sequenceNumber}" data-current-type="${n.type}" aria-label="Moment type"><option value="Story" ${n.type===`Story`?`selected`:``}>Story</option><option value="Job" ${n.type===`Job`?`selected`:``}>Job</option></select></td>
                                        <td><span class="status-badge status-${(n.status||``).toLowerCase()}">${n.status}</span></td>
                                        <td><a href="/${e}/${t}/moments/${n.sequenceNumber}" moment-id="${n.id}" moment-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,v.addEventListener(`change`,async n=>{let r=n.target;if(r.matches(`.moment-type-select`)){let n=parseInt(r.dataset.momentId,10),i=r.value,a=r.dataset.currentType||i;try{await C(e,t,n,i),r.dataset.currentType=i}catch(e){r.value=a,console.error(`Failed to update moment type:`,e)}}}),v.querySelectorAll(`a[moment-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),g(`/${e}/${t}/moments/${n.getAttribute(`moment-seq`)}`,r,i))})})}).catch(()=>{v.innerHTML=`<p class="error">Failed to load moments.</p>`}),yt();let b=document.getElementById(`flow-journey-cell`);ne(e,t,s.journeyId).then(n=>{let a=pe(n.statusColor),o=j(n.statusColor);b.innerHTML=`<a href="/${e}/${t}/journeys/${n.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${m(n.statement)}</a> <span aria-hidden="true">${a}</span><span class="sr-only">${o}</span>`;let s=b.querySelector(`a.detail-link`);s&&s.addEventListener(`click`,e=>{e.ctrlKey||e.metaKey||e.button===1||(e.preventDefault(),g(s.getAttribute(`href`),r,i))})}).catch(()=>{});let x=document.getElementById(`desc-save-msg`);f&&f.addEventListener(`click`,async r=>{r.preventDefault(),x.textContent=``,f.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await he(e,t,n,i))?.description??(i.trim()?i:null),N(`flow-${s.sequenceNumber}`,{description:s.description}),h&&h.showSavedPopover(V(s.description||``))}catch(e){x.textContent=`Save failed`,console.error(e)}finally{f.disabled=!1}}),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-moment-statement`),i=document.getElementById(`add-moment-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`);let a=document.getElementById(`add-moment-type`);a&&(a.disabled=!0)}})(),bt(o,`Flow`,s.id,e,t,a);let{owner:S,project:w}=rt();S&&w&&it(o,R(S,w,`flow-${s.sequenceNumber}`))}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load flow details.`,console.error(e)})}function Et(e,t,n,r,i,a){let o=document.getElementById(`journey-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`journey-detail-loading`);Me(),c&&(c.hidden=!1),s.textContent=``,M(e,t,n).then(n=>Promise.all([Promise.resolve(n),B(`Journey`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),Ve({nodeType:`journey`,nodeId:n,owner:e,project:t}),o.innerHTML=`
                <div class="detail-card journey-detail-card">
                    <h2>${m(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${V(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${m(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Epic</th>
                            <td id="journey-epic-cell">
                                <a href="/${e}/${t}/epics/${s.epicId}" class="detail-link link-primary text-decoration-none fw-semibold">Epic ${s.epicId}</a>
                            </td>
                        </tr>
                        <tr><th scope="row">Status</th><td>${Ze(s.statusColor)}</td></tr>
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
            `;let l=document.getElementById(`description-input`),u=document.getElementById(`description-view`),d=document.getElementById(`edit-desc-btn`),f=document.getElementById(`save-desc`),p=document.getElementById(`cancel-desc`),h=null;l&&u&&d&&(L(l,`Journey`,s.id),h=U(l,u,d,f,p));let _=o.querySelector(`a.detail-link[epic-id]`);_&&_.addEventListener(`click`,n=>{n.ctrlKey||n.metaKey||n.button===1||(n.preventDefault(),g(`/${e}/${t}/epics/${_.getAttribute(`epic-seq`)}`,r,i))});let v=document.getElementById(`journey-flows-list`);le(e,t,n).then(a=>{P(`journey-${s.sequenceNumber}`,a);let o=xt(v,{headers:[`Statement`,`Actions`],items:a||[],emptyMessage:`No flows found for this journey.`,renderItemRow:n=>`
                            <tr data-flow-id="${n.id}">
                                <td>${m(n.statement)}</td>
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
                        `}),c=v.querySelector(`#add-flow-form`),l=v.querySelector(`#add-flow-statement`),u=v.querySelector(`#add-flow-msg`),d=v.querySelector(`#add-flow-submit`);c&&l&&u&&d&&c.addEventListener(`submit`,async r=>{r.preventDefault(),u.textContent=``;let i=l.value.trim();if(!i){u.textContent=`Statement is required.`;return}d.disabled=!0;try{let r=await de(e,t,{statement:i,journeyId:n,displayOrder:(a||[]).length+1});if(r){Ct(o);let n=document.createElement(`tr`);n.dataset.flowId=r.id,n.innerHTML=`
                                        <td>${m(r.statement)}</td>
                                        <td><a href="/${e}/${t}/flows/${r.sequenceNumber}" flow-id="${r.id}" flow-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,St(o,n),l.value=``,P(`journey-${s.sequenceNumber}`,[...a||[],r])}}catch(e){u.textContent=`Failed to add flow.`,console.error(e)}finally{d.disabled=!1}}),v.innerHTML=`
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
                                        <td>${m(n.statement)}</td>
                                        <td><a href="/${e}/${t}/flows/${n.sequenceNumber}" flow-id="${n.id}" flow-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,v.querySelectorAll(`a[flow-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),g(`/${e}/${t}/flows/${n.getAttribute(`flow-seq`)}`,r,i))})})}).catch(()=>{v.innerHTML=`<p class="error">Failed to load flows.</p>`}),yt();let y=document.getElementById(`journey-epic-cell`);ge(e,t,s.epicId).then(n=>{let a=pe(n.statusColor),o=j(n.statusColor);y.innerHTML=`<a href="/${e}/${t}/epics/${n.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${m(n.statement)}</a> <span aria-hidden="true">${a}</span><span class="sr-only">${o}</span>`;let s=y.querySelector(`a.detail-link`);s&&s.addEventListener(`click`,e=>{e.ctrlKey||e.metaKey||e.button===1||(e.preventDefault(),g(s.getAttribute(`href`),r,i))})}).catch(()=>{});let b=document.getElementById(`desc-save-msg`);f&&f.addEventListener(`click`,async r=>{r.preventDefault(),b.textContent=``,f.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await ae(e,t,n,i))?.description??(i.trim()?i:null),N(`journey-${s.sequenceNumber}`,{description:s.description}),h&&h.showSavedPopover(V(s.description||``))}catch(e){b.textContent=`Save failed`,console.error(e)}finally{f.disabled=!1}}),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-flow-statement`),i=document.getElementById(`add-flow-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`)}})(),bt(o,`Journey`,s.id,e,t,a);let{owner:x,project:S}=rt();x&&S&&it(o,R(x,S,`journey-${s.sequenceNumber}`)),c&&(c.hidden=!0)}).catch(e=>{c&&(c.hidden=!0),s.textContent=`Failed to load journey details.`,console.error(e)})}function Dt(e,t,n,i,a,o){let s=document.getElementById(`moment-detail-content`),c=document.getElementById(`error-text`),l=document.getElementById(`moment-detail-loading`);Me(),l&&(l.hidden=!1),c.textContent=``,r(e,t,n).then(n=>Promise.all([Promise.resolve(n),B(`Moment`,n.id,e,t)])).then(async([r])=>{l&&(l.hidden=!0),Ve({nodeType:`moment`,nodeId:n,owner:e,project:t}),s.innerHTML=`
                <div class="detail-card moment-detail-card">
                    <h2>${m(r.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr>
                            <th scope="row"><label for="moment-description-input">Description</label></th>
                            <td>
                                <div class="inline-edit-wrapper">
                                    <p id="moment-description-view" class="inline-edit-view">${V(r.description||``)}</p>
                                    <button id="edit-moment-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                    <textarea id="moment-description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${m(r.description||``)}</textarea>
                                </div>
                                <div class="field-actions"><button id="moment-description-cancel" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="moment-description-save" class="btn btn-primary btn-sm" type="button">Save</button> <span id="moment-description-msg"></span></div>
                            </td>
                        </tr>
                        <tr><th scope="row"><label for="moment-type-select">Type</label></th><td>
                            <select id="moment-type-select" class="form-select form-select-sm">
                                <option value="Story" ${r.type===`Story`?`selected`:``}>Story</option>
                                <option value="Job" ${r.type===`Job`?`selected`:``}>Job</option>
                            </select>
                        </td></tr>
                        <tr><th scope="row"><label for="moment-status-select">Status</label></th><td>
                            <select id="moment-status-select" class="form-select form-select-sm">
                                ${A(`Todo`,r.status)}
                                ${A(`InProgress`,r.status)}
                                ${A(`Blocked`,r.status)}
                                ${A(`Done`,r.status)}
                            </select>
                        </td></tr>
                        <tr>
                            <th scope="row"><label for="moment-estimate-select">Effort Estimate</label></th>
                            <td>
                                <select id="moment-estimate-select" class="form-select form-select-sm">
                                    <option value="-" ${r.effortEstimate==null?`selected`:``}>-</option>
                                    <option value="XS"  ${r.effortEstimate===`XS`?`selected`:``}>XS</option>
                                    <option value="S"   ${r.effortEstimate===`S`?`selected`:``}>S</option>
                                    <option value="M"   ${r.effortEstimate===`M`?`selected`:``}>M</option>
                                    <option value="L"   ${r.effortEstimate===`L`?`selected`:``}>L</option>
                                    <option value="XL"  ${r.effortEstimate===`XL`?`selected`:``}>XL</option>
                                    <option value="XXL" ${r.effortEstimate===`XXL`?`selected`:``}>XXL</option>
                                    <option value="XXXL"${r.effortEstimate===`XXXL`?`selected`:``}>XXXL</option>
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
                        <tr><th scope="row">Created</th><td>${new Date(r.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Completed</th><td>${r.completedAt?new Date(r.completedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                    </table>
                    <h3>Moment Tasks</h3>
                    <div id="moment-tasks"></div>
                    <div id="moment-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `;let c=document.getElementById(`moment-description-input`),u=document.getElementById(`moment-description-view`),f=document.getElementById(`edit-moment-desc-btn`),p=document.getElementById(`moment-description-save`),v=document.getElementById(`moment-description-cancel`),y=null;c&&u&&f&&(L(c,`Moment`,r.id),y=U(c,u,f,p,v)),(function(){if(!st(o?.permission,`Edit`)){let e=document.getElementById(`edit-moment-desc-btn`),t=document.getElementById(`moment-description-save`),n=document.getElementById(`moment-description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`moment-type-select`),i=document.getElementById(`moment-status-select`),a=document.getElementById(`moment-estimate-select`),o=document.getElementById(`moment-stride-select`);r&&(r.disabled=!0,r.title=`Requires Edit permission.`),i&&(i.disabled=!0,i.title=`Requires Edit permission.`),a&&(a.disabled=!0,a.title=`Requires Edit permission.`),o&&(o.disabled=!0,o.title=`Requires Edit permission.`)}})(),Ot(document.getElementById(`moment-tasks`),n,r.tasks,r,o,e,t);let x=document.getElementById(`moment-description-input`),S=document.getElementById(`moment-description-msg`);p&&x&&S&&p.addEventListener(`click`,async()=>{S.textContent=``,p.disabled=!0;let i=x.value;try{r.description=(await _(e,t,n,i))?.description??(i.trim()?i:null),N(`moment-${r.sequenceNumber}`,{description:r.description}),y&&y.showSavedPopover(V(r.description||``))}catch(e){S.textContent=`Save failed`,console.error(e)}finally{p.disabled=!1}}),s.addEventListener(`click`,n=>{let r=n.target.closest(`a.detail-link`);r&&(n.ctrlKey||n.metaKey||n.button===1||(n.preventDefault(),g(`/${e}/${t}/flows/${r.getAttribute(`flow-seq`)}`,i,a)))});let w=document.getElementById(`moment-estimate-select`);w&&w.addEventListener(`change`,async()=>{let i=w.value===`-`?null:w.value;try{await b(e,t,n,i),r.effortEstimate=i,N(`moment-${r.sequenceNumber}`,{effortEstimate:i})}catch(e){alert(`Failed to update estimate`),console.error(e)}});let T=document.getElementById(`moment-stride-select`);if(T)try{let i=await E(e,t);i.sort((e,t)=>String(e.name||``).localeCompare(String(t.name||``))),i.forEach(e=>{let t=document.createElement(`option`);t.value=String(e.id),t.textContent=e.name||`Stride ${e.id}`,String(e.id)===String(r.assignedStrideId)&&(t.selected=!0),T.appendChild(t)}),r.assignedStrideId||(T.value=``),T.addEventListener(`change`,async()=>{let i=T.value===``?null:parseInt(T.value,10);try{let a=await h(e,t,n,i);r.assignedStrideId=a.assignedStrideId,N(`moment-${r.sequenceNumber}`,{assignedStrideId:a.assignedStrideId}),T.value=a.assignedStrideId?String(a.assignedStrideId):``}catch(e){alert(`Failed to update assigned stride`),console.error(e)}})}catch(e){console.error(`Failed to load strides`,e)}let D=document.getElementById(`moment-status-select`),O=s.querySelector(`tr:nth-last-child(1) td`);D&&D.addEventListener(`change`,async()=>{let i=D.value;try{let i=await d(e,t,n,D.value);r.status=i.status,r.statusColor=i.statusColor,r.completedAt=i.completedAt,D.value=i.status,await Ie(),i.completedAt?O.textContent=new Date(i.completedAt).toLocaleDateString(`en-CA`):O.textContent=`–`}catch{D.value=i,alert(`Failed to update status`)}});let k=document.getElementById(`moment-type-select`);k&&k.addEventListener(`change`,async()=>{let i=k.value;try{let a=await C(e,t,n,i);a&&a.type&&(r.type=a.type,k.value=a.type,N(`moment-${r.sequenceNumber}`,{type:a.type}))}catch{alert(`Failed to update type`),k.value=r.type}}),yt(),bt(s,`Moment`,r.id,e,t,o);let{owner:j,project:M}=rt();j&&M&&it(s,R(j,M,`moment-${r.sequenceNumber}`))}).catch(e=>{l&&(l.hidden=!0),c.textContent=`Failed to load moment details.`,console.error(e)})}function Ot(e,t,n,r,i,a,o){if(!e)return;let s=xt(e,{headers:[`Name`,`Description`,`Completion Status`],items:Array.isArray(n)?n:[],emptyMessage:`No moment tasks found.`,renderItemRow:e=>`
            <tr data-moment-task-id="${e.id}">
                <td>${m(e.name||``)}</td>
                <td>${V(e.description)}</td>
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
        `}),c=e.querySelector(`#add-moment-task-name`),l=e.querySelector(`#add-moment-task-description`),d=e.querySelector(`#add-moment-task-completed`),f=e.querySelector(`#add-moment-task-submit`),p=e.querySelector(`#add-moment-task-msg`);l&&L(l,`Moment`,r.id),st(i?.permission,`Edit`)||(c&&(c.disabled=!0),l&&(l.disabled=!0),d&&(d.disabled=!0),f&&(f.disabled=!0,f.title=`Requires Edit permission.`)),f&&c&&l&&d&&p&&f.addEventListener(`click`,async()=>{p.textContent=``;let e=c.value.trim();if(!e){p.textContent=`Name is required.`;return}f.disabled=!0;try{let n=await u(a,o,t,{name:e,description:l.value.trim(),isCompleted:d.checked});if(n){Ct(s);let e=document.createElement(`tr`);e.dataset.momentTaskId=n.id,e.innerHTML=`
                        <td>${m(n.name||``)}</td>
                        <td>${V(n.description||``)}</td>
                        <td>
                            <label class="moment-task-completion">
                                <input type="checkbox" class="moment-task-complete-checkbox" data-moment-task-id="${n.id}" ${n.isCompleted?`checked`:``} />
                                <span>${n.isCompleted?`Completed`:`Open`}</span>
                            </label>
                        </td>
                    `,St(s,e),c.value=``,l.value=``,d.checked=!1,Array.isArray(r.tasks)||(r.tasks=[]),r.tasks.push(n),kt(t,r),At(s,t,r,null,a,o)}}catch(e){p.textContent=`Failed to add task.`,console.error(e)}finally{f.disabled=!1}}),At(s,t,r,i,a,o)}function kt(e,t){N(`moment-${t.sequenceNumber}`,{tasks:Array.isArray(t?.tasks)?[...t.tasks]:[]})}function At(e,t,n,r,i,a){if(!e)return;let s=st(r?.permission,`Edit`);e.querySelectorAll(`.moment-task-complete-checkbox`).forEach(e=>{if(e.dataset.bound!==`1`){if(e.dataset.bound=`1`,!s){e.disabled=!0,e.title=`Requires Edit permission.`;return}e.addEventListener(`change`,async()=>{let r=Number.parseInt(String(e.dataset.momentTaskId??``),10),s=e.closest(`tr`)?.querySelector(`.moment-task-completion span`),c=!e.checked;e.disabled=!0;try{let c=await o(i,a,t,r,e.checked);if(c){e.checked=!!c.isCompleted,s&&(s.textContent=c.isCompleted?`Completed`:`Open`);let i=(n.tasks??[]).find(e=>Number(e.id)===r);i&&(i.isCompleted=c.isCompleted,kt(t,n))}else s&&(s.textContent=e.checked?`Completed`:`Open`)}catch(t){e.checked=c,s&&(s.textContent=c?`Completed`:`Open`),alert(`Failed to update task completion`),console.error(t)}finally{e.disabled=!1}})}})}function jt(e,t,n,r,i,a){let o=document.getElementById(`promise-detail-content`),s=document.getElementById(`error-text`),c=document.getElementById(`promise-detail-loading`);Me(),c&&(c.hidden=!1),s.textContent=``,D(e,t,n).then(n=>Promise.all([Promise.resolve(n),B(`Promise`,n.id,e,t)])).then(([s])=>{c&&(c.hidden=!0),o.innerHTML=`
                <div class="detail-card promise-detail-card">
                    <h2>${m(s.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${V(s.description||``)}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${m(s.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr><th scope="row">Status</th><td>${Ze(s.statusColor)}</td></tr>
                        <tr><th scope="row">Created</th><td>${new Date(s.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                        <tr><th scope="row">Updated</th><td>${s.updatedAt?new Date(s.updatedAt).toLocaleDateString(`en-CA`):`&ndash;`}</td></tr>
                    </table>
                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics&hellip;</p>
                    </div>
                    <div id="promise-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">&larr;</span> Back</button>
                </div>
            `,c&&(c.hidden=!0);let l=document.getElementById(`description-input`),u=document.getElementById(`description-view`),d=document.getElementById(`edit-desc-btn`),f=document.getElementById(`save-desc`),p=document.getElementById(`cancel-desc`),h=null;l&&u&&d&&(L(l,`Promise`,s.id),h=U(l,u,d,f,p)),Ve({nodeType:`promise`,nodeId:n,owner:e,project:t});let _=document.getElementById(`promise-epics-list`);Fe(e,t,n).then(a=>{P(`promise-${s.sequenceNumber}`,a);let c=xt(_,{headers:[`Statement`,`Actions`],items:a||[],emptyMessage:`No epics found for this promise.`,renderItemRow:n=>`
                            <tr data-epic-id="${n.id}">
                                <td>${m(n.statement)}</td>
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
                        `}),l=_?.querySelector(`#add-epic-form`),u=_?.querySelector(`#add-epic-statement`),d=_?.querySelector(`#add-epic-msg`),f=_?.querySelector(`#add-epic-submit`);l&&u&&d&&f&&l.addEventListener(`submit`,async r=>{r.preventDefault(),d.textContent=``;let i=u.value.trim();if(!i){d.textContent=`Statement is required.`;return}f.disabled=!0;try{let r=await te(e,t,{statement:i,productPromiseId:n,displayOrder:(a||[]).length+1});if(r){Ct(c);let n=document.createElement(`tr`);n.dataset.epicId=r.id,n.innerHTML=`
                                        <td>${m(r.statement)}</td>
                                        <td><a href="/${e}/${t}/epics/${r.sequenceNumber}" epic-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `,St(c,n),u.value=``,P(`promise-${s.sequenceNumber}`,[...a||[],r])}}catch(e){d.textContent=`Failed to add epic.`,console.error(e)}finally{f.disabled=!1}}),_.innerHTML=`
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
                                        <td>${m(n.statement)}</td>
                                        <td><a href="/${e}/${t}/epics/${n.sequenceNumber}" epic-id="${n.id}" epic-seq="${n.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>
                    `,o.querySelectorAll(`a[epic-id]`).forEach(n=>{n.addEventListener(`click`,a=>{a.ctrlKey||a.metaKey||a.button===1||(a.preventDefault(),g(`/${e}/${t}/epics/${n.getAttribute(`epic-seq`)}`,r,i))})})}).catch(()=>{_&&(_.innerHTML=`<p class="error">Failed to load epics.</p>`)}),(function(){if(a?.permission!==`Edit`){let e=document.getElementById(`edit-desc-btn`),t=document.getElementById(`save-desc`),n=document.getElementById(`description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0);let r=document.getElementById(`add-epic-statement`),i=document.getElementById(`add-epic-submit`);r&&(r.disabled=!0),i&&(i.disabled=!0,i.title=`Requires Edit permission.`)}})(),bt(o,`Promise`,s.id,e,t,a);let{owner:v,project:y}=rt();v&&y&&it(o,R(v,y,`promise-${s.sequenceNumber}`)),yt();let b=document.getElementById(`desc-save-msg`);f&&f.addEventListener(`click`,async r=>{r.preventDefault(),b&&(b.textContent=``),f.disabled=!0;let i=document.getElementById(`description-input`).value;try{s.description=(await oe(e,t,n,i))?.description??(i.trim()?i:null),N(`promise-${s.sequenceNumber}`,{description:s.description}),h&&h.showSavedPopover&&h.showSavedPopover(V(s.description||``))}catch(e){b&&(b.textContent=`Save failed`),console.error(e)}finally{f.disabled=!1}}),c&&(c.hidden=!0)}).catch(e=>{c&&(c.hidden=!0),s&&(s.textContent=`Failed to load promise details.`),console.error(e)})}var W=e({owner:``,project:``,permission:void 0,isOwner:!1});function Mt(e,t){let n=document.getElementById(e);if(n)return n;let r=document.createElement(`div`);return r.innerHTML=t.trim(),n=r.firstElementChild,n&&document.body.appendChild(n),n}function Nt(e){return new Date(e).toISOString().slice(0,10)}function Pt(e,t){let n=new Date(e);return n.setDate(n.getDate()+t),n}function Ft(e=[]){let t=new Date,n=Array.isArray(e)&&e.length>0?e.map(e=>new Date(e?.endDate??``)).filter(e=>Number.isFinite(e.getTime())).sort((e,t)=>t.getTime()-e.getTime())[0]:null,r=n?Pt(n,1):t,i=Pt(r,13);return{startDate:Nt(r),endDate:Nt(i),durationDays:14}}function It({owner:e,project:t,iterationId:n,iterations:r=[],existingStrides:i=[],onCreated:a}){let o=Mt(`stride-create-modal`,`
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
    `),s=o?.querySelector(`#stride-create-form`),c=o?.querySelector(`#stride-create-name`),l=o?.querySelector(`#stride-create-iteration`),u=o?.querySelector(`#stride-create-duration`),d=o?.querySelector(`#stride-create-start`),f=o?.querySelector(`#stride-create-end`),p=o?.querySelector(`#stride-create-error`),h=o?.querySelector(`#stride-create-submit`);if(!s||!c||!l||!u||!d||!f||!p||!h)return;s.replaceWith(s.cloneNode(!0));let g=o.querySelector(`#stride-create-form`),_=o.querySelector(`#stride-create-name`),v=o.querySelector(`#stride-create-iteration`),y=o.querySelector(`#stride-create-duration`),b=o.querySelector(`#stride-create-start`),x=o.querySelector(`#stride-create-end`),S=o.querySelector(`#stride-create-error`),C=o.querySelector(`#stride-create-submit`);v.innerHTML=(Array.isArray(r)?r:[]).map(e=>`
        <option value="${e.id}" ${String(e.id)===String(n)?`selected`:``}>
            ${m(e.name)}
        </option>
    `).join(``);let w=Ft(i);_.value=``,y.value=String(w.durationDays),b.value=w.startDate,x.value=w.endDate,S.textContent=``,S.classList.add(`d-none`),C.disabled=!1,C.textContent=`Create Stride`,y.addEventListener(`input`,()=>{let e=Math.max(1,Number.parseInt(y.value,10)||1),t=new Date(b.value);if(!Number.isFinite(t.getTime()))return;let n=new Date(t);n.setDate(n.getDate()+e-1),x.value=n.toISOString().slice(0,10)}),b.addEventListener(`change`,()=>{let e=Math.max(1,Number.parseInt(y.value,10)||1),t=new Date(b.value);if(!Number.isFinite(t.getTime()))return;let n=new Date(t);n.setDate(n.getDate()+e-1),x.value=n.toISOString().slice(0,10)}),g.addEventListener(`submit`,async n=>{n.preventDefault();let r=_.value.trim(),i=Number.parseInt(v.value,10),s=Math.max(1,Number.parseInt(y.value,10)||1),c=b.value,l=x.value;if(!r){S.textContent=`Stride name is required.`,S.classList.remove(`d-none`),_.focus();return}if(!i){S.textContent=`Select an iteration for this stride.`,S.classList.remove(`d-none`),v.focus();return}C.disabled=!0,C.textContent=`Creating...`;try{await Ge(e,t,{name:r,iterationId:i,startDate:c,endDate:l,durationDays:s,isActive:!0}),window.bootstrap?.Modal?.getOrCreateInstance(o)?.hide(),await a?.()}catch(e){S.textContent=e?.message||`Failed to create stride.`,S.classList.remove(`d-none`)}finally{C.disabled=!1,C.textContent=`Create Stride`}}),window.bootstrap?.Modal?.getOrCreateInstance(o)?.show()}var Lt={XS:1,S:2,M:3,L:5,XL:8,XXL:13,XXXL:21},Rt=[],G=[],K=[],zt=!1,Bt=null,Vt=null,Ht=!1;function Ut(e){document.querySelectorAll(`.status-dropdown, .estimate-dropdown, .owner-dropdown, .moment-type-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn`).forEach(t=>t.disabled=!e),document.querySelectorAll(`.progress-stride-btn`).forEach(t=>{e?t.classList.remove(`hidden`):t.classList.add(`hidden`)})}function Wt(e){let t=window.scrollY,n=e();return window.scrollTo(0,t),n}function Gt(e){let t=new Date(e?.startDate);return Number.isFinite(t?.getTime?.())?t.getTime():0}function Kt(e){let t=Array.isArray(G)?[...G]:[];t.sort((e,t)=>Gt(e)-Gt(t));let n=t.findIndex(t=>String(t?.id)===String(e));return n<0?null:t[n+1]?.id??null}function qt(e){return(e?.querySelector?.(`.status-dropdown`)?.value??e?.querySelector?.(`.status-badge`)?.textContent??``).trim()===`Done`}function Jt(e){let t=e?.querySelector?.(`.stride-moments .no-items`);t&&t.remove()}function Yt(e){if(!e)return;let t=e.querySelector(`.stride-moments`);t&&(e.querySelectorAll(`table.promisemodel-table tbody tr[data-moment-id]`).length>0||(t.innerHTML=s({icon:`bi-clock`,title:`No moments assigned.`,description:`Move moments from the backlog into this stride.`})))}function q(e){let t=e?.querySelector?.(`.stride-total-effort`);if(!t)return;let n=0;e.querySelectorAll(`table.promisemodel-table tbody tr[data-moment-id]`).forEach(e=>{let t=e.querySelector(`.estimate-dropdown`)?.value;n+=Lt[t]??0}),t.textContent=`Total Effort: ${n}`}function Xt(e){let t=document.querySelector(`.stride-card[data-stride-id="${e}"]`);if(!t)return{moved:0,targetVisible:!1};let n=Kt(e),r=n?document.querySelector(`.stride-card[data-stride-id="${n}"]`):null,i=Array.from(t.querySelectorAll(`tr[data-moment-id]`)).filter(e=>!qt(e));if(i.length===0)return q(t),Yt(t),{moved:0,targetVisible:!!r};if(!r)return i.forEach(e=>e.remove()),q(t),Yt(t),{moved:i.length,targetVisible:!1};Jt(r);let a=Cn(n);return a?(i.forEach(e=>a.appendChild(e)),q(t),q(r),Yt(t),{moved:i.length,targetVisible:!0}):(i.forEach(e=>e.remove()),q(t),Yt(t),{moved:i.length,targetVisible:!1})}function Zt(e,t){return`<select class="estimate-dropdown" data-moment-id="${e}" data-current-estimate="${t??``}" aria-label="Effort estimate"></select>`}function Qt(e,t){return`<select class="owner-dropdown" data-moment-id="${e}" data-owner-id="${t??``}" aria-label="Owner"></select>`}function $t(e,t){return`<select class="moment-type-dropdown form-select form-select-sm" data-moment-id="${e}" data-current-type="${t}" aria-label="Moment type">
        <option value="Story" ${t===`Story`?`selected`:``}>Story</option>
        <option value="Job" ${t===`Job`?`selected`:``}>Job</option>
    </select>`}function en(e,t){return`<select class="status-dropdown" data-moment-id="${e}" data-current-status="${t??``}" aria-label="Status"></select>`}function tn(e,t){let n=e?.querySelector(`.status-badge`);if(!n)return;let r=t??``;n.textContent=r,Array.from(n.classList).filter(e=>e.startsWith(`status-`)&&e!==`status-badge`).forEach(e=>n.classList.remove(e)),n.classList.add(`status-${String(r).toLowerCase()}`)}function nn(e){return e?.querySelector(`.stride-moments, .backlog-content`)??null}function rn(e){let t=e?`bi-chevron-down`:`bi-chevron-up`,n=e?`Expand board`:`Collapse board`;return`
        <button class="stride-toggle-btn" type="button" aria-label="${n}" title="${n}" aria-pressed="${String(!e)}">
            <i class="bi ${t}" aria-hidden="true"></i>
        </button>
    `}function an(e,t,n=``){return`
        <div class="stride-header">
            <div class="stride-header-main">
                ${rn(t)}
                <h3>${m(e)}</h3>
            </div>
            ${n?`<div class="stride-header-actions ms-auto">${n}</div>`:``}
        </div>
    `}function on(e,t){if(!e)return;e.classList.toggle(`is-collapsed`,t);let n=nn(e);n&&n.classList.toggle(`hidden`,t);let r=e.querySelector(`.stride-toggle-btn`),i=r?.querySelector(`.bi`);if(r&&i){let e=t?`bi-chevron-down`:`bi-chevron-up`,n=t?`Expand board`:`Collapse board`;i.className=`bi ${e}`,r.setAttribute(`aria-label`,n),r.setAttribute(`title`,n),r.setAttribute(`aria-pressed`,String(!t))}}function sn(e){!e||e.dataset.boundCollapseToggles===`1`||(e.dataset.boundCollapseToggles=`1`,e.addEventListener(`click`,e=>{let t=e.target.closest(`.stride-toggle-btn`);if(!t)return;let n=t.closest(`[data-collapsible-board]`);n&&on(n,!n.classList.contains(`is-collapsed`))}))}function cn(){let e=document.querySelector(`.header`)?.offsetHeight??0;document.querySelectorAll(`[data-collapsible-board]`).forEach(t=>{t.style.setProperty(`--stride-sticky-top`,`${e}px`);let n=t.querySelector(`.stride-header`)?.offsetHeight??0;t.style.setProperty(`--stride-header-height`,`${n}px`)})}function ln(){Ht||(Ht=!0,window.addEventListener(`resize`,cn))}function un(e){let t=document.getElementById(`stride-scrollspy-nav`);if(!t)return;if(!Array.isArray(e)||e.length<=1){t.innerHTML=``,t.classList.add(`d-none`);return}t.classList.remove(`d-none`),t.innerHTML=`
        <div class="position-sticky top-0 bg-body border rounded p-2 shadow-sm">
            <div class="small text-uppercase text-secondary mb-2">Current Strides</div>
            <nav id="stride-scrollspy-links" class="nav nav-pills flex-wrap gap-2"></nav>
        </div>
    `;let n=t.querySelector(`#stride-scrollspy-links`);e.forEach((e,t)=>{let r=document.createElement(`a`);r.className=`nav-link py-1 px-2`,r.href=`#stride-card-${e.id}`,r.textContent=e.name,n?.appendChild(r)});let r=document.createElement(`a`);r.className=`nav-link py-1 px-2`,r.href=`#backlog-section`,r.textContent=`Backlog`,n?.appendChild(r);let i=window.bootstrap?.ScrollSpy;i&&i.getOrCreateInstance(document.body,{target:`#stride-scrollspy-links`,offset:140})?.refresh?.(),t.dataset.boundScrollspyClick!==`1`&&(t.dataset.boundScrollspyClick=`1`,t.addEventListener(`click`,e=>{let t=e.target.closest(`a.nav-link`);if(!t)return;let n=t.getAttribute(`href`)||``;if(!n.startsWith(`#`))return;let r=document.querySelector(n);r&&(e.preventDefault(),r.scrollIntoView({behavior:`smooth`,block:`start`}),window.history.replaceState({},``,n))}))}function dn(e){let t=R(Bt,Vt,`moment-${e}`);return t?`
        <a href="${t}" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-label="Open graph view focused on moment ${e}">
            <i class="bi bi-diagram-3" aria-hidden="true"></i>
            <span>Graph View</span>
        </a>
    `:``}function fn(e,t,n,r){let i=document.getElementById(e);return i||(i=document.createElement(`div`),i.className=`modal fade`,i.id=e,i.tabIndex=-1,i.setAttribute(`aria-hidden`,`true`),i.innerHTML=`
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
    `,document.body.appendChild(i),i)}function pn(){return fn(`move-to-backlog-modal`,`Move to Backlog?`,`Move to Backlog`,`btn-danger`)}function mn(e,t){let n=pn(),r=n.querySelector(`#move-to-backlog-modal-text`),i=n.querySelector(`#move-to-backlog-modal-confirm`);if(!r||!i)return;r.textContent=`Move ${yn(e)} to the Backlog?`;let a=i.cloneNode(!0);i.parentElement.replaceChild(a,i),a.addEventListener(`click`,async()=>{a.disabled=!0;try{await t(),window.bootstrap?.Modal?.getOrCreateInstance?.(n)?.hide()}catch(e){console.error(e),alert(`Failed to move moment`)}finally{a.disabled=!1}},{once:!0}),window.bootstrap?.Modal?.getOrCreateInstance?.(n)?.show()}function hn(){return fn(`move-to-stride-modal`,`Move to Stride?`,`Move`,`btn-primary`)}function gn(){return fn(`progress-stride-modal`,`Progress Stride?`,`Progress`,`btn-success`)}function _n(e){let t=gn(),n=t.querySelector(`#progress-stride-modal-text`),r=t.querySelector(`#progress-stride-modal-confirm`);if(!n||!r)return Promise.resolve(window.confirm(`Move all unfinished moments to the next stride?`));let i=document.querySelector(`.stride-card[data-stride-id="${e}"]`)?.querySelector(`.stride-header h3`)?.textContent?.trim();return n.textContent=i?`Move all unfinished moments in ${i} to the next stride?`:`Move all unfinished moments to the next stride?`,new Promise(e=>{let n=!1,i=t=>{n||(n=!0,e(t))},a=window.bootstrap?.Modal?.getOrCreateInstance?.(t);r.addEventListener(`click`,()=>{i(!0),a?.hide?.()},{once:!0}),t.addEventListener(`hidden.bs.modal`,()=>i(!1),{once:!0}),a?.show?.()})}function vn(e,t,n){let r=hn(),i=r.querySelector(`#move-to-stride-modal-text`),a=r.querySelector(`#move-to-stride-modal-confirm`);if(!i||!a)return;i.textContent=`Move ${yn(e)} to the selected stride?`;let o=a.cloneNode(!0);a.parentElement.replaceChild(o,a),o.addEventListener(`click`,async()=>{o.disabled=!0;try{await n(),window.bootstrap?.Modal?.getOrCreateInstance?.(r)?.hide()}catch(e){console.error(e),alert(`Failed to move moment`)}finally{o.disabled=!1}},{once:!0}),window.bootstrap?.Modal?.getOrCreateInstance?.(r)?.show()}function yn(e){let t=bn(e)?.querySelector(`td`),n=String(t?.textContent??``).trim();return n?n.slice(0,35):`moment ${e}`}function bn(e){return document.querySelector(`tr[data-moment-id="${e}"]`)}function xn(){let e=document.getElementById(`backlog-section`);return e?e.querySelector(`.backlog-content table.promisemodel-table tbody`)||(e.innerHTML=`
        <div class="stride-card backlog-board is-collapsed" data-collapsible-board="1">
            ${an(`Backlog`,!0)}
            <div class="stride-moments backlog-content hidden">
                <table class="promisemodel-table">
                    <thead>
                        <tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `,e.querySelector(`.backlog-content table.promisemodel-table tbody`)):null}function Sn(e){let t=document.createElement(`tr`);t.dataset.momentId=String(e.sequenceNumber),t.innerHTML=`
        <td>${m(e.statement)}</td>
        <td>${$t(e.sequenceNumber,e.type)}</td>
        <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
        <td>${e.effortEstimate??`–`}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${e.sequenceNumber}"></select>
                <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${e.sequenceNumber}" type="button">Move</button>
                ${dn(e.sequenceNumber)}
                <a href="/${Bt}/${Vt}/moments/${e.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;let n=t.querySelector(`.backlog-target-stride`);return n&&Nn(n),t}function Cn(e){let t=document.querySelector(`.stride-card[data-stride-id="${e}"]`);if(!t)return null;let n=t.querySelector(`table.promisemodel-table tbody`);if(n)return n;let r=t.querySelector(`.stride-moments`);return r?(r.innerHTML=`
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
    `,t.querySelector(`table.promisemodel-table tbody`)):null}function wn(e){let t=document.createElement(`tr`);t.dataset.momentId=String(e.sequenceNumber),t.innerHTML=`
        <td>${m(e.statement)}</td>
        <td>${$t(e.sequenceNumber,e.type)}</td>
        <td><span class="status-badge status-${(e.status||``).toLowerCase()}">${e.status}</span></td>
        <td>${Zt(e.sequenceNumber,e.effortEstimate)}</td>
        <td>${Qt(e.sequenceNumber,e.ownerId)}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                ${en(e.sequenceNumber,e.status)}
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${e.sequenceNumber}" data-current-estimate="${e.effortEstimate??``}"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${e.sequenceNumber}" type="button">Backlog</button>
                ${dn(e.sequenceNumber)}
                <a href="/${Bt}/${Vt}/moments/${e.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;let n=t.querySelector(`.estimate-dropdown`),r=t.querySelector(`.estimate-dropdown-mobile`),i=t.querySelector(`.owner-dropdown`),a=t.querySelector(`.status-dropdown`);return n&&An(n),r&&An(r),a&&jn(a),i&&Mn(i),t}function Tn(e,t,n,r,i){e&&e.dataset.bound!==`1`&&(e.dataset.bound=`1`,e.addEventListener(`change`,async e=>{let r=e.target;if(r.matches(`.status-dropdown`)){let e=parseInt(r.dataset.momentId,10),i=r.value;try{let i=await d(t,n,e,r.value),a=bn(e);a&&tn(a,i.status)}catch{r.value=i,alert(`Failed to update status`)}}if(r.matches(`.estimate-dropdown`)||r.matches(`.estimate-dropdown-mobile`)){let e=parseInt(r.dataset.momentId,10),i=r.value;try{await b(t,n,e,r.value===``?null:r.value);let i=bn(e),a=i?i.closest(`.stride-card`):null;a&&q(a)}catch{r.value=i,alert(`Failed to update estimate`)}}if(r.matches(`.owner-dropdown`)){let e=parseInt(r.dataset.momentId,10),i=r.value;try{let i=await a(t,n,e,r.value?parseInt(r.value,10):null);r.value=String(i.ownerId??``)}catch{r.value=i,alert(`Failed to update owner`)}}if(r.matches(`.moment-type-dropdown`)){let e=parseInt(r.dataset.momentId,10),i=r.value,a=r.dataset.currentType||i;try{await C(t,n,e,i),r.dataset.currentType=i}catch{r.value=a,alert(`Failed to update type`)}}}),e.addEventListener(`click`,async e=>{let a=e.target.closest(`a[data-moment-view]`);if(a){e.preventDefault(),g(a.getAttribute(`href`),r,i);return}let o=e.target.closest(`.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn`);if(o){if(o.classList.contains(`move-to-backlog-btn`)){let e=parseInt(o.dataset.momentId,10);mn(e,async()=>{let r=await h(t,n,e,null);Wt(()=>{let t=bn(e),n=t?t.closest(`.stride-card`):null;t&&t.remove();let i=xn();i&&i.appendChild(Sn(r)),n&&(q(n),Yt(n))})})}if(o.classList.contains(`move-to-stride-from-backlog-btn`)){let e=parseInt(o.dataset.momentId,10),r=o.closest(`tr`)?.querySelector(`.backlog-target-stride`),i=r?parseInt(r.value,10):null;if(!i)return;vn(e,i,async()=>{let r=await h(t,n,e,i);Wt(()=>{bn(e)?.remove();let t=Cn(i),n=document.querySelector(`.stride-card[data-stride-id="${i}"]`);t&&t.appendChild(wn(r)),n&&(q(n),Jt(n))})})}if(o.classList.contains(`progress-stride-btn`)){let e=parseInt(o.dataset.strideId,10);if(!await _n(e))return;try{await Ye(t,n,e);let r=document.getElementById(`success-text`);r&&(r.textContent=``);let{moved:i,targetVisible:a}=Wt(()=>Xt(e));r&&(i===0?r.textContent=`Stride progressed. No unfinished moments to move.`:a?r.textContent=`Stride progressed. Moved ${i} moment(s) to the next stride.`:r.textContent=`Stride progressed. Moved ${i} moment(s) to the next stride (not shown on this page).`)}catch{alert(`Failed to progress stride`)}}}}))}function En(e){return e.reduce((e,t)=>e+(Lt[t.effortEstimate]||0),0)}function Dn(e,t,n,r,i){let a=document.getElementById(`stride-board`),o=document.getElementById(`backlog-section`),c=document.getElementById(`error-text`),u=document.getElementById(`project-title`),d=document.getElementById(`create-stride-btn`),f=document.getElementById(`create-stride-btn-label`);Bt=e,Vt=t,a.innerHTML=l(`Loading strides`),c.textContent=``,o&&(o.innerHTML=``),sn(a),o&&sn(o),ln();let p=i?.permission===`Edit`;d&&(p?d.dataset.bound!==`1`&&(d.dataset.bound=`1`,d.addEventListener(`click`,()=>{if(!K.length){Je(e,t,()=>Dn(e,t,n,r));return}let i=K[0];It({owner:e,project:t,iterationId:i.id,iterations:K,existingStrides:G,onCreated:()=>Dn(e,t,n,r)})})):d.classList.add(`d-none`)),Promise.all([Xe(e,t).catch(()=>null),re(e,t)]).then(([i,o])=>{if(K=Array.isArray(o)?[...o].sort((e,t)=>t.id-e.id):[],!K.length){a.innerHTML=s({icon:`bi-repeat`,title:`No iterations found for this project.`,description:`Create the first iteration to start planning your work.`}),u&&(u.innerHTML=`<h2>${m(i?.name??`Project ${e}/${t}`)}</h2>`),f&&(f.textContent=`Create First Iteration`);return}let c=K[0];u.innerHTML=`<h2>${m(i?.name??`Project ${e}/${t}`)} – ${m(c.name)}</h2>`,f&&(f.textContent=`New Stride`);let l=document.getElementById(`iteration-history-link`);return l&&l.addEventListener(`click`,()=>{g(`/${e}/${t}/iterations`,n,r)}),Promise.all([Ee(e,t,c.id),ve(e,t,c.id,!0)]).then(([e,t])=>({strides:e,backlogMoments:t}))}).then(n=>{if(!n)return;let{strides:r,backlogMoments:i}=n;if(a.innerHTML=``,!r||r.length===0)a.innerHTML=s({icon:`bi-kanban`,title:`No strides found for this iteration.`,description:`Create a stride to organize your moments into sprints.`});else{un(r);let n=r.map(n=>_e(e,t,n.id).then(e=>({stride:n,moments:e})).catch(e=>(console.error(`Failed to load moments for stride`,n.id,e),{stride:n,moments:[]})));return Promise.all(n).then(e=>({results:e,backlogMoments:i,strides:r}))}return{results:[],backlogMoments:i,strides:[]}}).then(i=>{if(!i)return;let{results:c,backlogMoments:l,strides:u}=i;if(c.forEach(({stride:n,moments:r},i)=>{let o=i!==0,c=document.createElement(`div`);c.className=`stride-card${o?` is-collapsed`:``}`,c.dataset.strideId=String(n.id),c.id=`stride-card-${n.id}`,c.dataset.collapsibleBoard=`1`;let l=En(r);c.innerHTML=`
                    <div class="stride-header">
                        <div class="stride-header-main">
                            ${rn(o)}
                            <h3>${m(n.name)}</h3>
                            <span class="stride-dates">${Fn(n.startDate)} – ${Fn(n.endDate)}</span>
                            <span class="stride-duration">(${n.durationDays} days)</span>
                            <span class="stride-countdown" data-end-date="${n.endDate}"></span>
                            <span class="stride-total-effort">Total Effort: ${l}</span>
                        </div>
                        <div class="stride-header-actions ms-auto">
                            <button class="progress-stride-btn btn btn-outline-success btn-sm hidden" data-stride-id="${n.id}" type="button"><span aria-hidden="true">🧟</span> Progress</button>
                        </div>
                    </div>
                    <div class="stride-moments${o?` hidden`:``}">
                        ${r.length===0?s({icon:`bi-clock`,title:`No moments assigned.`,description:`Move moments from the backlog into this stride.`}):`<table class="promisemodel-table">
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
                                            <td>${m(n.statement)}</td>
                                            <td>${$t(n.sequenceNumber,n.type)}</td>
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
                    ${dn(n.sequenceNumber)}
                    <a href="/${e}/${t}/moments/${n.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                </div>
            </td>
                                        </tr>
                                    `).join(``)}
                                </tbody>
                            </table>`}
                    </div>
                `,a.appendChild(c),Pn(c)}),o){let n=u&&u.length>0;!l||l.length===0?o.innerHTML=`
                        <div class="stride-card backlog-board${n?` is-collapsed`:``}" data-collapsible-board="1">
                            ${an(`Backlog`,n)}
                            <div class="stride-moments backlog-content${n?` hidden`:``}">
                                ${s({icon:`bi-inbox`,title:`No unassigned moments.`,description:`Create new moments or assign existing ones to this project.`})}
                            </div>
                        </div>
                    `:(o.innerHTML=`
                        <div class="stride-card backlog-board${n?` is-collapsed`:``}" data-collapsible-board="1">
                            ${an(`Backlog`,n)}
                            <div class="stride-moments backlog-content${n?` hidden`:``}">
                                <table class="promisemodel-table">
                                    <thead><tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        ${l.map(n=>`
                                            <tr data-moment-id="${n.sequenceNumber}">
                                                <td>${m(n.statement)}</td>
                                                <td>${$t(n.sequenceNumber,n.type)}</td>
                                                <td><span class="status-badge status-${(n.status||``).toLowerCase()}">${n.status}</span></td>
                                                <td>${n.effortEstimate??`–`}</td>
                                                <td>
                                                    <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                        <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${n.sequenceNumber}"></select>
                                                        <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${n.sequenceNumber}" type="button">Move</button>
                                                        ${dn(n.sequenceNumber)}
                                                        <a href="/${e}/${t}/moments/${n.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join(``)}
                                    </tbody>
                                </table>
                            </div>
                        </div>`,Pn(o))}requestAnimationFrame(cn),ue(e,t).then(e=>{Rt=Array.isArray(e)?e:[],document.querySelectorAll(`.owner-dropdown`).forEach(e=>Mn(e))}).catch(e=>console.error(`Failed to load project members`,e)),ye(e,t).then(e=>{zt=e&&(e.toLowerCase()===`edit`||e.toLowerCase()===`owner`),Ut(zt)}).catch(e=>console.error(`Failed to get permission`,e)),In(),G=Array.isArray(u)?u:[],un(G),document.querySelectorAll(`.backlog-target-stride`).forEach(e=>Nn(e)),On(e,t,n,r)}).catch(e=>{a.innerHTML=``,c.textContent=`Failed to load data.`,console.error(e)})}function On(e,t,n,r){let i=document.getElementById(`stride-board`),a=document.getElementById(`backlog-section`);Tn(i,e,t,n,r),Tn(a,e,t,n,r)}function J(e,t,n){let r=document.createElement(`option`);return r.value=String(e??``),r.textContent=t??``,n&&(r.selected=!0),r}var kn=[`XS`,`S`,`M`,`L`,`XL`,`XXL`,`XXXL`];function An(e){if(!e)return;let t=e.getAttribute(`data-current-estimate`)||e.value||``;e.innerHTML=``,e.appendChild(J(``,`–`,t===``)),kn.forEach(n=>e.appendChild(J(n,n,String(t)===String(n))))}function jn(e){if(!e)return;let t=e.getAttribute(`data-current-status`)||e.value||``;e.innerHTML=``;for(let n of fe)e.appendChild(J(n.value,`${n.icon} ${n.label}`,t===n.value))}function Mn(e){if(!e)return;let t=e.value||e.getAttribute(`data-owner-id`)||``;e.innerHTML=``,e.appendChild(J(``,`Unassigned`,t===``)),(Rt||[]).forEach(n=>e.appendChild(J(String(n.userId),n.userName,String(t)===String(n.userId)))),[...e.options].some(e=>e.value===String(t))||(e.value=``)}function Nn(e){if(!e)return;let t=e.value||``;e.innerHTML=``,(G||[]).forEach(n=>e.appendChild(J(String(n.id),n.name,String(t)===String(n.id)))),[...e.options].some(e=>e.value===String(t))||(e.value=e.options[0]&&e.options[0].value||``)}function Pn(e){e&&(e.querySelectorAll(`.estimate-dropdown`).forEach(An),e.querySelectorAll(`.estimate-dropdown-mobile`).forEach(An),e.querySelectorAll(`.status-dropdown`).forEach(jn),e.querySelectorAll(`.owner-dropdown`).forEach(Mn),e.querySelectorAll(`.backlog-target-stride`).forEach(Nn))}function Fn(e){return e?new Date(e).toLocaleDateString(`en-CA`,{month:`short`,day:`numeric`,year:`numeric`}):`N/A`}function In(){document.querySelectorAll(`.stride-countdown`).forEach(e=>{let t=new Date(e.dataset.endDate),n=new Date,r=Math.ceil((t.getTime()-n.getTime())/(1e3*60*60*24));e.classList.remove(`stride-countdown--ended`,`stride-countdown--ending`,`stride-countdown--healthy`),r<0?(e.textContent=`Ended`,e.classList.add(`stride-countdown--ended`)):r===0?(e.textContent=`Ends today`,e.classList.add(`stride-countdown--ending`)):r<=3?(e.textContent=`${r} day${r>1?`s`:``} left`,e.classList.add(`stride-countdown--ending`)):(e.textContent=`${r} days left`,e.classList.add(`stride-countdown--healthy`))})}function Ln(e,t,n,r,i){f(`strides/list.html`,r).then(()=>Dn(e,t,n,r,i)).catch(p(r,`strides`))}function Rn(e,t){e&&(e.innerHTML=`
        <div class="table-responsive summary-table-wrap">
            <table class="table table-sm table-striped table-hover align-middle mb-0 detail-table summary-table">
            <tbody class="table-group-divider">
                ${t.map(e=>`
                    ${e.isGap?`<tr class="summary-gap"><td colspan="2" class="border-0 py-2"></td></tr>`:`<tr>
                            <th scope="row" class="summary-key text-muted fw-semibold">${m(e.label)}</th>
                            <td class="summary-value">${m(e.value)}</td>
                        </tr>`}
                `).join(``)}
            </tbody>
            </table>
        </div>
    `)}function zn(e,t){let n=document.getElementById(`add-project-form`),r=document.getElementById(`cancel-add-project-link`),i=document.getElementById(`project-name-input`),a=document.getElementById(`project-description-input`),o=document.getElementById(`first-promise-panel`),s=document.getElementById(`first-promise-input`),c=document.getElementById(`create-project-btn`),l=document.getElementById(`create-project-btn-spinner`),u=document.getElementById(`create-project-btn-label`),d=document.getElementById(`import-project-btn`),f=document.getElementById(`import-project-btn-spinner`),p=document.getElementById(`import-project-btn-icon`),m=document.getElementById(`import-project-btn-label`),h=document.getElementById(`clear-import-btn`),_=document.getElementById(`import-project-input`),v=document.getElementById(`project-import-summary-panel`),y=document.getElementById(`error-text`),b=document.getElementById(`success-text`);if(!n||!i||!a||!o||!s||!c||!l||!u||!d||!f||!p||!m||!h||!_||!v||!y||!b)return;let x=`scratch`,S=!1;function C(){y.textContent=``,y.style.display=`none`,b.textContent=``,b.style.display=`none`}function w(){return x===`import`?`Import Project`:`Create Project`}function T(){return x===`import`?`Importing Project...`:`Creating Project...`}function E(e){c.disabled=e,l.classList.toggle(`d-none`,!e),u.textContent=e?T():w()}function D(e,t=`Reading Project...`){d.disabled=e,f.classList.toggle(`d-none`,!e),p.classList.toggle(`d-none`,e),m.textContent=e?t:`Import Project...`}function O(e,t=`submit`){S=e,E(e&&t===`submit`),D(e&&t===`import`,t===`submit`?`Importing Project...`:`Reading Project...`),c.disabled=e,h.disabled=e,d.disabled=e,i.disabled=e,a.disabled=e,s.disabled=e,e||k(x)}function k(e){x=e;let t=e===`import`,n=!!_.files?.[0];o.hidden=t,i.readOnly=t,a.readOnly=t,u.textContent=S?T():w(),h.hidden=!t||!n,h.style.display=h.hidden?`none`:``}function A(){_.value=``,v.innerHTML=``,i.value=``,a.value=``,m.textContent=`Import Project...`,p.classList.remove(`d-none`),f.classList.add(`d-none`),d.disabled=!1,k(`scratch`),M()}let j=document.querySelector(`h1`);function M(){let e=i.value.trim(),t=x===`import`?`Import`:`Create`;e&&j?j.textContent=`${t} '${e}'`:j&&(j.textContent=`${t} Project`)}i.addEventListener(`input`,M);function ee(e){let t=e.project,n=Array.isArray(t.productPromises)?t.productPromises:[],r=n.flatMap(e=>Array.isArray(e.epics)?e.epics:[]),i=r.flatMap(e=>Array.isArray(e.journeys)?e.journeys:[]),a=i.flatMap(e=>Array.isArray(e.flows)?e.flows:[]),o=a.flatMap(e=>Array.isArray(e.moments)?e.moments:[]),s=Array.isArray(t.iterations)?t.iterations:[],c=s.flatMap(e=>Array.isArray(e.strides)?e.strides:[]);return{promises:n.length,epics:r.length,journeys:i.length,flows:a.length,moments:o.length,iterations:s.length,strides:c.length,promiseStackTotal:n.length+r.length+i.length+a.length+o.length}}function te(e,t){let n=e.project,r=ee(e);Rn(v,[{label:`Schema Version`,value:e.schemaVersion??`Unknown`},{label:`Exported At`,value:e.exportedAt?new Date(e.exportedAt).toLocaleString():`Unknown`},{label:`Project Name`,value:n.name??``},{label:`Project Description`,value:n.description??``},{label:`Promises`,value:r.promises},{label:`Epics`,value:r.epics},{label:`Journeys`,value:r.journeys},{label:`Flows`,value:r.flows},{label:`Moments`,value:r.moments},{label:`Promise Stack Total`,value:r.promiseStackTotal},{isGap:!0},{label:`Iterations`,value:r.iterations},{label:`Strides`,value:r.strides}])}async function ne(e){let t;try{t=JSON.parse(await e.text())}catch{throw Error(`The selected file is not valid JSON.`)}if(!t||typeof t!=`object`||!t.project)throw Error(`The selected file does not look like a project export.`);return t}async function re(){C();let n=i.value.trim(),r=a.value.trim(),o=s.value.trim();if(!n){y.textContent=`Project name is required.`,y.style.display=`block`;return}if(!o){y.textContent=`The first Product Promise is required when creating from scratch.`,y.style.display=`block`;return}try{O(!0,`submit`);let i=await Be({name:n,description:r||null});await ce(i.ownerSlug,i.slug,{statement:o,description:null,displayOrder:0}),g(`/${i.ownerSlug}/${i.slug}/graph`,e,t)}catch(e){y.textContent=e.message||`Failed to create project.`,y.style.display=`block`}finally{O(!1,`submit`)}}async function ie(){C();let n=_.files?.[0];if(!n){y.textContent=`Choose a project export to import.`,y.style.display=`block`;return}try{O(!0,`submit`);let r=await Te(n),{ownerSlug:i,slug:a}=r??{},o=Array.isArray(r?.warnings)?r.warnings:Array.isArray(r?.Warnings)?r.Warnings:[];b.textContent=o.length>0?`Project imported with ${o.length} warning(s).`:`Project imported successfully.`,b.style.display=`block`,g(i&&a?`/${i}/${a}/graph`:`/projects`,e,t)}catch(e){y.textContent=e.message||`Failed to import project.`,y.style.display=`block`}finally{O(!1,`submit`)}}n.addEventListener(`submit`,async e=>{if(e.preventDefault(),x===`import`){await ie();return}await re()}),d.addEventListener(`click`,()=>{_.click()}),_.addEventListener(`change`,async()=>{C();let e=_.files?.[0];if(!e){A();return}try{O(!0,`import`);let t=await ne(e);i.value=t.project.name??``,a.value=t.project.description??``,k(`import`),M(),te(t,e)}catch(e){A(),y.textContent=e.message||`Failed to read imported project.`,y.style.display=`block`}finally{O(!1,`import`)}}),h.addEventListener(`click`,()=>{C(),A(),i.focus()}),r&&r.addEventListener(`click`,n=>{n.preventDefault(),g(`/projects`,e,t)}),k(`scratch`),M()}var Bn=window.tippy,Y=null,X=null,Vn=null,Hn={root:`Promise`,promise:`Epic`,epic:`Journey`,journey:`Flow`,flow:`Moment`};function Un(e,t){let n=Z(e);if(n===`root`)return`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}`;let r=Number.parseInt(t,10);if(Number.isNaN(r))return null;switch(n){case`promise`:return`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}/promises/${r}`;case`epic`:return`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}/epics/${r}`;case`journey`:return`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}/journeys/${r}`;case`flow`:return`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}/flows/${r}`;case`moment`:return`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}/moments/${r}`;default:return null}}function Z(e){return String(e??``).trim().toLowerCase()}function Wn(e){let t=e?.payload??{};return String(t.statement??t.name??`#${t.id??``}`).trim()}function Gn(e){return Hn[Z(e)]??null}function Kn(e){let t=Z(e.nodeType),n=`/api/projects/${encodeURIComponent(Y)}/${encodeURIComponent(X)}`;switch(t){case`root`:return{entityLabel:`Promise`,endpoint:`${n}/promises/create`,parentField:`projectId`};case`promise`:return{entityLabel:`Epic`,endpoint:`${n}/epics/create`,parentField:`productPromiseId`};case`epic`:return{entityLabel:`Journey`,endpoint:`${n}/journeys/create`,parentField:`epicId`};case`journey`:return{entityLabel:`Flow`,endpoint:`${n}/flows/create`,parentField:`journeyId`};case`flow`:return{entityLabel:`Moment`,endpoint:`${n}/moments/create`,parentField:`flowId`};default:return null}}function qn(e){let t=Z(e.nodeType),n=(Number.parseInt(e.childCount??0,10)||0)+1;switch(t){case`root`:return{statement:`New Promise`,description:``,displayOrder:n};case`promise`:return{statement:`New Epic`,description:``,displayOrder:n};case`epic`:return{statement:`New Journey`,description:``,displayOrder:n};case`journey`:return{statement:`New Flow`,description:``,displayOrder:n};case`flow`:return{statement:`New Moment`,description:``,displayOrder:n};default:return null}}async function Jn(e,t){let{headers:n,...r}=t,i=await c(e,{mode:`cors`,...r,headers:{Accept:`application/json`,"Accept-Language":`en-CA`,...n??{}}});if(i.ok)return i.status===204?null:i.json();i.status===401&&document.getElementById(`login-link`)?.click();let a=`HTTP error! status: ${i.status}`;try{let e=await i.json();a=e?.message||e?.title||e?.detail||a}catch{}throw Error(a)}function Yn(e,t){let n=document.getElementById(e);if(n)return n;let r=document.createElement(`div`);return r.innerHTML=t.trim(),n=r.firstElementChild,n&&document.body.appendChild(n),n}function Xn(e){let t=Yn(`graph-delete-confirmation-modal`,`
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
    `);if(!t)return Promise.resolve(window.confirm(`Delete ${e}? This cannot be undone.`));let n=t.querySelector(`#graph-delete-confirmation-modal-title`),r=t.querySelector(`#graph-delete-confirmation-modal-body`),i=t.querySelector(`#graph-delete-confirmation-confirm`);return!n||!r||!i?Promise.resolve(window.confirm(`Delete ${e}? This cannot be undone.`)):(n.textContent=`Delete ${e}`,r.textContent=`Delete ${e}? This cannot be undone.`,new Promise(e=>{let n=!1,r=t=>{n||(n=!0,e(t))},a=window.bootstrap?.Modal?.getOrCreateInstance(t);i.addEventListener(`click`,()=>{r(!0),a?.hide()},{once:!0}),t.addEventListener(`hidden.bs.modal`,()=>r(!1),{once:!0}),a?.show()}))}function Zn({name:e,label:t,type:n=`text`,value:r=``,placeholder:i=``,rows:a=3}){let o=document.createElement(`label`);o.className=`graph-context-menu-form__field`;let s=document.createElement(`span`);s.className=`graph-context-menu-form__label`,s.textContent=t;let c;return n===`textarea`?(c=document.createElement(`textarea`),c.rows=a):(c=document.createElement(`input`),c.type=n),c.name=e,c.className=`graph-context-menu-form__control`,c.value=r,c.placeholder=i,o.append(s,c),{field:o,input:c}}function Qn({name:e,label:t,value:n=``,options:r=[]}){let i=document.createElement(`label`);i.className=`graph-context-menu-form__field`;let a=document.createElement(`span`);a.className=`graph-context-menu-form__label`,a.textContent=t;let o=document.createElement(`select`);o.name=e,o.className=`graph-context-menu-form__control`;for(let e of r){let t=document.createElement(`option`);t.value=e.value,t.textContent=e.label,t.selected=String(e.value)===String(n),o.appendChild(t)}return i.append(a,o),{field:i,select:o}}function $n(){return[{value:`Story`,label:`Story`},{value:`Job`,label:`Job`}]}function er(e){let t=e?.payload??{},n=String(t.status??t.Status??``).trim();if(n){let e=fe.find(e=>e.value.toLowerCase()===n.toLowerCase());if(e)return e.value}let r=String(t.statusColor??t.StatusColor??``).trim().toLowerCase();return r.includes(`green`)||r.includes(`done`)?`Done`:r.includes(`black`)||r.includes(`blocked`)?`Blocked`:r.includes(`orange`)||r.includes(`yellow`)||r.includes(`amber`)||r.includes(`inprogress`)||r.includes(`in-progress`)?`InProgress`:(r.includes(`red`)||r.includes(`todo`),`Todo`)}function tr(){return[{value:`-`,label:`-`},{value:`XS`,label:`XS`},{value:`S`,label:`S`},{value:`M`,label:`M`},{value:`L`,label:`L`},{value:`XL`,label:`XL`},{value:`XXL`,label:`XXL`},{value:`XXXL`,label:`XXXL`}]}function nr(e=[]){return[{value:``,label:`Backlog`},...e.map(e=>({value:String(e.id),label:e.name?`Stride #${e.id} - ${e.name}`:`Stride #${e.id}`}))]}function rr(e,t,n,r,i,a){let o=Kn(e),s=qn(e);if(!o||!s)return null;let c=document.createElement(`form`);c.className=`graph-context-menu-form graph-context-menu-form--moment`;let l=document.createElement(`div`);l.className=`graph-context-menu-form__title`,l.textContent=`Create Moment`;let u=document.createElement(`div`);u.className=`graph-context-menu-form__subtitle`,u.textContent=`Moments carry status, type, estimate, and stride assignment at creation time.`;let d=Zn({name:`statement`,label:`Statement`,value:s.statement,placeholder:`New Moment`}),f=Zn({name:`description`,label:`Description`,type:`textarea`,value:s.description,placeholder:`Optional description`,rows:3}),p=Qn({name:`type`,label:`Type`,value:`Story`,options:$n()}),m=Qn({name:`status`,label:`Status`,value:`Todo`,options:fe.map(e=>({value:e.value,label:`${e.icon} ${e.label}`}))}),h=Qn({name:`effortEstimate`,label:`Effort Estimate`,value:``,options:tr()}),g=Qn({name:`assignedStrideId`,label:`Assigned Stride`,value:``,options:nr(r?.()??[])}),_=document.createElement(`div`);_.className=`graph-context-menu-form__actions`;let v=document.createElement(`button`);v.type=`button`,v.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,v.textContent=`Cancel`,v.addEventListener(`click`,e=>{e.preventDefault(),a()});let y=document.createElement(`button`);return y.type=`submit`,y.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,y.textContent=`Create Moment`,_.append(v,y),c.append(l,u,d.field,f.field,p.field,m.field,h.field,g.field,_),L(f.input,e.nodeType,e.payload?.id),c.addEventListener(`submit`,async t=>{t.preventDefault(),y.disabled=!0,y.textContent=`Creating Moment...`;let n=d.input.value.trim(),r=f.input.value.trim();if(!n){y.disabled=!1,y.textContent=`Create Moment`,d.input.focus();return}let s={statement:n,description:r||null,flowId:e.payload?.id,type:p.select.value,status:m.select.value,effortEstimate:h.select.value===`-`?null:h.select.value||null,assignedStrideId:g.select.value?Number.parseInt(g.select.value,10):null,displayOrder:(Number.parseInt(e.childCount??0,10)||0)+1};try{await Jn(o.endpoint,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(s)}),a(),await i?.()}catch(e){throw y.disabled=!1,y.textContent=`Create Moment`,e}}),c}function ir(e,t,n){let r=e?.payload?.sequenceNumber;if(r==null)return null;let i=document.createElement(`form`);i.className=`graph-context-menu-form graph-context-menu-form--moment`;let a=document.createElement(`div`);a.className=`graph-context-menu-form__title`,a.textContent=`Change Moment Status`;let o=document.createElement(`div`);o.className=`graph-context-menu-form__subtitle`,o.textContent=`Update the moment status without leaving the graph.`;let s=Qn({name:`status`,label:`Status`,value:er(e),options:fe.map(e=>({value:e.value,label:`${e.icon} ${e.label}`}))}),c=document.createElement(`div`);c.className=`graph-context-menu-form__actions`;let l=document.createElement(`button`);l.type=`button`,l.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,l.textContent=`Cancel`,l.addEventListener(`click`,e=>{e.preventDefault(),n()});let u=document.createElement(`button`);return u.type=`submit`,u.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,u.textContent=`Save Status`,c.append(l,u),i.append(a,o,s.field,c),i.addEventListener(`submit`,async e=>{e.preventDefault(),u.disabled=!0,u.textContent=`Saving Status...`;try{await d(Y,X,r,s.select.value),n(),await t?.()}catch(e){throw u.disabled=!1,u.textContent=`Save Status`,e}}),i}function ar(e,t,n,r,i,a){let o=Kn(e),s=qn(e);if(!o||!s)return null;if(o.entityLabel===`Moment`)return rr(e,t,n,r,i,a);let c=document.createElement(`form`);c.className=`graph-context-menu-form`;let l=document.createElement(`div`);l.className=`graph-context-menu-form__title`,l.textContent=`Create ${o.entityLabel}`;let u=document.createElement(`div`);u.className=`graph-context-menu-form__subtitle`,u.textContent=`Add a new ${o.entityLabel.toLowerCase()} beneath this card.`;let d=Zn({name:`statement`,label:`Statement`,value:s.statement,placeholder:`New ${o.entityLabel}`}),f=Zn({name:`description`,label:`Description`,type:`textarea`,value:s.description,placeholder:`Optional description`,rows:4}),p=document.createElement(`div`);p.className=`graph-context-menu-form__actions`;let m=document.createElement(`button`);m.type=`button`,m.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,m.textContent=`Cancel`,m.addEventListener(`click`,e=>{e.preventDefault(),a()});let h=document.createElement(`button`);return h.type=`submit`,h.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,h.textContent=`Create ${o.entityLabel}`,p.append(m,h),c.append(l,u,d.field,f.field,p),L(f.input,e.nodeType,e.payload?.id),c.addEventListener(`submit`,async t=>{t.preventDefault(),h.disabled=!0,h.textContent=`Creating ${o.entityLabel}...`;let n=d.input.value.trim(),r=f.input.value.trim();if(!n){h.disabled=!1,h.textContent=`Create ${o.entityLabel}`,d.input.focus();return}let s=(Number.parseInt(e.childCount??0,10)||0)+1,c={statement:n,description:r||null,displayOrder:s};o.parentField===`projectId`||(c[o.parentField]=e.payload?.id);try{await Jn(o.endpoint,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(c)}),a(),await i?.()}catch(e){throw h.disabled=!1,h.textContent=`Create ${o.entityLabel}`,e}}),c}function or(e,t,n,r,i,a,o,s,c,l,u,d){let f=d?.permission===`Edit`,p=[],m=Gn(e.nodeType),h=Number.parseInt(e?.childCount??0,10)||0,g=Number.parseInt(e?._hiddenDescendantCount??0,10)||0,_=h>0||g>0,v=_&&!!c?.(e);return m&&p.push({id:`create-child`,label:`Create New ${m}`,danger:!1,disabled:!f,disabledReason:`Requires Edit permission.`,handler:async()=>{o(e,t,n,r)}}),_&&p.push({id:v?`reveal-children`:`hide-children`,label:v?`Reveal Children`:`Hide Children`,danger:!1,handler:async()=>{await l?.(e,!v)}}),v&&g>0&&p.push({id:`reveal-next-level`,label:`Reveal Next Level`,danger:!1,handler:async()=>{await u?.(e)}}),Z(e.nodeType)===`moment`&&p.push({id:`change-status`,label:`Change Status`,danger:!1,disabled:!f,disabledReason:`Requires Edit permission.`,handler:async()=>{s(e,r)}}),p.push({id:`delete`,label:`Delete`,danger:!0,disabled:!f,disabledReason:`Requires Edit permission.`,handler:async()=>{let t=Wn(e)||Z(e.nodeType)||`item`,n=e.nodeType===`root`?`project`:t;if(a?.(),!await Xn(n))return;if(Z(e.nodeType)===`root`){await Jn(Un(`root`),{method:`DELETE`}),await i?.();return}let o=Un(e.nodeType,e.payload?.id);if(!o)throw Error(`Unable to determine the delete route for this node.`);await Jn(o,{method:`DELETE`}),await r?.()}}),p}function sr(e){let t=document.createElement(`div`);t.className=`graph-context-menu`;for(let n of e){let e=document.createElement(`button`);e.type=`button`,e.className=`graph-context-menu__item${n.danger?` graph-context-menu__item--danger`:``}`,e.textContent=n.label,n.disabled&&(e.disabled=!0,e.className+=` graph-context-menu__item--disabled`,n.disabledReason&&(e.title=n.disabledReason)),e.addEventListener(`click`,async e=>{e.preventDefault(),e.stopPropagation(),!n.disabled&&await n.handler()}),t.appendChild(e)}return t}function cr({owner:e,project:t,getAvailableStrides:n,onGraphMutated:r,onProjectDeleted:i,isNodeChildrenHidden:a,setNodeChildrenHidden:o,revealNextLevel:s,permission:c}={}){Y=e,X=t,Vn=c;let l=null,u=document.createElement(`div`),d=document.createElement(`div`),f=()=>{let e=document.getElementById(`graph-viewport`);return e&&document.fullscreenElement===e?e:document.body},p=Bn(document.createElement(`div`),{trigger:`manual`,appendTo:f,content:document.createElement(`div`),allowHTML:!1,interactive:!0,hideOnClick:!0,placement:`right-start`,theme:`graph-menu`,animation:!1,offset:[8,8],onHidden(e){e.setContent(document.createElement(`div`))}}),m=Bn(u,{trigger:`manual`,appendTo:f,content:d,allowHTML:!1,interactive:!0,hideOnClick:!0,placement:`bottom-start`,theme:`graph-menu`,animation:!1,offset:[0,8],getReferenceClientRect:()=>l??new DOMRect(0,0,0,0),onHidden(){d.replaceChildren()}});function h(){p.hide()}function g(){h(),m.hide()}function _(){g()}function v(){p.destroy(),m.destroy(),d.replaceChildren()}function y(e,t,r,i){let a=l??new DOMRect(0,0,0,0),o=new DOMRect(a.right+12,a.top,1,1),s=ar(e,t,r,n,i,g);s&&(p.setProps({getReferenceClientRect:()=>o}),p.setContent(s),p.show())}function b(e,t){let n=l??new DOMRect(0,0,0,0),r=new DOMRect(n.right+12,n.top,1,1),i=ir(e,t,g);i&&(p.setProps({getReferenceClientRect:()=>r}),p.setContent(i),p.show())}function x(n,c){let u=Number(n?.clientX??0),f=Number(n?.clientY??0);l=new DOMRect(u,f,1,1);let p=or(c,e,t,r,i,g,y,b,a,o,s,Vn);d.replaceChildren(sr(p)),m.setProps({getReferenceClientRect:()=>l}),m.show()}return{hide:_,destroy:v,open:x}}var Q={owner:null,project:null,d3:null,rawTree:null,filteredTree:null,totalRenderableNodes:0,availableStrides:[],filters:yr(),zoomTransform:null,userZoomTransform:null,focusNodeId:null,suppressZoomStateUpdate:!1,zoomBehavior:null,filterDebounceId:null,applyTimer:null,contextMenu:null,pageShowRefreshHandler:null,collapsedNodeIds:new Set,hasRendered:!1,animationSpeed:.25};function lr(e){return Array.isArray(e?.children)&&e.children.length>0}function ur(e){return!!e&&Q.collapsedNodeIds.has(e)}function dr(e,t){e&&(t?Q.collapsedNodeIds.add(e):Q.collapsedNodeIds.delete(e))}function fr(e){return lr(e)?e.children.reduce((e,t)=>e+De(t),0):0}function pr(){if(!Q.rawTree){Q.collapsedNodeIds.clear();return}let e=new Set;for(let t of Q.collapsedNodeIds){let n=Re(Q.rawTree,t);n&&lr(n)&&e.add(t)}Q.collapsedNodeIds=e}function mr(){if(!Q.rawTree)return;let e=new Set;for(let t of Q.rawTree.children??[])lr(t)&&e.add(t.id);Q.collapsedNodeIds=e}function hr(e){if(!Q.rawTree||!e?.id)return;let t=Re(Q.rawTree,e.id);if(t){dr(t.id,!1);for(let e of t.children??[])lr(e)&&dr(e.id,!0)}}function gr(){Q.collapsedNodeIds.clear()}function _r(){try{let e=I(new URLSearchParams(window.location.search).get(`debugGraphFocus`));return e===`1`||e===`true`||e===`yes`||e===`on`?!0:window.localStorage?.getItem(`pmo.debugGraphFocus`)===`1`}catch{return!1}}function vr(e,t){_r()&&console.info(`[graph-focus]`,e,t)}function yr(){return{search:``,includeChildren:!1,types:new Set(F),effort:`all`,stride:`all`,status:`all`,assignment:`all`}}function br(e){if(e==null)return new Set(F);let t=new Set;for(let n of String(e).split(`,`)){let e=I(n);F.includes(e)&&t.add(e)}return xr(t)}function xr(e){let t=Array.from(e??[]).filter(e=>we.has(e));if(t.length===0)return new Set;let n=t.map(e=>we.get(e)),r=Math.min(...n),i=Math.max(...n);return new Set(F.slice(r,i+1))}function Sr(e){let t=I(e);return!t||t===`all`?`all`:[`done`,`blocked`,`inprogress`,`todo`,`other`].includes(t)?t:t.includes(`green`)||t.includes(`done`)?`done`:t.includes(`black`)||t.includes(`blocked`)?`blocked`:t.includes(`orange`)||t.includes(`yellow`)||t.includes(`amber`)||t.includes(`inprogress`)||t.includes(`in-progress`)?`inprogress`:t.includes(`red`)||t.includes(`todo`)?`todo`:`other`}function Cr(e){return I(e)===`assigned-to-me`?`assigned-to-me`:`all`}function wr(e){let t=I(e);return t===`all`||t===`unestimated`?t:[`xs`,`s`,`m`,`l`,`xl`,`xxl`,`xxxl`].includes(t)?t.toUpperCase():`all`}function Tr(e){let t=I(e);return t===`all`||t===`backlog`||/^\d+$/.test(t)?t:`all`}function Er(e){switch(e){case`promise`:return`Promise`;case`epic`:return`Epic`;case`journey`:return`Journey`;case`flow`:return`Flow`;case`moment`:return`Moment`;default:return e}}function Dr(e){return Ue(`moment`,e,[])}function Or(e){return Ue(`flow`,e,(e.moments??[]).map(Dr))}function kr(e){return Ue(`journey`,e,(e.flows??[]).map(Or))}function Ar(e){return Ue(`epic`,e,(e.journeys??[]).map(kr))}function jr(e){return Ue(`promise`,e,(e.epics??[]).map(Ar))}function Mr(e,t){if(e.nodeType===`root`||!t.types.has(e.nodeType)||t.search&&!(e._searchText??be(e)).includes(t.search)||t.status!==`all`&&(e._statusBucket??k(e.payload?.statusColor))!==t.status)return!1;if(t.assignment===`assigned-to-me`){if(e.nodeType!==`moment`)return!1;let t=w();if(t==null||e.payload?.ownerId!==t)return!1}if(t.effort!==`all`){if(e.nodeType!==`moment`)return!1;let n=e._effortBucket??Ae(e.payload?.effortEstimate);if(t.effort!==n)return!1}if(t.stride!==`all`){if(e.nodeType!==`moment`)return!1;let n=e._strideBucket??ke(e.payload);if(t.stride!==n)return!1}return!0}function Nr(e,t){e.nodeType!==`root`&&(t.visibleNodes+=1);let n=ur(e.id),r=n?fr(e):0;return r>0&&(t.hiddenNodes+=r),{...e,_searchMatched:!1,_isCollapsed:n,_hiddenDescendantCount:r,children:n?[]:(e.children??[]).map(e=>Nr(e,t))}}function Pr(e,t,n,r=!1){let i=ur(e.id),a=i?fr(e):0,o=!r&&t.search&&(e._searchText??be(e)).includes(t.search);if(o&&t.includeChildren&&!i)return n.directMatches+=1,{...Nr(e,n),_searchMatched:!0};a>0&&(n.hiddenNodes+=a);let s=i?[]:(e.children??[]).map(e=>Pr(e,t,n)).filter(Boolean),c=!r&&Mr(e,t);return c&&(n.directMatches+=1),r?{...e,_searchMatched:!1,_isCollapsed:i,_hiddenDescendantCount:a,children:s}:c||s.length>0?(n.visibleNodes+=1,{...e,_searchMatched:!!(o&&t.search),_isCollapsed:i,_hiddenDescendantCount:a,children:s}):null}function Fr(){let e=new URLSearchParams(window.location.search),t=I(e.get(`q`)),n=e.get(`children`)===`1`||e.get(`children`)===`true`,r=Sr(e.get(`status`)??``),i=Cr(e.get(`assignment`)??``),a=wr(e.get(`effort`)??``),o=Tr(e.get(`stride`)??``),s=e.get(`types`);return{search:t,includeChildren:n,status:r,assignment:i,effort:a,stride:o,types:s===null?new Set(F):xr(br(s))}}function Ir(){let e=new URLSearchParams(window.location.search);return String(e.get(`focus`)??``).trim()||null}function Lr(e){let t=new URLSearchParams;e.search&&t.set(`q`,e.search),e.includeChildren&&t.set(`children`,`1`);let n=F.filter(t=>e.types.has(t));n.length>0&&n.length<F.length?t.set(`types`,n.join(`,`)):n.length===0&&t.set(`types`,``),e.status!==`all`&&t.set(`status`,e.status),e.assignment!==`all`&&t.set(`assignment`,e.assignment),e.effort!==`all`&&t.set(`effort`,e.effort),e.stride!==`all`&&t.set(`stride`,e.stride),Q.focusNodeId&&t.set(`focus`,Q.focusNodeId);let r=`${window.location.pathname}${t.toString()?`?${t.toString()}`:``}${window.location.hash||``}`;window.history.replaceState({owner:Q.owner,project:Q.project},``,r)}function Rr(){let e=document.getElementById(`graph-filter-bar`);if(!e)return;let t=[`<option value="all" ${Q.filters.stride===`all`?`selected`:``}>All strides</option>`,`<option value="backlog" ${Q.filters.stride===`backlog`?`selected`:``}>Backlog</option>`,...Q.availableStrides.map(e=>{let t=e.name?`Stride #${e.id} - ${m(e.name)}`:`Stride #${e.id}`;return`<option value="${String(e.id)}" ${String(Q.filters.stride)===String(e.id)?`selected`:``}>${t}</option>`})].join(``),n=F.map(e=>`
            <label class="graph-filter-chip">
                <input type="checkbox" data-filter-type value="${e}" ${Q.filters.types.has(e)?`checked`:``} />
                <span>${Er(e)}</span>
            </label>
        `).join(``);e.innerHTML=`
        <div class="graph-filter-row">
            <div class="graph-filter-search-group">
                <label class="graph-filter-field">
                    <span>Search</span>
                    <input id="graph-filter-search" class="graph-filter-input" type="search" placeholder="Search statements or descriptions" value="${m(Q.filters.search)}" />
                </label>

                <div class="graph-filter-field graph-filter-checkbox-field">
                    <span>Search options</span>
                    <div class="form-check form-switch graph-filter-switch">
                        <input id="graph-filter-include-children" class="form-check-input" type="checkbox" role="switch" ${Q.filters.includeChildren?`checked`:``} />
                        <label class="form-check-label graph-filter-switch-label" for="graph-filter-include-children">Include Children</label>
                    </div>
                </div>
            </div>

            <label class="graph-filter-field">
                <span>Effort estimate</span>
                <select id="graph-filter-effort" class="graph-filter-select">
                    <option value="all" ${Q.filters.effort===`all`?`selected`:``}>All efforts</option>
                    <option value="unestimated" ${Q.filters.effort===`unestimated`?`selected`:``}>Unestimated</option>
                    <option value="XS" ${Q.filters.effort===`XS`?`selected`:``}>XS</option>
                    <option value="S" ${Q.filters.effort===`S`?`selected`:``}>S</option>
                    <option value="M" ${Q.filters.effort===`M`?`selected`:``}>M</option>
                    <option value="L" ${Q.filters.effort===`L`?`selected`:``}>L</option>
                    <option value="XL" ${Q.filters.effort===`XL`?`selected`:``}>XL</option>
                    <option value="XXL" ${Q.filters.effort===`XXL`?`selected`:``}>XXL</option>
                    <option value="XXXL" ${Q.filters.effort===`XXXL`?`selected`:``}>XXXL</option>
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
                    <option value="all" ${Q.filters.status===`all`?`selected`:``}>All statuses</option>
                    ${fe.map(e=>{let t=e.value.toLowerCase();return`<option value="${t}" ${Q.filters.status===t?`selected`:``}>${e.icon} ${e.label}</option>`}).join(``)}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Assigned to me</span>
                <select id="graph-filter-assignment" class="graph-filter-select">
                    <option value="all" ${Q.filters.assignment===`all`?`selected`:``}>All</option>
                    <option value="assigned-to-me" ${Q.filters.assignment===`assigned-to-me`?`selected`:``}>Assigned to me</option>
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
    `,Vr()}function zr(e){let t=document.getElementById(`graph-loading-state`);t&&(t.hidden=!e,t.classList.toggle(`d-none`,!e),t.setAttribute(`aria-hidden`,e?`false`:`true`))}function Br(e,t,n,r){let i=document.getElementById(e);i&&i.addEventListener(t,()=>{n(i,Q.filters),(r?$:Wr)()})}function Vr(){Br(`graph-filter-search`,`input`,(e,t)=>{t.search=I(e.value)}),Br(`graph-filter-include-children`,`change`,(e,t)=>{t.includeChildren=e.checked},!0),Br(`graph-filter-effort`,`change`,(e,t)=>{t.effort=wr(e.value)},!0),Br(`graph-filter-stride`,`change`,(e,t)=>{t.stride=Tr(e.value)},!0),Br(`graph-filter-status`,`change`,(e,t)=>{t.status=Sr(e.value)},!0),Br(`graph-filter-assignment`,`change`,(e,t)=>{t.assignment=Cr(e.value)},!0);let e=document.getElementById(`graph-filter-reset`),t=document.getElementById(`graph-filter-hide-all`),n=document.getElementById(`graph-filter-expand-all`),r=document.getElementById(`graph-filter-refresh`);document.querySelectorAll(`[data-filter-type]`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target,n=!!t.checked,r=new Set(Q.filters.types);if(!n&&F.every(e=>r.has(e))){let e=F.indexOf(t.value);if(e>=0)for(let t=e;t<F.length;t++){let e=F[t],n=document.querySelector(`[data-filter-type][value="${e}"]`);n&&(n.checked=!1),r.delete(e)}}else n?r.add(t.value):r.delete(t.value);let i=xr(r);Q.filters.types=i,Ur(),$()})}),e&&e.addEventListener(`click`,()=>{Q.filters=yr(),gr(),Ur(),$()}),t&&t.addEventListener(`click`,()=>{mr(),$(0)}),n&&n.addEventListener(`click`,()=>{gr(),$(0)}),r&&r.addEventListener(`click`,()=>{Xr()})}var Hr=[[`graph-filter-search`,`value`,`search`],[`graph-filter-include-children`,`checked`,`includeChildren`],[`graph-filter-effort`,`value`,`effort`],[`graph-filter-stride`,`value`,`stride`],[`graph-filter-status`,`value`,`status`],[`graph-filter-assignment`,`value`,`assignment`]];function Ur(){Hr.forEach(([e,t,n])=>{let r=document.getElementById(e);r&&(r[t]=Q.filters[n])}),document.querySelectorAll(`[data-filter-type]`).forEach(e=>{e.checked=Q.filters.types.has(e.value)})}function Wr(){Q.filterDebounceId&&window.clearTimeout(Q.filterDebounceId),Q.filterDebounceId=window.setTimeout(()=>{Yr()},150)}function $(e=40){Q.applyTimer&&window.clearTimeout(Q.applyTimer),Q.applyTimer=window.setTimeout(()=>{Q.applyTimer=null,Yr()},e)}function Gr(e){let t=document.getElementById(`graph-filter-summary`);if(!t)return;if(!Q.rawTree){t.textContent=`Loading graph...`;return}if(e.visibleNodes===0){t.textContent=`No promises match the current filters.`;return}let n=`${e.visibleNodes} visible promise${e.visibleNodes===1?``:`s`}`,r=`${Q.totalRenderableNodes} total promise${Q.totalRenderableNodes===1?``:`s`}`;if(e.directMatches===e.visibleNodes){t.textContent=`Showing ${n} of ${r}${e.hiddenNodes>0?` (${e.hiddenNodes} hidden)`:``}.`;return}t.textContent=`Showing ${n} of ${r} (${e.directMatches} direct match${e.directMatches===1?``:`es`}${e.hiddenNodes>0?`, ${e.hiddenNodes} hidden`:``}).`}function Kr(e){if(!e)return null;if(e._searchMatched)return e;for(let t of e.children??[]){let e=Kr(t);if(e)return e}return null}function qr(e,t,n){if(!e||!t||!n)return;let r=n.select(t);document.getElementById(`graph-zoom-in`)?.addEventListener(`click`,()=>{r.transition().duration(200).call(e.scaleBy,1.4)}),document.getElementById(`graph-zoom-out`)?.addEventListener(`click`,()=>{r.transition().duration(200).call(e.scaleBy,.7)}),document.getElementById(`graph-zoom-reset`)?.addEventListener(`click`,()=>{r.transition().duration(200).call(e.transform,n.zoomIdentity)}),document.getElementById(`graph-fullscreen-btn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`graph-viewport`);document.fullscreenElement?document.exitFullscreen?.()?.catch(()=>{}):e.requestFullscreen?.()?.catch(()=>{})})}function Jr(e,t,n,r=null,i=null,a=!1){let o=document.getElementById(`graph-content`),s=document.getElementById(`graph-viewport`);if(!o)return;Q.contextMenu?.hide?.();let c=document.getElementById(`graph-animation-speed`);Q.animationSpeed=c&&Number.parseFloat(c.value)||1;let l=Qe(o,t,n,{owner:Q.owner,project:Q.project,focusNodeId:i?.id??null,focusNodeData:i,animate:a,animationSpeed:Q.animationSpeed,enableZoom:!0,compact:!1,renderRootCard:!0,restoreTransform:r,viewportElement:s,clipPathIdPrefix:`graph-card-clip`,emptyMessage:`No cards match the current filters.`,onZoom:(e,t={})=>{Q.zoomTransform=e,t.user&&!Q.suppressZoomStateUpdate&&(Q.userZoomTransform=e)},onContextMenu:(e,t)=>{Q.contextMenu?.open?.(e,t)}});l?.zoom&&(Q.zoomBehavior=l.zoom,l.node&&qr(l.zoom,l.node,t))}function Yr(){if(!Q.rawTree||!Q.d3)return;let e={visibleNodes:0,directMatches:0,hiddenNodes:0};Q.filteredTree=Pr(Q.rawTree,Q.filters,e,!0);let t=Q.hasRendered;Lr(Q.filters);let n=document.getElementById(`graph-content`);if(Q.filteredTree){let r=Q.filters.search?Kr(Q.filteredTree):Q.focusNodeId?Re(Q.filteredTree,Q.focusNodeId):Q.userZoomTransform?null:Q.filteredTree;vr(`apply-filters-focus-selection`,{requestedFocusNodeId:Q.focusNodeId,selectedFocusNodeId:r?.id??null,selectedFocusNodeType:r?.nodeType??null,hasUserZoomTransform:!!Q.userZoomTransform,searchFilter:Q.filters.search,includeChildren:Q.filters.includeChildren,visibleNodeCount:e.visibleNodes,directMatches:e.directMatches,hiddenNodeCount:e.hiddenNodes});let i=r?null:Q.userZoomTransform??Q.zoomTransform;Jr(n,Q.d3,Q.filteredTree,i,r,t)}else Se(n,`No cards match the current filters.`);Q.hasRendered=!0,Gr(e)}async function Xr(){let e=document.getElementById(`error-text`),t=document.getElementById(`success-text`);zr(!0),e&&(e.textContent=``),t&&(t.textContent=``);try{let e=await qe(Q.owner,Q.project),n={id:e.id??e.Id,name:e.name??e.Name,description:e.description??e.Description},r=(e.promises??e.Promises??[]).map(jr);Q.rawTree=$e(r,Q.owner,Q.project,n),pr(),Q.totalRenderableNodes=De(Q.rawTree),Yr(),t&&(t.textContent=`Loaded ${r.length} top-level promise${r.length===1?``:`s`}.`)}catch(t){console.error(`Error loading project graph:`,t),e&&(e.textContent=`Unable to load the project graph.`)}finally{zr(!1)}}async function Zr(e,t){let n=await E(e,t);Q.availableStrides=(Array.isArray(n)?n:[]).sort((e,t)=>{let n=new Date(e.startDate??0).getTime(),r=new Date(t.startDate??0).getTime();return n===r?Number(e.id)-Number(t.id):n-r})}async function Qr(e,t,n,r){let i=document.getElementById(`error-text`),a=document.getElementById(`success-text`);Q.pageShowRefreshHandler&&=(window.removeEventListener(`pageshow`,Q.pageShowRefreshHandler),null),Q.owner=e,Q.project=t,Q.d3=window.d3,Q.filters=Fr(),Q.focusNodeId=Ir(),Q.zoomTransform=null,Q.userZoomTransform=null,Q.suppressZoomStateUpdate=!1,Q.rawTree=null,Q.filteredTree=null,Q.totalRenderableNodes=0,Q.availableStrides=[],Q.collapsedNodeIds=new Set,Q.hasRendered=!1,Q.contextMenu?.destroy?.(),Q.contextMenu=cr({owner:e,project:t,getAvailableStrides:()=>Q.availableStrides,onGraphMutated:Xr,isNodeChildrenHidden:e=>ur(e?.id),setNodeChildrenHidden:async(e,t)=>{let n=e?.id;n&&(dr(n,t),$(0))},revealNextLevel:async e=>{hr(e),$(0)},onProjectDeleted:()=>{window.location.assign(`/projects`)},permission:r}),Q.pageShowRefreshHandler=e=>{e.persisted&&Xr()},window.addEventListener(`pageshow`,Q.pageShowRefreshHandler),document.removeEventListener(`fullscreenchange`,Q._onFullscreenChange),Q._onFullscreenChange=()=>{let e=document.getElementById(`graph-fullscreen-btn`);if(!e)return;let t=e.querySelector(`i`);document.fullscreenElement?(t?.classList.replace(`bi-arrows-angle-expand`,`bi-arrows-angle-contract`),e.setAttribute(`aria-label`,`Exit fullscreen`)):(t?.classList.replace(`bi-arrows-angle-contract`,`bi-arrows-angle-expand`),e.setAttribute(`aria-label`,`Fullscreen`)),Yr()},document.addEventListener(`fullscreenchange`,Q._onFullscreenChange),await Zr(e,t),Rr(),Ur(),i&&(i.textContent=``),a&&(a.textContent=``),zr(!0),await Xr()}function $r(e,{showEntity:t=!1}={}){return!e||e.length===0?s({icon:`bi-activity`,title:`No activity recorded yet.`,description:`Changes made to this project will appear here.`}):`
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
                <time class="audit-time" title="${m(ti(e.occurredAtUtc))}">${m(ni(e.occurredAtUtc))}</time>
            </td>
            <td>${m(si(e))}</td>
            <td>${m(ci(e))}</td>
            <td>${m(li(e))}</td>
            <td>${m(ui(e))}</td>
            <td>
                <a href="#" class="audit-show-details-link" data-audit-details="${m(fi(e))}">show details</a>
            </td>
        </tr>
    `).join(``)}
                </tbody>
            </table>
        </div>
    `}function ei(){return`
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
    `}function ti(e){if(!e)return`Unknown`;let t=new Date(e);return Number.isNaN(t.getTime())?String(e):t.toLocaleString(void 0,{year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!0})}function ni(e){if(!e)return`Unknown`;let t=new Date(e);if(Number.isNaN(t.getTime()))return String(e);if(t.getTime()>Date.now())return`just now`;let n=Math.max(0,Math.round((Date.now()-t.getTime())/1e3)),r=n,i=new Intl.RelativeTimeFormat(void 0,{numeric:`auto`});for(let[e,t]of[[`year`,3600*24*365],[`month`,3600*24*30],[`week`,3600*24*7],[`day`,3600*24],[`hour`,3600],[`minute`,60],[`second`,1]])if(r>=t||e===`second`){let r=Math.round(n/t);return i.format(-r,e)}return i.format(0,`second`)}function ri(e){return`${ci(e)} ${ui(e)}`}function ii(e){return`
        <dl class="row mb-0">
            <dt class="col-sm-3">Time</dt>
            <dd class="col-sm-9"><time title="${m(ti(e.occurredAtUtc))}">${m(ti(e.occurredAtUtc))}</time></dd>
            <dt class="col-sm-3">User</dt>
            <dd class="col-sm-9">${m(si(e))}</dd>
            <dt class="col-sm-3">Event Type</dt>
            <dd class="col-sm-9">${m(ci(e))}</dd>
            <dt class="col-sm-3">Change</dt>
            <dd class="col-sm-9">${m(li(e))}</dd>
            <dt class="col-sm-3">Items Affected</dt>
            <dd class="col-sm-9">${m(ui(e))}</dd>
            <dt class="col-sm-3">Details</dt>
            <dd class="col-sm-9">${oi(e.changes)}</dd>
        </dl>
    `}function ai(e){return{title:ri(e),html:ii(e)}}function oi(e){if(!Array.isArray(e)||e.length===0)return`<span class="text-muted">No field details</span>`;let t=e.filter(e=>!di(e.fieldName));return t.length===0?`<span class="text-muted">No visible field changes</span>`:`<ul class="mb-0 ps-3">${t.map(e=>`
        <li>${m(e.fieldName)}: ${m(pi(e.before))} → ${m(pi(e.after))}</li>
    `).join(``)}</ul>`}function si(e){return e.actorEmail||e.actorSubject||e.actorUserId||`System`}function ci(e){return e.actionType===`StatusChanged`?`Status Changed`:e.actionType===`Created`?`Created`:e.actionType===`Deleted`?`Deleted`:`Updated`}function li(e){let t=Array.isArray(e.changes)?e.changes.filter(e=>!di(e.fieldName)):[];if(e.actionType===`StatusChanged`){let e=t.find(e=>e.fieldName===`Status`);if(e)return`${pi(e.before)} → ${pi(e.after)}`}return e.actionType===`Created`?`Created`:e.actionType===`Deleted`?`Deleted`:t.length===0?`Updated`:t.map(e=>e.fieldName).join(`, `)}function ui(e){return`${e.entityType} #${e.entityId}`}function di(e){return String(e).toLowerCase()===`updatedat`}function fi(e){return btoa(unescape(encodeURIComponent(JSON.stringify(ai(e)))))}function pi(e){return e==null||e===``?`blank`:typeof e==`object`?JSON.stringify(e):String(e)}var mi=25;function hi(e,t,n,r){let i=document.getElementById(`project-title`),a=document.getElementById(`error-text`),o=document.getElementById(`audit-history-list`),s=document.getElementById(`audit-history-loading`),c=document.getElementById(`audit-history-pagination`),l=document.getElementById(`back-to-projects-btn`),u=`project-history-audit-modal-container`,d=1,f=0,p=!1,m=0;if(!i||!a||!o||!s||!c||!l)return;y();async function h(){try{let e=await Xe(n,r);i.textContent=e?.name?`${e.name} activity`:`Project ${n}/${r} activity`}catch{i.textContent=`Project ${n}/${r} activity`}}function _(){return Math.max(1,Math.ceil(m/mi))}function v(){let e=_(),t=d<=1,n=d>=e;c.innerHTML=`
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
        `,c.querySelectorAll(`[data-page-action]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.pageAction;n===`previous`&&d>1&&(--d,x()),n===`next`&&d<e&&(d+=1,x())})})}function y(){let e=document.getElementById(u);e||(e=document.createElement(`div`),e.id=u,document.body.appendChild(e)),e.innerHTML=ei()}function b(e){let t=ai(e),n=document.getElementById(`audit-details-modal-title`),r=document.getElementById(`audit-details-modal-body`),i=document.getElementById(`audit-details-modal`);!n||!r||!i||(n.textContent=t.title,r.innerHTML=t.html,typeof bootstrap<`u`&&bootstrap.Modal&&bootstrap.Modal.getOrCreateInstance(i).show())}async function x(e=!1){if(!p){p=!0,a.textContent=``,e&&(d=1,f=0,o.innerHTML=``),s.hidden=!1,o.hidden=!0;try{f=(d-1)*mi;let{items:e,totalCount:t}=await He(n,r,mi,f);m=t,o.innerHTML=$r(e,{showEntity:!0}),S(e),v()}catch(t){e?o.innerHTML=`<p class="text-danger mb-0">Failed to load audit history.</p>`:a.textContent=`Failed to load more audit history.`,console.warn(`Failed to load project audit history page:`,t)}finally{p=!1,s.hidden=!0,o.hidden=!1}}}function S(e){o.querySelectorAll(`.audit-show-details-link`).forEach((t,n)=>{t.addEventListener(`click`,t=>{t.preventDefault(),b(e[n])})})}h().then(()=>x(!0)),l.addEventListener(`click`,()=>{g(`/projects`,e,t)})}function gi(e,t){let n=document.getElementById(`project-list-table-body`),r=document.getElementById(`error-text`),i=document.getElementById(`success-text`),a=document.getElementById(`add-project-link`);!n||!r||!i||(a&&a.addEventListener(`click`,n=>{n.preventDefault(),g(`/projects/add`,e,t)}),r.textContent=``,i.textContent=``,n.innerHTML=``,xe().then(r=>{if(!r||r.length===0){n.innerHTML=v({icon:`bi-folder`,title:`There are no projects yet`,description:`Click "Add Project" to create your first project.`,colspan:2,button:{text:`Create your first project`,icon:`bi-plus-circle`,id:`empty-state-add-project-btn`}});let r=document.getElementById(`empty-state-add-project-btn`);r&&r.addEventListener(`click`,n=>{n.preventDefault(),g(`/projects/add`,e,t)});return}r.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
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
            `,n.appendChild(t)}),n.querySelectorAll(`.view-iterations-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),g(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/strides`,e,t)})}),n.querySelectorAll(`.graph-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),g(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/graph`,e,t)})}),n.querySelectorAll(`.settings-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),g(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/settings`,e,t)})}),n.querySelectorAll(`.share-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),g(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/share`,e,t)})}),n.querySelectorAll(`.audit-log-btn[data-owner-slug]`).forEach(n=>{n.addEventListener(`click`,r=>{r.preventDefault(),g(`/${n.getAttribute(`data-owner-slug`)}/${n.getAttribute(`data-project-slug`)}/history`,e,t)})})}).catch(e=>{e.message.includes(`404`)?r.textContent=`Endpoint not found`:e.message.includes(`500`)?r.textContent=`Internal server error`:r.textContent=`Unknown error`}))}function _i(e,t,n,r,i){let a=document.getElementById(`project-settings-form`),o=document.getElementById(`project-title-input`),s=document.getElementById(`project-description-input`),c=document.getElementById(`project-summary-panel`),l=document.getElementById(`project-summary-loading`),u=document.getElementById(`error-text`),d=document.getElementById(`success-text`),f=document.getElementById(`export-project-btn`),p=document.getElementById(`delete-project-btn`),h=document.getElementById(`delete-project-btn-spinner`),_=document.getElementById(`delete-project-btn-label`),v=document.getElementById(`project-delete-confirmation-input`),y=document.getElementById(`project-delete-confirmation-text`),b=document.getElementById(`save-project-settings-btn`),x=document.getElementById(`project-title-view`),S=document.getElementById(`edit-project-title-btn`),C=document.getElementById(`project-description-view`),w=document.getElementById(`edit-project-desc-btn`),T=null,E=null;o&&x&&S&&(T=U(o,x,S)),s&&C&&w&&(E=U(s,C,w,b));function D(){let e=i?.permission===`Edit`,t=i?.isOwner===!0;if(!e){let e=document.getElementById(`edit-project-title-btn`),t=document.getElementById(`edit-project-desc-btn`),n=document.getElementById(`save-project-settings-btn`),r=document.getElementById(`project-title-input`),i=document.getElementById(`project-description-input`);e&&(e.disabled=!0,e.title=`Requires Edit permission.`),t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0),i&&(i.disabled=!0)}if(!t){let e=document.querySelector(`.detail-card:last-child`);if(e){let t=e.querySelector(`#delete-project-btn`),n=e.querySelector(`#project-delete-confirmation-input`);t&&(t.disabled=!0,t.title=`Only the project owner can delete this project.`),n&&(n.disabled=!0)}}}let O=null,k={counts:{promises:0,epics:0,journeys:0,flows:0,moments:0,totalPromises:0},memberCount:0,firstPromise:null},A=null,j=null;if(!a||!o||!s||!c||!l||!u||!d||!f||!p||!v||!y)return;function M(){u.textContent=``,d.textContent=``}function ee(e){l.hidden=!e,c.hidden=e}function te(){if(typeof bootstrap>`u`||!bootstrap.Popover){d.textContent=`Exported!`,window.setTimeout(()=>{d.textContent===`Exported!`&&(d.textContent=``)},2e3);return}j||=new bootstrap.Popover(f,{trigger:`manual`,placement:`top`,content:`Exported!`}),j.show(),A&&window.clearTimeout(A),A=window.setTimeout(()=>{j?.hide()},2e3)}function ne(e){return`delete ${e}`}function re(e){let t=ne(e);y.textContent=t,v.value=``,p.disabled=!0,p.dataset.confirmationPhrase=t}function ie(e){p.disabled=e,h.classList.toggle(`d-none`,!e),_.textContent=e?`Deleting Project...`:`Delete Project`}function ae(){let e=p.dataset.confirmationPhrase||``;p.disabled=v.value!==e}function oe(e,t,n){Rn(c,[{label:`Created`,value:yi(e.createdAt)},{label:`Team Members`,value:n},{label:`Promises`,value:t.promises},{label:`Epics`,value:t.epics},{label:`Journeys`,value:t.journeys},{label:`Flows`,value:t.flows},{label:`Moments`,value:t.moments},{label:`Total Promises`,value:t.totalPromises}])}async function se(e){ee(!0);try{let[t,i]=await Promise.all([qe(n,r),ue(n,r).catch(()=>[])]),a=(t.promises??[]).flatMap(e=>e.epics??[]),o=a.flatMap(e=>e.journeys??[]),s=o.flatMap(e=>e.flows??[]),c=s.flatMap(e=>e.moments??[]);k={counts:{promises:(t.promises??[]).length,epics:a.length,journeys:o.length,flows:s.length,moments:c.length,totalPromises:(t.promises??[]).length+a.length+o.length+s.length+c.length},memberCount:i.length,firstPromise:(t.promises??[])[0]??null},oe(e,k.counts,k.memberCount)}catch(t){k={counts:{promises:0,epics:0,journeys:0,flows:0,moments:0,totalPromises:0},memberCount:0,firstPromise:null},oe(e,k.counts,k.memberCount),console.warn(`Failed to load project summary:`,t)}finally{ee(!1)}}async function ce(){try{let e=await Xe(n,r);O=e,o.value=e.name??``,s.value=e.description??``,T&&T.showView(m(e.name??``)),E&&E.showView(V(e.description??``)),re(e.name??``),await se(e),k.firstPromise&&L(s,`Promise`,k.firstPromise.id)}catch(e){u.textContent=`Failed to load project settings.`,console.error(e)}}a.addEventListener(`submit`,async e=>{e.preventDefault(),M();let t=o.value.trim(),i=s.value.trim();if(!t){u.textContent=`Project title is required.`;return}try{let e=await je(n,r,{name:t,description:i||null});O=e,o.value=e.name??``,s.value=e.description??``,T&&T.showView(m(e.name??``)),E&&E.showSavedPopover(V(e.description??``)),re(e.name??``),oe(e,k.counts,k.memberCount),d.textContent=`Project settings saved.`}catch(e){u.textContent=e.message||`Failed to save project settings.`}}),v.addEventListener(`input`,ae),f.addEventListener(`click`,async()=>{M();try{vi(await Ne(n,r),`project-${n}-${r}-export.json`),te()}catch(e){u.textContent=e.message||`Failed to export project.`}}),p.addEventListener(`click`,async()=>{if(M(),!O){u.textContent=`Project is not loaded yet.`;return}if(v.value!==p.dataset.confirmationPhrase){u.textContent=`Type the exact confirmation phrase to delete the project.`;return}ie(!0);try{await Ke(n,r),g(`/projects`,e,t)}catch(e){u.textContent=e.message||`Failed to delete project.`}finally{ie(!1)}}),D(),ce()}function vi(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),1e3)}function yi(e){return ti(e)}function bi(e,t){let n=document.getElementById(e);if(n)return n;let r=document.createElement(`div`);return r.innerHTML=t.trim(),n=r.firstElementChild,n&&document.body.appendChild(n),n}function xi(){return bi(`revoke-modal`,`
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
    `)}function Si(e,t,n,r){let i=document.getElementById(`error-text`),a=document.getElementById(`loading-text`),o=document.getElementById(`success-text`),s=document.getElementById(`permissions-section`),c={items:[],highlightedIndex:-1,open:!1};function l(){let e=document.getElementById(`invite-autocomplete`);e&&(e.style.display=`none`,e.innerHTML=``),c={items:[],highlightedIndex:-1,open:!1}}function u(){let e=document.getElementById(`invite-autocomplete`);if(e){e.innerHTML=``;for(let t=0;t<c.items.length;t++){let n=c.items[t],r=document.createElement(`div`);r.className=`comment-autocomplete__item`+(t===c.highlightedIndex?` comment-autocomplete__item--highlight`:``),r.role=`option`,r.ariaSelected=String(t===c.highlightedIndex),r.textContent=n.name+` (`+n.email+`)`,r.dataset.index=String(t),r.addEventListener(`mousedown`,function(e){e.preventDefault(),d(parseInt(this.dataset.index,10))}),e.appendChild(r)}if(c.items.length>0){let t=e.children[c.highlightedIndex];t&&t.scrollIntoView({block:`nearest`})}}}function d(e){let t=c.items[e];if(!t)return;let n=document.getElementById(`invite-email`);n&&(n.value=t.email),l(),n?.focus()}async function f(e){if(e.length<1){l();return}let t;try{t=await ze(e)}catch{l();return}if(t&&t.length>0){c.items=t,c.highlightedIndex=0,c.open=!0;let e=document.getElementById(`invite-autocomplete`);e&&(e.style.display=`block`),u()}else l()}function p(){let e=document.getElementById(`invite-email`),t=document.getElementById(`invite-autocomplete`);if(!e||!t)return;let n=null;e.addEventListener(`input`,function(){n&&clearTimeout(n);let e=this.value.trim();if(!e){l();return}n=setTimeout(function(){f(e)},200)}),e.addEventListener(`keydown`,function(e){if(!(!c.open||c.items.length===0))switch(e.key){case`ArrowDown`:e.preventDefault(),c.highlightedIndex=(c.highlightedIndex+1)%c.items.length,u();break;case`ArrowUp`:e.preventDefault(),c.highlightedIndex=(c.highlightedIndex-1+c.items.length)%c.items.length,u();break;case`Enter`:e.preventDefault(),c.highlightedIndex>=0&&d(c.highlightedIndex);break;case`Tab`:c.highlightedIndex>=0?d(c.highlightedIndex):l();break;case`Escape`:e.preventDefault(),l();break}}),e.addEventListener(`blur`,function(){setTimeout(function(){document.activeElement!==t&&!t.contains(document.activeElement)&&l()},150)})}function h(n){let r=bi(`invite-modal`,`
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
        `),i=r?.querySelector(`#invite-modal-form`),a=r?.querySelector(`#invite-email`),s=r?.querySelector(`#invite-level`),c=r?.querySelector(`#invite-modal-error`),u=r?.querySelector(`#invite-modal-submit`);if(!i||!a||!s||!c||!u)return;i.replaceWith(i.cloneNode(!0));let d=r.querySelector(`#invite-modal-form`),f=r.querySelector(`#invite-email`),m=r.querySelector(`#invite-level`),h=r.querySelector(`#invite-modal-error`),g=r.querySelector(`#invite-modal-submit`);f.value=``,m.value=`View`,h.textContent=``,h.classList.add(`d-none`),g.disabled=!1,g.textContent=`Send Invitation`,l(),p(),d.addEventListener(`submit`,async i=>{i.preventDefault();let a=f.value.trim(),s=m.value;if(a){g.disabled=!0,g.textContent=`Sending...`,h.classList.add(`d-none`);try{await Oe(e,t,{email:a,level:s}),window.bootstrap?.Modal?.getOrCreateInstance(r)?.hide(),o&&(o.textContent=`Invitation sent.`,o.classList.remove(`d-none`)),await n.onInvited?.()}catch(e){h.textContent=e?.message||`Failed to invite user.`,h.classList.remove(`d-none`)}finally{g.disabled=!1,g.textContent=`Send Invitation`}}}),window.bootstrap?.Modal?.getOrCreateInstance(r)?.show()}async function g(){try{let n=r?.isOwner===!0,c=await Le(e,t);a&&a.classList.add(`d-none`),i&&i.classList.add(`d-none`),o&&o.classList.add(`d-none`);let l=c&&c.length>0?c.map(e=>`
                    <tr data-permission-id="${e.id}">
                        <td>${m(e.userName)}</td>
                        <td>${e.level}</td>
                        <td>${e.status}</td>
                        <td>${n?`<button class="btn btn-outline-danger btn-sm revoke-btn" data-permission-id="${e.id}">Revoke</button>`:`-`}</td>
                    </tr>`).join(``):v({icon:`bi-share`,title:`No permissions configured`,description:n?`Invite a user to get started.`:``,colspan:4,button:n?{text:`Invite`,icon:`bi-plus-circle`,id:`empty-state-invite-btn`}:void 0});s&&(s.innerHTML=`
                <div class="d-flex justify-content-between align-items-center">
                    <h2>Current Permissions</h2>
                    ${n?`<button id="invite-btn-top" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Invite</button>`:``}
                </div>
                <table class="table table-striped table-sm promisemodel-table">
                    <thead><tr><th>User</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${l}</tbody>
                </table>
                ${n?``:`<p class="text-muted mt-4">Only the project owner can manage permissions.</p>`}`),document.querySelectorAll(`.revoke-btn`).forEach(e=>{_(e)}),document.getElementById(`invite-btn-top`)?.addEventListener(`click`,()=>{h({owner:e,project:t,onInvited:g})}),document.getElementById(`empty-state-invite-btn`)?.addEventListener(`click`,()=>{h({owner:e,project:t,onInvited:g})})}catch{a&&a.classList.add(`d-none`),i&&(i.textContent=`Failed to load permissions.`,i.classList.remove(`d-none`))}}function _(n){!n||n.dataset.bound===`1`||(n.dataset.bound=`1`,n.addEventListener(`click`,async()=>{let r=parseInt(n.dataset.permissionId,10);if(!Number.isFinite(r))return;let a=xi(),s=a.querySelector(`#revoke-modal-confirm`);if(!s)return;let c=s.cloneNode(!0);s.parentElement.replaceChild(c,s),c.addEventListener(`click`,async()=>{c.disabled=!0;try{await We(e,t,r),window.bootstrap?.Modal?.getOrCreateInstance(a)?.hide();let i=window.scrollY;n.closest(`tr`)?.remove(),o&&(o.textContent=`Permission revoked.`,o.classList.remove(`d-none`)),window.scrollTo(0,i)}catch(e){i&&(i.textContent=`Failed to revoke permission.`,i.classList.remove(`d-none`)),console.error(e)}finally{c.disabled=!1}},{once:!0}),window.bootstrap?.Modal?.getOrCreateInstance(a)?.show()}))}g()}function Ci(e,t,n){switch(e){case`/projects`:f(`projects/list.html`,n).then(()=>gi(t,n)).catch(p(n,`project list`));break;case`/projects/add`:f(`projects/add.html`,n).then(()=>zn(t,n)).catch(p(n,`add project form`));break;default:x(n)}}function wi(e,t,n,r,i){W.set({owner:e,project:t,permission:void 0,isOwner:!1});let a=n.replace(/^\/+/,``).replace(/\/+$/,``),o=a?a.split(`/`):[];if(o.length===0){H(e,t).then(n=>{W.set({permission:n.permission,isOwner:n.isOwner}),Ln(e,t,r,i,n)});return}let s=o[0],c=o[1];switch(!0){case s===`strides`:H(e,t).then(n=>{W.set({permission:n.permission,isOwner:n.isOwner}),Ln(e,t,r,i,n)});break;case s===`graph`:Promise.all([f(`projects/graph.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),Qr(e,t,i,n)}).catch(p(i,`graph page`));break;case s===`settings`:Promise.all([f(`projects/settings.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),_i(r,i,e,t,n)}).catch(p(i,`project settings`));break;case s===`share`:Promise.all([f(`projects/share.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),Si(e,t,i,n)}).catch(p(i,`share page`));break;case s===`history`:f(`projects/history.html`,i).then(()=>hi(r,i,e,t)).catch(p(i,`project activity`));break;case s===`iterations`:Promise.all([f(`iterations/list.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),S(()=>import(`./list.js`).then(r=>{r.loadIterationHistory(e,t,n)}),__vite__mapDeps([0,1,2]))}).catch(p(i,`iterations`));break;case s===`promises`&&!!c:Promise.all([f(`promises/detail.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),jt(e,t,c,r,i,n)}).catch(p(i,`promise`));break;case s===`epics`&&!!c:Promise.all([f(`epics/detail.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),wt(e,t,c,r,i,n)}).catch(p(i,`epic`));break;case s===`journeys`&&!!c:Promise.all([f(`journeys/detail.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),Et(e,t,c,r,i,n)}).catch(p(i,`journey`));break;case s===`flows`&&!!c:Promise.all([f(`flows/detail.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),Tt(e,t,c,r,i,n)}).catch(p(i,`flow`));break;case s===`moments`&&!!c:Promise.all([f(`moments/detail.html`,i),H(e,t)]).then(([,n])=>{W.set({permission:n.permission,isOwner:n.isOwner}),Dt(e,t,c,r,i,n)}).catch(p(i,`moment`));break;default:x(i)}}export{Ci as handleLegacyProjectRoutes,wi as handleProjectScopedRoutes};