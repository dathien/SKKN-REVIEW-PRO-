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
  defaultSrc = '/mascot.svg',
  uploadMethod = 'file',
  issuesCount = 0,
  isAllResolved = false,
  isRescoring = false
}) => {
  // Use mascotSrc from localStorage if custom asset was provided, otherwise defaultSrc (/mascot.svg)
  const [mascotSrc, setMascotSrc] = useState<string>(() => {
    return localStorage.getItem('skkn_assistant_mascot_asset') || defaultSrc;
  });

  // Transient reaction triggers
  const [pulseType, setPulseType] = useState<'upload' | 'paste' | 'success' | 'resolved' | null>(null);
  const [activeToastBadge, setActiveToastBadge] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Staged analyzing progression
  const [analyzingStage, setAnalyzingStage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevUploadMethodRef = useRef(uploadMethod);
  const prevResolvedRef = useRef(isAllResolved);

  // Cycle through analyzing stages every 2.8s
  useEffect(() => {
    if (state === 'analyzing' || isRescoring) {
      setAnalyzingStage(0);
      const timer = setInterval(() => {
        setAnalyzingStage(prev => (prev + 1) % 4);
      }, 2800);
      return () => clearInterval(timer);
    }
  }, [state, isRescoring]);

  // Handle transient reactions on state changes
  useEffect(() => {
    if (state === 'skkn_loaded') {
      if (uploadMethod === 'paste') {
        setPulseType('paste');
        setActiveToastBadge('✓ Đã nhận nội dung');
      } else {
        setPulseType('upload');
        setActiveToastBadge('✓ Đã nhận SKKN');
      }
      const t1 = setTimeout(() => setPulseType(null), 650);
      const t2 = setTimeout(() => setActiveToastBadge(null), 1400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (state === 'analysis_done') {
      setPulseType('success');
      setActiveToastBadge('✓ ĐÃ PHÂN TÍCH XONG');
      const t1 = setTimeout(() => setPulseType(null), 700);
      const t2 = setTimeout(() => setActiveToastBadge(null), 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (state === 'all_resolved' || isAllResolved) {
      setPulseType('resolved');
      setActiveToastBadge('✓ Đã xử lý tất cả');
      const t1 = setTimeout(() => setPulseType(null), 450);
      const t2 = setTimeout(() => setActiveToastBadge(null), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [state, uploadMethod, isAllResolved]);

  // Speech bubble copy generator
  const getBubbleData = () => {
    if (state === 'error') {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Phân tích chưa hoàn tất. Hồ sơ của Thầy/Cô vẫn được giữ lại.'
      };
    }

    if (state === 'analyzing' || isRescoring) {
      if (isRescoring) {
        return {
          badge: 'TRỢ LÝ AI',
          text: 'Em đang đối chiếu phiên bản đã chỉnh sửa…'
        };
      }
      const stageMessages = [
        'Đang đọc cấu trúc sáng kiến…',
        'Đang đối chiếu tiêu chí chấm…',
        'Đang kiểm tra số liệu và minh chứng…',
        'Đang tổng hợp các điểm cần xử lý…'
      ];
      return {
        badge: 'TRỢ LÝ AI',
        text: stageMessages[analyzingStage] || 'Em đang đọc và đối chiếu hồ sơ…'
      };
    }

    if (state === 'rescore_done') {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Đã chấm lại. Thầy/Cô xem mức cải thiện của hồ sơ nhé!'
      };
    }

    if (state === 'all_resolved' || isAllResolved) {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Tốt rồi! Các vấn đề đã được xử lý. Thầy/Cô có thể Chấm lại hồ sơ.'
      };
    }

    if (state === 'analysis_done') {
      return {
        badge: 'TRỢ LÝ AI',
        text: 'Đã hoàn tất! Thầy/Cô xem các điểm cần xử lý nhé.'
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

    return {
      badge: 'TRỢ LÝ AI',
      text: 'Thầy/Cô hãy tải SKKN hoặc dán nội dung để bắt đầu nhé!'
    };
  };

  const bubbleData = getBubbleData();
  const [renderedBubble, setRenderedBubble] = useState(bubbleData);
  const [bubbleKey, setBubbleKey] = useState(0);

  // Trigger enter animation when bubble text changes
  useEffect(() => {
    if (bubbleData.text !== renderedBubble.text) {
      setRenderedBubble(bubbleData);
      setBubbleKey(k => k + 1);
    }
  }, [bubbleData.text]);

  // Handle user replacing/uploading custom mascot file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setMascotSrc(base64Data);
      localStorage.setItem('skkn_assistant_mascot_asset', base64Data);
      try {
        fetch('/api/save-mascot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataBase64: base64Data, filename: 'mascot.png' })
        }).catch(() => {});
      } catch {
        // Safe ignore
      }
    };
    reader.readAsDataURL(file);
  };

  const isAnalyzingMode = state === 'analyzing' || isRescoring;

  return (
    <div
      className={`relative flex flex-col items-center justify-start w-full select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Keyframes for Natural Idle & Reactions */}
      <style>{`
        /* 1. Natural Idle (6s, smooth ease-in-out) */
        @keyframes assistantNaturalIdle {
          0% {
            transform: translateY(0px) scale(1);
          }
          20% {
            transform: translateY(-2px) scale(1.003);
          }
          45% {
            transform: translateY(-3px) scale(1.006);
          }
          65% {
            transform: translateY(-1px) scale(1.003);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        /* 2. Synchronized Natural Shadow */
        @keyframes assistantNaturalShadow {
          0%, 100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.14;
          }
          20% {
            transform: translateX(-50%) scaleX(0.98);
            opacity: 0.12;
          }
          45% {
            transform: translateX(-50%) scaleX(0.96);
            opacity: 0.10;
          }
          65% {
            transform: translateX(-50%) scaleX(0.99);
            opacity: 0.13;
          }
        }

        /* 3. Ambient Glow behind mascot (5s cycle: 0.03 -> 0.10 -> 0.05 -> 0.03) */
        @keyframes assistantAmbientGlow {
          0%, 100% {
            opacity: 0.03;
            transform: translate(-50%, -50%) scale(0.95);
          }
          50% {
            opacity: 0.10;
            transform: translate(-50%, -50%) scale(1.05);
          }
          75% {
            opacity: 0.05;
            transform: translate(-50%, -50%) scale(1.0);
          }
        }

        /* 4. Analyzing Cyan Glow behind mascot (2.2s cycle: 0.06 -> 0.16 -> 0.06) */
        @keyframes assistantAnalyzingGlow {
          0%, 100% {
            opacity: 0.06;
            transform: translate(-50%, -50%) scale(0.98);
          }
          50% {
            opacity: 0.16;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }

        /* 5. Behind Scanning Light Line (2.5s infinite, strictly behind mascot) */
        @keyframes behindScanLight {
          0% {
            top: 8%;
            opacity: 0;
          }
          30% {
            opacity: 0.22;
          }
          70% {
            opacity: 0.22;
          }
          100% {
            top: 92%;
            opacity: 0;
          }
        }

        /* 6. Upload reaction (600ms: 1 -> 1.035 -> 0.995 -> 1, translateY -4px) */
        @keyframes mascotUploadPulse {
          0% {
            transform: translateY(0px) scale(1);
          }
          40% {
            transform: translateY(-4px) scale(1.035);
          }
          75% {
            transform: translateY(0px) scale(0.995);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes mascotPastePulse {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.02);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        /* 7. Success reaction (650ms: scale 1 -> 1.04 -> 1, translateY -5px) */
        @keyframes mascotSuccessPulse {
          0% {
            transform: translateY(0px) scale(1);
          }
          45% {
            transform: translateY(-5px) scale(1.04);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        /* 8. Resolved issue reaction (350ms: scale 1 -> 1.02 -> 1) */
        @keyframes mascotResolvedPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
          }
        }

        /* 9. Badge Toast Fade (Fade in -> Hold -> Fade out) */
        @keyframes badgeFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(5px) scale(0.92);
          }
          20% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-3px) scale(0.96);
          }
        }

        /* 10. Analyzing Staggered Dots */
        @keyframes dotBlinkStagger {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* 11. Speech Bubble Entry Animation (350ms, then stays still) */
        @keyframes bubbleEnterAnim {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 12. Accessibility: Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .assistant-mascot img,
          .assistant-mascot div {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Hidden file input for uploading custom mascot image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ======================================================================= */}
      {/* 1. SPEECH BUBBLE (Không nhảy liên tục, nâng 1px khi hover)               */}
      {/* ======================================================================= */}
      <div
        className="w-full max-w-[275px] z-10 shrink-0 mb-0 transition-transform duration-250 ease-out"
        style={{
          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)'
        }}
      >
        <div
          key={bubbleKey}
          className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xs animate-[bubbleEnterAnim_350ms_ease-out_forwards]"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAnalyzingMode
                    ? 'bg-cyan-500 animate-pulse'
                    : state === 'error'
                    ? 'bg-amber-500'
                    : state === 'skkn_loaded' || state === 'analysis_done' || isAllResolved
                    ? 'bg-emerald-500'
                    : 'bg-blue-600'
                }`}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {renderedBubble.badge}
              </span>
            </div>

            {/* Indicator số điểm cần xem (từ kết quả phân tích thật, Item 11) */}
            {state === 'analysis_done' && issuesCount > 0 && !isAllResolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{issuesCount} điểm cần xem</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {renderedBubble.text}
          </p>

          {/* Ba chấm sáng lần lượt: 1 -> 2 -> 3 -> 1 khi đang phân tích (Item 8) */}
          {isAnalyzingMode && (
            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400">Đang xử lý:</span>
              <div className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block animate-[dotBlinkStagger_1.2s_infinite]"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block animate-[dotBlinkStagger_1.2s_infinite]"
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block animate-[dotBlinkStagger_1.2s_infinite]"
                  style={{ animationDelay: '600ms' }}
                />
              </div>
            </div>
          )}

          {/* Speech Bubble Arrow Tail (points down, extends 4.5px below bubble) */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. GLOW & SCANNING LIGHT PHÍA SAU MASCOT (Không phủ lên mặt, Item 3 & 8)*/}
      {/* ======================================================================= */}
      <div
        className={`absolute top-[52%] left-1/2 rounded-full blur-3xl w-56 h-56 pointer-events-none -z-10 ${
          isAnalyzingMode
            ? 'bg-cyan-400/30 animate-[assistantAnalyzingGlow_2.2s_ease-in-out_infinite]'
            : isHovered
            ? 'bg-cyan-400/25 opacity-15 scale-105'
            : 'bg-cyan-400/20 animate-[assistantAmbientGlow_5s_ease-in-out_infinite]'
        }`}
      />

      {/* Đường scanning light rất mờ di chuyển phía SAU mascot khi analyzing (Item 8) */}
      {isAnalyzingMode && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent blur-[1px] pointer-events-none -z-10 animate-[behindScanLight_2.5s_infinite]"
        />
      )}

      {/* ======================================================================= */}
      {/* 3. MASCOT CONTAINER: ĐỈNH TÓC CÁCH MŨI NHỌN BUBBLE ĐÚNG 8-12px         */}
      {/* ======================================================================= */}
      <div className="assistant-mascot relative w-full h-[310px] sm:h-[330px] flex items-start justify-center mt-2.5 overflow-visible">
        
        {/* Shadow dưới chân: phản ứng cùng mascot (nhỏ lại khi mascot lên) */}
        <div
          className={`absolute bottom-0.5 left-1/2 w-44 h-2.5 bg-slate-600 rounded-full blur-[1px] pointer-events-none ${
            reducedMotion
              ? 'opacity-14'
              : 'animate-[assistantNaturalShadow_6s_ease-in-out_infinite]'
          }`}
        />

        {/* Transient Toast Badge (✓ Đã nhận SKKN, ✓ ĐÃ PHÂN TÍCH XONG, etc.) */}
        {activeToastBadge && (
          <div className="absolute top-[20%] -right-2 sm:-right-4 z-30 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-lg shadow-emerald-600/30 animate-[badgeFadeSlide_1.4s_ease-out_forwards]">
            <span>{activeToastBadge}</span>
          </div>
        )}

        {/* Toàn bộ ảnh Mascot: Căn giữa, không crop, animation đồng bộ */}
        <div
          className={`relative w-full h-full flex items-start justify-center cursor-pointer select-none transition-transform duration-250 ease-out ${
            reducedMotion
              ? ''
              : isHovered
              ? 'scale-[1.018] -translate-y-[3px]'
              : pulseType === 'upload'
              ? 'animate-[mascotUploadPulse_600ms_ease-out]'
              : pulseType === 'paste'
              ? 'animate-[mascotPastePulse_500ms_ease-out]'
              : pulseType === 'success'
              ? 'animate-[mascotSuccessPulse_650ms_ease-out]'
              : pulseType === 'resolved'
              ? 'animate-[mascotResolvedPulse_350ms_ease-out]'
              : isAnalyzingMode
              ? ''
              : 'animate-[assistantNaturalIdle_6s_ease-in-out_infinite]'
          }`}
          style={{ transformOrigin: 'center top' }}
          onClick={() => fileInputRef.current?.click()}
          title="Bấm để chọn file ảnh mascot nếu muốn thay đổi"
        >
          <img
            src={mascotSrc}
            alt="Trợ lý SKKN"
            className="w-auto h-full max-h-full object-contain pointer-events-none select-none drop-shadow-sm"
            style={{
              objectFit: 'contain',
              objectPosition: 'center top'
            }}
            onError={() => {
              if (mascotSrc !== '/mascot.svg') {
                setMascotSrc('/mascot.svg');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
