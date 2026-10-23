/**
 * SKKN REVIEW PRO - Issue Display Formatter
 * Thay thế các mã kỹ thuật (rtc-1, rtc-2, rtc-3) bằng tên có ý nghĩa sư phạm,
 * xác định số thứ tự theo danh sách hiện tại của hồ sơ và nội dung phản biện thực tế.
 * Bảo toàn 100% ID nội bộ làm khóa dữ liệu không thay đổi.
 */

export interface FormattedIssueInfo {
  id: string;
  shortCode: string;       // e.g. "Vấn đề 01"
  displayName: string;     // e.g. "Vấn đề 01 – Thiếu bài kiểm tra năng lực đầu vào"
  categoryName: string;    // e.g. "Tính khoa học & Logic sư phạm"
}

export function getIssueShortCode(id: string, index?: number): string {
  if (typeof index === 'number' && index >= 0) {
    return `Vấn đề ${String(index + 1).padStart(2, '0')}`;
  }
  if (!id) return 'Vấn đề';
  
  // Trích xuất số nếu không có index
  const numMatch = id.match(/\d+/);
  if (numMatch) {
    return `Vấn đề ${String(numMatch[0]).padStart(2, '0')}`;
  }
  return 'Vấn đề phản biện';
}

export function getIssueCleanTitle(
  cardOrIssue: { id: string; issueDetected?: string; problem?: string },
  maxLength: number = 55
): string {
  if (!cardOrIssue) return 'Vấn đề phản biện';
  const rawText = cardOrIssue.issueDetected || cardOrIssue.problem || '';
  if (!rawText) return 'Vấn đề phản biện';

  const clean = rawText
    .split(/[:–\n]/)[0]
    .replace(/^(\d+\.?\s*)/, '')
    .trim();

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
}

export function getIssueDisplayName(
  cardOrIssue: { id: string; issueDetected?: string; problem?: string },
  index?: number
): string {
  if (!cardOrIssue) return 'Vấn đề phản biện';
  const shortCode = getIssueShortCode(cardOrIssue.id, index);
  const cleanTitle = getIssueCleanTitle(cardOrIssue);
  
  if (!cleanTitle || cleanTitle === 'Vấn đề phản biện') {
    return shortCode;
  }
  return `${shortCode} – ${cleanTitle}`;
}
