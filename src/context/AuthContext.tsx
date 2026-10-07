import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  refreshStatus: () => Promise<void>;
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
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('skkn_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [quota, setQuota] = useState<UserQuota>({ easy: 3, advanced: 1 });
  const [role, setRole] = useState<UserRole>('GUEST');
  const [plan, setPlan] = useState<LicensePlan>('GUEST');
  const [googleClientId, setGoogleClientId] = useState<string>(() => (import.meta.env.VITE_GOOGLE_CLIENT_ID || ''));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'license'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaExceededMode, setQuotaExceededMode] = useState<'easy' | 'advanced'>('easy');

  // Load Google Client ID & initial user status from server
  const refreshStatus = useCallback(async () => {
    try {
      // 1. Get Client ID (với timeout và fallback thông minh)
      try {
        const cid = await fetchGoogleClientId(8000);
        if (cid) {
          setGoogleClientId(cid);
        }
      } catch (e) {
        console.warn('Could not load Google Client ID:', e);
      }

      // 2. Get User / Guest status
      const query = new URLSearchParams();
      query.set('guestId', guestId);
      if (user?.email) query.set('email', user.email);
      if (user?.id) query.set('userId', user.id);

      const statusResp = await fetch(`/api/user/status?${query.toString()}`).catch(() => null);
      if (statusResp?.ok) {
        const data = await statusResp.json();
        if (data.isLoggedIn && data.user) {
          setUser(data.user);
          setRole(data.user.role);
          setPlan(data.user.plan);
          setQuota(data.user.quota);
          localStorage.setItem('skkn_user', JSON.stringify(data.user));
        } else {
          setRole('GUEST');
          setPlan('GUEST');
          setQuota(data.quota || { easy: 3, advanced: 1 });
        }
      }
    } catch (err) {
      console.warn('Could not refresh auth status from server:', err);
    } finally {
      setIsLoading(false);
    }
  }, [guestId, user?.email, user?.id]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const loginWithGoogleCredential = async (credential: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, guestId })
      });

      if (!resp.ok) {
        throw new Error('Đăng nhập Google không thành công');
      }

      const data = await resp.json();
      if (data.success && data.user) {
        setUser(data.user);
        setRole(data.user.role);
        setPlan(data.user.plan);
        setQuota(data.user.quota);
        localStorage.setItem('skkn_user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google login error:', err);
      return false;
    }
  };

  const loginWithEmailDemo = async (email: string, name?: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, guestId })
      });

      if (!resp.ok) return false;
      const data = await resp.json();
      if (data.success && data.user) {
        setUser(data.user);
        setRole(data.user.role);
        setPlan(data.user.plan);
        setQuota(data.user.quota);
        localStorage.setItem('skkn_user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Email demo login error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('skkn_user');
    setUser(null);
    setRole('GUEST');
    setPlan('GUEST');
    // Fetch guest quota
    refreshStatus();
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
