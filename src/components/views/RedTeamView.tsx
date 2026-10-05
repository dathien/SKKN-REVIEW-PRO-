import React, { useMemo } from 'react';
import {
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { RedTeamCard, FindingStatus } from '../../types';
import { InspectorMode } from '../EvidenceInspectorModal';

interface RedTeamViewProps {
  cards: RedTeamCard[];
  onOpenCardModal?: (card: RedTeamCard) => void;
  onUpdateCardStatus?: (id: string, status: FindingStatus, notes?: string) => void;
  onUpdateStatus?: (cardId: string, status: FindingStatus) => void;
  onOpenInspector?: (mode: InspectorMode, target: RedTeamCard) => void;
  onGoToSuggestionForCard?: (card: RedTeamCard) => void;
}

export const RedTeamView: React.FC<RedTeamViewProps> = ({
  cards,
  onOpenCardModal,
  onUpdateCardStatus,
  onUpdateStatus,
  onOpenInspector,
  onGoToSuggestionForCard
}) => {
  // Sort priority: Serious (Cao) -> Warning (Trung bình) -> Minor (Thấp) -> Done
  const sortedCards = useMemo(() => {
    const priorityWeights: Record<string, number> = {
      'Cao': 1,
      'Trung bình': 2,
      'Thấp': 3
    };

    return [...cards].sort((a, b) => {
      const aDone = a.status === 'Đã xử lý' || a.status === 'resolved' || a.status === 'Bỏ qua';
      const bDone = b.status === 'Đã xử lý' || b.status === 'resolved' || b.status === 'Bỏ qua';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      const pA = priorityWeights[a.impactLevel] || 99;
      const pB = priorityWeights[b.impactLevel] || 99;
      return pA - pB;
    });
  }, [cards]);

  const totalCount = cards.length;
  const resolvedCount = cards.filter(c => c.status === 'Đã xử lý' || c.status === 'resolved').length;
  const seriousCount = cards.filter(c => c.impactLevel === 'Cao').length;
  const warningCount = cards.filter(c => c.impactLevel === 'Trung bình').length;

  const handleOpenCard = (card: RedTeamCard) => {
    if (onOpenCardModal) {
      onOpenCardModal(card);
    } else if (onOpenInspector) {
      onOpenInspector('basis', card);
    } else if (onGoToSuggestionForCard) {
      onGoToSuggestionForCard(card);
    }
  };

  const handlePrimaryAction = () => {
    const firstUnresolved = sortedCards.find(
      c => c.status !== 'Đã xử lý' && c.status !== 'resolved' && c.status !== 'Bỏ qua'
    );
    if (firstUnresolved) {
      handleOpenCard(firstUnresolved);
    } else if (sortedCards.length > 0) {
      handleOpenCard(sortedCards[0]);
    }
  };

  return (
    <div
      className="space-y-6 pb-12 select-none"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      
      {/* ========================================================================= */}
      {/* 1. HEADER MODULE (Section XXVI & XXXVIII: 22-24px / font-bold 700)        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[12.5px] sm:text-[13px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
              {resolvedCount}/{totalCount} ĐÃ XỬ LÝ
            </span>
            <span className="text-[13px] sm:text-[14px] text-slate-500 font-medium">
              {totalCount} vấn đề phản biện học thuật
            </span>
          </div>
          
          <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight leading-[1.3] flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-blue-600 shrink-0" />
            <span>CẦN XỬ LÝ</span>
          </h1>

          <div className="flex items-center gap-3 text-[14px] text-slate-600 mt-1 font-medium flex-wrap">
            <span className="flex items-center gap-1.5 text-rose-700 font-bold">
              <span>🔴</span> {seriousCount} phải sửa
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-amber-700 font-bold">
              <span>🟠</span> {warningCount} nên sửa
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span>✓</span> {resolvedCount} đã đánh dấu xử lý
            </span>
          </div>
        </div>

        {/* 1 Primary Action (Section XXXIII: 14-15px font 600) */}
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>XỬ LÝ VẤN ĐỀ ({totalCount - resolvedCount} CHƯA XỬ LÝ)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. DANH SÁCH VẤN ĐỀ (Section XXXVIII: Tên 16-17px/700, Meta 13-14px, Nút 14px) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {sortedCards.map((card, index) => {
          const isHigh = card.impactLevel === 'Cao';
          const isMed = card.impactLevel === 'Trung bình';
          const severityLabel = isHigh ? '🔴 Phải sửa' : isMed ? '🟠 Nên sửa' : '🔵 Tối ưu thêm';
          const badgeStyle = isHigh
            ? 'bg-rose-100 text-rose-800 border border-rose-200'
            : isMed
            ? 'bg-amber-100 text-amber-800 border border-amber-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200';
          const isDone = card.status === 'Đã xử lý' || card.status === 'resolved';
          const isIgnored = card.status === 'Bỏ qua' || card.status === 'ignored' || card.status === 'Tác giả không đồng ý';
          const isInProgress = card.status === 'Đang xử lý' || card.status === 'in_progress';

          return (
            <div
              key={card.id}
              className={`p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                isDone ? 'opacity-70 bg-slate-50/50' : isIgnored ? 'opacity-60 bg-slate-50/40' : ''
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span className="font-mono font-bold text-[14px] text-slate-400 shrink-0 mt-0.5 sm:mt-0">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                
                <span className={`text-[12.5px] sm:text-[13px] font-bold px-2.5 py-0.5 rounded-md shrink-0 mt-0.5 sm:mt-0 ${badgeStyle}`}>
                  {severityLabel}
                </span>

                <div className="min-w-0">
                  <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-[1.4] truncate">
                    {card.issueDetected}
                  </h3>
                  <div className="text-[13px] sm:text-[14px] text-slate-600 leading-[1.5] flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-semibold text-slate-800">📍 {card.location}</span>
                    <span>•</span>
                    <span className="truncate max-w-[280px]">Tiêu chí: {card.affectedCriterion}</span>
                    {isDone && (
                      <span className="text-emerald-800 font-bold text-[12px] bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                        ✓ Đã xử lý
                      </span>
                    )}
                    {isInProgress && (
                      <span className="text-blue-800 font-bold text-[12px] bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300">
                        ⚡ Đang xử lý
                      </span>
                    )}
                    {isIgnored && (
                      <span className="text-slate-700 font-bold text-[12px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                        Bỏ qua
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button (Section XXXIII: 14-15px font 600) */}
              <button
                type="button"
                onClick={() => handleOpenCard(card)}
                className="shrink-0 self-start sm:self-auto text-[14px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>{isDone ? 'Xem lại' : 'Xem & xử lý'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
