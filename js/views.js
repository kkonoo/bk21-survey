// 화면 그리기: 탭·메뉴, 교수 안내 화면, 담당 교수 목록
/* ===== 렌더 ===== */
function render(){
  if(!S.role) return;
  const seg=$('#seg');
  const labels={prof:'내 실적',rev:'담당 교수 검토',admin:'관리자',recap:'학과 결산',board:'건의사항'};
  const roles=(isAdmin()?Array.from(new Set([...S.roles.filter(r=>r!=='admin'),'rev'])):S.roles).concat(S.data.recap?['recap']:[],['board'],isAdmin()?['admin']:[]);
  seg.hidden=roles.length<2;
  seg.innerHTML=roles.map(r=>`<button data-role="${r}" aria-pressed="${r===S.role}">${labels[r]}</button>`).join('');
  const who=$('#who');
  let sel='';
  if(S.role==='rev'&&isAdmin()) sel=`<select id="me-rev" aria-label="담당 교수 선택"><option value="">담당 교수 선택</option>${S.data.reviewers.map(r=>`<option value="${r.id}" ${r.id===S.me.rev?'selected':''}>${esc(r.name)}</option>`).join('')}</select>`;
  who.innerHTML=`${sel}<span>${esc(S.name)}</span><button class="btn round" data-act="refresh" aria-label="새로고침" title="새로고침">↻</button><button class="btn round" data-act="theme" aria-label="${curTheme()==='dark'?'라이트 모드로 바꾸기':'다크 모드로 바꾸기'}" title="${curTheme()==='dark'?'라이트 모드':'다크 모드'}">${curTheme()==='dark'?'☀️':'🌙'}</button>`;
  const app=$('#app');
  if(S.busy){app.innerHTML='<div class="empty">불러오는 중…</div>';return}
  if(S.role==='recap'){app.innerHTML=recapView();return}
  if(S.role==='board'){app.innerHTML=boardView();return}
  if(S.role==='prof'){ if(!prof(S.me.prof)){app.innerHTML='<div class="empty">교수 정보를 찾지 못했어요. BK 사무국에 알려 주세요.</div>';return} app.innerHTML=profView(S.me.prof,'prof'); }
  else if(S.role==='rev') app.innerHTML=S.open?backBar()+profView(S.open,'rev'):revHome();
  else app.innerHTML=S.open?backBar()+profView(S.open,'admin'):adminHome();
}
const curTheme=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
const backBar=()=>`<button class="btn ghost back" data-act="back">← 목록으로</button>`;

function navHTML(p,mode){
  const done=p.done||{};
  return `<nav class="cats" aria-label="입력 항목">
    <button data-cat="home" aria-current="${S.cat==='home'}"><span class="dot ${CATS.every(c=>done[c.key])?'done':''}"></span><span>${mode==='prof'?'안내':'요약'}</span><span></span></button>
    ${CATS.map(c=>{const it=itemsOf(p.id,c.key);const fx=it.some(i=>i.rv.s==='fix');
      return `<button data-cat="${c.key}" aria-current="${S.cat===c.key}"><span class="dot ${fx?'fix':done[c.key]?'done':''}"></span><span>${c.name}</span><span class="count">${it.length}</span></button>`}).join('')}
    ${mode!=='rev'?`<button data-cat="hex" class="promo-nav" aria-current="${S.cat==='hex'}"><span></span><span>실적 육각형</span><span></span></button>`:''}
    ${promoOK(p,mode)?`<button data-cat="promo" class="promo-nav" aria-current="${S.cat==='promo'}"><span></span><span>승진 실적 (참고)</span><span></span></button>`:''}
  </nav>`;
}
function profView(pid,mode){const p=prof(pid);if(!p)return '<div class="empty">교수 정보를 불러오지 못했어요.</div>';return `<div class="layout">${navHTML(p,mode)}<section>${S.cat==='home'||(S.cat==='promo'&&!promoOK(p,mode))||(S.cat==='hex'&&mode==='rev')?homePanel(p,mode):S.cat==='promo'?promoPanel(p):S.cat==='hex'?hexPanel(p):catPanel(p,CAT[S.cat],mode)}</section></div>`}

function homePanel(p,mode){
  const st=stats(p), fixes=itemsOf(p.id).filter(i=>i.rv.s==='fix');
  const intro=mode==='prof'
    ? `<h2>${esc(p.name)} 교수님, 실적 확인을 부탁드립니다</h2>
       <p class="msg">5단계 BK21 신청 준비를 위한 조사입니다. <span class="due">마감 ${esc(S.data.deadline)}</span></p>
       <ol class="steps"><li>맨 위 <b>지도학생 및 연구원 명단</b>에 졸업생·박사후연구원을 먼저 추가해 주세요. 논문의 학생 주저자를 이 명단에서 고릅니다.</li>
       <li>왼쪽 항목을 하나씩 열어 <b>미리 채워진 실적</b>을 확인하고 틀린 것을 고쳐 주세요.</li>
       <li>빠진 실적은 <b>+ 추가</b>로 넣어 주세요. 논문은 DOI만 넣으면 자동으로 채워집니다.</li>
       <li>항목마다 아래의 <b>이 항목 확인 완료</b>를 눌러 주세요. 해당 실적이 없어도 눌러 주시면 됩니다.</li></ol>
       <p class="msg">입력한 내용은 바로 저장됩니다. 여러 번 나눠서 하셔도 돼요.</p>`
    : `<h2>${esc(p.name)} 교수 · 검토 요약</h2><p class="msg">왼쪽에서 항목을 열어 건별로 확인하거나 수정 요청을 남기세요.</p>`;
  const ro=mode==='rev'?'disabled':'';
  return `<div class="welcome">
    <div class="panel">${intro}</div>
    <div class="panel"><dl class="kv">
      <dt>구분</dt><dd>${mode!=='rev'?`<select data-pf="type" aria-label="기초/임상" style="max-width:100px">${['기초','임상'].map(t=>`<option ${t===p.type?'selected':''}>${t}</option>`).join('')}</select>`:esc(p.type)}${mode!=='rev'?` · <select data-pf="rank" aria-label="직급" style="max-width:200px"><option value="">직급 선택</option>${RANKS.map(r=>`<option ${r===p.rank?'selected':''}>${r}</option>`).join('')}</select>`:p.rank?' · '+esc(p.rank):''}</dd>
      <dt><label for="rid">연구자등록번호</label></dt><dd>${mode!=='rev'?`<input id="rid" class="mono" inputmode="numeric" value="${esc(p.rid||'')}" data-pf="rid" placeholder="8자리 숫자" style="max-width:180px">`:`<span class="mono">${esc(p.rid||'—')}</span>`}</dd>
      <dt><label for="hired">국내 최초 임용일</label></dt><dd><input id="hired" type="date" value="${esc(p.hired||'')}" data-pf="hired" style="max-width:180px" ${ro}>${(p.hired&&p.hired>='2017-03')||(!p.hired&&p.newflag)?' <span class="chip pre">신임</span>':''}</dd>
      <dt>지도학생</dt><dd>${itemsOf(p.id,'roster').filter(i=>['재학','수료'].includes(i.f.status)&&!NONGRAD.includes(i.f.degree)).length}명 (재학·수료 대학원생)</dd>
      <dt>담당 교수</dt><dd>${p.rev&&revName(p.rev)===p.name?'본인':esc(revName(p.rev))}</dd>
      <dt>확인 완료</dt><dd>${st.done} / ${CATS.length} 항목</dd>
    </dl><div class="prog" style="margin-top:12px"><i style="width:${st.done/CATS.length*100}%"></i></div>
    ${mode==='prof'?`<p class="msg" style="margin-top:10px">직급과 연구자등록번호는 위에서 직접 고칠 수 있어요.</p>`:''}</div>
  </div>
  <div class="panel"><div class="head"><h2 style="font-size:17px">수정 요청 ${fixes.length}건</h2></div>
    ${fixes.length?`<div class="items">${fixes.map(i=>`<div class="item fix"><div><div class="t">${esc(CAT[i.cat].title(i.f))}</div><div class="meta"><span>${CAT[i.cat].name}</span></div></div><div class="acts"><button class="btn sm" data-goto="${i.cat}">열기</button></div><div class="note">의견: ${esc(i.rv.c)}</div></div>`).join('')}</div>`
      :`<div class="empty">수정 요청이 없습니다.</div>`}
  </div>${qPanel(p,'home',mode)}`;
}

function revHome(){
  if(!S.me.rev) return '<div class="empty">위에서 담당 교수를 고르세요.</div>';
  const mine=S.data.profs.filter(p=>p.rev===S.me.rev);
  return `<div class="head"><h2>담당 교수님 ${mine.length}분</h2><span class="due">마감 ${esc(S.data.deadline)}</span></div>
  <div class="cards">${mine.map(p=>{const st=stats(p);return `<button class="pcard" data-open="${p.id}">
    <span class="n">${esc(p.name)} <span class="msg">${esc(p.type)}${p.rank?' · '+esc(p.rank):''}</span></span>
    <div class="prog"><i style="width:${st.done/CATS.length*100}%"></i></div>
    <span class="msg">확인 완료 ${st.done}/${CATS.length} · 실적 ${st.n}건 · 최근 수정 ${esc(p.updated||'—')}</span>
    <span class="s"><span class="chip ok">검토 확인 ${st.ok}</span>${st.fix?`<span class="chip fix">수정 요청 ${st.fix}</span>`:''}<span class="chip">검토 전 ${st.n-st.ok-st.fix}</span>${st.qw?`<span class="chip rep">답변 대기 ${st.qw}</span>`:''}</span>
  </button>`}).join('')||'<div class="empty">담당 교수님이 없어요.</div>'}</div>`;
}
