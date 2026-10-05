import React from 'react';
import { ChevronDown, Menu, BookOpen } from 'lucide-react';
import { SKKNAnalysisResult } from '../types';

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
  onExitDemo
}) => {
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

      {/* Right: [Hồ sơ ▾] */}
      <div className="flex items-center gap-2 shrink-0">
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
