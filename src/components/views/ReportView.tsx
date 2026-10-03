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
  Download
} from 'lucide-react';
import { SKKNAnalysisResult } from '../../types';

interface ReportViewProps {
  analysis: SKKNAnalysisResult;
}

export const ReportView: React.FC<ReportViewProps> = ({ analysis }) => {
  const [copied, setCopied] = useState(false);
  const { metadata, rubricCriteria, redTeamCards, novelty, evidenceChain, dataAnomalies, logicGaps, priorityActions, councilQuestions } = analysis;

  const totalProposed = rubricCriteria.reduce((sum, c) => sum + c.proposedScore, 0);
  const totalMax = rubricCriteria.reduce((sum, c) => sum + c.maxScore, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = `
# BÁO CÁO ĐÁNH GIÁ & PHẢN BIỆN SÁNG KIẾN GIÁO DỤC
**Hệ thống:** SKKN REVIEW PRO
**Khẩu hiệu:** Chấm có căn cứ – Phản biện có chiều sâu – Sửa đúng điểm yếu.

---

## 1. TỔNG QUAN ĐỀ TÀI
- **Tên sáng kiến:** ${metadata.title}
- **Tác giả:** ${metadata.author || 'Chưa cung cấp'}
- **Đơn vị công tác:** ${metadata.organization || 'Chưa cung cấp'}
- **Môn học / Lĩnh vực:** ${metadata.subject || metadata.field || 'Giáo dục'}
- **Cấp học / Đối tượng:** ${metadata.gradeLevel || ''} - ${metadata.targetAudience || ''}
- **Thời gian áp dụng:** ${metadata.applicationTimeframe || ''}
- **Phiếu chấm áp dụng:** ${metadata.appliedRubricName} (${metadata.isOfficialRubric ? 'Phiếu chấm chính thức' : 'Rubric hệ thống'})

## 2. KẾT QUẢ ĐIỂM THEO RUBRIC
**Tổng điểm đề xuất:** ${totalProposed.toFixed(1)} / ${totalMax} điểm (${((totalProposed / totalMax) * 100).toFixed(1)}%)

${rubricCriteria.map((c, i) => `### Tiêu chí ${i + 1}: ${c.criterionName}
- **Điểm:** ${c.proposedScore.toFixed(1)} / ${c.maxScore} điểm (Mức ưu tiên: ${c.priority})
- **Vị trí căn cứ:** ${c.basisLocation}
- **Trích dẫn căn cứ:** "${c.shortQuote}"
- **Điểm mạnh ghi nhận:** ${c.strengths}
- **Hạn chế tồn tại:** ${c.limitations}
- **Minh chứng hiện có:** ${c.existingEvidence}
- **Minh chứng còn thiếu:** ${c.missingEvidence}
- **Lý do chưa đạt điểm tối đa:** ${c.deductionReason}
- **Cách cải thiện:** ${c.improvementGuidance}
`).join('\n')}

## 3. CÁC VẤN ĐỀ TRỌNG YẾU TỪ HỘI ĐỒNG PHẢN BIỆN (RED TEAM)
${redTeamCards.map((c) => `- [${c.id}] (Ảnh hưởng: ${c.impactLevel}) tại ${c.location}: ${c.issueDetected}
  + Căn cứ: ${c.criticismBasis}
  + Hướng xử lý: ${c.resolutionGuidance}
  + Minh chứng cần bổ sung: ${c.requiredEvidence}
`).join('\n')}

## 4. ĐÁNH GIÁ TÍNH MỚI (NOVELTY MAP)
- **Kết luận chung:** ${novelty.overallConclusion}
- **Phạm vi nguồn đã kiểm tra:** ${novelty.scopeChecked}

## 5. BẢN ĐỒ MINH CHỨNG (EVIDENCE MAP)
${evidenceChain.map((e) => `- Luận điểm tại ${e.location}: "${e.claim}"
  + Trạng thái: ${e.status}
  + Minh chứng hiện có: ${e.existingEvidenceDetails}
  + Minh chứng còn thiếu: ${e.missingEvidenceDetails}
`).join('\n')}

## 6. THẨM ĐỊNH SỐ LIỆU & LOGIC
- Số lỗi mâu thuẫn số liệu: ${dataAnomalies.length}
${dataAnomalies.map((d) => `- [${d.type}] tại ${d.location}: ${d.analysis}`).join('\n')}
- Mắt xích đứt gãy logic: ${logicGaps.length}
${logicGaps.map((l) => `- [${l.stepName}]: ${l.gapDescription}`).join('\n')}

## 7. CÂU HỎI HỘI ĐỒNG CÓ THỂ ĐẶT
${councilQuestions.map((q, i) => `${i + 1}. [${q.difficulty}] "${q.question}"
   - Căn cứ: ${q.relatedLocation}
   - Minh chứng cần mang theo: ${q.requiredEvidenceToBring}
   - Hướng trả lời: ${q.suggestedAnswerStrategy}
`).join('\n')}

## 8. MỨC ĐỘ ĐẦY ĐỦ CỦA CĂN CỨ ĐÁNH GIÁ
- **Mức độ:** ${metadata.evidenceAdequacy}
- **Giải trình:** ${metadata.evidenceAdequacyReason}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Báo cáo thẩm định toàn diện (Chuẩn 14 đề mục)
          </h2>
          <p className="text-xs text-slate-500">
            Sẵn sàng in ấn, xuất PDF hoặc lưu trữ hồ sơ hội đồng
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép Markdown' : 'Sao chép văn bản'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo / Lưu PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Paper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        
        {/* Header Document Style */}
        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            HỘI ĐỒNG THẨM ĐỊNH & ĐÁNH GIÁ SÁNG KIẾN GIÁO DỤC
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            BÁO CÁO KẾT QUẢ CHẤM & PHẢN BIỆN SÁNG KIẾN
          </h1>
          <p className="text-xs italic text-slate-600 font-serif">
            Hệ thống: SKKN REVIEW PRO – “Chấm có căn cứ – Phản biện có chiều sâu – Sửa đúng điểm yếu”
          </p>
        </div>

        {/* 1. Tổng quan */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span>I. THÔNG TIN HỒ SƠ SÁNG KIẾN</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-xs text-slate-800">
            <div>
              <strong>Tên đề tài:</strong> <span className="font-semibold text-slate-950">{metadata.title}</span>
            </div>
            <div>
              <strong>Tác giả:</strong> {metadata.author || 'Chưa cung cấp'}
            </div>
            <div>
              <strong>Đơn vị:</strong> {metadata.organization || 'Chưa cung cấp'}
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
              <strong>Phiếu chấm áp dụng:</strong> {metadata.appliedRubricName} ({metadata.isOfficialRubric ? 'Phiếu chấm chính thức của người dùng' : 'Rubric hệ thống'})
            </div>
          </div>
        </div>

        {/* 2. Điểm theo rubric */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              II. TỔNG HỢP ĐIỂM ĐỀ XUẤT THEO RUBRIC
            </h2>
            <span className="text-base font-black text-blue-800">
              {totalProposed.toFixed(1)} / {totalMax} điểm ({((totalProposed / totalMax) * 100).toFixed(1)}%)
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-bold w-12 text-center">STT</th>
                <th className="p-2.5 font-bold">Tiêu chí đánh giá</th>
                <th className="p-2.5 font-bold w-24 text-center">Tối đa</th>
                <th className="p-2.5 font-bold w-24 text-center">Đề xuất</th>
                <th className="p-2.5 font-bold w-32">Vị trí căn cứ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rubricCriteria.map((c, i) => (
                <tr key={c.id}>
                  <td className="p-2.5 text-center font-bold text-slate-600">{i + 1}</td>
                  <td className="p-2.5 font-medium text-slate-900">{c.criterionName}</td>
                  <td className="p-2.5 text-center text-slate-600">{c.maxScore}đ</td>
                  <td className="p-2.5 text-center font-bold text-blue-700">{c.proposedScore.toFixed(1)}đ</td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-500">{c.basisLocation}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="p-2.5 text-right uppercase">Tổng cộng:</td>
                <td className="p-2.5 text-center">{totalMax}đ</td>
                <td className="p-2.5 text-center text-blue-800 text-sm">{totalProposed.toFixed(1)}đ</td>
                <td className="p-2.5"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Chi tiết giải trình điểm từng tiêu chí */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            III. GIẢI TRÌNH ĐIỂM SỐ & MINH CHỨNG CHI TIẾT
          </h2>
          <div className="space-y-4 text-xs">
            {rubricCriteria.map((c, i) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {i + 1}. {c.criterionName}
                  </h4>
                  <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {c.proposedScore.toFixed(1)} / {c.maxScore}đ
                  </span>
                </div>
                <div className="text-slate-600 italic">
                  <strong>Trích dẫn căn cứ ({c.basisLocation}):</strong> "{c.shortQuote}"
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  <div>
                    <strong className="text-emerald-800">✓ Điểm mạnh ghi nhận:</strong> {c.strengths}
                  </div>
                  <div>
                    <strong className="text-rose-800">✗ Lý do chưa đạt tối đa:</strong> {c.deductionReason}
                  </div>
                  <div>
                    <strong>Minh chứng hiện có:</strong> {c.existingEvidence}
                  </div>
                  <div>
                    <strong className="text-amber-800">Minh chứng còn thiếu:</strong> {c.missingEvidence}
                  </div>
                </div>
                <div className="pt-1 text-slate-800 font-medium">
                  <strong>Hướng cải thiện:</strong> {c.improvementGuidance}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Thẻ phản biện Red Team */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            IV. CÁC VẤN ĐỀ TRỌNG YẾU TỪ HỘI ĐỒNG PHẢN BIỆN (RED TEAM)
          </h2>
          <div className="space-y-3 text-xs">
            {redTeamCards.map((rc) => (
              <div key={rc.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 font-mono">
                    [{rc.id}] {rc.issueDetected}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    {rc.location}
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>Căn cứ phản biện:</strong> {rc.criticismBasis}
                </p>
                <p className="text-slate-800 font-medium">
                  <strong>Hướng xử lý:</strong> {rc.resolutionGuidance}
                </p>
                <p className="text-[11px] text-amber-900">
                  <strong>Minh chứng cần bổ sung:</strong> {rc.requiredEvidence} (Vị trí: {rc.insertLocation})
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Tính mới & Evidence Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
              V. KẾT LUẬN TÍNH MỚI
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {novelty.overallConclusion}
            </p>
            <p className="text-[11px] text-slate-500">
              * Phạm vi rà soát: {novelty.scopeChecked}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
              VI. MỨC ĐỘ ĐẦY ĐỦ CỦA CĂN CỨ ĐÁNH GIÁ
            </h3>
            <div className="flex items-center gap-2">
              <span>Đánh giá chung:</span>
              <strong className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-900 border border-slate-300">
                {metadata.evidenceAdequacy}
              </strong>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {metadata.evidenceAdequacyReason}
            </p>
          </div>
        </div>

        {/* 6. Phân tích Dấu hiệu AI */}
        {analysis.aiMarkers && (
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
              VII. PHÂN TÍCH DẤU HIỆU NGÔN NGỮ BIÊN SOẠN (DẤU HIỆU AI)
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span>Nhận định phong cách tổng quan:</span>
                <strong className="text-slate-900 font-bold">
                  {analysis.aiMarkers.overallLevel === 'it_dau_hieu' && '🟢 Ít dấu hiệu bất thường'}
                  {analysis.aiMarkers.overallLevel === 'can_xem_xet' && '🟡 Cần xem xét'}
                  {analysis.aiMarkers.overallLevel === 'nhieu_dau_hieu' && '🟠 Có nhiều dấu hiệu cần kiểm tra'}
                </strong>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {analysis.aiMarkers.overallSummary}
              </p>
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                * Giới hạn phân tích: {analysis.aiMarkers.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* 7. Tương đồng & Trích dẫn & Kiểm chứng TLTK */}
        {analysis.similarityAndCitations && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
              VIII. TƯƠNG ĐỒNG, TRÍCH DẪN & KIỂM CHỨNG TÀI LIỆU THAM KHẢO
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <p className="text-slate-700 leading-relaxed">
                <strong>Đánh giá tổng quan:</strong> {analysis.similarityAndCitations.overallSummary}
              </p>
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">Danh mục tài liệu tham khảo thẩm tra:</span>
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {analysis.similarityAndCitations.referenceChecks?.map((ref) => (
                    <li key={ref.id} className="flex items-start gap-1.5">
                      <span className="font-bold">•</span>
                      <span>
                        <strong>{ref.referenceEntry}</strong> ({ref.citationInText}): {ref.verificationNote}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1">
                * Giới hạn phân tích: {analysis.similarityAndCitations.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* 8. Chữ ký xác nhận */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-700">
          <div>
            <span className="font-bold uppercase block">ĐẠI DIỆN TỔ CHUYÊN MÔN</span>
            <span className="italic text-[11px] block mt-1">(Ký và ghi rõ họ tên)</span>
            <div className="h-16" />
          </div>
          <div>
            <span className="font-bold uppercase block">TRỢ LÝ CHẤM & PHẢN BIỆN</span>
            <span className="italic text-[11px] block mt-1">SKKN REVIEW PRO</span>
            <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 font-mono">
              [XÁC THỰC CĂN CỨ]
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
