import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  FileText,
  Search,
  BookOpen,
  Filter,
  ArrowRight,
  Send,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  FileCheck,
  Download,
  Edit3,
  ShieldCheck,
  XCircle,
  HelpCircle,
  Info,
  ShieldAlert
} from 'lucide-react';
import {
  SuggestionRewrite,
  RedTeamCard,
  FindingStatus,
  LanguageSpellingAnalysis,
  LanguageFindingItem,
  MissingContentItem,
  SupportTemplateItem,
  ChangeSetItem
} from '../../types';
import { patchDocxWithChangeSet, generateCleanWordDocument, downloadBlob } from '../../utils/docxPatcher';

interface SuggestionsViewProps {
  suggestions: SuggestionRewrite[];
  issues?: RedTeamCard[];
  languageCheck?: LanguageSpellingAnalysis;
  missingContents?: MissingContentItem[];
  supportTemplates?: SupportTemplateItem[];
  changeSet?: ChangeSetItem[];
  onUpdateIssueStatus?: (id: string, status: FindingStatus) => void;
  onApplyChange?: (change: ChangeSetItem) => void;
  onRevertChange?: (changeId: string) => void;
  onGenerateCustomSuggestion: (originalText: string, problem: string, section: string) => Promise<SuggestionRewrite>;
  isGenerating?: boolean;
  onNavigateTab?: (tab: 'dashboard' | 'red_team' | 'suggestions' | 'rescore' | 'report') => void;
  originalDocxBuffer?: ArrayBuffer | null;
  skknTitle?: string;
  skknFullText?: string;
}

export type PriorityFilter = 'all' | 'must_fix' | 'should_fix' | 'optimize' | 'resolved';
export type ViewTab = 'rewrites' | 'language' | 'missing' | 'templates';

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  suggestions,
  issues = [],
  languageCheck,
  missingContents = [],
  supportTemplates = [],
  changeSet = [],
  onUpdateIssueStatus,
  onApplyChange,
  onRevertChange,
  onGenerateCustomSuggestion,
  isGenerating,
  onNavigateTab,
  originalDocxBuffer,
  skknTitle = 'Sáng kiến kinh nghiệm',
  skknFullText = ''
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('rewrites');
  const [selectedTier, setSelectedTier] = useState<Record<string, 'light' | 'academic' | 'deep'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Editing state for [CHỈNH LẠI] (PHẦN 6)
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [customEditText, setCustomEditText] = useState<string>('');

  // Export word state
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportWarning, setExportWarning] = useState<string | null>(null);

  // Custom rewrite input state
  const [customOriginalText, setCustomOriginalText] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [customSection, setCustomSection] = useState('');
  const [allSuggestions, setAllSuggestions] = useState<SuggestionRewrite[]>(suggestions);

  // Fallback language items if none provided in analysis
  const languageFindings: LanguageFindingItem[] = languageCheck?.findings || [
    {
      id: 'lang-1',
      location: 'Trang 4, Mục 1.1',
      currentText: 'Trong bối cảnh toàn ngành giáo dục đang phấn đấu nổ lực đổi mới phương pháp...',
      issueType: 'lỗi chính tả',
      issueDescription: "Sai chính tả: 'nổ lực' viết sai dấu hỏi, đúng chính tả tiếng Việt phải là 'nỗ lực'.",
      suggestion: "Sửa thành 'nỗ lực'.",
      proposedText: 'Trong bối cảnh toàn ngành giáo dục đang phấn đấu nỗ lực đổi mới phương pháp...',
      status: 'proposed'
    },
    {
      id: 'lang-2',
      location: 'Trang 11, Mục 2.3',
      currentText: 'Giáo viên tổ chức các hoạt động học tập đa dạng nhằm phát huy tối đa tiềm năng của từng cá thể học sinh trong lớp học và đồng thời phối hợp chặt chẽ với phụ huynh học sinh để theo dõi sự tiến bộ hàng ngày của các em thông qua việc chia sẻ các sản phẩm học tập trên nhóm Zalo và bảng tin trực tuyến của lớp học.',
      issueType: 'câu quá dài',
      issueDescription: 'Câu dài 68 từ không có dấu ngắt ý, gây khó hiểu và giảm tính mạch lạc của văn bản khoa học.',
      suggestion: 'Tách thành 2 câu mạch lạc, có dấu chấm câu rõ ràng.',
      proposedText: 'Giáo viên tổ chức các hoạt động học tập đa dạng nhằm phát huy tối đa tiềm năng của từng học sinh. Đồng thời, giáo viên phối hợp chặt chẽ với phụ huynh để theo dõi sự tiến bộ của các em qua các sản phẩm học tập được chia sẻ định kỳ.',
      status: 'proposed'
    },
    {
      id: 'lang-3',
      location: 'Trang 14, Mục 3.2',
      currentText: 'Căn cứ theo hướng dẫn của bộ Giáo dục và Đào tạo...',
      issueType: 'viết hoa không nhất quán',
      issueDescription: "Viết hoa không đúng quy chuẩn tên cơ quan nhà nước: 'bộ Giáo dục' phải viết hoa chữ cái đầu của từ 'Bộ'.",
      suggestion: "Chuẩn hóa thành 'Bộ Giáo dục và Đào tạo'.",
      proposedText: 'Căn cứ theo hướng dẫn của Bộ Giáo dục và Đào tạo...',
      status: 'proposed'
    },
    {
      id: 'lang-4',
      location: 'Trang 28, Mục 4.3',
      currentText: 'Giải pháp chắc chắn mang lại hiệu quả cao cho tất cả học sinh trong mọi điều kiện.',
      issueType: 'diễn đạt quá tuyệt đối',
      issueDescription: "Cách diễn đạt khẳng định tuyệt đối ('chắc chắn mang lại hiệu quả', 'tất cả học sinh') thiếu tính thận trọng khoa học.",
      suggestion: 'Diễn đạt khiêm tốn, gắn với phạm vi dữ liệu khảo sát.',
      proposedText: 'Kết quả trong phạm vi nhóm học sinh được khảo sát cho thấy giải pháp có tác động tích cực và rõ nét.',
      status: 'proposed'
    },
    {
      id: 'lang-5',
      location: 'Trang 25, Mục 4.1',
      currentText: 'Toàn thể học sinh đều say mê học tập và không còn bất kỳ em nào cảm thấy sợ môn Lịch sử.',
      issueType: 'khẳng định vượt quá bằng chứng',
      issueDescription: "Tuyên bố '100% không còn bất kỳ em nào sợ' vượt quá bằng chứng thu thập được từ mẫu khảo sát 82 học sinh.",
      suggestion: 'Gắn kết luận với số liệu phần trăm và tỷ lệ phản hồi khảo sát.',
      proposedText: 'Đại đa số học sinh (85.3%) phản hồi tích cực và cảm thấy tự tin hơn khi học các bài Lịch sử nặng về dữ kiện.',
      status: 'proposed'
    }
  ];

  // Fallback missing contents if none provided
  const displayMissingContents: MissingContentItem[] = missingContents.length > 0 ? missingContents : [
    {
      id: 'miss-1',
      category: 'THIẾU',
      whatIsMissing: 'Kế hoạch bài dạy mẫu (Lesson Plan) lồng ghép giải pháp sơ đồ tương tác',
      criterionName: 'Tiêu chí 6: Khả năng chuyển giao & Nhân rộng',
      whyNeeded: 'Hội đồng cần tài liệu mẫu hoàn chỉnh để giáo viên trường khác có thể tự triển khai mà không cần tác giả hướng dẫn trực tiếp.',
      suggestedLocation: 'Đính kèm tại Phụ lục 1 của hồ sơ SKKN',
      requiredDataFromTeacher: '01 Giáo án chi tiết (theo Công văn 5512/BGDĐT) cho 1 bài học Lịch sử 8 cụ thể có áp dụng giải pháp.'
    },
    {
      id: 'miss-2',
      category: 'CHƯA ĐỦ CĂN CỨ',
      whatIsMissing: "Minh chứng khách quan cho kết luận 'học sinh tích cực, chủ động hơn'",
      criterionName: 'Tiêu chí 5: Tính hiệu quả & Minh chứng xác thực',
      whyNeeded: 'Hiện chỉ có lời khẳng định chủ quan của tác giả, chưa có thước đo và phiếu quan sát hành vi trong các tiết dự giờ.',
      suggestedLocation: 'Trang 26, Mục 4.2 và Phụ lục 3',
      requiredDataFromTeacher: 'Phiếu dự giờ / Biên bản sinh hoạt tổ chuyên môn ghi nhận tần suất phát biểu và tương tác của học sinh.'
    }
  ];

  // Keep allSuggestions in sync
  React.useEffect(() => {
    setAllSuggestions(suggestions);
  }, [suggestions]);

  // Mapping to single source of truth (issues[])
  const findMatchingIssue = (s: SuggestionRewrite): RedTeamCard | undefined => {
    if (s.id === 'sug-1') return issues.find(i => i.id === 'PB-001');
    if (s.id === 'sug-2') return issues.find(i => i.id === 'PB-003');
    if (s.id === 'sug-3') return issues.find(i => i.id === 'PB-002');
    if (s.id === 'sug-4') return issues.find(i => i.id === 'PB-004');
    if (s.id === 'sug-5') return issues.find(i => i.id === 'PB-005');

    return issues.find(i => 
      (i.location && s.targetSection && (
        i.location.toLowerCase().includes(s.targetSection.split(',')[0].toLowerCase().trim()) ||
        s.targetSection.toLowerCase().includes(i.location.toLowerCase().trim())
      )) ||
      (i.relatedQuote && s.originalText && (
        i.relatedQuote.toLowerCase().includes(s.originalText.slice(0, 20).toLowerCase()) ||
        s.originalText.toLowerCase().includes(i.relatedQuote.slice(0, 20).toLowerCase())
      ))
    );
  };

  const isIssueResolved = (card?: RedTeamCard) => {
    if (!card) return false;
    return card.status === 'Đã xử lý' || card.status === 'resolved';
  };

  // Check if a suggestion has an applied change in changeSet
  const getAppliedChangeForSuggestion = (sugId: string) => {
    return changeSet.find(c => c.changeId === `change-${sugId}` || c.issueId === sugId);
  };

  const getAppliedChangeForLanguage = (langId: string) => {
    return changeSet.find(c => c.changeId === `change-lang-${langId}`);
  };

  // Summary counts
  const seriousCount = issues.filter(c => c.impactLevel === 'Cao').length;
  const warningCount = issues.filter(c => c.impactLevel === 'Trung bình').length;
  const optimizeCount = issues.filter(c => c.impactLevel === 'Thấp').length;
  const resolvedCount = issues.filter(c => isIssueResolved(c)).length;
  const totalCount = issues.length > 0 ? issues.length : allSuggestions.length;
  const approvedChangesCount = changeSet.filter(c => c.status === 'approved' || c.status === 'applied').length;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTierContent = (s: SuggestionRewrite, tier: 'light' | 'academic' | 'deep') => {
    switch (tier) {
      case 'light': return s.lightRevision;
      case 'academic': return s.academicRevision;
      case 'deep': return s.deepRevision;
    }
  };

  // PHẦN 6 & 24: Áp dụng thay đổi vào change-set
  const handleApplySuggestion = (s: SuggestionRewrite, textToApply: string, isManualEdit = false) => {
    const matchingIssue = findMatchingIssue(s);
    const tier = selectedTier[s.id] || 'academic';
    const changeItem: ChangeSetItem = {
      changeId: `change-${s.id}`,
      issueId: s.id,
      type: 'suggestion',
      location: s.targetSection,
      originalText: s.originalText,
      proposedText: textToApply,
      approvedText: textToApply,
      status: 'approved',
      reason: s.whyRevise || s.problem,
      rubricCriterion: matchingIssue?.affectedCriterion,
      selectedRevisionLevel: tier,
      decidedBy: isManualEdit ? 'Giáo viên chỉnh trực tiếp' : `AI đề xuất (${tier === 'light' ? 'Sửa nhẹ' : tier === 'academic' ? 'Sửa học thuật' : 'Sửa sâu'}) / Giáo viên duyệt`,
      appliedAt: new Date().toLocaleTimeString('vi-VN')
    };

    if (onApplyChange) {
      onApplyChange(changeItem);
    }

    // Tự động đồng bộ sang issues[]
    if (matchingIssue && onUpdateIssueStatus) {
      onUpdateIssueStatus(matchingIssue.id, 'Đã xử lý');
    }

    setEditingCardId(null);
  };

  const handleApplyLanguageItem = (item: LanguageFindingItem, textToApply: string, isManualEdit = false) => {
    const changeItem: ChangeSetItem = {
      changeId: `change-lang-${item.id}`,
      issueId: item.id,
      type: 'language',
      location: item.location,
      originalText: item.currentText,
      proposedText: textToApply,
      approvedText: textToApply,
      status: 'approved',
      reason: item.issueDescription,
      decidedBy: isManualEdit ? 'Giáo viên chỉnh trực tiếp' : 'AI đề xuất / Giáo viên duyệt',
      appliedAt: new Date().toLocaleTimeString('vi-VN')
    };

    if (onApplyChange) {
      onApplyChange(changeItem);
    }

    setEditingCardId(null);
  };

  // PHẦN 19: Hoàn tác thay đổi
  const handleRevertItem = (changeId: string, matchingIssueId?: string) => {
    if (onRevertChange) {
      onRevertChange(changeId);
    }
    if (matchingIssueId && onUpdateIssueStatus) {
      onUpdateIssueStatus(matchingIssueId, 'Chưa xử lý');
    }
  };

  // PHẦN 22, 23, 24, 25, 26: Xuất Word bảo toàn định dạng
  const handleExportWord = async () => {
    setIsExportingWord(true);
    setExportWarning(null);

    try {
      if (originalDocxBuffer) {
        // Xuất bằng cách patch XML trực tiếp
        const result = await patchDocxWithChangeSet(originalDocxBuffer, changeSet);
        if (result.warnings.length > 0) {
          setExportWarning(`Đã bảo toàn tài liệu. Lưu ý: ${result.warnings.join('; ')}`);
        }
        downloadBlob(result.blob, `${skknTitle.replace(/[^a-zA-Z0-9]/g, '_')}_HoanThien.docx`);
      } else {
        // Xuất văn bản sạch đã áp dụng chỉnh sửa
        const blob = generateCleanWordDocument(skknTitle, skknFullText || 'Nội dung SKKN đã được hoàn thiện', changeSet);
        downloadBlob(blob, `${skknTitle.replace(/[^a-zA-Z0-9]/g, '_')}_BanDaSua.doc`);
      }
    } catch (err: any) {
      console.error(err);
      setExportWarning('Lỗi khi đóng gói Word: ' + err.message);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Helper render placeholder nổi bật
  const renderFormattedSuggestion = (text: string) => {
    const parts = text.split(/(\[CẦN TÁC GIẢ XÁC NHẬN.*?\]|\[CHỜ XÁC NHẬN.*?\]|\[CẦN GIÁO VIÊN CUNG CẤP SỐ LIỆU.*?\]|\[CẦN BỔ SUNG MINH CHỨNG.*?\]|\[CẦN XÁC MINH.*?\]|\[CẦN BỔ SUNG.*?\])/g);
    return parts.map((part, i) => {
      if (/^(\[CẦN TÁC GIẢ XÁC NHẬN.*?\]|\[CHỜ XÁC NHẬN.*?\]|\[CẦN GIÁO VIÊN CUNG CẤP SỐ LIỆU.*?\]|\[CẦN BỔ SUNG MINH CHỨNG.*?\]|\[CẦN XÁC MINH.*?\]|\[CẦN BỔ SUNG.*?\])$/.test(part)) {
        return (
          <span
            key={i}
            className="inline-block bg-amber-100 text-amber-950 border border-amber-300 font-bold px-2 py-0.5 rounded text-[13px] sm:text-[14px] font-sans my-0.5 mx-0.5 shadow-2xs"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Categories list
  const categories = [
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'Tính mới & Phương pháp', label: 'Tính mới & Phương pháp' },
    { id: 'Số liệu & Thực nghiệm', label: 'Số liệu & Thực nghiệm' },
    { id: 'Minh chứng & Khảo sát', label: 'Minh chứng & Khảo sát' },
    { id: 'Chuẩn mực trình bày & Trích dẫn', label: 'Quy chuẩn trình bày' }
  ];

  // Filtering
  const filteredSuggestions = allSuggestions.filter(s => {
    const matchIssue = findMatchingIssue(s);
    const resolved = isIssueResolved(matchIssue) || Boolean(getAppliedChangeForSuggestion(s.id));

    if (priorityFilter === 'must_fix') {
      if (matchIssue && matchIssue.impactLevel !== 'Cao') return false;
    } else if (priorityFilter === 'should_fix') {
      if (matchIssue && matchIssue.impactLevel !== 'Trung bình') return false;
    } else if (priorityFilter === 'optimize') {
      if (matchIssue && matchIssue.impactLevel !== 'Thấp') return false;
    } else if (priorityFilter === 'resolved') {
      if (!resolved) return false;
    }

    if (selectedCategory !== 'all') {
      if (s.category && s.category !== selectedCategory) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSection = s.targetSection.toLowerCase().includes(q);
      const matchText = s.originalText.toLowerCase().includes(q);
      const matchProblem = s.problem.toLowerCase().includes(q);
      const matchGoal = s.revisionGoal?.toLowerCase().includes(q);
      return matchSection || matchText || matchProblem || Boolean(matchGoal);
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Banner - PHẦN 4: HỖ TRỢ HOÀN THIỆN */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-950">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[13px] font-bold border border-blue-500/30">
              <PenTool className="w-4 h-4" />
              <span>Hỗ trợ hoàn thiện • Phê duyệt từng thay đổi • Không viết thay tác giả</span>
            </div>
            <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-white leading-[1.3] uppercase">
              HỖ TRỢ HOÀN THIỆN SKKN
            </h1>
            <p className="text-[15px] text-blue-100/90 leading-[1.65] font-normal">
              Tập trung vào những điểm ảnh hưởng trực tiếp đến chất lượng và điểm đánh giá của sáng kiến. Mọi thay đổi quan trọng đều do Thầy/Cô trực tiếp xem xét, chỉnh sửa và phê duyệt.
            </p>
          </div>

          {/* PHẦN 22 & 26: Nút xuất Word BETA */}
          <div className="space-y-1.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[14px] sm:text-[15px] rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingWord ? 'Đang đóng gói Word...' : `Xuất Word đã sửa (${approvedChangesCount})`}</span>
              <span className="text-[12px] bg-emerald-700 px-2 py-0.5 rounded font-mono font-bold">BETA</span>
            </button>
            <span className="text-[13px] text-blue-200/90 block text-center font-medium">
              Bảo toàn tối đa hình ảnh, bảng & định dạng
            </span>
          </div>
        </div>

        {/* Cảnh báo bảo toàn tài liệu */}
        {exportWarning && (
          <div className="mt-3 p-3.5 bg-white/10 rounded-xl border border-white/20 text-[14px] text-amber-200">
            ⚠️ {exportWarning}
          </div>
        )}
      </div>

      {/* Strict Anti-Fabrication Rule Alert (PHẦN 8 & 29) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-[14px] sm:text-[15px] text-amber-950 flex items-start gap-3 shadow-2xs leading-[1.65]">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-amber-950 mb-1 text-[15px]">
            QUY TẮC BẢO TOÀN LIÊM CHÍNH HỌC THUẬT:
          </strong>
          <span>
            Hệ thống tuyệt đối không tự tạo số học sinh, tỷ lệ khảo sát, điểm kiểm tra, tên trường hay minh chứng giả. Bất kỳ vị trí nào cần số liệu thực nghiệm đều được gắn cờ chuẩn hóa: <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-bold">[CẦN GIÁO VIÊN CUNG CẤP SỐ LIỆU]</code> hoặc <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-bold">[CẦN BỔ SUNG MINH CHỨNG]</code> để tác giả tự điền.
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation: (15px, Active 700) */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-[15px] font-[650] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('rewrites')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'rewrites'
              ? 'border-blue-600 text-blue-600 font-[700]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Gợi ý sửa nội dung & Phản biện ({allSuggestions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('language')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'language'
              ? 'border-blue-600 text-blue-600 font-[700]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Kiểm tra chính tả & Ngôn ngữ ({languageFindings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'missing'
              ? 'border-blue-600 text-blue-600 font-[700]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Nội dung còn thiếu & Chưa đủ căn cứ ({displayMissingContents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600 font-[700]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Phụ lục & Mẫu hỗ trợ đề xuất ({supportTemplates.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GỢI Ý SỬA NỘI DUNG & PHẢN BIỆN (BEFORE / AFTER & 3 TIERS)         */}
      {/* ========================================================================= */}
      {activeTab === 'rewrites' && (
        <div className="space-y-6">
          
          {/* Quick Filters & Summary Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPriorityFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-[14px] font-[650] transition-all cursor-pointer ${
                    priorityFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Tất cả ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('must_fix')}
                  className={`px-3.5 py-1.5 rounded-xl text-[14px] font-[650] transition-all cursor-pointer flex items-center gap-1.5 ${
                    priorityFilter === 'must_fix'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span>🔴 Phải sửa</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[12.5px] font-bold">{seriousCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('should_fix')}
                  className={`px-3.5 py-1.5 rounded-xl text-[14px] font-[650] transition-all cursor-pointer flex items-center gap-1.5 ${
                    priorityFilter === 'should_fix'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span>🟠 Nên sửa</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[12.5px] font-bold">{warningCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('optimize')}
                  className={`px-3.5 py-1.5 rounded-xl text-[14px] font-[650] transition-all cursor-pointer flex items-center gap-1.5 ${
                    priorityFilter === 'optimize'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  <span>🔵 Tối ưu thêm</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[12.5px] font-bold">{optimizeCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('resolved')}
                  className={`px-3.5 py-1.5 rounded-xl text-[14px] font-[650] transition-all cursor-pointer flex items-center gap-1.5 ${
                    priorityFilter === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã xử lý / Đã duyệt</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[12.5px] font-bold">{resolvedCount}</span>
                </button>
              </div>

              {/* Summary */}
              <div className="flex items-center gap-3 text-[14px] text-slate-600 font-[600] self-start lg:self-auto flex-wrap">
                <span className="text-rose-700">Phải sửa: <strong>{seriousCount}</strong></span>
                <span>·</span>
                <span className="text-amber-700">Nên sửa: <strong>{warningCount}</strong></span>
                <span>·</span>
                <span className="text-blue-700">Tối ưu: <strong>{optimizeCount}</strong></span>
                <span>·</span>
                <span className="text-emerald-700">Đã duyệt áp dụng: <strong>{approvedChangesCount}</strong></span>
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm gợi ý theo vị trí, từ khóa hoặc vấn đề..."
                  className="w-full pl-9 pr-3 py-2 text-[14px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-[14px]"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-[700] text-slate-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Chủ đề:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-[13.5px] font-[600] transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-slate-800 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Custom Excerpt Rewrite Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Yêu cầu gợi ý viết lại một đoạn văn cụ thể từ SKKN của bạn:
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!customOriginalText.trim()) return;
              try {
                const newSug = await onGenerateCustomSuggestion(
                  customOriginalText,
                  customProblem || 'Cần chuẩn hóa văn phong học thuật, củng cố căn cứ và khắc phục cách diễn đạt chung chung',
                  customSection || 'Đoạn văn gửi thẩm định'
                );
                setAllSuggestions(prev => [newSug, ...prev]);
                setCustomOriginalText('');
                setCustomProblem('');
                setCustomSection('');
              } catch (err) {
                console.error(err);
              }
            }} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                  placeholder="Vị trí (ví dụ: Trang 15, Mục 3.1 - Biện pháp 2)..."
                  className="px-3.5 py-2 text-[14.5px] bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  value={customProblem}
                  onChange={(e) => setCustomProblem(e.target.value)}
                  placeholder="Vấn đề cần khắc phục (ví dụ: Tuyên bố tính mới quá mức, thiếu căn cứ)..."
                  className="md:col-span-2 px-3.5 py-2 text-[14.5px] bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <textarea
                  value={customOriginalText}
                  onChange={(e) => setCustomOriginalText(e.target.value)}
                  placeholder="Dán đoạn văn trong SKKN bạn muốn gợi ý viết lại vào đây..."
                  rows={3}
                  className="w-full p-3.5 text-[15px] bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-[1.6]"
                />
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isGenerating || !customOriginalText.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-[650] text-[14px] rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tạo gợi ý 3 mức độ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Tạo gợi ý chỉnh sửa đoạn này</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Suggestion Cards List */}
          <div className="space-y-6">
            {filteredSuggestions.map((s, idx) => {
              const currentTier = selectedTier[s.id] || 'academic';
              const content = getTierContent(s, currentTier);
              const matchingIssue = findMatchingIssue(s);
              const appliedChange = getAppliedChangeForSuggestion(s.id);
              const isApplied = Boolean(appliedChange);
              const isDone = isIssueResolved(matchingIssue) || isApplied;
              const isEditing = editingCardId === s.id;

              const isHigh = matchingIssue?.impactLevel === 'Cao';
              const isMed = matchingIssue?.impactLevel === 'Trung bình';
              const impactBadge = isHigh
                ? { label: '🔴 Phải sửa', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
                : isMed
                ? { label: '🟠 Nên sửa', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
                : { label: '🔵 Tối ưu thêm', bg: 'bg-blue-100 text-blue-800 border-blue-200' };

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs space-y-4 p-5 sm:p-6 lg:p-7 ${
                    isApplied
                      ? 'border-emerald-300 bg-emerald-50/15'
                      : isDone
                      ? 'border-slate-300 opacity-90'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Line: Tiêu đề vấn đề (17px / 700) & Vị trí/Mô tả phụ */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg font-bold text-[14px] flex items-center justify-center shrink-0 mt-0.5 ${
                        isApplied ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-[17px] font-[700] text-slate-900 leading-[1.4] tracking-tight">
                            {s.targetSection}
                          </h3>
                          <span className={`text-[13px] font-[700] px-2.5 py-0.5 rounded-md border ${impactBadge.bg}`}>
                            {impactBadge.label}
                          </span>
                          {isApplied && (
                            <span className="text-[13px] font-[700] px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Đã duyệt đưa vào bản xuất ✓</span>
                            </span>
                          )}
                        </div>
                        {matchingIssue?.affectedCriterion && (
                          <p className="text-[13.5px] text-slate-600 leading-[1.5] mt-1">
                            Tiêu chí ảnh hưởng: <strong className="text-slate-800 font-semibold">{matchingIssue.affectedCriterion}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-[13.5px] text-slate-600 font-sans leading-[1.5] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
                      📌 {s.insertPosition}
                    </div>
                  </div>

                  {/* PHẦN 6: CƠ CHẾ BEFORE / AFTER - 2 Cột Desktop, 1 Cột Responsive */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                    
                    {/* BẢN HIỆN TẠI (BẢN GỐC) */}
                    <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <span className="text-[15px] font-[700] text-slate-900 uppercase tracking-wide flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <span>BẢN HIỆN TẠI:</span>
                        </span>
                        <p className="text-[16px] leading-[1.7] text-slate-900 italic bg-white p-4 rounded-xl border border-slate-200 shadow-2xs font-normal">
                          "{s.originalText}"
                        </p>
                      </div>
                      <p className="text-[15px] text-slate-800 leading-[1.65] pt-2 border-t border-slate-200/80 mt-2">
                        <strong className="font-[700] text-slate-900">Vấn đề:</strong> {s.problem}
                      </p>
                    </div>

                    {/* BẢN ĐỀ XUẤT (3 TIERS) */}
                    <div className="p-4 sm:p-5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-[15px] font-[700] text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                              BẢN ĐỀ XUẤT ({currentTier === 'light' ? 'SỬA NHẸ' : currentTier === 'academic' ? 'SỬA HỌC THUẬT' : 'SỬA SÂU'}):
                            </span>
                          </span>
                          
                          {/* Tier Selector */}
                          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                            <div className="inline-flex p-0.5 bg-white rounded-lg border border-blue-200 text-[13.5px] font-[650]">
                              <button
                                type="button"
                                title="Giữ tối đa bản gốc của tác giả, sửa tối thiểu"
                                onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'light' }))}
                                className={`px-3 py-1 rounded cursor-pointer transition-all ${
                                  currentTier === 'light' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Sửa nhẹ
                              </button>
                              <button
                                type="button"
                                title="Chuẩn hóa cách viết học thuật, khách quan và chặt chẽ hơn"
                                onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'academic' }))}
                                className={`px-3 py-1 rounded cursor-pointer transition-all ${
                                  currentTier === 'academic' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Sửa học thuật ⭐
                              </button>
                              <button
                                type="button"
                                title="Tái cấu trúc lập luận nhưng tuyệt đối không thêm dữ kiện"
                                onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'deep' }))}
                                className={`px-3 py-1 rounded cursor-pointer transition-all ${
                                  currentTier === 'deep' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Sửa sâu 🚀
                              </button>
                            </div>
                            <span className="text-[12.5px] text-blue-900/80 font-medium">
                              {currentTier === 'light'
                                ? '• Giữ tối đa bản gốc của tác giả'
                                : currentTier === 'academic'
                                ? '• Chuẩn hóa cách viết học thuật'
                                : '• Tái cấu trúc nhưng không thêm dữ kiện'}
                            </span>
                          </div>
                        </div>

                        {/* Display Proposed or Inline Editor */}
                        {isEditing ? (
                          <div className="space-y-2.5">
                            <textarea
                              value={customEditText}
                              onChange={(e) => setCustomEditText(e.target.value)}
                              rows={5}
                              className="w-full p-4 bg-white border border-blue-300 rounded-xl text-[16px] leading-[1.7] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingCardId(null)}
                                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-[14px] font-[650] cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplySuggestion(s, customEditText, true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-[700] text-[14px] rounded-xl cursor-pointer shadow-2xs"
                              >
                                Lưu & Áp dụng
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-[16px] leading-[1.7] text-slate-900 bg-white p-4 rounded-xl border border-blue-200 shadow-2xs font-normal">
                              {renderFormattedSuggestion(content)}
                            </div>

                            {/* Phạm vi can thiệp & Dữ kiện sử dụng (nếu có tierDetails) */}
                            {s.tierDetails && s.tierDetails[currentTier] && (
                              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[13.5px] text-blue-900 leading-[1.55] space-y-1">
                                <div>
                                  <strong className="font-[700] text-blue-950">Phạm vi can thiệp:</strong> {s.tierDetails[currentTier].changeScope}
                                </div>
                                {s.tierDetails[currentTier].factsUsed && s.tierDetails[currentTier].factsUsed.length > 0 && (
                                  <div className="text-[13px] text-slate-600">
                                    <span className="font-semibold text-slate-700">Dữ kiện sử dụng:</span> {s.tierDetails[currentTier].factsUsed.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {s.missingEvidenceAlert && (
                        <p className="text-[14px] text-amber-900 leading-[1.55] font-medium pt-2 border-t border-blue-200/60 mt-2">
                          ⚠️ <strong className="font-[700] text-amber-950">Lưu ý Hội đồng:</strong> {s.missingEvidenceAlert}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fact Safety Notice if verification needed */}
                  {(content.includes('[CẦN TÁC GIẢ XÁC NHẬN') || content.includes('[CHỜ XÁC NHẬN') || content.includes('[CẦN BỔ SUNG SỐ LIỆU') || s.problem?.toLowerCase().includes('cỡ mẫu')) && !isApplied && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-[14px] text-amber-950 font-medium flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-200 rounded text-[12.5px] font-[700] uppercase text-amber-900 border border-amber-300 shrink-0">
                        ⚠ CẦN XÁC MINH
                      </span>
                      <span>Đoạn này chứa dữ liệu thực tế cần Thầy/Cô xác nhận hoặc chỉnh sửa trực tiếp trước khi đưa vào bản xuất.</span>
                    </div>
                  )}

                  {/* LÝ DO THAY ĐỔI */}
                  <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-4">
                    <strong className="text-slate-900 block font-[700] text-[15px] uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>LÝ DO THAY ĐỔI:</span>
                    </strong>
                    <p className="text-slate-800 leading-[1.65] text-[15px]">
                      {s.whyRevise || s.problem}
                    </p>
                    <p className="text-[15px] text-blue-900 leading-[1.65] pt-1.5 border-t border-slate-200/70">
                      <strong className="font-[700] text-blue-950">Căn cứ:</strong> {s.basis || matchingIssue?.criticismBasis || 'Quy chuẩn nghiên cứu và tiêu chí phiếu chấm Rubric.'}
                    </p>
                  </div>

                  {/* PHẦN 6: Các nút hành động [ÁP DỤNG] [CHỈNH LẠI] [BỎ QUA] [HOÀN TÁC] */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopy(s.id, content)}
                        className="text-[14px] font-[650] text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        {copiedId === s.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedId === s.id ? 'Đã sao chép!' : 'Sao chép đoạn đề xuất'}</span>
                      </button>

                      {!isEditing && !isApplied && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCardId(s.id);
                            setCustomEditText(content);
                          }}
                          className="text-[14px] font-[650] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Chỉnh lại</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      {isApplied ? (
                        <button
                          type="button"
                          onClick={() => handleRevertItem(`change-${s.id}`, matchingIssue?.id)}
                          className="text-[14px] font-[650] px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Hoàn tác (Hủy áp dụng)</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (matchingIssue && onUpdateIssueStatus) {
                                onUpdateIssueStatus(matchingIssue.id, 'Bỏ qua');
                              }
                            }}
                            className="text-[14px] font-[650] px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Bỏ qua
                          </button>

                          {(content.includes('[CẦN TÁC GIẢ XÁC NHẬN') || content.includes('[CHỜ XÁC NHẬN') || content.includes('[CẦN BỔ SUNG SỐ LIỆU') || s.problem?.toLowerCase().includes('cỡ mẫu')) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCardId(s.id);
                                setCustomEditText(content);
                              }}
                              className="text-[14px] sm:text-[15px] font-[700] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <ShieldAlert className="w-4 h-4" />
                              <span>XÁC NHẬN THÔNG TIN THỰC TẾ</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplySuggestion(s, content, false)}
                              className="text-[15px] font-[700] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <CheckCircle2 className="w-4.5 h-4.5" />
                              <span>ÁP DỤNG THAY ĐỔI</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHẦN 1 - KIỂM TRA CHÍNH TẢ & NGÔN NGỮ                             */}
      {/* ========================================================================= */}
      {activeTab === 'language' && (
        <div className="space-y-4">
          <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] text-slate-700 space-y-1 leading-[1.6]">
            <h3 className="font-[700] text-slate-900 text-[15px] flex items-center gap-2">
              <FileCheck className="w-4.5 h-4.5 text-blue-600" />
              Kiểm tra ngôn ngữ & Chuẩn mực diễn đạt học thuật:
            </h3>
            <p>
              Rà soát lỗi chính tả, đánh máy, dấu câu, viết hoa không nhất quán, câu quá dài, tối nghĩa, lặp từ, cách diễn đạt quá tuyệt đối hoặc câu khẳng định vượt quá bằng chứng.
            </p>
          </div>

          <div className="space-y-4">
            {languageFindings.map((item) => {
              const appliedChange = getAppliedChangeForLanguage(item.id);
              const isApplied = Boolean(appliedChange);
              const isEditing = editingCardId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-5.5 rounded-2xl border transition-all duration-200 bg-white shadow-2xs space-y-3.5 ${
                    isApplied ? 'border-emerald-300 bg-emerald-50/15' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-[700] text-slate-900 text-[15px]">
                        📍 Vị trí: {item.location}
                      </span>
                      <span className="text-[13px] font-[700] px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        🔎 {item.issueType}
                      </span>
                    </div>

                    {isApplied && (
                      <span className="text-[13px] font-[700] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1 self-start sm:self-auto">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Đã áp dụng vào bản sửa</span>
                      </span>
                    )}
                  </div>

                  {/* 2-Columns: Nội dung hiện tại vs Phiên bản đề nghị */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="text-[13.5px] font-[700] text-slate-600 uppercase tracking-wide block">
                        📄 NỘI DUNG HIỆN TẠI:
                      </span>
                      <p className="italic text-[15px] sm:text-[16px] text-slate-800 leading-[1.7]">
                        "{item.currentText}"
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                      <span className="text-[13.5px] font-[700] text-emerald-900 uppercase tracking-wide block">
                        ✍️ PHIÊN BẢN ĐỀ NGHỊ:
                      </span>
                      {isEditing ? (
                        <div className="space-y-2.5">
                          <textarea
                            value={customEditText}
                            onChange={(e) => setCustomEditText(e.target.value)}
                            rows={3}
                            className="w-full p-3.5 bg-white border border-emerald-300 rounded-xl text-[15px] sm:text-[16px] leading-[1.7] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCardId(null)}
                              className="px-3.5 py-1.5 text-[14px] font-[650] text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyLanguageItem(item, customEditText, true)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-[700] text-[14px] rounded-lg cursor-pointer"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[15px] sm:text-[16px] text-emerald-950 font-medium leading-[1.7]">
                          "{item.proposedText}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vấn đề & Đề xuất */}
                  <div className="text-[14.5px] text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 leading-[1.65]">
                    <p><strong className="font-[700] text-slate-900">🔎 Vấn đề:</strong> {item.issueDescription}</p>
                    <p><strong className="font-[700] text-slate-900">💡 Đề xuất:</strong> {item.suggestion}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    {!isEditing && !isApplied && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCardId(item.id);
                          setCustomEditText(item.proposedText);
                        }}
                        className="text-[14px] font-[650] text-blue-700 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Chỉnh sửa trước khi áp dụng</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      {isApplied ? (
                        <button
                          type="button"
                          onClick={() => handleRevertItem(`change-lang-${item.id}`)}
                          className="text-[14px] font-[650] px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Hoàn tác</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyLanguageItem(item, item.proposedText, false)}
                          className="text-[14px] font-[700] px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          <span>ÁP DỤNG</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PHẦN 2 - NỘI DUNG CÒN THIẾU & CHƯA ĐỦ CĂN CỨ                      */}
      {/* ========================================================================= */}
      {activeTab === 'missing' && (
        <div className="space-y-4">
          <div className="p-4.5 rounded-xl bg-blue-50 border border-blue-200 text-[14px] text-blue-900 space-y-1 leading-[1.6]">
            <h3 className="font-[700] text-blue-950 text-[15px] flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-blue-600" />
              Nguyên tắc phân biệt:
            </h3>
            <p className="leading-relaxed">
              Hệ thống phân biệt rõ giữa <strong>THIẾU HOÀN TOÀN</strong> (vắng bóng mục nội dung theo yêu cầu công văn/phiếu chấm) và <strong>CHƯA ĐỦ CĂN CỨ</strong> (có đề cập nhưng chưa đủ minh chứng thực nghiệm đối chứng).
            </p>
          </div>

          <div className="space-y-4">
            {displayMissingContents.map((item) => {
              const isMissingTotally = item.category === 'THIẾU';

              return (
                <div
                  key={item.id}
                  className="p-5.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3.5 text-[14.5px]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <span className={`text-[13px] font-[700] px-2.5 py-0.5 rounded border self-start sm:self-auto ${
                      isMissingTotally
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      ● PHÂN LOẠI: {item.category}
                    </span>
                    <span className="text-[13.5px] font-medium text-slate-600">
                      Tiêu chí: <strong className="text-slate-800">{item.criterionName}</strong>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <strong className="text-slate-900 text-[15.5px] block font-[700]">
                      Thiếu gì: {item.whatIsMissing}
                    </strong>
                    <p className="text-slate-700 leading-[1.65]">
                      <strong className="text-slate-900 font-[650]">Tại sao cần:</strong> {item.whyNeeded}
                    </p>
                    <p className="text-slate-700 leading-[1.65]">
                      <strong className="text-slate-900 font-[650]">Nên đặt ở đâu:</strong> {item.suggestedLocation}
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[14px] text-amber-950 space-y-1.5 leading-[1.6]">
                    <strong className="font-[700]">📋 Dữ liệu giáo viên cần chuẩn bị cung cấp:</strong>
                    <p className="font-medium">{item.requiredDataFromTeacher}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PHẦN 16 - PHỤ LỤC & MẪU HỖ TRỢ ĐỀ XUẤT                           */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] text-slate-700 space-y-1 leading-[1.6]">
            <h3 className="font-[700] text-slate-900 text-[15px] flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-blue-600" />
              Nguyên tắc biểu mẫu hỗ trợ:
            </h3>
            <p className="leading-relaxed">
              Các biểu mẫu dưới đây là <strong>MẪU ĐỀ XUẤT HỖ TRỢ</strong>. Giáo viên sử dụng mẫu này để tổ chức thu thập dữ liệu thật tại đơn vị. Tuyệt đối không giả mạo thành minh chứng đã được sử dụng trước nghiên cứu.
            </p>
          </div>

          <div className="space-y-4">
            {supportTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3.5 text-[14.5px]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <strong className="text-slate-900 text-[15.5px] font-[700]">
                    📄 {tpl.title}
                  </strong>
                  <span className="text-[13px] font-[700] px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto">
                    MẪU ĐỀ XUẤT (CẦN ĐIỀN DỮ LIỆU THẬT)
                  </span>
                </div>

                <p className="text-slate-600 text-[14px]">
                  <strong className="text-slate-800 font-[650]">Mục đích:</strong> {tpl.purpose}
                </p>

                {/* Content */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[13.5px] text-slate-800 whitespace-pre-line leading-[1.65] max-h-56 overflow-y-auto">
                  {tpl.content}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[13.5px] text-slate-500 italic">
                    {tpl.guide}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(tpl.id, tpl.content)}
                    className="text-[14px] font-[650] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === tpl.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId === tpl.id ? 'Đã sao chép biểu mẫu!' : 'Sao chép biểu mẫu'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA to next step in workflow: CHẤM LẠI SAU CHỈNH SỬA */}
      {onNavigateTab && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-[16px] font-bold text-slate-900">
              Đã duyệt các thay đổi ({approvedChangesCount} điểm)?
            </h4>
            <p className="text-[14px] text-slate-600 mt-0.5">
              Chuyển sang module Chấm lại để hệ thống đối chiếu thực chất Bản gốc ↔ Bản mới và thẩm định lại điểm Rubric.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('rescore')}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TIẾN HÀNH CHẤM LẠI SAU CHỈNH SỬA →</span>
          </button>
        </div>
      )}

    </div>
  );
};
