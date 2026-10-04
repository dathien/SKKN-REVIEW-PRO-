import React, { useState, useRef } from 'react';
import {
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Sparkles,
  Info,
  Upload,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RescoreComparison, SKKNAnalysisResult, IssueComparisonItem, UpdatedCriterionItem } from '../../types';
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
  const [inputMode, setInputMode] = useState<'paste' | 'file'>('paste');
  const [revisedText, setRevisedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = analysis.rescoreHistory;
  const currentScore = analysis.rubricCriteria.reduce((sum, c) => sum + c.proposedScore, 0);
  const totalIssues = analysis.redTeamCards.length;
  const resolvedCount = analysis.redTeamCards.filter(c => c.status === 'Đã xử lý' || c.status === 'resolved').length;
  const remainingCount = totalIssues - resolvedCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedText.trim()) return;
    await onRescore(revisedText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRevisedText(text);
      }
    };
    reader.readAsText(file);
  };

  const loadSampleRevision = () => {
    setRevisedText(`BẢN ĐIỀU CHỈNH VÀ GIẢI TRÌNH CỦA TÁC GIẢ SAU KHI TIẾP THU PHẢN BIỆN:

1. ĐÃ SỬA MÂU THUẪN SỐ LIỆU (BẢNG 2):
- Bản gốc: Ghi 85 học sinh nhưng tổng cột chi tiết chỉ có 82 em (42 + 28 + 12).
- Bản mới: Đính chính và thống nhất cỡ mẫu N=82 xuyên suốt văn bản.
- Bổ sung chú thích tại chân Bảng 2: "Phát ra 85 phiếu khảo sát, thu về 85 phiếu, trong đó có 82 phiếu hợp lệ được đưa vào xử lý dữ liệu (loại 3 phiếu do để trống nhiều mục)". Đã đính kèm ảnh chụp 3 phiếu bị loại vào Phụ lục 1.

2. ĐÃ ĐỊNH VỊ LẠI TÍNH MỚI (MỤC 3.1):
- Bản gốc: Tuyên bố "đây là phương pháp hoàn toàn mới mẻ chưa từng có ai áp dụng trước đây".
- Bản mới: "Qua phạm vi tài liệu đã khảo sát, chưa phát hiện giải pháp có cấu trúc hoàn toàn tương đồng... Sáng kiến xây dựng Quy trình 3 bước trực quan hóa dữ kiện lịch sử theo trục thời gian nhân - quả, tập trung vào năng lực tự lập sơ đồ tư duy của học sinh."

3. ĐÃ ĐÍNH CHÍNH THUẬT NGỮ THỐNG KÊ (MỤC 4.1):
- Bản gốc: Tuyên bố "tăng 25% học sinh giỏi".
- Bản mới: "Tỷ lệ học sinh đạt điểm Giỏi tăng 15 điểm phần trăm (từ 60% lên 75%, tương đương tốc độ tăng trưởng 25% so với đầu năm)."

4. BỔ SUNG MINH CHỨNG KHÁCH QUAN CHO KẾT LUẬN "HỌC SINH CHỦ ĐỘNG" (MỤC 4.2):
- Đính kèm Phụ lục 3: Bảng tổng hợp Rubric quan sát hành vi trong 4 tiết thực nghiệm (số lượt phát biểu trung bình tăng 2.3 lượt/tiết) có chữ ký xác nhận của Tổ phó chuyên môn.

5. CHUẨN HÓA DANH MỤC TÀI LIỆU THAM KHẢO (TRANG 31):
- Loại bỏ link Wikipedia và mục "Phần mềm Canva". Thay thế bằng 2 tài liệu tập huấn đổi mới phương pháp dạy học Lịch sử của Bộ GD&ĐT theo chuẩn TCVN.`);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-teal-950">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thẩm định lại sau chỉnh sửa • Không phải nút tự tăng điểm</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            CHẤM LẠI SAU CHỈNH SỬA
          </h1>
          <p className="text-xs text-teal-100/80 leading-relaxed">
            Hệ thống đối chiếu thực chất: <strong>BẢN GỐC ↔ BẢN ĐÃ SỬA</strong>. Điểm số chỉ thay đổi khi NỘI DUNG / MINH CHỨNG / SỐ LIỆU / LOGIC thực sự thay đổi theo hướng đáp ứng Rubric. Tuyệt đối không tự động tăng điểm chỉ vì vấn đề đã được đánh dấu là "Đã xử lý".
          </p>
        </div>
      </div>

      {/* Progress & Verification Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm shrink-0">
            {resolvedCount}/{totalIssues}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Tiến độ xử lý phản biện:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                remainingCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {remainingCount === 0 ? 'Đã xử lý tất cả ✓' : `Còn ${remainingCount} vấn đề`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Đã đánh dấu xử lý: <strong>{resolvedCount}</strong> / {totalIssues} vấn đề phản biện
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 sm:text-right">
          <span className="block text-[11px] text-slate-400">Điểm đánh giá trước đó:</span>
          <span className="text-base font-black text-slate-900">
            {currentScore.toFixed(1)} / 100đ
          </span>
        </div>
      </div>

      {/* Strict Integrity Warning: Resolved status is NOT content change */}
      {resolvedCount > 0 && !revisedText && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold text-amber-950">
              CẢNH BÁO QUAN TRỌNG VỀ ĐỐI CHIẾU THỰC CHẤT:
            </strong>
            <p className="leading-relaxed">
              Các vấn đề đã được đánh dấu xử lý ({resolvedCount}/{totalIssues} vấn đề), nhưng hệ thống chưa phát hiện phiên bản SKKN mới. Hệ thống tuyệt đối không dùng trạng thái "Đã xử lý" làm bằng chứng rằng nội dung đã thay đổi. Thầy/Cô vui lòng dán hoặc tải nội dung SKKN đã chỉnh sửa bên dưới để tiến hành thẩm định lại.
            </p>
          </div>
        </div>
      )}

      {/* Input Mode Selector & Submission Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Cung cấp phiên bản SKKN sau chỉnh sửa:
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  inputMode === 'paste' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dán nội dung đã sửa
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  inputMode === 'file' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tải bản đã sửa (.docx/.txt)
              </button>
            </div>

            <button
              type="button"
              onClick={loadSampleRevision}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
            >
              Dán mẫu giải trình
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {inputMode === 'file' ? (
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-3">
              <Upload className="w-8 h-8 text-teal-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {uploadedFileName ? `Đã chọn: ${uploadedFileName}` : 'Chọn file SKKN đã chỉnh sửa'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hỗ trợ định dạng .txt, .docx, .pdf hoặc bản thảo đã cập nhật
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.doc,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                {uploadedFileName ? 'Chọn file khác' : 'Chọn tệp từ máy tính'}
              </button>
            </div>
          ) : (
            <textarea
              value={revisedText}
              onChange={(e) => setRevisedText(e.target.value)}
              placeholder="Dán các đoạn văn đã sửa, bảng số liệu đã đính chính, hoặc văn bản giải trình chi tiết vào đây..."
              rows={8}
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono leading-relaxed text-slate-800"
            />
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 italic">
              * Điểm chỉ thay đổi khi nội dung thực sự đáp ứng các tiêu chí của phiếu chấm Rubric.
            </span>
            <button
              type="submit"
              disabled={isRescoring || !revisedText.trim()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isRescoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang đối chiếu trước/sau & chạy lại Rubric...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Bắt đầu chấm lại & đối chiếu phiên bản</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results Card (If rescore history exists) */}
      {history && (
        <div className="bg-white rounded-2xl border border-teal-300 p-6 shadow-sm space-y-6">
          {/* Header & Overall Score Change */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                Kết quả đối chiếu thẩm định lại
              </span>
              <h3 className="text-base font-bold text-slate-900">
                So sánh bản trước ↔ bản sau & Chấm Rubric mới
              </h3>
            </div>

            {/* Score Comparison Display */}
            <div className="flex items-center gap-4 bg-teal-50 p-3 rounded-xl border border-teal-200 self-start sm:self-auto">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Điểm trước</span>
                <span className="text-lg font-bold text-slate-700">{history.previousScore.toFixed(1)}đ</span>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <div className="text-center">
                <span className="text-[10px] text-teal-700 uppercase block font-semibold">Điểm sau</span>
                <span className="text-xl font-black text-teal-800">{history.newScore.toFixed(1)}đ</span>
              </div>
              <div className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                history.scoreDifference > 0
                  ? 'bg-emerald-600 text-white'
                  : history.scoreDifference < 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {history.scoreDifference > 0 ? `+${history.scoreDifference.toFixed(1)}đ` : `${history.scoreDifference.toFixed(1)}đ`}
              </div>
            </div>
          </div>

          {/* Justification statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 block">
              Căn cứ khoa học giải trình việc thay đổi điểm số:
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {history.justificationForChange}
            </p>
          </div>

          {/* SECTION VI & VII: Thẻ So Sánh Từng Vấn Đề (Original vs Revised) */}
          {history.issueComparisons && history.issueComparisons.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>VI. ĐỐI CHIẾU VỊ TRÍ LIÊN QUAN ISSUES (BẢN GỐC vs BẢN ĐÃ SỬA)</span>
              </h4>
              <div className="space-y-3">
                {history.issueComparisons.map((item, idx) => {
                  const statusStyle = 
                    item.status === 'ĐÃ KHẮC PHỤC'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : item.status === 'CẢI THIỆN MỘT PHẦN'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : item.status === 'CHƯA KHẮC PHỤC'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : item.status === 'PHÁT SINH MÂU THUẪN MỚI'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300';

                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <strong className="text-slate-900 text-xs font-bold">
                          {idx + 1}. {item.issueTitle}
                        </strong>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border self-start sm:self-auto ${statusStyle}`}>
                          ● {item.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Bản gốc:
                          </span>
                          <p className="font-mono text-slate-700 italic text-[11px] leading-relaxed">
                            "{item.originalQuote}"
                          </p>
                        </div>
                        <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 space-y-1">
                          <span className="text-[10px] font-bold text-teal-800 uppercase block">
                            Bản mới đã sửa:
                          </span>
                          <p className="font-mono text-teal-950 font-medium text-[11px] leading-relaxed">
                            "{item.revisedQuote}"
                          </p>
                        </div>
                      </div>

                      {item.explanation && (
                        <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                          <strong>Đánh giá thực chất:</strong> {item.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION VIII & IX: Rubric Điểm Từng Tiêu Chí + 4 Câu Hỏi Giải Trình */}
          {history.updatedCriteria && history.updatedCriteria.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                VIII. CHI TIẾT THAY ĐỔI ĐIỂM TỪNG TIÊU CHÍ RUBRIC
              </h4>
              <div className="space-y-3 text-xs">
                {history.updatedCriteria.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900">
                        {idx + 1}. {c.criterionName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">{c.previousScore.toFixed(1)}đ</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-teal-800">{c.newScore.toFixed(1)}đ</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.changeDifference > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.changeDifference < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.changeDifference > 0 ? `+${c.changeDifference.toFixed(1)}đ` : `${c.changeDifference.toFixed(1)}đ`}
                        </span>
                      </div>
                    </div>

                    {/* 4 Câu hỏi giải trình bắt buộc (Section IX) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] pt-1">
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <strong className="text-slate-800 block mb-0.5">1. Điều gì đã thay đổi?</strong>
                        <span className="text-slate-600">{c.whatChanged || 'Đã đính chính số liệu và hoàn thiện lập luận'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <strong className="text-slate-800 block mb-0.5">2. Minh chứng nằm ở đâu?</strong>
                        <span className="text-slate-600">{c.evidenceFoundAt || 'Tại các bảng biểu và phụ lục mới'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <strong className="text-slate-800 block mb-0.5">3. Vì sao thay đổi này ảnh hưởng điểm?</strong>
                        <span className="text-slate-600">{c.impactReason || 'Khắc phục điểm yếu phản biện và loại bỏ nguy cơ trừ điểm'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <strong className="text-slate-800 block mb-0.5">4. Tiêu chí Rubric nào được đáp ứng tốt hơn?</strong>
                        <span className="text-slate-600">{c.rubricMetReason || 'Đạt chuẩn yêu cầu của tiêu chuẩn chuyên môn'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2-Columns: Fixed vs Remaining Issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
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

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Vấn đề còn tồn tại cần lưu ý ({history.remainingIssues.length}):
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
          {(history.newEvidenceAdded?.length > 0 || history.newFiguresAdded?.length > 0) && (
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
          )}

          {/* CTA: Chuyển sang Báo cáo */}
          {onNavigateTab && (
            <div className="pt-2 border-t border-teal-200 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('report')}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>XEM & XUẤT BÁO CÁO TOÀN DIỆN (ĐÃ CẬP NHẬT KẾT QUẢ CHẤM LẠI) →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
