import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Calendar,
  Award,
  Clock,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  History,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { EvaluationItem, EvaluationRecordStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportEvaluationReportDoc } from '../../utils/reportExporter';

interface MyEvaluationsViewProps {
  onSelectEvaluation: (item: EvaluationItem) => void;
  onContinueEdit: (item: EvaluationItem) => void;
  onRescore: (item: EvaluationItem) => void;
  onStartNewSKKN: () => void;
}

export const MyEvaluationsView: React.FC<MyEvaluationsViewProps> = ({
  onSelectEvaluation,
  onContinueEdit,
  onRescore,
  onStartNewSKKN,
}) => {
  const { user, isLoggedIn, openAuthModal } = useAuth();
  // Tải danh sách hồ sơ cá nhân - Cache key helper
  const getCacheKey = (email?: string) => `skkn_evaluations_cache_${(email || user?.email || 'guest').toLowerCase().trim()}`;

  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const email = user?.email || (JSON.parse(localStorage.getItem('skkn_user') || '{}')?.email);
        const cached = localStorage.getItem(`skkn_evaluations_cache_${(email || 'guest').toLowerCase().trim()}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bộ lọc & tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EvaluationRecordStatus>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_score' | 'lowest_score' | 'title_az'>('newest');

  // Modals
  const [renamingItem, setRenamingItem] = useState<EvaluationItem | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);

  const [deletingItem, setDeletingItem] = useState<EvaluationItem | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const [viewingHistoryItem, setViewingHistoryItem] = useState<EvaluationItem | null>(null);

// Trợ lý an toàn phân giải phản hồi API (chống crash khi gặp HTML/doctype hoặc lỗi mạng)
async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (netErr: any) {
    throw new Error(`Lỗi kết nối mạng: ${netErr.message || 'Không thể gửi yêu cầu đến máy chủ.'}`);
  }

  const contentType = (resp.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    const rawText = await resp.text().catch(() => '');
    const isHtml = rawText.trim().startsWith('<') || rawText.toLowerCase().includes('<!doctype') || rawText.toLowerCase().includes('<html');
    if (isHtml) {
      throw new Error(`Máy chủ phản hồi trang web HTML (Mã HTTP ${resp.status}) thay vì dữ liệu JSON. Endpoint "${url}" cần kiểm tra định tuyến backend.`);
    }
    throw new Error(`Máy chủ trả về định dạng không hợp lệ (${contentType || 'không xác định'}, HTTP ${resp.status}): ${rawText.slice(0, 80)}`);
  }

  let data: any;
  try {
    data = await resp.json();
  } catch (parseErr: any) {
    throw new Error(`Không thể giải mã dữ liệu JSON từ máy chủ (HTTP ${resp.status}): ${parseErr.message}`);
  }

  if (!resp.ok) {
    if (resp.status === 401) {
      throw new Error(data?.error || 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập (HTTP 401).');
    }
    if (resp.status === 403) {
      throw new Error(data?.error || 'Bảo mật: Bạn không có quyền truy cập hồ sơ này (HTTP 403).');
    }
    if (resp.status === 404) {
      throw new Error(data?.error || `Tuyến đường không tồn tại trên máy chủ (HTTP 404): ${url}`);
    }
    throw new Error(data?.error || data?.message || `Lỗi từ máy chủ (HTTP ${resp.status})`);
  }

  return data as T;
}

  const fetchEvaluations = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
      const googleCredential = (user as any)?.googleCredential || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_google_credential') : '') || '';

      const data = await safeFetchJson<{ success: boolean; evaluations?: EvaluationItem[]; error?: string }>('/api/user/evaluations/list', {
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
          'x-google-credential': googleCredential,
          'x-user-email': user?.email || '',
        },
      });

      if (!data.success) {
        throw new Error(data.error || 'Máy chủ không thể lấy danh sách hồ sơ.');
      }

      if (Array.isArray(data.evaluations)) {
        setEvaluations(data.evaluations);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(getCacheKey(), JSON.stringify(data.evaluations));
          } catch (_) {}
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải kho hồ sơ:', err);
      const diagnosticMsg = err.message || 'Không thể kết nối đến máy chủ lưu trữ hồ sơ.';
      setErrorMessage(diagnosticMsg);
      // Nếu có bản lưu đệm từ trước, phục hồi để bảo vệ người dùng không bị mất danh sách
      if (typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem(getCacheKey());
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEvaluations(parsed);
            }
          }
        } catch (_) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // Phục hồi nhanh từ cache trước để tránh giật lag UI (Requirement B.6)
      if (typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem(getCacheKey());
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEvaluations(parsed);
            }
          }
        } catch (_) {}
      }
      fetchEvaluations();
    }
  }, [isLoggedIn, user?.email]);

  // Xử lý đổi tên hồ sơ
  // Xử lý đổi tên hồ sơ
  const handleConfirmRename = async () => {
    if (!renamingItem || !newTitleInput.trim()) return;
    setIsRenamingLoading(true);
    try {
      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
      const data = await safeFetchJson<{ success: boolean; evaluation?: EvaluationItem }>('/api/user/evaluations/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          evaluationId: renamingItem.id,
          newTitle: newTitleInput.trim(),
        }),
      });

      if (!data.success) {
        throw new Error('Đổi tên hồ sơ thất bại.');
      }

      setEvaluations(prev => {
        const next = prev.map(item => item.id === renamingItem.id ? { ...item, title: newTitleInput.trim() } : item);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(getCacheKey(), JSON.stringify(next));
          } catch (_) {}
        }
        return next;
      });
      setRenamingItem(null);
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể đổi tên'));
    } finally {
      setIsRenamingLoading(false);
    }
  };

  // Xử lý xóa hồ sơ
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeletingLoading(true);
    try {
      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
      const data = await safeFetchJson<{ success: boolean }>('/api/user/evaluations/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          evaluationId: deletingItem.id,
        }),
      });

      if (!data.success) {
        throw new Error('Xóa hồ sơ thất bại.');
      }

      setEvaluations(prev => {
        const next = prev.filter(item => item.id !== deletingItem.id);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(getCacheKey(), JSON.stringify(next));
          } catch (_) {}
        }
        return next;
      });
      setDeletingItem(null);
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa hồ sơ'));
    } finally {
      setIsDeletingLoading(false);
    }
  };

  // Xử lý tải báo cáo Word
  const handleDownloadWordReport = async (item: EvaluationItem) => {
    if (item.analysisResult) {
      exportEvaluationReportDoc(item.analysisResult, `${item.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]/g, '_')}_BaoCao.doc`);
      return;
    }

    try {
      const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
      const data = await safeFetchJson<{ success: boolean; evaluation?: EvaluationItem }>(`/api/user/evaluations/get?id=${encodeURIComponent(item.id)}`, {
        headers: {
          'x-session-token': sessionToken,
          'x-user-email': user?.email || '',
        },
      });

      if (data.success && data.evaluation?.analysisResult) {
        exportEvaluationReportDoc(data.evaluation.analysisResult, `${item.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]/g, '_')}_BaoCao.doc`);
      } else {
        alert('Không tìm thấy dữ liệu báo cáo chi tiết để xuất Word.');
      }
    } catch (err: any) {
      alert('Lỗi khi tải báo cáo: ' + err.message);
    }
  };

  // Lọc và sắp xếp
  const filteredEvaluations = evaluations.filter(item => {
    const matchSearch = !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.gradeLevel && item.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  filteredEvaluations.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    }
    if (sortBy === 'highest_score') {
      return (b.score || 0) - (a.score || 0);
    }
    if (sortBy === 'lowest_score') {
      return (a.score || 0) - (b.score || 0);
    }
    if (sortBy === 'title_az') {
      return a.title.localeCompare(b.title, 'vi');
    }
    return 0;
  });

  // Thống kê nhanh
  const totalCount = evaluations.length;
  const avgScore = totalCount > 0
    ? (evaluations.reduce((acc, item) => acc + (item.score || 0), 0) / totalCount).toFixed(1)
    : '0';
  const excellentCount = evaluations.filter(item => (item.score || 0) >= 85).length;
  const revisedCount = evaluations.filter(item => item.status === 'REVISED' || (item.versionCount || 1) > 1).length;

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">KHO HỒ SƠ SÁNG KIẾN KINH NGHIỆM</h2>
        <p className="text-slate-600 max-w-md mx-auto mt-2 text-[15px] leading-relaxed">
          Đăng nhập tài khoản Google để lưu trữ tự động, quản lý lịch sử đánh giá và tải lại toàn bộ hồ sơ SKKN của Thầy/Cô an toàn trên Google Drive.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-[15px]"
        >
          <span>Đăng nhập ngay</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* HEADER BANNER & THỐNG KÊ */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[12.5px] font-bold mb-3">
              <FolderOpen className="w-4 h-4" />
              <span>HỆ THỐNG LƯU TRỮ HỒ SƠ CÁ NHÂN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              HỒ SƠ CỦA TÔI
            </h1>
            <p className="text-slate-300 text-[14.5px] mt-1 max-w-xl leading-relaxed">
              Quản lý toàn bộ các sáng kiến đã thẩm định, xem lại kết quả chi tiết, tiếp tục chỉnh sửa và đánh giá lại không giới hạn.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchEvaluations}
              disabled={isLoading}
              className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onStartNewSKKN}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-[14.5px]"
            >
              <Plus className="w-5 h-5" />
              <span>Thẩm định SKKN mới</span>
            </button>
          </div>
        </div>

        {/* THỐNG KÊ 4 Ô */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <div className="text-[12.5px] font-semibold text-slate-400 uppercase tracking-wider">Tổng số SKKN</div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {errorMessage && evaluations.length === 0 ? '--' : isLoading && evaluations.length === 0 ? '...' : totalCount}
            </div>
            <div className="text-[11.5px] text-blue-400 mt-0.5">
              {errorMessage && evaluations.length === 0 ? 'Chưa thể kết nối' : 'Lưu trữ trên hệ thống'}
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <div className="text-[12.5px] font-semibold text-slate-400 uppercase tracking-wider">Điểm trung bình</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {errorMessage && evaluations.length === 0 ? '--' : `${avgScore}đ`}
            </div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">Theo chuẩn Rubric</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <div className="text-[12.5px] font-semibold text-slate-400 uppercase tracking-wider">Hồ sơ Xuất sắc</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {errorMessage && evaluations.length === 0 ? '--' : excellentCount}
            </div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">Đạt từ 85 điểm trở lên</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <div className="text-[12.5px] font-semibold text-slate-400 uppercase tracking-wider">Đã hoàn thiện</div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
              {errorMessage && evaluations.length === 0 ? '--' : revisedCount}
            </div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">Có từ 2 phiên bản trở lên</div>
          </div>
        </div>
      </div>

      {/* Cảnh báo đệm nếu có lỗi kết nối nhưng vẫn còn bản lưu đệm */}
      {errorMessage && evaluations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-800 text-[13.5px] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Cảnh báo kết nối máy chủ:</strong> {errorMessage}. Đang hiển thị bản lưu đệm an toàn từ thiết bị.
            </span>
          </div>
          <button
            type="button"
            onClick={fetchEvaluations}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer transition-colors"
          >
            {isLoading ? 'Đang thử lại...' : 'Thử lại'}
          </button>
        </div>
      )}

      {/* THANH CÔNG CỤ TÌM KIẾM, BỘ LỌC VÀ SẮP XẾP */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Tìm kiếm */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sáng kiến, môn học, khối lớp..."
            className="w-full pl-10 pr-4 py-2 text-[14px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* Lọc trạng thái & Sắp xếp */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[13px] font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã đánh giá
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REVISED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'REVISED' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã chỉnh sửa
            </button>
          </div>

          {/* Sắp xếp */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-[13px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="highest_score">Điểm cao nhất</option>
              <option value="lowest_score">Điểm thấp nhất</option>
              <option value="title_az">Tên A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* DANH SÁCH HỒ SƠ */}
      {isLoading && evaluations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-slate-700">Đang tải danh sách hồ sơ từ máy chủ...</p>
        </div>
      ) : errorMessage && evaluations.length === 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-[16px]">Không thể tải kho hồ sơ</h3>
          <p className="text-[14px] text-rose-700 mt-1 max-w-xl mx-auto">{errorMessage}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={fetchEvaluations}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-[13.5px] cursor-pointer hover:bg-rose-700 transition-colors"
            >
              Thử lại kết nối
            </button>
            <button
              type="button"
              onClick={onStartNewSKKN}
              className="px-4 py-2 bg-white border border-rose-300 text-rose-800 rounded-xl font-bold text-[13.5px] cursor-pointer hover:bg-rose-100 transition-colors"
            >
              Thẩm định sáng kiến mới
            </button>
          </div>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-[17px] font-bold text-slate-800">Chưa có hồ sơ sáng kiến nào</h3>
          <p className="text-slate-500 text-[14px] mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Không tìm thấy hồ sơ phù hợp với từ khóa hoặc bộ lọc đã chọn.'
              : 'Hãy bắt đầu thẩm định sáng kiến đầu tiên để hệ thống tự động lưu trữ và quản lý tại đây.'}
          </p>
          <button
            type="button"
            onClick={onStartNewSKKN}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-[14px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thẩm định sáng kiến mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvaluations.map((item) => {
            const scoreColor = (item.score || 0) >= 85
              ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
              : (item.score || 0) >= 70
              ? 'text-blue-700 bg-blue-50 border-blue-300'
              : 'text-amber-700 bg-amber-50 border-amber-300';

            const statusBadge = item.status === 'REVISED'
              ? { label: 'Đã chỉnh sửa', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' }
              : item.status === 'COMPLETED'
              ? { label: 'Đã thẩm định', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
              : { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-200' };

            const formattedDate = item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Chưa xác định';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Thông tin hồ sơ bên trái */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[12px] font-bold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[12px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      v{item.currentVersion || item.versionCount || 1}
                    </span>
                    {item.subject && (
                      <span className="text-[12.5px] font-semibold text-slate-500">
                        • {item.subject}
                      </span>
                    )}
                    {item.gradeLevel && (
                      <span className="text-[12.5px] font-semibold text-slate-500">
                        • {item.gradeLevel}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectEvaluation(item)}
                    className="text-[16px] sm:text-[17px] font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer tracking-tight"
                    title="Nhấp để xem lại toàn bộ kết quả đánh giá"
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-4 text-[13px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Cập nhật: {formattedDate}
                    </span>
                    {item.originalFileName && (
                      <span className="flex items-center gap-1 truncate max-w-[220px]" title={item.originalFileName}>
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.originalFileName}</span>
                      </span>
                    )}
                    {item.versionCount > 1 && (
                      <button
                        type="button"
                        onClick={() => setViewingHistoryItem(item)}
                        className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>{item.versionCount} phiên bản</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Điểm số & Các nút thao tác bên phải */}
                <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                  {/* Badge Điểm */}
                  <div className="text-center px-4 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[90px] shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Điểm</span>
                    <span className={`text-[20px] font-black leading-tight ${scoreColor.split(' ')[0]}`}>
                      {(item.score || 0).toFixed(1)}
                    </span>
                  </div>

                  {/* Nhóm nút thao tác */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Xem lại */}
                    <button
                      type="button"
                      onClick={() => onSelectEvaluation(item)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200"
                      title="Xem lại toàn bộ kết quả phân tích"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem lại</span>
                    </button>

                    {/* Tiếp tục chỉnh sửa */}
                    <button
                      type="button"
                      onClick={() => onContinueEdit(item)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Mở tài liệu và kết quả để tiếp tục sửa các vấn đề"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                      <span className="hidden sm:inline">Chỉnh sửa</span>
                    </button>

                    {/* Đánh giá lại */}
                    <button
                      type="button"
                      onClick={() => onRescore(item)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200"
                      title="Chấm lại và lưu thành phiên bản mới"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Chấm lại</span>
                    </button>

                    {/* Tải báo cáo Word */}
                    <button
                      type="button"
                      onClick={() => handleDownloadWordReport(item)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                      title="Tải báo cáo Word (.doc)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Đổi tên */}
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingItem(item);
                        setNewTitleInput(item.title);
                      }}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                      title="Đổi tên hồ sơ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Xóa */}
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Xóa hồ sơ này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ĐỔI TÊN HỒ SƠ                                                       */}
      {/* ========================================================================= */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-[17px] font-bold text-slate-900 mb-2">Đổi tên hồ sơ sáng kiến</h3>
            <p className="text-[13.5px] text-slate-500 mb-4">
              Nhập tên mới cho hồ sơ. Thay đổi sẽ được cập nhật đồng bộ vào Google Sheets và Google Drive.
            </p>
            <input
              type="text"
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              placeholder="Nhập tên sáng kiến..."
              className="w-full px-4 py-2.5 text-[14px] border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 mb-5"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                disabled={isRenamingLoading}
                className="px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={isRenamingLoading || !newTitleInput.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[14px] shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRenamingLoading ? 'Đang lưu...' : 'Lưu tên mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN XÓA HỒ SƠ                                                 */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 text-center mb-1">Xác nhận xóa hồ sơ</h3>
            <p className="text-[13.5px] text-slate-600 text-center mb-5 leading-relaxed">
              Thầy/Cô có chắc chắn muốn xóa hồ sơ <strong>"{deletingItem.title}"</strong> không? Thao tác này sẽ dọn dẹp các tệp liên quan trong thư mục Google Drive của hồ sơ này.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeletingLoading}
                className="flex-1 py-2.5 text-[14px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[14px] shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XEM LỊCH SỬ PHIÊN BẢN                                               */}
      {/* ========================================================================= */}
      {viewingHistoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Lịch sử các phiên bản</h3>
                <p className="text-[13px] text-slate-500 truncate max-w-sm">{viewingHistoryItem.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {viewingHistoryItem.versionsHistory && viewingHistoryItem.versionsHistory.length > 0 ? (
                viewingHistoryItem.versionsHistory.map((v, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[14px]">Phiên bản v{v.version}</span>
                        <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {v.score} điểm
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-500 mt-1">
                        {new Date(v.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {v.notes ? ` • ${v.notes}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-[14px]">
                  Phiên bản v1 (Điểm ban đầu: {viewingHistoryItem.score} điểm)
                </div>
              )}
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setViewingHistoryItem(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[14px] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
