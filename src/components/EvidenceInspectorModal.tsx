import React, { useState } from 'react';
import {
  X,
  Search,
  AlertTriangle,
  Lightbulb,
  FileText,
  Copy,
  Check,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { RubricCriterion, RedTeamCard, SuggestionRewrite } from '../types';

export type InspectorMode = 'basis' | 'deduction' | 'how_to_fix';

interface EvidenceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: InspectorMode;
  criterion?: RubricCriterion | null;
  redTeamCard?: RedTeamCard | null;
  onSelectSuggestion?: (suggestion: SuggestionRewrite) => void;
}

/**
 * Chuẩn hóa ngôn ngữ đánh giá - Chống tiên đoán tuyệt đối hành vi Hội đồng
 * (Quy tắc H: Thay 'Hội đồng chắc chắn sẽ/sẽ ngay lập tức...' bằng ngôn ngữ đánh giá sư phạm)
 */
function sanitizeEvaluationText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/Hội đồng cấp quận\/thành phố sẽ ngay lập tức bác bỏ/gi, 'Tuyên bố này có nguy cơ bị đánh giá chưa thuyết phục về')
    .replace(/sẽ ngay lập tức bác bỏ/gi, 'có nguy cơ bị đánh giá chưa thuyết phục về')
    .replace(/Hội đồng chắc chắn sẽ/gi, 'Có nguy cơ bị đánh giá')
    .replace(/chắc chắn sẽ bác bỏ/gi, 'có nguy cơ bị đánh giá chưa đạt')
    .replace(/Hội đồng sẽ bác bỏ/gi, 'Có thể bị đánh giá chưa đạt yêu cầu')
    .replace(/sẽ bác bỏ/gi, 'có nguy cơ bị đánh giá chưa đạt')
    .replace(/Hội đồng chắc chắn không chấp nhận/gi, 'Chưa đủ căn cứ để Hội đồng công nhận')
    .replace(/chắc chắn không chấp nhận/gi, 'chưa đủ căn cứ để được công nhận')
    .replace(/Hội đồng sẽ đặt nghi vấn/gi, 'Có nguy cơ bị đặt nghi vấn')
    .replace(/Minh chứng còn thiếu \(Hội đồng sẽ chất vấn\)/gi, 'Minh chứng cần làm rõ:');
}

/**
 * Kiểm tra xem vấn đề có liên quan tới tuyên bố tính mới chưa xác nhận hay không
 * (Quy tắc L: Khi chưa biết điểm mới thực sự, cần hỏi tác giả thay vì tự bịa quy trình/đối chứng)
 */
function isNoveltyVerificationNeeded(card?: RedTeamCard | null, crit?: RubricCriterion | null): boolean {
  if (card) {
    if (card.affectedCriterion?.toLowerCase().includes('tính mới') || card.issueDetected?.toLowerCase().includes('tính mới')) {
      return true;
    }
  }
  if (crit) {
    if (crit.criterionName?.toLowerCase().includes('tính mới')) {
      return true;
    }
  }
  return false;
}

/**
 * Chuẩn hóa câu hỏi phản biện: Không tự bịa đối chứng không có trong hồ sơ
 * (Quy tắc M & K: Loại bỏ đối chứng giả định như 'trên giấy A4', 'mindmap có sẵn trên mạng' nếu chưa có trong hồ sơ)
 */
function sanitizeCouncilQuestion(q?: string): string {
  if (!q) return '';
  if (q.includes('giấy A4') || q.includes('mindmap có sẵn trên mạng')) {
    return 'Điểm khác biệt cốt lõi của cách tổ chức này so với phương pháp Thầy/Cô đã sử dụng trước đây là gì?';
  }
  return q;
}

export const EvidenceInspectorModal: React.FC<EvidenceInspectorModalProps> = ({
  isOpen,
  onClose,
  mode,
  criterion,
  redTeamCard
}) => {
  const [activeTab, setActiveTab] = useState<InspectorMode>(mode);
  const [copied, setCopied] = useState(false);

  // Sync activeTab if prop changes
  React.useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  if (!isOpen || (!criterion && !redTeamCard)) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = criterion
    ? criterion.criterionName
    : `Thẻ phản biện: ${redTeamCard?.id} - ${redTeamCard?.issueDetected}`;

  const location = criterion?.basisLocation || redTeamCard?.location || 'Không xác định rõ trang';
  const quote = criterion?.shortQuote || redTeamCard?.relatedQuote || '';

  const rawDeductionReason = criterion?.deductionReason || redTeamCard?.whyItMatters || 'Hạn chế về tính mới hoặc thiếu minh chứng đối chứng.';
  const deductionReason = sanitizeEvaluationText(rawDeductionReason);

  const limitations = criterion?.limitations || redTeamCard?.issueDetected || '';

  const rawMissingEvidence = criterion?.missingEvidence || redTeamCard?.requiredEvidence || 'Cần bổ sung phiếu khảo sát mẫu, biên bản dự giờ hoặc dữ liệu thô.';
  const missingEvidence = sanitizeEvaluationText(rawMissingEvidence);

  const rawImprovementGuidance = criterion?.improvementGuidance || redTeamCard?.resolutionGuidance || '';
  const improvementGuidance = sanitizeEvaluationText(rawImprovementGuidance);

  const rawCouncilQuestion = redTeamCard?.likelyCouncilQuestion || '';
  const councilQuestion = sanitizeCouncilQuestion(rawCouncilQuestion);

  const showAuthorNoveltyCheck = isNoveltyVerificationNeeded(redTeamCard, criterion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[760px] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
      >
        
        {/* Header (Section C.1 & C.2) */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              activeTab === 'basis' 
                ? 'bg-blue-100 text-blue-700' 
                : activeTab === 'deduction' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {activeTab === 'basis' && <Search className="w-5 h-5" />}
              {activeTab === 'deduction' && <AlertTriangle className="w-5 h-5" />}
              {activeTab === 'how_to_fix' && <Lightbulb className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.03em] leading-[1.4] block">
                TRUY VẾT & GIẢI TRÌNH
              </span>
              <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-[1.4] line-clamp-2 mt-0.5">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher (Section C.3: 13px, font 600, active font 700) */}
        <div className="flex border-b border-slate-200 bg-white px-5 sm:px-6 gap-2 text-[13px] leading-[1.4] pt-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basis')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'basis'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>XEM CĂN CỨ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deduction')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'deduction'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>TẠI SAO BỊ TRỪ ĐIỂM?</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('how_to_fix')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'how_to_fix'
                ? 'border-emerald-600 text-emerald-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>SỬA THẾ NÀO?</span>
          </button>
        </div>

        {/* Body (Section C.4, C.5, C.6, C.7 & D: Card padding 14-16px, spacing 14-16px, body 14px, line-height 1.65) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* ================================================================= */}
          {/* TAB 1: XEM CĂN CỨ (FACT SAFETY)                                  */}
          {/* ================================================================= */}
          {activeTab === 'basis' && (
            <div className="space-y-4">
              
              {/* Vị trí truy vết trong tài liệu */}
              <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-blue-950 text-[14px] font-bold leading-[1.45] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Vị trí truy vết trong tài liệu:</span>
                </span>
                <span className="px-3 py-1 bg-white rounded-lg border border-blue-200 text-[14px] font-semibold text-blue-800 self-start sm:self-auto shadow-2xs">
                  📍 {location}
                </span>
              </div>

              {/* Đoạn trích dẫn nguyên văn trong SKKN làm căn cứ */}
              <div className="space-y-2">
                <h4 className="text-[14px] font-bold text-slate-900 leading-[1.45]">
                  Đoạn trích dẫn nguyên văn trong SKKN làm căn cứ:
                </h4>
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-[1.65] italic text-[14px] font-normal relative group">
                  "{quote || 'Không có đoạn trích dẫn cụ thể.'}"
                  {quote && (
                    <button
                      type="button"
                      onClick={() => handleCopy(quote)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-2xs transition-colors cursor-pointer"
                      title="Sao chép đoạn trích"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Căn cứ phản biện của hội đồng */}
              {redTeamCard && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-[14px] font-bold text-slate-900 leading-[1.45]">
                    Căn cứ phản biện của hội đồng:
                  </h4>
                  <p className="text-[14px] font-normal text-slate-800 leading-[1.65]">
                    {redTeamCard.criticismBasis}
                  </p>
                </div>
              )}

              {/* Chi tiết theo tiêu chí Rubric (nếu mở từ Rubric) */}
              {criterion && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <h4 className="text-[14px] font-bold text-emerald-950 leading-[1.45]">
                      ✓ Điểm mạnh ghi nhận được:
                    </h4>
                    <p className="text-[14px] font-normal text-slate-800 leading-[1.65]">
                      {criterion.strengths || 'Chưa ghi nhận điểm mạnh nổi bật trong mục này.'}
                    </p>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <h4 className="text-[14px] font-bold text-amber-950 leading-[1.45]">
                      Minh chứng hiện có trong hồ sơ:
                    </h4>
                    <p className="text-[14px] font-normal text-slate-800 leading-[1.65]">
                      {criterion.existingEvidence || 'Chưa phát hiện minh chứng cụ thể đính kèm.'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: TẠI SAO BỊ TRỪ ĐIỂM?                                       */}
          {/* ================================================================= */}
          {activeTab === 'deduction' && (
            <div className="space-y-4">
              
              {/* Lý do chưa đạt điểm tối đa (Section C.7: 14px, bold 700, content 14px regular 1.65) */}
              <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <h4 className="text-[14px] font-bold text-rose-900 leading-[1.45] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Lý do chưa đạt điểm tối đa:</span>
                </h4>
                <p className="text-[14px] font-normal text-rose-950 leading-[1.65]">
                  {deductionReason}
                </p>
              </div>

              {/* Chi tiết hạn chế phát hiện */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-[14px] font-bold text-slate-900 leading-[1.45]">
                  Chi tiết hạn chế phát hiện:
                </h4>
                <p className="text-[14px] font-normal text-slate-800 leading-[1.65]">
                  {limitations}
                </p>
              </div>

              {/* Minh chứng cần làm rõ (Section I: Đổi từ 'Minh chứng còn thiếu (Hội đồng sẽ chất vấn)') */}
              <div className="p-3.5 sm:p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <h4 className="text-[14px] font-bold text-amber-950 leading-[1.45] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Minh chứng cần làm rõ:</span>
                </h4>
                <p className="text-[14px] font-normal text-amber-950 leading-[1.65]">
                  {missingEvidence}
                </p>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: SỬA THẾ NÀO? (FACT SAFETY & HƯỚNG DẪN)                    */}
          {/* ================================================================= */}
          {activeTab === 'how_to_fix' && (
            <div className="space-y-4">
              
              {/* Hướng xử lý & cách cải thiện cụ thể */}
              <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <h4 className="text-[14px] font-bold text-emerald-950 leading-[1.45] flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Hướng xử lý & cách cải thiện cụ thể:</span>
                </h4>
                <p className="text-[14px] font-normal text-emerald-950 leading-[1.65]">
                  {improvementGuidance || 'Rà soát và củng cố lại lập luận dựa trên căn cứ thực tiễn đã thực hiện.'}
                </p>
              </div>

              {/* Hộp xác minh Fact-Safety khi cần tác giả xác nhận điểm mới (Section L & N) */}
              {showAuthorNoveltyCheck && (
                <div className="p-3.5 sm:p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-950">
                    <span className="px-2 py-0.5 bg-amber-200/90 rounded text-[12px] font-bold uppercase tracking-wider text-amber-900 border border-amber-300">
                      ⚠ CẦN TÁC GIẢ XÁC NHẬN
                    </span>
                  </div>
                  <p className="text-[14px] font-normal text-amber-950 leading-[1.65]">
                    Để làm rõ tính mới, Thầy/Cô vui lòng cho biết <strong>điểm khác biệt thực sự của giải pháp</strong> so với cách đã áp dụng trước đây.
                  </p>
                  
                  <div className="bg-white/80 p-3 rounded-lg border border-amber-200 text-[13px] leading-[1.6] text-slate-800 space-y-1">
                    <p className="font-bold text-slate-900">Các câu hỏi gợi mở định hướng (không phải dữ kiện thực tế):</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                      <li>Quy trình tổ chức có điểm gì khác?</li>
                      <li>Cách học sinh sử dụng công cụ có gì khác?</li>
                      <li>Vai trò của giáo viên có gì khác?</li>
                      <li>Sản phẩm học tập của học sinh có gì khác?</li>
                      <li>Cách thức kiểm tra, đánh giá có gì khác?</li>
                      <li>Việc kết hợp các công cụ có tạo ra quy trình sư phạm riêng hay không?</li>
                    </ul>
                    <p className="text-[12px] text-slate-500 italic pt-1 border-t border-amber-100">
                      * Nguyên tắc Fact-Safety: AI chỉ định hướng các góc nhìn, tuyệt đối không tự bịa quy trình hay đặt tên giải pháp thay tác giả khi chưa có dữ liệu hồ sơ.
                    </p>
                  </div>
                </div>
              )}

              {/* Vị trí nên bổ sung trong văn bản */}
              {redTeamCard?.insertLocation && (
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-[14px] font-bold text-slate-900 leading-[1.45]">
                    Vị trí nên bổ sung trong văn bản:
                  </h4>
                  <p className="text-[14px] font-normal text-slate-800 leading-[1.65]">
                    {redTeamCard.insertLocation}
                  </p>
                </div>
              )}

              {/* Câu hỏi có thể dùng khi phản biện (Section C.4 & M) */}
              {councilQuestion && (
                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-[14px] font-bold text-slate-900 leading-[1.45] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Câu hỏi có thể dùng khi phản biện:</span>
                  </h4>
                  <p className="text-[14px] font-normal text-slate-800 italic leading-[1.65]">
                    "{councilQuestion}"
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer (Section C.8: 12px italic footnote, stable button) */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[12px] text-slate-500 italic leading-[1.5]">
            * Nguyên tắc: Không tự tạo số liệu giả, không tự tạo minh chứng.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 sm:px-5 sm:py-2 text-[13px] sm:text-[14px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
