import { GoogleGenAI } from '@google/genai';
import { getRequestBody, handleCors, parseGeminiError } from './_lib/routeHelper';

function cleanAndParseJson(text: string): any {
  if (!text || typeof text !== 'string') return {};
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Không thể phân tích dữ liệu JSON từ mô hình thẩm định.');
  }
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng POST.',
    });
  }

  let oldTotalScore: number | null = null;
  try {
    const body = getRequestBody(req);
    const { previousResult, revisedNotes, revisedText } = body || {};

    const rawContent = revisedNotes || revisedText || '';
    // Bảo vệ giới hạn payload & context: Giới hạn tối đa 150.000 ký tự (~30.000 từ)
    const contentToEvaluate = typeof rawContent === 'string' ? rawContent.slice(0, 150000).trim() : '';

    if (!contentToEvaluate) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ARGUMENT',
        message: 'Nội dung bản sửa hoặc văn bản giải trình không được để trống.',
        scoreChanged: false,
        issuesChanged: false,
      });
    }

    const oldIssues = Array.isArray(previousResult?.redTeamCards) ? previousResult.redTeamCards : [];
    const oldCriteria = Array.isArray(previousResult?.rubricCriteria) ? previousResult.rubricCriteria : [];

    // FACT SAFETY: Không được mặc định điểm cũ = 70. Nếu không xác định được: oldTotalScore = null
    if (typeof previousResult?.evaluation?.score === 'number') {
      oldTotalScore = previousResult.evaluation.score;
    } else if (oldCriteria.length > 0) {
      oldTotalScore = oldCriteria.reduce((acc: number, c: any) => acc + (c.proposedScore || 0), 0);
    } else {
      oldTotalScore = null;
    }

    // Kiểm tra cấu hình API Key trên môi trường Vercel / Cloud
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[rescore-skkn] GEMINI_API_KEY is not configured in environment variables.');
      return res.status(503).json({
        success: false,
        code: 'RESCORE_AI_UNAVAILABLE',
        retryable: true,
        message: 'Chưa thể chấm lại lúc này do chưa cấu hình GEMINI_API_KEY trên môi trường triển khai. Kết quả đánh giá hiện tại được giữ nguyên.',
        previousScore: oldTotalScore,
        scoreChanged: false,
        issuesChanged: false,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Rút gọn tiêu chí và vấn đề để truyền vào prompt hiệu quả, tránh vượt quá giới hạn
    const compactCriteria = oldCriteria.map((c: any) => ({
      name: c.criterionName,
      score: c.proposedScore,
      max: c.maxScore,
      reason: c.deductionReason,
    }));

    const compactIssues = oldIssues.map((c: any) => ({
      id: c.id,
      issue: c.issueDetected,
      quote: c.relatedQuote,
      location: c.location,
      status: c.status,
    }));

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
- Tiêu chí Rubric cũ: ${JSON.stringify(compactCriteria)}
- Danh sách vấn đề phản biện cũ (Issues): ${JSON.stringify(compactIssues)}

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
        },
      });
    } catch (primaryErr) {
      console.warn('[rescore-skkn] Primary model (gemini-3.1-flash-lite) failed, trying gemini-3.8-flash:', primaryErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
    }

    const rawText = response?.text || '';
    const parsed = cleanAndParseJson(rawText);

    // Chuẩn hóa và bảo vệ tính an toàn của dữ liệu đầu ra
    const safeResult = {
      success: true,
      previousScore: oldTotalScore !== null ? oldTotalScore : (parsed.previousScore ?? null),
      newScore: typeof parsed.newScore === 'number' ? parsed.newScore : (oldTotalScore ?? 0),
      scoreDifference: typeof parsed.scoreDifference === 'number' ? parsed.scoreDifference : 0,
      fixedIssues: Array.isArray(parsed.fixedIssues) ? parsed.fixedIssues : [],
      remainingIssues: Array.isArray(parsed.remainingIssues) ? parsed.remainingIssues : [],
      newIssuesArisen: Array.isArray(parsed.newIssuesArisen) ? parsed.newIssuesArisen : [],
      newEvidenceAdded: Array.isArray(parsed.newEvidenceAdded) ? parsed.newEvidenceAdded : [],
      newFiguresAdded: Array.isArray(parsed.newFiguresAdded) ? parsed.newFiguresAdded : [],
      justificationForChange: parsed.justificationForChange || 'Đã đối soát nội dung chỉnh sửa với Rubric và hồ sơ phản biện.',
      issueComparisons: Array.isArray(parsed.issueComparisons) ? parsed.issueComparisons : [],
      updatedCriteria: Array.isArray(parsed.updatedCriteria) ? parsed.updatedCriteria : [],
    };

    return res.status(200).json(safeResult);
  } catch (error: any) {
    console.error('[rescore-skkn] Error during rescore processing:', error);
    const { status, message } = parseGeminiError(error);
    const finalStatus: number = (status === 429 || status === 503 || status === 403 || status === 400) ? status : 503;
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
}
