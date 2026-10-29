import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  MapPin,
  FileText,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Sparkles,
  PenTool,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  BookOpen,
  Scale,
  History,
  ShieldCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { RedTeamCard, FindingStatus, SuggestionRewrite, ChangeSetItem, PriorityLevel } from '../../types';
import { resolveCardTeacherNote } from '../../utils/evaluationNotes';

export interface AcademicRebuttalViewProps {
  card: RedTeamCard;
  cards: RedTeamCard[];
  suggestions?: SuggestionRewrite[];
  onSelectCard: (card: RedTeamCard) => void;
  onUpdateStatus: (cardId: string, status: FindingStatus, notes?: string) => void;
  onBack: () => void;
  onGoToSuggestion: (card: RedTeamCard) => void;
  onApplyChange?: (change: ChangeSetItem) => void;
  changeSet?: ChangeSetItem[];
  skknFullText?: string;
  customProposals?: Record<string, { tier?: string; text: string; updatedAt?: string }>;
  teacherNotesMap?: Record<string, string>;
  evaluationId?: string;
  userEmail?: string;
  onSaveCustomProposal?: (cardId: string, tier: 'light' | 'academic' | 'deep', text: string) => Promise<{ success: boolean; error?: string }>;
  onSaveTeacherNotes?: (cardId: string, notes: string) => Promise<{ success: boolean; error?: string }>;
  initialTier?: 'light' | 'academic' | 'deep';
  onTierChange?: (tier: 'light' | 'academic' | 'deep') => void;
}

interface EvidencePiece {
  label: string;
  location: string;
  text: string;
  highlights?: string[];
}

function extractEvidencePieces(quote?: string, locationStr?: string): EvidencePiece[] {
  const text = (quote || '').trim();
  if (!text) {
    return [{ label: 'CĂN CỨ TRÍCH DẪN', location: locationStr || 'Trong tài liệu SKKN', text: 'Chưa có trích đoạn nguyên văn riêng. Vui lòng đối soát theo vị trí mục trong toàn văn SKKN.' }];
  }

  // Two sections match
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

  const chunks = text.split(/\s*(?:\.\.\.|\n\n|↔)\s*/).filter(c => c.trim().length > 15);
  if (chunks.length === 2) {
    return [
      { label: 'CĂN CỨ 1', location: locationStr?.split('và')[0]?.trim() || 'Đoạn 1', text: chunks[0].trim() },
      { label: 'CĂN CỨ 2', location: locationStr?.split('và')[1]?.trim() || 'Đoạn 2', text: chunks[1].trim() }
    ];
  }

  return [
    { label: 'CĂN CỨ NGUYÊN VĂN', location: locationStr || 'Trong văn bản', text }
  ];
}

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

export const AcademicRebuttalView: React.FC<AcademicRebuttalViewProps> = ({
  card,
  cards,
  suggestions = [],
  onSelectCard,
  onUpdateStatus,
  onBack,
  onGoToSuggestion,
  onApplyChange,
  changeSet = [],
  skknFullText = '',
  customProposals = {},
  teacherNotesMap = {},
  evaluationId,
  userEmail,
  onSaveCustomProposal,
  onSaveTeacherNotes,
  initialTier = 'academic',
  onTierChange
}) => {
  const [selectedTier, setSelectedTier] = useState<'light' | 'academic' | 'deep'>(initialTier);
  const [copied, setCopied] = useState(false);

  // Hàm xác định ghi chú giáo viên theo thứ tự ưu tiên chuẩn hóa (tương thích ngược 100% với cả khóa cũ và khóa mới):
  const resolveEffectiveNote = useCallback((targetCardId: string, directUserNotes?: string) => {
    return resolveCardTeacherNote({
      cardId: targetCardId,
      evalId: evaluationId,
      userEmail,
      directUserNotes,
      teacherNotesMap,
    });
  }, [teacherNotesMap, userEmail, evaluationId]);

  const [teacherNotes, setTeacherNotes] = useState(() => resolveEffectiveNote(card.id, card.userNotes));
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customProposedText, setCustomProposedText] = useState('');
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [proposalSaveError, setProposalSaveError] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveError, setNotesSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PB-002 Fact confirmation state
  const isSampleIssue = card.id === 'PB-002' ||
    card.issueDetected?.includes('85 vs 82') ||
    (card.issueDetected?.toLowerCase().includes('cỡ mẫu') && (card.location?.includes('24') || card.relatedQuote?.includes('85')));
  const [sampleChoice, setSampleChoice] = useState<string>('');
  const [sampleScopeDesc, setSampleScopeDesc] = useState<string>('');
  const [customSampleCount, setCustomSampleCount] = useState<string>('');
  const [isSampleConfirmed, setIsSampleConfirmed] = useState(false);

  // Đồng bộ ghi chú và reset trạng thái khi chuyển card hoặc dữ liệu card cập nhật
  useEffect(() => {
    const effectiveNote = resolveEffectiveNote(card.id, card.userNotes);
    setTeacherNotes(effectiveNote);
    setIsEditingCustom(false);
    setProposalSaveError(null);
    setNotesSaveError(null);
    setCopied(false);
    setIsSampleConfirmed(false);
    setSampleChoice('');
    setSampleScopeDesc('');
    setCustomSampleCount('');

    // TUYỆT ĐỐI KHÔNG tự động chuyển trạng thái sang "Đang xử lý" khi mở vấn đề, chuyển trang hay F5.
    // Trạng thái chỉ thay đổi khi giáo viên chủ động bấm 1 trong 4 nút trạng thái.
  }, [card.id, card.userNotes, resolveEffectiveNote]);

  // Current index & pagination
  const allCards = cards.length > 0 ? cards : [card];
  const currentIndex = allCards.findIndex(c => c.id === card.id);
  const totalCards = allCards.length;

  const prevCard = currentIndex > 0 ? allCards[currentIndex - 1] : null;
  const nextCard = currentIndex < totalCards - 1 ? allCards[currentIndex + 1] : null;

  // Find matching suggestion
  const matchingSuggestion: SuggestionRewrite | null = useMemo(() => {
    const directMatch = suggestions.find(s => s.id === card.id || s.id === `sug-${card.id}`);
    if (directMatch) return directMatch;

    const locMatch = suggestions.find(s =>
      s.targetSection && card.location &&
      (s.targetSection.toLowerCase().includes(card.location.toLowerCase()) ||
       card.location.toLowerCase().includes(s.targetSection.toLowerCase()))
    );
    if (locMatch) return locMatch;

    const problemMatch = suggestions.find(s =>
      s.problem && card.issueDetected &&
      (s.problem.toLowerCase().includes(card.issueDetected.slice(0, 20).toLowerCase()) ||
       card.issueDetected.toLowerCase().includes(s.problem.slice(0, 20).toLowerCase()))
    );
    return problemMatch || null;
  }, [suggestions, card]);

  // Fallback rich suggestions if none generated
  const effectiveSuggestion: SuggestionRewrite = useMemo(() => {
    if (matchingSuggestion) return matchingSuggestion;

    const quote = (card.relatedQuote || (card as any).excerpt || '').trim();
    const loc = card.location || 'Vị trí xác định trong SKKN';
    const problem = card.issueDetected || 'Cần chuẩn hóa văn phong và lập luận';

    let light = quote
      ? quote.replace(/tuyệt đối|chắc chắn 100%|ngay lập tức/gi, 'rõ rệt')
      : `Sau quá trình áp dụng giải pháp tại ${loc}, kết quả bước đầu ghi nhận sự chuyển biến tích cực của học sinh [CẦN GIÁO VIÊN ĐIỀN SỐ LIỆU THỰC TẾ].`;
    let academic = quote
      ? `Việc triển khai giải pháp tại ${loc} đã đem lại kết quả cụ thể, góp phần nâng cao tính chủ động và năng lực nhận thức của học sinh theo mục tiêu Chương trình GDPT 2018.`
      : `Thực hiện giải pháp tại ${loc} nhằm đáp ứng chuẩn đầu ra của Chương trình GDPT 2018; các chỉ số đánh giá được đối chiếu thận trọng và khách quan.`;
    let deep = quote
      ? `Nhằm giải quyết mâu thuẫn được chỉ ra tại ${loc}, đề tài thiết lập quy trình thực nghiệm đối chứng có kiểm soát biến số; số liệu chi tiết và phiếu đánh giá được lưu tại Phụ lục [CẦN BỔ SUNG MINH CHỨNG].`
      : `Để bảo đảm tính khoa học tại ${loc}, tiến trình giải pháp được cấu trúc theo 3 bước: khảo sát thực trạng -> can thiệp sư phạm -> đánh giá hiệu quả đối chứng với nhóm học sinh tương đương.`;

    if (isSampleIssue) {
      light = `[CẦN XÁC NHẬN CỠ MẪU] Khảo sát được tiến hành trên ${sampleChoice === '85_is_correct' ? '85' : sampleChoice === '82_is_correct' ? '82' : '[85 hay 82]'} học sinh. Kết quả ghi nhận đại đa số học sinh đều có sự tiến bộ rõ nét.`;
      academic = `Nghiên cứu được triển khai khảo sát trên cỡ mẫu gồm ${sampleChoice === '85_is_correct' ? '85' : sampleChoice === '82_is_correct' ? '82' : '[85 hoặc 82]'} học sinh đồng nhất về đối tượng. Các kết quả thống kê tại Bảng thực trạng và lời văn được đối soát thống nhất 100%.`;
      deep = `Thiết kế khảo sát được chuẩn hóa với cỡ mẫu xác định: ${sampleChoice === '85_is_correct' ? '85' : sampleChoice === '82_is_correct' ? '82' : '[Cỡ mẫu chính xác do GV xác nhận]'} học sinh tham gia đầy đủ cả trước và sau can thiệp. Toàn bộ phiếu điều tra gốc và bảng tổng hợp được lưu chi tiết tại Phụ lục số 1.`;
    }

    return {
      id: `sug-auto-${card.id}`,
      targetSection: loc,
      originalText: quote || `Nội dung tại ${loc}`,
      problem: problem,
      whyRevise: card.whyItMatters || 'Cần khắc phục để tránh bị trừ điểm tiêu chí khoa học & phương pháp.',
      basis: card.criticismBasis || 'Tiêu chuẩn đánh giá SKKN của ngành Giáo dục & Đào tạo.',
      category: card.issueType || 'Phản biện học thuật',
      revisionGoal: 'Chuẩn hóa văn phong, thống nhất số liệu và tăng sức thuyết phục học thuật.',
      howToRevise: card.resolutionGuidance || 'Rà soát câu chữ, bổ sung minh chứng và áp dụng bản viết lại chuẩn mực.',
      lightRevision: light,
      academicRevision: academic,
      deepRevision: deep,
      missingEvidenceAlert: card.requiredEvidence || 'Cần bổ sung minh chứng thực nghiệm kèm theo tại Phụ lục.',
      insertPosition: loc
    };
  }, [matchingSuggestion, card, isSampleIssue, sampleChoice]);

  // Check if this card has an applied change
  const appliedChange = useMemo(() => {
    return changeSet.find(c => c.issueId === card.id || c.changeId === `change-${card.id}` || c.changeId === `change-${effectiveSuggestion.id}`);
  }, [changeSet, card.id, effectiveSuggestion.id]);

  // 1. AI Proposal (base from algorithm)
  const aiProposalText = useMemo(() => {
    if (selectedTier === 'light') return effectiveSuggestion.lightRevision;
    if (selectedTier === 'academic') return effectiveSuggestion.academicRevision;
    return effectiveSuggestion.deepRevision;
  }, [selectedTier, effectiveSuggestion]);

  // 2. Saved Proposal (confirmed saved by teacher, with local backup)
  const savedProposalKey = `${card.id}_${selectedTier}`;
  const localSavedProposal = useMemo(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(`skkn_proposal_${savedProposalKey}`);
        if (item) {
          const parsed = JSON.parse(item);
          return parsed?.text || null;
        }
      }
    } catch (_) {}
    return null;
  }, [savedProposalKey]);
  const savedProposal = customProposals?.[savedProposalKey]?.text || localSavedProposal || (card as any)?.customProposals?.[selectedTier];

  // 3. Displayed Proposal in Box 5 (Saved Proposal > AI Proposal)
  const displayedProposalText = savedProposal || aiProposalText;

  // Evidence pieces
  const evidencePieces = useMemo(() => {
    return extractEvidencePieces(card.relatedQuote || (card as any).excerpt || card.existingEvidence, card.location);
  }, [card.relatedQuote, (card as any).excerpt, card.existingEvidence, card.location]);

  // Priority styles
  const isHigh = card.impactLevel === 'Cao';
  const isMed = card.impactLevel === 'Trung bình';
  const priorityBadge = isHigh
    ? { label: '🔴 PHẢI SỬA', desc: 'Mức độ ưu tiên cao — Ảnh hưởng trực tiếp đến kết quả thẩm định', bg: 'bg-rose-100 text-rose-800 border-rose-300' }
    : isMed
    ? { label: '🟠 NÊN SỬA', desc: 'Mức độ vừa phải — Cần chuẩn hóa để tăng tính thuyết phục học thuật', bg: 'bg-amber-100 text-amber-800 border-amber-300' }
    : { label: '🔵 TỐI ƯU THÊM', desc: 'Mức độ gợi ý — Hoàn thiện văn phong và thẩm mỹ sáng kiến', bg: 'bg-blue-100 text-blue-800 border-blue-300' };

  // Status handlers
  const handleStatusChange = (newStatus: FindingStatus) => {
    onUpdateStatus(card.id, newStatus, teacherNotes);
    setToastMessage(`Đã cập nhật trạng thái: "${newStatus}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesSaveError(null);

    const evalKey = evaluationId || 'default';
    const userEmailKey = (userEmail || 'guest').toLowerCase().trim();
    let cleanCardId = card.id.trim();
    if (evalKey && cleanCardId.startsWith(`${evalKey}_`)) {
      cleanCardId = cleanCardId.slice(`${evalKey}_`.length);
    }

    // Lưu backup vào localStorage ngay lập tức với key chuẩn và từ điển hồ sơ
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`skkn_note_${userEmailKey}_${evalKey}_${cleanCardId}`, teacherNotes);
        localStorage.setItem(`skkn_note_${cleanCardId}`, teacherNotes);

        const currentEvalNotes = JSON.parse(localStorage.getItem(`skkn_eval_notes_${evalKey}`) || '{}');
        currentEvalNotes[cleanCardId] = teacherNotes;
        localStorage.setItem(`skkn_eval_notes_${evalKey}`, JSON.stringify(currentEvalNotes));

        const currentAllNotes = JSON.parse(localStorage.getItem('skkn_all_teacher_notes') || '{}');
        delete currentAllNotes[`${evalKey}_${cleanCardId}`];
        currentAllNotes[cleanCardId] = teacherNotes;
        localStorage.setItem('skkn_all_teacher_notes', JSON.stringify(currentAllNotes));
      }
    } catch (_) {}

    try {
      if (onSaveTeacherNotes) {
        const res = await onSaveTeacherNotes(cleanCardId, teacherNotes);
        if (!res.success) {
          setIsSavingNotes(false);
          setNotesSaveError(res.error || 'Máy chủ không thể lưu ghi chú. Vui lòng thử lại.');
          return;
        }
      } else {
        onUpdateStatus(cleanCardId, card.status, teacherNotes);
      }
      setIsSavingNotes(false);
      setToastMessage('✓ Đã lưu ghi chú của Thầy/Cô thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setIsSavingNotes(false);
      setNotesSaveError(err?.message || 'Lỗi mạng khi lưu ghi chú. Vui lòng thử lại.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEditing = () => {
    setCustomProposedText(displayedProposalText);
    setIsEditingCustom(true);
    setProposalSaveError(null);
  };

  const handleCancelEditing = () => {
    setIsEditingCustom(false);
    setCustomProposedText(displayedProposalText);
    setProposalSaveError(null);
  };

  const handleSaveProposal = async () => {
    const trimmed = customProposedText.trim();
    if (!trimmed) {
      setProposalSaveError('Nội dung đề xuất không được để trống.');
      return;
    }
    setIsSavingProposal(true);
    setProposalSaveError(null);

    try {
      if (onSaveCustomProposal) {
        const res = await onSaveCustomProposal(card.id, selectedTier, trimmed);
        if (!res.success) {
          setProposalSaveError(res.error || 'Máy chủ không thể lưu đoạn đề xuất. Vui lòng thử lại.');
          setIsSavingProposal(false);
          return;
        }
      }
      setIsSavingProposal(false);
      setIsEditingCustom(false);
      setToastMessage('✓ Đã lưu bản đề xuất chỉnh sửa thành công!');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setIsSavingProposal(false);
      setProposalSaveError(err.message || 'Lỗi mạng khi lưu đề xuất.');
    }
  };

  const handleSelectTier = (tier: 'light' | 'academic' | 'deep') => {
    setSelectedTier(tier);
    setIsEditingCustom(false);
    setProposalSaveError(null);
    onTierChange?.(tier);
  };

  const handleApplyThisChange = () => {
    const textToApply = isEditingCustom ? customProposedText : displayedProposalText;
    if (!textToApply) return;

    if (onApplyChange) {
      const isTeacherCustom = Boolean(savedProposal) || isEditingCustom;
      const changeItem: ChangeSetItem = {
        changeId: `change-${card.id}`,
        issueId: card.id,
        type: 'suggestion',
        location: card.location || 'Toàn văn sáng kiến',
        originalText: effectiveSuggestion.originalText,
        proposedText: textToApply,
        approvedText: textToApply,
        status: 'approved',
        reason: card.whyItMatters || card.issueDetected,
        rubricCriterion: card.affectedCriterion,
        selectedRevisionLevel: selectedTier,
        decidedBy: isTeacherCustom
          ? 'Giáo viên chỉnh trực tiếp'
          : `AI đề xuất (${selectedTier === 'light' ? 'Sửa nhẹ' : selectedTier === 'academic' ? 'Sửa học thuật' : 'Sửa sâu'}) / Giáo viên duyệt`,
        appliedAt: new Date().toLocaleTimeString('vi-VN')
      };
      onApplyChange(changeItem);
      onUpdateStatus(card.id, 'Đã xử lý', teacherNotes);
      setIsEditingCustom(false);
      setToastMessage('✓ Đã áp dụng đoạn văn đề xuất vào bản nháp SKKN thành công!');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div
      className="space-y-6 pb-16 select-none max-w-5xl mx-auto animate-in fade-in duration-200"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Toast notification */}
      {toastMessage && (
        <div className="sticky top-20 z-30 p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-[14.5px] font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-100 hover:text-white font-bold text-xs px-2 py-1 bg-emerald-700/60 rounded-md cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR: Quay lại & Chuyển vấn đề trước/tiếp */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] font-[650] text-slate-700 hover:text-blue-700 inline-flex items-center gap-2 transition-colors cursor-pointer group shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách vấn đề</span>
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-[13.5px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
            Vấn đề {currentIndex + 1} / {totalCards}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!prevCard}
              onClick={() => prevCard && onSelectCard(prevCard)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
              title="Chuyển sang vấn đề trước"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Vấn đề trước</span>
            </button>

            <button
              type="button"
              disabled={!nextCard}
              onClick={() => nextCard && onSelectCard(nextCard)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
              title="Chuyển sang vấn đề tiếp theo"
            >
              <span className="hidden sm:inline">Vấn đề tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* HEADER BANNER: DÒNG 1 -> DÒNG 5 CHUẨN SECTION V */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-md border border-slate-800 space-y-4">
        {/* DÒNG 1: PHẢN BIỆN HỌC THUẬT | PHẢI SỬA / NÊN SỬA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-lg bg-blue-500/25 border border-blue-400/40 text-blue-200 text-[12.5px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-300" />
            <span>{card.issueType || 'Phản biện học thuật'}</span>
          </span>

          <span className={`px-3 py-1 rounded-lg text-[12.5px] font-bold border ${priorityBadge.bg}`}>
            {priorityBadge.label}
          </span>

          {appliedChange && (
            <span className="px-3 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-[12.5px] font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Đã áp dụng vào bản nháp ✓</span>
            </span>
          )}
        </div>

        {/* DÒNG 2: TIÊU ĐỀ VẤN ĐỀ PHẢN BIỆN */}
        <div>
          <h1 className="text-[20px] sm:text-[23px] font-[750] text-white leading-[1.35] tracking-tight">
            {card.issueDetected || card.issueType || 'Vấn đề phản biện học thuật'}
          </h1>
        </div>

        {/* DÒNG 3: VỊ TRÍ TRONG SKKN */}
        <div className="text-[13.5px] text-slate-300 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
          <span><strong>Vị trí trong SKKN:</strong> {card.location || 'Toàn văn sáng kiến kinh nghiệm'}</span>
        </div>

        {/* DÒNG 4: ĐƯỜNG PHÂN CÁCH */}
        <div className="border-t border-slate-700/80 pt-4">

          {/* DÒNG 5: TRẠNG THÁI XỬ LÝ VÀ 4 NÚT QUY CHUẨN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13.5px]">
            <div className="flex items-center gap-3 flex-wrap w-full">
              <span className="text-slate-300 font-bold uppercase text-[12.5px] tracking-wider shrink-0">
                TRẠNG THÁI XỬ LÝ:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 sm:max-w-xl">
                {(['Chưa xử lý', 'Đang xử lý', 'Đã xử lý', 'Bỏ qua'] as FindingStatus[]).map(st => {
                  const isSelected = card.status === st || (st === 'Chưa xử lý' && (!card.status || card.status === 'open'));
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`h-9 px-3.5 rounded-xl font-bold text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? st === 'Đã xử lý'
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                            : st === 'Đang xử lý'
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                            : st === 'Bỏ qua'
                            ? 'bg-slate-600 text-white shadow-md ring-2 ring-slate-400/50'
                            : 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/50'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white shrink-0" />}
                      <span className="truncate">{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FACT CONFIRMATION SECTION IF PB-002 / SAMPLE ISSUE */}
      {isSampleIssue && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-amber-950">
                XÁC NHẬN SỰ THẬT HỌC THUẬT (FACT SAFETY): MÂU THUẪN CỠ MẪU KHẢO SÁT
              </h3>
              <p className="text-[14px] text-amber-900 leading-relaxed">
                Hệ thống phát hiện mâu thuẫn giữa 2 con số <strong>85 học sinh</strong> (tại phần thực trạng) và <strong>82 học sinh</strong> (tại bảng hiệu quả). Để bảo vệ liêm chính học thuật, AI tuyệt đối không tự bịa con số. Vui lòng chọn con số thực tế:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
              sampleChoice === '85_is_correct' ? 'bg-amber-100 border-amber-500 font-bold text-amber-950 shadow-2xs' : 'bg-white border-amber-200 text-slate-800 hover:bg-amber-50/50'
            }`}>
              <input
                type="radio"
                name="sampleFact"
                checked={sampleChoice === '85_is_correct'}
                onChange={() => setSampleChoice('85_is_correct')}
                className="w-4 h-4 text-amber-600"
              />
              <span className="text-[14px]">85 học sinh là con số chính xác xuyên suốt</span>
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
              sampleChoice === '82_is_correct' ? 'bg-amber-100 border-amber-500 font-bold text-amber-950 shadow-2xs' : 'bg-white border-amber-200 text-slate-800 hover:bg-amber-50/50'
            }`}>
              <input
                type="radio"
                name="sampleFact"
                checked={sampleChoice === '82_is_correct'}
                onChange={() => setSampleChoice('82_is_correct')}
                className="w-4 h-4 text-amber-600"
              />
              <span className="text-[14px]">82 học sinh là con số chính xác xuyên suốt</span>
            </label>
          </div>

          {sampleChoice && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-emerald-800">
                ✓ Thầy/Cô đã chọn: <strong>{sampleChoice === '85_is_correct' ? '85 học sinh' : '82 học sinh'}</strong>. Các bản đề xuất bên dưới đã được chuẩn hóa theo số này.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2-COLUMN MAIN CONTENT: CHI TIẾT PHẢN BIỆN & CĂN CỨ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CỘT TRÁI: 1. TRÍCH DẪN NGUYÊN VĂN & 2. CĂN CỨ PHẢN BIỆN */}
        <div className="space-y-6">

          {/* 1. TRÍCH DẪN NGUYÊN VĂN TỪ SKKN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[15px] font-[750] uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-600" />
                <span>1. TRÍCH DẪN NGUYÊN VĂN TRONG SKKN</span>
              </span>
              <span className="text-[12.5px] text-slate-500 font-medium">Bản gốc tác giả</span>
            </div>

            <div className="space-y-3">
              {evidencePieces.map((piece, pIdx) => (
                <div key={pIdx} className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[12.5px] font-bold text-slate-600">
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono">{piece.label}</span>
                    <span className="text-slate-500">{piece.location}</span>
                  </div>
                  <p className="text-[15.5px] leading-[1.7] text-slate-900 italic font-normal bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                    "{renderHighlightedText(piece.text)}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. CĂN CỨ PHẢN BIỆN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[15px] font-[750] uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <Scale className="w-4.5 h-4.5 text-indigo-600" />
                <span>2. CĂN CỨ PHẢN BIỆN & TIÊU CHUẨN</span>
              </span>
              <span className="text-[12.5px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {card.affectedCriterion || 'Tiêu chuẩn thẩm định'}
              </span>
            </div>

            <div className="text-[15px] text-slate-800 leading-[1.7] space-y-2 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
              <p>
                {card.criticismBasis || 'Căn cứ Thông tư và tiêu chuẩn đánh giá sáng kiến kinh nghiệm ngành Giáo dục & Đào tạo; Quy tắc liêm chính học thuật và tính nhất quán của số liệu thống kê thực nghiệm sư phạm.'}
              </p>
              {card.rubricImpactPoints && (
                <p className="text-[13.5px] text-indigo-900 font-semibold pt-2 border-t border-indigo-200/60">
                  ⚡ <strong>Tác động điểm số Rubric:</strong> {card.rubricImpactPoints}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* CỘT PHẢI: 3. VÌ SAO CẦN XỬ LÝ & 4. HƯỚNG XỬ LÝ */}
        <div className="space-y-6">

          {/* 3. VÌ SAO CẦN XỬ LÝ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[15px] font-[750] uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4.5 h-4.5 text-amber-600" />
                <span>3. VÌ SAO CẦN XỬ LÝ?</span>
              </span>
              <span className="text-[12.5px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Rủi ro giám khảo soi xét
              </span>
            </div>

            <div className="text-[15px] text-slate-800 leading-[1.7] space-y-2 bg-amber-50/30 p-4 rounded-xl border border-amber-200/80">
              <p>
                {card.whyItMatters || (card as any).whyRevise || 'Nếu giữ nguyên cách trình bày hiện tại, hội đồng chấm có thể đánh giá tính thuyết phục chưa cao hoặc đặt nghi vấn về độ tin cậy của kết quả thực nghiệm. Việc xử lý dứt điểm sẽ giúp bảo toàn trọn vẹn điểm số.'}
              </p>
              {card.likelyCouncilQuestion && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-amber-300 text-[14px] text-amber-950 font-medium">
                  <strong>❓ Câu hỏi giám khảo có thể chất vấn:</strong>
                  <p className="italic mt-1 text-slate-700">"{card.likelyCouncilQuestion}"</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. HƯỚNG XỬ LÝ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[15px] font-[750] uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-emerald-600" />
                  <span>4. HƯỚNG XỬ LÝ CỤ THỂ</span>
                </span>
                <span className="text-[12.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Giải pháp khắc phục
                </span>
              </div>

              <div className="text-[15px] text-slate-800 leading-[1.7] space-y-2 bg-emerald-50/30 p-4 rounded-xl border border-emerald-200/80">
                <p>
                  {card.resolutionGuidance || (card as any).recommendedAction || 'Rà soát lại toàn bộ đoạn văn, thống nhất các chỉ số thực nghiệm và sử dụng bản đề xuất chỉnh sửa 3 mức độ bên dưới để đưa vào bản nháp SKKN.'}
                </p>
                {card.requiredEvidence && (
                  <p className="text-[13.5px] text-emerald-900 font-semibold pt-2 border-t border-emerald-200/60">
                    📁 <strong>Minh chứng cần chuẩn bị kèm:</strong> {card.requiredEvidence}
                  </p>
                )}
              </div>
            </div>

            {/* NÚT XEM ĐỀ XUẤT CHỈNH SỬA TẠI CUỐI MỤC 4 (SECTION V) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  const targetEl = document.getElementById('section-5-proposals');
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-[700] text-[13.5px] rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                title="Cuộn mượt đến bản đề xuất viết lại 3 mức độ"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>XEM ĐỀ XUẤT CHỈNH SỬA ↓</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* KHU VỰC 5: GỢI Ý SỬA 3 MỨC ĐỘ & SO SÁNH SONG SONG (BEFORE / AFTER) */}
      <div id="section-5-proposals" className="scroll-mt-24 bg-white rounded-2xl border-2 border-blue-200 p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-[17px] sm:text-[18px] font-[750] text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <span>5. BẢN ĐỀ XUẤT VIẾT LẠI CỤ THỂ (3 MỨC ĐỘ)</span>
            </h2>
            <p className="text-[13.5px] text-slate-600 mt-0.5">
              Đoạn văn được viết lại hoàn chỉnh, sẵn sàng thay thế trực tiếp vào vị trí tương ứng trong SKKN.
            </p>
          </div>

          {/* Tier Switcher Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-[13.5px] font-[650] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSelectTier('light')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedTier === 'light' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sửa nhẹ
            </button>
            <button
              type="button"
              onClick={() => handleSelectTier('academic')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedTier === 'academic' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sửa học thuật ⭐
            </button>
            <button
              type="button"
              onClick={() => handleSelectTier('deep')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedTier === 'deep' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sửa sâu 🚀
            </button>
          </div>
        </div>

        {/* SIDE-BY-SIDE: BẢN HIỆN TẠI VS BẢN ĐỀ XUẤT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* CỘT TRÁI: BẢN HIỆN TẠI (GỐC) */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[14px] font-[750] text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>BẢN HIỆN TẠI (GỐC TRONG SKKN):</span>
              </span>
              <p className="text-[15.5px] leading-[1.7] text-slate-900 italic bg-white p-4 rounded-xl border border-slate-200 shadow-2xs font-normal">
                "{effectiveSuggestion.originalText}"
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 text-[13.5px] text-slate-600">
              <strong className="text-slate-800">Vấn đề:</strong> {card.issueDetected}
            </div>
          </div>

          {/* CỘT PHẢI: BẢN ĐỀ XUẤT (SAVED PROPOSAL HOẶC AI ĐỀ XUẤT) */}
          <div className="p-4 sm:p-5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-[750] text-blue-900 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>
                    BẢN ĐỀ XUẤT ({selectedTier === 'light' ? 'SỬA NHẸ' : selectedTier === 'academic' ? 'SỬA HỌC THUẬT' : 'SỬA SÂU'}):
                  </span>
                </span>
                <span className="text-[12px] text-blue-800 font-semibold bg-blue-100/70 px-2 py-0.5 rounded">
                  {savedProposal ? 'Giáo viên đã lưu chỉnh sửa' : selectedTier === 'light' ? 'Bảo toàn tối đa câu chữ' : selectedTier === 'academic' ? 'Chuẩn hóa văn phong sư phạm' : 'Tái cấu trúc lập luận'}
                </span>
              </div>

              {isEditingCustom ? (
                <div className="space-y-2.5">
                  <textarea
                    value={customProposedText}
                    onChange={(e) => setCustomProposedText(e.target.value)}
                    rows={6}
                    placeholder="Nhập nội dung Thầy/Cô muốn chỉnh sửa cho bản đề xuất này..."
                    className="w-full p-3.5 bg-white border-2 border-blue-400 rounded-xl text-[15.5px] leading-[1.7] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans shadow-2xs"
                  />
                  {proposalSaveError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-[13px] text-rose-800 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{proposalSaveError}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      disabled={isSavingProposal}
                      className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 text-[13.5px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProposal}
                      disabled={isSavingProposal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[13.5px] rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingProposal ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>LƯU CHỈNH SỬA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[15.5px] leading-[1.7] text-slate-900 bg-white p-4 rounded-xl border border-blue-200 shadow-2xs font-normal">
                  {displayedProposalText}
                </div>
              )}
            </div>

            {/* Integrity warning if placeholders present */}
            {displayedProposalText.includes('[CẦN') || displayedProposalText.includes('[CHỜ') || displayedProposalText.includes('[GV') ? (
              <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-lg text-[13px] text-amber-950 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Đoạn đề xuất có thẻ <code>[GV điền: ...]</code> để Thầy/Cô bổ sung thông tin thực tế trước khi nộp.</span>
              </div>
            ) : null}

            {/* Action Buttons for Suggestion */}
            <div className="pt-3 border-t border-blue-200/80 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(displayedProposalText)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép đoạn đề xuất'}</span>
                </button>

                {!isEditingCustom && (
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh lại đoạn này</span>
                  </button>
                )}
              </div>

              {appliedChange ? (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã áp dụng ✓</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyThisChange}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-[700] text-[14px] rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ÁP DỤNG THAY ĐỔI</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 6. TRẠNG THÁI VÀ GHI CHÚ XỬ LÝ (AUDIT LOG & TEACHER NOTES) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-[15px] font-[750] uppercase tracking-wide text-slate-900 flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-slate-600" />
            <span>6. TRẠNG THÁI & NHẬT KÝ XỬ LÝ CỦA TÁC GIẢ</span>
          </span>
          <span className="text-[13px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            Vấn đề {String(currentIndex + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="space-y-3">
          <label className="block text-[14px] font-[650] text-slate-800">
            Ghi chú / Căn cứ giải trình của Thầy/Cô đối với vấn đề này:
          </label>
          <textarea
            value={teacherNotes}
            onChange={(e) => {
              setTeacherNotes(e.target.value);
              setNotesSaveError(null);
            }}
            placeholder="Ghi lại các việc Thầy/Cô đã làm để khắc phục vấn đề này (ví dụ: đã kiểm tra lại số liệu sổ điểm lớp 11A2, đã cập nhật phụ lục minh chứng 3)..."
            rows={3}
            className="w-full p-3.5 text-[14.5px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 leading-relaxed font-sans"
          />

          {notesSaveError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-[13.5px] text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{notesSaveError}</span>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-[13px] text-slate-500 italic">
              {appliedChange ? `Đoạn đề xuất đã duyệt lúc: ${appliedChange.appliedAt || 'Gần đây'}` : 'Chưa áp dụng thay đổi vào bản nháp'}
            </span>

            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-[650] text-[13.5px] rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-2"
            >
              {isSavingNotes ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu ghi chú...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lưu ghi chú xử lý</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM PAGINATION BAR: Chuyển vấn đề trước & tiếp theo */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] font-[650] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang trước</span>
        </button>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {prevCard && (
            <button
              type="button"
              onClick={() => onSelectCard(prevCard)}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[13.5px] rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>← Vấn đề trước</span>
            </button>
          )}

          {nextCard && (
            <button
              type="button"
              onClick={() => onSelectCard(nextCard)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-[700] text-[13.5px] rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              <span>Vấn đề tiếp theo →</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
