/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ActiveTab, AppMode } from './components/Sidebar';
import { Header } from './components/Header';
import { FileUploadModal } from './components/FileUploadModal';
import { EvidenceInspectorModal, InspectorMode } from './components/EvidenceInspectorModal';
import { CorePrinciplesModal } from './components/CorePrinciplesModal';
import { DocumentProfileDrawer } from './components/DocumentProfileDrawer';
import { ProfileSelectorModal } from './components/ProfileSelectorModal';
import { UploadWorkspace } from './components/UploadWorkspace';
import { CheckCircle2, FileText } from 'lucide-react';
import { FriendlyErrorInfo, classifyError, sleep, getRetryDelay } from './utils/aiErrorHandler';
import { extractGeminiOutput, parseAnalysisResponse, normalizeAnalysisResult } from './utils/analysisPipeline';

export type WorkflowStatus = 'IDLE' | 'ANALYZING' | 'COMPLETED' | 'ERROR';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ProfileDetailView } from './components/views/ProfileDetailView';
import { RubricScoringView } from './components/views/RubricScoringView';
import { RedTeamView } from './components/views/RedTeamView';
import { NoveltyMapView } from './components/views/NoveltyMapView';
import { EvidenceMapView } from './components/views/EvidenceMapView';
import { DataLogicAuditView } from './components/views/DataLogicAuditView';
import { AiMarkersView } from './components/views/AiMarkersView';
import { SimilarityCitationsView } from './components/views/SimilarityCitationsView';
import { SuggestionsView } from './components/views/SuggestionsView';
import { CouncilSimulatorView } from './components/views/CouncilSimulatorView';
import { RescoreView } from './components/views/RescoreView';
import { ReportView } from './components/views/ReportView';

// Sample Data & Types
import { sampleInitiative1, sampleInitiative2 } from './services/sampleData';
import {
  SKKNAnalysisResult,
  FindingStatus,
  RubricCriterion,
  RedTeamCard,
  UploadedFileItem,
  SuggestionRewrite,
  CouncilQuestion
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [analysis, setAnalysis] = useState<SKKNAnalysisResult>(sampleInitiative1);
  const [customAnalysis, setCustomAnalysis] = useState<SKKNAnalysisResult | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isViewingProfileDetail, setIsViewingProfileDetail] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('IDLE');
  const [analysisError, setAnalysisError] = useState<FriendlyErrorInfo | null>(null);
  const [retryState, setRetryState] = useState<{ attempt: number; maxAttempts: number } | null>(null);
  const isAnalyzingRef = useRef(false);
  const [completionToast, setCompletionToast] = useState<{ count: number } | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('easy');

  // Auto-dismiss completion toast after 7s (Item 8)
  useEffect(() => {
    if (completionToast) {
      const timer = setTimeout(() => {
        setCompletionToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [completionToast]);

  const hasActiveEvaluation = Boolean(customAnalysis && workflowStatus === 'COMPLETED');
  const currentAnalysis = analysis;

  // Profile & Upload states
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isProfileSelectorOpen, setIsProfileSelectorOpen] = useState(false);
  const [isUploadWorkspace, setIsUploadWorkspace] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('basis');
  const [selectedCriterion, setSelectedCriterion] = useState<RubricCriterion | null>(null);
  const [selectedRedTeamCard, setSelectedRedTeamCard] = useState<RedTeamCard | null>(null);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [isLoadingMoreCouncil, setIsLoadingMoreCouncil] = useState(false);
  const [pendingInitialFile, setPendingInitialFile] = useState<File | null>(null);
  const [uploadInitialMethod, setUploadInitialMethod] = useState<'file' | 'paste'>('file');

  // Navigate to Profile Detail in Main Content (Requirement 2 & 3)
  const handleViewProfileDetail = () => {
    setIsProfileDrawerOpen(false);
    setIsViewingProfileDetail(true);
    setActiveTab('dashboard');
  };

  // Switch sample initiatives
  const handleSelectSample = (index: number) => {
    setSelectedSampleIndex(index);
    setIsUploadWorkspace(false);
    setIsViewingProfileDetail(false);
    if (index === 0) {
      setIsDemoMode(true);
      setAnalysis(sampleInitiative1);
    } else if (index === 1) {
      setIsDemoMode(true);
      setAnalysis(sampleInitiative2);
    } else if (index === 2 && customAnalysis) {
      setIsDemoMode(false);
      setAnalysis(customAnalysis);
      setWorkflowStatus('COMPLETED');
    } else if (index === 2 && !customAnalysis) {
      setIsDemoMode(false);
      setWorkflowStatus('IDLE');
      setActiveTab('dashboard');
    }
  };

  // Open inspector modal
  const handleOpenInspector = (
    mode: InspectorMode,
    target: RubricCriterion | RedTeamCard
  ) => {
    setInspectorMode(mode);
    if ('criterionName' in target) {
      setSelectedCriterion(target as RubricCriterion);
      setSelectedRedTeamCard(null);
    } else {
      setSelectedRedTeamCard(target as RedTeamCard);
      setSelectedCriterion(null);
    }
    setIsInspectorOpen(true);
  };

  // Update card status
  const handleUpdateCardStatus = (id: string, status: FindingStatus, notes?: string) => {
    setAnalysis(prev => ({
      ...prev,
      redTeamCards: prev.redTeamCards.map(c =>
        c.id === id ? { ...c, status, userNotes: notes !== undefined ? notes : c.userNotes } : c
      )
    }));
    if (customAnalysis) {
      setCustomAnalysis(prev => prev ? ({
        ...prev,
        redTeamCards: prev.redTeamCards.map(c =>
          c.id === id ? { ...c, status, userNotes: notes !== undefined ? notes : c.userNotes } : c
        )
      }) : null);
    }
  };

  // Perform AI Analysis from server with Automatic Retry, Timeout, Classification & Preservation
  const handleAnalyzeSKKN = async (
    skknText: string,
    rubricText: string,
    evidenceFiles: UploadedFileItem[],
    notes: string
  ) => {
    // 7. Double request prevention: block any concurrent triggers
    if (isAnalyzingRef.current) {
      console.warn('Yêu cầu phân tích đang được xử lý, bỏ qua lượt bấm lặp.');
      return;
    }

    if (!skknText || skknText.trim().length < 20) {
      setWorkflowStatus('ERROR');
      setAnalysisError({
        category: 'INVALID_INPUT',
        title: 'Nội dung SKKN chưa đủ',
        message: 'Thầy/Cô vui lòng dán hoặc tải tài liệu SKKN đầy đủ trước khi thẩm định.',
        subtext: 'Nội dung SKKN cần có độ dài tối thiểu để hệ thống phân tích cấu trúc.',
        canRetry: false,
        isTemporary: false
      });
      return;
    }

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setWorkflowStatus('ANALYZING');
    setAnalysisError(null);
    setRetryState(null);

    // 1. Log Input trong Development
    console.log('[STAGE: REQUEST] Bắt đầu gửi SKKN lên máy chủ AI');
    console.log('ANALYSIS INPUT LENGTH:', skknText.length);
    console.log('ANALYSIS INPUT PREVIEW:', skknText.slice(0, 150).replace(/\n/g, ' '));

    const MAX_RETRIES = 3;
    let success = false;
    let lastError: FriendlyErrorInfo | null = null;

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          // 4. Trạng thái trong lúc retry
          setRetryState({ attempt, maxAttempts: MAX_RETRIES });
          const delay = getRetryDelay(attempt);
          await sleep(delay);
        }

        // 9. Timeout cho phân tích tài liệu dài
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 95000);

        try {
          const response = await fetch('/api/analyze-skkn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              skknContent: skknText,
              rubricContent: rubricText,
              evidenceFiles: evidenceFiles.map(f => ({
                name: f.name,
                category: f.category,
                size: f.size,
                text: f.textContent
              })),
              promptNotes: notes
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errJson: any = null;
            try {
              errJson = await response.json();
            } catch (_) {}

            console.warn('[STAGE: RESPONSE] HTTP error from /api/analyze-skkn:', response.status, errJson);
            const classified = classifyError(response.status, errJson, null, attempt + 1);
            lastError = classified;

            // 8. Nếu là lỗi tạm thời và chưa hết số lần retry -> thử lại
            if (classified.isTemporary && attempt < MAX_RETRIES) {
              continue;
            } else {
              break;
            }
          }

          console.log('[STAGE: RESPONSE] Nhận phản hồi HTTP 200 từ /api/analyze-skkn');
          let rawData: any;
          try {
            const resText = await response.text();
            console.log('[STAGE: EXTRACT] Trích xuất dữ liệu kết quả');
            const extracted = extractGeminiOutput(resText);
            console.log('[STAGE: PARSE] Parse an toàn cấu trúc kết quả');
            rawData = parseAnalysisResponse(extracted);
          } catch (jsonErr) {
            console.error('[STAGE: PARSE] Lỗi parse response từ server:', jsonErr);
            const classified = classifyError(200, { code: 'PARSE_ERROR' }, jsonErr, attempt + 1);
            lastError = classified;
            break;
          }

          // 12. Chuẩn hóa qua hàm normalizeAnalysisResult duy nhất
          console.log('[STAGE: NORMALIZE] Chuẩn hóa đối tượng SKKNAnalysisResult');
          const parsedResult = normalizeAnalysisResult(rawData, skknText, notes);

          // 13. Validation KHÔNG ĐƯỢC QUÁ CỨNG:
          // Chỉ coi là thất bại khi không lấy được bất kỳ dữ liệu phân tích có ý nghĩa nào
          const hasMeaningfulData =
            (parsedResult.rubricCriteria && parsedResult.rubricCriteria.length > 0) ||
            (parsedResult.redTeamCards && parsedResult.redTeamCards.length > 0) ||
            Boolean(parsedResult.metadata?.title) ||
            Boolean(parsedResult.sectionsMap && parsedResult.sectionsMap.length > 0);

          if (!hasMeaningfulData) {
            console.warn('[STAGE: VALIDATE] Không tìm thấy dữ liệu phân tích có ý nghĩa');
            const classified = classifyError(200, { code: 'PARSE_ERROR' }, new Error('Không có dữ liệu phân tích'), attempt + 1);
            lastError = classified;
            break;
          }

          // 11. Thành công sau retry hoặc lần đầu: hoàn tất ngay lập tức
          console.log('[STAGE: STATE] Thiết lập trạng thái COMPLETED, issues count:', parsedResult.redTeamCards.length);
          success = true;
          setAnalysis(parsedResult);
          setCustomAnalysis(parsedResult);
          setIsDemoMode(false);
          setSelectedSampleIndex(2);
          setIsUploadWorkspace(false);
          setActiveTab('dashboard');
          setWorkflowStatus('COMPLETED');
          setRetryState(null);
          setAnalysisError(null);

          const issuesCount = parsedResult.redTeamCards.length;
          setCompletionToast({ count: issuesCount });

          console.log('[STAGE: RENDER] Hiển thị KẾT QUẢ ĐÁNH GIÁ và VIỆC CẦN XỬ LÝ');
          setTimeout(() => {
            const resultsEl = document.getElementById('evaluation-results-section');
            if (resultsEl) {
              resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 200);

          break; // Thoát vòng lặp retry

        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          console.error('[STAGE: REQUEST] Lỗi kết nối / timeout:', fetchErr);
          const classified = classifyError(undefined, null, fetchErr, attempt + 1);
          lastError = classified;

          if (classified.isTemporary && attempt < MAX_RETRIES) {
            continue;
          } else {
            break;
          }
        }
      }

      // 5. Nếu thất bại sau tất cả các lần retry: chỉ hiện thông báo thân thiện
      if (!success) {
        setWorkflowStatus('ERROR');
        setAnalysisError(lastError || {
          category: 'TEMPORARY',
          title: '⚠️ HỆ THỐNG AI ĐANG BẬN',
          message: 'Chưa thể hoàn tất chấm & phản biện lúc này. Hồ sơ của Thầy/Cô vẫn được giữ nguyên.',
          subtext: 'Thầy/Cô không cần tải hoặc dán lại SKKN.',
          canRetry: true,
          isTemporary: true
        });
        setRetryState(null);
      }
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  // Generate custom suggestion
  const handleGenerateCustomSuggestion = async (
    originalText: string,
    problem: string,
    section: string
  ): Promise<SuggestionRewrite> => {
    setIsGeneratingSuggestion(true);
    try {
      const resp = await fetch('/api/generate-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText,
          problem,
          targetSection: section,
          context: analysis.metadata.title
        })
      });

      if (!resp.ok) {
        throw new Error('Lỗi tạo gợi ý chỉnh sửa');
      }

      const data = await resp.json();
      const newSuggestion: SuggestionRewrite = {
        id: 'sug-custom-' + Date.now(),
        targetSection: section,
        originalText,
        problem,
        whyRevise: data.whyRevise || 'Cần chuẩn hóa học thuật',
        basis: data.basis || 'Căn cứ tiêu chí đánh giá SKKN, quy chuẩn phương pháp nghiên cứu sư phạm và quy tắc liêm chính khoa học',
        category: 'Tự yêu cầu',
        revisionGoal: data.revisionGoal || 'Nâng cao tính thuyết phục',
        howToRevise: data.howToRevise || 'Điều chỉnh diễn đạt và kiểm soát biến số',
        lightRevision: data.lightRevision || originalText,
        academicRevision: data.academicRevision || originalText,
        deepRevision: data.deepRevision || originalText,
        missingEvidenceAlert: data.missingEvidenceAlert || '',
        insertPosition: data.insertPosition || section
      };

      setAnalysis(prev => ({
        ...prev,
        suggestions: [newSuggestion, ...prev.suggestions]
      }));

      return newSuggestion;
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Generate more council questions
  const handleGenerateMoreCouncilQuestions = async () => {
    setIsLoadingMoreCouncil(true);
    try {
      const resp = await fetch('/api/ask-council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skknTitle: analysis.metadata.title,
          weaknesses: analysis.redTeamCards.map(c => c.issueDetected),
          criteriaIssues: analysis.rubricCriteria.filter(c => c.proposedScore < c.maxScore).map(c => c.deductionReason)
        })
      });

      if (!resp.ok) {
        throw new Error('Lỗi tạo câu hỏi hội đồng');
      }

      const newQuestions: CouncilQuestion[] = await resp.json();
      setAnalysis(prev => ({
        ...prev,
        councilQuestions: [...prev.councilQuestions, ...newQuestions]
      }));
    } catch (err: any) {
      console.error(err);
      alert('Không thể tạo thêm câu hỏi: ' + err.message);
    } finally {
      setIsLoadingMoreCouncil(false);
    }
  };

  // Rescore after revisions
  const handleRescore = async (revisedNotes: string) => {
    setIsRescoring(true);
    try {
      const resp = await fetch('/api/rescore-skkn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousResult: analysis,
          revisedNotes
        })
      });

      if (!resp.ok) {
        throw new Error('Lỗi thẩm định lại');
      }

      const rescoreData = await resp.json();

      setAnalysis(prev => {
        // If criteria scores updated
        let updatedCriteria = [...prev.rubricCriteria];
        if (rescoreData.updatedCriteria && Array.isArray(rescoreData.updatedCriteria)) {
          updatedCriteria = prev.rubricCriteria.map(c => {
            const match = rescoreData.updatedCriteria.find((u: any) => u.criterionName === c.criterionName);
            if (match && typeof match.newScore === 'number') {
              return { ...c, proposedScore: match.newScore };
            }
            return c;
          });
        }

        return {
          ...prev,
          rubricCriteria: updatedCriteria,
          rescoreHistory: rescoreData
        };
      });

      if (customAnalysis) {
        setCustomAnalysis(prev => {
          if (!prev) return null;
          let updatedCriteria = [...prev.rubricCriteria];
          if (rescoreData.updatedCriteria && Array.isArray(rescoreData.updatedCriteria)) {
            updatedCriteria = prev.rubricCriteria.map(c => {
              const match = rescoreData.updatedCriteria.find((u: any) => u.criterionName === c.criterionName);
              if (match && typeof match.newScore === 'number') {
                return { ...c, proposedScore: match.newScore };
              }
              return c;
            });
          }
          return {
            ...prev,
            rubricCriteria: updatedCriteria,
            rescoreHistory: rescoreData
          };
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRescoring(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsUploadWorkspace(false);
          setIsViewingProfileDetail(false);
          setActiveTab(tab);
        }}
        analysis={currentAnalysis}
        hasEvaluated={hasActiveEvaluation || isDemoMode}
        onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        appMode={appMode}
        setAppMode={setAppMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          analysis={currentAnalysis}
          onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
          isSample={isDemoMode}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          isUploadWorkspace={isUploadWorkspace || (!hasActiveEvaluation && !isDemoMode)}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              isViewingProfileDetail ? (
                <ProfileDetailView
                  analysis={currentAnalysis}
                  isSample={isDemoMode}
                  isDemoMode={isDemoMode}
                  onBack={() => setIsViewingProfileDetail(false)}
                  onNavigateTab={(tab) => {
                    setIsViewingProfileDetail(false);
                    setActiveTab(tab);
                  }}
                  onGoToIssue={(card) => {
                    setIsViewingProfileDetail(false);
                    setActiveTab('red_team');
                    handleOpenInspector('basis', card);
                  }}
                />
              ) : (
                <DashboardView
                  analysis={currentAnalysis}
                  onNavigateTab={(tab) => {
                    setIsViewingProfileDetail(false);
                    setActiveTab(tab);
                  }}
                  onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
                  onViewProfileDetail={handleViewProfileDetail}
                  onAnalyzeSKKN={handleAnalyzeSKKN}
                  isAnalyzing={isAnalyzing || workflowStatus === 'ANALYZING'}
                  isSample={isDemoMode}
                  isDemoMode={isDemoMode}
                  hasActiveEvaluation={hasActiveEvaluation}
                  workflowStatus={workflowStatus}
                  analysisError={analysisError}
                  retryState={retryState}
                  onClearError={() => {
                    setAnalysisError(null);
                    setWorkflowStatus('IDLE');
                  }}
                  onEnterDemo={() => {
                    setIsDemoMode(true);
                    setSelectedSampleIndex(0);
                    setAnalysis(sampleInitiative1);
                  }}
                  onExitDemo={() => {
                    setIsDemoMode(false);
                    if (customAnalysis) {
                      setAnalysis(customAnalysis);
                    }
                  }}
                  appMode={appMode}
                  onUpdateCardStatus={handleUpdateCardStatus}
                  onOpenInspector={handleOpenInspector}
                />
              )
            )}

            {/* Empty state for other tabs if no evaluation yet */}
            {activeTab !== 'dashboard' && !isDemoMode && !hasActiveEvaluation ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center max-w-lg mx-auto my-12 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Chưa có hồ sơ được phân tích
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Thầy/Cô hãy tải hoặc dán SKKN của mình để nhận kết quả phân tích đầy đủ, hoặc xem hồ sơ mẫu để trải nghiệm hệ thống.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tải SKKN của tôi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDemoMode(true);
                      setSelectedSampleIndex(0);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Xem kết quả mẫu →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'rubric' && (
                  <RubricScoringView
                    criteria={currentAnalysis.rubricCriteria}
                    rubricName={currentAnalysis.metadata.appliedRubricName}
                    isOfficial={currentAnalysis.metadata.isOfficialRubric}
                    onOpenInspector={handleOpenInspector}
                  />
                )}

                {activeTab === 'red_team' && (
                  <RedTeamView
                    cards={currentAnalysis.redTeamCards}
                    onUpdateCardStatus={handleUpdateCardStatus}
                    onOpenInspector={handleOpenInspector}
                    onGoToSuggestionForCard={(card) => {
                      setActiveTab('suggestions');
                    }}
                  />
                )}

                {activeTab === 'novelty' && (
                  <NoveltyMapView
                    novelty={currentAnalysis.novelty}
                    skknTitle={currentAnalysis.metadata.title}
                  />
                )}

                {activeTab === 'evidence' && (
                  <EvidenceMapView
                    chain={currentAnalysis.evidenceChain}
                  />
                )}

                {activeTab === 'data_logic' && (
                  <DataLogicAuditView
                    dataAnomalies={currentAnalysis.dataAnomalies}
                    logicGaps={currentAnalysis.logicGaps}
                  />
                )}

                {activeTab === 'ai_markers' && (
                  <AiMarkersView
                    aiMarkers={currentAnalysis.aiMarkers}
                    skknTitle={currentAnalysis.metadata.title}
                  />
                )}

                {activeTab === 'similarity_citations' && (
                  <SimilarityCitationsView
                    analysis={currentAnalysis.similarityAndCitations}
                    skknTitle={currentAnalysis.metadata.title}
                  />
                )}

                {activeTab === 'suggestions' && (
                  <SuggestionsView
                    suggestions={currentAnalysis.suggestions}
                    issues={currentAnalysis.redTeamCards}
                    onUpdateIssueStatus={handleUpdateCardStatus}
                    onGenerateCustomSuggestion={handleGenerateCustomSuggestion}
                    isGenerating={isGeneratingSuggestion}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'council' && (
                  <CouncilSimulatorView
                    questions={currentAnalysis.councilQuestions}
                    onGenerateMoreQuestions={handleGenerateMoreCouncilQuestions}
                    isLoadingMore={isLoadingMoreCouncil}
                  />
                )}

                {activeTab === 'rescore' && (
                  <RescoreView
                    analysis={currentAnalysis}
                    onRescore={handleRescore}
                    isRescoring={isRescoring}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'report' && (
                  <ReportView
                    analysis={currentAnalysis}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal (fallback if invoked) */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalyze={handleAnalyzeSKKN}
        isLoading={isAnalyzing}
      />

      {/* Evidence & Deduction Inspector Modal */}
      <EvidenceInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        mode={inspectorMode}
        criterion={selectedCriterion}
        redTeamCard={selectedRedTeamCard}
      />

      {/* Core Principles Modal */}
      <CorePrinciplesModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Document Profile Modal */}
      <DocumentProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        analysis={currentAnalysis}
        selectedSampleIndex={selectedSampleIndex}
        onOpenSampleSelector={() => {
          setIsProfileDrawerOpen(false);
          setIsProfileSelectorOpen(true);
        }}
        onStartNewDocument={() => {
          setIsProfileDrawerOpen(false);
          setIsViewingProfileDetail(false);
          setIsDemoMode(false);
          setWorkflowStatus('IDLE');
          setActiveTab('dashboard');
          // Cuộn mượt đến khu vực TẠO HỒ SƠ ĐÁNH GIÁ và highlight nhẹ 1 giây
          setTimeout(() => {
            const section = document.getElementById('create-dossier-section');
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'center' });
              section.classList.add('ring-4', 'ring-blue-400/60', 'ring-offset-2', 'rounded-2xl', 'transition-all', 'duration-300');
              setTimeout(() => {
                section.classList.remove('ring-4', 'ring-blue-400/60', 'ring-offset-2');
              }, 1200);
            }
          }, 150);
        }}
        onViewProfileDetail={handleViewProfileDetail}
        isSample={isDemoMode}
        hasCustomAnalysis={Boolean(customAnalysis)}
        workflowStatus={workflowStatus}
      />

      {/* Profile Selector Modal */}
      <ProfileSelectorModal
        isOpen={isProfileSelectorOpen}
        onClose={() => setIsProfileSelectorOpen(false)}
        selectedSampleIndex={selectedSampleIndex}
        onSelectSample={handleSelectSample}
        hasCustomProfile={Boolean(customAnalysis)}
        customTitle={customAnalysis?.metadata.title}
      />

      {/* Toast thông báo hoàn thành (Item 8) */}
      {completionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 max-w-sm flex items-start gap-3.5 animate-in slide-in-from-bottom-4 fade-in duration-300 select-none">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              ✓ ĐÃ CHẤM & PHẢN BIỆN XONG
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Phát hiện {completionToast.count} vấn đề cần xem xét.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('evaluation-results-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setCompletionToast(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                XEM KẾT QUẢ
              </button>
              <button
                type="button"
                onClick={() => setCompletionToast(null)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
