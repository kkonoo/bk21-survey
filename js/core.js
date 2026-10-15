// 설정·상태·공통 도구, 링크 접속, 데이터 읽기·쓰기, 로그인 후 역할 확인
/* ===== 설정 ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDSWcg7HGJjALSKpVLo1RGbtae9MMlLakU",
  authDomain: "bk21-survey.firebaseapp.com",
  projectId: "bk21-survey",
  storageBucket: "bk21-survey.firebasestorage.app",
  messagingSenderId: "283667097780",
  appId: "1:283667097780:web:8dcdbc9407e6260ccbcfe1"
};
// 접속: 교수님별 개인 링크 (?k=토큰). 관리자 토큰은 firestore.rules 에만 있어요.
const BASE_URL = location.origin+location.pathname;

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const TS = () => firebase.firestore.FieldValue.serverTimestamp();

/* ===== 상태 ===== */
const S = {data:{profs:[],items:[],reviewers:[],deadline:'추후 공지', uploadUrl:'', jcrYears:[], jcrBase:'', bench:null, recap:null, qna:[], board:[]}, user:null, key:'', name:'', links:null, roles:[], role:null,
  me:{prof:null,rev:null}, cat:'home', open:null, editing:null, filterFix:false, exportCat:'paper', tsv:'', busy:false, range:{from:'',to:''}, jcrCache:{}, attachFor:null};
const $ = s=>document.querySelector(s);
const esc = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m,ms){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,ms||2600)}
const curPid=()=>S.role==='prof'?S.me.prof:S.open;
const itemsOf=(p,c)=>S.data.items.filter(i=>i.prof===p&&(!c||i.cat===c));
const prof=id=>S.data.profs.find(p=>p.id===id);
const revName=id=>(S.data.reviewers.find(r=>r.id===id)||{}).name||'미배정';
const isAdmin=()=>S.roles.includes('admin');
function stats(p){const it=itemsOf(p.id);return {qw:S.data.qna.filter(q=>q.prof===p.id&&!q.a).length,n:it.length,fix:it.filter(i=>i.rv.s==='fix').length,ok:it.filter(i=>i.rv.s==='ok').length,done:CATS.filter(c=>(p.done||{})[c.key]).length}}
const today=()=>{const d=new Date();return String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')};
function fail(e){console.error(e);toast(e&&e.code==='permission-denied'?'권한이 없어 저장하지 못했어요':'저장하지 못했어요. 인터넷 연결을 확인해 주세요');}

/* ===== 접속 ===== */
function showNoKey(msg){
  $('#who').innerHTML=''; $('#seg').hidden=true;
  $('#app').innerHTML=`<div class="panel login"><h2>BK21 실적 입력</h2>
    <p class="msg ${msg&&msg.err?'err':''}">${esc(msg?msg.text:'안내 받은 교수님별 개인 링크로 들어와 주세요. 링크를 즐겨찾기 해 두시면 다음에도 바로 들어오실 수 있어요.')}</p></div>`;
}

/* ===== 데이터 읽기 ===== */
const ROLE_OLD={'제1저자':'1저자','교신저자':'교신','기타저자':'공저자','1저자(공동)':'1저자','교신(공동)':'교신'};
const ROLE_REDO=['공동 제1·교신','주저자 (제1/교신 미구분)'];
const docOf=d=>{const x=Object.assign({id:d.id},d.data());if(x.cat==='roster'&&x.f&&STATUS_OLD[x.f.status]&&!STATUS_OF(x.f.degree).includes(x.f.status))x.f.status=STATUS_OLD[x.f.status];if(x.cat==='roster'&&x.f&&MED_OLD[x.f.med])x.f.med=MED_OLD[x.f.med];if(x.cat==='paper'&&x.f&&ROLE_OLD[x.f.role])x.f.role=ROLE_OLD[x.f.role];if(x.cat==='roster'&&x.pre&&x.f&&x.f.bk===undefined)x.f.bk='예';return x};
async function loadCommon(){
  const [rv,cfg]=await Promise.all([db.collection('reviewers').get(),db.doc('config/app').get()]);
  S.data.reviewers=rv.docs.map(docOf).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  if(cfg.exists){const c=cfg.data();S.data.deadline=c.deadline||'추후 공지';S.data.uploadUrl=c.uploadUrl||'';S.data.jcrYears=c.jcrYears||[];S.data.jcrBase=c.jcrBase||'';S.data.bench=c.bench||null;S.data.recap=c.recap||null}
}
function putProf(p){const i=S.data.profs.findIndex(x=>x.id===p.id);if(i>=0)S.data.profs[i]=p;else S.data.profs.push(p);S.data.profs.sort((a,b)=>a.name.localeCompare(b.name,'ko'))}
function putItems(pid,list){S.data.items=S.data.items.filter(i=>i.prof!==pid).concat(list)}
// 질문·건의 컬렉션은 Firestore 규칙에서 막혀 있어도 나머지 화면은 그대로 돌게 빈 목록으로 받는다
const safe=q=>q.get().catch(e=>{console.warn(e);return {docs:[]}});
function putQs(pid,list){S.data.qna=S.data.qna.filter(q=>q.prof!==pid).concat(list)}
async function loadProf(pid){
  const [p,it,qs]=await Promise.all([db.doc('profs/'+pid).get(),db.collection('items').where('prof','==',pid).get(),safe(db.collection('qna').where('prof','==',pid))]);
  if(p.exists) putProf(docOf(p)); putItems(pid,it.docs.map(docOf)); putQs(pid,qs.docs.map(docOf));
}
async function loadReviewer(rid){
  const r=S.data.reviewers.find(x=>x.id===rid); if(!r) return;
  const q=db.collection('profs').where('rev','==',rid);
  const ps=(await q.get()).docs.map(docOf); ps.forEach(putProf);
  await Promise.all(ps.map(p=>Promise.all([db.collection('items').where('prof','==',p.id).get(),safe(db.collection('qna').where('prof','==',p.id))]).then(([s,q])=>{putItems(p.id,s.docs.map(docOf));putQs(p.id,q.docs.map(docOf))})));
}
async function loadAll(){
  const [ps,it,qs]=await Promise.all([db.collection('profs').get(),db.collection('items').get(),safe(db.collection('qna'))]);
  S.data.profs=[];ps.docs.map(docOf).forEach(putProf);S.data.items=it.docs.map(docOf);S.data.qna=qs.docs.map(docOf);
}
async function refresh(){
  S.busy=true;render();
  try{
    await loadCommon();
    if(S.role==='admin') await loadAll();
    else if(S.role==='board') await loadBoard();
    else if(S.role==='rev'){ if(S.open) await loadProf(S.open); else await loadReviewer(S.me.rev); }
    else if(S.role==='prof') await loadProf(S.me.prof);
  }catch(e){console.error(e);toast('자료를 불러오지 못했어요')}
  S.busy=false;render();
}

/* ===== 로그인 후 역할 확인 ===== */
async function boot(u){
  S.user=u; S.roles=[]; S.me={prof:null,rev:null};
  $('#app').innerHTML='<div class="empty">불러오는 중…</div>';
  try{ await db.doc('sessions/'+u.uid).set({k:S.key,at:TS()}); }
  catch(e){console.error(e);showNoKey({text:'링크가 올바르지 않아요. 받은 링크를 그대로 열어 주세요.',err:1});return}
  try{
    const kd=await db.doc('keys/'+S.key).get(); const d=kd.exists?kd.data():{};
    S.name=d.name||'';
    if(d.prof){S.roles.push('prof');S.me.prof=d.prof}
    if(d.rev){S.roles.push('rev');S.me.rev=d.rev}
    const adm=await db.collection('keys').limit(1).get().then(()=>true).catch(()=>false);
    if(adm){S.roles.push('admin');if(!S.name)S.name='관리자'}
  }catch(e){console.error(e)}
  if(!S.roles.length){showNoKey({text:'이 링크에 연결된 교수님 정보가 없어요. BK 사무국에 알려 주세요.',err:1});return}
  S.role=S.roles[0]; S.cat='home'; S.open=null;
  await refresh();
}

/* ===== 쓰기 ===== */
async function touchProf(pid,extra){
  const upd=Object.assign({updated:today()},extra||{});
  await db.doc('profs/'+pid).update(upd); const p=prof(pid); Object.keys(upd).forEach(k=>{if(k.startsWith('done.')){p.done=p.done||{};p.done[k.slice(5)]=upd[k]}else p[k]=upd[k]});
}
