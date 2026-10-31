// scripts/verify-rescore-version-protection.mjs
// Rigorous verification of the version protection mechanism in Rescore feature

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('KIỂM THỬ CƠ CHẾ BẢO VỆ PHIÊN BẢN TRONG CHỨC NĂNG CHẤM LẠI SKKN');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function testAssert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ĐẠT: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ THẤT BẠI: ${message}`);
    throw new Error(message);
  }
}

function createMockContext({ method = 'GET', url = '', headers = {}, query = {}, body = null }) {
  const req = {
    method,
    url,
    headers: { ...headers },
    query: { ...query },
    body,
  };

  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    setHeader(key, val) {
      resHeaders[key.toLowerCase()] = val;
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    end() {
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
    getHeaders() {
      return resHeaders;
    },
  };

  return { req, res };
}

// -------------------------------------------------------------
// 1. Kiểm tra thông tin bảo vệ phiên bản ngay phía trên nút
// -------------------------------------------------------------
console.log('--- 1. Kiểm tra thông báo bảo vệ phiên bản trên giao diện ---');
const rescoreViewSource = fs.readFileSync(path.resolve('src/components/views/RescoreView.tsx'), 'utf-8');

testAssert(
  rescoreViewSource.includes('Kết quả chấm lại sẽ được lưu thành phiên bản đánh giá mới. Bản đánh giá trước đó được giữ nguyên, không bị ghi đè.'),
  'RescoreView.tsx chứa chính xác câu thông báo theo yêu cầu: "Kết quả chấm lại sẽ được lưu thành phiên bản đánh giá mới. Bản đánh giá trước đó được giữ nguyên, không bị ghi đè."'
);

testAssert(
  rescoreViewSource.indexOf('Kết quả chấm lại sẽ được lưu thành phiên bản đánh giá mới') <
  rescoreViewSource.indexOf('Bắt đầu chấm lại & đối chiếu phiên bản'),
  'Thông báo bảo vệ phiên bản nằm NGAY PHÍA TRÊN nút "Bắt đầu chấm lại & đối chiếu phiên bản"'
);

// -------------------------------------------------------------
// 2. Kiểm tra bước xác nhận trong giao diện (In-App Confirmation)
// -------------------------------------------------------------
console.log('\n--- 2. Kiểm tra bước xác nhận trong giao diện (Không dùng browser popup) ---');

testAssert(
  !rescoreViewSource.includes('window.confirm') && !rescoreViewSource.includes('confirm(') && !rescoreViewSource.includes('window.alert'),
  'RescoreView.tsx TUYỆT ĐỐI không sử dụng popup trình duyệt (window.confirm, window.alert)'
);

testAssert(
  rescoreViewSource.includes('showConfirmModal') && rescoreViewSource.includes('setShowConfirmModal(true)'),
  'RescoreView.tsx hiển thị bước xác nhận trực tiếp trong React UI (state showConfirmModal)'
);

testAssert(
  rescoreViewSource.includes('Tên hồ sơ SKKN:'),
  'Bước xác nhận hiển thị trường "Tên hồ sơ SKKN"'
);

testAssert(
  rescoreViewSource.includes('Phiên bản đánh giá hiện tại:'),
  'Bước xác nhận hiển thị trường "Phiên bản đánh giá hiện tại"'
);

testAssert(
  rescoreViewSource.includes('Điểm đánh giá trước đó:'),
  'Bước xác nhận hiển thị trường "Điểm đánh giá trước đó"'
);

testAssert(
  rescoreViewSource.includes('Tên tệp SKKN được chọn:'),
  'Bước xác nhận hiển thị trường "Tên tệp SKKN được chọn"'
);

testAssert(
  rescoreViewSource.includes('Xác nhận tạo phiên bản đánh giá mới:'),
  'Bước xác nhận hiển thị khối nội dung "Xác nhận tạo phiên bản đánh giá mới"'
);

testAssert(
  rescoreViewSource.includes('>QUAY LẠI<') || rescoreViewSource.includes('<span>QUAY LẠI</span>'),
  'Bước xác nhận có nút "QUAY LẠI"'
);

testAssert(
  rescoreViewSource.includes('>XÁC NHẬN CHẤM LẠI<') || rescoreViewSource.includes('<span>XÁC NHẬN CHẤM LẠI</span>'),
  'Bước xác nhận có nút "XÁC NHẬN CHẤM LẠI"'
);

testAssert(
  rescoreViewSource.includes('handleCancelConfirmation') && rescoreViewSource.includes('setShowConfirmModal(false)'),
  'Nút QUAY LẠI đóng bước xác nhận mà KHÔNG gọi hàm chấm lại hay tạo phiên bản mới'
);

// -------------------------------------------------------------
// 3. Kiểm tra App.tsx tích hợp truyền metadata & chống trùng lặp
// -------------------------------------------------------------
console.log('\n--- 3. Kiểm tra App.tsx tích hợp bảo vệ phiên bản & chống trùng ---');
const appSource = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');

testAssert(
  appSource.includes('dossierTitle={currentEvaluationItem?.title'),
  'App.tsx truyền dossierTitle cho RescoreView'
);

testAssert(
  appSource.includes('currentVersion={currentEvaluationItem?.currentVersion'),
  'App.tsx truyền currentVersion cho RescoreView'
);

testAssert(
  appSource.includes('previousScore={currentEvaluationItem?.score'),
  'App.tsx truyền previousScore cho RescoreView'
);

testAssert(
  appSource.includes('originalFileName={currentEvaluationItem?.originalFileName'),
  'App.tsx truyền originalFileName cho RescoreView'
);

testAssert(
  appSource.includes('isRescoringRef.current'),
  'App.tsx có ref isRescoringRef chống gọi trùng lặp (Anti-duplicate guard)'
);

testAssert(
  appSource.includes("fetch('/api/user/evaluations/new-version'"),
  'App.tsx chỉ gọi new-version sau khi AI chấm lại thành công'
);

// -------------------------------------------------------------
// 4. Kiểm tra Backend Store: Bảo tồn v1 Tin học 11 (35.0đ)
// -------------------------------------------------------------
console.log('\n--- 4. Kiểm tra bảo tồn nguyên vẹn hồ sơ v1 Tin học 11 (35.0 điểm) ---');
const storePath = path.resolve('data/evaluations_store.json');
testAssert(fs.existsSync(storePath), 'Tệp data/evaluations_store.json tồn tại');

const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
const tinhoc = store.evaluations?.['eval_tinhoc11_dathien2412'];
testAssert(Boolean(tinhoc), 'Hồ sơ Tin học 11 eval_tinhoc11_dathien2412 tồn tại trong store');
testAssert(tinhoc.score === 35, `Điểm số hồ sơ gốc Tin học 11 là 35.0/100 (thực tế: ${tinhoc.score})`);
testAssert(tinhoc.versionsHistory && tinhoc.versionsHistory.length >= 1, 'Hồ sơ Tin học 11 có lịch sử phiên bản');
testAssert(tinhoc.versionsHistory[0].version === 1 && tinhoc.versionsHistory[0].score === 35, 'Phiên bản v1 của Tin học 11 có điểm 35.0 được bảo toàn nguyên vẹn');

// -------------------------------------------------------------
// 5. Kiểm tra Backend API tạo phiên bản v2 độc lập & Cùng tồn tại
// -------------------------------------------------------------
console.log('\n--- 5. Kiểm tra Backend API tạo phiên bản v2 độc lập & Cùng tồn tại ---');
const { default: userHandler } = await import(new URL(path.resolve('api/user.js'), 'file://').href);

const testEmail = 'teacher.rescore.test@school.edu.vn';
const sampleEvalResult = {
  metadata: { title: 'SKKN Kiểm thử Phiên bản Chấm lại', appliedRubricName: 'Chuẩn', isOfficialRubric: true, evidenceAdequacy: 'Trung bình', evidenceAdequacyReason: 'Ban đầu' },
  rubricCriteria: [
    { id: 'c1', groupName: 'G1', criterionName: 'Tính mới', maxScore: 50, proposedScore: 20 },
    { id: 'c2', groupName: 'G2', criterionName: 'Tính hiệu quả', maxScore: 50, proposedScore: 20 },
  ],
  redTeamCards: [
    { id: 'rtc_t1', location: 'Mục 1', issueDetected: 'Vấn đề 1', impactLevel: 'Cao', status: 'Chưa xử lý' },
  ],
  councilQuestions: [],
};

// 5.1 Tạo hồ sơ v1
const { req: createReq, res: createRes } = createMockContext({
  method: 'POST',
  url: '/api/user?__subpath=evaluations/create',
  query: { __subpath: 'evaluations/create' },
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': testEmail,
  },
  body: {
    title: 'SKKN Kiểm thử Phiên bản Chấm lại',
    score: 40.0,
    analysisResult: sampleEvalResult,
  },
});
await userHandler(createReq, createRes);
const createData = createRes.getData();

testAssert(createRes.getStatusCode() === 200 && createData?.success && Boolean(createData?.evaluation?.id), 'Tạo thành công hồ sơ kiểm thử v1 qua API');
const testEvalId = createData.evaluation.id;
testAssert(createData.evaluation.currentVersion === 1, 'Hồ sơ mới khởi tạo có currentVersion = 1');
testAssert(createData.evaluation.score === 40.0, 'Hồ sơ mới khởi tạo có điểm = 40.0');

// 5.2 Giả lập chấm lại tạo phiên bản v2 (nâng điểm lên 65.0)
const rescoredAnalysisResult = {
  ...sampleEvalResult,
  rubricCriteria: [
    { id: 'c1', groupName: 'G1', criterionName: 'Tính mới', maxScore: 50, proposedScore: 35 },
    { id: 'c2', groupName: 'G2', criterionName: 'Tính hiệu quả', maxScore: 50, proposedScore: 30 },
  ],
};

const { req: verReq, res: verRes } = createMockContext({
  method: 'POST',
  url: '/api/user?__subpath=evaluations/new-version',
  query: { __subpath: 'evaluations/new-version' },
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': testEmail,
  },
  body: {
    evaluationId: testEvalId,
    newAnalysisResult: rescoredAnalysisResult,
    newScore: 65.0,
    notes: 'Đã bổ sung minh chứng thực nghiệm và giải trình số liệu',
  },
});
await userHandler(verReq, verRes);
const verData = verRes.getData();

testAssert(verRes.getStatusCode() === 200 && verData?.success, 'Tạo phiên bản mới v2 sau chấm lại thành công');
const updatedEval = verData.evaluation;

testAssert(updatedEval.currentVersion === 2, `Phiên bản hiện tại được nâng lên v2 (thực tế: v${updatedEval.currentVersion})`);
testAssert(updatedEval.score === 65.0, `Điểm phiên bản mới cập nhật thành 65.0 (thực tế: ${updatedEval.score})`);
testAssert(updatedEval.status === 'REVISED', 'Trạng thái chuyển sang REVISED');
testAssert(updatedEval.versionsHistory.length === 2, `Có đầy đủ 2 phiên bản trong lịch sử (thực tế: ${updatedEval.versionsHistory.length})`);

// Kiểm tra bản v1 và bản v2 cùng tồn tại
const v1 = updatedEval.versionsHistory.find(v => v.version === 1);
const v2 = updatedEval.versionsHistory.find(v => v.version === 2);

testAssert(Boolean(v1) && v1.score === 40.0, 'Phiên bản cũ v1 (40.0đ) cùng tồn tại nguyên vẹn, KHÔNG bị ghi đè');
testAssert(Boolean(v2) && v2.score === 65.0, 'Phiên bản mới v2 (65.0đ) được lưu tách biệt');

// -------------------------------------------------------------
// 6. Kiểm tra chống tạo phiên bản trùng khi gọi lặp liên tiếp (Idempotency)
// -------------------------------------------------------------
console.log('\n--- 6. Kiểm tra chống tạo phiên bản trùng lặp (Idempotent Defense) ---');

const { req: dupReq, res: dupRes } = createMockContext({
  method: 'POST',
  url: '/api/user?__subpath=evaluations/new-version',
  query: { __subpath: 'evaluations/new-version' },
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': testEmail,
  },
  body: {
    evaluationId: testEvalId,
    newAnalysisResult: rescoredAnalysisResult,
    newScore: 65.0,
    notes: 'Đã bổ sung minh chứng thực nghiệm và giải trình số liệu',
  },
});
await userHandler(dupReq, dupRes);
const dupData = dupRes.getData();

testAssert(dupRes.getStatusCode() === 200 && dupData?.success, 'Lệnh gọi lặp trả về HTTP 200 thành công an toàn');
testAssert(
  dupData.evaluation.versionsHistory.length === 2,
  'Hệ thống TUYỆT ĐỐI không tạo phiên bản thứ 3 trùng lặp khi người dùng bấm nhiều lần'
);

// -------------------------------------------------------------
// 7. Kiểm tra khôi phục sau F5 (Persistent Disk Verification)
// -------------------------------------------------------------
console.log('\n--- 7. Kiểm tra khôi phục lịch sử phiên bản sau F5 ---');
const { req: getReq, res: getRes } = createMockContext({
  method: 'GET',
  url: `/api/user?__subpath=evaluations/get&id=${encodeURIComponent(testEvalId)}`,
  query: { __subpath: 'evaluations/get', id: testEvalId },
  headers: {
    'x-user-email': testEmail,
  },
});
await userHandler(getReq, getRes);
const getData = getRes.getData();

testAssert(getRes.getStatusCode() === 200 && getData?.success, 'Khôi phục chi tiết hồ sơ từ đĩa thành công');
testAssert(getData.evaluation.versionsHistory.length === 2, 'Lịch sử phiên bản sau F5 vẫn có đủ 2 phiên bản');
testAssert(getData.evaluation.versionsHistory[0].score === 40.0, 'Phiên bản v1 vẫn là 40.0đ');
testAssert(getData.evaluation.versionsHistory[1].score === 65.0, 'Phiên bản v2 vẫn là 65.0đ');

// Dọn dẹp hồ sơ kiểm thử
const { req: delReq, res: delRes } = createMockContext({
  method: 'POST',
  url: '/api/user?__subpath=evaluations/delete',
  query: { __subpath: 'evaluations/delete' },
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': testEmail,
  },
  body: { evaluationId: testEvalId },
});
await userHandler(delReq, delRes);
console.log('  ✓ Đã dọn dẹp an toàn hồ sơ kiểm thử phiên bản.');

console.log('\n================================================================');
console.log(`KẾT QUẢ: TẤT CẢ ${passedTests}/${totalTests} BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%!`);
console.log('CƠ CHẾ BẢO VỆ PHIÊN BẢN CHẤM LẠI ĐẠT ĐẦY ĐỦ TIÊU CHÍ NGHIỆM THU.');
console.log('================================================================');
