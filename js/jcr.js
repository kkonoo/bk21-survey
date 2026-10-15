// JCR (IF · 상위 %) 조회·올리기
/* ===== JCR (IF · 상위 %) ===== */
const jnorm=s=>String(s||'').toUpperCase().replace(/&/g,'AND').replace(/[^A-Z0-9]/g,'');
const inorm=s=>String(s||'').toUpperCase().replace(/[^0-9X]/g,'');
function jbucket(k){let h=0;for(const ch of k)h=(h*31+ch.charCodeAt(0))>>>0;return h%32}
async function jcrDoc(id){if(!(id in S.jcrCache)){const d=await db.doc('jcr/'+id).get();S.jcrCache[id]=d.exists?(d.data().e||{}):{}}return S.jcrCache[id]}
// 출판 당시 JCR 연도: JCR은 매년 6월 말에 전년도 값이 나오므로 7월 이후 출판은 전년도, 1–6월은 전전년도. 월이 없으면 전년도.
function pubJcrYear(ym){const m=String(ym||'').match(/(\d{4})(?:\D+(\d{1,2}))?/);if(!m)return 0;const y=+m[1],mo=+m[2]||0;return mo&&mo<7?y-2:y-1}
async function jcrExact(issns,name,year){
  const keys=[...(issns||[]).map(x=>'I'+inorm(x)).filter(k=>k.length===9),...(name?['N'+jnorm(name)]:[])];
  if(!year||!keys.length||!S.data.jcrYears.map(Number).includes(+year)) return null;
  for(const k of keys){const e=(await jcrDoc(year+'_'+jbucket(k)))[k];if(e)return {if:e[0],pct:e[1],year:+year}}
  return null;
}
async function jcrLookup(issns,name,year){
  const keys=[...(issns||[]).map(x=>'I'+inorm(x)).filter(k=>k.length===9),...(name?['N'+jnorm(name)]:[])];
  const ys=S.data.jcrYears.map(Number).sort((a,b)=>b-a); if(!keys.length||!ys.length) return null;
  const y0=Number(year)||ys[0], order=[...ys.filter(y=>y<=y0),...ys.filter(y=>y>y0).reverse()];
  for(const y of order) for(const k of keys){const e=(await jcrDoc(y+'_'+jbucket(k)))[k];if(e)return {if:e[0],pct:e[1],year:y}}
  return null;
}
// 표준 형식만 받는다: 연도, 저널명, ISSN, eISSN, IF, 상위%, 분야 (JCR/jcr_convert.py 로 변환)
const JCR_STD=['연도','저널명','ISSN','eISSN','IF','상위%','분야'];
function jcrParse(rows,fname){
  const H=(rows[0]||[]).map(c=>String(c||'').replace(/^﻿/,'').trim()), ix=Object.fromEntries(JCR_STD.map(k=>[k,H.indexOf(k)]));
  const miss=JCR_STD.filter(k=>ix[k]<0); if(miss.length) throw new Error(`${fname}: 표준 형식이 아니에요 (없는 열: ${miss.join(', ')}). jcr_convert.py로 먼저 변환해 주세요`);
  const num=v=>{const t=String(v??'').trim();if(!t)return null;const n=parseFloat(t);return isNaN(n)?null:n};
  const byYear={};let n=0,withPct=0;
  for(const r of rows.slice(1)){ if(!r) continue;
    const y=parseInt(r[ix['연도']]), jif=num(r[ix.IF]); if(!y||jif===null) continue;
    const pct=num(r[ix['상위%']]), v=[jif,pct===null?null:Math.round(pct*100)/100], out=byYear[y]=byYear[y]||{}; n++; if(pct!==null)withPct++;
    ['I'+inorm(r[ix.ISSN]),'I'+inorm(r[ix.eISSN]),'N'+jnorm(r[ix['저널명']])].filter(k=>k.length>2&&!(k[0]==='I'&&k.length!==9)).forEach(k=>{const o=out[k];if(!o||(v[1]!==null&&(o[1]===null||v[1]<o[1])))out[k]=v})}
  if(!n) throw new Error(fname+': 읽을 행이 없어요');
  return {byYear,n,withPct};
}
async function jcrUpload(){
  const files=[...$('#jcr-file').files], msg=$('#jcr-msg'); if(!files.length){msg.textContent='파일을 먼저 고르세요.';return}
  try{
    const all={}, notes=[];
    for(const f of files){msg.textContent='읽는 중… '+f.name;
      const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}); const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
      const r=jcrParse(rows,f.name);
      Object.entries(r.byYear).forEach(([y,out])=>{const A=all[y]=all[y]||{};Object.entries(out).forEach(([k,v])=>{const o=A[k];if(!o||(v[1]!==null&&(o[1]===null||v[1]<o[1])))A[k]=v})});
      notes.push(`${f.name}: JCR ${Object.keys(r.byYear).join('·')}년 · 저널 ${r.n}개 · 상위% 있음 ${r.withPct}개`);
    }
    const ys=Object.keys(all).sort(), n=ys.map(y=>`${y}년 ${Object.keys(all[y]).filter(k=>k[0]==='N').length}개`).join(', ');
    if(!confirm(`${n}\n\n${notes.slice(0,12).join('\n')}${notes.length>12?`\n… 외 ${notes.length-12}개 파일`:''}\n\n저장할까요?`)){msg.textContent='';return}
    for(const year of ys){msg.textContent=`저장 중… ${year}년`;
      const bk={};Object.entries(all[year]).forEach(([k,v])=>{(bk[jbucket(k)]=bk[jbucket(k)]||{})[k]=v});
      // 한 번에 묶어 저장하면 'Transaction too big' → 문서(32개 중 1개)마다 따로 저장
      const ids=Object.keys(bk);let done=0;
      for(const i of ids){const id=year+'_'+i;delete S.jcrCache[id];const cur=await jcrDoc(id);const m=Object.assign({},cur);
        Object.entries(bk[i]).forEach(([k,v])=>{const o=m[k];if(!o||(v[1]!==null&&(o[1]===null||v[1]<o[1]))||(o[1]===null&&v[1]===null))m[k]=v});
        await db.doc('jcr/'+id).set({e:m});S.jcrCache[id]=m;msg.textContent=`저장 중… ${year}년 ${++done} / ${ids.length}`}
    }
    const yall=Array.from(new Set([...S.data.jcrYears.map(String),...ys]));
    await db.doc('config/app').set({jcrYears:yall},{merge:true}); S.data.jcrYears=yall;
    render(); $('#jcr-msg').textContent=`저장했어요: ${n}`;
  }catch(e){console.error(e);msg.textContent='올리지 못했어요: '+(e.message||e)}
}
async function jcrFill(){
  const msg=$('#jcr-msg'); if(!S.data.jcrYears.length){msg.textContent='먼저 JCR 자료를 올려 주세요.';return}
  const base=Number(S.data.jcrBase)||0;
  const todo=S.data.items.filter(i=>i.cat==='paper'&&i.f.journal);
  msg.textContent=`찾는 중… 0 / ${todo.length}`; const ups=[]; let k=0, nPub=0, nCur=0;
  for(const i of todo){k++;if(k%20===0)msg.textContent=`찾는 중… ${k} / ${todo.length}`;
    const f=Object.assign({},i.f);
    if(!f.if||!f.jcr){const r=await jcrExact([],f.journal,pubJcrYear(f.ym));
      if(r){if(!f.if&&r.if!=null)f.if=String(r.if);if(!f.jcr&&r.pct!=null)f.jcr=String(r.pct);nPub++}
}
    if(base){const r=await jcrExact([],f.journal,base);const nv=r?[r.if!=null?String(r.if):'',r.pct!=null?String(r.pct):'']:['',''];
      if(nv[0]!==(f.if_cur||'')||nv[1]!==(f.jcr_cur||'')){f.if_cur=nv[0];f.jcr_cur=nv[1]}if(r)nCur++}
    if(JSON.stringify(f)!==JSON.stringify(i.f)) ups.push([i,f])}
  if(!ups.length){msg.textContent='바뀌는 논문이 없어요.';return}
  if(!confirm(`논문 ${ups.length}건을 고칠까요?\n· 출판 당시 IF·상위 %: 빈 칸만 채움 (JCR ${nPub}건)\n· 기준 연도${base?' '+base:''} IF·상위 %: ${base?`전부 다시 계산 (찾음 ${nCur}건)`:'기준 연도가 정해지지 않아 건너뜀'}`)){msg.textContent='';return}
  try{for(let a=0;a<ups.length;a+=400){const b=db.batch();ups.slice(a,a+400).forEach(([i,f])=>b.update(db.doc('items/'+i.id),{f}));await b.commit()}
    ups.forEach(([i,f])=>i.f=f); msg.textContent=`${ups.length}건 고쳤어요.`}catch(e){fail(e)}
}
