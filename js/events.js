// 클릭·입력·저장 이벤트, 시작
/* ===== 이벤트 ===== */
document.addEventListener('click',async e=>{
  const b=e.target.closest('button,tr.click'); if(!b) return;
  if(b.dataset.role){S.role=b.dataset.role;S.open=null;S.cat='home';S.editing=null;S.tsv='';await refresh();return}
  if(b.dataset.cat){S.cat=b.dataset.cat;S.editing=null;render();return}
  if(b.dataset.goto){S.cat=b.dataset.goto;render();return}
  if(b.dataset.open&&!e.target.closest('select')){S.open=b.dataset.open;S.cat='home';if(S.role==='rev'){S.busy=true;render();try{await loadProf(S.open)}catch(er){fail(er)}S.busy=false}render();return}
  const pid=curPid();
  if(b.dataset.delprof){await delProf(b.dataset.delprof);return}
  if(b.dataset.shareform){await shareForm(b.dataset.shareform);return}
  if(b.dataset.attach){S.attachFor=b.dataset.attach;const fp=$('#filepick');fp.value='';fp.click();return}
  if(b.dataset.unfile){await unfile(b.dataset.unfile,b.dataset.fid);return}
  if(b.dataset.revoke){await revokeRev(b.dataset.revoke);return}
  if(b.dataset.admin){await setAdmin(b.dataset.admin,!!b.dataset.on);return}
  if(b.dataset.delkey){await delKey(b.dataset.delkey);return}
  if(b.dataset.expand){const id=b.dataset.expand;S.expanded.has(id)?S.expanded.delete(id):S.expanded.add(id);render();return}
  if(b.dataset.edit){S.editing=b.dataset.edit;render();return}
  if(b.dataset.del){
    if(!b.dataset.confirm){b.dataset.confirm=1;b.textContent='삭제 확인';b.classList.add('warn');return}
    try{await db.doc('items/'+b.dataset.del).delete();S.data.items=S.data.items.filter(x=>x.id!==b.dataset.del);await touchProf(pid);toast('삭제했어요')}catch(er){fail(er)} render();return}
  if(b.dataset.rv){const it=S.data.items.find(x=>x.id===b.dataset.id);let rv;
    if(b.dataset.rv==='fix'){const c=$('#c-'+it.id).value.trim();if(!c){toast('수정 요청 내용을 적어 주세요');$('#c-'+it.id).focus();return}rv={s:'fix',c}}else rv={s:b.dataset.rv==='none'?'none':'ok',c:''};
    try{await db.doc('items/'+it.id).update({rv,reviewedAt:TS()});it.rv=rv;toast({ok:'확인 처리했어요',fix:'수정 요청을 남겼어요',none:'확인을 취소했어요'}[rv.s])}catch(er){fail(er)} render();return}
  if(b.dataset.ask){const t=$('#q-new'),q=t.value.trim();if(!q){toast('질문을 적어 주세요');t.focus();return}
    const x={prof:pid,cat:b.dataset.ask,q,by:S.name||'',at:TS(),a:'',aby:''};
    try{const ref=await db.collection('qna').add(x);S.data.qna.push(Object.assign({},x,{id:ref.id,at:new Date()}));toast('질문을 남겼어요. 답변이 달리면 여기에 보여요')}catch(er){fail(er)} render();return}
  if(b.dataset.ans){const q=S.data.qna.find(x=>x.id===b.dataset.ans),a=$('#a-'+q.id).value.trim();if(!a){toast('답변을 적어 주세요');$('#a-'+q.id).focus();return}
    const upd={a,aby:S.name||'',aat:TS()};try{await db.doc('qna/'+q.id).update(upd);Object.assign(q,upd,{aat:new Date()});toast('답변을 달았어요')}catch(er){fail(er)} render();return}
  if(b.dataset.openq){S.open=b.dataset.openq;S.cat=CAT[b.dataset.qcat]?b.dataset.qcat:'home';S.editing=null;render();scrollTo(0,0);return}
  if(b.dataset.delq){if(!confirm('이 질문을 지울까요?'))return;try{await db.doc('qna/'+b.dataset.delq).delete();S.data.qna=S.data.qna.filter(x=>x.id!==b.dataset.delq);toast('질문을 지웠어요')}catch(er){fail(er)} render();return}
  if(b.dataset.reply){const x=S.data.board.find(y=>y.id===b.dataset.reply),r=$('#r-'+x.id).value.trim();
    try{await db.doc('board/'+x.id).update({reply:r,rby:S.name||''});x.reply=r;x.rby=S.name||'';toast(r?'답글을 달았어요':'답글을 지웠어요')}catch(er){fail(er)} render();return}
  if(b.dataset.delpost){if(!confirm('이 건의사항을 지울까요?'))return;try{await db.doc('board/'+b.dataset.delpost).delete();S.data.board=S.data.board.filter(x=>x.id!==b.dataset.delpost);toast('지웠어요')}catch(er){fail(er)} render();return}
  const act=b.dataset.act;
  if(b.dataset.copy){try{await navigator.clipboard.writeText(b.dataset.copy);toast('링크를 복사했어요')}catch(_){toast('링크 칸을 눌러 선택한 뒤 복사해 주세요')}return}
  if(act==='refresh') await refresh();
  if(act==='theme'){const t=curTheme()==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t)}catch(er){}render()}
  if(act==='back'){S.open=null;S.cat='home';S.editing=null;await refresh()}
  if(act==='add'){S.editing='new';render();const f=document.querySelector('form.edit input,form.edit select');f&&f.focus()}
  if(act==='cancel'){S.editing=null;render()}
  if(act==='done'){const v=(prof(pid).done||{})[S.cat]?0:1;try{await touchProf(pid,{['done.'+S.cat]:v});toast(v?CAT[S.cat].name+' 확인 완료':'확인 완료를 취소했어요')}catch(er){fail(er)} render()}
  if(act==='doi') await doiFill();
  if(act==='aifill') await aiFill();
  if(act==='aikey-clear'){setAiKey('');$('#ai-key').value='';toast('API 키를 지웠어요')}
  if(act==='xlsx') exportXlsx();
  if(act==='copy'){S.exportCat=$('#exp-cat').value;S.tsv=catRows(S.exportCat).map(r=>r.map(v=>String(v??'').replace(/[\t\n]/g,' ')).join('\t')).join('\n');render();
    try{await navigator.clipboard.writeText(S.tsv);toast('복사했어요. 엑셀에 붙여 넣으세요')}catch(_){const t=$('#tsv');t.focus();t.select();toast('아래 내용을 선택해 복사해 주세요')}}
  if(act==='seed') await seedImport();
  if(act==='rosteradd') await rosterAdd();
  if(act==='links'){if(S.links){S.links=null;render()}else await loadLinks()}
  if(act==='newkey') await newKey();
  if(act==='addprof') await addProf();
  if(act==='grantrev') await grantRev();
  if(act==='bulkassign') await bulkAssign();
  if(act==='jcrup') await jcrUpload();
  if(act==='jcrfill') await jcrFill();
  if(act==='publish') await publishAgg();
  if(act==='post'){const t=$('#bd-new'),v=t.value.trim();if(!v){toast('내용을 적어 주세요');t.focus();return}
    const x={text:v,by:S.name||'',at:TS(),reply:'',rby:''};
    try{const ref=await db.collection('board').add(x);S.data.board.unshift(Object.assign({},x,{id:ref.id,at:new Date()}));toast('올렸어요')}catch(er){fail(er)} render()}
  if(act==='upurl'){const v=$('#upurl').value.trim();if(v&&!/^https:\/\/script\.google\.com\/.+\/exec$/.test(v)){toast('…/exec 로 끝나는 Apps Script 주소를 넣어 주세요');return}
    try{await db.doc('config/app').set({uploadUrl:v},{merge:true});S.data.uploadUrl=v;toast(v?'업로드 주소를 저장했어요':'업로드를 껐어요')}catch(er){fail(er)}}
  if(act==='copylinks'){const t=S.links.map(l=>l.name+'\t'+linkOf(l.id)).join('\n');try{await navigator.clipboard.writeText(t);toast('복사했어요. 엑셀에 붙여 넣으세요')}catch(_){toast('복사하지 못했어요. 링크 칸을 직접 선택해 주세요')}}
  if(act==='deadline'){const v=$('#deadline').value.trim();try{await db.doc('config/app').set({deadline:v},{merge:true});S.data.deadline=v;toast('마감일을 저장했어요')}catch(er){fail(er)}}
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='me-rev'){S.me.rev=t.value||null;S.open=null;await refresh();return}
  if(t.id==='flt'){S.filterFix=t.checked;render();return}
  if(t.id==='recap-p'){S.recapP=t.value;render();return}
  if((t.name==='start'||t.name==='end')&&t.form&&t.form.querySelector('[data-years]')){const box=t.form.querySelector('[data-years]'),k=box.dataset.years,cur={};
    box.querySelectorAll('input').forEach(x=>{if(x.value.trim())cur[x.name.slice(k.length+1)]=x.value.trim()});box.innerHTML=yearBoxes(k,{start:t.form.elements.start.value,end:t.form.elements.end.value},cur);return}
  if(t.name==='degree'&&t.form&&t.form.elements.status){const st=t.form.elements.status,cur=st.value;st.innerHTML='<option value="">선택</option>'+STATUS_OF(t.value).map(o=>`<option ${o===cur?'selected':''}>${esc(o)}</option>`).join('');return}
  if(t.id==='jcr-base'){try{await db.doc('config/app').set({jcrBase:t.value},{merge:true});S.data.jcrBase=t.value;toast(t.value?`기준 연도를 ${t.value} JCR로 정했어요. "논문 IF·JCR 채우기"를 누르면 반영돼요`:'기준 연도를 지웠어요',4000)}catch(er){fail(er)}return}
  if(t.id==='filepick'){const f=t.files[0];if(f&&S.attachFor)await uploadFile(S.attachFor,f);return}
  if(t.id==='rg-from'||t.id==='rg-to'){S.range[t.id==='rg-from'?'from':'to']=t.value;S.tsv='';return}
  if(t.id==='top-pick'){const i=S.data.items.find(x=>x.id===t.value);if(!i)return;const f=i.f,el=t.closest('form').elements;
    const type=i.cat==='paper'?'논문':({등록특허:'특허',기술이전:'기술이전',저서:'저서',북챕터:'북챕터'}[f.kind]||'기타');
    const out=i.cat==='paper'?[f.title,f.journal&&(f.journal+(f.ym?' ('+f.ym+')':'')),f.vol,f.pages,f.doi&&('DOI '+f.doi)].filter(Boolean).join('. '):[f.kind,f.title,f.country,f.number].filter(Boolean).join(' · ');
    el.ttype.value=type; el.year.value=String(f.ym||f.date||'').slice(0,4); el.output.value=out;
    if(f.merit&&!el.desc.value.trim()){el.desc.value=f.merit;el.desc.dispatchEvent(new Event('input',{bubbles:true}))}
    return}
  if(t.id==='promo-from'){const pid=curPid();S.promoFrom[pid]=t.value;try{localStorage.setItem('promoFrom:'+pid,t.value)}catch(er){} render();return}
  if(t.dataset.pf){try{await touchProf(curPid(),{[t.dataset.pf]:t.value.trim()});toast('저장했어요')}catch(er){fail(er)} render();return}
  if(t.dataset.assign){const r=S.data.reviewers.find(x=>x.id===t.value);try{await db.doc('profs/'+t.dataset.assign).update({rev:t.value});const p=prof(t.dataset.assign);p.rev=t.value;toast('담당 교수를 바꿨어요')}catch(er){fail(er)}return}
  if(t.name&&t.closest('.checks')){const box=t.closest('.checks');const fd=CAT[box.closest('form').dataset.cat].fields.find(f=>f.k===t.name);
    if(fd.max&&box.querySelectorAll('input:checked').length>fd.max){t.checked=false;toast(`최대 ${fd.max}개까지 고를 수 있어요`)}}
});
document.addEventListener('toggle',e=>{const k=e.target.dataset&&e.target.dataset.fold;if(k)S.fold[k]=e.target.open},true);
document.addEventListener('input',e=>{
  if(e.target.id==='ai-key')setAiKey(e.target.value.trim());
  if(e.target.dataset.max){const n=e.target.value.replace(/\s/g,'').length,m=+e.target.dataset.max;const c=document.querySelector(`[data-ctr="${e.target.name}"]`);c.textContent=`${n} / ${m}자 (공백 제외)`;c.classList.toggle('over',n>m)}
});
document.addEventListener('keydown',e=>{if(e.target.id==='ai-key'&&e.key==='Enter')e.preventDefault()}); // 키 칸에서 엔터로 저장되지 않게
document.addEventListener('submit',async e=>{
  e.preventDefault(); const form=e.target;
  const c=CAT[form.dataset.cat], f={}, miss=[];
  c.fields.forEach(fd=>{
    if(fd.t==='multi') f[fd.k]=[...form.querySelectorAll(`input[name="${fd.k}"]:checked`)].map(x=>x.value);
    else if(fd.t==='student'&&fd.multi) f[fd.k]=[...form.querySelectorAll(`input[name="${fd.k}"]:checked`)].map(x=>x.value).join(', ');
    else if(fd.t==='years'){f[fd.k]={};form.querySelectorAll(`input[name^="${fd.k}."]`).forEach(x=>{const y=x.value.trim();if(y)f[fd.k][x.name.slice(fd.k.length+1)]=y})}
    else f[fd.k]=(form.elements[fd.k].value||'').trim();
    if(fd.req&&fd.t!=='years'&&(!f[fd.k]||(Array.isArray(f[fd.k])&&!f[fd.k].length))) miss.push(fd.l);
    if(fd.t==='area'&&(f[fd.k]||'').replace(/\s/g,'').length>fd.max) miss.push(fd.l+' 글자 수');
  });
  if(miss.length){$('#form-err').textContent='확인 필요: '+miss.join(', ');return}
  const pid=curPid(); const btn=form.querySelector('[type=submit]'); btn.disabled=true;
  try{
    if(form.dataset.id){const it=S.data.items.find(x=>x.id===form.dataset.id);const upd={f,updatedAt:TS()};if(it.rv.s==='fix')upd.rv={s:'none',c:''};if(form.elements.__memo)upd.memo=form.elements.__memo.value.trim();
      await db.doc('items/'+it.id).update(upd);it.f=f;if(upd.rv)it.rv=upd.rv;if('memo' in upd)it.memo=upd.memo}
    else{const x={prof:pid,cat:c.key,pre:0,f,memo:'',rv:{s:'none',c:''},updatedAt:TS()};const ref=await db.collection('items').add(x);S.data.items.push(Object.assign({id:ref.id},x))}
    await touchProf(pid,{['done.'+c.key]:0}); S.editing=null; toast('저장했어요');
  }catch(er){fail(er);btn.disabled=false;return}
  render();
});


/* ===== 시작 ===== */
S.key=(new URLSearchParams(location.search).get('k')||'').trim();
if(!S.key) showNoKey();
else auth.signInAnonymously().then(c=>boot(c.user)).catch(e=>{console.error(e);showNoKey({text:'접속하지 못했어요. 잠시 뒤 다시 열어 주세요.',err:1})});
