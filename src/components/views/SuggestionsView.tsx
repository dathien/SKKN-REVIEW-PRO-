import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  FileText,
  Layers,
  ArrowRight,
  Send,
  HelpCircle
} from 'lucide-react';
import { SuggestionRewrite } from '../../types';

interface SuggestionsViewProps {
  suggestions: SuggestionRewrite[];
  onGenerateCustomSuggestion: (originalText: string, problem: string, section: string) => Promise<SuggestionRewrite>;
  isGenerating?: boolean;
}

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  suggestions,
  onGenerateCustomSuggestion,
  isGenerating
}) => {
  const [selectedTier, setSelectedTier] = useState<Record<string, 'light' | 'academic' | 'deep'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom rewrite input state
  const [customOriginalText, setCustomOriginalText] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [customSection, setCustomSection] = useState('');
  const [allSuggestions, setAllSuggestions] = useState<SuggestionRewrite[]>(suggestions);

  // Keep allSuggestions in sync if initial suggestions prop changes
  React.useEffect(() => {
    setAllSuggestions(suggestions);
  }, [suggestions]);

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
        customProblem || 'Cần chuẩn hóa văn phong học thuật và khắc phục cách diễn đạt chung chung',
        customSection || 'Đoạn người dùng gửi'
      );
      setAllSuggestions(prev => [newSug, ...prev]);
      setCustomOriginalText('');
      setCustomProblem('');
      setCustomSection('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-purple-950">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            <PenTool className="w-3.5 h-3.5" />
            <span>Chỉnh sửa trúng điểm yếu – Không bịa số liệu</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            GỢI Ý CHỈNH SỬA & VIẾT LẠI THEO 3 MỨC ĐỘ
          </h1>
          <p className="text-xs text-purple-100/80 leading-relaxed">
            Hệ thống không tự viết lại toàn bộ SKKN để thay thế nghiên cứu của giáo viên. Chúng tôi cung cấp giải pháp chỉnh sửa có chọn lọc ở 3 mức: <strong>Sửa nhẹ</strong> (giữ nguyên tứ), <strong>Sửa học thuật</strong> (chuẩn hóa sư phạm), và <strong>Sửa sâu</strong> (tái cấu trúc lập luận).
          </p>
        </div>
      </div>

      {/* Strict Anti-Fabrication Rule Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-amber-950 mb-0.5">
            QUY TẮC BẢO TOÀN LIÊM CHÍNH HỌC THUẬT:
          </strong>
          <span>
            Hệ thống tuyệt đối không tự tạo số liệu khảo sát hay minh chứng giả. Bất kỳ vị trí nào cần dữ liệu thực nghiệm sẽ được gắn cờ chuẩn hóa: <code>[CẦN BỔ SUNG SỐ LIỆU THỰC TẾ]</code> hoặc <code>[CẦN BỔ SUNG MINH CHỨNG]</code> để tác giả tự điền số liệu của mình.
          </span>
        </div>
      </div>

      {/* Interactive Custom Excerpt Rewrite Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Yêu cầu gợi ý viết lại một đoạn văn cụ thể từ SKKN của bạn:
        </h3>
        <form onSubmit={handleGenerateCustom} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              placeholder="Vị trí (ví dụ: Trang 15, Mục 3.1 - Biện pháp 2)..."
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <input
              type="text"
              value={customProblem}
              onChange={(e) => setCustomProblem(e.target.value)}
              placeholder="Vấn đề cần khắc phục (ví dụ: Tuyên bố tính mới quá mức, thiếu căn cứ)..."
              className="md:col-span-2 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div>
            <textarea
              value={customOriginalText}
              onChange={(e) => setCustomOriginalText(e.target.value)}
              placeholder="Dán đoạn văn trong SKKN bạn muốn gợi ý viết lại vào đây..."
              rows={3}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isGenerating || !customOriginalText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
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

      {/* Suggestions List */}
      <div className="space-y-6">
        {allSuggestions.map((s, idx) => {
          const currentTier = selectedTier[s.id] || 'academic';
          const content = getTierContent(s, currentTier);

          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {s.targetSection}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Mục tiêu: <strong>{s.revisionGoal}</strong>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                  Vị trí thay thế: {s.insertPosition}
                </span>
              </div>

              {/* Original Excerpt & Problem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Đoạn nguyên văn gốc:
                  </span>
                  <p className="font-mono text-slate-800 italic leading-relaxed">
                    "{s.originalText}"
                  </p>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-rose-900 uppercase block">
                    Vấn đề & Lý do cần sửa:
                  </span>
                  <p className="text-rose-950 font-medium leading-relaxed">
                    {s.problem}
                  </p>
                  <p className="text-slate-700 leading-relaxed text-[11px] pt-1">
                    <strong>Giải thích:</strong> {s.whyRevise}
                  </p>
                </div>
              </div>

              {/* 3-Tier Switcher Tabs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
                    <button
                      onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'light' }))}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        currentTier === 'light'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1. SỬA NHẸ (Giữ gần nguyên)
                    </button>
                    <button
                      onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'academic' }))}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        currentTier === 'academic'
                          ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2. SỬA HỌC THUẬT (Khuyên dùng)
                    </button>
                    <button
                      onClick={() => setSelectedTier(prev => ({ ...prev, [s.id]: 'deep' }))}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        currentTier === 'deep'
                          ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3. SỬA SÂU (Tái cấu trúc)
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopy(s.id, content)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    {copiedId === s.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã sao chép!</span>
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
                  <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-500 pb-1 border-b border-black/5">
                    <span>
                      {currentTier === 'light' && '🔹 Mức độ: Giữ cấu trúc cũ, trau chuốt từ ngữ'}
                      {currentTier === 'academic' && '⭐ Mức độ: Cải thiện logic, tính sư phạm và ngôn từ nghiên cứu'}
                      {currentTier === 'deep' && '🚀 Mức độ: Tổ chức lại thành các bước bài bản, chỉ rõ vị trí điền số liệu'}
                    </span>
                  </div>
                  <div className="text-sm font-sans pt-1">
                    {content}
                  </div>
                </div>

                {/* Missing Evidence Alert */}
                {s.missingEvidenceAlert && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Lưu ý minh chứng: {s.missingEvidenceAlert}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
