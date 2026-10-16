// 실적 탭: 목록·카드·입력 양식, DOI 자동 채우기
function intlAuto(pid){
  return itemsOf(pid).filter(i=>(i.cat==='paper'||i.cat==='ip')&&i.f.intl==='예').map(i=>{const f=i.f;
    const out=i.cat==='paper'?[f.title,f.journal&&(f.journal+(f.ym?' ('+f.ym+')':'')),f.vol,f.pages,f.doi&&('DOI '+f.doi)].filter(Boolean).join('. ')
      :[f.kind,f.title,f.country,f.number].filter(Boolean).join(' · ');
    return {src:i.cat==='paper'?'논문':'특허 등',output:out,partner:f.partner||'',inst:f.pinst||'',year:String(i.cat==='paper'?f.ym||'':f.date||'').slice(0,4)}})}
function catPanel(p,c,mode){
  let it=itemsOf(p.id,c.key).slice().sort((a,b)=>dkey(b)-dkey(a));
  if(mode!=='prof'&&S.filterFix) it=it.filter(i=>i.rv.s!=='ok');
  const canEdit=mode!=='rev', editingNew=S.editing==='new', done=(p.done||{})[c.key];
  return `<div class="panel">
    <div class="head"><div><h2>${c.name}</h2><span class="msg">신청서 ${esc(c.table)}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${mode!=='prof'?`<label class="btn sm" style="cursor:pointer"><input type="checkbox" id="flt" ${S.filterFix?'checked':''} style="width:auto"> 미확인만</label>`:''}
        ${c.key==='grant'?`<a class="btn" href="forms/share-confirmation.docx" download="연구비_지분확인서_양식.docx">지분확인서 양식 내려받기</a>`:''}
        ${canEdit&&!editingNew?`<button class="btn primary" data-act="add">+ 추가</button>`:''}
      </div></div>
    <div class="rule">${c.rule}<br>${PRIVACY_NOTE}</div>
    ${EX[c.key]&&mode!=='rev'?`<details class="ex" ${it.length?'':'open'}><summary>작성 예시 보기 (${EX[c.key].length}가지 · 참고용이라 수정할 수 없어요)</summary>${exHTML(c)}</details>`:''}
    ${c.key==='collab'?(()=>{const A=intlAuto(p.id);return `<div class="items" style="margin-bottom:12px">${A.length?A.map(a=>`<div class="item"><div><div class="t">${esc(a.output)}</div><div class="meta">${[a.src+'에서 자동',a.partner||'국외 공동연구자 미입력',a.inst||'기관 미입력',a.year].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`).join(''):'<div class="empty">논문·특허 탭에서 국제 = 예로 표시된 항목이 아직 없어요.</div>'}</div>`})():''}
    ${editingNew?formHTML(c,{}):''}
    <div class="items">${it.length?(()=>{const one=i=>S.editing===i.id?formHTML(c,i.f,i.id):itemHTML(i,c,mode);
      if(c.key!=='roster') return it.map(one).join('');
      return [...DEGREE_GROUPS.map(g=>g[0]),'기타'].map(g=>{const a=it.filter(i=>degGroup(i.f.degree)===g);return a.length?`<div class="grp">${g} <span class="count">${a.length}</span></div>${a.map(one).join('')}`:''}).join('')})():`<div class="empty">아직 입력된 ${c.name} 실적이 없습니다.${canEdit?' <b>+ 추가</b>로 넣어 주세요.':''}</div>`}</div>
    <div class="foot">
      <span class="msg">${it.length}건 · ${done?'<span class="chip ok">확인 완료</span>':'<span class="chip">확인 전</span>'}</span>
      ${mode!=='rev'?`<button class="btn ${done?'':'accent'}" data-act="done">${done?'확인 완료 취소':'이 항목 확인 완료'}</button>`:''}
    </div></div>${qPanel(p,c.key,mode)}`;
}

const degGroup=d=>(DEGREE_GROUPS.find(g=>g[1].includes(d))||['기타'])[0];
function exHTML(c){return EX[c.key].map(f=>{
  const meta=c.meta(f).filter(Boolean).map(m=>`<span>${esc(m)}</span>`).join('');
  const chips=(c.chips(f)||[]).filter(x=>x&&x[0]!=='fix');
  return `<div class="item ex"><div style="min-width:0"><div class="t">${esc(c.title(f))}</div><div class="meta">${meta}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip rep">예시 · 가상 자료</span>${chips.map(x=>`<span class="chip ${x[0]}">${esc(x[1])}</span>`).join('')}</div></div></div>`}).join('')}
S.expanded=new Set();
function detailHTML(i,c){ // 입력한 모든 칸을 라벨과 함께 (빈 칸은 —)
  const val=(fd,v)=>{if(fd.t==='multi')return (v||[]).join(', ');if(fd.t==='years')return Object.keys(v||{}).filter(y=>v[y]).sort().map(y=>y+': '+(Number(v[y])||v[y]).toLocaleString()).join(' · ');
    if(fd.t==='number'&&v!==''&&v!=null&&!isNaN(v))return Number(v).toLocaleString();return v==null?'':String(v)};
  return `<dl class="detail">${c.fields.map(fd=>{const v=val(fd,i.f[fd.k]);return `<dt>${esc(fd.l)}</dt><dd class="${v?'':'none'}">${v?esc(v):'—'}</dd>`}).join('')}</dl>`;
}
function itemHTML(i,c,mode){
  const chips=(c.chips(i.f)||[]).filter(Boolean);
  if(i.pre) chips.unshift(['pre','1차조사']);
  const rv=i.rv.s==='ok'?['ok','검토 확인']:i.rv.s==='fix'?['fix','수정 요청']:['','검토 전'];
  const meta=c.meta(i.f).filter(Boolean).map(m=>`<span class="${/^DOI/.test(m)?'mono':''}">${esc(m)}</span>`).join('');
  const open=S.expanded.has(i.id);
  return `<div class="item ${i.rv.s==='fix'?'fix':''}">
    <div style="min-width:0"><div class="t"><button class="tbtn" data-expand="${i.id}" aria-expanded="${open}"><span class="caret" aria-hidden="true"></span>${esc(c.title(i.f)||'(제목 없음)')}</button></div>
      <div class="meta">${meta}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip ${rv[0]}">${rv[1]}</span>${chips.map(x=>`<span class="chip ${x[0]}">${esc(x[1])}</span>`).join('')}</div></div>
    <div class="acts">${mode!=='rev'?`${i.cat==='grant'&&(i.f.grole==='공동연구원'||i.f.knu==='아니오')?`<button class="btn sm" data-shareform="${i.id}">지분확인서</button>`:''}${S.data.uploadUrl?`<button class="btn sm" data-attach="${i.id}" title="민감한 개인정보는 가리고 올려 주세요">증빙 첨부</button>`:''}<button class="btn sm" data-edit="${i.id}">수정</button><button class="btn ghost sm" data-del="${i.id}">삭제</button>`:''}</div>
    ${open?detailHTML(i,c):''}
    ${(i.files||[]).length?`<div class="files"><span>증빙</span>${i.files.map(x=>`<span><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.n)}</a>${mode!=='rev'?`<button class="btn ghost sm" data-unfile="${i.id}" data-fid="${esc(x.id)}" aria-label="${esc(x.n)} 연결 해제">×</button>`:''}</span>`).join('')}</div>`:''}
    ${i.f.note?`<div class="note" style="color:var(--ink)"><b>비고</b> ${esc(i.f.note)}</div>`:''}
    ${i.memo?`<div class="note" style="color:var(--mute)">참고${i.pre&&i.cat==='paper'?' (중간평가 1차조사, 2025년 기준)':''}: ${esc(i.memo)}${i.cat==='paper'?` · JCR 상위 ${i.f.jcr?esc(i.f.jcr)+'%':'% 미입력'}`:''}</div>`:''}
    ${i.rv.s==='fix'&&mode==='prof'?`<div class="note">담당 교수 의견: ${esc(i.rv.c)}</div>`:''}
    ${mode!=='prof'?`<div class="review"><button class="btn sm ok" data-rv="ok" data-id="${i.id}">확인</button><input id="c-${i.id}" placeholder="수정 요청 내용" value="${esc(i.rv.s==='fix'?i.rv.c:'')}"><button class="btn sm warn" data-rv="fix" data-id="${i.id}">수정 요청</button></div>`:''}
  </div>`;
}

function fieldHTML(fd,v,rec){
  const id='f-'+fd.k, req=fd.req?' <span class="req">*</span>':'';
  const lab=`<span>${esc(fd.l)}${req}</span>`;
  if(fd.t==='doi') return `<label class="full">${lab}<div class="row"><input id="${id}" name="${fd.k}" value="${esc(v)}" placeholder="예: 10.xxxx/xxxxx" spellcheck="false"><button class="btn" type="button" data-act="doi">자동 채우기</button></div><span class="help" id="doi-msg">DOI를 넣고 누르면 제목·학술지·게재연월·권호·쪽·저자 수가 채워집니다.</span></label>`;
  if(fd.t==='select'){const L=fd.of?fd.of(rec||{}):FIELD_OPTS[fd.o];return `<label class="${fd.full?'full':''}">${lab}<select id="${id}" name="${fd.k}"><option value="">선택</option>${v&&!L.includes(v)?`<option selected>${esc(v)}</option>`:''}${(()=>{const op=o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`;return OPT_GROUPS[fd.o]?OPT_GROUPS[fd.o].map(([g,os])=>`<optgroup label="${g}">${os.map(op).join('')}</optgroup>`).join(''):L.map(op).join('')})()}</select></label>`}
  if(fd.t==='yn') return `<label class="${fd.full?'full':''}">${lab}<select id="${id}" name="${fd.k}"><option value="">선택</option>${['예','아니오'].map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select></label>`;
  if(fd.t==='area'){const n=(v||'').replace(/\s/g,'').length;return `<label class="full">${lab}<textarea id="${id}" name="${fd.k}" data-max="${fd.max}">${esc(v)}</textarea><span class="ctr ${n>fd.max?'over':''}" data-ctr="${fd.k}">${n} / ${fd.max}자 (공백 제외)</span></label>`}
  if(fd.t==='multi'){const cur=v||[];return `<div class="full" style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;color:var(--mute);font-weight:500">${lab}</span><div class="checks" id="${id}">${FIELD_OPTS[fd.o].map(o=>`<label><input type="checkbox" name="${fd.k}" value="${esc(o)}" ${cur.includes(o)?'checked':''}> ${esc(o)}</label>`).join('')}</div></div>`}
  if(fd.t==='student'&&fd.multi){const cur=(v||'').split(', ').filter(Boolean),names=[...new Set([...itemsOf(curPid(),'roster').map(i=>i.f.name),...cur])];return `<div class="full" style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;color:var(--mute);font-weight:500">${lab}</span><div class="checks" id="${id}">${names.map(n=>`<label><input type="checkbox" name="${fd.k}" value="${esc(n)}" ${cur.includes(n)?'checked':''}> ${esc(n)}</label>`).join('')}</div><span class="help">${names.length?'지도학생 및 연구원 명단에서 고릅니다. 공동 주저자면 모두 체크해 주세요':'지도학생 및 연구원 명단 탭에 먼저 학생을 넣어 주세요'}</span></div>`}
  if(fd.t==='student'){const names=itemsOf(curPid(),'roster').map(i=>i.f.name);return `<label class="${fd.full?'full':''}">${lab}<select id="${id}" name="${fd.k}"><option value="">${fd.req?'선택':'없음'}</option>${names.map(n=>`<option ${n===v?'selected':''}>${esc(n)}</option>`).join('')}</select><span class="help">${names.length?'지도학생 및 연구원 명단에서 고릅니다':'지도학생 및 연구원 명단 탭에 먼저 학생을 넣어 주세요'}</span></label>`}
  if(fd.t==='years'){const cur=v||{};return `<div class="full" style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;color:var(--mute);font-weight:500">${lab}</span><div class="years" data-years="${fd.k}">${yearBoxes(fd.k,rec||{},cur)}</div><span class="help">시작일·종료일 기간 중 올해까지의 연도 칸이 나와요. 해가 바뀌면 칸이 늘어나요</span></div>`}
  const type=fd.t==='date'?'date':fd.t==='number'?'number':'text';
  return `<label class="${fd.full?'full':''}">${lab}<input id="${id}" name="${fd.k}" type="${type}" value="${esc(v)}" placeholder="${fd.ph?'예: '+esc(fd.ph):''}">${fd.help?`<span class="help">${esc(fd.help)}</span>`:''}</label>`;
}
function topPick(c){
  if(c.key!=='top') return '';
  const src=itemsOf(curPid()).filter(i=>i.cat==='paper'||i.cat==='ip').sort((a,b)=>(b.f.rep==='예')-(a.f.rep==='예')||String(b.f.ym||b.f.date||'').localeCompare(String(a.f.ym||a.f.date||'')));
  if(!src.length) return '';
  return `<label class="full"><span>다른 실적에서 불러오기</span><select id="top-pick"><option value="">논문·특허 등에서 고르기 (대표 후보로 표시한 것이 위에 있어요)</option>${src.map(i=>`<option value="${i.id}">${i.f.rep==='예'?'[후보] ':''}[${i.cat==='paper'?'논문':esc(i.f.kind||'특허 등')}] ${esc(String(i.f.ym||i.f.date||'').slice(0,7)+' '+String(i.f.title||'').slice(0,80))}</option>`).join('')}</select><span class="help">고르면 종류·연도·업적이 채워지고, 써 둔 우수성이 있으면 설명 칸에 옮겨져요.</span></label>`;
}
function formHTML(c,f,id){
  const it=id&&isAdmin()&&S.data.items.find(x=>x.id===id); // 관리자만 기초자료 '참고'를 고칠 수 있음
  return `<form class="edit" data-cat="${c.key}" data-id="${id||''}" novalidate>${aiBoxHTML()}${topPick(c)}${c.fields.map(fd=>fieldHTML(fd,f[fd.k],f)).join('')}${it&&it.memo?`<label class="full"><span>참고 (기초자료 · 관리자만 수정)</span><input name="__memo" value="${esc(it.memo)}"><span class="help">틀린 기초자료면 고치거나 지워 주세요</span></label>`:''}<div class="bar"><span class="msg err" id="form-err"></span><button type="button" class="btn" data-act="cancel">취소</button><button class="btn primary" type="submit">저장</button></div></form>`}

async function doiFill(){
  const inp=$('#f-doi'), msg=$('#doi-msg'); const doi=inp.value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//,'').replace(/^doi:\s*/i,'');
  if(!doi){msg.textContent='DOI를 먼저 넣어 주세요.';msg.className='help msg err';return}
  const set=(k,v)=>{const el=document.querySelector(`form.edit [name="${k}"]`);if(el&&v)el.value=v};
  msg.textContent='조회 중…';msg.className='help';
  try{
    const r=await fetch('https://api.crossref.org/works/'+encodeURIComponent(doi));if(!r.ok)throw 0;
    const m=(await r.json()).message;const dp=(m.issued&&m.issued['date-parts']&&m.issued['date-parts'][0])||[];
    inp.value=doi;set('title',(m.title||[])[0]);set('journal',(m['container-title']||[])[0]);set('ym',dp[0]?dp[0]+'.'+String(dp[1]||1).padStart(2,'0'):'');
    set('vol',m.volume?(m.volume+(m.issue?'('+m.issue+')':'')):'');set('pages',m.page||m['article-number']||'');set('nauth',m.author?String(m.author.length):'');
    let extra='';
    try{const ym=dp[0]?dp[0]+'.'+(dp[1]||''):'', py=pubJcrYear(ym), base=Number(S.data.jcrBase)||0, iss=m.ISSN||[], jn=(m['container-title']||[])[0];
      const j=await jcrExact(iss,jn,py), c=base?await jcrExact(iss,jn,base):null;
      set('if',j&&j.if!=null?String(j.if):'');set('jcr',j&&j.pct!=null?String(j.pct):'');set('if_cur',c&&c.if!=null?String(c.if):'');set('jcr_cur',c&&c.pct!=null?String(c.pct):'');
      if(S.data.jcrYears.length) extra=(j?` 출판 당시 = ${py} JCR.`:` ${py} JCR에 이 저널이 없어 출판 당시 IF는 직접 넣어 주세요.`)+(base?(c?` 기준 = ${base} JCR.`:''):'');}catch(_){}
    msg.textContent='채웠어요. 저자 역할을 골라 주세요.'+extra;
  }catch(_){msg.textContent='자동 조회가 안 됐어요. DOI를 확인하거나 직접 입력해 주세요.';msg.className='help msg err'}
}
