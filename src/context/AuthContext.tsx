import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserAccount, UserQuota, UserRole, LicensePlan } from '../types';
import { fetchGoogleClientId } from '../utils/googleIdentity';

interface AuthContextType {
  user: UserAccount | null;
  guestId: string;
  role: UserRole;
  plan: LicensePlan;
  quota: UserQuota;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  isLicensed: boolean;
  googleClientId: string;
  isLoading: boolean;
  
  // Actions
  loginWithGoogleCredential: (credential: string) => Promise<boolean>;
  loginWithEmailDemo: (email: string, name?: string) => Promise<boolean>;
  logout: () => void;
  activateLicense: (key: string) => Promise<{ success: boolean; message: string }>;
  refreshStatus: (forcedUser?: UserAccount | null) => Promise<void>;
  updateUserQuota: (newQuota: UserQuota, newRole?: UserRole) => void;
  
  // Quota verification
  hasQuotaForMode: (mode: 'easy' | 'advanced') => boolean;

  // Modals
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'license';
  openAuthModal: (tab?: 'login' | 'license') => void;
  closeAuthModal: () => void;
  
  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;

  isQuotaModalOpen: boolean;
  quotaExceededMode: 'easy' | 'advanced';
  openQuotaModal: (mode: 'easy' | 'advanced') => void;
  closeQuotaModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isSignedOutByUser(): boolean {
  try {
    return sessionStorage.getItem('skkn_signed_out') === 'true';
  } catch {
    return false;
  }
}

function getOrCreateGuestId(): string {
  try {
    let id = localStorage.getItem('skkn_guest_id');
    if (!id || !id.startsWith('guest_')) {
      const entropy = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      id = `guest_${Date.now()}_${entropy}`;
      localStorage.setItem('skkn_guest_id', id);
      document.cookie = `skkn_guest_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return id;
  } catch {
    return `guest_${Date.now()}_fallback`;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestId] = useState<string>(getOrCreateGuestId);

  // Intentional logout & request lifecycle guards
  const authGenerationRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const signedOutRef = useRef<boolean>(isSignedOutByUser());

  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      if (isSignedOutByUser()) return null;
      const saved = localStorage.getItem('skkn_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && parsed.email.toLowerCase() === 'dathien2412@gmail.com') {
          return {
            ...parsed,
            role: 'ADMIN',
            plan: 'PRO',
            quota: { easy: 9999, advanced: 9999 },
            isBlocked: false,
          };
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [quota, setQuota] = useState<UserQuota>(() => {
    try {
      if (isSignedOutByUser()) return { easy: 3, advanced: 1 };
      const saved = localStorage.getItem('skkn_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && parsed.email.toLowerCase() === 'dathien2412@gmail.com') {
          return { easy: 9999, advanced: 9999 };
        }
        if (parsed?.quota) return parsed.quota;
      }
    } catch {}
    return { easy: 3, advanced: 1 };
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      if (isSignedOutByUser()) return 'GUEST';
      const saved = localStorage.getItem('skkn_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && parsed.email.toLowerCase() === 'dathien2412@gmail.com') return 'ADMIN';
        if (parsed?.role) return parsed.role;
      }
    } catch {}
    return 'GUEST';
  });

  const [plan, setPlan] = useState<LicensePlan>(() => {
    try {
      if (isSignedOutByUser()) return 'GUEST';
      const saved = localStorage.getItem('skkn_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && parsed.email.toLowerCase() === 'dathien2412@gmail.com') return 'PRO';
        if (parsed?.plan) return parsed.plan;
      }
    } catch {}
    return 'GUEST';
  });

  const [googleClientId, setGoogleClientId] = useState<string>(() => (import.meta.env.VITE_GOOGLE_CLIENT_ID || ''));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'license'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaExceededMode, setQuotaExceededMode] = useState<'easy' | 'advanced'>('easy');

  // Load Google Client ID & initial user status from server
  const refreshStatus = useCallback(async (forcedUser?: UserAccount | null) => {
    const currentGen = ++authGenerationRef.current;

    // Hủy request đang in-flight nếu có
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Get Client ID (chỉ gọi nếu chưa có trong build-time env)
      if (!googleClientId) {
        try {
          const cid = await fetchGoogleClientId(4000);
          if (cid && currentGen === authGenerationRef.current) {
            setGoogleClientId(cid);
          }
        } catch {}
      }

      const isSignedOut = signedOutRef.current || isSignedOutByUser();
      const currentUser = forcedUser !== undefined ? forcedUser : (isSignedOut ? null : user);

      // 2. Query status:
      // QUAN TRỌNG: Nếu người dùng đã logout (isSignedOut hoặc currentUser null), TUYỆT ĐỐI KHÔNG GỬI email hay userId!
      // CHỈ gửi guestId để server trả về phiên GUEST và quota còn lại của Guest.
      const query = new URLSearchParams();
      query.set('guestId', guestId);

      if (!isSignedOut && currentUser?.email) {
        query.set('email', currentUser.email);
      }
      if (!isSignedOut && currentUser?.id) {
        query.set('userId', currentUser.id);
      }

      const statusResp = await fetch(`/api/user/status?${query.toString()}`, {
        signal: controller.signal,
      }).catch(() => null);

      if (currentGen !== authGenerationRef.current) return;

      if (statusResp && statusResp.ok) {
        const data = await statusResp.json().catch(() => null);
        if (currentGen !== authGenerationRef.current) return;

        // Nếu người dùng đã logout, KHÔNG BAO GIỜ khôi phục user
        if (signedOutRef.current || isSignedOutByUser()) {
          if (data?.quota) {
            setQuota(data.quota);
          }
          return;
        }

        if (data?.isLoggedIn && data.user) {
          setUser(data.user);
          setRole(data.user.role);
          setPlan(data.user.plan);
          setQuota(data.user.quota);
          localStorage.setItem('skkn_user', JSON.stringify(data.user));
        } else if (data?.quota) {
          setQuota(data.quota);
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        // Bỏ qua lỗi kết nối máy chủ để không spam console
      }
    } finally {
      if (currentGen === authGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, [guestId, user, googleClientId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const parseJwtPayload = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const loginWithGoogleCredential = async (credential: string): Promise<boolean> => {
    // 1. Reset cờ intentional logout vì người dùng đã chủ động đăng nhập
    signedOutRef.current = false;
    try {
      sessionStorage.removeItem('skkn_signed_out');
    } catch {}
    const currentGen = ++authGenerationRef.current;

    try {
      const payload = parseJwtPayload(credential);
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          guestId,
          email: payload?.email,
          name: payload?.name,
          picture: payload?.picture,
          id: payload?.sub,
        })
      });

      if (!resp.ok) {
        // Fallback tự động nếu backend route chưa sẵn sàng (môi trường static Vercel)
        if (payload?.email) {
          if (currentGen !== authGenerationRef.current) return false;
          const email = String(payload.email).toLowerCase().trim();
          const isRootAdmin = email === 'dathien2412@gmail.com';
          const localUser: UserAccount = {
            id: payload.sub || `usr_${Date.now()}`,
            email,
            name: isRootAdmin ? (payload.name || 'Đa Thiện Hồ Nguyễn') : (payload.name || email.split('@')[0]),
            picture: payload.picture,
            role: isRootAdmin ? 'ADMIN' : 'TRIAL',
            plan: isRootAdmin ? 'PRO' : 'TRIAL',
            quota: isRootAdmin ? { easy: 9999, advanced: 9999 } : { easy: 3, advanced: 1 },
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isBlocked: false,
          };
          setUser(localUser);
          setRole(localUser.role);
          setPlan(localUser.plan);
          setQuota(localUser.quota);
          localStorage.setItem('skkn_user', JSON.stringify(localUser));
          return true;
        }
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || 'Đăng nhập Google không thành công');
      }

      const data = await resp.json();
      if (data.success && data.user) {
        if (currentGen !== authGenerationRef.current) return false;
        setUser(data.user);
        setRole(data.user.role);
        setPlan(data.user.plan);
        setQuota(data.user.quota);
        localStorage.setItem('skkn_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google login error:', err);
      // Dự phòng nếu fetch gặp lỗi mạng nhưng Google đã trả JWT hợp lệ
      try {
        const payload = parseJwtPayload(credential);
        if (payload?.email) {
          if (currentGen !== authGenerationRef.current) return false;
          const email = String(payload.email).toLowerCase().trim();
          const isRootAdmin = email === 'dathien2412@gmail.com';
          const localUser: UserAccount = {
            id: payload.sub || `usr_${Date.now()}`,
            email,
            name: isRootAdmin ? (payload.name || 'Đa Thiện Hồ Nguyễn') : (payload.name || email.split('@')[0]),
            picture: payload.picture,
            role: isRootAdmin ? 'ADMIN' : 'TRIAL',
            plan: isRootAdmin ? 'PRO' : 'TRIAL',
            quota: isRootAdmin ? { easy: 9999, advanced: 9999 } : { easy: 3, advanced: 1 },
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isBlocked: false,
          };
          setUser(localUser);
          setRole(localUser.role);
          setPlan(localUser.plan);
          setQuota(localUser.quota);
          localStorage.setItem('skkn_user', JSON.stringify(localUser));
          return true;
        }
      } catch {}
      return false;
    }
  };

  const loginWithEmailDemo = async (email: string, name?: string): Promise<boolean> => {
    signedOutRef.current = false;
    try {
      sessionStorage.removeItem('skkn_signed_out');
    } catch {}
    const currentGen = ++authGenerationRef.current;

    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, guestId })
      });

      if (!resp.ok) return false;
      const data = await resp.json();
      if (data.success && data.user) {
        if (currentGen !== authGenerationRef.current) return false;
        setUser(data.user);
        setRole(data.user.role);
        setPlan(data.user.plan);
        setQuota(data.user.quota);
        localStorage.setItem('skkn_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Email demo login error:', err);
      return false;
    }
  };

  const logout = () => {
    // 1. Tăng generation ID để vô hiệu hóa mọi request async cũ
    authGenerationRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Ghi nhận intentional logout
    signedOutRef.current = true;
    try {
      sessionStorage.setItem('skkn_signed_out', 'true');
    } catch {}

    // 3. Xóa vĩnh viễn user khỏi localStorage và Context
    try {
      localStorage.removeItem('skkn_user');
    } catch {}

    setUser(null);
    setRole('GUEST');
    setPlan('GUEST');

    // 4. Báo cho Google Identity Services tắt auto-select để không tự động chọn lại
    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (err) {
        console.warn('Google disableAutoSelect warning:', err);
      }
    }

    // 5. Cập nhật hạn mức thực của Guest (chỉ truy vấn guestId, forcedUser = null)
    refreshStatus(null);
  };

  const getDeviceId = () => {
    let devId = localStorage.getItem('skkn_device_id');
    if (!devId) {
      devId = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('skkn_device_id', devId);
    }
    return devId;
  };

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    const isWin = ua.includes('Windows') || ua.includes('Win');
    const isMac = ua.includes('Macintosh') || ua.includes('Mac');
    const os = isWin ? 'Windows PC' : isMac ? 'macOS' : 'Thiết bị';
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Trình duyệt';
    return `${os} • ${browser}`;
  };

  const activateLicense = async (key: string): Promise<{ success: boolean; message: string }> => {
    try {
      const deviceId = getDeviceId();
      const deviceName = getDeviceName();
      const resp = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: key,
          email: user?.email,
          userId: user?.id,
          guestId,
          deviceId,
          deviceName,
        })
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        if (data.user) {
          setUser(data.user);
          setRole(data.user.role);
          setPlan(data.user.plan);
          setQuota(data.user.quota);
          localStorage.setItem('skkn_user', JSON.stringify(data.user));
        } else {
          // Guest activated without login
          setRole('LICENSED');
          setPlan(data.license?.plan || 'PRO');
          setQuota({ easy: 9999, advanced: 9999 });
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Mã kích hoạt không hợp lệ.' };
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ kích hoạt: ' + err.message };
    }
  };

  const updateUserQuota = (newQuota: UserQuota, newRole?: UserRole) => {
    setQuota(newQuota);
    if (newRole) setRole(newRole);
    if (user) {
      const updated = { ...user, quota: newQuota, role: newRole || user.role };
      setUser(updated);
      localStorage.setItem('skkn_user', JSON.stringify(updated));
    }
  };

  const hasQuotaForMode = (mode: 'easy' | 'advanced'): boolean => {
    if (role === 'LICENSED' || role === 'ADMIN' || role === 'FREE_ACCESS' || Boolean(user?.freeAccess)) return true;
    if (role === 'BLOCKED') return false;
    return (quota[mode] ?? 0) > 0;
  };

  const openAuthModal = (tab: 'login' | 'license' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    if (!googleClientId) {
      fetchGoogleClientId(8000)
        .then((cid) => {
          if (cid) setGoogleClientId(cid);
        })
        .catch(() => {});
    }
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openAdminModal = () => setIsAdminModalOpen(true);
  const closeAdminModal = () => setIsAdminModalOpen(false);

  const openQuotaModal = (mode: 'easy' | 'advanced') => {
    setQuotaExceededMode(mode);
    setIsQuotaModalOpen(true);
  };
  const closeQuotaModal = () => setIsQuotaModalOpen(false);

  const isAdmin = role === 'ADMIN';
  const isBlocked = role === 'BLOCKED' || Boolean(user?.isBlocked);
  const isLicensed = role === 'LICENSED' || role === 'ADMIN' || role === 'FREE_ACCESS' || Boolean(user?.freeAccess);

  return (
    <AuthContext.Provider
      value={{
        user,
        guestId,
        role,
        plan,
        quota,
        isLoggedIn: Boolean(user),
        isAdmin,
        isBlocked,
        isLicensed,
        googleClientId,
        isLoading,
        loginWithGoogleCredential,
        loginWithEmailDemo,
        logout,
        activateLicense,
        refreshStatus,
        updateUserQuota,
        hasQuotaForMode,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isAdminModalOpen,
        openAdminModal,
        closeAdminModal,
        isQuotaModalOpen,
        quotaExceededMode,
        openQuotaModal,
        closeQuotaModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
