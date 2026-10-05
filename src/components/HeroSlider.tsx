import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  FileText,
  Award,
  Paperclip,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import { SKKNAnalysisResult } from '../types';
import { ActiveTab } from './Sidebar';

interface HeroSliderProps {
  analysis: SKKNAnalysisResult;
  isSample?: boolean;
  isDemoMode?: boolean;
  hasActiveEvaluation?: boolean;
  onEnterDemo?: () => void;
  onExitDemo?: () => void;
  onOpenProfileDrawer?: () => void;
  onViewProfileDetail?: () => void;
  onOpenFirstIssue?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onScrollToIssues?: () => void;
  onStartNewSKKN?: () => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  analysis,
  isSample = false,
  isDemoMode = false,
  hasActiveEvaluation = false,
  onEnterDemo,
  onExitDemo,
  onOpenProfileDrawer,
  onViewProfileDetail,
  onOpenFirstIssue,
  onNavigateTab,
  onScrollToIssues,
  onStartNewSKKN
}) => {
  const { metadata, redTeamCards } = analysis;

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Issues count
  const totalIssuesCount = redTeamCards.length > 0 ? redTeamCards.length : 5;

  // Reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % 3);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + 3) % 3);
  }, []);

  // Autoplay: 6.5s per slide (pauses when hovered)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide]);

  const slidesMeta = [
    { id: 0, label: '01 HỒ SƠ', title: 'Hồ sơ sáng kiến' },
    { id: 1, label: '02 PHÂN TÍCH', title: 'Phân tích hồ sơ' },
    { id: 2, label: '03 GỢI Ý SỬA', title: 'Gợi ý chỉnh sửa' }
  ];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[220px] sm:h-[235px] md:h-[245px] lg:h-[250px] bg-gradient-to-r from-[#070b18] via-[#0b1430] to-[#0f1d44] rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden select-none"
    >
      {/* Keyframe Styles for Document & Laser Animations */}
      <style>{`
        @keyframes laserSweep {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 0.9; }
          80% { opacity: 0.9; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes docFloat1 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-4px) rotate(-1deg); }
        }
        @keyframes docFloat2 {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }
        @keyframes docFloat3 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-4px) rotate(0.5deg); }
        }
        @keyframes arrowNudge {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(4px); }
        }
      `}</style>

      {/* Atmospheric Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/15 via-indigo-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-16 left-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-[70px] pointer-events-none" />

      {/* Blueprint Grid */}
      <div
        className="absolute inset-0 opacity-[0.1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Navigation Arrows: Left & Right */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide trước"
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md opacity-75 hover:opacity-100 hover:scale-105 active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Slide tiếp theo"
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md opacity-75 hover:opacity-100 hover:scale-105 active:scale-95"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* ========================================================================= */}
      {/* SLIDE 1 – HỒ SƠ SÁNG KIẾN                                                 */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 w-full h-full px-6 sm:px-12 lg:px-16 py-5 flex items-center justify-between gap-6 transition-all duration-700 ${
          activeSlide === 0
            ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
            : 'opacity-0 translate-x-8 pointer-events-none z-0'
        }`}
      >
        {/* Left Side */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center space-y-2 z-20 pr-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-[700] bg-blue-500/20 text-blue-300 border border-blue-400/40 uppercase tracking-wider shadow-2xs">
              HỒ SƠ SÁNG KIẾN
            </span>
            {isDemoMode && (
              <span className="px-2.5 py-0.5 rounded-full text-[13px] font-[700] bg-amber-500/20 text-amber-300 border border-amber-400/30">
                HỒ SƠ MẪU
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-[23px] font-[750] text-white tracking-tight leading-snug">
            Đọc hồ sơ. Hiểu cấu trúc.
          </h2>

          <p className="text-[14px] text-slate-300 font-medium line-clamp-2 leading-[1.55]">
            {metadata.title || 'Ứng dụng sơ đồ tư duy kết hợp trò chơi tương tác môn Lịch sử 8'}
          </p>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (onViewProfileDetail) onViewProfileDetail();
                else if (onOpenProfileDrawer) onOpenProfileDrawer();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-[650] text-[14px] shadow-md shadow-blue-600/30 transition-all cursor-pointer group"
            >
              <span>Xem hồ sơ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {isDemoMode && onExitDemo && (
              <button
                type="button"
                onClick={onExitDemo}
                className="text-[13.5px] text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              >
                ← Quay lại chấm SKKN của tôi
              </button>
            )}
          </div>
        </div>

        {/* Right Side: 3D Document Model Cluster */}
        <div className="hidden sm:flex lg:w-[48%] h-full items-center justify-center relative">
          <div className="flex items-center gap-3">
            {/* Doc 1: SKKN.docx */}
            <div className="w-28 sm:w-32 h-36 rounded-xl bg-slate-900/90 border border-blue-500/40 p-3 shadow-xl flex flex-col justify-between backdrop-blur-sm animate-[docFloat1_4.5s_ease-in-out_infinite]">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[12px] text-blue-300 font-semibold block">Văn bản</span>
                <span className="text-[13px] font-bold text-white block truncate">SKKN.docx</span>
              </div>
              <div className="space-y-1 border-t border-slate-800 pt-1.5">
                <div className="h-1 bg-slate-700 rounded w-full" />
                <div className="h-1 bg-slate-700 rounded w-3/4" />
              </div>
            </div>

            {/* Doc 2: Phiếu chấm */}
            <div className="w-28 sm:w-32 h-40 rounded-xl bg-slate-900/95 border border-emerald-500/40 p-3 shadow-2xl flex flex-col justify-between backdrop-blur-sm animate-[docFloat2_5s_ease-in-out_infinite] -mt-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Award className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[12px] text-emerald-300 font-semibold block">Phiếu chấm</span>
                <span className="text-[13px] font-bold text-white block">Thang điểm 100</span>
              </div>
              <div className="space-y-1 border-t border-slate-800 pt-1.5">
                <div className="h-1 bg-emerald-700/60 rounded w-full" />
                <div className="h-1 bg-emerald-700/60 rounded w-4/5" />
              </div>
            </div>

            {/* Doc 3: Minh chứng */}
            <div className="w-28 sm:w-32 h-36 rounded-xl bg-slate-900/90 border border-amber-500/40 p-3 shadow-xl flex flex-col justify-between backdrop-blur-sm animate-[docFloat3_5.5s_ease-in-out_infinite]">
              <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                <Paperclip className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[12px] text-amber-300 font-semibold block">Đính kèm</span>
                <span className="text-[13px] font-bold text-white block">Minh chứng</span>
              </div>
              <div className="space-y-1 border-t border-slate-800 pt-1.5">
                <div className="h-1 bg-slate-700 rounded w-full" />
                <div className="h-1 bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 2 – PHÂN TÍCH HỒ SƠ                                                 */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 w-full h-full px-6 sm:px-12 lg:px-16 py-5 flex items-center justify-between gap-6 transition-all duration-700 ${
          activeSlide === 1
            ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
            : 'opacity-0 translate-x-8 pointer-events-none z-0'
        }`}
      >
        {/* Left Side */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center space-y-2 z-20 pr-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-[700] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase tracking-wider shadow-2xs">
              PHÂN TÍCH HỒ SƠ
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-[700] bg-rose-500/20 text-rose-300 border border-rose-400/40">
              {totalIssuesCount} vấn đề
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-[23px] font-[750] text-white tracking-tight leading-snug">
            Phát hiện điểm cần xem xét.
          </h2>

          <p className="text-[14px] text-slate-300 font-medium leading-[1.55]">
            Rà soát đa tầng từ cấu trúc, số liệu, tính mới đến chuỗi minh chứng thực nghiệm.
          </p>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (onScrollToIssues) onScrollToIssues();
                else if (onNavigateTab) onNavigateTab('red_team');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-[650] text-[14px] shadow-md shadow-cyan-600/30 transition-all cursor-pointer group"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side: Hologram Document with 5 Markers and Laser Beam */}
        <div className="hidden sm:flex lg:w-[48%] h-full items-center justify-center relative">
          <div className="relative w-64 h-44 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl p-3 flex flex-col justify-between overflow-hidden backdrop-blur-sm">
            {/* Laser Beam */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] pointer-events-none animate-[laserSweep_2.5s_linear_infinite]" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[12px] font-bold text-cyan-400 font-mono">BẢN KIỂM TRA ĐA TẦNG</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>

            {/* 5 Markers */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
              <div className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-between">
                <span>● SỐ LIỆU</span>
                <span className="text-[10px] opacity-80">Mục I ↔ II</span>
              </div>
              <div className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-between">
                <span>● MINH CHỨNG</span>
                <span className="text-[10px] opacity-80">Thiếu phiếu</span>
              </div>
              <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-between">
                <span>● TÍNH MỚI</span>
                <span className="text-[10px] opacity-80">Khẳng định</span>
              </div>
              <div className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-between">
                <span>● LOGIC</span>
                <span className="text-[10px] opacity-80">Đối chiếu</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-1 font-mono">
              <span>● NGUỒN: Trích dẫn</span>
              <span className="text-cyan-400 font-bold">HOÀN TẤT QUÉT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 3 – GỢI Ý SỬA                                                       */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 w-full h-full px-6 sm:px-12 lg:px-16 py-5 flex items-center justify-between gap-6 transition-all duration-700 ${
          activeSlide === 2
            ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
            : 'opacity-0 translate-x-8 pointer-events-none z-0'
        }`}
      >
        {/* Left Side */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center space-y-2 z-20 pr-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-[700] bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase tracking-wider shadow-2xs">
              GỢI Ý SỬA
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-[700] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              3 mức độ chỉnh sửa
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-[23px] font-[750] text-white tracking-tight leading-snug">
            Sửa đúng chỗ. Giữ đúng bản chất.
          </h2>

          <p className="text-[14px] text-slate-300 font-medium leading-[1.55]">
            Đề xuất sửa nhẹ, học thuật, hoặc tái cấu trúc sâu mà không tự bịa số liệu hay phóng đại.
          </p>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('suggestions');
                else if (onOpenFirstIssue) onOpenFirstIssue();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-[650] text-[14px] shadow-md shadow-indigo-600/30 transition-all cursor-pointer group"
            >
              <span>Xem gợi ý</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('rescore');
              }}
              className="inline-flex items-center gap-1 text-[13.5px] text-indigo-300 hover:text-white transition-colors cursor-pointer group"
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Chấm lại sau khi sửa</span>
            </button>
          </div>
        </div>

        {/* Right Side: 3D Checklist Model */}
        <div className="hidden sm:flex lg:w-[48%] h-full items-center justify-center relative">
          <div className="w-64 rounded-xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl p-3.5 space-y-2 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[12px] font-bold text-indigo-300 uppercase tracking-wide">DANH SÁCH SỬA</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex items-center gap-2 p-1.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                <CheckCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-[12px]">Cần sửa trước khi nộp</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[12px]">Nên bổ sung</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[12px]">Tối ưu thêm</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[12px] text-slate-300 font-semibold">
              <span>Sẵn sàng:</span>
              <span className="inline-flex items-center gap-1 text-cyan-400 font-bold">
                <span>CHẤM LẠI</span>
                <span className="animate-[arrowNudge_1.5s_ease-in-out_infinite]">→</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3 Slide Indicators */}
      <div className="absolute bottom-3 left-6 sm:left-12 z-30 flex items-center gap-2">
        {slidesMeta.map((slide, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlide(slide.id)}
              title={slide.title}
              className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isActive ? 'bg-white scale-125' : 'bg-slate-500'
                }`}
              />
              <span className="hidden sm:inline">{slide.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
