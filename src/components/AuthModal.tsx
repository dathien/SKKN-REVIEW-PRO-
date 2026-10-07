import React, { useState, useEffect, useRef } from 'react';
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
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    google?: any;
  }
}

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

  // Google Identity Services Button chuẩn
  useEffect(() => {
    if (!isAuthModalOpen || isLoggedIn) return;

    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setAuthError(null);
              const success = await loginWithGoogleCredential(response.credential);
              if (!success) {
                setAuthError('Không thể đăng nhập Google. Vui lòng thử lại.');
              }
            } else {
              setAuthError('Không thể đăng nhập Google. Vui lòng thử lại.');
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            locale: 'vi',
          });
        }
      } catch (err) {
        console.warn('Google Identity button initialization error:', err);
      }
    }
  }, [isAuthModalOpen, isLoggedIn, googleClientId, loginWithGoogleCredential]);

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

              {/* Action Buttons */}
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
                  Đăng nhập để đồng bộ tài khoản và kiểm tra quyền sử dụng trên SKKN REVIEW PRO.
                </p>
              </div>

              {/* Error Banner nếu có */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google Identity Services Button Container */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div ref={googleBtnRef} className="min-h-[44px] flex justify-center w-full max-w-xs" />
                {!googleClientId && (
                  <p className="text-[12px] text-amber-700 mt-2 text-center">
                    Đang nạp thông tin Google Client ID...
                  </p>
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
