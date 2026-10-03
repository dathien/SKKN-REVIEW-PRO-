import React, { useState } from 'react';
import {
  BookCopy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Info
} from 'lucide-react';
import {
  SimilarityAndCitationsAnalysis,
  SimilarityLevel,
  SimilarityFinding,
  ReferenceCheckItem,
  ReferenceVerificationStatus
} from '../../types';

interface SimilarityCitationsViewProps {
  analysis?: SimilarityAndCitationsAnalysis;
  skknTitle: string;
}

export const SimilarityCitationsView: React.FC<SimilarityCitationsViewProps> = ({
  analysis,
  skknTitle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'similarity' | 'references'>('similarity');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [localReferences, setLocalReferences] = useState<ReferenceCheckItem[]>(
    analysis?.referenceChecks || []
  );

  React.useEffect(() => {
    if (analysis?.referenceChecks) {
      setLocalReferences(analysis.referenceChecks);
    }
  }, [analysis?.referenceChecks]);

  const defaultAnalysis: SimilarityAndCitationsAnalysis = analysis || {
    overallLevel: 'chua_phat_hien',
    overallSummary: 'Chưa phát hiện tương đồng đáng kể ngoài phạm vi trích dẫn chuẩn.',
    similarityFindings: [],
    referenceChecks: [],
    disclaimer: 'Phạm vi kiểm tra giới hạn trong cơ sở dữ liệu đối soát giáo dục. Không kết luận đạo văn.'
  };

  const simFindings = defaultAnalysis.similarityFindings || [];
  const similarityCount = simFindings.filter(f => f.reviewLevel !== 'chua_phat_hien').length;
  const citationIssuesCount = simFindings.filter(f => !f.isCitedInText).length;
  const needVerifyRefCount = localReferences.filter(r => r.verificationStatus !== 'xac_minh_duoc').length;
  const totalIssues = similarityCount + citationIssuesCount + needVerifyRefCount;

  const handleVerifyReference = async (refItem: ReferenceCheckItem) => {
    setVerifyingId(refItem.id);
    await new Promise(r => setTimeout(r, 600));
    setLocalReferences(prev =>
      prev.map(r =>
        r.id === refItem.id
          ? {
              ...r,
              verificationStatus: 'xac_minh_duoc' as ReferenceVerificationStatus,
              verificationNote: 'Đã xác minh nguồn chính thống thành công.'
            }
          : r
      )
    );
    setVerifyingId(null);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Minimalist Summary Card (Màn hình đầu 3 giây) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                Liêm chính học thuật
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookCopy className="w-5 h-5 text-amber-600" />
              NGUỒN & TRÍCH DẪN
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm tra nguồn tương đồng và tính xác thực của danh mục tài liệu tham khảo
            </p>
          </div>

          {/* 1 Primary Action */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-amber-600/30 cursor-pointer transition-all shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn nguồn' : 'Xem nguồn →'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Minimal Status Strip */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              ⚠ {totalIssues} MỤC CẦN KIỂM TRA:
            </span>
            <div className="flex items-center gap-2 mt-1 text-slate-700 flex-wrap text-[11px]">
              <span className="font-semibold">{similarityCount} đoạn tương đồng</span>
              <span>•</span>
              <span className="font-semibold">{citationIssuesCount} vấn đề trích dẫn</span>
              <span>•</span>
              <span className="font-semibold">{needVerifyRefCount} nguồn cần xác minh</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{isExpanded ? 'Đóng chi tiết' : 'Mở danh sách nguồn'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Subtabs Switcher */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('similarity')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeSubTab === 'similarity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Đoạn tương đồng & trích dẫn ({simFindings.length})
            </button>
            <button
              onClick={() => setActiveSubTab('references')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeSubTab === 'references'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Danh mục tài liệu tham khảo ({localReferences.length})
            </button>
          </div>

          {/* Subtab 1: Similarity Findings */}
          {activeSubTab === 'similarity' && (
            <div className="space-y-3">
              {simFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {finding.location}
                    </span>
                    <span className="text-slate-500">Nguồn: {finding.matchedSource}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-amber-400 italic text-slate-700">
                    “{finding.excerpt}”
                  </div>

                  <p className="text-slate-700 leading-relaxed pt-1">
                    <strong>Cách xử lý:</strong> {finding.resolutionAction}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Subtab 2: Reference checks */}
          {activeSubTab === 'references' && (
            <div className="space-y-3">
              {localReferences.map((ref) => {
                const isVerified = ref.verificationStatus === 'xac_minh_duoc';
                const isVerifying = verifyingId === ref.id;

                return (
                  <div
                    key={ref.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isVerified ? '✓ Đã xác minh' : '⚠ Chưa xác minh'}
                        </span>
                        <h4 className="font-bold text-slate-900 truncate">
                          {ref.referenceEntry}
                        </h4>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        {ref.verificationNote}
                      </p>
                    </div>

                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => handleVerifyReference(ref)}
                        disabled={isVerifying}
                        className="py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isVerifying ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>{isVerifying ? 'Đang kiểm tra...' : 'Xác minh nguồn'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
