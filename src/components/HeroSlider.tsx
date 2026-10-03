import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  Layers,
  Calculator,
  BookCopy,
  Cpu,
  Search,
  Check,
  ShieldCheck,
  Maximize2
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
  const [animTime, setAnimTime] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Issues counts
  const totalIssuesCount = redTeamCards.length;
  const seriousCount = redTeamCards.filter(c => c.impactLevel === 'Cao').length;
  const warningCount = redTeamCards.filter(c => c.impactLevel !== 'Cao').length;
  const resolvedCount = redTeamCards.filter(c => c.status === 'Đã xử lý').length;

  // Reduced motion detection
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

  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
  }, []);

  // Autoplay: 6.5s per slide
  useEffect(() => {
    if (isHovered || isNavigating) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(interval);
  }, [isHovered, isNavigating, nextSlide]);

  // Reset internal animation timer whenever activeSlide changes
  useEffect(() => {
    if (reducedMotion) {
      setAnimTime(5000);
      return;
    }

    setAnimTime(0);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setAnimTime(elapsed);
      if (elapsed > 6500) {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [activeSlide, reducedMotion]);

  // Touch handling for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  const handleCtaClick = (action: () => void) => {
    setIsNavigating(true);
    action();
    setTimeout(() => setIsNavigating(false), 800);
  };

  const slides = [
    { id: 0, label: 'HỒ SƠ' },
    { id: 1, label: 'PHÂN TÍCH' },
    { id: 2, label: 'CHỈNH SỬA' }
  ];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[220px] md:h-[250px] lg:h-[280px] bg-gradient-to-r from-[#060913] via-[#091024] to-[#0b1738] rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden select-none"
    >
      {/* Dynamic Keyframe Injections for Precision Motion */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
          50% { transform: translateY(-4px) rotate(-0.5deg); }
        }
        @keyframes scanSweep {
          0% { top: 8%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 92%; opacity: 0; }
        }
        @keyframes orbitRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverseOrbit {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(56,189,248,0.5)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 20px rgba(56,189,248,0.85)); }
        }
        @keyframes particleFlow1 {
          0% { transform: translate(0, 0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(110px, -20px); opacity: 0; }
        }
        @keyframes particleFlow2 {
          0% { transform: translate(0, 0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(95px, 25px); opacity: 0; }
        }
        @keyframes reticlePatrol {
          0%, 20% { transform: translate(25px, 35px); }
          25%, 45% { transform: translate(180px, 45px); }
          50%, 70% { transform: translate(65px, 125px); }
          75%, 95% { transform: translate(195px, 130px); }
          100% { transform: translate(25px, 35px); }
        }
        @keyframes laserTransfer {
          0% { stroke-dashoffset: 120; opacity: 0.2; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -120; opacity: 0.2; }
        }
      `}</style>

      {/* LAYER 1: Ambient Background Gradients & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/15 via-indigo-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 right-[18%] -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-16 left-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-[70px] pointer-events-none" />

      {/* LAYER 2: Subtle Precision Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Navigation Arrows: Circular Translucent Buttons */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide trước"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs opacity-75 hover:opacity-100 hover:scale-105"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Slide tiếp theo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs opacity-75 hover:opacity-100 hover:scale-105"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* ========================================================================= */}
      {/* SLIDE 1 – HỒ SƠ ĐANG THẨM ĐỊNH + AI DOCUMENT SCANNER                     */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 w-full h-full px-6 sm:px-10 lg:px-14 py-4 sm:py-6 flex items-center justify-between gap-6 transition-all duration-600 ${
          activeSlide === 0
            ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
            : 'opacity-0 translate-x-8 pointer-events-none z-0'
        }`}
      >
        {/* Left Side (40%): Typography & Action */}
        <div className="w-full lg:w-[40%] flex flex-col justify-center space-y-2 sm:space-y-3 z-10 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 uppercase tracking-wider shadow-2xs">
              {!isDemoMode && !hasActiveEvaluation ? 'HỆ THỐNG THẨM ĐỊNH SKKN' : 'HỒ SƠ ĐANG THẨM ĐỊNH'}
            </span>
            {isDemoMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                HỒ SƠ MẪU
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-[28px] lg:leading-[1.2] font-black text-white tracking-tight line-clamp-2">
            {metadata.title || 'Ứng dụng sơ đồ tư duy kết hợp phần mềm tương tác'}
          </h2>

          <p className="text-xs sm:text-[13px] text-slate-300/90 truncate font-medium">
            {[metadata.author, metadata.subject, metadata.gradeLevel].filter(Boolean).join(' · ') || 'Nguyễn Thị Mai Lan · Lịch sử & Địa lí 8 · Lớp 8'}
          </p>

          <div className="pt-1">
            <div className="flex items-center gap-3.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleCtaClick(onViewProfileDetail || (() => {}))}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group"
              >
                <span>Xem hồ sơ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              {isDemoMode && onExitDemo && (
                <button
                  type="button"
                  onClick={() => handleCtaClick(onExitDemo)}
                  className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  <span>← Quay lại chấm SKKN của tôi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side (60%): Animated Document Scanner + AI Core with Multi-Layer Depth */}
        <div className="hidden lg:flex w-[60%] h-full items-center justify-center relative">
          
          {/* Depth Layer 1: Background Shadow Sheets (Tilted) */}
          <div className="absolute w-[290px] h-[190px] bg-slate-900/35 border border-slate-800/60 rounded-xl -rotate-6 scale-95 opacity-30 -translate-x-12 translate-y-3 pointer-events-none" />
          <div className="absolute w-[305px] h-[200px] bg-slate-900/50 border border-slate-700/40 rounded-xl rotate-3 scale-98 opacity-50 -translate-x-8 translate-y-1 pointer-events-none" />

          {/* Depth Layer 2: Main Foreground Document Sheet */}
          <div
            className="w-[325px] h-[215px] bg-[#0c1324]/90 rounded-xl border border-slate-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)] p-3.5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md -translate-x-6"
            style={{
              animation: reducedMotion ? 'none' : 'floatSlow 6s ease-in-out infinite'
            }}
          >
            {/* Real-time Laser Scanning Beam */}
            <div
              className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#22d3ee] pointer-events-none z-20"
              style={{
                animation: reducedMotion ? 'none' : 'scanSweep 4s ease-in-out infinite'
              }}
            />

            {/* Document Header */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded bg-blue-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-200 truncate">
                  SKKN_Thẩm_Định_2026.docx
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 shrink-0">
                Trang 01 / 34
              </span>
            </div>

            {/* Simulated Document Content Skeleton + 4 Checkpoints */}
            <div className="my-auto space-y-2 py-1">
              
              {/* Checkpoint 1 & 2 in Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1.2s: RUBRIC ✓ */}
                <div
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] transition-all duration-400 ${
                    animTime >= 1200
                      ? 'bg-blue-950/70 border-blue-400/50 text-white shadow-xs translate-y-0 opacity-100'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 translate-y-1 opacity-40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    animTime >= 1200 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-800 text-slate-500'
                  }`}>
                    ✓
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold truncate block">RUBRIC</span>
                    <span className="text-[9px] text-cyan-300 font-mono">Chuẩn 100đ</span>
                  </div>
                </div>

                {/* 1.7s: MINH CHỨNG ✓ */}
                <div
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] transition-all duration-400 ${
                    animTime >= 1700
                      ? 'bg-indigo-950/70 border-indigo-400/50 text-white shadow-xs translate-y-0 opacity-100'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 translate-y-1 opacity-40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    animTime >= 1700 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-800 text-slate-500'
                  }`}>
                    ✓
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold truncate block">MINH CHỨNG</span>
                    <span className="text-[9px] text-indigo-300 font-mono">4 Phụ lục</span>
                  </div>
                </div>
              </div>

              {/* Checkpoint 3 & 4 in Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* 2.2s: SỐ LIỆU ! */}
                <div
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] transition-all duration-400 ${
                    animTime >= 2200
                      ? 'bg-amber-950/70 border-amber-400/60 text-amber-200 shadow-xs translate-y-0 opacity-100'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 translate-y-1 opacity-40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    animTime >= 2200 ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-800 text-slate-500'
                  }`}>
                    !
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold truncate block">SỐ LIỆU</span>
                    <span className="text-[9px] text-amber-300 font-mono">Cần đối chiếu</span>
                  </div>
                </div>

                {/* 2.7s: NGUỒN ✓ */}
                <div
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] transition-all duration-400 ${
                    animTime >= 2700
                      ? 'bg-teal-950/70 border-teal-400/50 text-white shadow-xs translate-y-0 opacity-100'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 translate-y-1 opacity-40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    animTime >= 2700 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-800 text-slate-500'
                  }`}>
                    ✓
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold truncate block">NGUỒN</span>
                    <span className="text-[9px] text-teal-300 font-mono">Đã xác minh</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Document Footer Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/90 pt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Đang quét đối chiếu</span>
              </span>
              <span className="text-cyan-400 font-mono font-bold">14 Tiêu chuẩn</span>
            </div>
          </div>

          {/* Depth Layer 3: AI Core with Orbiting Neural Nodes */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {/* Outer Rotating Orbit */}
            <div
              className="w-24 h-24 rounded-full border border-cyan-500/20 absolute"
              style={{
                animation: reducedMotion ? 'none' : 'orbitRotate 14s linear infinite'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 absolute -top-1 left-1/2 -translate-x-1/2 shadow-[0_0_8px_#22d3ee]" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-[0_0_6px_#60a5fa]" />
            </div>

            {/* Inner Reverse Orbit */}
            <div
              className="w-16 h-16 rounded-full border border-indigo-400/30 border-dashed absolute"
              style={{
                animation: reducedMotion ? 'none' : 'reverseOrbit 9s linear infinite'
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 absolute top-1/2 -left-1 -translate-y-1/2 shadow-[0_0_6px_#818cf8]" />
            </div>

            {/* Center Neural Core */}
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.6)] z-10"
              style={{
                animation: reducedMotion ? 'none' : 'corePulse 3.5s ease-in-out infinite'
              }}
            >
              <Cpu className="w-5 h-5 text-white" />
            </div>

            {/* Floating Data Particles moving from Document into Core */}
            {!reducedMotion && (
              <>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute shadow-[0_0_6px_#22d3ee]"
                  style={{
                    left: '-40px',
                    top: '-15px',
                    animation: 'particleFlow1 2.8s linear infinite'
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute shadow-[0_0_6px_#818cf8]"
                  style={{
                    left: '-35px',
                    top: '20px',
                    animation: 'particleFlow2 3.2s linear infinite 0.7s'
                  }}
                />
              </>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 2 – PHÁT HIỆN VẤN ĐỀ + DOCUMENT INSPECTION MAP                      */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 w-full h-full px-6 sm:px-10 lg:px-14 py-4 sm:py-6 flex items-center justify-between gap-6 transition-all duration-600 ${
          activeSlide === 1
            ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
            : 'opacity-0 translate-x-8 pointer-events-none z-0'
        }`}
      >
        {/* Left Side (40%): Typography & CTA */}
        <div className="w-full lg:w-[40%] flex flex-col justify-center space-y-2 sm:space-y-3 z-10 pr-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 uppercase tracking-wider inline-block w-fit shadow-2xs">
            KẾT QUẢ PHÂN TÍCH
          </span>

          <h2 className="text-xl sm:text-2xl lg:text-[28px] lg:leading-[1.2] font-black text-white tracking-tight">
            {totalIssuesCount} vấn đề <br className="hidden sm:inline" />
            <span className="text-rose-400">cần xem</span>
          </h2>

          <p className="text-xs sm:text-[13px] text-slate-300/90 truncate font-medium">
            {seriousCount} phải sửa · {warningCount} nên xem
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (!isDemoMode && !hasActiveEvaluation) {
                  handleCtaClick(onEnterDemo || (() => {}));
                } else {
                  handleCtaClick(onScrollToIssues || (() => {}));
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group"
            >
              <span>{!isDemoMode && !hasActiveEvaluation ? 'Xem vấn đề mẫu' : 'Xem vấn đề'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side (60%): DOCUMENT INSPECTION MAP with 5 Hotspots & Moving Reticle */}
        <div className="hidden lg:flex w-[60%] h-full items-center justify-center relative">
          
          {/* Main Inspection Canvas */}
          <div className="w-[370px] h-[215px] bg-[#0c1324]/90 rounded-xl border border-slate-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)] p-3.5 relative overflow-hidden backdrop-blur-md">
            
            {/* Header: Map Status */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[11px] font-bold text-slate-200">
                  BẢN ĐỒ PHÁT HIỆN ĐIỂM YẾU
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-400/30">
                  {seriousCount} Phải sửa
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  {warningCount} Nên xem
                </span>
              </div>
            </div>

            {/* Background Simulated Page Paragraph Lines */}
            <div className="my-2 space-y-2 opacity-25">
              <div className="h-2 w-3/4 bg-slate-500 rounded" />
              <div className="h-2 w-full bg-slate-500 rounded" />
              <div className="h-2 w-5/6 bg-slate-500 rounded" />
              <div className="h-2 w-2/3 bg-slate-500 rounded" />
              <div className="h-2 w-4/5 bg-slate-500 rounded" />
              <div className="h-2 w-full bg-slate-500 rounded" />
            </div>

            {/* 5 Hotspots with Connectors & Short Chips */}
            
            {/* Hotspot 1: TÍNH MỚI (Đỏ) - x: 18%, y: 30% */}
            <div
              className={`absolute left-[14%] top-[28%] flex items-center gap-1.5 transition-all duration-400 ${
                animTime >= 600 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping opacity-75 absolute" />
                <div className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-[0_0_8px_#f43f5e]" />
              </div>
              <div className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] font-bold shadow-xs">
                TÍNH MỚI
              </div>
            </div>

            {/* Hotspot 2: SỐ LIỆU (Đỏ) - x: 62%, y: 32% */}
            <div
              className={`absolute left-[58%] top-[30%] flex items-center gap-1.5 transition-all duration-400 ${
                animTime >= 1100 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping opacity-75 absolute" />
                <div className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-[0_0_8px_#f43f5e]" />
              </div>
              <div className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] font-bold shadow-xs">
                SỐ LIỆU
              </div>
            </div>

            {/* Hotspot 3: MINH CHỨNG (Đỏ) - x: 26%, y: 64% */}
            <div
              className={`absolute left-[24%] top-[62%] flex items-center gap-1.5 transition-all duration-400 ${
                animTime >= 1600 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping opacity-75 absolute" />
                <div className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-[0_0_8px_#f43f5e]" />
              </div>
              <div className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] font-bold shadow-xs">
                MINH CHỨNG
              </div>
            </div>

            {/* Hotspot 4: NGUỒN (Vàng) - x: 66%, y: 66% */}
            <div
              className={`absolute left-[64%] top-[64%] flex items-center gap-1.5 transition-all duration-400 ${
                animTime >= 2100 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping opacity-75 absolute" />
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_#fbbf24]" />
              </div>
              <div className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-200 text-[10px] font-bold shadow-xs">
                NGUỒN
              </div>
            </div>

            {/* Hotspot 5: LOGIC (Vàng) - x: 44%, y: 46% */}
            <div
              className={`absolute left-[42%] top-[45%] flex items-center gap-1.5 transition-all duration-400 ${
                animTime >= 2600 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping opacity-75 absolute" />
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_#fbbf24]" />
              </div>
              <div className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-200 text-[10px] font-bold shadow-xs">
                LOGIC
              </div>
            </div>

            {/* Dynamic Focusing Reticle / Magnifier wandering between hotspots */}
            {!reducedMotion && (
              <div
                className="absolute top-4 left-4 pointer-events-none z-20 transition-all duration-700 ease-in-out"
                style={{
                  animation: 'reticlePatrol 9s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                }}
              >
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400/80 shadow-[0_0_15px_#22d3ee] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <div className="w-1 h-1 rounded-full bg-white" />
                  {/* Crosshairs */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-400/40" />
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-400/40" />
                </div>
              </div>
            )}

            {/* Map Footer Bar */}
            <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
              <span>Đã gắn cờ vị trí chính xác trong văn bản</span>
              <span className="text-rose-400 font-mono font-bold">5 Điểm rủi ro</span>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 3 – HƯỚNG DẪN CHỈNH SỬA (BEFORE → AI PROCESS → AFTER)               */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 w-full h-full px-6 sm:px-10 lg:px-14 py-4 sm:py-6 flex items-center justify-between gap-6 transition-all duration-600 ${
          activeSlide === 2
            ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
            : 'opacity-0 translate-x-8 pointer-events-none z-0'
        }`}
      >
        {/* Left Side (40%): Typography & CTA */}
        <div className="w-full lg:w-[40%] flex flex-col justify-center space-y-2 sm:space-y-3 z-10 pr-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider inline-block w-fit shadow-2xs">
            BƯỚC TIẾP THEO
          </span>

          <h2 className="text-xl sm:text-2xl lg:text-[28px] lg:leading-[1.2] font-black text-white tracking-tight">
            Sửa đúng <br className="hidden sm:inline" />
            <span className="text-emerald-400">{totalIssuesCount} điểm cần thiết</span>
          </h2>

          <p className="text-xs sm:text-[13px] text-slate-300/90 truncate font-medium">
            App dẫn từng vấn đề một.
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (!isDemoMode && !hasActiveEvaluation) {
                  handleCtaClick(onEnterDemo || (() => {}));
                } else {
                  handleCtaClick(onOpenFirstIssue || (() => {}));
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group"
            >
              <span>{!isDemoMode && !hasActiveEvaluation ? 'Xem hướng dẫn mẫu' : 'Bắt đầu xử lý'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side (60%): VISUAL TRANSFORMATION (BEFORE → AI CORE → AFTER) */}
        <div className="hidden lg:flex w-[60%] h-full items-center justify-center relative">
          
          <div className="w-full max-w-[440px] h-[215px] flex items-center justify-between relative px-2">
            
            {/* 1. DOCUMENT BEFORE (Left) */}
            <div
              className={`w-[145px] h-[190px] bg-[#0c1324]/90 rounded-xl border p-2.5 flex flex-col justify-between shadow-xl transition-all duration-500 backdrop-blur-md ${
                animTime >= 300 ? 'border-rose-500/60 opacity-100 translate-x-0' : 'border-slate-800 opacity-30 -translate-x-4'
              }`}
            >
              <div className="flex items-center justify-between border-b border-rose-900/60 pb-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                  Trước khi sửa
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>

              {/* Simulated text with RED highlight error */}
              <div className="space-y-1.5 my-auto">
                <div className="h-1.5 w-3/4 bg-slate-600 rounded" />
                <div className="h-1.5 w-full bg-slate-600 rounded" />
                
                {/* Error Box */}
                <div className="p-1 rounded bg-rose-950/80 border border-rose-500/80 text-[9px] text-rose-300 font-bold leading-tight shadow-xs">
                  Mâu thuẫn cỡ mẫu Bảng 2
                </div>

                <div className="h-1.5 w-5/6 bg-slate-600 rounded" />
                <div className="h-1.5 w-2/3 bg-slate-600 rounded" />
              </div>

              <div className="text-[9px] text-rose-400 font-mono">
                Bị trừ 4.5đ
              </div>
            </div>

            {/* Connecting Beam 1: BEFORE → AI */}
            <div className="flex-1 flex items-center justify-center relative px-1">
              <svg className="w-full h-8 overflow-visible">
                <line
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className={animTime >= 900 ? 'opacity-80' : 'opacity-20'}
                />
              </svg>
            </div>

            {/* 2. AI RECONSTRUCTION CORE (Center) */}
            <div
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-center p-1 relative z-10 transition-all duration-500 ${
                animTime >= 1200
                  ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-[0_0_24px_rgba(56,189,248,0.8)] scale-105'
                  : 'bg-slate-800 border border-slate-700 opacity-40 scale-90'
              }`}
            >
              <Cpu className="w-6 h-6 text-white" />
              <span className="text-[8px] font-bold text-white uppercase tracking-tight">
                AI Tối Ưu
              </span>
            </div>

            {/* Connecting Beam 2: AI → AFTER */}
            <div className="flex-1 flex items-center justify-center relative px-1">
              <svg className="w-full h-8 overflow-visible">
                <line
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className={animTime >= 1800 ? 'opacity-80' : 'opacity-20'}
                />
              </svg>
            </div>

            {/* 3. DOCUMENT AFTER (Right) */}
            <div
              className={`w-[145px] h-[190px] bg-[#0c1324]/90 rounded-xl border p-2.5 flex flex-col justify-between shadow-xl transition-all duration-500 backdrop-blur-md ${
                animTime >= 2400 ? 'border-emerald-500/60 opacity-100 translate-x-0' : 'border-slate-800 opacity-30 translate-x-4'
              }`}
            >
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                  Sau khi sửa
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Simulated text with GREEN resolved block */}
              <div className="space-y-1.5 my-auto">
                <div className="h-1.5 w-3/4 bg-slate-600 rounded" />
                <div className="h-1.5 w-full bg-slate-600 rounded" />
                
                {/* Resolved Box */}
                <div className="p-1 rounded bg-emerald-950/80 border border-emerald-500/80 text-[9px] text-emerald-300 font-bold leading-tight flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Đã khớp N=82</span>
                </div>

                <div className="h-1.5 w-5/6 bg-slate-600 rounded" />
                <div className="h-1.5 w-2/3 bg-slate-600 rounded" />
              </div>

              <div className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span>✓ Phục hồi điểm</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SLIDE COMPACT TABS / PILLS (HỒ SƠ · PHÂN TÍCH · CHỈNH SỬA)        */}
      {/* ========================================================================= */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-30">
        {slides.map((s, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/40 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'
                }`}
              />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
