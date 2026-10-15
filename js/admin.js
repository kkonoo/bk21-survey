// 관리자 화면: 진행 현황, 링크·권한, 교수 추가, 담당 배정, 엑셀, 명단 가져오기
S.fold={}; // 관리자 화면의 접는 칸 (data-fold 이름 → 펼침 여부)
const fold=k=>`data-fold="${k}" ${S.fold[k]?'open':''}`;
function adminHome(){
  const P=S.data.profs;
  if(!P.length) return `<div class="panel"><div class="head"><h2>시작하기</h2></div><p class="msg">아직 자료가 없어요. 아래에서 <b>초기 데이터(seed.json)</b>를 가져오세요. 교수님별 개인 링크도 함께 만들어져요.</p></div>${linkPanel()}${setupPanels()}`;
  const rows=P.map(p=>{const st=stats(p);return `<tr class="click" data-open="${p.id}">
    <td>${esc(p.name)}</td><td>${esc(p.type)}</td><td class="num">${itemsOf(p.id,'roster').filter(i=>['재학','수료'].includes(i.f.status)&&!NONGRAD.includes(i.f.degree)).length}</td>
    <td><select data-assign="${p.id}" aria-label="${esc(p.name)} 담당 교수"><option value="">미배정</option>${S.data.reviewers.map(r=>`<option value="${r.id}" ${r.id===p.rev?'selected':''}>${esc(r.name)}</option>`).join('')}</select></td>
    <td class="num">${st.done}/${CATS.length}</td><td class="num">${st.n}</td><td class="num">${st.fix}</td><td class="num">${st.qw}</td><td class="num">${esc(p.updated||'—')}</td>
    <td><button class="btn ghost sm" data-delprof="${p.id}">삭제</button></td></tr>`}).join('');
  const tot=P.reduce((a,p)=>a+stats(p).done,0), all=P.length*CATS.length;
  return `<div class="head"><h2>전체 진행 현황</h2><span class="msg">항목 확인 완료 ${tot} / ${all} · <span class="due">마감 ${esc(S.data.deadline)}</span></span></div>
  <div class="prog" style="margin-bottom:14px"><i style="width:${tot/all*100}%"></i></div>
  <details class="fold" ${fold('prog')}><summary><span class="caret" aria-hidden="true"></span>교수별 현황 표 (${P.length}명)</summary>
  <div class="tablebox"><table><thead><tr><th>교수</th><th>기초/임상</th><th>재학·수료생</th><th>담당 교수</th><th>확인 완료</th><th>실적</th><th>수정 요청</th><th>질문 대기</th><th>최근 수정</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></details>
  ${adminQPanel()}
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">교수 추가</h2></div>
    <p class="msg">추가하면 그 교수님의 개인 링크도 함께 만들어져요. 담당 교수는 위 표에서 나중에 바꿀 수 있어요.</p>
    <div class="export"><input id="np-name" placeholder="이름" style="max-width:120px" aria-label="교수 이름">
      <select id="np-type" aria-label="기초/임상"><option>기초</option><option>임상</option></select>
      <select id="np-rank" aria-label="직급"><option value="">직급</option>${RANKS.map(r=>`<option>${r}</option>`).join('')}</select>
      <input id="np-rid" placeholder="연구자등록번호" style="max-width:150px" aria-label="연구자등록번호">
      <select id="np-rev" aria-label="담당 교수"><option value="">담당 교수 미배정</option>${S.data.reviewers.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
      <button class="btn primary" data-act="addprof">추가</button></div></div>
  ${linkPanel()}
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">담당 교수</h2></div>
    <p class="msg">담당 교수 권한을 주면 그 교수님 개인 링크에 "담당 교수 검토" 화면이 생겨요. 권한을 해제하면 맡던 교수님들은 미배정이 되니, 위 표에서 다시 배정해 주세요.</p>
    <div class="tablebox"><table><thead><tr><th>이름</th><th>맡은 교수</th><th></th></tr></thead><tbody>${S.data.reviewers.map(r=>`<tr><td>${esc(r.name)}</td><td class="num">${P.filter(p=>p.rev===r.id).length}명</td><td><button class="btn ghost sm" data-revoke="${r.id}">권한 해제</button></td></tr>`).join('')||'<tr><td colspan="3">없음</td></tr>'}</tbody></table></div>
    <div class="export" style="margin-top:12px"><select id="gr-prof" aria-label="담당 교수 권한을 줄 교수"><option value="">교수 선택</option>${P.filter(p=>!S.data.reviewers.some(r=>r.name===p.name)).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
      <button class="btn" data-act="grantrev">담당 교수 권한 주기</button></div>
    <details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">담당 교수 일괄 배정</summary>
      <p class="msg">한 줄에 한 분씩 <b>담당 교수: 교수, 교수, …</b> 로 적고 적용을 누르세요. 적힌 교수님만 바뀌고, 나머지는 그대로예요.</p>
      <textarea id="ba-text" placeholder="김○○: 홍길동, 김철수, 이영희&#10;박○○: 최민수, 정수진" style="min-height:150px"></textarea>
      <div class="export"><button class="btn primary" data-act="bulkassign">적용</button><span class="msg" id="ba-msg"></span></div></details></div>
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">취합</h2></div>
    <p class="msg">엑셀 파일은 항목별 시트로 나뉘어 내려받아집니다. 표 복사는 한 항목을 엑셀에 바로 붙여 넣을 때 쓰세요.</p>
    <div class="export"><span class="msg">기간</span><input type="month" id="rg-from" value="${esc(S.range.from)}" style="width:auto" aria-label="시작 월"><span>~</span><input type="month" id="rg-to" value="${esc(S.range.to)}" style="width:auto" aria-label="끝 월">
      <span class="msg">비우면 전체. 논문은 게재연월, 연구비는 수행기간이 겹치는 과제, 명단은 그 기간에 재학·재직한 사람이 들어가요. 날짜가 비어 있는 항목은 늘 포함돼요.</span></div>
    <div class="export"><button class="btn primary" data-act="xlsx">엑셀 파일 내려받기</button>
    <select id="exp-cat" aria-label="복사할 항목">${CATS.map(c=>`<option value="${c.key}" ${c.key===S.exportCat?'selected':''}>${c.name}</option>`).join('')}</select>
    <button class="btn" data-act="copy">표 복사</button></div>
    ${S.tsv?`<textarea class="tsv" id="tsv" readonly>${esc(S.tsv)}</textarea>`:''}
  </div>
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">실적 육각형 · 학과 결산</h2></div>
    <p class="msg">담당 교수가 <b>확인</b>한 실적만으로 ① 실적 육각형의 학과 기준(6개 축별 10·25·50·75·90% 값)과 ② 학과 결산(연도·학기별 건수와 상위 실적)을 만들어 게시합니다. 결산은 <b>교수 이름 없이</b> 모든 링크의 <b>학과 결산</b> 탭에 보이고, 논문 제목 등은 그대로 나와요. 학기 말 검토가 끝난 뒤 눌러 주세요. 마지막 게시: <b>${esc((S.data.bench||{}).at||'없음')}</b></p>
    <div class="export"><button class="btn primary" data-act="publish">집계 게시</button></div></div>${setupPanels()}`;
}
function linkPanel(){
  return `<div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">개인 링크 · 관리자 권한</h2></div>
    <p class="msg">링크를 가진 사람은 누구나 그 교수님 자료를 입력·수정할 수 있어요. 해당 교수님(과 입력을 맡은 학생)에게만 보내 주세요.</p>
    <p class="msg">관리자 권한은 <b>여러 명</b>에게 줄 수 있어요. 권한을 바꾸고 싶으면 <b>링크 목록 보기</b>를 눌러서 바꿔 주세요.</p>
    <div class="export"><button class="btn primary" data-act="links">${S.links?'링크 목록 접기':'링크 목록 보기'}</button>${S.links?'<button class="btn" data-act="copylinks">전체 복사 (이름·링크)</button>':''}</div>
    ${S.links?`<div class="tablebox" style="margin-top:10px"><table><thead><tr><th>이름</th><th>권한</th><th>링크</th><th></th></tr></thead><tbody>${S.links.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(roleText(l))}</td><td class="mono" style="user-select:all;word-break:break-all">${esc(linkOf(l.id))}</td><td><button class="btn ghost sm" data-copy="${esc(linkOf(l.id))}">복사</button>${l.id===S.key?'<span class="msg">지금 쓰는 링크</span>':`<button class="btn ghost sm" data-admin="${l.id}" data-on="${l.admin?'':'1'}">${l.admin?'관리자 해제':'관리자 권한 주기'}</button><button class="btn ghost sm" data-delkey="${l.id}">삭제</button>`}</td></tr>`).join('')}</tbody></table></div>`:''}
    <div class="export" style="margin-top:12px"><input id="nk-name" placeholder="이름 (예: BK 사무국 ○○○)" style="max-width:220px" aria-label="새 링크 이름">
      <select id="nk-role" aria-label="새 링크 권한"><option value="admin">관리자 (전체 보기·취합·링크 관리)</option>${S.data.profs.map(p=>`<option value="${p.id}">${esc(p.name)} 교수님 대신 입력</option>`).join('')}</select>
      <button class="btn" data-act="newkey">링크 만들기</button></div></div>`;
}
function setupPanels(){
  return `<div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">마감일</h2></div>
    <div class="export"><input id="deadline" value="${esc(S.data.deadline)}" style="max-width:240px" aria-label="마감일"><button class="btn" data-act="deadline">저장</button></div></div>
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">증빙 파일 저장소 (구글 드라이브)</h2></div>
    <p class="msg">Apps Script 웹 앱 주소를 넣으면 실적마다 <b>증빙 첨부</b> 버튼이 생기고, 파일은 드라이브 <b>BK21_증빙/교수명/항목</b> 폴더에 저장돼요.</p>
    <div class="export"><input id="upurl" value="${esc(S.data.uploadUrl)}" placeholder="https://script.google.com/macros/s/…/exec" aria-label="업로드 주소"><button class="btn" data-act="upurl">저장</button></div></div>
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">JCR 자료 (IF · 상위 %)</h2></div>
    <p class="msg"><b>표준 형식 CSV</b>(연도·저널명·ISSN·eISSN·IF·상위%·분야)만 올릴 수 있어요. JCR 원본은 폴더의 <span class="mono">JCR/jcr_convert.py</span>로 먼저 변환하세요(<span class="mono">JCR/표준</span>에 저장됨). 올리면 논문 자동 채우기 때 <b><b>출판 당시 JCR</b>(7월 이후 출판은 전년도, 1–6월은 전전년도)과 <b>기준 연도 JCR</b>(신청용, 예: 올해 기준) 두 가지 IF·상위 %가 들어가요. 여러 파일을 한꺼번에 올려도 되고, 같은 저널은 가장 좋은 상위 %를 씁니다. 저장된 연도: <b>${S.data.jcrYears.length?S.data.jcrYears.slice().sort().join(', '):'없음'}</b></p>
    <div class="export"><input type="file" id="jcr-file" accept=".xlsx,.xls,.csv" multiple style="max-width:300px"><button class="btn" data-act="jcrup">올리기</button>
      </div>
    <div class="export"><span class="msg">기준 연도 JCR</span><select id="jcr-base" style="width:auto" aria-label="기준 연도 JCR"><option value="">선택</option>${S.data.jcrYears.slice().sort().reverse().map(y=>`<option ${String(y)===String(S.data.jcrBase)?'selected':''}>${y}</option>`).join('')}</select>
      <button class="btn" data-act="jcrfill">논문 IF·JCR 채우기</button></div><p class="msg" id="jcr-msg"></p></div>
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">초기 데이터 가져오기</h2></div>
    <p class="msg">seed.json 을 고르면 교수·담당 교수 명단·실적이 저장됩니다. <b>같은 번호의 자료를 덮어쓰니</b> 처음 한 번만 쓰세요.</p>
    <div class="export"><input type="file" id="seed-file" accept=".json,application/json" style="max-width:320px"><button class="btn" data-act="seed">가져오기</button><span class="msg" id="seed-msg"></span></div></div>
  <div class="panel" style="margin-top:18px"><div class="head"><h2 style="font-size:17px">지도학생 명단 추가</h2></div>
    <p class="msg">학생 명단 json(예: roster4.json)을 고르면 <b>지도학생 명단에 없는 학생만 새로 추가</b>합니다. 같은 교수님 명단에 같은 이름이 이미 있으면 건너뛰고, 기존 자료는 고치지 않아요. 여러 번 눌러도 중복되지 않습니다.</p>
    <div class="export"><input type="file" id="roster-file" accept=".json,application/json" style="max-width:320px"><button class="btn" data-act="rosteradd">추가</button><span class="msg" id="roster-msg"></span></div></div>`;
}

/* ===== 엑셀 ===== */
function rangeYM(){const f=ymOf(S.range.from),t=ymOf(S.range.to);return {f:f||0,t:t||999912}}
function inRange(i){
  if(!S.range.from&&!S.range.to) return true;
  const {f,t}=rangeYM(), inYM=k=>{if(!k)return true;if(k%100===0){const y=k/100;return y>=Math.floor(f/100)&&y<=Math.floor(t/100)}return k>=f&&k<=t};
  if(i.cat==='grant'){const a=ymOf(i.f.start),b=ymOf(i.f.end)||999912;if(!a)return true;return a<=t&&b>=f}
  if(i.cat==='roster'){const a=ymOf(i.f.admit),b=ymOf(i.f.grad);return (!a||a<=t)&&(!b||b>=f)}
  return inYM(dkey(i));
}
function catRows(ck){
  const c=CAT[ck];
  const cols=c.fields.flatMap(f=>f.t==='years'?YEARS.map(y=>({l:y+' 입금액',get:x=>(x[f.k]||{})[y]||''})):[{l:f.l,get:x=>Array.isArray(x[f.k])?x[f.k].join(', '):(x[f.k]??'')}]);
  const head=['교수','기초/임상',...cols.map(x=>x.l),'1차조사','참고','검토','검토 의견','증빙'];
  const rows=S.data.items.filter(i=>i.cat===ck&&inRange(i)).map(i=>{const p=prof(i.prof)||{};return [p.name,p.type,...cols.map(x=>x.get(i.f)),i.pre?'예':'',i.memo||'',{ok:'확인',fix:'수정 요청',none:'검토 전'}[i.rv.s],i.rv.c||'',(i.files||[]).map(x=>x.url).join(' ')]})
    .sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'ko'));
  if(ck==='collab') S.data.profs.forEach(p=>intlAuto(p.id).filter(a=>inRange({cat:'collab',f:{year:a.year}})).forEach(a=>rows.push([p.name,p.type,a.output,a.partner,a.inst,a.year,'',a.src+'에서 자동','','',''])));
  return [head,...rows];
}
function exportXlsx(){
  if(!window.XLSX){toast('엑셀 도구를 불러오지 못했어요');return}
  const wb=XLSX.utils.book_new();
  const ph=[['교수','기초/임상','직급','연구자등록번호','국내 최초 임용일','기금교수','담당 교수','확인 완료','실적 건수','수정 요청','최근 수정']]
    .concat(S.data.profs.map(p=>{const st=stats(p);return [p.name,p.type,p.rank||'',p.rid||'',p.hired||'',/^기금교수/.test(p.rank||'')?'예':(p.rank?'아니오':''),revName(p.rev),st.done+'/'+CATS.length,st.n,st.fix,p.updated||'']}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ph),'교수 현황');
  CATS.forEach(c=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(catRows(c.key)),c.name.replace(/[\\/?*\[\]:]/g,'·').slice(0,31)));
  const d=new Date(), rg=(S.range.from||S.range.to)?`_${(S.range.from||'처음').replace('-','')}-${(S.range.to||'현재').replace('-','')}`:'';XLSX.writeFile(wb,`BK21_실적조사${rg}_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.xlsx`);
}

/* ===== 개인 링크 ===== */
const linkOf=k=>BASE_URL+'?k='+k;
function roleText(l){const r=[];if(l.admin)r.push('관리자');if(l.prof)r.push('교수'+((prof(l.prof)||{}).name&&(prof(l.prof).name!==l.name)?' ('+prof(l.prof).name+' 대리)':''));if(l.rev)r.push('담당 교수');return r.join(' · ')||'—'}
function newToken(){const a=new Uint8Array(16);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function loadLinks(){try{const q=await db.collection('keys').get();S.links=q.docs.map(docOf).sort((a,b)=>a.name.localeCompare(b.name,'ko'))}catch(e){fail(e)}render()}
async function setAdmin(id,on){
  const l=(S.links||[]).find(x=>x.id===id); if(!l||id===S.key) return;
  const only=!l.prof&&!l.rev; // 관리자 전용 링크는 권한을 빼면 쓸 데가 없으니 링크를 지운다
  if(!on&&!confirm(only?`${l.name} 님의 관리자 링크를 삭제할까요?\n이 링크로는 더 이상 들어올 수 없어요.`:`${l.name} 님 링크에서 관리자 권한을 뺄까요?\n링크는 그대로 쓸 수 있고 관리자 화면만 사라져요.`)) return;
  try{
    if(on) await db.doc('keys/'+id).update({admin:true});
    else if(only) await db.doc('keys/'+id).delete();
    else await db.doc('keys/'+id).update({admin:firebase.firestore.FieldValue.delete()});
    await loadLinks(); toast(on?l.name+' 님께 관리자 권한을 드렸어요':l.name+' 님의 관리자 권한을 해제했어요');
  }catch(e){fail(e)}
}
async function delKey(id){
  const l=(S.links||[]).find(x=>x.id===id); if(!l||id===S.key) return;
  if(l.rev){toast('담당 교수 권한이 있는 링크예요. 먼저 담당 교수 칸에서 권한을 해제해 주세요',4500);return}
  const only=l.prof&&S.links.filter(x=>x.prof===l.prof).length<=1;
  if(!confirm(`'${l.name}' 링크를 삭제할까요?\n이 링크로는 더 이상 들어올 수 없어요.`+(only?`\n\n${(prof(l.prof)||{}).name||''} 교수님 링크가 이것 하나뿐이에요. 지우면 교수님이 들어올 수 없어요 (실적 자료는 그대로 남아요).`:''))) return;
  try{await db.doc('keys/'+id).delete();await loadLinks();toast('링크를 삭제했어요')}catch(e){fail(e)}
}
async function newKey(){
  const name=$('#nk-name').value.trim(), r=$('#nk-role').value; if(!name){toast('이름을 넣어 주세요');$('#nk-name').focus();return}
  const t=newToken(), x=r==='admin'?{name,admin:true}:{name,prof:r};
  try{await db.doc('keys/'+t).set(x);await loadLinks();toast('링크를 만들었어요')}catch(e){fail(e)}
}

/* ===== 교수 추가·삭제 ===== */
async function addProf(){
  const name=$('#np-name').value.trim(); if(!name){toast('이름을 넣어 주세요');$('#np-name').focus();return}
  if(S.data.profs.some(p=>p.name===name)&&!confirm(name+' 교수님이 이미 있어요. 그래도 추가할까요?')) return;
  const ref=db.collection('profs').doc(), t=newToken();
  const p={name,type:$('#np-type').value,rank:$('#np-rank').value,rid:$('#np-rid').value.trim(),hired:'',fund:'',rev:$('#np-rev').value,done:{},updated:''};
  try{const b=db.batch();b.set(ref,p);b.set(db.doc('keys/'+t),{name,prof:ref.id});await b.commit();
    putProf(Object.assign({id:ref.id},p)); if(S.links) await loadLinks();
    render(); toast(name+' 교수님을 추가했어요. 개인 링크는 "링크 목록 보기"에 있어요');
  }catch(e){fail(e)}
}
async function delProf(pid){
  const p=prof(pid); if(!p) return; const n=itemsOf(pid).length;
  if(!confirm(`${p.name} 교수님을 삭제할까요?\n입력된 실적 ${n}건과 개인 링크도 함께 지워지고, 되돌릴 수 없어요.`)) return;
  try{
    const [it,ks,qs]=await Promise.all([db.collection('items').where('prof','==',pid).get(),db.collection('keys').where('prof','==',pid).get(),safe(db.collection('qna').where('prof','==',pid))]);
    // 관리자·담당 교수 링크는 지우지 않고 교수 연결만 뗀다
    const ops=[...it.docs.map(d=>[d.ref]),...qs.docs.map(d=>[d.ref]),...ks.docs.map(d=>{const x=d.data();return x.admin||x.rev?[d.ref,{prof:firebase.firestore.FieldValue.delete()}]:[d.ref]}),[db.doc('profs/'+pid)]];
    for(let k=0;k<ops.length;k+=400){const b=db.batch();ops.slice(k,k+400).forEach(([r,u])=>u?b.update(r,u):b.delete(r));await b.commit()}
    S.data.profs=S.data.profs.filter(x=>x.id!==pid); S.data.items=S.data.items.filter(x=>x.prof!==pid); S.data.qna=S.data.qna.filter(x=>x.prof!==pid);
    if(S.links) await loadLinks();
    render(); toast(p.name+' 교수님을 삭제했어요');
  }catch(e){fail(e)}
}

/* ===== 담당 교수 권한 ===== */
async function grantRev(){
  const pid=$('#gr-prof').value, p=prof(pid); if(!p){toast('교수님을 골라 주세요');return}
  const n=Math.max(-1,...S.data.reviewers.map(r=>+String(r.id).replace(/\D/g,'')||0))+1, rid='r'+n;
  try{
    const ks=(await db.collection('keys').where('prof','==',pid).get()).docs.filter(d=>d.data().name===p.name);
    const b=db.batch(); b.set(db.doc('reviewers/'+rid),{name:p.name,major:''});
    if(ks.length) ks.forEach(d=>b.update(d.ref,{rev:rid})); else b.set(db.doc('keys/'+newToken()),{name:p.name,prof:pid,rev:rid});
    await b.commit(); S.data.reviewers.push({id:rid,name:p.name,major:''}); if(S.links) await loadLinks();
    render(); toast(p.name+' 교수님께 담당 교수 권한을 드렸어요');
  }catch(e){fail(e)}
}
async function revokeRev(rid){
  const r=S.data.reviewers.find(x=>x.id===rid); if(!r) return;
  const n=S.data.profs.filter(p=>p.rev===rid).length;
  if(!confirm(`${r.name} 교수님의 담당 교수 권한을 해제할까요?`+(n?`\n맡고 있던 교수님 ${n}명은 미배정이 됩니다.`:''))) return;
  try{
    const [ks,ps]=await Promise.all([db.collection('keys').where('rev','==',rid).get(),db.collection('profs').where('rev','==',rid).get()]);
    const b=db.batch(); b.delete(db.doc('reviewers/'+rid));
    ks.docs.forEach(d=>b.update(d.ref,{rev:firebase.firestore.FieldValue.delete()}));
    ps.docs.forEach(d=>b.update(d.ref,{rev:''}));
    await b.commit();
    S.data.reviewers=S.data.reviewers.filter(x=>x.id!==rid); S.data.profs.forEach(p=>{if(p.rev===rid)p.rev=''}); if(S.links) await loadLinks();
    render(); toast(r.name+' 교수님의 담당 교수 권한을 해제했어요');
  }catch(e){fail(e)}
}

/* ===== 담당 교수 일괄 배정 ===== */
async function bulkAssign(){
  const msg=$('#ba-msg'), lines=$('#ba-text').value.split('\n').map(x=>x.trim()).filter(Boolean);
  const upd=[], miss=[], badRev=[], seen=new Set();
  lines.forEach(l=>{const m=l.match(/^([^:：]+)[:：](.*)$/);if(!m)return;
    const rn=m[1].replace(/\(.*?\)/g,'').trim(), r=S.data.reviewers.find(x=>x.name===rn); if(!r){badRev.push(rn);return}
    m[2].split(/[,，、\s]+/).map(x=>x.trim()).filter(Boolean).forEach(n=>{const p=S.data.profs.find(x=>x.name===n);if(!p){miss.push(n);return}seen.add(p.id);if(p.rev!==r.id)upd.push([p,r])})});
  if(badRev.length){msg.textContent='담당 교수 목록에 없는 이름: '+badRev.join(', ')+' — 먼저 권한을 주세요';msg.className='msg err';return}
  if(!upd.length){msg.textContent='바뀌는 배정이 없어요.'+(miss.length?' 명단에 없는 이름: '+miss.join(', '):'');msg.className='msg';return}
  if(!confirm(`${upd.length}명의 담당 교수를 바꿀까요?`+(miss.length?`\n교수 명단에 없는 이름(건너뜀): ${miss.join(', ')}`:''))) return;
  try{const b=db.batch();upd.forEach(([p,r])=>b.update(db.doc('profs/'+p.id),{rev:r.id}));await b.commit();upd.forEach(([p,r])=>p.rev=r.id);
    const rest=S.data.profs.filter(p=>!seen.has(p.id)&&!S.data.reviewers.some(r=>r.name===p.name)).map(p=>p.name);
    render(); const m2=$('#ba-msg'); m2.closest('details').open=true;
    m2.textContent=`${upd.length}명 바꿨어요.`+(miss.length?` 명단에 없는 이름: ${miss.join(', ')}.`:'')+(rest.length?` 표에 없어 그대로 둔 교수: ${rest.join(', ')}`:'');
  }catch(e){fail(e)}
}

async function rosterAdd(){
  const f=$('#roster-file').files[0], msg=$('#roster-msg'); if(!f){msg.textContent='파일을 먼저 고르세요.';return}
  try{
    const d=JSON.parse(await f.text());
    // 이름 비교: 한글만 / 영문만 따로 떼어 하나라도 같으면 같은 학생 (외국인 이름 표기 차이 대응)
    const keys=(pid,v)=>{const s=String(v||''),h=s.replace(/[^가-힣]/g,''),l=s.replace(/[^A-Za-z]/g,'').toLowerCase();return [h&&pid+'|h|'+h,l&&pid+'|l|'+l].filter(Boolean)};
    await loadAll(); // 최신 명단 기준으로 중복 확인
    const have=new Set(S.data.items.filter(i=>i.cat==='roster').flatMap(i=>keys(i.prof,i.f.name)));
    const add=[],skip=[],noProf=[], pidOf=v=>prof(v)?v:(S.data.profs.find(p=>p.name===v)||{}).id; // 교수는 번호 대신 이름으로 적어도 됨
    let copied=0;
    (d.students||[]).map(x0=>{const x=Object.assign({},x0,{prof:pidOf(x0.prof)});
      // copyFrom: 공동지도 교수 명단에 같은 이름의 학생이 있으면 그 정보(학번·입학 연월 등)를 그대로 가져옴
      const src=x0.copyFrom&&x0.f&&S.data.items.find(i=>i.cat==='roster'&&i.prof===pidOf(x0.copyFrom)&&i.f.name===x0.f.name);
      if(src){x.f=Object.assign({},x0.f,src.f);x.memo=[src.memo,x0.memo].filter(Boolean).join(' · ');copied++}
      return x}).forEach(x=>{const k=keys(x.prof,x.f&&x.f.name);
      if(!prof(x.prof)||!k.length)noProf.push(x); else if(k.some(z=>have.has(z)))skip.push(x); else{k.forEach(z=>have.add(z));add.push(x)}});
    if(!add.length){msg.textContent=`추가할 학생이 없어요 (이미 있음 ${skip.length}명).`;return}
    if(!confirm(`${add.length}명을 새로 추가합니다.${copied?` (공동지도 교수 명단에서 정보를 가져온 학생 ${copied}명)`:''} 이미 있는 ${skip.length}명은 건너뜁니다.${noProf.length?` 교수 정보가 없는 ${noProf.length}건도 건너뜁니다.`:''} 계속할까요?`))return;
    msg.textContent='저장 중…';
    for(let k=0;k<add.length;k+=400){const b=db.batch();
      add.slice(k,k+400).forEach(x=>b.set(db.collection('items').doc(),{prof:x.prof,cat:'roster',pre:1,f:x.f,memo:x.memo||'',rv:{s:'none',c:''},updatedAt:TS()}));
      await b.commit(); msg.textContent=`저장 중… ${Math.min(k+400,add.length)} / ${add.length}`}
    msg.textContent=`${add.length}명 추가, ${skip.length}명은 이미 있어 건너뛰었어요.`; await refresh();
  }catch(e){console.error(e);msg.textContent='추가하지 못했어요: '+(e.message||e)}
}
async function seedImport(){
  const f=$('#seed-file').files[0], msg=$('#seed-msg'); if(!f){msg.textContent='파일을 먼저 고르세요.';return}
  try{
    const d=JSON.parse(await f.text()); msg.textContent='저장 중…';
    const ops=[];
    (d.reviewers||[]).forEach(r=>{const {id,...x}=r;ops.push(['reviewers/'+id,x])});
    (d.profs||[]).forEach(p=>{const {id,...x}=p;ops.push(['profs/'+id,x])});
    (d.items||[]).forEach(i=>{const {id,...x}=i;ops.push(['items/'+id,x])});
    (d.keys||[]).forEach(k=>{const {id,...x}=k;ops.push(['keys/'+id,x])});
    ops.push(['config/app',{deadline:d.deadline||'추후 공지'}]);
    for(let k=0;k<ops.length;k+=400){const b=db.batch();ops.slice(k,k+400).forEach(([path,x])=>b.set(db.doc(path),x,{merge:true}));await b.commit();msg.textContent=`저장 중… ${Math.min(k+400,ops.length)} / ${ops.length}`}
    msg.textContent=`${ops.length}건 저장했어요.`; await refresh();
  }catch(e){console.error(e);msg.textContent='가져오지 못했어요: '+(e.message||e)}
}
