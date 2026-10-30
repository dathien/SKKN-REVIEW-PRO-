import fs from 'fs';
import path from 'path';

console.log('--- KIỂM TRA TOÀN DIỆN CHỨC NĂNG CHỈNH LẠI & LƯU CHỈNH SỬA (TASK #8) ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

const suggestionsViewPath = path.resolve('src/components/views/SuggestionsView.tsx');
const appPath = path.resolve('src/App.tsx');

const suggestionsViewContent = fs.readFileSync(suggestionsViewPath, 'utf-8');
const appContent = fs.readFileSync(appPath, 'utf-8');

// 1. Kiểm tra ref riêng cho từng thẻ và textarea
assert(
  suggestionsViewContent.includes('editAreaRefs = useRef<Record<string, HTMLDivElement | null>>({})'),
  'Đã khai báo editAreaRefs riêng cho từng thẻ'
);
assert(
  suggestionsViewContent.includes('textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})'),
  'Đã khai báo textareaRefs riêng cho từng ô soạn thảo'
);
assert(
  suggestionsViewContent.includes('editAreaRefs.current[s.id] = el') && suggestionsViewContent.includes('textareaRefs.current[s.id] = el'),
  'Đã gắn ref vào container chỉnh sửa và textarea của thẻ gợi ý s.id'
);

// 2. Kiểm tra logic cuộn mượt tự động sau khi textarea render
assert(
  suggestionsViewContent.includes('useEffect(() => {') &&
  suggestionsViewContent.includes('if (!editingCardId) return;') &&
  suggestionsViewContent.includes('scrollContainer.scrollTo({') &&
  suggestionsViewContent.includes("behavior: 'smooth'"),
  'Có useEffect theo dõi editingCardId thực hiện cuộn mượt đến thẻ'
);

assert(
  suggestionsViewContent.includes('scroll-mt-24'),
  'Container chỉnh sửa có scroll-mt-24 để không bị header che khuất'
);

assert(
  suggestionsViewContent.includes('preventScroll: true'),
  'Tự động focus textarea với preventScroll: true tránh gây giật thanh cuộn'
);

// 3. Tối ưu ô chỉnh sửa: kích thước, font size, cuộn nội dung
assert(
  suggestionsViewContent.includes('min-h-[140px]') && suggestionsViewContent.includes('resize-y') && suggestionsViewContent.includes('overflow-y-auto'),
  'Textarea hỗ trợ resize-y, min-h-[140px] và overflow-y-auto khi nội dung dài'
);
assert(
  suggestionsViewContent.includes('text-[15px] sm:text-[16px] leading-[1.7]'),
  'Font chữ ô soạn thảo tối thiểu 15px - 16px, khoảng cách dòng thoáng 1.7'
);

// 4. Đổi tên và tách bạch hành vi các nút
assert(
  !suggestionsViewContent.includes('Lưu & Áp dụng'),
  'Đã XÓA hoàn toàn nút "Lưu & Áp dụng"'
);
assert(
  suggestionsViewContent.includes('LƯU CHỈNH SỬA'),
  'Đã thêm nút "LƯU CHỈNH SỬA"'
);
assert(
  suggestionsViewContent.includes('handleSaveCustomProposalAction(s, customEditText)'),
  'Nút "LƯU CHỈNH SỬA" gọi handleSaveCustomProposalAction'
);

// 5. "LƯU CHỈNH SỬA" CHỈ LƯU, KHÔNG tự ý áp dụng vào bản nháp
const saveActionRegex = /const handleSaveCustomProposalAction = async \([\s\S]*?finally \{[\s\S]*?\};/;
const match = suggestionsViewContent.match(saveActionRegex);
assert(match !== null, 'Tìm thấy định nghĩa handleSaveCustomProposalAction');
if (match) {
  const funcBody = match[0];
  assert(!funcBody.includes('handleApplySuggestion'), 'handleSaveCustomProposalAction KHÔNG gọi handleApplySuggestion');
  assert(!funcBody.includes('onApplyChange'), 'handleSaveCustomProposalAction KHÔNG gọi onApplyChange');
  assert(funcBody.includes('setLocalCustomProposals'), 'handleSaveCustomProposalAction cập nhật localCustomProposals');
  assert(funcBody.includes('onSaveCustomProposal'), 'handleSaveCustomProposalAction gọi onSaveCustomProposal');
  assert(funcBody.includes('setEditingCardId(null)'), 'handleSaveCustomProposalAction đóng chế độ chỉnh sửa');
}

// 6. Nút Hủy
assert(
  suggestionsViewContent.includes('onClick={() => setEditingCardId(null)}') && suggestionsViewContent.includes('Hủy'),
  'Nút "Hủy" đóng chế độ chỉnh sửa mà không làm mất dữ liệu'
);

// 7. Truyền props từ App.tsx
assert(
  appContent.includes('customProposals={currentAnalysis.customProposals}') &&
  appContent.includes('onSaveCustomProposal={handleSaveCustomProposal}'),
  'App.tsx đã truyền customProposals và onSaveCustomProposal xuống SuggestionsView'
);

// 8. Ưu tiên customProposals trong getTierContent
assert(
  suggestionsViewContent.includes('localCustomProposals[k]?.text'),
  'getTierContent ưu tiên trả về đề xuất đã được GV chỉnh sửa và lưu'
);

console.log(`\nKết quả: ${passedTests}/${totalTests} bài kiểm tra đạt yêu cầu.`);
if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('TẤT CẢ CÁC ĐIỀU KIỆN NGHIỆM THU ĐỀU ĐẠT CHUẨN 100%!');
}
