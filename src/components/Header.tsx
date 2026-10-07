import React from 'react';
import { ChevronDown, Menu, BookOpen, User, Key, Shield, Sparkles } from 'lucide-react';
import { SKKNAnalysisResult } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  analysis: SKKNAnalysisResult;
  onOpenProfileDrawer: () => void;
  isSample: boolean;
  isDemoMode?: boolean;
  hasActiveEvaluation?: boolean;
  onOpenMobileMenu?: () => void;
  isUploadWorkspace?: boolean;
  onStartNewSKKN?: () => void;
  onExitDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  analysis,
  onOpenProfileDrawer,
  isSample,
  isDemoMode = false,
  hasActiveEvaluation = false,
  onOpenMobileMenu,
  isUploadWorkspace = false,
  onStartNewSKKN,
  onExitDemo,
}) => {
  const {
    user,
    role,
    plan,
    quota,
    isLoggedIn,
    isAdmin,
    openAuthModal,
    openAdminModal,
  } = useAuth();

  const displayTitle = isDemoMode
    ? analysis.metadata.title || 'Hồ sơ sáng kiến mẫu'
    : hasActiveEvaluation
    ? analysis.metadata.title || 'Hồ sơ sáng kiến kinh nghiệm'
    : 'Tạo hồ sơ đánh giá';

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between gap-3 shadow-2xs shrink-0 select-none">
      {/* Left: Mobile hamburger + Tên SKKN ngắn (tối đa 1 dòng) + Badge HỒ SƠ MẪU */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h1
          className="text-[15px] sm:text-[17px] font-bold text-slate-900 truncate tracking-tight"
          title={displayTitle}
        >
          {displayTitle}
        </h1>

        {isDemoMode && (
          <button
            type="button"
            onClick={onOpenProfileDrawer}
            className="text-[13px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
            title="Nhấp để xem chi tiết hồ sơ hoặc đổi hồ sơ"
          >
            HỒ SƠ MẪU
          </button>
        )}
      </div>

      {/* Right: Account & License indicators + [Hồ sơ ▾] */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* ADMIN PORTAL BUTTON */}
        {isAdmin && (
          <button
            type="button"
            onClick={openAdminModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Mở Trung tâm Quản trị Admin"
          >
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            <span>Quản trị</span>
          </button>
        )}

        {/* QUOTA / LICENSE BADGE */}
        {role === 'LICENSED' || role === 'ADMIN' ? (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Quyền sử dụng không giới hạn"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Không giới hạn</span>
          </button>
        ) : role === 'FREE_ACCESS' ? (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Đang trong chương trình miễn phí"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Free Access</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all cursor-pointer"
            title="Xem số lượt hoặc kiểm tra quyền sử dụng"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {role === 'GUEST' ? 'Trải nghiệm' : 'Trial'}: Dễ {quota.easy ?? 0} | Sâu {quota.advanced ?? 0}
            </span>
          </button>
        )}

        {/* USER ACCOUNT BUTTON / LOGIN BUTTON (Mục L) */}
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs max-w-[140px] truncate"
            title={`Tài khoản: ${user?.email}`}
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {user?.name?.slice(0, 1).toUpperCase() || 'GV'}
              </div>
            )}
            <span className="truncate text-[13px]">{user?.name || user?.email?.split('@')[0]}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Đăng nhập tài khoản Google"
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Đăng nhập</span>
          </button>
        )}

        {/* HỒ SƠ BUTTON */}
        <button
          type="button"
          onClick={onOpenProfileDrawer}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[14px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Hồ sơ</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  );
};
