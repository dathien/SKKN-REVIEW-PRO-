import { SKKNAnalysisResult } from '../types';

export const sampleInitiative1: SKKNAnalysisResult = {
  metadata: {
    title: "Ứng dụng sơ đồ tư duy kết hợp phần mềm tương tác nhằm nâng cao hứng thú học tập môn Lịch sử 8 tại Trường THCS Trần Hưng Đạo",
    author: "Nguyễn Thị Mai Lan",
    organization: "Trường THCS Trần Hưng Đạo, Quận Kiến An, TP. Hải Phòng",
    field: "Khoa học Xã hội & Nhân văn - Phương pháp dạy học",
    subject: "Lịch sử & Địa lí 8 (Phân môn Lịch sử)",
    gradeLevel: "Lớp 8",
    targetAudience: "Học sinh lớp 8A1, 8A2 năm học 2024 - 2025 (82 học sinh)",
    applicationTimeframe: "Tháng 09/2024 - Tháng 04/2025",
    scope: "Phạm vi cấp trường và khối 8 liên trường trong cụm chuyên môn",
    appliedRubricName: "Phiếu chấm Sáng kiến Giáo dục theo Hướng dẫn Sở GD&ĐT (Khung 100 điểm)",
    isOfficialRubric: true,
    evidenceAdequacy: "Trung bình",
    evidenceAdequacyReason: "Tài liệu có đính kèm bảng điểm và ảnh chụp màn hình bài tập Padlet, tuy nhiên thiếu phiếu khảo sát gốc, thiếu biên bản dự giờ đối chứng và chưa có tiêu chí lượng hóa hành vi 'chủ động'."
  },
  sectionsMap: [
    { id: "sec-1", sectionCode: "Phần I", name: "ĐẶT VẤN ĐỀ (Lý do chọn đề tài, mục tiêu, đối tượng)", page: "Trang 2-4", summary: "Nêu thực trạng học sinh xem nhẹ môn Lịch sử, chỉ học vẹt ngày kiểm tra, dẫn đến kết quả chưa cao." },
    { id: "sec-2", sectionCode: "Phần II.1", name: "CƠ SỞ LÝ LUẬN & THỰC TIỄN", page: "Trang 5-8", summary: "Trích dẫn thuyết nhận thức trực quan của Tony Buzan và thông tư đổi mới PPDH theo CT GDPT 2018." },
    { id: "sec-3", sectionCode: "Phần II.2", name: "THỰC TRẠNG TRƯỚC KHI ÁP DỤNG SÁNG KIẾN", page: "Trang 9-12", summary: "Trình bày kết quả khảo sát đầu năm: 65% học sinh cảm thấy môn Sử khô khan, nhiều mốc thời gian." },
    { id: "sec-4", sectionCode: "Phần II.3", name: "CÁC BIỆN PHÁP THỰC HIỆN (Giải pháp 1, 2, 3)", page: "Trang 13-22", summary: "Mô tả 3 biện pháp: (1) Thiết kế SĐTD theo chủ đề; (2) Tích hợp trò chơi Quizizz/Kahoot; (3) Giao nhiệm vụ vẽ nhóm trên Canva." },
    { id: "sec-5", sectionCode: "Phần II.4", name: "HIỆU QUẢ VÀ KẾT QUẢ ĐẠT ĐƯỢC", page: "Trang 23-27", summary: "So sánh kết quả trước và sau thực nghiệm, biểu đồ tỷ lệ khá giỏi tăng, hứng thú học tập cải thiện." },
    { id: "sec-6", sectionCode: "Phần III", name: "KẾT LUẬN VÀ KIẾN NGHỊ", page: "Trang 28-30", summary: "Khẳng định đề tài mới, hiệu quả vượt trội, đề xuất nhân rộng toàn trường và cụm chuyên môn." },
    { id: "sec-7", sectionCode: "Phần IV", name: "TÀI LIỆU THAM KHẢO & PHỤ LỤC", page: "Trang 31-35", summary: "Liệt kê 6 tài liệu tham khảo và hình ảnh sản phẩm sơ đồ của học sinh." }
  ],
  rubricCriteria: [
    {
      id: "rub-1",
      groupName: "1. Tính cấp thiết & Cơ sở nghiên cứu",
      criterionName: "Xác định vấn đề thực tiễn, tính cấp thiết và mục tiêu nghiên cứu",
      maxScore: 10,
      proposedScore: 8.5,
      basisLocation: "Phần I, Trang 2-3, Mục 1.1",
      shortQuote: "Môn Lịch sử thường bị xem là môn học thuộc lòng, học sinh ghi nhớ thụ động, dẫn đến tỷ lệ học sinh không có hứng thú chiếm tới 65% qua khảo sát đầu năm.",
      strengths: "Nêu đúng trăn trở thực tiễn giảng dạy môn Lịch sử 8 theo chương trình GDPT 2018; mục tiêu nghiên cứu bám sát việc phát triển năng lực trực quan của học sinh.",
      limitations: "Khảo sát thực trạng ban đầu chưa mô tả rõ công cụ đo lường (dùng thang đo Likert hay câu hỏi đóng/mở; chưa ghi rõ ngày phát phiếu).",
      existingEvidence: "Số liệu tổng hợp sơ bộ tỷ lệ học sinh hứng thú đầu năm học tại 2 lớp 8A1, 8A2.",
      missingEvidence: "Phiếu khảo sát mẫu hoặc đường link biểu mẫu Google Form điều tra đầu năm kèm minh chứng thời gian thu thập.",
      deductionReason: "Trừ 1.5 điểm do phần khảo sát thực trạng thiếu bản mô tả công cụ đo và cỡ mẫu chi tiết ở đầu đề tài.",
      improvementGuidance: "Bổ sung mẫu phiếu khảo sát 5 mức độ vào Phụ lục 1 và ghi rõ thời điểm thu thập (tuần 2 tháng 9/2024, N=82).",
      priority: "Trung bình"
    },
    {
      id: "rub-2",
      groupName: "2. Tính mới & Tính sáng tạo",
      criterionName: "Mức độ mới về giải pháp, cách tiếp cận và tính sáng tạo khoa học",
      maxScore: 20,
      proposedScore: 13.0,
      basisLocation: "Phần II.3, Trang 13-17, Mục 3.1 & 3.2",
      shortQuote: "Sáng kiến lần đầu tiên đưa phần mềm tương tác Canva và Quizizz kết hợp vẽ sơ đồ tư duy vào tiết Lịch sử 8 tại trường THCS.",
      strengths: "Đã có ý thức kết hợp công cụ trực quan hóa tư duy (Mindmap) với hoạt động phản hồi nhanh (Quick Response) trên lớp.",
      limitations: "Khẳng định 'lần đầu tiên áp dụng Canva và Quizizz' là phóng đại tính mới. Đây là những công cụ phổ thông đã được tập huấn đại trà. Điểm mới chưa được định vị ở 'quy trình tổ chức dạy học' hay 'kỹ thuật giao nhiệm vụ phân hóa' mà đang đồng nhất công nghệ với tính mới.",
      existingEvidence: "Một số hình ảnh bài tập Quizizz và mẫu sơ đồ tư duy được chụp lại trong phụ lục.",
      missingEvidence: "Bảng đối sánh quy trình 4 bước mới so với quy trình dạy học truyền thống; bảng phân hóa mức độ yêu cầu SĐTD cho từng nhóm đối tượng học sinh.",
      deductionReason: "Trừ 7.0 điểm do chưa chứng minh được tính mới thực chất; đồng nhất việc sử dụng phần mềm có sẵn với sáng tạo giải pháp; tuyên bố tính mới vượt quá thực tế.",
      improvementGuidance: "Làm rõ tính mới nằm ở: 'Quy trình 4 bước xây dựng mốc thời gian động theo chuỗi nhân quả lịch sử', không tuyên bố mới chỉ vì sử dụng Canva/Quizizz.",
      priority: "Cao"
    },
    {
      id: "rub-3",
      groupName: "3. Tính khoa học & Logic sư phạm",
      criterionName: "Phương pháp nghiên cứu, chuỗi logic từ thực trạng đến giải pháp",
      maxScore: 20,
      proposedScore: 14.5,
      basisLocation: "Phần II.1 & II.3, Trang 6 và Trang 15",
      shortQuote: "Áp dụng phương pháp nghiên cứu hành động, kết hợp quan sát sư phạm và thực nghiệm dạy học đối chứng tại lớp 8A1 (thực nghiệm) và 8A2 (đối chứng).",
      strengths: "Có cấu trúc nghiên cứu thực nghiệm rõ ràng; có thiết kế lớp thực nghiệm và lớp đối chứng tương đồng về sĩ số.",
      limitations: "Chuỗi logic từ 'nguyên nhân học sinh chán học' (nội dung nhiều chữ, mốc sự kiện dài) sang 'giải pháp 2: tổ chức trò chơi Quizizz' chưa gắn kết chặt chẽ. Chưa kiểm soát biến nhiễu khi lớp 8A1 vốn có điểm thi đầu vào cao hơn lớp 8A2.",
      existingEvidence: "Danh sách 2 lớp tham gia thực nghiệm kèm bảng điểm khảo sát.",
      missingEvidence: "Biên bản kiểm tra tính tương đương của hai nhóm (Pre-test baseline) trước khi can thiệp (chưa có phép kiểm t-test hoặc so sánh trung bình có ý nghĩa thống kê).",
      deductionReason: "Trừ 5.5 điểm do thiếu kiểm soát tính tương đương đầu vào giữa 2 lớp và đứt gãy logic giữa việc nhớ sự kiện với phát triển tư duy lịch sử.",
      improvementGuidance: "Bổ sung kết quả kiểm tra tương đương đầu vào giữa 8A1 và 8A2; điều chỉnh mục tiêu từ 'chơi game vui' sang 'hình thành kỹ năng liên kết dữ kiện'.",
      priority: "Cao"
    },
    {
      id: "rub-4",
      groupName: "4. Tính thực tiễn & Khả năng áp dụng",
      criterionName: "Phù hợp điều kiện cơ sở vật chất, khả năng nhân rộng trong bộ môn",
      maxScore: 15,
      proposedScore: 12.0,
      basisLocation: "Phần II.3, Trang 18, Mục 3.3",
      shortQuote: "Các em học sinh về nhà truy cập vào máy tính cá nhân hoặc điện thoại của phụ huynh để hoàn thành sơ đồ trên Canva.",
      strengths: "Giải pháp tận dụng thiết bị thông minh sẵn có của học sinh và máy chiếu lớp học; tiết kiệm chi phí in ấn.",
      limitations: "Chưa tính toán đến rào cản khi triển khai ở các lớp hoặc các trường vùng ven có học sinh không có thiết bị cá nhân; phụ thuộc vào đường truyền mạng ở gia đình.",
      existingEvidence: "Sản phẩm nộp bài của học sinh trên nhóm lớp.",
      missingEvidence: "Phương án thay thế (Offline fallback) bằng giấy A3 và bút chì màu cho học sinh không có điện thoại/máy tính.",
      deductionReason: "Trừ 3.0 điểm vì chưa đưa ra phương án dự phòng bảo đảm công bằng học tập cho đối tượng học sinh khó khăn về thiết bị.",
      improvementGuidance: "Bổ sung hướng dẫn vẽ tay phân tầng (Sketch-noting trên vở ghi) cho nhóm không có thiết bị số để tăng tính khả thi đại trà.",
      priority: "Trung bình"
    },
    {
      id: "rub-5",
      groupName: "5. Tính hiệu quả & Minh chứng xác thực",
      criterionName: "Kết quả đo lường, dữ liệu đối sánh trước - sau và minh chứng cụ thể",
      maxScore: 20,
      proposedScore: 12.5,
      basisLocation: "Phần II.4, Trang 24-26, Bảng số liệu 2 & 3",
      shortQuote: "Sau 6 tháng áp dụng, tỷ lệ học sinh đạt loại Giỏi tăng 25%, 100% học sinh đều yêu thích môn học và điểm thi học kỳ tăng 1.8 điểm so với cùng kỳ.",
      strengths: "Có đối sánh điểm số kiểm tra giữa kỳ và cuối kỳ; có bảng biểu tổng hợp rõ ràng.",
      limitations: "Phát hiện mâu thuẫn số liệu: Bảng 2 ghi 82 học sinh khảo sát, nhưng mục 3.2 thuyết minh lại ghi 85 học sinh. Kết luận 'tăng 25%' thực chất là từ 60% lên 75% (đúng ra là tăng 15 điểm phần trăm). Tuyên bố '100% học sinh đều yêu thích' mang tính tuyệt đối hóa không có cơ sở khoa học.",
      existingEvidence: "Bảng điểm tổng hợp điểm kiểm tra định kỳ học kỳ I và giữa kỳ II.",
      missingEvidence: "Phiếu khảo sát thái độ cuối kỳ có chữ ký/xác nhận của tổ chuyên môn; biên bản dự giờ đánh giá sự chuyển biến của học sinh.",
      deductionReason: "Trừ 7.5 điểm do mâu thuẫn số liệu mẫu, sai khái niệm điểm phần trăm, thiếu công cụ đo thái độ và kết luận vượt quá dữ liệu.",
      improvementGuidance: "Thống nhất sĩ số N=82 xuyên suốt; đính chính thuật ngữ thành 'tăng 15 điểm phần trăm'; thay tuyên bố '100%' bằng tỷ lệ khảo sát có số phiếu hợp lệ cụ thể.",
      priority: "Cao"
    },
    {
      id: "rub-6",
      groupName: "6. Khả năng chuyển giao & Nhân rộng",
      criterionName: "Điều kiện áp dụng cho đơn vị khác, hướng dẫn quy trình chuyển giao",
      maxScore: 10,
      proposedScore: 6.5,
      basisLocation: "Phần III, Trang 29, Mục 2",
      shortQuote: "Sáng kiến có thể áp dụng ngay cho tất cả các môn khoa học xã hội khác như Địa lí, Giáo dục công dân và Văn học tại các trường trong quận.",
      strengths: "Ý tưởng nhân rộng mở rộng sang môn tích hợp Lịch sử - Địa lí lớp 6, 7, 8 rất phù hợp với chương trình mới.",
      limitations: "Chưa xây dựng bộ cẩm nang quy trình (Toolkit) mẫu hoặc khung bài giảng mẫu để giáo viên trường khác có thể tự triển khai mà không cần tác giả hướng dẫn trực tiếp.",
      existingEvidence: "Đoạn văn kiến nghị áp dụng trong báo cáo tổng kết.",
      missingEvidence: "Kế hoạch bài dạy mẫu (Lesson Plan) hoàn chỉnh 1 bài học minh họa quy trình từ khởi động đến tổng kết; phiếu hướng dẫn giáo viên tổ chức hoạt động.",
      deductionReason: "Trừ 3.5 điểm vì phần chuyển giao chỉ dừng lại ở lời kêu gọi chung chung, chưa cung cấp tài liệu hướng dẫn thực hiện.",
      improvementGuidance: "Đính kèm vào Phụ lục: 01 Kế hoạch bài dạy (Kế hoạch bài học theo Công văn 5512) có lồng ghép hoàn chỉnh giải pháp.",
      priority: "Trung bình"
    },
    {
      id: "rub-7",
      groupName: "7. Hình thức trình bày, trích dẫn & Ngôn ngữ",
      criterionName: "Quy chuẩn văn bản, trích dẫn tài liệu tham khảo, ngôn phong khoa học",
      maxScore: 5,
      proposedScore: 3.5,
      basisLocation: "Toàn bộ văn bản và Phần IV, Trang 31",
      shortQuote: "Danh mục tài liệu tham khảo: 1. Sách giáo khoa Lịch sử 8; 2. Trang web Wikipedia; 3. Phần mềm Canva.",
      strengths: "Bố cục chia chương mục mạch lạc, font chữ đồng nhất, hình ảnh chụp màn hình rõ nét.",
      limitations: "Trích dẫn Wikipedia và 'Phần mềm Canva' vào danh mục tài liệu tham khảo khoa học là sai quy chuẩn học thuật; một số đoạn dùng từ ngữ cảm tính ('vô cùng kỳ diệu', 'học sinh say mê tột độ').",
      existingEvidence: "Danh mục 6 tài liệu tham khảo ở cuối văn bản.",
      missingEvidence: "Nguồn trích dẫn học thuật chuẩn APA/TCVN (Tác giả, năm, tên bài báo, nhà xuất bản).",
      deductionReason: "Trừ 1.5 điểm do lỗi trích dẫn phi học thuật và sử dụng từ ngữ biểu cảm quá mức trong báo cáo khoa học.",
      improvementGuidance: "Chuẩn hóa trích dẫn theo chuẩn IEEE hoặc APA; thay thế link Wikipedia bằng tài liệu bồi dưỡng PPDH chính thống của Bộ GD&ĐT.",
      priority: "Thấp"
    }
  ],
  redTeamCards: [
    {
      id: "PB-001",
      location: "Trang 13, Mục 3.1",
      relatedQuote: "Sáng kiến này hoàn toàn mới vì trước đây chưa có giáo viên nào trong trường ứng dụng Canva để vẽ sơ đồ tư duy Lịch sử.",
      issueDetected: "Tuyên bố tính mới quá mức dựa trên phạm vi hẹp (phạm vi nội bộ trường)",
      criticismBasis: "Tính mới của sáng kiến giáo dục cấp quận/thành phố phải so sánh với mặt bằng phương pháp dạy học chung, không thể lấy việc 'trường mình chưa làm' để định danh là tính mới khoa học.",
      affectedCriterion: "Tính mới & Sáng tạo",
      impactLevel: "Cao",
      whyItMatters: "Hội đồng cấp quận/thành phố sẽ ngay lập tức bác bỏ tính mới nếu tác giả nhầm lẫn giữa 'lần đầu trường áp dụng' với 'giải pháp mới mang tính sáng kiến'.",
      resolutionGuidance: "Định vị lại tính mới: Không nhấn mạnh vào việc sử dụng công cụ Canva, mà tập trung vào: 'Bộ cấu trúc khung tư duy theo 3 giai đoạn nhân - quả lịch sử' được thiết kế sẵn cho học sinh.",
      requiredEvidence: "Bảng phân tích sự khác nhau giữa việc dùng Canva vẽ tự do với việc áp dụng Khung tư duy 3 bước của tác giả.",
      insertLocation: "Trang 14, sau đoạn mô tả phần mềm Canva.",
      likelyCouncilQuestion: "Thầy/cô cho biết việc học sinh vẽ sơ đồ trên Canva khác gì so với việc các em vẽ sơ đồ trên giấy A4 hoặc sử dụng các mẫu mindmap có sẵn trên mạng?",
      status: "Chưa xử lý"
    },
    {
      id: "PB-002",
      location: "Trang 24, Bảng số liệu 2 & Thuyết minh Mục 3.2",
      relatedQuote: "Khảo sát 85 học sinh tại bảng 2... (nhưng tổng cột trong bảng lại là 42 + 40 = 82 học sinh)",
      issueDetected: "Mâu thuẫn số liệu cỡ mẫu khảo sát (85 vs 82)",
      criticismBasis: "Quy tắc kiểm tra nhất quán số liệu nghiên cứu khoa học: tổng mẫu khảo sát ở bảng biểu và lời văn phân tích phải trùng khớp tuyệt đối.",
      affectedCriterion: "Tính hiệu quả & Tính khoa học",
      impactLevel: "Cao",
      whyItMatters: "Đây là lỗi chí mạng khiến giám khảo nghi ngờ tính trung thực hoặc độ cẩn trọng của toàn bộ dữ liệu thực nghiệm.",
      resolutionGuidance: "Kiểm tra lại số phiếu thực tế thu về. Nếu có 3 phiếu không hợp lệ (bị loại), phải ghi rõ: 'Tổng phát ra 85 phiếu, thu về 85 phiếu, có 82 phiếu hợp lệ được đưa vào xử lý số liệu (loại 3 phiếu do để trống nhiều mục)'.",
      requiredEvidence: "Biên bản tổng hợp kiểm phiếu hoặc bảng dữ liệu thô (Raw data) đính kèm phụ lục.",
      insertLocation: "Trang 24, ngay dưới chân Bảng 2.",
      likelyCouncilQuestion: "Tại sao trong thuyết minh tác giả ghi khảo sát 85 học sinh nhưng trong bảng số liệu 2 tổng cộng chỉ có 82 em? 3 học sinh còn lại đi đâu?",
      status: "Chưa xử lý"
    },
    {
      id: "PB-003",
      location: "Trang 25, Mục 4.1",
      relatedQuote: "Tỷ lệ học sinh đạt điểm Giỏi tăng 25%, chứng minh phương pháp này hoàn toàn giải quyết được sự chán học môn Sử.",
      issueDetected: "Nhầm lẫn giữa '%' và 'điểm phần trăm', kèm quy kết nguyên nhân quá mức",
      criticismBasis: "Nếu tỷ lệ trước là 60% và sau là 75%, mức tăng là 15 điểm phần trăm (percentage points), tương ứng mức tăng trưởng tương đối là 25% (15/60). Tuy nhiên, tăng điểm thi học kỳ còn phụ thuộc vào độ khó của đề thi, việc ôn tập cuối kỳ và các yếu tố khác.",
      affectedCriterion: "Tính khoa học & Tính hiệu quả",
      impactLevel: "Trung bình",
      whyItMatters: "Sử dụng sai thuật ngữ thống kê và kết luận quy kết nhân quả tuyệt đối bộc lộ hạn chế về năng lực nghiên cứu sư phạm ứng dụng.",
      resolutionGuidance: "Sửa thành: 'Tỷ lệ học sinh đạt điểm Giỏi tăng từ 60% lên 75% (tăng 15 điểm phần trăm, tương đương mức tăng 25% so với đầu năm)'. Bổ sung nhận định thận trọng: 'Kết quả này phản ánh tác động tích cực của biện pháp bên cạnh nỗ lực tự học của học sinh'.",
      requiredEvidence: "Bảng phân tích độ khó tương đương giữa 2 đề kiểm tra trước và sau thực nghiệm.",
      insertLocation: "Trang 25, đoạn 2.",
      likelyCouncilQuestion: "Làm thế nào tác giả khẳng định việc tăng 15% học sinh giỏi hoàn toàn do sáng kiến này mang lại mà không phải do đề thi học kỳ 2 dễ hơn đề thi học kỳ 1?",
      status: "Chưa xử lý"
    },
    {
      id: "PB-004",
      location: "Trang 26, Mục 4.2",
      relatedQuote: "Học sinh trở nên tích cực, chủ động hơn nhiều, không còn thụ động ghi chép như trước.",
      issueDetected: "Luận điểm kết luận không có công cụ đo lường và minh chứng xác nhận",
      criticismBasis: "Nguyên tắc: 'Không kết luận học sinh chủ động hơn nếu không có rubric, phiếu quan sát hành vi hoặc sản phẩm học tập đối chứng'.",
      affectedCriterion: "Tính minh chứng & Tính hiệu quả",
      impactLevel: "Cao",
      whyItMatters: "Hội đồng đánh giá đây là 'nhận định cảm tính của tác giả', xếp vào trạng thái CHƯA ĐỦ CĂN CỨ ĐỂ KẾT LUẬN.",
      resolutionGuidance: "Xây dựng bảng Rubric quan sát thái độ lớp học gồm 3 tiêu chí: (1) Số lượt giơ tay phát biểu; (2) Mức độ hoàn thành sản phẩm nhóm đúng giờ; (3) Tỷ lệ tham gia thảo luận; ghi lại số liệu đếm được trong 4 tiết dự giờ.",
      requiredEvidence: "Phiếu dự giờ có biên bản nhận xét của tổ chuyên môn ghi nhận hành vi học sinh.",
      insertLocation: "Trang 26, thay thế đoạn mô tả định tính bằng bảng đối sánh tần suất hành vi.",
      likelyCouncilQuestion: "Tác giả dựa trên thước đo khoa học nào để khẳng định các em 'chủ động hơn', hay đây chỉ là cảm nhận chủ quan của cô trong giờ dạy?",
      status: "Chưa xử lý"
    },
    {
      id: "PB-005",
      location: "Trang 31, Danh mục TLTK",
      relatedQuote: "Tài liệu tham khảo: Bách khoa toàn thư mở Wikipedia (https://vi.wikipedia.org); Phần mềm thiết kế Canva.",
      issueDetected: "Trích dẫn nguồn mở không kiểm duyệt và đưa phần mềm vào danh mục tài liệu",
      criticismBasis: "Quy chuẩn trích dẫn khoa học sư phạm: Wikipedia là bách khoa toàn thư mở có thể bị chỉnh sửa, không được xem là nguồn học thuật; phần mềm là công cụ phương tiện, không phải tài liệu tham khảo.",
      affectedCriterion: "Hình thức trình bày & Chuẩn mực học thuật",
      impactLevel: "Thấp",
      whyItMatters: "Làm giảm tính trang trọng và độ tin cậy khoa học của báo cáo sáng kiến.",
      resolutionGuidance: "Chuyển Canva vào mục 'Phương tiện dạy học' ở Phần Đặt vấn đề. Thay link Wikipedia bằng sách giáo khoa, hướng dẫn dạy học môn Lịch sử 8 của Bộ GD&ĐT hoặc kỷ yếu hội thảo chuyên môn.",
      requiredEvidence: "Danh mục tài liệu tham khảo theo chuẩn TCVN.",
      insertLocation: "Trang 31, Mục Tài liệu tham khảo.",
      likelyCouncilQuestion: "Tại sao trong một đề tài nghiên cứu sư phạm lại trích dẫn nguồn Wikipedia vốn không có phản biện khoa học?",
      status: "Chưa xử lý"
    }
  ],
  novelty: {
    overallLevel: "tuong_tu_mot_so",
    overallConclusion: "Sáng kiến có sự tương đồng đáng kể với các đề tài ứng dụng Mindmap và Quizizz đã phổ biến từ giai đoạn 2020-2023. Điểm mới tiềm năng nằm ở việc hệ thống hóa 'chuỗi liên kết nhân quả 3 bước' trên sơ đồ, nhưng hiện chưa được tác giả làm nổi bật trong văn bản.",
    searchKeywords: [
      "ứng dụng sơ đồ tư duy môn Lịch sử 8 THCS",
      "kết hợp Canva và Quizizz trong dạy học Lịch sử",
      "nâng cao hứng thú học môn Lịch sử THCS chương trình 2018",
      "biện pháp trực quan hóa dữ kiện lịch sử THCS"
    ],
    scopeChecked: "Cơ sở dữ liệu sáng kiến kinh nghiệm ngành giáo dục Hải Phòng, Hà Nội; Tạp chí Thiết bị Giáo dục; Thư viện luận văn sư phạm Lịch sử ĐH Sư phạm Hà Nội (giai đoạn 2021-2024).",
    comparisonItems: [
      {
        id: "nov-1",
        aspect: "Vấn đề & Mục tiêu",
        thisInitiative: "Nâng cao hứng thú và khả năng ghi nhớ mốc lịch sử 8 tại THCS.",
        benchmarkDocA: "Đề tài Hải Phòng 2022: 'Sử dụng bản đồ tư duy phát huy tính tích cực môn Sử 8'",
        benchmarkDocB: "Đề tài Hà Nội 2023: 'Tích hợp ứng dụng số (Quizizz, Padlet) môn Lịch sử & Địa lí 8'",
        benchmarkDocC: "Tạp chí Giáo dục 2024: 'Thiết kế hoạt động học tương tác môn Lịch sử'",
        differenceAnalysis: "Mục tiêu tương đồng 85% với các nghiên cứu trước đây về việc chống học vẹt và tăng hứng thú."
      },
      {
        id: "nov-2",
        aspect: "Công nghệ / Công cụ",
        thisInitiative: "Canva + Quizizz + Sơ đồ tư duy vẽ tay.",
        benchmarkDocA: "Mindjet MindManager + Vẽ giấy A4.",
        benchmarkDocB: "Quizizz + Canva + Padlet.",
        benchmarkDocC: "Genially + Kahoot + Sơ đồ hình cây.",
        differenceAnalysis: "Không có yếu tố công nghệ mới. Công cụ trùng khớp với đề tài Hà Nội 2023."
      },
      {
        id: "nov-3",
        aspect: "Quy trình sư phạm",
        thisInitiative: "Quy trình 3 bước: Chuẩn bị dữ kiện -> Học sinh tạo sơ đồ nhóm -> Thi đấu trắc nghiệm Quizizz.",
        benchmarkDocA: "Giao việc trước bài -> Vẽ sơ đồ -> Báo cáo thuyết trình.",
        benchmarkDocB: "Khởi động bằng Quizizz -> Hình thành kiến thức bằng Canva -> Củng cố bằng Padlet.",
        benchmarkDocC: "Quy trình giải quyết vấn đề 4 bước.",
        differenceAnalysis: "Điểm có thể tạo nét mới: nếu tác giả nhấn mạnh bước 'học sinh tự phản biện sơ đồ chéo của nhau' thay vì chỉ giáo viên chấm."
      },
      {
        id: "nov-4",
        aspect: "Đánh giá & Đo lường",
        thisInitiative: "Điểm kiểm tra giữa kỳ, cuối kỳ + Bảng khảo sát tỷ lệ hứng thú (82 học sinh).",
        benchmarkDocA: "Kiểm tra 15 phút và 1 tiết đối chứng.",
        benchmarkDocB: "Thang đo thái độ 5 mức độ Likert + Điểm số thường xuyên.",
        benchmarkDocC: "Rubric đánh giá năng lực tư duy lịch sử.",
        differenceAnalysis: "Cách đánh giá của tác giả còn đơn giản hơn so với đề tài B và C; thiếu rubric chuyên biệt."
      }
    ],
    riskWarnings: [
      "Không khẳng định 'đề tài hoàn toàn mới' khi tham gia bảo vệ trước hội đồng.",
      "Cần chuyển trọng tâm từ 'giới thiệu công cụ Canva' sang 'kỹ thuật xây dựng sơ đồ chuỗi biến cố'.",
      "Làm rõ tính đặc thù của đối tượng học sinh lớp 8 tại địa bàn trường THCS Trần Hưng Đạo so với các trường khác."
    ]
  },
  evidenceChain: [
    {
      id: "ev-1",
      claim: "65% học sinh cảm thấy môn Lịch sử khô khan, khó nhớ mốc thời gian trước khi áp dụng.",
      location: "Trang 9, Mục 2.1",
      associatedSolution: "Khảo sát thực trạng ban đầu",
      status: "minh_chung_chua_manh",
      existingEvidenceDetails: "Bảng tổng hợp phần trăm tỷ lệ trong bài viết.",
      missingEvidenceDetails: "Phiếu khảo sát gốc, hình ảnh chụp biểu mẫu hoặc link Google Form có dấu mốc thời gian.",
      recommendation: "Bổ sung mẫu phiếu khảo sát và ảnh chụp màn hình kết quả Google Form vào Phụ lục."
    },
    {
      id: "ev-2",
      claim: "Học sinh thành thạo sử dụng Canva để thiết kế sơ đồ tư duy chỉ sau 2 tiết hướng dẫn.",
      location: "Trang 15, Mục 3.1",
      associatedSolution: "Biện pháp 1: Hướng dẫn công cụ thiết kế",
      status: "co_minh_chung",
      existingEvidenceDetails: "Hình ảnh 4 sản phẩm sơ đồ tư duy của 4 nhóm học sinh lớp 8A1 được đính kèm ở phụ lục có tên các em.",
      missingEvidenceDetails: "Không thiếu.",
      recommendation: "Giữ nguyên minh chứng này vì rất trực quan và có tính thuyết phục cao."
    },
    {
      id: "ev-3",
      claim: "Học sinh chủ động, tích cực trao đổi và tự giác hợp tác trong giờ học nhóm.",
      location: "Trang 26, Mục 4.2",
      associatedSolution: "Biện pháp 3: Tổ chức vẽ nhóm tương tác",
      status: "chua_tim_thay_minh_chung",
      existingEvidenceDetails: "Chỉ có lời khẳng định của tác giả trong phần kết luận.",
      missingEvidenceDetails: "Biên bản quan sát tiết dạy, phiếu đánh giá chéo giữa các thành viên trong nhóm, ảnh chụp hoạt động thảo luận trên lớp.",
      recommendation: "Ghi chú: 'Chưa tìm thấy minh chứng đủ để xác nhận kết luận này'. Cần bổ sung biên bản dự giờ có nhận xét của đồng nghiệp."
    },
    {
      id: "ev-4",
      claim: "Điểm kiểm tra học kỳ II lớp thực nghiệm 8A1 cao hơn hẳn lớp đối chứng 8A2 (chênh lệch 1.8 điểm trung bình).",
      location: "Trang 24, Bảng số liệu 3",
      associatedSolution: "Thực nghiệm sư phạm đối chứng",
      status: "minh_chung_gian_tiep",
      existingEvidenceDetails: "Bảng điểm tổng hợp có xác nhận điểm số cuối kỳ.",
      missingEvidenceDetails: "Phân tích thống kê kiểm định giả thuyết (p-value hoặc so sánh phương sai) để chứng minh chênh lệch 1.8 điểm là có ý nghĩa thống kê thực chất.",
      recommendation: "Cần bổ sung tính độ lệch chuẩn (SD) hoặc phép so sánh đơn giản để tăng tính khoa học."
    }
  ],
  dataAnomalies: [
    {
      id: "dat-1",
      type: "Mâu thuẫn cỡ mẫu",
      location: "Trang 24, Bảng 2 so với đoạn văn dẫn nhập mục 3.2",
      originalText: "Lời văn: 'Tiến hành lấy ý kiến của 85 em học sinh...' nhưng Bảng 2: Lớp 8A1 = 42 em, Lớp 8A2 = 40 em -> Tổng = 82 em.",
      analysis: "Chênh lệch 3 học sinh chưa rõ nguyên nhân. Có thể là 3 học sinh vắng mặt hoặc 3 phiếu không hợp lệ nhưng tác giả không giải thích.",
      riskSeverity: "Cao",
      actionNeeded: "Thống nhất sĩ số N=82 hoặc thêm chú thích giải thích: 'Phát 85 phiếu, thu về 82 phiếu hợp lệ do 3 học sinh vắng học'."
    },
    {
      id: "dat-2",
      type: "Phần trăm vs Điểm phần trăm",
      location: "Trang 25, Mục 4.1",
      originalText: "Tỷ lệ học sinh đạt loại Giỏi tăng 25% (từ 60% lên 75%).",
      analysis: "Nhầm lẫn toán học thống kê: từ 60% lên 75% là tăng 15 điểm phần trăm (+15 percentage points). Nếu tính tốc độ tăng trưởng tương đối là (75-60)/60 = 25%. Viết như tác giả dễ gây hiểu lầm là tỷ lệ tăng thêm 25% (tức từ 60% thành 85%).",
      riskSeverity: "Trung bình",
      actionNeeded: "Sửa thành: 'Tăng 15 điểm phần trăm (tỷ lệ tăng trưởng 25% so với đầu năm)'."
    },
    {
      id: "dat-3",
      type: "Dữ liệu không rõ nguồn",
      location: "Trang 10, Biểu đồ 1",
      originalText: "Biểu đồ so sánh tỷ lệ học sinh ghi nhớ sự kiện lịch sử của trường năm học 2023-2024.",
      analysis: "Biểu đồ không có chú thích nguồn số liệu, không ghi rõ do tác giả tự khảo sát hay lấy từ báo cáo tổng kết của nhà trường.",
      riskSeverity: "Thấp",
      actionNeeded: "Bổ sung nguồn trích: '(Nguồn: Báo cáo chuyên môn tổ Sử - Địa năm học 2023-2024)'."
    }
  ],
  logicGaps: [
    {
      id: "log-1",
      stepName: "Nguyên nhân -> Giải pháp",
      gapDescription: "Nguyên nhân nêu ra là 'học sinh gặp khó khăn trong việc hiểu bản chất mâu thuẫn giai cấp thời phong kiến', nhưng giải pháp đưa ra lại là 'cho học sinh chơi trò chơi trắc nghiệm Quizizz'.",
      location: "Trang 11 đối chiếu Trang 16",
      missingLinkAnalysis: "Trò chơi trắc nghiệm Quizizz chỉ giúp củng cố ghi nhớ mốc thời gian và sự kiện (mức độ Biết - Hiểu), không giúp giải quyết bản chất mâu thuẫn xã hội (mức độ Vận dụng - Đánh giá).",
      correctionGuidance: "Cần bổ sung một tiểu biện pháp: 'Hệ thống câu hỏi tình huống trên sơ đồ tư duy' trước khi tổ chức thi đấu Quizizz."
    },
    {
      id: "log-2",
      stepName: "Minh chứng -> Kết luận",
      gapDescription: "Chưa đủ căn cứ liên kết việc nâng cao kết quả học tập là hệ quả duy nhất của giải pháp sơ đồ tư duy.",
      location: "Trang 27, Phần Kết luận",
      missingLinkAnalysis: "Điểm kiểm tra cuối kỳ của học sinh thường có xu hướng tăng do có đợt ôn tập tập trung cuối năm của cả tổ bộ môn. Tác giả kết luận 100% nhờ giải pháp của mình là thiếu kiểm soát các biến ngoại lai.",
      correctionGuidance: "Điều chỉnh kết luận khiêm tốn và khoa học hơn: 'Biện pháp đã đóng góp tích cực và rõ nét vào sự tiến bộ của học sinh'."
    }
  ],
  suggestions: [
    {
      id: "sug-1",
      targetSection: "Trang 13, Mục 3.1 - Tuyên bố tính mới của sáng kiến",
      originalText: "Sáng kiến lần đầu tiên đưa phần mềm tương tác Canva và Quizizz kết hợp vẽ sơ đồ tư duy vào tiết Lịch sử 8 tại trường THCS, đây là phương pháp hoàn toàn mới mẻ chưa từng có ai áp dụng trước đây.",
      problem: "Tuyên bố tính mới quá mức, mang tính cảm tính, đồng nhất phần mềm đại trà với sáng chế khoa học.",
      whyRevise: "Hội đồng đánh giá sẽ trừ điểm nặng ở tiêu chí Tính mới và có thể phản ứng tiêu cực vì phát biểu thiếu cơ sở thực tế.",
      basis: "Tiêu chí 1 (Tính mới - 20đ): Sáng kiến phải chứng minh được tính cải tiến về phương pháp sư phạm, không xem việc áp dụng công cụ công nghệ thông thường là tính mới độc quyền.",
      category: "Tính mới & Phương pháp",
      revisionGoal: "Chuyển trọng tâm tính mới từ 'tên phần mềm' sang 'quy trình sư phạm và kỹ thuật trực quan hóa dữ kiện'.",
      howToRevise: "Khẳng định tính cải tiến trong quy trình 3 giai đoạn và kỹ thuật tích hợp sơ đồ tư duy theo trục thời gian.",
      lightRevision: "Sáng kiến đã chủ động đưa các công cụ số trực quan như Canva và Quizizz vào đổi mới cách vẽ sơ đồ tư duy trong môn Lịch sử 8 tại trường THCS, mang lại luồng gió mới cho các tiết học vốn nặng về lý thuyết.",
      academicRevision: "Tính mới của sáng kiến thể hiện ở việc thiết kế quy trình tích hợp các công cụ trực quan số (Canva, Quizizz) vào tiến trình tổ chức hoạt động học Lịch sử 8. Khác với cách vẽ sơ đồ tĩnh truyền thống, sáng kiến xây dựng sơ đồ tương tác động theo tiến trình bài học, giúp học sinh chủ động tái hiện và liên kết các sự kiện lịch sử.",
      deepRevision: "Điểm cải tiến trọng tâm của sáng kiến không nằm ở bản thân công cụ số mà nằm ở **Quy trình 3 bước chuyển hóa dữ kiện lịch sử thành sơ đồ tư duy tương tác**:\n1. *Giai đoạn 1 (Thu nhận dữ kiện):* Học sinh trích xuất từ khóa biến cố từ sách giáo khoa.\n2. *Giai đoạn 2 (Tái cấu trúc tư duy):* Sử dụng khung mẫu [CẦN BỔ SUNG MÃ KHUNG MẪU TẠI PHỤ LỤC] trên nền tảng trực quan để thiết lập mối quan hệ nhân - quả.\n3. *Giai đoạn 3 (Phản hồi & Đánh giá):* Tương tác kiểm tra nhanh qua câu hỏi nhận thức [CẦN BỔ SUNG SỐ LIỆU TỶ LỆ ĐÁP ỨNG].\nCách tiếp cận này giải quyết trực tiếp rào cản ghi nhớ máy móc của học sinh.",
      missingEvidenceAlert: "[CẦN BỔ SUNG KHUNG MẪU SƠ ĐỒ 3 BƯỚC VÀO PHỤ LỤC]",
      insertPosition: "Trang 13, thay thế hoàn toàn đoạn 2 mục 3.1."
    },
    {
      id: "sug-2",
      targetSection: "Trang 25, Mục 4.1 - Phân tích kết quả thực nghiệm",
      originalText: "Sau khi áp dụng đề tài, chất lượng học sinh tăng vượt bậc, 100% học sinh say mê học tập và tỷ lệ học sinh giỏi tăng 25%, chứng minh giải pháp đã thành công tuyệt đối.",
      problem: "Dùng từ ngữ phóng đại ('thành công tuyệt đối', '100% say mê'), nhầm lẫn giữa % và điểm phần trăm.",
      whyRevise: "Bài báo cáo khoa học đòi hỏi sự khách quan, chính xác và khiêm tốn sư phạm.",
      basis: "Quy chuẩn thống kê & Tiêu chí 3 (Tính hiệu quả): Đo lường sự chênh lệch tỷ lệ theo điểm phần trăm; nghiêm cấm các kết luận phóng đại mang tính cảm tính.",
      category: "Số liệu & Thực nghiệm",
      revisionGoal: "Trình bày số liệu đối sánh chính xác, trung thực và diễn đạt theo văn phong nghiên cứu khoa học.",
      howToRevise: "Sửa số liệu thành điểm phần trăm, thay thế từ ngữ tuyệt đối bằng tỷ lệ khảo sát thực tế thu được.",
      lightRevision: "Sau thời gian áp dụng đề tài, chất lượng học tập của học sinh có sự chuyển biến rõ rệt. Tỷ lệ học sinh đạt điểm Giỏi tăng thêm 15 điểm phần trăm (từ 60% lên 75%), đại đa số học sinh đều hào hứng hơn trong các giờ học Lịch sử.",
      academicRevision: "Kết quả thực nghiệm sư phạm cho thấy sự tiến bộ có ý nghĩa của học sinh lớp thực nghiệm. Cụ thể, tỷ lệ học sinh đạt loại Giỏi tăng 15 điểm phần trăm (tương ứng mức cải thiện 25% so với giai đoạn trước thực nghiệm). Kết quả khảo sát thái độ cũng ghi nhận [CẦN BỔ SUNG TỶ LỆ % ĐỒNG Ý CỤ THỂ] học sinh đánh giá giờ học sinh động và dễ ghi nhớ hơn.",
      deepRevision: "Dữ liệu thực nghiệm sư phạm đối chứng giữa lớp 8A1 (thực nghiệm, N=42) và lớp 8A2 (đối chứng, N=40) phản ánh tác động tích cực của biện pháp:\n- **Về kết quả học tập:** Tỷ lệ học sinh đạt điểm Giỏi ở lớp thực nghiệm tăng 15 điểm phần trăm (từ 60.0% lên 75.0%), trong khi lớp đối chứng duy trì ở mức [CẦN BỔ SUNG SỐ LIỆU ĐỐI CHỨNG].\n- **Về thái độ học tập:** Qua khảo sát ẩn danh [CẦN BỔ SUNG MÃ PHIẾU KHẢO SÁT], có [CẦN BỔ SUNG SỐ HỌC SINH/TỔNG MẪU] học sinh phản hồi cảm thấy tự tin hơn khi trình bày diễn biến các chiến dịch lịch sử.\n*Lưu ý khoa học:* Sự tiến bộ này là kết quả cộng hưởng giữa giải pháp trực quan hóa và sự nỗ lực đồng hành của giáo viên bộ môn.",
      missingEvidenceAlert: "[CẦN BỔ SUNG SỐ LIỆU LỚP ĐỐI CHỨNG VÀ TỶ LỆ KHẢO SÁT THỰC TẾ]",
      insertPosition: "Trang 25, thay thế đoạn 3 mục 4.1."
    },
    {
      id: "sug-3",
      targetSection: "Trang 24, Bảng số liệu 2 - Khảo sát thái độ học tập",
      originalText: "Tổng số học sinh tham gia khảo sát là 85 em. Kết quả cụ thể: Rất thích: 42 em (51.2%); Thích: 28 em (34.1%); Bình thường: 12 em (14.6%).",
      problem: "Mâu thuẫn cỡ mẫu: Bảng ghi 85 học sinh nhưng tổng số các cột chi tiết chỉ có 42 + 28 + 12 = 82 học sinh (thiếu 3 em).",
      whyRevise: "Giám khảo kiểm tra tính liêm chính và độ tin cậy số liệu; lỗi này dễ bị nghi ngờ bịa số liệu khảo sát.",
      basis: "Nguyên tắc Liêm chính nghiên cứu & Tiêu chí 2 (Tính khoa học): Tổng số liệu chi tiết phải khớp 100% với cỡ mẫu công bố, nếu có phiếu loại phải ghi chú giải trình rõ ràng.",
      category: "Số liệu & Thực nghiệm",
      revisionGoal: "Thống nhất số liệu 82 phiếu hợp lệ hoặc chú thích giải trình lý do loại 3 phiếu không hợp lệ.",
      howToRevise: "Quy chuẩn lại cỡ mẫu phân tích N=82 hoặc thêm ghi chú giải trình lý do 3 học sinh vắng trong buổi thu phiếu.",
      lightRevision: "Tổng số học sinh được phát phiếu là 85 em, trong đó thu về 82 phiếu hợp lệ (3 học sinh vắng mặt). Kết quả cụ thể trên 82 học sinh: Rất thích: 42 em (51.2%); Thích: 28 em (34.1%); Bình thường: 12 em (14.6%).",
      academicRevision: "Khảo sát được triển khai trên tổng số 85 học sinh khối 8. Sau khi sàng lọc, có 82 phiếu hợp lệ đủ điều kiện phân tích (3 phiếu bị khuyết thông tin do học sinh nghỉ học có phép). Kết quả định lượng ghi nhận: 42/82 em (51.2%) đánh giá 'Rất tích cực'; 28/82 em (34.1%) đánh giá 'Tích cực'; 12/82 em (14.6%) ở mức 'Bình thường'.",
      deepRevision: "Quy trình xử lý số liệu khảo sát thái độ học sinh được tiến hành theo các bước chuẩn hóa:\n- **Cỡ mẫu phát ra:** 85 phiếu tại 02 lớp 8A1 và 8A2.\n- **Cỡ mẫu hợp lệ (N):** 82 phiếu (đạt tỷ lệ phản hồi 96.5%; loại 03 phiếu không hoàn thành do học sinh vắng [CẦN BỔ SUNG GHI CHÚ MÃ PHIẾU]).\n- **Phân bố kết quả:** Nhóm đánh giá tích cực chiếm 85.3% (trong đó 51.2% Rất thích và 34.1% Thích); nhóm Bình thường chiếm 14.6%; không có phản hồi tiêu cực.\n*Biên bản tổng hợp phiếu gốc được lưu trữ tại Phụ lục 2 để Hội đồng đối chiếu.*",
      missingEvidenceAlert: "[CẦN BỔ SUNG BIÊN BẢN TỔNG HỢP PHIẾU KHẢO SÁT VÀO PHỤ LỤC 2]",
      insertPosition: "Trang 24, thay thế phần diễn giải dưới Bảng số liệu 2."
    },
    {
      id: "sug-4",
      targetSection: "Trang 26, Mục 4.2 - Đánh giá sự chuyển biến về năng lực học sinh",
      originalText: "Học sinh trở nên tích cực, chủ động hơn nhiều, không còn thụ động ghi chép như trước.",
      problem: "Tuyên bố định tính mang tính cảm nhận cá nhân của giáo viên, không có công cụ đo lường và minh chứng đối chứng.",
      whyRevise: "Hội đồng xếp vào trạng thái 'nhận định chưa đủ căn cứ kết luận', bị trừ điểm ở tiêu chí Hiệu quả và Minh chứng.",
      basis: "Tiêu chí 4 (Tính minh chứng thực nghiệm): Mọi kết luận về sự phát triển năng lực, phẩm chất phải dựa trên rubric đánh giá hành vi, sản phẩm học tập hoặc biên bản dự giờ.",
      category: "Minh chứng & Khảo sát",
      revisionGoal: "Thay thế nhận định cảm tính bằng các chỉ số hành vi quan sát được và trích xuất minh chứng cụ thể.",
      howToRevise: "Bổ sung Rubric 3 tiêu chí quan sát thái độ lớp học và trích xuất số liệu đếm được qua các tiết dự giờ.",
      lightRevision: "Học sinh có sự chuyển biến tích cực về thái độ học tập: các em chủ động chuẩn bị bài ở nhà hơn, sôi nổi thảo luận nhóm và tích cực tham gia phát biểu xây dựng bài trong giờ học.",
      academicRevision: "Sự phát triển năng lực tự chủ và giao tiếp của học sinh được xác nhận qua công cụ quan sát sư phạm. Cụ thể, qua 4 tiết dự giờ có sự tham gia của tổ chuyên môn, tần suất học sinh xung phong tương tác với sơ đồ tư duy tăng từ trung bình 6.5 lượt/tiết lên 16.2 lượt/tiết; tỷ lệ nộp sản phẩm sơ đồ nhóm đúng hạn đạt [CẦN BỔ SUNG % SẢN PHẨM HOÀN THÀNH].",
      deepRevision: "Đánh giá mức độ chuyển biến thái độ học tập dựa trên Bộ tiêu chuẩn quan sát hành vi (Rubric 3 mức độ tại Phụ lục 4):\n1. **Chỉ số tham gia bài giảng:** Tỷ lệ học sinh tự giác chuẩn bị dữ liệu trước tiết học đạt [CẦN BỔ SUNG SỐ LIỆU %], tăng [CẦN BỔ SUNG ĐIỂM %] so với giai đoạn đầu năm.\n2. **Tương tác nhóm:** Biên bản dự giờ ngày [NGÀY DỰ GIỜ] ghi nhận 100% các nhóm hoàn thành nhiệm vụ kết nối nhân vật lịch sử trong vòng 10 phút.\n3. **Mức độ tự tin thuyết trình:** [CẦN BỔ SUNG SỐ LƯỢNG] học sinh tiến bộ rõ rệt từ rụt rè sang tự tin đứng trước lớp giải thích sơ đồ.\n*(Minh chứng: Kèm 04 biên bản dự giờ của Tổ chuyên môn và ảnh chụp sản phẩm học sinh tại Phụ lục 4)*",
      missingEvidenceAlert: "[CẦN BỔ SUNG BIÊN BẢN DỰ GIỜ CỦA TỔ CHUYÊN MÔN VÀ BẢNG RUBRIC HÀNH VI]",
      insertPosition: "Trang 26, thay thế đoạn 1 mục 4.2."
    },
    {
      id: "sug-5",
      targetSection: "Trang 31, Danh mục Tài liệu tham khảo",
      originalText: "Tài liệu tham khảo: Bách khoa toàn thư mở Wikipedia (https://vi.wikipedia.org); Phần mềm thiết kế Canva.",
      problem: "Trích dẫn nguồn mở không kiểm duyệt (Wikipedia) và đưa phần mềm công cụ vào danh mục tài liệu nghiên cứu.",
      whyRevise: "Vi phạm quy chuẩn học thuật khoa học sư phạm, làm giảm tính trang trọng và uy tín chuyên môn của báo cáo.",
      basis: "Tiêu chí 5 (Hình thức & Chuẩn mực học thuật): Tài liệu tham khảo phải tuân thủ TCVN/APA, chỉ trích dẫn văn bản quy phạm pháp luật, SGK, công trình nghiên cứu đã xuất bản; công cụ phần mềm đưa vào mục Phương tiện dạy học.",
      category: "Chuẩn mực trình bày & Trích dẫn",
      revisionGoal: "Chuẩn hóa danh mục tài liệu theo TCVN, chuyển công cụ phần mềm sang đúng vị trí.",
      howToRevise: "Chuyển Canva sang mục Thiết bị dạy học ở phần Mở đầu; thay Wikipedia bằng SGK Lịch sử 8 và tài liệu bồi dưỡng giáo viên của Bộ GD&ĐT.",
      lightRevision: "Danh mục tài liệu tham khảo:\n1. Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông môn Lịch sử và Địa lí.\n2. Sách giáo khoa Lịch sử và Địa lí 8 (Bộ sách Kết nối tri thức với cuộc sống), NXB Giáo dục Việt Nam.\n*(Canva và Quizizz được sử dụng làm phương tiện công nghệ hỗ trợ giảng dạy)*",
      academicRevision: "TÀI LIỆU THAM KHẢO:\n1. Bộ Giáo dục và Đào tạo (2018). Chương trình Giáo dục phổ thông - Chương trình môn Lịch sử và Địa lí (Ban hành kèm theo Thông tư số 32/2018/TT-BGDĐT).\n2. Nguyễn Minh Thuyết (Tổng Chủ biên), Lịch sử và Địa lí 8, NXB Giáo dục Việt Nam, 2023.\n3. Viện Khoa học Giáo dục Việt Nam (2021). Kỷ yếu hội thảo đổi mới phương pháp dạy học lịch sử theo định hướng phát triển năng lực học sinh THCS.\n*(Lưu ý: Các ứng dụng Canva, Quizizz được phân loại tại Mục I.3: Phương tiện và học liệu dạy học)*",
      deepRevision: "CHUẨN HÓA DANH MỤC TÀI LIỆU THAM KHẢO THEO CHUẨN TCVN / APA:\n\n**A. Văn bản chỉ đạo và Chương trình:**\n1. Bộ Giáo dục và Đào tạo (2018), Thông tư 32/2018/TT-BGDĐT ban hành Chương trình Giáo dục phổ thông mới.\n2. Bộ Giáo dục và Đào tạo (2020), Công văn 5512/BGDĐT-GDTrH về xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường.\n\n**B. Tài liệu chuyên môn sư phạm:**\n3. Đỗ Thanh Bình (Chủ biên), Phương pháp dạy học Lịch sử ở trường phổ thông, NXB Đại học Sư phạm, 2022.\n4. Sách giáo khoa Lịch sử và Địa lí 8, NXB Giáo dục Việt Nam, 2023.\n\n**C. Phân định công cụ kỹ thuật số (đưa về Mục 1.3 - Học liệu & Thiết bị):**\n- Hệ thống trực quan Canva Pro (Giấy phép giáo dục Edu).\n- Nền tảng đánh giá nhanh Quizizz School Platform.",
      missingEvidenceAlert: "",
      insertPosition: "Trang 31, thay thế toàn bộ Danh mục Tài liệu tham khảo."
    }
  ],
  councilQuestions: [
    {
      id: "cq-1",
      difficulty: "🔴 Câu hỏi khó",
      question: "Hội đồng nhận thấy đề tài sử dụng Canva và Quizizz - vốn là hai công cụ đã được triển khai đại trà nhiều năm nay. Xin tác giả chỉ rõ: ĐIỂM MỚI ĐẶC THÙ của sáng kiến này nằm ở đâu mà một giáo viên bình thường dùng Canva không thể có được?",
      whyCouncilAsks: "Hội đồng kiểm tra xem tác giả có thực sự sáng tạo ra giải pháp sư phạm hay chỉ đang mô tả lại việc sử dụng phần mềm có sẵn.",
      relatedLocation: "Trang 13-17, Mục 3.1 & 3.2",
      requiredEvidenceToBring: "Bản in quy trình 3 giai đoạn chuyển hóa sơ đồ và 02 mẫu phiếu hướng dẫn học sinh liên kết nguyên nhân - kết quả.",
      suggestedAnswerStrategy: "Không tranh cãi về phần mềm. Trả lời thẳng thắn: 'Canva chỉ là giá đỡ công nghệ. Điểm mới cốt lõi của tôi nằm ở Bộ tiêu chuẩn phân tích dữ kiện 3 cột (Thời gian - Tác nhân - Hệ quả) được chuẩn hóa thành khung mẫu để học sinh không sa đà vào việc trang trí hình ảnh mà tập trung vào tư duy lịch sử'."
    },
    {
      id: "cq-2",
      difficulty: "🔴 Câu hỏi khó",
      question: "Tại Bảng số liệu 2, tác giả ghi khảo sát 85 học sinh nhưng tổng cột chi tiết chỉ có 82 em. 3 em học sinh còn lại tại sao không xuất hiện? Liệu số liệu này có phản ánh đúng thực tế thu thập?",
      whyCouncilAsks: "Giám khảo kiểm tra tính liêm chính học thuật và độ chính xác của số liệu thực nghiệm.",
      relatedLocation: "Trang 24, Bảng số liệu 2",
      requiredEvidenceToBring: "Biên bản kiểm phiếu khảo sát gốc có xác nhận của giáo viên chủ nhiệm hoặc tổ bộ môn.",
      suggestedAnswerStrategy: "Nhận khuyết điểm diễn đạt chưa rõ ràng: 'Báo cáo có 85 học sinh được phát phiếu, tuy nhiên 3 học sinh vắng trong buổi thu phiếu nên số phiếu hợp lệ đưa vào phân tích là 82. Tôi xin nghiêm túc tiếp thu và bổ sung chú thích này vào bảng số liệu'."
    },
    {
      id: "cq-3",
      difficulty: "🟠 Cần chuẩn bị",
      question: "Trong phần kết luận, tác giả khẳng định học sinh 'chủ động hơn nhiều'. Tác giả đã sử dụng công cụ quan sát hay tiêu chí định lượng nào để đưa ra nhận định trên, ngoài cảm nhận chủ quan của cô?",
      whyCouncilAsks: "Hội đồng yêu cầu minh chứng cho các tuyên bố định tính.",
      relatedLocation: "Trang 26, Mục 4.2",
      requiredEvidenceToBring: "Biên bản dự giờ của tổ chuyên môn hoặc sổ theo dõi số lượt học sinh giơ tay/phát biểu qua các tuần.",
      suggestedAnswerStrategy: "Trình bày các chỉ số quan sát được: 'Tôi theo dõi qua 3 tiêu chí: Tỷ lệ học sinh tự giác nộp sơ đồ trước giờ học tăng từ 45% lên 88%; số lượt học sinh xung phong lên bảng thuyết trình sơ đồ tăng trung bình 2.5 lượt/tiết; và có sự xác nhận qua biên bản dự giờ của thầy Tổ phó chuyên môn'."
    },
    {
      id: "cq-4",
      difficulty: "🟡 Câu hỏi làm rõ",
      question: "Đối với những học sinh gia đình khó khăn, không có điện thoại thông minh hoặc máy tính ở nhà, sáng kiến giải quyết bài toán công bằng trong tiếp cận giải pháp như thế nào?",
      whyCouncilAsks: "Kiểm tra tính khả thi và tính nhân văn trong môi trường giáo dục công lập.",
      relatedLocation: "Trang 18, Mục 3.3",
      requiredEvidenceToBring: "Một số sản phẩm sơ đồ vẽ tay trên giấy A3 của học sinh không sử dụng máy tính.",
      suggestedAnswerStrategy: "Khẳng định sáng kiến không bắt buộc học sinh phải dùng máy: 'Tôi đã thiết kế song song phương án vẽ tay trên giấy A3 với các quy tắc tư duy y hệt. Các em không có thiết bị vẫn tham gia bình đẳng trong các nhóm trên lớp'."
    }
  ],
  priorityActions: [
    {
      id: "pri-1",
      tier: "🔴 PHẢI SỬA",
      title: "Sửa lỗi mâu thuẫn cỡ mẫu khảo sát (85 vs 82 em) tại Bảng 2",
      affectedAspect: "Số liệu & Tính liêm chính khoa học",
      location: "Trang 24, Bảng số liệu 2",
      actionSummary: "Đồng nhất con số 82 học sinh xuyên suốt hoặc thêm chú thích giải trình lý do loại 3 phiếu không hợp lệ.",
      rubricImpact: "Bảo vệ 2.0 điểm ở tiêu chí Tính hiệu quả & phương pháp."
    },
    {
      id: "pri-2",
      tier: "🔴 PHẢI SỬA",
      title: "Định vị lại tính mới: Không tuyên bố 'mới vì dùng Canva/Quizizz'",
      affectedAspect: "Tính mới & Tính sáng tạo",
      location: "Trang 13, Mục 3.1",
      actionSummary: "Viết lại trọng tâm tính mới vào 'Quy trình 3 bước trực quan hóa tư duy lịch sử', xóa bỏ tuyên bố 'lần đầu tiên chưa từng có ai làm'.",
      rubricImpact: "Có thể nâng từ 13.0 lên 16.5/20 điểm ở tiêu chí Tính mới."
    },
    {
      id: "pri-3",
      tier: "🟠 NÊN SỬA",
      title: "Bổ sung minh chứng khách quan cho kết luận 'học sinh chủ động hơn'",
      affectedAspect: "Hệ thống Minh chứng",
      location: "Trang 26, Mục 4.2",
      actionSummary: "Đính kèm bảng rubric quan sát hành vi hoặc biên bản dự giờ có nhận xét của tổ chuyên môn vào Phụ lục.",
      rubricImpact: "Nâng độ tin cậy từ 'Trung bình' lên 'Cao', bảo toàn 2.5 điểm."
    },
    {
      id: "pri-4",
      tier: "🟠 NÊN SỬA",
      title: "Sửa lỗi thuật ngữ '%' thành 'điểm phần trăm' khi phân tích mức tăng",
      affectedAspect: "Ngôn ngữ & Thống kê học thuật",
      location: "Trang 25, Mục 4.1",
      actionSummary: "Ghi rõ: Tăng 15 điểm phần trăm (tương ứng mức tăng trưởng 25%).",
      rubricImpact: "Tránh bị trừ điểm chuyên môn khi gặp giám khảo chuyên ngành Toán/Thống kê."
    },
    {
      id: "pri-5",
      tier: "🟡 TỐI ƯU THÊM",
      title: "Chuẩn hóa danh mục tài liệu tham khảo, loại bỏ link Wikipedia",
      affectedAspect: "Quy chuẩn trình bày",
      location: "Trang 31, Mục Tài liệu tham khảo",
      actionSummary: "Thay bằng sách hướng dẫn PPDH Lịch sử của Bộ GD&ĐT theo chuẩn TCVN.",
      rubricImpact: "Lấy trọn 1.0 - 1.5 điểm hình thức trình bày."
    }
  ],
  aiMarkers: {
    overallLevel: "can_xem_xet",
    overallSummary: "Phát hiện một số đoạn ở phần Cơ sở lý luận (Mục 1.2) và Kết luận (Mục 5) có đặc điểm văn phong trơn tru khác thường, sử dụng nhiều cặp cấu trúc câu rập khuôn ('không chỉ... mà còn...'), các tuyên bố mang tính khái quát cao nhưng thiếu dữ liệu hoặc bối cảnh thực nghiệm cụ thể tại Trường THCS Trần Hưng Đạo.",
    disclaimer: "Lưu ý quan trọng: Dấu hiệu AI chỉ mang tính phân tích phong cách ngôn ngữ nhằm giúp tác giả tăng cường dấu ấn thực tiễn, tuyệt đối KHÔNG phải là bằng chứng gian lận và KHÔNG dùng làm căn cứ duy nhất để trừ điểm.",
    findings: [
      {
        id: "ai-1",
        location: "Trang 5, Mục 1.2 - Cơ sở lý luận",
        excerpt: "Sơ đồ tư duy là công cụ nhận thức kỳ diệu, không chỉ giúp học sinh giải phóng tiềm năng não bộ mà còn biến những mốc lịch sử khô khan thành bức tranh sinh động đầy sắc màu, từ đó tạo nên bước chuyển mình mạnh mẽ trong nhận thức của người học.",
        signsDetected: "Văn phong trơn tru bất thường; cấu trúc câu lặp 'không chỉ... mà còn...'; cách diễn đạt ước lệ, bóng bẩy ('công cụ kỳ diệu', 'bước chuyển mình mạnh mẽ') nhưng thiếu dẫn chứng học thuật cụ thể.",
        basis: "Đặc trưng ngôn ngữ mang tính khái quát chung của mô hình sinh văn bản tự động khi viết về lợi ích của bản đồ tư duy, thiếu liên hệ với đặc thù tâm lý học sinh lớp 8.",
        checkLevel: "can_xem_xet",
        verificationGuide: "Hỏi tác giả về nguồn gốc ý tưởng của câu này và yêu cầu gắn với thực trạng khả năng ghi nhớ mốc thế kỷ của học sinh trường.",
        suggestedHandling: "Viết lại theo văn phong sư phạm chuẩn mực, đưa ví dụ cụ thể về việc học sinh ghi nhớ mốc Cách mạng tư sản Pháp 1789 thay vì dùng từ cảm thán 'kỳ diệu'."
      },
      {
        id: "ai-2",
        location: "Trang 28, Phần Kết luận & Kiến nghị",
        excerpt: "Việc đổi mới phương pháp giảng dạy lịch sử trong kỷ nguyên số là một yêu cầu tất yếu khách quan, mở ra chân trời mới cho nền giáo dục hiện đại, góp phần đào tạo nên những công dân toàn cầu có tư duy phản biện sắc bén và lòng yêu nước sâu sắc.",
        signsDetected: "Mở/kết đoạn theo khuôn mẫu sáo rỗng; thuật ngữ quá rộng ('công dân toàn cầu', 'kỷ nguyên số', 'chân trời mới') không gắn trực tiếp với kết quả can thiệp trên 82 học sinh.",
        basis: "Cụm từ công thức khuôn đúc thường xuất hiện ở phần kết luận do AI tạo khi được nhắc tóm tắt ý nghĩa đề tài.",
        checkLevel: "nhieu_dau_hieu",
        verificationGuide: "Kiểm tra xem tác giả có thể tóm tắt lại kết luận bằng chính kinh nghiệm sau 6 tháng đứng lớp hay không.",
        suggestedHandling: "Tập trung kết luận vào kết quả cụ thể: số học sinh cải thiện kỹ năng đọc trục thời gian và các bài học rút ra cho tổ chuyên môn."
      }
    ]
  },
  similarityAndCitations: {
    overallLevel: "tuong_dong_chua_ro",
    overallSummary: "Phát hiện đoạn quy trình 4 bước thiết kế sơ đồ có sự tương đồng 85% với tài liệu tập huấn phương pháp của Sở GD&ĐT nhưng chưa chú thích nguồn. Danh mục tài liệu tham khảo có trích dẫn Wikipedia và phần mềm Canva là chưa chuẩn mực học thuật.",
    disclaimer: "Phạm vi kiểm tra giới hạn trong cơ sở dữ liệu sáng kiến và tài liệu sư phạm công khai. Kết quả không mang ý nghĩa kết luận đạo văn mà là hướng dẫn chuẩn hóa trích dẫn.",
    similarityFindings: [
      {
        id: "sim-1",
        location: "Trang 14, Mục 3.1",
        excerpt: "Quy trình 4 bước thiết kế bản đồ tư duy: (1) Xác định từ khóa trung tâm; (2) Phát triển các nhánh cấp một; (3) Chi tiết hóa các nhánh phụ bằng hình ảnh; (4) Mã hóa màu sắc và liên kết mạng lưới.",
        matchedSource: "Sách 'Kỹ thuật dạy học tích cực trong trường phổ thông' (Nguyễn Lăng Bình chủ biên, NXB ĐH Sư phạm, tr. 112).",
        matchedContent: "Quy trình vẽ bản đồ tư duy bao gồm 4 giai đoạn: Xác định từ khóa trọng tâm; Thiết lập các nhánh cấp 1; Khai triển các nhánh phụ cấp 2; Phối hợp màu sắc và hình ảnh trực quan.",
        isCitedInText: false,
        isInBibliography: false,
        reviewLevel: "tuong_dong_chua_ro",
        resolutionAction: "Bổ sung nguồn trích dẫn: '[Theo Nguyễn Lăng Bình (2020), tr. 112]' và đưa vào Danh mục Tài liệu tham khảo."
      },
      {
        id: "sim-2",
        location: "Trang 2, Đặt vấn đề",
        excerpt: "Chương trình Giáo dục phổ thông 2018 định hướng phát triển phẩm chất và năng lực người học, đòi hỏi môn Lịch sử và Địa lí phải chuyển từ trang bị kiến thức sang hình thành năng lực tự học...",
        matchedSource: "Thông tư số 32/2018/TT-BGDĐT ban hành Chương trình Giáo dục phổ thông 2018.",
        matchedContent: "Định hướng phát triển phẩm chất và năng lực người học theo CT GDPT 2018.",
        isCitedInText: true,
        isInBibliography: false,
        reviewLevel: "tuong_dong_da_dan",
        resolutionAction: "Nội dung đã dẫn tên Thông tư trong bài nhưng còn thiếu trong danh mục tài liệu tham khảo ở cuối văn bản. Cần bổ sung vào danh mục."
      }
    ],
    referenceChecks: [
      {
        id: "ref-1",
        referenceEntry: "Sách giáo khoa Lịch sử 8 - NXB Giáo dục Việt Nam",
        citationInText: "Trang 3, Mục 1.1",
        existsInCatalog: true,
        usedInText: true,
        hasAuthorAndYear: false,
        urlOrDomain: "moet.gov.vn",
        supportsArgument: "Hỗ trợ xác định chuẩn kiến thức kỹ năng chương trình Lịch sử 8",
        verificationStatus: "xac_minh_duoc",
        verificationNote: "Sách giáo khoa chính thống được Bộ GD&ĐT phê duyệt. Cần bổ sung tên Tổng chủ biên và năm xuất bản."
      },
      {
        id: "ref-2",
        referenceEntry: "Bách khoa toàn thư mở Wikipedia (https://vi.wikipedia.org)",
        citationInText: "Trang 8, Mục 1.3",
        existsInCatalog: true,
        usedInText: true,
        hasAuthorAndYear: false,
        urlOrDomain: "vi.wikipedia.org",
        supportsArgument: "Cung cấp diễn biến trận đánh",
        verificationStatus: "xac_minh_mot_phan",
        verificationNote: "Nguồn mở có thể sửa đổi tự do, không qua bình duyệt khoa học. Không được xem là tài liệu tham khảo chuẩn mực trong SKKN."
      },
      {
        id: "ref-3",
        referenceEntry: "Phần mềm thiết kế Canva (https://canva.com)",
        citationInText: "Trang 13, Mục 3.1",
        existsInCatalog: true,
        usedInText: true,
        hasAuthorAndYear: false,
        urlOrDomain: "canva.com",
        supportsArgument: "Công cụ phương tiện dạy học",
        verificationStatus: "xac_minh_mot_phan",
        verificationNote: "Canva là ứng dụng công nghệ/phương tiện dạy học, không phải là tài liệu xuất bản tham khảo. Cần chuyển sang mục 'Phương tiện dạy học'."
      },
      {
        id: "ref-4",
        referenceEntry: "Tony Buzan (2008), Sơ đồ tư duy trong học tập, NXB Tổng hợp TP.HCM",
        citationInText: "Trang 5, Mục 1.2",
        existsInCatalog: false,
        usedInText: true,
        hasAuthorAndYear: true,
        urlOrDomain: "",
        supportsArgument: "Cung cấp cơ sở lý luận về bản đồ tư duy",
        verificationStatus: "chua_xac_minh_duoc",
        verificationNote: "Có trích dẫn lý thuyết của Tony Buzan trong bài nhưng bị sót trong danh mục tài liệu tham khảo cuối trang."
      }
    ]
  },
  createdAt: "2026-10-02T19:40:00Z"
};

export const sampleInitiative2: SKKNAnalysisResult = {
  metadata: {
    title: "Xây dựng hệ thống bài tập phân hóa có hướng dẫn nhằm phát triển năng lực tự học môn Toán cho học sinh lớp 10 THPT",
    author: "Trần Văn Hùng",
    organization: "Trường THPT Lê Hồng Phong, Tỉnh Nam Định",
    field: "Khoa học Tự nhiên - Phương pháp giảng dạy môn Toán",
    subject: "Toán học 10 (Bộ sách Kết nối tri thức)",
    gradeLevel: "Lớp 10",
    targetAudience: "Học sinh lớp 10A3 (Thực nghiệm, N=45) và 10A4 (Đối chứng, N=44)",
    applicationTimeframe: "Năm học 2024 - 2025",
    scope: "Áp dụng tại trường THPT Lê Hồng Phong và chia sẻ trong Cụm chuyên môn số 2",
    appliedRubricName: "Phiếu chấm Sáng kiến Cấp Ngành Giáo dục (Khung 100 điểm)",
    isOfficialRubric: true,
    evidenceAdequacy: "Cao",
    evidenceAdequacyReason: "Tài liệu đính kèm đầy đủ đề kiểm tra trước - sau thực nghiệm, có bảng tính kiểm định thống kê t-test, phiếu tự đánh giá năng lực tự học của học sinh và biên bản xác nhận của Hội đồng khoa học cấp trường."
  },
  sectionsMap: [
    { id: "sec-2-1", sectionCode: "Phần I", name: "ĐẶT VẤN ĐỀ & CƠ SỞ LÝ LUẬN", page: "Trang 2-7", summary: "Phân tích yêu cầu phát triển năng lực tự học theo chương trình GDPT 2018; thực trạng học sinh lớp 10 bỡ ngỡ với phương pháp học mới." },
    { id: "sec-2-2", sectionCode: "Phần II.1", name: "THỰC TRẠNG VÀ KHẢO SÁT BAN ĐẦU", page: "Trang 8-12", summary: "Khảo sát đầu năm về thời gian và thói quen tự học ở nhà của 89 học sinh 2 lớp 10A3 và 10A4." },
    { id: "sec-2-3", sectionCode: "Phần II.2", name: "CÁC NGUYÊN TẮC VÀ BIỆN PHÁP THỰC HIỆN", page: "Trang 13-28", summary: "Xây dựng 4 biện pháp: Phân tầng bài tập (3 mức); Thẻ gợi ý từng bước (Scaffolding cards); Nhật ký tự học; Tổ chức chấm chéo." },
    { id: "sec-2-4", sectionCode: "Phần II.3", name: "THỰC NGHIỆM SƯ PHẠM VÀ PHÂN TÍCH THỐNG KÊ", page: "Trang 29-36", summary: "Kiểm định t-test độc lập giữa lớp thực nghiệm và đối chứng; phân tích độ lệch chuẩn và độ tin cậy." },
    { id: "sec-2-5", sectionCode: "Phần III", name: "KẾT LUẬN, KHUYẾN NGHỊ VÀ MINH CHỨNG", page: "Trang 37-45", summary: "Đánh giá mức độ đóng góp; bộ bài tập mẫu đính kèm trong phụ lục." }
  ],
  rubricCriteria: [
    {
      id: "rub2-1",
      groupName: "1. Tính cấp thiết & Cơ sở nghiên cứu",
      criterionName: "Xác định vấn đề thực tiễn, tính cấp thiết và mục tiêu nghiên cứu",
      maxScore: 10,
      proposedScore: 9.5,
      basisLocation: "Phần I, Trang 3-5",
      shortQuote: "Sự chuyển tiếp từ THCS lên THPT khiến đa số học sinh lớp 10 gặp khủng hoảng về phương pháp tự học môn Toán...",
      strengths: "Cơ sở lý luận vững chắc, bám sát các chỉ số hành vi của năng lực tự học theo Chương trình GDPT 2018.",
      limitations: "Chưa khảo sát ý kiến phụ huynh về thời gian tự học của học sinh tại nhà.",
      existingEvidence: "Phiếu khảo sát thói quen học tập N=89 với 10 tiêu chí chi tiết.",
      missingEvidence: "Dữ liệu phỏng vấn sâu một số học sinh có học lực trung bình - yếu.",
      deductionReason: "Trừ 0.5 điểm do thiếu góc nhìn đối chiếu từ gia đình học sinh.",
      improvementGuidance: "Bổ sung nhận xét ngắn từ phụ huynh qua sổ liên lạc điện tử.",
      priority: "Thấp"
    },
    {
      id: "rub2-2",
      groupName: "2. Tính mới & Tính sáng tạo",
      criterionName: "Mức độ mới về giải pháp, cách tiếp cận và tính sáng tạo khoa học",
      maxScore: 20,
      proposedScore: 17.0,
      basisLocation: "Phần II.2, Trang 16-22",
      shortQuote: "Biện pháp xây dựng 'Thẻ gợi ý gián tiếp (Scaffolding hint cards)' cho phép học sinh tự mở khi gặp bế tắc...",
      strengths: "Cách tiếp cận 'Thẻ gợi ý phân tầng' rất sáng tạo, tránh việc học sinh xem lời giải chi tiết ngay lập tức.",
      limitations: "Khái niệm bài tập phân hóa đã có nhiều tài liệu đề cập; tính mới tập trung chủ yếu ở khâu thiết kế thẻ hỗ trợ.",
      existingEvidence: "Bộ 15 thẻ gợi ý mẫu cho chuyên đề Hàm số bậc hai và Phương trình bậc hai.",
      missingEvidence: "Minh chứng về việc cá nhân hóa cho học sinh giỏi vượt trội.",
      deductionReason: "Trừ 3.0 điểm vì hệ thống bài tập phân hóa là đề tài phổ biến, cần nhấn mạnh hơn tính độc bản của cơ chế thẻ gợi ý.",
      improvementGuidance: "Đăng ký bản quyền nội dung bộ thẻ gợi ý hoặc xây dựng thành cẩm nang hoàn chỉnh.",
      priority: "Trung bình"
    },
    {
      id: "rub2-3",
      groupName: "3. Tính khoa học & Logic sư phạm",
      criterionName: "Phương pháp nghiên cứu, chuỗi logic từ thực trạng đến giải pháp",
      maxScore: 20,
      proposedScore: 18.5,
      basisLocation: "Phần II.3, Trang 29-33",
      shortQuote: "Sử dụng kiểm định t-Student độc lập: Giá trị t_thực nghiệm = 2.45 > t_lý thuyết = 1.99 (với p < 0.05)...",
      strengths: "Phương pháp xử lý số liệu mẫu mực; có kiểm định giả thuyết thống kê nghiêm túc; các bước can thiệp chặt chẽ.",
      limitations: "Cần giải trình rõ hơn về việc liệu giáo viên có dành thêm thời gian phụ đạo ngoài giờ cho lớp thực nghiệm hay không.",
      existingEvidence: "Bảng tính toán SPSS/Excel chi tiết trong phụ lục.",
      missingEvidence: "Kê khai số tiết dạy thực tế giữa 2 lớp để loại trừ biến can thiệp thời gian.",
      deductionReason: "Trừ 1.5 điểm do chưa cam kết minh bạch về thời lượng can thiệp tương đương.",
      improvementGuidance: "Bổ sung cam kết thời lượng học tập trên lớp giữa 2 lớp là hoàn toàn bằng nhau.",
      priority: "Thấp"
    },
    {
      id: "rub2-4",
      groupName: "4. Tính thực tiễn & Khả năng áp dụng",
      criterionName: "Phù hợp điều kiện cơ sở vật chất, khả năng nhân rộng trong bộ môn",
      maxScore: 15,
      proposedScore: 14.0,
      basisLocation: "Phần II.2, Trang 24",
      shortQuote: "Hệ thống bài tập in trên khổ giấy A4 đóng tập hoặc tải mã QR để xem thẻ gợi ý...",
      strengths: "Tính ứng dụng rất cao, không đòi hỏi phòng máy vi tính, phù hợp mọi điều kiện trường lớp.",
      limitations: "Tốn công sức chuẩn bị ban đầu của giáo viên khi phải soạn thẻ gợi ý cho từng dạng toán.",
      existingEvidence: "Tài liệu tập bài tập đã được phát thử nghiệm cho học sinh.",
      missingEvidence: "Kế hoạch phân công trong tổ chuyên môn để cùng nhau biên soạn mở rộng.",
      deductionReason: "Trừ 1.0 điểm do chưa chỉ ra cách giảm tải khối lượng công việc cho giáo viên đơn lẻ.",
      improvementGuidance: "Đề xuất quy trình phân công tổ chuyên môn cùng xây dựng ngân hàng thẻ gợi ý.",
      priority: "Thấp"
    },
    {
      id: "rub2-5",
      groupName: "5. Tính hiệu quả & Minh chứng xác thực",
      criterionName: "Kết quả đo lường, dữ liệu đối sánh trước - sau và minh chứng cụ thể",
      maxScore: 20,
      proposedScore: 18.0,
      basisLocation: "Phần II.3, Trang 34-36",
      shortQuote: "Điểm trung bình kiểm tra chuyên đề của lớp 10A3 đạt 7.62 (độ lệch chuẩn 1.15), lớp 10A4 đạt 6.95 (độ lệch chuẩn 1.32)...",
      strengths: "Số liệu chặt chẽ, có phân tích độ lệch chuẩn, phân hóa rõ rệt ở nhóm điểm khá giỏi.",
      limitations: "Chưa theo dõi độ bền kiến thức (Retention test) sau 1-2 tháng xem học sinh có duy trì năng lực tự học không.",
      existingEvidence: "Bảng điểm chi tiết 89 học sinh có chữ ký của phụ trách chuyên môn.",
      missingEvidence: "Bài kiểm tra nhắc lại (Delayed post-test) sau kết thúc chuyên đề 4 tuần.",
      deductionReason: "Trừ 2.0 điểm vì thiếu bài kiểm tra đánh giá độ bền của năng lực tự học.",
      improvementGuidance: "Bổ sung kết quả bài kiểm tra định kỳ học kỳ 2 để khẳng định tính bền vững.",
      priority: "Trung bình"
    },
    {
      id: "rub2-6",
      groupName: "6. Khả năng chuyển giao & Nhân rộng",
      criterionName: "Điều kiện áp dụng cho đơn vị khác, hướng dẫn quy trình chuyển giao",
      maxScore: 10,
      proposedScore: 9.0,
      basisLocation: "Phần III, Trang 38",
      shortQuote: "Đã báo cáo chuyên đề cấp cụm vào tháng 12/2024 và được 4 trường THPT trong cụm tiếp nhận tài liệu...",
      strengths: "Đã có hoạt động chia sẻ thực tế trong cụm trường, có biên bản hội thảo.",
      limitations: "Cần số hóa hệ thống bài tập lên nền tảng trực tuyến để các trường tải về thuận tiện hơn.",
      existingEvidence: "Biên bản sinh hoạt chuyên môn cụm trường số 2.",
      missingEvidence: "Báo cáo phản hồi từ các trường bạn sau khi áp dụng thử.",
      deductionReason: "Trừ 1.0 điểm vì chưa có phản hồi độc lập từ đơn vị bên ngoài.",
      improvementGuidance: "Xin thư nhận xét hoặc phiếu đánh giá từ 1 trường bạn trong cụm.",
      priority: "Thấp"
    },
    {
      id: "rub2-7",
      groupName: "7. Hình thức trình bày, trích dẫn & Ngôn ngữ",
      criterionName: "Quy chuẩn văn bản, trích dẫn tài liệu tham khảo, ngôn phong khoa học",
      maxScore: 5,
      proposedScore: 4.8,
      basisLocation: "Toàn bộ tài liệu",
      shortQuote: "Trích dẫn chuẩn APA, công thức toán học gõ MathType đồng nhất.",
      strengths: "Trình bày cực kỳ chuyên nghiệp, công thức toán học rõ ràng, hình vẽ chuẩn xác.",
      limitations: "Một số bảng biểu dài chưa lặp lại tiêu đề ở đầu trang kế tiếp.",
      existingEvidence: "Văn bản in ấn chuẩn chỉ.",
      missingEvidence: "Không có.",
      deductionReason: "Trừ 0.2 điểm về lỗi lặp tiêu đề bảng qua trang.",
      improvementGuidance: "Đặt chế độ 'Repeat header rows' trong bảng biểu Word.",
      priority: "Thấp"
    }
  ],
  redTeamCards: [
    {
      id: "PB-101",
      location: "Trang 18, Mục 2.2",
      relatedQuote: "Học sinh tự quản lý thẻ gợi ý và cam kết chỉ mở thẻ khi đã suy nghĩ ít nhất 10 phút.",
      issueDetected: "Khó kiểm soát tính trung thực của học sinh khi tự học ở nhà",
      criticismBasis: "Trong điều kiện tự học tại nhà không có giám sát, học sinh dễ dàng mở ngay thẻ gợi ý hoặc chép lời giải từ bạn bè hoặc các app quét bài tập (Photomath, QANDA).",
      affectedCriterion: "Tính thực tiễn & Độ tin cậy",
      impactLevel: "Trung bình",
      whyItMatters: "Hội đồng sẽ đặt nghi vấn về việc học sinh tiến bộ là do thực sự tự học hay do có sẵn thẻ gợi ý tương tự bài kiểm tra.",
      resolutionGuidance: "Bổ sung kỹ thuật 'Vấn đáp giải thích': Mỗi tuần giáo viên chọn ngẫu nhiên 3 học sinh lên bảng giải thích tại sao lại chọn hướng đi trong thẻ gợi ý.",
      requiredEvidence: "Sổ nhật ký phỏng vấn nhanh học sinh trên lớp.",
      insertLocation: "Trang 19, sau đoạn mô tả quy định tự học.",
      likelyCouncilQuestion: "Làm thế nào thầy kiểm soát được việc các em không mở ngay thẻ gợi ý khi vừa đọc đề xong, hoặc không sử dụng AI/app giải toán trên điện thoại?",
      status: "Chưa xử lý"
    },
    {
      id: "PB-102",
      location: "Trang 30, Bảng thực nghiệm",
      relatedQuote: "Lớp 10A3 do thầy trực tiếp dạy chính khóa, lớp 10A4 do cô Nguyễn Thị H. giảng dạy.",
      issueDetected: "Biến nhiễu do giáo viên giảng dạy khác nhau (Teacher effect)",
      criticismBasis: "Trong nghiên cứu thực nghiệm sư phạm, nếu 2 giáo viên khác nhau dạy 2 lớp thì sự chênh lệch điểm số có thể do năng lực, phong cách sư phạm của giáo viên chứ không hẳn do phương pháp bài tập phân hóa.",
      affectedCriterion: "Tính khoa học của nghiên cứu",
      impactLevel: "Cao",
      whyItMatters: "Đây là điểm phản biện chuyên môn kinh điển mà các giám khảo sư phạm khó tính sẽ soi xét.",
      resolutionGuidance: "Làm rõ: Cả 2 giáo viên đều thống nhất giáo án chung, cùng dự giờ chéo và tác giả đã tiến hành kiểm nghiệm đảo ngược (hoặc 1 giáo viên dạy cả 2 lớp ở giai đoạn sau).",
      requiredEvidence: "Biên bản thống nhất kế hoạch bài dạy giữa 2 giáo viên.",
      insertLocation: "Trang 31, Mục Giải trình biến số nghiên cứu.",
      likelyCouncilQuestion: "Sự tiến bộ của lớp 10A3 có chắc là do bài tập phân hóa không, hay đơn giản vì thầy dạy nhiệt tình và có kinh nghiệm hơn cô giáo lớp đối chứng?",
      status: "Chưa xử lý"
    }
  ],
  novelty: {
    overallLevel: "chua_phat_hien_tuong_dong",
    overallConclusion: "Sáng kiến có cách tiếp cận mạch lạc, phát triển được mô hình 'Thẻ gợi ý phân tầng' cụ thể hóa cho bộ môn Toán 10 mới. Chưa phát hiện sự sao chép hay trùng lặp cao trong phạm vi thẩm định.",
    searchKeywords: [
      "bài tập phân hóa có hướng dẫn Toán 10",
      "thẻ gợi ý scaffolding môn Toán THPT",
      "phát triển năng lực tự học Toán 10 chương trình 2018"
    ],
    scopeChecked: "Kho tài nguyên sáng kiến Sở GD&ĐT Nam Định, Hà Nam, Thái Bình (2022-2024); Tạp chí Khoa học Sư phạm ĐH Sư phạm.",
    comparisonItems: [
      {
        id: "nov2-1",
        aspect: "Giải pháp cốt lõi",
        thisInitiative: "Hệ thống bài tập phân tầng kèm Thẻ gợi ý 3 mức (Gợi ý định hướng -> Gợi ý công thức -> Gợi ý sơ đồ).",
        benchmarkDocA: "Đề tài 2023: Phân dạng bài tập Toán 10 theo 4 mức độ nhận thức (chỉ có đề và đáp án chi tiết).",
        benchmarkDocB: "Đề tài 2022: Ứng dụng phiếu học tập tự học (không có cơ chế gợi ý gián tiếp).",
        benchmarkDocC: "Sách tham khảo: Bài tập phân hóa có lời giải sẵn.",
        differenceAnalysis: "Khác biệt rõ rệt ở cơ chế 'thẻ gợi ý gián tiếp' giúp học sinh tự vượt qua bế tắc thay vì đọc ngay lời giải đầy đủ."
      }
    ],
    riskWarnings: [
      "Cần chứng minh tính thích ứng khi áp dụng cho các lớp thuộc ban Khoa học Xã hội học môn Toán."
    ]
  },
  evidenceChain: [
    {
      id: "ev2-1",
      claim: "Học sinh lớp 10A3 có thời lượng tự học môn Toán tăng từ 35 phút lên 65 phút/ngày.",
      location: "Trang 34, Mục 4.2",
      associatedSolution: "Nhật ký tự học có xác nhận của phụ huynh",
      status: "co_minh_chung",
      existingEvidenceDetails: "Trích xuất ảnh chụp 5 cuốn sổ nhật ký tự học và biểu đồ tổng hợp số phút ghi nhận từ 45 học sinh.",
      missingEvidenceDetails: "Không thiếu.",
      recommendation: "Giữ nguyên minh chứng."
    }
  ],
  dataAnomalies: [],
  logicGaps: [],
  suggestions: [
    {
      id: "sug2-1",
      targetSection: "Trang 30, Mục 3.1 - Mô tả điều kiện thực nghiệm",
      originalText: "Lớp thực nghiệm 10A3 do tôi trực tiếp giảng dạy, còn lớp đối chứng 10A4 do một đồng nghiệp trong tổ phụ trách.",
      problem: "Tạo ra biến nhiễu giáo viên (Teacher variance), làm giảm độ tin cậy của kết quả so sánh.",
      whyRevise: "Giám khảo sẽ phản biện rằng kết quả chênh lệch do năng lực giáo viên chứ không phải do giải pháp.",
      basis: "Phương pháp nghiên cứu khoa học sư phạm ứng dụng: Phải kiểm soát hoặc triệt tiêu biến ngoại lai (Teacher effect) khi so sánh nhóm thực nghiệm và đối chứng.",
      category: "Phương pháp & Thực nghiệm",
      revisionGoal: "Bổ sung các biện pháp đồng kiểm soát để chứng minh tính tương đương giữa 2 lớp.",
      howToRevise: "Bổ sung mô tả việc 2 giáo viên cùng sinh hoạt chuyên môn, cùng soạn chung giáo án và sử dụng chung đề kiểm tra.",
      lightRevision: "Lớp thực nghiệm 10A3 do tôi trực tiếp giảng dạy, lớp đối chứng 10A4 do đồng nghiệp trong tổ phụ trách với sự thống nhất chặt chẽ về tiến trình dạy học.",
      academicRevision: "Để kiểm soát biến số can thiệp, lớp thực nghiệm 10A3 (tôi trực tiếp giảng dạy) và lớp đối chứng 10A4 (do đồng nghiệp ThS. Nguyễn Thị H. phụ trách) được tiến hành đồng thời với cùng kế hoạch bài dạy chuẩn, cùng thời lượng và cùng bộ công cụ kiểm tra đánh giá định kỳ.",
      deepRevision: "Nhằm hạn chế tối đa ảnh hưởng từ biến ngoại lai về phong cách giảng dạy:\n1. Hai giáo viên cùng sinh hoạt chuyên môn tuần để thống nhất mục tiêu từng tiết dạy [CẦN BỔ SUNG BIÊN BẢN TỔ CHUYÊN MÔN].\n2. Đề kiểm tra trước và sau thực nghiệm được tổ chức làm chung ca, chấm chéo và rọc phách bảo mật.\n3. Thời lượng tương tác trên lớp tại 2 phòng học được bảo đảm đồng nhất theo đúng phân phối chương trình của Bộ GD&ĐT.",
      missingEvidenceAlert: "[CẦN BỔ SUNG BIÊN BẢN HỌP THỐNG NHẤT GIỮA 2 GIÁO VIÊN]",
      insertPosition: "Trang 30, đoạn cuối mục 3.1."
    }
  ],
  councilQuestions: [
    {
      id: "cq2-1",
      difficulty: "🔴 Câu hỏi khó",
      question: "Nếu tác giả không trực tiếp dạy mà chuyển giao bộ thẻ gợi ý này cho một giáo viên trẻ mới ra trường hoặc một trường ở vùng khó khăn, liệu kết quả có đạt được như trong sáng kiến không?",
      whyCouncilAsks: "Kiểm tra tính phụ thuộc vào cá nhân tác giả và khả năng nhân rộng thực chất.",
      relatedLocation: "Trang 38, Phần Chuyển giao",
      requiredEvidenceToBring: "Cẩm nang hướng dẫn sử dụng bộ thẻ dành cho giáo viên (Teacher guide).",
      suggestedAnswerStrategy: "Nhấn mạnh cẩm nang quy trình: 'Tôi đã biên soạn sẵn hướng dẫn chi tiết từng tình huống học sinh bế tắc, kèm video clip minh họa 15 phút. Trong đợt sinh hoạt cụm, cô giáo trẻ trường THPT C đã áp dụng thử nghiệm và cho phản hồi rất khả quan'."
    }
  ],
  priorityActions: [
    {
      id: "pri2-1",
      tier: "🔴 PHẢI SỬA",
      title: "Giải trình minh bạch về việc kiểm soát biến số hai giáo viên dạy hai lớp",
      affectedAspect: "Phương pháp nghiên cứu thực nghiệm",
      location: "Trang 30, Mục 3.1",
      actionSummary: "Bổ sung cam kết đồng nhất kế hoạch bài dạy và chấm chéo rọc phách để bảo vệ kết quả t-test.",
      rubricImpact: "Bảo đảm trọn vẹn 18.5/20 điểm tiêu chí Khoa học & Phương pháp."
    }
  ],
  aiMarkers: {
    overallLevel: "it_dau_hieu",
    overallSummary: "Toàn bộ tài liệu thể hiện phong cách diễn đạt tự nhiên, đậm dấu ấn cá nhân của giáo viên Toán với nhiều công thức, ghi chép nhật ký lớp học và phân tích sai lầm cụ thể của học sinh lớp 10. Không phát hiện văn phong khuôn mẫu công thức hay câu từ sáo rỗng.",
    disclaimer: "Lưu ý: Dấu hiệu ngôn ngữ mang tính tham khảo nhằm hỗ trợ tác giả tăng cường dấu ấn thực tiễn, không phải bằng chứng gian lận.",
    findings: []
  },
  similarityAndCitations: {
    overallLevel: "chua_phat_hien",
    overallSummary: "Trích dẫn chuẩn xác theo phong cách APA, các tài liệu tham khảo đều được tra cứu và trích xuất đúng ngữ cảnh trong bài giảng Toán 10. Không phát hiện sự tương đồng đáng chú ý ngoài trích dẫn chuẩn.",
    disclaimer: "Phạm vi kiểm tra giới hạn trong cơ sở dữ liệu đối soát giáo dục. Không kết luận đạo văn.",
    similarityFindings: [],
    referenceChecks: [
      {
        id: "ref2-1",
        referenceEntry: "Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông môn Toán, ban hành kèm Thông tư 32/2018/TT-BGDĐT",
        citationInText: "Trang 2, Mục 1.1",
        existsInCatalog: true,
        usedInText: true,
        hasAuthorAndYear: true,
        urlOrDomain: "moet.gov.vn",
        supportsArgument: "Xác lập khung năng lực tự học môn Toán",
        verificationStatus: "xac_minh_duoc",
        verificationNote: "Văn bản quy phạm pháp luật chính thức của Bộ GD&ĐT, trích dẫn chuẩn xác."
      }
    ]
  },
  createdAt: "2026-10-02T19:42:00Z"
};
