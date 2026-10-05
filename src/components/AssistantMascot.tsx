import React, { useState, useEffect, useRef } from 'react';

export type MascotState =
  | 'idle_no_skkn'      // CHƯA CÓ SKKN
  | 'skkn_loaded'       // ĐÃ NHẬN SKKN
  | 'analyzing'         // ĐANG CHẤM
  | 'analysis_done'     // HOÀN THÀNH
  | 'rescoring'         // ĐANG CHẤM LẠI
  | 'rescore_done'      // ĐÃ CHẤM LẠI
  | 'all_resolved'      // ĐÃ XỬ LÝ HẾT VẤN ĐỀ
  | 'error';            // LỖI

export interface AssistantMascotProps {
  state: MascotState;
  reducedMotion?: boolean;
  className?: string;
  defaultSrc?: string;
  uploadMethod?: 'file' | 'paste' | null;
  issuesCount?: number;
  isAllResolved?: boolean;
  isRescoring?: boolean;
  onActionClick?: () => void;
}

export const AssistantMascot: React.FC<AssistantMascotProps> = ({
  state,
  reducedMotion = false,
  className = '',
  uploadMethod = 'file',
  issuesCount = 0,
  isAllResolved = false,
  isRescoring = false,
  onActionClick
}) => {
  // Interaction & reaction states
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [temporaryGreeting, setTemporaryGreeting] = useState<string | null>(null);

  // Staged analyzing progression
  const [analyzingStage, setAnalyzingStage] = useState(0);

  // Eye mouse tracking state (clamped to max 4px, only applied to pupils)
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  const isAnalyzing = state === 'analyzing' || isRescoring;
  const remainingIssues = issuesCount;
  const isAttention = state === 'analysis_done' && remainingIssues > 0 && !isAllResolved;
  const isSuccess = state === 'all_resolved' || isAllResolved;

  // Compute mascot data-state for CSS rules
  const mascotDataState = isAnalyzing
    ? 'analyzing'
    : isAttention
    ? 'attention'
    : isSuccess
    ? 'success'
    : 'idle';

  // Cycle through analyzing stages every 2.6s
  useEffect(() => {
    if (isAnalyzing) {
      setAnalyzingStage(0);
      const timer = setInterval(() => {
        setAnalyzingStage((prev) => (prev + 1) % 4);
      }, 2600);
      return () => clearInterval(timer);
    }
  }, [isAnalyzing]);

  // Handle Mouse Movement for Eye Tracking with requestAnimationFrame & clamped vector (max 4px)
  useEffect(() => {
    if (reducedMotion) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }

    // In analyzing mode, eyes look down towards evaluation paper
    if (isAnalyzing) {
      setPupilOffset({ x: -2.5, y: 3.2 });
      return;
    }

    // In attention mode, eyes look gently up towards speech bubble
    if (isAttention) {
      setPupilOffset({ x: 0, y: -2.8 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Eye center in screen coordinates (center between left eye at 112, 114 and right eye at 188, 114 in 300x380 viewBox)
        const eyeCenterX = rect.left + rect.width * (150 / 300);
        const eyeCenterY = rect.top + rect.height * (114 / 380);

        const dx = e.clientX - eyeCenterX;
        const dy = e.clientY - eyeCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) {
          setPupilOffset({ x: 0, y: 0 });
          return;
        }

        const maxOffset = 3.8; // Maximum px pupils can travel inside the eye
        const moveDist = Math.min(dist * 0.032, maxOffset);
        const offsetX = (dx / dist) * moveDist;
        const offsetY = (dy / dist) * moveDist;

        setPupilOffset({
          x: Math.round(offsetX * 100) / 100,
          y: Math.round(offsetY * 100) / 100
        });
      });
    };

    const handleMouseLeave = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPupilOffset({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('blur', handleMouseLeave);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('blur', handleMouseLeave);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion, isAnalyzing, isAttention]);

  // Click reaction handler: bounce animation + temporary speech bubble greeting for 2.5s
  const handleMascotClick = () => {
    if (isClicked) return;
    setIsClicked(true);
    setTemporaryGreeting('Em sẵn sàng hỗ trợ Thầy/Cô kiểm tra SKKN!');

    if (onActionClick) {
      onActionClick();
    }

    setTimeout(() => {
      setIsClicked(false);
    }, 700);

    setTimeout(() => {
      setTemporaryGreeting(null);
    }, 2500);
  };

  // Determine speech bubble text
  const getBubbleContent = () => {
    if (temporaryGreeting) {
      return {
        badge: 'TRỢ LÝ AI',
        text: temporaryGreeting
      };
    }

    if (state === 'error') {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Phân tích chưa hoàn tất. Hồ sơ của Thầy/Cô vẫn được giữ lại an toàn.'
      };
    }

    if (isAnalyzing) {
      if (isRescoring) {
        return {
          badge: 'TRỢ LÝ AI',
          text: 'Em đang đối chiếu phiên bản đã chỉnh sửa và chấm lại…'
        };
      }
      const stages = [
        'Em đang đọc hồ sơ...',
        'Em đang đối chiếu phiếu chấm...',
        'Em đang kiểm tra minh chứng...',
        'Em đang rà soát số liệu & logic...'
      ];
      return {
        badge: 'TRỢ LÝ AI',
        text: stages[analyzingStage] || 'Em đang đọc và đối chiếu hồ sơ...'
      };
    }

    if (state === 'all_resolved' || isAllResolved) {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Các nội dung cần xử lý đã được kiểm tra.'
      };
    }

    if (state === 'rescore_done') {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Đã chấm lại xong. Thầy/Cô xem kết quả cải thiện điểm nhé!'
      };
    }

    if (state === 'analysis_done') {
      if (remainingIssues > 0) {
        return {
          badge: 'TRỢ LÝ AI',
          text: `Em phát hiện ${remainingIssues} nội dung Thầy/Cô nên kiểm tra.`
        };
      }
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Đã hoàn tất phân tích! Hồ sơ đạt yêu cầu tốt.'
      };
    }

    if (state === 'skkn_loaded') {
      if (uploadMethod === 'paste') {
        return {
          badge: 'TRỢ LÝ AI',
          text: 'Em đã nhận nội dung. Sẵn sàng phân tích!'
        };
      }
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Em đã nhận SKKN. Thầy/Cô có thể bắt đầu chấm nhé!'
      };
    }

    // Default idle state
    return {
      badge: 'TRỢ LÝ AI',
      text: 'Thầy/Cô hãy tải SKKN hoặc dán nội dung để bắt đầu nhé!'
    };
  };

  const bubble = getBubbleContent();

  return (
    <div
      ref={containerRef}
      data-state={mascotDataState}
      className={`assistant-wrapper relative flex flex-col items-center justify-start w-full select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ======================================================================= */}
      {/* CSS STYLES FOR CHIBI FEMALE MASCOT ANIMATIONS                            */}
      {/* ======================================================================= */}
      <style>{`
        /* 1. Speech Bubble Gentle Float (4.5s) */
        @keyframes bubbleFloatMotion {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        /* 2. Whole Mascot Bobbing / Nhún nhẹ (4.2s) */
        @keyframes mascotBobMotion {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        /* 3. Mascot Breathing / Thở nhẹ (3.6s) */
        @keyframes mascotBreatheMotion {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.008);
          }
        }

        /* 4. Head Gentle Tilt / Nghiêng đầu (7.0s) */
        @keyframes mascotHeadTiltMotion {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(1deg);
          }
          50% {
            transform: rotate(0deg);
          }
          75% {
            transform: rotate(-0.7deg);
          }
        }

        /* 5. Arm & Evaluation Paper Motion (3.8s) - Tay và giấy luôn đi cùng nhau */
        @keyframes armPaperMotion {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-1.5deg);
          }
        }

        /* 6. Natural Blinking / Chớp mắt tự nhiên (5.5s cycle) */
        @keyframes mascotEyelidBlink {
          0%, 93%, 97%, 100% {
            transform: scaleY(0);
          }
          95% {
            transform: scaleY(1);
          }
        }

        /* 7. Floor Shadow Motion */
        @keyframes mascotShadowMotion {
          0%, 100% {
            transform: scale(1);
            opacity: 0.12;
          }
          50% {
            transform: scale(0.96);
            opacity: 0.09;
          }
        }

        /* 8. Analyzing Mode: Subtle paper movement */
        @keyframes paperReadingMotion {
          0%, 100% {
            transform: rotate(-1deg) translate(0px, 0px);
          }
          50% {
            transform: rotate(-2.5deg) translate(0.5px, -1px);
          }
        }

        /* 9. Click Reaction Spring (700ms) */
        @keyframes mascotClickSpring {
          0% {
            transform: translateY(0px) scale(1);
          }
          35% {
            transform: translateY(-4px) scale(1.015);
          }
          70% {
            transform: translateY(1px) scale(0.995);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        /* Applied Layered Motion Classes (Each layer has its own single transform) */
        .mascot-float {
          animation: ${reducedMotion ? 'none' : 'mascotBobMotion 4.2s ease-in-out infinite'};
        }

        .mascot-breathe {
          transform-origin: 150px 340px;
          animation: ${reducedMotion ? 'none' : 'mascotBreatheMotion 3.6s ease-in-out infinite'};
        }

        .mascot-head-motion {
          transform-origin: 150px 145px;
          transition: transform 0.3s ease-out;
          animation: ${reducedMotion ? 'none' : 'mascotHeadTiltMotion 7s ease-in-out infinite'};
        }

        .paper-arm-motion {
          transform-origin: 105px 185px;
          transition: transform 0.3s ease-out;
          animation: ${reducedMotion ? 'none' : 'armPaperMotion 3.8s ease-in-out infinite'};
        }

        .mascot-eyelid-left,
        .mascot-eyelid-right {
          transform-origin: 0 96px;
          animation: ${reducedMotion ? 'none' : 'mascotEyelidBlink 5.5s infinite'};
        }

        .mascot-shadow-motion {
          transform-origin: 150px 365px;
          animation: ${reducedMotion ? 'none' : 'mascotShadowMotion 4.2s ease-in-out infinite'};
        }

        /* Hover Reaction */
        .assistant-wrapper:hover .mascot-float {
          transform: translateY(-3px);
        }

        .assistant-wrapper:hover .mascot-head-motion {
          transform: rotate(1.2deg);
        }

        .assistant-wrapper:hover .paper-arm-motion {
          transform: rotate(-3deg);
        }

        /* Click Reaction */
        .assistant-wrapper.is-clicked .mascot-stage {
          animation: mascotClickSpring 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* State Overrides */
        [data-state="analyzing"] .paper-arm-motion {
          animation: paperReadingMotion 1.2s ease-in-out infinite !important;
        }

        [data-state="attention"] .mascot-head-motion {
          transform: rotate(2deg) !important;
        }

        [data-state="attention"] .paper-arm-motion {
          transform: rotate(-2.8deg) !important;
        }

        [data-state="success"] .paper-arm-motion {
          transform: rotate(-4.5deg) !important;
        }

        /* Eye pupil smooth transition (only pupils move, highlights stay fixed) */
        .left-eye-pupil,
        .right-eye-pupil {
          transition: transform 140ms ease-out;
        }

        /* Accessibility: Prefers Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .mascot-float,
          .mascot-breathe,
          .mascot-head-motion,
          .paper-arm-motion,
          .mascot-eyelid-left,
          .mascot-eyelid-right,
          .mascot-shadow-motion,
          .bubble-float-wrapper,
          .mascot-stage {
            animation: none !important;
          }
        }
      `}</style>

      {/* ======================================================================= */}
      {/* 1. BUBBLE: assistant-bubble (Giữ nguyên phong cách, cách búi tóc 4–8px)  */}
      {/* ======================================================================= */}
      <div className="assistant-bubble w-full max-w-[320px] z-20 shrink-0 mb-0">
        <div
          className={`bubble-float-wrapper transition-transform duration-300 ease-out ${
            reducedMotion ? '' : 'animate-[bubbleFloatMotion_4.5s_ease-in-out_infinite]'
          }`}
          style={{
            transform: isHovered ? 'translateY(-2px)' : undefined
          }}
        >
          <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/95 rounded-2xl p-3.5 shadow-xs">
            
            {/* Header: TRỢ LÝ AI + dot trạng thái */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAnalyzing
                      ? 'bg-cyan-500 animate-pulse'
                      : state === 'error'
                      ? 'bg-rose-500'
                      : state === 'skkn_loaded' || state === 'analysis_done' || isAllResolved
                      ? 'bg-emerald-500'
                      : 'bg-blue-600'
                  }`}
                />
                <span className="text-[14px] font-bold uppercase tracking-wide text-slate-800">
                  {bubble.badge}
                </span>
              </div>

              {/* Tag số điểm cần kiểm tra (Dữ liệu thật remainingIssues) */}
              {state === 'analysis_done' && remainingIssues > 0 && !isAllResolved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{remainingIssues} điểm cần xem</span>
                </span>
              )}
            </div>

            {/* Bubble Text */}
            <p className="text-[15px] text-slate-700 font-medium leading-[1.55]">
              {bubble.text}
            </p>

            {/* Analyzing dots indicator */}
            {isAnalyzing && (
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                <span className="text-[13px] font-semibold text-slate-400">Tiến trình:</span>
                <div className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block animate-pulse"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block animate-pulse"
                    style={{ animationDelay: '250ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block animate-pulse"
                    style={{ animationDelay: '500ms' }}
                  />
                </div>
              </div>
            )}

            {/* Tail pointing down toward mascot bun (sit 4–8px above hair bun) */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. MASCOT STAGE: mascot-stage -> mascot-float -> mascot-breathe -> SVG  */}
      {/* Khoảng cách đỉnh búi tóc đến đuôi bubble chuẩn 4–8px                    */}
      {/* ======================================================================= */}
      <div
        className={`mascot-stage relative w-full flex items-center justify-center mt-1 overflow-visible cursor-pointer ${
          isClicked ? 'is-clicked' : ''
        }`}
        onClick={handleMascotClick}
        title="Bấm vào Trợ lý để tương tác!"
      >
        <div className="mascot-float w-full flex items-center justify-center">
          <div className="mascot-breathe w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[310px] h-auto flex items-center justify-center">
            
            <svg
              ref={svgRef}
              viewBox="0 0 300 380"
              className="w-full h-auto overflow-visible select-none drop-shadow-sm transition-transform duration-200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 1. Tóc tím nâu (Silk Brownish-Purple Hair Gradients) */}
                <linearGradient id="chibiHairGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#58355E" />
                  <stop offset="45%" stopColor="#44254A" />
                  <stop offset="85%" stopColor="#321738" />
                  <stop offset="100%" stopColor="#220D26" />
                </linearGradient>

                <linearGradient id="chibiHairSheen" x1="0%" y1="0%" x2="100%" y2="60%">
                  <stop offset="0%" stopColor="#8C5C94" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6E4476" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#44254A" stopOpacity="0" />
                </linearGradient>

                {/* 2. Làn da mềm mại (Porcelain Anime Skin Tone) */}
                <radialGradient id="chibiSkinGrad" cx="50%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#FFF9F5" />
                  <stop offset="55%" stopColor="#FEEAE0" />
                  <stop offset="85%" stopColor="#F8D3C0" />
                  <stop offset="100%" stopColor="#EDBFA8" />
                </radialGradient>

                {/* 3. Mắt tím lớn (Large Vivid Purple / Violet Eyes) */}
                <radialGradient id="chibiIrisGrad" cx="45%" cy="38%" r="60%">
                  <stop offset="0%" stopColor="#C4B5FD" />
                  <stop offset="35%" stopColor="#8B5CF6" />
                  <stop offset="70%" stopColor="#6D28D9" />
                  <stop offset="100%" stopColor="#2E1065" />
                </radialGradient>

                {/* 4. Áo xanh cổ vịt (Deep Teal Blouse) */}
                <linearGradient id="tealBlouseGrad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#0D9488" />
                  <stop offset="50%" stopColor="#0F766E" />
                  <stop offset="100%" stopColor="#115E59" />
                </linearGradient>

                {/* 5. Nơ cam rực rỡ (Warm Orange Bow Tie) */}
                <linearGradient id="orangeBowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FB923C" />
                  <stop offset="55%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>

                {/* 6. Chân váy navy (Navy Blue Skirt) */}
                <linearGradient id="navySkirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="50%" stopColor="#172554" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* 7. Giày tối màu (Dark Shoes) */}
                <linearGradient id="darkShoeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* 8. Tờ giấy đánh giá (Evaluation Paper with shadow) */}
                <linearGradient id="evalPaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="85%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#EEF2F6" />
                </linearGradient>

                {/* Eyelid Clip Paths for natural blink without distorting eye */}
                <clipPath id="chibiLeftEyeClip">
                  <ellipse cx="112" cy="114" rx="17" ry="21" />
                </clipPath>

                <clipPath id="chibiRightEyeClip">
                  <ellipse cx="188" cy="114" rx="17" ry="21" />
                </clipPath>
              </defs>

              {/* ------------------------------------------------------------- */}
              {/* FLOOR SHADOW (Bóng tròn tự nhiên dưới chân)                   */}
              {/* ------------------------------------------------------------- */}
              <g className="mascot-shadow-motion">
                <ellipse cx="150" cy="365" rx="72" ry="8.5" fill="#0F172A" fillOpacity="0.12" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 1. TÓC PHÍA SAU ĐẦU (Back Hair Silhouette)                    */}
              {/* ------------------------------------------------------------- */}
              <g id="back-hair">
                {/* Hair silhouette behind neck and shoulders */}
                <path
                  d="M 86 95 C 65 130 65 175 92 205 C 102 215 118 212 120 200 C 108 178 100 145 104 112 Z"
                  fill="url(#chibiHairGrad)"
                />
                <path
                  d="M 214 95 C 235 130 235 175 208 205 C 198 215 182 212 180 200 C 192 178 200 145 196 112 Z"
                  fill="url(#chibiHairGrad)"
                />
                <path
                  d="M 85 105 C 72 155 82 205 150 215 C 218 205 228 155 215 105 Z"
                  fill="url(#chibiHairGrad)"
                />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 2. CHÂN & GIÀY TỐI MÀU (Legs & Dark Shoes)                    */}
              {/* ------------------------------------------------------------- */}
              <g id="legs-and-shoes">
                {/* Left Leg */}
                <rect x="127" y="282" width="16" height="66" rx="8" fill="#F8D3C0" />
                {/* Left Shoe */}
                <ellipse cx="134" cy="354" rx="13" ry="8" fill="url(#darkShoeGrad)" />
                <path d="M 121 354 C 121 346 147 346 147 354 C 147 360 121 360 121 354 Z" fill="url(#darkShoeGrad)" />
                {/* Shoe buckle highlight */}
                <rect x="130" y="348" width="8" height="2.5" rx="1" fill="#CBD5E1" opacity="0.8" />

                {/* Right Leg */}
                <rect x="157" y="282" width="16" height="66" rx="8" fill="#F8D3C0" />
                {/* Right Shoe */}
                <ellipse cx="166" cy="354" rx="13" ry="8" fill="url(#darkShoeGrad)" />
                <path d="M 153 354 C 153 346 179 346 179 354 C 179 360 153 360 153 354 Z" fill="url(#darkShoeGrad)" />
                {/* Shoe buckle highlight */}
                <rect x="162" y="348" width="8" height="2.5" rx="1" fill="#CBD5E1" opacity="0.8" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 3. CHÂN VÁY NAVY (Navy Blue Pleated Skirt)                    */}
              {/* ------------------------------------------------------------- */}
              <g id="navy-skirt">
                <path
                  d="M 104 230 C 122 233 178 233 196 230 C 212 258 218 288 220 295 C 180 302 120 302 80 295 C 82 288 88 258 104 230 Z"
                  fill="url(#navySkirtGrad)"
                />
                {/* Pleat shadows */}
                <path d="M 126 232 L 120 298" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 148 233 L 148 299" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 174 232 L 180 298" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
                {/* Skirt waistband */}
                <path d="M 104 230 Q 150 234 196 230" stroke="#334155" strokeWidth="2.5" fill="none" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 4. THÂN & ÁO XANH CỔ VỊT + NƠ CAM (Teal Blouse & Orange Bow) */}
              {/* ------------------------------------------------------------- */}
              <g id="torso-and-blouse">
                {/* Teal Blouse Body */}
                <path
                  d="M 96 168 C 114 162 186 162 204 168 C 212 186 210 234 196 234 C 172 236 128 236 104 234 C 90 234 88 186 96 168 Z"
                  fill="url(#tealBlouseGrad)"
                  stroke="#0F766E"
                  strokeWidth="1"
                />

                {/* White Shirt Collar */}
                <polygon points="125,160 150,182 136,160" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
                <polygon points="175,160 150,182 164,160" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />

                {/* Nơ cam (Vibrant Orange Bow Tie) */}
                <g id="orange-bow">
                  {/* Left bow wing */}
                  <path d="M 150 178 C 142 168 126 172 132 184 C 137 192 148 182 150 178 Z" fill="url(#orangeBowGrad)" stroke="#C2410C" strokeWidth="0.8" />
                  {/* Right bow wing */}
                  <path d="M 150 178 C 158 168 174 172 168 184 C 163 192 152 182 150 178 Z" fill="url(#orangeBowGrad)" stroke="#C2410C" strokeWidth="0.8" />
                  {/* Center knot */}
                  <circle cx="150" cy="178" r="4.2" fill="#F97316" stroke="#C2410C" strokeWidth="0.8" />
                  {/* Ribbon tails */}
                  <path d="M 148 181 L 142 195 L 148 193 Z" fill="#EA580C" />
                  <path d="M 152 181 L 158 195 L 152 193 Z" fill="#EA580C" />
                </g>

                {/* Blouse button / seam details */}
                <circle cx="150" cy="200" r="2" fill="#115E59" />
                <circle cx="150" cy="216" r="2" fill="#115E59" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 5. TAY PHẢI (Right Arm resting / welcoming gesture)          */}
              {/* ------------------------------------------------------------- */}
              <g id="right-arm">
                <path
                  d="M 200 170 C 218 185 224 212 216 236 C 214 242 206 244 202 238 C 196 226 195 198 192 178 Z"
                  fill="url(#tealBlouseGrad)"
                  stroke="#0F766E"
                  strokeWidth="0.8"
                />
                {/* Right hand */}
                <circle cx="215" cy="242" r="7.5" fill="#FEEAE0" />
                <ellipse cx="218" cy="240" rx="3" ry="5" fill="#FEEAE0" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 6. TAY TRÁI & TỜ GIẤY ĐÁNH GIÁ (Left Arm + Paper in 1 group) */}
              {/* Luôn di chuyển cùng nhau, không bao giờ tách rời              */}
              {/* ------------------------------------------------------------- */}
              <g className="paper-arm-motion" id="arm-and-paper-unified">
                
                {/* Left Sleeve Upper */}
                <path
                  d="M 102 170 C 84 184 76 210 82 235 C 84 240 92 242 96 236 C 102 225 106 198 108 178 Z"
                  fill="url(#tealBlouseGrad)"
                  stroke="#0F766E"
                  strokeWidth="0.8"
                />

                {/* TỜ GIẤY ĐÁNH GIÁ (Evaluation Sheet with Green Checkmark) */}
                <g id="evaluation-paper" transform="rotate(-6 85 235)">
                  {/* Paper drop shadow */}
                  <rect x="49" y="185" width="68" height="92" rx="5" fill="#0F172A" fillOpacity="0.08" />
                  
                  {/* Paper sheet */}
                  <rect
                    x="48"
                    y="184"
                    width="68"
                    height="92"
                    rx="5"
                    fill="url(#evalPaperGrad)"
                    stroke="#CBD5E1"
                    strokeWidth="1.2"
                  />

                  {/* Header bar teal */}
                  <rect x="54" y="191" width="34" height="6.5" rx="3" fill="#0D9488" />
                  
                  {/* Evaluation Text / Rubric lines */}
                  <line x1="54" y1="205" x2="88" y2="205" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="54" y1="213" x2="108" y2="213" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="54" y1="221" x2="100" y2="221" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="54" y1="229" x2="104" y2="229" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="54" y1="237" x2="90" y2="237" stroke="#E2E8F0" strokeWidth="2.2" strokeLinecap="round" />

                  {/* DẤU CHECK XANH (Green Checkmark Badge - prominent & crisp) */}
                  <circle cx="82" cy="254" r="13" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1.2" />
                  <circle cx="82" cy="254" r="10.5" fill="#16A34A" />
                  {/* White Check Path */}
                  <path
                    d="M 77 254 L 80.5 257.5 L 87.5 250"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Mini score badge A+ / ĐẠT */}
                  <rect x="54" y="248" width="16" height="12" rx="2" fill="#E0F2FE" />
                  <text
                    x="62"
                    y="257"
                    fontSize="7"
                    fontWeight="bold"
                    fill="#0284C7"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    A+
                  </text>
                </g>

                {/* Left hand firmly clasping the paper edge */}
                <ellipse cx="98" cy="238" rx="7" ry="9" fill="#FEEAE0" stroke="#F8D3C0" strokeWidth="0.8" />
                {/* Thumb holding paper front */}
                <path
                  d="M 94 233 C 98 230 104 233 103 240 C 102 245 96 244 94 239 Z"
                  fill="#FEEAE0"
                />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 7. ĐẦU & KHUÔN MẶT: mascot-head-motion                        */}
              {/* Nghiêng đầu nhẹ tự nhiên (7.0s)                               */}
              {/* ------------------------------------------------------------- */}
              <g className="mascot-head-motion" id="chibi-head-group">
                
                {/* Cổ (Neck) */}
                <path d="M 141 150 L 141 162 L 159 162 L 159 150 Z" fill="#FEEAE0" />

                {/* Khuôn mặt (Face Base) */}
                <path
                  d="M 95 106 C 95 68 205 68 205 106 C 205 142 186 160 150 160 C 114 160 95 142 95 106 Z"
                  fill="url(#chibiSkinGrad)"
                />

                {/* Tai hai bên (Ears) */}
                <ellipse cx="92" cy="116" rx="6" ry="9" fill="#FEEAE0" />
                <ellipse cx="208" cy="116" rx="6" ry="9" fill="#FEEAE0" />

                {/* Má hồng nhẹ (Delicate Soft Pink Cheeks) */}
                <circle cx="106" cy="128" r="10.5" fill="#FB7185" fillOpacity="0.22" />
                <circle cx="194" cy="128" r="10.5" fill="#FB7185" fillOpacity="0.22" />

                {/* Miệng cười xinh xắn thân thiện (Polite Cute Smile) */}
                <path
                  d="M 143 140 Q 150 146 157 140"
                  fill="none"
                  stroke="#C2410C"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* Mũi nhỏ nhắn đáng yêu */}
                <path
                  d="M 149 132 Q 150 134 152 133"
                  fill="none"
                  stroke="#E5AF98"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />

                {/* Lông mày thanh tú (Gentle Eyebrows) */}
                <path
                  d="M 100 95 Q 112 90 124 94"
                  fill="none"
                  stroke="#58355E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 176 94 Q 188 90 200 95"
                  fill="none"
                  stroke="#58355E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* =========================================================== */}
                {/* MẮT TÍM LỚN (Large Violet Eyes & Eye Tracking)              */}
                {/* =========================================================== */}
                <g id="eyes-group">
                  
                  {/* --- MẮT TRÁI (LEFT EYE) --- */}
                  <g id="left-eye">
                    {/* Sclera white oval */}
                    <ellipse cx="112" cy="114" rx="17" ry="21" fill="#FFFFFF" stroke="#F1F5F9" strokeWidth="0.8" />
                    
                    {/* Purple / Violet Iris */}
                    <ellipse cx="112" cy="114" rx="13.5" ry="17.5" fill="url(#chibiIrisGrad)" />
                    <ellipse cx="112" cy="119" rx="9" ry="6" fill="#C4B5FD" fillOpacity="0.4" />

                    {/* Left Eye Pupil (CHỈ DI CHUYỂN PUPIL, max 4px via JS) */}
                    <ellipse
                      className="left-eye-pupil"
                      cx="112"
                      cy="114"
                      rx="7.5"
                      ry="10.5"
                      fill="#1E0828"
                      style={{
                        transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
                      }}
                    />

                    {/* Highlights (TÁCH RIÊNG .eye-highlight, KHÔNG DI CHUYỂN) */}
                    <circle className="eye-highlight" cx="116.5" cy="106" r="4.5" fill="#FFFFFF" />
                    <circle className="eye-highlight" cx="107" cy="121.5" r="2.4" fill="#FFFFFF" />
                    <circle className="eye-highlight" cx="118" cy="119" r="1.3" fill="#E0E7FF" />

                    {/* Left Upper Eyelashes */}
                    <path
                      d="M 94 107 Q 112 96 130 105"
                      fill="none"
                      stroke="#220D26"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path d="M 127 103 L 132 99" stroke="#220D26" strokeWidth="2.2" strokeLinecap="round" />

                    {/* Left Eyelid (Chớp mắt tự nhiên qua clipPath) */}
                    <g clipPath="url(#chibiLeftEyeClip)">
                      <rect
                        className="mascot-eyelid-left"
                        x="90"
                        y="92"
                        width="44"
                        height="44"
                        fill="#FEEAE0"
                      />
                    </g>
                  </g>

                  {/* --- MẮT PHẢI (RIGHT EYE) --- */}
                  <g id="right-eye">
                    {/* Sclera white oval */}
                    <ellipse cx="188" cy="114" rx="17" ry="21" fill="#FFFFFF" stroke="#F1F5F9" strokeWidth="0.8" />
                    
                    {/* Purple / Violet Iris */}
                    <ellipse cx="188" cy="114" rx="13.5" ry="17.5" fill="url(#chibiIrisGrad)" />
                    <ellipse cx="188" cy="119" rx="9" ry="6" fill="#C4B5FD" fillOpacity="0.4" />

                    {/* Right Eye Pupil (CHỈ DI CHUYỂN PUPIL, max 4px via JS) */}
                    <ellipse
                      className="right-eye-pupil"
                      cx="188"
                      cy="114"
                      rx="7.5"
                      ry="10.5"
                      fill="#1E0828"
                      style={{
                        transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
                      }}
                    />

                    {/* Highlights (TÁCH RIÊNG .eye-highlight, KHÔNG DI CHUYỂN) */}
                    <circle className="eye-highlight" cx="192.5" cy="106" r="4.5" fill="#FFFFFF" />
                    <circle className="eye-highlight" cx="183" cy="121.5" r="2.4" fill="#FFFFFF" />
                    <circle className="eye-highlight" cx="194" cy="119" r="1.3" fill="#E0E7FF" />

                    {/* Right Upper Eyelashes */}
                    <path
                      d="M 170 105 Q 188 96 206 107"
                      fill="none"
                      stroke="#220D26"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path d="M 203 103 L 208 99" stroke="#220D26" strokeWidth="2.2" strokeLinecap="round" />

                    {/* Right Eyelid (Chớp mắt tự nhiên qua clipPath) */}
                    <g clipPath="url(#chibiRightEyeClip)">
                      <rect
                        className="mascot-eyelid-right"
                        x="166"
                        y="92"
                        width="44"
                        height="44"
                        fill="#FEEAE0"
                      />
                    </g>
                  </g>
                </g>

                {/* =========================================================== */}
                {/* TÓC TÍM NÂU: TÓC MÁI, TÓC MAI HAI BÊN & BÚI TÓC             */}
                {/* =========================================================== */}
                <g id="front-hair">
                  {/* BÚI TÓC TRÊN ĐỈNH ĐẦU (Top Bun) - Đã hạ 16px để nối liền tự nhiên với mái tóc */}
                  <g id="top-hair-bun">
                    <circle cx="150" cy="56" r="24" fill="url(#chibiHairGrad)" stroke="#321738" strokeWidth="1" />
                    <circle cx="150" cy="54" r="20" fill="url(#chibiHairSheen)" />
                    {/* Hair tie / nơ cột tóc xanh cổ vịt tại điểm tiếp giáp với mái tóc */}
                    <ellipse cx="150" cy="63" rx="14" ry="4.5" fill="#0D9488" stroke="#115E59" strokeWidth="0.8" />
                  </g>

                  {/* Tóc mái trên trán (Arched Bangs) */}
                  <path
                    d="M 88 102 C 86 64 214 64 212 102 C 196 90 182 92 165 96 C 150 99 138 98 126 95 C 112 92 98 92 88 102 Z"
                    fill="url(#chibiHairGrad)"
                  />
                  {/* Hair shine highlight curve */}
                  <path
                    d="M 104 78 Q 150 68 196 78"
                    fill="none"
                    stroke="url(#chibiHairSheen)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.75"
                  />

                  {/* TÓC MAI HAI BÊN (Side Bangs Framing Face) */}
                  {/* Left Side Strand */}
                  <path
                    d="M 88 100 C 84 122 86 142 96 156 C 97 158 98 152 96 144 C 94 130 92 115 94 100 Z"
                    fill="url(#chibiHairGrad)"
                  />
                  {/* Right Side Strand */}
                  <path
                    d="M 212 100 C 216 122 214 142 204 156 C 203 158 202 152 204 144 C 206 130 208 115 206 100 Z"
                    fill="url(#chibiHairGrad)"
                  />
                </g>

              </g>

            </svg>
          </div>
        </div>
      </div>

    </div>
  );
};
