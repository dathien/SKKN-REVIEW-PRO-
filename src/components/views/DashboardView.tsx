import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  UploadCloud,
  FileText
} from 'lucide-react';
import { SKKNAnalysisResult, RedTeamCard, FindingStatus, UploadedFileItem } from '../../types';
import { FriendlyErrorInfo } from '../../utils/aiErrorHandler';
import { ActiveTab, AppMode } from '../Sidebar';
import { HeroSlider } from '../HeroSlider';
import { UploadWorkspace } from '../UploadWorkspace';
import { IssueDetailDrawer } from '../IssueDetailDrawer';
import { InspectorMode } from '../EvidenceInspectorModal';

interface DashboardViewProps {
  analysis: SKKNAnalysisResult;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenUpload?: () => void;
  onOpenProfileDrawer?: () => void;
  onViewProfileDetail?: () => void;
  onAnalyzeSKKN?: (
    skknText: string,
    rubricText: string,
    evidenceFiles: UploadedFileItem[],
    notes: string
  ) => Promise<void>;
  isAnalyzing?: boolean;
  isSample?: boolean;
  isDemoMode?: boolean;
  hasActiveEvaluation?: boolean;
  workflowStatus?: 'IDLE' | 'ANALYZING' | 'COMPLETED' | 'ERROR';
  analysisError?: FriendlyErrorInfo | string | null;
  retryState?: { attempt: number; maxAttempts: number } | null;
  onClearError?: () => void;
  onEnterDemo?: () => void;
  onExitDemo?: () => void;
  appMode?: AppMode;
  onUpdateCardStatus?: (id: string, status: FindingStatus, notes?: string) => void;
  onOpenInspector?: (mode: InspectorMode, item: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analysis,
  onNavigateTab,
  onOpenUpload,
  onOpenProfileDrawer,
  onViewProfileDetail,
  onAnalyzeSKKN,
  isAnalyzing = false,
  isSample = false,
  isDemoMode = false,
  hasActiveEvaluation = false,
  workflowStatus = 'IDLE',
  analysisError = null,
  retryState = null,
  onClearError,
  onEnterDemo,
  onExitDemo,
  appMode = 'easy',
  onUpdateCardStatus,
  onOpenInspector
}) => {
  const [selectedCardForDrawer, setSelectedCardForDrawer] = useState<RedTeamCard | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const {
    metadata,
    rubricCriteria,
    redTeamCards,
    sectionsMap,
    evidenceChain
  } = analysis;

  const showResults = isDemoMode || hasActiveEvaluation || workflowStatus === 'COMPLETED';

  // Calculations (Safe without hardcoded values - Item 4)
  const hasRubricCriteria = Array.isArray(rubricCriteria) && rubricCriteria.length > 0;
  const totalScore = hasRubricCriteria ? rubricCriteria.reduce((sum, c) => sum + (c.proposedScore || 0), 0) : 0;
  const maxScore = hasRubricCriteria ? rubricCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0) : 100;
  const canShowScore = hasRubricCriteria && maxScore > 0 && totalScore > 0;

  const isDoneCard = (c: RedTeamCard) => c.status === 'Đã xử lý' || c.status === 'resolved';
  const seriousCount = redTeamCards.filter(c => c.impactLevel === 'Cao').length;
  const warningCount = redTeamCards.filter(c => c.impactLevel === 'Trung bình').length;
  const missingEvidenceCount = evidenceChain.filter(e => e.status === 'chua_tim_thay_minh_chung').length;
  const resolvedCount = redTeamCards.filter(c => isDoneCard(c)).length;
  const totalIssuesCount = redTeamCards.length;
  const isAllResolved = totalIssuesCount > 0 && resolvedCount === totalIssuesCount;

  // Sắp xếp: PHẢI SỬA → NÊN SỬA → TỐI ƯU THÊM (Item 10)
  const severityOrder: Record<string, number> = {
    'Cao': 1,
    'critical': 1,
    'Trung bình': 2,
    'warning': 2,
    'Thấp': 3,
    'improvement': 3
  };

  const sortedCards = [...redTeamCards].sort((a, b) => {
    if (isDoneCard(a) && !isDoneCard(b)) return 1;
    if (!isDoneCard(a) && isDoneCard(b)) return -1;
    const orderA = severityOrder[a.impactLevel] || 2;
    const orderB = severityOrder[b.impactLevel] || 2;
    return orderA - orderB;
  });

  const unresolvedCards = sortedCards.filter(c => !isDoneCard(c));
  const firstUnresolved = unresolvedCards[0] || sortedCards[0];

  const handleOpenDrawer = (card: RedTeamCard) => {
    setSelectedCardForDrawer(card);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedCardForDrawer(null);
  };

  // Find next unresolved card for the drawer
  const nextUnresolvedForDrawer = unresolvedCards.find(c => c.id !== selectedCardForDrawer?.id);

  const handleNextIssue = () => {
    if (nextUnresolvedForDrawer) {
      setSelectedCardForDrawer(nextUnresolvedForDrawer);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-4xl mx-auto animate-in fade-in slide-in-from-left-2.5 duration-200">
      
      {/* DEMO MODE TOP BANNER */}
      {isDemoMode && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExitDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>← Quay lại chấm SKKN của tôi</span>
            </button>

            <div className="h-4 w-px bg-amber-200 hidden sm:block shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 shrink-0">
                HỒ SƠ MẪU
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate" title={metadata.title}>
                {metadata.title}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-amber-800 font-medium shrink-0">
            Đang xem kết quả thẩm định mẫu
          </span>
        </div>
      )}

      {/* 1. HERO SLIDER GỌN, TRỰC QUAN */}
      <HeroSlider
        analysis={analysis}
        isSample={isSample}
        isDemoMode={isDemoMode}
        hasActiveEvaluation={hasActiveEvaluation}
        onEnterDemo={onEnterDemo}
        onExitDemo={onExitDemo}
        onOpenProfileDrawer={onOpenProfileDrawer}
        onViewProfileDetail={onViewProfileDetail}
        onStartNewSKKN={onOpenUpload}
        onOpenFirstIssue={() => {
          if (firstUnresolved) {
            handleOpenDrawer(firstUnresolved);
          } else {
            onNavigateTab('red_team');
          }
        }}
        onNavigateTab={onNavigateTab}
        onScrollToIssues={() => {
          const el = document.getElementById('issues-list-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else if (firstUnresolved) {
            handleOpenDrawer(firstUnresolved);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 2. TẠO HỒ SƠ ĐÁNH GIÁ (ẨN KHI Ở DEMO MODE)                                 */}
      {/* ========================================================================= */}
      {!isDemoMode && onAnalyzeSKKN && (
        <UploadWorkspace
          onAnalyze={onAnalyzeSKKN}
          isLoading={isAnalyzing}
          retryState={retryState}
          hasExistingAnalysis={hasActiveEvaluation}
          isSample={false}
          isCustomAnalyzed={hasActiveEvaluation}
          currentProfileTitle={metadata.title}
          currentProfileAuthor={metadata.author}
          onOpenProfileDrawer={onOpenProfileDrawer}
          onViewProfileDetail={onViewProfileDetail}
          onViewDemo={onEnterDemo}
          analysisError={analysisError}
          onClearError={onClearError}
          issuesCount={totalIssuesCount - resolvedCount}
          isAllResolved={isAllResolved}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. KẾT QUẢ ĐÁNH GIÁ VÀ VIỆC CẦN XỬ LÝ (CHỈ HIỂN THỊ KHI ĐÃ ĐƯỢC ĐÁNH GIÁ) */}
      {/* ========================================================================= */}
      {showResults ? (
        <>
          <div id="evaluation-results-section" className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4 scroll-mt-6">
        
        {isAllResolved ? (
          // Trạng thái khi 5/5 vấn đề đã xử lý
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SẴN SÀNG CHẤM LẠI</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {totalIssuesCount}/{totalIssuesCount} vấn đề đã được xử lý thành công.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bản chỉnh sửa đã sẵn sàng để đối chiếu và nâng điểm chính thức.
                </p>
              </div>

              {/* CTA Duy nhất: CHẤM LẠI */}
              <button
                type="button"
                onClick={() => onNavigateTab('rescore')}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm shadow-blue-600/25 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>CHẤM LẠI →</span>
              </button>
            </div>
          </div>
        ) : (
          // Trạng thái tiêu chuẩn: Kết quả đánh giá
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    KẾT QUẢ ĐÁNH GIÁ
                  </span>
                  {isSample && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                      HỒ SƠ MẪU
                    </span>
                  )}
                </div>
                
                {/* Điểm vừa vặn, không chiếm toàn bộ panel (Không tạo điểm giả - Item 4) */}
                {canShowScore ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {totalScore.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-slate-400">
                      / {maxScore}
                    </span>
                    
                    {metadata.isOfficialRubric && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {metadata.appliedRubricName || 'Rubric chính thức'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block">
                      Chưa đủ căn cứ để chấm điểm tổng
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Các vấn đề phản biện vẫn được phân tích đầy đủ và chi tiết bên dưới.
                    </p>
                  </div>
                )}
              </div>

              {/* Dòng tóm tắt vấn đề */}
              <div className="text-xs text-slate-600 sm:text-right">
                <span className="font-semibold text-slate-800 block mb-1">
                  Tổng cộng: {totalIssuesCount} vấn đề · Đã xử lý: {resolvedCount} · Còn: {totalIssuesCount - resolvedCount}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap sm:justify-end">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                    <span>{seriousCount} phải sửa</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span>{warningCount} nên xem</span>
                  </span>
                  {missingEvidenceCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="text-amber-600 font-bold inline-block">△</span>
                      <span>{missingEvidenceCount} thiếu minh chứng</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CTA DUY NHẤT: Primary Blue, Không dùng nút đỏ */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (firstUnresolved) {
                    handleOpenDrawer(firstUnresolved);
                  } else {
                    onNavigateTab('rescore');
                  }
                }}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm shadow-blue-600/25 transition-all cursor-pointer"
              >
                <span>XEM & XỬ LÝ {totalIssuesCount - resolvedCount} VẤN ĐỀ →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. VIỆC CẦN XỬ LÝ LÀ TRỌNG TÂM (Dạng list đơn giản, white space + divider) */}
      {/* ========================================================================= */}
      <div id="issues-list-section" className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4 scroll-mt-6">
        
        {/* Header danh sách: CẦN XỬ LÝ           0/5 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            CẦN XỬ LÝ
          </h2>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {resolvedCount}/{totalIssuesCount}
          </span>
        </div>

        {/* List items - Sắp xếp: PHẢI SỬA → NÊN SỬA → TỐI ƯU THÊM (Mục 17, 18) */}
        <div className="divide-y divide-slate-100">
          {sortedCards.map((card) => {
            const isDone = isDoneCard(card);
            const isHigh = card.impactLevel === 'Cao';
            const isMed = card.impactLevel === 'Trung bình';
            const severityLabel = isHigh ? 'PHẢI SỬA' : isMed ? 'NÊN SỬA' : 'TỐI ƯU THÊM';
            const severityBadgeStyle = isHigh
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : isMed
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-700 border-slate-200';
            const dotColor = isHigh ? 'bg-rose-600' : isMed ? 'bg-amber-500' : 'bg-blue-500';

            return (
              <div
                key={card.id}
                className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group -mx-3 px-3 rounded-xl transition-all cursor-pointer ${
                  isDone
                    ? 'opacity-60 bg-slate-50/50 hover:bg-slate-100/60'
                    : 'hover:bg-blue-50/40 bg-white'
                }`}
                onClick={() => handleOpenDrawer(card)}
              >
                {/* Left: Icon trạng thái + Mức độ + Tên vấn đề + Vị trí */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor} block`} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* ● Mức độ + Tên vấn đề + Đã xử lý */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadgeStyle}`}>
                        ● {severityLabel}
                      </span>
                      <span className={`text-xs font-bold truncate ${isDone ? 'text-slate-500' : 'text-slate-900'}`}>
                        {card.issueType || card.issueDetected || 'Vấn đề phản biện'}
                      </span>
                      {isDone && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Đã xử lý
                        </span>
                      )}
                    </div>

                    {/* 📍 Vị trí */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-600 shrink-0">📍 Vị trí:</span>
                      <span className="truncate">{card.location || 'Toàn văn sáng kiến'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: [ XỬ LÝ → ] */}
                <div className="shrink-0 sm:self-center pl-8 sm:pl-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDrawer(card);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs'
                    }`}
                  >
                    <span>{isDone ? 'Xem lại' : 'XỬ LÝ'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CẤU TRÚC VĂN BẢN (SKKN Map thu gọn mặc định)                           */}
      {/* ========================================================================= */}
      {sectionsMap && sectionsMap.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Cấu trúc văn bản ({sectionsMap.length} mục)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{isMapExpanded ? 'Thu gọn' : 'Xem cấu trúc'}</span>
              {isMapExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isMapExpanded && (
            <div className="p-4 pt-0 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              {sectionsMap.map((sec, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <span className="truncate">{sec.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                    {sec.page ? `Trang ${sec.page}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </>
    ) : (
      <div className="text-center py-6">
        <p className="text-xs text-slate-400">
          Chưa có kết quả đánh giá.
        </p>
      </div>
    )}

      {/* Issue Detail Modal (Centered) */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        card={selectedCardForDrawer}
        cards={sortedCards}
        onSelectCard={(c: RedTeamCard) => setSelectedCardForDrawer(c)}
        onUpdateStatus={onUpdateCardStatus}
        onOpenInspector={(c: RedTeamCard) => {
          if (onOpenInspector) onOpenInspector('basis', c);
        }}
        onGoToSuggestion={(c: RedTeamCard) => {
          onNavigateTab('suggestions');
        }}
        onNextIssue={handleNextIssue}
        hasNextIssue={Boolean(nextUnresolvedForDrawer)}
        onGoToRescore={() => {
          onNavigateTab('rescore');
        }}
      />

    </div>
  );
};
