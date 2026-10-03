import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { RedTeamCard, FindingStatus } from '../types';

export interface IssueResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: RedTeamCard | null;
  cards?: RedTeamCard[];
  onSelectCard?: (card: RedTeamCard) => void;
  onUpdateStatus?: (id: string, status: FindingStatus, notes?: string) => void;
  onOpenInspector?: (card: RedTeamCard) => void;
  onGoToSuggestion?: (card: RedTeamCard) => void;
  onNextIssue?: () => void;
  hasNextIssue?: boolean;
  onGoToRescore?: () => void;
}

interface EvidencePiece {
  label: string;
  location?: string;
  text: string;
  highlights?: string[];
}

/**
 * Split evidence into 2 comparison cards if it contains comparison text,
 * otherwise return 1 clean card.
 */
function parseEvidencePieces(quote?: string, locationStr?: string): EvidencePiece[] {
  if (!quote || !quote.trim()) return [];
  const text = quote.trim();

  // Pattern 1: Quotes mentioning two sections e.g. "Mục I: ... Mục II.2: ..."
  const twoSecMatch = text.match(/(?:^|[\s\n])(Mục\s+[IVX0-9.]+[^:]*?):\s*['"“]?([\s\S]*?)['"”]?\s*(?:\.\.\.|\n\n|↔|vs|so với)\s*(?:Mục\s+[IVX0-9.]+[^:]*?):\s*['"“]?([\s\S]*?)['"”]?$/i);
  if (twoSecMatch) {
    const loc1 = twoSecMatch[1].trim();
    const txt1 = twoSecMatch[2].trim();
    const txt2 = twoSecMatch[3].trim();
    const loc2 = locationStr && locationStr.includes('II') ? 'Mục II.2' : 'Vị trí đối chiếu';
    return [
      { label: 'CĂN CỨ 1', location: loc1, text: txt1, highlights: ['85', '85 học sinh', '35%'] },
      { label: 'CĂN CỨ 2', location: loc2, text: txt2, highlights: ['82', '82 học sinh', '85%'] }
    ];
  }

  // Pattern 2: Explicit split by "..." with substantial length on both sides
  const chunks = text.split(/\s*(?:\.\.\.|\n\n|↔)\s*/).filter(c => c.trim().length > 15);
  if (chunks.length === 2) {
    return [
      { label: 'CĂN CỨ 1', location: locationStr?.split('và')[0]?.trim() || 'Đoạn 1', text: chunks[0].trim() },
      { label: 'CĂN CỨ 2', location: locationStr?.split('và')[1]?.trim() || 'Đoạn 2', text: chunks[1].trim() }
    ];
  }

  // Default single card
  return [
    { label: 'CĂN CỨ', location: locationStr || 'Trong văn bản', text }
  ];
}

/**
 * Highlight numerical indicators (e.g. 85 học sinh, 82 học sinh, 35%, 78%) for rapid scanning
 */
function renderHighlightedText(text: string) {
  const parts = text.split(/(\b\d+(?:[.,]\d+)?\s*(?:học sinh|em|%|điểm|lớp)?)/gi);
  return parts.map((part, i) => {
    if (/^\b\d+(?:[.,]\d+)?\s*(?:học sinh|em|%|điểm|lớp)?$/i.test(part.trim())) {
      return (
        <mark key={i} className="bg-amber-200/90 text-amber-950 font-bold px-1.5 py-0.5 rounded shadow-2xs">
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const IssueResolutionModal: React.FC<IssueResolutionModalProps> = ({
  isOpen,
  onClose,
  card,
  cards = [],
  onSelectCard,
  onUpdateStatus,
  onOpenInspector,
  onNextIssue,
  onGoToRescore
}) => {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<'light' | 'academic' | 'deep'>('light');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = useState<any | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab states when switching card
  useEffect(() => {
    setShowFullAnalysis(false);
    setShowSuggestionPanel(false);
    setCopied(false);
    setToastMessage(null);
    setGeneratedSuggestions(null);
  }, [card?.id]);

  if (!isOpen || !card) return null;

  // Calculate current card index and list of cards
  const allCards = cards.length > 0 ? cards : [card];
  const currentIndex = allCards.findIndex(c => c.id === card.id);
  const totalCount = allCards.length;
  const isDone = card.status === 'Đã xử lý';

  // Severity labels & styling
  const severityRaw = (card.impactLevel || '').toLowerCase();
  const isHigh = severityRaw === 'cao' || severityRaw === 'critical';
  const isMed = severityRaw === 'trung bình' || severityRaw === 'warning';

  const severityLabel = isHigh ? 'PHẢI SỬA' : isMed ? 'NÊN SỬA' : 'TỐI ƯU THÊM';
  const severityBadgeClass = isHigh
    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
    : isMed
    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
    : 'bg-slate-700/80 text-slate-300 border border-slate-600';
  const severityDotClass = isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-blue-400';

  // Parse evidence
  const evidencePieces = parseEvidencePieces(card.relatedQuote, card.location);

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0 && onSelectCard) {
      onSelectCard(allCards[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1 && onSelectCard) {
      onSelectCard(allCards[currentIndex + 1]);
    } else if (onNextIssue) {
      onNextIssue();
    }
  };

  // Toggle resolved status
  const handleToggleDone = () => {
    if (!onUpdateStatus) return;
    const newStatus: FindingStatus = isDone ? 'Chưa xử lý' : 'Đã xử lý';
    onUpdateStatus(card.id, newStatus);

    if (!isDone) {
      setToastMessage('✓ Đã đánh dấu xử lý');
      // If there's a next unresolved issue, auto-advance after 550ms
      const nextUnresolved = allCards.find((c, idx) => idx > currentIndex && c.status !== 'Đã xử lý');
      if (nextUnresolved && onSelectCard) {
        setTimeout(() => {
          onSelectCard(nextUnresolved);
          setToastMessage(null);
        }, 550);
      } else {
        setTimeout(() => setToastMessage(null), 2500);
      }
    } else {
      setToastMessage('Đã chuyển về Chưa xử lý');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Fetch AI suggestion if requested
  const handleLoadAiSuggestion = async () => {
    if (generatedSuggestions) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: card.relatedQuote || card.issueDetected,
          problem: card.criticismBasis || card.issueDetected,
          context: card.location || 'Sáng kiến kinh nghiệm',
          targetSection: card.location
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedSuggestions(data);
      }
    } catch (err) {
      console.error('Lỗi sinh gợi ý:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Get active suggestion text
  const getActiveSuggestionText = () => {
    if (generatedSuggestions) {
      if (suggestionTab === 'light') return generatedSuggestions.lightRevision || generatedSuggestions.academicRevision;
      if (suggestionTab === 'academic') return generatedSuggestions.academicRevision || generatedSuggestions.lightRevision;
      if (suggestionTab === 'deep') return generatedSuggestions.deepRevision || generatedSuggestions.academicRevision;
    }

    // Default suggestions based on issue context without inventing fake data
    const loc = card.location || 'đoạn văn bản';
    if (suggestionTab === 'light') {
      return `Chỉnh sửa diễn đạt tại ${loc}: Rà soát câu từ, chuẩn hóa các số liệu cho thống nhất xuyên suốt bài viết. Nếu số liệu chưa kiểm chứng đầy đủ, ghi chú rõ: "[Xác minh lại cỡ mẫu/số liệu thực tế]".`;
    }
    if (suggestionTab === 'academic') {
      return `Bổ sung cơ sở sư phạm và phương pháp luận tại ${loc}: Nêu rõ mục tiêu nghiên cứu, tiêu chí khảo sát và phạm vi đối tượng thực tế. Đối chiếu số liệu trước và sau tác động với bảng tổng hợp minh chứng gốc.`;
    }
    return `Tái cấu trúc lại ${loc}: Tách biệt rõ thực trạng ban đầu và kết quả thực nghiệm. Bổ sung biểu mẫu khảo sát hoặc sản phẩm học tập tại Phụ lục để bảo vệ trọn vẹn điểm trước Hội đồng chấm sáng kiến.`;
  };

  const handleCopySuggestion = () => {
    const text = getActiveSuggestionText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split recommendations into clean numbered steps
  const recommendationSteps = (() => {
    const raw = card.resolutionGuidance || '';
    if (!raw.trim()) return ['Rà soát và bổ sung minh chứng liên quan.'];
    const parts = raw
      .split(/(?:^|\n|\.\s+|\;\s+)(?=[0-9]+\.\s+|-\s+|•\s+|Bước\s+[0-9]+:)/i)
      .map(p => p.replace(/^[0-9]+[\.\)]\s*|^-\s*|^•\s*/, '').trim())
      .filter(p => p.length > 5);

    if (parts.length >= 2) return parts;
    // Split by sentence if single long paragraph
    const sentences = raw.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length >= 2) return sentences.slice(0, 4);
    return [raw];
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none flex items-center justify-center p-3 sm:p-4 md:p-6">
      
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Centered Modal Window */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col w-full max-w-[900px] max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10"
        role="dialog"
        aria-modal="true"
      >
        
        {/* ========================================================================= */}
        {/* 5. HEADER MODAL (CỐ ĐỊNH, RẤT GỌN) */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-3">
          
          {/* Left: ● Severity + Category/Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold shrink-0 flex items-center gap-1.5 ${severityBadgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${severityDotClass} inline-block`} />
              <span>{severityLabel}</span>
            </span>

            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              {card.issueType || 'Phản biện học thuật'}
            </span>

            {isDone && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                ✓ ĐÃ XỬ LÝ
              </span>
            )}
          </div>

          {/* Right: Progress 1 / 5 + Close Button */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">
              {currentIndex >= 0 ? currentIndex + 1 : 1} / {totalCount}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. NỘI DUNG MODAL (CUỘN ĐƯỢC Ở GIỮA, 3 KHU VỰC RÕ RÀNG) */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800 text-xs scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Toast feedback nhỏ khi bấm Đã xử lý */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{toastMessage}</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-normal">
                {currentIndex < totalCount - 1 ? 'Đang chuyển vấn đề tiếp...' : ''}
              </span>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* KHU VỰC A — AI PHÁT HIỆN GÌ? */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                AI PHÁT HIỆN GÌ?
              </span>
              {onOpenInspector && (
                <button
                  type="button"
                  onClick={() => onOpenInspector(card)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem trong SKKN →</span>
                </button>
              )}
            </div>

            {/* Vấn đề nổi bật nhất */}
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
              {card.issueDetected}
            </h2>

            {/* Vị trí ngay bên dưới */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="font-bold text-slate-800">Vị trí:</span>
              <span>{card.location || 'Toàn văn sáng kiến'}</span>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* KHU VỰC B — CĂN CỨ (EVIDENCE SO SÁNH / ĐỐI CHIẾU) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                CĂN CỨ ĐỐI CHIẾU
              </span>
              <span className="text-[11px] text-slate-400 italic">
                (Trích xuất nguyên văn từ nội dung SKKN)
              </span>
            </div>

            {evidencePieces.length === 2 ? (
              // So sánh 2 Căn cứ cạnh nhau trên Desktop, dọc trên Mobile
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                
                {/* Căn cứ 1 */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1.5 border-b border-slate-100">
                      <span className="text-blue-700">{evidencePieces[0].label}</span>
                      <span className="text-slate-400 font-normal">{evidencePieces[0].location}</span>
                    </div>
                    <p className="pt-2 text-xs text-slate-800 italic leading-relaxed">
                      “{renderHighlightedText(evidencePieces[0].text)}”
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-semibold uppercase">
                    Căn cứ khảo sát ban đầu
                  </div>
                </div>

                {/* Căn cứ 2 */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1.5 border-b border-slate-100">
                      <span className="text-rose-700">{evidencePieces[1].label}</span>
                      <span className="text-slate-400 font-normal">{evidencePieces[1].location}</span>
                    </div>
                    <p className="pt-2 text-xs text-slate-800 italic leading-relaxed">
                      “{renderHighlightedText(evidencePieces[1].text)}”
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-semibold uppercase">
                    Căn cứ thực nghiệm đối chiếu
                  </div>
                </div>

              </div>
            ) : (
              // 1 Căn cứ duy nhất
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1.5 border-b border-slate-100">
                  <span className="text-blue-700">ĐOẠN TRÍCH DẪN</span>
                  <span className="text-slate-400 font-normal">{card.location}</span>
                </div>
                <p className="text-xs text-slate-800 italic leading-relaxed">
                  “{card.relatedQuote ? renderHighlightedText(card.relatedQuote) : card.issueDetected}”
                </p>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* KHU VỰC C — TẠI SAO CẦN XỬ LÝ? */}
          {/* ----------------------------------------------------------------------- */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>VÌ SAO CẦN XỬ LÝ?</span>
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed pt-0.5">
              {card.whyItMatters || card.criticismBasis}
            </p>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* KHU VỰC D — NÊN LÀM GÌ? */}
          {/* ----------------------------------------------------------------------- */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-blue-700" />
              <span>NÊN LÀM GÌ?</span>
            </span>

            <div className="space-y-1.5 pt-0.5">
              {recommendationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 11. KHU VỰC E — GỢI Ý CHỈNH SỬA (INLINE TRONG MODAL, 3 TABS NHỎ) */}
          {/* ----------------------------------------------------------------------- */}
          {showSuggestionPanel && (
            <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    GỢI Ý CHỈNH SỬA
                  </span>
                </div>

                {/* 3 Tabs: Sửa nhẹ / Sửa học thuật / Sửa sâu */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSuggestionTab('light')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      suggestionTab === 'light' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sửa nhẹ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionTab('academic')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      suggestionTab === 'academic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sửa học thuật
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionTab('deep')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      suggestionTab === 'deep' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sửa sâu
                  </button>
                </div>
              </div>

              {/* Suggestion Text Content */}
              <div className="p-3.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-sans">
                {getActiveSuggestionText()}
              </div>

              {/* Action Buttons: Sao chép & AI Reload */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-400 italic">
                  * Không tự tạo số liệu giả. Hãy điền số liệu thực tế tại các phần [xác minh].
                </span>

                <div className="flex items-center gap-2">
                  {!generatedSuggestions && (
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={handleLoadAiSuggestion}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAi ? 'Đang tạo...' : 'Tạo thêm gợi ý AI'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopySuggestion}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>ĐÃ SAO CHÉP</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>SAO CHÉP ĐOẠN SỬA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 9. ẨN THÔNG TIN HỌC THUẬT PHỤ (ACCORDION) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>Xem phân tích chi tiết</span>
                {showFullAnalysis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Rubric, điểm trừ ước tính, câu hỏi hội đồng)
              </span>
            </button>

            {showFullAnalysis && (
              <div className="mt-2.5 p-4 bg-slate-50 rounded-xl space-y-2.5 text-xs text-slate-700 border border-slate-200 animate-in fade-in duration-150">
                {card.affectedCriterion && (
                  <div>
                    <span className="font-bold text-slate-900">Tiêu chí ảnh hưởng:</span> {card.affectedCriterion}
                  </div>
                )}
                {card.rubricImpactPoints && (
                  <div>
                    <span className="font-bold text-slate-900">Điểm trừ ước tính:</span> {card.rubricImpactPoints}
                  </div>
                )}
                {card.requiredEvidence && (
                  <div>
                    <span className="font-bold text-slate-900">Minh chứng cần chuẩn bị:</span> {card.requiredEvidence}
                  </div>
                )}
                {card.likelyCouncilQuestion && (
                  <div>
                    <span className="font-bold text-slate-900">Hội đồng có thể hỏi:</span> {card.likelyCouncilQuestion}
                  </div>
                )}
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="font-bold">Mã vấn đề:</span> {card.id}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 10. FOOTER MODAL (CỐ ĐỊNH, DỄ DÀNG PREV / NEXT / GỢI Ý / ĐÃ XỬ LÝ) */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          
          {/* Bên trái: ← Vấn đề trước */}
          <div>
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={handlePrevious}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                currentIndex <= 0
                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 active:bg-slate-300'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Vấn đề trước</span>
            </button>
          </div>

          {/* Bên phải: [GỢI Ý SỬA] + [ĐÃ XỬ LÝ ✓] + [VẤN ĐỀ TIẾP →] */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
            
            {/* 11. Gợi ý sửa button */}
            <button
              type="button"
              onClick={() => {
                setShowSuggestionPanel(!showSuggestionPanel);
                if (!showSuggestionPanel) {
                  handleLoadAiSuggestion();
                }
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                showSuggestionPanel
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>GỢI Ý SỬA</span>
            </button>

            {/* 13 & 14. Đã xử lý / Đánh dấu chưa xử lý button */}
            {onUpdateStatus && (
              <button
                type="button"
                onClick={handleToggleDone}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isDone
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
                }`}
              >
                {isDone ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ĐÁNH DẤU CHƯA XỬ LÝ</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                    <span>ĐÃ XỬ LÝ ✓</span>
                  </>
                )}
              </button>
            )}

            {/* Vấn đề tiếp theo */}
            {currentIndex < totalCount - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>VẤN ĐỀ TIẾP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : onGoToRescore ? (
              <button
                type="button"
                onClick={() => {
                  onGoToRescore();
                  onClose();
                }}
                className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>CHẤM LẠI</span>
              </button>
            ) : null}

          </div>

        </div>

      </div>
    </div>
  );
};
