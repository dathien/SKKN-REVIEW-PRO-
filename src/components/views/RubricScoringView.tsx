import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  ChevronRight,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { RubricCriterion } from '../../types';
import { InspectorMode } from '../EvidenceInspectorModal';

interface RubricScoringViewProps {
  criteria: RubricCriterion[];
  rubricName: string;
  isOfficial: boolean;
  onOpenInspector: (mode: InspectorMode, criterion: RubricCriterion) => void;
}

export const RubricScoringView: React.FC<RubricScoringViewProps> = ({
  criteria,
  rubricName,
  isOfficial,
  onOpenInspector
}) => {
  const [selectedCriterion, setSelectedCriterion] = useState<RubricCriterion | null>(null);

  const totalProposed = criteria.reduce((sum, c) => sum + c.proposedScore, 0);
  const totalMax = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  // Identify the criterion that needs the most improvement (lowest score percentage)
  const lowestCriterion = [...criteria].sort((a, b) => {
    const pctA = a.maxScore > 0 ? a.proposedScore / a.maxScore : 1;
    const pctB = b.maxScore > 0 ? b.proposedScore / b.maxScore : 1;
    return pctA - pctB;
  })[0];

  const handleOpenLowest = () => {
    if (lowestCriterion) {
      setSelectedCriterion(lowestCriterion);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header bar: Minimalist title + 1 Primary CTA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
              {isOfficial ? 'Phiếu chấm chính thức' : 'Rubric chuẩn (100đ)'}
            </span>
            <span className="text-[13.5px] text-slate-500 font-medium">
              {criteria.length} tiêu chí
            </span>
          </div>
          <h1 className="text-[22px] font-[750] text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            CHẤM RUBRIC
          </h1>
          <p className="text-[14.5px] text-slate-600 mt-1">
            Chấm theo phiếu chấm chính thức
          </p>
        </div>

        {/* 1 Primary Action + Total Score */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-left sm:text-right">
            <span className="text-[13px] uppercase font-bold text-slate-500 block">
              Tổng điểm đề xuất
            </span>
            <span className="text-[28px] font-black text-blue-700 leading-tight">
              {totalProposed.toFixed(1)}{' '}
              <span className="text-[14px] font-semibold text-slate-400">/ {totalMax}đ</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenLowest}
            className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer transition-all shrink-0"
          >
            <AlertTriangle className="w-4.5 h-4.5 text-amber-300" />
            <span>XEM TIÊU CHÍ CẦN CẢI THIỆN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Criteria List - Minimalist format (Tên + Điểm + Progress Bar + [Xem chi tiết →]) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {criteria.map((c, index) => {
          const pct = c.maxScore > 0 ? (c.proposedScore / c.maxScore) * 100 : 0;
          const diff = c.maxScore - c.proposedScore;
          const isFull = diff <= 0.2;

          return (
            <div
              key={c.id}
              className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              {/* Left: Number, Title, Score Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[14px] mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-slate-400 text-[14px]">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <h3 className="font-bold text-slate-900 text-[16px] truncate">
                      {c.criterionName}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1.5 shrink-0 ml-3">
                    <span className="font-black text-slate-900 text-[17px]">
                      {c.proposedScore.toFixed(1)}
                    </span>
                    <span className="text-[13.5px] text-slate-400 font-medium">
                      / {c.maxScore}đ
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      pct >= 85
                        ? 'bg-emerald-500'
                        : pct >= 65
                        ? 'bg-blue-600'
                        : pct >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[13px] mt-1.5">
                  <span className="text-slate-500 font-medium">
                    {c.groupName}
                  </span>
                  <span className={isFull ? 'text-emerald-600 font-semibold' : 'text-amber-700 font-semibold'}>
                    {isFull ? '✓ Đạt điểm tối đa' : `⚠ Bị trừ ${diff.toFixed(1)}đ`}
                  </span>
                </div>
              </div>

              {/* Right Button */}
              <button
                type="button"
                onClick={() => setSelectedCriterion(c)}
                className="shrink-0 self-start sm:self-auto text-[13.5px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Xem chi tiết</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail Drawer for Selected Criterion */}
      {selectedCriterion && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedCriterion(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-slate-200">
              
              {/* Drawer Header */}
              <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="min-w-0">
                  <span className="text-[13px] font-mono uppercase tracking-wider text-slate-400 block">
                    {selectedCriterion.groupName}
                  </span>
                  <h3 className="text-[16px] sm:text-[17px] font-bold text-white truncate mt-0.5">
                    {selectedCriterion.criterionName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCriterion(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[14.5px] text-slate-700">
                
                {/* Score Summary Box */}
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-[13px] uppercase font-bold text-blue-700 block">
                      ĐIỂM ĐÁNH GIÁ
                    </span>
                    <span className="text-2xl font-black text-blue-900">
                      {selectedCriterion.proposedScore.toFixed(1)} / {selectedCriterion.maxScore}đ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] font-bold text-slate-700 block">
                      Vị trí căn cứ
                    </span>
                    <span className="text-[13.5px] text-slate-600 font-medium">
                      {selectedCriterion.basisLocation || 'Toàn bài'}
                    </span>
                  </div>
                </div>

                {/* Trích đoạn căn cứ */}
                {selectedCriterion.shortQuote && (
                  <div className="space-y-1">
                    <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
                      TRÍCH ĐOẠN CĂN CỨ TRONG SKKN
                    </span>
                    <div className="p-3.5 bg-slate-50 rounded-xl border-l-4 border-blue-500 italic text-slate-800 text-[15px] leading-[1.65]">
                      “{selectedCriterion.shortQuote}”
                    </div>
                  </div>
                )}

                {/* Điểm mạnh */}
                <div className="space-y-1">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ĐIỂM MẠNH GHI NHẬN
                  </span>
                  <p className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70 text-slate-800 text-[15px] leading-[1.65]">
                    {selectedCriterion.strengths || 'Tác giả đã trình bày đúng cấu trúc quy định.'}
                  </p>
                </div>

                {/* Hạn chế / Điểm bị trừ */}
                <div className="space-y-1">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    LÝ DO CHƯA ĐẠT ĐIỂM TỐI ĐA
                  </span>
                  <p className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/70 text-slate-800 text-[15px] leading-[1.65]">
                    {selectedCriterion.deductionReason || selectedCriterion.limitations || 'Cần bổ sung thêm minh chứng cụ thể và làm rõ tính mới.'}
                  </p>
                </div>

                {/* Cách cải thiện */}
                <div className="space-y-1">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    HƯỚNG CẢI THIỆN ĐỂ TĂNG ĐIỂM
                  </span>
                  <p className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/70 text-slate-800 text-[15px] leading-[1.65]">
                    {selectedCriterion.improvementGuidance || 'Bổ sung số liệu thực nghiệm và đối sánh với phương pháp truyền thống.'}
                  </p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenInspector('basis', selectedCriterion)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>XEM VỊ TRÍ CĂN CỨ THỰC TẾ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCriterion(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[14px] transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
