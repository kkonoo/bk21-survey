// SciVal (Elsevier API): 교수별 Scopus Author ID로 논문 수·FWCI·피인용·h-index 불러오기 (관리자)
/* ===== SciVal ===== */
// 키는 관리자 브라우저에만 저장. 학교 구독은 교내 IP로 인정되므로 교내 네트워크에서만 불러올 수 있다
const SV_KEY='bk21-scival-key', SV_API='https://api.elsevier.com/analytics/scival/author/metrics';
const svKey=()=>{try{return localStorage.getItem(SV_KEY)||''}catch(e){return ''}};
const setSvKey=k=>{try{k?localStorage.setItem(SV_KEY,k):localStorage.removeItem(SV_KEY)}catch(e){}};
const SV_YR=[['5yrs','최근 5년 (올해 제외)'],['5yrsAndCurrent','최근 5년 + 올해']];
S.svYr='5yrs';
const svOf=p=>p.sv&&p.scopus&&String(p.sv.id)===String(p.scopus)?p.sv:null; // ID를 바꾼 뒤 다시 불러오기 전의 값은 쓰지 않음
const svNum=v=>v==null?'—':v;
const svText=v=>`${v.y0}–${v.y1} 논문 ${svNum(v.so)} · FWCI ${svNum(v.fwci)} · 피인용 ${svNum(v.cit)} · h-index ${svNum(v.h)}`;
function svPanel(){
  const P=S.data.profs, got=P.filter(p=>p.sv);
  return `<div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">SciVal (FWCI · 교수 지표)</h2></div>
    <p class="msg">교수님마다 <b>Scopus Author ID</b>를 넣고 <b>교내 네트워크</b>에서 불러오기를 누르면, SciVal의 논문 수·FWCI·피인용 수·h-index가 교수 정보에 저장돼요. 관리자의 교수 요약과 참여 교수 시뮬레이션에만 보여요. ID는 교수님 안내 화면에서 각자 넣거나 아래 일괄 입력으로 넣어요. ID 있는 교수 <b>${P.filter(p=>p.scopus).length}</b> / ${P.length}명 · 불러온 교수 <b>${P.filter(svOf).length}</b>명</p>
    <div class="export"><input type="password" id="sv-key" value="${esc(svKey())}" placeholder="Elsevier API 키" autocomplete="off" spellcheck="false" style="max-width:300px" aria-label="Elsevier API 키">
      <select id="sv-yr" aria-label="SciVal 기간">${SV_YR.map(([v,l])=>`<option value="${v}" ${v===S.svYr?'selected':''}>${l}</option>`).join('')}</select>
      <button class="btn primary" data-act="svfetch">SciVal 불러오기</button><span class="msg" id="sv-msg"></span></div>
    <p class="msg">API 키는 이 브라우저에만 저장돼요.</p>
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
// 한 번에 여러 ID를 묻고, 응답을 {id:{name,so,fwci,cit,h}}로. 실패하면 {status,err}
async function svGet(ids,key){
  const q=new URLSearchParams({metricTypes:'ScholarlyOutput,FieldWeightedCitationImpact,CitationCount,HIndices',authors:ids.join(','),yearRange:S.svYr,includeSelfCitations:'true',byYear:'false',
    includedDocs:'AllPublicationTypes',journalImpactType:'CiteScore',showAsFieldWeighted:'false',indexType:'hIndex',apiKey:key,httpAccept:'application/json'});
  let r,t; try{r=await fetch(SV_API+'?'+q);t=await r.text()}catch(e){return {status:0,err:'연결하지 못했어요'}}
  let d=null; try{d=JSON.parse(t)}catch(e){}
  if(!r.ok||!d||!d.results) return {status:r.status,err:(d&&d['service-error']&&d['service-error'].status&&d['service-error'].status.statusText)||t.slice(0,150)};
  const out={};
  d.results.forEach(x=>{const m=Object.fromEntries((x.metrics||[]).map(v=>[v.metricType,v.value]));
    out[String(x.author.id)]={name:x.author.name||'',so:m.ScholarlyOutput??null,fwci:m.FieldWeightedCitationImpact??null,cit:m.CitationCount??null,h:m.HIndices??null}});
  return {out,src:d.dataSource||{}};
}
async function svFetch(){
  const key=svKey(), msg=$('#sv-msg'), P=S.data.profs.filter(p=>/^\d{6,}$/.test(p.scopus||''));
  if(!key){toast('Elsevier API 키를 넣어 주세요');$('#sv-key').focus();return}
  if(!P.length){msg.textContent='Scopus Author ID가 들어간 교수가 없어요.';return}
  const ids=[...new Set(P.map(p=>p.scopus))], got={}, bad=[]; let src={};
  for(let k=0;k<ids.length;k+=25){
    msg.textContent=`불러오는 중… ${k} / ${ids.length}`;
    const b=ids.slice(k,k+25), r=await svGet(b,key);
    if(r.out){Object.assign(got,r.out);src=r.src;continue}
    if(r.status!==400){msg.textContent=`불러오지 못했어요 (${r.err}). 교내 네트워크인지, 키가 맞는지 확인해 주세요.`;return} // 400은 잘못된 ID
    if(b.length===1){bad.push(b[0]);continue}
    for(const id of b){const s=await svGet([id],key);if(s.out){Object.assign(got,s.out);src=s.src}else bad.push(id)} // 잘못된 ID 하나 때문에 묶음 전체가 실패하면 하나씩 다시
  }
  ids.filter(id=>!got[id]&&!bad.includes(id)).forEach(id=>bad.push(id));
  const at=new Date().getFullYear()+'.'+today(), ups=P.filter(p=>got[p.scopus]).map(p=>[p,Object.assign({id:p.scopus,y0:src.metricStartYear||'',y1:src.metricEndYear||'',at},got[p.scopus])]);
  try{for(let a=0;a<ups.length;a+=400){const w=db.batch();ups.slice(a,a+400).forEach(([p,sv])=>w.update(db.doc('profs/'+p.id),{sv}));await w.commit()}
    ups.forEach(([p,sv])=>p.sv=sv)}catch(e){fail(e);return}
  render(); const names=P.filter(p=>bad.includes(p.scopus)).map(p=>p.name);
  $('#sv-msg').textContent=`${ups.length}명 저장했어요.`+(names.length?` 찾지 못한 ID: ${names.join(', ')}`:'');
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
