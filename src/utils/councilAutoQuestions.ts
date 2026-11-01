import type { CouncilQuestion, SKKNAnalysisResult } from '../types';

/** Bộ câu hỏi khởi tạo tại máy người dùng, độc lập nút hỏi thêm Gemini.
 * Chỉ dùng trích dẫn tìm thấy trong văn bản SKKN đang mở. */
export function buildCouncilQuestions(analysis: SKKNAnalysisResult, sourceText: string): CouncilQuestion[] {
  const text = (sourceText || '').trim();
  const existing = Array.isArray(analysis.councilQuestions) ? analysis.councilQuestions : [];
  if (text.length < 250) return existing;
  const groups = ['🟠 Cần chuẩn bị', '🔴 Câu hỏi khó', '🟡 Câu hỏi làm rõ'] as const;
  const results: CouncilQuestion[] = [];
  const normalized = (s: string) => s.toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const duplicate = (question: string) => [...existing, ...results].some(q => normalized(q.question) === normalized(question));
  const quoteInSource = (s?: string) => {
    const quote = (s || '').trim();
    return quote.length >= 24 && text.includes(quote) ? quote.slice(0, 350) : '';
  };
  const add = (difficulty: typeof groups[number], quote: string, location: string, question: string, why: string, evidence: string, strategy: string) => {
    if (!quote || duplicate(question) || results.filter(q => q.difficulty === difficulty).length >= 5) return;
    results.push({ id: `cq-auto-${difficulty === groups[0] ? 'p' : difficulty === groups[1] ? 'h' : 'c'}-${results.length + 1}`,
      difficulty, question, whyCouncilAsks: why, relatedLocation: location || 'Đoạn trích trong SKKN', sourceQuote: quote,
      requiredEvidenceToBring: evidence, suggestedAnswerStrategy: strategy });
  };
  // Ưu tiên phát hiện của bộ chấm, nhưng chỉ chấp nhận đoạn trích khớp nguyên văn.
  for (const issue of analysis.redTeamCards || []) {
    const quote = quoteInSource(issue.relatedQuote);
    if (!quote) continue;
    const topic = (issue.issueDetected || issue.affectedCriterion || 'nội dung nêu trong đoạn trích').trim();
    add(groups[1], quote, issue.location, issue.likelyCouncilQuestion?.trim() || `Tác giả giải trình như thế nào về vấn đề “${topic}” trong SKKN?`,
      issue.whyItMatters || topic, issue.requiredEvidence || 'Minh chứng thực tế tương ứng', issue.resolutionGuidance || 'Trả lời bằng minh chứng đã có trong hồ sơ.');
    add(groups[0], quote, issue.location, `Khi bảo vệ SKKN, tác giả sẽ trình bày và chứng minh nội dung “${topic}” như thế nào?`,
      `Chuẩn bị thuyết minh nội dung: ${topic}`, issue.requiredEvidence || 'Tài liệu, sản phẩm và số liệu gốc', 'Trình bày cách triển khai và chỉ rõ minh chứng trong hồ sơ.');
    add(groups[2], quote, issue.location, `Đề nghị tác giả làm rõ phạm vi và căn cứ của nội dung “${topic}” được nêu trong SKKN?`,
      `Đoạn trích cần được giải thích rõ: ${topic}`, issue.requiredEvidence || 'Căn cứ và diễn giải từ hồ sơ', 'Làm rõ đúng phạm vi và giới hạn của kết luận.');
  }
  for (const criterion of analysis.rubricCriteria || []) {
    const quote = quoteInSource(criterion.shortQuote);
    if (!quote) continue;
    const topic = criterion.criterionName || 'tiêu chí đánh giá';
    add(groups[0], quote, criterion.basisLocation, `Tác giả đã triển khai nội dung liên quan đến tiêu chí “${topic}” theo quy trình nào?`,
      `Hội đồng cần đối chiếu tiêu chí ${topic} với hồ sơ.`, criterion.existingEvidence || 'Hồ sơ minh chứng cho tiêu chí', 'Trình bày quy trình và dẫn chứng từ SKKN.');
    add(groups[1], quote, criterion.basisLocation, `Những minh chứng nào chứng tỏ kết quả thuộc tiêu chí “${topic}” là đáng tin cậy và có thể kiểm chứng?`,
      criterion.limitations || `Kiểm chứng tiêu chí ${topic}.`, criterion.missingEvidence || 'Bảng số liệu, sản phẩm hoặc tài liệu đối chứng', 'Nêu minh chứng thực có; chỉ rõ giới hạn nếu thiếu đối chứng.');
    add(groups[2], quote, criterion.basisLocation, `Đề nghị giải thích cụ thể cách xác định và đánh giá tiêu chí “${topic}” từ đoạn SKKN này?`,
      `Làm rõ phương pháp đánh giá ${topic}.`, criterion.existingEvidence || 'Định nghĩa, tiêu chí và kết quả đã nêu', 'Diễn giải cách đo lường theo đúng nội dung SKKN.');
  }
  // Khi dữ liệu rubric ít: tạo câu hỏi bám các đoạn thực trong văn bản, không bịa dữ kiện.
  const paragraphs = text.split(/\n\s*\n|\n/).map(s => s.trim()).filter(s => s.length >= 85);
  const samples = paragraphs.length ? paragraphs : (text.match(/[\s\S]{100,450}/g) || []);
  const indices = [...new Set(Array.from({ length: Math.min(samples.length, 20) }, (_, i) => Math.floor(i * samples.length / Math.min(samples.length, 20))))];
  for (const index of indices) {
    const segment = samples[index];
    const quote = segment.slice(0, Math.min(190, segment.length)).trim();
    if (!quoteInSource(quote)) continue;
    const location = `Đoạn nguồn ${index + 1} (xem trích dẫn)`;
    const subject = quote.length > 90 ? `${quote.slice(0, 90)}…` : quote;
    add(groups[0], quote, location, `Khi bảo vệ SKKN, tác giả sẽ giải thích quá trình thực hiện nội dung “${subject}” như thế nào?`,
      'Chuẩn bị diễn giải nội dung cụ thể được trình bày trong hồ sơ.', 'Tài liệu và minh chứng thực tế liên quan đến đoạn trích', 'Trình bày mục đích, cách thực hiện và minh chứng đúng với hồ sơ.');
    add(groups[1], quote, location, `Hội đồng có thể kiểm chứng tính chính xác và hiệu quả của nội dung “${subject}” bằng những căn cứ nào?`,
      'Phản biện mức độ kiểm chứng của thông tin trong đoạn trích.', 'Dữ liệu gốc, minh chứng hoặc tài liệu đối chứng nếu có', 'Phân biệt điều đã chứng minh và điều chưa đủ dữ liệu.');
    add(groups[2], quote, location, `Đề nghị tác giả làm rõ ý nghĩa, đối tượng áp dụng và giới hạn của nội dung “${subject}”?`,
      'Cần diễn giải cụ thể phạm vi nội dung trong SKKN.', 'Phần mô tả và bằng chứng đi kèm đoạn trích', 'Giải thích chính xác, không mở rộng quá nội dung đã trình bày.');
  }
  return [...existing, ...results];
}
