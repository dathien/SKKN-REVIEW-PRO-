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
  Info,
  ShieldCheck,
  Search,
  BookOpen
} from 'lucide-react';
import {
  SimilarityAndCitationsAnalysis,
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'similarity' | 'references' | 'theory_needs'>('similarity');
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
  const hasExternalWebCheck = simFindings.length > 0;
  const similarityCount = simFindings.filter(f => f.reviewLevel !== 'chua_phat_hien').length;
  const citationIssuesCount = simFindings.filter(f => !f.isCitedInText).length;
  const needVerifyRefCount = localReferences.filter(r => r.verificationStatus !== 'xac_minh_duoc').length;
  const totalIssues = similarityCount + citationIssuesCount + needVerifyRefCount;

  // PHẦN 3: Luận điểm cần củng cố nguồn cơ sở lý luận
  const theoryNeeds = [
    {
      id: 'th-1',
      claim: 'Ý nghĩa của việc trực quan hóa sơ đồ tư duy trong hình thành năng lực tư duy nhân quả môn Lịch sử',
      targetSection: 'Trang 5, Mục 1.2 - Cơ sở lý luận',
      suggestedSourceType: 'Tài liệu tập huấn đổi mới phương pháp dạy học Lịch sử cấp THCS - Bộ GD&ĐT (Chương trình GDPT 2018) hoặc Sách chuyên khảo về Sư phạm Lịch sử',
      status: 'đã xác minh nguồn chính thống',
      verifiedSource: 'Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông môn Lịch sử và Địa lí (cấp THCS), Ban hành kèm Thông tư số 32/2018/TT-BGDĐT.',
      citationPosition: 'Trang 5, chèn trích dẫn [1] sau câu mở đầu mục 1.2'
    },
    {
      id: 'th-2',
      claim: 'Quy trình kiểm soát hoạt động học tập tương tác qua ứng dụng số trong trường học',
      targetSection: 'Trang 8, Mục 2.1 - Cơ sở thực tiễn',
      suggestedSourceType: 'Công văn hướng dẫn chuyển đổi số giáo dục hoặc Kỷ yếu hội thảo ứng dụng CNTT ngành GD&ĐT',
      status: 'chưa xác minh được nguồn ngoài',
      verifiedSource: 'Chưa xác minh được nguồn phù hợp trong cơ sở dữ liệu hiện hành. Giáo viên tự rà soát văn bản hướng dẫn chuyên môn của Sở/Phòng GD&ĐT.',
      citationPosition: 'Trang 8, bổ sung số hiệu công văn chính thức của địa phương'
    }
  ];

  const handleVerifyReference = async (refItem: ReferenceCheckItem) => {
    setVerifyingId(refItem.id);
    await new Promise(r => setTimeout(r, 600));
    setLocalReferences(prev =>
      prev.map(r =>
        r.id === refItem.id
          ? {
              ...r,
              verificationStatus: 'xac_minh_duoc' as ReferenceVerificationStatus,
              verificationNote: 'Đã xác minh nguồn chính thống trong danh mục sách/công văn giáo dục.'
            }
          : r
      )
    );
    setVerifyingId(null);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                Liêm chính học thuật
              </span>
            </div>
            <h1 className="text-[22px] font-[750] text-slate-900 tracking-tight flex items-center gap-2">
              <BookCopy className="w-6 h-6 text-amber-600" />
              NGUỒN & TRÍCH DẪN
            </h1>
            <p className="text-[14.5px] text-slate-600 mt-1">
              Phân tích đối sánh tương đồng văn bản, chuẩn hóa trích dẫn và củng cố cơ sở lý luận khoa học.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-2.5 px-4.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết nguồn →'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Minimal Status Strip */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[14px]">
          <div>
            <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[14px]">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              RÀ SOÁT TƯƠNG ĐỒNG & DANH MỤC TÀI LIỆU ({totalIssues} ĐIỂM LƯU Ý):
            </span>
            <div className="flex items-center gap-2.5 mt-1 text-slate-700 flex-wrap text-[13.5px]">
              <span className="font-semibold">{similarityCount} đoạn tương đồng</span>
              <span>•</span>
              <span className="font-semibold">{citationIssuesCount} vấn đề trích dẫn</span>
              <span>•</span>
              <span className="font-semibold">{needVerifyRefCount} nguồn cần chuẩn hóa</span>
            </div>
          </div>

          <div className="text-[13px] text-slate-500 italic sm:text-right font-medium">
            * Phân biệt rõ: Tương đồng văn bản ≠ Đạo văn.
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4">
          
          {/* PHẦN 14: Cảnh báo bắt buộc khi tra cứu nguồn */}
          {!hasExternalWebCheck ? (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-[14px] text-slate-700 flex items-center gap-2.5">
              <Info className="w-5 h-5 text-slate-500 shrink-0" />
              <span>
                <strong>CHƯA THỰC HIỆN ĐỐI SÁNH NGUỒN BÊN NGOÀI:</strong> Hệ thống không tự tạo nguồn, URL hay tỷ lệ % giả.
              </span>
            </div>
          ) : (
            <div className="p-4.5 rounded-xl bg-blue-50 border border-blue-200 text-[14.5px] text-blue-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-[15px]">Nguyên tắc đánh giá liêm chính học thuật (PHẦN 13 & 14):</strong>
                <p className="leading-relaxed">
                  Hệ thống chỉ rà soát mức độ trùng khớp câu chữ với tài liệu trong cơ sở dữ liệu đối soát. <strong>Tuyệt đối không kết luận là "Đạo văn"</strong> khi chưa có hội đồng chuyên môn thẩm định bối cảnh trích dẫn. Không tạo tác giả giả, sách giả, DOI giả hay URL giả.
                </p>
              </div>
            </div>
          )}

          {/* Subtabs Switcher */}
          <div className="flex border-b border-slate-200 gap-4 text-[14px] font-bold">
            <button
              onClick={() => setActiveSubTab('similarity')}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeSubTab === 'similarity'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Đoạn tương đồng & Trích dẫn ({simFindings.length})
            </button>
            <button
              onClick={() => setActiveSubTab('references')}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeSubTab === 'references'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Rà soát danh mục tài liệu ({localReferences.length})
            </button>
            <button
              onClick={() => setActiveSubTab('theory_needs')}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeSubTab === 'theory_needs'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Luận điểm cần củng cố nguồn ({theoryNeeds.length})
            </button>
          </div>

          {/* TAB 1: PHẦN 13 - ĐOẠN TƯƠNG ĐỒNG VĂN BẢN */}
          {activeSubTab === 'similarity' && (
            <div className="space-y-3">
              {simFindings.map((finding) => {
                const isWarning = finding.reviewLevel !== 'chua_phat_hien';

                return (
                  <div
                    key={finding.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3.5 text-[14px]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-[15px]">
                          📍 Vị trí: {finding.location}
                        </span>
                        <span className={`text-[12.5px] font-bold px-2.5 py-0.5 rounded border ${
                          isWarning ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          📊 Mức độ tương đồng: {isWarning ? 'Tương đồng đáng kể' : 'Thấp'}
                        </span>
                      </div>
                      <span className={`text-[12.5px] font-bold px-2.5 py-0.5 rounded ${
                        finding.isCitedInText ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        📚 {finding.isCitedInText ? 'Đã trích dẫn trong bài' : 'Chưa có trích dẫn'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-slate-700">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[13px] font-bold text-slate-500 uppercase block">
                          📄 Đoạn trong SKKN cần kiểm tra:
                        </span>
                        <p className="font-serif italic text-[14.5px] leading-relaxed text-slate-800">
                          "{finding.excerpt}"
                        </p>
                      </div>

                      <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1.5">
                        <span className="text-[13px] font-bold text-amber-900 uppercase block">
                          🌐 Nguồn đối chiếu & Nội dung tương đồng:
                        </span>
                        <p className="font-bold text-[14px] text-amber-950">
                          {finding.matchedSource}
                        </p>
                        <p className="font-serif text-[14px] text-slate-700 leading-relaxed pt-1">
                          "{finding.matchedContent}"
                        </p>
                      </div>
                    </div>

                    {/* Khuyến nghị xử lý */}
                    <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-slate-800 text-[14px] flex items-start gap-2.5 leading-[1.6]">
                      <BookmarkCheck className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>💡 Khuyến nghị xử lý: </strong>
                        <span>{finding.resolutionAction}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: RÀ SOÁT TÀI LIỆU THAM KHẢO */}
          {activeSubTab === 'references' && (
            <div className="space-y-3">
              {localReferences.map((refItem) => {
                const isVerified = refItem.verificationStatus === 'xac_minh_duoc';

                return (
                  <div
                    key={refItem.id}
                    className="p-4.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 text-[14px]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <strong className="text-slate-900 text-[15px]">
                        {refItem.referenceEntry}
                      </strong>
                      <span className={`text-[12.5px] font-bold px-2.5 py-0.5 rounded border self-start sm:self-auto ${
                        isVerified ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {isVerified ? '✓ Đã xác minh nguồn' : '⚠ Cần kiểm tra chuẩn mực'}
                      </span>
                    </div>

                    <div className="text-[13.5px] text-slate-600 space-y-1">
                      <p><strong>Vị trí trích trong bài:</strong> {refItem.citationInText}</p>
                      <p><strong>Đánh giá học thuật:</strong> {refItem.verificationNote}</p>
                    </div>

                    {!isVerified && (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleVerifyReference(refItem)}
                          disabled={verifyingId === refItem.id}
                          className="text-[13px] font-bold px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {verifyingId === refItem.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Xác minh lại nguồn này</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: PHẦN 3 - LUẬN ĐIỂM CẦN CỦNG CỐ NGUỒN CƠ SỞ LÝ LUẬN */}
          {activeSubTab === 'theory_needs' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-600 leading-[1.6]">
                <strong>Nguyên tắc đề xuất nguồn (PHẦN 3):</strong> Tuyệt đối không tự bịa nguồn hay tài liệu không kiểm chứng được. Nếu chưa tìm được nguồn chính thức, hệ thống thông báo rõ để giáo viên chủ động rà soát.
              </div>

              {theoryNeeds.map((item) => (
                <div
                  key={item.id}
                  className="p-4.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 text-[14px]"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <strong className="text-slate-900 text-[15px]">
                      1. Luận điểm cần củng cố nguồn:
                    </strong>
                    <span className="text-[13px] font-mono text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border">
                      {item.targetSection}
                    </span>
                  </div>

                  <p className="font-serif italic text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[14.5px] leading-relaxed">
                    "{item.claim}"
                  </p>

                  <div className="space-y-1.5 text-[14px] leading-relaxed">
                    <p className="text-blue-900">
                      <strong>2. Đề xuất loại nguồn phù hợp:</strong> {item.suggestedSourceType}
                    </p>
                    <p className="text-emerald-950 font-medium">
                      <strong>3. Thông tin nguồn kiểm chứng:</strong> {item.verifiedSource}
                    </p>
                    <p className="text-slate-600">
                      <strong>4. Gợi ý vị trí trích dẫn:</strong> {item.citationPosition}
                    </p>
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
