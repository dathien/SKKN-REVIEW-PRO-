import React, { useState } from 'react';
import {
  X,
  Search,
  AlertTriangle,
  Lightbulb,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  BookOpen
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

export const EvidenceInspectorModal: React.FC<EvidenceInspectorModalProps> = ({
  isOpen,
  onClose,
  mode,
  criterion,
  redTeamCard,
  onSelectSuggestion
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
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
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Truy vết & Giải trình
              </span>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 text-xs font-semibold pt-2">
          <button
            onClick={() => setActiveTab('basis')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'basis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            XEM CĂN CỨ
          </button>
          <button
            onClick={() => setActiveTab('deduction')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'deduction'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            TẠI SAO BỊ TRỪ ĐIỂM?
          </button>
          <button
            onClick={() => setActiveTab('how_to_fix')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'how_to_fix'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            SỬA THẾ NÀO?
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* TAB 1: XEM CĂN CỨ */}
          {activeTab === 'basis' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
                <span className="text-blue-900 font-semibold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Vị trí truy vết trong tài liệu:
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-blue-200 font-bold text-blue-800">
                  {location}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Đoạn trích dẫn nguyên văn trong SKKN làm căn cứ:
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 leading-relaxed italic relative group">
                  "{quote}"
                  <button
                    onClick={() => handleCopy(quote)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-2xs"
                    title="Sao chép đoạn trích"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {criterion && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="font-bold text-emerald-900 block mb-1">
                      ✓ Điểm mạnh ghi nhận được:
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {criterion.strengths || 'Chưa ghi nhận điểm mạnh nổi bật.'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="font-bold text-amber-900 block mb-1">
                      Minh chứng hiện có trong hồ sơ:
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {criterion.existingEvidence || 'Chưa phát hiện minh chứng cụ thể đính kèm.'}
                    </p>
                  </div>
                </div>
              )}

              {redTeamCard && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    Căn cứ phản biện của hội đồng:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {redTeamCard.criticismBasis}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TẠI SAO BỊ TRỪ ĐIỂM? */}
          {activeTab === 'deduction' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <span className="font-bold text-rose-900 flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Lý do chưa đạt điểm tối đa:
                </span>
                <p className="text-rose-950 font-medium leading-relaxed">
                  {criterion?.deductionReason || redTeamCard?.whyItMatters || 'Hạn chế về tính mới hoặc thiếu minh chứng đối chứng.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">
                  Chi tiết hạn chế phát hiện:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {criterion?.limitations || redTeamCard?.issueDetected}
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Minh chứng còn thiếu (Hội đồng sẽ chất vấn):
                </span>
                <p className="text-amber-950 leading-relaxed font-medium">
                  {criterion?.missingEvidence || redTeamCard?.requiredEvidence || 'Cần bổ sung phiếu khảo sát mẫu, biên bản dự giờ hoặc dữ liệu thô.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SỬA THẾ NÀO? */}
          {activeTab === 'how_to_fix' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                  <Lightbulb className="w-4 h-4 text-emerald-700" />
                  Hướng xử lý & cách cải thiện cụ thể:
                </span>
                <p className="text-emerald-950 leading-relaxed font-medium">
                  {criterion?.improvementGuidance || redTeamCard?.resolutionGuidance}
                </p>
              </div>

              {redTeamCard && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Vị trí nên bổ sung trong văn bản:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {redTeamCard.insertLocation || 'Sau đoạn phân tích kết quả.'}
                  </p>
                </div>
              )}

              {redTeamCard?.likelyCouncilQuestion && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-900 block">
                    ❓ Câu hỏi hội đồng có thể sẽ hỏi khi bảo vệ:
                  </span>
                  <p className="text-amber-950 italic leading-relaxed">
                    "{redTeamCard.likelyCouncilQuestion}"
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 italic">
            * Nguyên tắc: Không tự tạo số liệu giả, không tự tạo minh chứng.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
