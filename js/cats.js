// 조사 항목 정의: 과정·상태 보기, 실적 종류(CATS)와 입력 칸, 작성 예시, 날짜 기준
/* ===== 조사 항목 정의 ===== */
// 지도학생 과정은 묶음으로 보여준다 (선택 목록의 optgroup, 명단 정렬)
const DEGREE_GROUPS=[['학부·예정',['학부연구생','학·석 연계과정','입학 예정 인턴']],['대학원',['석사','박사','석박통합']],['연구원',['박사후연구원','연구교수','석사연구원','학사연구원']]];
const OPT_GROUPS={degree:DEGREE_GROUPS};
// 상태는 과정에 맞는 것만 (학부·대학원·인턴은 학생 상태, 연구원은 계약 상태)
const STATUS_OF=d=>d==='입학 예정 인턴'?['학부 재학','학부 휴학','학사 졸업','석사 졸업','인턴 종료']:DEGREE_GROUPS.find(g=>g[0]==='연구원')[1].includes(d)?['계약 중','계약 종료']:['재학','휴학','수료','졸업','중단'];
const STATUS_OLD={'학부 재학':'재학','입학 예정':'재학'}; // 예전 상태값은 읽을 때 바꿔 보여줌
const MED_OLD={'의예·의학과 재학':'예','의대 졸업 (의사)':'예'}; // 의학 계열은 예/아니오로 (과정 칸으로 의대생·의사 구분)
const FIELD_OPTS = {
  role: ['1저자','교신','1저자·교신','공저자'],
  gtype: ['정부 (지자체 포함)','산업체 (국내)','해외기관'],
  grole: ['연구책임자','세부(위탁)과제 책임자','공동연구원'],
  ipkind: ['등록특허','기술이전','창업','저서','북챕터'],
  edukind: ['대학원 교육용 저서·book chapter','번역서','교육 관련 논문','교육 수상 (교외)','MOOC·KMOOC·OCW·PBL','신규 교과목 개발·개설'],
  socfields: ['정책 기여','거버넌스 구축','미래/글로벌 대응','기업현안 해결','인력 재교육','기타'],
  sockind: ['정부·지자체 위원회·정책 자문','학회 임원 (학회장·이사·위원)','RB·CRB 등 평가위원','국내 학술지 편집위원','국내 초청강연·기조연설·좌장','국내 학회 수상','국내 공동연구 (타 기관)','국내 기관 교류·연수','기업 자문·기술 지원','재교육·대중 강연','기타'],
  intlkind: ['국제학회 수상','초청강연','기조연설','좌장','위원회','국제학술지 편집위원','국제 저술'],
  exkind: ['해외 기관 연수','외국 연구자 국내 방문 (온라인 포함)'],
  stukind: ['학회 발표 (국제)','학회 발표 (국내)','특허·기술이전·창업','수상 (교내)','수상 (교외·국내)','수상 (국제)','해외 연구실 공동연구 (15일 이상)','기타 학술 활동'],
  degree: DEGREE_GROUPS.flatMap(g=>g[1]),
  career: ['취업','진학','창업','입대','미취업','기타'],
  dept: ['의과학과 대학원','타 학과 대학원'],
  toptype: ['논문','특허','저서','북챕터','기술이전','기타'],
};
const YEARS = Array.from({length:Math.max(2026,new Date().getFullYear())-2020},(_,k)=>String(2021+k));
// 연구비 연도별 입금액 칸: 시작~종료 연도 중 2021년부터 올해까지 (이미 값이 있는 연도는 범위 밖이어도 남김)
const yearsOf=(f,cur)=>{const now=new Date().getFullYear(),a=Math.max(2021,parseInt(f.start)||2021),b=Math.min(now,parseInt(f.end)||now),ys=[];for(let y=a;y<=b;y++)ys.push(String(y));return [...new Set([...ys,...Object.keys(cur||{}).filter(y=>cur[y])])].sort()};
const yearBoxes=(k,f,cur)=>yearsOf(f,cur).map(y=>`<label>${y}<input type="number" name="${k}.${y}" value="${esc(cur[y]||'')}" inputmode="numeric"></label>`).join('')||'<span class="help">시작 연도가 되면 칸이 생겨요</span>';
// 증빙 자료 개인정보 안내 (모든 항목 안내·안내 화면 공지·자동 채우기에 같이 씀)
const PRIVACY_NOTE='🔒 증빙 자료는 <b>주민등록번호·외국인등록번호, 계좌번호, 휴대전화번호·집 주소, 환자 정보</b> 같은 민감한 개인정보를 <b>가리고</b> 올려 주세요.';
const CATS = [
  {key:'roster', name:'지도학생 및 연구원 명단', table:'첨부 2·3·4 · 2-2', rule:'<b>논문보다 먼저 입력해 주세요</b> — 논문 탭의 지도학생 주저자를 이 명단에서 고릅니다. 4단계 BK 참여학생은 미리 채워 두었으니 <b>졸업생 진로 확인</b>과 <b>박사후연구원·학부연구생 추가</b>부터 해 주세요.<br><b>2021년 이후</b> 지도한 학생 전원 (재학·수료·졸업), 박사후연구원, 그리고 연구실의 <b>학부연구생·학석 연계과정생</b> (5단계는 학·석·박 연계를 봅니다). <b>4단계 BK 참여학생 명단(2020.2–2026.2학기)</b>으로 미리 채웠으니 지금 명단에 없는 학생(졸업생의 <b>졸업 연월·진로</b>, 상태)을 고쳐 주시고, BK에 참여하지 않은 대학원생과 <b>박사후연구원·연구교수·연구원·학부연구생·입학 예정 인턴</b>은 <b>+ 추가</b>로 넣어 주세요. 우리 대학원에 들어올 예정이면 (석사를 마친 경우도) <b>입학 예정 인턴</b>, 입학 계획 없이 계약해 일하면 <b>석사·학사연구원</b>으로 넣어 주세요. 학생마다 <b>의학 계열</b>(의대생·의사 여부, 의사과학자 양성 사업용)도 골라 주세요. 학생 수가 장학금 규모와 참여교수 결정의 기준이 됩니다. <b>BK 참여 여부와 관계없이 모두 넣고</b>, 지금 BK 참여 중인지만 따로 표시해 주세요 (26.2학기 BK 참여 중인 학생은 \'예\'로 되어 있어요). 4단계 BK에 한 번이라도 참여한 학생은 <b>BK 참여 이력</b>이 \'예\'로 되어 있어요.<br>5단계는 취·창업률보다 <b>최근 5년 대표 진로 사례</b>를 중심으로 봅니다. 내세울 만한 졸업생은 <b>대표 진로 사례 추천</b>을 \'예\'로 하고 200자로 설명해 주세요.',
   fields:[
    {k:'name',l:'이름',t:'text',req:1},
    {k:'sid',l:'학번',t:'text'},
    {k:'degree',l:'과정',t:'select',o:'degree',req:1},
    {k:'status',l:'상태',t:'select',of:f=>STATUS_OF(f.degree),req:1},
    {k:'bk',l:'BK 참여 (현재)',t:'yn'},
    {k:'bkever',l:'BK 참여 이력',t:'yn'},
    {k:'admit',l:'입학/임용 연월',t:'text',ph:'2023.03'},
    {k:'grad',l:'졸업/중단/종료 연월',t:'text',ph:'2026.02'},
    {k:'foreign',l:'외국인',t:'yn'},
    {k:'med',l:'의학 계열',t:'yn'},
    {k:'ckind',l:'졸업 후 진로',t:'select',o:'career'},
    {k:'career',l:'진로 기관 · 직위',t:'text',full:1,ph:'한국뇌연구원 연수연구원'},
    {k:'crep',l:'대표 진로 사례 추천 (졸업생)',t:'yn'},
    {k:'cdesc',l:'대표 진로 사례 설명 (추천할 때만)',t:'area',max:200,full:1},
   ], title:f=>f.name+(f.sid?' · '+f.sid:''), meta:f=>[f.degree, f.status, f.admit&&((degGroup(f.degree)==='연구원'?'임용 ':'입학 ')+f.admit), f.grad&&((f.status==='중단'?'중단 ':/종료$/.test(f.status)?'종료 ':'졸업 ')+f.grad), f.career], chips:f=>[f.bk==='예'&&['rep','BK 참여'], f.bk!=='예'&&f.bkever==='예'&&['pre','BK 참여 이력'], f.status&&!STATUS_OF(f.degree).includes(f.status)&&['fix','상태 다시 선택'], f.foreign==='예'&&['pre','외국인'], f.med==='예'&&['pre','의학 계열'], f.status==='졸업'&&!f.ckind&&['fix','진로 미입력'], f.crep==='예'&&['rep','대표 진로 사례'], f.crep==='예'&&!f.cdesc&&['fix','사례 설명 미작성'], degGroup(f.degree)==='대학원'&&!(f.sid||'').trim()&&['fix','학번 미입력']]},
  {key:'paper', name:'논문', table:'3-2 · 3-3', rule:'<b>2021.1 이후</b> 게재된 SCI(E)·SSCI·A&HCI·등재(후보)·Scopus 논문 전체 (경북대 소속 표기, 권·호·쪽이 있는 논문). DOI만 넣고 <b>자동 채우기</b>를 누르세요. <b>IF와 JCR 상위 %를 S2Journal·JCR에서 확인해 넣어 주세요</b> (참고 칸의 IF는 중간평가 1차조사 값, 2025년 기준) (출판 당시: 7–12월 출판은 전년도, 1–6월 출판은 전전년도 JCR). 신청서는 <b>대표업적 1인당 3건</b>(정성 70%)과 <b>전체 논문</b>(정량 30%)을 함께 봅니다. <b>저서·북챕터</b>도 대표업적으로 낼 수 있어요 (특허·기술이전·창업·저서 탭에서 후보로 표시).',
   fields:[
    {k:'doi',l:'DOI',t:'doi',req:1,full:1},
    {k:'title',l:'논문 제목',t:'text',req:1,full:1},
    {k:'journal',l:'학술지',t:'text',req:1},
    {k:'ym',l:'게재연월',t:'text',ph:'2025.07',req:1},
    {k:'vol',l:'권(호)',t:'text',ph:'16(1)'},
    {k:'pages',l:'쪽',t:'text',ph:'201-230'},
    {k:'if',l:'IF (출판 당시 JCR)',t:'text',ph:'5.2',help:'출판 시점에 나와 있던 최신 JCR (7월 이후 출판이면 전년도, 1–6월이면 전전년도 JCR). 자동 채우기로 들어와요'},
    {k:'jcr',l:'JCR 상위 % (출판 당시)',t:'text',ph:'12.5',help:'분야 순위 ÷ 분야 저널 수 × 100 (여러 분야면 가장 좋은 값)'},
    {k:'if_cur',l:'IF (기준 연도 JCR)',t:'text',help:'관리자가 정한 기준 연도 JCR 값 (자동)'},
    {k:'jcr_cur',l:'JCR 상위 % (기준 연도)',t:'text',help:'관리자가 정한 기준 연도 JCR 값 (자동)'},
    {k:'role',l:'본인 저자 역할',t:'select',o:'role',req:1},
    {k:'nauth',l:'총 저자 수',t:'number',help:'자동 채우기로 들어옵니다'},
    {k:'nmain',l:'주저자 수 (1저자·교신, 중복 제외)',t:'number',help:'공동 1저자·공동 교신이 있으면 모두 세어 넣어 주세요 (예: 공동 1저자 2명 + 교신 1명 = 3). 비우면 1명으로 봅니다'},
    {k:'student',l:'지도학생 주저자',t:'student',multi:1},
    {k:'intl',l:'국외 공동저자 포함',t:'yn',help:'예로 하면 국제공동연구 탭에 자동으로 들어가요'},
    {k:'partner',l:'국외 공동연구자 (국제일 때)',t:'text'},
    {k:'pinst',l:'국가 / 소속기관 (국제일 때)',t:'text',ph:'미국 / Harvard Medical School'},
    {k:'rep',l:'대표업적 후보로 추천',t:'yn'},
    {k:'merit',l:'대표업적 우수성 (후보일 때만)',t:'area',max:500,full:1},
   ], title:f=>f.title, meta:f=>[f.journal, f.ym, f.vol&&('Vol. '+f.vol), f.if&&('IF '+f.if+(f.jcr?' · 상위 '+f.jcr+'%':'')+' (출판 당시)'), f.if_cur&&('IF '+f.if_cur+(f.jcr_cur?' · 상위 '+f.jcr_cur+'%':'')+' (기준 '+(S.data.jcrBase||'')+')'), f.role, f.nauth&&('저자 '+f.nauth+'명'), f.doi&&('DOI '+f.doi)], chips:f=>[ROLE_REDO.includes(f.role)&&['fix','저자 역할 다시 선택'], f.rep==='예'&&['rep','대표 후보'], f.student&&['pre','학생 주저자: '+f.student], f.intl==='예'&&['pre','국제공동'], f.rep==='예'&&!f.merit&&['fix','우수성 미작성'], !f.jcr&&['fix','JCR 상위 % 미입력']]},
  {key:'grant', name:'연구비', table:'3-1', rule:'2021.1 이후 수행 과제. 신청서는 <b>연도별 입금액</b>(입금일 기준)으로 1인당 수주액을 계산합니다. <b>공동연구원 참여 과제도</b> 입력해 주세요 (경북대 산단 입금분 또는 책임자 지분확인서로 인정). 산단을 거치지 않은 참여 과제는 과제마다 있는 <b>지분확인서</b> 버튼(과제 정보가 채워진 양식) 또는 위의 빈 양식으로 연구책임자 확인·서명을 받아 증빙으로 올려 주세요. 교내 연구비·민간부담금 제외, 금액은 천원 단위.',
   fields:[
    {k:'title',l:'과제명',t:'text',req:1,full:1},
    {k:'ministry',l:'주관부처 / 발주 기관',t:'text',req:1},
    {k:'program',l:'사업명',t:'text',req:1},
    {k:'gtype',l:'구분',t:'select',o:'gtype',req:1},
    {k:'grole',l:'본인 역할',t:'select',o:'grole',req:1},
    {k:'knu',l:'경북대 산단으로 협약·입금',t:'yn',req:1},
    {k:'share',l:'본인 지분 (%) — 공동연구원일 때',t:'number'},
    {k:'start',l:'시작일',t:'date',req:1},
    {k:'end',l:'종료일',t:'date',req:1},
    {k:'total',l:'총 연구비 (천원)',t:'number',req:1},
    {k:'rep',l:'대표 과제 후보',t:'yn'},
    {k:'paid',l:'연도별 입금액 (천원, 경북대 입금 기준)',t:'years',full:1},
   ], title:f=>f.title, meta:f=>[f.ministry, f.program, f.gtype, f.grole, f.start&&(f.start+' ~ '+(f.end||'')), f.total&&(Number(f.total).toLocaleString()+' 천원')], chips:f=>[f.rep==='예'&&['rep','대표 후보'], f.knu==='아니오'&&['fix','산단 미경유 — 지분확인서 필요'], f.share&&['pre','지분 '+f.share+'%'], !(f.paid&&Object.values(f.paid).some(Boolean))&&['fix','연도별 입금액 미입력']]},
  {key:'ip', name:'특허·기술이전·창업·저서', table:'3-4', rule:'특허는 <b>등록특허만</b> (출원 제외, 기관 명의에 본인이 발명자). 기술이전은 <b>대학 명의</b>만, 0원도 입력 가능. 신청서에는 <b>1인당 2건</b>을 우수성과 함께 냅니다. <b>저서와 북챕터는 구분을 나눠</b> 넣어 주세요. 둘 다 논문과 함께 <b>대표업적(1인당 3건)</b> 후보로 고를 수 있어요.',
   fields:[
    {k:'kind',l:'구분',t:'select',o:'ipkind',req:1},
    {k:'date',l:'등록·계약·출판일',t:'date',req:1},
    {k:'title',l:'명칭 (발명의 명칭·기술명·저서명, 북챕터는 장 제목·책 제목)',t:'text',req:1,full:1},
    {k:'country',l:'등록 국가',t:'text',ph:'한국'},
    {k:'number',l:'등록번호 / ISBN',t:'text'},
    {k:'holder',l:'등록 명의 (기관)',t:'text',ph:'경북대학교 산학협력단'},
    {k:'inventors',l:'발명자 · 저자',t:'text'},
    {k:'amount',l:'기술이전액 (천원)',t:'number'},
    {k:'intl',l:'국외 공동발명·공동연구',t:'yn',help:'예로 하면 국제공동연구 탭에 자동으로 들어가요'},
    {k:'partner',l:'국외 공동연구자 (국제일 때)',t:'text'},
    {k:'pinst',l:'국가 / 소속기관 (국제일 때)',t:'text'},
    {k:'rep',l:'신청서 제출 후보 (저서·북챕터는 대표업적 후보)',t:'yn'},
    {k:'merit',l:'우수성 (후보일 때만)',t:'area',max:500,full:1},
   ], title:f=>f.title, meta:f=>[f.kind, f.country, f.number, f.date, f.amount&&(Number(f.amount).toLocaleString()+' 천원')], chips:f=>[f.rep==='예'&&['rep',['저서','북챕터'].includes(f.kind)?'대표업적 후보':'제출 후보'], f.intl==='예'&&['pre','국제공동']]},
  {key:'top', name:'대표 업적 (최근 5년)', table:'3-5', rule:'교육연구단의 <b>학문적 수월성</b>을 보여줄 최근 5년(2021~) 최고 업적 (5단계는 연구역량 인정기간이 10년에서 5년으로 바뀌어요). 이미 넣은 2020년 이전 업적은 \'5년 밖\'으로 표시돼요. 교육연구단 전체에서 <b>3건</b>만 고르므로 교수님별 1건만 추천해 주세요. 없으면 비워 두셔도 됩니다.<br>글자 수 (공백 제외): <b>대표 연구업적물·저서·특허 우수성 각 500자</b>. 대표 진로 사례(200자)는 <b>지도학생 및 연구원 명단</b>에서 졸업생마다 추천해 주세요.',
   fields:[
    {k:'ttype',l:'종류',t:'select',o:'toptype',req:1},
    {k:'year',l:'연도',t:'text',ph:'2021',req:1},
    {k:'output',l:'업적 (논문 서지 또는 DOI)',t:'text',req:1,full:1},
    {k:'desc',l:'왜 대표 업적인가',t:'area',max:500,full:1},
   ], title:f=>f.output, meta:f=>[f.ttype, f.year], chips:f=>[parseInt(f.year)<2021&&['fix','5년 밖']]},
  {key:'edu', name:'교육역량', table:'2-8', rule:'최근 5년 대학원 교육 관련 실적. 단순 PPT 모음 저서와 <b>교내 수상은 제외</b>. 1인당 <b>최대 2건</b>, 500자.',
   fields:[
    {k:'kind',l:'구분',t:'select',o:'edukind',req:1,full:1},
    {k:'title',l:'실적명',t:'text',req:1,full:1},
    {k:'year',l:'연도',t:'text',ph:'2025',req:1},
    {k:'merit',l:'우수성과 교육 효과',t:'area',max:500,full:1},
   ], title:f=>f.title, meta:f=>[f.kind, f.year], chips:()=>[]},
  {key:'lec', name:'대학원 강의', table:'교육과정', rule:'최근 5년(2021.1학기~) 담당한 <b>대학원 강의</b>. 의과학과와 타 학과 대학원을 구분하고, <b>학점·강의시수</b>는 통합정보시스템에 나온 대로 적어 주세요. 학사 시스템 자료로 미리 채울 예정입니다.',
   fields:[
    {k:'term',l:'학기',t:'text',ph:'2025-2',req:1},
    {k:'dept',l:'개설 학과',t:'select',o:'dept',req:1},
    {k:'course',l:'교과목명',t:'text',req:1,full:1},
    {k:'eng',l:'영어 강의',t:'yn'},
    {k:'credit',l:'학점',t:'number',ph:'3'},
    {k:'hours',l:'강의시수',t:'number',ph:'3',help:'통합정보시스템에 표시된 본인 강의시수'},
   ], title:f=>f.course, meta:f=>[f.term, f.dept, f.eng==='예'&&'영어 강의', f.credit&&(f.credit+'학점'), f.hours&&('강의시수 '+f.hours), f.share&&(f.share+'% 담당')], chips:()=>[]},
  {key:'soc', name:'산업·사회 기여·국내 활동', table:'서술 2.1', rule:'최근 5년간 과학기술·(지역)산업·(지역)사회 문제 해결에 기여한 실적과 <b>국내 활동 전부</b> (국제학술활동·국제공동연구·외국기관 교류의 국내판). 정부 위원회·정책 자문, 기업 문제 해결, 재교육, <b>국내 학회장·이사·위원, RB·CRB 위원</b>, 국내 학술지 편집위원, 국내 초청강연·좌장, 국내 학회 수상, 국내 공동연구·기관 교류 등. 산업·사회 기여는 분야를 <b>3개 이내</b>로 고르고, 요약 <b>200자</b>, 증빙 필요.',
   fields:[
    {k:'kind',l:'구분',t:'select',o:'sockind',req:1},
    {k:'title',l:'실적명',t:'text',req:1,full:1},
    {k:'fields',l:'해당 분야 (산업·사회 기여일 때, 최대 3개)',t:'multi',o:'socfields',max:3,full:1},
    {k:'date',l:'시기',t:'text',ph:'2025.03 ~ 현재'},
    {k:'summary',l:'기여 요약',t:'area',max:200,full:1},
   ], title:f=>f.title, meta:f=>[f.kind, (f.fields||[]).join(', '), f.date], chips:()=>[]},
  {key:'intl', name:'국제학술활동', table:'서술 3.1', rule:'최근 5년 국제학회 수상, 초청강연·기조연설·좌장·위원회, 국제학술지 편집위원, 국제 저술. 국내 학회 수상·국내 활동은 <b>산업·사회 기여·국내 활동</b> 탭에 넣어 주세요.',
   fields:[
    {k:'kind',l:'구분',t:'select',o:'intlkind',req:1},
    {k:'date',l:'일자·기간',t:'text',ph:'2025.05',req:1},
    {k:'event',l:'학회·학술지명',t:'text',req:1,full:1},
    {k:'place',l:'개최지',t:'text'},
    {k:'content',l:'내용 (강연 제목·역할)',t:'text'},
   ], title:f=>f.event, meta:f=>[f.kind, f.place, f.date, f.content], chips:()=>[]},
  {key:'collab', name:'국제공동연구', table:'3-6', rule:'최근 5년 국외 연구자와의 공동 업적. 신청서에는 <b>1인당 2건</b>. 논문·특허 탭에서 <b>국제 = 예</b>로 한 항목은 아래에 자동으로 모입니다 (수정은 원래 탭에서). 논문·특허가 아닌 공동연구(공동 과제, MOU 등)만 <b>+ 추가</b>로 넣어 주세요.',
   fields:[
    {k:'output',l:'성과 (논문 서지 또는 DOI)',t:'text',req:1,full:1},
    {k:'partner',l:'국외 공동연구자',t:'text',req:1},
    {k:'inst',l:'국가 / 소속기관',t:'text',req:1},
    {k:'year',l:'연도',t:'text',ph:'2025'},
   ], title:f=>f.output, meta:f=>[f.partner, f.inst, f.year], chips:()=>[]},
  {key:'ex', name:'외국기관 교류', table:'서술 3.1', rule:'최근 5년 해외 기관 연수, 외국 연구자 방문(온라인 포함). Letter·e-mail 등 <b>증빙 필수</b>.',
   fields:[
    {k:'kind',l:'구분',t:'select',o:'exkind',req:1,full:1},
    {k:'inst',l:'기관 / 연구자',t:'text',req:1},
    {k:'period',l:'기간',t:'text',ph:'2025.08.11 ~ 08.12'},
    {k:'topic',l:'주제 · 내용',t:'text',full:1},
    {k:'proof',l:'증빙 있음',t:'yn'},
   ], title:f=>f.inst, meta:f=>[f.kind, f.period, f.topic], chips:f=>[f.proof!=='예'&&['fix','증빙 확인 필요']]},
  {key:'stu', name:'지도학생 실적', table:'2-4 · 2-6 · 2-7 · 2-9', rule:'<b>최근 5년(2021~)</b> 지도학생의 학회 발표, 특허·기술이전·창업, 수상(<b>교내·교외·국제</b>를 나눠 골라 주세요), 해외 연구실 공동연구(15일 이상). 5단계는 대학원생 연구성과를 논문·학회·특허 밖의 학술 활동까지 넓혀 보므로 <b>기타 학술 활동</b>(학생 연구과제 선정, 연구 데이터·코드 공개, 학술대회 학생 좌장·운영위원 등)도 넣어 주세요. 학생 주저자 <b>논문은 논문 탭</b>에 표시하면 돼요. 학생은 명단에서 고릅니다.',
   fields:[
    {k:'student',l:'학생',t:'student',req:1},
    {k:'kind',l:'구분',t:'select',o:'stukind',req:1},
    {k:'date',l:'일자',t:'text',ph:'2025.10'},
    {k:'title',l:'내용 (발표 제목·학회명·특허명 등)',t:'text',req:1,full:1},
   ], title:f=>f.title, meta:f=>[f.student, f.kind, f.date], chips:f=>[f.kind==='수상'&&['fix','수상 구분 다시 선택 (교내·교외·국제)']]},
];
CATS.forEach(c=>c.fields.push({k:'note',l:'비고',t:'text',full:1})); // 모든 항목 맨 아래에 비고 칸 (카드에도 표시)
const CAT = Object.fromEntries(CATS.map(c=>[c.key,c]));
/* 작성 예시 (가상의 자료) */
const EX = {
  paper:[
    {doi:'10.1038/s41467-024-00000-0',title:'Single-cell atlas of the aging mouse hippocampus reveals microglial states linked to memory decline',journal:'NATURE COMMUNICATIONS',ym:'2024.05',vol:'15(1)',pages:'4321',if:'14.7',jcr:'8.5',if_cur:'15.7',jcr_cur:'7.4',role:'교신',nauth:'12',nmain:'2',student:'홍길동',intl:'예',partner:'John Smith',pinst:'미국 / Stanford University',rep:'예',merit:'노화 해마의 미세아교세포 상태를 단일세포 수준에서 처음 규명하여 ...'},
    {doi:'10.3390/ijms25000000',title:'Effect of compound X on hepatic lipid metabolism in high-fat diet mice',journal:'INTERNATIONAL JOURNAL OF MOLECULAR SCIENCES',ym:'2023.11',vol:'24(22)',pages:'16001',if:'4.9',jcr:'25.0',role:'1저자',nauth:'6',nmain:'2',intl:'아니오'},
    {doi:'10.1016/j.example.2022.000000',title:'Multicenter cohort study of biomarker Y in chronic kidney disease',journal:'KIDNEY INTERNATIONAL',ym:'2022.03',vol:'101(3)',pages:'500-512',if:'19.6',jcr:'1.2',role:'공저자',nauth:'25',nmain:'3',intl:'아니오'},
  ],
  grant:[
    {title:'노화 뇌의 단일세포 전사체 지도 구축',ministry:'과학기술정보통신부 / 한국연구재단',program:'중견연구자지원사업',gtype:'정부 (지자체 포함)',grole:'연구책임자',knu:'예',start:'2023-03-01',end:'2028-02-29',total:'750000',rep:'예',paid:{2023:'150000',2024:'150000',2025:'150000'}},
    {title:'신규 항염증 후보물질 효능 평가',ministry:'(주)OO바이오',program:'산학협력 연구용역',gtype:'산업체 (국내)',grole:'연구책임자',knu:'예',start:'2024-07-01',end:'2025-06-30',total:'60000',paid:{2024:'30000',2025:'30000'}},
    {title:'대사질환 정밀의료 플랫폼 개발 (세부 2: 오믹스 분석)',ministry:'보건복지부 / 한국보건산업진흥원',program:'보건의료기술연구개발사업',gtype:'정부 (지자체 포함)',grole:'공동연구원',knu:'아니오',share:'20',start:'2022-04-01',end:'2026-12-31',total:'2000000'},
    {title:'International consortium on brain aging',ministry:'NIH (미국)',program:'R01 하위과제',gtype:'해외기관',grole:'세부(위탁)과제 책임자',knu:'예',start:'2025-01-01',end:'2027-12-31',total:'120000',paid:{2025:'40000'}},
  ],
  ip:[
    {kind:'등록특허',date:'2024-08-20',title:'알츠하이머병 진단용 바이오마커 조성물 및 이를 이용한 진단 방법',country:'한국',number:'10-2700000',holder:'경북대학교 산학협력단',inventors:'홍길동, 김철수',intl:'아니오',rep:'예',merit:'혈액 바이오마커로 조기 진단 정확도 90% 이상 ...'},
    {kind:'기술이전',date:'2025-02-10',title:'항염증 펩타이드 제조 기술',holder:'경북대학교 산학협력단',inventors:'홍길동',amount:'50000',intl:'아니오'},
    {kind:'창업',date:'2023-09-01',title:'(주)OO진단 — 교원창업 (대표 홍길동, 연구소기업)',country:'한국',number:'사업자 123-45-67890',intl:'아니오'},
    {kind:'북챕터',date:'2022-03-15',title:'Chapter 7. Microglial states at single-cell resolution — Single-Cell Genomics in Neuroscience (Springer)',country:'독일',number:'ISBN 978-3-000-00000-0',inventors:'Hong GD, Smith J',intl:'예',partner:'John Smith',pinst:'미국 / Stanford University',rep:'예',merit:'단일세포 분석을 신경과학 연구에 적용하는 방법을 정리한 Springer 전문서의 한 장을 국외 공동연구자와 함께 집필 ...'},
  ],
  top:[
    {ttype:'논문',year:'2022',output:'Hong GD et al. Cell. 2022;185(3):400-415. DOI 10.1016/j.cell.2022.00.000',desc:'세계 최초로 ... 를 규명하여 인용 300회 이상, 후속 연구의 표준 자료로 쓰임'},
    {ttype:'특허',year:'2021',output:'등록특허 10-2000000 "OO 치료용 조성물" (경북대학교 산학협력단)',desc:'기술이전(3억 원) 후 임상 1상 진입'},
  ],
  edu:[
    {kind:'대학원 교육용 저서·book chapter',title:'의생명 빅데이터 분석 입문 (공저, 대학원 교재)',year:'2024',merit:'의과학과 대학원 필수 과목 교재로 채택되어 ...'},
    {kind:'번역서',title:'「분자세포생물학」 9판 번역 (공역, 3장 담당)',year:'2023',merit:'대학원 기초 과목 교재로 사용'},
    {kind:'교육 관련 논문',title:'Flipped learning in graduate bioinformatics course (Korean J Med Educ, 2025)',year:'2025',merit:'대학원 강의 개선 효과를 정량 분석'},
    {kind:'교육 수상 (교외)',title:'한국의학교육학회 우수교육자상',year:'2024',merit:'교외 학회 수상 (교내 수상은 제외)'},
    {kind:'MOOC·KMOOC·OCW·PBL',title:'K-MOOC "생명정보학 실습" 개발·운영',year:'2023',merit:'수강생 1,200명, 대학원 선수 과목으로 활용'},
    {kind:'신규 교과목 개발·개설',title:'대학원 "공간전사체 분석 실습" 신설',year:'2025',merit:'실습 중심 교과로 학생 연구 역량 강화'},
  ],
  lec:[
    {term:'2025-2',dept:'의과학과 대학원',course:'단일세포 유전체학 특론',eng:'예',credit:'3',hours:'3'},
    {term:'2024-1',dept:'타 학과 대학원',course:'생명과학과 대학원 「분자약리학」',eng:'아니오',credit:'3',hours:'1.5'},
  ],
  soc:[
    {kind:'정부·지자체 위원회·정책 자문',title:'대구시 바이오헬스 산업 육성 자문위원',fields:['정책 기여','거버넌스 구축'],date:'2024.03 ~ 현재',summary:'시 정책 보고서 공동 집필, 산업 육성 계획 자문'},
    {kind:'기업 자문·기술 지원',title:'지역 바이오 기업 기술 자문',fields:['기업현안 해결'],date:'2023.05 ~ 2024.12',summary:'(주)OO바이오 등 3개사 분석 기술 문제 해결 지원'},
    {kind:'재교육·대중 강연',title:'의료기관 연구원 대상 데이터 분석 재교육',fields:['인력 재교육','미래/글로벌 대응'],date:'2025.07',summary:'병원 연구 인력 40명 대상 AI·오믹스 분석 교육 운영'},
    {kind:'학회 임원 (학회장·이사·위원)',title:'대한생리학회 학술이사',date:'2024.01 ~ 현재',summary:'춘·추계 학술대회 프로그램 기획·운영'},
    {kind:'RB·CRB 등 평가위원',title:'한국연구재단 기초연구사업 RB 위원',date:'2025.03',summary:'생명과학 분야 신규 과제 평가'},
    {kind:'국내 학술지 편집위원',title:'Molecules and Cells 편집위원',date:'2023.01 ~ 현재'},
    {kind:'국내 초청강연·기조연설·좌장',title:'대한의생명과학회 추계학술대회 초청강연 "단일세포 분석의 최신 동향"',date:'2025.11'},
    {kind:'국내 학회 수상',title:'대한생화학분자생물학회 학술상',date:'2024.05'},
    {kind:'국내 공동연구 (타 기관)',title:'서울대병원 OO 교수팀과 코호트 공동연구 (공동 논문 2편)',date:'2023.03 ~ 현재'},
    {kind:'국내 기관 교류·연수',title:'한국뇌연구원 연구 교류 (공동 세미나·장비 공동 활용)',date:'2024.06'},
  ],
  intl:[
    {kind:'국제학회 수상',date:'2024.11',event:'Society for Neuroscience 2024',place:'미국 Chicago',content:'Young Investigator Award'},
    {kind:'초청강연',date:'2025.05',event:'Keystone Symposia: Neuroinflammation',place:'미국 Breckenridge',content:'Spatial transcriptomics of microglia (초청 연자)'},
    {kind:'기조연설',date:'2023.10',event:'Asian Pacific Society for Neurochemistry',place:'일본 Tokyo',content:'Keynote: Brain aging at single-cell resolution'},
    {kind:'좌장',date:'2024.06',event:'FAOPS 2024',place:'인도 New Delhi',content:'Session 5 좌장'},
    {kind:'위원회',date:'2022.01 ~ 현재',event:'International Society for ○○',content:'Program Committee 위원'},
    {kind:'국제학술지 편집위원',date:'2023.03 ~ 현재',event:'Frontiers in Neuroscience (SCIE)',content:'Associate Editor'},
    {kind:'국제 저술',date:'2022.03',event:'Springer — Single-Cell Genomics in Neuroscience',content:'Chapter 7 단독 집필'},
  ],
  collab:[
    {output:'미국 NIH와 공동과제 "Brain aging atlas" 공동 수행 (MOU 체결)',partner:'Jane Doe',inst:'미국 / NIH',year:'2024'},
    {output:'독일 막스플랑크연구소와 연구 인력 교류·공동 데이터 분석',partner:'Hans Müller',inst:'독일 / Max Planck Institute',year:'2023'},
  ],
  ex:[
    {kind:'해외 기관 연수',inst:'일본 RIKEN / Dr. Tanaka',period:'2025.08.11 ~ 08.22',topic:'공간전사체 분석 기법 연수',proof:'예'},
    {kind:'외국 연구자 국내 방문 (온라인 포함)',inst:'미국 Stanford University / Dr. John Smith',period:'2024.10.15',topic:'공동연구 논의 및 대학원생 세미나 (온라인)',proof:'예'},
  ],
  roster:[
    {name:'홍길동',sid:'2021xxxxxx',degree:'박사',status:'졸업',bk:'아니오',bkever:'예',admit:'2021.03',grad:'2025.08',foreign:'아니오',ckind:'취업',career:'한국뇌연구원 박사후연구원',crep:'예',cdesc:'재학 중 단일세포 분석 연구로 Nature Communications 등에 주저자 논문을 게재하고 미국 Stanford University에서 6주간 파견 공동연구를 수행함. 졸업 직후 한국뇌연구원 박사후연구원으로 임용되어 교육연구단에서 익힌 분석 기술로 노화 뇌 연구를 이어 가고 있음.'},
    {name:'김철수',sid:'2024xxxxxx',degree:'석사',status:'재학',bk:'예',admit:'2024.03',foreign:'아니오'},
    {name:'Nguyen Van A',sid:'2023xxxxxx',degree:'석박통합',status:'재학',bk:'예',admit:'2023.09',foreign:'예'},
    {name:'이영희',sid:'2022xxxxxx',degree:'석사',status:'수료',bk:'예',admit:'2022.03',foreign:'아니오',med:'예'},
    {name:'박민수',degree:'박사후연구원',status:'계약 중',bk:'예',admit:'2025.03',foreign:'아니오'},
    {name:'최지은',sid:'2022xxxxxx',degree:'학부연구생',status:'재학',bk:'아니오',admit:'2025.01',foreign:'아니오',med:'예'},
    {name:'정하늘',sid:'2023xxxxxx',degree:'학·석 연계과정',status:'재학',bk:'아니오',admit:'2025.03',foreign:'아니오'},
    {name:'오하나',degree:'입학 예정 인턴',status:'학부 재학',bk:'아니오',admit:'2026.07',foreign:'아니오',med:'아니오'},
  ],
  stu:[
    {student:'김철수',kind:'학회 발표 (국제)',date:'2025.10',title:'Society for Neuroscience 2025 포스터 발표 "Microglial aging ..."'},
    {student:'김철수',kind:'학회 발표 (국내)',date:'2025.05',title:'대한생리학회 춘계학술대회 구연 발표'},
    {student:'Nguyen Van A',kind:'특허·기술이전·창업',date:'2025.02',title:'등록특허 10-2700000 공동발명자'},
    {student:'이영희',kind:'수상 (교외·국내)',date:'2024.11',title:'한국분자세포생물학회 우수 포스터상'},
    {student:'홍길동',kind:'해외 연구실 공동연구 (15일 이상)',date:'2024.07 ~ 2024.08',title:'미국 Stanford University Smith Lab 6주 파견 공동연구'},
    {student:'김철수',kind:'기타 학술 활동',date:'2025.05',title:'학생 연구과제 선정 — 한국연구재단 석사과정생 연구장려금 (연구책임자)'},
    {student:'Nguyen Van A',kind:'기타 학술 활동',date:'2025.06',title:'단일세포 분석 코드·데이터셋 공개 (GitHub, 논문 부록 데이터)'},
  ],
};
/* 날짜 기준 (정렬·기간 취합) */
const DKEY={paper:'ym',grant:'start',ip:'date',top:'year',edu:'year',lec:'term',soc:'date',intl:'date',collab:'year',ex:'period',roster:'admit',stu:'date'};
function ymOf(v){const s=String(v||'');let m=s.match(/^(\d{4})-([12])$/);if(m)return +m[1]*100+(m[2]==='1'?3:9);m=s.match(/(\d{4})(?:\s*[.\-\/]\s*(\d{1,2}))?/);return m?+m[1]*100+(+m[2]||0):0}
const dkey=i=>ymOf(i.f[DKEY[i.cat]]);
