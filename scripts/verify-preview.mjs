import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';

async function verifyPreview() {
  console.log('[verify-preview] Bắt đầu kiểm tra chi tiết trạng thái Preview và các tuyến đường...');

  // 1. Kiểm tra HTML trang chủ (/)
  const res = await fetch('http://localhost:3000/');
  if (!res.ok) {
    throw new Error(`Server returned ${res.status} for /`);
  }
  const html = await res.text();

  if (!html.includes('id="root"')) {
    throw new Error('index.html thiếu phần tử #root');
  }
  if (!html.includes('src="/src/main.tsx"')) {
    throw new Error('index.html thiếu thẻ script nạp main.tsx');
  }
  if (!html.includes('SKKN REVIEW PRO')) {
    throw new Error('index.html thiếu tiêu đề hoặc fallback SKKN REVIEW PRO');
  }
  console.log('[verify-preview] ✓ index.html hợp lệ, chứa #root và fallback khởi động.');

  // 2. Kiểm tra MIME-type của các mô-đun frontend quan trọng
  const mainResp = await fetch('http://localhost:3000/src/main.tsx');
  if (!mainResp.ok) {
    throw new Error(`Lỗi tải main.tsx: ${mainResp.status}`);
  }
  const mainType = mainResp.headers.get('content-type') || '';
  if (!mainType.includes('javascript')) {
    throw new Error(`main.tsx có Content-Type không phải javascript: ${mainType}`);
  }
  console.log('[verify-preview] ✓ main.tsx phản hồi 200 OK với Content-Type JavaScript.');

  // 3. Kiểm tra KHẮC PHỤC LỖI GỐC: /scripts/Code.gs?import&raw PHẢI TRẢ VỀ text/javascript
  const rawCodeResp = await fetch('http://localhost:3000/scripts/Code.gs?import&raw');
  if (!rawCodeResp.ok) {
    throw new Error(`Lỗi tải /scripts/Code.gs?import&raw: ${rawCodeResp.status}`);
  }
  const rawType = rawCodeResp.headers.get('content-type') || '';
  if (!rawType.includes('javascript')) {
    throw new Error(`NGHIÊM TRỌNG: /scripts/Code.gs?import&raw trả về ${rawType} thay vì text/javascript (Gây trắng trang!)`);
  }
  const rawContent = await rawCodeResp.text();
  if (!rawContent.includes('export default') && !rawContent.includes('Phiên bản: 2.7')) {
    throw new Error('/scripts/Code.gs?import&raw không chứa nội dung export module hợp lệ');
  }
  console.log('[verify-preview] ✓ /scripts/Code.gs?import&raw trả về Content-Type text/javascript chuẩn, chứa Code.gs v2.7!');

  // 4. Kiểm tra tải trực tiếp /scripts/Code.gs trả về text/plain
  const directCodeResp = await fetch('http://localhost:3000/scripts/Code.gs');
  if (!directCodeResp.ok) {
    throw new Error(`Lỗi tải trực tiếp /scripts/Code.gs: ${directCodeResp.status}`);
  }
  const directType = directCodeResp.headers.get('content-type') || '';
  if (!directType.includes('text/plain')) {
    throw new Error(`/scripts/Code.gs trực tiếp trả về ${directType} thay vì text/plain`);
  }
  console.log('[verify-preview] ✓ /scripts/Code.gs trực tiếp phản hồi 200 OK text/plain.');

  // 5. Kiểm tra tuyến /quan-tri
  const quanTriRes = await fetch('http://localhost:3000/quan-tri');
  if (!quanTriRes.ok) {
    throw new Error(`Server returned ${quanTriRes.status} for /quan-tri`);
  }
  const quanTriHtml = await quanTriRes.text();
  if (!quanTriHtml.includes('id="root"')) {
    throw new Error('/quan-tri không trả về SPA index.html');
  }
  console.log('[verify-preview] ✓ /quan-tri trả về 200 OK SPA HTML thành công.');

  // 6. Kiểm tra JSDOM DOM Parsing
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));

  const dom = new JSDOM(html, {
    url: 'http://localhost:3000/',
    virtualConsole,
  });
  const root = dom.window.document.getElementById('root');
  if (!root) {
    throw new Error('JSDOM không tìm thấy phần tử root');
  }
  console.log('[verify-preview] ✓ JSDOM DOM tree kiểm tra thành công, kích thước root:', root.innerHTML.length, 'bytes');

  console.log('\n======================================================');
  console.log('[verify-preview] TẤT CẢ KIỂM TRA PREVIEW THÀNH CÔNG RỰC RỠ!');
  console.log('======================================================\n');
  process.exit(0);
}

verifyPreview().catch((err) => {
  console.error('[verify-preview] Lỗi kiểm tra:', err);
  process.exit(1);
});
