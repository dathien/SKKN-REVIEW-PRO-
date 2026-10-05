import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCheck,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { FileCategory, UploadedFileItem } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (skknText: string, rubricText: string, evidenceFiles: UploadedFileItem[], notes: string) => Promise<void>;
  isLoading: boolean;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [skknText, setSkknText] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('skkn_primary');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      let textContent = '';
      let dataBase64 = '';

      // If text/markdown/csv file
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
        textContent = await file.text();
      } else if (file.name.endsWith('.docx')) {
        // Read as base64 to send to backend mammoth parser
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        dataBase64 = base64;
        try {
          const resp = await fetch('/api/parse-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data: base64 }),
          });
          const result = await resp.json();
          if (result.text) {
            textContent = result.text;
          }
        } catch (err) {
          console.error('Lỗi phân tích docx:', err);
        }
      } else {
        // PDF or image or excel: read as base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        dataBase64 = base64;
        textContent = `[File đính kèm: ${file.name} - Kích thước: ${(file.size / 1024).toFixed(1)} KB]`;
      }

      const newItem: UploadedFileItem = {
        id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        name: file.name,
        category: selectedCategory,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'unknown',
        textContent,
        dataBase64,
        uploadedAt: new Date().toLocaleTimeString('vi-VN')
      };

      setUploadedFiles(prev => [...prev, newItem]);

      // If category is skkn_primary and textContent extracted, autofill skknText
      if (selectedCategory === 'skkn_primary' && textContent && !skknText) {
        setSkknText(textContent);
      } else if (selectedCategory === 'rubric_official' && textContent && !rubricText) {
        setRubricText(textContent);
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!skknText.trim() && uploadedFiles.filter(f => f.category === 'skkn_primary').length === 0) {
      setErrorMessage('Vui lòng nhập nội dung Sáng kiến kinh nghiệm (SKKN) hoặc tải lên file SKKN chính.');
      return;
    }
    setErrorMessage('');
    await onAnalyze(skknText, rubricText, uploadedFiles, additionalNotes);
    onClose();
  };

  const loadSampleToInput = (sampleType: 'sample1' | 'sample2') => {
    if (sampleType === 'sample1') {
      setSkknText(`TÊN ĐỀ TÀI: Ứng dụng sơ đồ tư duy kết hợp phần mềm tương tác nhằm nâng cao hứng thú học tập môn Lịch sử 8 tại Trường THCS Trần Hưng Đạo
Tác giả: Nguyễn Thị Mai Lan - Đơn vị: Trường THCS Trần Hưng Đạo
Môn: Lịch sử 8 (Bộ sách Kết nối tri thức với cuộc sống)

I. ĐẶT VẤN ĐỀ
Môn Lịch sử thường bị xem là môn học thuộc lòng, học sinh ghi nhớ thụ động. Qua khảo sát đầu năm tại 2 lớp 8A1, 8A2 có tới 65% học sinh cảm thấy môn Sử khô khan, nhiều mốc thời gian. Vì vậy, tôi đã xây dựng sáng kiến này.

II. GIẢI PHÁP THỰC HIỆN
Sáng kiến này lần đầu tiên đưa phần mềm tương tác Canva và Quizizz kết hợp vẽ sơ đồ tư duy vào tiết Lịch sử 8 tại trường THCS, đây là phương pháp hoàn toàn mới mẻ chưa từng có ai áp dụng trước đây.
- Biện pháp 1: Hướng dẫn học sinh sử dụng Canva để vẽ sơ đồ tư duy theo chủ đề chiến dịch lịch sử.
- Biện pháp 2: Tổ chức thi đấu trả lời trắc nghiệm nhanh trên Quizizz sau mỗi tiết học.
- Biện pháp 3: Cho học sinh thảo luận nhóm và nộp bài trên Padlet.

III. HIỆU QUẢ VÀ KẾT QUẢ ĐẠT ĐƯỢC
Sau 6 tháng áp dụng:
- Tiến hành lấy ý kiến của 85 em học sinh tại 2 lớp 8A1 và 8A2: Bảng 2 thể hiện: Lớp 8A1 (42 em), Lớp 8A2 (40 em), tổng cộng 82 em tham gia.
- Tỷ lệ học sinh đạt điểm Giỏi tăng 25% (từ 60% lên 75%), chứng minh phương pháp này hoàn toàn giải quyết được sự chán học môn Sử.
- 100% học sinh đều say mê học tập và chủ động, tích cực hơn nhiều trong các giờ học, không còn thụ động ghi chép như trước.
- Điểm kiểm tra học kỳ II lớp thực nghiệm 8A1 cao hơn hẳn lớp đối chứng 8A2 (chênh lệch 1.8 điểm trung bình).

IV. KẾT LUẬN & TÀI LIỆU THAM KHẢO
Đề tài hoàn toàn mới và thành công tuyệt đối, đề nghị nhân rộng toàn bộ các môn Địa lí, GDCD trong toàn quận.
Tài liệu tham khảo:
1. Sách giáo khoa Lịch sử 8 - NXB Giáo dục Việt Nam.
2. Bách khoa toàn thư mở Wikipedia (https://vi.wikipedia.org).
3. Phần mềm thiết kế Canva.`);
      setRubricText(`PHIẾU ĐÁNH GIÁ SÁNG KIẾN KINH NGHIỆM GIÁO DỤC (KHUNG 100 ĐIỂM)
1. Tính cấp thiết và xác định vấn đề (10 điểm)
2. Tính mới và tính sáng tạo khoa học (20 điểm)
3. Tính khoa học, logic sư phạm và phương pháp nghiên cứu (20 điểm)
4. Tính thực tiễn và khả năng áp dụng (15 điểm)
5. Tính hiệu quả và minh chứng thực nghiệm (20 điểm)
6. Khả năng chuyển giao và nhân rộng (10 điểm)
7. Hình thức trình bày, trích dẫn tài liệu và ngôn ngữ (5 điểm)`);
    } else {
      setSkknText(`TÊN ĐỀ TÀI: Xây dựng hệ thống bài tập phân hóa có hướng dẫn nhằm phát triển năng lực tự học môn Toán cho học sinh lớp 10 THPT
Tác giả: Trần Văn Hùng - Trường THPT Lê Hồng Phong
Đối tượng: Lớp 10A3 (Thực nghiệm, N=45) và 10A4 (Đối chứng, N=44)
Phương pháp: Nghiên cứu thực nghiệm sư phạm đối chứng có kiểm định t-Student.`);
      setRubricText('');
    }
  };

  const getCategoryLabel = (cat: FileCategory) => {
    switch (cat) {
      case 'skkn_primary': return 'SKKN chính';
      case 'rubric_official': return 'Phiếu chấm / Rubric';
      case 'evidence_doc': return 'Minh chứng';
      case 'data_survey': return 'Dữ liệu khảo sát';
      case 'appendix_ref': return 'Phụ lục / TLTK';
    }
  };

  const getCategoryBadgeClass = (cat: FileCategory) => {
    switch (cat) {
      case 'skkn_primary': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rubric_official': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'evidence_doc': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'data_survey': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'appendix_ref': return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Tải hồ sơ Sáng kiến & Phiếu chấm đánh giá
            </h3>
            <p className="text-[14px] text-slate-500 mt-0.5">
              Hỗ trợ phân loại đa file: SKKN, Phiếu chấm, Minh chứng, Dữ liệu khảo sát.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4 text-[14px] font-bold">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            Nhập / Dán văn bản trực tiếp
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4.5 h-4.5" />
            Tải tập tin (Word, PDF, Excel, Ảnh)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[14px] flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'paste' ? (
            <div className="space-y-4">
              {/* Quick sample loader buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-[14px] gap-2">
                <span className="text-blue-900 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  Bạn muốn thử nghiệm nhanh với dữ liệu có sẵn?
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadSampleToInput('sample1')}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 text-[13px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Dán mẫu 1 (Sử 8)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleToInput('sample2')}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 text-[13px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Dán mẫu 2 (Toán 10)
                  </button>
                </div>
              </div>

              {/* SKKN Text Input */}
              <div>
                <label className="block text-[14px] font-bold text-slate-800 mb-1">
                  NỘI DUNG SÁNG KIẾN KINH NGHIỆM (SKKN) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={skknText}
                  onChange={(e) => setSkknText(e.target.value)}
                  placeholder="Dán toàn bộ hoặc các phần chính của SKKN vào đây (Đặt vấn đề, Thực trạng, Biện pháp, Hiệu quả, Kết luận, Danh mục minh chứng)..."
                  className="w-full h-44 p-3.5 text-[14px] text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
                />
                <p className="text-[13px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Hệ thống tự động bóc tách: Tên đề tài, Giải pháp, Dữ liệu đối chứng, Minh chứng.</span>
                  <span className="font-mono">{skknText.length} ký tự</span>
                </p>
              </div>

              {/* Rubric Text Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[14px] font-bold text-slate-800">
                    PHIẾU CHẤM / HƯỚNG DẪN / RUBRIC CHÍNH THỨC (NẾU CÓ)
                  </label>
                  <span className="text-[13px] text-slate-500">
                    Để trống nếu muốn dùng Rubric hệ thống 7 tiêu chí (100đ)
                  </span>
                </div>
                <textarea
                  value={rubricText}
                  onChange={(e) => setRubricText(e.target.value)}
                  placeholder="Dán tiêu chí phiếu chấm của Sở/Phòng GD&ĐT nếu có (Ví dụ: Tiêu chí 1: Tính mới (20đ), Tiêu chí 2: Tính thực tiễn...)..."
                  className="w-full h-24 p-3.5 text-[14px] text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-1">
                  Ghi chú bổ sung cho trợ lý đánh giá (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Ví dụ: Tập trung soi kỹ phần số liệu và tính mới ở giải pháp 2..."
                  className="w-full px-3.5 py-2.5 text-[14px] bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File category selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-[14px] font-semibold text-slate-700 mb-2">
                  Chọn phân loại tập tin trước khi tải:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['skkn_primary', 'rubric_official', 'evidence_doc', 'data_survey', 'appendix_ref'] as FileCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop area */}
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all text-center">
                <Upload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-[15px] font-bold text-slate-800">
                  Bấm để chọn tệp hoặc kéo thả vào đây
                </span>
                <span className="text-[13.5px] text-slate-600 mt-1">
                  Đang tải vào mục: <strong className="text-blue-700">{getCategoryLabel(selectedCategory)}</strong>
                </span>
                <span className="text-[12.5px] text-slate-500 mt-0.5">
                  Định dạng hỗ trợ: Word (.docx), PDF (.pdf), Text (.txt), Excel/CSV (.csv, .xlsx), Ảnh (.png, .jpg)
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".docx,.pdf,.txt,.md,.csv,.xlsx,.png,.jpg,.jpeg"
                />
              </label>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[14px] font-bold text-slate-800 flex items-center justify-between">
                    <span>Danh sách tập tin đã tải ({uploadedFiles.length})</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles([])}
                      className="text-[13px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {uploadedFiles.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[13.5px]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="truncate font-medium text-slate-800" title={file.name}>
                            {file.name}
                          </span>
                          <span className={`text-[12px] px-2 py-0.5 rounded-full border font-semibold ${getCategoryBadgeClass(file.category)}`}>
                            {getCategoryLabel(file.category)}
                          </span>
                          <span className="text-[12px] text-slate-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[13px] text-slate-600 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Nguyên tắc: Không tự tạo số liệu, không tự tạo minh chứng.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4.5 py-2.5 text-[14px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2.5 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang phân tích & chấm phản biện...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu chấm & phản biện</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
