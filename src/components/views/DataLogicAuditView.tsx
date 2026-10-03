import React, { useState } from 'react';
import {
  Calculator,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  GitBranch,
  CheckCircle2
} from 'lucide-react';
import { DataAnomalyItem, LogicGapItem } from '../../types';

interface DataLogicAuditViewProps {
  dataAnomalies: DataAnomalyItem[];
  logicGaps: LogicGapItem[];
}

export const DataLogicAuditView: React.FC<DataLogicAuditViewProps> = ({
  dataAnomalies,
  logicGaps
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Minimalist Summary Card (Màn hình đầu 3 giây) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wide">
                Độ chính xác dữ liệu
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-rose-600" />
              SỐ LIỆU & LOGIC NGHIÊN CỨU
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Phát hiện mâu thuẫn cỡ mẫu, tính toán sai lệch và đứt gãy chuỗi lập luận
            </p>
          </div>

          {/* 1 Primary Action */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-rose-600/30 cursor-pointer transition-all shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết →'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Short Summary List */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>🔴 {dataAnomalies.length} mâu thuẫn số liệu phát hiện:</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-slate-800 pl-4">
            {dataAnomalies.map((item, idx) => (
              <div key={item.id} className="flex items-baseline gap-2">
                <span className="text-slate-400 font-bold">{String(idx + 1).padStart(2, '0')}</span>
                <span className="font-bold text-slate-900 font-sans">{item.type}:</span>
                <span className="text-rose-700 font-medium font-sans truncate max-w-sm">{item.originalText}</span>
                <span className="text-slate-400 font-sans text-[11px] shrink-0">({item.location})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Detailed Audit */}
      {isExpanded && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Detailed Data Anomalies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Chi tiết các điểm mâu thuẫn số liệu
            </h3>

            {dataAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="p-4 rounded-xl border border-rose-200 bg-white shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    {anomaly.type}
                  </span>
                  <span className="font-semibold text-slate-600">{anomaly.location}</span>
                </div>

                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Nội dung đối chiếu</span>
                    <strong className="text-slate-900">{anomaly.originalText}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Phân tích sai lệch</span>
                    <p className="text-rose-700 font-medium">{anomaly.analysis}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>Khuyến nghị khắc phục:</strong> {anomaly.actionNeeded}
                </p>
              </div>
            ))}
          </div>

          {/* Logic Gaps */}
          {logicGaps.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                Chuỗi suy luận đứt gãy
              </h3>

              {logicGaps.map((gap) => (
                <div
                  key={gap.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs"
                >
                  <div className="font-bold text-slate-900">
                    {gap.stepName}: {gap.gapDescription}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {gap.missingLinkAnalysis}
                  </p>
                  <div className="text-[11px] text-indigo-700 font-medium">
                    Hướng xử lý: {gap.correctionGuidance}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
