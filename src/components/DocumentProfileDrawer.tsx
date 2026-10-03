import React from 'react';
import {
  X,
  Plus,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { SKKNAnalysisResult } from '../types';

interface DocumentProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: SKKNAnalysisResult;
  selectedSampleIndex: number;
  onOpenSampleSelector: () => void;
  onStartNewDocument: () => void;
  onViewProfileDetail?: () => void;
  isSample: boolean;
  skknFileName?: string;
  rubricFileName?: string;
}

export const DocumentProfileDrawer: React.FC<DocumentProfileDrawerProps> = ({
  isOpen,
  onClose,
  analysis,
  selectedSampleIndex,
  onOpenSampleSelector,
  onStartNewDocument,
  onViewProfileDetail,
  isSample
}) => {
  if (!isOpen) return null;

  const { metadata, evidenceChain } = analysis;
  const evidenceCount = evidenceChain?.length || 4;

  const sampleLabel = selectedSampleIndex === 0
    ? 'Mẫu 1 · Lịch sử 8'
    : selectedSampleIndex === 1
    ? 'Mẫu 2 · Toán 10'
    : 'Hồ sơ của tôi';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Right Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex md:pl-10">
        <div className="w-screen md:w-[350px] bg-white shadow-2xl flex flex-col h-full border-l border-slate-200">
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <h2 className="text-xs font-black tracking-wider text-white uppercase">
              HỒ SƠ
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800 text-xs">
            
            {/* ========================================================================= */}
            {/* 1. ĐANG DÙNG                                                              */}
            {/* ========================================================================= */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                ĐANG DÙNG
              </span>

              {/* Sample Badge + Name */}
              <div className="flex items-center gap-2">
                {isSample ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                    HỒ SƠ MẪU
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    HỒ SƠ CỦA TÔI
                  </span>
                )}
                <span className="font-bold text-xs text-slate-700">
                  {sampleLabel}
                </span>
              </div>

              {/* Tên sáng kiến (tối đa 2 dòng) */}
              <p
                className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2"
                title={metadata.title}
              >
                {metadata.title || 'Sáng kiến kinh nghiệm'}
              </p>

              {/* Tác giả */}
              {metadata.author && (
                <p className="text-[11px] text-slate-500 font-medium">
                  {metadata.author}
                </p>
              )}

              {/* Nút Đổi hồ sơ */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenSampleSelector}
                  className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Đổi hồ sơ</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* ========================================================================= */}
            {/* 2. TÀI LIỆU                                                               */}
            {/* ========================================================================= */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                TÀI LIỆU
              </span>

              {/* Danh sách trạng thái tài liệu tinh gọn */}
              <div className="space-y-1.5 text-xs text-slate-700 font-medium pl-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>SKKN</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Phiếu chấm</span>
                </div>

                <div className="flex items-center gap-2 pl-4 text-slate-600">
                  <span>{evidenceCount} Minh chứng</span>
                </div>
              </div>

              {/* Nút [Xem chi tiết hồ sơ →] */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onViewProfileDetail) onViewProfileDetail();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
                >
                  <span>Xem chi tiết hồ sơ</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* ========================================================================= */}
            {/* 3. BẮT ĐẦU HỒ SƠ MỚI                                                      */}
            {/* ========================================================================= */}
            <div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartNewDocument();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>+ Bắt đầu hồ sơ mới</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
