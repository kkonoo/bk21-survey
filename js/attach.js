// 연구비 지분확인서 양식, 증빙 첨부
/* ===== 연구비 지분확인서: 과제 정보를 채운 양식 (forms/share-confirmation-template.docx 의 {{칸}}을 바꿈) ===== */
const PERIOD_BLANK='20      .      .      .    ~    20      .      .      .';
async function shareForm(iid){
  const it=S.data.items.find(x=>x.id===iid); if(!it) return; const f=it.f, p=prof(it.prof)||{};
  try{
    if(!window.JSZip) await new Promise((res,rej)=>{const sc=document.createElement('script');sc.src='vendor/jszip-3.10.1.min.js';sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)});
    const zip=await JSZip.loadAsync(await (await fetch('forms/share-confirmation-template.docx')).arrayBuffer());
    const ymd=v=>{const m=String(v||'').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);return m?`${m[1]}. ${m[2].padStart(2,'0')}. ${m[3].padStart(2,'0')}.`:''};
    const num=v=>{const n=parseFloat(v);return isNaN(n)?'':n.toLocaleString()};
    const paid=f.paid||{}, sum=Object.values(paid).reduce((a,v)=>a+(parseFloat(v)||0),0);
    const V={title:f.title,program:f.program,ministry:f.ministry,period:ymd(f.start)&&ymd(f.end)?ymd(f.start)+'   ~   '+ymd(f.end):PERIOD_BLANK,
      total:num(f.total),name:p.name,rank:p.rank,share:f.share,psum:sum?sum.toLocaleString():''};
    YEARS.forEach(y=>V['p'+y]=num(paid[y])); // 참여연구원 지분 칸에는 입력해 둔 연도별 입금액을 넣음 (연구책임자가 확인·수정)
    const xml=(await zip.file('word/document.xml').async('string')).replace(/\{\{(\w+)\}\}/g,(_,k)=>esc(V[k]??''));
    zip.file('word/document.xml',xml);
    const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=('지분확인서_'+(p.name||'')+'_'+String(f.title||'').slice(0,30)+'.docx').replace(/[\\/:*?"<>|]/g,' ');
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  }catch(e){console.error(e);toast('양식을 만들지 못했어요. 잠시 뒤 다시 해 주세요')}
}

/* ===== 증빙 첨부 (구글 드라이브, Apps Script) ===== */
async function uploadFile(iid,file){
  const it=S.data.items.find(x=>x.id===iid); if(!it||!file) return;
  if(file.size>20*1024*1024){toast('20MB 이하 파일만 올릴 수 있어요');return}
  toast('올리는 중… '+file.name,120000);
  try{
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=rej;r.readAsDataURL(file)});
    const u=auth.currentUser, p=prof(it.prof)||{};
    const body=JSON.stringify({uid:u.uid,token:await u.getIdToken(),prof:p.name||it.prof,cat:CAT[it.cat].name,title:String(CAT[it.cat].title(it.f)||'').slice(0,40),name:file.name,mime:file.type||'application/octet-stream',data});
    const r=await (await fetch(S.data.uploadUrl,{method:'POST',body})).json();
    if(!r.ok) throw new Error(r.error||'upload');
    const x={id:r.id,n:r.name,url:r.url};
    await db.doc('items/'+iid).update({files:firebase.firestore.FieldValue.arrayUnion(x)});
    it.files=(it.files||[]).concat(x); render(); toast('증빙을 올렸어요');
  }catch(e){console.error(e);toast(e&&e.code?'권한이 없어 저장하지 못했어요':'올리지 못했어요. 잠시 뒤 다시 해 주세요')}
}
async function unfile(iid,fid){
  const it=S.data.items.find(x=>x.id===iid); if(!it) return;
  if(!confirm('이 증빙 파일 연결을 뗄까요? (드라이브의 파일은 남아 있어요)')) return;
  const list=(it.files||[]).filter(x=>x.id!==fid);
  try{await db.doc('items/'+iid).update({files:list});it.files=list;render()}catch(e){fail(e)}
}
