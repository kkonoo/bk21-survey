// 건의사항 게시판·업데이트 소식
/* ===== 건의사항 게시판 (모든 링크에서 보고 쓰기, 관리자가 답글·삭제) ===== */
async function loadBoard(){const q=await safe(db.collection('board'));S.data.board=q.docs.map(docOf).sort((a,b)=>ms(b.at)-ms(a.at))}
const CHANGELOG=[
  ['2026.10.29',['5단계 추진 방향에 맞춰 대표 업적을 최근 5년(2021~)으로 바꿨어요. 이미 넣은 2020년 이전 업적은 그대로 두고 \'5년 밖\'으로 표시해요',
    "특허·기술이전·창업·저서: 구분에 '북챕터'를 따로 두었어요. 저서와 북챕터는 논문처럼 대표업적 후보로 고를 수 있어요 (북챕터를 '저서'로 넣어 두셨다면 구분을 바꿔 주세요)",
    "지도학생 및 연구원 명단: 졸업생마다 '대표 진로 사례 추천'과 200자 설명 칸이 생겼어요",
    "지도학생 실적: 기간(최근 5년)을 적고, 구분에 '기타 학술 활동'을 넣었어요 (학생 연구과제 선정, 연구 데이터·코드 공개 등)"]],
  ['2026.10.28',['화면 디자인을 새로 바꿨어요 (글꼴·색·카드 모양). 입력 방법과 기능은 그대로예요']],
  ['2026.10.21',['담당 교수 검토: 확인한 실적은 같은 자리의 \'확인 취소\'를 누르면 검토 전으로 돌아가요']],
  ['2026.10.16',['공지: 마감일까지 실적 내용은 꼭 다 채워 주세요. 증빙 첨부는 마감 뒤에 해도 돼요',
    '공지: 증빙 자료는 주민등록번호·계좌번호·연락처·환자 정보 같은 민감한 개인정보를 가리고 올려 주세요 (안내 화면 맨 위와 모든 항목 안내에 넣었어요)']],
  ['2026.10.15',["입력 화면 맨 위 '✨ 증빙 자료로 자동 채우기': 증빙 PDF·사진을 넣으면 Claude가 빈 칸과 우수성·요약 같은 서술 칸 초안을 채워요. 각자 Claude API 키가 필요하고, 저장은 확인하고 직접 눌러요",
    '연구비: 연도별 입금액 칸이 시작일·종료일에 맞춰 나와요 (올해까지만, 해가 바뀌면 칸이 늘어나요)',
    "입학 예정 인턴의 상태는 학부 재학 · 학부 휴학 · 학사 졸업 · 석사 졸업 · 인턴 종료 중에서 골라요. 우리 대학원에 들어올 예정이면 석사를 마친 경우도 입학 예정 인턴이에요. 상태가 과정과 맞지 않으면 '상태 다시 선택'이 떠요",
    "지도학생 및 연구원 명단의 과정에 '연구교수'를 추가했어요 (박사후연구원으로 넣어 두셨다면 바꿔 주세요)",
    "'작성 예시'는 참고용 가상 자료라 수정할 수 없다고 적어 두었어요",
    '논문 \'지도학생 주저자\'를 여러 명 고를 수 있어요 (학생 공동 주저자)',
    "관리자: 실적 카드의 '참고'(기초자료)가 틀렸으면 수정 화면에서 고치거나 지울 수 있어요",
    '관리자 화면: 교수별 현황 표와 질문·답변은 접어 두고, 링크 목록도 접을 수 있어요',
    '관리자: 링크 목록에서 링크를 삭제할 수 있어요',
    '모든 항목에 비고 칸을 넣었어요. 적은 내용은 실적 카드에도 보여요',
    "논문 '본인 저자 역할'에 '1저자·교신'을 추가했어요",
    '위쪽 탭 순서: 내 실적 → 담당 교수 검토 → 학과 결산 → 건의사항 → 관리자',
    "입력칸의 예시를 연하게 하고 앞에 '예:'를 붙였어요. 예시는 지우지 않아도 되고 바로 입력하면 돼요",
    '관리자 화면에서 모든 교수님의 질문을 한곳에서 보고 답변할 수 있어요',
    '건의사항 탭 맨 위에 업데이트 소식을 두었어요']],
  ['2026.10.13',['실적 카드 제목을 누르면 입력한 내용 전체가 펼쳐져요',
    '연구비: 참여(공동연구원) 과제용 지분확인서 양식과, 과제 정보가 채워진 지분확인서 내려받기',
    '항목마다·안내 화면에 질문칸, 위쪽에 건의사항 게시판',
    "'산업·사회 기여·국내 활동': 국내 활동(학회 임원, RB·CRB 위원, 국내 강연·수상 등)은 여기에",
    '지도학생 명단: 학부·예정 / 대학원 / 연구원으로 묶음, 입학 예정 인턴·석사/학사 연구원, 의학 계열, 대학원생 학번 미입력 표시',
    '지도학생 실적: 수상을 교내 / 교외·국내 / 국제로 구분',
    '공동지도 학생은 학과 결산에서 한 번만 셈']],
  ['2026.10.12',['라이트/다크 모드 버튼(☀️/🌙)과 새로고침(↻) 버튼',
    '실적 육각형(본인·관리자만)과 학과 결산 탭',
    '마감일을 눈에 띄게 표시']],
];
function newsHTML(){
  const one=([d,a])=>`<div class="news"><b>${d}</b><ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
  return `<div class="panel" style="margin-bottom:16px"><div class="head"><h2 style="font-size:17px">업데이트 소식</h2><span class="msg">사이트가 바뀔 때마다 여기에 적어요.</span></div>
    ${one(CHANGELOG[0])}${CHANGELOG.length>1?`<details style="margin-top:8px"><summary style="cursor:pointer;color:var(--navy);font-weight:600;font-size:14px">이전 소식</summary>${CHANGELOG.slice(1).map(one).join('')}</details>`:''}</div>`;
}
function boardView(){
  const B=S.data.board, adm=isAdmin();
  return `${newsHTML()}<div class="panel"><div class="head"><div><h2>건의사항</h2><span class="msg">이 시스템에 대한 건의나 불편한 점을 남겨 주세요. 모든 분이 함께 보고, BK 사무국이 답글을 달아요.</span></div></div>
    <textarea id="bd-new" placeholder="예: 논문 DOI 자동 채우기가 안 되는 학술지가 있어요" style="min-height:70px"></textarea>
    <div class="export" style="margin-top:8px"><button class="btn primary" data-act="post">올리기</button><span class="msg"><b>${esc(S.name)}</b> 이름으로 올라가요</span></div>
    <div class="items" style="margin-top:16px">${B.length?B.map(x=>`<div class="item"><div style="min-width:0"><div style="white-space:pre-wrap">${esc(x.text)}</div><div class="meta"><span>${esc(x.by||'')}</span><span>${dstr(x.at)}</span></div>
      ${x.reply?`<div class="ans">↳ ${esc(x.reply)} <span class="msg">— ${esc(x.rby||'')}</span></div>`:''}</div>
      <div class="acts">${adm?`<button class="btn ghost sm" data-delpost="${x.id}">삭제</button>`:''}</div>
      ${adm?`<div class="review"><input id="r-${x.id}" placeholder="답글" value="${esc(x.reply||'')}"><button class="btn sm" data-reply="${x.id}">${x.reply?'답글 고치기':'답글 달기'}</button></div>`:''}</div>`).join(''):'<div class="empty">아직 건의사항이 없어요.</div>'}</div>
  </div>`;
}
