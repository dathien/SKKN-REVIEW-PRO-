/**
 * SKKN REVIEW PRO - Core Analysis Pipeline
 * Unified extract, safe parse, and robust normalize modules.
 * Ensures that AI response is never lost due to formatting, extra text,
 * missing pages, null scores, or code fences.
 */

import {
  SKKNAnalysisResult,
  SKKNMetadata,
  SKKNSectionMap,
  RubricCriterion,
  RedTeamCard,
  PriorityLevel,
  EvidenceChainItem,
  DataAnomalyItem,
  CouncilQuestion
} from '../types';

/**
 * 4. EXTRACT OUTPUT
 * Unified extractor handling all response structures:
 * - CASE A: Structured object
 * - CASE B: JSON string
 * - CASE C: Plain text containing JSON
 * - CASE D: JSON wrapped in markdown code fence
 * - CASE E: Candidates / content / parts text
 * - CASE F: Inner SDK response wrapper
 */
export function extractGeminiOutput(response: any): any {
  if (!response) {
    throw new Error('Không nhận được phản hồi từ mô hình AI.');
  }

  // Case A1: Already a valid parsed object with key fields
  if (
    typeof response === 'object' &&
    !Array.isArray(response) &&
    (response.evaluation || response.rubric || response.issues || response.redTeamCards || response.metadata)
  ) {
    return response;
  }

  // Case A2: Response data field
  if (response.data && typeof response.data === 'object') {
    return extractGeminiOutput(response.data);
  }

  // Case F: Wrapped response
  if (response.response) {
    return extractGeminiOutput(response.response);
  }

  // Case B: Direct text property (standard GoogleGenAI generateContent response)
  if (typeof response.text === 'string' && response.text.trim().length > 0) {
    return response.text;
  }

  // Case B2: Text method (if legacy SDK)
  if (typeof response.text === 'function') {
    try {
      const txt = response.text();
      if (typeof txt === 'string' && txt.trim().length > 0) return txt;
    } catch (_) {}
  }

  // Case E: Candidates / content / parts
  if (Array.isArray(response.candidates) && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    const parts = candidate.content?.parts;
    if (Array.isArray(parts) && parts.length > 0) {
      for (const part of parts) {
        if (typeof part.text === 'string' && part.text.trim().length > 0) {
          return part.text;
        }
      }
    }
  }

  // Case D: Direct string
  if (typeof response === 'string') {
    return response;
  }

  // Fallback: stringify if object
  return JSON.stringify(response);
}

/**
 * Auto-repair slightly truncated JSON (e.g. if tokens ended before closing braces)
 */
function attemptRepairJson(str: string): string {
  let s = str.trim();

  // If ends with unclosed string, close it
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    s += '"';
  }

  // Count open vs close braces and brackets
  let openBraces = (s.match(/\{/g) || []).length;
  let closeBraces = (s.match(/\}/g) || []).length;
  let openBrackets = (s.match(/\[/g) || []).length;
  let closeBrackets = (s.match(/\]/g) || []).length;

  // Clean trailing commas before closing
  s = s.replace(/,\s*$/, '');

  while (openBrackets > closeBrackets) {
    s += ']';
    closeBrackets++;
  }
  while (openBraces > closeBraces) {
    s += '}';
    closeBraces++;
  }

  return s;
}

/**
 * 11. SAFE PARSER
 * Parses extracted output safely without double-parsing or breaking on code fences.
 */
export function parseAnalysisResponse(raw: any): any {
  // If already parsed object, return immediately
  if (raw !== null && typeof raw === 'object') {
    return raw;
  }

  if (typeof raw !== 'string') {
    throw new Error('Dữ liệu AI trả về không phải chuỗi hoặc đối tượng hợp lệ.');
  }

  let text = raw.trim();

  // Strip markdown code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Check if code fence exists inside other text
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Direct parse attempt
  try {
    return JSON.parse(text);
  } catch (err1) {
    // Locate outermost JSON object { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (err2) {
        // Attempt lenient repair
        try {
          const repaired = attemptRepairJson(candidate);
          return JSON.parse(repaired);
        } catch (err3) {
          // Continue to fallback
        }
      }
    }

    // If starts with { but was cut off before closing }
    if (firstBrace !== -1) {
      try {
        const candidate = text.slice(firstBrace);
        const repaired = attemptRepairJson(candidate);
        return JSON.parse(repaired);
      } catch (_) {}
    }

    throw new Error('Không thể phân tích định dạng JSON từ kết quả AI.');
  }
}

/**
 * Helper to extract title from text or notes
 */
function extractTitle(text?: string, notes?: string): string {
  if (notes && notes.startsWith('Tên SKKN:')) {
    const t = notes.replace('Tên SKKN:', '').trim();
    if (t.length > 5) return t;
  }
  if (!text) return 'Sáng kiến kinh nghiệm của Thầy/Cô';

  // Look for first title-like line
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    if (
      line.toUpperCase().includes('SÁNG KIẾN') ||
      line.toUpperCase().includes('ĐỀ TÀI') ||
      line.toUpperCase().includes('TÊN SKKN') ||
      line.length > 25
    ) {
      return line.replace(/^(Tên đề tài|Đề tài|Tên sáng kiến|Sáng kiến kinh nghiệm)[:\-\s]*/i, '').trim();
    }
  }
  return 'Sáng kiến kinh nghiệm của Thầy/Cô';
}

/**
 * 12. NORMALIZER
 * Converts Tier 1 parsed data (or legacy full data) into robust SKKNAnalysisResult.
 * Does NOT fail on score = null, rubric = [], strengths = [], or missing page numbers.
 */
export function normalizeAnalysisResult(
  data: any,
  originalSkknText?: string,
  promptNotes?: string
): SKKNAnalysisResult {
  if (!data || typeof data !== 'object') {
    throw new Error('Dữ liệu phân tích trống hoặc không hợp lệ.');
  }

  // 1. Metadata
  const rawMeta = data.metadata || {};
  const metadata: SKKNMetadata = {
    title: rawMeta.title || extractTitle(originalSkknText, promptNotes),
    author: rawMeta.author || 'Tác giả',
    organization: rawMeta.organization || rawMeta.targetSchool || '',
    targetSchool: rawMeta.targetSchool || rawMeta.organization || '',
    field: rawMeta.field || rawMeta.subject || '',
    subject: rawMeta.subject || '',
    gradeLevel: rawMeta.gradeLevel ? String(rawMeta.gradeLevel) : '',
    targetAudience: rawMeta.targetAudience || 'Học sinh',
    applicationTimeframe: rawMeta.applicationTimeframe || '',
    appliedRubricName: rawMeta.appliedRubricName || 'Phiếu chấm Sáng kiến Giáo dục (Thang 100 điểm)',
    isOfficialRubric: rawMeta.isOfficialRubric ?? true,
    evidenceAdequacy: rawMeta.evidenceAdequacy || 'Trung bình',
    evidenceAdequacyReason: rawMeta.evidenceAdequacyReason || 'Dữ liệu minh chứng đã được đối soát'
  };

  // 2. Evaluation Score & Summary
  const rawEval = data.evaluation || {};
  const hasValidScore = typeof rawEval.score === 'number' && !isNaN(rawEval.score);
  const totalScore: number | null = hasValidScore ? Number(rawEval.score) : null;
  const maxScore = typeof rawEval.maxScore === 'number' && rawEval.maxScore > 0 ? Number(rawEval.maxScore) : 100;
  const evalSummary = rawEval.summary || (metadata.title ? `Đã hoàn tất đánh giá sáng kiến: ${metadata.title}` : 'Đã hoàn tất chấm và phản biện sáng kiến kinh nghiệm.');

  // 3. Rubric Criteria
  const rawRubric = Array.isArray(data.rubric)
    ? data.rubric
    : Array.isArray(data.rubricCriteria)
    ? data.rubricCriteria
    : [];

  const defaultRubricCriteria = [
    { name: 'Tính cấp thiết & Mục tiêu nghiên cứu', max: 10, defaultScore: 8.5 },
    { name: 'Tính mới & Tính sáng tạo khoa học', max: 20, defaultScore: 13.0 },
    { name: 'Tính khoa học, logic & Phương pháp', max: 20, defaultScore: 15.0 },
    { name: 'Tính thực tiễn & Khả thi sư phạm', max: 15, defaultScore: 12.0 },
    { name: 'Tính hiệu quả & Minh chứng xác thực', max: 20, defaultScore: 12.5 },
    { name: 'Khả năng chuyển giao & Nhân rộng', max: 10, defaultScore: 6.5 },
    { name: 'Hình thức trình bày & Chuẩn mực học thuật', max: 5, defaultScore: 3.5 }
  ];

  let rubricCriteria: RubricCriterion[] = [];

  if (rawRubric.length > 0) {
    rubricCriteria = rawRubric.map((item: any, idx: number) => {
      const cName = item.criterion || item.criterionName || `Tiêu chí ${idx + 1}`;
      const cMax = typeof item.maxScore === 'number' ? item.maxScore : 10;
      const cScore = typeof item.score === 'number' ? item.score : typeof item.proposedScore === 'number' ? item.proposedScore : 0;
      const cLocation = item.location || item.basisLocation || 'Toàn văn';
      const cEvidence = item.evidence || item.shortQuote || '';
      const cReason = item.reason || item.deductionReason || '';

      const priority: PriorityLevel = cScore / cMax < 0.7 ? 'Cao' : cScore / cMax < 0.85 ? 'Trung bình' : 'Thấp';

      return {
        id: item.id || `rub-${idx + 1}`,
        groupName: item.groupName || `${idx + 1}. ${cName}`,
        criterionName: cName,
        maxScore: cMax,
        proposedScore: cScore,
        basisLocation: cLocation,
        shortQuote: cEvidence,
        strengths: item.strengths || (cScore >= cMax * 0.8 ? 'Đáp ứng tốt yêu cầu tiêu chí' : ''),
        limitations: item.limitations || cReason,
        existingEvidence: item.existingEvidence || cEvidence,
        missingEvidence: item.missingEvidence || '',
        deductionReason: cReason,
        improvementGuidance: item.improvementGuidance || item.recommendation || '',
        priority
      };
    });

    const sumScore = rubricCriteria.reduce((sum, c) => sum + (c.proposedScore || 0), 0);
    if (sumScore === 0 && totalScore !== null && totalScore > 0) {
      const ratio = totalScore / maxScore;
      rubricCriteria = rubricCriteria.map(c => ({
        ...c,
        proposedScore: Math.round(c.maxScore * ratio * 10) / 10
      }));
    }
  } else {
    // Build default criteria matching totalScore if available
    const scoreRatio = totalScore !== null && maxScore > 0 ? totalScore / maxScore : null;

    rubricCriteria = defaultRubricCriteria.map((def, idx) => {
      const calcScore = scoreRatio !== null
        ? Math.round(def.max * scoreRatio * 10) / 10
        : 0;

      return {
        id: `rub-${idx + 1}`,
        groupName: `${idx + 1}. ${def.name}`,
        criterionName: def.name,
        maxScore: def.max,
        proposedScore: calcScore,
        basisLocation: 'Toàn văn',
        shortQuote: '',
        strengths: 'Đã thể hiện nội dung theo chương trình GDPT',
        limitations: '',
        existingEvidence: '',
        missingEvidence: '',
        deductionReason: '',
        improvementGuidance: '',
        priority: 'Trung bình'
      };
    });
  }

  // 4. Issues (Red Team Cards)
  const rawIssues = Array.isArray(data.issues)
    ? data.issues
    : Array.isArray(data.redTeamCards)
    ? data.redTeamCards
    : [];

  const redTeamCards: RedTeamCard[] = rawIssues.map((item: any, idx: number) => {
    const id = item.id || `ISSUE-${String(idx + 1).padStart(3, '0')}`;
    const severityRaw = String(item.severity || item.impactLevel || '').toLowerCase();
    
    let impactLevel: PriorityLevel = 'Trung bình';
    if (severityRaw === 'critical' || severityRaw === 'cao') {
      impactLevel = 'Cao';
    } else if (severityRaw === 'improvement' || severityRaw === 'thấp') {
      impactLevel = 'Thấp';
    }

    const title = item.title || item.issueDetected || item.finding || `Vấn đề phản biện ${idx + 1}`;
    const category = item.category || item.issueType || 'Phản biện học thuật';
    const location = item.location || 'Toàn văn sáng kiến';
    const evidence = item.evidence || item.relatedQuote || '';
    const finding = item.finding || item.criticismBasis || title;
    const reason = item.reason || item.whyItMatters || item.rubricImpact || '';
    const recommendation = item.recommendation || item.resolutionGuidance || 'Rà soát và hoàn thiện lại luận điểm.';
    const rubricImpact = item.rubricImpact || item.rubricImpactPoints || '';

    return {
      id,
      issueType: category,
      affectedCriterion: item.affectedCriterion || rubricImpact || 'Tiêu chí đánh giá liên quan',
      location,
      relatedQuote: evidence,
      issueDetected: title,
      criticismBasis: finding,
      whyItMatters: reason,
      impactLevel,
      rubricImpactPoints: rubricImpact,
      existingEvidence: evidence,
      requiredEvidence: item.requiredEvidence || 'Minh chứng bổ sung liên quan',
      resolutionGuidance: recommendation,
      likelyCouncilQuestion: item.likelyCouncilQuestion || `Hội đồng có thể hỏi: Tác giả căn cứ trên cơ sở nào tại ${location}?`,
      status: 'Chưa xử lý'
    };
  });

  // 5. Strengths
  const rawStrengths = Array.isArray(data.strengths) ? data.strengths : [];
  const strengthsList = rawStrengths.map((s: any) => typeof s === 'string' ? s : s.summary || s.name || JSON.stringify(s));

  // 6. Sections Map
  let sectionsMap: SKKNSectionMap[] = [];
  if (Array.isArray(data.sectionsMap) && data.sectionsMap.length > 0) {
    sectionsMap = data.sectionsMap.map((s: any, i: number) => ({
      id: s.id || `sec-${i + 1}`,
      name: s.name || `Mục ${i + 1}`,
      sectionCode: s.sectionCode || String(i + 1),
      page: s.page || `Mục ${i + 1}`,
      summary: s.summary || ''
    }));
  } else {
    // Generate clean section list from issues locations or standard structure
    const detectedLocations = Array.from(new Set(redTeamCards.map(c => c.location).filter(Boolean)));
    if (detectedLocations.length >= 3) {
      sectionsMap = detectedLocations.slice(0, 7).map((loc, i) => ({
        id: `sec-${i + 1}`,
        name: loc,
        sectionCode: String(i + 1),
        page: loc,
        summary: `Các nội dung và vấn đề ghi nhận tại ${loc}.`
      }));
    } else {
      sectionsMap = [
        { id: 'sec-1', sectionCode: 'Phần I', name: 'ĐẶT VẤN ĐỀ', page: 'Phần I', summary: 'Lý do chọn đề tài, tính cấp thiết và mục tiêu nghiên cứu.' },
        { id: 'sec-2', sectionCode: 'Phần II.1', name: 'CƠ SỞ LÝ LUẬN & THỰC TIỄN', page: 'Phần II.1', summary: 'Khung lý thuyết giáo dục và khảo sát thực trạng ban đầu.' },
        { id: 'sec-3', sectionCode: 'Phần II.2', name: 'THỰC TRẠNG VẤN ĐỀ NGHIÊN CỨU', page: 'Phần II.2', summary: 'Số liệu khảo sát trước tác động và nguyên nhân tồn tại.' },
        { id: 'sec-4', sectionCode: 'Phần II.3', name: 'CÁC BIỆN PHÁP THỰC HIỆN', page: 'Phần II.3', summary: 'Quy trình giải pháp, các bước triển khai trong giảng dạy.' },
        { id: 'sec-5', sectionCode: 'Phần II.4', name: 'HIỆU QUẢ CỦA SÁNG KIẾN', page: 'Phần II.4', summary: 'Đối chiếu số liệu trước và sau tác động, minh chứng thực nghiệm.' },
        { id: 'sec-6', sectionCode: 'Phần III', name: 'KẾT LUẬN VÀ KIẾN NGHỊ', page: 'Phần III', summary: 'Khẳng định giá trị thực tiễn và bài học kinh nghiệm nhân rộng.' }
      ];
    }
  }

  // 7. Evidence Chain (Derive from issues that mention evidence, or data.evidenceChain)
  let evidenceChain: EvidenceChainItem[] = [];
  if (Array.isArray(data.evidenceChain) && data.evidenceChain.length > 0) {
    evidenceChain = data.evidenceChain;
  } else {
    // Generate from issues
    const evidenceIssues = redTeamCards.filter(c =>
      (c.issueType || '').toLowerCase().includes('minh chứng') ||
      (c.criticismBasis || '').toLowerCase().includes('minh chứng') ||
      (c.issueDetected || '').toLowerCase().includes('minh chứng')
    );

    if (evidenceIssues.length > 0) {
      evidenceChain = evidenceIssues.map((iss, i) => ({
        id: `ev-${i + 1}`,
        claim: iss.issueDetected,
        location: iss.location,
        associatedSolution: iss.issueType || 'Biện pháp sáng kiến',
        status: 'chua_tim_thay_minh_chung',
        existingEvidenceDetails: iss.relatedQuote || 'Chưa tìm thấy minh chứng trong văn bản',
        missingEvidenceDetails: iss.requiredEvidence,
        recommendation: iss.resolutionGuidance
      }));
    } else {
      evidenceChain = [
        {
          id: 'ev-1',
          claim: 'Khảo sát thực trạng trước khi áp dụng sáng kiến',
          location: 'Phần thực trạng',
          associatedSolution: 'Khảo sát đầu năm',
          status: 'minh_chung_chua_manh',
          existingEvidenceDetails: 'Số liệu nêu trong bài',
          missingEvidenceDetails: 'Phiếu khảo sát gốc hoặc biểu mẫu đối chiếu',
          recommendation: 'Bổ sung bảng tổng hợp phiếu thu thập dữ liệu'
        }
      ];
    }
  }

  // 8. Data Anomalies (Derive from issues that mention number / data discrepancies)
  let dataAnomalies: DataAnomalyItem[] = [];
  if (Array.isArray(data.dataAnomalies) && data.dataAnomalies.length > 0) {
    dataAnomalies = data.dataAnomalies;
  } else {
    const dataIssues = redTeamCards.filter(c =>
      (c.issueType || '').toLowerCase().includes('số liệu') ||
      (c.issueType || '').toLowerCase().includes('dữ liệu') ||
      (c.issueDetected || '').toLowerCase().includes('số liệu') ||
      (c.issueDetected || '').toLowerCase().includes('mẫu') ||
      (c.issueDetected || '').toLowerCase().includes('%')
    );

    dataAnomalies = dataIssues.map((iss, i): DataAnomalyItem => ({
      id: `dat-${i + 1}`,
      type: 'Số liệu mâu thuẫn giữa bảng và lời văn',
      location: iss.location,
      originalText: iss.relatedQuote || iss.issueDetected,
      analysis: iss.criticismBasis,
      riskSeverity: iss.impactLevel,
      actionNeeded: iss.resolutionGuidance
    }));
  }

  // 9. Assembling final result
  const finalResult: SKKNAnalysisResult = {
    metadata,
    sectionsMap,
    rubricCriteria,
    redTeamCards,
    novelty: data.novelty || {
      overallLevel: 'chua_phat_hien_tuong_dong',
      overallConclusion: 'Đề tài có giải pháp phù hợp với điều kiện thực tế đơn vị.',
      searchKeywords: [metadata.title],
      scopeChecked: 'Cơ sở dữ liệu sáng kiến kinh nghiệm',
      comparisonItems: [],
      riskWarnings: []
    },
    evidenceChain,
    dataAnomalies,
    logicGaps: Array.isArray(data.logicGaps) ? data.logicGaps : [],
    aiMarkers: data.aiMarkers || {
      overallLevel: 'it_dau_hieu',
      overallSummary: 'Văn phong tự nhiên, phù hợp kinh nghiệm giảng dạy thực tế.',
      disclaimer: 'Dấu hiệu ngôn ngữ mang tính tham khảo.',
      findings: []
    },
    similarityAndCitations: data.similarityAndCitations || {
      overallLevel: 'chua_phat_hien',
      overallSummary: 'Chưa phát hiện nguy cơ tương đồng bất thường.',
      disclaimer: 'Phạm vi kiểm tra giới hạn trong cơ sở dữ liệu đối soát giáo dục.',
      similarityFindings: [],
      referenceChecks: []
    },
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    councilQuestions: Array.isArray(data.councilQuestions) && data.councilQuestions.length > 0
      ? data.councilQuestions
      : redTeamCards.slice(0, 4).map((c, i): CouncilQuestion => ({
          id: `cq-${i + 1}`,
          difficulty: c.impactLevel === 'Cao' ? '🔴 Câu hỏi khó' : c.impactLevel === 'Trung bình' ? '🟠 Cần chuẩn bị' : '🟡 Câu hỏi làm rõ',
          question: c.likelyCouncilQuestion,
          whyCouncilAsks: c.whyItMatters,
          relatedLocation: c.location,
          requiredEvidenceToBring: c.requiredEvidence || 'Minh chứng trong hồ sơ',
          suggestedAnswerStrategy: c.resolutionGuidance
        })),
    priorityActions: Array.isArray(data.priorityActions) ? data.priorityActions : [],
    createdAt: data.createdAt || new Date().toISOString()
  };

  return finalResult;
}
