/**
 * Google Identity Services helper for SKKN REVIEW PRO.
 * Quản lý nạp Google Identity script (accounts.google.com/gsi/client),
 * Google Client ID và đảm bảo initialize duy nhất một lần (single initialization guard).
 */

declare global {
  interface Window {
    google?: any;
    __gsiInitialized?: boolean;
    __gsiInitializedClientId?: string;
  }
}

let scriptPromise: Promise<any> | null = null;
let cachedClientId: string = '';
let activeCredentialCallback: ((res: any) => void) | null = null;

const isDev = process.env.NODE_ENV !== 'production';

export const DEFAULT_GOOGLE_CLIENT_ID = '398274708628-jlja4cs8fpbe7n8677ra3uorid2fr5ck.apps.googleusercontent.com';

/**
 * Lấy Google Client ID:
 * - Ưu tiên số 1: Build-time env (Vite / Vercel define) -> KHÔNG gọi network để tránh 404 trên Vercel
 * - Dự phòng số 2: Client ID hợp lệ đã được xác minh của SKKN REVIEW PRO
 * - Dự phòng số 3: Gọi /api/auth/config nếu ở môi trường backend server
 */
export async function fetchGoogleClientId(timeoutMs = 4000): Promise<string> {
  // 1. Kiểm tra cache trong memory
  if (cachedClientId) {
    return cachedClientId;
  }

  // 2. ƯU TIÊN SỐ 1: Kiểm tra build-time env (Vite / Vercel define)
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (envClientId) {
    cachedClientId = envClientId;
    if (isDev) {
      console.log('[Google Auth] Sử dụng Google Client ID từ environment/build');
    }
    return envClientId;
  }

  // 3. Dự phòng với Client ID hợp lệ đã được cấu hình và xác minh
  if (DEFAULT_GOOGLE_CLIENT_ID) {
    cachedClientId = DEFAULT_GOOGLE_CLIENT_ID;
    return DEFAULT_GOOGLE_CLIENT_ID;
  }

  // 4. Chỉ gọi /api/auth/config nếu chưa có Client ID
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/auth/config', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const srvClientId = (data.googleClientId || '').trim();
      if (srvClientId) {
        cachedClientId = srvClientId;
        return srvClientId;
      }
    }
  } catch {
    clearTimeout(timer);
  }

  return DEFAULT_GOOGLE_CLIENT_ID;
}

/**
 * Nạp script Google Identity Services (https://accounts.google.com/gsi/client)
 * - Tái sử dụng script nếu đã có trong DOM
 * - Không inject trùng lặp
 * - Bắt timeout 8 giây
 * - Bắt sự kiện onload và onerror
 */
export function loadGoogleIdentityScript(timeoutMs = 8000): Promise<any> {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    let isDone = false;
    let pollInterval: any = null;

    const cleanup = () => {
      isDone = true;
      if (pollInterval) clearInterval(pollInterval);
      if (timer) clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (!isDone) {
        cleanup();
        scriptPromise = null;
        reject(new Error('GOOGLE_SCRIPT_TIMEOUT: Hết thời gian nạp Google Identity script'));
      }
    }, timeoutMs);

    const onReady = () => {
      if (isDone) return;
      cleanup();
      if (isDev) {
        console.log('[Google Auth] Google Identity script đã sẵn sàng');
      }
      resolve(window.google);
    };

    const onError = () => {
      if (isDone) return;
      cleanup();
      scriptPromise = null;
      reject(new Error('GOOGLE_ERROR: Không thể tải script Google Identity Services'));
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      pollInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          onReady();
        }
      }, 50);

      existingScript.addEventListener('load', onReady, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      pollInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          onReady();
        }
      }, 50);
    };
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Khởi tạo Google Identity Services CHỈ MỘT LẦN DUY NHẤT.
 * Khắc phục triệt để lỗi:
 * "[GSI_LOGGER]: google.accounts.id.initialize() is called multiple times."
 */
export function initializeGoogleIdentityOnce(
  clientId: string,
  onCredential: (response: any) => void
): boolean {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    return false;
  }

  // Luôn cập nhật callback mới nhất mà không cần gọi lại initialize()
  activeCredentialCallback = onCredential;

  // Nếu đã khởi tạo trước đó -> Không bao giờ gọi initialize() thêm lần nào
  if (window.__gsiInitialized) {
    return true;
  }

  const effectiveClientId = (clientId || '').trim() || DEFAULT_GOOGLE_CLIENT_ID;

  try {
    window.google.accounts.id.initialize({
      client_id: effectiveClientId,
      callback: (res: any) => {
        if (activeCredentialCallback) {
          activeCredentialCallback(res);
        }
      },
      auto_select: false, // TẮT auto-select
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    window.__gsiInitialized = true;
    window.__gsiInitializedClientId = effectiveClientId;

    if (isDev) {
      console.log('[Google Auth] Google Identity khởi tạo thành công (chỉ 1 lần duy nhất)');
    }
    return true;
  } catch (err) {
    console.warn('Google Identity initialize error:', err);
    return false;
  }
}

/**
 * Reset script loading cache khi người dùng chủ động bấm THỬ LẠI
 */
export function resetGoogleAuthCache() {
  scriptPromise = null;
}
