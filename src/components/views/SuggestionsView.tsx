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
  RefreshCw
} from 'lucide-react';
import { SuggestionRewrite, RedTeamCard, FindingStatus } from '../../types';

interface SuggestionsViewProps {
  suggestions: SuggestionRewrite[];
  issues?: RedTeamCard[];
  onUpdateIssueStatus?: (id: string, status: FindingStatus) => void;
  onGenerateCustomSuggestion: (originalText: string, problem: string, section: string) => Promise<SuggestionRewrite>;
  isGenerating?: boolean;
  onNavigateTab?: (tab: 'dashboard' | 'red_team' | 'suggestions' | 'rescore' | 'report') => void;
}

export type PriorityFilter = 'all' | 'must_fix' | 'should_fix' | 'optimize' | 'resolved';

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  suggestions,
  issues = [],
  onUpdateIssueStatus,
  onGenerateCustomSuggestion,
  isGenerating,
  onNavigateTab
}) => {
  const [selectedTier, setSelectedTier] = useState<Record<string, 'light' | 'academic' | 'deep'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom rewrite input state
  const [customOriginalText, setCustomOriginalText] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [customSection, setCustomSection] = useState('');
  const [allSuggestions, setAllSuggestions] = useState<SuggestionRewrite[]>(suggestions);

  // Keep allSuggestions in sync if initial suggestions prop changes
  React.useEffect(() => {
    setAllSuggestions(suggestions);
  }, [suggestions]);

  // Map each suggestion to its corresponding issue in issues[] (single source of truth)
  const findMatchingIssue = (s: SuggestionRewrite): RedTeamCard | undefined => {
    // 1. Explicit ID mapping
    if (s.id === 'sug-1') return issues.find(i => i.id === 'PB-001');
    if (s.id === 'sug-2') return issues.find(i => i.id === 'PB-003');
    if (s.id === 'sug-3') return issues.find(i => i.id === 'PB-002');
    if (s.id === 'sug-4') return issues.find(i => i.id === 'PB-004');
    if (s.id === 'sug-5') return issues.find(i => i.id === 'PB-005');

    // 2. Map by location or quotes
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

  // Helper to determine if an issue is resolved
  const isIssueResolved = (card?: RedTeamCard) => {
    if (!card) return false;
    return card.status === 'Đã xử lý' || card.status === 'resolved';
  };

  // Summary counts calculated DIRECTLY from issues[]
  const seriousCount = issues.filter(c => c.impactLevel === 'Cao').length;
  const warningCount = issues.filter(c => c.impactLevel === 'Trung bình').length;
  const optimizeCount = issues.filter(c => c.impactLevel === 'Thấp').length;
  const resolvedCount = issues.filter(c => isIssueResolved(c)).length;
  const totalCount = issues.length > 0 ? issues.length : allSuggestions.length;

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

  const handleGenerateCustom = async (e: React.FormEvent) => {
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
  };

  // Helper to render text with highlighted placeholders
  const renderFormattedSuggestion = (text: string) => {
    const parts = text.split(/(\[CẦN BỔ SUNG.*?\]|\[XÁC MINH.*?\])/g);
    return parts.map((part, i) => {
      if (/^(\[CẦN BỔ SUNG.*?\]|\[XÁC MINH.*?\])$/.test(part)) {
        return (
          <span
            key={i}
            className="inline-block bg-amber-100 text-amber-950 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[11px] font-sans my-0.5 mx-0.5 shadow-2xs"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Category list
  const categories = [
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'Tính mới & Phương pháp', label: 'Tính mới & Phương pháp' },
    { id: 'Số liệu & Thực nghiệm', label: 'Số liệu & Thực nghiệm' },
    { id: 'Minh chứng & Khảo sát', label: 'Minh chứng & Khảo sát' },
    { id: 'Chuẩn mực trình bày & Trích dẫn', label: 'Quy chuẩn trình bày' }
  ];

  // Filtering logic
  const filteredSuggestions = allSuggestions.filter(s => {
    const matchIssue = findMatchingIssue(s);
    const resolved = isIssueResolved(matchIssue);

    // 1. Priority / Status Filter (Section IV)
    if (priorityFilter === 'must_fix') {
      if (matchIssue && matchIssue.impactLevel !== 'Cao') return false;
    } else if (priorityFilter === 'should_fix') {
      if (matchIssue && matchIssue.impactLevel !== 'Trung bình') return false;
    } else if (priorityFilter === 'optimize') {
      if (matchIssue && matchIssue.impactLevel !== 'Thấp') return false;
    } else if (priorityFilter === 'resolved') {
      if (!resolved) return false;
    }

    // 2. Category Filter
    if (selectedCategory !== 'all') {
      if (s.category && s.category !== selectedCategory) return false;
    }

    // 3. Search query filter
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
      
      {/* Banner - Section I */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-950">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <PenTool className="w-3.5 h-3.5" />
            <span>Chỉ rõ lỗi • Nêu căn cứ • Đề xuất viết lại 3 mức độ • Không viết hộ từ đầu</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            GỢI Ý SỬA & HOÀN THIỆN
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
            Tập trung vào những điểm ảnh hưởng trực tiếp đến chất lượng và điểm đánh giá của sáng kiến.
          </p>
        </div>
      </div>

      {/* Strict Anti-Fabrication Rule Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-amber-950 mb-0.5">
            QUY TẮC BẢO TOÀN LIÊM CHÍNH HỌC THUẬT:
          </strong>
          <span>
            Hệ thống tuyệt đối không tự tạo số liệu khảo sát hay minh chứng giả. Bất kỳ vị trí nào cần dữ liệu thực nghiệm đều được gắn cờ chuẩn hóa: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded border border-amber-300 font-bold">[CẦN BỔ SUNG SỐ LIỆU THỰC TẾ]</code> hoặc <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded border border-amber-300 font-bold">[CẦN BỔ SUNG MINH CHỨNG]</code> để tác giả tự điền số liệu của mình.
          </span>
        </div>
      </div>

      {/* Section IV: Filter & Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
        
        {/* Top line: 5 Quick Priority Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'must_fix'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              <span>🔴 Phải sửa</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[11px]">{seriousCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('should_fix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'should_fix'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              <span>🟠 Nên sửa</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[11px]">{warningCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('optimize')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'optimize'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              <span>🔵 Tối ưu thêm</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[11px]">{optimizeCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã xử lý</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[11px]">{resolvedCount}</span>
            </button>
          </div>

          {/* Real-time Summary from issues[] */}
          <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold self-start lg:self-auto">
            <span className="text-rose-700">Phải sửa: <strong>{seriousCount}</strong></span>
            <span>·</span>
            <span className="text-amber-700">Nên sửa: <strong>{warningCount}</strong></span>
            <span>·</span>
            <span className="text-blue-700">Tối ưu thêm: <strong>{optimizeCount}</strong></span>
            <span>·</span>
            <span className="text-emerald-700">Đã xử lý: <strong>{resolvedCount}</strong></span>
          </div>
        </div>

        {/* Search & Topic Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm gợi ý theo vị trí, từ khóa đoạn gốc hoặc vấn đề..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Chủ đề:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-white shadow-2xs'
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
        <form onSubmit={handleGenerateCustom} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              placeholder="Vị trí (ví dụ: Trang 15, Mục 3.1 - Biện pháp 2)..."
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              value={customProblem}
              onChange={(e) => setCustomProblem(e.target.value)}
              placeholder="Vấn đề cần khắc phục (ví dụ: Tuyên bố tính mới quá mức, thiếu căn cứ)..."
              className="md:col-span-2 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <textarea
              value={customOriginalText}
              onChange={(e) => setCustomOriginalText(e.target.value)}
              placeholder="Dán đoạn văn trong SKKN bạn muốn gợi ý viết lại vào đây..."
              rows={3}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isGenerating || !customOriginalText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tạo gợi ý 3 mức độ...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Tạo gợi ý chỉnh sửa đoạn này</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section V: Suggestions List - Each Item is a Full Suggestion Card */}
      <div className="space-y-6">
        {filteredSuggestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">
              Không tìm thấy gợi ý chỉnh sửa phù hợp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          filteredSuggestions.map((s, idx) => {
            const currentTier = selectedTier[s.id] || 'academic';
            const content = getTierContent(s, currentTier);
            const matchingIssue = findMatchingIssue(s);
            const isDone = isIssueResolved(matchingIssue);

            // Impact badge styling
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
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs space-y-4 p-5 sm:p-6 ${
                  isDone
                    ? 'border-emerald-300 bg-emerald-50/15 opacity-85'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* 1. Header: Vị trí & Vấn đề phát hiện + Nút Đã xử lý (Section V.1 & V.5) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {s.targetSection}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${impactBadge.bg}`}>
                          {impactBadge.label}
                        </span>
                        {s.category && (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {s.category}
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Đã xử lý xong ✓</span>
                          </span>
                        )}
                      </div>
                      {matchingIssue?.affectedCriterion && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tiêu chí ảnh hưởng: <strong>{matchingIssue.affectedCriterion}</strong>
                          {matchingIssue.rubricImpactPoints ? ` (${matchingIssue.rubricImpactPoints})` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* V.5 Nút Đã xử lý / Hoàn tác */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {matchingIssue && onUpdateIssueStatus && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: FindingStatus = isDone ? 'Chưa xử lý' : 'Đã xử lý';
                          onUpdateIssueStatus(matchingIssue.id, nextStatus);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isDone
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Chuyển lại Chưa xử lý</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đánh dấu đã xử lý ✓</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="text-[11px] text-slate-600 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      📌 {s.insertPosition}
                    </span>
                  </div>
                </div>

                {/* 4 Core Pillars Grid: 1. Sai ở đâu - 2. Căn cứ & Vì sao - 3. Hướng khắc phục */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  
                  {/* Pillar 1: Vị trí & Vấn đề phát hiện + Trích đoạn nguyên văn */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      1. Đoạn nguyên văn cần sửa:
                    </span>
                    <p className="font-mono text-slate-800 italic leading-relaxed text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                      "{s.originalText}"
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium pt-1">
                      <strong>Vấn đề phát hiện:</strong> {s.problem}
                    </p>
                  </div>

                  {/* Pillar 2: Căn cứ & Vì sao phải sửa */}
                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-900 uppercase flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-rose-700" />
                      2. Căn cứ & Hậu quả nếu giữ nguyên:
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed text-[11px]">
                      <strong>Căn cứ phản biện:</strong> {s.basis || matchingIssue?.criticismBasis || 'Quy chuẩn nghiên cứu và tiêu chí phiếu chấm Rubric.'}
                    </p>
                    <p className="text-rose-950 font-medium leading-relaxed text-[11px] pt-1 border-t border-rose-200/60">
                      <strong>Hậu quả nếu giữ nguyên:</strong> {s.whyRevise || matchingIssue?.whyItMatters || 'Hội đồng sẽ trừ điểm hoặc xếp vào nhận định chưa đủ căn cứ kết luận.'}
                    </p>
                  </div>

                  {/* Pillar 3: Hướng khắc phục */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 md:col-span-2">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                      3. Hướng khắc phục & Minh chứng cần bổ sung:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-[11px]">
                      <div>
                        <strong className="text-emerald-950 block">Cần làm gì:</strong>
                        <span className="text-slate-800 leading-relaxed">{s.howToRevise || matchingIssue?.resolutionGuidance}</span>
                      </div>
                      <div>
                        <strong className="text-emerald-950 block">Minh chứng cần chuẩn bị:</strong>
                        <span className="text-slate-800 leading-relaxed">{s.missingEvidenceAlert || matchingIssue?.requiredEvidence || 'Không yêu cầu phụ lục bổ sung'}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* V.4 Đề xuất viết lại theo 3 mức độ (3-Tier Tabs Switcher) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'light' }))}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          currentTier === 'light'
                            ? 'bg-white text-slate-900 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        1. SỬA NHẸ (Giữ gần nguyên)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'academic' }))}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          currentTier === 'academic'
                            ? 'bg-white text-blue-700 shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        2. SỬA HỌC THUẬT ⭐ (Khuyên dùng)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'deep' }))}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          currentTier === 'deep'
                            ? 'bg-white text-purple-700 shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        3. SỬA SÂU 🚀 (Tái cấu trúc)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(s.id, content)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedId === s.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">ĐÃ SAO CHÉP!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép đoạn đề xuất</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Proposed Text Box */}
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 whitespace-pre-line font-serif ${
                    currentTier === 'academic'
                      ? 'bg-blue-50/40 border-blue-200 text-blue-950'
                      : currentTier === 'deep'
                      ? 'bg-purple-50/40 border-purple-200 text-purple-950'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-500 pb-1.5 border-b border-black/5">
                      <span>
                        {currentTier === 'light' && '🔹 Mức độ 1: Giữ cấu trúc cũ, trau chuốt từ ngữ & chuẩn hóa số liệu'}
                        {currentTier === 'academic' && '⭐ Mức độ 2: Chuẩn hóa tính sư phạm, lập luận khoa học, mạch lạc logic'}
                        {currentTier === 'deep' && '🚀 Mức độ 3: Tái cấu trúc thành các bước quy trình, phân định đối chứng, kiểm soát biến số'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Click "Sao chép" để dán vào bài viết
                      </span>
                    </div>

                    <div className="text-sm font-sans pt-1 leading-relaxed text-slate-800">
                      {renderFormattedSuggestion(content)}
                    </div>
                  </div>

                  {/* Missing Evidence Alert */}
                  {s.missingEvidenceAlert && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2 shadow-2xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        <strong>Lưu ý minh chứng cần chuẩn bị:</strong> {s.missingEvidenceAlert}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA to next step in workflow: CHẤM LẠI SAU CHỈNH SỬA */}
      {onNavigateTab && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Đã hoàn tất chỉnh sửa nội dung SKKN?
            </h4>
            <p className="text-xs text-slate-500">
              Chuyển sang module Chấm lại để hệ thống đối chiếu thực chất Bản gốc ↔ Bản mới và thẩm định lại điểm Rubric.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('rescore')}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-teal-500/20 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TIẾN HÀNH CHẤM LẠI SAU CHỈNH SỬA →</span>
          </button>
        </div>
      )}

    </div>
  );
};
