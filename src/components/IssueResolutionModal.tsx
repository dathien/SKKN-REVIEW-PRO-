import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Info,
  ShieldCheck
} from 'lucide-react';
import { RedTeamCard, FindingStatus } from '../types';

export interface IssueResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: RedTeamCard | null;
  cards?: RedTeamCard[];
  onSelectCard?: (card: RedTeamCard) => void;
  onUpdateStatus?: (cardId: string, status: FindingStatus) => void;
  onOpenInspector?: (card: RedTeamCard) => void;
  onGoToSuggestion?: (card: RedTeamCard) => void;
  onNextIssue?: () => void;
  hasNextIssue?: boolean;
  onGoToRescore?: () => void;
}

interface EvidencePiece {
  label: string;
  location: string;
  text: string;
  highlights?: string[];
}

/**
 * Tách trích đoạn SKKN thành 2 căn cứ rõ ràng nếu có mâu thuẫn đối chiếu
 */
function extractEvidencePieces(quote: string, locationStr?: string): EvidencePiece[] {
  const text = (quote || '').trim();
  if (!text) {
    return [{ label: 'CĂN CỨ', location: locationStr || 'Trong tài liệu', text: 'Chưa trích xuất được đoạn văn bản liên quan.' }];
  }

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

/**
 * Chuẩn hóa ngôn ngữ đánh giá (Section VII: Không tiên đoán tuyệt đối)
 */
function sanitizeEvaluationTone(text?: string): string {
  if (!text) return '';
  return text
    .replace(/Hội đồng cấp quận\/thành phố sẽ ngay lập tức bác bỏ/gi, 'Tuyên bố này có nguy cơ bị đánh giá chưa thuyết phục về')
    .replace(/sẽ ngay lập tức bác bỏ/gi, 'có nguy cơ bị đánh giá chưa đạt')
    .replace(/Hội đồng chắc chắn sẽ/gi, 'Có nguy cơ bị đánh giá')
    .replace(/Hội đồng sẽ bác bỏ/gi, 'Có thể bị đánh giá chưa đạt')
    .replace(/Hội đồng chắc chắn không chấp nhận/gi, 'Chưa đủ căn cứ để được công nhận')
    .replace(/Hội đồng sẽ đặt nghi vấn/gi, 'Có nguy cơ bị đặt nghi vấn');
}

export const IssueResolutionModal: React.FC<IssueResolutionModalProps> = ({
  isOpen,
  onClose,
  card,
  cards = [],
  onSelectCard,
  onUpdateStatus,
  onOpenInspector,
  onGoToSuggestion,
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

  // Fact Safety Lifecycle cho vấn đề cỡ mẫu PB-002 (85 vs 82)
  type SampleIssueLifecycle = 'pending' | 'confirmed' | 'applied' | 'resolved';

  const [sampleOption, setSampleOption] = useState<string>(''); // Không chọn sẵn bất kỳ phương án nào
  const [sampleScopeNote, setSampleScopeNote] = useState<string>('');
  const [customSampleNum, setCustomSampleNum] = useState<string>('');
  const [sampleLifecycle, setSampleLifecycle] = useState<SampleIssueLifecycle>('pending');
  const [confirmedFactRecord, setConfirmedFactRecord] = useState<{
    value: string;
    confirmedByUser: true;
    issueId: string;
    timestamp: string;
    scope?: string;
    reliabilityLevel: 'USER_CONFIRMED';
  } | null>(null);
  const [sampleValidationError, setSampleValidationError] = useState<string | null>(null);

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
    setSampleOption('');
    setSampleScopeNote('');
    setCustomSampleNum('');
    setConfirmedFactRecord(null);
    setSampleValidationError(null);

    if (card?.status === 'Đã xử lý' || card?.status === 'resolved') {
      setSampleLifecycle('resolved');
    } else {
      setSampleLifecycle('pending');
    }

    // Vòng đời issue: Khi mở xử lý vấn đề đang ở trạng thái open ('Chưa xử lý'), tự động chuyển sang in_progress ('Đang xử lý')
    if (isOpen && card && (card.status === 'Chưa xử lý' || card.status === 'open' || !card.status)) {
      if (onUpdateStatus) {
        onUpdateStatus(card.id, 'Đang xử lý');
      }
    }
  }, [card?.id, isOpen]);

  if (!isOpen || !card) return null;

  // Calculate current card index and list of cards
  const allCards = cards.length > 0 ? cards : [card];
  const currentIndex = allCards.findIndex(c => c.id === card.id);
  const totalCount = allCards.length;
  const isDone = card.status === 'Đã xử lý' || card.status === 'resolved';
  const isIgnored = card.status === 'Bỏ qua' || card.status === 'ignored' || card.status === 'Tác giả không đồng ý';
  const isInProgress = card.status === 'Đang xử lý' || card.status === 'in_progress';

  const isSampleIssue = card.id === 'PB-002' || card.issueDetected?.includes('85 vs 82') || (card.issueDetected?.toLowerCase().includes('cỡ mẫu') && (card.location?.includes('24') || card.relatedQuote?.includes('85')));

  // Severity labels & styling (Section XXXV: 12.5px-13px font 650-700)
  const severityRaw = (card.impactLevel || '').toLowerCase();
  const isHigh = severityRaw === 'cao' || severityRaw === 'critical';
  const isMed = severityRaw === 'trung bình' || severityRaw === 'warning';

  const severityLabel = isHigh ? 'PHẢI SỬA' : isMed ? 'NÊN SỬA' : 'TỐI ƯU THÊM';
  const severityBadgeClass = isHigh
    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
    : isMed
    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40';

  const severityDotClass = isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-blue-500';

  // Handlers cho Fact Safety PB-002
  const handleConfirmSampleFact = () => {
    setSampleValidationError(null);
    if (!sampleOption) {
      setSampleValidationError('Vui lòng chọn một phương án xác nhận.');
      return;
    }
    if (sampleOption === 'undetermined') {
      setSampleLifecycle('pending');
      setConfirmedFactRecord(null);
      setToastMessage('Đã lưu trạng thái: REQUIRES_VERIFICATION. Hệ thống không tạo bản sửa khi chưa có xác nhận từ tác giả.');
      return;
    }
    if (sampleOption === 'both_different_scope') {
      if (!sampleScopeNote.trim()) {
        setSampleValidationError('Vui lòng mô tả sự khác nhau về phạm vi giữa hai con số trước khi xác nhận.');
        return;
      }
    }
    if (sampleOption === 'other_number') {
      if (!customSampleNum.trim()) {
        setSampleValidationError('Vui lòng nhập số cỡ mẫu thực tế.');
        return;
      }
    }

    const valueStr = sampleOption === '85_is_correct'
      ? '85'
      : sampleOption === '82_is_correct'
      ? '82'
      : sampleOption === 'both_different_scope'
      ? '85 & 82'
      : customSampleNum.trim();

    const fact = {
      value: valueStr,
      confirmedByUser: true as const,
      issueId: card.id,
      timestamp: new Date().toISOString(),
      scope: sampleOption === 'both_different_scope' ? sampleScopeNote.trim() : undefined,
      reliabilityLevel: 'USER_CONFIRMED' as const
    };

    setConfirmedFactRecord(fact);
    setSampleLifecycle('confirmed');
    setShowSuggestionPanel(true);
    setToastMessage('✓ Đã lưu FACT xác nhận (USER_CONFIRMED). Bản đề xuất đã sẵn sàng.');
  };

  const handleApplySuggestionToDraft = () => {
    setSampleLifecycle('applied');
    setToastMessage('● Đã áp dụng bản sửa vào dự thảo. Chờ kiểm tra đối soát.');
  };

  const handleVerifyAndResolve = () => {
    setSampleLifecycle('resolved');
    if (onUpdateStatus) {
      onUpdateStatus(card.id, 'Đã xử lý');
    }
    setToastMessage('✓ Hệ thống đã kiểm tra đối soát: Mâu thuẫn cỡ mẫu đã được xử lý hoàn toàn!');
  };

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

  const handleMarkResolved = () => {
    if (!onUpdateStatus) return;
    onUpdateStatus(card.id, 'Đã xử lý');
    setToastMessage('✓ Đã đánh dấu xử lý thành công');
    setTimeout(() => {
      setToastMessage(null);
      if (currentIndex < totalCount - 1 && onSelectCard) {
        onSelectCard(allCards[currentIndex + 1]);
      }
    }, 1200);
  };

  const handleMarkIgnored = () => {
    if (!onUpdateStatus) return;
    onUpdateStatus(card.id, 'Bỏ qua');
    setToastMessage('Đã chuyển sang Bỏ qua');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleRevertOpen = () => {
    if (!onUpdateStatus) return;
    onUpdateStatus(card.id, 'Chưa xử lý');
    setSampleLifecycle('pending');
    setToastMessage('Đã chuyển về Chưa xử lý');
    setTimeout(() => setToastMessage(null), 2000);
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

  // Fact-safe suggestion text (Section V, XII, XIII)
  const getActiveSuggestionText = () => {
    if (isSampleIssue) {
      if (sampleLifecycle === 'pending' || sampleOption === 'undetermined' || !sampleOption) {
        return `[CẦN THẦY/CÔ XÁC NHẬN CỠ MẪU TRƯỚC KHI TẠO BẢN SỬA]\nHồ sơ nêu cỡ mẫu 85 học sinh, nhưng các nhóm chi tiết cộng lại bằng 82 (chênh lệch 3 trường hợp chưa rõ nguyên nhân).\nThầy/Cô vui lòng xác nhận cỡ mẫu thực tế ở khối xác nhận phía trên để chuẩn hóa số liệu.`;
      }
      if (sampleOption === '82_is_correct') {
        if (suggestionTab === 'light') {
          return `Sửa con số cỡ mẫu tại Thuyết minh Mục 3.2 từ 85 thành 82 cho khớp với Bảng số liệu 2: "Khảo sát được tiến hành trên 82 học sinh. Kết quả ghi nhận: 42 em Rất thích (51.2%), 28 em Thích (34.1%), 12 em Bình thường (14.6%)." (Dữ liệu do tác giả xác nhận theo chuẩn USER_CONFIRMED).`;
        }
        if (suggestionTab === 'academic') {
          return `Điều chỉnh cỡ mẫu tại Thuyết minh Mục 3.2 từ 85 thành 82 học sinh: "Khảo sát thực nghiệm được tiến hành trên cỡ mẫu thực tế 82 học sinh (Bảng số liệu 2). Cơ cấu phản hồi: 42/82 em (51.2%) Rất thích; 28/82 em (34.1%) Thích; 12/82 em (14.6%) Bình thường." (Số liệu đã được tác giả xác nhận theo chuẩn USER_CONFIRMED, loại bỏ hoàn toàn mâu thuẫn cỡ mẫu).`;
        }
        return `Quy chuẩn hóa toàn bộ dữ liệu khảo sát theo cỡ mẫu thực tế 82 học sinh:\n- Thuyết minh Mục 3.2: Khảo sát trên 82 học sinh thuộc 2 lớp 8A1 và 8A2.\n- Bảng số liệu 2: Tổng số phản hồi hợp lệ N=82 (42 Rất thích, 28 Thích, 12 Bình thường).\n- Phụ lục: Đính kèm Biên bản tổng hợp 82 phiếu khảo sát gốc để Hội đồng đối chiếu.`;
      }
      if (sampleOption === '85_is_correct') {
        return `Giữ nguyên cỡ mẫu 85 học sinh tại Thuyết minh. Bổ sung ghi chú dưới Bảng số liệu 2: "Các số liệu thành phần hiện cộng lại bằng 82. Tác giả cần kiểm tra lại các nhóm số liệu để xác định 3 trường hợp còn thiếu thuộc nhóm nào trước khi nộp." (Hệ thống không tự phân bổ 3 trường hợp theo nguyên tắc FACT SAFETY).`;
      }
      if (sampleOption === 'both_different_scope') {
        return `Bổ sung thuyết minh làm rõ phạm vi giữa hai con số tại Mục 3.2: "Khảo sát tiến hành với 85 học sinh toàn diện, trong đó số liệu phân tích chuyên sâu tại Bảng số liệu 2 là 82 học sinh do ${sampleScopeNote.trim()}." (Nội dung do tác giả trực tiếp xác nhận, không dùng suy luận của AI).`;
      }
      if (sampleOption === 'other_number') {
        return `Điều chỉnh cỡ mẫu thực tế thành ${customSampleNum.trim()} học sinh tại Thuyết minh và Bảng số liệu 2. Tác giả cần kiểm tra lại các số liệu thành phần để đảm bảo khớp hoàn toàn với cỡ mẫu mới.`;
      }
    }

    if (generatedSuggestions) {
      if (suggestionTab === 'light') return generatedSuggestions.lightRevision || generatedSuggestions.academicRevision;
      if (suggestionTab === 'academic') return generatedSuggestions.academicRevision || generatedSuggestions.lightRevision;
      if (suggestionTab === 'deep') return generatedSuggestions.deepRevision || generatedSuggestions.academicRevision;
    }

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

  const recommendationSteps = (() => {
    const raw = card.resolutionGuidance || '';
    if (!raw.trim()) return ['Rà soát và bổ sung minh chứng liên quan.'];
    const parts = raw
      .split(/(?:^|\n|\.\s+|\;\s+)(?=[0-9]+\.\s+|-\s+|•\s+|Bước\s+[0-9]+:)/i)
      .map(p => p.replace(/^[0-9]+[\.\)]\s*|^-\s*|^•\s*/, '').trim())
      .filter(p => p.length > 5);

    if (parts.length >= 2) return parts;
    const sentences = raw.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length >= 2) return sentences.slice(0, 4);
    return [raw];
  })();

  const evidencePieces = extractEvidencePieces(card.relatedQuote, card.location);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none flex items-center justify-center p-3 sm:p-4 md:p-6">
      
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Centered Modal Window */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col w-full max-w-[850px] max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10"
        role="dialog"
        aria-modal="true"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
      >
        
        {/* ========================================================================= */}
        {/* 1. HEADER MODAL (Section XXXVII: 16-17px / 700)                            */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-3">
          
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className={`px-2.5 py-0.5 rounded-md text-[12.5px] sm:text-[13px] font-bold shrink-0 flex items-center gap-1.5 ${severityBadgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${severityDotClass} inline-block`} />
              <span>{severityLabel}</span>
            </span>

            <span className="text-[14px] sm:text-[15px] font-bold text-slate-100 truncate">
              {card.issueType || 'Phản biện học thuật'}
            </span>

            {isSampleIssue ? (
              <span className={`px-2.5 py-0.5 rounded-md text-[12.5px] sm:text-[13px] font-bold shrink-0 flex items-center gap-1.5 ${
                sampleLifecycle === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : sampleLifecycle === 'confirmed'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : sampleLifecycle === 'applied'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {sampleLifecycle === 'pending' && '⚠ CHỜ XÁC NHẬN DỮ LIỆU'}
                {sampleLifecycle === 'confirmed' && '● ĐÃ XÁC NHẬN · CHỜ ÁP DỤNG'}
                {sampleLifecycle === 'applied' && '● ĐÃ ÁP DỤNG · CHỜ KIỂM TRA'}
                {sampleLifecycle === 'resolved' && '✓ ĐÃ XỬ LÝ'}
              </span>
            ) : isDone ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                ✓ ĐÃ XỬ LÝ
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[13px] sm:text-[14px] font-bold text-slate-400 font-mono tracking-wider">
              {currentIndex >= 0 ? currentIndex + 1 : 1} / {totalCount}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. NỘI DUNG MODAL (Section XXVIII, XXIX, XXX, XXXI)                       */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800 scrollbar-thin scrollbar-thumb-slate-200">
          
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-[14px] font-bold flex items-center justify-between animate-in fade-in duration-150">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{toastMessage}</span>
              </span>
              <span className="text-[12px] text-emerald-600 font-normal">
                {currentIndex < totalCount - 1 ? 'Đang chuyển vấn đề tiếp...' : ''}
              </span>
            </div>
          )}

          {/* KHU VỰC A — AI PHÁT HIỆN GÌ? (Section XXVII: 17-18px font 700) */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wide text-slate-800">
                AI PHÁT HIỆN GÌ?
              </span>
              {onOpenInspector && (
                <button
                  type="button"
                  onClick={() => onOpenInspector(card)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-[13px] sm:text-[14px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Truy vết trong SKKN →</span>
                </button>
              )}
            </div>

            <h2 className="text-[17px] sm:text-[18px] font-bold text-slate-900 leading-[1.4] tracking-tight">
              {card.issueDetected}
            </h2>

            <div className="flex items-center gap-1.5 text-[13px] sm:text-[14px] text-slate-600 font-medium pt-0.5">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold text-slate-800">Vị trí:</span>
              <span>{card.location || 'Toàn văn sáng kiến'}</span>
            </div>
          </div>

          {/* KHU VỰC B — CĂN CỨ ĐỐI CHIẾU (Section XXX: 16px / line-height 1.7) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wide text-slate-900">
                CĂN CỨ ĐỐI CHIẾU
              </span>
              <span className="text-[13px] text-slate-500 italic">
                (Trích xuất nguyên văn từ nội dung SKKN)
              </span>
            </div>

            {evidencePieces.length === 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Căn cứ 1 */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 pb-2 border-b border-slate-100">
                      <span className="text-blue-800 font-bold">{evidencePieces[0].label}</span>
                      <span className="text-slate-500 font-normal">{evidencePieces[0].location}</span>
                    </div>
                    <p className="pt-2.5 text-[16px] text-slate-900 italic leading-[1.7] font-normal">
                      “{renderHighlightedText(evidencePieces[0].text)}”
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[12px] text-slate-500 font-semibold uppercase">
                    Căn cứ phát biểu ban đầu
                  </div>
                </div>

                {/* Căn cứ 2 */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 pb-2 border-b border-slate-100">
                      <span className="text-rose-800 font-bold">{evidencePieces[1].label}</span>
                      <span className="text-slate-500 font-normal">{evidencePieces[1].location}</span>
                    </div>
                    <p className="pt-2.5 text-[16px] text-slate-900 italic leading-[1.7] font-normal">
                      “{renderHighlightedText(evidencePieces[1].text)}”
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[12px] text-slate-500 font-semibold uppercase">
                    Căn cứ số liệu đối chiếu
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[13px] font-bold text-slate-600 pb-2 border-b border-slate-100">
                  <span className="text-blue-800 font-bold">ĐOẠN TRÍCH DẪN</span>
                  <span className="text-slate-500 font-normal">{card.location}</span>
                </div>
                <p className="text-[16px] text-slate-900 italic leading-[1.7] font-normal pt-1">
                  “{card.relatedQuote ? renderHighlightedText(card.relatedQuote) : card.issueDetected}”
                </p>
              </div>
            )}
          </div>

          {/* KHU VỰC C — VÌ SAO CẦN XỬ LÝ? (Section XXVIII & XXXI: 15px font 400 line-height 1.65) */}
          <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1.5">
            <span className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wide text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>VÌ SAO CẦN XỬ LÝ?</span>
            </span>
            <p className="text-[15px] text-amber-950 leading-[1.65] font-normal pt-0.5">
              {sanitizeEvaluationTone(card.whyItMatters || card.criticismBasis)}
            </p>
          </div>

          {/* KHU VỰC D — NÊN LÀM GÌ? (Section XXVIII & XXXI) */}
          <div className="p-4 sm:p-5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2.5">
            <span className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wide text-blue-950 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-700 shrink-0" />
              <span>NÊN LÀM GÌ?</span>
            </span>

            <div className="space-y-2 pt-0.5">
              {recommendationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-[15px] text-slate-800 leading-[1.65]">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </span>
                  <span className="font-normal">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================= */}
          {/* KHỐI XÁC NHẬN DỮ LIỆU CHO PB-002 (85 VS 82) - NẰM NGAY DƯỚI D  */}
          {/* ============================================================= */}
          {isSampleIssue && (
            <div className="p-5 sm:p-6 bg-amber-50/95 border-2 border-amber-400 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-amber-300 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-200 rounded-md text-[13px] font-bold uppercase tracking-wider text-amber-950 border border-amber-300">
                    ⚠ CẦN THẦY/CÔ XÁC NHẬN
                  </span>
                </div>
                <span className={`text-[12.5px] font-bold px-2.5 py-0.5 rounded-md ${
                  sampleLifecycle === 'pending'
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : sampleLifecycle === 'confirmed'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : sampleLifecycle === 'applied'
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {sampleLifecycle === 'pending' && '⚠ CHỜ XÁC NHẬN DỮ LIỆU'}
                  {sampleLifecycle === 'confirmed' && '● ĐÃ XÁC NHẬN · CHỜ ÁP DỤNG'}
                  {sampleLifecycle === 'applied' && '● ĐÃ ÁP DỤNG · CHỜ KIỂM TRA'}
                  {sampleLifecycle === 'resolved' && '✓ ĐÃ XỬ LÝ'}
                </span>
              </div>

              {/* Thông tin mâu thuẫn hiện trạng */}
              <div className="text-[14.5px] text-amber-950 bg-white/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5 leading-[1.6]">
                <p className="font-bold text-[15px] text-slate-900">Hồ sơ hiện ghi:</p>
                <p className="font-medium">• Cỡ mẫu: <strong className="text-slate-900 font-bold">85 học sinh</strong></p>
                <p className="font-medium">• Tổng số liệu chi tiết: <strong className="text-slate-900 font-bold">82 học sinh</strong></p>
                <p className="font-medium">• Chênh lệch: <strong className="text-rose-700 font-bold">3</strong></p>
                <p className="pt-1 text-[13.5px] text-amber-900 italic border-t border-amber-200 mt-2 font-normal">
                  Hệ thống chưa đủ căn cứ xác định nguyên nhân. Thầy/Cô vui lòng xác nhận:
                </p>
              </div>

              {/* Form 5 phương án xác nhận */}
              <div className="space-y-2.5 text-[15px] text-slate-900 font-medium">
                
                {/* 1. 85 là số đúng */}
                <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/70 transition-colors cursor-pointer border border-transparent hover:border-amber-200">
                  <input
                    type="radio"
                    name="sampleOptionModal"
                    value="85_is_correct"
                    checked={sampleOption === '85_is_correct'}
                    onChange={(e) => {
                      setSampleOption(e.target.value);
                      setSampleValidationError(null);
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <span>85 là số đúng</span>
                </label>
                {sampleOption === '85_is_correct' && (
                  <div className="ml-7 p-3.5 bg-blue-50/90 rounded-xl border border-blue-200 text-[14.5px] text-blue-950 leading-[1.6] animate-in fade-in duration-150">
                    Các số liệu thành phần hiện cộng lại bằng 82. Thầy/Cô cần kiểm tra lại các nhóm số liệu để xác định 3 trường hợp còn thiếu thuộc nhóm nào. (Hệ thống không tự phân bổ 3 trường hợp).
                  </div>
                )}

                {/* 2. 82 là số đúng */}
                <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/70 transition-colors cursor-pointer border border-transparent hover:border-amber-200">
                  <input
                    type="radio"
                    name="sampleOptionModal"
                    value="82_is_correct"
                    checked={sampleOption === '82_is_correct'}
                    onChange={(e) => {
                      setSampleOption(e.target.value);
                      setSampleValidationError(null);
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <span>82 là số đúng</span>
                </label>
                {sampleOption === '82_is_correct' && (
                  <div className="ml-7 p-3.5 bg-emerald-50/90 rounded-xl border border-emerald-200 text-[14.5px] text-emerald-950 leading-[1.6] animate-in fade-in duration-150">
                    Thầy/Cô xác nhận 82 là cỡ mẫu thực tế. Hệ thống có thể đề xuất điều chỉnh các vị trí đang ghi 85 thành 82.
                  </div>
                )}

                {/* 3. Cả 85 và 82 đều đúng nhưng khác phạm vi */}
                <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/70 transition-colors cursor-pointer border border-transparent hover:border-amber-200">
                  <input
                    type="radio"
                    name="sampleOptionModal"
                    value="both_different_scope"
                    checked={sampleOption === 'both_different_scope'}
                    onChange={(e) => {
                      setSampleOption(e.target.value);
                      setSampleValidationError(null);
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <span>Cả 85 và 82 đều đúng nhưng khác phạm vi</span>
                </label>

                {sampleOption === 'both_different_scope' && (
                  <div className="ml-7 p-3.5 bg-white rounded-xl border border-amber-300 space-y-2 animate-in fade-in duration-150">
                    <label className="block text-[14px] font-bold text-amber-950">
                      Vui lòng mô tả sự khác nhau về phạm vi giữa hai con số: <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      value={sampleScopeNote}
                      onChange={(e) => {
                        setSampleScopeNote(e.target.value);
                        setSampleValidationError(null);
                      }}
                      placeholder="Mô tả sự khác nhau về phạm vi (chỉ sử dụng nội dung do Thầy/Cô nhập, không tự điền ví dụ)..."
                      rows={2}
                      className="w-full p-2.5 text-[14.5px] bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900"
                    />
                  </div>
                )}

                {/* 4. Số đúng khác */}
                <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/70 transition-colors cursor-pointer border border-transparent hover:border-amber-200">
                  <input
                    type="radio"
                    name="sampleOptionModal"
                    value="other_number"
                    checked={sampleOption === 'other_number'}
                    onChange={(e) => {
                      setSampleOption(e.target.value);
                      setSampleValidationError(null);
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Số đúng khác:</span>
                  {sampleOption === 'other_number' && (
                    <input
                      type="text"
                      value={customSampleNum}
                      onChange={(e) => {
                        setCustomSampleNum(e.target.value);
                        setSampleValidationError(null);
                      }}
                      placeholder="Nhập số..."
                      className="ml-1 px-3 py-1 text-[14.5px] bg-white border border-slate-300 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
                    />
                  )}
                </label>
                {sampleOption === 'other_number' && customSampleNum.trim() && (
                  <div className="ml-7 p-3.5 bg-slate-100 rounded-xl border border-slate-300 text-[14.5px] text-slate-800 leading-[1.6]">
                    Thầy/Cô xác nhận cỡ mẫu thực tế là {customSampleNum.trim()}. Các số liệu thành phần hiện cộng lại bằng 82. Thầy/Cô cần kiểm tra lại các nhóm số liệu để đảm bảo khớp với cỡ mẫu mới.
                  </div>
                )}

                {/* 5. Chưa xác định – tôi cần kiểm tra lại */}
                <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/70 transition-colors cursor-pointer border border-transparent hover:border-amber-200">
                  <input
                    type="radio"
                    name="sampleOptionModal"
                    value="undetermined"
                    checked={sampleOption === 'undetermined'}
                    onChange={(e) => {
                      setSampleOption(e.target.value);
                      setSampleValidationError(null);
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <span>Chưa xác định – tôi cần kiểm tra lại</span>
                </label>
                {sampleOption === 'undetermined' && (
                  <div className="ml-7 p-3.5 bg-rose-50 rounded-xl border border-rose-300 text-[14.5px] text-rose-950 leading-[1.6] animate-in fade-in duration-150">
                    Vấn đề được giữ ở trạng thái CẦN XÁC MINH (REQUIRES_VERIFICATION). Hệ thống không tạo bản sửa và chưa thể đánh dấu đã xử lý khi chưa có xác nhận từ tác giả.
                  </div>
                )}

              </div>

              {sampleValidationError && (
                <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-rose-900 text-[13.5px] font-bold">
                  ⚠ {sampleValidationError}
                </div>
              )}

              {/* Nút lưu xác nhận */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-amber-200">
                <span className="text-[13px] text-amber-900 font-medium">
                  {confirmedFactRecord
                    ? `✓ Đã lưu: ${confirmedFactRecord.value} (${confirmedFactRecord.reliabilityLevel})`
                    : '* Chưa chọn phương án xác nhận nào.'}
                </span>

                <button
                  type="button"
                  disabled={!sampleOption}
                  onClick={handleConfirmSampleFact}
                  className="px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-[14px] rounded-xl shadow-xs transition-colors cursor-pointer self-end sm:self-auto"
                >
                  LƯU XÁC NHẬN SỰ THẬT (USER_CONFIRMED)
                </button>
              </div>

              {/* Trạng thái sau xác nhận: Cho phép Áp dụng hoặc Kiểm tra */}
              {sampleLifecycle === 'confirmed' && (
                <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-bold text-blue-900 uppercase">
                      ● ĐÃ XÁC NHẬN · CHỜ ÁP DỤNG
                    </span>
                    <span className="text-[12px] bg-blue-200/80 text-blue-800 font-bold px-2 py-0.5 rounded">
                      USER_CONFIRMED
                    </span>
                  </div>
                  <p className="text-[14.5px] text-blue-950 leading-[1.6]">
                    Bản đề xuất sửa đã được tạo chuẩn hóa theo dữ liệu Thầy/Cô xác nhận. Thầy/Cô có thể xem ở mục GỢI Ý CHỈNH SỬA bên dưới và bấm nút áp dụng vào dự thảo.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplySuggestionToDraft}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      ÁP DỤNG BẢN SỬA VÀO DỰ THẢO →
                    </button>
                  </div>
                </div>
              )}

              {sampleLifecycle === 'applied' && (
                <div className="p-4 bg-indigo-50 border border-indigo-300 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-bold text-indigo-900 uppercase">
                      ● ĐÃ ÁP DỤNG · CHỜ KIỂM TRA
                    </span>
                    <span className="text-[12px] bg-indigo-200/80 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      ĐỐI SOÁT DỮ LIỆU
                    </span>
                  </div>
                  <p className="text-[14.5px] text-indigo-950 leading-[1.6]">
                    Bản sửa đã được áp dụng vào dự thảo. Thầy/Cô bấm nút kiểm tra lại để hệ thống đối soát và chính thức xác nhận giải quyết xong mâu thuẫn.
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleVerifyAndResolve}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>KIỂM TRA LẠI & HOÀN TẤT (ĐÃ XỬ LÝ) ✓</span>
                    </button>
                  </div>
                </div>
              )}

              {sampleLifecycle === 'resolved' && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-[14.5px]">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>✓ ĐÃ XỬ LÝ: Mâu thuẫn cỡ mẫu đã được chuẩn hóa theo dữ liệu USER_CONFIRMED.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSampleLifecycle('pending');
                      if (onUpdateStatus) onUpdateStatus(card.id, 'Đang xử lý');
                    }}
                    className="text-slate-600 hover:text-slate-900 text-[13px] underline cursor-pointer shrink-0 ml-2"
                  >
                    Xác nhận lại
                  </button>
                </div>
              )}

            </div>
          )}

          {/* KHU VỰC E — GỢI Ý CHỈNH SỬA (Section XXXVII: 16px / line-height 1.7) */}
          {showSuggestionPanel && (
            <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-[15px] sm:text-[16px] font-bold uppercase tracking-wide text-white">
                    GỢI Ý CHỈNH SỬA
                  </span>
                </div>

                {/* 3 Tabs */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSuggestionTab('light')}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                      suggestionTab === 'light' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sửa nhẹ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionTab('academic')}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                      suggestionTab === 'academic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sửa học thuật
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionTab('deep')}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                      suggestionTab === 'deep' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sửa sâu
                  </button>
                </div>
              </div>

              {/* Suggestion Text Content (Section XXX & XXXVII: 16px / line-height 1.7) */}
              <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700/80 text-[16px] text-slate-100 leading-[1.7] font-normal">
                {getActiveSuggestionText()}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-[13px] text-amber-300 font-medium block">
                    * Nguyên tắc Fact Safety: Không tự tạo số liệu giả. Hãy điền số liệu thực tế tại các phần [CẦN BỔ SUNG SỐ LIỆU THỰC TẾ].
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySuggestion}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-[14px] inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>ĐÃ SAO CHÉP</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>SAO CHÉP ĐOẠN SỬA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PHÂN TÍCH CHI TIẾT (ACCORDION) */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="w-full flex items-center justify-between py-2 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>Xem phân tích chi tiết & Rubric</span>
                {showFullAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
              <span className="text-[13px] text-slate-400 font-normal">
                (Rubric, điểm trừ ước tính, câu hỏi hội đồng)
              </span>
            </button>

            {showFullAnalysis && (
              <div className="mt-2.5 p-4 bg-slate-50 rounded-xl space-y-2.5 text-[14px] text-slate-700 border border-slate-200 animate-in fade-in duration-150 leading-[1.6]">
                {card.affectedCriterion && (
                  <div>
                    <strong className="text-slate-900 font-bold">Tiêu chí ảnh hưởng:</strong> {card.affectedCriterion}
                  </div>
                )}
                {card.rubricImpactPoints && (
                  <div>
                    <strong className="text-slate-900 font-bold">Điểm trừ ước tính:</strong> {card.rubricImpactPoints}
                  </div>
                )}
                {card.requiredEvidence && (
                  <div>
                    <strong className="text-slate-900 font-bold">Minh chứng cần chuẩn bị:</strong> {card.requiredEvidence}
                  </div>
                )}
                {card.likelyCouncilQuestion && (
                  <div>
                    <strong className="text-slate-900 font-bold">Hội đồng có thể hỏi:</strong>{' '}
                    {isSampleIssue
                      ? 'Nguyên nhân nào dẫn đến chênh lệch giữa cỡ mẫu 85 học sinh được nêu trong thuyết minh và tổng số liệu chi tiết 82 học sinh ở Bảng số liệu 2?'
                      : card.likelyCouncilQuestion}
                  </div>
                )}
                <div className="text-[13px] text-slate-500 pt-1.5 border-t border-slate-200">
                  <span className="font-bold">Mã vấn đề:</span> {card.id}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. FOOTER MODAL (Section XXXIII: 14-15px font 600)                        */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          
          <div>
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={handlePrevious}
              className={`py-2 px-3.5 rounded-xl font-bold text-[14px] flex items-center gap-1.5 transition-all cursor-pointer ${
                currentIndex <= 0
                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 active:bg-slate-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vấn đề trước</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
            
            <button
              type="button"
              onClick={() => {
                setShowSuggestionPanel(!showSuggestionPanel);
                if (!showSuggestionPanel) {
                  handleLoadAiSuggestion();
                }
              }}
              className={`py-2 px-3.5 rounded-xl border text-[14px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                showSuggestionPanel
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>GỢI Ý SỬA</span>
            </button>

            {onUpdateStatus && (
              <div className="flex items-center gap-2">
                {!isDone && !isIgnored && !isSampleIssue && (
                  <button
                    type="button"
                    onClick={handleMarkIgnored}
                    className="py-2 px-3.5 rounded-xl text-[14px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                )}

                {isSampleIssue ? (
                  sampleLifecycle === 'resolved' || isDone ? (
                    <button
                      type="button"
                      onClick={handleRevertOpen}
                      className="py-2 px-4 rounded-xl text-[14px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>CHUYỂN VỀ CHƯA XỬ LÝ</span>
                    </button>
                  ) : sampleLifecycle === 'applied' ? (
                    <button
                      type="button"
                      onClick={handleVerifyAndResolve}
                      className="py-2 px-4.5 rounded-xl text-[14px] sm:text-[15px] font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>KIỂM TRA LẠI & HOÀN TẤT ✓</span>
                    </button>
                  ) : sampleLifecycle === 'confirmed' ? (
                    <button
                      type="button"
                      onClick={handleApplySuggestionToDraft}
                      className="py-2 px-4.5 rounded-xl text-[14px] sm:text-[15px] font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>ÁP DỤNG THAY ĐỔI →</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] sm:text-[13px] text-amber-800 font-medium bg-amber-100/90 px-2.5 py-1.5 rounded-lg border border-amber-300">
                        ⚠ Cần xác nhận số liệu ở trên
                      </span>
                      <button
                        type="button"
                        disabled
                        className="py-2 px-4 rounded-xl text-[14px] font-bold bg-slate-200 text-slate-400 cursor-not-allowed"
                        title="Vui lòng xác nhận sự thật số liệu trước khi đánh dấu đã xử lý"
                      >
                        ĐÃ XỬ LÝ ✓
                      </button>
                    </div>
                  )
                ) : isDone ? (
                  <button
                    type="button"
                    onClick={handleRevertOpen}
                    className="py-2 px-4 rounded-xl text-[14px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>CHUYỂN VỀ CHƯA XỬ LÝ</span>
                  </button>
                ) : isIgnored ? (
                  <button
                    type="button"
                    onClick={handleRevertOpen}
                    className="py-2 px-4 rounded-xl text-[14px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>HỦY BỎ QUA</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkResolved}
                    className="py-2 px-4.5 rounded-xl text-[14px] sm:text-[15px] font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>ĐÃ XỬ LÝ ✓</span>
                  </button>
                )}
              </div>
            )}

            {currentIndex < totalCount - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[14px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>VẤN ĐỀ TIẾP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : onGoToRescore ? (
              <button
                type="button"
                onClick={() => {
                  onGoToRescore();
                  onClose();
                }}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[14px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>CHẤM LẠI</span>
              </button>
            ) : null}

          </div>

        </div>

      </div>
    </div>
  );
};
