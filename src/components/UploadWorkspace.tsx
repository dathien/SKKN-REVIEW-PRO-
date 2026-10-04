import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Paperclip,
  X,
  Award,
  AlertCircle
} from 'lucide-react';
import { UploadedFileItem } from '../types';
import { FriendlyErrorInfo } from '../utils/aiErrorHandler';
import { AssistantMascot, MascotState } from './AssistantMascot';

interface UploadWorkspaceProps {
  onAnalyze: (
    skknText: string,
    rubricText: string,
    evidenceFiles: UploadedFileItem[],
    notes: string
  ) => Promise<void>;
  isLoading: boolean;
  onCancelReturn?: () => void;
  hasExistingAnalysis?: boolean;
  isSample?: boolean;
  isCustomAnalyzed?: boolean;
  currentProfileTitle?: string;
  currentProfileAuthor?: string;
  onOpenProfileDrawer?: () => void;
  onViewProfileDetail?: () => void;
  onViewDemo?: () => void;
  analysisError?: FriendlyErrorInfo | string | null;
  retryState?: { attempt: number; maxAttempts: number } | null;
  onClearError?: () => void;
  issuesCount?: number;
  isAllResolved?: boolean;
  isRescoring?: boolean;
}

interface LoadedFile {
  file: File;
  name: string;
  size: number;
  textContent: string;
  dataBase64?: string;
}

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({
  onAnalyze,
  isLoading,
  onCancelReturn,
  hasExistingAnalysis = false,
  isSample = false,
  isCustomAnalyzed = false,
  currentProfileTitle,
  currentProfileAuthor,
  onOpenProfileDrawer,
  onViewProfileDetail,
  onViewDemo,
  analysisError,
  retryState,
  onClearError,
  issuesCount,
  isAllResolved,
  isRescoring
}) => {
  // Mode selection: 'none' | 'file' | 'paste'
  const [activeMode, setActiveMode] = useState<'none' | 'file' | 'paste'>('none');
  const [isPasteExpanded, setIsPasteExpanded] = useState<boolean>(false);

  // SKKN File & Text state
  const [skknFile, setSkknFile] = useState<LoadedFile | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [skknTitle, setSkknTitle] = useState<string>('');

  // Supplementary Documents
  const [rubricFile, setRubricFile] = useState<LoadedFile | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<UploadedFileItem[]>([]);

  // Drag & drop & parsing state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsingDocx, setIsParsingDocx] = useState(false);

  const skknInputRef = useRef<HTMLInputElement>(null);
  const rubricInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  // File processing helper
  const processFile = async (file: File): Promise<{ textContent: string; dataBase64?: string }> => {
    let textContent = '';
    let dataBase64 = '';

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      textContent = await file.text();
    } else if (file.name.endsWith('.docx')) {
      setIsParsingDocx(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        dataBase64 = base64;
        const resp = await fetch('/api/parse-docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data: base64 })
        });
        const result = await resp.json();
        if (result.text) {
          textContent = result.text;
        }
      } catch (err) {
        console.error('Lỗi phân tích docx:', err);
      } finally {
        setIsParsingDocx(false);
      }
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      dataBase64 = base64;
      textContent = `[Tài liệu đính kèm: ${file.name}]`;
    }

    return { textContent, dataBase64 };
  };

  // SKKN Handlers
  const handleSelectSkkn = async (file: File) => {
    const { textContent, dataBase64 } = await processFile(file);
    setSkknFile({
      file,
      name: file.name,
      size: file.size,
      textContent,
      dataBase64
    });
    setActiveMode('file');
    setPastedText('');
    setIsPasteExpanded(false);

    if (!skknTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setSkknTitle(cleanName);
    }
  };

  const handlePasteClick = () => {
    if (skknFile) {
      const confirmSwitch = window.confirm('Chuyển sang dùng nội dung dán? File đã tải sẽ được gỡ.');
      if (!confirmSwitch) return;
      setSkknFile(null);
    }
    setActiveMode('paste');
    setIsPasteExpanded(true);
  };

  // Rubric Handlers
  const handleSelectRubric = async (file: File) => {
    const { textContent, dataBase64 } = await processFile(file);
    setRubricFile({
      file,
      name: file.name,
      size: file.size,
      textContent,
      dataBase64
    });
  };

  // Evidence Handlers
  const handleSelectEvidence = async (files: FileList) => {
    const newItems: UploadedFileItem[] = [];
    for (const f of Array.from(files)) {
      const { textContent, dataBase64 } = await processFile(f);
      newItems.push({
        id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: f.name,
        category: 'evidence_doc',
        size: f.size,
        type: f.type || 'document',
        textContent,
        dataBase64,
        uploadedAt: new Date().toLocaleTimeString('vi-VN')
      });
    }
    setEvidenceFiles((prev) => [...prev, ...newItems]);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleSelectSkkn(file);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Validation
  const hasSkknContent = Boolean(
    (activeMode === 'file' && skknFile) ||
    (activeMode === 'paste' && pastedText.trim().length > 20)
  );

  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).filter(Boolean).length : 0;

  // Submit analysis
  const handleStartAnalysis = async () => {
    if (!hasSkknContent) return;

    let finalSkknText = '';
    if (activeMode === 'file' && skknFile) {
      finalSkknText = skknFile.textContent || `[Tài liệu SKKN: ${skknFile.name}]`;
    } else {
      finalSkknText = pastedText;
    }

    const finalRubricText = rubricFile?.textContent || '';
    const metadataNotes = skknTitle ? `Tên SKKN: ${skknTitle}` : '';

    await onAnalyze(finalSkknText, finalRubricText, evidenceFiles, metadataNotes);
  };

  // Determine Mascot State
  const getMascotState = (): MascotState => {
    if (isLoading) return 'analyzing';
    if (isRescoring) return 'rescoring';
    if (analysisError) return 'error';
    if (isAllResolved) return 'all_resolved';
    if (hasExistingAnalysis && isCustomAnalyzed) return 'analysis_done';
    if (hasSkknContent) return 'skkn_loaded';
    return 'idle_no_skkn';
  };

  const currentMascotState = getMascotState();
  const uploadMethod = skknFile ? 'file' : (pastedText && pastedText.trim().length > 20 ? 'paste' : 'file');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 lg:p-7 select-none animate-in fade-in duration-200">
      
      {/* Hidden file inputs */}
      <input
        ref={skknInputRef}
        type="file"
        accept=".docx,.pdf,.doc,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectSkkn(e.target.files[0]);
          }
        }}
      />

      <input
        ref={rubricInputRef}
        type="file"
        accept=".docx,.pdf,.doc,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectRubric(e.target.files[0]);
          }
        }}
      />

      <input
        ref={evidenceInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSelectEvidence(e.target.files);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* BỐ CỤC 2 CỘT: CỘT TRÁI (68%) FORM + CỘT PHẢI (32%) TRỢ LÝ SKKN            */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* ======================================================================= */}
        {/* CỘT TRÁI – 68%: TẠO HỒ SƠ ĐÁNH GIÁ                                      */}
        {/* ======================================================================= */}
        <div id="create-dossier-section" className="w-full lg:w-[68%] space-y-4 scroll-mt-20">
          
          {/* Header gọn 2 dòng */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                TẠO HỒ SƠ ĐÁNH GIÁ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Thêm SKKN cần chấm và phản biện.
              </p>
            </div>

            {onViewDemo && (
              <button
                type="button"
                onClick={onViewDemo}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Xem kết quả mẫu</span>
                <span>→</span>
              </button>
            )}
          </div>

          {/* 2 CARD NẰM NGANG: [ ↑ TẢI FILE SKKN ] & [ ▣ DÁN NỘI DUNG ] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* CARD 1: TẢI FILE SKKN */}
            {!skknFile ? (
              <div
                onClick={() => skknInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`h-[130px] p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : activeMode === 'file'
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/20'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    TẢI FILE SKKN
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kéo thả hoặc chọn file
                  </p>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white border border-slate-200">
                  PDF · DOC · DOCX
                </span>
              </div>
            ) : (
              // CARD 1 SAU KHI CÓ FILE: HIỂN THỊ TÊN FILE + TRẠNG THÁI ĐÃ NHẬN
              <div className="h-[130px] p-3.5 rounded-xl border-2 border-emerald-500/70 bg-emerald-50/25 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ĐÃ NHẬN FILE SKKN
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {formatSize(skknFile.size)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 min-w-0 my-auto">
                  <div className="w-7 h-7 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate" title={skknFile.name}>
                      {skknFile.name}
                    </p>
                    {isParsingDocx && (
                      <p className="text-[10px] text-blue-600 animate-pulse font-medium">
                        Đang đọc nội dung...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 text-xs pt-1 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => skknInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Thay file
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSkknFile(null);
                      setActiveMode('none');
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 font-semibold cursor-pointer ml-1"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}

            {/* CARD 2: DÁN NỘI DUNG */}
            <div
              onClick={handlePasteClick}
              className={`h-[130px] p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                isPasteExpanded || activeMode === 'paste'
                  ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>

              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  DÁN NỘI DUNG
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dán trực tiếp văn bản SKKN
                </p>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-white border border-slate-200">
                Dùng khi không có file
              </span>
            </div>

          </div>

          {/* KHUNG SOẠN THẢO DÁN NỘI DUNG (EXPAND NGAY TRONG CỘT TRÁI) */}
          {isPasteExpanded && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    NỘI DUNG SKKN
                  </span>
                  {wordCount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Đã nhận {wordCount.toLocaleString('vi-VN')} từ
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPasteExpanded(false);
                    if (!pastedText.trim()) setActiveMode('none');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Đóng khung soạn thảo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Dán toàn bộ nội dung SKKN vào đây..."
                className="w-full h-[220px] p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans placeholder:text-slate-400 resize-y"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400">
                  {wordCount > 0
                    ? `Đã nhận nội dung (${wordCount.toLocaleString('vi-VN')} từ)`
                    : 'Chưa có văn bản dán'}
                </span>
                {pastedText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Xóa nội dung
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TÀI LIỆU BỔ SUNG: [ + Phiếu chấm ]   [ + Minh chứng ] */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                TÀI LIỆU BỔ SUNG
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Nút Phiếu chấm */}
                {rubricFile ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="truncate max-w-[140px] font-bold">Phiếu: {rubricFile.name}</span>
                    <button
                      type="button"
                      onClick={() => rubricInputRef.current?.click()}
                      className="text-[10px] text-blue-600 hover:underline ml-1 cursor-pointer"
                    >
                      Thay
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => rubricInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Phiếu chấm</span>
                  </button>
                )}

                {/* Nút Minh chứng */}
                {evidenceFiles.length > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-medium">
                    <span className="font-bold">✓ {evidenceFiles.length} minh chứng</span>
                    <button
                      type="button"
                      onClick={() => evidenceInputRef.current?.click()}
                      className="text-[10px] text-blue-600 hover:underline ml-1 cursor-pointer"
                    >
                      + Thêm
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => evidenceInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Minh chứng</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Không bắt buộc nếu dùng Rubric chuẩn của Bộ/Sở. Minh chứng có thể tải bổ sung.
            </p>
          </div>

          {/* ERROR ALERT (NẾU CÓ LỖI) */}
          {analysisError && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-slate-800 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    Phân tích chưa hoàn tất. Nội dung của Thầy/Cô vẫn được giữ lại.
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Hệ thống đã lưu tài liệu. Thầy/Cô hãy bấm thử lại để tiếp tục.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CTA LỚN: ✨ CHẤM & PHẢN BIỆN → */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!hasSkknContent || isLoading || Boolean(retryState)}
              onClick={handleStartAnalysis}
              className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition-all ${
                hasSkknContent && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>ĐANG PHÂN TÍCH HỒ SƠ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>✨ CHẤM & PHẢN BIỆN →</span>
                </>
              )}
            </button>

            {!hasSkknContent && !isLoading && (
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Hãy thêm SKKN ở trên để kích hoạt chấm & phản biện.
              </p>
            )}
          </div>

        </div>

        {/* ======================================================================= */}
        {/* CỘT PHẢI – 32%: TRỢ LÝ SKKN (MASCOT 3D + SPEECH BUBBLE THEO STATE)      */}
        {/* ======================================================================= */}
        <div className="w-full lg:w-[32%] flex flex-col items-center justify-start bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 lg:p-5 relative">
          
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3 shrink-0">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>TRỢ LÝ SKKN</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Đồng hành chấm & sửa
            </span>
          </div>

          {/* Mascot Component with dynamic state */}
          <div className="w-full flex flex-col items-center justify-start">
            <AssistantMascot
              state={currentMascotState}
              uploadMethod={uploadMethod}
              issuesCount={issuesCount}
              isAllResolved={isAllResolved}
              isRescoring={isRescoring}
              className="w-full"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
