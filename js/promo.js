// 승진 실적 (참고)
/* ===== 승진 실적 (조교수·부교수 본인과 관리자에게만 보임, 담당 교수 화면에는 없음) ===== */
const RANKS=['교수','부교수','조교수','기금교수(교수대우)','기금교수(부교수대우)','기금교수(조교수대우)'];
const PROMO_NEXT={'조교수':'부교수','부교수':'교수'};
const promoOK=(p,mode)=>mode!=='rev'&&!!PROMO_NEXT[p.rank];
function promoCrit(type,target){ // 논문 총 편수 / JCR 상위 50% 이내 편수
  if(target==='부교수') return type==='기초'?{total:5,if50:2}:type==='임상'?{total:3,if50:1}:null;
  return type==='기초'?{total:6,if50:3}:type==='임상'?{total:4,if50:1}:null;
}
const PROMO_MAIN=['1저자','교신','1저자·교신','공동 제1·교신','주저자 (제1/교신 미구분)'];
function promoPaper(i){const f=i.f,main=PROMO_MAIN.includes(f.role),nm=parseInt(f.nmain),n=Math.max(1,nm||1),j=parseFloat(f.jcr),hasJ=!isNaN(j),base=main?1/n:0;
  return {i,f,main,n,noN:main&&!nm,j:hasJ?j:null,eff:base*(hasJ&&j<=5?2:1),eff50:hasJ&&j<=50?base:0}}
S.promoFrom={};
function promoFrom(pid){if(pid in S.promoFrom)return S.promoFrom[pid];try{return localStorage.getItem('promoFrom:'+pid)||''}catch(e){return ''}}
function promoPanel(p){
  const target=PROMO_NEXT[p.rank], crit=promoCrit(p.type,target), from=promoFrom(p.id), fYM=ymOf(from);
  const head=`<div class="head"><h2 style="font-size:17px">승진 실적 달성도 · ${esc(p.type)} · ${esc(p.rank)} → ${target}</h2></div>
    <p class="msg">교수님 본인과 BK 사무국만 보는 참고용 화면입니다 (담당 교수 화면에는 나오지 않아요). 이 조사에 입력한 <b>2021년 이후 논문</b>만으로 계산하므로, 실제 승진 심사는 교무 규정과 통합정보시스템 기준으로 다시 확인해 주세요.</p>
    <p style="margin:12px 0 0"><label for="promo-from" class="msg">산정 시작 연월 </label><input type="month" id="promo-from" value="${esc(from)}" style="max-width:170px">
    <span class="msg">현 직급 임용 이후 논문만 세려면 넣어 주세요. 이 브라우저에만 저장돼요.</span></p>`;
  if(!crit) return `<div class="panel promo">${head}<p class="msg" style="margin-top:14px">이 계열은 국내논문이 포함된 기준이라 자동 계산하지 않습니다.</p></div>`;
  const P=itemsOf(p.id,'paper').filter(i=>!fYM||ymOf(i.f.ym)>=fYM).sort((a,b)=>dkey(b)-dkey(a)).map(promoPaper);
  const tot=P.reduce((s,x)=>s+x.eff,0), t50=P.reduce((s,x)=>s+x.eff50,0);
  const waived=tot>=crit.total*1.5, totOK=tot>=crit.total, ok50=t50>=crit.if50||waived, all=totOK&&ok50;
  const bar=(label,v,need,ok,tag)=>`<div class="bar-row"><span>${label} <span class="mono">${v.toFixed(2)} / ${need}</span></span><span class="chip ${ok?'ok':'fix'}">${tag||(ok?'충족':'미달')}</span></div>
    <div class="prog"><i class="${ok?'':'warn'}" style="width:${Math.min(100,v/need*100)}%"></i></div>`;
  const lack=[!totOK&&`논문 ${(crit.total-tot).toFixed(2)}편`, !ok50&&`JCR 상위 50% 이내 ${(crit.if50-t50).toFixed(2)}편`].filter(Boolean).join(' + ');
  const rows=P.map(x=>`<tr class="${x.eff?'':'zero'}"><td>${esc(x.f.journal||'—')}<div class="msg" style="font-size:12px">${esc(String(x.f.title||'').slice(0,80))}</div>
      ${x.noN?'<span class="chip fix">주저자 수 미입력 → 1명으로 계산</span> ':''}${x.main&&x.j===null?'<span class="chip fix">JCR 미입력</span>':''}</td>
    <td>${esc(x.f.ym||'')}</td><td>${esc(x.f.role||'—')}${x.main&&x.n>1?` (1/${x.n})`:''}</td>
    <td class="num">${x.j===null?'—':x.j}${x.j!==null&&x.j<=5?' <span class="chip pre">×2</span>':''}</td>
    <td class="num">${x.eff.toFixed(2)}</td><td class="num">${x.eff50?'✓':'—'}</td></tr>`).join('');
  return `<div class="panel promo">${head}
    ${bar('국제논문 환산 편수',tot,crit.total,totOK)}
    ${bar('JCR 상위 50% 이내',t50,crit.if50,ok50,waived?'면제':'')}
    ${waived?`<p class="msg" style="margin-top:6px">총 편수가 기준의 1.5배(${(crit.total*1.5).toFixed(1)}편) 이상이라 JCR 50% 기준이 면제될 수 있어요.</p>`:''}
    <div class="verdict ${all?'ok':''}">${all?'논문 요건 충족':'부족: '+lack}</div>
  </div>
  <div class="panel promo" style="margin-top:16px"><div class="head"><h2 style="font-size:17px">논문별 환산 (${P.length}편)</h2></div>
    ${P.length?`<div class="tablebox"><table><thead><tr><th>학술지 / 제목</th><th>게재</th><th>저자 역할</th><th class="num">JCR 상위 %</th><th class="num">환산</th><th class="num">≤50%</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">해당 기간의 논문이 없습니다.</div>'}
    <p class="msg" style="margin-top:12px">환산 규칙: 제1·교신(주)저자 논문만 셈 · 주저자가 n명이면 1/n편 · JCR 상위 5% 이내는 2편 · 공저자는 0편. 증례보고(0.5편)는 이 조사에서 구분하지 않아 원저로 계산됩니다.</p>
  </div>`;
}
