// SciVal (Elsevier API): 교수별 Scopus Author ID로 논문 수·FWCI·피인용·h-index, 논문별 FWCI (DOI로) 불러오기 (관리자)
/* ===== SciVal ===== */
// 키는 관리자 브라우저에만 저장. 학교 구독은 교내 IP로 인정되므로 교내 네트워크에서만 불러올 수 있다
const SV_KEY='bk21-scival-key', EL='https://api.elsevier.com', SV_API=EL+'/analytics/scival/author/metrics';
const svKey=()=>{try{return localStorage.getItem(SV_KEY)||''}catch(e){return ''}};
const setSvKey=k=>{try{k?localStorage.setItem(SV_KEY,k):localStorage.removeItem(SV_KEY)}catch(e){}};
const SV_YR=[['5yrs','최근 5년 (올해 제외)'],['5yrsAndCurrent','최근 5년 + 올해']];
S.svYr='5yrs';
const svOf=p=>p.sv&&p.scopus&&String(p.sv.id)===String(p.scopus)?p.sv:null; // ID를 바꾼 뒤 다시 불러오기 전의 값은 쓰지 않음
const svNum=v=>v==null?'—':v;
const svText=v=>`${v.y0}–${v.y1} 논문 ${svNum(v.so)} · FWCI ${svNum(v.fwci)} · 피인용 ${svNum(v.cit)} · h-index ${svNum(v.h)}`;
function svPanel(){
  const P=S.data.profs, got=P.filter(p=>p.sv), papers=S.data.items.filter(i=>i.cat==='paper'&&doiNorm(i.f.doi));
  return `<div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">SciVal (FWCI · 교수 지표)</h2></div>
    <p class="msg"><b>교내 네트워크</b>에서만 돼요. <b>논문 FWCI 채우기</b>는 입력된 논문의 DOI로 SciVal FWCI를 찾아 논문마다 넣어요 (논문 카드·엑셀·참여 교수 시뮬레이션에 나옴). DOI 있는 논문 ${papers.length}편 중 FWCI 있음 <b>${papers.filter(i=>i.f.fwci).length}</b>편</p>
    <p class="msg"><b>교수 지표 불러오기</b>는 교수님마다 넣은 <b>Scopus Author ID</b>로 SciVal의 논문 수·FWCI·피인용 수·h-index를 교수 정보에 저장해요 (관리자의 교수 요약에만 보임). ID는 <b>Scopus ID 찾기</b>(입력된 논문의 저자 목록에서 찾음), 교수님 안내 화면, 아래 일괄 입력으로 넣어요. ID 있는 교수 <b>${P.filter(p=>p.scopus).length}</b> / ${P.length}명 · 불러온 교수 <b>${P.filter(svOf).length}</b>명</p>
    <div class="export"><input type="password" id="sv-key" value="${esc(svKey())}" placeholder="Elsevier API 키" autocomplete="off" spellcheck="false" style="max-width:300px" aria-label="Elsevier API 키">
      <select id="sv-yr" aria-label="SciVal 기간">${SV_YR.map(([v,l])=>`<option value="${v}" ${v===S.svYr?'selected':''}>${l}</option>`).join('')}</select>
      <button class="btn primary" data-act="svpaper">논문 FWCI 채우기</button><button class="btn" data-act="svfind">Scopus ID 찾기</button><button class="btn" data-act="svfetch">교수 지표 불러오기</button><span class="msg" id="sv-msg"></span></div>
    <p class="msg">API 키는 이 브라우저에만 저장돼요.</p>${S.svFind?svFindHTML():''}
    <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Scopus Author ID 일괄 입력</summary>
      <p class="msg">한 줄에 한 분씩 <b>이름 ID</b>로 적고 적용을 누르세요. 엑셀의 두 칸을 그대로 붙여 넣어도 돼요. 적힌 교수님만 바뀌어요.</p>
      <textarea id="sv-ids" placeholder="홍길동 57211941553&#10;김철수 57000000000" style="min-height:120px"></textarea>
      <div class="export"><button class="btn" data-act="svids">적용</button><span class="msg" id="sv-idmsg"></span></div></details>
    ${got.length?`<details class="fold" style="margin-top:14px" ${fold('sv')}><summary><span class="caret" aria-hidden="true"></span>불러온 값 (${got.length}명) · SciVal 이름이 교수님과 같은지 확인해 주세요</summary>
      <div class="tablebox"><table><thead><tr><th>교수</th><th>Scopus ID</th><th>SciVal 이름</th><th>기간</th><th class="num">논문</th><th class="num">FWCI</th><th class="num">피인용</th><th class="num">h-index</th><th>불러온 날</th></tr></thead><tbody>
      ${got.map(p=>`<tr><td>${esc(p.name)}</td><td class="mono">${esc(p.scopus||'')}${svOf(p)?'':' <span class="chip fix">ID 바뀜, 다시 불러오기</span>'}</td><td>${esc(p.sv.name)}</td><td>${p.sv.y0}–${p.sv.y1}</td>
        <td class="num">${svNum(p.sv.so)}</td><td class="num">${svNum(p.sv.fwci)}</td><td class="num">${svNum(p.sv.cit)}</td><td class="num">${svNum(p.sv.h)}</td><td>${esc(p.sv.at)}</td></tr>`).join('')}</tbody></table></div></details>`:''}
  </div>`;
}
const doiNorm=v=>String(v||'').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//,'').replace(/^doi:\s*/,'');
// Elsevier API 한 번 부르기: 성공하면 {d}, 실패하면 {status,err}
async function svJSON(url,params){
  const q=new URLSearchParams(Object.assign({},params,{apiKey:svKey(),httpAccept:'application/json'}));
  let r,t; try{r=await fetch(url+'?'+q);t=await r.text()}catch(e){return {status:0,err:'연결하지 못했어요'}}
  let d=null; try{d=JSON.parse(t)}catch(e){}
  if(!r.ok||!d) return {status:r.status,err:(d&&d['service-error']&&d['service-error'].status&&d['service-error'].status.statusText)||t.slice(0,150)};
  return {d};
}
// 묶음으로 묻고, 400(잘못된 값 하나 때문에 묶음 전체 실패)이면 하나씩 다시. 키·연결 오류면 멈춤
async function svBatch(list,size,ask,label){
  const out=[];
  for(let k=0;k<list.length;k+=size){$('#sv-msg').textContent=`${label} ${k} / ${list.length}`;
    const b=list.slice(k,k+size), r=await ask(b);
    if(!r.err){out.push(r.d);continue}
    if(r.status!==400) throw new Error(r.err);
    for(const x of b){const s=await ask([x]);if(!s.err)out.push(s.d)}
  }
  return out;
}
const svFail=e=>{$('#sv-msg').textContent=`불러오지 못했어요 (${e.message}). 교내 네트워크인지, 키가 맞는지 확인해 주세요.`};
async function svFetch(){
  const msg=$('#sv-msg'), P=S.data.profs.filter(p=>/^\d{6,}$/.test(p.scopus||''));
  if(!svKey()){toast('Elsevier API 키를 넣어 주세요');$('#sv-key').focus();return}
  if(!P.length){msg.textContent='Scopus Author ID가 들어간 교수가 없어요.';return}
  const ids=[...new Set(P.map(p=>p.scopus))], got={}; let D;
  try{D=await svBatch(ids,25,b=>svJSON(SV_API,{metricTypes:'ScholarlyOutput,FieldWeightedCitationImpact,CitationCount,HIndices',authors:b.join(','),yearRange:S.svYr,includeSelfCitations:'true',byYear:'false',
    includedDocs:'AllPublicationTypes',journalImpactType:'CiteScore',showAsFieldWeighted:'false',indexType:'hIndex'}),'불러오는 중…')}catch(e){svFail(e);return}
  D.forEach(d=>(d.results||[]).forEach(x=>{const m=Object.fromEntries((x.metrics||[]).map(v=>[v.metricType,v.value]));
    got[String(x.author.id)]={name:x.author.name||'',so:m.ScholarlyOutput??null,fwci:m.FieldWeightedCitationImpact??null,cit:m.CitationCount??null,h:m.HIndices??null}}));
  const src=(D[0]||{}).dataSource||{}, at=new Date().getFullYear()+'.'+today();
  const ups=P.filter(p=>got[p.scopus]).map(p=>[p,Object.assign({id:p.scopus,y0:src.metricStartYear||'',y1:src.metricEndYear||'',at},got[p.scopus])]);
  try{for(let a=0;a<ups.length;a+=400){const w=db.batch();ups.slice(a,a+400).forEach(([p,sv])=>w.update(db.doc('profs/'+p.id),{sv}));await w.commit()}
    ups.forEach(([p,sv])=>p.sv=sv)}catch(e){fail(e);return}
  render(); const names=P.filter(p=>!got[p.scopus]).map(p=>p.name);
  $('#sv-msg').textContent=`${ups.length}명 저장했어요.`+(names.length?` 찾지 못한 ID: ${names.join(', ')}`:'');
}
// DOI → Scopus 번호 (Scopus 검색, 20개씩). 괄호·빈칸이 있는 DOI는 {정확히}로
const svQ=d=>/[()\s]/.test(d)?`DOI({${d}})`:`DOI(${d})`;
async function svSids(dois){
  const sid={};
  (await svBatch(dois,20,b=>svJSON(EL+'/content/search/scopus',{query:b.map(svQ).join(' OR '),count:'25',field:'dc:identifier,prism:doi'}),'논문 찾는 중…'))
    .forEach(d=>((d['search-results']||{}).entry||[]).forEach(e=>{const k=doiNorm(e['prism:doi']),id=String(e['dc:identifier']||'').split(':')[1];if(k&&id)sid[k]=id}));
  return sid;
}
// 논문별 FWCI: DOI → Scopus 번호 (Scopus 검색) → FWCI (SciVal). SciVal은 출판 연도 칸에만 값을 준다 (기간 밖 논문은 값 없음)
async function svPaperFill(){
  const msg=$('#sv-msg'); if(!svKey()){toast('Elsevier API 키를 넣어 주세요');$('#sv-key').focus();return}
  const todo=S.data.items.filter(i=>i.cat==='paper'&&doiNorm(i.f.doi)); if(!todo.length){msg.textContent='DOI가 있는 논문이 없어요.';return}
  const dois=[...new Set(todo.map(i=>doiNorm(i.f.doi)))], byId={}; let sid;
  try{
    sid=await svSids(dois);
    (await svBatch([...new Set(Object.values(sid))],25,b=>svJSON(EL+'/analytics/scival/publication/metrics',{publicationIds:b.join(','),metricTypes:'FieldWeightedCitationImpact'}),'FWCI 받는 중…'))
      .forEach(d=>(d.results||[]).forEach(x=>{const v=((x.metrics||[])[0]||{}).valueByYear||{}, val=v[x.publication.publicationYear]??Object.values(v).find(y=>y!=null);if(val!=null)byId[String(x.publication.id)]=val}));
  }catch(e){svFail(e);return}
  const fw=d=>sid[d]&&byId[sid[d]]!=null?String(byId[sid[d]]):null, nf=dois.filter(d=>!sid[d]).length, nv=dois.filter(d=>sid[d]&&fw(d)===null).length;
  const ups=todo.filter(i=>{const v=fw(doiNorm(i.f.doi));return v!==null&&v!==(i.f.fwci||'')}).map(i=>[i,Object.assign({},i.f,{fwci:fw(doiNorm(i.f.doi))})]);
  const note=`Scopus에서 못 찾은 DOI ${nf}개 · 찾았지만 FWCI가 없는 논문 ${nv}개 (SciVal 기간 밖, 예: 올해 논문)`;
  if(!ups.length){msg.textContent='바뀌는 논문이 없어요. '+note;return}
  if(!confirm(`논문 ${ups.length}건에 FWCI를 넣을까요? (이미 있던 값은 새 값으로 바뀌어요)\n${note}`)){msg.textContent='';return}
  try{for(let a=0;a<ups.length;a+=400){const w=db.batch();ups.slice(a,a+400).forEach(([i,f])=>w.update(db.doc('items/'+i.id),{f}));await w.commit()}
    ups.forEach(([i,f])=>i.f=f)}catch(e){fail(e);return}
  render(); $('#sv-msg').textContent=`논문 ${ups.length}건에 FWCI를 넣었어요. `+note;
}
async function svIds(){
  const msg=$('#sv-idmsg'), ups=[], miss=[], bad=[];
  $('#sv-ids').value.split('\n').map(x=>x.trim()).filter(Boolean).forEach(l=>{const m=l.match(/^(.*?)[\s,:：]+(\d{6,})$/);if(!m){bad.push(l);return}
    const n=m[1].trim(), p=S.data.profs.find(x=>x.name===n); if(!p){miss.push(n);return} if(p.scopus!==m[2])ups.push([p,m[2]])});
  const note=(miss.length?` 명단에 없는 이름: ${miss.join(', ')}.`:'')+(bad.length?` 읽지 못한 줄 ${bad.length}줄.`:'');
  if(!ups.length){msg.textContent='바뀌는 ID가 없어요.'+note;return}
  if(!confirm(`${ups.length}명의 Scopus Author ID를 넣을까요?`+(miss.length?`\n명단에 없는 이름(건너뜀): ${miss.join(', ')}`:''))) return;
  try{const b=db.batch();ups.forEach(([p,id])=>b.update(db.doc('profs/'+p.id),{scopus:id}));await b.commit();ups.forEach(([p,id])=>p.scopus=id);
    render(); const m2=$('#sv-idmsg'); m2.closest('details').open=true; m2.textContent=`${ups.length}명 넣었어요.`+note;
  }catch(e){fail(e)}
}

// Scopus Author ID 찾기: 교수마다 최근 논문(DOI) 6편의 저자 목록(SciVal)에서 가장 많은 논문에 함께 있는 저자 ID.
// 다른 교수의 ID로 확실한 저자(같이 논문을 자주 쓰는 교수)는 후보에서 뺀다. 결과는 표로 보여 주고 관리자가 골라 넣는다
S.svFind=null;
async function svFindIds(){
  if(!svKey()){toast('Elsevier API 키를 넣어 주세요');$('#sv-key').focus();return}
  const pick={}, au={}; S.data.profs.forEach(p=>{pick[p.id]=[...new Set(itemsOf(p.id,'paper').sort((a,b)=>dkey(b)-dkey(a)).map(i=>doiNorm(i.f.doi)).filter(Boolean))].slice(0,6)});
  let sid;
  try{sid=await svSids([...new Set(Object.values(pick).flat())]);
    const ids=[...new Set(Object.values(sid))];
    for(let k=0;k<ids.length;k+=5){$('#sv-msg').textContent=`저자 확인 중… ${k} / ${ids.length}`;
      await Promise.all(ids.slice(k,k+5).map(async id=>{const r=await svJSON(EL+'/analytics/scival/publication/'+id,{});
        if(r.err){if(r.status!==400&&r.status!==404)throw new Error(r.err);return}
        au[id]=((r.d.publication||{}).authors||[]).map(a=>({id:String(a.id),name:a.name||''}))}))}
  }catch(e){svFail(e);return}
  const R=S.data.profs.map(p=>{const A=pick[p.id].map(d=>au[sid[d]]).filter(Boolean), cnt={}, nm={};
    A.forEach(a=>{a.forEach(x=>nm[x.id]=x.name);new Set(a.map(x=>x.id)).forEach(id=>cnt[id]=(cnt[id]||0)+1)});
    return {p,n:pick[p.id].length,m:A.length,c:Object.entries(cnt).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).map(([id,c])=>({id,c,name:nm[id]}))}});
  const sure=r=>r.c.length>0&&r.c[0].c>=Math.max(2,Math.ceil(r.m/2))&&(r.c.length===1||r.c[0].c>r.c[1].c);
  const taken=new Map(); R.forEach(r=>{if(sure(r))taken.set(r.c[0].id,r.p.id)});
  R.forEach(r=>{r.c=r.c.filter(x=>!taken.has(x.id)||taken.get(x.id)===r.p.id);r.ok=sure(r);r.c=r.ok?r.c.slice(0,1):r.c.filter(x=>x.c===(r.c[0]||{}).c).slice(0,4)});
  const ord=r=>!r.ok&&r.c.length?0:r.ok&&r.p.scopus&&r.p.scopus!==r.c[0].id?1:r.ok&&!r.p.scopus?2:!r.ok?3:4;
  S.svFind=R.sort((a,b)=>ord(a)-ord(b)||a.p.name.localeCompare(b.p.name,'ko'));
  render(); $('#sv-msg').textContent=`찾았어요: 확실 ${R.filter(r=>r.ok).length}명 · 골라야 함 ${R.filter(r=>!r.ok&&r.c.length).length}명 · 못 찾음 ${R.filter(r=>!r.ok&&!r.c.length).length}명. 아래 표에서 확인해 주세요.`;
}
function svFindHTML(){
  const row=r=>{const cur=r.p.scopus||'', x=r.c[0]; let pk, who='';
    if(r.ok&&x.id===cur) pk='<span class="chip ok">지금 ID와 같음</span>';
    else if(r.ok){pk=`<label><input type="checkbox" class="sv-pick" data-pid="${r.p.id}" value="${x.id}" ${cur?'':'checked'} style="width:auto"> <span class="mono">${x.id}</span></label>${cur?' <span class="chip fix">지금 ID와 다름</span>':''}`;who=esc(x.name)}
    else if(r.c.length){pk=`<select class="sv-pick" data-pid="${r.p.id}" style="width:auto" aria-label="${esc(r.p.name)} Scopus ID"><option value="">고르지 않음</option>${r.c.map(y=>`<option value="${y.id}">${y.id} · ${esc(y.name)}</option>`).join('')}</select>`;who='<span class="chip fix">이름 보고 골라 주세요</span>'}
    else pk=`<span class="msg">${!r.n?'DOI 있는 논문 없음':!r.m?'Scopus에서 논문을 못 찾음':'공통 저자 없음 (논문 '+r.m+'편)'}</span>`;
    return `<tr><td>${esc(r.p.name)}</td><td class="mono">${esc(cur||'—')}</td><td>${pk}</td><td>${who}</td><td class="num">${x?`${x.c}/${r.m}편`:'—'}</td></tr>`};
  return `<div style="margin-top:14px"><div class="tablebox"><table><thead><tr><th>교수</th><th>지금 ID</th><th>찾은 ID</th><th>Scopus 이름</th><th class="num">근거 (함께 있는 논문)</th></tr></thead><tbody>${S.svFind.map(row).join('')}</tbody></table></div>
    <div class="export"><button class="btn primary" data-act="svfindsave">고른 ID 넣기</button><button class="btn ghost" data-act="svfindclose">닫기</button>
      <span class="msg">Scopus 이름(성, 이름 첫 글자)이 교수님과 맞는지 보고 넣어 주세요. 이미 ID가 있는 교수는 '지금 ID와 다름'일 때만 골라서 바꿔요.</span></div></div>`;
}
async function svFindSave(){
  const ups=[...document.querySelectorAll('.sv-pick')].filter(e=>e.type==='checkbox'?e.checked:e.value).map(e=>[prof(e.dataset.pid),e.value]).filter(([p,id])=>p&&p.scopus!==id);
  if(!ups.length){toast('고른 ID가 없어요');return}
  if(!confirm(`${ups.length}명의 Scopus Author ID를 넣을까요?`)) return;
  try{const b=db.batch();ups.forEach(([p,id])=>b.update(db.doc('profs/'+p.id),{scopus:id}));await b.commit();ups.forEach(([p,id])=>p.scopus=id);
    S.svFind=null; render(); $('#sv-msg').textContent=`${ups.length}명 넣었어요. '교수 지표 불러오기'를 누르면 SciVal 값이 들어와요.`;
  }catch(e){fail(e)}
}
