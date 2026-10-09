import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { extractGeminiOutput, parseAnalysisResponse, normalizeAnalysisResult } from './src/utils/analysisPipeline';
import {
  getOrCreateGuest,
  findUserByEmailOrId,
  getOrCreateUser,
  consumeQuota,
  activateLicenseKey,
  getSystemStats,
  getAllUsersAndGuests,
  adminUpdateUser,
  adminCreateUser,
  adminGenerateLicense,
  getAllLicenses,
  adminResetLicenseDevices,
  adminToggleLicenseStatus,
  adminDeleteLicense,
  fetchUserFromLicenseApi,
  getSystemSettings,
  updateSystemSettings,
} from './src/server/authStore';

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

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
    const { skknContent, rubricContent, evidenceFiles, promptNotes, userContext } = req.body;

    if (!skknContent || typeof skknContent !== 'string' || skknContent.trim().length === 0) {
      return res.status(400).json({ error: 'Nội dung Sáng kiến kinh nghiệm (SKKN) không được để trống.' });
    }

    // Quota & Authorization check
    const mode = userContext?.mode === 'advanced' ? 'advanced' : 'easy';
    const quotaCheck = consumeQuota({
      guestId: userContext?.guestId,
      email: userContext?.email,
      userId: userContext?.userId,
      mode,
    });

    if (!quotaCheck.allowed) {
      return res.status(403).json({
        error: quotaCheck.message,
        code: quotaCheck.code,
        quota: quotaCheck.quota,
        role: quotaCheck.role,
      });
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
    return res.json({
      ...normalizedResult,
      quota: quotaCheck.quota,
      role: quotaCheck.role
    });
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
Bạn là chuyên gia cố vấn nghiên cứu và hoàn thiện Sáng kiến Kinh nghiệm (SKKN) của "SKKN REVIEW PRO".
Nhiệm vụ: Tạo 3 phiên bản chỉnh sửa THỰC SỰ KHÁC NHAU dựa CHUNG trên một tập dữ kiện đã có, tuyệt đối tuân thủ FACT SAFETY.

NGUYÊN TẮC FACT SAFETY BẮT BUỘC:
- KHÔNG tự tạo số liệu mới (số học sinh, số tiết, số phiếu, tỷ lệ %, điểm số).
- KHÔNG tự tạo nguyên nhân mới (vắng, không tham gia, hỏng phiếu,...).
- KHÔNG tự tạo tên trường, tên lớp, tên người, ngày tháng, công cụ đo lường mới.
- KHÔNG tự tạo minh chứng, khảo sát, nguồn trích dẫn, DOI, URL giả mạo.
- Nếu thiếu dữ liệu thực tế, BẮT BUỘC dùng placeholder: [CẦN BỔ SUNG SỐ LIỆU THỰC TẾ] hoặc [CẦN BỔ SUNG MINH CHỨNG].

3 MỨC ĐỘ CHỈNH SỬA PHẢI THỰC SỰ KHÁC BIỆT:
1. LIGHT (SỬA NHẸ):
   - Giữ tối đa câu chữ, giọng văn và cấu trúc của tác giả.
   - Chỉ sửa những gì thực sự cần thiết để khắc phục issue (chính tả, ngữ pháp, thuật ngữ, giảm khẳng định quá mức).
   - Không tái cấu trúc toàn đoạn. Không thêm dữ kiện.

2. ACADEMIC (SỬA HỌC THUẬT):
   - Viết lại đoạn theo văn phong nghiên cứu giáo dục chặt chẽ, khách quan và logic hơn.
   - Được tổ chức lại câu, làm rõ chủ thể, chuẩn hóa thuật ngữ khoa học sư phạm.
   - Diễn đạt thận trọng, khiêm tốn khoa học. Không thay đổi bản chất nội dung và không thêm dữ kiện.

3. DEEP (SỬA SÂU):
   - Tái cấu trúc đoạn để giải quyết issue ở mức sâu nhất có thể.
   - Có thể thay đổi cấu trúc lập luận theo chuỗi: đối tượng -> phương pháp -> dữ liệu -> phân tích -> kết luận.
   - Đổi thứ tự câu, tách/gộp ý, chỉ rõ vị trí cần minh chứng thực nghiệm đối chứng tại Phụ lục.
   - Tuyệt đối không thêm fact không có căn cứ.

Thông tin đoạn văn:
- Vị trí/Mục: ${targetSection || 'Văn bản SKKN'}
- Đoạn gốc:
"""${originalText}"""
- Vấn đề phản biện:
${problem}
- Bối cảnh:
${context || 'Sáng kiến kinh nghiệm'}

Trả về ĐÚNG định dạng JSON sau:
{
  "whyRevise": "Giải thích vì sao cần sửa và rủi ro nếu giữ nguyên",
  "basis": "Căn cứ quy chuẩn / tiêu chí rubric / nguyên tắc nghiên cứu sư phạm",
  "revisionGoal": "Mục tiêu chỉnh sửa cụ thể",
  "howToRevise": "Cách sửa chi tiết từng bước",
  "lightRevision": "Phiên bản sửa nhẹ (giữ tối đa bản gốc)",
  "academicRevision": "Phiên bản sửa học thuật (chuẩn hóa văn phong nghiên cứu)",
  "deepRevision": "Phiên bản sửa sâu (tái cấu trúc lập luận có hệ thống)",
  "tierDetails": {
    "light": {
      "text": "Nội dung sửa nhẹ",
      "changeScope": "Sửa chính tả, ngữ pháp, giảm khẳng định quá mức, giữ nguyên cấu trúc gốc",
      "factsUsed": ["Dữ kiện gốc trong SKKN"]
    },
    "academic": {
      "text": "Nội dung sửa học thuật",
      "changeScope": "Chuẩn hóa văn phong nghiên cứu, tăng tính khách quan và liên kết logic",
      "factsUsed": ["Dữ kiện gốc trong SKKN"]
    },
    "deep": {
      "text": "Nội dung sửa sâu",
      "changeScope": "Tái cấu trúc chuỗi lập luận đối tượng -> phương pháp -> dữ liệu -> kết luận",
      "factsUsed": ["Dữ kiện gốc trong SKKN"]
    }
  },
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
          temperature: 0.25,
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
            temperature: 0.25,
          },
        });
      } catch (fallbackErr) {
        console.warn('All models failed for generate-suggestion, returning pedagogical fallback.');
        const loc = targetSection || 'đoạn văn';
        return res.json({
          whyRevise: `Vấn đề: ${problem || 'Cần điều chỉnh số liệu và diễn đạt cho chuẩn hóa'}. Việc chỉnh sửa giúp tăng độ tin cậy và bảo toàn điểm số theo Rubric.`,
          basis: 'Căn cứ tiêu chí đánh giá sáng kiến kinh nghiệm, quy chuẩn phương pháp nghiên cứu sư phạm và quy tắc liêm chính khoa học.',
          revisionGoal: 'Chuẩn hóa số liệu, củng cố tính khoa học và minh chứng sư phạm.',
          howToRevise: 'Rà soát văn bản gốc, thống nhất số liệu và đính kèm phụ lục minh chứng thực nghiệm.',
          lightRevision: `Chỉnh sửa diễn đạt tại ${loc}: Giữ nguyên câu chữ và cấu trúc của tác giả, rà soát lại câu từ và khắc phục trực tiếp lỗi phát hiện. Giữ nguyên số liệu gốc, ghi chú: "[CẦN BỔ SUNG SỐ LIỆU THỰC TẾ]" nếu chưa đủ căn cứ.`,
          academicRevision: `Viết lại theo văn phong nghiên cứu sư phạm tại ${loc}: Làm rõ mục tiêu, đối tượng và mối quan hệ giữa các dữ kiện. Diễn đạt khách quan, thận trọng, không tự ý bổ sung dữ kiện chưa kiểm chứng.`,
          deepRevision: `Tái cấu trúc lập luận tại ${loc}:\n1. Thực trạng & Vấn đề: Làm rõ bối cảnh cụ thể trước can thiệp.\n2. Phương pháp & Tiến trình: Trình bày mạch lạc chuỗi giải pháp.\n3. Minh chứng & Đối soát: Chỉ rõ vị trí cần đính kèm minh chứng thực nghiệm [CẦN BỔ SUNG MINH CHỨNG THỰC TẾ] tại Phụ lục để bảo vệ luận điểm.`,
          tierDetails: {
            light: {
              text: `Chỉnh sửa diễn đạt tại ${loc}: Giữ nguyên câu chữ và cấu trúc của tác giả.`,
              changeScope: 'Sửa chính tả, ngữ pháp, giảm khẳng định quá mức, giữ nguyên cấu trúc gốc',
              factsUsed: ['Dữ kiện gốc trong SKKN']
            },
            academic: {
              text: `Viết lại theo văn phong nghiên cứu sư phạm tại ${loc}: Chuẩn hóa thuật ngữ và liên kết logic.`,
              changeScope: 'Chuẩn hóa văn phong nghiên cứu, tăng tính khách quan và liên kết logic',
              factsUsed: ['Dữ kiện gốc trong SKKN']
            },
            deep: {
              text: `Tái cấu trúc lập luận tại ${loc} theo chuỗi đối tượng -> phương pháp -> dữ liệu -> kết luận.`,
              changeScope: 'Tái cấu trúc chuỗi lập luận đối tượng -> phương pháp -> dữ liệu -> kết luận',
              factsUsed: ['Dữ kiện gốc trong SKKN']
            }
          },
          missingEvidenceAlert: 'Cần đính kèm phiếu khảo sát hoặc bảng số liệu đối chiếu tại Phụ lục.',
          insertPosition: loc
        });
      }
    }

    const parsed = JSON.parse(response?.text || '{}');
    
    // FACT SAFETY CHECK cho cả 3 phiên bản (Section A7)
    // Đảm bảo không chứa enum kỹ thuật trên UI text
    const cleanTechnicalText = (text: string) => {
      if (!text) return '';
      return text
        .replace(/USER_CONFIRMED/g, 'Đã xác nhận')
        .replace(/SOURCE_DOCUMENT/g, 'Theo tài liệu SKKN')
        .replace(/VERIFIED_SOURCE/g, 'Nguồn đã kiểm chứng')
        .replace(/DERIVED_CALCULATION/g, 'Tính toán từ số liệu có sẵn')
        .replace(/REQUIRES_VERIFICATION/g, 'Cần xác nhận')
        .replace(/REQUIRES_EVIDENCE/g, 'Cần bổ sung minh chứng');
    };

    if (parsed.lightRevision) parsed.lightRevision = cleanTechnicalText(parsed.lightRevision);
    if (parsed.academicRevision) parsed.academicRevision = cleanTechnicalText(parsed.academicRevision);
    if (parsed.deepRevision) parsed.deepRevision = cleanTechnicalText(parsed.deepRevision);

    // Đồng bộ tierDetails nếu model chưa trả về đủ
    if (!parsed.tierDetails) {
      parsed.tierDetails = {
        light: {
          text: parsed.lightRevision,
          changeScope: 'Giữ tối đa bản gốc của tác giả, sửa tối thiểu',
          factsUsed: ['Dữ kiện gốc trong SKKN']
        },
        academic: {
          text: parsed.academicRevision,
          changeScope: 'Chuẩn hóa văn phong nghiên cứu giáo dục',
          factsUsed: ['Dữ kiện gốc trong SKKN']
        },
        deep: {
          text: parsed.deepRevision,
          changeScope: 'Tái cấu trúc lập luận và chuỗi logic',
          factsUsed: ['Dữ kiện gốc trong SKKN']
        }
      };
    }

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
  let oldTotalScore: number | null = null;
  try {
    const { previousResult, revisedNotes, revisedText } = req.body;
    const contentToEvaluate = revisedNotes || revisedText || '';
    const oldIssues = previousResult?.redTeamCards || [];
    const oldCriteria = previousResult?.rubricCriteria || [];
    
    // FACT SAFETY: Không được mặc định điểm cũ = 70. Nếu không xác định được: oldTotalScore = null
    if (typeof previousResult?.evaluation?.score === 'number') {
      oldTotalScore = previousResult.evaluation.score;
    } else if (Array.isArray(oldCriteria) && oldCriteria.length > 0) {
      oldTotalScore = oldCriteria.reduce((acc: number, c: any) => acc + (c.proposedScore || 0), 0);
    } else {
      oldTotalScore = null;
    }

    const prompt = `
Bạn là "SKKN REVIEW PRO – Chuyên gia Thẩm định lại sau chỉnh sửa (Rescore Engine)".
Tác giả SKKN vừa nộp phiên bản chỉnh sửa hoặc văn bản giải trình sau phản biện.

NGUYÊN TẮC THẨM ĐỊNH BẮT BUỘC:
1. KHÔNG PHẢI NÚT TĂNG ĐIỂM:
   - Tuyệt đối KHÔNG tự động tăng điểm chỉ vì vấn đề đã được tác giả đánh dấu là "Đã xử lý".
   - Tuyệt đối KHÔNG tăng điểm chỉ vì văn phong mượt mà, câu từ hoa mỹ hơn ("đã sửa câu" KHÔNG PHẢI LÀ "đã sửa nghiên cứu").
   - Điểm số chỉ thay đổi khi NỘI DUNG / MINH CHỨNG / SỐ LIỆU / LOGIC THỰC NGHIỆM thực sự thay đổi và đáp ứng tiêu chí Rubric.
2. NẾU GIỮ NGUYÊN HOẶC CHƯA ĐỦ CĂN CỨ:
   - Điểm giữ nguyên (changeDifference = 0).
   - Nếu bản sửa gây mâu thuẫn mới hoặc loại bỏ phần quan trọng, điểm có thể giảm (changeDifference < 0).
3. ĐỐI CHIẾU TRỰC TIẾP TỪNG VẤN ĐỀ (ISSUES COMPARISON):
   - So sánh Bản gốc (Original) vs Bản mới (Revised).
   - Xác định rõ trạng thái: "ĐÃ KHẮC PHỤC", "CẢI THIỆN MỘT PHẦN", "CHƯA KHẮC PHỤC", "PHÁT SINH MÂU THUẪN MỚI", hoặc "KHÔNG XÁC ĐỊNH".

DỮ LIỆU ĐÁNH GIÁ LẦN TRƯỚC:
- Điểm tổng cũ: ${oldTotalScore !== null ? oldTotalScore : 'Chưa có điểm tổng'}
- Tiêu chí Rubric cũ: ${JSON.stringify(oldCriteria.map((c: any) => ({ name: c.criterionName, score: c.proposedScore, max: c.maxScore, reason: c.deductionReason })))}
- Danh sách vấn đề phản biện cũ (Issues): ${JSON.stringify(oldIssues.map((c: any) => ({ id: c.id, issue: c.issueDetected, quote: c.relatedQuote, location: c.location })))}

NỘI DUNG BẢN SKKN ĐÃ CHỈNH SỬA / MINH CHỨNG MỚI NỘP:
"""${contentToEvaluate}"""

Hãy phân tích kỹ lưỡng và trả về đúng JSON theo cấu trúc sau:
{
  "previousScore": ${oldTotalScore !== null ? oldTotalScore : 'null'},
  "newScore": number,
  "scoreDifference": number,
  "fixedIssues": ["Tên vấn đề đã giải quyết triệt để"],
  "remainingIssues": ["Tên vấn đề còn tồn tại chưa khắc phục"],
  "newIssuesArisen": ["Vấn đề mới phát sinh nếu có"],
  "newEvidenceAdded": ["Minh chứng thực tế mới được ghi nhận"],
  "newFiguresAdded": ["Số liệu thực tế mới được đối soát"],
  "justificationForChange": "Giải trình tổng hợp căn cứ thay đổi hoặc giữ nguyên điểm số",
  "issueComparisons": [
    {
      "issueTitle": "Tên vấn đề",
      "originalQuote": "Nội dung / số liệu bản gốc",
      "revisedQuote": "Nội dung / số liệu bản mới (trích dẫn cụ thể)",
      "status": "ĐÃ KHẮC PHỤC" | "CẢI THIỆN MỘT PHẦN" | "CHƯA KHẮC PHỤC" | "PHÁT SINH MÂU THUẪN MỚI" | "KHÔNG XÁC ĐỊNH",
      "explanation": "Phân tích vì sao đạt trạng thái này"
    }
  ],
  "updatedCriteria": [
    {
      "criterionName": "Tên tiêu chí",
      "previousScore": number,
      "newScore": number,
      "changeDifference": number,
      "whatChanged": "Điều gì cụ thể đã thay đổi?",
      "evidenceFoundAt": "Minh chứng nằm ở đâu trong bản sửa?",
      "impactReason": "Vì sao thay đổi này ảnh hưởng đến điểm số?",
      "rubricMetReason": "Tiêu chí Rubric nào được đáp ứng tốt hơn?"
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
    return res.json({
      success: true,
      ...parsed,
    });
  } catch (error: any) {
    console.error('Error in rescore-skkn (AI models failed):', error);
    const { status, message } = parseGeminiError(error);
    const finalStatus: number = (status === 429 || status === 503 || status === 403) ? status : 503;
    const isRetryable = finalStatus === 429 || finalStatus === 503;

    // FACT SAFETY: Tuyệt đối KHÔNG tự tạo số liệu/minh chứng/điểm số giả khi AI thất bại.
    return res.status(finalStatus).json({
      success: false,
      code: 'RESCORE_AI_UNAVAILABLE',
      retryable: isRetryable,
      message: 'Chưa thể chấm lại lúc này. Kết quả đánh giá hiện tại được giữ nguyên. Vui lòng thử lại.',
      previousScore: oldTotalScore,
      scoreChanged: false,
      issuesChanged: false,
      originalError: message,
    });
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

// Endpoint lưu asset Mascot PNG/WebP vào thư mục public
app.post('/api/save-mascot', (req, res) => {
  try {
    const { dataBase64, filename } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh' });
    }
    const cleanBase64 = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const targetFile = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, '') : 'mascot.png';
    fs.writeFileSync(path.join(publicDir, targetFile), buffer);
    return res.json({ success: true, url: `/${targetFile}` });
  } catch (error: any) {
    console.error('Error saving mascot asset:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ACCOUNT, GUEST, LICENSE & ADMIN ENDPOINTS
// ==========================================

// 1. Client Auth Configuration
app.get('/api/auth/config', (_req, res) => {
  const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  const cleanClientId = rawClientId.replace(/^["']|["']$/g, '').trim();
  return res.json({
    googleClientId: cleanClientId,
    hasLicenseApi: Boolean(process.env.LICENSE_API_URL),
  });
});

// Helper giải mã an toàn Google ID Token JWT
function decodeGoogleJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    try {
      const parts = token.split('.');
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

// 2. Google Sign-In & Verification
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, email, name, picture, id } = req.body;
    let userEmail = email ? String(email).trim().toLowerCase() : '';
    let userName = name ? String(name).trim() : '';
    let userPicture = picture;
    let userId = id;

    // 1. Giải mã token payload từ credential nếu có
    if (credential && typeof credential === 'string') {
      const jwtPayload = decodeGoogleJwt(credential);
      if (jwtPayload) {
        if (!userEmail && jwtPayload.email) userEmail = String(jwtPayload.email).trim().toLowerCase();
        if (!userName && jwtPayload.name) userName = jwtPayload.name;
        if (!userPicture && jwtPayload.picture) userPicture = jwtPayload.picture;
        if (!userId && jwtPayload.sub) userId = jwtPayload.sub;
      }

      // 2. Cố gắng xác minh qua Google tokeninfo với timeout 4s
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const tokenResp = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
          { signal: controller.signal }
        ).catch(() => null);
        clearTimeout(timeout);

        if (tokenResp?.ok) {
          const gInfo = await tokenResp.json().catch(() => null);
          if (gInfo) {
            if (gInfo.email) userEmail = String(gInfo.email).trim().toLowerCase();
            if (gInfo.name) userName = gInfo.name;
            if (gInfo.picture) userPicture = gInfo.picture;
            if (gInfo.sub) userId = gInfo.sub;
          }
        }
      } catch (tokenErr) {
        // Nếu tokeninfo lỗi mạng, sử dụng payload đã giải mã
        console.warn('Google tokeninfo verification network note:', tokenErr);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Không thể xác định email Google hợp lệ' });
    }

    // Đọc user từ store / License API / Google Sheets và đồng bộ vai trò USERS.ROLE
    const user = await getOrCreateUser({
      email: userEmail,
      name: userName,
      picture: userPicture,
      id: userId,
    });

    return res.json({ success: true, user });
  } catch (err: any) {
    console.error('Error in google auth:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. User & Guest Status Check
app.get('/api/user/status', (req, res) => {
  try {
    const { guestId, email, userId } = req.query as { guestId?: string; email?: string; userId?: string };

    if (email || userId) {
      const user = findUserByEmailOrId(email || userId || '');
      if (user) {
        return res.json({
          isLoggedIn: true,
          user,
          role: user.role,
          plan: user.plan,
          quota: user.quota,
        });
      }
    }

    const guest = getOrCreateGuest(guestId || 'guest_default');
    return res.json({
      isLoggedIn: false,
      guestId: guest.guestId,
      role: 'GUEST' as const,
      plan: 'GUEST' as const,
      quota: guest.quota,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Guest Initialization
app.post('/api/user/guest-init', (req, res) => {
  try {
    const { guestId } = req.body;
    const guest = getOrCreateGuest(guestId);
    return res.json({ success: true, guest });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Consume Quota
app.post('/api/user/consume-quota', (req, res) => {
  try {
    const { guestId, email, userId, mode = 'easy' } = req.body;
    const result = consumeQuota({ guestId, email, userId, mode });
    if (!result.allowed) {
      return res.status(403).json(result);
    }
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. License Activation (Device Binding + Google Account)
app.post('/api/license/activate', async (req, res) => {
  try {
    const { licenseKey, email, userId, guestId, deviceId, deviceName } = req.body;
    const result = await activateLicenseKey({
      licenseKey,
      email,
      userId,
      guestId,
      deviceId,
      deviceName,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Middleware kiểm tra quyền Quản trị bắt buộc từ Database (USERS.ROLE = "ADMIN")
// Không hard-code Gmail quản trị. Không dùng process.env.ADMIN_EMAILS. Không fallback email.
const requireAdminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let identifier = (
    req.headers['x-user-email'] ||
    req.headers['x-user-id'] ||
    req.body?.adminEmail ||
    req.query?.adminEmail
  ) as string;

  const authHeader = req.headers['authorization'];
  if (!identifier && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.email) identifier = payload.email;
        else if (payload.sub) identifier = payload.sub;
      } else {
        identifier = token;
      }
    } catch {
      identifier = token;
    }
  }

  if (!identifier) {
    return res.status(403).json({
      success: false,
      error: 'Truy cập bị từ chối. Thiếu thông tin xác thực quản trị viên.',
      code: 'FORBIDDEN',
    });
  }

  let user = findUserByEmailOrId(identifier);

  // Nếu trong store cục bộ chưa phải ADMIN, kiểm tra trực tiếp từ License API / Google Sheets
  if ((!user || user.role !== 'ADMIN') && process.env.LICENSE_API_URL) {
    const remote = await fetchUserFromLicenseApi(identifier);
    if (remote?.role === 'ADMIN') {
      user = await getOrCreateUser({ email: identifier });
      user.role = 'ADMIN';
    }
  }

  // Bắt buộc USERS.ROLE === 'ADMIN'. Nếu không phải ADMIN -> 403.
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Truy cập bị từ chối. Quyền quản trị (USERS.ROLE = ADMIN) bắt buộc.',
      code: 'FORBIDDEN',
    });
  }

  next();
};

// Kiểm tra quyền quản trị nhanh cho Frontend
app.get('/api/admin/check-access', requireAdminMiddleware, (_req, res) => {
  return res.json({ allowed: true, role: 'ADMIN' });
});

// 7. Admin: System Stats (Chỉ ROLE = ADMIN)
app.get('/api/admin/stats', requireAdminMiddleware, (_req, res) => {
  try {
    const stats = getSystemStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. Admin: Users and Guests List (Chỉ ROLE = ADMIN)
app.get('/api/admin/users', requireAdminMiddleware, async (_req, res) => {
  try {
    const data = await getAllUsersAndGuests();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Admin: Update User (Chỉ ROLE = ADMIN)
app.post('/api/admin/update-user', requireAdminMiddleware, (req, res) => {
  try {
    const operatorEmail = (req.headers['x-user-email'] || req.headers['x-user-id'] || '') as string;
    const { email, role, plan, quota, isBlocked, expiresAt } = req.body;
    const result = adminUpdateUser({
      operatorEmail,
      email,
      role,
      plan,
      quota,
      isBlocked,
      expiresAt,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Cập nhật người dùng thất bại' });
    }
    return res.json({ success: true, user: result.user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9B. Admin: Create User (Chỉ ROLE = ADMIN - Thêm người dùng trực tiếp)
app.post('/api/admin/create-user', requireAdminMiddleware, (req, res) => {
  try {
    const { email, name, role, plan, quota, expiresAt } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email người dùng là bắt buộc' });
    }
    const result = adminCreateUser({
      email,
      name,
      role,
      plan,
      quota,
      expiresAt,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Thêm người dùng thất bại' });
    }
    return res.json({ success: true, user: result.user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 10. Admin: Get System Settings (Chỉ ROLE = ADMIN)
app.get('/api/admin/settings', requireAdminMiddleware, (_req, res) => {
  try {
    const settings = getSystemSettings();
    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 11. Admin: Update System Settings (Chỉ ROLE = ADMIN)
app.post('/api/admin/settings', requireAdminMiddleware, async (req, res) => {
  try {
    const updated = updateSystemSettings(req.body);
    let remoteSync = false;
    let remoteStatus = 'LOCAL_STORED';

    // Thử đồng bộ với Google Apps Script nếu có action updateSettings
    if (process.env.LICENSE_API_URL) {
      try {
        const url = new URL(process.env.LICENSE_API_URL);
        url.searchParams.set('action', 'updateSettings');
        const resp = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        if (resp.ok) {
          const rJson = await resp.json().catch(() => null);
          if (rJson && rJson.success) {
            remoteSync = true;
            remoteStatus = 'SYNCED_GOOGLE_SHEETS';
          } else {
            remoteStatus = 'BACKEND_PENDING (Google Apps Script chưa hỗ trợ action updateSettings)';
          }
        } else {
          remoteStatus = 'BACKEND_PENDING (Google Apps Script HTTP non-200)';
        }
      } catch (e: any) {
        remoteStatus = `BACKEND_PENDING (${e.message})`;
      }
    }

    return res.json({
      success: true,
      settings: updated,
      remoteSync,
      remoteStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 12. Admin: Get all licenses (Chỉ ROLE = ADMIN)
app.get('/api/admin/licenses', requireAdminMiddleware, (_req, res) => {
  try {
    const licenses = getAllLicenses();
    return res.json({ success: true, licenses });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 13. Admin: Generate license (Chỉ ROLE = ADMIN)
app.post('/api/admin/licenses/create', requireAdminMiddleware, (req, res) => {
  try {
    const { plan, durationMonths, durationDays, maxDevices, assignedEmail, customerNote, reason } = req.body;
    const license = adminGenerateLicense({
      plan,
      durationMonths: durationMonths !== undefined ? Number(durationMonths) : undefined,
      durationDays: durationDays !== undefined ? Number(durationDays) : undefined,
      maxDevices: Number(maxDevices) || 1,
      assignedEmail,
      customerNote,
      reason,
    });
    return res.json({ success: true, license });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 14. Admin: Reset bound devices (Chuyển thiết bị) (Chỉ ROLE = ADMIN)
app.post('/api/admin/licenses/reset-devices', requireAdminMiddleware, (req, res) => {
  try {
    const { key, deviceId } = req.body;
    const result = adminResetLicenseDevices({ key, deviceId });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Reset thiết bị thất bại' });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 15. Admin: Toggle license status (Chỉ ROLE = ADMIN)
app.post('/api/admin/licenses/toggle-status', requireAdminMiddleware, (req, res) => {
  try {
    const { key, status } = req.body;
    const result = adminToggleLicenseStatus({ key, status });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Cập nhật trạng thái thất bại' });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 16. Admin: Delete license (Chỉ ROLE = ADMIN)
app.post('/api/admin/licenses/delete', requireAdminMiddleware, (req, res) => {
  try {
    const { key } = req.body;
    const result = adminDeleteLicense(key);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Xóa mã thất bại' });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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
