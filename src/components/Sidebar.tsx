import React from 'react';
import {
  LayoutDashboard,
  Award,
  ShieldAlert,
  Sparkles,
  Layers,
  Calculator,
  Cpu,
  BookCopy,
  PenTool,
  MessageSquareWarning,
  RefreshCw,
  FileText,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { SKKNAnalysisResult } from '../types';

export type ActiveTab = 
  | 'dashboard'
  | 'rubric'
  | 'red_team'
  | 'novelty'
  | 'evidence'
  | 'data_logic'
  | 'ai_markers'
  | 'similarity_citations'
  | 'suggestions'
  | 'council'
  | 'rescore'
  | 'report';

export type AppMode = 'easy' | 'advanced';

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeType?: 'danger' | 'warning' | 'neutral' | 'success';
}

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  analysis: SKKNAnalysisResult;
  hasEvaluated?: boolean;
  onOpenProfileDrawer?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  analysis,
  hasEvaluated = true,
  onOpenProfileDrawer,
  isMobileOpen,
  onCloseMobile,
  appMode,
  setAppMode
}) => {
  const totalIssues = analysis.redTeamCards.length;
  const processedIssues = analysis.redTeamCards.filter(c => c.status === 'Đã xử lý').length;

  // Requirement 1: Progress badge processedIssues / totalIssues (0/5 ... 5/5 ✓)
  const isShowIssueProgress = Boolean(hasEvaluated && totalIssues > 0);
  const issueProgressBadge = isShowIssueProgress
    ? processedIssues === totalIssues
      ? `${processedIssues}/${totalIssues} ✓`
      : `${processedIssues}/${totalIssues}`
    : undefined;
  const issueBadgeType: 'success' | 'danger' | 'warning' | 'neutral' = 
    processedIssues === totalIssues ? 'success' : processedIssues > 0 ? 'warning' : 'danger';

  const missingEvidenceCount = analysis.evidenceChain.filter(
    e => e.status === 'chua_tim_thay_minh_chung'
  ).length;

  const dataIssuesCount = analysis.dataAnomalies.length;
  const aiFindingsCount = analysis.aiMarkers?.findings?.length || 0;
  const similarityCount = (analysis.similarityAndCitations?.similarityFindings?.length || 0) + 
    (analysis.similarityAndCitations?.referenceChecks?.filter(r => r.verificationStatus !== 'xac_minh_duoc')?.length || 0);
  const councilQuestionsCount = analysis.councilQuestions.length;
  const hasNoveltyRisk = analysis.novelty.overallLevel === 'tuong_dong_dang_ke' || 
    analysis.novelty.overallLevel === 'nguy_co_trung_lap_cao';

  // 1. CHẾ ĐỘ DỄ DÙNG: CỰC GỌN (Chỉ 5 mục luồng thao tác)
  const easyNavItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'TỔNG QUAN',
      desc: 'Bức tranh toàn cảnh kết quả & danh sách việc cần xử lý',
      icon: LayoutDashboard
    },
    {
      id: 'red_team',
      label: 'CẦN XỬ LÝ',
      desc: 'Danh sách các vấn đề phản biện cần xử lý trước khi nộp',
      icon: ShieldAlert,
      badge: issueProgressBadge,
      badgeType: issueBadgeType
    },
    {
      id: 'rescore',
      label: 'CHẤM LẠI',
      desc: 'Chấm lại sau khi hoàn tất chỉnh sửa các vấn đề',
      icon: RefreshCw
    },
    {
      id: 'report',
      label: 'BÁO CÁO',
      desc: 'Báo cáo thẩm định toàn diện phục vụ nộp hội đồng',
      icon: FileText
    }
  ];

  // 2. CHẾ ĐỘ CHUYÊN SÂU: Đầy đủ các module chuyên gia
  const advancedNavItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'TỔNG QUAN',
      desc: 'Bức tranh toàn cảnh kết quả thẩm định',
      icon: LayoutDashboard
    },
    {
      id: 'rubric',
      label: 'CHẤM RUBRIC',
      desc: 'Chấm điểm từng tiêu chí theo phiếu chấm chính thức',
      icon: Award,
      badge: analysis.rubricCriteria.length > 0 ? analysis.rubricCriteria.length : undefined,
      badgeType: 'neutral'
    },
    {
      id: 'red_team',
      label: 'CẦN XỬ LÝ',
      desc: 'Tìm điểm yếu và các lỗi hội đồng có thể phản biện',
      icon: ShieldAlert,
      badge: issueProgressBadge,
      badgeType: issueBadgeType
    },
    {
      id: 'novelty',
      label: 'TÍNH MỚI',
      desc: 'Kiểm tra mức độ khác biệt và phân biệt công nghệ vs phương pháp',
      icon: Sparkles,
      badge: hasNoveltyRisk ? '!' : '✓',
      badgeType: hasNoveltyRisk ? 'warning' : 'neutral'
    },
    {
      id: 'evidence',
      label: 'MINH CHỨNG',
      desc: 'Kiểm tra luận điểm đã có bằng chứng thực nghiệm chưa',
      icon: Layers,
      badge: missingEvidenceCount > 0 ? missingEvidenceCount : '✓',
      badgeType: missingEvidenceCount > 0 ? 'warning' : 'neutral'
    },
    {
      id: 'data_logic',
      label: 'SỐ LIỆU & LOGIC',
      desc: 'Phát hiện sai lệch cỡ mẫu, phần trăm và đứt gãy logic',
      icon: Calculator,
      badge: dataIssuesCount > 0 ? dataIssuesCount : '✓',
      badgeType: dataIssuesCount > 0 ? 'danger' : 'neutral'
    },
    {
      id: 'ai_markers',
      label: 'DẤU HIỆU AI',
      desc: 'Rà soát các đoạn văn phong khái quát mang tính công thức',
      icon: Cpu,
      badge: aiFindingsCount > 0 ? aiFindingsCount : '0',
      badgeType: 'neutral'
    },
    {
      id: 'similarity_citations',
      label: 'NGUỒN & TRÍCH DẪN',
      desc: 'Kiểm tra độ chính xác của trích dẫn và tương đồng văn bản',
      icon: BookCopy,
      badge: similarityCount > 0 ? similarityCount : '✓',
      badgeType: similarityCount > 0 ? 'warning' : 'neutral'
    },
    {
      id: 'suggestions',
      label: 'GỢI Ý CHỈNH SỬA',
      desc: 'Đề xuất viết lại theo 3 mức độ tôn trọng dữ liệu gốc',
      icon: PenTool,
      badge: analysis.suggestions.length,
      badgeType: 'neutral'
    },
    {
      id: 'council',
      label: 'HỎI HỘI ĐỒNG',
      desc: 'Dự báo câu hỏi chất vấn của ban giám khảo',
      icon: MessageSquareWarning,
      badge: councilQuestionsCount,
      badgeType: 'neutral'
    },
    {
      id: 'rescore',
      label: 'CHẤM LẠI',
      desc: 'Chấm lại sau khi hoàn tất chỉnh sửa các vấn đề',
      icon: RefreshCw,
      badge: analysis.rescoreHistory ? '✓' : '—',
      badgeType: analysis.rescoreHistory ? 'success' : 'neutral'
    },
    {
      id: 'report',
      label: 'BÁO CÁO',
      desc: 'Báo cáo thẩm định toàn diện 14 mục',
      icon: FileText,
      badge: '14 mục',
      badgeType: 'neutral'
    }
  ];

  const currentNavItems = appMode === 'easy' ? easyNavItems : advancedNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside className={`w-[240px] bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shrink-0 select-none transition-transform duration-200 z-50 ${
        isMobileOpen
          ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl'
          : 'hidden lg:flex static'
      }`}>
        {/* App Branding */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md text-xs shrink-0">
              PRO
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                SKKN REVIEW
                <span className="text-[10px] px-1 py-0.2 rounded bg-blue-500/30 text-blue-300 font-semibold border border-blue-400/30 shrink-0">
                  PRO
                </span>
               
              </h1>
              <p className="text-[10px] text-slate-400 truncate">
                {appMode === 'easy' ? ' Dễ dùng cho giáo viên' : 'Chế độ Chuyên sâu'}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Chỉ Dùng Để ĐIỀU HƯỚNG */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Mục HỒ SƠ - Mở Drawer Hồ sơ */}
          {onOpenProfileDrawer && (
            <button
              type="button"
              onClick={() => {
                onOpenProfileDrawer();
                if (onCloseMobile) onCloseMobile();
              }}
              title="Xem thông tin hồ sơ SKKN, phiếu chấm và chọn tài liệu"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">HỒ SƠ</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                Xem ▾
              </span>
            </button>
          )}

          {/* Divider nhẹ */}
          <div className="my-1.5 border-t border-slate-800/80" />

          {/* Danh sách Menu Items */}
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={item.desc}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Compact Right Badge (Chỉ hiện khi cần) */}
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-700/80 text-white'
                        : item.badgeType === 'danger'
                        ? 'bg-rose-500/20 text-rose-300'
                        : item.badgeType === 'warning'
                        ? 'bg-amber-500/20 text-amber-300'
                        : item.badgeType === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Nút chuyển đổi nhanh chế độ */}
          <div className="pt-2">
            <div className="border-t border-slate-800/80 pt-2">
              {appMode === 'easy' ? (
                <button
                  type="button"
                  onClick={() => setAppMode('advanced')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-blue-300 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <span>Chuyên sâu</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAppMode('easy')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-blue-300 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Dễ dùng</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer: Switch nhỏ [Dễ dùng] [Chuyên sâu] */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setAppMode('easy')}
              className={`flex-1 py-1 px-2 rounded-md text-center transition-all cursor-pointer ${
                appMode === 'easy'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dễ dùng
            </button>
            <button
              type="button"
              onClick={() => setAppMode('advanced')}
              className={`flex-1 py-1 px-2 rounded-md text-center transition-all cursor-pointer ${
                appMode === 'advanced'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chuyên sâu
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
