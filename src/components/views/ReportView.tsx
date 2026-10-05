import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Award,
  ShieldAlert,
  Sparkles,
  Layers,
  Calculator,
  MessageSquareWarning,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { SKKNAnalysisResult } from '../../types';

interface ReportViewProps {
  analysis: SKKNAnalysisResult;
}

export const ReportView: React.FC<ReportViewProps> = ({ analysis }) => {
  const [copied, setCopied] = useState(false);
  const {
    metadata,
    rubricCriteria,
    redTeamCards,
    novelty,
    evidenceChain,
    dataAnomalies,
    logicGaps,
    suggestions,
    councilQuestions,
    rescoreHistory
  } = analysis;

  const totalProposed = rubricCriteria.reduce((sum, c) => sum + c.proposedScore, 0);
  const totalMax = rubricCriteria.reduce((sum, c) => sum + c.maxScore, 0);
  const totalIssues = redTeamCards.length;
  const resolvedIssues = redTeamCards.filter(c => c.status === 'Đã xử lý' || c.status === 'resolved').length;
  const inProgressIssues = redTeamCards.filter(c => c.status === 'Đang xử lý' || c.status === 'in_progress').length;
  const openIssues = redTeamCards.filter(c => c.status === 'Chưa xử lý' || c.status === 'open' || !c.status).length;
  const ignoredIssues = redTeamCards.filter(c => c.status === 'Bỏ qua' || c.status === 'ignored' || c.status === 'Tác giả không đồng ý').length;

  // Group suggestions / issues by priority tier
  const mustFixItems = redTeamCards.filter(c => c.impactLevel === 'Cao');
  const shouldFixItems = redTeamCards.filter(c => c.impactLevel === 'Trung bình');
  const optimizeItems = redTeamCards.filter(c => c.impactLevel === 'Thấp');

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = `
# BÁO CÁO THẨM ĐỊNH & ĐÁNH GIÁ SÁNG KIẾN KINH NGHIỆM GIÁO DỤC
**Hệ thống:** SKKN REVIEW PRO
**Khẩu hiệu:** Chấm có căn cứ – Phản biện có chiều sâu – Sửa đúng điểm yếu.

---

## 1. THÔNG TIN HỒ SƠ SÁNG KIẾN
- **Tên sáng kiến:** ${metadata.title}
- **Tác giả:** ${metadata.author || 'Chưa cung cấp'}
- **Đơn vị công tác:** ${metadata.organization || 'Chưa cung cấp'}
- **Môn học / Lĩnh vực:** ${metadata.subject || metadata.field || 'Giáo dục'}
- **Cấp học / Đối tượng:** ${metadata.gradeLevel || ''} - ${metadata.targetAudience || ''}
- **Thời gian áp dụng:** ${metadata.applicationTimeframe || ''}
- **Phiếu chấm áp dụng:** ${metadata.appliedRubricName} (${metadata.isOfficialRubric ? 'Phiếu chấm chính thức của cơ sở' : 'Rubric chuẩn'})

## 2. KẾT QUẢ CHẤM ĐÁNH GIÁ CHUNG
- **Tổng điểm ban đầu:** ${totalProposed.toFixed(1)} / ${totalMax} điểm (${((totalProposed / totalMax) * 100).toFixed(1)}%)
- **Mức độ đầy đủ căn cứ:** ${metadata.evidenceAdequacy}
- **Giải trình căn cứ:** ${metadata.evidenceAdequacyReason}

## 3. ĐIỂM CHI TIẾT THEO RUBRIC
${rubricCriteria.map((c, i) => `### Tiêu chí ${i + 1}: ${c.criterionName}
- **Điểm:** ${c.proposedScore.toFixed(1)} / ${c.maxScore}đ
- **Vị trí căn cứ:** ${c.basisLocation}
- **Trích dẫn:** "${c.shortQuote}"
- **Điểm mạnh:** ${c.strengths}
- **Hạn chế:** ${c.limitations}
- **Minh chứng hiện có:** ${c.existingEvidence}
- **Minh chứng còn thiếu:** ${c.missingEvidence}
- **Lý do chưa đạt điểm tối đa:** ${c.deductionReason}
- **Hướng cải thiện:** ${c.improvementGuidance}
`).join('\n')}

## 4. ĐIỂM MẠNH GHI NHẬN
${rubricCriteria.map(c => `- **${c.criterionName}:** ${c.strengths}`).join('\n')}

## 5. CÁC VẤN ĐỀ PHÁT HIỆN TỪ HỘI ĐỒNG PHẢN BIỆN (RED TEAM)
${redTeamCards.map((c) => `- [${c.id}] (${c.impactLevel}) tại ${c.location}: ${c.issueDetected}
  + Căn cứ phản biện: ${c.criticismBasis}
  + Hướng xử lý: ${c.resolutionGuidance}
  + Minh chứng cần bổ sung: ${c.requiredEvidence}
`).join('\n')}

## 6. GỢI Ý SỬA & HOÀN THIỆN
### 🔴 PHẢI SỬA TRƯỚC KHI NỘP (${mustFixItems.length} vấn đề):
${mustFixItems.map(c => `- [${c.id}] ${c.issueDetected} (Tại: ${c.location})\n  * Hướng sửa: ${c.resolutionGuidance}`).join('\n')}

### 🟠 NÊN SỬA (${shouldFixItems.length} vấn đề):
${shouldFixItems.map(c => `- [${c.id}] ${c.issueDetected} (Tại: ${c.location})\n  * Hướng sửa: ${c.resolutionGuidance}`).join('\n')}

### 🟡 TỐI ƯU THÊM (${optimizeItems.length} vấn đề):
${optimizeItems.map(c => `- [${c.id}] ${c.issueDetected} (Tại: ${c.location})\n  * Hướng sửa: ${c.resolutionGuidance}`).join('\n')}

## 7. TÌNH TRẠNG XỬ LÝ CÁC VẤN ĐỀ
- **Tổng số vấn đề:** ${totalIssues}
- **Đã xử lý:** ${resolvedIssues}
- **Đang xử lý:** ${inProgressIssues}
- **Chưa xử lý:** ${openIssues}
- **Bỏ qua:** ${ignoredIssues}

${rescoreHistory ? `## 8. KẾT QUẢ CHẤM LẠI SAU CHỈNH SỬA
- **Điểm trước:** ${rescoreHistory.previousScore.toFixed(1)}đ ➔ **Điểm sau:** ${rescoreHistory.newScore.toFixed(1)}đ (${rescoreHistory.scoreDifference >= 0 ? '+' : ''}${rescoreHistory.scoreDifference.toFixed(1)}đ)
- **Căn cứ thay đổi điểm:** ${rescoreHistory.justificationForChange}
- **Vấn đề đã khắc phục triệt để:** ${rescoreHistory.fixedIssues.join(', ')}
- **Minh chứng mới ghi nhận:** ${rescoreHistory.newEvidenceAdded?.join(', ') || 'Không'}

${rescoreHistory.issueComparisons && rescoreHistory.issueComparisons.length > 0 ? `### ĐỐI CHIẾU VỊ TRÍ LIÊN QUAN ISSUES (BẢN GỐC vs BẢN ĐÃ SỬA)
${rescoreHistory.issueComparisons.map((c, i) => `#### ${i + 1}. ${c.issueTitle} [${c.status}]
- **Bản gốc:** "${c.originalQuote}"
- **Bản mới đã sửa:** "${c.revisedQuote}"
- **Đánh giá thực chất:** ${c.explanation}
`).join('\n')}` : ''}

${rescoreHistory.updatedCriteria && rescoreHistory.updatedCriteria.length > 0 ? `### CHI TIẾT THAY ĐỔI ĐIỂM TIÊU CHÍ RUBRIC
${rescoreHistory.updatedCriteria.map((uc, i) => `#### ${i + 1}. ${uc.criterionName}: ${uc.previousScore.toFixed(1)}đ ➔ ${uc.newScore.toFixed(1)}đ (${uc.changeDifference >= 0 ? '+' : ''}${uc.changeDifference.toFixed(1)}đ)
1. Điều gì đã thay đổi: ${uc.whatChanged}
2. Minh chứng nằm ở đâu: ${uc.evidenceFoundAt}
3. Vì sao thay đổi ảnh hưởng điểm: ${uc.impactReason}
4. Tiêu chí Rubric đáp ứng tốt hơn: ${uc.rubricMetReason}
`).join('\n')}` : ''}
` : ''}

## 9. CÁC VẤN ĐỀ CÒN TỒN TẠI CẦN LƯU Ý
${rescoreHistory?.remainingIssues?.length ? rescoreHistory.remainingIssues.map(i => `- ${i}`).join('\n') : openIssues > 0 ? `${openIssues} vấn đề chưa được đánh dấu hoàn tất cần được tác giả rà soát trước ngày nộp chính thức.` : 'Tất cả các vấn đề trọng yếu đã được rà soát và bổ sung minh chứng.'}

## 10. NHẬN XÉT TỔNG HỢP & KHUYẾN NGHỊ HỘI ĐỒNG
- **Tính mới:** ${novelty.overallConclusion} (Trong phạm vi nguồn đã tra cứu: ${novelty.scopeChecked}).
- **Tính liêm chính:** Nghiêm cấm tạo số liệu giả. Các minh chứng thực nghiệm phải được lưu trữ trong Phụ lục kèm chữ ký xác nhận của Tổ chuyên môn.
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16 select-none">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Báo cáo Thẩm định & Đánh giá Sáng kiến Kinh nghiệm (Chuẩn 10 mục)
          </h2>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            Dữ liệu kết nối trực tiếp từ kết quả đánh giá thực tế và lịch sử chấm lại
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-[13.5px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép Markdown' : 'Sao chép văn bản'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-[13.5px] shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Paper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        
        {/* Header Document Style */}
        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
          <div className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
            HỘI ĐỒNG THẨM ĐỊNH & ĐÁNH GIÁ SÁNG KIẾN GIÁO DỤC
          </div>
          <h1 className="text-[20px] sm:text-[24px] font-black text-slate-900 uppercase tracking-tight">
            BÁO CÁO KẾT QUẢ CHẤM, PHẢN BIỆN & HOÀN THIỆN SÁNG KIẾN
          </h1>
          <p className="text-[13.5px] italic text-slate-600 font-serif">
            Hệ thống: SKKN REVIEW PRO – “Chấm có căn cứ – Phản biện có chiều sâu – Sửa đúng điểm yếu”
          </p>
        </div>

        {/* 1. THÔNG TIN HỒ SƠ */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span>1. THÔNG TIN HỒ SƠ SÁNG KIẾN</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-[14px] text-slate-800">
            <div>
              <strong>Tên sáng kiến:</strong> <span className="font-semibold text-slate-950">{metadata.title}</span>
            </div>
            <div>
              <strong>Tác giả:</strong> {metadata.author || 'Chưa cung cấp'}
            </div>
            <div>
              <strong>Đơn vị công tác:</strong> {metadata.organization || 'Chưa cung cấp'}
            </div>
            <div>
              <strong>Môn học / Lĩnh vực:</strong> {metadata.subject || metadata.field || 'Giáo dục'}
            </div>
            <div>
              <strong>Đối tượng & Cấp học:</strong> {metadata.gradeLevel || ''} - {metadata.targetAudience || ''}
            </div>
            <div>
              <strong>Thời gian áp dụng:</strong> {metadata.applicationTimeframe || ''}
            </div>
            <div className="md:col-span-2">
              <strong>Phiếu chấm áp dụng:</strong> {metadata.appliedRubricName} ({metadata.isOfficialRubric ? 'Phiếu chấm chính thức của cơ sở' : 'Rubric chuẩn'})
            </div>
          </div>
        </div>

        {/* 2. KẾT QUẢ CHẤM */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider">
              2. KẾT QUẢ CHẤM & ĐÁNH GIÁ CHUNG
            </h2>
            <span className="text-[16px] font-black text-blue-800">
              {totalProposed.toFixed(1)} / {totalMax} điểm ({((totalProposed / totalMax) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[14.5px] space-y-1.5 leading-[1.6]">
            <div>
              <strong>Mức độ đầy đủ căn cứ minh chứng:</strong>{' '}
              <span className="font-bold text-slate-900">{metadata.evidenceAdequacy}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Giải trình căn cứ:</strong> {metadata.evidenceAdequacyReason}
            </p>
          </div>
        </div>

        {/* 3. ĐIỂM THEO RUBRIC */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            3. ĐIỂM ĐỀ XUẤT THEO TIÊU CHÍ RUBRIC
          </h2>
          <table className="w-full text-left text-[14px] border border-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-bold w-12 text-center">STT</th>
                <th className="p-2.5 font-bold">Tiêu chí đánh giá</th>
                <th className="p-2.5 font-bold w-20 text-center">Tối đa</th>
                <th className="p-2.5 font-bold w-20 text-center">Đề xuất</th>
                <th className="p-2.5 font-bold w-36">Vị trí căn cứ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rubricCriteria.map((c, i) => (
                <tr key={c.id}>
                  <td className="p-2.5 text-center font-bold text-slate-600">{i + 1}</td>
                  <td className="p-2.5 font-medium text-slate-900">{c.criterionName}</td>
                  <td className="p-2.5 text-center text-slate-600">{c.maxScore}đ</td>
                  <td className="p-2.5 text-center font-bold text-blue-700">{c.proposedScore.toFixed(1)}đ</td>
                  <td className="p-2.5 font-mono text-[13px] text-slate-500">{c.basisLocation}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-[14.5px]">
                <td colSpan={2} className="p-2.5 text-right uppercase">Tổng cộng:</td>
                <td className="p-2.5 text-center">{totalMax}đ</td>
                <td className="p-2.5 text-center text-blue-800 text-[15px] font-black">{totalProposed.toFixed(1)}đ</td>
                <td className="p-2.5"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. ĐIỂM MẠNH GHI NHẬN */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span>4. ĐIỂM MẠNH GHI NHẬN CỦA SÁNG KIẾN</span>
          </h2>
          <div className="space-y-2.5 text-[14.5px] leading-[1.6]">
            {rubricCriteria.map((c, i) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                <strong className="text-emerald-900 block font-bold text-[15px]">
                  {i + 1}. {c.criterionName}
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {c.strengths}
                </p>
                {c.existingEvidence && (
                  <p className="text-[13px] text-emerald-800 font-medium">
                    📁 Minh chứng hiện có: {c.existingEvidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5. CÁC VẤN ĐỀ PHÁT HIỆN TỪ HỘI ĐỒNG PHẢN BIỆN */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            5. CÁC VẤN ĐỀ PHÁT HIỆN TỪ HỘI ĐỒNG PHẢN BIỆN (RED TEAM)
          </h2>
          <div className="space-y-3 text-[14.5px] leading-[1.6]">
            {redTeamCards.map((rc) => (
              <div key={rc.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <span className="font-bold text-rose-900 font-mono text-[15px]">
                    [{rc.id}] {rc.issueDetected}
                  </span>
                  <span className="text-[12.5px] font-bold px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 self-start sm:self-auto">
                    {rc.location}
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>Trích đoạn liên quan:</strong> "{rc.relatedQuote}"
                </p>
                <p className="text-slate-700">
                  <strong>Căn cứ phản biện:</strong> {rc.criticismBasis}
                </p>
                <p className="text-slate-800 font-medium">
                  <strong>Hướng xử lý:</strong> {rc.resolutionGuidance}
                </p>
                <p className="text-[13.5px] text-amber-900">
                  <strong>Minh chứng cần bổ sung:</strong> {rc.requiredEvidence} (Vị trí: {rc.insertLocation || rc.location})
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 6. GỢI Ý SỬA & HOÀN THIỆN THEO 3 NHÓM PHÂN LOẠI */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            6. GỢI Ý SỬA & HOÀN THIỆN (PHÂN LOẠI MỨC ĐỘ ƯU TIÊN)
          </h2>
          
          <div className="space-y-4 text-[14.5px] leading-[1.6]">
            {/* 🔴 PHẢI SỬA TRƯỚC KHI NỘP */}
            <div className="space-y-2">
              <h3 className="font-bold text-rose-900 text-[14px] flex items-center gap-1.5 uppercase">
                <span>🔴 PHẢI SỬA TRƯỚC KHI NỘP ({mustFixItems.length} vấn đề)</span>
              </h3>
              {mustFixItems.map((c) => (
                <div key={c.id} className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 space-y-1">
                  <strong className="text-slate-900 block text-[15px]">[{c.id}] {c.issueDetected}</strong>
                  <p className="text-slate-700"><strong>Vị trí:</strong> {c.location}</p>
                  <p className="text-slate-800 font-medium"><strong>Hướng xử lý:</strong> {c.resolutionGuidance}</p>
                </div>
              ))}
            </div>

            {/* 🟠 NÊN SỬA */}
            {shouldFixItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-amber-900 text-[14px] flex items-center gap-1.5 uppercase">
                  <span>🟠 NÊN SỬA ({shouldFixItems.length} vấn đề)</span>
                </h3>
                {shouldFixItems.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 space-y-1">
                    <strong className="text-slate-900 block text-[15px]">[{c.id}] {c.issueDetected}</strong>
                    <p className="text-slate-700"><strong>Vị trí:</strong> {c.location}</p>
                    <p className="text-slate-800 font-medium"><strong>Hướng xử lý:</strong> {c.resolutionGuidance}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 🟡 TỐI ƯU THÊM */}
            {optimizeItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-blue-900 text-[14px] flex items-center gap-1.5 uppercase">
                  <span>🟡 TỐI ƯU THÊM ({optimizeItems.length} vấn đề)</span>
                </h3>
                {optimizeItems.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/40 space-y-1">
                    <strong className="text-slate-900 block text-[15px]">[{c.id}] {c.issueDetected}</strong>
                    <p className="text-slate-700"><strong>Vị trí:</strong> {c.location}</p>
                    <p className="text-slate-800 font-medium"><strong>Hướng xử lý:</strong> {c.resolutionGuidance}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7. TÌNH TRẠNG XỬ LÝ */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            7. TÌNH TRẠNG XỬ LÝ CÁC VẤN ĐỀ
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[12px] text-slate-500 font-bold uppercase block">Tổng số vấn đề</span>
              <span className="text-[20px] font-black text-slate-800">{totalIssues}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[12px] text-emerald-700 font-bold uppercase block">Đã xử lý</span>
              <span className="text-[20px] font-black text-emerald-800">{resolvedIssues}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[12px] text-amber-700 font-bold uppercase block">Chưa xử lý</span>
              <span className="text-[20px] font-black text-amber-800">{openIssues + inProgressIssues}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[12px] text-slate-500 font-bold uppercase block">Bỏ qua / Không đồng ý</span>
              <span className="text-[20px] font-black text-slate-600">{ignoredIssues}</span>
            </div>
          </div>
        </div>

        {/* 8. KẾT QUẢ CHẤM LẠI (NẾU CÓ) */}
        {rescoreHistory && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider">
                8. KẾT QUẢ CHẤM LẠI SAU CHỈNH SỬA
              </h2>
              <span className="text-[13.5px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {rescoreHistory.previousScore.toFixed(1)}đ ➔ {rescoreHistory.newScore.toFixed(1)}đ ({rescoreHistory.scoreDifference >= 0 ? '+' : ''}{rescoreHistory.scoreDifference.toFixed(1)}đ)
              </span>
            </div>
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 text-[14px] space-y-2.5 leading-[1.6]">
              <p className="text-slate-800">
                <strong>Căn cứ khoa học giải trình:</strong> {rescoreHistory.justificationForChange}
              </p>
              {rescoreHistory.fixedIssues?.length > 0 && (
                <div className="pt-1">
                  <strong className="text-emerald-900 block mb-1">✓ Vấn đề đã khắc phục triệt để:</strong>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    {rescoreHistory.fixedIssues.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {rescoreHistory.newEvidenceAdded?.length > 0 && (
                <div className="pt-1">
                  <strong className="text-blue-900 block mb-1">📁 Minh chứng mới bổ sung:</strong>
                  <div className="flex flex-wrap gap-2">
                    {rescoreHistory.newEvidenceAdded.map((ev, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 bg-white border border-teal-200 rounded text-[13px] text-teal-900 font-medium">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chi tiết đối chiếu từng vị trí issues (Bản gốc vs Bản đã sửa) */}
              {rescoreHistory.issueComparisons && rescoreHistory.issueComparisons.length > 0 && (
                <div className="pt-3 border-t border-teal-200/80 space-y-3">
                  <strong className="text-slate-900 block font-bold text-[14px] uppercase">
                    Đối chiếu thực chất vị trí liên quan issues (Bản gốc ↔ Bản đã sửa):
                  </strong>
                  <div className="space-y-3">
                    {rescoreHistory.issueComparisons.map((item, idx) => {
                      const isFixed = item.status === 'ĐÃ KHẮC PHỤC';
                      const isPartial = item.status === 'CẢI THIỆN MỘT PHẦN';
                      const isConflict = item.status === 'PHÁT SINH MÂU THUẪN MỚI';
                      const badgeCls = isFixed
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isPartial
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : isConflict
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300';

                      return (
                        <div key={idx} className="p-3.5 bg-white rounded-lg border border-teal-200 space-y-2 text-[13.5px]">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                            <span className="font-bold text-slate-900 text-[14.5px]">{idx + 1}. {item.issueTitle}</span>
                            <span className={`px-2.5 py-0.5 rounded text-[12px] font-bold border self-start sm:self-auto ${badgeCls}`}>
                              ● {item.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                              <span className="text-[12px] text-slate-400 font-bold uppercase block">Bản gốc:</span>
                              <p className="italic font-mono text-[13px]">"{item.originalQuote}"</p>
                            </div>
                            <div className="p-2.5 bg-teal-50/50 rounded border border-teal-200 text-teal-950">
                              <span className="text-[12px] text-teal-800 font-bold uppercase block">Bản mới đã sửa:</span>
                              <p className="font-medium font-mono text-[13px]">"{item.revisedQuote}"</p>
                            </div>
                          </div>
                          {item.explanation && (
                            <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                              <strong>Đánh giá thực chất:</strong> {item.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chi tiết tiêu chí Rubric được nâng điểm */}
              {rescoreHistory.updatedCriteria && rescoreHistory.updatedCriteria.length > 0 && (
                <div className="pt-3 border-t border-teal-200/80 space-y-2.5">
                  <strong className="text-slate-900 block font-bold text-[14px] uppercase">
                    Chi tiết điểm Rubric cập nhật sau chỉnh sửa:
                  </strong>
                  <div className="space-y-2">
                    {rescoreHistory.updatedCriteria.map((c, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-teal-200 text-[13.5px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="text-[14px]">{idx + 1}. {c.criterionName}</span>
                          <span className="text-teal-800">
                            {c.previousScore.toFixed(1)}đ ➔ {c.newScore.toFixed(1)}đ ({c.changeDifference >= 0 ? '+' : ''}{c.changeDifference.toFixed(1)}đ)
                          </span>
                        </div>
                        <p className="text-slate-600">
                          <strong>Căn cứ:</strong> {c.whatChanged} (Minh chứng: {c.evidenceFoundAt})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. CÁC VẤN ĐỀ CÒN TỒN TẠI */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            9. CÁC VẤN ĐỀ CÒN TỒN TẠI CẦN LƯU Ý
          </h2>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[14.5px] space-y-2 leading-[1.6]">
            {rescoreHistory?.remainingIssues?.length ? (
              <ul className="space-y-1 text-slate-700">
                {rescoreHistory.remainingIssues.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : openIssues > 0 ? (
              <p className="text-amber-900 leading-relaxed font-medium">
                Hồ sơ hiện còn {openIssues} vấn đề chưa được khắc phục hoàn toàn. Tác giả cần rà soát kỹ lưỡng các số liệu và bảng đối chứng trước khi nộp chính thức lên Hội đồng chấm cấp huyện/tỉnh.
              </p>
            ) : (
              <p className="text-emerald-900 font-medium">
                Tất cả các vấn đề phát hiện ban đầu đã được tác giả tiếp thu, chỉnh sửa và hoàn thiện minh chứng.
              </p>
            )}
          </div>
        </div>

        {/* 10. NHẬN XÉT TỔNG HỢP & KHUYẾN NGHỊ */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            10. NHẬN XÉT TỔNG HỢP & KHUYẾN NGHỊ HỘI ĐỒNG
          </h2>
          <div className="space-y-2.5 text-[14.5px] text-slate-700 leading-relaxed">
            <p>
              <strong>Đánh giá tính mới:</strong> {novelty.overallConclusion} (Phạm vi tra cứu: {novelty.scopeChecked}).
            </p>
            <p className="text-[13px] text-slate-500 italic">
              * Lưu ý khoa học: Kết quả tra cứu tính mới và tương đồng được thực hiện trong phạm vi cơ sở dữ liệu đối soát giáo dục hiện hữu, không khẳng định tuyệt đối về bản quyền hay sáng chế độc quyền.
            </p>
            <p>
              <strong>Khuyến nghị tác giả:</strong> Báo cáo sáng kiến phải bảo đảm tính trung thực, không bịa đặt số liệu hay minh chứng thực nghiệm. Mọi minh chứng hình ảnh, bảng khảo sát và sản phẩm học tập đối chứng cần được đính kèm tại phần Phụ lục và có xác nhận của Ban giám hiệu / Tổ chuyên môn đơn vị công tác.
            </p>
          </div>
        </div>

        {/* Chữ ký xác nhận */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-[13.5px] text-slate-700">
          <div>
            <span className="font-bold uppercase block text-[14px]">ĐẠI DIỆN TỔ CHUYÊN MÔN</span>
            <span className="italic text-[12px] block mt-1">(Ký và ghi rõ họ tên)</span>
            <div className="h-16" />
          </div>
          <div>
            <span className="font-bold uppercase block text-[14px]">TRỢ LÝ CHẤM & PHẢN BIỆN</span>
            <span className="italic text-[12px] block mt-1">SKKN REVIEW PRO</span>
            <div className="h-16 flex items-center justify-center text-[12px] text-slate-400 font-mono">
              [XÁC THỰC HỒ SƠ THẬT]
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
