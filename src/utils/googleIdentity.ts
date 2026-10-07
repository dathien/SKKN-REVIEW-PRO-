/**
 * Google Identity Services helper for SKKN REVIEW PRO.
 * Quản lý nạp Google Identity script (accounts.google.com/gsi/client),
 * Google Client ID và đảm bảo initialize duy nhất một lần (single initialization guard).
 */

declare global {
  interface Window {
    google?: any;
    __gsiInitializedClientId?: string;
  }
}

let scriptPromise: Promise<any> | null = null;
let cachedClientId: string = '';
let activeCredentialCallback: ((res: any) => void) | null = null;

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Lấy Google Client ID:
 * - Ưu tiên số 1: Build-time env (Vite / Vercel define) -> KHÔNG gọi network để tránh 404 trên Vercel
 * - Dự phòng: Gọi /api/auth/config nếu build-time env chưa có
 */
export async function fetchGoogleClientId(timeoutMs = 8000): Promise<string> {
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

  // 3. Chỉ gọi /api/auth/config nếu build-time env chưa có (chế độ local server)
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
        if (isDev) {
          console.log('[Google Auth] Nạp Google Client ID từ /api/auth/config');
        }
        return srvClientId;
      }
    }
  } catch {
    clearTimeout(timer);
  }

  throw new Error('CONFIG_ERROR: Chưa có Google Client ID được cấu hình');
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

  // Nếu đã khởi tạo trước đó với cùng Client ID -> Không gọi initialize() nữa
  if (window.__gsiInitializedClientId === clientId) {
    return true;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: any) => {
        if (activeCredentialCallback) {
          activeCredentialCallback(res);
        }
      },
      auto_select: false, // TẮT auto-select
      cancel_on_tap_outside: true,
    });

    window.__gsiInitializedClientId = clientId;

    if (isDev) {
      console.log('[Google Auth] Google Identity khởi tạo thành công (chỉ 1 lần)');
    }
    return true;
  } catch (err) {
    console.warn('Google Identity initialize error:', err);
    return false;
  }
}

/**
 * Reset cache khi người dùng chủ động bấm THỬ LẠI
 */
export function resetGoogleAuthCache() {
  scriptPromise = null;
  if (typeof window !== 'undefined') {
    delete window.__gsiInitializedClientId;
  }
}
