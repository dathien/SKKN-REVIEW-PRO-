import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, FileCheck, Sparkles } from 'lucide-react';

export type MascotState = 
  | 'idle_no_skkn'      // CHƯA CÓ SKKN
  | 'skkn_loaded'       // ĐÃ NHẬN SKKN
  | 'analyzing'         // ĐANG CHẤM
  | 'analysis_done'     // HOÀN THÀNH
  | 'error';            // LỖI

export interface MascotAssistantProps {
  state: MascotState;
  reducedMotion?: boolean;
  className?: string;
  onActionClick?: () => void;
}

export const MascotAssistant: React.FC<MascotAssistantProps> = ({
  state,
  reducedMotion = false,
  className = ''
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFileCheckToast, setShowFileCheckToast] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Trigger temporary check indicator when file is received
  useEffect(() => {
    if (state === 'skkn_loaded') {
      setShowFileCheckToast(true);
      const timer = setTimeout(() => setShowFileCheckToast(false), 2400);
      return () => clearTimeout(timer);
    } else {
      setShowFileCheckToast(false);
    }
  }, [state]);

  // Subtle interactive 3D parallax tracking with strict degree limits
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      const normY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
      setMousePos({ x: normX, y: normY });
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setMousePos({ x: 0, y: 0 });
  };

  // Limit tilt to maximum ±2deg rotateX, ±3deg rotateY, ±3px translate
  const targetRotateX = reducedMotion || !isHovered ? 0 : -mousePos.y * 2.0;
  const targetRotateY = reducedMotion || !isHovered ? 0 : mousePos.x * 2.8;
  const targetTranslateX = reducedMotion || !isHovered ? 0 : mousePos.x * 2.8;
  const targetTranslateY = reducedMotion || !isHovered ? 0 : mousePos.y * 2.5;

  // Speech bubble copy strictly according to requirements
  const getSpeechBubble = () => {
    switch (state) {
      case 'idle_no_skkn':
        return {
          badge: 'Trợ lý AI',
          text: 'Thầy/Cô hãy tải SKKN hoặc dán nội dung để bắt đầu nhé!'
        };
      case 'skkn_loaded':
        return {
          badge: 'Đã nhận hồ sơ',
          text: 'Đã nhận hồ sơ. Thầy/Cô có thể bắt đầu đánh giá.'
        };
      case 'analyzing':
        return {
          badge: 'Đang thẩm định',
          text: 'Tôi đang đọc và đối chiếu hồ sơ…'
        };
      case 'analysis_done':
        return {
          badge: 'Hoàn tất',
          text: 'Đã hoàn tất! Có một số điểm Thầy/Cô nên xem lại.'
        };
      case 'error':
        return {
          badge: 'Thông báo',
          text: 'Phân tích chưa hoàn tất. Hồ sơ của Thầy/Cô vẫn được giữ lại.'
        };
      default:
        return {
          badge: 'Trợ lý SKKN',
          text: 'Thầy/Cô hãy tải SKKN hoặc dán nội dung để bắt đầu nhé!'
        };
    }
  };

  const bubble = getSpeechBubble();

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative flex flex-col items-center justify-between w-full h-full select-none ${className}`}
    >
      {/* Animation keyframes for floating, breathing, and scanning */}
      <style>{`
        @keyframes mascotFloatBreathe {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-3.5px) scale(1.008);
          }
        }
        @keyframes cyanAuraPulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.28;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.55;
          }
        }
        @keyframes tabletLaserScan {
          0% {
            transform: translateY(0px);
            opacity: 0.2;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(55px);
            opacity: 0.2;
          }
        }
        @keyframes toastFadePop {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.9);
          }
          15% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          85% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-4px) scale(0.95);
          }
        }
      `}</style>

      {/* ======================================================================= */}
      {/* 1. SPEECH BUBBLE (HTML/CSS card with dynamic copy per state)           */}
      {/* ======================================================================= */}
      <div className="w-full max-w-[275px] z-20 mb-2">
        <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-md shadow-slate-200/50 transition-all">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'analyzing'
                  ? 'bg-cyan-500 animate-ping'
                  : state === 'error'
                  ? 'bg-amber-500'
                  : state === 'skkn_loaded' || state === 'analysis_done'
                  ? 'bg-emerald-500'
                  : 'bg-blue-600'
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {bubble.badge}
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {bubble.text}
          </p>

          {/* Speech Bubble Arrow Tail */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. STATE OVERLAY EFFECTS (Vòng sáng cyan khi chấm, checkmark khi xong)  */}
      {/* ======================================================================= */}
      {/* Cyan halo background pulse when analyzing */}
      {state === 'analyzing' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-400/25 via-blue-500/20 to-sky-300/25 blur-2xl pointer-events-none -z-10 animate-[cyanAuraPulse_3s_ease-in-out_infinite]" />
      )}

      {/* Floating Checkmark Toast when file is uploaded */}
      {showFileCheckToast && (
        <div className="absolute top-[32%] right-2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold shadow-lg shadow-emerald-600/30 animate-[toastFadePop_2.4s_ease-out_forwards]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã nhận SKKN</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 3. MASCOT CONTAINER (65%–72% height, floating, breathing, 3D tilt)      */}
      {/* ======================================================================= */}
      <div
        className="relative w-full h-[270px] sm:h-[300px] flex items-end justify-center overflow-hidden"
        style={{
          perspective: 1000
        }}
      >
        {/* Soft shadow base */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-44 h-3 bg-slate-500/15 rounded-full blur-xs pointer-events-none" />

        {/* Floating & Breathing Layer */}
        <div
          className={`w-full h-full relative flex items-end justify-center ${
            reducedMotion ? '' : 'animate-[mascotFloatBreathe_5s_ease-in-out_infinite]'
          }`}
          style={{
            transform: `rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) translate3d(${targetTranslateX}px, ${targetTranslateY}px, 0)`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* ================================================================= */}
          {/* OPTION A: LOAD CROPPED ASSET IMAGE (Excluding sample UI & header) */}
          {/* ================================================================= */}
          {!imageError && (
            <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
              <img
                src="/image.png"
                alt="Trợ lý SKKN"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className="w-full h-[142%] max-h-none object-contain pointer-events-none drop-shadow-md"
                style={{
                  // Crop out top 24% (where sample header and speech bubble are)
                  // Show character from waist/thighs up to ponytail top
                  transform: 'translateY(-23%) scale(1.36)',
                  transformOrigin: 'bottom center'
                }}
              />

              {/* Laser scanning beam overlay across tablet when analyzing */}
              {state === 'analyzing' && imageLoaded && (
                <div
                  className="absolute bottom-[28%] right-[18%] w-24 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[0.5px] pointer-events-none animate-[tabletLaserScan_1.5s_ease-in-out_infinite]"
                  style={{
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)'
                  }}
                />
              )}

              {/* Status Badge Overlays when image is active */}
              {state === 'analysis_done' && imageLoaded && (
                <div className="absolute bottom-[22%] right-[14%] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold shadow-md shadow-emerald-500/40 backdrop-blur-xs animate-in fade-in duration-300">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                  <span>Hoàn tất</span>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* OPTION B: SEAMLESS HIGH-FIDELITY VECTOR RIG (Matching Asset)       */}
          {/* Shows if image is loading or when asset image path is unavailable  */}
          {/* ================================================================= */}
          {imageError && (
            <svg
              viewBox="0 0 240 310"
              className="w-full h-full max-h-[295px] object-contain drop-shadow-md overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 3D Skin Gradient */}
                <radialGradient id="charSkin" cx="45%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#FFF9F5" />
                  <stop offset="40%" stopColor="#FCE4D6" />
                  <stop offset="78%" stopColor="#F5CFBC" />
                  <stop offset="100%" stopColor="#E9B9A3" />
                </radialGradient>

                {/* Big expressive Disney/Pixar anime eyes */}
                <radialGradient id="charIris" cx="42%" cy="36%" r="58%">
                  <stop offset="0%" stopColor="#9C6244" />
                  <stop offset="38%" stopColor="#633720" />
                  <stop offset="76%" stopColor="#321A0E" />
                  <stop offset="100%" stopColor="#100603" />
                </radialGradient>

                {/* Wavy Brown Hair */}
                <linearGradient id="charHair" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#4A2F24" />
                  <stop offset="30%" stopColor="#321D15" />
                  <stop offset="70%" stopColor="#22110B" />
                  <stop offset="100%" stopColor="#140804" />
                </linearGradient>

                <linearGradient id="charHairSheen" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#9C6B55" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#683F2D" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#321D15" stopOpacity="0" />
                </linearGradient>

                {/* Navy Blue Blazer */}
                <linearGradient id="charBlazer" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#25354F" />
                  <stop offset="35%" stopColor="#16233B" />
                  <stop offset="75%" stopColor="#0F172A" />
                  <stop offset="100%" stopColor="#080D1A" />
                </linearGradient>

                {/* Golden Emblem & Buttons */}
                <linearGradient id="charGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="40%" stopColor="#FACC15" />
                  <stop offset="80%" stopColor="#CA8A04" />
                  <stop offset="100%" stopColor="#854D0E" />
                </linearGradient>

                {/* Blue Lanyard */}
                <linearGradient id="charLanyard" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>

                {/* Silver Slate Tablet */}
                <linearGradient id="charTablet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="50%" stopColor="#94A3B8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>

              {/* Ponytail Hair behind */}
              <g id="ponytailBack">
                {/* High Ponytail Loop & Volume */}
                <path d="M142 42 C165 20 185 35 180 85 C176 125 155 170 148 190 C155 155 168 105 156 68 Z" fill="url(#charHair)" />
                <path d="M148 48 C168 32 178 50 172 90 C168 120 155 155 150 175" stroke="url(#charHairSheen)" strokeWidth="3" fill="none" />
                {/* Hair scrunchie */}
                <ellipse cx="140" cy="42" rx="9" ry="6" fill="#1E293B" transform="rotate(25 140 42)" />
              </g>

              {/* Torso & Attire */}
              <g id="torso">
                {/* Neck */}
                <path d="M112 105 L128 105 L132 135 L108 135 Z" fill="url(#charSkin)" />
                <path d="M112 105 L128 105 L126 113 L114 113 Z" fill="#D59582" opacity="0.6" />

                {/* White Collared Shirt */}
                <path d="M106 130 L134 130 L127 170 L113 170 Z" fill="#FFFFFF" />
                {/* Shirt Collar */}
                <polygon points="106,130 118,144 118,130" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.8" />
                <polygon points="134,130 122,144 122,130" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.8" />

                {/* Blue Lanyard around neck */}
                <path d="M114 128 L120 182 L122 182 L126 128" stroke="url(#charLanyard)" strokeWidth="3" fill="none" strokeLinecap="round" />
                
                {/* ID Badge: SKKN REVIEW PRO */}
                <g transform="translate(112, 178)">
                  <rect x="0" y="0" width="16" height="22" rx="2" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="0.8" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))" />
                  <rect x="0" y="0" width="16" height="5" fill="#2563EB" />
                  <circle cx="8" cy="2.5" r="1.2" fill="#FFFFFF" />
                  {/* Book Logo on Badge */}
                  <path d="M5 10 Q8 8.5 11 10 L11 15 Q8 13.5 5 15 Z" fill="#2563EB" />
                  <line x1="8" y1="9.5" x2="8" y2="14.5" stroke="#FFFFFF" strokeWidth="0.6" />
                  <text x="8" y="19" fontSize="2.2" fontWeight="bold" fill="#1E3A8A" textAnchor="middle">SKKN</text>
                </g>

                {/* Tailored Navy Blazer */}
                <path
                  d="M58 310 C60 230 70 148 90 142 C102 138 114 135 120 135 C126 135 138 138 150 142 C170 148 180 230 182 310 Z"
                  fill="url(#charBlazer)"
                />

                {/* Left & Right Lapels */}
                <path d="M92 142 L115 205 L120 205 L102 138 Z" fill="#1E2E48" />
                <path d="M148 142 L125 205 L120 205 L138 138 Z" fill="#1E2E48" />

                {/* Golden Book Badge on Lapel */}
                <g transform="translate(142, 154)">
                  <path d="M0 2 Q4 0 8 2 L8 8 Q4 6 0 8 Z" fill="url(#charGold)" />
                  <line x1="4" y1="1" x2="4" y2="7" stroke="#713F12" strokeWidth="0.6" />
                </g>

                {/* Golden Button on Blazer */}
                <circle cx="118" cy="216" r="3" fill="url(#charGold)" />
                <circle cx="118" cy="242" r="3" fill="url(#charGold)" />
              </g>

              {/* Head & Expressive Facial Features */}
              <g id="head">
                {/* Ears */}
                <ellipse cx="88" cy="85" rx="5" ry="9" fill="#F5CFBC" transform="rotate(-6 88 85)" />
                <ellipse cx="152" cy="85" rx="5" ry="9" fill="#F5CFBC" transform="rotate(6 152 85)" />

                {/* Soft Feminine Face Shape */}
                <path
                  d="M91 72 C89 42 151 42 149 72 C149 100 136 112 120 112 C104 112 91 100 91 72 Z"
                  fill="url(#charSkin)"
                />

                {/* Rosy Cheek Blush */}
                <ellipse cx="102" cy="91" rx="8" ry="5" fill="#F43F5E" opacity="0.18" />
                <ellipse cx="138" cy="91" rx="8" ry="5" fill="#F43F5E" opacity="0.18" />

                {/* Curved Gentle Eyebrows */}
                <path d="M98 70 Q106 66 114 69" stroke="#3E2318" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M126 69 Q134 66 142 70" stroke="#3E2318" strokeWidth="1.8" strokeLinecap="round" fill="none" />

                {/* Big Expressive Disney/Pixar Anime Eyes */}
                {/* Left Eye */}
                <g id="leftEye">
                  <path d="M98 79 Q106 74 114 79 Q106 86 98 79 Z" fill="#FFFFFF" />
                  <ellipse cx="106.5" cy="79" rx="4.5" ry="4.8" fill="url(#charIris)" />
                  <circle cx="106.5" cy="79" r="2.2" fill="#0A0402" />
                  {/* Primary highlight */}
                  <circle cx="105" cy="77" r="1.3" fill="#FFFFFF" />
                  {/* Secondary sparkle */}
                  <circle cx="108" cy="80.5" r="0.8" fill="#BAE6FD" />
                  {/* Lashes */}
                  <path d="M97 78 Q106 73 115 78.5" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <line x1="114" y1="78" x2="116.5" y2="76" stroke="#1C1917" strokeWidth="1.2" strokeLinecap="round" />
                </g>

                {/* Right Eye */}
                <g id="rightEye">
                  <path d="M126 79 Q134 74 142 79 Q134 86 126 79 Z" fill="#FFFFFF" />
                  <ellipse cx="133.5" cy="79" rx="4.5" ry="4.8" fill="url(#charIris)" />
                  <circle cx="133.5" cy="79" r="2.2" fill="#0A0402" />
                  {/* Primary highlight */}
                  <circle cx="132" cy="77" r="1.3" fill="#FFFFFF" />
                  {/* Secondary sparkle */}
                  <circle cx="135" cy="80.5" r="0.8" fill="#BAE6FD" />
                  {/* Lashes */}
                  <path d="M125 78.5 Q134 73 143 78" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <line x1="142" y1="78" x2="144.5" y2="76" stroke="#1C1917" strokeWidth="1.2" strokeLinecap="round" />
                </g>

                {/* Soft Nose */}
                <path d="M120 76 L119.5 86 Q120 88 121.5 87" stroke="#CB8A77" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                {/* Bright, Sweet Smile with Teeth */}
                <path d="M113 97 Q120 106 127 97 Z" fill="#BE123C" />
                <path d="M114.5 97.5 Q120 100.5 125.5 97.5" fill="#FFFFFF" />
                <path d="M113 97 Q120 96 127 97" stroke="#9F1239" strokeWidth="1.2" fill="none" />
              </g>

              {/* Front Styled Hair (Bangs & High Ponytail Base) */}
              <g id="hairFront">
                {/* Crown with Volume */}
                <path d="M90 70 C86 38 154 38 150 70 C145 52 136 44 120 44 C104 44 95 52 90 70 Z" fill="url(#charHair)" />
                <path d="M102 48 Q120 42 138 48" stroke="url(#charHairSheen)" strokeWidth="3" fill="none" />
                
                {/* Soft Side Strands */}
                <path d="M90 68 C88 88 90 106 94 118 C95 119 96 112 95 98 C94 84 93 74 90 68 Z" fill="url(#charHair)" />
                <path d="M150 68 C152 88 150 106 146 118 C145 119 144 112 145 98 C146 84 147 74 150 68 Z" fill="url(#charHair)" />
                
                {/* Sweet Soft Bangs */}
                <path d="M95 52 Q112 55 122 72 Q114 62 102 58 Z" fill="url(#charHair)" />
              </g>

              {/* Left Arm & Silver Tablet: "SKKN REVIEW PRO" */}
              <g id="tabletLeftArm" transform="translate(10, 0)">
                {/* Silver Tablet Body */}
                <rect x="122" y="172" width="76" height="98" rx="8" fill="url(#charTablet)" stroke="#475569" strokeWidth="1.2" filter="drop-shadow(0 6px 12px rgba(15,23,42,0.3))" />
                {/* Camera dot */}
                <circle cx="190" cy="180" r="1.8" fill="#1E293B" />
                
                {/* Tablet Backplate: Book Logo + SKKN REVIEW PRO */}
                <g transform="translate(142, 206)">
                  <path d="M4 0 Q18 -4 32 0 L32 16 Q18 12 4 16 Z" fill="#334155" opacity="0.4" />
                  <path d="M6 3 Q18 0 30 3 L30 15 Q18 12 6 15 Z" fill="#F8FAFC" />
                  <line x1="18" y1="2" x2="18" y2="13" stroke="#94A3B8" strokeWidth="1.2" />
                  <text x="18" y="24" fontSize="4.5" fontWeight="bold" fill="#F8FAFC" textAnchor="middle" letterSpacing="0.4">SKKN</text>
                  <text x="18" y="29" fontSize="3" fontWeight="600" fill="#94A3B8" textAnchor="middle" letterSpacing="0.8">REVIEW PRO</text>
                </g>

                {/* Laser scan line over tablet when analyzing */}
                {state === 'analyzing' && (
                  <line x1="124" y1="180" x2="196" y2="180" stroke="#38BDF8" strokeWidth="2" className="animate-[tabletLaserScan_1.5s_ease-in-out_infinite]" />
                )}

                {/* Left Hand Holding Tablet Bezel */}
                <ellipse cx="140" cy="235" rx="7" ry="10" fill="#FCE4D6" transform="rotate(-15 140 235)" />
                <ellipse cx="192" cy="225" rx="6" ry="9" fill="#FCE4D6" />
              </g>

              {/* Right Arm: Raised Hand Pointing Up */}
              <g id="rightHandPointing">
                {/* Forearm */}
                <path d="M82 170 Q70 195 62 215" stroke="#16233B" strokeWidth="16" strokeLinecap="round" />
                {/* Hand Palm */}
                <circle cx="62" cy="210" r="6" fill="#FCE4D6" />
                {/* Pointing Index Finger with Stylus Pen */}
                <rect x="59" y="180" width="4.5" height="18" rx="2.2" fill="#FCE4D6" transform="rotate(-10 59 180)" />
                <polygon points="56,172 61,162 64,172" fill="#334155" />
              </g>

              {/* Floating Document Badges (PDF, Word, Doc) on upper left */}
              <g id="floatingDocs" opacity="0.95">
                {/* PDF Badge */}
                <g transform="translate(34, 125)">
                  <rect x="0" y="0" width="22" height="26" rx="3" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))" />
                  <rect x="0" y="0" width="22" height="9" rx="2" fill="#EF4444" />
                  <text x="11" y="6.5" fontSize="4" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">PDF</text>
                  <line x1="4" y1="14" x2="18" y2="14" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="4" y1="18" x2="14" y2="18" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                </g>

                {/* Word Badge */}
                <g transform="translate(56, 92)">
                  <rect x="0" y="0" width="24" height="28" rx="3" fill="#FFFFFF" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.15))" />
                  <rect x="0" y="0" width="24" height="10" rx="2" fill="#2563EB" />
                  <text x="12" y="7.5" fontSize="5" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">W</text>
                  <line x1="4" y1="15" x2="20" y2="15" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="4" y1="19" x2="16" y2="19" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              </g>

              {/* Floating Rubric Checklist on right */}
              <g id="floatingRubric" transform="translate(182, 130)" opacity="0.95">
                <rect x="0" y="0" width="46" height="52" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.08))" />
                
                {/* Item 1: Rubric */}
                <circle cx="8" cy="12" r="3.5" fill="#10B981" />
                <path d="M6 12 L7.5 13.5 L10 10.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                <text x="15" y="13.5" fontSize="4.5" fontWeight="600" fill="#334155">Rubric</text>

                {/* Item 2: Minh chứng */}
                <circle cx="8" cy="24" r="3.5" fill="#10B981" />
                <path d="M6 24 L7.5 25.5 L10 22.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                <text x="15" y="25.5" fontSize="4.5" fontWeight="600" fill="#334155">Minh chứng</text>

                {/* Item 3: Logic */}
                <circle cx="8" cy="36" r="3.5" fill="#10B981" />
                <path d="M6 36 L7.5 37.5 L10 34.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                <text x="15" y="37.5" fontSize="4.5" fontWeight="600" fill="#334155">Logic</text>
              </g>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
