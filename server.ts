import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { extractGeminiOutput, parseAnalysisResponse, normalizeAnalysisResult } from './src/utils/analysisPipeline';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side initialization of Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract clean status code and error classification from Gemini SDK
function parseGeminiError(error: any) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = error?.message || 'Lỗi xử lý AI';

  if (typeof error?.status === 'number') {
    status = error.status;
  } else if (typeof error?.statusCode === 'number') {
    status = error.statusCode;
  } else if (typeof error?.code === 'number') {
    status = error.code;
  }

  const rawStr = typeof error?.message === 'string' ? error.message : JSON.stringify(error || {});

  // Try extracting inner JSON error e.g. {"error":{"code":503,"status":"UNAVAILABLE",...}}
  const jsonMatch = rawStr.match(/\{[\s\S]*"code"\s*:\s*(\d+)[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.code) status = Number(parsed.error.code);
      if (parsed.error?.status) code = String(parsed.error.status);
      if (parsed.error?.message) message = parsed.error.message;
    } catch (_) {}
  } else {
    if (rawStr.includes('503') || rawStr.includes('UNAVAILABLE') || rawStr.includes('high demand') || rawStr.includes('overloaded')) {
      status = 503;
      code = 'UNAVAILABLE';
    } else if (rawStr.includes('429') || rawStr.includes('RESOURCE_EXHAUSTED') || rawStr.includes('quota')) {
      status = 429;
      code = 'RESOURCE_EXHAUSTED';
    } else if (rawStr.includes('400') || rawStr.includes('INVALID_ARGUMENT')) {
      status = 400;
      code = 'INVALID_ARGUMENT';
    } else if (rawStr.includes('401') || rawStr.includes('403') || rawStr.includes('API_KEY') || rawStr.includes('PERMISSION_DENIED')) {
      status = 403;
      code = 'PERMISSION_DENIED';
    }
  }

  return { status, code, message };
}

// Helper to parse DOCX buffer to text
app.post('/api/parse-docx', async (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Thiếu dữ liệu base64' });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    return res.json({ text: result.value });
  } catch (error: any) {
    console.error('Error parsing docx:', error);
    return res.status(500).json({ error: 'Không thể đọc nội dung file Word: ' + error.message });
  }
});

// Core Analysis Endpoint
app.post('/api/analyze-skkn', async (req, res) => {
  try {
    const { skknContent, rubricContent, evidenceFiles, promptNotes } = req.body;

    if (!skknContent || typeof skknContent !== 'string' || skknContent.trim().length === 0) {
      return res.status(400).json({ error: 'Nội dung Sáng kiến kinh nghiệm (SKKN) không được để trống.' });
    }

    // 1. Log Input trong Development
    console.log('[STAGE: REQUEST] /api/analyze-skkn received');
    console.log('ANALYSIS INPUT LENGTH:', skknContent.length);
    console.log('ANALYSIS INPUT PREVIEW:', skknContent.slice(0, 200).replace(/\n/g, ' '));

    // 2. System Instruction Tầng 1: Tinh gọn, trọng tâm, học thuật
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
${skknContent.slice(0, 75000)}

=== PHIẾU CHẤM / HƯỚNG DẪN / RUBRIC (NẾU CÓ) ===
${rubricContent ? rubricContent.slice(0, 15000) : "Người dùng KHÔNG cung cấp phiếu chấm riêng. HÃY DÙNG KHUNG 7 TIÊU CHÍ CHUẨN (TỔNG 100 ĐIỂM)."}

=== THÔNG TIN MINH CHỨNG / TÀI LIỆU KÈM THEO ===
${evidenceFiles && evidenceFiles.length > 0 ? JSON.stringify(evidenceFiles) : "Không có file minh chứng đính kèm riêng ngoài nội dung trong văn bản."}

${promptNotes ? `=== GHI CHÚ BỔ SUNG CỦA NGƯỜI DÙNG ===\n${promptNotes}` : ""}
`;

    // 5. Cấu hình Structured Output với Schema Tầng 1 và cơ chế tự động thử lại khi 503/429
    let response: any;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    for (let sAttempt = 0; sAttempt < modelsToTry.length; sAttempt++) {
      const currentModel = modelsToTry[sAttempt];
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
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
            temperature: 0.2,
          },
        });
        break;
      } catch (genErr: any) {
        const { status } = parseGeminiError(genErr);
        if ((status === 503 || status === 429) && sAttempt < modelsToTry.length - 1) {
          console.warn(`[STAGE: REQUEST] Gemini ${currentModel} ${status} spike on attempt ${sAttempt + 1}, retrying with ${modelsToTry[sAttempt + 1]} in 1.5s...`);
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        throw genErr;
      }
    }

    // 3. Log Raw Response thực tế trong Development
    console.log('[STAGE: RESPONSE] MODEL CALLED');
    console.log('RAW GEMINI RESPONSE:', response ? '[Object Response Received]' : null);
    console.log('RESPONSE TYPE:', typeof response);
    console.log('CANDIDATES:', response?.candidates ? `Count: ${response.candidates.length}` : null);
    console.log('RESPONSE TEXT:', typeof response?.text === 'string' ? response.text.slice(0, 300) + '...' : null);
    console.log('RESPONSE DATA:', (response as any)?.data ? '[Data Present]' : null);

    // 14. Kiểm tra finishReason
    const finishReason = response?.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.warn('[STAGE: RESPONSE] Cảnh báo finishReason: MAX_TOKENS (output có thể bị cắt)');
    }

    // 4. Trích xuất qua hàm extractGeminiOutput duy nhất
    console.log('[STAGE: EXTRACT] Extracting output');
    const rawOutput = extractGeminiOutput(response);

    // 11. Parse an toàn qua parseAnalysisResponse
    console.log('[STAGE: PARSE] Parsing output');
    const parsedData = parseAnalysisResponse(rawOutput);

    // 12. Chuẩn hóa qua normalizeAnalysisResult
    console.log('[STAGE: NORMALIZE] Normalizing result');
    const normalizedResult = normalizeAnalysisResult(parsedData, skknContent, promptNotes);

    console.log('[STAGE: STATE] Analysis completed successfully. Issues found:', normalizedResult.redTeamCards.length);
    return res.json(normalizedResult);
  } catch (error: any) {
    console.error('Error in analyze-skkn:', error);
    const { status, code, message } = parseGeminiError(error);
    return res.status(status).json({
      error: message,
      code,
      status
    });
  }
});

// Suggestion Rewrite Endpoint (3 Tiers: Sửa nhẹ / Sửa học thuật / Sửa sâu)
app.post('/api/generate-suggestion', async (req, res) => {
  try {
    const { originalText, problem, context, targetSection } = req.body;

    const prompt = `
Bạn là chuyên gia cố vấn viết và chỉnh sửa Sáng kiến Kinh nghiệm Giáo dục của "SKKN REVIEW PRO".
YÊU CẦU CỐT LÕI:
- KHÔNG tự tạo số liệu giả, KHÔNG tự tạo kết quả khảo sát, KHÔNG tự tạo minh chứng.
- Nếu cần số liệu thực tế mà tài liệu chưa có, BẮT BUỘC sử dụng các placeholder đánh dấu:
  [CẦN BỔ SUNG SỐ LIỆU THỰC TẾ] hoặc [CẦN BỔ SUNG MINH CHỨNG] hoặc [CẦN BỔ SUNG THỜI GIAN/ĐỐI TƯỢNG].
- Cung cấp đủ 3 mức độ:
  1. SỬA NHẸ: Giữ gần nguyên nội dung, sửa trau chuốt câu từ.
  2. SỬA HỌC THUẬT: Cải thiện logic, khoa học, tính sư phạm và diễn đạt chuẩn mực.
  3. SỬA SÂU: Đề xuất tổ chức lại đoạn/mục, chỉ rõ minh chứng cần bổ sung và đặt vị trí thích hợp.

Thông tin đoạn văn cần sửa:
Vị trí/Mục: ${targetSection || 'Chưa xác định rõ'}
Đoạn gốc:
"""${originalText}"""

Vấn đề phát hiện:
${problem}

Bối cảnh:
${context || 'Nghiên cứu sáng kiến giáo dục'}

Trả về định dạng JSON:
{
  "whyRevise": "Giải thích vì sao cần sửa",
  "revisionGoal": "Mục tiêu chỉnh sửa",
  "howToRevise": "Cách sửa chi tiết",
  "lightRevision": "Đoạn văn sửa nhẹ",
  "academicRevision": "Đoạn văn sửa học thuật",
  "deepRevision": "Đoạn văn sửa sâu",
  "missingEvidenceAlert": "Minh chứng cần bổ sung nếu có",
  "insertPosition": "Vị trí nên đặt trong văn bản"
}
`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
    } catch (err: any) {
      console.warn('Primary model failed for generate-suggestion, trying fallback:', err?.message || err);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
      } catch (fallbackErr) {
        console.warn('All models failed for generate-suggestion, returning pedagogical fallback.');
        return res.json({
          whyRevise: `Vấn đề: ${problem || 'Cần điều chỉnh số liệu và diễn đạt cho chuẩn hóa'}. Việc chỉnh sửa giúp tăng độ tin cậy và điểm số theo Rubric.`,
          revisionGoal: 'Chuẩn hóa số liệu, củng cố tính khoa học và minh chứng sư phạm.',
          howToRevise: 'Rà soát văn bản gốc, thống nhất số liệu và đính kèm phụ lục minh chứng thực nghiệm.',
          lightRevision: `Chỉnh sửa diễn đạt tại ${targetSection || 'đoạn văn'}: Rà soát câu từ, chuẩn hóa các số liệu cho thống nhất xuyên suốt bài viết. Nếu số liệu chưa kiểm chứng đầy đủ, ghi chú rõ: "[Xác minh lại cỡ mẫu/số liệu thực tế]".`,
          academicRevision: `Bổ sung cơ sở sư phạm và phương pháp luận tại ${targetSection || 'đoạn văn'}: Nêu rõ mục tiêu nghiên cứu, tiêu chí khảo sát và phạm vi đối tượng thực tế. Đối chiếu số liệu trước và sau tác động với bảng tổng hợp minh chứng gốc.`,
          deepRevision: `Tái cấu trúc lại ${targetSection || 'đoạn văn'}: Tách biệt rõ thực trạng ban đầu và kết quả thực nghiệm. Bổ sung biểu mẫu khảo sát hoặc sản phẩm học tập tại Phụ lục để bảo vệ trọn vẹn điểm trước Hội đồng chấm sáng kiến.`,
          missingEvidenceAlert: 'Cần đính kèm phiếu khảo sát hoặc bảng số liệu đối chiếu tại Phụ lục.',
          insertPosition: targetSection || 'Vị trí tương ứng trong bài'
        });
      }
    }

    const parsed = JSON.parse(response?.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating suggestion:', error);
    const { status, code, message } = parseGeminiError(error);
    return res.status(status).json({ error: message, code, status });
  }
});

// Council Simulator Extra Questions
app.post('/api/ask-council', async (req, res) => {
  try {
    const { skknTitle, weaknesses, criteriaIssues } = req.body;

    const prompt = `
Bạn là "Hội đồng phản biện khó tính (Red Team)" trong kỳ đánh giá Sáng kiến Giáo dục.
Dựa trên những điểm yếu thực tế sau đây của sáng kiến:
Tên đề tài: ${skknTitle}
Các điểm yếu / hạn chế đã ghi nhận:
${JSON.stringify(weaknesses || [])}
Tiêu chí bị trừ điểm:
${JSON.stringify(criteriaIssues || [])}

Hãy tạo ra danh sách 4-5 câu hỏi chất vấn gay gắt, xoáy sâu vào các điểm chưa có minh chứng, các số liệu có dấu hiệu bất thường, hoặc tính mới bị phóng đại.
TUYỆT ĐỐI: Không gợi ý câu trả lời chứa số liệu bịa đặt. Gợi ý hướng trả lời phải trung thực, sư phạm, có trách nhiệm.

Trả về JSON mảng các câu hỏi:
[
  {
    "id": "cq-new-1",
    "difficulty": "🔴 Câu hỏi khó" | "🟠 Cần chuẩn bị" | "🟡 Câu hỏi làm rõ",
    "question": "Nội dung câu hỏi mà thành viên hội đồng sẽ đặt",
    "whyCouncilAsks": "Vì sao hội đồng lại hỏi câu này",
    "relatedLocation": "Mục hoặc vị trí liên quan",
    "requiredEvidenceToBring": "Tác giả cần chuẩn bị minh chứng gì để mang theo bảo vệ",
    "suggestedAnswerStrategy": "Gợi ý hướng trả lời trung thực và bản lĩnh"
  }
]
`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });
    }

    const parsed = JSON.parse(response.text || '[]');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating council questions:', error);
    const { status, code, message } = parseGeminiError(error);
    return res.status(status).json({ error: message, code, status });
  }
});

// Rescore after revision endpoint
app.post('/api/rescore-skkn', async (req, res) => {
  try {
    const { previousResult, revisedNotes, revisedText } = req.body;

    const prompt = `
Bạn là "SKKN REVIEW PRO – Chấm lại sau chỉnh sửa".
Người dùng gửi bản cập nhật hoặc giải trình chỉnh sửa sau lần chấm trước.

NGUYÊN TẮC:
- CHỈ THAY ĐỔI ĐIỂM KHI CÓ CĂN CỨ THỰC TẾ.
- KHÔNG TĂNG ĐIỂM CHỈ VÌ CÂU VĂN ĐƯỢC VIẾT HAY HƠN HOẶC TRAU CHUỐT HƠN.
- Điểm chỉ được phục hồi/nâng khi: Có bổ sung minh chứng thật, có sửa số liệu mâu thuẫn, có làm rõ quy trình, có kiểm soát biến số.
- Nếu tác giả chưa cung cấp minh chứng mà chỉ hứa hẹn: Giữ nguyên điểm và ghi rõ "Chưa đủ căn cứ xác nhận sự khắc phục".

Dữ liệu lần chấm trước:
- Điểm tổng cũ: ${previousResult?.rubricCriteria ? previousResult.rubricCriteria.reduce((acc: number, c: any) => acc + (c.proposedScore || 0), 0) : 70}
- Các tiêu chí cũ: ${JSON.stringify(previousResult?.rubricCriteria?.map((c: any) => ({ name: c.criterionName, score: c.proposedScore, max: c.maxScore, reason: c.deductionReason })) || [])}

Nội dung tác giả đã chỉnh sửa / bổ sung / đính chính:
"""${revisedNotes || revisedText}"""

Hãy đánh giá xem:
1. Những vấn đề nào đã thực sự được giải quyết?
2. Những vấn đề nào chưa giải quyết xong?
3. Có vấn đề mới nào phát sinh không?
4. Minh chứng mới, số liệu mới nào đã được ghi nhận?
5. Điểm số mới cho từng tiêu chí và tổng điểm mới?
6. Lý do thay đổi điểm cụ thể.

Trả về JSON:
{
  "previousScore": number,
  "newScore": number,
  "scoreDifference": number,
  "fixedIssues": ["..."],
  "remainingIssues": ["..."],
  "newIssuesArisen": ["..."],
  "newEvidenceAdded": ["..."],
  "newFiguresAdded": ["..."],
  "justificationForChange": "Giải trình lý do điểm số thay đổi chi tiết",
  "updatedCriteria": [
    {
      "criterionName": "...",
      "previousScore": number,
      "newScore": number,
      "changeReason": "..."
    }
  ]
}
`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in rescore-skkn:', error);
    const { status, code, message } = parseGeminiError(error);
    return res.status(status).json({ error: message, code, status });
  }
});

// Reference Verification Endpoint
app.post('/api/verify-reference', async (req, res) => {
  try {
    const { referenceEntry, citationContext, urlOrDomain } = req.body;

    const prompt = `
Bạn là chuyên gia thẩm định tài liệu trích dẫn khoa học sư phạm trong "SKKN REVIEW PRO".
Nhiệm vụ: Thẩm tra độ xác thực, quy chuẩn và tính phù hợp của tài liệu tham khảo sau:

Tên tài liệu / mục trích: "${referenceEntry}"
Ngữ cảnh trích dẫn trong bài: "${citationContext || 'Chưa cung cấp'}"
Đường dẫn / Domain (nếu có): "${urlOrDomain || 'Không có'}"

NGUYÊN TẮC:
- TUYỆT ĐỐI KHÔNG kết luận "nguồn giả" chỉ vì chưa tìm thấy.
- Phân loại trạng thái chỉ được dùng 1 trong 3 giá trị:
  1. "xac_minh_duoc" (🟢 Xác minh được: Sách, tài liệu, công văn, bài báo đã xuất bản chính thức)
  2. "xac_minh_mot_phan" (🟡 Xác minh một phần: Nguồn có thật nhưng thiếu năm, thiếu nhà xuất bản, hoặc nguồn mở như Wikipedia không đảm bảo tính học thuật)
  3. "chua_xac_minh_duoc" (🔴 Chưa xác minh được: Chưa tìm thấy thông tin xuất bản rõ ràng trong dữ liệu giáo dục hiện có)

Trả về JSON:
{
  "verificationStatus": "xac_minh_duoc" | "xac_minh_mot_phan" | "chua_xac_minh_duoc",
  "verificationNote": "Giải trình chi tiết kết quả thẩm tra",
  "hasAuthorAndYear": boolean,
  "supportsArgument": "Đánh giá xem tài liệu này có thực sự hỗ trợ luận điểm đang nói hay không",
  "recommendation": "Hướng dẫn chuẩn hóa quy chuẩn trích dẫn theo APA hoặc TCVN"
}
`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error verifying reference:', error);
    const { status, code, message } = parseGeminiError(error);
    return res.status(status).json({ error: message, code, status });
  }
});

// Vite Middleware for Development / Static for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
