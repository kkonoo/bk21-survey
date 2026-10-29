// 실적 육각형
/* ===== 실적 육각형 (본인과 관리자에게만 보임, 담당 교수가 '확인'한 실적만 셈) ===== */
// 축마다 연평균 값을 내고, 관리자가 게시한 학과 기준(10·25·50·75·90% 값)에 대어 0–100점(학과 안 위치)으로 바꾼다
const HEX=[['paper','논문','편/년'],['grant','연구비','백만원/년'],['ind','산학·사회','점/년'],['stu','학생지도','점'],['edu','교육','점/년'],['intl','국제화','점/년']];
const HEX_Q=[10,25,50,75,90];
const IPW={기술이전:2,창업:2}; // 나머지(등록특허·저서·북챕터)는 1점
const NONGRAD=DEGREE_GROUPS.filter(g=>g[0]!=='대학원').flatMap(g=>g[1]); // 대학원생이 아닌 과정 (학부·예정, 연구원)
const nowYM=()=>{const d=new Date();return d.getFullYear()*100+d.getMonth()+1};
const ymText=ym=>Math.floor(ym/100)+(ym%100?'.'+String(ym%100).padStart(2,'0'):'');
function hexRaw(p,end){
  const ok=itemsOf(p.id).filter(i=>i.rv.s==='ok'), of=c=>ok.filter(i=>i.cat===c), sum=(a,g)=>a.reduce((s,x)=>s+g(x),0);
  // 연평균 기간: 2021.1과 국내 최초 임용일 중 늦은 달부터 end 까지 (최소 1년)
  const s=Math.max(202101,ymOf(p.hired)), y=Math.max(1,((Math.floor(end/100)-Math.floor(s/100))*12+end%100-(s%100||1)+1)/12);
  const P=of('paper').map(promoPaper), R=of('roster'), L=of('lec'), ipn=k=>of('ip').filter(i=>i.f.kind===k).length;
  const paid=sum(of('grant'),i=>sum(Object.values(i.f.paid||{}),v=>parseFloat(v)||0))/1000; // 천원 → 백만원
  const cur=R.filter(i=>['재학','수료'].includes(i.f.status)&&!NONGRAD.includes(i.f.degree)).length;
  const ms=R.filter(i=>i.f.status==='졸업'&&i.f.degree==='석사').length, phd=R.filter(i=>i.f.status==='졸업'&&['박사','석박통합'].includes(i.f.degree)).length;
  const stuP=of('paper').filter(i=>i.f.student).length, cr=sum(L,i=>(parseFloat(i.f.credit)||0)*(i.f.eng==='예'?1.5:1));
  const ia=ok.filter(i=>(i.cat==='paper'||i.cat==='ip')&&i.f.intl==='예').length;
  const v={
    paper:sum(P,x=>(x.main?1/x.n:.2)*(x.j!==null&&x.j<=5?2:1))/y,
    grant:paid/y,
    ind:(sum(of('ip'),i=>IPW[i.f.kind]||1)+of('soc').length)/y,
    stu:cur+(ms+phd*2+of('stu').length+stuP*2)/y, // 지금 지도 중인 학생 수는 연평균하지 않음
    edu:(cr+of('edu').length*3)/y,
    intl:(of('intl').length+of('collab').length+of('ex').length+ia)/y};
  Object.keys(v).forEach(k=>v[k]=Math.round(v[k]*1000)/1000);
  const d={
    paper:`주저자 ${P.filter(x=>x.main).length}편 · 공저자 ${P.filter(x=>!x.main).length}편 · JCR 상위 5% ${P.filter(x=>x.j!==null&&x.j<=5).length}편`,
    grant:`과제 ${of('grant').length}건 · 입금 합계 ${Math.round(paid).toLocaleString()}백만원`,
    ind:`등록특허 ${ipn('등록특허')} · 기술이전 ${ipn('기술이전')} · 창업 ${ipn('창업')} · 저서 ${ipn('저서')} · 북챕터 ${ipn('북챕터')} · 산업·사회 기여·국내 활동 ${of('soc').length}`,
    stu:`재학·수료 대학원생 ${cur}명 · 졸업 석사 ${ms}·박사 ${phd}명 · 학생 실적 ${of('stu').length}건 · 학생 주저자 논문 ${stuP}편`,
    edu:`대학원 강의 ${L.length}과목 ${Math.round(cr*10)/10}학점 · 교육역량 ${of('edu').length}건`,
    intl:`국제학술활동 ${of('intl').length} · 국제공동연구 ${of('collab').length+ia} (논문·특허 ${ia} 포함) · 외국기관 교류 ${of('ex').length}`};
  return {v,d,s,y,n:itemsOf(p.id).length,ok:ok.length};
}
function hexScore(x,q){ // 학과 기준값 사이를 선형으로 이어 0–100. 기준값과 같으면(동점) 그 구간의 가운데
  const A=[[0,0],...HEX_Q.map((p,k)=>[p,q[k]]),[100,q[4]+Math.max(q[4]-q[3],q[4]/2)]];
  const eq=A.filter(a=>a[1]===x); if(eq.length) return (eq[0][0]+eq[eq.length-1][0])/2;
  const hi=A.findIndex(a=>a[1]>x); if(hi<0) return 100;
  const [p0,v0]=A[hi-1],[p1,v1]=A[hi]; return p0+(p1-p0)*(x-v0)/(v1-v0);
}
function hexSVG(sc){
  const R=110, pt=(k,r)=>{const a=-Math.PI/2+k*Math.PI/3;return [Math.cos(a)*r,Math.sin(a)*r]}, f=n=>n.toFixed(1);
  const poly=rs=>rs.map((r,k)=>pt(k,r).map(f).join(',')).join(' '), all=r=>HEX.map(()=>r);
  const grid=[25,50,75,100].map(v=>`<polygon class="ring${v===50?' mid':''}" points="${poly(all(R*v/100))}"/>`).join('')+HEX.map((_,k)=>{const [x,y]=pt(k,R);return `<line class="spoke" x1="0" y1="0" x2="${f(x)}" y2="${f(y)}"/>`}).join('');
  const me=sc?`<polygon class="me" points="${poly(sc.map(s=>R*s/100))}"/>`+HEX.map((h,k)=>{const [x,y]=pt(k,R*sc[k]/100);return `<circle class="pt" cx="${f(x)}" cy="${f(y)}" r="4.5"><title>${h[1]} ${Math.round(sc[k])}점</title></circle>`}).join(''):'';
  const labels=HEX.map((h,k)=>{const [x,y]=pt(k,R+20), an=Math.abs(x)<1?'middle':x>0?'start':'end', ty=y+(y<-R?-14:y>R?4:-6);
    return `<text x="${f(x)}" y="${f(ty)}" text-anchor="${an}">${h[1]}</text>${sc?`<text class="v" x="${f(x)}" y="${f(ty+16)}" text-anchor="${an}">${Math.round(sc[k])}점</text>`:''}`}).join('');
  return `<svg viewBox="-200 -165 400 330" role="img" aria-label="${sc?HEX.map((h,k)=>h[1]+' '+Math.round(sc[k])+'점').join(', '):'학과 기준이 아직 없어 점수 없음'}">${grid}${me}${labels}</svg>`;
}
function hexPanel(p){
  const B=S.data.bench, r=hexRaw(p,(B&&B.ym)||nowYM()), sc=B?HEX.map(h=>hexScore(r.v[h[0]],B.q[h[0]])):null;
  const fmt=v=>(Math.round(v*10)/10).toLocaleString();
  const rows=HEX.map((h,k)=>`<tr><td>${h[1]}</td><td class="num">${fmt(r.v[h[0]])} <span class="msg">${h[2]}</span></td><td class="num">${B?fmt(B.q[h[0]][2]):'—'}</td><td class="num">${sc?Math.round(sc[k]):'—'}</td><td class="wrap">${r.d[h[0]]}</td></tr>`).join('');
  return `<div class="panel hex"><div class="head"><h2 style="font-size:17px">실적 육각형 · ${esc(p.name)}</h2></div>
    <p class="msg">교수님 본인과 BK 사무국만 보는 화면입니다 (담당 교수 화면에는 나오지 않아요). 축마다 <b>학과 교수님들 사이에서의 위치</b>를 0–100점으로 보여줘요. 50점이 학과 중앙값이고, 안쪽으로 들어간 축이 상대적으로 약한 부분이에요.</p>
    ${B?'':'<p class="msg" style="margin-top:8px"><b>아직 학과 기준이 게시되지 않았어요.</b> BK 사무국이 집계를 게시하면 점수가 나와요. 아래 연평균 값은 지금도 볼 수 있어요.</p>'}
    ${hexSVG(sc)}
    ${B?'<p class="msg" style="text-align:center;margin:6px 0 0">점선 = 학과 중앙값 (50점)</p>':''}
  </div>
  <div class="panel hex" style="margin-top:16px"><div class="head"><h2 style="font-size:17px">축별 내역</h2><span class="msg">담당 교수가 확인한 실적 ${r.ok} / ${r.n}건 · ${ymText(r.s)}부터 ${fmt(r.y)}년</span></div>
    <div class="tablebox"><table><thead><tr><th>축</th><th class="num">내 값</th><th class="num">학과 중앙값</th><th class="num">점수</th><th>반영 내역</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="msg" style="margin-top:12px">계산 규칙: <b>논문</b> 주저자 1/n편(주저자 수로 나눔)·공저자 0.2편, JCR 상위 5% 이내는 2배 · <b>연구비</b> 연도별 입금액 · <b>산학·사회</b> 등록특허·저서·북챕터·산업·사회 기여·국내 활동 1점, 기술이전·창업 2점 · <b>학생지도</b> 지금 재학·수료 중인 대학원생 1명당 1점 + 석사 졸업 1점·박사 졸업 2점·학생 실적 1점·학생 주저자 논문 2점의 연평균 · <b>교육</b> 대학원 강의 학점(영어 강의 1.5배) + 교육역량 1건 3점 · <b>국제화</b> 국제학술활동·국제공동연구(국제 논문·특허 포함)·외국기관 교류 1건 1점. 학생지도의 재학생 수 말고는 모두 <b>2021.1과 국내 최초 임용일 중 늦은 달부터의 연평균</b>입니다.</p>
    ${B?`<p class="msg">학과 기준: ${esc(B.at)} 게시 · 확인된 실적이 있는 교수 ${B.n}명</p>`:''}
  </div>`;
}
