import React from 'react';
import { X, Check, BookOpen } from 'lucide-react';

interface ProfileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSampleIndex: number;
  onSelectSample: (index: number) => void;
  hasCustomProfile: boolean;
  customTitle?: string;
}

export const ProfileSelectorModal: React.FC<ProfileSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedSampleIndex,
  onSelectSample,
  hasCustomProfile,
  customTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-150"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-tight">
              CHỌN HỒ SƠ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of profiles */}
        <div className="p-4 sm:p-5 space-y-2.5">
          
          {/* Mẫu 1 */}
          <div
            onClick={() => {
              onSelectSample(0);
              onClose();
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedSampleIndex === 0
                ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-slate-900">
                  Mẫu 1 · Lịch sử 8
                </span>
                <span className="px-2 py-0.5 rounded text-[13px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Hồ sơ mẫu
                </span>
              </div>
              <p className="text-[13.5px] text-slate-500 truncate">
                Ứng dụng sơ đồ tư duy kết hợp phần mềm tương tác...
              </p>
            </div>

            {selectedSampleIndex === 0 && (
              <span className="text-blue-600 text-[13.5px] font-bold flex items-center gap-1 shrink-0">
                <Check className="w-4 h-4" />
                <span>Đang dùng</span>
              </span>
            )}
          </div>

          {/* Mẫu 2 */}
          <div
            onClick={() => {
              onSelectSample(1);
              onClose();
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedSampleIndex === 1
                ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-slate-900">
                  Mẫu 2 · Toán 10
                </span>
                <span className="px-2 py-0.5 rounded text-[13px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Hồ sơ mẫu
                </span>
              </div>
              <p className="text-[13.5px] text-slate-500 truncate">
                Đổi mới phương pháp dạy học hàm số bậc hai qua mô hình STEM...
              </p>
            </div>

            {selectedSampleIndex === 1 && (
              <span className="text-blue-600 text-[13.5px] font-bold flex items-center gap-1 shrink-0">
                <Check className="w-4 h-4" />
                <span>Đang dùng</span>
              </span>
            )}
          </div>

          {/* Hồ sơ của tôi (nếu đã có dữ liệu tải lên) */}
          {hasCustomProfile && (
            <div
              onClick={() => {
                onSelectSample(2);
                onClose();
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedSampleIndex === 2
                  ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15px] text-slate-900">
                    Hồ sơ của tôi
                  </span>
                  <span className="px-2 py-0.5 rounded text-[13px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Đã tải lên
                  </span>
                </div>
                <p className="text-[13.5px] text-slate-500 truncate">
                  {customTitle || 'Sáng kiến kinh nghiệm của tôi'}
                </p>
              </div>

              {selectedSampleIndex === 2 && (
                <span className="text-blue-600 text-[13.5px] font-bold flex items-center gap-1 shrink-0">
                  <Check className="w-4 h-4" />
                  <span>Đang dùng</span>
                </span>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
