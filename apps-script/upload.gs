/**
 * BK21 실적 입력 — 증빙 파일 업로드 서버 (Google Apps Script)
 * 앱에서 보낸 파일을 내 구글 드라이브 '행정/#BK서류/증빙파일/교수명/항목' 폴더에 저장한다.
 * 앱에서 ×로 지운 증빙은 드라이브에서도 휴지통으로 옮긴다 (30일 동안 되살릴 수 있다).
 * 링크로 연 앱(Firebase 익명 로그인 + 등록된 개인 링크)에서 온 요청만 받는다.
 *
 * 배포: 배포 → 새 배포 → 유형 '웹 앱' → 실행: 나 / 액세스: 모든 사용자 → 배포 → '/exec' 주소 복사
 * 처음 한 번: 위 함수 목록에서 setup 을 골라 실행 → 권한 허용
 * 코드를 고친 뒤: 배포 → 배포 관리 → 연필(수정) → 버전 '새 버전' → 배포 ('/exec' 주소는 그대로)
 */
const PROJECT = 'bk21-survey';
// 내 드라이브 아래 경로 (G:\내 드라이브\행정\#BK서류). 이 폴더는 미리 있어야 한다.
const BASE_PATH = ['행정', '#BK서류'];
const SUB_NAME = '실적_증빙_파일';   // 그 안에 만들 하위 폴더
const MAX_MB = 20;

function setup() {
  PropertiesService.getScriptProperties().deleteProperty('ROOT');
  const f = root_();
  Logger.log('준비 완료: ' + BASE_PATH.join('/') + '/' + SUB_NAME + ' → ' + f.getUrl());
}

function doGet() { return out_({ ok: true, msg: 'BK21 증빙 업로드 서버' }); }

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d.uid || !d.token) return out_({ ok: false, error: 'bad request' });
    // 앱 세션 확인: 본인 세션 문서는 본인 토큰으로만 읽힌다 (Firestore 규칙)
    const r = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT +
      '/databases/(default)/documents/sessions/' + encodeURIComponent(d.uid),
      { headers: { Authorization: 'Bearer ' + d.token }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return out_({ ok: false, error: 'auth' });

    if (d.action === 'delete') return out_(trash_(d.id));
    if (!d.data) return out_({ ok: false, error: 'bad request' });

    const bytes = Utilities.base64Decode(d.data);
    if (bytes.length > MAX_MB * 1024 * 1024) return out_({ ok: false, error: 'too large' });

    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    let folder;
    try { folder = sub_(sub_(root_(), clean_(d.prof)), clean_(d.cat)); } finally { lock.releaseLock(); }

    const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyMMdd');
    const name = clean_((d.title ? d.title + '_' : '') + stamp + '_' + d.name).slice(0, 180);
    const file = folder.createFile(Utilities.newBlob(bytes, d.mime || 'application/octet-stream', name));
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
    return out_({ ok: true, id: file.getId(), name: d.name, url: file.getUrl() });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

// 증빙 폴더 안의 파일만 휴지통으로 옮긴다 (내 드라이브의 다른 파일은 못 지우게).
// 이미 지워졌거나 폴더 밖으로 옮겨 둔 파일은 그대로 두고 ok — 앱에서는 연결만 떼면 된다.
function trash_(id) {
  if (!id) return { ok: false, error: 'bad request' };
  let file;
  try { file = DriveApp.getFileById(id); } catch (_) { return { ok: true }; }
  const rootId = root_().getId();
  let ps = file.getParents();
  while (ps.hasNext()) {
    const f = ps.next();
    if (f.getId() === rootId) { file.setTrashed(true); break; }
    ps = f.getParents();
  }
  return { ok: true };
}

function root_() {
  const p = PropertiesService.getScriptProperties(), id = p.getProperty('ROOT');
  if (id) { try { return DriveApp.getFolderById(id); } catch (_) {} }
  let base = DriveApp.getRootFolder();
  BASE_PATH.forEach(n => {
    const it = base.getFoldersByName(n);
    if (!it.hasNext()) throw new Error('내 드라이브에서 폴더를 찾지 못했어요: ' + BASE_PATH.join('/') + ' (' + n + ')');
    base = it.next();
  });
  const f = sub_(base, SUB_NAME); p.setProperty('ROOT', f.getId()); return f;
}
function sub_(parent, name) { const it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name); }
function clean_(s) { return String(s || '기타').replace(/[\\/:*?"<>|\n\r]/g, '_').trim() || '기타'; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
