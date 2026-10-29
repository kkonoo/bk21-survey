// 학과 결산: 집계·게시·보기
/* ===== 학과 결산 (모든 링크에서 보임, 교수 이름 없이 확인된 실적만) ===== */
// 학기: 1학기 3–8월, 2학기 9월–이듬해 2월. 연도는 1–12월. 월이 없는 실적은 연도 결산에만 들어간다
const semOf=ym=>{const y=Math.floor(ym/100),m=ym%100;return !m?'':m>=3&&m<=8?y+'-1':m>=9?y+'-2':(y-1)+'-2'};
const periodsOf=ym=>ym?[String(Math.floor(ym/100)),semOf(ym)].filter(Boolean):[];
const pLabel=k=>k.includes('-')?`${k.slice(0,4)}년 ${k.slice(5)}학기 (${k.endsWith('1')?'3–8월':'9월–이듬해 2월'})`:k+'년';
const won=v=>{v=parseFloat(v)||0;return v>=100000?(Math.round(v/10000)/10).toLocaleString()+'억원':Math.round(v/1000).toLocaleString()+'백만원'}; // 천원 단위
const RECAP_N=[['p','논문','편'],['p10','JCR 상위 10% 논문','편'],['pi','국제공동 논문','편'],['g','신규 연구과제','건'],['gm','연구비 입금',''],['pat','등록특허','건'],['tt','기술이전','건'],['su','창업','건'],['bk','저서','건'],['bc','북챕터','건'],
  ['phd','박사 배출','명'],['ms','석사 배출','명'],['sa','지도학생 수상','건'],['si','학생 국제학회 발표','건'],['ia','국제학회 수상','건'],['it','초청강연·기조연설','건'],['ed','교육 실적','건'],['so','산업·사회 기여·국내 활동','건']];
const RECAP_HL=[['paper','JCR 상위 10% 논문',0],['grant','신규 연구과제 (연구책임자, 총 연구비 큰 순 5건)',5],['tech','기술이전·창업',0],['award','수상',0],['talk','초청강연·기조연설',0]];
function recapBuild(at,ym0){
  const P={}, hl=[], seen=new Set(), nk=s=>String(s||'').toLowerCase().replace(/[^0-9a-z가-힣]/g,'');
  const add=(ym,k,n)=>periodsOf(ym).forEach(p=>{const c=P[p]=P[p]||{};c[k]=(c[k]||0)+(n==null?1:n)});
  const dup=(c,key)=>{if(!key)return false;key=c+'|'+key;if(seen.has(key))return true;seen.add(key);return false}; // 여러 교수가 함께한 논문·특허·과제, 공동지도 학생은 한 번만
  S.data.items.filter(i=>i.rv.s==='ok').forEach(i=>{const f=i.f, ym=dkey(i);
    if(i.cat==='paper'&&!dup('paper',nk(f.doi)||nk(f.title))){const j=parseFloat(f.jcr);add(ym,'p');if(f.intl==='예')add(ym,'pi');
      if(j<=10){add(ym,'p10');hl.push({g:'paper',ym,t:f.title||'',s:[f.journal,'JCR 상위 '+j+'%',f.student&&'학생 주저자'].filter(Boolean).join(' · '),o:j})}}
    if(i.cat==='grant'){Object.entries(f.paid||{}).forEach(([y,v])=>{const n=parseFloat(v);if(n)add(+y*100,'gm',n)}); // 입금은 교수별 몫이라 중복 없이 모두 더함
      if(!dup('grant',nk(f.title))){add(ym,'g');if(f.grole==='연구책임자'){const t=parseFloat(f.total)||0;hl.push({g:'grant',ym,t:f.title||'',s:[f.ministry,f.program,t&&won(t)].filter(Boolean).join(' · '),o:-t})}}}
    if(i.cat==='ip'&&!dup('ip',f.kind+nk(f.title))){const k={등록특허:'pat',기술이전:'tt',창업:'su',저서:'bk',북챕터:'bc'}[f.kind];if(k)add(ym,k);
      if(f.kind==='기술이전'||f.kind==='창업')hl.push({g:'tech',ym,t:f.title||'',s:[f.kind,parseFloat(f.amount)>0&&won(f.amount)].filter(Boolean).join(' · '),o:-ym})}
    if(i.cat==='roster'&&f.status==='졸업'&&!dup('grad',nk(f.sid)||nk(f.name)+f.degree)){const g=ymOf(f.grad);if(f.degree==='석사')add(g,'ms');else if(['박사','석박통합'].includes(f.degree))add(g,'phd')}
    if(i.cat==='stu'&&!dup('stu',nk(f.student)+f.kind+nk(f.title))){if(/^수상/.test(f.kind||'')){add(ym,'sa');hl.push({g:'award',ym,t:f.title||'',s:'지도학생 '+f.kind,o:-ym})}if(f.kind==='학회 발표 (국제)')add(ym,'si')}
    if(i.cat==='intl'){if(f.kind==='국제학회 수상'){add(ym,'ia');hl.push({g:'award',ym,t:f.content||f.event||'',s:f.content?f.event||'':'',o:-ym})}
      if(f.kind==='초청강연'||f.kind==='기조연설'){add(ym,'it');hl.push({g:'talk',ym,t:f.content||f.event||'',s:[f.kind,f.content&&f.event,f.place].filter(Boolean).join(' · '),o:-ym})}}
    if(i.cat==='edu'){add(ym,'ed');if(f.kind==='교육 수상 (교외)')hl.push({g:'award',ym,t:f.title||'',s:'교육 수상',o:-ym})}
    if(i.cat==='soc'){add(ym,'so');if(f.kind==='국내 학회 수상')hl.push({g:'award',ym,t:f.title||'',s:'국내 학회 수상',o:-ym})}
  });
  return {at,ym:ym0,periods:P,hl};
}
function benchBuild(at,ym){
  const V=S.data.profs.filter(p=>itemsOf(p.id).some(i=>i.rv.s==='ok')).map(p=>hexRaw(p,ym).v);
  const qt=(a,q)=>{const h=(a.length-1)*q/100,k=Math.floor(h);return a[k]+((a[k+1]??a[k])-a[k])*(h-k)};
  return {at,ym,n:V.length,q:Object.fromEntries(HEX.map(([k])=>{const a=V.map(v=>v[k]).sort((x,y)=>x-y);return [k,HEX_Q.map(q=>a.length?Math.round(qt(a,q)*1000)/1000:0)]}))};
}
async function publishAgg(){
  if(!confirm('담당 교수가 확인한 실적으로 실적 육각형의 학과 기준과 학과 결산을 새로 만들어 게시할까요?\n결산은 교수 이름 없이 모든 링크에서 보이고, 논문 제목 등은 그대로 나와요.')) return;
  try{
    await loadAll(); // 최신 검토 결과 기준
    const at=new Date().getFullYear()+'.'+today(), bench=benchBuild(at,nowYM()), recap=recapBuild(at,nowYM());
    if(!bench.n){render();toast('담당 교수가 확인한 실적이 아직 없어요');return}
    await db.doc('config/app').set({bench,recap},{mergeFields:['bench','recap']});
    S.data.bench=bench;S.data.recap=recap;render();toast(`게시했어요 (교수 ${bench.n}명 기준)`,4000);
  }catch(e){fail(e);render()}
}
S.recapP='';
function recapView(){
  const R=S.data.recap; if(!R) return '<div class="empty">아직 게시된 결산이 없어요.</div>';
  const ks=Object.keys(R.periods||{}), sem=ks.filter(k=>k.includes('-')).sort().reverse(), yr=ks.filter(k=>!k.includes('-')).sort().reverse();
  const cur=ks.includes(S.recapP)?S.recapP:ks.includes(semOf(R.ym))?semOf(R.ym):(sem[0]||yr[0]||''), C=(R.periods||{})[cur]||{}, H=(R.hl||[]).filter(h=>periodsOf(h.ym).includes(cur)); // 기본 기간은 게시한 날이 속한 학기
  const opt=k=>`<option value="${k}" ${k===cur?'selected':''}>${pLabel(k)}</option>`;
  const tiles=RECAP_N.filter(([k])=>C[k]).map(([k,l,u])=>`<div class="tile"><b>${k==='gm'?won(C[k]):C[k].toLocaleString()+`<small>${u}</small>`}</b><span>${l}</span></div>`).join('');
  const lists=RECAP_HL.map(([g,l,max])=>{let a=H.filter(h=>h.g===g).sort((x,y)=>x.o-y.o);if(max)a=a.slice(0,max);
    return a.length?`<h3>${l} <span class="count">${a.length}</span></h3><div class="items">${a.map(h=>`<div class="item"><div style="min-width:0"><div class="t">${esc(h.t)}</div><div class="meta">${[h.s,ymText(h.ym)].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`).join('')}</div>`:''}).join('');
  return `<div class="panel recap"><div class="head"><div><h2>학과 결산 · ${cur?pLabel(cur):''}</h2><span class="msg">교수님들의 실적을 이름 없이 모았어요. 함께 축하해요!</span></div>
      ${ks.length?`<select id="recap-p" style="width:auto" aria-label="결산 기간">${sem.length?`<optgroup label="학기">${sem.map(opt).join('')}</optgroup>`:''}${yr.length?`<optgroup label="연도">${yr.map(opt).join('')}</optgroup>`:''}</select>`:''}</div>
    ${tiles?`<div class="tiles">${tiles}</div>`:'<div class="empty">이 기간에 확인된 실적이 없어요.</div>'}
    ${lists}
    <p class="msg" style="margin-top:18px">담당 교수가 확인한 실적만 셉니다 (${esc(R.at)} 게시). 여러 교수님이 함께한 논문·특허·과제와 공동지도 학생은 한 번만 세고, 연구비 입금과 월이 없는 실적(교육 실적 등)은 연도 결산에만 나와요.</p>
  </div>`;
}
