import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { NoveltyAnalysis } from '../../types';

interface NoveltyMapViewProps {
  novelty: NoveltyAnalysis;
  skknTitle: string;
}

export const NoveltyMapView: React.FC<NoveltyMapViewProps> = ({
  novelty,
  skknTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClear = novelty.overallLevel === 'chua_phat_hien_tuong_dong';
  const comparisonList = novelty.comparisonItems || [];
  const similarSourcesCount = comparisonList.length;

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Minimalist Summary Card (Màn hình đầu 3 giây) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wide">
                Độ độc lập ý tưởng
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              TÍNH MỚI CỦA SÁNG KIẾN
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm tra mức độ khác biệt và phân biệt giữa công nghệ hỗ trợ với sáng tạo giải pháp
            </p>
          </div>

          {/* 1 Primary Action */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 cursor-pointer transition-all shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn đối chiếu' : 'Xem đối chiếu →'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Status Strip: 🟡 CẦN LÀM RÕ · 3 nguồn tương tự */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          isClear ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{isClear ? '🟢' : '🟡'}</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                {isClear ? 'KHẢ QUAN – CHƯA PHÁT HIỆN TƯƠNG ĐỒNG CAO' : 'CẦN LÀM RÕ NÉT CẢI TIẾN'}
              </span>
              <span className="text-xs text-slate-600">
                {similarSourcesCount} tài liệu/nguồn có giải pháp tương tự trong cơ sở dữ liệu
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{isExpanded ? 'Đóng bảng ma trận' : 'Mở bảng đối chiếu'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Novelty Map & Matrix (chỉ xuất hiện khi click) */}
      {isExpanded && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Detailed Conclusion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Nhận định chi tiết về tính mới
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {novelty.overallConclusion}
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              <strong>Phạm vi rà soát:</strong> {novelty.scopeChecked}
            </div>
          </div>

          {/* Search Keywords */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Từ khóa đối sánh học thuật
            </h3>
            <div className="flex flex-wrap gap-2">
              {novelty.searchKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200"
                >
                  🔍 {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Novelty Comparison Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Bảng ma trận đối sánh tính mới
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold">Khía cạnh so sánh</th>
                    <th className="py-2.5 px-3 font-semibold">SKKN này</th>
                    <th className="py-2.5 px-3 font-semibold">Tài liệu đối sánh</th>
                    <th className="py-2.5 px-3 font-semibold">Phân tích điểm khác biệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {comparisonList.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-[150px]">
                        {item.aspect}
                      </td>
                      <td className="py-3 px-3 max-w-[180px] leading-relaxed text-indigo-900 font-medium">
                        {item.thisInitiative}
                      </td>
                      <td className="py-3 px-3 max-w-[180px] leading-relaxed text-slate-600">
                        {item.benchmarkDocA}
                      </td>
                      <td className="py-3 px-3 max-w-[220px] leading-relaxed text-slate-700">
                        {item.differenceAnalysis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
