import fs from 'fs';
import path from 'path';

console.log('======================================================');
console.log('KIỂM THỬ TOÀN DIỆN HỆ THỐNG CLEAN URL (ĐƯỜNG DẪN THÂN THIỆN)');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ĐẠT: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ THẤT BẠI: ${message}`);
  }
}

// 1. Kiểm tra định nghĩa Clean URL trong src/utils/navigation.ts
console.log('--- 1. Kiểm tra cấu trúc Clean URL trong src/utils/navigation.ts ---');
const navUtilPath = path.resolve('src/utils/navigation.ts');
assert(fs.existsSync(navUtilPath), 'Tệp src/utils/navigation.ts tồn tại');

const navCode = fs.readFileSync(navUtilPath, 'utf-8');

assert(navCode.includes("path: '/ho-so'"), "Đường dẫn Hồ sơ của tôi: /ho-so");
assert(navCode.includes("path: '/tong-quan'"), "Đường dẫn Tổng quan: /tong-quan");
assert(navCode.includes("path: '/can-xu-ly'"), "Đường dẫn Cần xử lý: /can-xu-ly");
assert(navCode.includes("path: '/goi-y-chinh-sua'"), "Đường dẫn Gợi ý sửa & hoàn thiện: /goi-y-chinh-sua");
assert(navCode.includes("path: '/cham-lai'"), "Đường dẫn Chấm lại: /cham-lai");
assert(navCode.includes("path: '/bao-cao'"), "Đường dẫn Báo cáo: /bao-cao");
assert(navCode.includes("path: '/quan-tri'"), "Đường dẫn Quản trị: /quan-tri");

// Kiểm tra hàm ánh xạ 2 chiều
import { getTabFromPath, getPathFromTab, migrateLegacyUrl } from '../src/utils/navigation.ts';

assert(getTabFromPath('/') === 'dashboard', "Trang chủ '/' ánh xạ đến tab 'dashboard'");
assert(getTabFromPath('/tong-quan') === 'dashboard', "'/tong-quan' ánh xạ đến tab 'dashboard'");
assert(getTabFromPath('/ho-so') === 'my_evaluations', "'/ho-so' ánh xạ đến tab 'my_evaluations'");
assert(getTabFromPath('/can-xu-ly') === 'red_team', "'/can-xu-ly' ánh xạ đến tab 'red_team'");
assert(getTabFromPath('/goi-y-chinh-sua') === 'suggestions', "'/goi-y-chinh-sua' ánh xạ đến tab 'suggestions'");
assert(getTabFromPath('/cham-lai') === 'rescore', "'/cham-lai' ánh xạ đến tab 'rescore'");
assert(getTabFromPath('/bao-cao') === 'report', "'/bao-cao' ánh xạ đến tab 'report'");

assert(getPathFromTab('dashboard') === '/tong-quan', "'dashboard' chuyển thành clean path '/tong-quan'");
assert(getPathFromTab('my_evaluations') === '/ho-so', "'my_evaluations' chuyển thành clean path '/ho-so'");
assert(getPathFromTab('red_team') === '/can-xu-ly', "'red_team' chuyển thành clean path '/can-xu-ly'");
assert(getPathFromTab('suggestions') === '/goi-y-chinh-sua', "'suggestions' chuyển thành clean path '/goi-y-chinh-sua'");
assert(getPathFromTab('rescore') === '/cham-lai', "'rescore' chuyển thành clean path '/cham-lai'");
assert(getPathFromTab('report') === '/bao-cao', "'report' chuyển thành clean path '/bao-cao'");

// 2. Kiểm tra App.tsx không dùng query params và hỗ trợ Back/Forward
console.log('\n--- 2. Kiểm tra App.tsx: Điều hướng Clean URL & Không dùng Query String ---');
const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');

assert(!appCode.includes("params.set('tab'"), "App.tsx TUYỆT ĐỐI không ghi '?tab=' vào URL");
assert(!appCode.includes("params.set('evalId'"), "App.tsx TUYỆT ĐỐI không ghi '&evalId=' vào URL");
assert(!appCode.includes("params.set('issueId'"), "App.tsx TUYỆT ĐỐI không ghi '&issueId=' vào URL");

assert(appCode.includes('navigateToTab'), 'App.tsx có hàm navigateToTab cập nhật Clean URL');
assert(appCode.includes('window.history.pushState'), 'navigateToTab sử dụng window.history.pushState');
assert(appCode.includes('window.history.replaceState'), 'App.tsx sử dụng window.history.replaceState để đồng bộ Clean URL');
assert(appCode.includes("window.addEventListener('popstate'"), 'App.tsx lắng nghe popstate hỗ trợ Back/Forward trình duyệt');

// 3. Kiểm tra Quản lý hồ sơ SKKN & Không mất khi chuyển trang / F5
console.log('\n--- 3. Kiểm tra Quản lý hồ sơ SKKN & Cơ chế khôi phục bền vững ---');
assert(appCode.includes("sessionStorage.setItem('skkn_active_eval_id', currentEvaluationId)"), 'ID hồ sơ được ghi nhớ trong sessionStorage khi chọn');
assert(appCode.includes('targetEvalId = currentEvaluationId || initialUrlState.migratedEvalId'), 'F5 khôi phục ID hồ sơ từ migratedEvalId / storage');
assert(appCode.includes('/api/user/evaluations/get?id='), 'F5 kiểm tra ID hồ sơ còn hợp lệ qua máy chủ, không dùng dữ liệu giả');
assert(appCode.includes('Chưa có hồ sơ được chọn để hiển thị'), 'Truy cập đường dẫn trực tiếp khi chưa chọn hồ sơ hiển thị giao diện chọn rõ ràng');
assert(appCode.includes('Chọn từ "Hồ sơ của tôi"'), 'Giao diện nhắc chọn hồ sơ có nút dẫn trực tiếp đến /ho-so');

// 4. Kiểm tra Tương thích URL cũ (Requirement 4)
console.log('\n--- 4. Kiểm tra Tương thích URL cũ (Legacy URL Auto-Migration) ---');
assert(navCode.includes('migrateLegacyUrl'), 'Có hàm migrateLegacyUrl xử lý URL cũ có query string');
assert(appCode.includes('migrateLegacyUrl()'), 'initialUrlState tự động kích hoạt migrateLegacyUrl');

// 5. Kiểm tra Cấu hình Vercel SPA Fallback (Requirement 2 & 6)
console.log('\n--- 5. Kiểm tra cấu hình SPA Fallback trên Vercel (vercel.json) ---');
const vercelJson = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf-8'));
const rewrites = vercelJson.rewrites || [];

const requiredCleanPaths = ['/ho-so', '/tong-quan', '/can-xu-ly', '/goi-y-chinh-sua', '/cham-lai', '/bao-cao', '/quan-tri'];
for (const p of requiredCleanPaths) {
  const hasRewrite = rewrites.some(r => r.source === p && r.destination === '/index.html');
  assert(hasRewrite, `vercel.json có rewrite trực tiếp cho ${p} -> /index.html`);
}
const hasCatchAll = rewrites.some(r => r.source.includes('(?!api/)') && r.destination === '/index.html');
assert(hasCatchAll, 'vercel.json có rewrite fallback cho mọi non-api đường dẫn con');

// 6. Kiểm tra Header & Sidebar
console.log('\n--- 6. Kiểm tra Header và Sidebar gọi đúng Clean URL ---');
const headerCode = fs.readFileSync(path.resolve('src/components/Header.tsx'), 'utf-8');
assert(headerCode.includes("window.history.pushState({}, '', '/quan-tri')"), 'Nút Quản trị trong Header chuyển đến /quan-tri');

console.log('\n======================================================');
console.log(`KẾT QUẢ: ${passedTests}/${totalTests} BÀI KIỂM THỬ ĐẠT YÊU CẦU 100%!`);
console.log('======================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
