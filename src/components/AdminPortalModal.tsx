import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Settings,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Calendar,
  Gift,
  Clock,
  UserCheck,
  UserX,
  Award,
  Key,
  Copy,
  Plus,
  Trash2,
  Smartphone,
  Laptop,
  Check,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAccount, GuestSession, SystemStats, SystemSettings, UserRole, LicensePlan, LicenseItem, LicenseStatus } from '../types';

export const AdminPortalModal: React.FC = () => {
  const { isAdminModalOpen, closeAdminModal, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'licenses' | 'settings'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [guestsList, setGuestsList] = useState<GuestSession[]>([]);
  const [licensesList, setLicensesList] = useState<LicenseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseFilterStatus, setLicenseFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals for user actions
  const [quotaModalUser, setQuotaModalUser] = useState<UserAccount | null>(null);
  const [quotaEasyInput, setQuotaEasyInput] = useState<number>(3);
  const [quotaAdvancedInput, setQuotaAdvancedInput] = useState<number>(1);

  const [grantModalUser, setGrantModalUser] = useState<UserAccount | null>(null);
  const [grantHasExpiry, setGrantHasExpiry] = useState<boolean>(false);
  const [grantExpiryDate, setGrantExpiryDate] = useState<string>('');

  const [confirmRevokeUser, setConfirmRevokeUser] = useState<UserAccount | null>(null);
  const [confirmBlockUser, setConfirmBlockUser] = useState<UserAccount | null>(null);

  // Modal thêm người dùng mới
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<'TRIAL' | 'LICENSED'>('TRIAL');
  const [newUserEasyQuota, setNewUserEasyQuota] = useState<number>(3);
  const [newUserAdvancedQuota, setNewUserAdvancedQuota] = useState<number>(1);
  const [newUserHasExpiry, setNewUserHasExpiry] = useState(false);
  const [newUserExpiryDate, setNewUserExpiryDate] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Modals for license actions
  const [isCreateLicenseOpen, setIsCreateLicenseOpen] = useState(false);
  const [createPlan, setCreatePlan] = useState<LicensePlan>('PRO');
  const [createDurationMonths, setCreateDurationMonths] = useState<number>(0);
  const [createMaxDevices, setCreateMaxDevices] = useState<number>(1);
  const [createAssignedEmail, setCreateAssignedEmail] = useState('');
  const [createCustomerNote, setCreateCustomerNote] = useState('');
  const [isSubmittingLicense, setIsSubmittingLicense] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmResetDevicesLicense, setConfirmResetDevicesLicense] = useState<LicenseItem | null>(null);
  const [confirmDeleteLicense, setConfirmDeleteLicense] = useState<LicenseItem | null>(null);

  // Settings tab state
  const [settings, setSettings] = useState<SystemSettings>({
    guestEasyLimit: 3,
    guestAdvancedLimit: 1,
    trialEasyLimit: 5,
    trialAdvancedLimit: 2,
    freeAccessEnabled: false,
    freeAccessName: 'Chương trình Trải nghiệm Giáo dục',
    freeAccessStart: '',
    freeAccessEnd: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSyncStatus, setSettingsSyncStatus] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    ...(user?.id ? { 'x-user-id': user.id } : {})
  });

  const fetchAdminData = async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const [statsRes, usersRes, settingsRes, licensesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: getAuthHeaders() }),
        fetch('/api/admin/users', { headers: getAuthHeaders() }),
        fetch('/api/admin/settings', { headers: getAuthHeaders() }).catch(() => null),
        fetch('/api/admin/licenses', { headers: getAuthHeaders() }).catch(() => null)
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsersList(u.users || []);
        setGuestsList(u.guests || []);
      }
      if (settingsRes && settingsRes.ok) {
        const setJson = await settingsRes.json();
        if (setJson.settings) {
          setSettings(setJson.settings);
        }
      }
      if (licensesRes && licensesRes.ok) {
        const licJson = await licensesRes.json();
        setLicensesList(licJson.licenses || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setActionFeedback({
        type: 'error',
        text: 'Chưa thể tải dữ liệu quản trị lúc này. Vui lòng thử lại.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      fetchAdminData();
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  // 1. Thao tác điều chỉnh lượt trải nghiệm
  const handleOpenQuotaModal = (target: UserAccount) => {
    setQuotaModalUser(target);
    setQuotaEasyInput(target.quota?.easy ?? 0);
    setQuotaAdvancedInput(target.quota?.advanced ?? 0);
  };

  const handleSaveQuota = async () => {
    if (!quotaModalUser) return;
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: quotaModalUser.email,
          quota: {
            easy: Math.max(0, quotaEasyInput),
            advanced: Math.max(0, quotaAdvancedInput)
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã cập nhật số lượt cho tài khoản ${quotaModalUser.email} thành công.`
        });
        setQuotaModalUser(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Cập nhật số lượt thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi cập nhật số lượt.'
      });
    }
  };

  // 2. Thao tác Cấp quyền sử dụng (LICENSED)
  const handleOpenGrantModal = (target: UserAccount) => {
    setGrantModalUser(target);
    setGrantHasExpiry(Boolean(target.licenseExpiresAt));
    setGrantExpiryDate(target.licenseExpiresAt ? target.licenseExpiresAt.split('T')[0] : '');
  };

  const handleSaveGrant = async () => {
    if (!grantModalUser) return;
    try {
      const expiresAt = grantHasExpiry && grantExpiryDate ? new Date(grantExpiryDate).toISOString() : null;
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: grantModalUser.email,
          plan: 'LICENSED',
          expiresAt
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã cấp quyền sử dụng không giới hạn cho tài khoản ${grantModalUser.email}.`
        });
        setGrantModalUser(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Cấp quyền thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi cấp quyền sử dụng.'
      });
    }
  };

  // 3. Thao tác Thu hồi quyền sử dụng
  const handleConfirmRevoke = async () => {
    if (!confirmRevokeUser) return;
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: confirmRevokeUser.email,
          plan: 'TRIAL',
          expiresAt: null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã thu hồi quyền sử dụng của ${confirmRevokeUser.email}. Tài khoản đã chuyển về Gói trải nghiệm.`
        });
        setConfirmRevokeUser(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Thu hồi quyền thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi thu hồi quyền sử dụng.'
      });
    }
  };

  // 4. Thao tác Khóa / Mở khóa
  const handleToggleBlock = async (target: UserAccount) => {
    // ROOT ADMIN SAFETY
    if (user?.email && target.email.toLowerCase() === user.email.toLowerCase()) {
      setActionFeedback({
        type: 'error',
        text: 'Quy tắc an toàn Quản trị: Không thể tự khóa tài khoản Quản trị viên của chính mình.'
      });
      return;
    }

    if (!target.isBlocked) {
      setConfirmBlockUser(target);
      return;
    }

    // Mở khóa trực tiếp
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: target.email,
          isBlocked: false
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã mở khóa tài khoản ${target.email}.`
        });
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Mở khóa thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi mở khóa tài khoản.'
      });
    }
  };

  const handleExecuteBlock = async () => {
    if (!confirmBlockUser) return;
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: confirmBlockUser.email,
          isBlocked: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã tạm khóa tài khoản ${confirmBlockUser.email}.`
        });
        setConfirmBlockUser(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Khóa tài khoản thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi khóa tài khoản.'
      });
    }
  };

  // 4B. Thao tác Thêm người dùng mới
  const handleOpenAddUser = () => {
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPlan('TRIAL');
    setNewUserEasyQuota(settings.trialEasyLimit ?? 3);
    setNewUserAdvancedQuota(settings.trialAdvancedLimit ?? 1);
    setNewUserHasExpiry(false);
    setNewUserExpiryDate('');
    setIsAddUserOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newUserEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setActionFeedback({
        type: 'error',
        text: 'Vui lòng nhập địa chỉ email hợp lệ.'
      });
      return;
    }

    setIsSubmittingUser(true);
    try {
      const expiresAt = newUserPlan === 'LICENSED' && newUserHasExpiry && newUserExpiryDate
        ? new Date(newUserExpiryDate).toISOString()
        : null;

      const quota = newUserPlan === 'LICENSED'
        ? { easy: 9999, advanced: 9999 }
        : { easy: Math.max(0, newUserEasyQuota), advanced: Math.max(0, newUserAdvancedQuota) };

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: cleanEmail,
          name: newUserName.trim() || undefined,
          plan: newUserPlan,
          role: newUserPlan === 'LICENSED' ? 'LICENSED' : 'TRIAL',
          quota,
          expiresAt,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã thêm tài khoản ${cleanEmail} vào hệ thống thành công.`
        });
        setIsAddUserOpen(false);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Thêm người dùng thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi thêm người dùng.'
      });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // 5. Thao tác Lưu Cấu hình sử dụng
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSyncStatus(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: 'Đã lưu cấu hình sử dụng thành công.'
        });
        if (data.remoteStatus) {
          setSettingsSyncStatus(data.remoteStatus);
        }
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Lưu cấu hình thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi lưu cấu hình.'
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 6. Thao tác License Key & Thiết bị
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLicense(true);
    try {
      const res = await fetch('/api/admin/licenses/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          plan: createPlan,
          durationMonths: createDurationMonths,
          maxDevices: createMaxDevices,
          assignedEmail: createAssignedEmail.trim() || undefined,
          customerNote: createCustomerNote.trim() || undefined,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã tạo thành công mã bản quyền: ${data.license.key}`
        });
        setIsCreateLicenseOpen(false);
        setCreateAssignedEmail('');
        setCreateCustomerNote('');
        setCreateDurationMonths(0);
        setCreateMaxDevices(1);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Tạo mã bản quyền thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi tạo mã bản quyền.'
      });
    } finally {
      setIsSubmittingLicense(false);
    }
  };

  const handleResetDevices = async () => {
    if (!confirmResetDevicesLicense) return;
    try {
      const res = await fetch('/api/admin/licenses/reset-devices', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key: confirmResetDevicesLicense.key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã gỡ thiết bị cho mã ${confirmResetDevicesLicense.key}. Khách hàng có thể kích hoạt trên thiết bị mới!`
        });
        setConfirmResetDevicesLicense(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Reset thiết bị thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi gỡ thiết bị.'
      });
    }
  };

  const handleToggleLicenseStatus = async (target: LicenseItem) => {
    const nextStatus: LicenseStatus = target.status === 'REVOKED'
      ? (target.assignedEmail ? 'ACTIVE' : 'UNUSED')
      : 'REVOKED';
    try {
      const res = await fetch('/api/admin/licenses/toggle-status', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key: target.key, status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: nextStatus === 'REVOKED'
            ? `Đã thu hồi mã bản quyền ${target.key}.`
            : `Đã kích hoạt lại mã bản quyền ${target.key}.`
        });
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Thao tác thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi đổi trạng thái mã.'
      });
    }
  };

  const handleDeleteLicense = async () => {
    if (!confirmDeleteLicense) return;
    try {
      const res = await fetch('/api/admin/licenses/delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key: confirmDeleteLicense.key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã xóa vĩnh viễn mã bản quyền ${confirmDeleteLicense.key}.`
        });
        setConfirmDeleteLicense(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Xóa mã thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi xóa mã.'
      });
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLicenses = licensesList.filter(lic => {
    const matchesSearch =
      lic.key.toLowerCase().includes(licenseSearchQuery.toLowerCase()) ||
      (lic.assignedEmail && lic.assignedEmail.toLowerCase().includes(licenseSearchQuery.toLowerCase())) ||
      (lic.customerNote && lic.customerNote.toLowerCase().includes(licenseSearchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (licenseFilterStatus === 'ALL') return true;
    return lic.status === licenseFilterStatus;
  });

  // Tính trạng thái của Chương trình miễn phí
  const getFreeAccessBadge = () => {
    if (!settings.freeAccessEnabled) {
      return { text: 'ĐANG TẮT', cls: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
    const now = new Date();
    const start = settings.freeAccessStart ? new Date(settings.freeAccessStart) : null;
    const end = settings.freeAccessEnd ? new Date(settings.freeAccessEnd) : null;

    if (start && now < start) {
      return { text: 'CHƯA BẮT ĐẦU', cls: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (end && now > end) {
      return { text: 'ĐÃ KẾT THÚC', cls: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
    return { text: 'ĐANG HOẠT ĐỘNG', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const freeStatus = getFreeAccessBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold tracking-tight">CỔNG QUẢN TRỊ HỆ THỐNG</h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold">
                  USERS.ROLE = ADMIN
                </span>
              </div>
              <p className="text-[12.5px] text-slate-400">
                Quản lý người dùng, phân quyền sử dụng và thiết lập hệ thống SKKN REVIEW PRO
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAdminModal}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Đóng cổng quản trị"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className={`px-5 py-2.5 text-[13px] font-medium flex items-center justify-between shrink-0 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-xs underline hover:no-underline cursor-pointer ml-3"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Tab Switcher (Đúng 4 tab: TỔNG QUAN, NGƯỜI DÙNG, BẢN QUYỀN & THIẾT BỊ, CẤU HÌNH SỬ DỤNG) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-6 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('overview'); setActionFeedback(null); }}
            className={`pb-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>TỔNG QUAN</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('users'); setActionFeedback(null); }}
            className={`pb-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>NGƯỜI DÙNG ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('licenses'); setActionFeedback(null); }}
            className={`pb-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'licenses'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>BẢN QUYỀN & THIẾT BỊ ({licensesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('settings'); setActionFeedback(null); }}
            className={`pb-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>CẤU HÌNH SỬ DỤNG</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/50">
          {/* ========================================== */}
          {/* TAB 1: TỔNG QUAN (Mục IX) */}
          {/* ========================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Thống kê thực tế */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
                    KHÁCH TRUY CẬP
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {stats?.totalGuests ?? guestsList.length}
                  </span>
                  <span className="text-[11.5px] text-slate-400 mt-0.5 block">Guest sessions</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider block">
                    NGƯỜI DÙNG ĐÃ ĐĂNG KÝ
                  </span>
                  <span className="text-2xl font-black text-blue-950 mt-1 block">
                    {stats?.totalUsers ?? usersList.length}
                  </span>
                  <span className="text-[11.5px] text-slate-400 mt-0.5 block">Tài khoản Google</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[12px] font-bold text-amber-600 uppercase tracking-wider block">
                    ĐANG TRẢI NGHIỆM
                  </span>
                  <span className="text-2xl font-black text-amber-950 mt-1 block">
                    {stats?.trialUsers ?? usersList.filter(u => u.role === 'TRIAL' || u.plan === 'TRIAL').length}
                  </span>
                  <span className="text-[11.5px] text-slate-400 mt-0.5 block">Tài khoản TRIAL</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider block">
                    ĐÃ CẤP QUYỀN
                  </span>
                  <span className="text-2xl font-black text-emerald-950 mt-1 block">
                    {stats?.licensedUsers ?? usersList.filter(u => u.role === 'LICENSED' || u.plan === 'LICENSED' || u.role === 'ADMIN').length}
                  </span>
                  <span className="text-[11.5px] text-slate-400 mt-0.5 block">Không giới hạn</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
                  <span className="text-[12px] font-bold text-purple-600 uppercase tracking-wider block">
                    TỔNG LƯỢT SỬ DỤNG
                  </span>
                  <span className="text-2xl font-black text-purple-950 mt-1 block">
                    {stats?.totalAnalyses ?? 0}
                  </span>
                  <span className="text-[11.5px] text-slate-400 mt-0.5 block">Lượt chấm sáng kiến</span>
                </div>
              </div>

              {/* Trạng thái Kết nối Hệ thống */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-600" />
                  <span>Trạng thái Kết nối Dịch vụ</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-700 block">AI Gemini Thẩm định SKKN</span>
                      <span className="text-[11.5px] text-slate-400">Google GenAI Backend</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {stats?.geminiStatus ?? 'ONLINE'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-700 block">License API / Google Sheets</span>
                      <span className="text-[11.5px] text-slate-400">Apps Script Endpoint</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {stats?.licenseApiStatus ?? 'CONNECTED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: NGƯỜI DÙNG (Mục X & XI) */}
          {/* ========================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Thanh tìm kiếm & Làm mới */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc email giáo viên..."
                    className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddUser}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm người dùng</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchAdminData}
                    disabled={isLoading}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Bảng Danh sách Người dùng */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">NGƯỜI DÙNG</th>
                        <th className="py-3 px-3">VAI TRÒ</th>
                        <th className="py-3 px-3">QUYỀN SỬ DỤNG</th>
                        <th className="py-3 px-3">LƯỢT CÒN LẠI</th>
                        <th className="py-3 px-3">TRẠNG THÁI</th>
                        <th className="py-3 px-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Không tìm thấy tài khoản nào phù hợp
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelf = Boolean(user?.email && u.email.toLowerCase() === user.email.toLowerCase());
                          const isUserAdmin = u.role === 'ADMIN';
                          const isUserLicensed = u.plan === 'LICENSED' || isUserAdmin;
                          const isUserBlocked = u.isBlocked || u.role === 'BLOCKED';

                          return (
                            <tr key={u.id || u.email} className="hover:bg-slate-50/70 transition-colors">
                              {/* Cột 1: NGƯỜI DÙNG */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  {u.picture ? (
                                    <img
                                      src={u.picture}
                                      alt={u.name}
                                      className="w-8 h-8 rounded-full border border-slate-300 object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                      {u.name?.slice(0, 1).toUpperCase() || 'GV'}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                      <span>{u.name || u.email}</span>
                                      {isSelf && (
                                        <span className="text-[10.5px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                                          Bạn
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[12px] text-slate-400 block truncate">{u.email}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Cột 2: VAI TRÒ (ADMIN | USER) */}
                              <td className="py-3 px-3">
                                {isUserAdmin ? (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    ADMIN
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    USER
                                  </span>
                                )}
                              </td>

                              {/* Cột 3: QUYỀN SỬ DỤNG */}
                              <td className="py-3 px-3">
                                {u.freeAccess ? (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                                    Miễn phí theo chương trình
                                  </span>
                                ) : isUserLicensed ? (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Đã cấp quyền
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Trải nghiệm
                                  </span>
                                )}
                              </td>

                              {/* Cột 4: LƯỢT CÒN LẠI */}
                              <td className="py-3 px-3">
                                {u.freeAccess ? (
                                  <span className="text-cyan-700 font-medium">Miễn phí trong chương trình</span>
                                ) : isUserLicensed ? (
                                  <div>
                                    <span className="text-emerald-700 font-bold block">Không giới hạn</span>
                                    {u.licenseExpiresAt && (
                                      <span className="text-[11px] text-slate-400 block">
                                        Đến: {new Date(u.licenseExpiresAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-semibold text-slate-800">
                                    Cơ bản: {u.quota?.easy ?? 0} | Chuyên sâu: {u.quota?.advanced ?? 0}
                                  </span>
                                )}
                              </td>

                              {/* Cột 5: TRẠNG THÁI */}
                              <td className="py-3 px-3">
                                {isUserBlocked ? (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    Tạm khóa
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Hoạt động
                                  </span>
                                )}
                              </td>

                              {/* Cột 6: THAO TÁC */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {isUserBlocked ? (
                                    /* Tài khoản bị khóa: Chỉ hiện Mở khóa */
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBlock(u)}
                                      className="px-2.5 py-1 text-[12px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                      title="Mở khóa tài khoản"
                                    >
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>Mở khóa</span>
                                    </button>
                                  ) : isUserLicensed ? (
                                    /* Tài khoản LICENSED: Chỉnh quyền, Thu hồi quyền, Khóa */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenGrantModal(u)}
                                        className="px-2.5 py-1 text-[12px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                                        title="Chỉnh thời hạn quyền sử dụng"
                                      >
                                        Chỉnh quyền
                                      </button>

                                      {!isSelf && (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmRevokeUser(u)}
                                          className="px-2.5 py-1 text-[12px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                                          title="Thu hồi quyền sử dụng về TRIAL"
                                        >
                                          Thu hồi quyền
                                        </button>
                                      )}

                                      {!isSelf && (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBlock(u)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="Tạm khóa tài khoản"
                                        >
                                          <Lock className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    /* Tài khoản TRIAL: Điều chỉnh lượt, Cấp quyền, Khóa */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenQuotaModal(u)}
                                        className="px-2.5 py-1 text-[12px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                                        title="Điều chỉnh số lượt trải nghiệm"
                                      >
                                        Điều chỉnh lượt
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenGrantModal(u)}
                                        className="px-2.5 py-1 text-[12px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                        title="Cấp quyền không giới hạn"
                                      >
                                        Cấp quyền
                                      </button>

                                      {!isSelf && (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBlock(u)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="Tạm khóa tài khoản"
                                        >
                                          <Lock className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: BẢN QUYỀN & THIẾT BỊ (Mục III & IV) */}
          {/* ========================================== */}
          {activeTab === 'licenses' && (
            <div className="space-y-4">
              {/* Header Tab & Nút Tạo mã */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-4.5 h-4.5 text-purple-600" />
                    <span>BẢN QUYỀN & THIẾT BỊ</span>
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Quản lý mã bản quyền, thiết bị kích hoạt và yêu cầu chuyển thiết bị.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={fetchAdminData}
                    disabled={isLoading}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-300 transition-colors cursor-pointer shrink-0"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateLicenseOpen(true)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ TẠO MÃ BẢN QUYỀN</span>
                  </button>
                </div>
              </div>

              {/* Thanh tìm kiếm & Bộ lọc trạng thái */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={licenseSearchQuery}
                    onChange={(e) => setLicenseSearchQuery(e.target.value)}
                    placeholder="Tìm theo mã bản quyền, email hoặc ghi chú..."
                    className="w-full pl-9 pr-3.5 py-2 text-[13.5px] rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'ALL', label: `Tất cả (${licensesList.length})` },
                    { id: 'UNUSED', label: `Chưa kích hoạt (${licensesList.filter(l => l.status === 'UNUSED').length})` },
                    { id: 'ACTIVE', label: `Đang hoạt động (${licensesList.filter(l => l.status === 'ACTIVE').length})` },
                    { id: 'EXPIRED', label: `Hết hạn (${licensesList.filter(l => l.status === 'EXPIRED').length})` },
                    { id: 'REVOKED', label: `Đã thu hồi (${licensesList.filter(l => l.status === 'REVOKED').length})` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setLicenseFilterStatus(filter.id)}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                        licenseFilterStatus === filter.id
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bảng Mã bản quyền & Thiết bị */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">MÃ BẢN QUYỀN</th>
                        <th className="py-3 px-3">NGƯỜI SỬ DỤNG</th>
                        <th className="py-3 px-3">THIẾT BỊ</th>
                        <th className="py-3 px-3">THỜI HẠN</th>
                        <th className="py-3 px-3">TRẠNG THÁI</th>
                        <th className="py-3 px-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {filteredLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Không có mã bản quyền nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredLicenses.map((lic) => {
                          const boundDevices = lic.boundDevices || [];
                          const maxDev = lic.maxDevices || 1;
                          const isCopied = copiedKey === lic.key;

                          return (
                            <tr key={lic.key} className="hover:bg-slate-50/70 transition-colors">
                              {/* Cột 1: MÃ BẢN QUYỀN */}
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-[13.5px] text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 select-all">
                                      {lic.key}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyKey(lic.key)}
                                      className={`p-1 rounded transition-colors cursor-pointer ${
                                        isCopied
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                      }`}
                                      title={isCopied ? 'Đã sao chép!' : 'Sao chép mã'}
                                    >
                                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                      {lic.plan}
                                    </span>
                                    {lic.customerNote && (
                                      <span className="text-[11.5px] text-slate-500 italic truncate max-w-xs" title={lic.customerNote}>
                                        {lic.customerNote}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Cột 2: NGƯỜI SỬ DỤNG */}
                              <td className="py-3 px-3">
                                {lic.assignedEmail ? (
                                  <div>
                                    <span className="font-semibold text-slate-900 block truncate max-w-[200px]" title={lic.assignedEmail}>
                                      {lic.assignedEmail}
                                    </span>
                                    {lic.activatedAt && (
                                      <span className="text-[11px] text-slate-400 block">
                                        Kích hoạt: {new Date(lic.activatedAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[12.5px]">
                                    Chưa kích hoạt
                                  </span>
                                )}
                              </td>

                              {/* Cột 3: THIẾT BỊ */}
                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[11.5px] font-bold ${
                                      boundDevices.length >= maxDev
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : boundDevices.length > 0
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {boundDevices.length}/{maxDev} thiết bị
                                    </span>

                                    {/* Nút Chuyển thiết bị / Reset thiết bị */}
                                    {boundDevices.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmResetDevicesLicense(lic)}
                                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                                        title="Gỡ liên kết thiết bị để chuyển sang máy mới"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset thiết bị</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Liệt kê tên thiết bị */}
                                  {boundDevices.length > 0 && (
                                    <div className="space-y-0.5 pt-0.5">
                                      {boundDevices.map((dev, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[190px]">
                                          <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate" title={`${dev.deviceName || dev.deviceId}`}>
                                            {dev.deviceName || dev.deviceId}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Cột 4: THỜI HẠN */}
                              <td className="py-3 px-3">
                                {lic.expiresAt ? (
                                  <div className="text-[12.5px] text-slate-700 font-medium">
                                    {new Date(lic.expiresAt).toLocaleDateString('vi-VN')}
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Vĩnh viễn
                                  </span>
                                )}
                              </td>

                              {/* Cột 5: TRẠNG THÁI */}
                              <td className="py-3 px-3">
                                {lic.status === 'ACTIVE' ? (
                                  <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>ACTIVE</span>
                                  </span>
                                ) : lic.status === 'UNUSED' ? (
                                  <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>UNUSED</span>
                                  </span>
                                ) : lic.status === 'EXPIRED' ? (
                                  <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>EXPIRED</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    <span>REVOKED</span>
                                  </span>
                                )}
                              </td>

                              {/* Cột 6: THAO TÁC */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Thu hồi / Kích hoạt lại */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLicenseStatus(lic)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      lic.status === 'REVOKED'
                                        ? 'text-emerald-600 hover:bg-emerald-50'
                                        : 'text-amber-600 hover:bg-amber-50'
                                    }`}
                                    title={lic.status === 'REVOKED' ? 'Kích hoạt lại mã' : 'Thu hồi mã bản quyền'}
                                  >
                                    {lic.status === 'REVOKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                  </button>

                                  {/* Xóa mã */}
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteLicense(lic)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Xóa mã bản quyền"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: CẤU HÌNH SỬ DỤNG (Mục XVII) */}
          {/* ========================================== */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              {/* Sync Status Banner */}
              {settingsSyncStatus && (
                <div className={`p-3 rounded-xl text-[12.5px] border ${
                  settingsSyncStatus.includes('SYNCED')
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  <strong>Trạng thái máy chủ:</strong> {settingsSyncStatus}
                </div>
              )}

              {/* Mục A: KHÁCH CHƯA ĐĂNG NHẬP (GUEST) */}
              <div className="p-4.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-bold text-slate-900">Khách chưa đăng nhập (GUEST)</h4>
                    <p className="text-[12px] text-slate-500">Số lượt trải nghiệm mặc định cho người dùng chưa đăng nhập</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Chế độ Cơ bản:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settings.guestEasyLimit}
                      onChange={(e) => setSettings({ ...settings, guestEasyLimit: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-[14px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Chế độ Chuyên sâu:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settings.guestAdvancedLimit}
                      onChange={(e) => setSettings({ ...settings, guestAdvancedLimit: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-[14px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Mục B: TÀI KHOẢN TRẢI NGHIỆM (TRIAL) */}
              <div className="p-4.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    B
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-bold text-slate-900">Tài khoản trải nghiệm (TRIAL)</h4>
                    <p className="text-[12px] text-slate-500">Hạn mức ban đầu cấp cho tài khoản Google mới đăng ký</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Chế độ Cơ bản:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settings.trialEasyLimit}
                      onChange={(e) => setSettings({ ...settings, trialEasyLimit: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-[14px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Chế độ Chuyên sâu:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settings.trialAdvancedLimit}
                      onChange={(e) => setSettings({ ...settings, trialAdvancedLimit: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-[14px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Mục C: CHƯƠNG TRÌNH MIỄN PHÍ (FREE ACCESS) */}
              <div className="p-4.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                      C
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-bold text-slate-900">Chương trình miễn phí toàn hệ thống</h4>
                      <p className="text-[12px] text-slate-500">Mở quyền không giới hạn cho mọi người dùng trong thời gian sự kiện</p>
                    </div>
                  </div>

                  {/* Trạng thái hiện tại của chương trình */}
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${freeStatus.cls}`}>
                    {freeStatus.text}
                  </span>
                </div>

                {/* BẬT / TẮT Toggle */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.freeAccessEnabled}
                      onChange={(e) => setSettings({ ...settings, freeAccessEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                  <span className="text-[13px] font-bold text-slate-800">
                    {settings.freeAccessEnabled ? 'Kích hoạt chương trình miễn phí' : 'Đang tắt chương trình miễn phí'}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Tên chương trình:
                    </label>
                    <input
                      type="text"
                      value={settings.freeAccessName}
                      onChange={(e) => setSettings({ ...settings, freeAccessName: e.target.value })}
                      placeholder="Ví dụ: Tuần lễ Trải nghiệm Sáng kiến 2025"
                      className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                        Thời gian Bắt đầu:
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.freeAccessStart}
                        onChange={(e) => setSettings({ ...settings, freeAccessStart: e.target.value })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                        Thời gian Kết thúc:
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.freeAccessEnd}
                        onChange={(e) => setSettings({ ...settings, freeAccessEnd: e.target.value })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút LƯU CẤU HÌNH */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[14px] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Đang lưu cấu hình...' : 'LƯU CẤU HÌNH'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Con 1: ĐIỀU CHỈNH LƯỢT TRẢI NGHIỆM (Mục XII) */}
        {quotaModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h4 className="text-[15px] font-bold text-slate-900">ĐIỀU CHỈNH LƯỢT TRẢI NGHIỆM</h4>
                <button
                  type="button"
                  onClick={() => setQuotaModalUser(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px]">
                  <span className="text-slate-500 block">Tài khoản:</span>
                  <strong className="text-slate-900 block truncate">{quotaModalUser.name || quotaModalUser.email}</strong>
                  <span className="text-slate-400 block truncate">{quotaModalUser.email}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Chế độ Cơ bản:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuotaEasyInput(Math.max(0, quotaEasyInput - 1))}
                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-lg flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={quotaEasyInput}
                        onChange={(e) => setQuotaEasyInput(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 text-center py-2 text-[16px] font-bold rounded-lg border border-slate-300 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setQuotaEasyInput(quotaEasyInput + 1)}
                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-lg flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Chế độ Chuyên sâu:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuotaAdvancedInput(Math.max(0, quotaAdvancedInput - 1))}
                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-lg flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={quotaAdvancedInput}
                        onChange={(e) => setQuotaAdvancedInput(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 text-center py-2 text-[16px] font-bold rounded-lg border border-slate-300 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setQuotaAdvancedInput(quotaAdvancedInput + 1)}
                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-lg flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuotaModalUser(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuota}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    LƯU THAY ĐỔI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Con 2: CẤP QUYỀN SỬ DỤNG (Mục XIII) */}
        {grantModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h4 className="text-[15px] font-bold text-slate-900">CẤP QUYỀN SỬ DỤNG</h4>
                <button
                  type="button"
                  onClick={() => setGrantModalUser(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px]">
                  <span className="text-slate-500 block">Tài khoản được cấp quyền:</span>
                  <strong className="text-slate-900 block truncate">{grantModalUser.name || grantModalUser.email}</strong>
                  <span className="text-slate-400 block truncate">{grantModalUser.email}</span>
                </div>

                <div className="space-y-3">
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Thời hạn quyền sử dụng:
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="grantDuration"
                      checked={!grantHasExpiry}
                      onChange={() => setGrantHasExpiry(false)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="text-[13px] font-bold text-slate-800 block">Không giới hạn – Không thời hạn</span>
                      <span className="text-[11.5px] text-slate-500">Hiệu lực vĩnh viễn cho tài khoản</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="grantDuration"
                      checked={grantHasExpiry}
                      onChange={() => setGrantHasExpiry(true)}
                      className="w-4 h-4 text-purple-600 mt-1"
                    />
                    <div className="flex-1">
                      <span className="text-[13px] font-bold text-slate-800 block">Không giới hạn đến ngày:</span>
                      {grantHasExpiry && (
                        <input
                          type="date"
                          value={grantExpiryDate}
                          onChange={(e) => setGrantExpiryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-2 w-full px-2.5 py-1.5 text-[13px] rounded-lg border border-slate-300 font-semibold text-slate-900"
                        />
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGrantModalUser(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGrant}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    LƯU QUYỀN SỬ DỤNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Con 3: Xác nhận Thu hồi quyền (Mục XIV) */}
        {confirmRevokeUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">Thu hồi quyền sử dụng?</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Thu hồi quyền sử dụng của tài khoản <strong>{confirmRevokeUser.email}</strong>? Tài khoản sẽ chuyển về Gói trải nghiệm (TRIAL).
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmRevokeUser(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRevoke}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Xác nhận thu hồi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Con 4: Xác nhận Tạm khóa tài khoản (Mục XV) */}
        {confirmBlockUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">Tạm khóa tài khoản?</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Tạm khóa tài khoản <strong>{confirmBlockUser.email}</strong>? Người dùng sẽ không thể sử dụng hệ thống cho đến khi được mở khóa.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmBlockUser(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBlock}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Xác nhận khóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Con 4B: THÊM NGƯỜI DÙNG MỚI */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <h4 className="text-[15px] font-bold">THÊM NGƯỜI DÙNG HỆ THỐNG</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                {/* Email người dùng */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Địa chỉ Email Google <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="vidu: giaovien@gmail.com"
                    className="w-full px-3.5 py-2 text-[13.5px] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900"
                  />
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Người dùng đăng nhập bằng Gmail này sẽ được nhận quyền ngay lập tức.
                  </p>
                </div>

                {/* Tên người dùng */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Họ và tên (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2 text-[13.5px] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900"
                  />
                </div>

                {/* Loại tài khoản */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Quyền hạn cấp trước:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewUserPlan('TRIAL')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        newUserPlan === 'TRIAL'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[13px]">Gói Trải nghiệm</div>
                      <div className="text-[11.5px] text-slate-500">Giới hạn số lượt</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserPlan('LICENSED')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        newUserPlan === 'LICENSED'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[13px]">Đã cấp quyền</div>
                      <div className="text-[11.5px] text-slate-500">Không giới hạn</div>
                    </button>
                  </div>
                </div>

                {/* Nếu chọn TRIAL: Cho cấu hình số lượt ban đầu */}
                {newUserPlan === 'TRIAL' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="text-[12px] font-bold text-slate-700">Số lượt ban đầu:</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11.5px] text-slate-500 mb-1">Cơ bản:</label>
                        <input
                          type="number"
                          min={0}
                          value={newUserEasyQuota}
                          onChange={(e) => setNewUserEasyQuota(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-[13px] font-bold rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] text-slate-500 mb-1">Chuyên sâu:</label>
                        <input
                          type="number"
                          min={0}
                          value={newUserAdvancedQuota}
                          onChange={(e) => setNewUserAdvancedQuota(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-[13px] font-bold rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Nếu chọn LICENSED: Tùy chọn thời hạn */}
                {newUserPlan === 'LICENSED' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="text-[12px] font-bold text-slate-700">Thời hạn sử dụng:</div>
                    <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUserHasExpiry}
                        onChange={(e) => setNewUserHasExpiry(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>Có giới hạn ngày hết hạn</span>
                    </label>
                    {newUserHasExpiry && (
                      <input
                        type="date"
                        value={newUserExpiryDate}
                        onChange={(e) => setNewUserExpiryDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-[13px] rounded-lg border border-slate-300 text-slate-900"
                      />
                    )}
                  </div>
                )}

                {/* Nút submit */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingUser ? 'Đang thêm...' : 'THÊM NGƯỜI DÙNG'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Con 5: TẠO MÃ BẢN QUYỀN MỚI */}
        {isCreateLicenseOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Key className="w-4.5 h-4.5 text-purple-400" />
                  <h4 className="text-[15px] font-bold">TẠO MÃ BẢN QUYỀN MỚI</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateLicenseOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLicense} className="p-5 space-y-4">
                {/* Gói bản quyền */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Gói bản quyền:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatePlan('PRO');
                        if (createMaxDevices === 5) setCreateMaxDevices(1);
                      }}
                      className={`p-2.5 rounded-xl border text-[13px] font-bold transition-all text-left cursor-pointer ${
                        createPlan === 'PRO'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>PRO (Cá nhân)</span>
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Dành cho giáo viên</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatePlan('SCHOOL');
                        setCreateMaxDevices(5);
                      }}
                      className={`p-2.5 rounded-xl border text-[13px] font-bold transition-all text-left cursor-pointer ${
                        createPlan === 'SCHOOL'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>SCHOOL (Trường học)</span>
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Dành cho tổ bộ môn</span>
                    </button>
                  </div>
                </div>

                {/* Thời hạn */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Thời hạn hiệu lực:
                  </label>
                  <select
                    value={createDurationMonths}
                    onChange={(e) => setCreateDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-[13.5px] font-medium bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-900"
                  >
                    <option value={0}>Vĩnh viễn (Không thời hạn)</option>
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>1 năm (12 tháng)</option>
                  </select>
                </div>

                {/* Số thiết bị cho phép */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Số thiết bị kích hoạt tối đa:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCreateMaxDevices(num)}
                        className={`flex-1 py-1.5 text-[12.5px] font-bold rounded-lg border transition-colors cursor-pointer ${
                          createMaxDevices === num
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {num} máy
                      </button>
                    ))}
                  </div>
                  <p className="text-[11.5px] text-slate-500 mt-1">
                    Khách hàng kích hoạt trên máy mới vượt quá hạn mức sẽ cần Quản trị viên hỗ trợ Reset Thiết bị.
                  </p>
                </div>

                {/* Ghi chú khách hàng / Người mua */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Ghi chú khách hàng / Người mua:
                  </label>
                  <input
                    type="text"
                    value={createCustomerNote}
                    onChange={(e) => setCreateCustomerNote(e.target.value)}
                    placeholder="Ví dụ: Thầy Hoàng (THPT Chuyên), Cô Lan..."
                    className="w-full px-3 py-2 text-[13px] bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-900"
                  />
                </div>

                {/* Gán trước cho Google Account (tùy chọn) */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Gán trước cho Google Account (Tùy chọn):
                  </label>
                  <input
                    type="email"
                    value={createAssignedEmail}
                    onChange={(e) => setCreateAssignedEmail(e.target.value)}
                    placeholder="De trong neu chua ro email nguoi mua"
                    className="w-full px-3 py-2 text-[13px] bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-900"
                  />
                  <p className="text-[11.5px] text-slate-500 mt-1">
                    Nếu để trống, mã sẽ ở trạng thái UNUSED và tự động gắn với tài khoản Google của người kích hoạt đầu tiên.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateLicenseOpen(false)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLicense}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isSubmittingLicense ? 'Đang tạo...' : 'Tạo mã ngay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Con 6: Xác nhận Reset Thiết bị (Chuyển thiết bị) */}
        {confirmResetDevicesLicense && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">Reset Thiết bị (Chuyển máy)?</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Xóa toàn bộ thiết bị đang liên kết với mã <strong className="font-mono text-purple-900">{confirmResetDevicesLicense.key}</strong>?
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 text-left">
                  <span>Thiết bị đang gắn ({confirmResetDevicesLicense.boundDevices?.length || 0}):</span>
                  <div className="font-semibold text-slate-800 mt-0.5 truncate">
                    {confirmResetDevicesLicense.boundDevices?.map(d => d.deviceName || d.deviceId).join(', ') || 'Chưa có'}
                  </div>
                </div>
                <p className="text-[12px] text-blue-700">
                  Sau khi gỡ, người dùng có thể mở máy tính mới và kích hoạt thành công.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmResetDevicesLicense(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDevices}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Xác nhận gỡ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Con 7: Xác nhận Xóa mã bản quyền */}
        {confirmDeleteLicense && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">Xóa vĩnh viễn mã bản quyền?</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Xóa vĩnh viễn mã <strong className="font-mono text-purple-900">{confirmDeleteLicense.key}</strong>? Hành động này không thể hoàn tác.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteLicense(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteLicense}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Admin Portal */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-[12.5px] text-slate-500 shrink-0">
          <span>Hệ thống Quản trị SKKN REVIEW PRO</span>
          <button
            type="button"
            onClick={closeAdminModal}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] transition-colors cursor-pointer"
          >
            Đóng cổng quản trị
          </button>
        </div>
      </div>
    </div>
  );
};
