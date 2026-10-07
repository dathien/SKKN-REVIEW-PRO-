import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  User,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Clock,
  Gift,
  RefreshCw,
  Shield,
  Key,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  loadGoogleIdentityScript,
  fetchGoogleClientId,
  resetGoogleAuthCache,
} from '../utils/googleIdentity';

declare global {
  interface Window {
    google?: any;
  }
}

type GoogleAuthStatus =
  | 'LOADING_CONFIG'
  | 'CONFIG_ERROR'
  | 'GOOGLE_SCRIPT_LOADING'
  | 'GOOGLE_READY'
  | 'GOOGLE_ERROR';

export const AuthModal: React.FC = () => {
  const {
    user,
    role,
    quota,
    isLoggedIn,
    isAdmin,
    isBlocked,
    googleClientId,
    isAuthModalOpen,
    closeAuthModal,
    openAdminModal,
    loginWithGoogleCredential,
    logout,
    refreshStatus,
    activateLicense
  } = useAuth();

  const [authError, setAuthError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);
  const [licenseFeedback, setLicenseFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLicenseEntry, setShowLicenseEntry] = useState(false);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<GoogleAuthStatus>('LOADING_CONFIG');
  const [googleAuthErrorMsg, setGoogleAuthErrorMsg] = useState<string | null>(null);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthError(null);
    setLicenseFeedback(null);
  }, [isAuthModalOpen]);

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = licenseKeyInput.trim();
    if (!key) return;

    setIsActivatingLicense(true);
    setLicenseFeedback(null);
    try {
      const res = await activateLicense(key);
      if (res.success) {
        setLicenseFeedback({ type: 'success', text: res.message });
        setLicenseKeyInput('');
        setShowLicenseEntry(false);
      } else {
        setLicenseFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setLicenseFeedback({ type: 'error', text: 'Có lỗi xảy ra khi kích hoạt. Vui lòng thử lại.' });
    } finally {
      setIsActivatingLicense(false);
    }
  };

  // Khởi tạo Google Identity Services với state rõ ràng và timeout
  const initGoogleIdentity = useCallback(async () => {
    if (isLoggedIn) return;

    setGoogleAuthErrorMsg(null);
    setAuthError(null);

    // 1. LOADING_CONFIG: Nạp Google Client ID
    setGoogleAuthStatus('LOADING_CONFIG');
    let clientId = googleClientId;
    if (!clientId) {
      try {
        clientId = await fetchGoogleClientId(8000);
      } catch (err: any) {
        setGoogleAuthStatus('CONFIG_ERROR');
        setGoogleAuthErrorMsg('Không thể nạp thông tin Google Client ID từ hệ thống.');
        return;
      }
    }

    if (!clientId) {
      setGoogleAuthStatus('CONFIG_ERROR');
      setGoogleAuthErrorMsg('Chưa tìm thấy Google Client ID hợp lệ trong cấu hình.');
      return;
    }

    // 2. GOOGLE_SCRIPT_LOADING: Nạp thư viện Google Identity Services
    setGoogleAuthStatus('GOOGLE_SCRIPT_LOADING');
    try {
      await loadGoogleIdentityScript(8000);
    } catch (err: any) {
      setGoogleAuthStatus('GOOGLE_ERROR');
      setGoogleAuthErrorMsg('Không thể tải thư viện Google Identity Services từ Google.');
      return;
    }

    if (!window.google?.accounts?.id) {
      setGoogleAuthStatus('GOOGLE_ERROR');
      setGoogleAuthErrorMsg('Thư viện Google Identity chưa sẵn sàng.');
      return;
    }

    // 3. GOOGLE_READY: Khởi tạo Client và chuẩn bị render button
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response.credential) {
            setAuthError(null);
            setIsSubmittingGoogle(true);
            try {
              const success = await loginWithGoogleCredential(response.credential);
              if (!success) {
                setAuthError('Không thể hoàn tất đăng nhập Google.');
              }
            } catch {
              setAuthError('Không thể hoàn tất đăng nhập Google.');
            } finally {
              setIsSubmittingGoogle(false);
            }
          } else {
            setAuthError('Không thể hoàn tất đăng nhập Google.');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Google Auth] Google Identity initialized');
      }

      setGoogleAuthStatus('GOOGLE_READY');
    } catch (err: any) {
      console.warn('Google Identity initialization error:', err);
      setGoogleAuthStatus('GOOGLE_ERROR');
      setGoogleAuthErrorMsg('Không thể khởi tạo dịch vụ đăng nhập Google.');
    }
  }, [isLoggedIn, googleClientId, loginWithGoogleCredential]);

  // Kích hoạt nạp khi modal mở
  useEffect(() => {
    if (isAuthModalOpen && !isLoggedIn) {
      initGoogleIdentity();
    }
  }, [isAuthModalOpen, isLoggedIn, initGoogleIdentity]);

  // Render Google Button chính thức khi trạng thái GOOGLE_READY (Tuyệt đối dùng signin_with, không dùng continue_with để không tự hiện avatar)
  useEffect(() => {
    if (
      isAuthModalOpen &&
      !isLoggedIn &&
      googleAuthStatus === 'GOOGLE_READY' &&
      googleBtnRef.current &&
      window.google?.accounts?.id
    ) {
      googleBtnRef.current.innerHTML = '';
      try {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'vi',
        });
      } catch (err) {
        console.warn('Could not render Google Button:', err);
      }
    }
  }, [isAuthModalOpen, isLoggedIn, googleAuthStatus]);

  if (!isAuthModalOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isFreeAccess = role === 'FREE_ACCESS' || Boolean(user?.freeAccess);
  const isLicensed = role === 'LICENSED' || (isLoggedIn && role === 'ADMIN');

  const formatExpiryDate = (isoStr?: string | null) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header Modal (Mục IV) */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[13px] shadow-xs shrink-0">
              PRO
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-tight truncate">
                Tài khoản SKKN REVIEW PRO
              </h3>
              <p className="text-[12px] sm:text-[12.5px] text-slate-500 truncate mt-0.5">
                {isLoggedIn && user?.email
                  ? `Đang đăng nhập: ${user.email}`
                  : 'Đăng nhập để quản lý tài khoản và quyền sử dụng'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal (Mục IV & V) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {isLoggedIn ? (
            /* ĐÃ ĐĂNG NHẬP (Mục V) */
            <div className="space-y-4">
              {/* User Identity Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start sm:items-center gap-3.5">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-13 h-13 rounded-full border border-slate-300 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shrink-0">
                    {user?.name?.slice(0, 2).toUpperCase() || 'GV'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[15px] sm:text-[16px] text-slate-900 truncate">
                      {user?.name || user?.email}
                    </span>

                    {/* Badge Quản trị viên tách biệt với quyền sử dụng */}
                    {isAdmin && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 shrink-0 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-purple-600" />
                        <span>Quản trị viên</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Trạng thái quyền sử dụng (Mục V) */}
              {isBlocked ? (
                /* 1. BLOCKED */
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-[14px]">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>Tài khoản hiện chưa được phép sử dụng.</span>
                  </div>
                  <p className="text-[13px] text-rose-700">
                    Vui lòng liên hệ quản trị viên để được hỗ trợ.
                  </p>
                </div>
              ) : isFreeAccess ? (
                /* 2. FREE_ACCESS */
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-950 font-bold text-[14px]">
                    <Gift className="w-4.5 h-4.5 text-cyan-700 shrink-0" />
                    <span>Đang trong chương trình miễn phí</span>
                  </div>
                  {user?.freeAccessName && (
                    <p className="text-[13px] text-cyan-800 font-medium">
                      {user.freeAccessName}
                    </p>
                  )}
                  {user?.freeAccessExpiresAt && (
                    <p className="text-[12.5px] text-cyan-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Đến: {formatExpiryDate(user.freeAccessExpiresAt)}</span>
                    </p>
                  )}
                  <p className="text-[12px] text-cyan-700/90">
                    Quyền sử dụng: Không giới hạn trong thời gian chương trình.
                  </p>
                </div>
              ) : isLicensed ? (
                /* 3. LICENSED */
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-[14px]">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
                    <span>Đã được cấp quyền</span>
                  </div>
                  <p className="text-[13px] text-emerald-800 font-medium">
                    Quyền sử dụng: <strong>Không giới hạn</strong>
                  </p>
                  {user?.licenseExpiresAt && (
                    <p className="text-[12.5px] text-emerald-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Có hiệu lực đến: {formatExpiryDate(user.licenseExpiresAt)}</span>
                    </p>
                  )}
                </div>
              ) : (
                /* 4. TRIAL */
                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <span className="text-[13.5px] font-bold text-blue-950 block">Gói trải nghiệm</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <span className="text-[11.5px] text-slate-500 block">Cơ bản:</span>
                        <span className="text-[15.5px] font-bold text-blue-900">
                          còn {quota.easy ?? 0} lượt
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <span className="text-[11.5px] text-slate-500 block">Chuyên sâu:</span>
                        <span className="text-[15.5px] font-bold text-indigo-900">
                          còn {quota.advanced ?? 0} lượt
                        </span>
                      </div>
                    </div>
                  </div>

                  {(quota.easy ?? 0) <= 0 && (quota.advanced ?? 0) <= 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px] text-amber-900">
                      Thầy/Cô đã dùng hết lượt trải nghiệm. Vui lòng liên hệ quản trị viên hoặc nhập mã bản quyền đã mua để tiếp tục sử dụng.
                    </div>
                  )}
                </div>
              )}

              {/* KHÁCH HÀNG MUA LICENSE KEY: Nhập mã kích hoạt gắn thiết bị & tài khoản */}
              {!isLicensed && (
                <div className="pt-2 border-t border-slate-200/80">
                  {!showLicenseEntry ? (
                    <button
                      type="button"
                      onClick={() => setShowLicenseEntry(true)}
                      className="w-full py-2.5 px-3.5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-800 text-[13px] font-bold rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-blue-600" />
                      <span>Thầy/Cô đã có Mã bản quyền? Kích hoạt ngay</span>
                    </button>
                  ) : (
                    <form onSubmit={handleActivateLicense} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-blue-600" />
                          <span>Kích hoạt mã bản quyền</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => { setShowLicenseEntry(false); setLicenseFeedback(null); }}
                          className="text-[12px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>

                      <p className="text-[12px] text-slate-500 leading-tight">
                        Mã bản quyền sẽ được liên kết với tài khoản Google và thiết bị hiện tại của Thầy/Cô.
                      </p>

                      <div className="flex items-stretch gap-2">
                        <input
                          type="text"
                          value={licenseKeyInput}
                          onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                          placeholder="Ví dụ: SKKN-PRO-XXXX-XXXX"
                          className="flex-1 px-3 py-2 text-[13px] font-mono tracking-wider uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                          disabled={isActivatingLicense}
                        />
                        <button
                          type="submit"
                          disabled={isActivatingLicense || !licenseKeyInput.trim()}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-[13px] rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          {isActivatingLicense ? 'Đang kích hoạt...' : 'Kích hoạt'}
                        </button>
                      </div>

                      {licenseFeedback && (
                        <div className={`p-2.5 rounded-lg text-[12px] flex items-start gap-1.5 ${
                          licenseFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}>
                          {licenseFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <span>{licenseFeedback.text}</span>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              )}

              {/* Action Buttons (Mục 10: ĐÓNG, ĐĂNG XUẤT, QUẢN TRỊ) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 text-[13.5px] font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Đồng bộ lại trạng thái"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13.5px] rounded-xl transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        closeAuthModal();
                        openAdminModal();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13.5px] rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Quản trị</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* CHƯA ĐĂNG NHẬP (GUEST) (Mục IV) */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-[16px] sm:text-[17px] font-bold text-slate-900">
                  Đăng nhập bằng tài khoản Google
                </h4>
                <p className="text-[13px] sm:text-[13.5px] text-slate-500 leading-relaxed">
                  Không cần đăng ký riêng. Lần đầu đăng nhập, hệ thống sẽ tự tạo tài khoản và cấp quyền trải nghiệm.
                </p>
              </div>

              {/* Error Banner nếu có (Mục 13: Có nút THỬ LẠI) */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      initGoogleIdentity();
                    }}
                    className="px-2.5 py-1 text-[12px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg cursor-pointer shrink-0"
                  >
                    THỬ LẠI
                  </button>
                </div>
              )}

              {/* Google Identity Services State & Button Container */}
              <div className="py-2 flex flex-col items-center justify-center min-h-[56px]">
                {isSubmittingGoogle ? (
                  <div className="w-full max-w-xs py-3 px-4 flex items-center justify-center gap-2.5 text-[13px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    <span>Đang xác thực tài khoản Google...</span>
                  </div>
                ) : googleAuthStatus === 'LOADING_CONFIG' ? (
                  <div className="py-2 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[12.5px] text-slate-500 text-center font-medium">
                      Đang nạp thông tin Google Client ID...
                    </p>
                  </div>
                ) : googleAuthStatus === 'GOOGLE_SCRIPT_LOADING' ? (
                  <div className="py-2 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[12.5px] text-slate-500 text-center font-medium">
                      Đang khởi tạo dịch vụ đăng nhập Google...
                    </p>
                  </div>
                ) : googleAuthStatus === 'CONFIG_ERROR' || googleAuthStatus === 'GOOGLE_ERROR' ? (
                  <div className="w-full max-w-xs p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-rose-800 text-[13px] font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Không thể khởi tạo đăng nhập Google.</span>
                    </div>
                    {googleAuthErrorMsg && (
                      <p className="text-[12px] text-rose-600 leading-snug">
                        {googleAuthErrorMsg}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        resetGoogleAuthCache();
                        initGoogleIdentity();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[12.5px] font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>THỬ LẠI</span>
                    </button>
                  </div>
                ) : (
                  <div ref={googleBtnRef} className="min-h-[44px] flex justify-center w-full max-w-xs" />
                )}
              </div>

              {/* Thông tin Guest hiện tại */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-[13px] text-slate-700 font-medium">
                  Bạn đang sử dụng chế độ trải nghiệm.
                </p>
                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[12.5px] text-slate-600">
                  <span>Lượt trải nghiệm hiện tại:</span>
                  <span className="font-bold text-slate-800">
                    Cơ bản: {quota.easy ?? 0} • Chuyên sâu: {quota.advanced ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal (Mục XIII) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[12px] sm:text-[12.5px] text-slate-500 shrink-0">
          <span>SKKN REVIEW PRO • Bản quyền giáo dục</span>
          <span>Bảo vệ thông tin tài khoản</span>
        </div>
      </div>
    </div>
  );
};
