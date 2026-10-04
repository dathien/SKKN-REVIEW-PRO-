import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  Files,
  Plus,
  ExternalLink,
  FolderOpen
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
  hasCustomAnalysis?: boolean;
  workflowStatus?: string;
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
  isSample,
  hasCustomAnalysis = false,
  workflowStatus = 'IDLE',
  skknFileName,
  rubricFileName
}) => {
  const [showDetailAccordion, setShowDetailAccordion] = useState(false);

  if (!isOpen) return null;

  // Determine if a dossier is currently active
  // True if user is evaluating a sample OR has evaluated/uploaded custom analysis
  const hasActiveDossier = isSample || hasCustomAnalysis || workflowStatus !== 'IDLE';

  const { metadata, evidenceChain } = analysis || {};
  const evidenceCount = evidenceChain?.length || 4;

  const sampleLabel = selectedSampleIndex === 0
    ? 'Mẫu 1 · Lịch sử 8'
    : selectedSampleIndex === 1
    ? 'Mẫu 2 · Toán 10'
    : 'Hồ sơ của tôi';

  const handleStartNew = () => {
    onClose();
    onStartNewDocument();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto select-none animate-in fade-in duration-150 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop: Overlay phía sau chỉ tối nhẹ rgba(15,23,42,0.25) + blur nhẹ 2px */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity"
      />

      {/* Modal Container: width min(600px, calc(100vw - 40px)), max-height 80vh, rounded-2xl */}
      <div
        className="relative bg-white border border-slate-200/90 rounded-2xl shadow-xl flex flex-col z-10 animate-in zoom-in-95 duration-150 overflow-hidden"
        style={{
          width: 'min(600px, calc(100vw - 40px))',
          maxHeight: '80vh'
        }}
      >
        {/* ======================================================================= */}
        {/* HEADER MODAL (Trang nhã, không dùng header navy lớn như drawer cũ)      */}
        {/* ======================================================================= */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              HỒ SƠ ĐÁNH GIÁ
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Quản lý hồ sơ và tài liệu đang sử dụng
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================================= */}
        {/* BODY MODAL (Cuộn bên trong nếu nội dung dài)                           */}
        {/* ======================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800 text-xs">
          
          {/* TRƯỜNG HỢP 1: CHƯA CÓ HỒ SƠ ĐÁNH GIÁ */}
          {!hasActiveDossier ? (
            <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  CHƯA CÓ HỒ SƠ ĐÁNH GIÁ
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Tải SKKN hoặc dán nội dung để bắt đầu chấm và phản biện.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartNew}
                className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ TẠO HỒ SƠ ĐÁNH GIÁ</span>
              </button>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: HỒ SƠ ĐANG DÙNG */
            <>
              {/* Card Hồ sơ đang đánh giá */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>HỒ SƠ ĐANG ĐÁNH GIÁ</span>
                    </span>
                    {isSample ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                        HỒ SƠ MẪU
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        HỒ SƠ CỦA TÔI
                      </span>
                    )}
                  </div>

                  {/* Nút ĐỔI HỒ SƠ */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSampleSelector();
                    }}
                    className="py-1 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                    <span>ĐỔI HỒ SƠ</span>
                  </button>
                </div>

                {/* Tên mẫu nếu có */}
                {isSample && (
                  <p className="text-[11px] font-semibold text-blue-700">
                    {sampleLabel}
                  </p>
                )}

                {/* Tên đề tài tối đa 2 dòng */}
                <h4
                  className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2"
                  title={metadata?.title}
                >
                  {metadata?.title || 'Ứng dụng sáng kiến kinh nghiệm trong giảng dạy'}
                </h4>

                {/* Tác giả */}
                {metadata?.author && (
                  <p className="text-xs text-slate-500 font-medium">
                    {metadata.author}
                  </p>
                )}
              </div>

              {/* TÀI LIỆU TRỰC QUAN */}
              <div className="p-4 rounded-xl border border-slate-200/90 space-y-3 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  TÀI LIỆU HỒ SƠ
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Item 1: SKKN */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block text-xs">SKKN</span>
                      <span className="text-[11px] text-slate-500 truncate block" title={skknFileName || 'Đã có nội dung'}>
                        {skknFileName || 'Đã có nội dung'}
                      </span>
                    </div>
                  </div>

                  {/* Item 2: Phiếu chấm */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block text-xs">Phiếu chấm</span>
                      <span className="text-[11px] text-slate-500 truncate block" title={rubricFileName || 'Rubric chính thức'}>
                        {rubricFileName || 'Rubric chính thức'}
                      </span>
                    </div>
                  </div>

                  {/* Item 3: Minh chứng */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block text-xs">Minh chứng</span>
                      <span className="text-[11px] text-slate-500 block">
                        {evidenceCount} tài liệu
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút Xem chi tiết tài liệu (Mở Accordion ngay trong modal) */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowDetailAccordion(!showDetailAccordion)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{showDetailAccordion ? 'Thu gọn chi tiết tài liệu' : 'Xem chi tiết tài liệu'}</span>
                    {showDetailAccordion ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* ACCORDION NGAY TRONG MODAL (Không mở popup khác) */}
                {showDetailAccordion && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                    {/* SKKN Detail */}
                    <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block text-xs">SKKN</span>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {skknFileName || metadata?.title || 'Nội dung văn bản đã nhập'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartNew}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                      >
                        Thay SKKN
                      </button>
                    </div>

                    {/* Rubric Detail */}
                    <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block text-xs">Phiếu chấm</span>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {rubricFileName || 'Tiêu chuẩn đánh giá SKKN Bộ GD&ĐT'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartNew}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                      >
                        Thay phiếu chấm
                      </button>
                    </div>

                    {/* Evidence Detail */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Files className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block text-xs">Minh chứng</span>
                          <span className="text-[11px] text-slate-500 block">
                            {evidenceCount} tài liệu đính kèm
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onViewProfileDetail && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewProfileDetail();
                            }}
                            className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Xem</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleStartNew}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Bổ sung</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* ======================================================================= */}
        {/* FOOTER MODAL: [ĐÓNG] (bên trái) và [+ TẠO HỒ SƠ MỚI] (bên phải)         */}
        {/* ======================================================================= */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleStartNew}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ TẠO HỒ SƠ MỚI</span>
          </button>
        </div>

      </div>
    </div>
  );
};
