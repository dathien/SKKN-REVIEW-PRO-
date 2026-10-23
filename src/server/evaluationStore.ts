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
      originalText: `BÁO CÁO SÁNG KIẾN KINH NGHIỆM
Tên sáng kiến: Ứng dụng lập trình Python và dự án thực tế nhằm nâng cao năng lực giải quyết vấn đề môn Tin học 11
Tác giả: GV. Hồ Nguyễn Đa Thiện - Trường THPT Chuyên

Phần I. ĐẶT VẤN ĐỀ
Trong chương trình GDPT 2018 môn Tin học 11, mạch kiến thức Khoa học máy tính và Lập trình đóng vai trò then chốt nhưng học sinh thường gặp khó khăn trong việc tư duy thuật toán và hiện thực hóa bài toán thực tế. Học sinh thường học thuộc lòng cú pháp Python nhưng khi gặp bài toán thực tế thì bế tắc không biết phân tích bài toán.

Phần II. NỘI DUNG VÀ BIỆN PHÁP THỰC HIỆN
Mục 3.2 & Mục 4.1. Tiến hành thực nghiệm tại lớp 11A1 và đối chứng tại lớp 11A2; sau một học kỳ áp dụng dự án Python, kết quả học tập lớp 11A1 cao hơn rõ rệt.
Mục 4.2. Thiết kế 3 dự án nhỏ: Quản lý thư viện, Mô phỏng chuyển động vật lý và Chatbot tra cứu thông tin.
Mục 4.3. Để hoàn thành các dự án lớn, học sinh tiếp tục hoàn thiện code trên máy tính cá nhân ở nhà và nộp link qua hệ thống trực tuyến.

Phần III. HIỆU QUẢ CỦA SÁNG KIẾN
Mục 5, Trang 22. Sau thời gian áp dụng giải pháp, 100% học sinh trong lớp đều say mê học tập và không còn em nào cảm thấy sợ lập trình Python.

Phần IV. KẾT LUẬN VÀ KIẾN NGHỊ
Sáng kiến mang lại hiệu quả thiết thực trong việc đổi mới phương pháp dạy học lập trình bậc THPT.`,
      draftText: `BÁO CÁO SÁNG KIẾN KINH NGHIỆM
Tên sáng kiến: Ứng dụng lập trình Python và dự án thực tế nhằm nâng cao năng lực giải quyết vấn đề môn Tin học 11
Tác giả: GV. Hồ Nguyễn Đa Thiện - Trường THPT Chuyên

Phần I. ĐẶT VẤN ĐỀ
Trong chương trình GDPT 2018 môn Tin học 11, mạch kiến thức Khoa học máy tính và Lập trình đóng vai trò then chốt nhưng học sinh thường gặp khó khăn trong việc tư duy thuật toán và hiện thực hóa bài toán thực tế. Học sinh thường học thuộc lòng cú pháp Python nhưng khi gặp bài toán thực tế thì bế tắc không biết phân tích bài toán.

Phần II. NỘI DUNG VÀ BIỆN PHÁP THỰC HIỆN
Mục 3.2 & Mục 4.1. Tiến hành thực nghiệm tại lớp 11A1 và đối chứng tại lớp 11A2; sau một học kỳ áp dụng dự án Python, kết quả học tập lớp 11A1 cao hơn rõ rệt.
Mục 4.2. Thiết kế 3 dự án nhỏ: Quản lý thư viện, Mô phỏng chuyển động vật lý và Chatbot tra cứu thông tin.
Mục 4.3. Để hoàn thành các dự án lớn, học sinh tiếp tục hoàn thiện code trên máy tính cá nhân ở nhà và nộp link qua hệ thống trực tuyến.

Phần III. HIỆU QUẢ CỦA SÁNG KIẾN
Mục 5, Trang 22. Sau thời gian áp dụng giải pháp, 100% học sinh trong lớp đều say mê học tập và không còn em nào cảm thấy sợ lập trình Python.

Phần IV. KẾT LUẬN VÀ KIẾN NGHỊ
Sáng kiến mang lại hiệu quả thiết thực trong việc đổi mới phương pháp dạy học lập trình bậc THPT.`,
      changeSet: [],
      customProposals: {},
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
            relatedQuote: 'Tiến hành thực nghiệm tại lớp 11A1 và đối chứng tại lớp 11A2; sau một học kỳ áp dụng dự án Python, kết quả học tập lớp 11A1 cao hơn rõ rệt.',
            issueDetected: 'Thiếu bài kiểm tra năng lực đầu vào đối chứng (Pre-test) giữa hai nhóm học sinh',
            impactLevel: 'Cao',
            affectedCriterion: 'Tiêu chí 3: Tính khoa học & Logic sư phạm',
            status: 'Chưa xử lý',
            criticismBasis: 'Quy chuẩn nghiên cứu sư phạm ứng dụng: Nghiên cứu đối chứng bắt buộc phải kiểm soát biến đầu vào thông qua bài kiểm tra năng lực tương đương (Pre-test) hoặc đối soát học lực học kỳ trước.',
            whyItMatters: 'Hội đồng sẽ chất vấn: Căn cứ nào khẳng định điểm số lớp 11A1 cao hơn là do phương pháp mới mà không phải do học sinh lớp này vốn đã có năng lực tư duy tốt hơn từ trước?',
            resolutionGuidance: 'Bổ sung giải trình về tính tương đương đầu vào hoặc điều chỉnh thiết kế nghiên cứu nêu rõ giới hạn khảo sát [CẦN BỔ SUNG MINH CHỨNG].',
            requiredEvidence: 'Phiếu khảo sát hoặc điểm số học kỳ trước làm đối chứng tương đương.',
            councilChallenge: 'Hội đồng nhận thấy hai lớp 11A1 và 11A2 có điểm đầu vào chênh lệch. Căn cứ nào để khẳng định kết quả tiến bộ là do phương pháp của tác giả chứ không phải do tố chất sẵn có?',
            mitigationStrategy: 'Bổ sung kết quả bài kiểm tra tiền thực nghiệm chứng minh độ tương đương p > 0.05.',
          },
          {
            id: 'rtc-2',
            location: 'Mục 5, Trang 22',
            relatedQuote: 'Sau thời gian áp dụng giải pháp, 100% học sinh trong lớp đều say mê học tập và không còn em nào cảm thấy sợ lập trình Python.',
            issueDetected: 'Khẳng định "100% học sinh say mê lập trình" vượt quá dữ liệu minh chứng',
            impactLevel: 'Cao',
            affectedCriterion: 'Tiêu chí 5: Tính hiệu quả & Minh chứng xác thực',
            status: 'Chưa xử lý',
            criticismBasis: 'Chuẩn mực đánh giá SKKN ngành GD&ĐT: Tuyệt đối không đưa ra các nhận định tuyệt đối hóa (100%) khi chưa có công cụ khảo sát chuẩn hóa độc lập.',
            whyItMatters: 'Tuyên bố 100% say mê học tập là khẳng định cảm tính, thiếu chuẩn mực khoa học, dễ bị giám khảo trừ điểm nặng về tính trung thực và phương pháp nghiên cứu.',
            resolutionGuidance: 'Điều chỉnh diễn đạt chuẩn xác theo số liệu khảo sát thực tế, không dùng từ tuyệt đối [CẦN BỔ SUNG SỐ LIỆU THỰC TẾ].',
            requiredEvidence: 'Phiếu khảo sát thái độ học tập hoặc biên bản dự giờ thực tế.',
            councilChallenge: 'Tuyên bố 100% không còn học sinh sợ lập trình mang tính cảm tính, thiếu chuẩn mực khoa học.',
            mitigationStrategy: 'Điều chỉnh theo tỷ lệ khảo sát thực tế có đối chiếu.',
          },
          {
            id: 'rtc-3',
            location: 'Mục 4.3',
            relatedQuote: 'Để hoàn thành các dự án lớn, học sinh tiếp tục hoàn thiện code trên máy tính cá nhân ở nhà và nộp link qua hệ thống trực tuyến.',
            issueDetected: 'Phụ thuộc vào máy tính cá nhân ở nhà, thiếu phương án công bằng học tập',
            impactLevel: 'Trung bình',
            affectedCriterion: 'Tiêu chí 4: Tính thực tiễn & Khả năng áp dụng',
            status: 'Chưa xử lý',
            criticismBasis: 'Nguyên tắc sư phạm: Giải pháp giáo dục phải bảo đảm tính khả thi và công bằng học tập cho mọi học sinh, kể cả học sinh không có thiết bị cá nhân ở nhà.',
            whyItMatters: 'Giám khảo có thể đánh giá sáng kiến khó nhân rộng đại trà nếu phụ thuộc vào điều kiện kinh tế gia đình của học sinh.',
            resolutionGuidance: 'Bổ sung phương án hỗ trợ học sinh thực hành tại trường hoặc ghép nhóm học tập (Pair programming).',
            requiredEvidence: 'Kế hoạch mở phòng máy ngoài giờ hoặc quy chế làm việc nhóm.',
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
            id: 'sug-rtc-1',
            targetSection: 'Mục 3.2 & Mục 4.1',
            originalText: 'Tiến hành thực nghiệm tại lớp 11A1 và đối chứng tại lớp 11A2; sau một học kỳ áp dụng dự án Python, kết quả học tập lớp 11A1 cao hơn rõ rệt.',
            problem: 'Thiếu bài kiểm tra năng lực đầu vào đối chứng (Pre-test) giữa hai nhóm học sinh.',
            whyRevise: 'Nghiên cứu đối chứng bắt buộc phải kiểm soát biến thiên đầu vào để khẳng định tính khoa học của giải pháp.',
            basis: 'Quy chuẩn nghiên cứu sư phạm ứng dụng và tiêu chuẩn đánh giá SKKN.',
            category: 'Tính khoa học & Logic sư phạm',
            revisionGoal: 'Chuẩn hóa thiết kế thực nghiệm và minh bạch giới hạn nghiên cứu đối chứng.',
            howToRevise: 'Bổ sung giải trình về độ tương đương đầu vào giữa hai lớp 11A1 và 11A2.',
            lightRevision: 'Tiến hành thực nghiệm tại lớp 11A1 và đối chứng tại lớp 11A2. Sau một học kỳ triển khai các dự án Python, kết quả ghi nhận học sinh lớp 11A1 có sự chuyển biến tích cực trong việc giải quyết bài toán lập trình.',
            academicRevision: 'Nghiên cứu được triển khai thực nghiệm sư phạm có đối chứng giữa hai nhóm học sinh: lớp thực nghiệm (11A1) và lớp đối chứng (11A2). Do chưa thể tiến hành bài kiểm tra tiền thực nghiệm (Pre-test) diện rộng, tác giả đã đối soát điểm số học kỳ trước để bảo đảm sự tương đồng tương đối về năng lực ban đầu [GV điền: điểm số cụ thể], đồng thời lưu ý giới hạn này trong phạm vi nghiên cứu.',
            deepRevision: 'Quy trình can thiệp sư phạm được thiết lập theo mô hình đối chứng: lớp thực nghiệm 11A1 áp dụng học tập theo dự án, lớp đối chứng 11A2 dạy theo phương pháp truyền thống. Về biến kiểm soát đầu vào: điểm trung bình môn Toán - Tin của hai nhóm trước can thiệp được đối chiếu ở mức tương đương. Toàn bộ bảng thống kê và phiếu quan sát thực nghiệm được đính kèm tại Phụ lục số 2 [CẦN BỔ SUNG MINH CHỨNG ĐỐI CHỨNG].',
            missingEvidenceAlert: 'Cần bổ sung phiếu khảo sát hoặc điểm số học kỳ trước làm đối chứng tương đương.',
            insertPosition: 'Mục 3.2 & Mục 4.1'
          },
          {
            id: 'sug-rtc-2',
            targetSection: 'Mục 5, Trang 22',
            originalText: 'Sau thời gian áp dụng giải pháp, 100% học sinh trong lớp đều say mê học tập và không còn em nào cảm thấy sợ lập trình Python.',
            problem: 'Cách diễn đạt khẳng định tuyệt đối 100% thiếu chuẩn mực khoa học.',
            whyRevise: 'Hội đồng sẽ chất vấn gay gắt về tính trung thực và độ tin cậy của số liệu nếu đưa ra tuyên bố tuyệt đối.',
            basis: 'Chuẩn mực đánh giá SKKN ngành GD&ĐT và quy tắc liêm chính khoa học.',
            category: 'Tính hiệu quả & Minh chứng xác thực',
            revisionGoal: 'Chuẩn hóa ngôn từ, loại bỏ khẳng định tuyệt đối và bám sát số liệu khảo sát thực tế.',
            howToRevise: 'Điều chỉnh diễn đạt theo kết quả phiếu điều tra thực tế, không dùng từ 100%.',
            lightRevision: 'Sau thời gian áp dụng giải pháp, đại đa số học sinh trong lớp đều hào hứng tham gia và tự tin hơn trong các giờ học lập trình Python.',
            academicRevision: 'Kết quả đánh giá sau quá trình áp dụng giải pháp cho thấy phần lớn học sinh đã hình thành thái độ học tập chủ động và cải thiện rõ rệt năng lực thuật toán [GV điền: tỷ lệ % theo phiếu khảo sát thực tế].',
            deepRevision: 'Dựa trên phiếu khảo sát thái độ và bài kiểm tra kỹ năng thực hành thu được tại lớp 11A1: đa số học sinh ghi nhận sự chuyển biến tích cực về hứng thú học tập và năng lực giải quyết vấn đề bằng Python. Các dữ liệu định lượng cụ thể và phiếu điều tra gốc được lưu trữ tại Phụ lục [CẦN BỔ SUNG SỐ LIỆU KHẢO SÁT THỰC TẾ].',
            missingEvidenceAlert: 'Cần đính kèm mẫu phiếu khảo sát và bảng số liệu thô tại Phụ lục.',
            insertPosition: 'Mục 5, Trang 22'
          },
          {
            id: 'sug-rtc-3',
            targetSection: 'Mục 4.3',
            originalText: 'Để hoàn thành các dự án lớn, học sinh tiếp tục hoàn thiện code trên máy tính cá nhân ở nhà và nộp link qua hệ thống trực tuyến.',
            problem: 'Phụ thuộc vào máy tính cá nhân ở nhà, thiếu phương án công bằng học tập.',
            whyRevise: 'Sáng kiến cần bảo đảm tính khả thi và công bằng học tập cho mọi học sinh, kể cả học sinh không có máy tính ở nhà.',
            basis: 'Tiêu chuẩn tính khả thi và nhân rộng của sáng kiến giáo dục.',
            category: 'Tính thực tiễn & Khả năng áp dụng',
            revisionGoal: 'Bổ sung giải pháp thực hành tại trường và phương án học tập theo nhóm.',
            howToRevise: 'Nêu rõ phương án mở phòng máy ngoài giờ và hình thức lập trình theo cặp (Pair programming).',
            lightRevision: 'Để hoàn thành các dự án học tập, học sinh có thể tiếp tục thực hành trên máy tính cá nhân ở nhà hoặc đăng ký thực hành thêm tại phòng máy tính của nhà trường.',
            academicRevision: 'Nhằm bảo đảm tính công bằng học tập cho mọi học sinh, nhà trường tạo điều kiện mở cửa phòng máy tính ngoài giờ để các em không có máy tính cá nhân vẫn có thể hoàn thành sản phẩm dự án; đồng thời áp dụng phương pháp lập trình theo cặp (Pair programming).',
            deepRevision: 'Giải pháp được thiết kế thích ứng với mọi điều kiện cơ sở vật chất: học sinh được phân nhóm linh hoạt để tương trợ lẫn nhau; tổ chuyên môn bố trí lịch mở phòng máy tính trường vào các buổi chiều có giáo viên hướng dẫn, bảo đảm 100% học sinh đều có thời lượng thực hành bình đẳng trên máy tính.',
            missingEvidenceAlert: 'Cần đính kèm lịch trực phòng máy và quy chế làm việc nhóm tại Phụ lục.',
            insertPosition: 'Mục 4.3'
          }
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

  // Đảm bảo đồng bộ tuyệt đối customProposals và teacherNotes khi trả về
  if (item.analysisResult) {
    if (item.customProposals) {
      item.analysisResult.customProposals = {
        ...(item.analysisResult.customProposals || {}),
        ...item.customProposals,
      };
    }
    if (item.teacherNotes) {
      (item.analysisResult as any).teacherNotes = {
        ...((item.analysisResult as any).teacherNotes || {}),
        ...item.teacherNotes,
      };
      if (Array.isArray(item.analysisResult.redTeamCards)) {
        item.analysisResult.redTeamCards.forEach(c => {
          if ((c.userNotes === undefined || c.userNotes === null || c.userNotes === '') && item.teacherNotes?.[c.id]) {
            c.userNotes = item.teacherNotes[c.id];
          }
        });
      }
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
  customProposals?: Record<string, { tier?: string; text: string; updatedAt?: string }>;
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
  item.score = calculatedScore;
  item.status = 'COMPLETED';
  item.updatedAt = now;
  if (params.title?.trim()) item.title = params.title.trim();
  if (params.subject?.trim()) item.subject = params.subject.trim();

  // 1. Bảo toàn và đồng bộ hai chiều customProposals (không bao giờ bị ghi đè mất)
  const mergedProposals: Record<string, { tier?: string; text: string; updatedAt?: string }> = {
    ...(item.customProposals || {}),
    ...(item.analysisResult?.customProposals || {}),
    ...(params.customProposals || {}),
    ...(params.analysisResult?.customProposals || {}),
  };
  item.customProposals = mergedProposals;

  // 2. Bảo toàn và đồng bộ hai chiều teacherNotes (không bao giờ bị ghi đè mất)
  const mergedNotes: Record<string, string> = {
    ...(item.teacherNotes || {}),
    ...((item.analysisResult as any)?.teacherNotes || {}),
    ...((params as any).teacherNotes || {}),
    ...((params.analysisResult as any)?.teacherNotes || {}),
  };

  // Trích xuất notes từ params.analysisResult.redTeamCards nếu có
  if (Array.isArray(params.analysisResult?.redTeamCards)) {
    params.analysisResult.redTeamCards.forEach(c => {
      if (c.userNotes !== undefined && c.userNotes !== null) {
        mergedNotes[c.id] = c.userNotes;
      }
    });
  }
  item.teacherNotes = mergedNotes;

  // 3. Đồng bộ redTeamCards (giữ nguyên userNotes và status của từng card đã lưu)
  let synchronizedCards = params.analysisResult?.redTeamCards || item.analysisResult?.redTeamCards || [];
  if (Array.isArray(synchronizedCards)) {
    const existingCardsMap = new Map((item.analysisResult?.redTeamCards || []).map(c => [c.id, c]));
    synchronizedCards = synchronizedCards.map(newCard => {
      const existing = existingCardsMap.get(newCard.id);
      const noteFromMap = mergedNotes[newCard.id];
      const effectiveNote = newCard.userNotes !== undefined
        ? newCard.userNotes
        : (noteFromMap !== undefined ? noteFromMap : (existing?.userNotes || ''));
      return {
        ...(existing || {}),
        ...newCard,
        userNotes: effectiveNote,
        status: newCard.status || existing?.status || 'Chưa xử lý',
      };
    });
  }

  // 4. Lưu analysisResult hoàn chỉnh và đồng bộ
  item.analysisResult = {
    ...params.analysisResult,
    redTeamCards: synchronizedCards,
    customProposals: mergedProposals,
    teacherNotes: mergedNotes,
  };

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
