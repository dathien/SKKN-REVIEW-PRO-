/**
 * SKKN REVIEW PRO — Module Chuẩn Hóa & Quản Lý Ghi Chú Giáo Viên
 * Bảo đảm tính nhất quán, tương thích ngược và bền vững trên cả Serverless (Vercel) và Local Node
 */

/**
 * Chuẩn hóa khóa ghi chú theo đúng ID ổn định của vấn đề phản biện (cardId)
 * Tách và hợp nhất an toàn mọi khóa ghép cũ dạng `${evalId}_${cardId}` hoặc `..._rtc-...`
 */
export function normalizeTeacherNotes(rawNotes: any, evalId?: string): Record<string, string> {
  if (!rawNotes || typeof rawNotes !== 'object') return {};
  const normalized: Record<string, string> = {};
  const evalPrefix = evalId ? `${evalId}_` : '';

  for (const [key, value] of Object.entries(rawNotes)) {
    if (typeof value !== 'string') continue;
    let cleanKey = key.trim();
    if (!cleanKey) continue;

    // 1. Tách tiền tố evalId nếu có (ví dụ: "eval_tinhoc11_dathien2412_rtc-2" -> "rtc-2")
    if (evalPrefix && cleanKey.startsWith(evalPrefix)) {
      cleanKey = cleanKey.slice(evalPrefix.length);
    } else if (cleanKey.includes('_rtc-')) {
      cleanKey = cleanKey.substring(cleanKey.lastIndexOf('_rtc-') + 1);
    } else if (cleanKey.includes('_PB-')) {
      cleanKey = cleanKey.substring(cleanKey.lastIndexOf('_PB-') + 1);
    }

    // 2. Hợp nhất an toàn: không để chuỗi rỗng ghi đè nội dung có giá trị
    const existingVal = normalized[cleanKey];
    if (existingVal === undefined) {
      normalized[cleanKey] = value;
    } else if (!existingVal.trim() && value.trim()) {
      normalized[cleanKey] = value;
    } else if (value.trim() && value.trim() !== existingVal.trim()) {
      // Nếu cùng có nội dung nhưng khác nhau giữa các khóa (ví dụ khóa ghép vs khóa đơn),
      // ưu tiên phiên bản dài hơn / chi tiết hơn
      if (value.trim().length >= existingVal.trim().length) {
        normalized[cleanKey] = value;
      }
    }
  }

  return normalized;
}

/**
 * Lấy ghi chú hiệu lực cho một card từ nhiều nguồn dữ liệu theo thứ tự ưu tiên
 */
export function resolveCardTeacherNote(params: {
  cardId: string;
  evalId?: string;
  userEmail?: string;
  directUserNotes?: string;
  teacherNotesMap?: Record<string, string>;
}): string {
  const { cardId, evalId, userEmail, directUserNotes, teacherNotesMap } = params;
  let cleanId = cardId.trim();
  const evalKey = evalId || 'default';
  if (evalKey && cleanId.startsWith(`${evalKey}_`)) {
    cleanId = cleanId.slice(`${evalKey}_`.length);
  }
  const compositeKey = `${evalKey}_${cleanId}`;
  const userEmailKey = (userEmail || 'guest').toLowerCase().trim();

  // 1. Kiểm tra teacherNotesMap từ hồ sơ (Server / App state)
  if (teacherNotesMap) {
    if (typeof teacherNotesMap[cleanId] === 'string' && teacherNotesMap[cleanId].trim()) {
      return teacherNotesMap[cleanId];
    }
    if (typeof teacherNotesMap[compositeKey] === 'string' && teacherNotesMap[compositeKey].trim()) {
      return teacherNotesMap[compositeKey];
    }
  }

  // 2. Kiểm tra directUserNotes từ thẻ nếu có nội dung
  if (directUserNotes && directUserNotes.trim()) {
    return directUserNotes;
  }

  // 3. Kiểm tra localStorage theo các tầng ưu tiên
  if (typeof localStorage !== 'undefined') {
    try {
      // Scoped key
      const scopedNote = localStorage.getItem(`skkn_note_${userEmailKey}_${evalKey}_${cleanId}`);
      if (scopedNote && scopedNote.trim()) return scopedNote;

      // Từ điển riêng của hồ sơ
      const evalNotesStr = localStorage.getItem(`skkn_eval_notes_${evalKey}`);
      if (evalNotesStr) {
        const evalNotes = JSON.parse(evalNotesStr);
        if (evalNotes && evalNotes[cleanId] && evalNotes[cleanId].trim()) {
          return evalNotes[cleanId];
        }
      }

      // Từ điển tổng hợp skkn_all_teacher_notes
      const allNotesStr = localStorage.getItem('skkn_all_teacher_notes');
      if (allNotesStr) {
        const allNotes = JSON.parse(allNotesStr);
        if (allNotes[cleanId] && allNotes[cleanId].trim()) return allNotes[cleanId];
        if (allNotes[compositeKey] && allNotes[compositeKey].trim()) return allNotes[compositeKey];
      }

      // Legacy note
      const legacyNote = localStorage.getItem(`skkn_note_${cleanId}`);
      if (legacyNote && legacyNote.trim()) return legacyNote;
    } catch (_) {}
  }

  return '';
}
