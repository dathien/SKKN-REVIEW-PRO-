import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

interface CorePrinciplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CorePrinciplesModal: React.FC<CorePrinciplesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    { rule: "Không chấm nếu không có căn cứ", desc: "Mọi điểm số phải gắn liền với một đoạn trích dẫn, bảng biểu hoặc phụ lục cụ thể." },
    { rule: "Không trừ điểm nếu không giải thích được lý do", desc: "Mỗi điểm bị trừ đều phải chỉ rõ: Điểm bị hạn chế vì vấn đề nào và nội dung/minh chứng nào đang thiếu." },
    { rule: "Không phản biện chung chung", desc: "Tuyệt đối không chỉ đưa ra các nhận xét mơ hồ như 'Tốt', 'Khá', 'Cần cải thiện'." },
    { rule: "Không nói 'cần bổ sung minh chứng' mà không nói rõ cần minh chứng gì", desc: "Phải chỉ rõ tên loại minh chứng: rubric, phiếu quan sát hành vi, ảnh sản phẩm, biên bản dự giờ..." },
    { rule: "Không nói 'cần chỉnh sửa' mà không chỉ rõ chỉnh ở đâu và chỉnh như thế nào", desc: "Định vị chính xác Trang, Mục, Đoạn và cung cấp gợi ý viết lại 3 mức độ." },
    { rule: "TUYỆT ĐỐI KHÔNG TỰ TẠO SỐ LIỆU", desc: "Không tự tạo kết quả khảo sát, không tự tạo minh chứng, không bịa đặt nguồn trích dẫn hay tài liệu tham khảo." },
    { rule: "Không thay đổi bản chất nghiên cứu và không phóng đại hiệu quả", desc: "Tôn trọng dữ liệu gốc của giáo viên, phân biệt rõ giữa % và điểm phần trăm." },
    { rule: "Sử dụng 'CHƯA ĐỦ CĂN CỨ ĐỂ KẾT LUẬN'", desc: "Nếu không đủ thông tin, bắt buộc dùng cụm từ này thay vì tự suy đoán để lấp khoảng trống." },
    { rule: "Phân biệt rạch ròi 4 trạng thái đánh giá", desc: "1. 'Không đạt'; 2. 'Chưa tìm thấy minh chứng'; 3. 'Chưa đủ căn cứ xác nhận'; 4. 'Có dấu hiệu cần kiểm tra thêm'." },
    { rule: "Thứ tự ưu tiên căn cứ nghiêm ngặt", desc: "1. Phiếu chấm người dùng cung cấp → 2. Nội dung SKKN → 3. Minh chứng kèm theo → 4. Dữ liệu khảo sát → 5. TLTK trong SKKN → 6. Nguồn bên ngoài." },
    { rule: "Không đồng nhất công nghệ/AI với tính mới", desc: "Dùng Canva, Quizizz, AI, hay trò chơi không tự động biến đề tài thành mới. Tính mới phải nằm ở quy trình sư phạm." },
    { rule: "Không suy luận 'sau áp dụng điểm cao hơn = chắc chắn do sáng kiến'", desc: "Phải kiểm soát biến ngoại lai, tính tương đương đầu vào và độ khó giữa các kỳ thi." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                12 NGUYÊN TẮC CỐT LÕI CỦA SKKN REVIEW PRO
              </h3>
              <p className="text-xs text-slate-500">
                “Chấm có căn cứ – Phản biện có chiều sâu – Sửa đúng điểm yếu”
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 text-xs flex-1">
          {rules.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">
                  {item.rule}
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
