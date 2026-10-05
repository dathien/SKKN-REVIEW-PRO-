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
  BookOpen,
  Info
} from 'lucide-react';
import { NoveltyAnalysis, NoveltyLevel } from '../../types';

interface NoveltyMapViewProps {
  novelty: NoveltyAnalysis;
  skknTitle: string;
}

export const NoveltyMapView: React.FC<NoveltyMapViewProps> = ({
  novelty,
  skknTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // 4 Mức độ chuẩn mực theo PHẦN 15 (Tuyệt đối không dùng "100% mới" hay "Chưa ai từng làm")
  const getNoveltyTier = (level: NoveltyLevel) => {
    switch (level) {
      case 'chua_phat_hien_tuong_dong':
        return {
          icon: '🟢',
          title: 'Chưa phát hiện tương đồng cao',
          badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          desc: 'Trong phạm vi nguồn đã kiểm tra, chưa phát hiện giải pháp có cấu trúc hoàn toàn tương đồng.'
        };
      case 'tuong_tu_mot_so':
        return {
          icon: '🟡',
          title: 'Có một số hướng tương tự',
          badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
          desc: 'Có điểm tương tự về mục tiêu hoặc công cụ, nhưng có thể làm rõ nét mới ở quy trình sư phạm cụ thể.'
        };
      case 'tuong_dong_dang_ke':
        return {
          icon: '🟠',
          title: 'Tương đồng đáng kể',
          badgeCls: 'bg-orange-100 text-orange-800 border-orange-300',
          desc: 'Nhiều điểm tương đồng về biện pháp triển khai trong các đề tài trước; cần định vị lại trọng tâm sáng tạo.'
        };
      case 'nguy_co_trung_lap_cao':
      default:
        return {
          icon: '🔴',
          title: 'Cần xem xét kỹ tính mới',
          badgeCls: 'bg-rose-100 text-rose-800 border-rose-300',
          desc: 'Cần kiểm tra kỹ để tránh trùng lặp ý tưởng với các nghiên cứu và sáng kiến đã công bố.'
        };
    }
  };

  const currentTier = getNoveltyTier(novelty.overallLevel);
  const comparisonList = novelty.comparisonItems || [];

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${currentTier.badgeCls}`}>
                {currentTier.icon} {currentTier.title}
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              TÍNH MỚI CỦA SÁNG KIẾN
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đối sánh khoa học theo 7 khía cạnh trọng yếu để làm rõ tính cải tiến sư phạm thực chất.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem đối chiếu 7 khía cạnh →'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Status Strip */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentTier.icon}</span>
            <div>
              <span className="font-bold text-slate-900 block">
                {currentTier.title} ({comparisonList.length} khía cạnh đã đối soát)
              </span>
              <span className="text-slate-600 text-[11px] leading-relaxed">
                {currentTier.desc}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-medium italic sm:text-right">
            * Không tuyên bố "Chưa ai từng làm" hay "100% mới".
          </div>
        </div>
      </div>

      {/* Expanded Novelty Map & Matrix (chỉ xuất hiện khi click) */}
      {isExpanded && (
        <div className="space-y-4">
          
          {/* Detailed Conclusion & Scope Checked (Section 15) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Nhận định chi tiết về tính mới
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {novelty.overallConclusion}
            </p>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                <strong>Phạm vi nguồn đã kiểm tra:</strong> {novelty.scopeChecked}
              </span>
            </div>
          </div>

          {/* Search Keywords */}
          {novelty.searchKeywords && novelty.searchKeywords.length > 0 && (
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
          )}

          {/* PHẦN 15: BẢNG ĐỐI SÁNH THEO 7 KHÍA CẠNH */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Bảng đối sánh tính mới theo các khía cạnh nghiên cứu
              </h3>
              <span className="text-[11px] text-slate-400">
                (Vấn đề, Đối tượng, Giải pháp, Cách triển khai, Minh chứng, Kết quả, Điểm khác biệt)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold w-36">Khía cạnh</th>
                    <th className="py-2.5 px-3 font-semibold">SKKN này</th>
                    <th className="py-2.5 px-3 font-semibold">Tài liệu đã có</th>
                    <th className="py-2.5 px-3 font-semibold">Điểm khác biệt / Cải tiến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {comparisonList.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-slate-900 align-top">
                        {item.aspect}
                      </td>
                      <td className="py-3 px-3 leading-relaxed text-indigo-950 font-medium align-top">
                        {item.thisInitiative}
                      </td>
                      <td className="py-3 px-3 leading-relaxed text-slate-600 align-top">
                        {item.benchmarkDocA}
                      </td>
                      <td className="py-3 px-3 leading-relaxed text-slate-800 align-top">
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
