import { GoogleGenAI, Type } from '@google/genai';
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Chỉ hỗ trợ POST.'});
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {skknContent, rubricContent, evidenceFiles, promptNotes} = body;
    if (typeof skknContent !== 'string' || !skknContent.trim()) return res.status(400).json({code:'INVALID_INPUT',error:'Nội dung SKKN trống.'});
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({code:'AI_NOT_CONFIGURED',error:'Thiếu cấu hình AI.'});
    const ai = new GoogleGenAI({apiKey});
    const model = process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.1-flash-lite';
    const systemPrompt = `
Bạn là "SKKN REVIEW PRO – Trợ lý Chấm & Phản biện Sáng kiến Giáo dục".
Khẩu hiệu: “Chấm có căn cứ – Phản biện có chiều sâu – Sửa đúng điểm yếu.”
Đối tượng: Giáo viên, tổ chuyên môn, hội đồng chấm sáng kiến kinh nghiệm tại Việt Nam.

QUY TẮC CỐT LÕI:
1. KHÔNG tự tạo số liệu, không bịa khảo sát, không tự tạo minh chứng, không bịa nguồn trích dẫn.
2. KHÔNG chấm nếu không có căn cứ. Nếu tài liệu chưa đủ thông tin hoặc chỉ là văn bản dán chưa kèm minh chứng gốc, score có thể là null.
3. Không bắt buộc số trang: Người dùng dán văn bản trực tiếp nên vị trí (location) là tên phần/mục/đoạn (Ví dụ: "Phần I", "Mục II.2 - Thực trạng", "Bảng 1 - Đoạn 3"). Tuyệt đối không bịa số trang.
4. Mỗi vấn đề (issues) phải có:
   - severity: "critical" (Phải sửa / nguy cơ rớt) | "warning" (Nên sửa / điểm trừ) | "improvement" (Tối ưu thêm).
   - evidence: trích ngắn nguyên văn từ SKKN làm căn cứ.
   - finding: 1-2 câu nhận xét cụ thể, chỉ rõ lỗi logic, số liệu, tính mới hoặc thiếu minh chứng.
   - reason: 1-2 câu giải thích vì sao hội đồng sẽ trừ điểm hoặc nghi ngờ.
   - recommendation: 1-2 câu hướng dẫn tác giả bổ sung minh chứng hoặc sửa lại cụ thể.
5. Danh sách tiêu chí (rubric): Đánh giá theo rubric người dùng cung cấp hoặc 7 tiêu chí chuẩn GDPT:
   1. Tính cấp thiết (10đ)
   2. Tính mới & sáng tạo (20đ)
   3. Tính khoa học & logic (20đ)
   4. Tính thực tiễn & sư phạm (15đ)
   5. Tính hiệu quả & minh chứng (20đ)
   6. Khả năng áp dụng & nhân rộng (10đ)
   7. Hình thức trình bày & chuẩn mực (5đ)
`;

    const userPrompt = `
HÃY PHÂN TÍCH VÀ ĐÁNH GIÁ SÁNG KIẾN KINH NGHIỆM SAU ĐÂY:

=== NỘI DUNG SÁNG KIẾN KINH NGHIỆM (SKKN) ===
${skknContent}

=== PHIẾU CHẤM / HƯỚNG DẪN / RUBRIC (NẾU CÓ) ===
${rubricContent ? rubricContent : "Người dùng KHÔNG cung cấp phiếu chấm riêng. HÃY DÙNG KHUNG 7 TIÊU CHÍ CHUẨN (TỔNG 100 ĐIỂM)."}

=== THÔNG TIN MINH CHỨNG / TÀI LIỆU KÈM THEO ===
${evidenceFiles && evidenceFiles.length > 0 ? JSON.stringify(evidenceFiles) : "Không có file minh chứng đính kèm riêng ngoài nội dung trong văn bản."}

${promptNotes ? `=== GHI CHÚ BỔ SUNG CỦA NGƯỜI DÙNG ===\n${promptNotes}` : ""}
`;

    for (let attempt=0; attempt<2; attempt++) {
      try {
        const response = await ai.models.generateContent({model, contents:userPrompt, config:{
            systemInstruction:systemPrompt,
            responseMimeType:'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                evaluation: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER, nullable: true },
                    maxScore: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                  },
                  required: ['maxScore', 'summary'],
                },
                rubric: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      criterion: { type: Type.STRING },
                      score: { type: Type.NUMBER, nullable: true },
                      maxScore: { type: Type.NUMBER, nullable: true },
                      reason: { type: Type.STRING },
                      evidence: { type: Type.STRING },
                      location: { type: Type.STRING },
                    },
                    required: ['id', 'criterion', 'reason', 'evidence', 'location'],
                  },
                },
                issues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      category: { type: Type.STRING },
                      title: { type: Type.STRING },
                      location: { type: Type.STRING },
                      evidence: { type: Type.STRING },
                      finding: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      rubricImpact: { type: Type.STRING },
                      recommendation: { type: Type.STRING },
                    },
                    required: ['id', 'severity', 'title', 'location', 'finding', 'recommendation'],
                  },
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['evaluation', 'rubric', 'issues', 'strengths'],
            },
            temperature:0.2,
        }});
        const raw = (response.text || '').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
        const result = JSON.parse(raw);
        if (!result.evaluation || !Array.isArray(result.rubric) || !Array.isArray(result.issues) || !Array.isArray(result.strengths)) throw new Error('INVALID_ANALYSIS');
        return res.status(200).json(result);
      } catch (error: any) {
        const status = Number(error.status || error.statusCode) || 502;
        if (attempt===0 && [429,503].includes(status)) { await new Promise(resolve=>setTimeout(resolve,1500)); continue; }
        console.error('[analyze-skkn]',status, error.name);
        return res.status(status>=400 && status<=599 ? status : 502).json({code:'AI_ERROR',error:'Không hoàn tất phân tích.'});
      }
    }
  } catch (error: any) { return res.status(400).json({code:'INVALID_INPUT',error:'Yêu cầu không hợp lệ.'}); }
}
