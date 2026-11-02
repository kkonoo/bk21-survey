// 참여 교수 시뮬레이션 (관리자): 실적 순으로 줄 세워 위에서 N명까지 참여시킬 때의 1인당 실적
/* ===== 참여 교수 시뮬레이션 ===== */
// 논문은 기간 안에 게재된 것 전체 (담당 교수 확인 여부와 관계없이). 참여 교수끼리 함께 쓴 논문·공동지도 학생은 한 번만 센다
S.sim={n:0,sort:'if',ifk:'',from:'2021-01',to:''};
const thisMonth=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const simFmt=(v,d)=>(Math.round(v*10**d)/10**d).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
function simYears(){const f=ymOf(S.sim.from),t=ymOf(S.sim.to);return Math.max(1,(Math.floor(t/100)-Math.floor(f/100))*12+t%100-f%100+1)/12}
function simRows(){
  const m=S.sim, f=ymOf(m.from), t=ymOf(m.to), ik=m.ifk==='pub'?'if':'if_cur';
  const inP=k=>!k||(k%100?k>=f&&k<=t:k/100>=Math.floor(f/100)&&k/100<=Math.floor(t/100)); // 게재연월이 없으면 포함, 연도만 있으면 연도로 비교 (취합과 같은 규칙)
  const nk=s=>String(s||'').toLowerCase().replace(/[^0-9a-z가-힣]/g,'');
  const rows=S.data.profs.map(p=>{
    const P=itemsOf(p.id,'paper').filter(i=>inP(dkey(i))).map(i=>{const v=parseFloat(i.f[ik]);const w=parseFloat(i.f.fwci);return {k:nk(i.f.doi)||nk(i.f.title)||i.id,v:v>0?v:0,miss:!(v>0),w:isNaN(w)?null:w}});
    const R=itemsOf(p.id,'roster').filter(i=>['재학','수료'].includes(i.f.status)&&!NONGRAD.includes(i.f.degree)).map(i=>({k:nk(i.f.sid)||nk(i.f.name)+i.f.degree,ms:i.f.degree==='석사'}));
    const W=P.filter(x=>x.w!==null);return {p,P,R,ifs:P.reduce((s,x)=>s+x.v,0),nw:isNew(p),fund:/^기금교수/.test(p.rank||''),fw:W.length?W.reduce((s,x)=>s+x.w,0)/W.length:null};
  }).sort((a,b)=>(m.sort==='fwci'?(b.fw??-1)-(a.fw??-1)||b.ifs-a.ifs:m.sort==='n'?b.P.length-a.P.length||b.ifs-a.ifs:b.ifs-a.ifs||b.P.length-a.P.length)||a.p.name.localeCompare(b.p.name,'ko'));
  // 1위부터 k명까지 참여할 때의 누적값
  const sp=new Set(), ss=new Set(), c={ifs:0,miss:0,ms:0,phd:0,basic:0,clin:0,nw:0,fund:0,fws:0,fwn:0};
  rows.forEach((r,k)=>{
    r.P.forEach(x=>{if(sp.has(x.k))return;sp.add(x.k);c.ifs+=x.v;if(x.miss)c.miss++;if(x.w!==null){c.fws+=x.w;c.fwn++}});
    r.R.forEach(x=>{if(ss.has(x.k))return;ss.add(x.k);c[x.ms?'ms':'phd']++});
    if(r.p.type==='기초')c.basic++;else if(r.p.type==='임상')c.clin++;
    if(r.nw)c.nw++; if(r.fund)c.fund++;
    r.cum=Object.assign({n:k+1,np:sp.size,ns:ss.size},c);
  });
  return rows;
}
function simSum(){
  const N=S.sim.n, c=S.simRows[N-1].cum, y=simYears(), M=S.simRows.length;
  const tile=(b,l,s)=>`<div class="tile"><b>${b}</b><span>${l}</span><small>${s}</small></div>`;
  return `<div class="tiles">
    ${tile(N+'<small>명</small>','참여 교수',`기초 ${c.basic} · 임상 ${c.clin}`)}
    ${tile(c.nw+'<small>명</small>','신임교수',`기금교수 ${c.fund}명`)}
    ${tile(Math.floor(N*10/7)+'<small>명 이하</small>','70%를 맞출 의과학과 모수',`등록 교수 ${M}명이면 ${Math.round(N/M*100)}%`)}
    ${tile(simFmt(c.ns/N,2)+'<small>명</small>','1인당 대학원생 (현재)',`전체 ${c.ns}명 · 석사 ${c.ms} · 박사·통합 ${c.phd}`)}
    ${tile(simFmt(c.np/N,2)+'<small>편</small>','1인당 논문 (총)',`전체 ${c.np}편`)}
    ${tile(simFmt(c.np/N/y,2)+'<small>편</small>','1인당 논문 (연간)',`${simFmt(y,1)}년으로 나눔`)}
    ${tile(simFmt(c.ifs/N,1),'1인당 IF 합 (총)',`전체 ${simFmt(c.ifs,1)}`)}
    ${tile(simFmt(c.ifs/N/y,1),'1인당 IF 합 (연간)',`${simFmt(y,1)}년으로 나눔`)}
    ${S.simRows.some(r=>r.fw!==null)?tile(c.fwn?simFmt(c.fws/c.fwn,2):'—','FWCI 평균 (논문)',`FWCI 있는 논문 ${c.fwn}/${c.np}편`):''}
  </div>${c.miss?`<p class="msg" style="margin-top:10px">IF가 비어 있는 논문 ${c.miss}편은 0으로 셌어요.</p>`:''}`;
}
function simTable(){
  const N=S.sim.n, y=simYears(), fw=S.simRows.some(r=>r.fw!==null);
  return `<div class="tablebox"><table><thead><tr><th class="num">순위</th><th>교수</th><th>구분</th><th>직급</th><th class="num">논문</th><th class="num">IF 합</th>${fw?'<th class="num">FWCI 평균</th>':''}<th class="num">대학원생</th><th class="num">누적 1인당 논문/년</th><th class="num">누적 1인당 IF/년</th></tr></thead><tbody>
    ${S.simRows.map((r,k)=>`<tr class="click${k>=N?' out':''}${k===N-1?' cut':''}" data-simn="${k+1}" title="${esc(r.p.name)} 교수까지 참여"><td class="num">${k+1}</td><td>${esc(r.p.name)}${r.nw?' <span class="chip pre">신임</span>':''}</td><td>${esc(r.p.type||'')}</td><td>${esc(r.p.rank||'')}</td>
      <td class="num">${r.P.length}</td><td class="num">${simFmt(r.ifs,1)}</td>${fw?`<td class="num">${r.fw!==null?simFmt(r.fw,2):'—'}</td>`:''}<td class="num">${r.R.length}</td><td class="num">${simFmt(r.cum.np/r.cum.n/y,2)}</td><td class="num">${simFmt(r.cum.ifs/r.cum.n/y,1)}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function simUpdate(){$('#sim-n').value=S.sim.n;$('#sim-nv').textContent=S.sim.n+'명';$('#sim-sum').innerHTML=simSum();$('#sim-tbl').innerHTML=simTable()}
function simView(){
  const m=S.sim, M=S.data.profs.length; if(!M) return '<div class="empty">교수 명단이 없어요.</div>';
  if(!m.ifk)m.ifk=S.data.jcrBase?'cur':'pub'; if(!m.from)m.from='2021-01'; if(!m.to)m.to=thisMonth();
  S.simRows=simRows(); m.n=Math.min(M,Math.max(1,m.n||M));
  const opt=(k,v,l)=>`<option value="${v}" ${v===m[k]?'selected':''}>${l}</option>`;
  return `<div class="sim"><div class="panel"><div class="head"><div><h2>참여 교수 시뮬레이션</h2><span class="msg">교수님들을 실적 순으로 줄 세워, 위에서부터 몇 명까지 참여시킬 때 1인당 실적이 어떻게 되는지 봐요. 막대를 움직이거나 아래 표에서 줄을 누르세요.</span></div></div>
    <div class="export"><label class="msg" for="sim-sort">줄 세우기</label><select id="sim-sort">${opt('sort','if','IF 합 큰 순')}${opt('sort','n','논문 수 많은 순')}${S.data.items.some(i=>i.cat==='paper'&&i.f.fwci)?opt('sort','fwci','FWCI 평균 높은 순'):''}</select>
      <label class="msg" for="sim-ifk">IF</label><select id="sim-ifk">${opt('ifk','cur','기준 연도 JCR'+(S.data.jcrBase?' ('+esc(S.data.jcrBase)+')':''))}${opt('ifk','pub','출판 당시 JCR')}</select>
      <span class="msg">논문 기간</span><input type="month" id="sim-from" value="${esc(m.from)}" style="width:auto" aria-label="논문 기간 시작 월"><span>~</span><input type="month" id="sim-to" value="${esc(m.to)}" style="width:auto" aria-label="논문 기간 끝 월"></div>
    <div class="slide"><label for="sim-n">참여 교수</label><input type="range" id="sim-n" min="1" max="${M}" value="${m.n}"><b id="sim-nv">${m.n}명</b><span class="msg">/ 등록 ${M}명</span></div>
    <div id="sim-sum">${simSum()}</div></div>
  <div class="panel" style="margin-top:16px"><div class="head"><h2 style="font-size:17px">실적 순위</h2></div>
    <p class="msg">줄을 누르면 그 교수까지 참여하는 것으로 바뀌어요. 누적 칸은 1위부터 그 줄까지 참여할 때의 1인당 연간 값이에요.</p>
    <div id="sim-tbl" style="margin-top:12px">${simTable()}</div>
    <p class="msg" style="margin-top:12px">계산 규칙: <b>논문</b> 기간 안에 게재된 논문 전체 (담당 교수 확인 여부와 관계없이 지금 입력된 것, 게재연월이 비어 있으면 포함). 참여 교수끼리 함께 쓴 논문은 DOI(없으면 제목)로 한 번만 세요 · <b>IF 합</b> 고른 JCR의 IF를 더한 값, 비어 있으면 0 · <b>연간</b> 논문 기간(${simFmt(simYears(),1)}년)으로 나눈 값 · <b>대학원생</b> 지금 재학·수료 중인 석사·박사·석박통합 과정생, 공동지도 학생은 한 번만 · <b>신임</b> 국내 최초 임용일 2017.3 이후 (안내 화면의 '신임' 표시와 같은 기준) · <b>FWCI 평균</b> 기간 안 논문 중 FWCI가 있는 논문의 평균 (관리자 화면의 '논문 FWCI 채우기'로 넣은 SciVal 값). 참여 교수끼리 함께 쓴 논문은 한 번만 · <b>70%를 맞출 모수</b> 참여 교수 수 ÷ 0.7 (내림). 의과학과 교원 모수가 이 수 이하여야 참여율 70% 이상이에요.</p></div></div>`;
}
