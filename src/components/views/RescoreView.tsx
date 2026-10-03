import React, { useState } from 'react';
import {
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { RescoreComparison, SKKNAnalysisResult } from '../../types';
import { ActiveTab } from '../Sidebar';

interface RescoreViewProps {
  analysis: SKKNAnalysisResult;
  onRescore: (revisedNotes: string) => Promise<void>;
  isRescoring?: boolean;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const RescoreView: React.FC<RescoreViewProps> = ({
  analysis,
  onRescore,
  isRescoring,
  onNavigateTab
}) => {
  const [revisedText, setRevisedText] = useState('');
  const history = analysis.rescoreHistory;

  const currentScore = analysis.rubricCriteria.reduce((sum, c) => sum + c.proposedScore, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedText.trim()) return;
    await onRescore(revisedText);
  };

  const loadSampleRevision = () => {
    setRevisedText(`BẢN ĐIỀU CHỈNH VÀ GIẢI TRÌNH CỦA TÁC GIẢ SAU KHI TIẾP THU PHẢN BIỆN:

1. ĐÃ SỬA MÂU THUẪN SỐ LIỆU (BẢNG 2):
- Đính chính và thống nhất cỡ mẫu N=82 xuyên suốt văn bản.
- Bổ sung chú thích tại chân Bảng 2: "Phát ra 85 phiếu khảo sát, thu về 85 phiếu, trong đó có 82 phiếu hợp lệ được đưa vào xử lý dữ liệu (loại 3 phiếu do để trống nhiều mục)". Đã đính kèm ảnh chụp 3 phiếu bị loại vào Phụ lục 1.

2. ĐÃ ĐỊNH VỊ LẠI TÍNH MỚI (MỤC 3.1):
- Xóa bỏ hoàn toàn câu tuyên bố: "đây là phương pháp hoàn toàn mới mẻ chưa từng có ai áp dụng trước đây".
- Viết lại theo hướng làm rõ "Quy trình 3 bước trực quan hóa dữ kiện lịch sử theo trục thời gian nhân - quả", nhấn mạnh vào việc học sinh tự lập sơ đồ tư duy phân tầng thay vì chỉ sử dụng phần mềm Canva có sẵn.

3. ĐÃ ĐÍNH CHÍNH THUẬT NGỮ THỐNG KÊ:
- Thay cụm từ "tăng 25%" thành: "Tỷ lệ học sinh đạt điểm Giỏi tăng 15 điểm phần trăm (từ 60% lên 75%, tương đương tốc độ tăng trưởng 25% so với đầu năm)".

4. BỔ SUNG MINH CHỨNG KHÁCH QUAN CHO KẾT LUẬN "HỌC SINH CHỦ ĐỘNG":
- Đính kèm Phụ lục 3: Bảng tổng hợp Rubric quan sát hành vi trong 4 tiết dạy (số lượt phát biểu trung bình tăng 2.3 lượt/tiết) có chữ ký xác nhận của Tổ phó chuyên môn.

5. CHUẨN HÓA DANH MỤC TÀI LIỆU THAM KHẢO:
- Xóa link Wikipedia và mục "Phần mềm Canva". Thay thế bằng 2 tài liệu tập huấn đổi mới phương pháp dạy học Lịch sử của Bộ GD&ĐT.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-teal-950">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thẩm định lại sau chỉnh sửa</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            CHẤM LẠI SAU KHI TÁC GIẢ CHỈNH SỬA
          </h1>
          <p className="text-xs text-teal-100/80 leading-relaxed">
            Hệ thống đối chiếu: <strong>Bản trước ↔ Bản sau</strong>. Điểm số chỉ được phục hồi hoặc nâng lên khi tác giả thực sự bổ sung minh chứng hợp lệ hoặc đính chính số liệu mâu thuẫn. Không tăng điểm chỉ vì văn phong được trau chuốt hơn.
          </p>
        </div>
      </div>

      {/* Strict Scoring Rule Note */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-blue-950 mb-0.5">
            NGUYÊN TẮC THAY ĐỔI ĐIỂM CHẤM LẠI:
          </strong>
          <span>
            Chỉ thay đổi điểm khi có căn cứ minh chứng và dữ liệu xác thực mới. Nếu tác giả chỉ sửa đổi câu chữ cho hay hơn mà chưa đưa ra minh chứng hoặc bảng số liệu đính chính, điểm số sẽ giữ nguyên.
          </span>
        </div>
      </div>

      {/* Input Form for Revision */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              Nộp nội dung bản SKKN đã chỉnh sửa hoặc bản giải trình:
            </h3>
            <p className="text-xs text-slate-500">
              Dán nội dung các phần đã sửa, các minh chứng mới bổ sung hoặc văn bản giải trình
            </p>
          </div>

          <button
            type="button"
            onClick={loadSampleRevision}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
          >
            Dán mẫu giải trình hoàn chỉnh
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={revisedText}
            onChange={(e) => setRevisedText(e.target.value)}
            placeholder="Dán các đoạn đã sửa, số liệu đã đính chính và danh mục minh chứng mới bổ sung vào đây..."
            rows={8}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Điểm hiện tại: <strong>{currentScore.toFixed(1)} / 100đ</strong>
            </span>
            <button
              type="submit"
              disabled={isRescoring || !revisedText.trim()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isRescoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang thẩm định lại căn cứ & chấm lại...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Bắt đầu chấm lại & đối chiếu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results Card (If rescore history exists) */}
      {history && (
        <div className="bg-white rounded-2xl border border-teal-300 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                Kết quả đối chiếu thẩm định lại
              </span>
              <h3 className="text-base font-bold text-slate-900">
                So sánh bản trước ↔ bản sau
              </h3>
            </div>

            {/* Score Comparison Display */}
            <div className="flex items-center gap-4 bg-teal-50 p-3 rounded-xl border border-teal-200">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Điểm trước</span>
                <span className="text-lg font-bold text-slate-700">{history.previousScore.toFixed(1)}đ</span>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <div className="text-center">
                <span className="text-[10px] text-teal-700 uppercase block font-semibold">Điểm sau</span>
                <span className="text-xl font-black text-teal-800">{history.newScore.toFixed(1)}đ</span>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs">
                {history.scoreDifference >= 0 ? `+${history.scoreDifference.toFixed(1)}đ` : `${history.scoreDifference.toFixed(1)}đ`}
              </div>
            </div>
          </div>

          {/* Justification statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 block">
              Giải trình căn cứ thay đổi điểm số:
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {history.justificationForChange}
            </p>
          </div>

          {/* 2-Columns: Fixed vs Remaining Issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Fixed issues */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Vấn đề đã khắc phục triệt để ({history.fixedIssues.length}):
              </span>
              <ul className="space-y-1 text-slate-700">
                {history.fixedIssues.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Remaining issues */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Vấn đề còn tồn tại cần hoàn thiện ({history.remainingIssues.length}):
              </span>
              <ul className="space-y-1 text-slate-700">
                {history.remainingIssues.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* New evidence and figures added */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-2">
            <span className="font-bold text-blue-900 block">
              Minh chứng & Số liệu mới được ghi nhận bổ sung:
            </span>
            <div className="flex flex-wrap gap-2">
              {history.newEvidenceAdded?.map((ev, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-white border border-blue-200 text-blue-900 font-medium">
                  📁 {ev}
                </span>
              ))}
              {history.newFiguresAdded?.map((fig, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-white border border-blue-200 text-blue-900 font-medium">
                  📊 {fig}
                </span>
              ))}
            </div>
          </div>

          {/* CTA Chuyển sang Báo cáo */}
          {onNavigateTab && (
            <div className="pt-2 border-t border-teal-200 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('report')}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>XEM & XUẤT BÁO CÁO TOÀN DIỆN →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
