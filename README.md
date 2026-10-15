https://kkonoo.github.io/bk21-survey/

## 파일

- `index.html` — 화면 뼈대. CSS·JS를 아래 파일에서 차례로 불러와요
- `css/style.css` — 모든 화면 스타일 (라이트·다크)
- `js/` — 기능별 코드. `index.html`에 적힌 순서대로 불러와요 (위 파일의 값을 아래 파일이 써요)
  - `cats.js` 조사 항목 정의 · `core.js` 설정·데이터 읽기·접속 · `views.js` 탭·안내 화면
  - `form.js` 실적 목록·입력 양식 · `qna.js` 질문·답변 · `board.js` 건의사항·업데이트 소식
  - `hex.js` 실적 육각형 · `promo.js` 승진 실적 · `recap.js` 학과 결산
  - `admin.js` 관리자 화면 · `attach.js` 지분확인서·증빙 첨부 · `jcr.js` JCR · `ai.js` 자동 채우기
  - `events.js` 클릭·저장 이벤트와 시작
- `forms/` 지분확인서 양식 · `vendor/` JSZip

코드를 고치면 `index.html`에서 바뀐 파일의 `?v=` 값을 올려 주세요. 브라우저에 남아 있던 옛 파일을 쓰지 않게 하려는 거예요.
