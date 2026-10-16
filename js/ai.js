// 증빙 자료로 자동 채우기 (Claude API)
// ---------- 증빙 자료로 자동 채우기 (Claude API) ----------
// 증빙 PDF·사진과 메모를 Claude에게 보내 지금 열린 입력 칸을 채움 (빈 칸 + 서술 칸 초안). 저장은 사람이 확인하고 직접 누름
// 키는 각자 자기 Anthropic 키를 이 브라우저(localStorage)에만 둠. 요청은 브라우저에서 api.anthropic.com으로 바로 감 (lab-manager js/ai.js와 같은 방식)
// 증빙 첨부로 올린 파일은 구글 드라이브에 있어 브라우저에서 다시 못 읽으므로, 같은 파일을 여기서 골라 넣음
const AI_MODEL='claude-opus-5-5', AI_SDK='https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.127.0/+esm', AI_KEY='bk21-ai-key';
const aiKey=()=>{try{return localStorage.getItem(AI_KEY)||''}catch(e){return ''}};
const setAiKey=k=>{try{k?localStorage.setItem(AI_KEY,k):localStorage.removeItem(AI_KEY)}catch(e){}};
function aiBoxHTML(){return `<details class="aibox full"><summary>✨ 증빙 자료로 자동 채우기 (Claude)</summary>
  <label>자료 (PDF · 사진, 여러 개 가능)<input type="file" id="ai-files" multiple accept="application/pdf,image/*"></label>
  <label>메모 · 붙여 넣은 글 · 부탁 (없어도 돼요)<textarea id="ai-note" rows="3" placeholder="예: 우수성은 학생 교육 효과 위주로 / 수상명은 최우수 포스터상"></textarea></label>
  <label>내 Claude API 키<div class="row"><input type="password" id="ai-key" value="${esc(aiKey())}" placeholder="sk-ant-…" autocomplete="off" spellcheck="false"><button type="button" class="btn" data-act="aikey-clear">지우기</button></div>
    <span class="help">키는 이 브라우저에만 저장돼요 (공용 PC면 쓰고 나서 지워 주세요). console.anthropic.com → API Keys에서 만들고, 쓴 만큼 그 계정에 요금이 나가요.</span></label>
  <div class="row" style="align-items:center"><button type="button" class="btn primary" data-act="aifill">채우기</button><span class="help" id="ai-msg">빈 칸을 채우고 서술 칸은 초안을 써요. 자료에 없는 숫자·이름은 지어내지 않아요. 민감한 개인정보는 가리고, 환자 정보·미발표 데이터는 넣지 마세요.</span></div></details>`}
const AI_SYSTEM=`너는 경북대학교 의과학과 BK21 교육연구단의 교수 실적 조사 입력을 돕는다. 연구실 사람이 증빙 자료(PDF·사진)와 메모를 주면, 지금 열린 실적 입력 양식의 칸에 넣을 값을 정한다.
- 빈 칸은 자료로 채운다.
- 이미 적힌 칸은 메모가 바꾸라고 하거나 자료와 분명히 다를 때만 고친다. 바꿀 것 없는 칸은 fields 에 넣지 않는다.
- 숫자·날짜·이름·금액·기관명·학술지명 같은 사실은 자료·메모·양식에 있는 것만 쓴다. 지어내지 않는다. 모르면 비워 두고 note 에 적는다.
- 서술 칸(우수성·요약 등)은 자료와 양식에 적힌 내용을 바탕으로 쓴다. 공백을 뺀 글자 수 제한을 넘기지 말고 제한의 80–95%쯤 쓴다. BK21 신청서에 그대로 옮길 수 있게 공문서 문체("…함", "…임")로 간결하게, 과장 없이 구체적인 성과(학술지·순위·수상·금액·활용처 등)를 담는다.
- 고르기 칸은 보기 가운데 하나를 그대로 쓴다. 여러 개 고르는 칸은 보기를 |로 잇고 최대 개수를 지킨다.
- 날짜 칸은 YYYY-MM-DD, 연월 칸은 예시 형식(예: 2024.05)을 따른다. 금액·숫자 칸은 쉼표 없이 숫자만 쓴다 (금액은 천원 단위).
- fields 의 name 은 양식 칸 목록의 이름을 따옴표 없이 그대로 쓴다.
- note 에는 못 채운 칸과 그 까닭, 사람이 확인할 점을 한두 문장으로 쓴다 (없으면 빈 글).`;
const AI_SCHEMA={type:'object',additionalProperties:false,required:['fields','note'],properties:{
  fields:{type:'array',items:{type:'object',additionalProperties:false,required:['name','value'],properties:{name:{type:'string'},value:{type:'string'}}}},note:{type:'string'}}};
const asB64=blob=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=()=>no(r.error);r.readAsDataURL(blob)});
async function aiBlock(file){ // 사진은 긴 변 2000px JPEG로 줄임
  if(file.type==='application/pdf')return {type:'document',source:{type:'base64',media_type:'application/pdf',data:await asB64(file)},title:file.name};
  const img=new Image(),url=URL.createObjectURL(file);
  try{await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(new Error(`'${file.name}'을(를) 열지 못했어요`));img.src=url})}finally{URL.revokeObjectURL(url)}
  const k=Math.min(1,2000/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);
  cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  return {type:'image',source:{type:'base64',media_type:'image/jpeg',data:cv.toDataURL('image/jpeg',0.9).split(',')[1]}};
}
function aiSlots(form,c){ // 칸 이름 → 종류·보기 (지금 화면 기준. 연도별 입금액은 연도마다 한 칸)
  const out=new Map();
  c.fields.forEach(fd=>{
    if(fd.t==='years'){form.querySelectorAll(`input[name^="${fd.k}."]`).forEach(el=>out.set(el.name,{fd,l:el.name.slice(fd.k.length+1)+'년 입금액 (천원)',kind:'number'}));return}
    const box=form.querySelectorAll(`input[type=checkbox][name="${fd.k}"]`);
    if(box.length){out.set(fd.k,{fd,l:fd.l,kind:'checks',opts:[...box].map(x=>x.value)});return}
    const el=form.elements[fd.k];if(!el||!el.tagName)return;
    out.set(fd.k,{fd,l:fd.l,kind:el.tagName==='SELECT'?'select':el.tagName==='TEXTAREA'?'area':el.type,opts:el.tagName==='SELECT'?[...el.options].map(o=>o.value).filter(Boolean):null});
  });
  return out;
}
const aiGet=(form,k,x)=>x.kind==='checks'?[...form.querySelectorAll(`input[name="${k}"]:checked`)].map(e=>e.value).join('|'):((form.elements[k]||{}).value||'').trim();
function aiSet(form,k,x,v){ // 넣었으면 true. 과정·시작일·종료일은 change를 보내 상태 보기·연도 칸이 따라 바뀌게
  if(x.kind==='checks'){const want=v.split('|').map(o=>o.trim()).filter(o=>x.opts.includes(o)).slice(0,x.fd.max||undefined);if(!want.length)return false;
    const bs=form.querySelectorAll(`input[name="${k}"]`);bs.forEach(e=>{e.checked=want.includes(e.value)});bs[0].closest('.checks').classList.add('ai-on');return true}
  const el=form.elements[k];if(!el)return false;
  if(x.kind==='select'&&![...el.options].some(o=>o.value===v))return false;
  if(x.kind==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  if(x.kind==='number'){v=v.replace(/[,\s]/g,'');if(!/^-?\d+(\.\d+)?$/.test(v))return false}
  el.value=v;el.classList.add('ai-on');el.dispatchEvent(new Event(x.kind==='area'?'input':'change',{bubbles:true}));return true;
}
async function aiFill(){
  const form=document.querySelector('form.edit'),c=CAT[form.dataset.cat],btn=form.querySelector('[data-act=aifill]'),msg=$('#ai-msg');
  const say=(t,err)=>{msg.textContent=t;msg.className='help'+(err?' msg err':'')};
  const key=aiKey(),files=[...$('#ai-files').files],note=$('#ai-note').value.trim();
  if(!key)return say('Claude API 키를 먼저 넣어 주세요.',1);
  if(!files.length&&!note)return say('자료 파일을 고르거나 메모를 써 주세요.',1);
  if(files.reduce((a,x)=>a+x.size,0)>24*2**20)return say('자료가 너무 커요 (모두 합쳐 24MB까지).',1);
  const slots=aiSlots(form,c),before=new Map([...slots].map(([k,x])=>[k,aiGet(form,k,x)]));
  const kind=x=>({select:'고르기',checks:'여러 개 고르기'+(x.fd.max?` (최대 ${x.fd.max}개)`:''),area:`서술 (공백 제외 ${x.fd.max}자 이내)`,date:'날짜 YYYY-MM-DD',number:'숫자'})[x.kind]||'글';
  const list=[...slots].map(([k,x])=>`- "${k}" | ${x.l}${x.fd.req?' (필수)':''} | ${kind(x)}${x.opts?' | 보기: '+x.opts.join(' / '):''}${x.fd.t!=='years'&&x.fd.ph?' | 예: '+x.fd.ph:''}${x.fd.t!=='years'&&x.fd.help?' | 안내: '+x.fd.help:''} | 지금: ${before.get(k)?JSON.stringify(before.get(k)):'(비어 있음)'}`).join('\n');
  const prompt=`실적 종류: ${c.name}${c.table?` (신청서 ${c.table})`:''}\n작성 안내: ${c.rule.replace(/<br>/g,'\n').replace(/<[^>]+>/g,'')}\n교수: ${(prof(curPid())||{}).name||''}\n오늘: ${new Date().toISOString().slice(0,10)}\n\n[양식 칸 — 이름 | 제목 | 형식 | 보기·예·안내 | 지금 값]\n${list}\n\n[메모]\n${note||'(첨부 자료를 봐 주세요)'}`;
  btn.disabled=true;say('Claude가 자료를 읽는 중이에요… (1분쯤 걸릴 수 있어요)');
  try{
    const blocks=await Promise.all(files.map(aiBlock));
    const {default:Anthropic}=await import(AI_SDK);
    const client=new Anthropic({apiKey:key,dangerouslyAllowBrowser:true});
    let res;
    try{
      res=await client.beta.messages.create({model:AI_MODEL,max_tokens:16000,
        betas:['server-side-fallback-2026-07-01'],fallbacks:'default', // 안전 분류기가 거절하면 서버가 다른 모델로 다시 돌림
        output_config:{effort:'medium',format:{type:'json_schema',schema:AI_SCHEMA}},system:AI_SYSTEM,
        messages:[{role:'user',content:[...blocks,{type:'text',text:prompt}]}]});
    }catch(e){
      if(e instanceof Anthropic.AuthenticationError)throw new Error('API 키가 맞지 않아요. 키를 확인해 주세요.');
      if(e instanceof Anthropic.PermissionDeniedError)throw new Error('이 API 키로는 쓸 수 없어요 (권한 없음).');
      if(e instanceof Anthropic.RateLimitError)throw new Error('요청이 많아요. 잠시 뒤에 다시 눌러 주세요.');
      if(e instanceof Anthropic.APIConnectionError)throw new Error('Claude 서버에 닿지 못했어요. 인터넷 연결을 확인해 주세요.');
      if(e instanceof Anthropic.APIError)throw new Error(`Claude가 답하지 못했어요 (${e.status??'?'}): ${e.error?.error?.message||e.message}`); // 400 크레딧 부족 등
      throw e;
    }
    if(res.stop_reason==='refusal')throw new Error('Claude가 이 요청을 거절했어요. 자료를 바꿔서 다시 해 주세요.');
    if(res.stop_reason==='max_tokens')throw new Error('답이 너무 길어 중간에 끊겼어요. 자료를 줄여서 다시 해 주세요.');
    if(!document.body.contains(form))return; // 기다리는 동안 입력 창을 닫음
    const {fields:out=[],note:why=''}=JSON.parse(res.content.filter(b=>b.type==='text').at(-1)?.text||'{}'); // fallback이면 앞 모델 글이 남을 수 있어 마지막 글 블록
    const order=[...slots.keys()],rows=out.map(r=>({k:String(r.name??'').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,''),v:String(r.value??'').trim()})).filter(r=>r.v)
      .sort((a,b)=>(order.indexOf(a.k)+1||999)-(order.indexOf(b.k)+1||999)); // 과정→상태, 시작일→입금액 순서로
    let filled=0,fixed=0;const later=[];
    const put=(sl,r,check)=>{const x=sl.get(r.k);if(!x)return false;const now=aiGet(form,r.k,x);
      if(check&&before.has(r.k)&&now!==before.get(r.k))return true; // 답을 기다리는 동안 직접 고친 칸은 그대로
      if(now===r.v||!aiSet(form,r.k,x,r.v))return now===r.v;now?fixed++:filled++;return true};
    rows.forEach(r=>{if(!put(slots,r,1))later.push(r)});
    if(later.length){const sl=aiSlots(form,c);later.forEach(r=>put(sl,r,0))} // 바뀐 상태 보기·새 연도 칸에 다시
    if(!filled&&!fixed)return say(['자료에서 채우거나 고칠 내용을 찾지 못했어요.',why.trim()].filter(Boolean).join(' '),1);
    say(`✨ ${[filled&&filled+'칸 채움',fixed&&fixed+'칸 고침'].filter(Boolean).join(' · ')} (주황 테두리) — 저장 전에 꼭 확인해 주세요.${why.trim()?' '+why.trim():''}`);
  }catch(e){say('자동 채우기를 못 했어요: '+e.message,1)}
  finally{btn.disabled=false}
}
