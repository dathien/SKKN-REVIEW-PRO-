/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar, ActiveTab, AppMode } from './components/Sidebar';
import { Header } from './components/Header';
import { FileUploadModal } from './components/FileUploadModal';
import { EvidenceInspectorModal, InspectorMode } from './components/EvidenceInspectorModal';
import { CorePrinciplesModal } from './components/CorePrinciplesModal';
import { DocumentProfileDrawer } from './components/DocumentProfileDrawer';
import { ProfileSelectorModal } from './components/ProfileSelectorModal';
import { UploadWorkspace } from './components/UploadWorkspace';
import { CheckCircle2, FileText, ShieldAlert, Shield, FolderOpen } from 'lucide-react';
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
import { MyEvaluationsView } from './components/views/MyEvaluationsView';
import { AcademicRebuttalView } from './components/views/AcademicRebuttalView';

// Auth & Modals
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { QuotaExceededModal } from './components/QuotaExceededModal';
import { AdminPortalModal } from './components/AdminPortalModal';

// Sample Data & Types
import { sampleInitiative1, sampleInitiative2 } from './services/sampleData';
import {
  SKKNAnalysisResult,
  FindingStatus,
  RubricCriterion,
  RedTeamCard,
  UploadedFileItem,
  SuggestionRewrite,
  CouncilQuestion,
  EvaluationItem,
  ChangeSetItem
} from './types';
import { normalizeTeacherNotes, resolveCardTeacherNote } from './utils/evaluationNotes';
import {
  CLEAN_ROUTES,
  getTabFromPath,
  getPathFromTab,
  migrateLegacyUrl,
} from './utils/navigation';

export default function App() {
  const { user, guestId, role, hasQuotaForMode, openQuotaModal, updateUserQuota, isAdmin, openAdminModal, isLoading: isAuthLoading, isLoggedIn, openAuthModal } = useAuth();

  // Khởi tạo trạng thái định tuyến: Hỗ trợ Clean URL và tự động di chuyển URL cũ có query string (?tab=...&evalId=...)
  const initialUrlState = useMemo(() => {
    return migrateLegacyUrl();
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialUrlState.migratedTab || 'dashboard');
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
  const [rescoreError, setRescoreError] = useState<{ message: string; retryable?: boolean } | null>(null);

  // Theo dõi tuyến đường trình duyệt để chuyển đổi trang độc lập /quan-tri và các Clean URLs
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    }
    return '/';
  });

  // Điều hướng Clean URL không reload toàn trang, hỗ trợ pushState & replaceState
  const navigateToTab = useCallback((targetTab: ActiveTab, replace = false) => {
    setIsUploadWorkspace(false);
    setIsViewingProfileDetail(false);
    setViewingRebuttalCardId(null);
    setActiveTab(targetTab);

    if (typeof window !== 'undefined') {
      const targetPath = getPathFromTab(targetTab);
      if (window.location.pathname !== targetPath || window.location.search) {
        if (replace) {
          window.history.replaceState({}, '', targetPath);
        } else {
          window.history.pushState({}, '', targetPath);
        }
        setCurrentPath(targetPath);
      }
    }
  }, []);

  // Xử lý sự kiện Back/Forward của trình duyệt (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const newPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      setCurrentPath(newPath);

      if (newPath === '/quan-tri') {
        return;
      }

      const nextTab = getTabFromPath(newPath);
      setActiveTab(nextTab);
      setViewingRebuttalCardId(null);
      setIsViewingProfileDetail(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isQuanTriPath = currentPath === '/quan-tri' || currentPath.startsWith('/quan-tri');

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

  // Quản lý lưu trữ hồ sơ cá nhân & Bản gốc v1 bất biến vs Bản nháp (Requirement B & C)
  // ID hồ sơ được quản lý trong trạng thái ứng dụng và session storage, TUYỆT ĐỐI không đưa vào URL
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(initialUrlState.migratedEvalId || null);
  const [currentEvaluationItem, setCurrentEvaluationItem] = useState<EvaluationItem | null>(null);
  const isRescoringRef = useRef(false);
  const [originalSkknText, setOriginalSkknText] = useState<string>('');
  const [draftSkknText, setDraftSkknText] = useState<string>('');
  const [originalDocxBuffer, setOriginalDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'guest'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [lastSavedMetadata, setLastSavedMetadata] = useState<{
    originalFileName?: string;
    originalFileSize?: number;
    originalFileBase64?: string;
    wordCount?: number;
    title?: string;
    subject?: string;
    gradeLevel?: string;
    originalText?: string;
    draftText?: string;
  } | null>(null);

  // Academic Rebuttal dedicated page state (Section II)
  const [viewingRebuttalCardId, setViewingRebuttalCardId] = useState<string | null>(initialUrlState.migratedIssueId || null);
  const [rebuttalReturnTab, setRebuttalReturnTab] = useState<ActiveTab>('dashboard');
  const [selectedRevisionTier, setSelectedRevisionTier] = useState<'light' | 'academic' | 'deep'>(initialUrlState.migratedTier || 'academic');
  const [targetSuggestionCardId, setTargetSuggestionCardId] = useState<string | null>(null);

  const handleOpenAcademicRebuttal = (card: RedTeamCard, returnTab: ActiveTab = activeTab) => {
    setViewingRebuttalCardId(card.id);
    setRebuttalReturnTab(returnTab);
    try {
      sessionStorage.setItem('skkn_active_rebuttal_id', card.id);
    } catch (_) {}
  };

  const handleGoToSuggestionForCard = (card: RedTeamCard) => {
    setViewingRebuttalCardId(null);
    setIsViewingProfileDetail(false);
    navigateToTab('suggestions');
    setTargetSuggestionCardId(card.id);
  };

  // 1. Lưu giữ ID hồ sơ đang chọn trong session/local storage (không đưa vào URL query string)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (currentEvaluationId) {
        sessionStorage.setItem('skkn_active_eval_id', currentEvaluationId);
        localStorage.setItem('skkn_active_eval_id', currentEvaluationId);
      } else {
        sessionStorage.removeItem('skkn_active_eval_id');
        localStorage.removeItem('skkn_active_eval_id');
      }
    } catch (_) {}
  }, [currentEvaluationId]);

  // 2. Đồng bộ Clean URL pathname khi activeTab thay đổi, đảm bảo URL luôn sạch sẽ và loại bỏ mọi query string
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isQuanTriPath) return;

    const currentClean = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    // Nếu đang ở trang chủ '/' và tab là 'dashboard', giữ nguyên '/'
    if (currentClean === '/' && activeTab === 'dashboard') {
      if (window.location.search) {
        window.history.replaceState({}, '', '/');
      }
      return;
    }

    const expectedPath = getPathFromTab(activeTab);
    if (currentClean !== expectedPath || window.location.search) {
      window.history.replaceState({}, '', expectedPath);
      setCurrentPath(expectedPath);
    }
  }, [activeTab, isQuanTriPath]);

  // Trạng thái đang khôi phục hồ sơ sau F5
  const [isRestoringEvaluation, setIsRestoringEvaluation] = useState<boolean>(Boolean(initialUrlState.migratedEvalId));
  const hasRestoredInitialEvalRef = useRef(false);

  useEffect(() => {
    const restoreInitialEvaluation = async () => {
      const targetEvalId = currentEvaluationId || initialUrlState.migratedEvalId;
      if (!targetEvalId || hasRestoredInitialEvalRef.current) {
        setIsRestoringEvaluation(false);
        return;
      }
      hasRestoredInitialEvalRef.current = true;

      try {
        const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
        const userEmail = user?.email || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_user_email') : '') || '';
        const resp = await fetch(`/api/user/evaluations/get?id=${encodeURIComponent(targetEvalId)}`, {
          headers: {
            'x-session-token': sessionToken,
            'x-user-email': userEmail,
          },
        });
        const contentType = resp.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setIsRestoringEvaluation(false);
          return;
        }
        const data = await resp.json();
        if (data.success && data.evaluation?.analysisResult) {
          // Hợp nhất đồng bộ customProposals từ backend và cache cục bộ
          const restoredProposals: Record<string, any> = {
            ...(data.evaluation.customProposals || {}),
            ...(data.evaluation.analysisResult.customProposals || {}),
          };

          // NGUỒN DỮ LIỆU GHI CHÚ CHÍNH THỨC:
          // Thu thập từ server (cả evaluation.teacherNotes và evaluation.analysisResult.teacherNotes)
          const serverNotesRaw = {
            ...(data.evaluation.teacherNotes || {}),
            ...(data.evaluation.analysisResult?.teacherNotes || {}),
          };

          // Thu thập từ localStorage (cả từ điển theo hồ sơ, scoped keys và legacy)
          const localNotesCollected: Record<string, string> = {};
          try {
            if (typeof localStorage !== 'undefined') {
              const userEmailKey = (user?.email || localStorage.getItem('skkn_user_email') || 'guest').toLowerCase().trim();
              const evalKey = targetEvalId;

              // 1. Từ điển ghi chú riêng của hồ sơ
              const evalNotesStr = localStorage.getItem(`skkn_eval_notes_${evalKey}`);
              if (evalNotesStr) {
                try {
                  Object.assign(localNotesCollected, JSON.parse(evalNotesStr));
                } catch (_) {}
              }

              // 2. Từ điển tổng hợp skkn_all_teacher_notes
              const allNotesStr = localStorage.getItem('skkn_all_teacher_notes');
              if (allNotesStr) {
                try {
                  Object.assign(localNotesCollected, JSON.parse(allNotesStr));
                } catch (_) {}
              }

              // 3. Quét các khóa scoped theo tài khoản và hồ sơ
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(`skkn_note_${userEmailKey}_${evalKey}_`)) {
                  const cardKey = k.replace(`skkn_note_${userEmailKey}_${evalKey}_`, '');
                  const val = localStorage.getItem(k);
                  if (cardKey && val) {
                    localNotesCollected[cardKey] = val;
                  }
                }
              }

              // Proposals
              const localProposals = JSON.parse(localStorage.getItem('skkn_all_custom_proposals') || '{}');
              Object.assign(restoredProposals, localProposals);
            }
          } catch (_) {}

          // Chuẩn hóa triệt để: loại bỏ mọi khóa rác có tiền tố, chỉ giữ cardId chuẩn
          const restoredNotes = normalizeTeacherNotes({
            ...serverNotesRaw,
            ...localNotesCollected,
          }, targetEvalId);

          // Đồng bộ vào synchronizedCards:
          // BẢO VỆ GHI CHÚ: Nếu restoredNotes[c.id] có nội dung (giáo viên đã nhập/sửa),
          // đây là dữ liệu mới nhất, TUYỆT ĐỐI không để c.userNotes cũ từ đĩa server ghi đè lên!
          const synchronizedCards = (data.evaluation.analysisResult.redTeamCards || []).map((c: any) => {
            let cleanCardId = c.id;
            const noteFromRestored = restoredNotes[cleanCardId];
            const noteFromCard = (c.userNotes && typeof c.userNotes === 'string') ? c.userNotes.trim() : '';

            let finalNote = '';
            if (typeof noteFromRestored === 'string' && noteFromRestored.trim()) {
              finalNote = noteFromRestored;
            } else if (noteFromCard) {
              finalNote = noteFromCard;
              restoredNotes[cleanCardId] = noteFromCard;
            }

            return {
              ...c,
              userNotes: finalNote,
            };
          });

          const fullAnalysis: SKKNAnalysisResult = {
            ...data.evaluation.analysisResult,
            customProposals: restoredProposals,
            teacherNotes: restoredNotes,
            redTeamCards: synchronizedCards,
          };

          setCurrentEvaluationId(targetEvalId);
          setCurrentEvaluationItem(data.evaluation);
          setCustomAnalysis(fullAnalysis);
          setAnalysis(fullAnalysis);
          setDraftSkknText(data.evaluation.draftText || data.evaluation.originalText || '');
          setOriginalSkknText(data.evaluation.originalText || '');
          setWorkflowStatus('COMPLETED');
          setIsDemoMode(false);
          setIsUploadWorkspace(false);
          setSaveStatus('saved');

          // Restore exact activeTab & issueId
          if (initialUrlState.migratedTab) {
            setActiveTab(initialUrlState.migratedTab);
          }
          if (initialUrlState.migratedIssueId) {
            const hasIssue = fullAnalysis.redTeamCards?.some((c: any) => c.id === initialUrlState.migratedIssueId);
            if (hasIssue) {
              setViewingRebuttalCardId(initialUrlState.migratedIssueId);
            }
          }
        } else if (data.error && (resp.status === 403 || data.error.includes('Bảo mật') || data.error.includes('quyền') || resp.status === 404)) {
          console.warn('Không có quyền truy cập hoặc không tìm thấy hồ sơ này:', data.error);
          setCurrentEvaluationId(null);
          setCurrentEvaluationItem(null);
          try {
            sessionStorage.removeItem('skkn_active_eval_id');
            localStorage.removeItem('skkn_active_eval_id');
            localStorage.removeItem('skkn_current_eval_id');
          } catch (_) {}
        }
      } catch (err) {
        console.error('Lỗi khi khôi phục ngữ cảnh sau F5:', err);
      } finally {
        setIsRestoringEvaluation(false);
      }
    };

    restoreInitialEvaluation();
  }, [user?.email, currentEvaluationId]);

  // Tự động lưu hồ sơ sau khi thẩm định thành công
  const autoSaveEvaluation = async (
    resultToSave: SKKNAnalysisResult,
    extraMeta?: {
      originalFileName?: string;
      originalFileSize?: number;
      originalFileBase64?: string;
      wordCount?: number;
      title?: string;
      subject?: string;
      gradeLevel?: string;
      originalText?: string;
      draftText?: string;
    }
  ) => {
    const meta = extraMeta || lastSavedMetadata || {};
    if (extraMeta) {
      setLastSavedMetadata(extraMeta);
    }

    if (!isLoggedIn && !user?.email) {
      console.log('[AUTO-SAVE] Người dùng chưa đăng nhập, kết quả được lưu trong phiên hiện tại.');
      setSaveStatus('guest');
      return;
    }

    setSaveStatus('saving');
    setSaveErrorMessage(null);

    try {
      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
      const googleCredential = (user as any)?.googleCredential || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_google_credential') : '') || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      };
      if (sessionToken) {
        headers['x-session-token'] = sessionToken;
        headers['authorization'] = `Bearer ${sessionToken}`;
      }
      if (googleCredential) {
        headers['x-google-credential'] = googleCredential;
      }

      const calculatedScore = typeof (resultToSave as any)?.overallScore === 'number'
        ? (resultToSave as any).overallScore
        : (resultToSave.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? 0);

      const docTitle = meta.title || resultToSave.metadata?.title || 'Hồ sơ Sáng kiến kinh nghiệm';
      const docSubject = meta.subject || resultToSave.metadata?.subject || 'Chung';
      const docGradeLevel = meta.gradeLevel || resultToSave.metadata?.gradeLevel || '';

      const payloadOriginalText = originalSkknText || meta.originalText || '';
      const payloadDraftText = draftSkknText || originalSkknText || meta.draftText || meta.originalText || '';
      const payloadChangeSet = resultToSave.changeSet || [];

      if (currentEvaluationId) {
        // Cập nhật bản ghi hiện tại - không tạo trùng lặp (Requirement B.4)
        const resp = await fetch('/api/user/evaluations/save-result', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            evaluationId: currentEvaluationId,
            teacherNotes: resultToSave.teacherNotes || analysis.teacherNotes,
            customProposals: resultToSave.customProposals || analysis.customProposals,
            analysisResult: {
              ...resultToSave,
              teacherNotes: resultToSave.teacherNotes || analysis.teacherNotes,
              customProposals: resultToSave.customProposals || analysis.customProposals,
              changeSet: payloadChangeSet,
            },
            title: docTitle,
            subject: docSubject,
            score: calculatedScore,
            originalText: payloadOriginalText,
            draftText: payloadDraftText,
            changeSet: payloadChangeSet,
          }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
          throw new Error(data.error || `Lỗi máy chủ (${resp.status})`);
        }

        setSaveStatus('saved');
        console.log('[AUTO-SAVE] Cập nhật thành công hồ sơ hiện tại:', currentEvaluationId);
      } else {
        // Tạo mới bản ghi (Requirement B.1, B.2)
        const resp = await fetch('/api/user/evaluations/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: docTitle,
            subject: docSubject,
            gradeLevel: docGradeLevel,
            score: calculatedScore,
            originalFileName: meta.originalFileName || '',
            originalFileSize: meta.originalFileSize || 0,
            wordCount: meta.wordCount || 0,
            originalFileBase64: meta.originalFileBase64 || '',
            originalText: payloadOriginalText,
            draftText: payloadDraftText,
            changeSet: payloadChangeSet,
            analysisResult: {
              ...resultToSave,
              changeSet: payloadChangeSet,
            },
          }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
          throw new Error(data.error || `Lỗi máy chủ (${resp.status})`);
        }

        if (data.evaluation?.id) {
          setCurrentEvaluationId(data.evaluation.id);
          setCurrentEvaluationItem(data.evaluation);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('skkn_current_eval_id', data.evaluation.id);
          }
        }
        setSaveStatus('saved');
        console.log('[AUTO-SAVE] Tạo mới và lưu thành công hồ sơ vào kho:', data.evaluation?.id);
      }
    } catch (err: any) {
      console.error('[AUTO-SAVE] Lỗi khi lưu trữ hồ sơ:', err);
      setSaveStatus('error');
      setSaveErrorMessage(err.message || 'Không thể lưu hồ sơ vào cơ sở dữ liệu.');
    }
  };

  // Tự động đồng bộ lưu trữ khi người dùng đăng nhập sau khi đã chấm
  useEffect(() => {
    if (isLoggedIn && customAnalysis && !currentEvaluationId && !isDemoMode) {
      autoSaveEvaluation(customAnalysis, lastSavedMetadata || undefined);
    }
  }, [isLoggedIn, user?.email]);

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
      setCurrentEvaluationId(null);
      setSaveStatus('idle');
    } else if (index === 1) {
      setIsDemoMode(true);
      setAnalysis(sampleInitiative2);
      setCurrentEvaluationId(null);
      setSaveStatus('idle');
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
    const updatedCards = analysis.redTeamCards.map(c =>
      c.id === id ? { ...c, status, userNotes: notes !== undefined ? notes : c.userNotes } : c
    );
    const updatedTeacherNotes = {
      ...(analysis.teacherNotes || {}),
      ...(notes !== undefined ? { [id]: notes } : {}),
    };

    setAnalysis(prev => ({
      ...prev,
      teacherNotes: updatedTeacherNotes,
      redTeamCards: updatedCards,
    }));
    if (customAnalysis) {
      setCustomAnalysis(prev => prev ? ({
        ...prev,
        teacherNotes: updatedTeacherNotes,
        redTeamCards: updatedCards,
      }) : null);
    }

    if (currentEvaluationId && isLoggedIn && user?.email) {
      try {
        const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
        fetch('/api/user/evaluations/save-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionToken,
            'x-user-email': user.email,
          },
          body: JSON.stringify({
            evaluationId: currentEvaluationId,
            customProposals: analysis.customProposals,
            teacherNotes: updatedTeacherNotes,
            analysisResult: {
              ...analysis,
              customProposals: analysis.customProposals,
              teacherNotes: updatedTeacherNotes,
              redTeamCards: updatedCards,
            },
          }),
        }).catch(err => console.error('Lỗi lưu trạng thái vấn đề:', err));
      } catch (_) {}
    }
  };

  // Lưu bản đề xuất chỉnh sửa của giáo viên bền vững theo tài khoản, hồ sơ và mức sửa
  const handleSaveCustomProposal = async (
    cardId: string,
    tier: 'light' | 'academic' | 'deep',
    text: string
  ): Promise<{ success: boolean; error?: string }> => {
    const proposalKey = `${cardId}_${tier}`;
    const now = new Date().toISOString();
    const updatedProposals = {
      ...(analysis.customProposals || {}),
      [proposalKey]: { tier, text, updatedAt: now }
    };

    // 1. Cập nhật ngay React State
    setAnalysis(prev => ({
      ...prev,
      customProposals: updatedProposals
    }));
    if (customAnalysis) {
      setCustomAnalysis(prev => prev ? ({
        ...prev,
        customProposals: updatedProposals
      }) : null);
    }

    // 2. Backup tức thì vào localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`skkn_proposal_${proposalKey}`, JSON.stringify({ tier, text, updatedAt: now }));
        const currentAll = JSON.parse(localStorage.getItem('skkn_all_custom_proposals') || '{}');
        currentAll[proposalKey] = { tier, text, updatedAt: now };
        localStorage.setItem('skkn_all_custom_proposals', JSON.stringify(currentAll));
      }
    } catch (_) {}

    // 3. Gửi lưu bền vững lên Backend nếu đã đăng nhập và có hồ sơ
    if (currentEvaluationId && isLoggedIn && user?.email) {
      try {
        const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
        const resp = await fetch('/api/user/evaluations/save-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionToken,
            'x-user-email': user.email,
          },
          body: JSON.stringify({
            evaluationId: currentEvaluationId,
            customProposals: updatedProposals,
            teacherNotes: analysis.teacherNotes,
            analysisResult: {
              ...analysis,
              customProposals: updatedProposals,
              teacherNotes: analysis.teacherNotes,
            }
          }),
        });
        const data = await resp.json();
        if (!data.success) {
          return { success: false, error: data.error || 'Máy chủ từ chối lưu đoạn đề xuất.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Lỗi mạng khi lưu đề xuất.' };
      }
    }

    return { success: true };
  };

  // Lưu ghi chú xử lý của giáo viên bền vững theo tài khoản, hồ sơ và vấn đề phản biện
  const handleSaveTeacherNotes = async (
    cardId: string,
    notes: string
  ): Promise<{ success: boolean; error?: string }> => {
    const evalKey = currentEvaluationId || 'default';
    const userEmailKey = (user?.email || 'guest').toLowerCase().trim();

    // Chuẩn hóa cardId: bỏ mọi tiền tố nếu có
    let cleanCardId = cardId.trim();
    if (evalKey && cleanCardId.startsWith(`${evalKey}_`)) {
      cleanCardId = cleanCardId.slice(`${evalKey}_`.length);
    }

    const updatedCards = analysis.redTeamCards.map(c =>
      c.id === cleanCardId ? { ...c, userNotes: notes } : c
    );

    // Cập nhật teacherNotes dictionary với khóa chuẩn cleanCardId
    // Đồng thời dọn dẹp các khóa rác có tiền tố
    const updatedTeacherNotes = normalizeTeacherNotes({
      ...(analysis.teacherNotes || {}),
      ...(customAnalysis?.teacherNotes || {}),
      [cleanCardId]: notes,
    }, evalKey);

    // 1. Cập nhật ngay React State
    setAnalysis(prev => ({
      ...prev,
      teacherNotes: updatedTeacherNotes,
      redTeamCards: updatedCards,
    }));
    if (customAnalysis) {
      setCustomAnalysis(prev => prev ? ({
        ...prev,
        teacherNotes: updatedTeacherNotes,
        redTeamCards: updatedCards,
      }) : null);
    }

    // 2. Backup tức thì vào localStorage với chuẩn hóa khóa
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`skkn_note_${userEmailKey}_${evalKey}_${cleanCardId}`, notes);
        localStorage.setItem(`skkn_note_${cleanCardId}`, notes);

        // Lưu từ điển riêng của hồ sơ
        const currentEvalNotes = JSON.parse(localStorage.getItem(`skkn_eval_notes_${evalKey}`) || '{}');
        currentEvalNotes[cleanCardId] = notes;
        localStorage.setItem(`skkn_eval_notes_${evalKey}`, JSON.stringify(currentEvalNotes));

        // Cập nhật skkn_all_teacher_notes (CHỈ DÙNG KHÓA CHUẨN cleanCardId, xóa khóa ghép cũ)
        const currentAllNotes = JSON.parse(localStorage.getItem('skkn_all_teacher_notes') || '{}');
        delete currentAllNotes[`${evalKey}_${cleanCardId}`];
        currentAllNotes[cleanCardId] = notes;
        localStorage.setItem('skkn_all_teacher_notes', JSON.stringify(currentAllNotes));
      }
    } catch (_) {}

    // 3. Gửi lưu bền vững lên Backend nếu có hồ sơ và tài khoản
    if (currentEvaluationId && isLoggedIn && user?.email) {
      try {
        const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
        const resp = await fetch('/api/user/evaluations/save-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionToken,
            'x-user-email': user.email,
          },
          body: JSON.stringify({
            evaluationId: currentEvaluationId,
            teacherNotes: updatedTeacherNotes,
            customProposals: analysis.customProposals,
            analysisResult: {
              ...analysis,
              teacherNotes: updatedTeacherNotes,
              customProposals: analysis.customProposals,
              redTeamCards: updatedCards,
            },
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
          return { success: false, error: data.error || 'Máy chủ không thể lưu ghi chú.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Lỗi kết nối khi lưu ghi chú.' };
      }
    }

    return { success: true };
  };

  // Perform AI Analysis from server with Automatic Retry, Timeout, Classification & Preservation
  const handleAnalyzeSKKN = async (
    skknText: string,
    rubricText: string,
    evidenceFiles: UploadedFileItem[],
    notes: string,
    extraMetadata?: {
      originalFileName?: string;
      originalFileSize?: number;
      originalFileBase64?: string;
      wordCount?: number;
      title?: string;
      subject?: string;
      gradeLevel?: string;
    }
  ) => {
    // 7. Double request prevention: block any concurrent triggers
    if (isAnalyzingRef.current) {
      console.warn('Yêu cầu phân tích đang được xử lý, bỏ qua lượt bấm lặp.');
      return;
    }

    // Kiểm tra số lượt còn lại theo chế độ (Dễ dùng / Chuyên sâu)
    if (!hasQuotaForMode(appMode)) {
      openQuotaModal(appMode);
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
              promptNotes: notes,
              userContext: {
                guestId,
                email: user?.email,
                userId: user?.id,
                mode: appMode
              }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errJson: any = null;
            try {
              errJson = await response.json();
            } catch (_) {}

            if (response.status === 403 && (errJson?.code === 'GUEST_QUOTA_EXCEEDED' || errJson?.code === 'TRIAL_QUOTA_EXCEEDED')) {
              openQuotaModal(appMode);
              isAnalyzingRef.current = false;
              setIsAnalyzing(false);
              setWorkflowStatus('IDLE');
              return;
            }

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
          setOriginalSkknText(skknText);
          setDraftSkknText(skknText);
          setIsDemoMode(false);
          setSelectedSampleIndex(2);
          setIsUploadWorkspace(false);
          setActiveTab('dashboard');
          setWorkflowStatus('COMPLETED');
          setRetryState(null);
          setAnalysisError(null);

          if (rawData?.quota) {
            updateUserQuota(rawData.quota, rawData.role);
          }

          const issuesCount = parsedResult.redTeamCards.length;
          setCompletionToast({ count: issuesCount });

          // Tự động lưu hồ sơ vào hệ thống lưu trữ bền vững (Requirement B)
          autoSaveEvaluation(parsedResult, extraMetadata);

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

  // Áp dụng thay đổi từ Gợi ý sửa vào Bản nháp hồ sơ (Requirement B)
  const handleApplyChange = async (changeItem: ChangeSetItem) => {
    // 1. Cập nhật changeSet trong analysis và customAnalysis
    let nextChangeSet: ChangeSetItem[] = [];
    setAnalysis(prev => {
      const existing = prev.changeSet || [];
      const idx = existing.findIndex(c => c.changeId === changeItem.changeId || (changeItem.issueId && c.issueId === changeItem.issueId));
      if (idx >= 0) {
        nextChangeSet = [...existing];
        nextChangeSet[idx] = changeItem;
      } else {
        nextChangeSet = [...existing, changeItem];
      }
      return {
        ...prev,
        changeSet: nextChangeSet
      };
    });

    if (customAnalysis) {
      setCustomAnalysis(prev => {
        if (!prev) return null;
        const existing = prev.changeSet || [];
        const idx = existing.findIndex(c => c.changeId === changeItem.changeId || (changeItem.issueId && c.issueId === changeItem.issueId));
        let updated: ChangeSetItem[];
        if (idx >= 0) {
          updated = [...existing];
          updated[idx] = changeItem;
        } else {
          updated = [...existing, changeItem];
        }
        return {
          ...prev,
          changeSet: updated
        };
      });
    }

    // 2. Cập nhật bản nháp draftSkknText (Bảo vệ originalSkknText v1 bất biến) (Requirement B.2, B.3, C)
    let newDraft = draftSkknText || originalSkknText || '';
    if (changeItem.originalText && changeItem.approvedText) {
      const rawOrig = changeItem.originalText.trim();
      const approvedTrim = changeItem.approvedText.trim();
      if (newDraft && newDraft.includes(rawOrig)) {
        newDraft = newDraft.replace(rawOrig, approvedTrim);
      } else if (newDraft && changeItem.proposedText && newDraft.includes(changeItem.proposedText.trim())) {
        newDraft = newDraft.replace(changeItem.proposedText.trim(), approvedTrim);
      } else if (newDraft) {
        const normalizedDraft = newDraft.replace(/\r\n/g, '\n');
        const normalizedOrig = rawOrig.replace(/\r\n/g, '\n');
        if (normalizedDraft.includes(normalizedOrig)) {
          newDraft = normalizedDraft.replace(normalizedOrig, approvedTrim);
        } else {
          newDraft = `${newDraft}\n\n[ĐÃ ÁP DỤNG THAY ĐỔI TẠI ${changeItem.location}]:\n${approvedTrim}`;
        }
      } else {
        newDraft = originalSkknText ? originalSkknText.replace(rawOrig, approvedTrim) : approvedTrim;
      }
      setDraftSkknText(newDraft);
    }

    // 3. Tự động lưu bản nháp và changeSet vào server nếu hồ sơ đã được lưu (Requirement B.9)
    if (currentEvaluationId && isLoggedIn && user?.email) {
      try {
        const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
        const googleCredential = (user as any)?.googleCredential || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_google_credential') : '') || '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        };
        if (sessionToken) {
          headers['x-session-token'] = sessionToken;
          headers['authorization'] = `Bearer ${sessionToken}`;
        }
        if (googleCredential) {
          headers['x-google-credential'] = googleCredential;
        }

        // ĐIỂM SỐ BẢO VỆ 35/100: Tuyệt đối không thay đổi điểm trước khi có kết quả chấm lại hợp lệ (Requirement C)
        const calculatedScore = analysis.rubricCriteria?.reduce((sum, c) => sum + (c.proposedScore ?? 0), 0) ?? (analysis as any).score ?? 35;

        await fetch('/api/user/evaluations/save-result', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            evaluationId: currentEvaluationId,
            analysisResult: {
              ...analysis,
              changeSet: nextChangeSet
            },
            title: analysis.metadata.title,
            subject: analysis.metadata.subject,
            score: calculatedScore,
            draftText: newDraft,
            changeSet: nextChangeSet
          }),
        });
      } catch (err) {
        console.error('[APPLY_CHANGE] Lỗi khi lưu bản nháp lên máy chủ:', err);
      }
    }

    // Lưu vào localStorage dự phòng để chống mất nội dung khi F5
    if (currentEvaluationId && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`skkn_draft_${currentEvaluationId}`, newDraft);
        localStorage.setItem(`skkn_changeset_${currentEvaluationId}`, JSON.stringify(nextChangeSet));
      } catch (_) {}
    }
  };

  // Hoàn tác thay đổi
  const handleRevertChange = async (changeId: string) => {
    let nextChangeSet: ChangeSetItem[] = [];
    setAnalysis(prev => {
      const existing = prev.changeSet || [];
      nextChangeSet = existing.filter(c => c.changeId !== changeId);
      return {
        ...prev,
        changeSet: nextChangeSet
      };
    });

    if (customAnalysis) {
      setCustomAnalysis(prev => {
        if (!prev) return null;
        return {
          ...prev,
          changeSet: (prev.changeSet || []).filter(c => c.changeId !== changeId)
        };
      });
    }

    if (currentEvaluationId && isLoggedIn && user?.email) {
      try {
        const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        };
        if (sessionToken) headers['x-session-token'] = sessionToken;
        const calculatedScore = analysis.rubricCriteria?.reduce((sum, c) => sum + (c.proposedScore ?? 0), 0) ?? (analysis as any).score ?? 35;

        await fetch('/api/user/evaluations/save-result', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            evaluationId: currentEvaluationId,
            analysisResult: {
              ...analysis,
              changeSet: nextChangeSet
            },
            title: analysis.metadata.title,
            subject: analysis.metadata.subject,
            score: calculatedScore,
            draftText: draftSkknText,
            changeSet: nextChangeSet
          }),
        });
      } catch (err) {
        console.error('[REVERT_CHANGE] Lỗi khi hoàn tác trên máy chủ:', err);
      }
    }
  };

  // Generate questions grounded in the actual uploaded SKKN, not its title alone.
  const handleGenerateMoreCouncilQuestions = async () => {
    if (isLoadingMoreCouncil) return;
    setIsLoadingMoreCouncil(true);
    try {
      const skknText = draftSkknText || originalSkknText || '';
      if (skknText.trim().length < 250) {
        window.alert('Không tìm thấy nội dung file SKKN đang mở. Vui lòng tải lại hồ sơ gốc trước khi tạo câu hỏi.');
        return;
      }
      const resp = await fetch('/api/ask-council', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skknTitle: analysis.metadata.title, skknText,
          issues: analysis.redTeamCards.map(c => ({issueDetected:c.issueDetected,location:c.location,relatedQuote:c.relatedQuote})),
          existingQuestions: analysis.councilQuestions
        })
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(payload.error || `API trả lỗi ${resp.status}`);
      if (!Array.isArray(payload)) throw new Error('Dữ liệu câu hỏi không hợp lệ.');
      setAnalysis(prev => ({...prev, councilQuestions: [...prev.councilQuestions, ...payload]}));
    } catch (err: any) {
      console.error('[COUNCIL]', err);
      window.alert(err.message || 'Không thể tạo câu hỏi có căn cứ từ SKKN.');
    } finally { setIsLoadingMoreCouncil(false); }
  };

  // Rescore after revisions
  const handleRescore = async (
    revisedNotes: string,
    method: 'gemini_ai' | 'rubric_rule' = 'gemini_ai'
  ) => {
    if (isRescoringRef.current) return;
    isRescoringRef.current = true;
    setIsRescoring(true);
    setRescoreError(null);
    try {
      const currentScore = analysis.rubricCriteria.reduce((sum, c) => sum + (c.proposedScore ?? 0), 0);
      // Tối ưu hóa payload gửi đi: chỉ gửi các trường cần thiết cho Rubric và đối chiếu, tránh vượt quá giới hạn 4.5MB của Vercel
      const compactPreviousResult = {
        score: currentScore,
        evaluation: { score: currentScore },
        rubricCriteria: analysis.rubricCriteria,
        redTeamCards: analysis.redTeamCards,
      };

      const resp = await fetch('/api/rescore-skkn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousResult: compactPreviousResult,
          revisedNotes,
          method,
        }),
      });

      const rescoreData = await resp.json().catch(() => null);

      if (!resp.ok || !rescoreData || rescoreData.success === false) {
        // FACT SAFETY: AI Thất bại -> Giữ nguyên previousResult, không thay đổi điểm, không đổi issue, không tạo phiên bản mới
        const fallbackMsg = resp.status === 404
          ? 'Không tìm thấy API chấm lại (/api/rescore-skkn). Vui lòng kiểm tra triển khai serverless trên Vercel.'
          : 'Chưa thể chấm lại lúc này. Kết quả đánh giá hiện tại được giữ nguyên. Vui lòng thử lại.';
        setRescoreError({
          message: rescoreData?.message || rescoreData?.error || fallbackMsg,
          retryable: rescoreData?.retryable ?? true,
        });
        return;
      }

      setRescoreError(null);

      let updatedCriteria = [...analysis.rubricCriteria];
      if (rescoreData.updatedCriteria && Array.isArray(rescoreData.updatedCriteria)) {
        updatedCriteria = analysis.rubricCriteria.map(c => {
          const match = rescoreData.updatedCriteria.find((u: any) => u.criterionName === c.criterionName);
          if (match && typeof match.newScore === 'number') {
            return { ...c, proposedScore: match.newScore };
          }
          return c;
        });
      }

      const calculatedScore = updatedCriteria.reduce((sum, c) => sum + (c.proposedScore ?? 0), 0);

      const newAnalysisResult: SKKNAnalysisResult = {
        ...analysis,
        rubricCriteria: updatedCriteria,
        rescoreHistory: rescoreData,
      };

      setAnalysis(newAnalysisResult);
      if (customAnalysis) {
        setCustomAnalysis(newAnalysisResult);
      }

      // Tự động lưu phiên bản mới vào cơ sở dữ liệu nếu đã có hồ sơ
      if (currentEvaluationId && isLoggedIn && user?.email) {
        try {
          const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
          const saveVerResp = await fetch('/api/user/evaluations/new-version', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-session-token': sessionToken,
              'x-user-email': user.email,
            },
            body: JSON.stringify({
              evaluationId: currentEvaluationId,
              newAnalysisResult,
              newScore: calculatedScore,
              notes: `${method === 'rubric_rule' ? 'Đánh giá theo Rubric không cần AI' : 'Chấm chuyên sâu bằng Gemini AI'}: ${revisedNotes || 'Chấm lại sau khi chỉnh sửa sáng kiến'}`,
            }),
          });
          const saveVerData = await saveVerResp.json().catch(() => null);
          if (saveVerData?.success && saveVerData?.evaluation) {
            setCurrentEvaluationItem(saveVerData.evaluation);
            setSaveStatus('saved');
          }
        } catch (syncErr) {
          console.error('Lỗi đồng bộ phiên bản mới:', syncErr);
        }
      }
    } catch (err: any) {
      console.error('Error in rescore:', err);
      setRescoreError({
        message: 'Chưa thể chấm lại lúc này. Kết quả đánh giá hiện tại được giữ nguyên. Vui lòng thử lại.',
        retryable: true
      });
    } finally {
      setIsRescoring(false);
      isRescoringRef.current = false;
    }
  };

  // Render trang quản trị độc lập /quan-tri chiếm trọn màn hình, không hiển thị trang SKKN phía sau
  if (isQuanTriPath) {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans select-none">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4 shadow-xl">
            <Shield className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">ĐANG XÁC THỰC QUYỀN QUẢN TRỊ...</h3>
          <p className="text-sm text-slate-400">Hệ thống đang kiểm tra phiên làm việc với Google Sheets USERS</p>
        </div>
      );
    }

    if (role !== 'ADMIN' && !isAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">403 - TRUY CẬP BỊ TỪ CHỐI</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Bạn không có quyền truy cập trang quản trị <code className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-xs">/quan-tri</code>. Hệ thống yêu cầu tài khoản được cấp quyền quản trị (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-xs">USERS.ROLE = "ADMIN"</code>) trong cơ sở dữ liệu.
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-md"
            >
              Quay lại Trang Chủ SKKN
            </button>
          </div>
        </div>
      );
    }

    // Role = ADMIN: Hiển thị toàn bộ trang quản trị độc lập
    return <AdminPortalModal />;
  }

  // Khi đang khôi phục dữ liệu hồ sơ sau F5, hiển thị màn hình nạp dữ liệu để tránh race-condition với dữ liệu mẫu
  if (isRestoringEvaluation && !customAnalysis) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white font-sans p-4">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-[17px] font-bold text-white tracking-tight">
            Đang tải và khôi phục hồ sơ SKKN...
          </h2>
          <p className="text-[13.5px] text-slate-400 leading-relaxed">
            Hệ thống đang phục hồi đồng bộ dữ liệu phản biện, đoạn đề xuất chỉnh sửa và ghi chú xử lý của Thầy/Cô.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          navigateToTab(tab);
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
          onOpenMyEvaluations={() => navigateToTab('my_evaluations')}
          onStartNewSKKN={() => {
            setCurrentEvaluationId(null);
            try {
              sessionStorage.removeItem('skkn_active_eval_id');
              localStorage.removeItem('skkn_active_eval_id');
              localStorage.removeItem('skkn_current_eval_id');
            } catch (_) {}
            setViewingRebuttalCardId(null);
            setIsViewingProfileDetail(false);
            setSaveStatus('idle');
            setSaveErrorMessage(null);
            setIsUploadWorkspace(true);
            navigateToTab('dashboard');
          }}
          onExitDemo={() => {
            setIsDemoMode(false);
            if (customAnalysis) {
              setAnalysis(customAnalysis);
            }
          }}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
            {activeTab === 'my_evaluations' ? (
              <MyEvaluationsView
                onSelectEvaluation={async (item: EvaluationItem) => {
                  setCurrentEvaluationId(item.id);
                  try {
                    sessionStorage.setItem('skkn_active_eval_id', item.id);
                    localStorage.setItem('skkn_active_eval_id', item.id);
                  } catch (_) {}
                  setSaveStatus('saved');
                  if (item.analysisResult) {
                    setCustomAnalysis(item.analysisResult);
                    setAnalysis(item.analysisResult);
                    setDraftSkknText(item.draftText || item.originalText || '');
                    setOriginalSkknText(item.originalText || '');
                    setWorkflowStatus('COMPLETED');
                    setIsDemoMode(false);
                    setIsUploadWorkspace(false);
                    navigateToTab('dashboard');
                  } else {
                    try {
                      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
                      const resp = await fetch(`/api/user/evaluations/get?id=${encodeURIComponent(item.id)}`, {
                        headers: {
                          'x-session-token': sessionToken,
                          'x-user-email': user?.email || '',
                        },
                      });
                      const contentType = resp.headers.get('content-type') || '';
                      if (!contentType.includes('application/json')) {
                        throw new Error(`Máy chủ phản hồi ${resp.status} không phải JSON.`);
                      }
                      const data = await resp.json();
                      if (data.success && data.evaluation?.analysisResult) {
                        setCustomAnalysis(data.evaluation.analysisResult);
                        setAnalysis(data.evaluation.analysisResult);
                        setDraftSkknText(data.evaluation.draftText || data.evaluation.originalText || '');
                        setOriginalSkknText(data.evaluation.originalText || '');
                        setWorkflowStatus('COMPLETED');
                        setIsDemoMode(false);
                        setIsUploadWorkspace(false);
                        navigateToTab('dashboard');
                      }
                    } catch (err) {
                      console.error('Lỗi khi tải chi tiết hồ sơ:', err);
                    }
                  }
                }}
                onContinueEdit={async (item: EvaluationItem) => {
                  setCurrentEvaluationId(item.id);
                  try {
                    sessionStorage.setItem('skkn_active_eval_id', item.id);
                    localStorage.setItem('skkn_active_eval_id', item.id);
                  } catch (_) {}
                  setSaveStatus('saved');
                  if (item.analysisResult) {
                    setCustomAnalysis(item.analysisResult);
                    setAnalysis(item.analysisResult);
                    setDraftSkknText(item.draftText || item.originalText || '');
                    setOriginalSkknText(item.originalText || '');
                    setWorkflowStatus('COMPLETED');
                    setIsDemoMode(false);
                    setIsUploadWorkspace(false);
                    navigateToTab('suggestions');
                  } else {
                    try {
                      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
                      const resp = await fetch(`/api/user/evaluations/get?id=${encodeURIComponent(item.id)}`, {
                        headers: {
                          'x-session-token': sessionToken,
                          'x-user-email': user?.email || '',
                        },
                      });
                      const contentType = resp.headers.get('content-type') || '';
                      if (!contentType.includes('application/json')) {
                        throw new Error(`Máy chủ phản hồi ${resp.status} không phải JSON.`);
                      }
                      const data = await resp.json();
                      if (data.success && data.evaluation?.analysisResult) {
                        setCustomAnalysis(data.evaluation.analysisResult);
                        setAnalysis(data.evaluation.analysisResult);
                        setDraftSkknText(data.evaluation.draftText || data.evaluation.originalText || '');
                        setOriginalSkknText(data.evaluation.originalText || '');
                        setWorkflowStatus('COMPLETED');
                        setIsDemoMode(false);
                        setIsUploadWorkspace(false);
                        navigateToTab('suggestions');
                      }
                    } catch (err) {
                      console.error('Lỗi khi mở chỉnh sửa hồ sơ:', err);
                    }
                  }
                }}
                onRescore={async (item: EvaluationItem) => {
                  setCurrentEvaluationId(item.id);
                  try {
                    sessionStorage.setItem('skkn_active_eval_id', item.id);
                    localStorage.setItem('skkn_active_eval_id', item.id);
                  } catch (_) {}
                  setSaveStatus('saved');
                  if (item.analysisResult) {
                    setCustomAnalysis(item.analysisResult);
                    setAnalysis(item.analysisResult);
                    setDraftSkknText(item.draftText || item.originalText || '');
                    setOriginalSkknText(item.originalText || '');
                    setWorkflowStatus('COMPLETED');
                    setIsDemoMode(false);
                    setIsUploadWorkspace(false);
                    navigateToTab('rescore');
                  } else {
                    try {
                      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
                      const resp = await fetch(`/api/user/evaluations/get?id=${encodeURIComponent(item.id)}`, {
                        headers: {
                          'x-session-token': sessionToken,
                          'x-user-email': user?.email || '',
                        },
                      });
                      const contentType = resp.headers.get('content-type') || '';
                      if (!contentType.includes('application/json')) {
                        throw new Error(`Máy chủ phản hồi ${resp.status} không phải JSON.`);
                      }
                      const data = await resp.json();
                      if (data.success && data.evaluation?.analysisResult) {
                        setCustomAnalysis(data.evaluation.analysisResult);
                        setAnalysis(data.evaluation.analysisResult);
                        setDraftSkknText(data.evaluation.draftText || data.evaluation.originalText || '');
                        setOriginalSkknText(data.evaluation.originalText || '');
                        setWorkflowStatus('COMPLETED');
                        setIsDemoMode(false);
                        setIsUploadWorkspace(false);
                        navigateToTab('rescore');
                      }
                    } catch (err) {
                      console.error('Lỗi khi mở chấm lại hồ sơ:', err);
                    }
                  }
                }}
                onStartNewSKKN={() => {
                  setCurrentEvaluationId(null);
                  try {
                    sessionStorage.removeItem('skkn_active_eval_id');
                    localStorage.removeItem('skkn_active_eval_id');
                    localStorage.removeItem('skkn_current_eval_id');
                  } catch (_) {}
                  setSaveStatus('idle');
                  setSaveErrorMessage(null);
                  setIsUploadWorkspace(true);
                  navigateToTab('dashboard');
                }}
              />
            ) : viewingRebuttalCardId ? (
              (() => {
                const selectedCard = currentAnalysis.redTeamCards.find(c => c.id === viewingRebuttalCardId) || currentAnalysis.redTeamCards[0];
                return selectedCard ? (
                  <AcademicRebuttalView
                    card={selectedCard}
                    cards={currentAnalysis.redTeamCards}
                    suggestions={currentAnalysis.suggestions}
                    customProposals={currentAnalysis.customProposals}
                    teacherNotesMap={currentAnalysis.teacherNotes}
                    evaluationId={currentEvaluationId || undefined}
                    userEmail={user?.email || undefined}
                    onSaveCustomProposal={handleSaveCustomProposal}
                    onSaveTeacherNotes={handleSaveTeacherNotes}
                    initialTier={selectedRevisionTier}
                    onTierChange={(tier) => setSelectedRevisionTier(tier)}
                    onSelectCard={(nextCard) => setViewingRebuttalCardId(nextCard.id)}
                    onUpdateStatus={handleUpdateCardStatus}
                    onBack={() => {
                      setViewingRebuttalCardId(null);
                      try {
                        sessionStorage.removeItem('skkn_active_rebuttal_id');
                      } catch (_) {}
                      navigateToTab(rebuttalReturnTab);
                    }}
                    onGoToSuggestion={handleGoToSuggestionForCard}
                    onApplyChange={handleApplyChange}
                    changeSet={currentAnalysis.changeSet}
                    skknFullText={draftSkknText || originalSkknText}
                  />
                ) : null;
              })()
            ) : activeTab === 'dashboard' ? (
              isViewingProfileDetail ? (
                <ProfileDetailView
                  analysis={currentAnalysis}
                  isSample={isDemoMode}
                  isDemoMode={isDemoMode}
                  onBack={() => setIsViewingProfileDetail(false)}
                  onNavigateTab={(tab) => {
                    setIsViewingProfileDetail(false);
                    setViewingRebuttalCardId(null);
                    navigateToTab(tab);
                  }}
                  onGoToIssue={(card) => {
                    setIsViewingProfileDetail(false);
                    handleOpenAcademicRebuttal(card, 'dashboard');
                  }}
                />
              ) : (
                <DashboardView
                  analysis={currentAnalysis}
                  onNavigateTab={(tab) => {
                    setIsViewingProfileDetail(false);
                    setViewingRebuttalCardId(null);
                    navigateToTab(tab);
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
                    const sampleText = sampleInitiative1.suggestions.map(s => `[${s.targetSection}]\n${s.originalText}`).join('\n\n');
                    setOriginalSkknText(sampleText);
                    setDraftSkknText(sampleText);
                    setCurrentEvaluationId(null);
                    setSaveStatus('idle');
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
                  onOpenAcademicRebuttal={(card) => handleOpenAcademicRebuttal(card, 'dashboard')}
                  saveStatus={saveStatus}
                  saveErrorMessage={saveErrorMessage}
                  currentEvaluationId={currentEvaluationId}
                  onRetrySave={() => {
                    if (customAnalysis) {
                      autoSaveEvaluation(customAnalysis, lastSavedMetadata || undefined);
                    }
                  }}
                  onOpenMyEvaluations={() => {
                    setViewingRebuttalCardId(null);
                    setIsViewingProfileDetail(false);
                    navigateToTab('my_evaluations');
                  }}
                  onOpenAuth={() => openAuthModal('login')}
                />
              )
            ) : !isDemoMode && !hasActiveEvaluation ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center max-w-lg mx-auto my-12 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Chưa có hồ sơ được chọn để hiển thị
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Trang này yêu cầu một hồ sơ SKKN đang hoạt động. Thầy/Cô hãy chọn một hồ sơ từ kho cá nhân hoặc tải lên SKKN mới.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateToTab('my_evaluations')}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Chọn từ "Hồ sơ của tôi"</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadWorkspace(true);
                      navigateToTab('dashboard');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tải SKKN mới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDemoMode(true);
                      setSelectedSampleIndex(0);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Xem hồ sơ mẫu →
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
                    onOpenAcademicRebuttal={(card) => handleOpenAcademicRebuttal(card, 'red_team')}
                    onGoToSuggestionForCard={handleGoToSuggestionForCard}
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
                    languageCheck={currentAnalysis.languageCheck}
                    missingContents={currentAnalysis.missingContents}
                    supportTemplates={currentAnalysis.supportTemplates}
                    changeSet={currentAnalysis.changeSet}
                    customProposals={currentAnalysis.customProposals}
                    onSaveCustomProposal={handleSaveCustomProposal}
                    onUpdateIssueStatus={handleUpdateCardStatus}
                    onApplyChange={handleApplyChange}
                    onRevertChange={handleRevertChange}
                    onGenerateCustomSuggestion={handleGenerateCustomSuggestion}
                    isGenerating={isGeneratingSuggestion}
                    onNavigateTab={(tab) => {
                      setViewingRebuttalCardId(null);
                      navigateToTab(tab);
                    }}
                    originalDocxBuffer={originalDocxBuffer}
                    skknTitle={currentAnalysis.metadata.title}
                    skknFullText={draftSkknText || originalSkknText}
                    targetSuggestionCardId={targetSuggestionCardId}
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
                    onNavigateTab={(tab) => navigateToTab(tab)}
                    rescoreError={rescoreError}
                    draftText={draftSkknText}
                    originalText={originalSkknText}
                    dossierTitle={currentEvaluationItem?.title || currentAnalysis.metadata?.title}
                    currentVersion={currentEvaluationItem?.currentVersion || currentEvaluationItem?.versionCount || 1}
                    previousScore={currentEvaluationItem?.score ?? currentAnalysis.rubricCriteria.reduce((sum, c) => sum + c.proposedScore, 0)}
                    originalFileName={currentEvaluationItem?.originalFileName || lastSavedMetadata?.originalFileName}
                    versionsHistory={currentEvaluationItem?.versionsHistory}
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
        </div>

        {/* Footer Toàn Ứng Dụng */}
        <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-3 sm:py-3.5 px-4 text-center shrink-0">
          <p className="text-[12.5px] sm:text-[13px] text-slate-600 leading-normal text-center">
            Copyright @ 2026- Được phát triển bởi <strong className="font-bold text-slate-800">THẦY HỒ NGUYỄN ĐA THIỆN</strong>
          </p>
        </footer>
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
        onOpenMyEvaluations={() => {
          setIsProfileDrawerOpen(false);
          setActiveTab('my_evaluations');
        }}
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

      {/* Account & License Modal */}
      <AuthModal />

      {/* Quota Exceeded Notification Modal */}
      <QuotaExceededModal />
    </div>
  );
}
