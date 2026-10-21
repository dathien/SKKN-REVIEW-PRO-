import { SKKNAnalysisResult } from '../types';

/**
 * Xuất báo cáo thẩm định SKKN thành file Word (.doc / .docx compatible HTML)
 * Tương thích 100% với Microsoft Word, WPS Office, Google Docs
 */
export function exportEvaluationReportDoc(analysis: SKKNAnalysisResult, fileName?: string) {
  const metadata = analysis.metadata || {};
  const rubricCriteria = analysis.rubricCriteria || [];
  const redTeamCards = analysis.redTeamCards || [];
  const evidenceChain = analysis.evidenceChain || [];

  const totalScore = rubricCriteria.reduce((sum, c) => sum + (c.proposedScore ?? 0), 0);
  const maxScore = rubricCriteria.reduce((sum, c) => sum + (c.maxScore ?? 10), 0);
  const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '0';

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${metadata.title || 'Báo cáo Thẩm định SKKN'}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #111827; margin: 20mm; }
        h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 5px; color: #1e3a8a; }
        h2 { font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 8px; border-bottom: 1.5pt solid #1e3a8a; padding-bottom: 3px; color: #1e3a8a; }
        h3 { font-size: 13pt; font-weight: bold; margin-top: 12px; margin-bottom: 5px; color: #1f2937; }
        p, li { font-size: 13pt; margin-bottom: 6px; text-align: justify; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        th, td { border: 1pt solid #cbd5e1; padding: 8px 10px; font-size: 12pt; }
        th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
        .score-box { background-color: #eff6ff; border: 1.5pt solid #3b82f6; padding: 12px; border-radius: 6px; margin: 15px 0; font-size: 14pt; font-weight: bold; text-align: center; color: #1d4ed8; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11pt; font-weight: bold; }
        .footer-note { font-size: 11pt; font-style: italic; color: #64748b; text-align: right; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 15px;">
        <p style="font-size: 11pt; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="font-size: 11pt; font-weight: bold; margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
        <p style="margin: 5px 0;">-----------------------</p>
      </div>

      <h1>BÁO CÁO KẾT QUẢ THẨM ĐỊNH & PHẢN BIỆN<br>SÁNG KIẾN KINH NGHIỆM GIÁO DỤC</h1>
      <p style="text-align: center; font-style: italic; color: #475569; margin-top: 0;">Hệ thống SKKN REVIEW PRO — Trợ lý Chấm & Phản biện Sáng kiến Chuyên sâu</p>

      <h2>1. THÔNG TIN HỒ SƠ SÁNG KIẾN</h2>
      <table>
        <tr>
          <td style="width: 30%; font-weight: bold;">Tên sáng kiến:</td>
          <td style="font-weight: bold; color: #1e3a8a;">${metadata.title || 'Chưa đặt tên'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tác giả:</td>
          <td>${metadata.author || 'Thầy/Cô tác giả'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Đơn vị / Trường học:</td>
          <td>${metadata.organization || 'Chưa cung cấp'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Môn học / Lĩnh vực:</td>
          <td>${metadata.subject || metadata.field || 'Giáo dục'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Cấp học & Đối tượng:</td>
          <td>${metadata.gradeLevel || ''} - ${metadata.targetAudience || ''}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Phiếu chấm áp dụng:</td>
          <td>${metadata.appliedRubricName || 'Rubric chuẩn Quốc gia'}</td>
        </tr>
      </table>

      <h2>2. KẾT QUẢ ĐÁNH GIÁ TỔNG QUAN</h2>
      <div class="score-box">
        TỔNG ĐIỂM ĐẠT ĐƯỢC: ${totalScore.toFixed(1)} / ${maxScore} ĐIỂM (${percentage}%)
      </div>
      <p><strong>Đánh giá minh chứng:</strong> ${metadata.evidenceAdequacy || 'Đầy đủ căn cứ cơ bản'}</p>
      <p><strong>Căn cứ đánh giá:</strong> ${metadata.evidenceAdequacyReason || 'Dựa trên phân tích đối chiếu cấu trúc và luận điểm thực nghiệm trong SKKN.'}</p>

      <h2>3. BẢNG ĐIỂM CHI TIẾT THEO TIÊU CHÍ RUBRIC</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">STT</th>
            <th style="width: 32%;">Tiêu chí đánh giá</th>
            <th style="width: 15%;">Điểm đạt</th>
            <th style="width: 45%;">Nhận xét & Căn cứ</th>
          </tr>
        </thead>
        <tbody>
          ${rubricCriteria.map((c, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td style="font-weight: bold;">${c.criterionName}</td>
              <td style="text-align: center; font-weight: bold; color: #1d4ed8;">${(c.proposedScore ?? 0).toFixed(1)} / ${c.maxScore || 10}đ</td>
              <td>
                <p><strong>Điểm mạnh:</strong> ${c.strengths || 'Đạt yêu cầu.'}</p>
                ${c.limitations ? `<p><strong>Hạn chế:</strong> ${c.limitations}</p>` : ''}
                ${c.improvementGuidance ? `<p><strong>Hướng sửa:</strong> ${c.improvementGuidance}</p>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>4. CÁC ĐIỂM YẾU HỘI ĐỒNG CẦN XỬ LÝ (RED TEAM)</h2>
      ${redTeamCards.length === 0 ? '<p>Không ghi nhận vấn đề nghiêm trọng.</p>' : `
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Mã / Mức độ</th>
              <th style="width: 25%;">Vị trí / Vấn đề</th>
              <th style="width: 30%;">Căn cứ phản biện</th>
              <th style="width: 30%;">Gợi ý hướng xử lý</th>
            </tr>
          </thead>
          <tbody>
            ${redTeamCards.map(card => `
              <tr>
                <td style="text-align: center; font-weight: bold; color: ${card.impactLevel === 'Cao' ? '#dc2626' : card.impactLevel === 'Trung bình' ? '#d97706' : '#2563eb'};">
                  [${card.id}]<br>${card.impactLevel}
                </td>
                <td>
                  <strong>${card.location || 'Toàn bài'}:</strong><br>
                  ${card.issueDetected}
                </td>
                <td>${card.criticismBasis}</td>
                <td>${card.resolutionGuidance}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}

      <h2>5. CHUỖI MINH CHỨNG & THỰC NGHIỆM</h2>
      ${evidenceChain.length === 0 ? '<p>Chưa có thông tin chuỗi minh chứng.</p>' : `
        <ul>
          ${evidenceChain.map(e => `
            <li>
              <strong>${e.claim}:</strong> ${e.status === 'co_minh_chung' ? '✓ Đã có minh chứng' : '⚠ Cần bổ sung minh chứng'} (${e.existingEvidenceDetails || e.missingEvidenceDetails || e.recommendation || ''})
            </li>
          `).join('')}
        </ul>
      `}

      <div class="footer-note">
        <p>Báo cáo tự động tạo bởi Hệ thống SKKN REVIEW PRO — Ngày ${new Date().toLocaleDateString('vi-VN')}</p>
        <p>Tác giả phát triển: GV. Hồ Nguyễn Đa Thiện · Copyright © 2026</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `${(metadata.title || 'Bao_cao_tham_dinh_SKKN').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]/g, '_')}_BaoCao.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
