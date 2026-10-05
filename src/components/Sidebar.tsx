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
  const isShowBadges = Boolean(hasEvaluated);

  const totalIssues = analysis.redTeamCards.length;
  const processedIssues = analysis.redTeamCards.filter(c => 
    c.status === 'Đã xử lý' || c.status === 'resolved' || c.status === 'Bỏ qua' || c.status === 'ignored'
  ).length;
  const remainingIssues = totalIssues - processedIssues;

  // CẦN XỬ LÝ: số vấn đề chưa xử lý. Nếu còn 0: hiển thị ✓
  const issueProgressBadge = isShowBadges && totalIssues > 0
    ? remainingIssues === 0
      ? '✓'
      : `${remainingIssues}`
    : undefined;
  const issueBadgeType: 'success' | 'danger' | 'warning' | 'neutral' = 
    remainingIssues === 0 ? 'success' : 'danger';

  // MINH CHỨNG: số vấn đề minh chứng cần xử lý
  const missingEvidenceCount = analysis.evidenceChain.filter(
    e => e.status === 'chua_tim_thay_minh_chung'
  ).length;
  const evidenceBadge = isShowBadges && missingEvidenceCount > 0 ? missingEvidenceCount : undefined;

  // SỐ LIỆU & LOGIC: số lỗi/mâu thuẫn thật
  const dataIssuesCount = analysis.dataAnomalies.length;
  const dataBadge = isShowBadges && dataIssuesCount > 0 ? dataIssuesCount : undefined;

  // DẤU HIỆU AI: số đoạn cần rà soát (KHÔNG phải "do AI viết")
  const aiFindingsCount = analysis.aiMarkers?.findings?.length || 0;
  const aiBadge = isShowBadges && aiFindingsCount > 0 ? aiFindingsCount : undefined;

  // NGUỒN & TRÍCH DẪN: số vấn đề nguồn/trích dẫn cần xử lý
  const similarityCount = (analysis.similarityAndCitations?.similarityFindings?.filter(f => f.reviewLevel !== 'chua_phat_hien')?.length || 0) + 
    (analysis.similarityAndCitations?.referenceChecks?.filter(r => r.verificationStatus !== 'xac_minh_duoc')?.length || 0);
  const citationBadge = isShowBadges && similarityCount > 0 ? similarityCount : undefined;

  // GỢI Ý SỬA & HOÀN THIỆN: số đề xuất chưa xử lý
  const suggestionsBadge = isShowBadges && remainingIssues > 0 ? remainingIssues : undefined;

  // TÍNH MỚI: cảnh báo nếu có nguy cơ trùng lặp
  const hasNoveltyRisk = analysis.novelty?.overallLevel === 'tuong_dong_dang_ke' || 
    analysis.novelty?.overallLevel === 'nguy_co_trung_lap_cao';
  const noveltyBadge = isShowBadges && hasNoveltyRisk ? '!' : undefined;

  // CHẤM LẠI: đã chấm lại thành công
  const rescoreBadge = isShowBadges && analysis.rescoreHistory ? '✓' : undefined;

  // 1. CHẾ ĐỘ DỄ DÙNG: CỰC GỌN (5 mục luồng thao tác)
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
      id: 'suggestions',
      label: 'GỢI Ý SỬA & HOÀN THIỆN',
      desc: 'Chỉ rõ lỗi, căn cứ, cách sửa và gợi ý viết lại 3 mức độ',
      icon: PenTool,
      badge: suggestionsBadge,
      badgeType: 'neutral'
    },
    {
      id: 'rescore',
      label: 'CHẤM LẠI',
      desc: 'Chấm lại sau khi hoàn tất chỉnh sửa các vấn đề',
      icon: RefreshCw,
      badge: rescoreBadge,
      badgeType: 'success'
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
      icon: Award
      // PHẦN 27: không cần dùng số 7 chỉ vì có 7 tiêu chí. Bỏ badge không mang ý nghĩa hành động.
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
      badge: noveltyBadge,
      badgeType: 'warning'
    },
    {
      id: 'evidence',
      label: 'MINH CHỨNG',
      desc: 'Kiểm tra luận điểm đã có bằng chứng thực nghiệm chưa',
      icon: Layers,
      badge: evidenceBadge,
      badgeType: 'warning'
    },
    {
      id: 'data_logic',
      label: 'SỐ LIỆU & LOGIC',
      desc: 'Phát hiện sai lệch cỡ mẫu, phần trăm và đứt gãy logic',
      icon: Calculator,
      badge: dataBadge,
      badgeType: 'danger'
    },
    {
      id: 'ai_markers',
      label: 'DẤU HIỆU AI',
      desc: 'Rà soát các đoạn văn phong khái quát mang tính công thức',
      icon: Cpu,
      badge: aiBadge,
      badgeType: 'neutral'
    },
    {
      id: 'similarity_citations',
      label: 'NGUỒN & TRÍCH DẪN',
      desc: 'Kiểm tra độ chính xác của trích dẫn và tương đồng văn bản',
      icon: BookCopy,
      badge: citationBadge,
      badgeType: 'warning'
    },
    {
      id: 'suggestions',
      label: 'GỢI Ý SỬA & HOÀN THIỆN',
      desc: 'Chỉ rõ lỗi, căn cứ, cách sửa và gợi ý viết lại 3 mức độ',
      icon: PenTool,
      badge: suggestionsBadge,
      badgeType: 'neutral'
    },
    {
      id: 'council',
      label: 'HỎI HỘI ĐỒNG',
      desc: 'Dự báo câu hỏi chất vấn của ban giám khảo',
      icon: MessageSquareWarning
    },
    {
      id: 'rescore',
      label: 'CHẤM LẠI',
      desc: 'Chấm lại sau khi hoàn tất chỉnh sửa các vấn đề',
      icon: RefreshCw,
      badge: rescoreBadge,
      badgeType: 'success'
    },
    {
      id: 'report',
      label: 'BÁO CÁO',
      desc: 'Báo cáo thẩm định toàn diện phục vụ nộp hội đồng',
      icon: FileText
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

      <aside className={`w-[280px] bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shrink-0 select-none transition-transform duration-200 z-50 ${
        isMobileOpen
          ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl'
          : 'hidden lg:flex static'
      }`}>
        {/* App Branding */}
        <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white shadow-md text-[13px] shrink-0 tracking-wider">
              PRO
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-[750] text-[16px] tracking-tight text-white">
                  SKKN REVIEW
                </span>
                <span className="text-[11.5px] px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-400 font-[700] border border-blue-400/30 leading-none shrink-0">
                  PRO
                </span>
              </div>
              <div className="text-[14px] font-[650] text-white/95 tracking-tight leading-tight mt-1.5">
                GV.Hồ Nguyễn Đa Thiện
              </div>
              <div className="text-[13px] font-[500] text-slate-400 tracking-tight leading-tight mt-0.5">
                Trợ lý Chấm & Phản biện
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Chỉ Dùng Để ĐIỀU HƯỚNG (Scrollable độc lập, không cuộn nội dung chính) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Mục HỒ SƠ - Mở Drawer Hồ sơ */}
          {onOpenProfileDrawer && (
            <button
              type="button"
              onClick={() => {
                onOpenProfileDrawer();
                if (onCloseMobile) onCloseMobile();
              }}
              title="Xem thông tin hồ sơ SKKN, phiếu chấm và chọn tài liệu"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] font-[600] leading-[1.4] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-[18px] h-[18px] text-slate-400 shrink-0" />
                <span className="leading-[1.4]">HỒ SƠ</span>
              </div>
              <span className="text-[13px] text-slate-400 font-normal shrink-0">
                Xem ▾
              </span>
            </button>
          )}

          {/* Divider nhẹ */}
          <div className="my-1.5 border-t border-slate-800/80" />

          {/* Danh sách Menu Items (Font 15px, Active 700, hiển thị đầy đủ không bị cắt tên) */}
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] leading-[1.4] transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white font-[700] shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white font-[600]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                  <Icon className={`w-[18px] h-[18px] shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="leading-[1.4] whitespace-normal break-words">{item.label}</span>
                </div>

                {/* Badge số (Font 13px, font-bold 700, min-w đủ dễ đọc) */}
                {item.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-[700] min-w-[24px] text-center shrink-0 ${
                      isActive
                        ? 'bg-blue-700/90 text-white'
                        : item.badgeType === 'danger'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.badgeType === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : item.badgeType === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Switch [Dễ dùng] [Chuyên sâu] - Cố định ở đáy */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 shrink-0">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center text-[13.5px] font-semibold gap-1">
            <button
              type="button"
              onClick={() => setAppMode('easy')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
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
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
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
