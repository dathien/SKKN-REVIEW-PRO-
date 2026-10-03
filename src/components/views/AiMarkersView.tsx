import React, { useState } from 'react';
import {
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { AiMarkersAnalysis } from '../../types';

interface AiMarkersViewProps {
  aiMarkers?: AiMarkersAnalysis;
  skknTitle: string;
}

export const AiMarkersView: React.FC<AiMarkersViewProps> = ({
  aiMarkers,
  skknTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const findings = aiMarkers?.findings || [];
  const findingsCount = findings.length;

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Minimalist Summary Card (Màn hình đầu 3 giây) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wide">
                Kiểm soát văn phong
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              DẤU HIỆU BIÊN SOẠN & VĂN PHONG
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rà soát các đoạn văn mang tính công thức khái quát, thiếu dấu ấn thực tiễn lớp học
            </p>
          </div>

          {/* 1 Primary Action */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 cursor-pointer transition-all shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn rà soát' : `Kiểm tra ${findingsCount} đoạn →`}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Minimal Status Box */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🟡</span>
            <div>
              <span className="font-bold text-amber-900 block">
                {findingsCount} ĐOẠN CẦN RÀ SOÁT VĂN PHONG
              </span>
              <span className="text-slate-600 text-[11px]">
                Nên bổ sung bối cảnh thực tế tại đơn vị để tăng tính chân thực sư phạm
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{isExpanded ? 'Đóng chi tiết' : 'Xem từng đoạn'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Details (chỉ xuất hiện khi click) */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Disclaimer Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong>Giới hạn của phân tích:</strong> Hệ thống chỉ gợi ý kiểm tra những đoạn có cấu trúc câu khuôn mẫu, không đưa ra kết luận mang tính quy chụp đạo văn hay tỷ lệ % AI.
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-3">
            {findings.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Đoạn {idx + 1}: {item.signsDetected}
                  </span>
                  <span className="font-semibold text-slate-600">{item.location}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-amber-400 italic text-slate-700">
                  “{item.excerpt}”
                </div>

                <div className="space-y-1 pt-1">
                  <div>
                    <span className="font-bold text-slate-800">Lý do lưu ý: </span>
                    <span className="text-slate-600">{item.basis}</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-800">Hướng sửa: </span>
                    <span className="text-slate-700">{item.suggestedHandling}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
