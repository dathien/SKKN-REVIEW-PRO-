import React from 'react';
import { AlertCircle, User, Key, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const QuotaExceededModal: React.FC = () => {
  const {
    isQuotaModalOpen,
    quotaExceededMode,
    closeQuotaModal,
    openAuthModal,
    isLoggedIn,
    role
  } = useAuth();

  if (!isQuotaModalOpen) return null;

  const modeName = quotaExceededMode === 'easy' ? 'Cơ bản' : 'Chuyên sâu';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 text-center space-y-3 bg-gradient-to-b from-amber-50/70 to-white">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[18px] font-bold text-slate-900">
              Đã hết lượt trải nghiệm
            </h3>
            <p className="text-[13px] text-slate-600 leading-relaxed max-w-sm mx-auto">
              Thầy/Cô đã sử dụng hết số lượt ở chế độ <strong>{modeName}</strong>. Thầy/Cô có thể đăng nhập để kiểm tra quyền sử dụng hoặc liên hệ quản trị viên để kích hoạt tài khoản.
            </p>
          </div>
        </div>

        {/* Content options (Mục J) */}
        <div className="p-6 pt-0 space-y-3">
          {!isLoggedIn ? (
            /* Chưa đăng nhập: Nút chính "ĐĂNG NHẬP GOOGLE" */
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-[14px]">
                <User className="w-4.5 h-4.5 text-blue-700" />
                <span>Kiểm tra tài khoản đã cấp quyền</span>
              </div>
              <p className="text-[12.5px] text-blue-800 leading-relaxed">
                Đăng nhập tài khoản Google để kiểm tra và đồng bộ quyền sử dụng đã được kích hoạt trên hệ thống.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeQuotaModal();
                  openAuthModal('login');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>ĐĂNG NHẬP GOOGLE</span>
              </button>
            </div>
          ) : (
            /* Đã đăng nhập nhưng hết lượt Trial */
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-center">
              <p className="text-[14px] font-bold text-amber-950 leading-relaxed">
                Liên hệ quản trị viên để kích hoạt quyền sử dụng.
              </p>
              <p className="text-[12.5px] text-amber-800 leading-relaxed">
                Quản trị viên sẽ phê duyệt và cấp quyền sử dụng không giới hạn trực tiếp cho tài khoản của Thầy/Cô.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[13px]">
          <span className="text-slate-500">SKKN REVIEW PRO</span>
          <button
            type="button"
            onClick={closeQuotaModal}
            className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
