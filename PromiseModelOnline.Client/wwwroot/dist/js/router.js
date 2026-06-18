const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/list.js","js/main.js","js/iteration-create-modal.js"])))=>i.map(i=>d[i]);
import{C as t,S as n,_ as r,a as i,b as a,c as o,d as s,f as c,g as l,h as u,i as d,l as f,loadTemplate as p,loadTemplateWithError as m,m as h,n as g,navigate as _,o as v,p as y,r as b,s as x,showNotFound as S,t as C,u as w,x as T,y as E}from"./main.js";import{$ as D,A as O,B as k,C as A,D as j,E as M,F as N,G as ee,H as te,I as ne,J as re,K as ie,L as ae,M as oe,N as se,O as ce,P as le,Q as ue,R as de,S as fe,T as pe,U as me,V as he,W as ge,X as _e,Y as ve,Z as ye,_ as be,at as xe,b as Se,c as P,ct as Ce,d as we,dt as Te,et as Ee,f as De,ft as Oe,g as ke,h as Ae,ht as je,i as Me,it as Ne,j as Pe,k as Fe,l as Ie,lt as Le,m as Re,mt as ze,nt as Be,o as Ve,ot as He,p as Ue,pt as We,q as Ge,rt as Ke,s as F,st as qe,t as Je,tt as Ye,u as I,ut as Xe,v as L,w as Ze,x as Qe,y as $e,z as et}from"./iteration-create-modal.js";function tt(t,n,i){return r(`/api/comments/search-users?${new URLSearchParams({parentType:t,parentId:n,search:i})}`)}function nt(t,n,i){return r(`/api/comments/search-promises?${new URLSearchParams({parentType:t,parentId:n,search:i})}`)}function R(t,n,r){let i=document.createElement(`div`);i.className=`comment-autocomplete`,i.role=`listbox`,i.style.display=`none`,document.body.append(i);let a={open:!1,items:[],highlightedIndex:-1,trigger:void 0,triggerStart:-1},o;function s(){let n=t.selectionStart,r=t.value,i=n;for(;i>0&&!/\s/.test(r[i-1]);)i--;let a=r.slice(i,n);if(a.length>0&&(a[0]===`@`||a[0]===`#`)){let t=a[0],n=a.slice(1);if(t===`@`&&/^\w*$/.test(n)||t===`#`)return{trigger:t,query:n,start:i}}}function c(n){let r=document.createElement(`div`),i=getComputedStyle(t),a=[`fontFamily`,`fontSize`,`fontWeight`,`fontStyle`,`fontVariant`,`fontStretch`,`lineHeight`,`letterSpacing`,`wordSpacing`,`textIndent`,`textTransform`,`wordBreak`,`whiteSpace`,`paddingTop`,`paddingRight`,`paddingBottom`,`paddingLeft`,`borderTopWidth`,`borderRightWidth`,`borderBottomWidth`,`borderLeftWidth`],o=r.style;for(let t of a)o[t]=i[t];o.position=`fixed`,o.top=`0`,o.left=`0`,o.visibility=`hidden`,o.overflow=`hidden`,o.width=t.clientWidth+`px`,o.height=`auto`,o.whiteSpace=`pre-wrap`,o.wordWrap=`break-word`,r.textContent=t.value.slice(0,Math.max(0,n));let s=document.createElement(`span`);s.textContent=t.value[n]||`|`,r.append(s),document.body.append(r);let c=s.getBoundingClientRect();return r.remove(),c}function l(){let n=t.getBoundingClientRect(),r=getComputedStyle(t),o=parseFloat(r.borderTopWidth)||0,s=parseFloat(r.borderLeftWidth)||0,l=parseFloat(r.lineHeight)||parseFloat(r.fontSize)*1.2||20,u=c(a.triggerStart),d=n.top+o+u.top-t.scrollTop,f=n.left+s+u.left-t.scrollLeft;i.style.position=`fixed`,i.style.left=f+`px`,i.style.top=d+l+`px`}async function u(t){let i;try{i=t.trigger===`@`?await tt(n,r,t.query):await nt(n,r,t.query)}catch{_();return}i&&i.length>0?d(i,t):_()}function d(t,n){a.items=t,a.trigger=n.trigger,a.triggerStart=n.start,a.highlightedIndex=0,a.open=!0,f(),l(),i.style.display=`block`}function f(){i.innerHTML=``;for(let t=0;t<a.items.length;t++){let n=a.items[t],r=document.createElement(`div`);r.className=`comment-autocomplete__item`+(t===a.highlightedIndex?` comment-autocomplete__item--highlight`:``),r.role=`option`,r.ariaSelected=String(t===a.highlightedIndex),r.textContent=a.trigger===`@`?n.name:`#`+n.entityType+`-`+(n.sequenceNumber??n.id)+` — `+n.statement,r.dataset.index=t,r.addEventListener(`mousedown`,function(t){t.preventDefault(),h(parseInt(r.dataset.index,10))}),i.append(r)}let t=i.children[a.highlightedIndex];t&&t.scrollIntoView({block:`nearest`})}function p(){a.items.length!==0&&(a.highlightedIndex=(a.highlightedIndex+1)%a.items.length,f())}function m(){a.items.length!==0&&(a.highlightedIndex=(a.highlightedIndex-1+a.items.length)%a.items.length,f())}function h(n){let r=a.items[n];if(!r)return;if(t.value[a.triggerStart]!==a.trigger){_();return}let i=(a.trigger===`@`?`@`+r.name:`#`+r.entityType+`-`+(r.sequenceNumber??r.id))+` `,o=t.selectionStart,s=t.value.slice(0,Math.max(0,a.triggerStart)),c=t.value.slice(Math.max(0,o));t.value=s+i+c;let l=s.length+i.length;t.selectionStart=l,t.selectionEnd=l,_(),t.focus()}function g(){h(a.highlightedIndex)}function _(){a.open=!1,a.items=[],a.highlightedIndex=-1,delete a.trigger,a.triggerStart=-1,i.style.display=`none`}function v(){o&&clearTimeout(o),o=setTimeout(function(){let t=s();t?u(t):_()},200)}function y(n){if(a.open)switch(n.key){case`ArrowDown`:e.preventDefault(),p();break;case`ArrowUp`:e.preventDefault(),m();break;case`Tab`:e.preventDefault(),a.highlightedIndex>=0?g():_();break;case`Enter`:e.preventDefault(),a.highlightedIndex>=0&&g();break;case`Escape`:e.preventDefault(),_(),t.focus();break}}function b(){setTimeout(function(){document.activeElement!==i&&!i.contains(document.activeElement)&&_()},150)}function x(n){t.contains(n.target)||i.contains(n.target)||_()}function S(){_()}t.addEventListener(`input`,v),t.addEventListener(`keydown`,y),t.addEventListener(`blur`,b),document.addEventListener(`click`,x);let C=t.closest(`form`);return C&&C.addEventListener(`submit`,S),{destroy:function(){t.removeEventListener(`input`,v),t.removeEventListener(`keydown`,y),t.removeEventListener(`blur`,b),document.removeEventListener(`click`,x),C&&C.removeEventListener(`submit`,S),i.parentNode&&i.remove()}}}function rt(){let t=location.pathname.match(/^\/([^/]+)\/([^/]+)\//);return t?{owner:t[1],project:t[2]}:{owner:void 0,project:void 0}}function z(t,n,r){let i=String(t??``).trim(),a=String(n??``).trim(),o=String(r??``).trim();if(!(!i||!a||!o))return`/${i}/${a}/graph?focus=${encodeURIComponent(o)}`}function it(t,n){if(!t||!n)return;let r=t.querySelector(`#graph-view-link`);if(!r){r=document.createElement(`a`),r.id=`graph-view-link`,r.className=`btn btn-outline-secondary btn-sm align-items-center gap-2`,r.innerHTML=`<i class="bi bi-diagram-3" aria-hidden="true"></i><span> Graph View</span>`;let n=t.querySelector(`#back-link`);n?.parentElement?(n.before(r),n.before(` `)):t.append(r)}r.href=n}var B={};async function V(t,n,i,a){try{let o=await r(`/api/comments/entity-map?parentType=${t}&parentId=${n}`);for(let t of Object.keys(B))delete B[t];if(B._owner=i??void 0,B._project=a??void 0,Array.isArray(o))for(let t of o)B[`${t.entityType}-${t.sequenceNumber}`]={dbId:t.id,statusColor:t.statusColor}}catch{}}function at(t){let n=String(t??``).toLowerCase();return n.includes(`green`)?`🟢`:n.includes(`black`)||n.includes(`blocked`)?`⚫️`:n.includes(`orange`)||n.includes(`yellow`)||n.includes(`amber`)||n.includes(`inprogress`)||n.includes(`in-progress`)?`🟠`:n.includes(`red`)||n.includes(`todo`)?`🔴`:`⚪`}function H(t){let n=h(t);return n=n.replaceAll(/#(promise|epic|journey|flow|moment)-(\d+)/g,(t,n,r)=>{let i=B[`${n}-${r}`],a=B._owner,o=B._project,s=`${n}s`;if(i!==void 0){let n=at(i.statusColor??``);return a&&o?`<a href="/${a}/${o}/${s}/${r}" class="promise-ref">${t} ${n}</a>`:`<a href="/${s}/${i.dbId}" class="promise-ref">${t} ${n}</a>`}return a&&o?`<a href="/${a}/${o}/${s}/${r}" class="promise-ref promise-ref--legacy">${t}</a>`:`<a href="/${s}/${r}" class="promise-ref promise-ref--legacy">${t}</a>`}),n=n.replaceAll(/@(\w+)/g,`<span class="mention">@$1</span>`),n}var ot={View:0,Comment:1,Edit:2,Owner:3};function st(t,n){return(ot[t]??0)>=(ot[n]??0)}async function U(t,n){try{let r=await Ce(t,n);return r?typeof r==`string`?{permission:r,isOwner:r===`Owner`}:{permission:r.permission??void 0,isOwner:r.isOwner===!0}:{permission:void 0,isOwner:!1}}catch{return{permission:void 0,isOwner:!1}}}var ct=(t,n,i,a)=>r(`/api/comments?type=${i}&parentId=${a}`),lt=(t,n,r)=>a(`/api/comments`,r);async function ut(t,n,r,i,a,o){let s=st(o?.permission,`Comment`);t.innerHTML=`
        <h3>Comments</h3>
        <div id="comments-list" class="comments-list"></div>
        ${s?`
        <form id="comment-form" class="comment-form" aria-label="Add a comment">
            <label for="comment-textarea" class="sr-only">Your comment</label>
            <textarea id="comment-textarea" class="form-control mb-2" rows="3" required placeholder="Write a comment... Use @name to mention someone, #type-id to reference a promise/epic/journey/flow/moment."></textarea>
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>`:``}
    `;let c=t.querySelector(`#comments-list`),l=t.querySelector(`#comment-form`),u=t.querySelector(`#comment-textarea`);u&&R(u,n,r);let d=V(n,r,i,a);try{let[t]=await Promise.all([ct(i,a,n,r),d]);dt(c,t,s)}catch{c.removeAttribute(`role`),c.removeAttribute(`aria-label`),c.innerHTML=`<p class="error">Failed to load comments.</p>`}l&&l.addEventListener(`submit`,async t=>{t.preventDefault();let o=u.value.trim();if(o)try{let t=window.scrollY;ft(c,await lt(i,a,{parentType:n,parentId:r,text:o})),u.value=``,window.scrollTo(0,t)}catch(t){alert(`Failed to post comment.`),console.error(t)}})}function dt(t,n,r){if(t.innerHTML=``,!n||n.length===0){t.innerHTML=c({icon:`bi-chat-dots`,title:`No comments yet.`,description:r?`Be the first to share your thoughts.`:``});return}for(let r of n)t.append(pt(r))}function ft(t,n){let r=t.querySelector(`.no-items`);r&&r.remove(),t.append(pt(n))}function pt(t){let n=document.createElement(`div`);return n.className=`comment-item`,n.innerHTML=`
        <div class="comment-meta">
            <strong>${h(t.userName||t.authorName||`Unknown`)}</strong> – ${new Date(t.createdAt).toLocaleString(`en-CA`)}
        </div>
        <div class="comment-text">${H(t.text)}</div>
        ${t.mentionedUsers&&t.mentionedUsers.length>0?`<div class="comment-mentions">Mentions: ${t.mentionedUsers.join(`, `)}</div>`:``}
        ${t.replies&&t.replies.length>0?`<div class="comment-replies">${t.replies.map(t=>`
            <div class="comment-item reply">
                <strong>${h(t.userName||t.authorName||`Unknown`)}</strong>: ${h(t.text)}
            </div>
        `).join(``)}</div>`:``}
    `,n}var mt=(t,n,i,a)=>r(`/api/reactions?type=${i}&itemId=${a}`),ht=(t,n,r)=>a(`/api/reactions`,r),gt=(t,n,r)=>E(`/api/reactions/${r}`,{}),_t=[`👍`,`👎`,`❤️`,`😀`,`🎉`,`🚀`,`👀`];function vt(t,r,i,a,o,s){t.innerHTML=`
        <div class="reactions-bar">
            <span class="reactions-summary" id="reactions-summary"></span>
            ${s?.permission===`Comment`||s?.permission===`Edit`?`<span class="reactions-picker">
                ${_t.map(t=>`<button class="btn btn-outline-secondary btn-sm emote-btn" data-emote="${t}" title="${t}" aria-label="React with ${t}">${t}</button>`).join(``)}
            </span>`:``}
        </div>
    `;let c=t.querySelector(`#reactions-summary`),l=t.querySelectorAll(`.emote-btn`),u=n(),d={counts:{},myReactionId:void 0,myEmote:void 0};function f(){c.textContent=_t.filter(t=>d.counts[t]).map(t=>`${t} ${d.counts[t]}`).join(` `)||`No reactions yet.`}async function p(){try{let t=await mt(a,o,r,i);d.counts={};let n=t||[];for(let t of n)d.counts[t.emote]=(d.counts[t.emote]||0)+1;if(u){let n=(t||[]).find(t=>String(t.userName)===String(u));d.myReactionId=n?.id??void 0,d.myEmote=n?.emote??void 0}f()}catch{c.textContent=`Failed to load reactions.`}}p();for(let t of l)t.addEventListener(`click`,async()=>{let n=t.dataset.emote;try{let t=window.scrollY,s=d.myReactionId?await gt(a,o,d.myReactionId,n):await ht(a,o,{parentType:r,parentId:i,emote:n}),c=d.myEmote,l=s?.emote??n;c&&c!==l&&(d.counts[c]=Math.max(0,(d.counts[c]||0)-1)),(!c||c!==l)&&(d.counts[l]=(d.counts[l]||0)+1),d.myReactionId=s?.id??d.myReactionId,d.myEmote=l,f(),window.scrollTo(0,t)}catch{alert(`Failed to react`)}})}function yt(){let t=document.querySelector(`#back-link`);t&&t.addEventListener(`click`,()=>history.back())}function bt(t,n,r,i,a,o){let s=document.querySelector(`#${n.toLowerCase()}-comments`);s&&ut(s,n,r,i,a,o);let c=document.querySelector(`#reactions-section`);c||(c=document.createElement(`div`),c.id=`reactions-section`),t&&(c.parentNode||t.append(c),vt(c,n,r,i,a,o))}function W(t,n,r,i,a){let o=``,s=``;function c(o){n.innerHTML=o||``,n.style.display=``,t.style.display=`none`,i&&(i.style.display=`none`),r.style.display=``,a&&(a.style.display=`none`)}function l(){o=t.value,s=n.innerHTML,n.style.display=`none`,t.style.display=``,r.style.display=`none`,i&&(i.style.display=``),a&&(a.style.display=``),t.focus()}return n.style.display=``,t.style.display=`none`,r.style.display=``,i&&(i.style.display=`none`),a&&(a.style.display=`none`),r.addEventListener(`click`,l),a&&a.addEventListener(`click`,()=>{t.value=o,c(s)}),{showView:c,showSavedPopover(t){if(!i){c(t);return}if(typeof bootstrap<`u`&&bootstrap.Popover){let n=new bootstrap.Popover(i,{trigger:`manual`,placement:`top`,content:`Saved!`,customClass:`inline-edit-saved-popover`});n.show(),setTimeout(()=>{n.dispose(),c(t)},1500)}else c(t)}}}function xt(t,{headers:n,items:r,emptyMessage:i,emptyConfig:a,renderItemRow:o,renderAddRow:s=()=>``}){let c=n.length,l=r&&r.length>0?r.map(t=>o(t)).join(``):a?y({colspan:c,...a}):`<tr class="inline-table-empty-row"><td class="no-items" colspan="${c}">${h(i)}</td></tr>`,u=s?s():``;return t.innerHTML=`
        <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle mb-0 promisemodel-table">
            <thead class="table-light">
                <tr>${n.map(t=>`<th>${h(t)}</th>`).join(``)}</tr>
            </thead>
            <tbody>
                ${l}
                ${u}
            </tbody>
        </table>
        </div>
    `,t.querySelector(`tbody`)}function St(t,n){let r=t.querySelector(`tr[data-inline-add-row="1"]`);if(r){r.before(n);return}t.append(n)}function Ct(t){t.querySelector(`.inline-table-empty-row`)?.remove()}async function wt(t,n,r,i,a,o){let s=document.querySelector(`#epic-detail-content`),c=document.querySelector(`#error-text`),l=document.querySelector(`#epic-detail-loading`);Me(),l&&(l.hidden=!1),c.textContent=``;try{let c=await me(t,n,r);await V(`Epic`,c.id,t,n),l&&(l.hidden=!0),Ve({nodeType:`epic`,nodeId:r,owner:t,project:n}),s.innerHTML=`
            <div class="detail-card epic-detail-card">
                <h2>${h(c.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${H(c.description||``)}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${h(c.description||``)}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr>
                        <th>Parent Promise</th>
                        <td id="epic-parent-promise">Loading…</td>
                    </tr>
                    <tr><th scope="row">Status</th><td>${Ze(c.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(c.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                    <tr><th scope="row">Updated</th><td>${c.updatedAt?new Date(c.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                </table>
                <h3>Journeys</h3>
                <div id="epic-journeys-list">
                    <p>Loading journeys…</p>
                </div>
                <div id="epic-comments"></div>
                <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
            </div>
        `;let u=document.querySelector(`#description-input`),d=document.querySelector(`#description-view`),f=document.querySelector(`#edit-desc-btn`),p=document.querySelector(`#save-desc`),m=document.querySelector(`#cancel-desc`),g;u&&d&&f&&(R(u,`Epic`,c.id),g=W(u,d,f,p,m));let v=document.querySelector(`#epic-parent-promise`);try{let r=await Pe(t,n,c.productPromiseId),o=pe(r.statusColor),s=M(r.statusColor);v.innerHTML=`<a href="/${t}/${n}/promises/${r.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${h(r.statement)}</a> <span aria-hidden="true">${o}</span><span class="sr-only">${s}</span>`;let l=v.querySelector(`a.detail-link`);l&&l.addEventListener(`click`,t=>{t.ctrlKey||t.metaKey||t.button===1||(t.preventDefault(),_(l.getAttribute(`href`),i,a))})}catch{v.textContent=`Promise ${c.productPromiseId}`}let y=document.querySelector(`#epic-journeys-list`);try{let o=await ee(t,n,r);F(`epic-${c.sequenceNumber}`,o);let s=xt(y,{headers:[`Statement`,`Actions`],items:o||[],emptyMessage:`No journeys found for this epic.`,renderItemRow:r=>`
                    <tr data-journey-id="${r.id}">
                        <td>${h(r.statement)}</td>
                        <td><a href="/${t}/${n}/journeys/${r.sequenceNumber}" journey-id="${r.id}" journey-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                `}),l=y.querySelector(`#add-journey-form`),u=y.querySelector(`#add-journey-statement`),d=y.querySelector(`#add-journey-msg`),f=y.querySelector(`#add-journey-submit`);l&&u&&d&&f&&l.addEventListener(`submit`,async i=>{i.preventDefault(),d.textContent=``;let a=u.value.trim();if(!a){d.textContent=`Statement is required.`;return}f.disabled=!0;try{let i=await se(t,n,{statement:a,epicId:r,displayOrder:(o||[]).length+1});if(i){Ct(s);let r=document.createElement(`tr`);r.dataset.journeyId=i.id,r.innerHTML=`
                                <td>${h(i.statement)}</td>
                                <td><a href="/${t}/${n}/journeys/${i.sequenceNumber}" journey-id="${i.id}" journey-seq="${i.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `,St(s,r),u.value=``,F(`epic-${c.sequenceNumber}`,[...o||[],i])}}catch(t){d.textContent=`Failed to add journey.`,console.error(t)}finally{f.disabled=!1}}),y.innerHTML=`
                <table class="table table-sm table-striped align-middle promisemodel-table">
                    <thead>
                        <tr>
                            <th>Statement</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${o.map(r=>`
                            <tr>
                                <td>${h(r.statement)}</td>
                                <td><a href="/${t}/${n}/journeys/${r.sequenceNumber}" journey-id="${r.id}" journey-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `;for(let r of y.querySelectorAll(`a[journey-id]`))r.addEventListener(`click`,o=>{o.ctrlKey||o.metaKey||o.button===1||(o.preventDefault(),_(`/${t}/${n}/journeys/${r.getAttribute(`journey-seq`)}`,i,a))})}catch{y.innerHTML=`<p class="error">Failed to load journeys.</p>`}yt(),(function(){if(o?.permission!==`Edit`){let t=document.querySelector(`#edit-desc-btn`),n=document.querySelector(`#save-desc`),r=document.querySelector(`#description-input`);t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0);let i=document.querySelector(`#add-journey-statement`),a=document.querySelector(`#add-journey-submit`);i&&(i.disabled=!0),a&&(a.disabled=!0,a.title=`Requires Edit permission.`)}})(),bt(s,`Epic`,c.id,t,n,o);let b=document.querySelector(`#desc-save-msg`);p&&p.addEventListener(`click`,async i=>{i.preventDefault(),b.textContent=``,p.disabled=!0;let a=document.querySelector(`#description-input`).value;try{c.description=(await ie(t,n,r,a))?.description??(a.trim()?a:void 0),P(`epic-${c.sequenceNumber}`,{description:c.description}),g&&g.showSavedPopover(H(c.description||``))}catch(t){b.textContent=`Save failed`,console.error(t)}finally{p.disabled=!1}});let{owner:x,project:S}=rt();x&&S&&it(s,z(x,S,`epic-${c.sequenceNumber}`))}catch(t){l&&(l.hidden=!0),c.textContent=`Failed to load epic details.`,console.error(t)}}async function Tt(t,n,r,i,a,o){let s=document.querySelector(`#flow-detail-content`),c=document.querySelector(`#error-text`),l=document.querySelector(`#flow-detail-loading`);Me(),l&&(l.hidden=!1),c.textContent=``;try{let c=await et(t,n,r);await V(`Flow`,c.id,t,n),l&&(l.hidden=!0),Ve({nodeType:`flow`,nodeId:r,owner:t,project:n}),s.innerHTML=`
            <div class="detail-card flow-detail-card">
                <h2>${h(c.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${H(c.description||``)}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${h(c.description||``)}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr>
                        <th>Journey</th>
                        <td id="flow-journey-cell">
                            <a href="/${t}/${n}/journeys/${c.journeyId}" class="detail-link link-primary text-decoration-none fw-semibold">Journey ${c.journeyId}</a>
                        </td>
                    </tr>
                    <tr><th scope="row">Status</th><td>${Ze(c.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(c.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                    <tr><th scope="row">Updated</th><td>${c.updatedAt?new Date(c.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                </table>
                <h3>Moments</h3>
                <div id="flow-moments-list">
                    <p>Loading moments...</p>
                </div>
                <div id="flow-comments"></div>
                <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
            </div>
        `;let u=document.querySelector(`#description-input`),d=document.querySelector(`#description-view`),f=document.querySelector(`#edit-desc-btn`),p=document.querySelector(`#save-desc`),m=document.querySelector(`#cancel-desc`),g;u&&d&&f&&(R(u,`Flow`,c.id),g=W(u,d,f,p,m));let v=s.querySelector(`.detail-link[journey-id]`);v&&v.addEventListener(`click`,r=>{r.ctrlKey||r.metaKey||r.button===1||(r.preventDefault(),_(`/${t}/${n}/journeys/${v.getAttribute(`journey-seq`)}`,i,a))});let y=document.querySelector(`#flow-moments-list`);try{let o=await k(t,n,r);F(`flow-${c.sequenceNumber}`,o);let s=xt(y,{headers:[`Statement`,`Type`,`Status`,`Actions`],items:o||[],emptyMessage:`No moments found for this flow.`,renderItemRow:r=>`
                    <tr data-moment-id="${r.sequenceNumber}">
                        <td>${h(r.statement)}</td>
                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${r.sequenceNumber}" data-current-type="${r.type}" aria-label="Moment type"><option value="Story" ${r.type===`Story`?`selected`:``}>Story</option><option value="Job" ${r.type===`Job`?`selected`:``}>Job</option></select></td>
                        <td><span class="status-badge status-${(r.status||``).toLowerCase()}">${r.status}</span></td>
                        <td><a href="/${t}/${n}/moments/${r.sequenceNumber}" moment-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                `}),l=y.querySelector(`#add-moment-form`),u=y.querySelector(`#add-moment-statement`),d=y.querySelector(`#add-moment-type`),f=y.querySelector(`#add-moment-msg`),p=y.querySelector(`#add-moment-submit`);l&&u&&d&&f&&p&&l.addEventListener(`submit`,async i=>{i.preventDefault(),f.textContent=``;let a=u.value.trim();if(!a){f.textContent=`Statement is required.`;return}p.disabled=!0;try{let i=await b(t,n,{statement:a,flowId:r,type:d.value,status:`Todo`,displayOrder:(o||[]).length+1});if(i){Ct(s);let r=document.createElement(`tr`);r.dataset.momentId=i.id,r.innerHTML=`
                                <td>${h(i.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${i.sequenceNumber}" data-current-type="${i.type}" aria-label="Moment type"><option value="Story" ${i.type===`Story`?`selected`:``}>Story</option><option value="Job" ${i.type===`Job`?`selected`:``}>Job</option></select></td>
                                <td><span class="status-badge status-${(i.status||``).toLowerCase()}">${i.status}</span></td>
                                <td><a href="/${t}/${n}/moments/${i.sequenceNumber}" moment-seq="${i.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `,St(s,r),u.value=``,d.value=`Story`,F(`flow-${c.sequenceNumber}`,[...o||[],i])}}catch(t){f.textContent=`Failed to add moment.`,console.error(t)}finally{p.disabled=!1}}),y.innerHTML=`
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
                        ${o.map(r=>`
                            <tr data-moment-id="${r.sequenceNumber}">
                                <td>${h(r.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${r.sequenceNumber}" data-current-type="${r.type}" aria-label="Moment type"><option value="Story" ${r.type===`Story`?`selected`:``}>Story</option><option value="Job" ${r.type===`Job`?`selected`:``}>Job</option></select></td>
                                <td><span class="status-badge status-${(r.status||``).toLowerCase()}">${r.status}</span></td>
                                <td><a href="/${t}/${n}/moments/${r.sequenceNumber}" moment-id="${r.id}" moment-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `,y.addEventListener(`change`,async r=>{let i=r.target;if(i.matches(`.moment-type-select`)){let r=parseInt(i.dataset.momentId,10),a=i.value,o=i.dataset.currentType||a;try{await w(t,n,r,a),i.dataset.currentType=a}catch(t){i.value=o,console.error(`Failed to update moment type:`,t)}}});for(let r of y.querySelectorAll(`a[moment-id]`))r.addEventListener(`click`,o=>{o.ctrlKey||o.metaKey||o.button===1||(o.preventDefault(),_(`/${t}/${n}/moments/${r.getAttribute(`moment-seq`)}`,i,a))})}catch{y.innerHTML=`<p class="error">Failed to load moments.</p>`}yt();let x=document.querySelector(`#flow-journey-cell`);try{let r=await ne(t,n,c.journeyId),o=pe(r.statusColor),s=M(r.statusColor);x.innerHTML=`<a href="/${t}/${n}/journeys/${r.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${h(r.statement)}</a> <span aria-hidden="true">${o}</span><span class="sr-only">${s}</span>`;let l=x.querySelector(`a.detail-link`);l&&l.addEventListener(`click`,t=>{t.ctrlKey||t.metaKey||t.button===1||(t.preventDefault(),_(l.getAttribute(`href`),i,a))})}catch{}let S=document.querySelector(`#desc-save-msg`);p&&p.addEventListener(`click`,async i=>{i.preventDefault(),S.textContent=``,p.disabled=!0;let a=document.querySelector(`#description-input`).value;try{c.description=(await he(t,n,r,a))?.description??(a.trim()?a:void 0),P(`flow-${c.sequenceNumber}`,{description:c.description}),g&&g.showSavedPopover(H(c.description||``))}catch(t){S.textContent=`Save failed`,console.error(t)}finally{p.disabled=!1}}),(function(){if(o?.permission!==`Edit`){let t=document.querySelector(`#edit-desc-btn`),n=document.querySelector(`#save-desc`),r=document.querySelector(`#description-input`);t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0);let i=document.querySelector(`#add-moment-statement`),a=document.querySelector(`#add-moment-submit`);i&&(i.disabled=!0),a&&(a.disabled=!0,a.title=`Requires Edit permission.`);let o=document.querySelector(`#add-moment-type`);o&&(o.disabled=!0)}})(),bt(s,`Flow`,c.id,t,n,o);let{owner:C,project:T}=rt();C&&T&&it(s,z(C,T,`flow-${c.sequenceNumber}`))}catch(t){l&&(l.hidden=!0),c.textContent=`Failed to load flow details.`,console.error(t)}}async function Et(t,n,r,i,a,o){let s=document.querySelector(`#journey-detail-content`),c=document.querySelector(`#error-text`),l=document.querySelector(`#journey-detail-loading`);Me(),l&&(l.hidden=!1),c.textContent=``;try{let c=await N(t,n,r);await V(`Journey`,c.id,t,n),l&&(l.hidden=!0),Ve({nodeType:`journey`,nodeId:r,owner:t,project:n}),s.innerHTML=`
            <div class="detail-card journey-detail-card">
                <h2>${h(c.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${H(c.description||``)}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${h(c.description||``)}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr>
                        <th>Epic</th>
                        <td id="journey-epic-cell">
                            <a href="/${t}/${n}/epics/${c.epicId}" class="detail-link link-primary text-decoration-none fw-semibold">Epic ${c.epicId}</a>
                        </td>
                    </tr>
                    <tr><th scope="row">Status</th><td>${Ze(c.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(c.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                    <tr><th scope="row">Updated</th><td>${c.updatedAt?new Date(c.updatedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                </table>
                <h3>Flows</h3>
                <div id="journey-flows-list">
                    <p>Loading flows...</p>
                </div>
                <div id="journey-comments"></div>
                <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
            </div>
        `;let u=document.querySelector(`#description-input`),d=document.querySelector(`#description-view`),f=document.querySelector(`#edit-desc-btn`),p=document.querySelector(`#save-desc`),m=document.querySelector(`#cancel-desc`),g;u&&d&&f&&(R(u,`Journey`,c.id),g=W(u,d,f,p,m));let v=s.querySelector(`a.detail-link[epic-id]`);v&&v.addEventListener(`click`,r=>{r.ctrlKey||r.metaKey||r.button===1||(r.preventDefault(),_(`/${t}/${n}/epics/${v.getAttribute(`epic-seq`)}`,i,a))});let y=document.querySelector(`#journey-flows-list`);try{let o=await le(t,n,r);F(`journey-${c.sequenceNumber}`,o);let s=xt(y,{headers:[`Statement`,`Actions`],items:o||[],emptyMessage:`No flows found for this journey.`,renderItemRow:r=>`
                    <tr data-flow-id="${r.id}">
                        <td>${h(r.statement)}</td>
                        <td><a href="/${t}/${n}/flows/${r.sequenceNumber}" flow-id="${r.id}" flow-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                `}),l=y.querySelector(`#add-flow-form`),u=y.querySelector(`#add-flow-statement`),d=y.querySelector(`#add-flow-msg`),f=y.querySelector(`#add-flow-submit`);l&&u&&d&&f&&l.addEventListener(`submit`,async i=>{i.preventDefault(),d.textContent=``;let a=u.value.trim();if(!a){d.textContent=`Statement is required.`;return}f.disabled=!0;try{let i=await de(t,n,{statement:a,journeyId:r,displayOrder:(o||[]).length+1});if(i){Ct(s);let r=document.createElement(`tr`);r.dataset.flowId=i.id,r.innerHTML=`
                                <td>${h(i.statement)}</td>
                                <td><a href="/${t}/${n}/flows/${i.sequenceNumber}" flow-id="${i.id}" flow-seq="${i.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `,St(s,r),u.value=``,F(`journey-${c.sequenceNumber}`,[...o||[],i])}}catch(t){d.textContent=`Failed to add flow.`,console.error(t)}finally{f.disabled=!1}}),y.innerHTML=`
                <table class="table table-sm table-striped align-middle promisemodel-table">
                    <thead>
                        <tr>
                            <th>Statement</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${o.map(r=>`
                            <tr>
                                <td>${h(r.statement)}</td>
                                <td><a href="/${t}/${n}/flows/${r.sequenceNumber}" flow-id="${r.id}" flow-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `;for(let r of y.querySelectorAll(`a[flow-id]`))r.addEventListener(`click`,o=>{o.ctrlKey||o.metaKey||o.button===1||(o.preventDefault(),_(`/${t}/${n}/flows/${r.getAttribute(`flow-seq`)}`,i,a))})}catch{y.innerHTML=`<p class="error">Failed to load flows.</p>`}yt();let b=document.querySelector(`#journey-epic-cell`);try{let r=await ge(t,n,c.epicId),o=pe(r.statusColor),s=M(r.statusColor);b.innerHTML=`<a href="/${t}/${n}/epics/${r.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${h(r.statement)}</a> <span aria-hidden="true">${o}</span><span class="sr-only">${s}</span>`;let l=b.querySelector(`a.detail-link`);l&&l.addEventListener(`click`,t=>{t.ctrlKey||t.metaKey||t.button===1||(t.preventDefault(),_(l.getAttribute(`href`),i,a))})}catch{}let x=document.querySelector(`#desc-save-msg`);p&&p.addEventListener(`click`,async i=>{i.preventDefault(),x.textContent=``,p.disabled=!0;let a=document.querySelector(`#description-input`).value;try{c.description=(await ae(t,n,r,a))?.description??(a.trim()?a:void 0),P(`journey-${c.sequenceNumber}`,{description:c.description}),g&&g.showSavedPopover(H(c.description||``))}catch(t){x.textContent=`Save failed`,console.error(t)}finally{p.disabled=!1}}),(function(){if(o?.permission!==`Edit`){let t=document.querySelector(`#edit-desc-btn`),n=document.querySelector(`#save-desc`),r=document.querySelector(`#description-input`);t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0);let i=document.querySelector(`#add-flow-statement`),a=document.querySelector(`#add-flow-submit`);i&&(i.disabled=!0),a&&(a.disabled=!0,a.title=`Requires Edit permission.`)}})(),bt(s,`Journey`,c.id,t,n,o);let{owner:S,project:C}=rt();S&&C&&it(s,z(S,C,`journey-${c.sequenceNumber}`)),l&&(l.hidden=!0)}catch(t){l&&(l.hidden=!0),c.textContent=`Failed to load journey details.`,console.error(t)}}async function Dt(t,n,r,a,o,s){let c=document.querySelector(`#moment-detail-content`),l=document.querySelector(`#error-text`),u=document.querySelector(`#moment-detail-loading`);Me(),u&&(u.hidden=!1),l.textContent=``;try{let l=await i(t,n,r);await V(`Moment`,l.id,t,n),u&&(u.hidden=!0),Ve({nodeType:`moment`,nodeId:r,owner:t,project:n}),c.innerHTML=`
            <div class="detail-card moment-detail-card">
                <h2>${h(l.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr>
                        <th scope="row"><label for="moment-description-input">Description</label></th>
                        <td>
                            <div class="inline-edit-wrapper">
                                <p id="moment-description-view" class="inline-edit-view">${H(l.description||``)}</p>
                                <button id="edit-moment-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="moment-description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${h(l.description||``)}</textarea>
                            </div>
                            <div class="field-actions"><button id="moment-description-cancel" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="moment-description-save" class="btn btn-primary btn-sm" type="button">Save</button> <span id="moment-description-msg"></span></div>
                        </td>
                    </tr>
                    <tr><th scope="row"><label for="moment-type-select">Type</label></th><td>
                        <select id="moment-type-select" class="form-select form-select-sm">
                            <option value="Story" ${l.type===`Story`?`selected`:``}>Story</option>
                            <option value="Job" ${l.type===`Job`?`selected`:``}>Job</option>
                        </select>
                    </td></tr>
                    <tr><th scope="row"><label for="moment-status-select">Status</label></th><td>
                        <select id="moment-status-select" class="form-select form-select-sm">
                            ${j(`Todo`,l.status)}
                            ${j(`InProgress`,l.status)}
                            ${j(`Blocked`,l.status)}
                            ${j(`Done`,l.status)}
                        </select>
                    </td></tr>
                    <tr>
                        <th scope="row"><label for="moment-estimate-select">Effort Estimate</label></th>
                        <td>
                            <select id="moment-estimate-select" class="form-select form-select-sm">
                                <option value="-" ${l.effortEstimate===null?`selected`:``}>-</option>
                                <option value="XS"  ${l.effortEstimate===`XS`?`selected`:``}>XS</option>
                                <option value="S"   ${l.effortEstimate===`S`?`selected`:``}>S</option>
                                <option value="M"   ${l.effortEstimate===`M`?`selected`:``}>M</option>
                                <option value="L"   ${l.effortEstimate===`L`?`selected`:``}>L</option>
                                <option value="XL"  ${l.effortEstimate===`XL`?`selected`:``}>XL</option>
                                <option value="XXL" ${l.effortEstimate===`XXL`?`selected`:``}>XXL</option>
                                <option value="XXXL"${l.effortEstimate===`XXXL`?`selected`:``}>XXXL</option>
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
                    <tr><th scope="row">Created</th><td>${new Date(l.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                    <tr><th scope="row">Completed</th><td>${l.completedAt?new Date(l.completedAt).toLocaleDateString(`en-CA`):`–`}</td></tr>
                </table>
                <h3>Moment Tasks</h3>
                <div id="moment-tasks"></div>
                <div id="moment-comments"></div>
                <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
            </div>
        `;let d=document.querySelector(`#moment-description-input`),p=document.querySelector(`#moment-description-view`),m=document.querySelector(`#edit-moment-desc-btn`),y=document.querySelector(`#moment-description-save`),b=document.querySelector(`#moment-description-cancel`),S;d&&p&&m&&(R(d,`Moment`,l.id),S=W(d,p,m,y,b)),(function(){if(!st(s?.permission,`Edit`)){let t=document.querySelector(`#edit-moment-desc-btn`),n=document.querySelector(`#moment-description-save`),r=document.querySelector(`#moment-description-input`);t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0);let i=document.querySelector(`#moment-type-select`),a=document.querySelector(`#moment-status-select`),o=document.querySelector(`#moment-estimate-select`),s=document.querySelector(`#moment-stride-select`);i&&(i.disabled=!0,i.title=`Requires Edit permission.`),a&&(a.disabled=!0,a.title=`Requires Edit permission.`),o&&(o.disabled=!0,o.title=`Requires Edit permission.`),s&&(s.disabled=!0,s.title=`Requires Edit permission.`)}})(),Ot(document.querySelector(`#moment-tasks`),r,l.tasks,l,s,t,n);let C=document.querySelector(`#moment-description-input`),T=document.querySelector(`#moment-description-msg`);y&&C&&T&&y.addEventListener(`click`,async()=>{T.textContent=``,y.disabled=!0;let i=C.value;try{l.description=(await v(t,n,r,i))?.description??(i.trim()?i:void 0),P(`moment-${l.sequenceNumber}`,{description:l.description}),S&&S.showSavedPopover(H(l.description||``))}catch(t){T.textContent=`Save failed`,console.error(t)}finally{y.disabled=!1}}),c.addEventListener(`click`,r=>{let i=r.target.closest(`a.detail-link`);i&&(r.ctrlKey||r.metaKey||r.button===1||(r.preventDefault(),_(`/${t}/${n}/flows/${i.getAttribute(`flow-seq`)}`,a,o)))});let E=document.querySelector(`#moment-estimate-select`);E&&E.addEventListener(`change`,async()=>{let i=E.value===`-`?void 0:E.value;try{await x(t,n,r,i),l.effortEstimate=i,P(`moment-${l.sequenceNumber}`,{effortEstimate:i})}catch(t){alert(`Failed to update estimate`),console.error(t)}});let O=document.querySelector(`#moment-stride-select`);if(O)try{let i=await D(t,n);i.sort((t,n)=>String(t.name||``).localeCompare(String(n.name||``)));for(let t of i){let n=document.createElement(`option`);n.value=String(t.id),n.textContent=t.name||`Stride ${t.id}`,String(t.id)===String(l.assignedStrideId)&&(n.selected=!0),O.append(n)}l.assignedStrideId||(O.value=``),O.addEventListener(`change`,async()=>{let i=O.value===``?void 0:parseInt(O.value,10);try{let a=await g(t,n,r,i);l.assignedStrideId=a.assignedStrideId,P(`moment-${l.sequenceNumber}`,{assignedStrideId:a.assignedStrideId}),O.value=a.assignedStrideId?String(a.assignedStrideId):``}catch(t){alert(`Failed to update assigned stride`),console.error(t)}})}catch(t){console.error(`Failed to load strides`,t)}let k=document.querySelector(`#moment-status-select`),A=c.querySelector(`:scope tr:nth-last-child(1) td`);k&&k.addEventListener(`change`,async()=>{let i=k.value;try{let i=await f(t,n,r,k.value);l.status=i.status,l.statusColor=i.statusColor,l.completedAt=i.completedAt,k.value=i.status,await Ie(),i.completedAt?A.textContent=new Date(i.completedAt).toLocaleDateString(`en-CA`):A.textContent=`–`}catch{k.value=i,alert(`Failed to update status`)}});let M=document.querySelector(`#moment-type-select`);M&&M.addEventListener(`change`,async()=>{let i=M.value;try{let a=await w(t,n,r,i);a&&a.type&&(l.type=a.type,M.value=a.type,P(`moment-${l.sequenceNumber}`,{type:a.type}))}catch{alert(`Failed to update type`),M.value=l.type}}),yt(),bt(c,`Moment`,l.id,t,n,s);let{owner:N,project:ee}=rt();N&&ee&&it(c,z(N,ee,`moment-${l.sequenceNumber}`))}catch(t){u&&(u.hidden=!0),l.textContent=`Failed to load moment details.`,console.error(t)}}function Ot(t,n,r,i,a,o,s){if(!t)return;let c=xt(t,{headers:[`Name`,`Description`,`Completion Status`],items:Array.isArray(r)?r:[],emptyMessage:`No moment tasks found.`,renderItemRow:t=>`
            <tr data-moment-task-id="${t.id}">
                <td>${h(t.name||``)}</td>
                <td>${H(t.description)}</td>
                <td>
                    <label class="moment-task-completion">
                            <input type="checkbox" class="moment-task-complete-checkbox form-check-input" data-moment-task-id="${t.id}" ${t.isCompleted?`checked`:``} />
                        <span>${t.isCompleted?`Completed`:`Open`}</span>
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
        `}),l=t.querySelector(`#add-moment-task-name`),u=t.querySelector(`#add-moment-task-description`),f=t.querySelector(`#add-moment-task-completed`),p=t.querySelector(`#add-moment-task-submit`),m=t.querySelector(`#add-moment-task-msg`);u&&R(u,`Moment`,i.id),st(a?.permission,`Edit`)||(l&&(l.disabled=!0),u&&(u.disabled=!0),f&&(f.disabled=!0),p&&(p.disabled=!0,p.title=`Requires Edit permission.`)),p&&l&&u&&f&&m&&p.addEventListener(`click`,async()=>{m.textContent=``;let t=l.value.trim();if(!t){m.textContent=`Name is required.`;return}p.disabled=!0;try{let r=await d(o,s,n,{name:t,description:u.value.trim(),isCompleted:f.checked});if(r){Ct(c);let t=document.createElement(`tr`);t.dataset.momentTaskId=r.id,t.innerHTML=`
                        <td>${h(r.name||``)}</td>
                        <td>${H(r.description||``)}</td>
                        <td>
                            <label class="moment-task-completion">
                                <input type="checkbox" class="moment-task-complete-checkbox" data-moment-task-id="${r.id}" ${r.isCompleted?`checked`:``} />
                                <span>${r.isCompleted?`Completed`:`Open`}</span>
                            </label>
                        </td>
                    `,St(c,t),l.value=``,u.value=``,f.checked=!1,Array.isArray(i.tasks)||(i.tasks=[]),i.tasks.push(r),kt(n,i),At(c,n,i,void 0,o,s)}}catch(t){m.textContent=`Failed to add task.`,console.error(t)}finally{p.disabled=!1}}),At(c,n,i,a,o,s)}function kt(t,n){P(`moment-${n.sequenceNumber}`,{tasks:Array.isArray(n?.tasks)?[...n.tasks]:[]})}function At(t,n,r,i,a,o){if(!t)return;let c=st(i?.permission,`Edit`);for(let i of t.querySelectorAll(`:scope .moment-task-complete-checkbox`)){if(i.dataset.bound===`1`)return;if(i.dataset.bound=`1`,!c){i.disabled=!0,i.title=`Requires Edit permission.`;return}i.addEventListener(`change`,async()=>{let t=Math.trunc(Number(i.dataset.momentTaskId??``)),c=i.closest(`tr`)?.querySelector(`:scope > .moment-task-completion span`),l=!i.checked;i.disabled=!0;try{let l=await s(a,o,n,t,i.checked);if(l){i.checked=!!l.isCompleted,c&&(c.textContent=l.isCompleted?`Completed`:`Open`);let a=(r.tasks??[]).find(n=>Number(n.id)===t);a&&(a.isCompleted=l.isCompleted,kt(n,r))}else c&&(c.textContent=i.checked?`Completed`:`Open`)}catch(t){i.checked=l,c&&(c.textContent=l?`Completed`:`Open`),alert(`Failed to update task completion`),console.error(t)}finally{i.disabled=!1}})}}async function jt(t,n,r,i,a,o){let s=document.querySelector(`#promise-detail-content`),c=document.querySelector(`#error-text`),l=document.querySelector(`#promise-detail-loading`);Me(),l&&(l.hidden=!1),c.textContent=``;try{let c=await O(t,n,r);await V(`Promise`,c.id,t,n),l&&(l.hidden=!0),s.innerHTML=`
            <div class="detail-card promise-detail-card">
                <h2>${h(c.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${H(c.description||``)}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${h(c.description||``)}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr><th scope="row">Status</th><td>${Ze(c.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(c.createdAt).toLocaleDateString(`en-CA`)}</td></tr>
                    <tr><th scope="row">Updated</th><td>${c.updatedAt?new Date(c.updatedAt).toLocaleDateString(`en-CA`):`&ndash;`}</td></tr>
                </table>
                <h3>Epics</h3>
                <div id="promise-epics-list">
                    <p>Loading epics&hellip;</p>
                </div>
                <div id="promise-comments"></div>
                <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">&larr;</span> Back</button>
            </div>
        `,l&&(l.hidden=!0);let u=document.querySelector(`#description-input`),d=document.querySelector(`#description-view`),f=document.querySelector(`#edit-desc-btn`),p=document.querySelector(`#save-desc`),m=document.querySelector(`#cancel-desc`),g;u&&d&&f&&(R(u,`Promise`,c.id),g=W(u,d,f,p,m)),Ve({nodeType:`promise`,nodeId:r,owner:t,project:n});let v=document.querySelector(`#promise-epics-list`);try{let o=await Fe(t,n,r);F(`promise-${c.sequenceNumber}`,o);let l=xt(v,{headers:[`Statement`,`Actions`],items:o||[],emptyMessage:`No epics found for this promise.`,renderItemRow:r=>`
                    <tr data-epic-id="${r.id}">
                        <td>${h(r.statement)}</td>
                        <td><a href="/${t}/${n}/epics/${r.sequenceNumber}" epic-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                `}),u=v?.querySelector(`#add-epic-form`),d=v?.querySelector(`#add-epic-statement`),f=v?.querySelector(`#add-epic-msg`),p=v?.querySelector(`#add-epic-submit`);u&&d&&f&&p&&u.addEventListener(`submit`,async i=>{i.preventDefault(),f.textContent=``;let a=d.value.trim();if(!a){f.textContent=`Statement is required.`;return}p.disabled=!0;try{let i=await te(t,n,{statement:a,productPromiseId:r,displayOrder:(o||[]).length+1});if(i){Ct(l);let r=document.createElement(`tr`);r.dataset.epicId=i.id,r.innerHTML=`
                                <td>${h(i.statement)}</td>
                                <td><a href="/${t}/${n}/epics/${i.sequenceNumber}" epic-seq="${i.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `,St(l,r),d.value=``,F(`promise-${c.sequenceNumber}`,[...o||[],i])}}catch(t){f.textContent=`Failed to add epic.`,console.error(t)}finally{p.disabled=!1}}),v.innerHTML=`
                <table class="table table-sm table-striped align-middle promisemodel-table">
                    <thead>
                        <tr>
                            <th scope="col">Statement</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${o.map(r=>`
                            <tr>
                                <td>${h(r.statement)}</td>
                                <td><a href="/${t}/${n}/epics/${r.sequenceNumber}" epic-id="${r.id}" epic-seq="${r.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join(``)}
                    </tbody>
                </table>
            `;for(let r of s.querySelectorAll(`a[epic-id]`))r.addEventListener(`click`,o=>{o.ctrlKey||o.metaKey||o.button===1||(o.preventDefault(),_(`/${t}/${n}/epics/${r.getAttribute(`epic-seq`)}`,i,a))})}catch{v&&(v.innerHTML=`<p class="error">Failed to load epics.</p>`)}(function(){if(o?.permission!==`Edit`){let t=document.querySelector(`#edit-desc-btn`),n=document.querySelector(`#save-desc`),r=document.querySelector(`#description-input`);t&&(t.disabled=!0,t.title=`Requires Edit permission.`),n&&(n.disabled=!0,n.title=`Requires Edit permission.`),r&&(r.disabled=!0);let i=document.querySelector(`#add-epic-statement`),a=document.querySelector(`#add-epic-submit`);i&&(i.disabled=!0),a&&(a.disabled=!0,a.title=`Requires Edit permission.`)}})(),bt(s,`Promise`,c.id,t,n,o);let{owner:y,project:b}=rt();y&&b&&it(s,z(y,b,`promise-${c.sequenceNumber}`)),yt();let x=document.querySelector(`#desc-save-msg`);p&&p.addEventListener(`click`,async i=>{i.preventDefault(),x&&(x.textContent=``),p.disabled=!0;let a=document.querySelector(`#description-input`).value;try{c.description=(await oe(t,n,r,a))?.description??(a.trim()?a:void 0),P(`promise-${c.sequenceNumber}`,{description:c.description}),g&&g.showSavedPopover&&g.showSavedPopover(H(c.description||``))}catch(t){x&&(x.textContent=`Save failed`),console.error(t)}finally{p.disabled=!1}}),l&&(l.hidden=!0)}catch(t){l&&(l.hidden=!0),c&&(c.textContent=`Failed to load promise details.`),console.error(t)}}var G=t({owner:``,project:``,permission:void 0,isOwner:!1});function Mt(t,n){let r=document.querySelector(`#`+t);if(r)return r;let i=document.createElement(`div`);return i.innerHTML=n.trim(),r=i.firstElementChild,r&&document.body.append(r),r}function Nt(t){return new Date(t).toISOString().slice(0,10)}function Pt(t,n){let r=new Date(t);return r.setDate(r.getDate()+n),r}function Ft(t=[]){let n=new Date,r=Array.isArray(t)&&t.length>0?t.map(t=>new Date(t?.endDate??``)).filter(t=>Number.isFinite(t.getTime())).toSorted((t,n)=>n.getTime()-t.getTime())[0]:void 0,i=r?Pt(r,1):n,a=Pt(i,13);return{startDate:Nt(i),endDate:Nt(a),durationDays:14}}function It({owner:t,project:n,iterationId:r,iterations:i=[],existingStrides:a=[],onCreated:o}){let s=Mt(`stride-create-modal`,`
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
    `),c=s?.querySelector(`#stride-create-form`),l=s?.querySelector(`#stride-create-name`),u=s?.querySelector(`#stride-create-iteration`),d=s?.querySelector(`#stride-create-duration`),f=s?.querySelector(`#stride-create-start`),p=s?.querySelector(`#stride-create-end`),m=s?.querySelector(`#stride-create-error`),g=s?.querySelector(`#stride-create-submit`);if(!c||!l||!u||!d||!f||!p||!m||!g)return;c.replaceWith(c.cloneNode(!0));let _=s.querySelector(`#stride-create-form`),v=s.querySelector(`#stride-create-name`),y=s.querySelector(`#stride-create-iteration`),b=s.querySelector(`#stride-create-duration`),x=s.querySelector(`#stride-create-start`),S=s.querySelector(`#stride-create-end`),C=s.querySelector(`#stride-create-error`),w=s.querySelector(`#stride-create-submit`);y.innerHTML=(Array.isArray(i)?i:[]).map(t=>`
        <option value="${t.id}" ${String(t.id)===String(r)?`selected`:``}>
            ${h(t.name)}
        </option>
    `).join(``);let T=Ft(a);v.value=``,b.value=String(T.durationDays),x.value=T.startDate,S.value=T.endDate,C.textContent=``,C.classList.add(`d-none`),w.disabled=!1,w.textContent=`Create Stride`,b.addEventListener(`input`,()=>{let t=Math.max(1,Number.parseInt(b.value,10)||1),n=new Date(x.value);if(!Number.isFinite(n.getTime()))return;let r=new Date(n);r.setDate(r.getDate()+t-1),S.value=r.toISOString().slice(0,10)}),x.addEventListener(`change`,()=>{let t=Math.max(1,Number.parseInt(b.value,10)||1),n=new Date(x.value);if(!Number.isFinite(n.getTime()))return;let r=new Date(n);r.setDate(r.getDate()+t-1),S.value=r.toISOString().slice(0,10)}),_.addEventListener(`submit`,async r=>{r.preventDefault();let i=v.value.trim();if(!i){C.textContent=`Stride name is required.`,C.classList.remove(`d-none`),v.focus();return}let a=Number.parseInt(y.value,10);if(!a){C.textContent=`Select an iteration for this stride.`,C.classList.remove(`d-none`),y.focus();return}let c=Math.max(1,Number.parseInt(b.value,10)||1),l=x.value,u=S.value;w.disabled=!0,w.textContent=`Creating...`;try{await Ge(t,n,{name:i,iterationId:a,startDate:l,endDate:u,durationDays:c,isActive:!0}),globalThis.bootstrap?.Modal?.getOrCreateInstance(s)?.hide(),await o?.()}catch(t){C.textContent=t?.message||`Failed to create stride.`,C.classList.remove(`d-none`)}finally{w.disabled=!1,w.textContent=`Create Stride`}}),globalThis.bootstrap?.Modal?.getOrCreateInstance(s)?.show()}var Lt={XS:1,S:2,M:3,L:5,XL:8,XXL:13,XXXL:21},K={cachedMembers:[],cachedAllStrides:[],cachedIterations:[],isCachedCanEdit:!1,isStrideStickySyncBound:!1};function Rt(t){let n=document.querySelectorAll(`.status-dropdown, .estimate-dropdown, .owner-dropdown, .moment-type-dropdown, .backlog-target-stride, .move-to-backlog-btn, .move-to-stride-from-backlog-btn`);for(let r of n)r.disabled=!t;for(let n of document.querySelectorAll(`.progress-stride-btn`))n.classList.toggle(`hidden`,!t)}function zt(t){let n=window.scrollY,r=t();return window.scrollTo(0,n),r}function Bt(t){let n=new Date(t?.startDate);return Number.isFinite(n?.getTime?.())?n.getTime():0}function Vt(t){let n=Array.isArray(K.cachedAllStrides)?[...K.cachedAllStrides]:[];n.sort((t,n)=>Bt(t)-Bt(n));let r=n.findIndex(n=>String(n?.id)===String(t));if(r!==-1)return n[r+1]?.id}function Ht(t){return(t?.querySelector?.(`.status-dropdown`)?.value??t?.querySelector?.(`.status-badge`)?.textContent??``).trim()===`Done`}function Ut(t){let n=t?.querySelector?.(`:scope .stride-moments .no-items`);n&&n.remove()}function Wt(t){if(!t)return;let n=t.querySelector(`:scope .stride-moments`);n&&(t.querySelectorAll(`:scope table.promisemodel-table tbody tr[data-moment-id]`).length>0||(n.innerHTML=c({icon:`bi-clock`,title:`No moments assigned.`,description:`Move moments from the backlog into this stride.`})))}function q(t){let n=t?.querySelector?.(`.stride-total-effort`);if(!n)return;let r=0;for(let n of t.querySelectorAll(`:scope table.promisemodel-table tbody tr[data-moment-id]`)){let t=n.querySelector(`.estimate-dropdown`)?.value;r+=Lt[t]??0}n.textContent=`Total Effort: ${r}`}function Gt(t){let n=document.querySelector(`.stride-card[data-stride-id="${CSS.escape(t)}"]`);if(!n)return{moved:0,targetVisible:!1};let r=Vt(t),i;r&&(i=document.querySelector(`.stride-card[data-stride-id="${CSS.escape(r)}"]`));let a=[...n.querySelectorAll(`tr[data-moment-id]`)].filter(t=>!Ht(t));if(a.length===0)return q(n),Wt(n),{moved:0,targetVisible:!!i};if(!i){for(let t of a)t.remove();return q(n),Wt(n),{moved:a.length,targetVisible:!1}}Ut(i);let o=vn(r);if(!o){for(let t of a)t.remove();return q(n),Wt(n),{moved:a.length,targetVisible:!1}}for(let t of a)o.append(t);return q(n),q(i),Wt(n),{moved:a.length,targetVisible:!0}}function Kt(t,n){return`<select class="estimate-dropdown" data-moment-id="${t}" data-current-estimate="${n??``}" aria-label="Effort estimate"></select>`}function qt(t,n){return`<select class="owner-dropdown" data-moment-id="${t}" data-owner-id="${n??``}" aria-label="Owner"></select>`}function Jt(t,n){return`<select class="moment-type-dropdown form-select form-select-sm" data-moment-id="${t}" data-current-type="${n}" aria-label="Moment type">
        <option value="Story" ${n===`Story`?`selected`:``}>Story</option>
        <option value="Job" ${n===`Job`?`selected`:``}>Job</option>
    </select>`}function Yt(t,n){return`<select class="status-dropdown" data-moment-id="${t}" data-current-status="${n??``}" aria-label="Status"></select>`}function Xt(t,n){let r=t?.querySelector(`.status-badge`);if(!r)return;let i=n??``;r.textContent=i;let a=[...r.classList].filter(t=>t.startsWith(`status-`)&&t!==`status-badge`);for(let t of a)r.classList.remove(t);r.classList.add(`status-${String(i).toLowerCase()}`)}function Zt(t){return t?.querySelector(`.stride-moments, .backlog-content`)}function Qt(t){let n=t?`bi-chevron-down`:`bi-chevron-up`,r=t?`Expand board`:`Collapse board`;return`
        <button class="stride-toggle-btn" type="button" aria-label="${r}" title="${r}" aria-pressed="${String(!t)}">
            <i class="bi ${n}" aria-hidden="true"></i>
        </button>
    `}function $t(t,n,r=``){return`
        <div class="stride-header">
            <div class="stride-header-main">
                ${Qt(n)}
                <h3>${h(t)}</h3>
            </div>
            ${r?`<div class="stride-header-actions ms-auto">${r}</div>`:``}
        </div>
    `}function en(t,n){if(!t)return;t.classList.toggle(`is-collapsed`,n);let r=Zt(t);r&&r.classList.toggle(`hidden`,n);let i=t.querySelector(`.stride-toggle-btn`),a=i?.querySelector(`.bi`);if(i&&a){let t=n?`bi-chevron-down`:`bi-chevron-up`,r=n?`Expand board`:`Collapse board`;a.className=`bi ${t}`,i.setAttribute(`aria-label`,r),i.setAttribute(`title`,r),i.setAttribute(`aria-pressed`,String(!collapsed))}}function tn(t){!t||t.dataset.boundCollapseToggles===`1`||(t.dataset.boundCollapseToggles=`1`,t.addEventListener(`click`,t=>{let n=t.target.closest(`.stride-toggle-btn`);if(!n)return;let r=n.closest(`[data-collapsible-board]`);r&&en(r,!r.classList.contains(`is-collapsed`))}))}function nn(){let t=document.querySelector(`.header`)?.offsetHeight??0;for(let n of document.querySelectorAll(`[data-collapsible-board]`)){n.style.setProperty(`--stride-sticky-top`,`${t}px`);let r=n.querySelector(`:scope .stride-header`)?.offsetHeight??0;n.style.setProperty(`--stride-header-height`,`${r}px`)}}function rn(){K.isStrideStickySyncBound||(K.isStrideStickySyncBound=!0,window.addEventListener(`resize`,nn))}function an(t){let n=document.querySelector(`#stride-scrollspy-nav`);if(!n)return;if(!Array.isArray(t)||t.length<=1){n.innerHTML=``,n.classList.add(`d-none`);return}n.classList.remove(`d-none`),n.innerHTML=`
        <div class="position-sticky top-0 bg-body border rounded p-2 shadow-sm">
            <div class="small text-uppercase text-secondary mb-2">Current Strides</div>
            <nav id="stride-scrollspy-links" class="nav nav-pills flex-wrap gap-2"></nav>
        </div>
    `;let r=n.querySelector(`#stride-scrollspy-links`);for(let n of t){let t=document.createElement(`a`);t.className=`nav-link py-1 px-2`,t.href=`#stride-card-${n.id}`,t.textContent=n.name,r?.append(t)}let i=document.createElement(`a`);i.className=`nav-link py-1 px-2`,i.href=`#backlog-section`,i.textContent=`Backlog`,r?.append(i);let a=globalThis.bootstrap?.ScrollSpy;a&&a.getOrCreateInstance(document.body,{target:`#stride-scrollspy-links`,offset:140})?.refresh?.(),n.dataset.boundScrollspyClick!==`1`&&(n.dataset.boundScrollspyClick=`1`,n.addEventListener(`click`,t=>{let n=t.target.closest(`a.nav-link`);if(!n)return;let r=n.getAttribute(`href`)||``;if(!r.startsWith(`#`))return;let i=document.querySelector(r);i&&(t.preventDefault(),i.scrollIntoView({behavior:`smooth`,block:`start`}),history.replaceState({},``,r))}))}function on(t){let n=z(K.cachedOwner,K.cachedProject,`moment-${t}`);return n?`
        <a href="${n}" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-label="Open graph view focused on moment ${t}">
            <i class="bi bi-diagram-3" aria-hidden="true"></i>
            <span>Graph View</span>
        </a>
    `:``}function sn(t,n,r,i){let a=document.querySelector(`#${CSS.escape(t)}`);return a||(a=document.createElement(`div`),a.className=`modal fade`,a.id=t,a.tabIndex=-1,a.setAttribute(`aria-hidden`,`true`),a.innerHTML=`
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${n}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-0" id="${t}-text"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn ${i}" id="${t}-confirm">${r}</button>
                </div>
            </div>
        </div>
    `,document.body.append(a),a)}function cn(){return sn(`move-to-backlog-modal`,`Move to Backlog?`,`Move to Backlog`,`btn-danger`)}function ln(t,n){let r=cn(),i=r.querySelector(`#move-to-backlog-modal-text`),a=r.querySelector(`#move-to-backlog-modal-confirm`);if(!i||!a)return;i.textContent=`Move ${mn(t)} to the Backlog?`;let o=a.cloneNode(!0);a.parentElement.replaceChild(o,a),o.addEventListener(`click`,async()=>{o.disabled=!0;try{await n(),globalThis.bootstrap?.Modal?.getOrCreateInstance?.(r)?.hide()}catch(t){console.error(t),alert(`Failed to move moment`)}finally{o.disabled=!1}},{once:!0}),globalThis.bootstrap?.Modal?.getOrCreateInstance?.(r)?.show()}function un(){return sn(`move-to-stride-modal`,`Move to Stride?`,`Move`,`btn-primary`)}function dn(){return sn(`progress-stride-modal`,`Progress Stride?`,`Progress`,`btn-success`)}function fn(t){let n=dn(),r=n.querySelector(`#progress-stride-modal-text`),i=n.querySelector(`#progress-stride-modal-confirm`);if(!r||!i)return Promise.resolve(confirm(`Move all unfinished moments to the next stride?`));let a=document.querySelector(`.stride-card[data-stride-id="${CSS.escape(t)}"]`)?.querySelector(`:scope .stride-header h3`)?.textContent?.trim();return r.textContent=a?`Move all unfinished moments in ${a} to the next stride?`:`Move all unfinished moments to the next stride?`,new Promise(t=>{let r=!1,a=n=>{r||(r=!0,t(n))},o=globalThis.bootstrap?.Modal?.getOrCreateInstance?.(n);i.addEventListener(`click`,()=>{a(!0),o?.hide?.()},{once:!0}),n.addEventListener(`hidden.bs.modal`,()=>a(!1),{once:!0}),o?.show?.()})}function pn(t,n,r){let i=un(),a=i.querySelector(`#move-to-stride-modal-text`),o=i.querySelector(`#move-to-stride-modal-confirm`);if(!a||!o)return;a.textContent=`Move ${mn(t)} to the selected stride?`;let s=o.cloneNode(!0);o.parentElement.replaceChild(s,o),s.addEventListener(`click`,async()=>{s.disabled=!0;try{await r(),globalThis.bootstrap?.Modal?.getOrCreateInstance?.(i)?.hide()}catch(t){console.error(t),alert(`Failed to move moment`)}finally{s.disabled=!1}},{once:!0}),globalThis.bootstrap?.Modal?.getOrCreateInstance?.(i)?.show()}function mn(t){let n=hn(t)?.querySelector(`td`),r=String(n?.textContent??``).trim();return r?r.slice(0,35):`moment ${t}`}function hn(t){return document.querySelector(`tr[data-moment-id="${CSS.escape(t)}"]`)}function gn(){let t=document.querySelector(`#backlog-section`);return t?t.querySelector(`:scope .backlog-content table.promisemodel-table tbody`)||(t.innerHTML=`
        <div class="stride-card backlog-board is-collapsed" data-collapsible-board="1">
            ${$t(`Backlog`,!0)}
            <div class="stride-moments backlog-content hidden">
                <table class="promisemodel-table">
                    <thead>
                        <tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `,t.querySelector(`:scope .backlog-content table.promisemodel-table tbody`)):void 0}function _n(t){let n=document.createElement(`tr`);n.dataset.momentId=String(t.sequenceNumber),n.innerHTML=`
        <td>${h(t.statement)}</td>
        <td>${Jt(t.sequenceNumber,t.type)}</td>
        <td><span class="status-badge status-${(t.status||``).toLowerCase()}">${t.status}</span></td>
        <td>${t.effortEstimate??`–`}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${t.sequenceNumber}"></select>
                <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${t.sequenceNumber}" type="button">Move</button>
                ${on(t.sequenceNumber)}
    <a href="/${K.cachedOwner}/${K.cachedProject}/moments/${t.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                </div>
            </td>
        `;let r=n.querySelector(`.backlog-target-stride`);return r&&On(r),n}function vn(t){let n=document.querySelector(`.stride-card[data-stride-id="${CSS.escape(t)}"]`);if(!n)return;let r=n.querySelector(`:scope table.promisemodel-table tbody`);if(r)return r;let i=n.querySelector(`:scope .stride-moments`);if(i)return i.innerHTML=`
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
    `,n.querySelector(`:scope table.promisemodel-table tbody`)}function yn(t){let n=document.createElement(`tr`);n.dataset.momentId=String(t.sequenceNumber),n.innerHTML=`
        <td>${h(t.statement)}</td>
        <td>${Jt(t.sequenceNumber,t.type)}</td>
        <td><span class="status-badge status-${(t.status||``).toLowerCase()}">${t.status}</span></td>
        <td>${Kt(t.sequenceNumber,t.effortEstimate)}</td>
        <td>${qt(t.sequenceNumber,t.ownerId)}</td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                ${Yt(t.sequenceNumber,t.status)}
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${t.sequenceNumber}" data-current-estimate="${t.effortEstimate??``}"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${t.sequenceNumber}" type="button">Backlog</button>
                ${on(t.sequenceNumber)}
                <a href="/${K.cachedOwner}/${K.cachedProject}/moments/${t.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
    `;let r=n.querySelector(`.estimate-dropdown`),i=n.querySelector(`.estimate-dropdown-mobile`),a=n.querySelector(`.owner-dropdown`),o=n.querySelector(`.status-dropdown`);return r&&Tn(r),i&&Tn(i),o&&En(o),a&&Dn(a),n}function bn(t,n,r,i,a){t&&t.dataset.bound!==`1`&&(t.dataset.bound=`1`,t.addEventListener(`change`,async t=>{let i=t.target;if(i.matches(`.status-dropdown`)){let t=parseInt(i.dataset.momentId,10),a=i.value;try{let a=await f(n,r,t,i.value),o=hn(t);o&&Xt(o,a.status)}catch{i.value=a,alert(`Failed to update status`)}}if(i.matches(`.estimate-dropdown`)||i.matches(`.estimate-dropdown-mobile`)){let t=parseInt(i.dataset.momentId,10),a=i.value;try{await x(n,r,t,i.value===``?void 0:i.value);let a=hn(t)?.closest(`.stride-card`);a&&q(a)}catch{i.value=a,alert(`Failed to update estimate`)}}if(i.matches(`.owner-dropdown`)){let t=parseInt(i.dataset.momentId,10),a=i.value;try{let a;i.value&&(a=parseInt(i.value,10));let s=await o(n,r,t,a);i.value=String(s.ownerId??``)}catch{i.value=a,alert(`Failed to update owner`)}}if(i.matches(`.moment-type-dropdown`)){let t=parseInt(i.dataset.momentId,10),a=i.value,o=i.dataset.currentType||a;try{await w(n,r,t,a),i.dataset.currentType=a}catch{i.value=o,alert(`Failed to update type`)}}}),t.addEventListener(`click`,async t=>{let o=t.target.closest(`a[data-moment-view]`);if(o){e.preventDefault(),_(o.getAttribute(`href`),i,a);return}let s=e.target.closest(`.move-to-backlog-btn, .move-to-stride-from-backlog-btn, .progress-stride-btn`);if(s){if(s.classList.contains(`move-to-backlog-btn`)){let t=parseInt(s.dataset.momentId,10);ln(t,async()=>{let i=await g(n,r,t,void 0);zt(()=>{let n=hn(t),r=n?.closest(`.stride-card`);n&&n.remove();let a=gn();a&&a.append(_n(i)),r&&(q(r),Wt(r))})})}if(s.classList.contains(`move-to-stride-from-backlog-btn`)){let t=parseInt(s.dataset.momentId,10),i=s.closest(`tr`)?.querySelector(`.backlog-target-stride`),a;if(i&&(a=parseInt(i.value,10)),!a)return;pn(t,a,async()=>{let i=await g(n,r,t,a);zt(()=>{hn(t)?.remove();let n=vn(a),r=document.querySelector(`.stride-card[data-stride-id="${CSS.escape(a)}"]`);n&&n.append(yn(i)),r&&(q(r),Ut(r))})})}if(s.classList.contains(`progress-stride-btn`)){let t=parseInt(s.dataset.strideId,10);if(!await fn(t))return;try{await Ye(n,r,t);let i=document.querySelector(`#success-text`);i&&(i.textContent=``);let{moved:a,targetVisible:o}=zt(()=>Gt(t));i&&(a===0?i.textContent=`Stride progressed. No unfinished moments to move.`:o?i.textContent=`Stride progressed. Moved ${a} moment(s) to the next stride.`:i.textContent=`Stride progressed. Moved ${a} moment(s) to the next stride (not shown on this page).`)}catch{alert(`Failed to progress stride`)}}}}))}function xn(t){return t.reduce((t,n)=>t+(Lt[n.effortEstimate]||0),0)}async function Sn(t,n,r,i,a){let o=document.querySelector(`#stride-board`),s=document.querySelector(`#backlog-section`),l=document.querySelector(`#error-text`),d=document.querySelector(`#project-title`),f=document.querySelector(`#create-stride-btn`),p=document.querySelector(`#create-stride-btn-label`);K.cachedOwner=t,K.cachedProject=n,o.innerHTML=u(`Loading strides`),l.textContent=``,s&&(s.innerHTML=``),tn(o),s&&tn(s),rn();let m=a?.permission===`Edit`;f&&(m?f.dataset.bound!==`1`&&(f.dataset.bound=`1`,f.addEventListener(`click`,()=>{if(K.cachedIterations.length===0){Je(t,n,()=>Sn(t,n,r,i,a));return}let o=K.cachedIterations[0];It({owner:t,project:n,iterationId:o.id,iterations:K.cachedIterations,existingStrides:K.cachedAllStrides,onCreated:()=>Sn(t,n,r,i,a)})})):f.classList.add(`d-none`));try{let a;try{a=await Xe(t,n)}catch{}let l=await re(t,n);if(K.cachedIterations=Array.isArray(l)?[...l].toSorted((t,n)=>n.id-t.id):[],K.cachedIterations.length===0){o.innerHTML=c({icon:`bi-repeat`,title:`No iterations found for this project.`,description:`Create the first iteration to start planning your work.`}),d&&(d.innerHTML=`<h2>${h(a?.name??`Project ${t}/${n}`)}</h2>`),p&&(p.textContent=`Create First Iteration`);return}let u=K.cachedIterations[0];d.innerHTML=`<h2>${h(a?.name??`Project ${t}/${n}`)} – ${h(u.name)}</h2>`,p&&(p.textContent=`New Stride`);let f=document.querySelector(`#iteration-history-link`);f&&f.addEventListener(`click`,()=>{_(`/${t}/${n}/iterations`,r,i)});let[m,g]=await Promise.all([Ee(t,n,u.id),ve(t,n,u.id,!0)]);o.innerHTML=``;let v=[],y=m;if(!y||y.length===0)o.innerHTML=c({icon:`bi-kanban`,title:`No strides found for this iteration.`,description:`Create a stride to organize your moments into sprints.`});else{an(y);let r=y.map(async r=>{try{return{stride:r,moments:await _e(t,n,r.id)}}catch(t){return console.error(`Failed to load moments for stride`,r.id,t),{stride:r,moments:[]}}});v=await Promise.all(r)}let b=0;for(let{stride:r,moments:i}of v){let a=b!==0,s=document.createElement(`div`);s.className=`stride-card${a?` is-collapsed`:``}`,s.dataset.strideId=String(r.id),s.id=`stride-card-${r.id}`,s.dataset.collapsibleBoard=`1`;let l=xn(i);s.innerHTML=`
                <div class="stride-header">
                    <div class="stride-header-main">
                        ${Qt(a)}
                        <h3>${h(r.name)}</h3>
                        <span class="stride-dates">${An(r.startDate)} – ${An(r.endDate)}</span>
                        <span class="stride-duration">(${r.durationDays} days)</span>
                        <span class="stride-countdown" data-end-date="${r.endDate}"></span>
                        <span class="stride-total-effort">Total Effort: ${l}</span>
                    </div>
                    <div class="stride-header-actions ms-auto">
                        <button class="progress-stride-btn btn btn-outline-success btn-sm hidden" data-stride-id="${r.id}" type="button"><span aria-hidden="true">🧟</span> Progress</button>
                    </div>
                </div>
                <div class="stride-moments${a?` hidden`:``}">
                    ${i.length===0?c({icon:`bi-clock`,title:`No moments assigned.`,description:`Move moments from the backlog into this stride.`}):`<table class="promisemodel-table">
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
                                 ${i.map(r=>`
                                    <tr data-moment-id="${r.sequenceNumber}">
                                        <td>${h(r.statement)}</td>
                                        <td>${Jt(r.sequenceNumber,r.type)}</td>
                                        <td><span class="status-badge status-${(r.status||``).toLowerCase()}">${r.status}</span></td>
                                        <td>
                                            <select class="estimate-dropdown" data-moment-id="${r.sequenceNumber}" data-current-estimate="${r.effortEstimate??``}" aria-label="Effort estimate"></select>
                                        </td>
                                        <td>
                                            <select class="owner-dropdown" data-moment-id="${r.sequenceNumber}" data-owner-id="${r.ownerId??``}" aria-label="Owner"></select>
                                        </td>
        <td>
            <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                <select class="status-dropdown form-select form-select-sm" data-moment-id="${r.sequenceNumber}" data-current-status="${r.status??``}" aria-label="Status"></select>
                <select class="estimate-dropdown-mobile form-select form-select-sm" data-moment-id="${r.sequenceNumber}" data-current-estimate="${r.effortEstimate??``}" aria-label="Effort estimate"><option value="">–</option></select>
                <button class="move-to-backlog-btn btn btn-outline-danger btn-sm" data-moment-id="${r.sequenceNumber}" type="button">Backlog</button>
                ${on(r.sequenceNumber)}
                <a href="/${t}/${n}/moments/${r.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
            </div>
        </td>
                                    </tr>
                                `).join(``)}
                            </tbody>
                        </table>`}
                </div>
            `,o.append(s),kn(s),b++}if(s){let r=y&&y.length>0;!g||g.length===0?s.innerHTML=`
                    <div class="stride-card backlog-board${r?` is-collapsed`:``}" data-collapsible-board="1">
                        ${$t(`Backlog`,r)}
                        <div class="stride-moments backlog-content${r?` hidden`:``}">
                            ${c({icon:`bi-inbox`,title:`No unassigned moments.`,description:`Create new moments or assign existing ones to this project.`})}
                        </div>
                    </div>
                `:(s.innerHTML=`
                    <div class="stride-card backlog-board${r?` is-collapsed`:``}" data-collapsible-board="1">
                        ${$t(`Backlog`,r)}
                        <div class="stride-moments backlog-content${r?` hidden`:``}">
                            <table class="promisemodel-table">
                                <thead><tr><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead>
                                <tbody>
                                    ${g.map(r=>`
                                        <tr data-moment-id="${r.sequenceNumber}">
                                            <td>${h(r.statement)}</td>
                                            <td>${Jt(r.sequenceNumber,r.type)}</td>
                                            <td><span class="status-badge status-${(r.status||``).toLowerCase()}">${r.status}</span></td>
                                            <td>${r.effortEstimate??`–`}</td>
                                            <td>
                                                <div class="d-inline-flex flex-wrap gap-2 align-items-center">
                                                    <select class="backlog-target-stride form-select form-select-sm" data-moment-id="${r.sequenceNumber}"></select>
                                                    <button class="move-to-stride-from-backlog-btn btn btn-outline-primary btn-sm" data-moment-id="${r.sequenceNumber}" type="button">Move</button>
                                                    ${on(r.sequenceNumber)}
                                                    <a href="/${t}/${n}/moments/${r.sequenceNumber}" data-moment-view="true" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">View</a>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join(``)}
                                </tbody>
                            </table>
                        </div>
                    </div>`,kn(s))}requestAnimationFrame(nn);try{let r=await ue(t,n);K.cachedMembers=Array.isArray(r)?r:[];for(let t of document.querySelectorAll(`.owner-dropdown`))Dn(t)}catch(t){console.error(`Failed to load project members`,t)}try{let r=await ye(t,n);K.isCachedCanEdit=r&&(r.toLowerCase()===`edit`||r.toLowerCase()===`owner`),Rt(K.isCachedCanEdit)}catch(t){console.error(`Failed to get permission`,t)}jn(),K.cachedAllStrides=Array.isArray(y)?y:[],an(K.cachedAllStrides);for(let t of document.querySelectorAll(`.backlog-target-stride`))On(t);Cn(t,n,r,i)}catch(t){o.innerHTML=``,l.textContent=`Failed to load data.`,console.error(t)}}function Cn(t,n,r,i){let a=document.querySelector(`#stride-board`),o=document.querySelector(`#backlog-section`);bn(a,t,n,r,i),bn(o,t,n,r,i)}function J(t,n,r){let i=document.createElement(`option`);return i.value=String(t??``),i.textContent=n??``,r&&(i.selected=!0),i}var wn=[`XS`,`S`,`M`,`L`,`XL`,`XXL`,`XXXL`];function Tn(t){if(!t)return;let n=t.dataset.currentEstimate||t.value||``;t.innerHTML=``,t.append(J(``,`–`,n===``));for(let r of wn)t.append(J(r,r,String(n)===String(r)))}function En(t){if(!t)return;let n=t.dataset.currentStatus||t.value||``;t.innerHTML=``;for(let r of fe)t.append(J(r.value,`${r.icon} ${r.label}`,n===r.value))}function Dn(t){if(!t)return;let n=t.value||t.dataset.ownerId||``;t.innerHTML=``,t.append(J(``,`Unassigned`,n===``));let r=K.cachedMembers||[];for(let i of r)t.append(J(String(i.userId),i.userName,String(n)===String(i.userId)));[...t.options].every(t=>t.value!==String(n))&&(t.value=``)}function On(t){if(!t)return;let n=t.value||``;t.innerHTML=``;let r=K.cachedAllStrides||[];for(let i of r)t.append(J(String(i.id),i.name,String(n)===String(i.id)));[...t.options].every(t=>t.value!==String(n))&&(t.value=t.options[0]&&t.options[0].value||``)}function kn(t){if(t){for(let n of t.querySelectorAll(`.estimate-dropdown`))Tn(n);for(let n of t.querySelectorAll(`.estimate-dropdown-mobile`))Tn(n);for(let n of t.querySelectorAll(`.status-dropdown`))En(n);for(let n of t.querySelectorAll(`.owner-dropdown`))Dn(n);for(let n of t.querySelectorAll(`.backlog-target-stride`))On(n)}}function An(t){return t?new Date(t).toLocaleDateString(`en-CA`,{month:`short`,day:`numeric`,year:`numeric`}):`N/A`}function jn(){for(let t of document.querySelectorAll(`.stride-countdown`)){let n=new Date(t.dataset.endDate),r=new Date,i=Math.ceil((n.getTime()-r.getTime())/(1e3*60*60*24));t.classList.remove(`stride-countdown--ended`,`stride-countdown--ending`,`stride-countdown--healthy`),i<0?(t.textContent=`Ended`,t.classList.add(`stride-countdown--ended`)):i===0?(t.textContent=`Ends today`,t.classList.add(`stride-countdown--ending`)):i<=3?(t.textContent=`${i} day${i>1?`s`:``} left`,t.classList.add(`stride-countdown--ending`)):(t.textContent=`${i} days left`,t.classList.add(`stride-countdown--healthy`))}}async function Mn(t,n,r,i,a){try{await p(`strides/list.html`,i),Sn(t,n,r,i,a)}catch{m(i,`strides`)()}}function Nn(t,n){t&&(t.innerHTML=`
        <div class="table-responsive summary-table-wrap">
            <table class="table table-sm table-striped table-hover align-middle mb-0 detail-table summary-table">
            <tbody class="table-group-divider">
                ${n.map(t=>`
                    ${t.isGap?`<tr class="summary-gap"><td colspan="2" class="border-0 py-2"></td></tr>`:`<tr>
                            <th scope="row" class="summary-key text-muted fw-semibold">${h(t.label)}</th>
                            <td class="summary-value">${h(t.value)}</td>
                        </tr>`}
                `).join(``)}
            </tbody>
            </table>
        </div>
    `)}function Pn(t,n){let r=document.querySelector(`#add-project-form`),i=document.querySelector(`#cancel-add-project-link`),a=document.querySelector(`#project-name-input`),o=document.querySelector(`#project-description-input`),s=document.querySelector(`#first-promise-panel`),c=document.querySelector(`#first-promise-input`),l=document.querySelector(`#create-project-btn`),u=document.querySelector(`#create-project-btn-spinner`),d=document.querySelector(`#create-project-btn-label`),f=document.querySelector(`#import-project-btn`),p=document.querySelector(`#import-project-btn-spinner`),m=document.querySelector(`#import-project-btn-icon`),h=document.querySelector(`#import-project-btn-label`),g=document.querySelector(`#clear-import-btn`),v=document.querySelector(`#import-project-input`),y=document.querySelector(`#project-import-summary-panel`),b=document.querySelector(`#error-text`),x=document.querySelector(`#success-text`);if(!r||!a||!o||!s||!c||!l||!u||!d||!f||!p||!m||!h||!g||!v||!y||!b||!x)return;let S=`scratch`,C=!1;function w(){b.textContent=``,b.style.display=`none`,x.textContent=``,x.style.display=`none`}function T(){return S===`import`?`Import Project`:`Create Project`}function E(){return S===`import`?`Importing Project...`:`Creating Project...`}function D(t){l.disabled=t,u.classList.toggle(`d-none`,!t),d.textContent=(t?E:T)()}function O(t,n=`Reading Project...`){f.disabled=t,p.classList.toggle(`d-none`,!t),m.classList.toggle(`d-none`,t),h.textContent=t?n:`Import Project...`}function k(t,n=`submit`){C=t,D(t&&n===`submit`),O(t&&n===`import`,n===`submit`?`Importing Project...`:`Reading Project...`),l.disabled=t,g.disabled=t,f.disabled=t,a.disabled=t,o.disabled=t,c.disabled=t,t||A(S)}function A(t){S=t;let n=t===`import`,r=!!v.files?.[0];s.hidden=n,a.readOnly=n,o.readOnly=n,d.textContent=(C?E:T)(),g.hidden=!n||!r,g.style.display=g.hidden?`none`:``}function j(){v.value=``,y.innerHTML=``,a.value=``,o.value=``,h.textContent=`Import Project...`,m.classList.remove(`d-none`),p.classList.add(`d-none`),f.disabled=!1,A(`scratch`),N()}let M=document.querySelector(`h1`);function N(){let t=a.value.trim(),n=S===`import`?`Import`:`Create`;t&&M?M.textContent=`${n} '${t}'`:M&&(M.textContent=`${n} Project`)}a.addEventListener(`input`,N);function ee(t){let n=t.project,r=Array.isArray(n.productPromises)?n.productPromises:[],i=r.flatMap(t=>Array.isArray(t.epics)?t.epics:[]),a=i.flatMap(t=>Array.isArray(t.journeys)?t.journeys:[]),o=a.flatMap(t=>Array.isArray(t.flows)?t.flows:[]),s=o.flatMap(t=>Array.isArray(t.moments)?t.moments:[]),c=Array.isArray(n.iterations)?n.iterations:[],l=c.flatMap(t=>Array.isArray(t.strides)?t.strides:[]);return{promises:r.length,epics:i.length,journeys:a.length,flows:o.length,moments:s.length,iterations:c.length,strides:l.length,promiseStackTotal:r.length+i.length+a.length+o.length+s.length}}function te(t,n){let r=t.project,i=ee(t);Nn(y,[{label:`Schema Version`,value:t.schemaVersion??`Unknown`},{label:`Exported At`,value:t.exportedAt?new Date(t.exportedAt).toLocaleString():`Unknown`},{label:`Project Name`,value:r.name??``},{label:`Project Description`,value:r.description??``},{label:`Promises`,value:i.promises},{label:`Epics`,value:i.epics},{label:`Journeys`,value:i.journeys},{label:`Flows`,value:i.flows},{label:`Moments`,value:i.moments},{label:`Promise Stack Total`,value:i.promiseStackTotal},{isGap:!0},{label:`Iterations`,value:i.iterations},{label:`Strides`,value:i.strides}])}async function ne(t){let n;try{n=JSON.parse(await t.text())}catch{throw Error(`The selected file is not valid JSON.`)}if(!n||typeof n!=`object`||!n.project)throw Error(`The selected file does not look like a project export.`);return n}async function re(){w();let r=a.value.trim();if(!r){b.textContent=`Project name is required.`,b.style.display=`block`;return}let i=o.value.trim(),s=c.value.trim();if(!s){b.textContent=`The first Product Promise is required when creating from scratch.`,b.style.display=`block`;return}try{k(!0,`submit`);let a=await Be({name:r,description:i||void 0});await ce(a.ownerSlug,a.slug,{statement:s,description:void 0,displayOrder:0}),_(`/${a.ownerSlug}/${a.slug}/graph`,t,n)}catch(t){b.textContent=t.message||`Failed to create project.`,b.style.display=`block`}finally{k(!1,`submit`)}}async function ie(){w();let r=v.files?.[0];if(!r){b.textContent=`Choose a project export to import.`,b.style.display=`block`;return}try{k(!0,`submit`);let i=await Te(r),{ownerSlug:a,slug:o}=i??{},s=Array.isArray(i?.warnings)?i.warnings:Array.isArray(i?.Warnings)?i.Warnings:[];x.textContent=s.length>0?`Project imported with ${s.length} warning(s).`:`Project imported successfully.`,x.style.display=`block`,_(a&&o?`/${a}/${o}/graph`:`/projects`,t,n)}catch(t){b.textContent=t.message||`Failed to import project.`,b.style.display=`block`}finally{k(!1,`submit`)}}r.addEventListener(`submit`,async t=>{if(t.preventDefault(),S===`import`){await ie();return}await re()}),f.addEventListener(`click`,()=>{v.click()}),v.addEventListener(`change`,async()=>{w();let t=v.files?.[0];if(!t){j();return}try{k(!0,`import`);let n=await ne(t);a.value=n.project.name??``,o.value=n.project.description??``,A(`import`),N(),te(n,t)}catch(t){j(),b.textContent=t.message||`Failed to read imported project.`,b.style.display=`block`}finally{k(!1,`import`)}}),g.addEventListener(`click`,()=>{w(),j(),a.focus()}),i&&i.addEventListener(`click`,r=>{r.preventDefault(),_(`/projects`,t,n)}),A(`scratch`),N()}var Fn=globalThis.tippy,Y={owner:void 0,project:void 0,permission:void 0},In={root:`Promise`,promise:`Epic`,epic:`Journey`,journey:`Flow`,flow:`Moment`};function Ln(t,n){let r=X(t);if(r===`root`)return`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}`;let i=Number.parseInt(n,10);if(!Number.isNaN(i))switch(r){case`promise`:return`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}/promises/${i}`;case`epic`:return`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}/epics/${i}`;case`journey`:return`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}/journeys/${i}`;case`flow`:return`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}/flows/${i}`;case`moment`:return`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}/moments/${i}`;default:return}}function X(t){return String(t??``).trim().toLowerCase()}function Rn(t){let n=t?.payload??{};return String(n.statement??n.name??`#${n.id??``}`).trim()}function zn(t){return In[X(t)]??void 0}function Bn(t){let n=X(t.nodeType),r=`/api/projects/${encodeURIComponent(Y.owner)}/${encodeURIComponent(Y.project)}`;switch(n){case`root`:return{entityLabel:`Promise`,endpoint:`${r}/promises/create`,parentField:`projectId`};case`promise`:return{entityLabel:`Epic`,endpoint:`${r}/epics/create`,parentField:`productPromiseId`};case`epic`:return{entityLabel:`Journey`,endpoint:`${r}/journeys/create`,parentField:`epicId`};case`journey`:return{entityLabel:`Flow`,endpoint:`${r}/flows/create`,parentField:`journeyId`};case`flow`:return{entityLabel:`Moment`,endpoint:`${r}/moments/create`,parentField:`flowId`};default:return}}function Vn(t){let n=X(t.nodeType),r=(Number.parseInt(t.childCount??0,10)||0)+1;switch(n){case`root`:return{statement:`New Promise`,description:``,displayOrder:r};case`promise`:return{statement:`New Epic`,description:``,displayOrder:r};case`epic`:return{statement:`New Journey`,description:``,displayOrder:r};case`journey`:return{statement:`New Flow`,description:``,displayOrder:r};case`flow`:return{statement:`New Moment`,description:``,displayOrder:r};default:return}}async function Hn(t,n){let{headers:r,...i}=n,a=await l(t,{mode:`cors`,...i,headers:{Accept:`application/json`,"Accept-Language":`en-CA`,...r}});if(a.ok)return a.status===204?void 0:a.json();a.status===401&&document.querySelector(`#login-link`)?.click();let o=`HTTP error! status: ${a.status}`;try{let t=await a.json();o=t?.message||t?.title||t?.detail||o}catch{}throw Error(o)}function Un(t,n){let r=document.querySelector(`#${CSS.escape(t)}`);if(r)return r;let i=document.createElement(`div`);return i.innerHTML=n.trim(),r=i.firstElementChild,r&&document.body.append(r),r}function Wn(t){let n=Un(`graph-delete-confirmation-modal`,`
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
    `);if(!n)return Promise.resolve(confirm(`Delete ${t}? This cannot be undone.`));let r=n.querySelector(`#graph-delete-confirmation-modal-title`),i=n.querySelector(`#graph-delete-confirmation-modal-body`),a=n.querySelector(`#graph-delete-confirmation-confirm`);return!r||!i||!a?Promise.resolve(confirm(`Delete ${t}? This cannot be undone.`)):(r.textContent=`Delete ${t}`,i.textContent=`Delete ${t}? This cannot be undone.`,new Promise(t=>{let r=!1,i=n=>{r||(r=!0,t(n))},o=globalThis.bootstrap?.Modal?.getOrCreateInstance(n);a.addEventListener(`click`,()=>{i(!0),o?.hide()},{once:!0}),n.addEventListener(`hidden.bs.modal`,()=>i(!1),{once:!0}),o?.show()}))}function Gn({name:t,label:n,type:r=`text`,value:i=``,placeholder:a=``,rows:o=3}){let s=document.createElement(`label`);s.className=`graph-context-menu-form__field`;let c=document.createElement(`span`);c.className=`graph-context-menu-form__label`,c.textContent=n;let l;return r===`textarea`?(l=document.createElement(`textarea`),l.rows=o):(l=document.createElement(`input`),l.type=r),l.name=t,l.className=`graph-context-menu-form__control`,l.value=i,l.placeholder=a,s.append(c,l),{field:s,input:l}}function Kn({name:t,label:n,value:r=``,options:i=[]}){let a=document.createElement(`label`);a.className=`graph-context-menu-form__field`;let o=document.createElement(`span`);o.className=`graph-context-menu-form__label`,o.textContent=n;let s=document.createElement(`select`);s.name=t,s.className=`graph-context-menu-form__control`;for(let t of i){let n=document.createElement(`option`);n.value=t.value,n.textContent=t.label,n.selected=String(t.value)===String(r),s.append(n)}return a.append(o,s),{field:a,select:s}}function qn(){return[{value:`Story`,label:`Story`},{value:`Job`,label:`Job`}]}function Jn(t){let n=t?.payload??{},r=String(n.status??n.Status??``).trim();if(r){let t=fe.find(t=>t.value.toLowerCase()===r.toLowerCase());if(t)return t.value}let i=String(n.statusColor??n.StatusColor??``).trim().toLowerCase();return i.includes(`green`)||i.includes(`done`)?`Done`:i.includes(`black`)||i.includes(`blocked`)?`Blocked`:i.includes(`orange`)||i.includes(`yellow`)||i.includes(`amber`)||i.includes(`inprogress`)||i.includes(`in-progress`)?`InProgress`:(i.includes(`red`)||i.includes(`todo`),`Todo`)}function Yn(){return[{value:`-`,label:`-`},{value:`XS`,label:`XS`},{value:`S`,label:`S`},{value:`M`,label:`M`},{value:`L`,label:`L`},{value:`XL`,label:`XL`},{value:`XXL`,label:`XXL`},{value:`XXXL`,label:`XXXL`}]}function Xn(t=[]){return[{value:``,label:`Backlog`},...t.map(t=>({value:String(t.id),label:t.name?`Stride #${t.id} - ${t.name}`:`Stride #${t.id}`}))]}function Zn(t,n,r,i,a,o){let s=Bn(t),c=Vn(t);if(!s||!c)return;let l=document.createElement(`form`);l.className=`graph-context-menu-form graph-context-menu-form--moment`;let u=document.createElement(`div`);u.className=`graph-context-menu-form__title`,u.textContent=`Create Moment`;let d=document.createElement(`div`);d.className=`graph-context-menu-form__subtitle`,d.textContent=`Moments carry status, type, estimate, and stride assignment at creation time.`;let f=Gn({name:`statement`,label:`Statement`,value:c.statement,placeholder:`New Moment`}),p=Gn({name:`description`,label:`Description`,type:`textarea`,value:c.description,placeholder:`Optional description`,rows:3}),m=Kn({name:`type`,label:`Type`,value:`Story`,options:qn()}),h=Kn({name:`status`,label:`Status`,value:`Todo`,options:fe.map(t=>({value:t.value,label:`${t.icon} ${t.label}`}))}),g=Kn({name:`effortEstimate`,label:`Effort Estimate`,value:``,options:Yn()}),_=Kn({name:`assignedStrideId`,label:`Assigned Stride`,value:``,options:Xn(i?.()??[])}),v=document.createElement(`div`);v.className=`graph-context-menu-form__actions`;let y=document.createElement(`button`);y.type=`button`,y.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,y.textContent=`Cancel`,y.addEventListener(`click`,t=>{t.preventDefault(),o()});let b=document.createElement(`button`);return b.type=`submit`,b.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,b.textContent=`Create Moment`,v.append(y,b),l.append(u,d,f.field,p.field,m.field,h.field,g.field,_.field,v),R(p.input,t.nodeType,t.payload?.id),l.addEventListener(`submit`,async n=>{if(n.preventDefault(),b.disabled=!0,b.textContent=`Creating Moment...`,!f.input.value.trim()){b.disabled=!1,b.textContent=`Create Moment`,f.input.focus();return}let r={statement:f.input.value.trim(),description:p.input.value.trim()||void 0,flowId:t.payload?.id,type:m.select.value,status:h.select.value,effortEstimate:g.select.value===`-`?void 0:g.select.value||void 0,assignedStrideId:_.select.value?Number.parseInt(_.select.value,10):void 0,displayOrder:(Number.parseInt(t.childCount??0,10)||0)+1};try{await Hn(s.endpoint,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(r)}),o(),await a?.()}catch(t){throw b.disabled=!1,b.textContent=`Create Moment`,t}}),l}function Qn(t,n,r){let i=t?.payload?.sequenceNumber;if(i===null)return;let a=document.createElement(`form`);a.className=`graph-context-menu-form graph-context-menu-form--moment`;let o=document.createElement(`div`);o.className=`graph-context-menu-form__title`,o.textContent=`Change Moment Status`;let s=document.createElement(`div`);s.className=`graph-context-menu-form__subtitle`,s.textContent=`Update the moment status without leaving the graph.`;let c=Kn({name:`status`,label:`Status`,value:Jn(t),options:fe.map(t=>({value:t.value,label:`${t.icon} ${t.label}`}))}),l=document.createElement(`div`);l.className=`graph-context-menu-form__actions`;let u=document.createElement(`button`);u.type=`button`,u.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,u.textContent=`Cancel`,u.addEventListener(`click`,t=>{t.preventDefault(),r()});let d=document.createElement(`button`);return d.type=`submit`,d.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,d.textContent=`Save Status`,l.append(u,d),a.append(o,s,c.field,l),a.addEventListener(`submit`,async t=>{t.preventDefault(),d.disabled=!0,d.textContent=`Saving Status...`;try{await f(Y.owner,Y.project,i,c.select.value),r(),await n?.()}catch(t){throw d.disabled=!1,d.textContent=`Save Status`,t}}),a}function $n(t,n,r,i,a,o){let s=Bn(t),c=Vn(t);if(!s||!c)return;if(s.entityLabel===`Moment`)return Zn(t,n,r,i,a,o);let l=document.createElement(`form`);l.className=`graph-context-menu-form`;let u=document.createElement(`div`);u.className=`graph-context-menu-form__title`,u.textContent=`Create ${s.entityLabel}`;let d=document.createElement(`div`);d.className=`graph-context-menu-form__subtitle`,d.textContent=`Add a new ${s.entityLabel.toLowerCase()} beneath this card.`;let f=Gn({name:`statement`,label:`Statement`,value:c.statement,placeholder:`New ${s.entityLabel}`}),p=Gn({name:`description`,label:`Description`,type:`textarea`,value:c.description,placeholder:`Optional description`,rows:4}),m=document.createElement(`div`);m.className=`graph-context-menu-form__actions`;let h=document.createElement(`button`);h.type=`button`,h.className=`graph-context-menu-form__button graph-context-menu-form__button--secondary`,h.textContent=`Cancel`,h.addEventListener(`click`,t=>{t.preventDefault(),o()});let g=document.createElement(`button`);return g.type=`submit`,g.className=`graph-context-menu-form__button graph-context-menu-form__button--primary`,g.textContent=`Create ${s.entityLabel}`,m.append(h,g),l.append(u,d,f.field,p.field,m),R(p.input,t.nodeType,t.payload?.id),l.addEventListener(`submit`,async n=>{if(n.preventDefault(),g.disabled=!0,g.textContent=`Creating ${s.entityLabel}...`,!f.input.value.trim()){g.disabled=!1,g.textContent=`Create ${s.entityLabel}`,f.input.focus();return}let r=f.input.value.trim(),i=p.input.value.trim(),c=(Number.parseInt(t.childCount??0,10)||0)+1,l={statement:r,description:i||void 0,displayOrder:c};s.parentField===`projectId`||(l[s.parentField]=t.payload?.id);try{await Hn(s.endpoint,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(l)}),o(),await a?.()}catch(t){throw g.disabled=!1,g.textContent=`Create ${s.entityLabel}`,t}}),l}function er(t,n,r,i,a,o,s,c,l,u,d,f){let p=f?.permission===`Edit`,m=[],h=zn(t.nodeType),g=Number.parseInt(t?.childCount??0,10)||0,_=Number.parseInt(t?._hiddenDescendantCount??0,10)||0,v=g>0||_>0,y=v&&!!l?.(t);return h&&m.push({id:`create-child`,label:`Create New ${h}`,danger:!1,disabled:!p,disabledReason:`Requires Edit permission.`,handler:async()=>{s(t,n,r,i)}}),v&&m.push({id:y?`reveal-children`:`hide-children`,label:y?`Reveal Children`:`Hide Children`,danger:!1,handler:async()=>{await u?.(t,!y)}}),y&&_>0&&m.push({id:`reveal-next-level`,label:`Reveal Next Level`,danger:!1,handler:async()=>{await d?.(t)}}),X(t.nodeType)===`moment`&&m.push({id:`change-status`,label:`Change Status`,danger:!1,disabled:!p,disabledReason:`Requires Edit permission.`,handler:async()=>{c(t,i)}}),m.push({id:`delete`,label:`Delete`,danger:!0,disabled:!p,disabledReason:`Requires Edit permission.`,handler:async()=>{let n=Rn(t)||X(t.nodeType)||`item`,r=t.nodeType===`root`?`project`:n;if(o?.(),!await Wn(r))return;if(X(t.nodeType)===`root`){await Hn(Ln(`root`),{method:`DELETE`}),await a?.();return}let s=Ln(t.nodeType,t.payload?.id);if(!s)throw Error(`Unable to determine the delete route for this node.`);await Hn(s,{method:`DELETE`}),await i?.()}}),m}function tr(t){let n=document.createElement(`div`);n.className=`graph-context-menu`;for(let r of t){let t=document.createElement(`button`);t.type=`button`,t.className=`graph-context-menu__item${r.danger?` graph-context-menu__item--danger`:``}`,t.textContent=r.label,r.disabled&&(t.disabled=!0,t.className+=` graph-context-menu__item--disabled`,r.disabledReason&&(t.title=r.disabledReason)),t.addEventListener(`click`,async t=>{t.preventDefault(),t.stopPropagation(),!r.disabled&&await r.handler()}),n.append(t)}return n}function nr({owner:t,project:n,getAvailableStrides:r,onGraphMutated:i,onProjectDeleted:a,isNodeChildrenHidden:o,setNodeChildrenHidden:s,revealNextLevel:c,permission:l}={}){Y.owner=t,Y.project=n,Y.permission=l;let u,d=document.createElement(`div`),f=document.createElement(`div`),p=()=>{let t=document.querySelector(`#graph-viewport`);return t&&document.fullscreenElement===t?t:document.body},m=Fn(document.createElement(`div`),{trigger:`manual`,appendTo:p,content:document.createElement(`div`),allowHTML:!1,interactive:!0,hideOnClick:!0,placement:`right-start`,theme:`graph-menu`,animation:!1,offset:[8,8],onHidden(t){t.setContent(document.createElement(`div`))}}),h=Fn(d,{trigger:`manual`,appendTo:p,content:f,allowHTML:!1,interactive:!0,hideOnClick:!0,placement:`bottom-start`,theme:`graph-menu`,animation:!1,offset:[0,8],getReferenceClientRect:()=>u??new DOMRect(0,0,0,0),onHidden(){f.replaceChildren()}});function g(){m.hide()}function _(){g(),h.hide()}function v(){_()}function y(){m.destroy(),h.destroy(),f.replaceChildren()}function b(t,n,i,a){let o=u??new DOMRect(0,0,0,0),s=new DOMRect(o.right+12,o.top,1,1),c=$n(t,n,i,r,a,_);c&&(m.setProps({getReferenceClientRect:()=>s}),m.setContent(c),m.show())}function x(t,n){let r=u??new DOMRect(0,0,0,0),i=new DOMRect(r.right+12,r.top,1,1),a=Qn(t,n,_);a&&(m.setProps({getReferenceClientRect:()=>i}),m.setContent(a),m.show())}function S(r,l){let d=Number(r?.clientX??0),p=Number(r?.clientY??0);u=new DOMRect(d,p,1,1);let m=er(l,t,n,i,a,_,b,x,o,s,c,Y.permission);f.replaceChildren(tr(m)),h.setProps({getReferenceClientRect:()=>u}),h.show()}return{hide:v,destroy:y,open:S}}var Z={owner:void 0,project:void 0,d3:void 0,rawTree:void 0,filteredTree:void 0,totalRenderableNodes:0,availableStrides:[],filters:pr(),zoomTransform:void 0,userZoomTransform:void 0,focusNodeId:void 0,suppressZoomStateUpdate:!1,zoomBehavior:void 0,filterDebounceId:void 0,applyTimer:void 0,contextMenu:void 0,pageShowRefreshHandler:void 0,collapsedNodeIds:new Set,hasRendered:!1,animationSpeed:.25};function rr(t){return Array.isArray(t?.children)&&t.children.length>0}function ir(t){return!!t&&Z.collapsedNodeIds.has(t)}function ar(t,n){t&&(n?Z.collapsedNodeIds.add(t):Z.collapsedNodeIds.delete(t))}function or(t){return rr(t)?t.children.reduce((t,n)=>t+De(n),0):0}function sr(){if(!Z.rawTree){Z.collapsedNodeIds.clear();return}let t=new Set;for(let n of Z.collapsedNodeIds){let r=Re(Z.rawTree,n);r&&rr(r)&&t.add(n)}Z.collapsedNodeIds=t}function cr(){if(!Z.rawTree)return;let t=new Set,n=Z.rawTree.children??[];for(let r of n)rr(r)&&t.add(r.id);Z.collapsedNodeIds=t}function lr(t){if(!Z.rawTree||!t?.id)return;let n=Re(Z.rawTree,t.id);if(!n)return;ar(n.id,!1);let r=n.children??[];for(let t of r)rr(t)&&ar(t.id,!0)}function ur(){Z.collapsedNodeIds.clear()}function dr(){try{let t=L(new URLSearchParams(location.search).get(`debugGraphFocus`));return[`1`,`true`,`yes`,`on`].includes(t)?!0:globalThis.localStorage?.getItem(`pmo.debugGraphFocus`)===`1`}catch{return!1}}function fr(t,n){dr()&&console.info(`[graph-focus]`,t,n)}function pr(){return{search:``,includeChildren:!1,types:new Set(I),effort:`all`,stride:`all`,status:`all`,assignment:`all`}}function mr(t){if(t===null)return new Set(I);let n=new Set;for(let r of String(t).split(`,`)){let t=L(r);I.includes(t)&&n.add(t)}return hr(n)}function hr(t){let n=[...t??[]].filter(t=>we.has(t));if(n.length===0)return new Set;let r=n.map(t=>we.get(t)),i=Math.min(...r),a=Math.max(...r);return new Set(I.slice(i,a+1))}function gr(t){let n=L(t);return!n||n===`all`?`all`:[`done`,`blocked`,`inprogress`,`todo`,`other`].includes(n)?n:n.includes(`green`)||n.includes(`done`)?`done`:n.includes(`black`)||n.includes(`blocked`)?`blocked`:n.includes(`orange`)||n.includes(`yellow`)||n.includes(`amber`)||n.includes(`inprogress`)||n.includes(`in-progress`)?`inprogress`:n.includes(`red`)||n.includes(`todo`)?`todo`:`other`}function _r(t){return L(t)===`assigned-to-me`?`assigned-to-me`:`all`}function vr(t){let n=L(t);return n===`all`||n===`unestimated`?n:[`xs`,`s`,`m`,`l`,`xl`,`xxl`,`xxxl`].includes(n)?n.toUpperCase():`all`}function yr(t){let n=L(t);return n===`all`||n===`backlog`||/^\d+$/.test(n)?n:`all`}function br(t){switch(t){case`promise`:return`Promise`;case`epic`:return`Epic`;case`journey`:return`Journey`;case`flow`:return`Flow`;case`moment`:return`Moment`;default:return t}}function xr(t){return Ue(`moment`,t,[])}function Sr(t){return Ue(`flow`,t,(t.moments??[]).map(t=>xr(t)))}function Cr(t){return Ue(`journey`,t,(t.flows??[]).map(t=>Sr(t)))}function wr(t){return Ue(`epic`,t,(t.journeys??[]).map(t=>Cr(t)))}function Tr(t){return Ue(`promise`,t,(t.epics??[]).map(t=>wr(t)))}function Er(t,n){if(t.nodeType===`root`||!n.types.has(t.nodeType)||n.search&&!(t._searchText??be(t)).includes(n.search)||n.status!==`all`&&(t._statusBucket??A(t.payload?.statusColor))!==n.status)return!1;if(n.assignment===`assigned-to-me`){if(t.nodeType!==`moment`)return!1;let n=T();if(n===null||t.payload?.ownerId!==n)return!1}if(n.effort!==`all`){if(t.nodeType!==`moment`)return!1;let r=t._effortBucket??Ae(t.payload?.effortEstimate);if(n.effort!==r)return!1}if(n.stride!==`all`){if(t.nodeType!==`moment`)return!1;let r=t._strideBucket??ke(t.payload);if(n.stride!==r)return!1}return!0}function Dr(t,n){t.nodeType!==`root`&&(n.visibleNodes+=1);let r=ir(t.id),i=r?or(t):0;return i>0&&(n.hiddenNodes+=i),{...t,_searchMatched:!1,_isCollapsed:r,_hiddenDescendantCount:i,children:r?[]:(t.children??[]).map(t=>Dr(t,n))}}function Or(t,n,r,i=!1){let a=ir(t.id),o=a?or(t):0,s=!i&&n.search&&(t._searchText??be(t)).includes(n.search);if(s&&n.includeChildren&&!a)return r.directMatches+=1,{...Dr(t,r),_searchMatched:!0};o>0&&(r.hiddenNodes+=o);let c=a?[]:(t.children??[]).map(t=>Or(t,n,r)).filter(Boolean),l=!i&&Er(t,n);if(l&&(r.directMatches+=1),i)return{...t,_searchMatched:!1,_isCollapsed:a,_hiddenDescendantCount:o,children:c};if(l||c.length>0)return r.visibleNodes+=1,{...t,_searchMatched:!!(s&&n.search),_isCollapsed:a,_hiddenDescendantCount:o,children:c}}function kr(){let t=new URLSearchParams(location.search),n=L(t.get(`q`)),r=t.get(`children`)===`1`||t.get(`children`)===`true`,i=gr(t.get(`status`)??``),a=_r(t.get(`assignment`)??``),o=vr(t.get(`effort`)??``),s=yr(t.get(`stride`)??``),c=t.get(`types`);return{search:n,includeChildren:r,status:i,assignment:a,effort:o,stride:s,types:c===null?new Set(I):hr(mr(c))}}function Ar(){let t=new URLSearchParams(location.search);return String(t.get(`focus`)??``).trim()||void 0}function jr(t){let n=new URLSearchParams;t.search&&n.set(`q`,t.search),t.includeChildren&&n.set(`children`,`1`);let r=I.filter(n=>t.types.has(n));r.length>0&&r.length<I.length?n.set(`types`,r.join(`,`)):r.length===0&&n.set(`types`,``),t.status!==`all`&&n.set(`status`,t.status),t.assignment!==`all`&&n.set(`assignment`,t.assignment),t.effort!==`all`&&n.set(`effort`,t.effort),t.stride!==`all`&&n.set(`stride`,t.stride),Z.focusNodeId&&n.set(`focus`,Z.focusNodeId);let i=`${location.pathname}${n.toString()?`?${n.toString()}`:``}${location.hash||``}`;history.replaceState({owner:Z.owner,project:Z.project},``,i)}function Mr(){let t=document.querySelector(`#graph-filter-bar`);if(!t)return;let n=[`<option value="all" ${Z.filters.stride===`all`?`selected`:``}>All strides</option>`,`<option value="backlog" ${Z.filters.stride===`backlog`?`selected`:``}>Backlog</option>`,...Z.availableStrides.map(t=>{let n=t.name?`Stride #${t.id} - ${h(t.name)}`:`Stride #${t.id}`;return`<option value="${String(t.id)}" ${String(Z.filters.stride)===String(t.id)?`selected`:``}>${n}</option>`})].join(``),r=I.map(t=>`
            <label class="graph-filter-chip">
                <input type="checkbox" data-filter-type value="${t}" ${Z.filters.types.has(t)?`checked`:``} />
                <span>${br(t)}</span>
            </label>
        `).join(``);t.innerHTML=`
        <div class="graph-filter-row">
            <div class="graph-filter-search-group">
                <label class="graph-filter-field">
                    <span>Search</span>
                    <input id="graph-filter-search" class="graph-filter-input" type="search" placeholder="Search statements or descriptions" value="${h(Z.filters.search)}" />
                </label>

                <div class="graph-filter-field graph-filter-checkbox-field">
                    <span>Search options</span>
                    <div class="form-check form-switch graph-filter-switch">
                        <input id="graph-filter-include-children" class="form-check-input" type="checkbox" role="switch" ${Z.filters.includeChildren?`checked`:``} />
                        <label class="form-check-label graph-filter-switch-label" for="graph-filter-include-children">Include Children</label>
                    </div>
                </div>
            </div>

            <label class="graph-filter-field">
                <span>Effort estimate</span>
                <select id="graph-filter-effort" class="graph-filter-select">
                    <option value="all" ${Z.filters.effort===`all`?`selected`:``}>All efforts</option>
                    <option value="unestimated" ${Z.filters.effort===`unestimated`?`selected`:``}>Unestimated</option>
                    <option value="XS" ${Z.filters.effort===`XS`?`selected`:``}>XS</option>
                    <option value="S" ${Z.filters.effort===`S`?`selected`:``}>S</option>
                    <option value="M" ${Z.filters.effort===`M`?`selected`:``}>M</option>
                    <option value="L" ${Z.filters.effort===`L`?`selected`:``}>L</option>
                    <option value="XL" ${Z.filters.effort===`XL`?`selected`:``}>XL</option>
                    <option value="XXL" ${Z.filters.effort===`XXL`?`selected`:``}>XXL</option>
                    <option value="XXXL" ${Z.filters.effort===`XXXL`?`selected`:``}>XXXL</option>
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Stride</span>
                <select id="graph-filter-stride" class="graph-filter-select">
                    ${n}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Moment status</span>
                <select id="graph-filter-status" class="graph-filter-select">
                    <option value="all" ${Z.filters.status===`all`?`selected`:``}>All statuses</option>
                    ${fe.map(t=>{let n=t.value.toLowerCase();return`<option value="${n}" ${Z.filters.status===n?`selected`:``}>${t.icon} ${t.label}</option>`}).join(``)}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Assigned to me</span>
                <select id="graph-filter-assignment" class="graph-filter-select">
                    <option value="all" ${Z.filters.assignment===`all`?`selected`:``}>All</option>
                    <option value="assigned-to-me" ${Z.filters.assignment===`assigned-to-me`?`selected`:``}>Assigned to me</option>
                </select>
            </label>
        </div>

        <div class="graph-filter-bottom">
            <fieldset class="graph-filter-types">
                <legend class="graph-filter-group-label">Promise types</legend>
                <div class="graph-filter-chip-list">
                    ${r}
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
    `,Pr()}function Nr(t){let n=document.querySelector(`#graph-loading-state`);n&&(n.hidden=!t,n.classList.toggle(`d-none`,!t),n.setAttribute(`aria-hidden`,t?`false`:`true`))}function Q(t,n,r,i){let a=document.querySelector(`#${CSS.escape(t)}`);a&&a.addEventListener(n,()=>{r(a,Z.filters),(i?$:Lr)()})}function Pr(){Q(`graph-filter-search`,`input`,(t,n)=>{n.search=L(t.value)}),Q(`graph-filter-include-children`,`change`,(t,n)=>{n.includeChildren=t.checked},!0),Q(`graph-filter-effort`,`change`,(t,n)=>{n.effort=vr(t.value)},!0),Q(`graph-filter-stride`,`change`,(t,n)=>{n.stride=yr(t.value)},!0),Q(`graph-filter-status`,`change`,(t,n)=>{n.status=gr(t.value)},!0),Q(`graph-filter-assignment`,`change`,(t,n)=>{n.assignment=_r(t.value)},!0);let t=document.querySelector(`#graph-filter-reset`),n=document.querySelector(`#graph-filter-hide-all`),r=document.querySelector(`#graph-filter-expand-all`),i=document.querySelector(`#graph-filter-refresh`);for(let t of document.querySelectorAll(`[data-filter-type]`))t.addEventListener(`change`,t=>{let n=t.target,r=!!n.checked,i=new Set(Z.filters.types);if(!r&&I.every(t=>i.has(t))){let t=I.indexOf(n.value);if(t!==-1)for(let n=t;n<I.length;n++){let t=I[n],r=document.querySelector(`[data-filter-type][value="${CSS.escape(t)}"]`);r&&(r.checked=!1),i.delete(t)}}else r?i.add(n.value):i.delete(n.value);let a=hr(i);Z.filters.types=a,Ir(),$()});t&&t.addEventListener(`click`,()=>{Z.filters=pr(),ur(),Ir(),$()}),n&&n.addEventListener(`click`,()=>{cr(),$(0)}),r&&r.addEventListener(`click`,()=>{ur(),$(0)}),i&&i.addEventListener(`click`,()=>{Ur()})}var Fr=[[`graph-filter-search`,`value`,`search`],[`graph-filter-include-children`,`checked`,`includeChildren`],[`graph-filter-effort`,`value`,`effort`],[`graph-filter-stride`,`value`,`stride`],[`graph-filter-status`,`value`,`status`],[`graph-filter-assignment`,`value`,`assignment`]];function Ir(){for(let[t,n,r]of Fr){let i=document.querySelector(`#${CSS.escape(t)}`);i&&(i[n]=Z.filters[r])}for(let t of document.querySelectorAll(`[data-filter-type]`))t.checked=Z.filters.types.has(t.value)}function Lr(){Z.filterDebounceId&&clearTimeout(Z.filterDebounceId),Z.filterDebounceId=setTimeout(()=>{Hr()},150)}function $(t=40){Z.applyTimer&&clearTimeout(Z.applyTimer),Z.applyTimer=setTimeout(()=>{delete Z.applyTimer,Hr()},t)}function Rr(t){let n=document.querySelector(`#graph-filter-summary`);if(!n)return;if(!Z.rawTree){n.textContent=`Loading graph...`;return}if(t.visibleNodes===0){n.textContent=`No promises match the current filters.`;return}let r=`${t.visibleNodes} visible promise${t.visibleNodes===1?``:`s`}`,i=`${Z.totalRenderableNodes} total promise${Z.totalRenderableNodes===1?``:`s`}`;if(t.directMatches===t.visibleNodes){n.textContent=`Showing ${r} of ${i}${t.hiddenNodes>0?` (${t.hiddenNodes} hidden)`:``}.`;return}n.textContent=`Showing ${r} of ${i} (${t.directMatches} direct match${t.directMatches===1?``:`es`}${t.hiddenNodes>0?`, ${t.hiddenNodes} hidden`:``}).`}function zr(t){if(!t)return;if(t._searchMatched)return t;let n=t.children??[];for(let t of n){let n=zr(t);if(n)return n}}function Br(t,n,r){if(!t||!n||!r)return;let i=r.select(n);document.querySelector(`#graph-zoom-in`)?.addEventListener(`click`,()=>{i.transition().duration(200).call(t.scaleBy,1.4)}),document.querySelector(`#graph-zoom-out`)?.addEventListener(`click`,()=>{i.transition().duration(200).call(t.scaleBy,.7)}),document.querySelector(`#graph-zoom-reset`)?.addEventListener(`click`,()=>{i.transition().duration(200).call(t.transform,r.zoomIdentity)}),document.querySelector(`#graph-fullscreen-btn`)?.addEventListener(`click`,()=>{let t=document.querySelector(`#graph-viewport`);document.fullscreenElement?document.exitFullscreen?.():t.requestFullscreen?.()})}function Vr(t,n,r,i=void 0,a=void 0,o=!1){let s=document.querySelector(`#graph-content`);if(!s)return;let c=document.querySelector(`#graph-viewport`);Z.contextMenu?.hide?.();let l=document.querySelector(`#graph-animation-speed`);Z.animationSpeed=l&&Number.parseFloat(l.value)||1;let u=Qe(s,n,r,{owner:Z.owner,project:Z.project,focusNodeId:a?.id??void 0,focusNodeData:a,animate:o,animationSpeed:Z.animationSpeed,enableZoom:!0,compact:!1,renderRootCard:!0,restoreTransform:i,viewportElement:c,clipPathIdPrefix:`graph-card-clip`,emptyMessage:`No cards match the current filters.`,onZoom:(t,n={})=>{Z.zoomTransform=t,n.user&&!Z.suppressZoomStateUpdate&&(Z.userZoomTransform=t)},onContextMenu:(t,n)=>{Z.contextMenu?.open?.(t,n)}});u?.zoom&&(Z.zoomBehavior=u.zoom,u.node&&Br(u.zoom,u.node,n))}function Hr(){if(!Z.rawTree||!Z.d3)return;let t={visibleNodes:0,directMatches:0,hiddenNodes:0};Z.filteredTree=Or(Z.rawTree,Z.filters,t,!0);let n=Z.hasRendered;jr(Z.filters);let r=document.querySelector(`#graph-content`);if(Z.filteredTree){let i;i=Z.filters.search?zr(Z.filteredTree):Z.focusNodeId?Re(Z.filteredTree,Z.focusNodeId):Z.userZoomTransform?void 0:Z.filteredTree,fr(`apply-filters-focus-selection`,{requestedFocusNodeId:Z.focusNodeId,selectedFocusNodeId:i?.id??void 0,selectedFocusNodeType:i?.nodeType??void 0,hasUserZoomTransform:!!Z.userZoomTransform,searchFilter:Z.filters.search,includeChildren:Z.filters.includeChildren,visibleNodeCount:t.visibleNodes,directMatches:t.directMatches,hiddenNodeCount:t.hiddenNodes});let a=i?void 0:Z.userZoomTransform??Z.zoomTransform;Vr(r,Z.d3,Z.filteredTree,a,i,n)}else Se(r,`No cards match the current filters.`);Z.hasRendered=!0,Rr(t)}async function Ur(){let t=document.querySelector(`#error-text`),n=document.querySelector(`#success-text`);Nr(!0),t&&(t.textContent=``),n&&(n.textContent=``);try{let t=await qe(Z.owner,Z.project),r={id:t.id??t.Id,name:t.name??t.Name,description:t.description??t.Description},i=(t.promises??t.Promises??[]).map(t=>Tr(t));Z.rawTree=$e(i,Z.owner,Z.project,r),sr(),Z.totalRenderableNodes=De(Z.rawTree),Hr(),n&&(n.textContent=`Loaded ${i.length} top-level promise${i.length===1?``:`s`}.`)}catch(n){console.error(`Error loading project graph:`,n),t&&(t.textContent=`Unable to load the project graph.`)}finally{Nr(!1)}}async function Wr(t,n){let r=await D(t,n);Z.availableStrides=(Array.isArray(r)?[...r]:[]).toSorted((t,n)=>{let r=new Date(t.startDate??0).getTime(),i=new Date(n.startDate??0).getTime();return r===i?Number(t.id)-Number(n.id):r-i})}async function Gr(t,n,r,i){let a=document.querySelector(`#error-text`),o=document.querySelector(`#success-text`);Z.pageShowRefreshHandler&&(window.removeEventListener(`pageshow`,Z.pageShowRefreshHandler),delete Z.pageShowRefreshHandler),Z.owner=t,Z.project=n,Z.d3=globalThis.d3,Z.filters=kr(),Z.focusNodeId=Ar(),delete Z.zoomTransform,delete Z.userZoomTransform,Z.suppressZoomStateUpdate=!1,delete Z.rawTree,delete Z.filteredTree,Z.totalRenderableNodes=0,Z.availableStrides=[],Z.collapsedNodeIds=new Set,Z.hasRendered=!1,Z.contextMenu?.destroy?.(),Z.contextMenu=nr({owner:t,project:n,getAvailableStrides:()=>Z.availableStrides,onGraphMutated:Ur,isNodeChildrenHidden:t=>ir(t?.id),setNodeChildrenHidden:async(t,n)=>{let r=t?.id;r&&(ar(r,n),$(0))},revealNextLevel:async t=>{lr(t),$(0)},onProjectDeleted:()=>{location.assign(`/projects`)},permission:i}),Z.pageShowRefreshHandler=t=>{t.persisted&&Ur()},window.addEventListener(`pageshow`,Z.pageShowRefreshHandler),document.removeEventListener(`fullscreenchange`,Z._onFullscreenChange),Z._onFullscreenChange=()=>{let t=document.querySelector(`#graph-fullscreen-btn`);if(!t)return;let n=t.querySelector(`i`);document.fullscreenElement?(n?.classList.replace(`bi-arrows-angle-expand`,`bi-arrows-angle-contract`),t.setAttribute(`aria-label`,`Exit fullscreen`)):(n?.classList.replace(`bi-arrows-angle-contract`,`bi-arrows-angle-expand`),t.setAttribute(`aria-label`,`Fullscreen`)),Hr()},document.addEventListener(`fullscreenchange`,Z._onFullscreenChange),await Wr(t,n),Mr(),Ir(),a&&(a.textContent=``),o&&(o.textContent=``),Nr(!0),await Ur()}function Kr(t,{showEntity:n=!1}={}){return!t||t.length===0?c({icon:`bi-activity`,title:`No activity recorded yet.`,description:`Changes made to this project will appear here.`}):`
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
                    ${t.map(t=>`
        <tr>
            <td>
                <time class="audit-time" title="${h(Jr(t.occurredAtUtc))}">${h(Yr(t.occurredAtUtc))}</time>
            </td>
            <td>${h(ei(t))}</td>
            <td>${h(ti(t))}</td>
            <td>${h(ni(t))}</td>
            <td>${h(ri(t))}</td>
            <td>
                <a href="#" class="audit-show-details-link" data-audit-details="${h(ai(t))}">show details</a>
            </td>
        </tr>
    `).join(``)}
                </tbody>
            </table>
        </div>
    `}function qr(){return`
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
    `}function Jr(t){if(!t)return`Unknown`;let n=new Date(t);return Number.isNaN(n.getTime())?String(t):n.toLocaleString(void 0,{year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!0})}function Yr(t){if(!t)return`Unknown`;let n=new Date(t);if(Number.isNaN(n.getTime()))return String(t);if(n.getTime()>Date.now())return`just now`;let r=Math.max(0,Math.round((Date.now()-n.getTime())/1e3)),i=r,a=new Intl.RelativeTimeFormat(void 0,{numeric:`auto`});for(let[t,n]of[[`year`,3600*24*365],[`month`,3600*24*30],[`week`,3600*24*7],[`day`,3600*24],[`hour`,3600],[`minute`,60],[`second`,1]])if(i>=n||t===`second`){let i=Math.round(r/n);return a.format(-i,t)}return a.format(0,`second`)}function Xr(t){return`${ti(t)} ${ri(t)}`}function Zr(t){return`
        <dl class="row mb-0">
            <dt class="col-sm-3">Time</dt>
            <dd class="col-sm-9"><time title="${h(Jr(t.occurredAtUtc))}">${h(Jr(t.occurredAtUtc))}</time></dd>
            <dt class="col-sm-3">User</dt>
            <dd class="col-sm-9">${h(ei(t))}</dd>
            <dt class="col-sm-3">Event Type</dt>
            <dd class="col-sm-9">${h(ti(t))}</dd>
            <dt class="col-sm-3">Change</dt>
            <dd class="col-sm-9">${h(ni(t))}</dd>
            <dt class="col-sm-3">Items Affected</dt>
            <dd class="col-sm-9">${h(ri(t))}</dd>
            <dt class="col-sm-3">Details</dt>
            <dd class="col-sm-9">${$r(t.changes)}</dd>
        </dl>
    `}function Qr(t){return{title:Xr(t),html:Zr(t)}}function $r(t){if(!Array.isArray(t)||t.length===0)return`<span class="text-muted">No field details</span>`;let n=t.filter(t=>!ii(t.fieldName));return n.length===0?`<span class="text-muted">No visible field changes</span>`:`<ul class="mb-0 ps-3">${n.map(t=>`
        <li>${h(t.fieldName)}: ${h(oi(t.before))} → ${h(oi(t.after))}</li>
    `).join(``)}</ul>`}function ei(t){return t.actorEmail||t.actorSubject||t.actorUserId||`System`}function ti(t){return t.actionType===`StatusChanged`?`Status Changed`:t.actionType===`Created`?`Created`:t.actionType===`Deleted`?`Deleted`:`Updated`}function ni(t){let n=Array.isArray(t.changes)?t.changes.filter(t=>!ii(t.fieldName)):[];switch(t.actionType){case`StatusChanged`:{let t=n.find(t=>t.fieldName===`Status`);if(t)return`${oi(t.before)} → ${oi(t.after)}`;break}case`Created`:return`Created`;case`Deleted`:return`Deleted`}return n.length===0?`Updated`:n.map(t=>t.fieldName).join(`, `)}function ri(t){return`${t.entityType} #${t.entityId}`}function ii(t){return t.toLowerCase()===`updatedat`}function ai(t){let n=JSON.stringify(Qr(t));return new TextEncoder().encode(n).toBase64()}function oi(t){return t===void 0||t===``?`blank`:typeof t==`object`?JSON.stringify(t):String(t)}var si=25;function ci(t,n,r,i){let a=document.querySelector(`#project-title`),o=document.querySelector(`#error-text`),s=document.querySelector(`#audit-history-list`),c=document.querySelector(`#audit-history-loading`),l=document.querySelector(`#audit-history-pagination`),u=document.querySelector(`#back-to-projects-btn`);if(!a||!o||!s||!c||!l||!u)return;let d=`project-history-audit-modal-container`,f=1,p=0,m=!1,h=0;b();async function g(){try{let t=await Xe(r,i);a.textContent=t?.name?`${t.name} activity`:`Project ${r}/${i} activity`}catch{a.textContent=`Project ${r}/${i} activity`}}function v(){return Math.max(1,Math.ceil(h/si))}function y(){let t=v(),n=f<=1,r=f>=t;l.innerHTML=`
            <nav aria-label="Audit history pages">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item ${n?`disabled`:``}">
                        <button class="page-link" type="button" data-page-action="previous" ${n?`disabled`:``}>Previous</button>
                    </li>
                    <li class="page-item active" aria-current="page">
                        <span class="page-link">Page ${f} of ${t}</span>
                    </li>
                    <li class="page-item ${r?`disabled`:``}">
                        <button class="page-link" type="button" data-page-action="next" ${r?`disabled`:``}>Next</button>
                    </li>
                </ul>
            </nav>
        `;for(let n of l.querySelectorAll(`[data-page-action]`))n.addEventListener(`click`,()=>{let r=n.dataset.pageAction;r===`previous`&&f>1&&(--f,S()),r===`next`&&f<t&&(f+=1,S())})}function b(){let t=document.querySelector(`#${CSS.escape(d)}`);t||(t=document.createElement(`div`),t.id=d,document.body.append(t)),t.innerHTML=qr()}function x(t){let n=Qr(t),r=document.querySelector(`#audit-details-modal-title`),i=document.querySelector(`#audit-details-modal-body`),a=document.querySelector(`#audit-details-modal`);!r||!i||!a||(r.textContent=n.title,i.innerHTML=n.html,typeof bootstrap<`u`&&bootstrap.Modal&&bootstrap.Modal.getOrCreateInstance(a).show())}async function S(t=!1){if(!m){m=!0,o.textContent=``,t&&(f=1,p=0,s.innerHTML=``),c.hidden=!1,s.hidden=!0;try{p=(f-1)*si;let{items:t,totalCount:n}=await He(r,i,si,p);h=n,s.innerHTML=Kr(t,{showEntity:!0}),C(t),y()}catch(n){t?s.innerHTML=`<p class="text-danger mb-0">Failed to load audit history.</p>`:o.textContent=`Failed to load more audit history.`,console.warn(`Failed to load project audit history page:`,n)}finally{m=!1,c.hidden=!0,s.hidden=!1}}}function C(t){let n=s.querySelectorAll(`.audit-show-details-link`),r=0;for(let i of n){let n=r;i.addEventListener(`click`,r=>{r.preventDefault(),x(t[n])}),r++}}(async()=>{await g(),S(!0)})(),u.addEventListener(`click`,()=>{_(`/projects`,t,n)})}async function li(t,n){let r=document.querySelector(`#project-list-table-body`),i=document.querySelector(`#error-text`),a=document.querySelector(`#success-text`);if(!r||!i||!a)return;let o=document.querySelector(`#add-project-link`);o&&o.addEventListener(`click`,r=>{r.preventDefault(),_(`/projects/add`,t,n)}),i.textContent=``,a.textContent=``,r.innerHTML=``;try{let i=await xe();if(!i||i.length===0){r.innerHTML=y({icon:`bi-folder`,title:`There are no projects yet`,description:`Click "Add Project" to create your first project.`,colspan:2,button:{text:`Create your first project`,icon:`bi-plus-circle`,id:`empty-state-add-project-btn`}});let i=document.querySelector(`#empty-state-add-project-btn`);i&&i.addEventListener(`click`,r=>{r.preventDefault(),_(`/projects/add`,t,n)});return}for(let t of i){let n=document.createElement(`tr`);n.innerHTML=`
                <td>${t.name??``}</td>
                <td class="d-flex flex-wrap gap-2">
                    <a href="/${t.ownerSlug}/${t.slug}/strides" class="btn btn-sm btn-outline-primary view-iterations-btn" data-owner-slug="${t.ownerSlug}" data-project-slug="${t.slug}">View Backlog</a>
                    <a href="/${t.ownerSlug}/${t.slug}/graph" class="btn btn-sm btn-outline-secondary graph-btn" data-owner-slug="${t.ownerSlug}" data-project-slug="${t.slug}" title="Open graph view" aria-label="Open graph view">
                        <i class="bi bi-diagram-3" aria-hidden="true"></i>
                    </a>
                    <a href="/${t.ownerSlug}/${t.slug}/settings" class="btn btn-sm btn-outline-secondary settings-btn" data-owner-slug="${t.ownerSlug}" data-project-slug="${t.slug}" title="Open project settings" aria-label="Open project settings">
                        <i class="bi bi-gear" aria-hidden="true"></i>
                    </a>
                    <a href="/${t.ownerSlug}/${t.slug}/share" class="btn btn-sm btn-outline-secondary share-btn" data-owner-slug="${t.ownerSlug}" data-project-slug="${t.slug}" title="Manage sharing permissions" aria-label="Manage sharing permissions">
                        <i class="bi bi-share" aria-hidden="true"></i>
                    </a>
                    <a href="/${t.ownerSlug}/${t.slug}/history" class="btn btn-sm btn-outline-secondary audit-log-btn" data-owner-slug="${t.ownerSlug}" data-project-slug="${t.slug}" title="View project activity" aria-label="View project activity">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </a>
                </td>
            `,r.append(n)}for(let i of r.querySelectorAll(`.view-iterations-btn[data-owner-slug]`))i.addEventListener(`click`,r=>{r.preventDefault();let a=i.dataset.ownerSlug,o=i.dataset.projectSlug;_(`/${a}/${o}/strides`,t,n)});for(let i of r.querySelectorAll(`.graph-btn[data-owner-slug]`))i.addEventListener(`click`,r=>{r.preventDefault();let a=i.dataset.ownerSlug,o=i.dataset.projectSlug;_(`/${a}/${o}/graph`,t,n)});for(let i of r.querySelectorAll(`.settings-btn[data-owner-slug]`))i.addEventListener(`click`,r=>{r.preventDefault();let a=i.dataset.ownerSlug,o=i.dataset.projectSlug;_(`/${a}/${o}/settings`,t,n)});for(let i of r.querySelectorAll(`.share-btn[data-owner-slug]`))i.addEventListener(`click`,r=>{r.preventDefault();let a=i.dataset.ownerSlug,o=i.dataset.projectSlug;_(`/${a}/${o}/share`,t,n)});for(let i of r.querySelectorAll(`.audit-log-btn[data-owner-slug]`))i.addEventListener(`click`,r=>{r.preventDefault();let a=i.dataset.ownerSlug,o=i.dataset.projectSlug;_(`/${a}/${o}/history`,t,n)})}catch(t){t.message.includes(`404`)?i.textContent=`Endpoint not found`:t.message.includes(`500`)?i.textContent=`Internal server error`:i.textContent=`Unknown error`}}function ui(t,n,r,i,a){let o=document.querySelector(`#project-settings-form`),s=document.querySelector(`#project-title-input`),c=document.querySelector(`#project-description-input`),l=document.querySelector(`#project-summary-panel`),u=document.querySelector(`#project-summary-loading`),d=document.querySelector(`#error-text`),f=document.querySelector(`#success-text`),p=document.querySelector(`#export-project-btn`),m=document.querySelector(`#delete-project-btn`),g=document.querySelector(`#delete-project-btn-spinner`),v=document.querySelector(`#delete-project-btn-label`),y=document.querySelector(`#project-delete-confirmation-input`),b=document.querySelector(`#project-delete-confirmation-text`);if(!o||!s||!c||!l||!u||!d||!f||!p||!m||!y||!b)return;let x=document.querySelector(`#save-project-settings-btn`),S=document.querySelector(`#project-title-view`),C=document.querySelector(`#edit-project-title-btn`),w=document.querySelector(`#project-description-view`),T=document.querySelector(`#edit-project-desc-btn`),E,D;s&&S&&C&&(E=W(s,S,C)),c&&w&&T&&(D=W(c,w,T,x));let O,k={counts:{promises:0,epics:0,journeys:0,flows:0,moments:0,totalPromises:0},memberCount:0,firstPromise:void 0},A,j;function M(){d.textContent=``,f.textContent=``}function N(t){u.hidden=!t,l.hidden=t}function ee(){if(typeof bootstrap>`u`||!bootstrap.Popover){f.textContent=`Exported!`,setTimeout(()=>{f.textContent===`Exported!`&&(f.textContent=``)},2e3);return}j||=new bootstrap.Popover(p,{trigger:`manual`,placement:`top`,content:`Exported!`}),j.show(),A&&clearTimeout(A),A=setTimeout(()=>{j?.hide()},2e3)}function te(t){let n=di(t);b.textContent=n,y.value=``,m.disabled=!0,m.dataset.confirmationPhrase=n}function ne(t){m.disabled=t,g.classList.toggle(`d-none`,!t),v.textContent=t?`Deleting Project...`:`Delete Project`}function re(){let t=m.dataset.confirmationPhrase||``;m.disabled=y.value!==t}function ie(t,n,r){Nn(l,[{label:`Created`,value:pi(t.createdAt)},{label:`Team Members`,value:r},{label:`Promises`,value:n.promises},{label:`Epics`,value:n.epics},{label:`Journeys`,value:n.journeys},{label:`Flows`,value:n.flows},{label:`Moments`,value:n.moments},{label:`Total Promises`,value:n.totalPromises}])}async function ae(t){N(!0);try{let t=await qe(r,i),n;try{n=await ue(r,i)}catch{n=[]}let a=(t.promises??[]).flatMap(t=>t.epics??[]),o=a.flatMap(t=>t.journeys??[]),s=o.flatMap(t=>t.flows??[]),c=s.flatMap(t=>t.moments??[]);k={counts:{promises:(t.promises??[]).length,epics:a.length,journeys:o.length,flows:s.length,moments:c.length,totalPromises:(t.promises??[]).length+a.length+o.length+s.length+c.length},memberCount:n.length,firstPromise:(t.promises??[])[0]??void 0},ie(projectObject,k.counts,k.memberCount)}catch(t){k={counts:{promises:0,epics:0,journeys:0,flows:0,moments:0,totalPromises:0},memberCount:0,firstPromise:void 0},ie(projectObject,k.counts,k.memberCount),console.warn(`Failed to load project summary:`,t)}finally{N(!1)}}async function oe(){try{let t=await Xe(r,i);O=t,s.value=t.name??``,c.value=t.description??``,E&&E.showView(h(t.name??``)),D&&D.showView(H(t.description??``)),te(t.name??``),await ae(t),k.firstPromise&&R(c,`Promise`,k.firstPromise.id)}catch(t){d.textContent=`Failed to load project settings.`,console.error(t)}}o.addEventListener(`submit`,async t=>{t.preventDefault(),M();let n=s.value.trim();if(!n){d.textContent=`Project title is required.`;return}let a=c.value.trim();try{let t=await je(r,i,{name:n,description:a||void 0});O=t,s.value=t.name??``,c.value=t.description??``,E&&E.showView(h(t.name??``)),D&&D.showSavedPopover(H(t.description??``)),te(t.name??``),ie(t,k.counts,k.memberCount),f.textContent=`Project settings saved.`}catch(t){d.textContent=t.message||`Failed to save project settings.`}}),y.addEventListener(`input`,re),p.addEventListener(`click`,async()=>{M();try{fi(await Ne(r,i),`project-${r}-${i}-export.json`),ee()}catch(t){d.textContent=t.message||`Failed to export project.`}}),m.addEventListener(`click`,async()=>{if(M(),!O){d.textContent=`Project is not loaded yet.`;return}if(y.value!==m.dataset.confirmationPhrase){d.textContent=`Type the exact confirmation phrase to delete the project.`;return}ne(!0);try{await Ke(r,i),_(`/projects`,t,n)}catch(t){d.textContent=t.message||`Failed to delete project.`}finally{ne(!1)}}),oe()}function di(t){return`delete ${t}`}function fi(t,n){let r=URL.createObjectURL(t),i=document.createElement(`a`);i.href=r,i.download=n,document.body.append(i),i.click(),i.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e3)}function pi(t){return Jr(t)}function mi(t,n){let r=document.querySelector(`#${CSS.escape(t)}`);if(r)return r;let i=document.createElement(`div`);return i.innerHTML=n.trim(),r=i.firstElementChild,r&&document.body.append(r),r}function hi(){return mi(`revoke-modal`,`
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
    `)}function gi(t,n,r,i){let a=document.querySelector(`#error-text`),o=document.querySelector(`#loading-text`),s=document.querySelector(`#success-text`),c=document.querySelector(`#permissions-section`),l={items:[],highlightedIndex:-1,open:!1};function u(){let t=document.querySelector(`#invite-autocomplete`);t&&(t.style.display=`none`,t.innerHTML=``),l={items:[],highlightedIndex:-1,open:!1}}function d(){let t=document.querySelector(`#invite-autocomplete`);if(t){t.innerHTML=``;for(let n=0;n<l.items.length;n++){let r=l.items[n],i=document.createElement(`div`);i.className=`comment-autocomplete__item`+(n===l.highlightedIndex?` comment-autocomplete__item--highlight`:``),i.role=`option`,i.ariaSelected=String(n===l.highlightedIndex),i.textContent=r.name+` (`+r.email+`)`,i.dataset.index=String(n),i.addEventListener(`mousedown`,t=>{t.preventDefault(),f(parseInt(i.dataset.index,10))}),t.append(i)}if(l.items.length>0){let n=t.children[l.highlightedIndex];n&&n.scrollIntoView({block:`nearest`})}}}function f(t){let n=l.items[t];if(!n)return;let r=document.querySelector(`#invite-email`);r&&(r.value=n.email),u(),r?.focus()}async function p(t){if(t.length===0){u();return}let n;try{n=await ze(t)}catch{u();return}if(n&&n.length>0){l.items=n,l.highlightedIndex=0,l.open=!0;let t=document.querySelector(`#invite-autocomplete`);t&&(t.style.display=`block`),d()}else u()}function m(){let t=document.querySelector(`#invite-email`),n=document.querySelector(`#invite-autocomplete`);if(!t||!n)return;let r;t.addEventListener(`input`,()=>{r&&clearTimeout(r);let n=t.value.trim();if(!n){u();return}r=setTimeout(function(){p(n)},200)}),t.addEventListener(`keydown`,t=>{if(!(!l.open||l.items.length===0))switch(t.key){case`ArrowDown`:e.preventDefault(),l.highlightedIndex=(l.highlightedIndex+1)%l.items.length,d();break;case`ArrowUp`:e.preventDefault(),l.highlightedIndex=(l.highlightedIndex-1+l.items.length)%l.items.length,d();break;case`Enter`:e.preventDefault(),l.highlightedIndex>=0&&f(l.highlightedIndex);break;case`Tab`:l.highlightedIndex>=0?f(l.highlightedIndex):u();break;case`Escape`:e.preventDefault(),u();break}}),t.addEventListener(`blur`,()=>{setTimeout(function(){document.activeElement!==n&&!n.contains(document.activeElement)&&u()},150)})}function g(r){let i=mi(`invite-modal`,`
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
        `),a=i?.querySelector(`#invite-modal-form`),o=i?.querySelector(`#invite-email`),c=i?.querySelector(`#invite-level`),l=i?.querySelector(`#invite-modal-error`),d=i?.querySelector(`#invite-modal-submit`);if(!a||!o||!c||!l||!d)return;a.replaceWith(a.cloneNode(!0));let f=i.querySelector(`#invite-modal-form`),p=i.querySelector(`#invite-email`),h=i.querySelector(`#invite-level`),g=i.querySelector(`#invite-modal-error`),_=i.querySelector(`#invite-modal-submit`);p.value=``,h.value=`View`,g.textContent=``,g.classList.add(`d-none`),_.disabled=!1,_.textContent=`Send Invitation`,u(),m(),f.addEventListener(`submit`,async a=>{a.preventDefault();let o=p.value.trim();if(!o)return;let c=h.value;_.disabled=!0,_.textContent=`Sending...`,g.classList.add(`d-none`);try{await Oe(t,n,{email:o,level:c}),globalThis.bootstrap?.Modal?.getOrCreateInstance(i)?.hide(),s&&(s.textContent=`Invitation sent.`,s.classList.remove(`d-none`)),await r.onInvited?.()}catch(t){g.textContent=t?.message||`Failed to invite user.`,g.classList.remove(`d-none`)}finally{_.disabled=!1,_.textContent=`Send Invitation`}}),globalThis.bootstrap?.Modal?.getOrCreateInstance(i)?.show()}async function _(){try{let r=i?.isOwner===!0,l=await Le(t,n);o&&o.classList.add(`d-none`),a&&a.classList.add(`d-none`),s&&s.classList.add(`d-none`);let u=l&&l.length>0?l.map(t=>`
                    <tr data-permission-id="${t.id}">
                        <td>${h(t.userName)}</td>
                        <td>${t.level}</td>
                        <td>${t.status}</td>
                        <td>${r?`<button class="btn btn-outline-danger btn-sm revoke-btn" data-permission-id="${t.id}">Revoke</button>`:`-`}</td>
                    </tr>`).join(``):y({icon:`bi-share`,title:`No permissions configured`,description:r?`Invite a user to get started.`:``,colspan:4,button:r?{text:`Invite`,icon:`bi-plus-circle`,id:`empty-state-invite-btn`}:void 0});c&&(c.innerHTML=`
                <div class="d-flex justify-content-between align-items-center">
                    <h2>Current Permissions</h2>
                    ${r?`<button id="invite-btn-top" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Invite</button>`:``}
                </div>
                <table class="table table-striped table-sm promisemodel-table">
                    <thead><tr><th>User</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${u}</tbody>
                </table>
                ${r?``:`<p class="text-muted mt-4">Only the project owner can manage permissions.</p>`}`);for(let t of document.querySelectorAll(`.revoke-btn`))v(t);document.querySelector(`#invite-btn-top`)?.addEventListener(`click`,()=>{g({owner:t,project:n,onInvited:_})}),document.querySelector(`#empty-state-invite-btn`)?.addEventListener(`click`,()=>{g({owner:t,project:n,onInvited:_})})}catch{o&&o.classList.add(`d-none`),a&&(a.textContent=`Failed to load permissions.`,a.classList.remove(`d-none`))}}function v(r){!r||r.dataset.bound===`1`||(r.dataset.bound=`1`,r.addEventListener(`click`,async()=>{let i=parseInt(r.dataset.permissionId,10);if(!Number.isFinite(i))return;let o=hi(),c=o.querySelector(`#revoke-modal-confirm`);if(!c)return;let l=c.cloneNode(!0);c.parentElement.replaceChild(l,c),l.addEventListener(`click`,async()=>{l.disabled=!0;try{await We(t,n,i),globalThis.bootstrap?.Modal?.getOrCreateInstance(o)?.hide();let r=window.scrollY;btn.closest(`tr`)?.remove(),s&&(s.textContent=`Permission revoked.`,s.classList.remove(`d-none`)),window.scrollTo(0,r)}catch(t){a&&(a.textContent=`Failed to revoke permission.`,a.classList.remove(`d-none`)),console.error(t)}finally{l.disabled=!1}},{once:!0}),globalThis.bootstrap?.Modal?.getOrCreateInstance(o)?.show()}))}_()}async function _i(t,n,r){switch(t){case`/projects`:try{await p(`projects/list.html`,r),li(n,r)}catch{m(r,`project list`)()}break;case`/projects/add`:try{await p(`projects/add.html`,r),Pn(n,r)}catch{m(r,`add project form`)()}break;default:S(r)}}async function vi(t,n,r,i,a){G.set({owner:t,project:n,permission:void 0,isOwner:!1});let o=r.replace(/^\/+/,``).replace(/\/+$/,``),s=o?o.split(`/`):[];if(s.length===0){try{let r=await U(t,n);G.set({permission:r.permission,isOwner:r.isOwner}),Mn(t,n,i,a,r)}catch{}return}let c=s[0],l=s[1];switch(!0){case c===`strides`:try{let r=await U(t,n);G.set({permission:r.permission,isOwner:r.isOwner}),Mn(t,n,i,a,r)}catch{}break;case c===`graph`:try{let[,r]=await Promise.all([p(`projects/graph.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),Gr(t,n,a,r)}catch{m(a,`graph page`)()}break;case c===`settings`:try{let[,r]=await Promise.all([p(`projects/settings.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),ui(i,a,t,n,r)}catch{m(a,`project settings`)()}break;case c===`share`:try{let[,r]=await Promise.all([p(`projects/share.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),gi(t,n,a,r)}catch{m(a,`share page`)()}break;case c===`history`:try{await p(`projects/history.html`,a),ci(i,a,t,n)}catch{m(a,`project activity`)()}break;case c===`iterations`:try{let[,r]=await Promise.all([p(`iterations/list.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),(await C(()=>import(`./list.js`),__vite__mapDeps([0,1,2]))).loadIterationHistory(t,n,r)}catch{m(a,`iterations`)()}break;case c===`promises`&&!!l:try{let[,r]=await Promise.all([p(`promises/detail.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),jt(t,n,l,i,a,r)}catch{m(a,`promise`)()}break;case c===`epics`&&!!l:try{let[,r]=await Promise.all([p(`epics/detail.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),wt(t,n,l,i,a,r)}catch{m(a,`epic`)()}break;case c===`journeys`&&!!l:try{let[,r]=await Promise.all([p(`journeys/detail.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),Et(t,n,l,i,a,r)}catch{m(a,`journey`)()}break;case c===`flows`&&!!l:try{let[,r]=await Promise.all([p(`flows/detail.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),Tt(t,n,l,i,a,r)}catch{m(a,`flow`)()}break;case c===`moments`&&!!l:try{let[,r]=await Promise.all([p(`moments/detail.html`,a),U(t,n)]);G.set({permission:r.permission,isOwner:r.isOwner}),Dt(t,n,l,i,a,r)}catch{m(a,`moment`)()}break;default:S(a)}}export{_i as handleLegacyProjectRoutes,vi as handleProjectScopedRoutes};