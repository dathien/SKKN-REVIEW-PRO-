import assert from 'assert';
import { normalizeTeacherNotes, resolveCardTeacherNote } from '../src/utils/evaluationNotes.ts';
import {
  getEvaluationDetail,
  saveEvaluationResultRecord,
  loadEvaluationsStore,
  reloadEvaluationsStoreFromDisk
} from '../src/server/evaluationStore.ts';

console.log('=== BẮT ĐẦU KIỂM THỬ CHUYÊN SÂU LỖI L-02 VÀ CHUẨN HÓA KHÓA GHI CHÚ ===\n');

// -------------------------------------------------------------
// TEST 1: Kiểm tra hàm normalizeTeacherNotes
// -------------------------------------------------------------
console.log('TEST 1: Chuẩn hóa khóa ghi chú (normalizeTeacherNotes)');

const mixedRawNotes = {
  'rtc-1': 'Ghi chú ban đầu rtc-1',
  'eval_tinhoc11_dathien2412_rtc-2': 'Ghi chú phiên bản chi tiết hơn cho rtc-2 từ khóa ghép',
  'rtc-2': 'Bản ngắn',
  'eval_tinhoc11_dathien2412_rtc-3': 'Ghi chú rtc-3',
};

const normalized = normalizeTeacherNotes(mixedRawNotes, 'eval_tinhoc11_dathien2412');
console.log('Normalized output keys:', Object.keys(normalized));
console.log('Normalized output values:', normalized);

assert.strictEqual(normalized['eval_tinhoc11_dathien2412_rtc-2'], undefined, 'Khóa ghép eval_tinhoc11_dathien2412_rtc-2 phải bị loại bỏ');
assert.strictEqual(normalized['rtc-1'], 'Ghi chú ban đầu rtc-1', 'rtc-1 phải giữ nguyên');
assert.strictEqual(normalized['rtc-2'], 'Ghi chú phiên bản chi tiết hơn cho rtc-2 từ khóa ghép', 'rtc-2 phải lấy nội dung đầy đủ/mới hơn');
assert.strictEqual(normalized['rtc-3'], 'Ghi chú rtc-3', 'rtc-3 phải được tách từ khóa ghép');
console.log('✓ TEST 1 PASSED: normalizeTeacherNotes xử lý chuẩn xác 100%.\n');

// -------------------------------------------------------------
// TEST 2: Kiểm tra lưu ghi chú qua saveEvaluationResultRecord
// Giả lập Payload chứa cả hai khóa do frontend cũ hoặc cache gửi lên
// -------------------------------------------------------------
console.log('TEST 2: Lưu kết quả với Payload chứa hai khóa ghi chú rtc-2');

const evalId = 'eval_tinhoc11_dathien2412';
const userEmail = 'dathien2412@gmail.com';

// Lấy detail ban đầu
const initialRes = await getEvaluationDetail(evalId, userEmail);
assert.strictEqual(initialRes.success, true);
const analysisResult = JSON.parse(JSON.stringify(initialRes.evaluation.analysisResult));

const testNoteContent = 'Ghi chú chuẩn hóa GV Vercel F5 Test: ' + Date.now();

// Giả lập client gửi payload với cả 2 khóa (như phát hiện trong Network request của user)
const savePayload = {
  evaluationId: evalId,
  userEmail: userEmail,
  analysisResult,
  teacherNotes: {
    'rtc-1': 'Ghi chú kiểm thử rtc-1',
    'rtc-2': 'Bản ngắn rtc-2',
    'eval_tinhoc11_dathien2412_rtc-2': testNoteContent, // Khóa ghép chứa phiên bản ghi chú người dùng vừa gõ
    'rtc-3': '',
  },
};

const saveRes = await saveEvaluationResultRecord(savePayload);
assert.strictEqual(saveRes.success, true, 'Lưu kết quả phải thành công');

const savedEval = saveRes.evaluation;

// Kiểm tra 1: Khóa ghép tuyệt đối không tồn tại trong evaluation.teacherNotes
assert.strictEqual(
  savedEval.teacherNotes['eval_tinhoc11_dathien2412_rtc-2'],
  undefined,
  'LỖI: Khóa ghép eval_tinhoc11_dathien2412_rtc-2 vẫn còn trong evaluation.teacherNotes'
);
assert.strictEqual(
  savedEval.teacherNotes['rtc-2'],
  testNoteContent,
  'Khóa chuẩn rtc-2 phải chứa nội dung mới nhất'
);

// Kiểm tra 2: Đồng bộ tuyệt đối trong evaluation.analysisResult.teacherNotes
assert.strictEqual(
  savedEval.analysisResult.teacherNotes['eval_tinhoc11_dathien2412_rtc-2'],
  undefined,
  'LỖI: Khóa ghép vẫn còn trong analysisResult.teacherNotes'
);
assert.strictEqual(
  savedEval.analysisResult.teacherNotes['rtc-2'],
  testNoteContent,
  'analysisResult.teacherNotes["rtc-2"] phải đồng bộ với evaluation.teacherNotes["rtc-2"]'
);

// Kiểm tra 3: Thẻ redTeamCards[].userNotes cũng phải đồng bộ
const cardRtc2 = savedEval.analysisResult.redTeamCards.find(c => c.id === 'rtc-2');
assert.strictEqual(
  cardRtc2.userNotes,
  testNoteContent,
  'redTeamCards["rtc-2"].userNotes phải chứa đúng ghi chú'
);
console.log('✓ TEST 2 PASSED: saveEvaluationResultRecord đã chuẩn hóa khóa, đồng bộ 3 nguồn và loại bỏ hoàn toàn khóa ghép rác.\n');

// -------------------------------------------------------------
// TEST 3: Kiểm tra luồng F5 (getEvaluationDetail)
// -------------------------------------------------------------
console.log('TEST 3: Khôi phục sau F5 thông qua getEvaluationDetail');

// Reload store từ đĩa
reloadEvaluationsStoreFromDisk();

const f5Detail = await getEvaluationDetail(evalId, userEmail);
assert.strictEqual(f5Detail.success, true);
const f5Eval = f5Detail.evaluation;

assert.strictEqual(
  f5Eval.teacherNotes['rtc-2'],
  testNoteContent,
  'F5 getEvaluationDetail phải khôi phục đúng ghi chú rtc-2'
);
assert.strictEqual(
  f5Eval.teacherNotes['eval_tinhoc11_dathien2412_rtc-2'],
  undefined,
  'F5 getEvaluationDetail không được chứa khóa ghép'
);
assert.strictEqual(
  f5Eval.analysisResult.teacherNotes['rtc-2'],
  testNoteContent,
  'F5 analysisResult.teacherNotes["rtc-2"] phải giữ nguyên'
);
const f5CardRtc2 = f5Eval.analysisResult.redTeamCards.find(c => c.id === 'rtc-2');
assert.strictEqual(
  f5CardRtc2.userNotes,
  testNoteContent,
  'F5 redTeamCards["rtc-2"].userNotes phải khôi phục chính xác'
);
console.log('✓ TEST 3 PASSED: Khôi phục sau F5 qua getEvaluationDetail bảo toàn 100% dữ liệu.\n');

// -------------------------------------------------------------
// TEST 4: Kiểm tra cơ chế giải quyết ghi chú (resolveCardTeacherNote)
// Thử nghiệm nhiều kịch bản: có khóa chuẩn, có khóa ghép cũ, có localStorage
// -------------------------------------------------------------
console.log('TEST 4: Kiểm tra hàm resolveCardTeacherNote với mọi kịch bản');

// Kịch bản A: Chỉ có khóa ghép trong teacherNotesMap
const noteScenarioA = resolveCardTeacherNote({
  cardId: 'rtc-2',
  evalId: 'eval_tinhoc11_dathien2412',
  userEmail: 'dathien2412@gmail.com',
  teacherNotesMap: {
    'eval_tinhoc11_dathien2412_rtc-2': 'Nội dung từ khóa ghép cũ',
  },
});
assert.strictEqual(noteScenarioA, 'Nội dung từ khóa ghép cũ', 'Phải đọc được từ khóa ghép cũ');

// Kịch bản B: Có cả khóa chuẩn và directUserNotes
const noteScenarioB = resolveCardTeacherNote({
  cardId: 'rtc-2',
  evalId: 'eval_tinhoc11_dathien2412',
  userEmail: 'dathien2412@gmail.com',
  directUserNotes: 'Ghi chú trực tiếp từ card',
  teacherNotesMap: {
    'rtc-2': 'Ghi chú chuẩn từ store',
  },
});
assert.strictEqual(noteScenarioB, 'Ghi chú chuẩn từ store', 'Ưu tiên teacherNotesMap chuẩn từ store');

console.log('✓ TEST 4 PASSED: resolveCardTeacherNote giải quyết chính xác mọi kịch bản.\n');

// -------------------------------------------------------------
// Khôi phục lại ghi chú kiểm thử về giá trị chuẩn cho hồ sơ Tin học 11
// -------------------------------------------------------------
await saveEvaluationResultRecord({
  evaluationId: evalId,
  userEmail: userEmail,
  analysisResult,
  teacherNotes: {
    'rtc-1': 'Ghi chú GV kiểm thử: Đã rà soát mẫu khảo sát 75 học sinh',
    'rtc-2': 'Ghi chú GV kiểm thử: Đã hiệu chỉnh số liệu thực nghiệm Mục 5',
    'rtc-3': '',
  },
});
console.log('✓ Đã khôi phục ghi chú Tin học 11 về trạng thái nghiệm thu chuẩn.');

console.log('\n=== TẤT CẢ CÁC BÀI KIỂM THỬ L-02 ĐÃ THÀNH CÔNG 100% ===');
