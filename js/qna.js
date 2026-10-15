// 질문·답변
/* ===== 질문·답변 (교수·학생이 묻고, 담당 교수·관리자가 답함) ===== */
const ms=t=>t&&t.toMillis?t.toMillis():t instanceof Date?t.getTime():0;
const dstr=t=>{const d=t&&t.toDate?t.toDate():t instanceof Date?t:null;return d?d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0'):''};
const qsOf=(pid,cat)=>S.data.qna.filter(q=>q.prof===pid&&(!cat||q.cat===cat)).sort((a,b)=>(!!a.a-!!b.a)||ms(b.at)-ms(a.at)); // 답변 대기 먼저, 최근 순
function qHTML(q,mode,showCat,showProf){
  return `<div class="item ${q.a?'':'ask'}"><div style="min-width:0">
    <div class="t" style="white-space:pre-wrap">Q. ${esc(q.q)}</div>
    <div class="meta">${[showProf&&prof(q.prof)&&prof(q.prof).name+' 교수',showCat&&(q.cat==='home'?'일반':(CAT[q.cat]||{}).name),q.by,dstr(q.at)].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}${q.a?'':'<span class="chip rep">답변 대기</span>'}</div>
    ${q.a?`<div class="ans">A. ${esc(q.a)} <span class="msg">— ${esc([q.aby,dstr(q.aat)].filter(Boolean).join(' · '))}</span></div>`:''}</div>
    <div class="acts">${showProf?`<button class="btn sm" data-openq="${q.prof}" data-qcat="${q.cat}">열기</button>`:showCat&&CAT[q.cat]?`<button class="btn sm" data-goto="${q.cat}">열기</button>`:''}${mode!=='rev'?`<button class="btn ghost sm" data-delq="${q.id}">삭제</button>`:''}</div>
    ${mode!=='prof'?`<div class="review"><input id="a-${q.id}" placeholder="답변" value="${esc(q.a||'')}"><button class="btn sm ok" data-ans="${q.id}">${q.a?'답변 고치기':'답변 달기'}</button></div>`:''}
  </div>`;
}
function adminQPanel(){ // 관리자 화면: 모든 교수님의 질문 (답변 대기 먼저, 답변한 것은 접어 둠)
  const all=S.data.qna.slice().sort((a,b)=>(!!a.a-!!b.a)||ms(b.at)-ms(a.at)), wait=all.filter(q=>!q.a), done=all.filter(q=>q.a);
  if(!all.length) return '';
  return `<div class="panel" style="margin-top:18px"><details class="fold" ${fold('qna')}><summary><span class="caret" aria-hidden="true"></span><span class="ttl">질문·답변</span>${wait.length?` <span class="chip rep">답변 대기 ${wait.length}</span>`:''}<span class="msg" style="margin-left:auto">모든 교수님의 질문을 모았어요. 여기서 바로 답변할 수 있어요.</span></summary>
    <div style="margin-top:14px"></div>
    ${wait.length?`<div class="items">${wait.map(q=>qHTML(q,'admin',true,true)).join('')}</div>`:'<div class="empty">답변을 기다리는 질문이 없어요.</div>'}
    ${done.length?`<details style="margin-top:12px" ${fold('qnadone')}><summary style="cursor:pointer;font-weight:600">답변한 질문 ${done.length}건</summary><div class="items" style="margin-top:10px">${done.map(q=>qHTML(q,'admin',true,true)).join('')}</div></details>`:''}
  </details></div>`;
}
function qPanel(p,cat,mode){ // cat==='home': 안내 화면 — 이 교수님의 질문을 모두 모아 보여주고, 항목과 상관없는 질문을 받는다
  const qs=qsOf(p.id,cat==='home'?null:cat), wait=qs.filter(q=>!q.a).length;
  if(mode!=='prof'&&!qs.length) return '';
  return `<div class="panel" style="margin-top:16px"><div class="head"><h2 style="font-size:17px">${cat==='home'?'질문·답변 '+qs.length+'건':'이 항목 질문'}${wait?` <span class="chip rep">답변 대기 ${wait}</span>`:''}</h2></div>
    ${mode==='prof'?`<textarea id="q-new" placeholder="${cat==='home'?'입력하다가 애매하거나 모르겠는 점을 적어 주세요.':'이 항목을 입력하다가 애매하거나 모르겠는 점을 적어 주세요.'} 담당 교수님이나 BK 사무국이 답해 드려요." style="min-height:64px"></textarea>
      <div class="export" style="margin-top:8px"><button class="btn" data-ask="${cat}">질문 남기기</button></div>`:''}
    ${qs.length?`<div class="items" style="margin-top:12px">${qs.map(q=>qHTML(q,mode,cat==='home')).join('')}</div>`:''}
  </div>`;
}
