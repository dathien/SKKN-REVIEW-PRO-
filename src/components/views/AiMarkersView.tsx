import React, { useState } from 'react';
import {
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { AiMarkersAnalysis, AiMarkerFinding } from '../../types';

interface AiMarkersViewProps {
  aiMarkers?: AiMarkersAnalysis;
  skknTitle: string;
}

export const AiMarkersView: React.FC<AiMarkersViewProps> = ({
  aiMarkers,
  skknTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<AiMarkerFinding | null>(null);
  
  // Interactive "Không Humanize Mù Quáng" Form State (Section 12)
  const [selectedProofType, setSelectedProofType] = useState<string>('phiếu quan sát');
  const [teacherProofText, setTeacherProofText] = useState<string>('');
  const [customDraftResult, setCustomDraftResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const findings = aiMarkers?.findings || [];
  const findingsCount = findings.length;

  // Determine the 4-level scale (Section 11)
  const getReviewTier = (count: number) => {
    if (count === 0) return {
      level: 'it_dau_hieu',
      color: 'emerald',
      icon: '🟢',
      label: 'Ít dấu hiệu cần xem xét',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Văn phong tự nhiên, có dấu ấn sư phạm và bối cảnh lớp học thực tế.'
    };
    if (count <= 2) return {
      level: 'can_xem_xet',
      color: 'amber',
      icon: '🟡',
      label: 'Có một số đoạn cần rà soát',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Phát hiện một vài đoạn mang tính công thức khái quát, nên bổ sung chi tiết lớp học thực tế.'
    };
    if (count <= 4) return {
      level: 'nhieu_dau_hieu',
      color: 'orange',
      icon: '🟠',
      label: 'Nhiều đoạn cần biên tập',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'Nhiều đoạn diễn đạt quá trơn tru nhưng thiếu số liệu hoặc trích dẫn bối cảnh giảng dạy cụ thể.'
    };
    return {
      level: 'rat_nhieu',
      color: 'rose',
      icon: '🔴',
      label: 'Cần kiểm tra kỹ tính xác thực và giọng tác giả',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      description: 'Cần rà soát toàn diện để cá nhân hóa, tránh các khẳng định chung chung có thể áp dụng cho bất kỳ đề tài nào.'
    };
  };

  const reviewTier = getReviewTier(findingsCount);

  const proofOptions = [
    { id: 'phiếu quan sát', label: 'Phiếu quan sát / Biên bản dự giờ' },
    { id: 'số liệu', label: 'Số liệu / Tỷ lệ khảo sát thực tế' },
    { id: 'nhật ký lớp học', label: 'Nhật ký giảng dạy / Tình huống thực' },
    { id: 'sản phẩm học sinh', label: 'Sản phẩm học sinh (bài vẽ, bài tập)' },
    { id: 'nhận xét thực tế', label: 'Nhận xét trực tiếp của học sinh / tổ chuyên môn' }
  ];

  const handleSynthesizePersonalVoice = () => {
    if (!selectedFinding) return;
    const proofDetail = teacherProofText.trim() 
      ? teacherProofText.trim() 
      : `[Cung cấp thêm minh chứng: ${selectedProofType}]`;

    // Harmonize teacher experience with academic flow
    const synthesized = `Qua theo dõi thực tế và đối chiếu với ${selectedProofType} (${proofDetail}), nhận thấy học sinh có sự tiến bộ rõ rệt trong các giờ học Lịch sử: các em chủ động tương tác với sơ đồ tư duy hơn, hào hứng phát biểu xây dựng bài và nâng cao tỷ lệ hoàn thành sản phẩm đúng hạn.`;
    setCustomDraftResult(synthesized);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header Banner - PHẦN 9: BIÊN TẬP GIỌNG TÁC GIẢ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[13px] font-bold border uppercase tracking-wide ${reviewTier.badgeClass}`}>
                {reviewTier.icon} {reviewTier.label}
              </span>
            </div>
            <h1 className="text-[22px] font-[750] text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-600" />
              BIÊN TẬP GIỌNG TÁC GIẢ
            </h1>
            <p className="text-[14.5px] text-slate-600 mt-1">
              Phát hiện các đoạn cần giáo viên kiểm tra, cá nhân hóa và bổ sung căn cứ thực tế.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn danh sách' : `Rà soát ${findingsCount} đoạn →`}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* PHẦN 11: Thanh trạng thái 4 mức độ rõ ràng, không điểm AI giả */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[14px]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{reviewTier.icon}</span>
            <div>
              <span className="font-bold text-slate-900 text-[15px] block">
                {reviewTier.label} ({findingsCount} đoạn cần xem xét)
              </span>
              <span className="text-slate-600 text-[13.5px] leading-relaxed">
                {reviewTier.description}
              </span>
            </div>
          </div>

          <div className="text-[13px] text-slate-500 font-medium italic sm:text-right shrink-0">
            * Không quy chụp % AI hay coi perplexity là bằng chứng AI viết.
          </div>
        </div>
      </div>

      {/* Expanded Review Findings */}
      {isExpanded && (
        <div className="space-y-4">
          
          {/* Important Scientific Disclaimer */}
          <div className="p-4 sm:p-5 rounded-xl bg-blue-50 border border-blue-200 text-[14px] text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[14.5px]">Nguyên tắc biên tập khoa học:</strong>
              <p className="leading-relaxed">
                Hệ thống chỉ rà soát các đặc điểm ngôn ngữ như: câu văn khuôn mẫu, cấu trúc lặp lại, cách diễn đạt quá trơn tru nhưng thiếu dấu ấn lớp học thực tế. Mục tiêu là giúp giáo viên làm giàu văn bản bằng <strong>trải nghiệm thật</strong> và <strong>minh chứng thật</strong>, tuyệt đối không phục vụ mục đích "né AI detector".
              </p>
            </div>
          </div>

          {/* List of segments needing review */}
          <div className="space-y-4">
            {findings.map((item, idx) => {
              const isSelected = selectedFinding?.id === item.id;

              return (
                <div
                  key={item.id || idx}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 bg-white shadow-2xs space-y-3.5 ${
                    isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Location & Signs */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[13px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <strong className="text-[15px] font-bold text-slate-900">
                        📍 Vị trí: {item.location}
                      </strong>
                    </div>
                    <span className="text-[13px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 self-start sm:self-auto">
                      🔎 Dấu hiệu: {item.signsDetected}
                    </span>
                  </div>

                  {/* 📄 Đoạn văn cần xem xét */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[15px] font-serif italic text-slate-800 leading-[1.65]">
                    "{item.excerpt}"
                  </div>

                  {/* ❓ Vì sao cần xem xét & 💡 Cách cải thiện */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[14px]">
                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                      <strong className="text-amber-950 font-bold flex items-center gap-1.5 text-[14px]">
                        <HelpCircle className="w-4 h-4 text-amber-700" />
                        <span>❓ Vì sao cần xem xét:</span>
                      </strong>
                      <p className="text-slate-700 leading-relaxed text-[13.5px]">
                        {item.basis}
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                      <strong className="text-emerald-950 font-bold flex items-center gap-1.5 text-[14px]">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>💡 Cách cải thiện giọng tác giả:</span>
                      </strong>
                      <p className="text-slate-700 leading-relaxed text-[13.5px]">
                        {item.suggestedHandling}
                      </p>
                    </div>
                  </div>

                  {/* PHẦN 12: Nút mở hộp thoại Cá nhân hóa & Bổ sung minh chứng thật */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-[13.5px] text-slate-500">
                      Hướng dẫn: {item.verificationGuide || 'Bổ sung chi tiết thực tế của học sinh đơn vị'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedFinding(null);
                          setCustomDraftResult(null);
                        } else {
                          setSelectedFinding(item);
                          setTeacherProofText('');
                          setCustomDraftResult(null);
                        }
                      }}
                      className="text-[13.5px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <span>{isSelected ? 'Đóng hộp thoại bổ sung' : 'Bổ sung minh chứng thực tế →'}</span>
                    </button>
                  </div>

                  {/* PHẦN 12: Interactive Form - KHÔNG HUMANIZE MÙ QUÁNG */}
                  {isSelected && (
                    <div className="mt-3 p-4 sm:p-5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <h4 className="text-[14.5px] font-bold text-indigo-950 flex items-center gap-1.5">
                          <FileCheck className="w-4.5 h-4.5 text-indigo-700" />
                          <span>Hỏi giáo viên: Nhận định này dựa trên minh chứng thực tế nào?</span>
                        </h4>
                        <p className="text-[13.5px] text-indigo-900/80 leading-relaxed">
                          Thay vì chỉ đổi từ ngữ mù quáng, hãy cung cấp thông tin thực tế từ tiết học của Thầy/Cô để hệ thống hỗ trợ biên tập thành câu văn tự nhiên và có sức thuyết phục cao nhất.
                        </p>
                      </div>

                      {/* Loại minh chứng */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {proofOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedProofType(opt.id)}
                            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                              selectedProofType === opt.id
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Input chi tiết minh chứng */}
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={teacherProofText}
                          onChange={(e) => setTeacherProofText(e.target.value)}
                          placeholder="Ví dụ: Lớp 8A1 trong 4 tiết dự giờ tháng 10/2023, tỷ lệ phát biểu tăng từ 6 lên 16 lượt..."
                          className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleSynthesizePersonalVoice}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Biên tập lại theo trải nghiệm thật</span>
                        </button>
                      </div>

                      {/* Kết quả sau khi kết hợp trải nghiệm thật */}
                      {customDraftResult && (
                        <div className="p-4 bg-white rounded-xl border border-indigo-200 text-[14px] space-y-2">
                          <div className="flex items-center justify-between text-[13px] font-bold text-emerald-800 border-b border-slate-100 pb-2">
                            <span>✍️ Đoạn văn đã được hòa nhập giọng tác giả & minh chứng thật:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(customDraftResult)}
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copied ? 'Đã sao chép!' : 'Sao chép đoạn'}</span>
                            </button>
                          </div>
                          <p className="font-serif leading-[1.65] text-slate-800 text-[15px]">
                            {customDraftResult}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
