export type FileCategory = 
  | 'skkn_primary'       // SKKN chính
  | 'rubric_official'    // Phiếu chấm / Hướng dẫn
  | 'evidence_doc'       // Minh chứng hình ảnh/văn bản
  | 'data_survey'        // Dữ liệu khảo sát / Excel / Bảng biểu
  | 'appendix_ref';      // Phụ lục / Tài liệu tham khảo

export interface UploadedFileItem {
  id: string;
  name: string;
  category: FileCategory;
  size: number;
  type: string;
  textContent?: string;
  dataBase64?: string;
  uploadedAt: string;
}

export type PriorityLevel = 'Cao' | 'Trung bình' | 'Thấp';

export type InformationReliabilityLevel =
  | 'SOURCE_DOCUMENT'      // 1. Dữ kiện có trong SKKN
  | 'USER_CONFIRMED'        // 2. Dữ kiện giáo viên xác nhận
  | 'VERIFIED_SOURCE'       // 3. Dữ kiện có nguồn kiểm chứng
  | 'DERIVED_CALCULATION'   // 4. Phép tính suy ra trực tiếp từ dữ kiện
  | 'AI_INFERENCE'          // 5. Suy luận của AI (cần gắn nhãn, không biến thành sự thật)
  | 'UNKNOWN';              // 6. Thông tin chưa biết / Chưa có căn cứ

export type FactSafetyIssueCategory =
  | 'READY_TO_EDIT'             // Có thể tạo bản đề xuất sửa trực tiếp (chính tả, văn phong, diễn đạt)
  | 'REQUIRES_VERIFICATION'     // Cần thầy/cô xác nhận (số liệu, nguyên nhân, sự thật)
  | 'REQUIRES_EVIDENCE'         // Cần bổ sung minh chứng (kết quả, quan sát, thực nghiệm)
  | 'REQUIRES_EXTERNAL_CHECK'   // Cần kiểm chứng nguồn ngoài (tài liệu tham khảo, trích dẫn)
  | 'RESOLVED';                 // Đã khắc phục / giải quyết xong

export type FindingStatus = 
  | 'Chưa xử lý' 
  | 'Đang xử lý' 
  | 'Đã xử lý' 
  | 'Bỏ qua'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'ignored'
  | 'Cần minh chứng'
  | 'Cần kiểm chứng nguồn'
  | 'Tác giả không đồng ý';

export type AiCheckLevel = 
  | 'it_dau_hieu'        // 🟢 Ít dấu hiệu bất thường
  | 'can_xem_xet'        // 🟡 Cần xem xét
  | 'nhieu_dau_hieu';    // 🟠 Có nhiều dấu hiệu cần kiểm tra

export type SimilarityLevel = 
  | 'chua_phat_hien'     // 🟢 Chưa phát hiện vấn đề đáng chú ý trong phạm vi kiểm tra
  | 'tuong_dong_da_dan'  // 🟡 Có tương đồng nhưng đã dẫn nguồn hoặc cần kiểm tra thêm
  | 'tuong_dong_chua_ro' // 🟠 Tương đồng đáng kể và cách dẫn nguồn chưa rõ
  | 'can_doi_chieu';     // 🔴 Cần tác giả/hội đồng đối chiếu trực tiếp với nguồn

export type ReferenceVerificationStatus = 
  | 'xac_minh_duoc'      // 🟢 Xác minh được
  | 'xac_minh_mot_phan'  // 🟡 Xác minh một phần
  | 'chua_xac_minh_duoc';// 🔴 Chưa xác minh được

export interface AiMarkerFinding {
  id: string;
  location: string;          // Trang / Mục / Đoạn
  excerpt: string;           // Đoạn cần xem xét
  signsDetected: string;     // Dấu hiệu nhận diện
  basis: string;             // Căn cứ nhận diện
  checkLevel: AiCheckLevel;  // Mức cần kiểm tra
  verificationGuide: string; // Hướng xác minh
  suggestedHandling: string; // Gợi ý xử lý
}

export interface AiMarkersAnalysis {
  overallLevel: AiCheckLevel;
  overallSummary: string;
  findings: AiMarkerFinding[];
  disclaimer: string;
}

export interface SimilarityFinding {
  id: string;
  excerpt: string;           // Đoạn trong SKKN
  location: string;          // Vị trí: Trang / Mục / Đoạn
  matchedSource: string;     // Nguồn tương đồng
  matchedContent: string;    // Nội dung tương đồng
  isCitedInText: boolean;    // SKKN đã trích dẫn chưa?
  isInBibliography: boolean; // Nguồn có trong tài liệu tham khảo không?
  reviewLevel: SimilarityLevel;
  resolutionAction: string;  // Cách xử lý
}

export interface ReferenceCheckItem {
  id: string;
  referenceEntry: string;    // Tên nguồn trong danh mục
  citationInText: string;    // Vị trí trích trong nội dung
  existsInCatalog: boolean;  // Có trong danh mục không
  usedInText: boolean;       // Có được sử dụng trong bài không
  hasAuthorAndYear: boolean; // Đầy đủ tác giả, năm không
  urlOrDomain?: string;      // URL / Nguồn
  supportsArgument: string;  // Nguồn có hỗ trợ luận điểm không
  verificationStatus: ReferenceVerificationStatus;
  verificationNote: string;  // Ghi chú xác minh
}

export interface SimilarityAndCitationsAnalysis {
  overallLevel: SimilarityLevel;
  overallSummary: string;
  similarityFindings: SimilarityFinding[];
  referenceChecks: ReferenceCheckItem[];
  disclaimer: string;
}

export type EvidenceStatus = 
  | 'co_minh_chung'             // 🟢 Có minh chứng phù hợp
  | 'minh_chung_chua_manh'      // 🟡 Minh chứng có nhưng chưa mạnh
  | 'minh_chung_gian_tiep'      // 🟠 Minh chứng gián tiếp
  | 'chua_tim_thay_minh_chung'; // 🔴 Chưa tìm thấy minh chứng

export type NoveltyLevel = 
  | 'chua_phat_hien_tuong_dong' // 🟢 Chưa phát hiện tương đồng cao
  | 'tuong_tu_mot_so'          // 🟡 Có một số nội dung tương tự
  | 'tuong_dong_dang_ke'       // 🟠 Tương đồng đáng kể
  | 'nguy_co_trung_lap_cao';    // 🔴 Có tài liệu/đề tài rất gần

export interface SKKNMetadata {
  title: string;
  author?: string;
  organization?: string;
  targetSchool?: string;
  field?: string;
  subject?: string;
  gradeLevel?: string;
  targetAudience?: string;
  applicationTimeframe?: string;
  scope?: string;
  appliedRubricName: string;
  isOfficialRubric: boolean;
  evidenceAdequacy: 'Cao' | 'Trung bình' | 'Thấp';
  evidenceAdequacyReason: string;
  pageCount?: number;
}

export interface SKKNSectionMap {
  id: string;
  name: string;
  sectionCode: string;
  page?: string;
  summary: string;
  wordCount?: number;
}

export interface RubricCriterion {
  id: string;
  groupName: string;
  criterionName: string;
  maxScore: number;
  proposedScore: number;
  basisLocation: string; // Vị trí căn cứ trong SKKN (Trang/Mục)
  shortQuote: string;    // Trích dẫn ngắn làm căn cứ
  strengths: string;     // Điểm mạnh ghi nhận
  limitations: string;   // Hạn chế / Vấn đề
  existingEvidence: string; // Minh chứng hiện có
  missingEvidence: string;  // Minh chứng còn thiếu
  deductionReason: string;  // Lý do chưa đạt điểm tối đa
  improvementGuidance: string; // Cách cải thiện
  priority: PriorityLevel;
}

export interface RedTeamCard {
  id: string;                    // Mã phát hiện (Ví dụ: PB-001)
  issueType?: string;            // Loại vấn đề
  affectedCriterion: string;     // Tiêu chí liên quan
  location: string;              // Vị trí: Trang / Mục / Đoạn
  relatedQuote: string;          // Trích đoạn liên quan
  issueDetected: string;         // Tên vấn đề phát hiện
  criticismBasis: string;        // Căn cứ
  whyItMatters: string;          // Phân tích
  impactLevel: PriorityLevel;    // Mức ảnh hưởng: Cao / Trung bình / Thấp
  rubricImpactPoints?: string;   // Điểm/rubric bị ảnh hưởng nếu có
  existingEvidence?: string;     // Minh chứng hiện có
  requiredEvidence: string;       // Minh chứng còn thiếu
  insertLocation?: string;       // Vị trí nên bổ sung
  relatedSource?: string;        // Nguồn liên quan
  resolutionGuidance: string;    // Hướng xử lý
  suggestedRevision?: string;    // Gợi ý chỉnh sửa
  likelyCouncilQuestion: string; // Câu hỏi hội đồng có thể đặt
  status: FindingStatus;         // Trạng thái
  userNotes?: string;            // Ghi chú của người dùng
}

export interface NoveltyComparisonItem {
  id: string;
  aspect: string; // Vấn đề / Đối tượng / Giải pháp / Quy trình / Công nghệ / Đánh giá
  thisInitiative: string;
  benchmarkDocA: string;
  benchmarkDocB: string;
  benchmarkDocC: string;
  differenceAnalysis: string;
}

export interface NoveltyAnalysis {
  overallLevel: NoveltyLevel;
  overallConclusion: string;
  searchKeywords: string[];
  scopeChecked: string;
  comparisonItems: NoveltyComparisonItem[];
  riskWarnings: string[];
}

export interface EvidenceChainItem {
  id: string;
  claim: string;             // Luận điểm quan trọng
  location: string;          // Vị trí trong SKKN
  associatedSolution: string;// Giải pháp liên quan
  status: EvidenceStatus;
  existingEvidenceDetails: string;
  missingEvidenceDetails: string;
  recommendation: string;
}

export interface DataAnomalyItem {
  id: string;
  type: 'Sai phép tính' | 'Sai tỷ lệ' | 'Mâu thuẫn cỡ mẫu' | 'Dữ liệu không rõ nguồn' | 'Số liệu mâu thuẫn giữa bảng và lời văn' | 'Phần trăm vs Điểm phần trăm';
  location: string;
  originalText: string;
  analysis: string;
  riskSeverity: 'Cao' | 'Trung bình' | 'Thấp';
  actionNeeded: string;
}

export interface LogicGapItem {
  id: string;
  stepName: string; // Vấn đề -> Nguyên nhân -> Giải pháp -> Triển khai -> Minh chứng -> Kết quả -> Kết luận
  gapDescription: string;
  location: string;
  missingLinkAnalysis: string;
  correctionGuidance: string;
}

export interface RevisionDetail {
  text: string;
  changeScope: string;
  factsUsed: string[];
}

export interface SuggestionRewrite {
  id: string;
  targetSection: string;
  originalText: string;
  problem: string;
  whyRevise: string;
  basis?: string;            // CĂN CỨ: Quy chuẩn, tiêu chí chấm, công văn hoặc nguyên tắc nghiên cứu
  category?: string;         // Phân loại: Tính mới, Số liệu, Minh chứng, Quy chuẩn trình bày
  revisionGoal: string;
  howToRevise: string;
  lightRevision: string;     // SỬA NHẸ: Giữ gần nguyên nội dung
  academicRevision: string;  // SỬA HỌC THUẬT: Cải thiện logic, khoa học và diễn đạt
  deepRevision: string;      // SỬA SÂU: Tổ chức lại đoạn/mục, chỉ rõ minh chứng cần bổ sung
  tierDetails?: {
    light: RevisionDetail;
    academic: RevisionDetail;
    deep: RevisionDetail;
  };
  missingEvidenceAlert: string;
  insertPosition: string;
}

export interface CouncilQuestion {
  id: string;
  difficulty: '🔴 Câu hỏi khó' | '🟠 Cần chuẩn bị' | '🟡 Câu hỏi làm rõ';
  question: string;
  whyCouncilAsks: string;
  relatedLocation: string;
  requiredEvidenceToBring: string;
  suggestedAnswerStrategy: string; // Hướng trả lời (không tạo số liệu ảo)
}

export interface PriorityActionItem {
  id: string;
  tier: '🔴 PHẢI SỬA' | '🟠 NÊN SỬA' | '🟡 TỐI ƯU THÊM';
  title: string;
  affectedAspect: string; // Tính mới, Dữ liệu, Minh chứng, Logic, v.v.
  location: string;
  actionSummary: string;
  rubricImpact: string;
}

export type IssueResolutionComparisonStatus = 
  | 'ĐÃ KHẮC PHỤC' 
  | 'CẢI THIỆN MỘT PHẦN' 
  | 'CHƯA KHẮC PHỤC' 
  | 'PHÁT SINH MÂU THUẪN MỚI'
  | 'KHÔNG XÁC ĐỊNH';

export interface IssueComparisonItem {
  id?: string;
  issueTitle: string;
  originalQuote: string;
  revisedQuote: string;
  status: IssueResolutionComparisonStatus;
  explanation: string;
}

export interface UpdatedCriterionItem {
  criterionName: string;
  previousScore: number;
  newScore: number;
  changeDifference: number;
  whatChanged: string;       // Điều gì đã thay đổi?
  evidenceFoundAt: string;   // Minh chứng nằm ở đâu?
  impactReason: string;      // Vì sao thay đổi này ảnh hưởng điểm?
  rubricMetReason: string;   // Tiêu chí Rubric nào được đáp ứng tốt hơn?
}

export interface RescoreComparison {
  previousScore: number;
  newScore: number;
  scoreDifference: number;
  fixedIssues: string[];
  remainingIssues: string[];
  newIssuesArisen: string[];
  newEvidenceAdded: string[];
  newFiguresAdded: string[];
  justificationForChange: string;
  issueComparisons?: IssueComparisonItem[];
  updatedCriteria?: UpdatedCriterionItem[];
  evaluatedAt?: string;
}

export type LanguageIssueType =
  | 'lỗi chính tả'
  | 'lỗi đánh máy'
  | 'lỗi dấu câu'
  | 'viết hoa không nhất quán'
  | 'thuật ngữ không thống nhất'
  | 'câu quá dài'
  | 'câu tối nghĩa'
  | 'lặp từ'
  | 'thiếu tính học thuật'
  | 'diễn đạt quá tuyệt đối'
  | 'khẳng định vượt quá bằng chứng';

export interface LanguageFindingItem {
  id: string;
  location: string;          // 📍 Vị trí (Trang / Mục)
  currentText: string;       // 📄 Nội dung hiện tại
  issueType: LanguageIssueType; // 🔎 Loại vấn đề
  issueDescription: string;  // 🔎 Mô tả chi tiết vấn đề
  suggestion: string;        // 💡 Đề xuất
  proposedText: string;      // ✍️ Phiên bản đề nghị
  status: 'proposed' | 'approved' | 'rejected' | 'applied';
}

export interface LanguageSpellingAnalysis {
  totalCount: number;
  summary: string;
  findings: LanguageFindingItem[];
}

export type ChangeStatus = 'proposed' | 'approved' | 'rejected' | 'applied';
export type DecisionMaker = 'AI đề xuất / Giáo viên duyệt' | 'Giáo viên chỉnh trực tiếp';

export interface ChangeSetItem {
  changeId: string;
  issueId?: string;
  type: 'language' | 'suggestion' | 'manual';
  location: string;
  originalText: string;
  proposedText: string;
  approvedText: string;
  status: ChangeStatus;
  reason: string;
  rubricCriterion?: string;
  selectedRevisionLevel?: 'light' | 'academic' | 'deep';
  decidedBy: DecisionMaker | string;
  appliedAt?: string;
}

export interface MissingContentItem {
  id: string;
  category: 'THIẾU' | 'CHƯA ĐỦ CĂN CỨ';
  whatIsMissing: string;     // Thiếu gì
  criterionName: string;     // Nằm ở tiêu chí nào
  whyNeeded: string;         // Tại sao cần
  suggestedLocation: string; // Nên đặt ở đâu
  requiredDataFromTeacher: string; // Cần giáo viên cung cấp dữ liệu gì
}

export interface SupportTemplateItem {
  id: string;
  templateType: 'giáo án minh chứng' | 'phiếu học tập' | 'phiếu khảo sát' | 'phiếu quan sát' | 'bảng tiêu chí' | 'rubric' | 'biểu mẫu thu thập dữ liệu';
  title: string;
  purpose: string;
  isSuggestedTemplate: true; // Phân biệt: MẪU ĐỀ XUẤT vs MINH CHỨNG THỰC TẾ
  content: string;
  guide: string;
}

export interface SKKNAnalysisResult {
  metadata: SKKNMetadata;
  sectionsMap: SKKNSectionMap[];
  rubricCriteria: RubricCriterion[];
  redTeamCards: RedTeamCard[];
  novelty: NoveltyAnalysis;
  evidenceChain: EvidenceChainItem[];
  dataAnomalies: DataAnomalyItem[];
  logicGaps: LogicGapItem[];
  aiMarkers?: AiMarkersAnalysis;
  similarityAndCitations?: SimilarityAndCitationsAnalysis;
  suggestions: SuggestionRewrite[];
  languageCheck?: LanguageSpellingAnalysis;
  missingContents?: MissingContentItem[];
  supportTemplates?: SupportTemplateItem[];
  changeSet?: ChangeSetItem[];
  councilQuestions: CouncilQuestion[];
  priorityActions: PriorityActionItem[];
  rescoreHistory?: RescoreComparison;
  createdAt: string;
}

// ==========================================
// ACCOUNT, GUEST, LICENSE & ADMIN SYSTEM
// ==========================================
export type UserRole = 'GUEST' | 'TRIAL' | 'LICENSED' | 'FREE_ACCESS' | 'BLOCKED' | 'ADMIN';
export type LicensePlan = 'TRIAL' | 'LICENSED' | 'GUEST' | 'PRO' | 'PREMIUM' | 'SCHOOL';

export interface UserQuota {
  easy: number;     // Số lượt Dễ dùng còn lại
  advanced: number; // Số lượt Chuyên sâu còn lại
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  plan: LicensePlan;
  quota: UserQuota;
  licenseKey?: string;
  licenseExpiresAt?: string | null;
  freeAccess?: boolean;
  freeAccessName?: string;
  freeAccessExpiresAt?: string | null;
  createdAt: string;
  lastActiveAt: string;
  isBlocked: boolean;
}

export interface GuestSession {
  guestId: string;
  quota: UserQuota;
  createdAt: string;
  lastActiveAt: string;
  analysisCount: number;
}

export type LicenseStatus = 'UNUSED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface BoundDevice {
  deviceId: string;
  deviceName?: string;
  boundAt: string;
  lastActiveAt?: string;
}

export interface LicenseItem {
  key: string;
  plan: LicensePlan;
  maxDevices: number;
  boundDevices?: BoundDevice[];
  assignedEmail?: string;
  customerNote?: string;
  activatedAt?: string;
  expiresAt?: string | null;
  status: LicenseStatus;
  createdReason?: string;
  createdAt?: string;
}

export interface SystemStats {
  totalGuests: number;
  totalUsers: number;
  trialUsers: number;
  licensedUsers: number;
  totalAnalyses: number;
  activeLicenses?: number;
  geminiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  licenseApiStatus: 'CONNECTED' | 'LOCAL_FALLBACK';
}

export interface SystemSettings {
  guestEasyLimit: number;
  guestAdvancedLimit: number;
  trialEasyLimit: number;
  trialAdvancedLimit: number;
  freeAccessEnabled: boolean;
  freeAccessName: string;
  freeAccessStart: string;
  freeAccessEnd: string;
}
