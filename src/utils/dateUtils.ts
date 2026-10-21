/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tính toán cộng số tháng nguyên dương theo lịch dương (Gregorian Calendar).
 * Xử lý chính xác:
 * - Không quy đổi 1 tháng = 30 ngày.
 * - Xử lý đúng ngày 28, 29, 30, 31 và năm nhuận.
 * 
 * Ví dụ:
 * - 31/01/2026 + 1 tháng -> 28/02/2026 (2026 không nhuận)
 * - 31/01/2024 + 1 tháng -> 29/02/2024 (2024 nhuận)
 * - 31/03/2026 + 1 tháng -> 30/04/2026
 * - 31/05/2026 + 7 tháng -> 31/12/2026
 * - 15/10/2026 + 12 tháng -> 15/10/2027
 * - 15/10/2026 + 36 tháng -> 15/10/2029
 */
export function addCalendarMonths(startDateInput: string | Date, months: number): {
  dateStr: string;     // 'YYYY-MM-DD'
  displayDate: string; // 'DD/MM/YYYY'
  isoString: string;   // 'YYYY-MM-DDTHH:mm:ss.sssZ'
} {
  const safeMonths = Math.floor(Math.max(1, months || 1));

  let startYear: number;
  let startMonth: number; // 0-indexed (0 = Jan, 11 = Dec)
  let startDay: number;

  if (typeof startDateInput === 'string') {
    const cleanStr = startDateInput.includes('T') ? startDateInput.split('T')[0] : startDateInput;
    const parts = cleanStr.split('-').map(Number);
    startYear = parts[0] || new Date().getFullYear();
    startMonth = (parts[1] || 1) - 1;
    startDay = parts[2] || 1;
  } else {
    startYear = startDateInput.getFullYear();
    startMonth = startDateInput.getMonth();
    startDay = startDateInput.getDate();
  }

  const targetMonthIndex = startMonth + safeMonths;
  const targetYear = startYear + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  // Ngày cuối cùng của tháng đích (ngày 0 của tháng kế tiếp = ngày cuối của targetMonth)
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(startDay, maxDaysInTargetMonth);

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}`;
  const displayDate = `${pad(targetDay)}/${pad(targetMonth + 1)}/${targetYear}`;

  // Đặt mốc hết hạn vào cuối ngày (23:59:59.999 UTC) để người dùng hưởng trọn vẹn ngày hết hạn
  const endOfDay = new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999));
  const isoString = endOfDay.toISOString();

  return { dateStr, displayDate, isoString };
}

/**
 * Kiểm tra xem một mốc thời gian ISO hoặc YYYY-MM-DD đã hết hạn so với hiện tại chưa
 */
export function isDateExpired(dateStr?: string | null): boolean {
  if (!dateStr) return false; // Không có hạn = Vĩnh viễn (không hết hạn)
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return false;
  return t < Date.now();
}

/**
 * Định dạng ngày ISO hoặc chuỗi ngày thành DD/MM/YYYY
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Vĩnh viễn';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = cleanStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d)}/${pad(m)}/${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Tính số ngày còn lại đến hạn
 * - null nếu vĩnh viễn
 * - số dương nếu còn hạn
 * - số âm hoặc 0 nếu đã hết hạn
 */
export function getDaysRemaining(dateStr?: string | null): number | null {
  if (!dateStr) return null; // Vĩnh viễn
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  const diff = t - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
