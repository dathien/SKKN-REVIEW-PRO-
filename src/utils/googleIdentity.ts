/**
 * Google Identity Services helper for SKKN REVIEW PRO.
 * Quản lý nạp Google Identity script (accounts.google.com/gsi/client)
 * và Google Client ID với timeout, retry và bảo vệ chống load trùng lặp.
 */

declare global {
  interface Window {
    google?: any;
  }
}

let scriptPromise: Promise<any> | null = null;
let cachedClientId: string = '';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Lấy Google Client ID từ runtime server hoặc build-time env với timeout
 */
export async function fetchGoogleClientId(timeoutMs = 8000): Promise<string> {
  // 1. Nếu đã có cache trong memory
  if (cachedClientId) {
    return cachedClientId;
  }

  // 2. Kiểm tra build-time env (Vite / Vercel define)
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  // 3. Gọi endpoint /api/auth/config từ server với timeout
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
          console.log('[Google Auth] Google Client config loaded');
        }
        return srvClientId;
      }
    }
  } catch (err) {
    clearTimeout(timer);
    // Nếu gọi endpoint lỗi nhưng envClientId có sẵn -> fallback sang envClientId
    if (envClientId) {
      cachedClientId = envClientId;
      if (isDev) {
        console.log('[Google Auth] Google Client config loaded (fallback)');
      }
      return envClientId;
    }
  }

  // 4. Nếu server không trả về client ID nhưng envClientId có sẵn
  if (envClientId) {
    cachedClientId = envClientId;
    if (isDev) {
      console.log('[Google Auth] Google Client config loaded (env)');
    }
    return envClientId;
  }

  throw new Error('CONFIG_ERROR: Không tìm thấy Google Client ID được cấu hình');
}

/**
 * Nạp script Google Identity Services (https://accounts.google.com/gsi/client)
 * - Tái sử dụng script nếu đã có trong DOM
 * - Không inject trùng lặp
 * - Bắt timeout 8-10 giây
 * - Bắt sự kiện onload và onerror
 */
export function loadGoogleIdentityScript(timeoutMs = 8000): Promise<any> {
  // Nếu window.google.accounts.id đã sẵn sàng
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
        scriptPromise = null; // Cho phép retry
        reject(new Error('GOOGLE_SCRIPT_TIMEOUT: Hết thời gian nạp Google Identity script'));
      }
    }, timeoutMs);

    const onReady = () => {
      if (isDone) return;
      cleanup();
      if (isDev) {
        console.log('[Google Auth] Google Identity script loaded');
      }
      resolve(window.google);
    };

    const onError = () => {
      if (isDone) return;
      cleanup();
      scriptPromise = null; // Cho phép retry
      reject(new Error('GOOGLE_ERROR: Không thể tải script Google Identity Services'));
    };

    // Kiểm tra xem script tag đã tồn tại trong DOM chưa (ví dụ từ index.html)
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      // Script tag đã có -> Polling kiểm tra window.google.accounts.id
      pollInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          onReady();
        }
      }, 50);

      existingScript.addEventListener('load', onReady, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    // Nếu chưa có script trong DOM -> Tạo mới một lần
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Chờ window.google.accounts.id được gán
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
 * Xóa cache script và client ID để cho phép retry hoàn toàn
 */
export function resetGoogleAuthCache() {
  scriptPromise = null;
}
