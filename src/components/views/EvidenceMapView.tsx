import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { EvidenceChainItem, EvidenceStatus } from '../../types';

interface EvidenceMapViewProps {
  chain: EvidenceChainItem[];
}

export const EvidenceMapView: React.FC<EvidenceMapViewProps> = ({ chain }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);

  const counts = {
    total: chain.length,
    valid: chain.filter(c => c.status === 'co_minh_chung').length,
    weak: chain.filter(c => c.status === 'minh_chung_chua_manh').length,
    indirect: chain.filter(c => c.status === 'minh_chung_gian_tiep').length,
    missing: chain.filter(c => c.status === 'chua_tim_thay_minh_chung').length,
  };

  const displayedChain = filterMissingOnly
    ? chain.filter(c => c.status === 'chua_tim_thay_minh_chung' || c.status === 'minh_chung_chua_manh')
    : chain;

  const handleOpenMissing = () => {
    setFilterMissingOnly(true);
    setIsExpanded(true);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Minimalist Summary Card (Màn hình đầu) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                Chuỗi minh chứng
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              MINH CHỨNG & CĂN CỨ THỰC NGHIỆM
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm tra mọi luận điểm đề xuất đều có số liệu và tài liệu chứng minh đi kèm
            </p>
          </div>

          {/* 1 Primary Action */}
          <button
            type="button"
            onClick={handleOpenMissing}
            className="py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-amber-600/30 cursor-pointer transition-all shrink-0"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Xem minh chứng thiếu →</span>
          </button>
        </div>

        {/* Minimal status row */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              ✓ {counts.valid} luận điểm đã có căn cứ
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-rose-700 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              ⚠ {counts.missing} luận điểm còn thiếu
            </span>
            {counts.weak > 0 && (
              <>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <span className="text-amber-700 font-medium">
                  {counts.weak} minh chứng chưa mạnh
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setFilterMissingOnly(false);
              setIsExpanded(!isExpanded);
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem toàn bộ chuỗi minh chứng →'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Evidence Chain (chỉ xuất hiện khi click) */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              {filterMissingOnly ? 'Các luận điểm cần bổ sung căn cứ' : 'Tất cả luận điểm trong SKKN'} ({displayedChain.length})
            </span>
            {filterMissingOnly && (
              <button
                onClick={() => setFilterMissingOnly(false)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Hiển thị tất cả ({chain.length})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {displayedChain.map((item) => {
              const isMissing = item.status === 'chua_tim_thay_minh_chung';
              const isValid = item.status === 'co_minh_chung';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border bg-white shadow-2xs space-y-2 ${
                    isMissing ? 'border-rose-300 bg-rose-50/20' : isValid ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isMissing ? 'bg-rose-100 text-rose-800' : isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isValid ? '🟢 Đầy đủ' : isMissing ? '🔴 Thiếu minh chứng' : '🟡 Cần bổ sung'}
                      </span>
                      <span className="font-semibold text-slate-700">{item.location}</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {item.claim}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Minh chứng hiện có
                      </span>
                      <span className="text-slate-700">{item.existingEvidenceDetails || 'Chưa tìm thấy minh chứng trực tiếp'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Khuyến nghị bổ sung
                      </span>
                      <span className="text-slate-700">{item.recommendation}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
