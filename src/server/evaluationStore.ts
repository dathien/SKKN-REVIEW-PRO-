import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EvaluationItem, EvaluationVersionItem, StorageAuditLog, StorageStats, SKKNAnalysisResult } from '../types/index';
import { findUserByEmailOrId, ROOT_ADMIN_EMAILS } from './authStore';

const DATA_DIR = path.resolve('data');
const EVALUATIONS_FILE = path.join(DATA_DIR, 'evaluations_store.json');

interface EvaluationsStoreData {
  evaluations: Record<string, EvaluationItem>;
  auditLogs: StorageAuditLog[];
}

let store: EvaluationsStoreData = {
  evaluations: {},
  auditLogs: [],
};

// Khởi tạo thư mục và tải dữ liệu từ đĩa
export function ensureDefaultEvaluations() {
  const tinHoc11Id = 'eval_tinhoc11_dathien2412';
  if (!store.evaluations[tinHoc11Id]) {
    const defaultTinHoc11: EvaluationItem = ({
      id: tinHoc11Id,
      userId: 'admin_6461746869',
      userEmail: 'dathien2412@gmail.com',
      title: 'Ứng dụng lập trình Python và dự án thực tế nhằm nâng cao năng lực giải quyết vấn đề môn Tin học 11',
      subject: 'Tin học',
      gradeLevel: 'Lớp 11',
      score: 35.0,
      status: 'COMPLETED',
      versionCount: 1,
      currentVersion: 1,
      originalFileName: 'SKKN_Tin_Hoc_11_Thuat_Toan_Python.docx',
      originalFileSize: 48520,
      wordCount: 4250,
      createdAt: '2026-10-18T10:15:00.000Z',
      updatedAt: '2026-10-18T10:15:00.000Z',
      originalText: 'Trong chương trình GDPT 2018 môn Tin học 11, mạch kiến thức Khoa học máy tính và Lập trình đóng vai trò then chốt nhưng học sinh thường gặp khó khăn trong việc tư duy thuật toán và hiện thực hóa bài toán thực tế...',
      draftText: 'Trong chương trình GDPT 2018 môn Tin học 11, mạch kiến thức Khoa học máy tính và Lập trình đóng vai trò then chốt nhưng học sinh thường gặp khó khăn trong việc tư duy thuật toán và hiện thực hóa bài toán thực tế...',
      changeSet: [],
      versionsHistory: [
        {
          version: 1,
          createdAt: '2026-10-18T10:15:00.000Z',
          score: 35.0,
          notes: 'Thẩm định lần đầu (Bản gốc v1) - Đạt 35.0/100 điểm Rubric',
          resultSummary: 'Đề tài có ý tưởng tốt nhưng thiếu minh chứng định lượng đối chứng và đứt gãy logic từ lý thuyết đến thực hành.',
        }
      ],
      analysisResult: {
        metadata: {
          title: 'Ứng dụng lập trình Python và dự án thực tế nhằm nâng cao năng lực giải quyết vấn đề môn Tin học 11',
          author: 'GV. Hồ Nguyễn Đa Thiện',
          organization: 'Trường THPT Chuyên',
          field: 'Khoa học Tự nhiên & Công nghệ - Phương pháp dạy học Tin học',
          subject: 'Tin học',
          gradeLevel: 'Lớp 11',
          targetAudience: 'Học sinh lớp 11 Tin học năm học 2024 - 2025',
          applicationTimeframe: 'Tháng 09/2024 - Tháng 04/2025',
          scope: 'Phạm vi tổ chuyên môn Tin học cấp trường',
          appliedRubricName: 'Phiếu chấm Sáng kiến Giáo dục theo Hướng dẫn Sở GD&ĐT (Khung 100 điểm)',
          isOfficialRubric: true,
          evidenceAdequacy: 'Cần bổ sung minh chứng',
          evidenceAdequacyReason: 'Tài liệu có ý tưởng ứng dụng dự án thực tế nhưng thiếu số liệu khảo sát đối chứng trước - sau can thiệp và chưa có sản phẩm minh chứng độc lập của học sinh.',
        },
        sectionsMap: [
          { id: 'sec-1', sectionCode: 'Phần I', name: 'ĐẶT VẤN ĐỀ (Lý do chọn đề tài, mục tiêu, đối tượng)', page: 'Mục 1', summary: 'Nêu thực trạng học sinh học cú pháp thụ động, thiếu năng lực giải quyết vấn đề thực tế trong lập trình Python 11.' },
          { id: 'sec-2', sectionCode: 'Phần II.1', name: 'CƠ SỞ LÝ LUẬN VÀ THỰC TIỄN', page: 'Mục 2', summary: 'Dạy học theo định hướng phát triển phẩm chất, năng lực CT GDPT 2018.' },
          { id: 'sec-3', sectionCode: 'Phần II.2', name: 'THỰC TRẠNG TRƯỚC KHI ÁP DỤNG', page: 'Mục 3', summary: 'Khảo sát 75 học sinh đầu năm: 68% cảm thấy lập trình khó hiểu và khô khan.' },
          { id: 'sec-4', sectionCode: 'Phần II.3', name: 'CÁC BIỆN PHÁP THỰC HIỆN', page: 'Mục 4', summary: 'Thiết kế 3 dự án nhỏ: (1) Quản lý thư viện trường; (2) Mô phỏng chuyển động vật lý; (3) Chatbot tra cứu thông tin.' },
          { id: 'sec-5', sectionCode: 'Phần II.4', name: 'HIỆU QUẢ CỦA SÁNG KIẾN', page: 'Mục 5', summary: 'Tỷ lệ học sinh hứng thú tăng, số lượng hoàn thành bài tập dự án đạt 82%.' },
          { id: 'sec-6', sectionCode: 'Phần III', name: 'KẾT LUẬN VÀ KIẾN NGHỊ', page: 'Mục 6', summary: 'Đề tài mang lại hiệu quả thiết thực, kiến nghị bổ sung thêm máy tính cho phòng máy.' },
        ],
        rubricCriteria: [
          {
            id: 'rub-1',
            groupName: '1. Tính cấp thiết & Cơ sở nghiên cứu',
            criterionName: 'Xác định vấn đề thực tiễn, tính cấp thiết và mục tiêu nghiên cứu',
            maxScore: 10,
            proposedScore: 7.0,
            basisLocation: 'Phần I, Mục 1.1',
            shortQuote: 'Học sinh thường học thuộc lòng cú pháp Python nhưng khi gặp bài toán thực tế thì bế tắc không biết phân tích bài toán.',
            strengths: 'Xác định đúng điểm nghẽn thực tiễn của học sinh lớp 11 khi học lập trình theo CT 2018.',
            limitations: 'Phần khảo sát ban đầu chưa công bố phiếu đo đạc cụ thể và thang đo chuẩn hóa.',
            existingEvidence: 'Số liệu tổng hợp ban đầu tại 2 lớp 11.',
            missingEvidence: 'Phiếu khảo sát chi tiết kèm minh chứng thời điểm thu thập dữ liệu.',
            deductionReason: 'Trừ 3.0 điểm do công cụ điều tra thực trạng thiếu mẫu phiếu định lượng.',
            improvementGuidance: 'Bổ sung mẫu phiếu khảo sát năng lực giải quyết vấn đề vào Phụ lục.',
            priority: 'Trung bình',
          },
          {
            id: 'rub-2',
            groupName: '2. Tính mới & Tính sáng tạo',
            criterionName: 'Mức độ mới về giải pháp, cách tiếp cận và tính sáng tạo khoa học',
            maxScore: 20,
            proposedScore: 6.5,
            basisLocation: 'Phần II.3, Mục 4.1',
            shortQuote: 'Sáng kiến đưa việc lập trình dự án Python thực tế vào từng tiết dạy thực hành.',
            strengths: 'Có chuyển biến từ bài tập thuần lý thuyết sang bài tập gắn với bối cảnh đời sống.',
            limitations: 'Dự án thực tế chưa có quy trình phân bậc năng lực rõ rệt; nhiều bài tập vẫn mang tính mẫu giáo khoa.',
            existingEvidence: 'Mô tả 3 dự án nhỏ trong nội dung.',
            missingEvidence: 'Khung phân hóa nhiệm vụ theo 4 mức độ nhận thức (Biết, Hiểu, Vận dụng, Vận dụng cao).',
            deductionReason: 'Trừ 13.5 điểm do tính mới chưa được định vị rõ ở quy trình sư phạm độc lập.',
            improvementGuidance: 'Xây dựng bảng ma trận kỹ năng thuật toán gắn với từng dự án cụ thể.',
            priority: 'Cao',
          },
          {
            id: 'rub-3',
            groupName: '3. Tính khoa học & Logic sư phạm',
            criterionName: 'Phương pháp nghiên cứu, chuỗi logic từ thực trạng đến giải pháp',
            maxScore: 20,
            proposedScore: 7.5,
            basisLocation: 'Phần II.2 & II.3',
            shortQuote: 'Tiến hành thực nghiệm tại lớp 11A1 và đối chứng tại lớp 11A2.',
            strengths: 'Có bố trí lớp thực nghiệm và lớp đối chứng cùng khối.',
            limitations: 'Chưa kiểm định tính tương đương năng lực đầu vào giữa 2 lớp trước can thiệp.',
            existingEvidence: 'Bảng điểm tổng kết học kỳ.',
            missingEvidence: 'Bài kiểm tra Pre-test kiểm soát biến đầu vào.',
            deductionReason: 'Trừ 12.5 điểm vì thiếu kiểm soát biến độc lập và đứt gãy logic đối chứng.',
            improvementGuidance: 'Bổ sung kết quả bài kiểm tra tiền thực nghiệm chứng minh độ tương đương của 2 nhóm.',
            priority: 'Cao',
          },
          {
            id: 'rub-4',
            groupName: '4. Tính thực tiễn & Khả năng áp dụng',
            criterionName: 'Phù hợp điều kiện cơ sở vật chất, khả năng nhân rộng trong bộ môn',
            maxScore: 15,
            proposedScore: 6.0,
            basisLocation: 'Phần II.3, Mục 4.3',
            shortQuote: 'Học sinh tiếp tục hoàn thiện code trên máy tính cá nhân ở nhà.',
            strengths: 'Phù hợp với xu thế chuyển đổi số và tự học.',
            limitations: 'Phụ thuộc thiết bị ở nhà, chưa có giải pháp cho học sinh gia đình khó khăn.',
            existingEvidence: 'Link GitHub/Replit nộp bài của học sinh.',
            missingEvidence: 'Kế hoạch học tập offline hoặc bố trí giờ máy tại trường cho học sinh không có máy.',
            deductionReason: 'Trừ 9.0 điểm vì chưa đảm bảo tính công bằng học tập cho mọi đối tượng.',
            improvementGuidance: 'Bổ sung phương án phòng máy tính mở ngoài giờ để học sinh thực hành.',
            priority: 'Trung bình',
          },
          {
            id: 'rub-5',
            groupName: '5. Tính hiệu quả & Minh chứng xác thực',
            criterionName: 'Kết quả đo lường, dữ liệu đối sánh trước - sau và minh chứng cụ thể',
            maxScore: 20,
            proposedScore: 4.5,
            basisLocation: 'Phần II.4',
            shortQuote: '100% học sinh đều say mê lập trình và đạt kết quả kiểm tra học kỳ tiến bộ vượt bậc.',
            strengths: 'Có số liệu thống kê điểm kiểm tra giữa kỳ và cuối kỳ.',
            limitations: 'Tuyên bố 100% học sinh say mê là khẳng định tuyệt đối thiếu căn cứ khoa học; chênh lệch cỡ mẫu chưa được giải trình.',
            existingEvidence: 'Bảng điểm 2 lớp.',
            missingEvidence: 'Phiếu thu thập dữ liệu thô và bài làm thực tế của học sinh.',
            deductionReason: 'Trừ 15.5 điểm do lỗi khẳng định vượt quá bằng chứng và thiếu hồ sơ minh chứng độc lập.',
            improvementGuidance: 'Điều chỉnh tỷ lệ phần trăm thực tế theo số liệu khảo sát và đính kèm bài làm mẫu.',
            priority: 'Cao',
          },
          {
            id: 'rub-6',
            groupName: '6. Khả năng chuyển giao & Nhân rộng',
            criterionName: 'Khả năng chuyển giao và nhân rộng giải pháp',
            maxScore: 15,
            proposedScore: 3.5,
            basisLocation: 'Phần III, Kết luận',
            shortQuote: 'Sáng kiến có thể triển khai đại trà cho tất cả các trường THPT trong tỉnh.',
            strengths: 'Có tinh thần chia sẻ kinh nghiệm trong sinh hoạt tổ chuyên môn.',
            limitations: 'Chưa có cẩm nang hướng dẫn hoặc giáo án mẫu 5512 hoàn chỉnh để đồng nghiệp tự triển khai.',
            existingEvidence: 'Biên bản sinh hoạt tổ chuyên môn.',
            missingEvidence: 'Bộ tài liệu hướng dẫn chuyển giao giải pháp độc lập.',
            deductionReason: 'Trừ 11.5 điểm do thiếu học liệu chuyển giao và điều kiện triển khai cụ thể.',
            improvementGuidance: 'Bổ sung ít nhất 01 kế hoạch bài dạy minh họa hoàn chỉnh theo CV 5512.',
            priority: 'Trung bình',
          },
        ],
        redTeamCards: [
          {
            id: 'rtc-1',
            location: 'Mục 3.2 & Mục 4.1',
            issueDetected: 'Thiếu bài kiểm tra năng lực đầu vào đối chứng (Pre-test) giữa hai nhóm học sinh',
            impactLevel: 'Cao',
            affectedCriterion: 'Tiêu chí 3: Tính khoa học & Logic sư phạm',
            status: 'Chưa xử lý',
            councilChallenge: 'Hội đồng nhận thấy hai lớp 11A1 và 11A2 có điểm đầu vào chênh lệch. Căn cứ nào để khẳng định kết quả tiến bộ là do phương pháp của tác giả chứ không phải do tố chất sẵn có?',
            mitigationStrategy: 'Bổ sung kết quả bài kiểm tra tiền thực nghiệm chứng minh độ tương đương p > 0.05.',
          },
          {
            id: 'rtc-2',
            location: 'Mục 5, Trang 22',
            issueDetected: 'Khẳng định "100% học sinh say mê lập trình" vượt quá dữ liệu minh chứng',
            impactLevel: 'Cao',
            affectedCriterion: 'Tiêu chí 5: Tính hiệu quả & Minh chứng xác thực',
            status: 'Chưa xử lý',
            councilChallenge: 'Tuyên bố 100% không còn học sinh sợ lập trình mang tính cảm tính, thiếu chuẩn mực khoa học.',
            mitigationStrategy: 'Điều chỉnh thành: "84.5% học sinh phản hồi tích cực theo thang đo khảo sát 75 học sinh".',
          },
          {
            id: 'rtc-3',
            location: 'Mục 4.3',
            issueDetected: 'Phụ thuộc vào máy tính cá nhân ở nhà, thiếu phương án công bằng học tập',
            impactLevel: 'Trung bình',
            affectedCriterion: 'Tiêu chí 4: Tính thực tiễn & Khả năng áp dụng',
            status: 'Chưa xử lý',
            councilChallenge: 'Nếu học sinh ở vùng sâu hoặc gia đình không có máy tính thì sáng kiến này áp dụng thế nào?',
            mitigationStrategy: 'Bổ sung phương án thực hành theo cặp (Pair programming) tại phòng máy trường.',
          },
        ],
        novelty: {
          noveltyScore: 35,
          overallVerdict: 'Ý tưởng áp dụng dự án thực tế trong lập trình Python là hướng đi phù hợp, tuy nhiên điểm mới cần được cấu trúc thành quy trình dạy học rõ ràng thay vì đồng nhất với việc cho học sinh làm bài tập.',
          strengths: ['Đã tiếp cận mạch kiến thức mới của CT 2018', 'Bài tập có tính ứng dụng thực tế'],
          limitations: ['Chưa có quy trình dạy học 4 bước độc lập', 'Công cụ phổ thông'],
        },
        evidenceChain: [
          { claim: 'Học sinh tiến bộ vượt bậc sau 6 tháng', evidenceFound: 'Bảng điểm tổng kết học kỳ', verdict: 'Chưa đủ căn cứ đối chứng', gap: 'Thiếu điểm Pre-test đầu vào' },
          { claim: 'Học sinh hứng thú với dự án thực tế', evidenceFound: 'Ảnh chụp sản phẩm học tập', verdict: 'Có minh chứng một phần', gap: 'Thiếu phiếu khảo sát thái độ độc lập' },
        ],
        dataAnomalies: [
          { description: 'Chênh lệch cỡ mẫu giữa 75 học sinh nêu trong thuyết minh và 72 bài kiểm tra thu được', location: 'Mục 5, Bảng 1', severity: 'Cảnh báo' },
        ],
        logicGaps: [
          { description: 'Đứt gãy giữa mục tiêu phát triển tư duy thuật toán với việc chỉ giao bài tập lập trình mẫu', location: 'Mục 4.2' },
        ],
        suggestions: [
          {
            id: 'sug-1',
            targetSection: 'Mục 5 - Đánh giá hiệu quả',
            originalText: 'Sau thời gian áp dụng giải pháp, 100% học sinh trong lớp đều say mê học tập và không còn em nào cảm thấy sợ lập trình Python.',
            problem: 'Cách diễn đạt khẳng định tuyệt đối 100% thiếu chuẩn mực khoa học.',
            whyRevise: 'Hội đồng sẽ chất vấn gay gắt về tính trung thực và độ tin cậy của số liệu nếu đưa ra tuyên bố tuyệt đối.',
            lightRevision: 'Sau thời gian áp dụng giải pháp, đại đa số học sinh trong lớp đều hào hứng tham gia và tự tin hơn trong các giờ học lập trình Python.',
            academicRevision: 'Kết quả khảo sát sau 6 tháng áp dụng cho thấy 84.5% học sinh phản hồi tích cực và ghi nhận sự tiến bộ rõ rệt về năng lực giải quyết vấn đề bằng ngôn ngữ Python.',
            deepRevision: 'Dữ liệu đo lường định lượng trên mẫu N=75 học sinh ghi nhận: 84.5% học sinh đánh giá tích cực về mức độ hứng thú; tỷ lệ học sinh đạt chuẩn đầu ra kỹ năng lập trình tăng 21.3% so với giai đoạn trước can thiệp (p < 0.05).',
          },
        ],
        councilQuestions: [
          {
            id: 'cq-1',
            difficulty: '🔴 Câu hỏi khó',
            question: 'Hội đồng chất vấn: Đề tài nêu áp dụng dự án thực tế, xin tác giả chỉ rõ quy trình đánh giá sản phẩm của từng cá nhân khi học sinh làm việc theo nhóm?',
            whyCouncilAsks: 'Kiểm tra tính cá thể hóa trong đánh giá năng lực học sinh.',
            relatedLocation: 'Mục 4.2',
            requiredEvidenceToBring: 'Rubric đánh giá sản phẩm dự án có phân định đóng góp của từng thành viên.',
            suggestedAnswerStrategy: 'Trình bày Rubric 3 tiêu chí: Đóng góp ý tưởng thuật toán, Hiện thực hóa mã code, và Thuyết trình bảo vệ sản phẩm.',
          },
        ],
        priorityActions: [
          { id: 'pa-1', title: 'Đính chính con số khảo sát và bỏ các khẳng định 100%', urgency: 'Khẩn cấp' },
          { id: 'pa-2', title: 'Bổ sung Rubric đánh giá năng lực đối chứng vào Phụ lục', urgency: 'Quan trọng' },
        ],
        createdAt: '2026-10-18T10:15:00.000Z',
      },
    } as any);
    store.evaluations[tinHoc11Id] = defaultTinHoc11;
    saveEvaluationsStore();
  }
}

export function loadEvaluationsStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(EVALUATIONS_FILE)) {
      const content = fs.readFileSync(EVALUATIONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      store = {
        evaluations: parsed.evaluations || {},
        auditLogs: parsed.auditLogs || [],
      };
    }
    // Đảm bảo hồ sơ Tin học 11 điểm 35.0 của người dùng dathien2412@gmail.com luôn được khôi phục bền vững
    ensureDefaultEvaluations();
  } catch (err) {
    console.error('Không thể tải evaluations_store.json, khởi tạo bộ nhớ rỗng:', err);
    ensureDefaultEvaluations();
  }
}

// Tự động tải từ đĩa khi nạp module
loadEvaluationsStore();

export function reloadEvaluationsStoreFromDisk() {
  try {
    if (fs.existsSync(EVALUATIONS_FILE)) {
      const content = fs.readFileSync(EVALUATIONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed) {
        store.evaluations = parsed.evaluations || {};
        store.auditLogs = parsed.auditLogs || [];
      }
    }
    ensureDefaultEvaluations();
  } catch (_) {
    ensureDefaultEvaluations();
  }
}

export function saveEvaluationsStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(EVALUATIONS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Không thể lưu evaluations_store.json vào đĩa:', err);
  }
}

// Helper ghi nhận nhật ký lưu trữ bền vững (STORAGE_AUDIT)
function addAuditLog(log: Omit<StorageAuditLog, 'auditId' | 'timestamp'>) {
  const auditItem: StorageAuditLog = {
    auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  store.auditLogs.unshift(auditItem);
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(0, 500);
  }
  saveEvaluationsStore();
  return auditItem;
}

// -------------------------------------------------------------
// GỌI GOOGLE APPS SCRIPT ĐỂ ĐỒNG BỘ VÀO GOOGLE SHEETS & GOOGLE DRIVE
// -------------------------------------------------------------
async function callAppsScriptStorage(action: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!process.env.LICENSE_API_URL) {
    return { success: false, error: 'Chưa cấu hình LICENSE_API_URL' };
  }

  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        serverSecret: process.env.APPS_SCRIPT_SECRET || '',
        ...payload,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!resp.ok) {
      return { success: false, error: `Apps Script HTTP ${resp.status}` };
    }

    const data = await resp.json().catch(() => null);
    if (!data) {
      return { success: false, error: 'Không thể giải mã phản hồi từ Apps Script' };
    }

    return { success: Boolean(data.success), data, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối Apps Script' };
  }
}

// -------------------------------------------------------------
// CÁC HÀM NGHIỆP VỤ LƯU TRỮ HỒ SƠ CÁ NHÂN (QUYỀN RIÊNG TƯ TUYỆT ĐỐI)
// -------------------------------------------------------------

/**
 * 1. LẤY DANH SÁCH HỒ SƠ CÁ NHÂN CỦA NGƯỜI DÙNG HIỆN TẠI
 * Người dùng A tuyệt đối không xem được hồ sơ của người dùng B
 */
export async function listUserEvaluations(userEmail: string, userId?: string): Promise<EvaluationItem[]> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = userEmail.toLowerCase().trim();

  // Đồng bộ từ Google Sheets nếu có kết nối
  if (process.env.LICENSE_API_URL) {
    try {
      const remote = await callAppsScriptStorage('listEvaluations', {
        userEmail: cleanEmail,
        userId: userId || cleanEmail,
        operatorEmail: cleanEmail,
      });
      if (remote.success && Array.isArray(remote.data?.evaluations)) {
        remote.data.evaluations.forEach((remoteItem: EvaluationItem) => {
          if (remoteItem.id && remoteItem.userEmail?.toLowerCase() === cleanEmail) {
            store.evaluations[remoteItem.id] = {
              ...store.evaluations[remoteItem.id],
              ...remoteItem,
            };
          }
        });
        saveEvaluationsStore();
      }
    } catch (_) {}
  }

  const list = Object.values(store.evaluations).filter(item => {
    return item.userEmail.toLowerCase() === cleanEmail || (userId && item.userId === userId);
  });

  // Sắp xếp mới nhất lên đầu
  list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  return list;
}

/**
 * 2. TẠO HỒ SƠ MỚI HOẶC LƯU FILE BAN ĐẦU
 */
export async function createEvaluationRecord(params: {
  userEmail: string;
  userId?: string;
  title: string;
  subject?: string;
  gradeLevel?: string;
  score?: number;
  originalFileName?: string;
  originalFileSize?: number;
  wordCount?: number;
  originalFileBase64?: string;
  originalText?: string;
  draftText?: string;
  changeSet?: any[];
  analysisResult?: SKKNAnalysisResult;
}): Promise<{ success: boolean; evaluation?: EvaluationItem; error?: string }> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const evalId = `eval_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const initialScore = typeof params.score === 'number'
    ? params.score
    : (params.analysisResult?.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? 0);

  const initialVersion = 1;
  const versionsHistory: EvaluationVersionItem[] = [];

  if (params.analysisResult) {
    versionsHistory.push({
      version: initialVersion,
      createdAt: now,
      score: initialScore,
      notes: 'Bản phân tích đầu tiên',
      resultSummary: (params.analysisResult as any)?.executiveSummary?.strengthsSummary || params.analysisResult.metadata?.title || '',
    });
  }

  const initialOriginalText = params.originalText || (params.analysisResult?.metadata as any)?.originalText || '';
  const initialDraftText = params.draftText || initialOriginalText;
  const initialChangeSet = params.changeSet || params.analysisResult?.changeSet || [];

  const newEval: EvaluationItem = {
    id: evalId,
    userId: params.userId || cleanEmail,
    userEmail: cleanEmail,
    title: params.title.trim() || 'Hồ sơ Sáng kiến kinh nghiệm',
    subject: params.subject?.trim() || 'Chung',
    gradeLevel: params.gradeLevel?.trim() || '',
    score: initialScore,
    status: params.analysisResult ? 'COMPLETED' : 'DRAFT',
    versionCount: initialVersion,
    currentVersion: initialVersion,
    originalFileName: params.originalFileName || '',
    originalFileSize: params.originalFileSize || 0,
    wordCount: params.wordCount || 0,
    createdAt: now,
    updatedAt: now,
    analysisResult: params.analysisResult ? {
      ...params.analysisResult,
      changeSet: initialChangeSet,
    } : undefined,
    originalText: initialOriginalText,
    draftText: initialDraftText,
    changeSet: initialChangeSet,
    versionsHistory,
  };

  store.evaluations[evalId] = newEval;
  saveEvaluationsStore();

  addAuditLog({
    action: 'CREATE',
    userId: newEval.userId,
    userEmail: cleanEmail,
    evaluationId: evalId,
    details: `Tạo hồ sơ mới: "${newEval.title}" (v1)`,
    status: 'SUCCESS',
  });

  // Đồng bộ lên Google Drive & Google Sheets qua Apps Script
  if (process.env.LICENSE_API_URL) {
    const remote = await callAppsScriptStorage('createEvaluation', {
      userEmail: cleanEmail,
      userId: newEval.userId,
      evaluation: {
        id: newEval.id,
        title: newEval.title,
        subject: newEval.subject,
        gradeLevel: newEval.gradeLevel,
        score: newEval.score,
        status: newEval.status,
        versionCount: newEval.versionCount,
        currentVersion: newEval.currentVersion,
        originalFileName: newEval.originalFileName,
        originalFileSize: newEval.originalFileSize,
        wordCount: newEval.wordCount,
        createdAt: newEval.createdAt,
        updatedAt: newEval.updatedAt,
      },
      originalFileBase64: params.originalFileBase64 || '',
      analysisResult: params.analysisResult ? JSON.stringify(params.analysisResult) : '',
      operatorEmail: cleanEmail,
    });

    if (remote.success && remote.data?.evaluation) {
      if (remote.data.evaluation.driveFolderId) newEval.driveFolderId = remote.data.evaluation.driveFolderId;
      if (remote.data.evaluation.latestResultFileId) newEval.latestResultFileId = remote.data.evaluation.latestResultFileId;
      if (remote.data.evaluation.originalFileId) newEval.originalFileId = remote.data.evaluation.originalFileId;
      saveEvaluationsStore();
    }
  }

  return { success: true, evaluation: newEval };
}

/**
 * 3. LẤY CHI TIẾT MỘT HỒ SƠ (BẢO VỆ QUYỀN SỞ HỮU)
 */
export async function getEvaluationDetail(evalId: string, userEmail: string): Promise<{ success: boolean; evaluation?: EvaluationItem; error?: string }> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = userEmail.toLowerCase().trim();
  const item = store.evaluations[evalId];

  if (!item) {
    return { success: false, error: 'Không tìm thấy hồ sơ' };
  }

  // BẢO MẬT: Kiểm tra quyền sở hữu
  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: 'Bảo mật: Thầy/Cô không có quyền truy cập hồ sơ này' };
  }

  // Nếu chưa có kết quả phân tích trong bộ nhớ cục bộ, tải từ Google Drive qua Apps Script
  if (!item.analysisResult && process.env.LICENSE_API_URL && item.driveFolderId) {
    const remote = await callAppsScriptStorage('getEvaluation', {
      evaluationId: evalId,
      userEmail: cleanEmail,
      operatorEmail: cleanEmail,
    });
    if (remote.success && remote.data?.analysisResult) {
      try {
        item.analysisResult = typeof remote.data.analysisResult === 'string'
          ? JSON.parse(remote.data.analysisResult)
          : remote.data.analysisResult;
        saveEvaluationsStore();
      } catch (_) {}
    }
  }

  return { success: true, evaluation: item };
}

/**
 * 4. LƯU KẾT QUẢ PHÂN TÍCH AI (TỰ ĐỘNG LƯU SAU KHI CHẤM)
 */
export async function saveEvaluationResultRecord(params: {
  evaluationId: string;
  userEmail: string;
  analysisResult: SKKNAnalysisResult;
  title?: string;
  subject?: string;
  score?: number;
  draftText?: string;
  changeSet?: any[];
}): Promise<{ success: boolean; evaluation?: EvaluationItem; error?: string }> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store.evaluations[params.evaluationId];

  if (!item) {
    return { success: false, error: 'Không tìm thấy hồ sơ để lưu kết quả' };
  }

  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ' };
  }

  const now = new Date().toISOString();
  const calculatedScore = typeof params.score === 'number'
    ? params.score
    : (params.analysisResult.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? item.score);

  // CẬP NHẬT KẾT QUẢ & BẢN NHÁP (BẢO VỆ NGUYÊN BẢN V1 KHÔNG THAY ĐỔI)
  item.analysisResult = params.analysisResult;
  item.score = calculatedScore;
  item.status = 'COMPLETED';
  item.updatedAt = now;
  if (params.title?.trim()) item.title = params.title.trim();
  if (params.subject?.trim()) item.subject = params.subject.trim();

  // Lưu bản nháp đã sửa và danh sách thay đổi changeSet
  if (params.draftText !== undefined) {
    item.draftText = params.draftText;
    // Nếu hồ sơ cũ chưa có originalText, khởi tạo từ draftText ban đầu để giữ v1
    if (!item.originalText) {
      item.originalText = params.draftText;
    }
  }

  const finalChangeSet = params.changeSet || params.analysisResult.changeSet || item.changeSet || [];
  item.changeSet = finalChangeSet;
  if (item.analysisResult) {
    item.analysisResult.changeSet = finalChangeSet;
  }

  // Cập nhật lịch sử phiên bản
  item.versionsHistory = item.versionsHistory || [];
  const existingV = item.versionsHistory.find(v => v.version === item.currentVersion);
  if (existingV) {
    existingV.score = calculatedScore;
    existingV.createdAt = now;
    existingV.resultSummary = (params.analysisResult as any)?.executiveSummary?.strengthsSummary || params.analysisResult.metadata?.title || '';
  } else {
    item.versionsHistory.push({
      version: item.currentVersion,
      createdAt: now,
      score: calculatedScore,
      notes: `Lưu kết quả phiên bản ${item.currentVersion}`,
      resultSummary: (params.analysisResult as any)?.executiveSummary?.strengthsSummary || params.analysisResult.metadata?.title || '',
    });
  }

  saveEvaluationsStore();

  addAuditLog({
    action: 'SAVE_RESULT',
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: item.id,
    details: `Lưu kết quả đánh giá cho "${item.title}" (Điểm: ${item.score})`,
    status: 'SUCCESS',
  });

  // Đồng bộ lên Google Drive / Sheets
  if (process.env.LICENSE_API_URL) {
    const remote = await callAppsScriptStorage('saveEvaluationResult', {
      evaluationId: item.id,
      userEmail: cleanEmail,
      version: item.currentVersion,
      score: item.score,
      status: item.status,
      title: item.title,
      analysisResult: JSON.stringify(params.analysisResult),
      operatorEmail: cleanEmail,
    });
    if (remote.success && remote.data?.latestResultFileId) {
      item.latestResultFileId = remote.data.latestResultFileId;
      saveEvaluationsStore();
    }
  }

  return { success: true, evaluation: item };
}

/**
 * 5. TẠO PHIÊN BẢN MỚI KHI ĐÁNH GIÁ LẠI (KHÔNG GHI ĐÈ PHIÊN BẢN CŨ)
 */
export async function createEvaluationVersionRecord(params: {
  evaluationId: string;
  userEmail: string;
  newAnalysisResult: SKKNAnalysisResult;
  newScore?: number;
  notes?: string;
}): Promise<{ success: boolean; evaluation?: EvaluationItem; error?: string }> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store.evaluations[params.evaluationId];

  if (!item) {
    return { success: false, error: 'Không tìm thấy hồ sơ để tạo phiên bản mới' };
  }

  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ' };
  }

  const now = new Date().toISOString();
  const newVersionNumber = (item.versionCount || 1) + 1;
  const calculatedScore = typeof params.newScore === 'number'
    ? params.newScore
    : (params.newAnalysisResult.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? item.score);

  item.versionCount = newVersionNumber;
  item.currentVersion = newVersionNumber;
  item.score = calculatedScore;
  item.status = 'REVISED';
  item.updatedAt = now;
  item.analysisResult = params.newAnalysisResult;

  item.versionsHistory = item.versionsHistory || [];
  item.versionsHistory.push({
    version: newVersionNumber,
    createdAt: now,
    score: calculatedScore,
    notes: params.notes || `Phiên bản chỉnh sửa v${newVersionNumber}`,
    resultSummary: (params.newAnalysisResult as any)?.executiveSummary?.strengthsSummary || params.newAnalysisResult.metadata?.title || '',
  });

  saveEvaluationsStore();

  addAuditLog({
    action: 'NEW_VERSION',
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: item.id,
    details: `Tạo phiên bản mới v${newVersionNumber} cho "${item.title}" (Điểm mới: ${calculatedScore})`,
    status: 'SUCCESS',
  });

  // Đồng bộ Drive / Sheets
  if (process.env.LICENSE_API_URL) {
    const remote = await callAppsScriptStorage('createEvaluationVersion', {
      evaluationId: item.id,
      userEmail: cleanEmail,
      version: newVersionNumber,
      score: calculatedScore,
      status: item.status,
      notes: params.notes || `Phiên bản v${newVersionNumber}`,
      analysisResult: JSON.stringify(params.newAnalysisResult),
      operatorEmail: cleanEmail,
    });
    if (remote.success && remote.data?.latestResultFileId) {
      item.latestResultFileId = remote.data.latestResultFileId;
      saveEvaluationsStore();
    }
  }

  return { success: true, evaluation: item };
}

/**
 * 6. ĐỔI TÊN HỒ SƠ
 */
export async function renameEvaluationRecord(params: {
  evaluationId: string;
  userEmail: string;
  newTitle: string;
}): Promise<{ success: boolean; evaluation?: EvaluationItem; error?: string }> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store.evaluations[params.evaluationId];

  if (!item) {
    return { success: false, error: 'Không tìm thấy hồ sơ để đổi tên' };
  }

  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ' };
  }

  const trimmed = params.newTitle.trim();
  if (!trimmed) {
    return { success: false, error: 'Tên hồ sơ không được để trống' };
  }

  const oldTitle = item.title;
  item.title = trimmed;
  item.updatedAt = new Date().toISOString();
  saveEvaluationsStore();

  addAuditLog({
    action: 'RENAME',
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: item.id,
    details: `Đổi tên hồ sơ từ "${oldTitle}" thành "${trimmed}"`,
    status: 'SUCCESS',
  });

  if (process.env.LICENSE_API_URL) {
    await callAppsScriptStorage('renameEvaluation', {
      evaluationId: item.id,
      newTitle: trimmed,
      userEmail: cleanEmail,
      operatorEmail: cleanEmail,
    }).catch(() => {});
  }

  return { success: true, evaluation: item };
}

/**
 * 7. XÓA HỒ SƠ (XÓA BẢN GHI VÀ CHUYỂN FILE DRIVE VÀO THÙNG RÁC)
 */
export async function deleteEvaluationRecord(params: {
  evaluationId: string;
  userEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store.evaluations[params.evaluationId];

  if (!item) {
    return { success: false, error: 'Không tìm thấy hồ sơ để xóa' };
  }

  if (params.evaluationId === 'eval_tinhoc11_dathien2412') {
    return { success: false, error: 'Bảo vệ hệ thống: Không thể xóa hồ sơ chuẩn SKKN Tin học 11' };
  }

  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ' };
  }

  const deletedTitle = item.title;
  const deletedFolderId = item.driveFolderId;
  delete store.evaluations[params.evaluationId];
  saveEvaluationsStore();

  addAuditLog({
    action: 'DELETE',
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: params.evaluationId,
    details: `Xóa hồ sơ: "${deletedTitle}"`,
    status: 'SUCCESS',
  });

  if (process.env.LICENSE_API_URL) {
    await callAppsScriptStorage('deleteEvaluation', {
      evaluationId: params.evaluationId,
      driveFolderId: deletedFolderId,
      userEmail: cleanEmail,
      operatorEmail: cleanEmail,
    }).catch(() => {});
  }

  return { success: true };
}

/**
 * 8. LẤY THỐNG KÊ LƯU TRỮ (BẢO TOÀN TÍNH RIÊNG TƯ)
 * Admin chỉ xem số lượng tổng hợp, không lộ nội dung riêng tư
 */
export async function getStorageStatsData(requesterEmail: string): Promise<StorageStats> {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = requesterEmail.toLowerCase().trim();
  const allList = Object.values(store.evaluations);

  const totalEvaluations = allList.length;
  let totalVersions = 0;
  let totalSizeBytes = 0;
  let userEvaluationsCount = 0;

  allList.forEach(item => {
    totalVersions += (item.versionCount || 1);
    totalSizeBytes += (item.originalFileSize || 0);
    if (item.userEmail.toLowerCase() === cleanEmail) {
      userEvaluationsCount += 1;
    }
  });

  return {
    totalEvaluations,
    totalVersions,
    totalSizeBytes,
    userEvaluationsCount,
  };
}

// Tự động tải dữ liệu ban đầu
loadEvaluationsStore();
