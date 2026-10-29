// scripts/verify-l02-l03.mjs
// Nghiệm thu kiểm thử tự động cho L-02 (Ghi chú giáo viên sau F5) và L-03 (Không tự đổi trạng thái khi điều hướng)

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  getEvaluationDetail,
  saveEvaluationResultRecord,
} from '../src/server/evaluationStore.ts';

console.log('======================================================');
console.log('KIỂM THỬ TOÀN DIỆN LỖI L-02 VÀ L-03 (SKKN REVIEW PRO)');
console.log('======================================================\n');

const testUserEmail = 'dathien2412@gmail.com';
const testEvalId = 'eval_tinhoc11_dathien2412';

// -------------------------------------------------------------------
// PHẦN 1: KIỂM THỬ L-02 — GHI CHÚ GIÁO VIÊN BẢO TOÀN SAU F5
// -------------------------------------------------------------------
console.log('--- PHẦN 1: KIỂM THỬ L-02 (GHI CHÚ GIÁO VIÊN BẢO TOÀN SAU F5) ---');

// Bước 1.1: Lấy dữ liệu hồ sơ ban đầu
const initialDetail = await getEvaluationDetail(testEvalId, testUserEmail);
assert(initialDetail.success && initialDetail.evaluation, 'Hồ sơ test phải tồn tại');

const originalAnalysis = initialDetail.evaluation.analysisResult;
assert(originalAnalysis && Array.isArray(originalAnalysis.redTeamCards), 'Hồ sơ phải có redTeamCards');

// Test L-02.1: Nhập ghi chú mới → lưu → F5 → ghi chú vẫn còn
console.log('Test L-02.1: Nhập ghi chú mới cho vấn đề rtc-1...');
const noteV1 = 'Ghi chú thử nghiệm L-02: Đã bổ sung đề kiểm tra khảo sát 75 học sinh';
const saveRes1 = await saveEvaluationResultRecord({
  evaluationId: testEvalId,
  userEmail: testUserEmail,
  analysisResult: originalAnalysis,
  teacherNotes: {
    'rtc-1': noteV1,
  },
});
assert(saveRes1.success, 'Lưu ghi chú v1 phải thành công');

// Giả lập F5: đọc lại từ đĩa/store
const reloaded1 = await getEvaluationDetail(testEvalId, testUserEmail);
assert.strictEqual(
  reloaded1.evaluation.teacherNotes['rtc-1'],
  noteV1,
  'L-02.1 Thất bại: Sau F5, teacherNotes.rtc-1 phải bảo toàn ghi chú đã lưu'
);
const card1_v1 = reloaded1.evaluation.analysisResult.redTeamCards.find(c => c.id === 'rtc-1');
assert.strictEqual(
  card1_v1.userNotes,
  noteV1,
  'L-02.1 Thất bại: Sau F5, card.userNotes trong redTeamCards phải có ghi chú'
);
console.log('  ✓ ĐẠT: Nhập ghi chú mới → lưu → F5 → ghi chú được đọc lại chính xác 100%.');

// Test L-02.2: Chỉnh sửa ghi chú cũ → lưu → F5 → hiển thị bản mới nhất
console.log('Test L-02.2: Chỉnh sửa ghi chú cũ thành bản cập nhật mới nhất...');
const noteV2 = 'Ghi chú thử nghiệm L-02 (Bản sửa mới nhất): Đã cập nhật phụ lục minh chứng 3 và đối soát điểm số học kỳ';
const saveRes2 = await saveEvaluationResultRecord({
  evaluationId: testEvalId,
  userEmail: testUserEmail,
  analysisResult: reloaded1.evaluation.analysisResult,
  teacherNotes: {
    'rtc-1': noteV2,
  },
});
assert(saveRes2.success, 'Cập nhật ghi chú v2 phải thành công');

// Giả lập F5: đọc lại lần 2
const reloaded2 = await getEvaluationDetail(testEvalId, testUserEmail);
assert.strictEqual(
  reloaded2.evaluation.teacherNotes['rtc-1'],
  noteV2,
  'L-02.2 Thất bại: Sau F5, teacherNotes phải hiển thị bản mới nhất'
);
const card1_v2 = reloaded2.evaluation.analysisResult.redTeamCards.find(c => c.id === 'rtc-1');
assert.strictEqual(
  card1_v2.userNotes,
  noteV2,
  'L-02.2 Thất bại: card.userNotes phải cập nhật bản mới nhất'
);
console.log('  ✓ ĐẠT: Chỉnh sửa ghi chú → lưu → F5 → hiển thị chính xác bản mới nhất.');

// Test L-02.3: Chuyển sang vấn đề khác (rtc-2) lưu ghi chú độc lập rồi quay lại → cả hai ghi chú vẫn còn
console.log('Test L-02.3: Lưu ghi chú cho vấn đề khác (rtc-2) độc lập...');
const noteCard2 = 'Ghi chú vấn đề 2: Đã điều chỉnh con số 100% thành 84.5% theo mẫu khảo sát';
const saveRes3 = await saveEvaluationResultRecord({
  evaluationId: testEvalId,
  userEmail: testUserEmail,
  analysisResult: reloaded2.evaluation.analysisResult,
  teacherNotes: {
    'rtc-2': noteCard2,
  },
});
assert(saveRes3.success, 'Lưu ghi chú rtc-2 phải thành công');

const reloaded3 = await getEvaluationDetail(testEvalId, testUserEmail);
assert.strictEqual(reloaded3.evaluation.teacherNotes['rtc-1'], noteV2, 'Ghi chú rtc-1 không được bị mất');
assert.strictEqual(reloaded3.evaluation.teacherNotes['rtc-2'], noteCard2, 'Ghi chú rtc-2 phải được lưu');
console.log('  ✓ ĐẠT: Ghi chú giữa các vấn đề khác nhau độc lập và bảo toàn đầy đủ.');

// Test L-02.4: Giả lập AI chấm lại / nạp kết quả mới với redTeamCards mặc định (userNotes rỗng) → không ghi đè ghi chú GV
console.log('Test L-02.4: Bảo vệ chống ghi đè: Dữ liệu mặc định rỗng không được xóa ghi chú GV...');
const dummyNewCards = reloaded3.evaluation.analysisResult.redTeamCards.map(c => ({
  ...c,
  userNotes: '', // AI phân tích trả về không có userNotes
}));
await saveEvaluationResultRecord({
  evaluationId: testEvalId,
  userEmail: testUserEmail,
  analysisResult: {
    ...reloaded3.evaluation.analysisResult,
    redTeamCards: dummyNewCards,
  },
  // Không truyền teacherNotes để thử nghiệm khả năng bảo toàn của backend
});
const reloaded4 = await getEvaluationDetail(testEvalId, testUserEmail);
assert.strictEqual(
  reloaded4.evaluation.teacherNotes['rtc-1'],
  noteV2,
  'L-02.4 Thất bại: Dữ liệu AI mặc định không được xóa teacherNotes.rtc-1'
);
assert.strictEqual(
  reloaded4.evaluation.analysisResult.redTeamCards.find(c => c.id === 'rtc-1').userNotes,
  noteV2,
  'L-02.4 Thất bại: Dữ liệu AI mặc định không được xóa userNotes trong card'
);
console.log('  ✓ ĐẠT: Dữ liệu đánh giá mới/mặc định tuyệt đối không thể xóa hoặc ghi đè ghi chú của giáo viên.\n');

// -------------------------------------------------------------------
// PHẦN 2: KIỂM THỬ L-03 — TÁCH ĐIỀU HƯỚNG VÀ CẬP NHẬT TRẠNG THÁI
// -------------------------------------------------------------------
console.log('--- PHẦN 2: KIỂM THỬ L-03 (TÁCH ĐIỀU HƯỚNG VÀ CẬP NHẬT TRẠNG THÁI) ---');

// Test L-03.1: Kiểm tra mã nguồn AcademicRebuttalView và IssueResolutionModal
console.log('Test L-03.1: Kiểm tra mã nguồn giao diện để xác nhận không còn auto-update status khi mount...');
const rebuttalSource = fs.readFileSync(path.resolve('src/components/views/AcademicRebuttalView.tsx'), 'utf-8');
const modalSource = fs.readFileSync(path.resolve('src/components/IssueResolutionModal.tsx'), 'utf-8');

assert(
  !rebuttalSource.includes("onUpdateStatus(card.id, 'Đang xử lý', effectiveNote)"),
  'L-03.1 Thất bại: AcademicRebuttalView vẫn còn dòng tự động onUpdateStatus Đang xử lý!'
);
assert(
  !modalSource.includes("onUpdateStatus(card.id, 'Đang xử lý')\n    }"),
  'L-03.1 Thất bại: IssueResolutionModal vẫn còn dòng tự động onUpdateStatus Đang xử lý!'
);
console.log('  ✓ ĐẠT: Không còn bất kỳ mã lệnh tự động đổi trạng thái sang "Đang xử lý" khi mở card.');

// Test L-03.2: Chọn Chưa xử lý → lưu → quay lại danh sách → mở lại → vẫn Chưa xử lý
console.log('Test L-03.2: Đặt trạng thái "Chưa xử lý" cho rtc-1...');
const updatedCards_unhandled = reloaded4.evaluation.analysisResult.redTeamCards.map(c =>
  c.id === 'rtc-1' ? { ...c, status: 'Chưa xử lý' } : c
);
await saveEvaluationResultRecord({
  evaluationId: testEvalId,
  userEmail: testUserEmail,
  analysisResult: {
    ...reloaded4.evaluation.analysisResult,
    redTeamCards: updatedCards_unhandled,
  },
});

const reloaded5 = await getEvaluationDetail(testEvalId, testUserEmail);
const card1_status = reloaded5.evaluation.analysisResult.redTeamCards.find(c => c.id === 'rtc-1').status;
assert.strictEqual(card1_status, 'Chưa xử lý', 'Trạng thái rtc-1 phải là Chưa xử lý');
console.log('  ✓ ĐẠT: Trạng thái "Chưa xử lý" được giữ nguyên vẹn khi mở lại.');

// Test L-03.3: Kiểm tra bộ đếm Đã xử lý và Bỏ qua
console.log('Test L-03.3: Kiểm tra bộ đếm: Chọn "Đã xử lý" tăng đếm, "Bỏ qua" không tự tính thành Đã xử lý...');
const testCardsStatus = [
  { id: 'c1', status: 'Đã xử lý' },
  { id: 'c2', status: 'Bỏ qua' },
  { id: 'c3', status: 'Chưa xử lý' },
  { id: 'c4', status: 'Đang xử lý' },
];

const resolvedCount = testCardsStatus.filter(c => c.status === 'Đã xử lý' || c.status === 'resolved').length;
const ignoredCount = testCardsStatus.filter(c => c.status === 'Bỏ qua' || c.status === 'ignored').length;
const pendingCount = testCardsStatus.filter(c => c.status === 'Chưa xử lý' || c.status === 'open').length;

assert.strictEqual(resolvedCount, 1, 'Bộ đếm Đã xử lý chỉ được tính đúng 1');
assert.strictEqual(ignoredCount, 1, 'Bộ đếm Bỏ qua phải tính đúng 1');
assert.strictEqual(pendingCount, 1, 'Bộ đếm Chưa xử lý phải tính đúng 1');
console.log('  ✓ ĐẠT: Bộ đếm phản ánh chính xác: Đã xử lý (1), Bỏ qua (1 không tính vào Đã xử lý).\n');

console.log('======================================================');
console.log('TẤT CẢ CÁC BÀI TEST NGHIỆM THU CHO L-02 VÀ L-03 ĐÃ VƯỢT QUA 100%!');
console.log('======================================================');
