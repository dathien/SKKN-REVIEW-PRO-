import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { RedTeamCard, FindingStatus } from '../../types';
import { InspectorMode } from '../EvidenceInspectorModal';
import { IssueDetailDrawer } from '../IssueDetailDrawer';

interface RedTeamViewProps {
  cards: RedTeamCard[];
  onUpdateCardStatus: (id: string, status: FindingStatus, notes?: string) => void;
  onOpenInspector: (mode: InspectorMode, card: RedTeamCard) => void;
  onGoToSuggestionForCard?: (card: RedTeamCard) => void;
}

export const RedTeamView: React.FC<RedTeamViewProps> = ({
  cards,
  onUpdateCardStatus,
  onOpenInspector,
  onGoToSuggestionForCard
}) => {
  const [selectedCard, setSelectedCard] = useState<RedTeamCard | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sắp xếp: PHẢI SỬA → NÊN SỬA → TỐI ƯU THÊM (Mục 18)
  const severityOrder: Record<string, number> = {
    'Cao': 1,
    'critical': 1,
    'Trung bình': 2,
    'warning': 2,
    'Thấp': 3,
    'improvement': 3
  };

  const sortedCards = [...cards].sort((a, b) => {
    if (a.status === 'Đã xử lý' && b.status !== 'Đã xử lý') return 1;
    if (a.status !== 'Đã xử lý' && b.status === 'Đã xử lý') return -1;
    const orderA = severityOrder[a.impactLevel] || 2;
    const orderB = severityOrder[b.impactLevel] || 2;
    return orderA - orderB;
  });

  const seriousCount = cards.filter(c => c.impactLevel === 'Cao').length;
  const warningCount = cards.filter(c => c.impactLevel === 'Trung bình' || c.impactLevel === 'Thấp').length;
  const resolvedCount = cards.filter(c => c.status === 'Đã xử lý').length;
  const totalCount = cards.length;

  const handleOpenCard = (card: RedTeamCard) => {
    setSelectedCard(card);
    setIsDrawerOpen(true);
  };

  const handlePrimaryAction = () => {
    const firstUnresolved = sortedCards.find(c => c.status !== 'Đã xử lý') || sortedCards[0];
    if (firstUnresolved) {
      handleOpenCard(firstUnresolved);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header bar: Minimalist summary + 1 Primary CTA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
              {resolvedCount}/{totalCount} ĐÃ XỬ LÝ
            </span>
            <span className="text-xs text-slate-500">
              {totalCount} vấn đề phản biện
            </span>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            CẦN XỬ LÝ
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-medium">
            <span className="flex items-center gap-1 text-rose-700 font-bold">
              <span>🔴</span> {seriousCount} phải sửa
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span>🟠</span> {warningCount} nên sửa
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span>✓</span> {resolvedCount} đã đánh dấu xử lý
            </span>
          </div>
        </div>

        {/* 1 Primary Action */}
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 cursor-pointer transition-all shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>XỬ LÝ VẤN ĐỀ ({totalCount - resolvedCount} CHƯA XỬ LÝ)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Minimalist List Format: 01. Issue title [Xem & xử lý →] */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {sortedCards.map((card, index) => {
          const isHigh = card.impactLevel === 'Cao';
          const isMed = card.impactLevel === 'Trung bình';
          const severityLabel = isHigh ? '🔴 Phải sửa' : isMed ? '🟠 Nên sửa' : '🔵 Tối ưu thêm';
          const badgeStyle = isHigh
            ? 'bg-rose-100 text-rose-800'
            : isMed
            ? 'bg-amber-100 text-amber-800'
            : 'bg-blue-100 text-blue-800';
          const isDone = card.status === 'Đã xử lý';

          return (
            <div
              key={card.id}
              className={`p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                isDone ? 'opacity-60 bg-slate-50/40' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-bold text-xs text-slate-400 shrink-0">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${badgeStyle}`}>
                  {severityLabel}
                </span>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {card.issueDetected}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-slate-700">{card.location}</span>
                    <span>•</span>
                    <span className="truncate max-w-[260px]">{card.affectedCriterion}</span>
                    {isDone && (
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded ml-1">
                        ✓ Đã xử lý
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleOpenCard(card)}
                className="shrink-0 self-start sm:self-auto text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{isDone ? 'Xem lại' : 'Xem & xử lý'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Centered Modal Xử lý vấn đề */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        cards={sortedCards}
        onSelectCard={(c) => setSelectedCard(c)}
        onUpdateStatus={onUpdateCardStatus}
        onOpenInspector={(card) => onOpenInspector('basis', card)}
        onGoToSuggestion={onGoToSuggestionForCard}
      />

    </div>
  );
};
