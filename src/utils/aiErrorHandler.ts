/**
 * AI & API Error Handling and Classification System
 * Maps technical API/network errors into teacher-friendly notifications
 * without ever exposing raw JSON, stack traces, or status codes to the UI.
 */

export type ErrorCategory = 
  | 'TEMPORARY' 
  | 'AUTH' 
  | 'INVALID_INPUT' 
  | 'NETWORK' 
  | 'PARSE';

export interface FriendlyErrorInfo {
  category: ErrorCategory;
  title: string;
  message: string;
  subtext?: string;
  canRetry: boolean;
  isTemporary: boolean;
}

export interface DebugErrorLog {
  status?: number;
  code?: string;
  message?: string;
  attempt?: number;
}

/**
 * Classify any error into standard categories and friendly messages.
 * Logs technical details only to console.
 */
export function classifyError(
  status?: number,
  errData?: any,
  rawError?: any,
  attempt?: number
): FriendlyErrorInfo {
  const code = (errData?.code || rawError?.code || '').toString().toUpperCase();
  const rawMsg = (errData?.error || rawError?.message || '').toString();
  const statusCode = typeof status === 'number' ? status : Number(errData?.status || 0);

  // Technical debug log (ONLY for console, never exposed to user UI)
  console.error('[AI Error Debug]:', {
    status: statusCode || 'N/A',
    code: code || 'UNKNOWN',
    message: rawMsg || (rawError ? String(rawError) : 'Unknown error'),
    attempt: attempt ?? 1
  });

  // 1. Check for Invalid Input (400 / INVALID_ARGUMENT)
  if (
    statusCode === 400 || 
    code === 'INVALID_ARGUMENT' || 
    rawMsg.includes('INVALID_ARGUMENT') ||
    rawMsg.includes('quá ngắn')
  ) {
    return {
      category: 'INVALID_INPUT',
      title: 'Không thể phân tích hồ sơ này',
      message: 'Vui lòng kiểm tra nội dung hoặc tài liệu đã tải.',
      subtext: 'Nội dung SKKN cần đảm bảo tối thiểu và đúng định dạng văn bản.',
      canRetry: false,
      isTemporary: false
    };
  }

  // 2. Check for Auth / API Key Error (401 / 403 / PERMISSION_DENIED / API_KEY_INVALID)
  if (
    statusCode === 401 || 
    statusCode === 403 || 
    code === 'PERMISSION_DENIED' || 
    code === 'API_KEY_INVALID' ||
    rawMsg.includes('API_KEY') ||
    rawMsg.includes('PERMISSION_DENIED')
  ) {
    return {
      category: 'AUTH',
      title: 'Không thể kết nối dịch vụ AI',
      message: 'Vui lòng kiểm tra cấu hình hệ thống.',
      subtext: 'Khóa API hoặc quyền truy cập dịch vụ cần được xác thực lại.',
      canRetry: false,
      isTemporary: false
    };
  }

  // 3. Check for Parse Error (Malformed AI JSON)
  if (
    code === 'PARSE_ERROR' ||
    rawError?.name === 'SyntaxError' ||
    rawMsg.includes('JSON') ||
    rawMsg.includes('trích xuất cấu trúc')
  ) {
    return {
      category: 'PARSE',
      title: 'Chưa thể xử lý dữ liệu',
      message: 'Đã nhận kết quả nhưng chưa thể xử lý dữ liệu.',
      subtext: 'Thầy/Cô có thể bấm Thử lại để hệ thống phân tích lại.',
      canRetry: true,
      isTemporary: false
    };
  }

  // 4. Check for Network / Timeout / Fetch Failed
  const isNetwork = 
    rawError?.name === 'AbortError' ||
    rawError?.name === 'TypeError' ||
    rawMsg.toLowerCase().includes('failed to fetch') ||
    rawMsg.toLowerCase().includes('network') ||
    rawMsg.toLowerCase().includes('timeout') ||
    statusCode === 504;

  if (isNetwork) {
    return {
      category: 'NETWORK',
      title: '⚠️ HỆ THỐNG AI ĐANG BẬN',
      message: 'Chưa thể hoàn tất chấm & phản biện lúc này. Nội dung SKKN của Thầy/Cô vẫn được giữ nguyên.',
      subtext: 'Thầy/Cô không cần tải hoặc dán lại SKKN.',
      canRetry: true,
      isTemporary: true
    };
  }

  // 5. Check for Temporary High Demand / Overloaded / 429 / 500 / 502 / 503 / UNAVAILABLE / RESOURCE_EXHAUSTED
  const isTemporary = 
    statusCode === 503 ||
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 502 ||
    code === 'UNAVAILABLE' ||
    code === 'RESOURCE_EXHAUSTED' ||
    rawMsg.includes('high demand') ||
    rawMsg.includes('overloaded') ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('503');

  if (isTemporary || !statusCode || statusCode >= 500) {
    return {
      category: 'TEMPORARY',
      title: '⚠️ HỆ THỐNG AI ĐANG BẬN',
      message: 'Chưa thể hoàn tất chấm & phản biện lúc này. Nội dung SKKN của Thầy/Cô vẫn được giữ nguyên.',
      subtext: 'Thầy/Cô không cần tải hoặc dán lại SKKN.',
      canRetry: true,
      isTemporary: true
    };
  }

  // Default General Friendly Error
  return {
    category: 'TEMPORARY',
    title: '⚠️ HỆ THỐNG AI ĐANG BẬN',
    message: 'Chưa thể hoàn tất chấm & phản biện lúc này. Nội dung SKKN của Thầy/Cô vẫn được giữ nguyên.',
    subtext: 'Thầy/Cô không cần tải hoặc dán lại SKKN.',
    canRetry: true,
    isTemporary: true
  };
}

/**
 * Promise-based sleep helper with jitter
 */
export function sleep(ms: number, jitterMax = 300): Promise<void> {
  const jitter = Math.floor(Math.random() * jitterMax);
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Backoff delay for retry attempts:
 * Attempt 1: ~2s
 * Attempt 2: ~5s
 * Attempt 3: ~10s
 */
export function getRetryDelay(attempt: number): number {
  if (attempt === 1) return 2000;
  if (attempt === 2) return 5000;
  if (attempt === 3) return 10000;
  return 2000;
}
