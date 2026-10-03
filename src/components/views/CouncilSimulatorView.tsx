import React, { useState } from 'react';
import {
  MessageSquareWarning,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  FileCheck,
  Compass,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CouncilQuestion } from '../../types';

interface CouncilSimulatorViewProps {
  questions: CouncilQuestion[];
  onGenerateMoreQuestions: () => Promise<void>;
  isLoadingMore?: boolean;
}

export const CouncilSimulatorView: React.FC<CouncilSimulatorViewProps> = ({
  questions,
  onGenerateMoreQuestions,
  isLoadingMore
}) => {
  const [filterDiff, setFilterDiff] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'practice'>('all');

  // Practice mode states
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [userDraftAnswer, setUserDraftAnswer] = useState('');
  const [showAnswerGuide, setShowAnswerGuide] = useState(false);

  const getDifficultyBadge = (diff: string) => {
    if (diff.includes('khó')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (diff.includes('chuẩn bị')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const filteredQuestions = filterDiff === 'All'
    ? questions
    : questions.filter(q => q.difficulty.includes(filterDiff));

  const currentQ = questions[currentPracticeIndex] || questions[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-amber-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>Mô phỏng phỏng vấn bảo vệ sáng kiến</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              HỘI ĐỒNG SẼ HỎI GÌ? (COUNCIL SIMULATOR)
            </h1>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Dự báo chính xác các câu hỏi chất vấn khó tính nhất từ hội đồng thẩm định dựa trên các điểm yếu thực tế về số liệu, tính mới và minh chứng trong SKKN.
            </p>
          </div>

          <button
            onClick={onGenerateMoreQuestions}
            disabled={isLoadingMore}
            className="px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-600" />
            )}
            <span>Hỏi thêm câu hỏi mới từ AI</span>
          </button>
        </div>
      </div>

      {/* Switcher: List vs Practice Mode */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh sách tất cả câu hỏi ({questions.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('practice');
              setShowAnswerGuide(false);
              setUserDraftAnswer('');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'practice'
                ? 'bg-white text-blue-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Chế độ luyện tập trả lời thử
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Mức độ:</span>
            {['All', 'khó', 'chuẩn bị', 'làm rõ'].map((d) => (
              <button
                key={d}
                onClick={() => setFilterDiff(d)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize ${
                  filterDiff === d
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'All' ? 'Tất cả' : d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: PRACTICE MODE */}
      {activeTab === 'practice' && currentQ && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Câu hỏi {currentPracticeIndex + 1} / {questions.length}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDifficultyBadge(currentQ.difficulty)}`}>
              {currentQ.difficulty}
            </span>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Hội đồng giám khảo hỏi:
            </span>
            <h3 className="text-base font-bold leading-relaxed text-amber-50">
              "{currentQ.question}"
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>📍 Căn cứ: <strong>{currentQ.relatedLocation}</strong></span>
              <span>•</span>
              <span>Mục đích: {currentQ.whyCouncilAsks}</span>
            </div>
          </div>

          {/* User draft answer */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Nhập câu trả lời nháp của bạn để tự kiểm tra:
            </label>
            <textarea
              value={userDraftAnswer}
              onChange={(e) => setUserDraftAnswer(e.target.value)}
              placeholder="Ghi vắn tắt ý chính bạn sẽ trình bày trước hội đồng..."
              rows={4}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setShowAnswerGuide(!showAnswerGuide)}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl border border-amber-200 text-xs transition-colors"
            >
              {showAnswerGuide ? 'Ẩn gợi ý đối phó' : '💡 Xem gợi ý hướng trả lời & minh chứng cần mang theo'}
            </button>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPracticeIndex === 0}
                onClick={() => {
                  setCurrentPracticeIndex(prev => Math.max(0, prev - 1));
                  setShowAnswerGuide(false);
                  setUserDraftAnswer('');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs disabled:opacity-40"
              >
                Câu trước
              </button>
              <button
                disabled={currentPracticeIndex >= questions.length - 1}
                onClick={() => {
                  setCurrentPracticeIndex(prev => Math.min(questions.length - 1, prev + 1));
                  setShowAnswerGuide(false);
                  setUserDraftAnswer('');
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs disabled:opacity-40"
              >
                Câu tiếp theo
              </button>
            </div>
          </div>

          {/* Answer guidance panel */}
          {showAnswerGuide && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
              <div>
                <span className="font-bold text-emerald-950 block text-[11px] uppercase mb-1">
                  📁 Minh chứng tác giả cần chuẩn bị mang theo:
                </span>
                <p className="text-slate-800 font-medium">
                  {currentQ.requiredEvidenceToBring}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200/60">
                <span className="font-bold text-emerald-950 block text-[11px] uppercase mb-1">
                  ⭐ Gợi ý chiến lược trả lời (Bản lĩnh - Trung thực - Sư phạm):
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {currentQ.suggestedAnswerStrategy}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALL QUESTIONS LIST */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    📍 {q.relatedLocation}
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Câu hỏi hội đồng có thể sẽ chất vấn:
                </span>
                <h4 className="text-xs font-bold text-slate-900 leading-relaxed">
                  "{q.question}"
                </h4>
              </div>

              {/* Rationale and Strategy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                  <span className="font-bold text-amber-900 block text-[11px]">
                    Vì sao hội đồng lại hỏi câu này?
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {q.whyCouncilAsks}
                  </p>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-bold text-blue-900 block text-[11px]">
                    Tác giả cần chuẩn bị minh chứng gì?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {q.requiredEvidenceToBring}
                  </p>
                </div>
              </div>

              {/* Suggested Answer Strategy */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Gợi ý hướng trả lời (Không bịa đặt số liệu):
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {q.suggestedAnswerStrategy}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
