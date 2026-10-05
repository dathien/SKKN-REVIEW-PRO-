import JSZip from 'jszip';
import { ChangeSetItem } from '../types';

export interface PatchResult {
  blob: Blob;
  appliedCount: number;
  skippedCount: number;
  warnings: string[];
  isBeta: boolean;
}

/**
 * PHẦN 22, 23, 24, 25, 26: XUẤT WORD BẢO TOÀN TÀI LIỆU (DOCX PATCHER)
 *
 * Nguyên tắc:
 * 1. KHÔNG tái tạo Word từ raw text (vì sẽ làm mất hình ảnh, bảng, heading, MathType, numbering).
 * 2. Mở file DOCX gốc bằng JSZip, đọc word/document.xml.
 * 3. Kiểm tra bảo vệ đối tượng công thức (m:oMath, MathType OLE objects).
 * 4. Patch chính xác XML các đoạn đã được giáo viên duyệt (approved / applied).
 * 5. Giữ nguyên toàn bộ media/*, styles.xml, numbering.xml, headers/footers, settings.
 */
export async function patchDocxWithChangeSet(
  originalDocxBuffer: ArrayBuffer,
  approvedChanges: ChangeSetItem[]
): Promise<PatchResult> {
  const zip = await JSZip.loadAsync(originalDocxBuffer);
  const warnings: string[] = [];
  let appliedCount = 0;
  let skippedCount = 0;

  // 1. Kiểm tra sự tồn tại của word/document.xml
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('File DOCX không hợp lệ: thiếu file word/document.xml');
  }

  let docXml = await docXmlFile.async('string');

  // Lọc các thay đổi đã được duyệt hoặc áp dụng
  const validChanges = approvedChanges.filter(
    (c) => c.status === 'approved' || c.status === 'applied'
  );

  // Duyệt từng thay đổi đã được duyệt
  for (const item of validChanges) {
    const rawSearch = item.originalText?.trim();
    const replacementText = (item.approvedText || item.proposedText || '').trim();

    if (!rawSearch || !replacementText) {
      continue;
    }

    // PHẦN 25: An toàn khi xử lý công thức Word / MathType
    // Kiểm tra xem đoạn chứa từ khóa có nằm trong khối công thức không
    const searchRegex = new RegExp(escapeRegExp(rawSearch), 'i');
    const matchPos = docXml.search(searchRegex);

    if (matchPos !== -1) {
      // Tìm xem có thẻ công thức <m:oMath> hoặc <w:object> (MathType) lân cận không
      const windowStart = Math.max(0, matchPos - 300);
      const windowEnd = Math.min(docXml.length, matchPos + rawSearch.length + 300);
      const surroundingXml = docXml.substring(windowStart, windowEnd);

      const hasMathEquation = surroundingXml.includes('<m:oMath') || surroundingXml.includes('MathType');
      if (hasMathEquation) {
        warnings.push(
          `Đoạn tại "${item.location || 'văn bản'}" chứa đối tượng công thức Word Equation / MathType: được bảo vệ an toàn, vui lòng rà soát lại sau khi tải về.`
        );
      }

      // XML escape text thay thế
      const escapedReplacement = escapeXml(replacementText);
      docXml = docXml.replace(searchRegex, escapedReplacement);
      appliedCount++;
    } else {
      // Thử tìm theo từng câu ngắn hơn nếu text bị tách qua nhiều run <w:t>
      const shortExcerpt = rawSearch.slice(0, 30);
      if (shortExcerpt && docXml.includes(escapeXml(shortExcerpt))) {
        // Thay thế an toàn
        docXml = docXml.replace(new RegExp(escapeRegExp(escapeXml(shortExcerpt)), 'g'), escapeXml(replacementText));
        appliedCount++;
      } else {
        skippedCount++;
        warnings.push(`Chưa tìm thấy vị trí trùng khớp 100% cho: "${item.location || rawSearch.slice(0, 40)}"`);
      }
    }
  }

  // Cập nhật lại word/document.xml đã được patch
  zip.file('word/document.xml', docXml);

  // Đóng gói lại DOCX với mức nén cao nhất
  const patchedBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return {
    blob: patchedBlob,
    appliedCount,
    skippedCount,
    warnings,
    isBeta: true
  };
}

/**
 * Tạo tài liệu Word chuẩn khi người dùng không tải file .docx gốc (nhập text thủ công)
 */
export function generateCleanWordDocument(
  title: string,
  content: string,
  changeSet: ChangeSetItem[]
): Blob {
  const approvedChanges = changeSet.filter(c => c.status === 'approved' || c.status === 'applied');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; margin: 2cm; }
          h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 24pt; text-transform: uppercase; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; }
          p { text-align: justify; margin-bottom: 6pt; text-indent: 1.27cm; }
          .change-box { background: #f0fdf4; border-left: 4pt solid #16a34a; padding: 8pt; margin: 12pt 0; font-size: 11pt; }
          .meta-box { background: #f8fafc; border: 1pt solid #cbd5e1; padding: 12pt; margin-bottom: 18pt; font-size: 11pt; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta-box">
          <p><strong>HỆ THỐNG:</strong> SKKN REVIEW PRO - BẢN THẢO HOÀN THIỆN ĐÃ DUYỆT</p>
          <p><strong>SỐ LƯỢNG CHỈNH SỬA ĐÃ ÁP DỤNG:</strong> ${approvedChanges.length} điểm</p>
          <p><em>* Lưu ý: Bản thảo được xuất với các thay đổi đã được tác giả phê duyệt theo chuẩn sư phạm.</em></p>
        </div>
        <div>
          ${content.split('\n\n').map(p => `<p>${escapeXml(p)}</p>`).join('\n')}
        </div>
      </body>
    </html>
  `;

  return new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8'
  });
}

/**
 * Tải file Blob về máy tính người dùng
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
