import React, { useState } from 'react';
import {
  Calculator,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  GitBranch,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { DataAnomalyItem, LogicGapItem } from '../../types';

interface DataLogicAuditViewProps {
  dataAnomalies: DataAnomalyItem[];
  logicGaps: LogicGapItem[];
}

export const DataLogicAuditView: React.FC<DataLogicAuditViewProps> = ({
  dataAnomalies,
  logicGaps
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // State xác nhận cho vấn đề 85 vs 82 (Section XIV)
  const [selectedSampleSizeOption, setSelectedSampleSizeOption] = useState<string>('');
  const [customSampleNumber, setCustomSampleNumber] = useState<string>('');
  const [scopeDifferenceNote, setScopeDifferenceNote] = useState<string>('');
  const [sampleVerificationStatus, setSampleVerificationStatus] = useState<
    'UNVERIFIED' | 'CONFIRMED' | 'NEEDS_RECHECK'
  >('UNVERIFIED');

  // State xác nhận nguồn dữ liệu Biểu đồ (Section XX)
  const [chartSourceInput, setChartSourceInput] = useState<string>('');
  const [chartSourceStatus, setChartSourceStatus] = useState<'UNVERIFIED' | 'CONFIRMED'>('UNVERIFIED');

  // State xác nhận hoạt động sư phạm cho chuỗi logic (Section XXII)
  const [logicActivityInput, setLogicActivityInput] = useState<string>('');
  const [logicStatus, setLogicStatus] = useState<'UNVERIFIED' | 'CONFIRMED'>('UNVERIFIED');

  const handleSaveSampleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSampleSizeOption) return;
    if (selectedSampleSizeOption === 'recheck') {
      setSampleVerificationStatus('NEEDS_RECHECK');
    } else {
      setSampleVerificationStatus('CONFIRMED');
    }
  };

  const handleSaveChartSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (chartSourceInput.trim()) {
      setChartSourceStatus('CONFIRMED');
    }
  };

  const handleSaveLogicActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (logicActivityInput.trim()) {
      setLogicStatus('CONFIRMED');
    }
  };

  return (
    <div
      className="space-y-6 pb-12"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      
      {/* ========================================================================= */}
      {/* 1. HEADER MODULE (Section XXVI & XL: 22-24px, font-bold 700, line-height 1.3) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[12.5px] sm:text-[13px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wide">
                ĐỘ CHÍNH XÁC DỮ LIỆU & LOGIC
              </span>
              <span className="text-[13px] sm:text-[14px] text-slate-500 font-medium">
                {dataAnomalies.length} vấn đề số liệu · {logicGaps.length} đứt gãy suy luận
              </span>
            </div>
            
            <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight leading-[1.3] flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-rose-600 shrink-0" />
              <span>SỐ LIỆU & LOGIC NGHIÊN CỨU</span>
            </h1>
            
            <p className="text-[15px] text-slate-600 leading-[1.65] mt-1 font-normal">
              Rà soát nghiêm ngặt tính liêm chính dữ liệu, mâu thuẫn cỡ mẫu, nhầm lẫn thống kê và chuỗi suy luận đứt gãy.
            </p>
          </div>

          {/* Nút Xem / Thu gọn */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-2.5 px-4 sm:py-3 sm:px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>{isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết kiểm định →'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Nguyên tắc Fact Safety Header */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-[13px] sm:text-[14px] text-slate-700 leading-[1.6] space-y-1">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Nguyên tắc Fact Safety trong kiểm định số liệu:</span>
          </p>
          <p>
            Hệ thống <strong>không bao giờ tự đoán nguyên nhân chênh lệch</strong> (như tự bịa "học sinh vắng", "phiếu hỏng") và <strong>không tự tạo đối chứng</strong>. Mọi sự sai lệch đều yêu cầu xác nhận trực tiếp từ Thầy/Cô.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NỘI DUNG CHI TIẾT (Section XXIII: PHÁT HIỆN → ĐỐI CHIẾU → XÁC NHẬN) */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="space-y-6">
          
          {/* --------------------------------------------------------------------- */}
          {/* PHẦN 1: MÂU THUẪN SỐ LIỆU (Section XXVII: 17-18px / Section XXVIII: 15-16px) */}
          {/* --------------------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-[17px] sm:text-[18px] font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Kiểm định mâu thuẫn số liệu ({dataAnomalies.length})</span>
              </h2>
              <span className="text-[13px] text-slate-500 font-medium">
                Quy chuẩn toán học & thống kê sư phạm
              </span>
            </div>

            {dataAnomalies.map((anomaly) => {
              const isSampleAnomaly = anomaly.id === 'dat-1' || anomaly.type === 'Mâu thuẫn cỡ mẫu';
              const isPercentAnomaly = anomaly.id === 'dat-2' || anomaly.type === 'Phần trăm vs Điểm phần trăm';
              const isSourceAnomaly = anomaly.id === 'dat-3' || anomaly.type === 'Dữ liệu không rõ nguồn';

              return (
                <div
                  key={anomaly.id}
                  className="p-5 sm:p-6 rounded-2xl border border-rose-200 bg-white shadow-2xs space-y-4 transition-all"
                >
                  {/* Top Bar: Loại vấn đề + Vị trí */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-[17px] text-slate-900 leading-[1.4]">
                        {anomaly.type}
                      </span>
                      <span className="text-[12.5px] sm:text-[13px] font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                        {anomaly.riskSeverity === 'Cao' ? '🔴 PHẢI SỬA' : '🟠 NÊN SỬA'}
                      </span>
                      {isSampleAnomaly && sampleVerificationStatus === 'CONFIRMED' && (
                        <span className="text-[12.5px] sm:text-[13px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✓ ĐÃ KHẮC PHỤC</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[13px] sm:text-[14px] text-slate-600 font-semibold bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                      📍 {anomaly.location}
                    </span>
                  </div>

                  {/* Đối chiếu & Phân tích sai lệch (Section XXVIII & XXX) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* NỘI DUNG ĐỐI CHIẾU */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="text-[15px] sm:text-[16px] font-bold text-slate-800 uppercase tracking-wide block">
                        NỘI DUNG ĐỐI CHIẾU:
                      </span>
                      <p className="text-[16px] leading-[1.7] text-slate-900 italic font-normal bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                        "{anomaly.originalText}"
                      </p>
                    </div>

                    {/* PHÂN TÍCH SAI LỆCH & CĂN CỨ */}
                    <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                      <span className="text-[15px] sm:text-[16px] font-bold text-rose-950 uppercase tracking-wide block flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>PHÂN TÍCH SAI LỆCH:</span>
                      </span>
                      <p className="text-[15px] leading-[1.65] text-rose-950 font-normal">
                        {anomaly.analysis}
                      </p>
                      <p className="text-[13px] sm:text-[14px] text-slate-600 pt-1.5 border-t border-rose-200/60">
                        <strong className="font-bold text-slate-800">Trạng thái: </strong>
                        <span className="font-semibold text-rose-800">REQUIRES_VERIFICATION (Cần xác minh thực tế)</span>
                      </p>
                    </div>
                  </div>

                  {/* KHUYẾN NGHỊ KHẮC PHỤC (Section XXVIII & XXXI) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[15px] sm:text-[16px] font-bold text-slate-900 block">
                      KHUYẾN NGHỊ KHẮC PHỤC:
                    </span>
                    <p className="text-[15px] leading-[1.65] text-slate-800 font-normal">
                      {anomaly.actionNeeded}
                    </p>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* UI XÁC NHẬN CHO MÂU THUẪN 85 ↔ 82 (Section XIV)                */}
                  {/* ------------------------------------------------------------- */}
                  {isSampleAnomaly && (
                    <div className="mt-3 p-4 sm:p-5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-200 rounded text-[12.5px] font-bold uppercase tracking-wider text-amber-900 border border-amber-300">
                          ⚠ CẦN THẦY/CÔ XÁC NHẬN
                        </span>
                        <span className="text-[14px] font-bold text-amber-950">
                          Xác minh nguyên nhân chênh lệch giữa 85 và 82:
                        </span>
                      </div>

                      <div className="text-[14px] text-amber-900 bg-amber-100/60 p-3 rounded-lg border border-amber-200 space-y-1">
                        <p className="font-semibold">Hồ sơ hiện ghi:</p>
                        <p>• Cỡ mẫu: 85 học sinh</p>
                        <p>• Tổng số liệu chi tiết: 82 học sinh</p>
                        <p>• Chênh lệch: 3</p>
                        <p className="pt-1 text-[13px] text-amber-800 italic">
                          Hệ thống chưa đủ căn cứ xác định nguyên nhân. Thầy/Cô vui lòng xác nhận:
                        </p>
                      </div>

                      <form onSubmit={handleSaveSampleVerification} className="space-y-3">
                        <div className="space-y-2 text-[14px] sm:text-[15px] text-slate-800 font-medium">
                          
                          <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/60 cursor-pointer">
                            <input
                              type="radio"
                              name="sampleSizeOption"
                              value="85_is_correct"
                              checked={selectedSampleSizeOption === '85_is_correct'}
                              onChange={(e) => setSelectedSampleSizeOption(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>85 là số đúng</span>
                          </label>
                          {selectedSampleSizeOption === '85_is_correct' && (
                            <div className="ml-7 p-3 bg-blue-50 rounded-lg border border-blue-200 text-[14px] text-blue-950 leading-[1.6]">
                              Các số liệu thành phần hiện cộng lại bằng 82. Thầy/Cô cần kiểm tra lại các nhóm số liệu để xác định 3 trường hợp còn thiếu thuộc nhóm nào. (Hệ thống không tự phân bổ 3 trường hợp).
                            </div>
                          )}

                          <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/60 cursor-pointer">
                            <input
                              type="radio"
                              name="sampleSizeOption"
                              value="82_is_correct"
                              checked={selectedSampleSizeOption === '82_is_correct'}
                              onChange={(e) => setSelectedSampleSizeOption(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>82 là số đúng</span>
                          </label>
                          {selectedSampleSizeOption === '82_is_correct' && (
                            <div className="ml-7 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[14px] text-emerald-950 leading-[1.6]">
                              Thầy/Cô xác nhận 82 là cỡ mẫu thực tế. Hệ thống có thể đề xuất điều chỉnh các vị trí đang ghi 85 thành 82.
                            </div>
                          )}

                          <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/60 cursor-pointer">
                            <input
                              type="radio"
                              name="sampleSizeOption"
                              value="both_different_scope"
                              checked={selectedSampleSizeOption === 'both_different_scope'}
                              onChange={(e) => setSelectedSampleSizeOption(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Cả 85 và 82 đều đúng nhưng khác phạm vi</span>
                          </label>

                          {selectedSampleSizeOption === 'both_different_scope' && (
                            <div className="ml-7 p-3 bg-white rounded-lg border border-amber-300 space-y-1.5 animate-in fade-in duration-150">
                              <label className="block text-[13px] sm:text-[14px] font-bold text-slate-900">
                                Vui lòng mô tả sự khác nhau về phạm vi giữa hai con số: <span className="text-rose-600">*</span>
                              </label>
                              <textarea
                                value={scopeDifferenceNote}
                                onChange={(e) => setScopeDifferenceNote(e.target.value)}
                                placeholder="Nhập mô tả sự khác nhau về phạm vi (chỉ sử dụng nội dung do Thầy/Cô cung cấp, không tự suy đoán)..."
                                rows={2}
                                className="w-full p-2.5 text-[14px] bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900"
                              />
                            </div>
                          )}

                          <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/60 cursor-pointer">
                            <input
                              type="radio"
                              name="sampleSizeOption"
                              value="other_number"
                              checked={selectedSampleSizeOption === 'other_number'}
                              onChange={(e) => setSelectedSampleSizeOption(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Số đúng khác:</span>
                            {selectedSampleSizeOption === 'other_number' && (
                              <input
                                type="text"
                                value={customSampleNumber}
                                onChange={(e) => setCustomSampleNumber(e.target.value)}
                                placeholder="Nhập số thực tế..."
                                className="ml-1 px-3 py-1 text-[14px] bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-36"
                              />
                            )}
                          </label>
                          {selectedSampleSizeOption === 'other_number' && customSampleNumber.trim() && (
                            <div className="ml-7 p-3 bg-slate-100 rounded-lg border border-slate-300 text-[14px] text-slate-800 leading-[1.6]">
                              Thầy/Cô xác nhận cỡ mẫu thực tế là {customSampleNumber.trim()}. Các số liệu thành phần hiện cộng lại bằng 82. Thầy/Cô cần kiểm tra lại các nhóm số liệu để đảm bảo khớp với cỡ mẫu mới.
                            </div>
                          )}

                          <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/60 cursor-pointer">
                            <input
                              type="radio"
                              name="sampleSizeOption"
                              value="undetermined"
                              checked={selectedSampleSizeOption === 'undetermined'}
                              onChange={(e) => setSelectedSampleSizeOption(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Chưa xác định – tôi cần kiểm tra lại</span>
                          </label>
                          {selectedSampleSizeOption === 'undetermined' && (
                            <div className="ml-7 p-3 bg-rose-50 rounded-lg border border-rose-200 text-[14px] text-rose-950 leading-[1.6]">
                              Vấn đề được giữ ở trạng thái CẦN XÁC MINH (REQUIRES_VERIFICATION). Hệ thống không tạo bản sửa và chưa thể đánh dấu đã xử lý khi chưa có xác nhận từ tác giả.
                            </div>
                          )}

                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-200">
                          <button
                            type="submit"
                            disabled={!selectedSampleSizeOption || (selectedSampleSizeOption === 'both_different_scope' && !scopeDifferenceNote.trim()) || (selectedSampleSizeOption === 'other_number' && !customSampleNumber.trim())}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-[14px] rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            LƯU XÁC NHẬN CỠ MẪU (USER_CONFIRMED)
                          </button>
                        </div>
                      </form>

                      {sampleVerificationStatus === 'CONFIRMED' && (
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300 text-[14px] text-emerald-950 leading-[1.6]">
                          ✓ <strong>Đã ghi nhận xác nhận của tác giả (USER_CONFIRMED):</strong> Hệ thống sẽ chuẩn hóa bản sửa dựa trên thông tin thực tế này, không tự chèn nguyên nhân suy đoán.
                        </div>
                      )}
                      {sampleVerificationStatus === 'NEEDS_RECHECK' && (
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-300 text-[14px] text-rose-950 leading-[1.6]">
                          ⚠ <strong>Trạng thái: REQUIRES_VERIFICATION.</strong> Giữ nguyên cảnh báo mâu thuẫn để Thầy/Cô đối chiếu dữ liệu gốc trước khi nộp sáng kiến.
                        </div>
                      )}
                      {sampleVerificationStatus === 'NEEDS_RECHECK' && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-300 text-[14px] text-blue-950 leading-[1.6]">
                          ℹ <strong>Trạng thái:</strong> Đang chờ tác giả rà soát lại sổ điểm và biên bản kiểm phiếu gốc.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* UI XÁC MINH NGUỒN BIỂU ĐỒ (Section XX)                         */}
                  {/* ------------------------------------------------------------- */}
                  {isSourceAnomaly && (
                    <div className="mt-3 p-4 sm:p-5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-200 rounded text-[12.5px] font-bold uppercase tracking-wider text-amber-900 border border-amber-300">
                          ⚠ CẦN XÁC MINH NGUỒN
                        </span>
                        <span className="text-[14px] font-bold text-amber-950">
                          Biểu đồ hiện chưa cho biết dữ liệu được lấy từ đâu:
                        </span>
                      </div>

                      <form onSubmit={handleSaveChartSource} className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <span className="text-[14px] font-semibold text-slate-800 shrink-0">
                            Nguồn dữ liệu thực tế:
                          </span>
                          <input
                            type="text"
                            value={chartSourceInput}
                            onChange={(e) => setChartSourceInput(e.target.value)}
                            placeholder="Ví dụ: Báo cáo tổng kết năm học 2023-2024 của trường THCS... hoặc Tác giả tự khảo sát..."
                            className="flex-1 px-3.5 py-2 text-[14px] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <button
                            type="submit"
                            disabled={!chartSourceInput.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[14px] rounded-xl transition-colors shrink-0 cursor-pointer"
                          >
                            CẬP NHẬT NGUỒN
                          </button>
                        </div>
                      </form>

                      {chartSourceStatus === 'CONFIRMED' && (
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 text-[14px] text-emerald-950">
                          ✓ Đã bổ sung nguồn dữ liệu: <strong>{chartSourceInput}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* PHÉP TÍNH SUY RA TRỰC TIẾP (Section XVI)                       */}
                  {/* ------------------------------------------------------------- */}
                  {isPercentAnomaly && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[14px] sm:text-[15px] text-blue-950 leading-[1.65] space-y-1">
                      <span className="font-bold text-blue-900 block">
                        Phép tính suy ra trực tiếp (DERIVED_CALCULATION):
                      </span>
                      <p>
                        • Mức tăng tuyệt đối: <strong>75% - 60% = 15 điểm phần trăm</strong> (percentage points).
                      </p>
                      <p>
                        • Mức tăng tương đối: <strong>(75 - 60) / 60 = 25%</strong> so với giá trị ban đầu.
                      </p>
                      <p className="text-[13px] text-blue-800 italic">
                        * Bản sửa học thuật đã chuẩn hóa cách diễn đạt chính xác để tránh nhầm lẫn giữa % và điểm phần trăm.
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* PHẦN 2: CHUỖI SUY LUẬN ĐỨT GÃY (Section XXII)                         */}
          {/* --------------------------------------------------------------------- */}
          {logicGaps.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-[17px] sm:text-[18px] font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-600" />
                  <span>Chuỗi suy luận đứt gãy ({logicGaps.length})</span>
                </h2>
                <span className="text-[13px] text-slate-500 font-medium">
                  Tính liên kết Nguyên nhân ↔ Giải pháp ↔ Kết luận
                </span>
              </div>

              {logicGaps.map((gap, index) => (
                <div
                  key={gap.id}
                  className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[13px] flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <h3 className="text-[17px] font-bold text-slate-900 leading-[1.4]">
                        {gap.stepName}
                      </h3>
                    </div>
                    <span className="text-[13px] sm:text-[14px] text-slate-600 font-semibold bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                      📍 {gap.location}
                    </span>
                  </div>

                  {/* Mô tả khoảng đứt gãy */}
                  <div className="space-y-2">
                    <span className="text-[15px] sm:text-[16px] font-bold text-slate-900 block">
                      VẤN ĐỀ ĐỨT GÃY LẬP LUẬN:
                    </span>
                    <p className="text-[15px] text-slate-800 leading-[1.65]">
                      {gap.gapDescription}
                    </p>
                  </div>

                  {/* Phân tích mắt xích còn thiếu */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[15px] sm:text-[16px] font-bold text-slate-900 block">
                      PHÂN TÍCH MẮT XÍCH CÒN THIẾU:
                    </span>
                    <p className="text-[15px] text-slate-800 leading-[1.65]">
                      {gap.missingLinkAnalysis}
                    </p>
                  </div>

                  {/* Hướng dẫn khắc phục & Câu hỏi gợi mở */}
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                    <span className="text-[15px] sm:text-[16px] font-bold text-indigo-950 block">
                      HƯỚNG DẪN KHẮC PHỤC & CÂU HỎI LÀM RÕ:
                    </span>
                    <p className="text-[15px] text-indigo-950 leading-[1.65]">
                      {gap.correctionGuidance}
                    </p>

                    {gap.id === 'log-1' && (
                      <div className="pt-2 border-t border-indigo-200 space-y-2">
                        <label className="block text-[14px] font-bold text-indigo-950">
                          Thầy/Cô vui lòng cho biết hoạt động sư phạm thực tế khắc phục khó khăn này:
                        </label>
                        <textarea
                          value={logicActivityInput}
                          onChange={(e) => setLogicActivityInput(e.target.value)}
                          placeholder="Mô tả hoạt động cụ thể (ví dụ: giao câu hỏi định hướng trước khi học sinh thảo luận, tổ chức phản biện nhóm... AI không tự bịa giải pháp nếu hồ sơ chưa có)..."
                          rows={2}
                          className="w-full p-3 bg-white border border-indigo-300 rounded-xl text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleSaveLogicActivity}
                            disabled={!logicActivityInput.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[14px] rounded-xl transition-colors cursor-pointer"
                          >
                            CẬP NHẬT HOẠT ĐỘNG
                          </button>
                        </div>
                        {logicStatus === 'CONFIRMED' && (
                          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 text-[14px] text-emerald-950">
                            ✓ Đã ghi nhận giải pháp sư phạm từ tác giả: <strong>{logicActivityInput}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
