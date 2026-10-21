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
  RotateCcw,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Code,
  ArrowLeft,
  Database,
  Sparkles,
  Pencil,
  Eye,
  Mail,
  User as UserIcon,
  CalendarPlus,
  AlertCircle,
  CalendarRange
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAccount, GuestSession, SystemStats, SystemSettings, UserRole, LicensePlan, LicenseItem, LicenseStatus } from '../types';
import codeGsSource from '../../scripts/Code.gs?raw';

// Thuật toán cộng tháng theo lịch chuẩn xác (xử lý ngày 28/29/30/31 và năm nhuận)
export function addCalendarMonths(startDateStr: string, months: number): string {
  if (!startDateStr || months <= 0) return startDateStr;
  const parts = startDateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1; // 0-indexed
  const day = parts[2];

  const totalMonths = year * 12 + month + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;

  // Số ngày tối đa của tháng đích
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(day, maxDays);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}`;
}

export function formatCalendarDate(isoOrDateStr?: string | null): string {
  if (!isoOrDateStr) return 'Vĩnh viễn';
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return isoOrDateStr;
  }
}

export const AdminPortalModal: React.FC = () => {
  const { isAdminModalOpen, closeAdminModal, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'licenses' | 'settings' | 'sheets'>('overview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && (window.location.pathname === '/quan-tri' || window.location.pathname.startsWith('/quan-tri'));
  });
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [syncConflicts, setSyncConflicts] = useState<Array<{
    email: string;
    name: string;
    field: string;
    localValue: string;
    remoteValue: string;
  }> | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserAccount | null>(null);
  const [copiedCodeGs, setCopiedCodeGs] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<{ loading: boolean; message?: string; error?: boolean } | null>(null);
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
  const [grantModalTitle, setGrantModalTitle] = useState<string>('CẤP QUYỀN SỬ DỤNG PRO');
  const [grantType, setGrantType] = useState<'MONTHLY' | 'LIFETIME'>('MONTHLY');
  const [grantMonths, setGrantMonths] = useState<number>(1);
  const [grantStartDate, setGrantStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [grantExtendMode, setGrantExtendMode] = useState<'EXTEND_FROM_CURRENT' | 'RESET_FROM_START'>('EXTEND_FROM_CURRENT');
  const [grantStep, setGrantStep] = useState<'FORM' | 'CONFIRM'>('FORM');
  const [isSubmittingGrant, setIsSubmittingGrant] = useState<boolean>(false);

  const [confirmRevokeUser, setConfirmRevokeUser] = useState<UserAccount | null>(null);
  const [confirmBlockUser, setConfirmBlockUser] = useState<UserAccount | null>(null);

  // Modal chỉnh sửa người dùng toàn diện
  const [editModalUser, setEditModalUser] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('TRIAL');
  const [editPlan, setEditPlan] = useState<'TRIAL' | 'PRO'>('TRIAL');
  const [editHasExpiry, setEditHasExpiry] = useState(false);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editEasyQuota, setEditEasyQuota] = useState<number>(3);
  const [editAdvancedQuota, setEditAdvancedQuota] = useState<number>(1);
  const [editIsBlocked, setEditIsBlocked] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Modal xem chi tiết người dùng
  const [detailModalUser, setDetailModalUser] = useState<UserAccount | null>(null);

  // Modal thêm người dùng mới
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<'TRIAL' | 'LICENSED' | 'PRO'>('TRIAL');
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

  const safeJson = async (res: Response | null) => {
    if (!res) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return null;
    }
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const getAuthHeaders = () => {
    const sessionToken = (user as any)?.sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_session_token') : '') || '';
    const googleCredential = (user as any)?.googleCredential || (typeof localStorage !== 'undefined' ? localStorage.getItem('skkn_google_credential') : '') || '';
    const token = sessionToken || googleCredential;
    let email = user?.email || '';
    let id = user?.id || '';
    if (!email && typeof localStorage !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('skkn_user') || '{}');
        if (cached.email) email = cached.email;
        if (cached.id) id = cached.id;
      } catch {}
    }
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
      ...(googleCredential ? { 'x-google-credential': googleCredential } : {}),
      ...(email ? { 'x-user-email': email } : {}),
      ...(id ? { 'x-user-id': id } : {})
    };
  };

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

      if (statsRes?.status === 403 || usersRes?.status === 403) {
        setActionFeedback({
          type: 'error',
          text: 'Truy cập Cổng Quản trị bị từ chối: Yêu cầu đăng nhập với tài khoản Quản trị viên (ROLE = ADMIN).'
        });
        return;
      }

      if (statsRes && statsRes.ok) {
        const s = await safeJson(statsRes);
        if (s) setStats(s);
      }
      if (usersRes && usersRes.ok) {
        const u = await safeJson(usersRes);
        if (u) {
          setUsersList(u.users || []);
          setGuestsList(u.guests || []);
        }
      }
      if (settingsRes && settingsRes.ok) {
        const setJson = await safeJson(settingsRes);
        if (setJson?.settings) {
          setSettings(setJson.settings);
        }
      }
      if (licensesRes && licensesRes.ok) {
        const licJson = await safeJson(licensesRes);
        if (licJson?.licenses) {
          setLicensesList(licJson.licenses || []);
        }
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

  const isQuanTriRoute = typeof window !== 'undefined' && 
    (window.location.pathname === '/quan-tri' || window.location.pathname.startsWith('/quan-tri'));
  const isVisible = isAdminModalOpen || isQuanTriRoute;

  const handleBackToSKKN = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    closeAdminModal();
  };

  useEffect(() => {
    if (isVisible) {
      fetchAdminData();
    }
  }, [isVisible]);

  if (!isVisible) return null;

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
      const data = (await safeJson(res)) || {};
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

  // 1B. Thao tác Chỉnh sửa thông tin toàn diện (Họ tên, Email, Gói, Hạn mức, Trạng thái)
  const handleOpenEditModal = (target: UserAccount) => {
    setEditModalUser(target);
    setEditName(target.name || '');
    setEditEmail(target.email);
    setEditRole(target.role);
    const isPro = target.plan === 'PRO' || target.role === 'LICENSED' || target.plan === 'PREMIUM' || target.plan === 'SCHOOL' || target.quota?.easy === -1;
    setEditPlan(isPro ? 'PRO' : 'TRIAL');
    setEditHasExpiry(Boolean(target.licenseExpiresAt));
    setEditExpiryDate(target.licenseExpiresAt ? target.licenseExpiresAt.split('T')[0] : '');
    setEditEasyQuota(target.quota?.easy === -1 ? (settings.trialEasyLimit ?? 3) : (target.quota?.easy ?? 3));
    setEditAdvancedQuota(target.quota?.advanced === -1 ? (settings.trialAdvancedLimit ?? 1) : (target.quota?.advanced ?? 1));
    setEditIsBlocked(Boolean(target.isBlocked || target.role === 'BLOCKED'));
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setIsSubmittingEdit(true);
    setActionFeedback(null);
    try {
      const cleanNewEmail = editEmail.trim().toLowerCase();
      const isEmailChanged = cleanNewEmail !== editModalUser.email.toLowerCase();
      const initialIsPro = editModalUser.plan === 'PRO' || editModalUser.role === 'LICENSED' || editModalUser.quota?.easy === -1;
      const isPro = editPlan === 'PRO';
      const isPlanChanged = isPro !== initialIsPro;

      const initialEasy = editModalUser.quota?.easy === -1 ? (settings.trialEasyLimit ?? 3) : (editModalUser.quota?.easy ?? 3);
      const initialAdv = editModalUser.quota?.advanced === -1 ? (settings.trialAdvancedLimit ?? 1) : (editModalUser.quota?.advanced ?? 1);
      const isQuotaChanged = !isPro && (editEasyQuota !== initialEasy || editAdvancedQuota !== initialAdv);

      const initialBlocked = Boolean(editModalUser.isBlocked || editModalUser.role === 'BLOCKED');
      const isBlockedChanged = editIsBlocked !== initialBlocked;

      const initialExpiry = editModalUser.licenseExpiresAt ? editModalUser.licenseExpiresAt.split('T')[0] : '';
      const isExpiryChanged = (editHasExpiry ? editExpiryDate : '') !== initialExpiry;

      const payload: any = {
        email: editModalUser.email,
      };

      if (isEmailChanged) {
        payload.newEmail = cleanNewEmail;
      }
      if (editName.trim() !== (editModalUser.name || '').trim()) {
        payload.name = editName.trim();
      }
      if (isPlanChanged) {
        payload.plan = isPro ? 'PRO' : 'TRIAL';
        payload.role = editModalUser.role === 'ADMIN' ? 'ADMIN' : (isPro ? 'LICENSED' : 'TRIAL');
      }
      if (isQuotaChanged) {
        payload.quota = {
          easy: Math.max(0, editEasyQuota),
          advanced: Math.max(0, editAdvancedQuota),
        };
      }
      if (isBlockedChanged) {
        payload.isBlocked = editIsBlocked;
      }
      if (isExpiryChanged) {
        payload.expiresAt = isPro && editHasExpiry && editExpiryDate ? new Date(editExpiryDate).toISOString() : null;
      }

      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = (await safeJson(res)) || {};
      if (res.ok && data.success && data.sheetSynced !== false) {
        setActionFeedback({
          type: 'success',
          text: data.message || `Đã cập nhật thông tin tài khoản ${cleanNewEmail} thành công.`,
        });
        setEditModalUser(null);
        await fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || data.warning || 'Cập nhật tài khoản thất bại lên Google Sheets.',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi cập nhật tài khoản. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 1C. Thao tác Xem chi tiết người dùng
  const handleOpenDetailModal = (target: UserAccount) => {
    setDetailModalUser(target);
  };

  // 2. Thao tác Cấp quyền & Gia hạn thành viên PRO
  const targetCurrentExpiry = grantModalUser?.licenseExpiresAt ? grantModalUser.licenseExpiresAt.split('T')[0] : '';
  const isTargetCurrentExpired = Boolean(
    grantModalUser?.licenseExpiresAt &&
    new Date(grantModalUser.licenseExpiresAt).getTime() < Date.now()
  );
  const isTargetCurrentActive = Boolean(
    grantModalUser?.licenseExpiresAt && !isTargetCurrentExpired
  );

  const targetExpiryLabel = !grantModalUser
    ? ''
    : !grantModalUser.licenseExpiresAt
    ? (grantModalUser.plan === 'PRO' || grantModalUser.role === 'LICENSED' || grantModalUser.quota?.easy === -1 ? 'PRO Vĩnh viễn (Không thời hạn)' : 'Chưa có (Gói Trial)')
    : isTargetCurrentExpired
    ? `Đã hết hạn (${formatCalendarDate(grantModalUser.licenseExpiresAt)})`
    : `Còn hạn đến ${formatCalendarDate(grantModalUser.licenseExpiresAt)}`;

  let effectiveBaseDate = grantStartDate || new Date().toISOString().split('T')[0];
  if (grantType === 'MONTHLY' && isTargetCurrentActive && grantExtendMode === 'EXTEND_FROM_CURRENT') {
    effectiveBaseDate = targetCurrentExpiry;
  }

  const computedExpiryDateStr = grantType === 'LIFETIME'
    ? null
    : addCalendarMonths(effectiveBaseDate, grantMonths);

  const handleOpenGrantModal = (target: UserAccount, modeType: 'GRANT' | 'EXTEND' | 'EDIT' = 'GRANT') => {
    setGrantModalUser(target);
    setGrantStep('FORM');
    setIsSubmittingGrant(false);

    const isTargetPro = target.plan === 'PRO' || target.role === 'LICENSED' || target.quota?.easy === -1;
    const hasExpiry = Boolean(target.licenseExpiresAt);
    const isTargetExpired = hasExpiry ? (new Date(target.licenseExpiresAt!).getTime() < Date.now()) : false;
    const todayStr = new Date().toISOString().split('T')[0];

    setGrantStartDate(todayStr);

    if (modeType === 'EXTEND') {
      setGrantModalTitle('GIA HẠN THÀNH VIÊN PRO');
      setGrantType('MONTHLY');
      setGrantMonths(1);
      setGrantExtendMode(hasExpiry && !isTargetExpired ? 'EXTEND_FROM_CURRENT' : 'RESET_FROM_START');
    } else if (isTargetPro) {
      setGrantModalTitle('CHỈNH QUYỀN & THỜI HẠN PRO');
      if (!hasExpiry) {
        setGrantType('LIFETIME');
        setGrantMonths(1);
        setGrantExtendMode('RESET_FROM_START');
      } else {
        setGrantType('MONTHLY');
        setGrantMonths(1);
        setGrantExtendMode(isTargetExpired ? 'RESET_FROM_START' : 'EXTEND_FROM_CURRENT');
      }
    } else {
      setGrantModalTitle('CẤP QUYỀN THÀNH VIÊN PRO');
      setGrantType('MONTHLY');
      setGrantMonths(1);
      setGrantExtendMode('RESET_FROM_START');
    }
  };

  const handleSaveGrant = async () => {
    if (!grantModalUser) return;
    setIsSubmittingGrant(true);
    try {
      let expiresAt: string | null = null;
      if (grantType === 'MONTHLY' && computedExpiryDateStr) {
        // Build end-of-day ISO string (23:59:59.999 in local timezone)
        const [y, m, d] = computedExpiryDateStr.split('-').map(Number);
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        expiresAt = endOfDay.toISOString();
      }

      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: grantModalUser.email,
          plan: 'PRO',
          role: 'LICENSED',
          expiresAt
        })
      });
      const data = (await safeJson(res)) || {};
      if (res.ok && data.success) {
        const expiryLabel = expiresAt ? `đến ngày ${new Date(expiresAt).toLocaleDateString('vi-VN')}` : 'Vĩnh viễn';
        setActionFeedback({
          type: 'success',
          text: `Đã cập nhật quyền thành viên PRO cho tài khoản ${grantModalUser.email} (${expiryLabel}).`
        });
        setGrantModalUser(null);
        setGrantStep('FORM');
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
    } finally {
      setIsSubmittingGrant(false);
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
      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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

      const isGrantingPro = newUserPlan === 'LICENSED' || newUserPlan === 'PRO';
      const quota = isGrantingPro
        ? { easy: -1, advanced: -1 }
        : {
            easy: Math.max(0, newUserEasyQuota || 3),
            advanced: Math.max(0, newUserAdvancedQuota || 1)
          };

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: cleanEmail,
          name: newUserName.trim() || undefined,
          plan: isGrantingPro ? 'PRO' : 'TRIAL',
          role: isGrantingPro ? 'LICENSED' : 'TRIAL',
          quota,
          expiresAt,
        })
      });

      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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
      const data = (await safeJson(res)) || {};
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

  // 7. Thao tác Đồng bộ 2 chiều với Google Sheets
  const handleSyncGoogleSheets = async (resolveStrategy?: 'keep_remote' | 'keep_local') => {
    setIsSyncingSheet(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/sync-sheet', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(resolveStrategy ? { resolveStrategy, confirmConflicts: true } : {})
      });
      const data = (await safeJson(res)) || {};
      if (res.ok && data.success) {
        if (data.hasConflicts && data.conflicts && data.conflicts.length > 0) {
          setSyncConflicts(data.conflicts);
          setActionFeedback({
            type: 'error',
            text: `Phát hiện ${data.conflicts.length} xung đột dữ liệu giữa Web App và Google Sheets. Vui lòng xem bảng đối chiếu và chọn phương án xử lý.`
          });
          return;
        }

        setSyncConflicts(null);
        setActionFeedback({
          type: 'success',
          text: data.message || `Đã hoàn tất đồng bộ với Google Sheets! Cập nhật ${data.syncedToRemoteCount || data.localUsersCount} tài khoản.`
        });
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Đồng bộ Google Sheets thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi đồng bộ với Google Sheets.'
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // 8. Thao tác Xóa người dùng (không xóa ROOT ADMIN)
  const handleExecuteDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: confirmDeleteUser.email })
      });
      const data = (await safeJson(res)) || {};
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Đã xóa tài khoản ${confirmDeleteUser.email} khỏi hệ thống.`
        });
        setConfirmDeleteUser(null);
        fetchAdminData();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Xóa người dùng thất bại.'
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        text: 'Lỗi kết nối khi xóa người dùng.'
      });
    }
  };

  // 9. Thao tác Xuất danh sách người dùng ra CSV
  const handleExportUsersCsv = () => {
    const headers = ['Email', 'Họ và tên', 'Vai trò', 'Gói', 'Lượt Cơ bản', 'Lượt Chuyên sâu', 'Mã bản quyền', 'Hạn sử dụng', 'Trạng thái', 'Ngày tạo'];
    const rows = usersList.map(u => [
      u.email,
      u.name || '',
      u.role,
      u.plan,
      u.quota?.easy ?? 0,
      u.quota?.advanced ?? 0,
      u.licenseKey || '',
      u.licenseExpiresAt || 'Vĩnh viễn',
      u.isBlocked ? 'Tạm khóa' : 'Hoạt động',
      u.createdAt || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skkn_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 10. Ping kiểm tra Google Apps Script Endpoint
  const handlePingGoogleSheets = async () => {
    setPingStatus({ loading: true });
    try {
      const res = await fetch('/api/auth/config');
      const cfg = await res.json().catch(() => ({}));
      if (!cfg.hasLicenseApi) {
        setPingStatus({
          loading: false,
          error: true,
          message: 'Biến môi trường LICENSE_API_URL chưa được cấu hình trong .env.'
        });
        return;
      }
      const syncRes = await fetch('/api/admin/sync-sheet', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await syncRes.json().catch(() => ({}));
      if (syncRes.ok && data.success) {
        setPingStatus({
          loading: false,
          error: false,
          message: `Kết nối thành công! Google Apps Script hoạt động tốt (${data.remoteUsersCount ?? 0} tài khoản từ Google Sheets).`
        });
      } else {
        setPingStatus({
          loading: false,
          error: true,
          message: data.message || 'Không thể kết nối tới Google Apps Script.'
        });
      }
    } catch (e: any) {
      setPingStatus({
        loading: false,
        error: true,
        message: 'Lỗi kiểm tra kết nối: ' + e.message
      });
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      !searchQuery.trim() ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      Boolean(u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    if (!matchesSearch) return false;

    if (userRoleFilter === 'ALL') return true;
    if (userRoleFilter === 'ADMIN') return u.role === 'ADMIN';

    const isLicensed =
      u.role === 'LICENSED' ||
      u.plan === 'PRO' ||
      u.plan === 'PREMIUM' ||
      u.plan === 'SCHOOL' ||
      u.plan === 'LICENSED' ||
      u.quota?.easy === -1;

    if (userRoleFilter === 'LICENSED') return isLicensed;

    if (userRoleFilter === 'PRO_PERMANENT') {
      return isLicensed && !u.licenseExpiresAt;
    }

    if (userRoleFilter === 'PRO_ACTIVE') {
      return isLicensed && Boolean(u.licenseExpiresAt && new Date(u.licenseExpiresAt).getTime() >= Date.now());
    }

    if (userRoleFilter === 'PRO_EXPIRING') {
      if (!isLicensed || !u.licenseExpiresAt) return false;
      const t = new Date(u.licenseExpiresAt).getTime();
      const d = Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
      return t >= Date.now() && d <= 30;
    }

    if (userRoleFilter === 'PRO_EXPIRED') {
      return isLicensed && Boolean(u.licenseExpiresAt && new Date(u.licenseExpiresAt).getTime() < Date.now());
    }

    if (userRoleFilter === 'TRIAL') {
      return (u.role === 'TRIAL' || u.plan === 'TRIAL') &&
        u.role !== 'ADMIN' &&
        u.plan !== 'PRO' &&
        u.plan !== 'PREMIUM' &&
        u.plan !== 'SCHOOL' &&
        u.role !== 'LICENSED' &&
        u.quota?.easy !== -1;
    }

    if (userRoleFilter === 'BLOCKED') return Boolean(u.isBlocked || u.role === 'BLOCKED');
    return true;
  });

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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans select-none text-slate-800">
      
      {/* 1. Header Trang Quản Trị Độc Lập */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm shrink-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          {/* Trái: Icon, Tiêu đề, Tên hệ thống, Role badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  CỔNG QUẢN TRỊ HỆ THỐNG
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/25 text-purple-200 border border-purple-400/30">
                  SKKN REVIEW PRO
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  USERS.ROLE = ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
                Quản lý người dùng, phân quyền sử dụng và đồng bộ dữ liệu Google Sheets USERS
              </p>
            </div>
          </div>

          {/* Phải: Admin info, Đồng bộ Google Sheets, Quay lại SKKN */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Thông tin Admin đang đăng nhập */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/60 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  {user.name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="text-left leading-tight">
                  <div className="font-semibold text-slate-200 truncate max-w-[130px]">
                    {user.name || 'Quản trị viên'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Nút Đồng bộ Google Sheets */}
            <button
              type="button"
              onClick={() => handleSyncGoogleSheets()}
              disabled={isSyncingSheet}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-[13px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Đồng bộ 2 chiều dữ liệu người dùng với Google Sheets USERS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncingSheet ? 'Đang đồng bộ...' : 'Đồng bộ Google Sheets'}</span>
              <span className="sm:hidden">Đồng bộ</span>
            </button>

            {/* Nút Quay lại SKKN */}
            <button
              type="button"
              onClick={handleBackToSKKN}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Quay lại giao diện thẩm định SKKN"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400" />
              <span>Quay lại SKKN</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Thanh Tabs Ngang (5 khu vực) */}
      <nav className="sticky top-14 sm:top-16 z-30 bg-white border-b border-slate-200 shadow-2xs shrink-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => { setActiveTab('overview'); setActionFeedback(null); }}
              className={`py-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
              className={`py-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
              className={`py-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
              className={`py-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'settings'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>CẤU HÌNH SỬ DỤNG</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('sheets'); setActionFeedback(null); }}
              className={`py-3 text-[14px] font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'sheets'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>GOOGLE SHEETS & APPS SCRIPT</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                v2.5
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* 3. Khu vực Nội dung chính (Natural vertical scrolling) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className={`mb-6 p-4 rounded-xl text-[13px] font-medium flex items-center justify-between shadow-2xs ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 ml-3">
              {actionFeedback.type === 'error' && (
                <button
                  type="button"
                  onClick={() => fetchAdminData()}
                  className="text-xs font-bold underline hover:no-underline cursor-pointer text-rose-800"
                >
                  Thử lại
                </button>
              )}
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-xs underline hover:no-underline cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
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
                    {stats?.licensedUsers ?? usersList.filter(u => u.role === 'LICENSED' || u.plan === 'PRO' || u.plan === 'PREMIUM' || u.plan === 'SCHOOL' || u.plan === 'LICENSED' || u.role === 'ADMIN' || u.quota?.easy === -1).length}
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
                    onClick={handleExportUsersCsv}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Xuất danh sách người dùng ra CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Xuất CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchAdminData}
                    disabled={isLoading}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Bộ lọc nhanh vai trò & thời hạn */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(() => {
                  const nowMs = Date.now();
                  const countAll = usersList.length;
                  const countProPerm = usersList.filter(u => {
                    const isLic = u.role === 'LICENSED' || u.plan === 'PRO' || u.plan === 'PREMIUM' || u.plan === 'SCHOOL' || u.quota?.easy === -1;
                    return isLic && !u.licenseExpiresAt;
                  }).length;
                  const countProActive = usersList.filter(u => {
                    const isLic = u.role === 'LICENSED' || u.plan === 'PRO' || u.plan === 'PREMIUM' || u.plan === 'SCHOOL' || u.quota?.easy === -1;
                    return isLic && u.licenseExpiresAt && new Date(u.licenseExpiresAt).getTime() >= nowMs;
                  }).length;
                  const countProExpiring = usersList.filter(u => {
                    const isLic = u.role === 'LICENSED' || u.plan === 'PRO' || u.plan === 'PREMIUM' || u.plan === 'SCHOOL' || u.quota?.easy === -1;
                    if (!isLic || !u.licenseExpiresAt) return false;
                    const t = new Date(u.licenseExpiresAt).getTime();
                    const d = Math.ceil((t - nowMs) / (1000 * 60 * 60 * 24));
                    return t >= nowMs && d <= 30;
                  }).length;
                  const countProExpired = usersList.filter(u => {
                    const isLic = u.role === 'LICENSED' || u.plan === 'PRO' || u.plan === 'PREMIUM' || u.plan === 'SCHOOL' || u.quota?.easy === -1;
                    return isLic && u.licenseExpiresAt && new Date(u.licenseExpiresAt).getTime() < nowMs;
                  }).length;
                  const countTrial = usersList.filter(u => (u.role === 'TRIAL' || u.plan === 'TRIAL') && u.role !== 'ADMIN' && u.plan !== 'PRO' && u.plan !== 'PREMIUM' && u.plan !== 'SCHOOL' && u.role !== 'LICENSED' && u.quota?.easy !== -1).length;
                  const countBlocked = usersList.filter(u => u.isBlocked || u.role === 'BLOCKED').length;

                  const filterTabs = [
                    { id: 'ALL', label: `Tất cả (${countAll})` },
                    { id: 'PRO_PERMANENT', label: `PRO Vĩnh viễn (${countProPerm})` },
                    { id: 'PRO_ACTIVE', label: `PRO Còn hạn (${countProActive})` },
                    { id: 'PRO_EXPIRING', label: `Sắp hết hạn (${countProExpiring})` },
                    { id: 'PRO_EXPIRED', label: `Đã hết hạn (${countProExpired})` },
                    { id: 'TRIAL', label: `Dùng thử (${countTrial})` },
                    { id: 'BLOCKED', label: `Đã khóa (${countBlocked})` },
                  ];

                  return filterTabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setUserRoleFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        userRoleFilter === tab.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ));
                })()}
              </div>

              {/* Bảng Danh sách Người dùng */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">NGƯỜI DÙNG</th>
                        <th className="py-3 px-3">VAI TRÒ</th>
                        <th className="py-3 px-3">QUYỀN SỬ DỤNG</th>
                        <th className="py-3 px-3">THỜI HẠN / LƯỢT</th>
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
                          const isUserLicensed =
                            u.role === 'LICENSED' ||
                            u.plan === 'PRO' ||
                            u.plan === 'PREMIUM' ||
                            u.plan === 'SCHOOL' ||
                            u.plan === 'LICENSED' ||
                            isUserAdmin ||
                            u.quota?.easy === -1 ||
                            (u.quota?.easy !== undefined && u.quota.easy >= 99999);
                          const isUserBlocked = Boolean(u.isBlocked || u.role === 'BLOCKED');

                          const hasExpiry = Boolean(u.licenseExpiresAt);
                          const expiryTime = hasExpiry ? new Date(u.licenseExpiresAt!).getTime() : null;
                          const isExpired = Boolean(hasExpiry && expiryTime && expiryTime < Date.now());
                          const daysLeft = hasExpiry && expiryTime ? Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                          const isExpiringSoon = Boolean(!isExpired && daysLeft !== null && daysLeft <= 15);

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
                                {isUserAdmin ? (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    ADMIN (PRO)
                                  </span>
                                ) : u.freeAccess ? (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                                    Miễn phí CT
                                  </span>
                                ) : isUserLicensed ? (
                                  !hasExpiry ? (
                                    <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      PRO Vĩnh viễn
                                    </span>
                                  ) : isExpired ? (
                                    <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      PRO Hết hạn
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      PRO Sắp hết hạn
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      PRO Còn hạn
                                    </span>
                                  )
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11.5px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Trải nghiệm
                                  </span>
                                )}
                              </td>

                              {/* Cột 4: THỜI HẠN / LƯỢT CÒN LẠI */}
                              <td className="py-3 px-3">
                                {isUserAdmin || (isUserLicensed && !hasExpiry) ? (
                                  <div>
                                    <span className="text-emerald-700 font-bold block">Không giới hạn</span>
                                    <span className="text-[11px] text-slate-400 block">Vĩnh viễn</span>
                                  </div>
                                ) : isUserLicensed && hasExpiry ? (
                                  isExpired ? (
                                    <div>
                                      <span className="text-rose-600 font-bold block text-[12px]">Đã hết hạn</span>
                                      <span className="text-[11px] text-rose-500 block">
                                        Ngày: {new Date(u.licenseExpiresAt!).toLocaleDateString('vi-VN')}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-emerald-700 font-bold block">Không giới hạn</span>
                                      <span className={`text-[11px] block font-medium ${isExpiringSoon ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                                        Đến: {new Date(u.licenseExpiresAt!).toLocaleDateString('vi-VN')} {daysLeft !== null ? `(còn ${daysLeft} ngày)` : ''}
                                      </span>
                                    </div>
                                  )
                                ) : u.freeAccess ? (
                                  <span className="text-cyan-700 font-medium">Miễn phí trong CT</span>
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
                                  {/* Xem chi tiết */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetailModal(u)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Xem chi tiết tài khoản"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Chỉnh sửa thông tin */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(u)}
                                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                    title="Chỉnh sửa thông tin người dùng"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

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
                                    /* Tài khoản LICENSED: Gia hạn, Chỉnh quyền, Thu hồi quyền, Khóa */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenGrantModal(u, 'EXTEND')}
                                        className="px-2.5 py-1 text-[12px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                        title="Gia hạn thời hạn quyền sử dụng PRO"
                                      >
                                        <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Gia hạn</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenGrantModal(u, 'EDIT')}
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

                                      {!isSelf && !isUserAdmin && (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteUser(u)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="Xóa tài khoản người dùng"
                                        >
                                          <Trash2 className="w-4 h-4" />
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
                                        onClick={() => handleOpenGrantModal(u, 'GRANT')}
                                        className="px-2.5 py-1 text-[12px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                        title="Cấp quyền thành viên PRO"
                                      >
                                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Cấp quyền</span>
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

                                      {!isSelf && !isUserAdmin && (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteUser(u)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="Xóa tài khoản người dùng"
                                        >
                                          <Trash2 className="w-4 h-4" />
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
                  <table className="w-full text-left border-collapse min-w-[760px]">
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
                                  <div>
                                    <span className="text-[12.5px] text-slate-800 font-semibold block">
                                      {new Date(lic.expiresAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    {new Date(lic.expiresAt).getTime() < Date.now() ? (
                                      <span className="text-[11px] text-rose-600 font-semibold block">
                                        Đã hết hạn
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-500 block">
                                        Còn {Math.ceil((new Date(lic.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày
                                      </span>
                                    )}
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

          {/* ========================================== */}
          {/* TAB 5: GOOGLE SHEETS & APPS SCRIPT (Mục tích hợp) */}
          {/* ========================================== */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              {/* Thẻ Trạng thái Kết nối & Đồng bộ */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                        <span>Trạng thái Kết nối Google Apps Script & Sheets</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          {stats?.licenseApiStatus === 'CONNECTED' ? 'ĐÃ KẾT NỐI' : 'SẴN SÀNG'}
                        </span>
                      </h4>
                      <p className="text-[12.5px] text-slate-500">
                        Cơ chế đồng bộ 2 chiều dữ liệu người dùng USERS và bản quyền LICENSES
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handlePingGoogleSheets}
                      disabled={pingStatus?.loading}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${pingStatus?.loading ? 'animate-spin' : ''}`} />
                      <span>{pingStatus?.loading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Ping)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSyncGoogleSheets()}
                      disabled={isSyncingSheet}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSheet ? 'Đang đồng bộ...' : 'Đồng bộ toàn bộ USERS'}</span>
                    </button>
                  </div>
                </div>

                {pingStatus && (
                  <div className={`p-3 rounded-lg text-[13px] flex items-center gap-2 border ${
                    pingStatus.error ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {pingStatus.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{pingStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Hướng dẫn cấu trúc 3 Sheets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Sheet "USERS"</span>
                    </h5>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">12 cột</span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    Lưu trữ toàn bộ danh sách giáo viên, quyền hạn và số lượt sử dụng.
                  </p>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 break-words border border-slate-200">
                    ID | EMAIL | NAME | ROLE | PLAN | QUOTA_EASY | QUOTA_ADVANCED | LICENSE_KEY | EXPIRES_AT | STATUS | CREATED_AT | LAST_ACTIVE_AT
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-purple-600" />
                      <span>Sheet "LICENSES"</span>
                    </h5>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">9 cột</span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    Quản lý mã kích hoạt bản quyền, số thiết bị và email gán.
                  </p>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 break-words border border-slate-200">
                    KEY | PLAN | MAX_DEVICES | STATUS | EXPIRES_AT | ASSIGNED_EMAIL | BOUND_DEVICES | NOTE | CREATED_AT
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-[14px] text-slate-900 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span>Sheet "SETTINGS"</span>
                    </h5>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">3 cột</span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    Cấu hình số lượt dùng thử và chiến dịch trải nghiệm miễn phí.
                  </p>
                  <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 break-words border border-slate-200">
                    KEY | VALUE | DESCRIPTION
                  </div>
                </div>
              </div>

              {/* Khung Hiển thị mã nguồn Code.gs */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                      <Code className="w-4.5 h-4.5 text-purple-600" />
                      <span>Mã nguồn Google Apps Script (Code.gs v2.7 — Tương thích 13 cột & 12 cột)</span>
                    </h4>
                    <p className="text-[12.5px] text-slate-500">
                      Phiên bản 2.7 chính thức: Xác thực serverSecret bắt buộc, khóa mềm an toàn (BLOCKED), bảo toàn hạn mức Trial (EASY_LIMIT/EASY_USED) và quyền PRO vĩnh viễn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const fullCode = codeGsSource || '';
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(fullCode);
                        } else {
                          throw new Error('Clipboard API not available');
                        }
                      } catch {
                        try {
                          const textArea = document.createElement('textarea');
                          textArea.value = fullCode;
                          textArea.style.position = 'fixed';
                          textArea.style.left = '-999999px';
                          textArea.style.top = '-999999px';
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                        } catch (_) {}
                      }
                      setCopiedCodeGs(true);
                      setTimeout(() => setCopiedCodeGs(false), 2500);
                    }}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedCodeGs ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCodeGs ? 'Đã sao chép Code.gs v2.7!' : 'Sao chép toàn bộ Code.gs'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl text-slate-300 font-mono text-[12px] max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre className="whitespace-pre">{codeGsSource}</pre>
                </div>
              </div>
            </div>
          )}
      </main>

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

        {/* Modal Con 2: CẤP QUYỀN / GIA HẠN THÀNH VIÊN PRO (Mục XIII) */}
        {grantModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs select-none">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header Modal */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-900 leading-tight">
                      {grantModalTitle}
                    </h4>
                    <span className="text-[11.5px] text-slate-500">
                      Cấp quyền hoặc gia hạn gói thành viên PRO
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGrantModalUser(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {grantStep === 'FORM' ? (
                /* BƯỚC 1: THIẾT LẬP THỜI HẠN PRO */
                <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
                  {/* Thông tin tài khoản & Thời hạn hiện tại */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px] space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500">Tài khoản:</span>
                      <strong className="text-slate-900 text-right truncate max-w-[240px]">
                        {grantModalUser.name || grantModalUser.email}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Email:</span>
                      <span className="text-slate-700 font-mono text-[11.5px] truncate max-w-[240px]">
                        {grantModalUser.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[12px]">
                      <span className="text-slate-500">Thời hạn hiện tại:</span>
                      <span className={`font-semibold ${isTargetCurrentExpired ? 'text-rose-600' : isTargetCurrentActive ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {targetExpiryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Lựa chọn loại quyền PRO: Vĩnh viễn hay Theo tháng */}
                  <div className="space-y-2">
                    <label className="block text-[12.5px] font-bold text-slate-700">
                      Chế độ thời hạn PRO:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        grantType === 'MONTHLY'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500 text-emerald-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="grantTypeOption"
                          checked={grantType === 'MONTHLY'}
                          onChange={() => setGrantType('MONTHLY')}
                          className="w-4 h-4 text-emerald-600 mt-0.5"
                        />
                        <div>
                          <span className="text-[13px] font-bold block">PRO Theo tháng</span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">Thời hạn theo lịch chuẩn</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        grantType === 'LIFETIME'
                          ? 'border-purple-600 bg-purple-50/50 ring-1 ring-purple-500 text-purple-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="grantTypeOption"
                          checked={grantType === 'LIFETIME'}
                          onChange={() => setGrantType('LIFETIME')}
                          className="w-4 h-4 text-purple-600 mt-0.5"
                        />
                        <div>
                          <span className="text-[13px] font-bold block">PRO Vĩnh viễn</span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">Không giới hạn trọn đời</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {grantType === 'MONTHLY' && (
                    <div className="space-y-3.5 pt-1 border-t border-slate-100">
                      {/* Chọn số tháng (Nút chọn nhanh & Input số nguyên dương bất kỳ) */}
                      <div>
                        <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                          Số tháng sử dụng (nguyên dương):
                        </label>
                        {/* Nút chọn nhanh */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {[
                            { m: 1, label: '1 tháng' },
                            { m: 3, label: '3 tháng' },
                            { m: 6, label: '6 tháng' },
                            { m: 12, label: '12 tháng (1 năm)' },
                            { m: 24, label: '24 tháng (2 năm)' }
                          ].map(item => (
                            <button
                              key={item.m}
                              type="button"
                              onClick={() => setGrantMonths(item.m)}
                              className={`px-2.5 py-1 text-[12px] font-bold rounded-lg transition-colors cursor-pointer ${
                                grantMonths === item.m
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Input số tháng tùy ý */}
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-slate-500 shrink-0">Hoặc nhập số tháng:</span>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={grantMonths}
                            onChange={(e) => setGrantMonths(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-2.5 py-1.5 text-center text-[13.5px] font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                          />
                          <span className="text-[12px] text-slate-600 font-semibold">tháng</span>
                        </div>
                      </div>

                      {/* Chế độ Gia hạn (nếu tài khoản đang có thời hạn còn hiệu lực) */}
                      {isTargetCurrentActive ? (
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
                          <label className="block text-[12px] font-bold text-blue-950">
                            Phương thức gia hạn:
                          </label>
                          <div className="space-y-1.5 text-[12px]">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="extendMode"
                                checked={grantExtendMode === 'EXTEND_FROM_CURRENT'}
                                onChange={() => setGrantExtendMode('EXTEND_FROM_CURRENT')}
                                className="w-3.5 h-3.5 text-blue-600 mt-0.5"
                              />
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  Gia hạn tiếp nối từ hạn hiện tại ({formatCalendarDate(targetCurrentExpiry)})
                                </span>
                                <span className="text-slate-500 text-[11px] block">
                                  Cộng thêm {grantMonths} tháng vào sau ngày hết hạn cũ
                                </span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-blue-100">
                              <input
                                type="radio"
                                name="extendMode"
                                checked={grantExtendMode === 'RESET_FROM_START'}
                                onChange={() => setGrantExtendMode('RESET_FROM_START')}
                                className="w-3.5 h-3.5 text-blue-600 mt-0.5"
                              />
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  Cấp lại thời hạn mới từ ngày bắt đầu
                                </span>
                                <span className="text-slate-500 text-[11px] block">
                                  Tính lại mốc bắt đầu mới theo ngày đã chọn
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                      ) : null}

                      {/* Ngày bắt đầu (hiển thị khi tính từ mốc mới hoặc tài khoản mới/hết hạn) */}
                      {(!isTargetCurrentActive || grantExtendMode === 'RESET_FROM_START') && (
                        <div>
                          <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                            Ngày bắt đầu tính:
                          </label>
                          <input
                            type="date"
                            value={grantStartDate}
                            onChange={(e) => setGrantStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-[13px] rounded-lg border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      )}

                      {/* Bảng xem trước thời hạn trước khi lưu */}
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5 text-[12px]">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Mốc bắt đầu tính:</span>
                          <span className="font-semibold text-slate-800">{formatCalendarDate(effectiveBaseDate)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Thời gian cộng thêm:</span>
                          <span className="font-bold text-emerald-800">{grantMonths} tháng (lịch chính xác)</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-emerald-200/80">
                          <span className="font-bold text-emerald-950">Thời hạn mới sau khi lưu:</span>
                          <span className="font-extrabold text-[13.5px] text-emerald-700">
                            {formatCalendarDate(computedExpiryDateStr)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {grantType === 'LIFETIME' && (
                    <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 text-[12.5px] space-y-1 text-purple-900">
                      <div className="font-bold flex items-center gap-1.5 text-purple-950">
                        <Check className="w-4 h-4 text-purple-700" />
                        <span>Quyền PRO Vĩnh viễn (Không thời hạn)</span>
                      </div>
                      <p className="text-[12px] text-purple-800/90 leading-relaxed">
                        Tài khoản được sử dụng không giới hạn lượt và không bao giờ hết hạn. Các tài khoản PRO vĩnh viễn hiện có được bảo toàn tuyệt đối.
                      </p>
                    </div>
                  )}

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
                      onClick={() => setGrantStep('CONFIRM')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Tiếp tục xác nhận</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* BƯỚC 2: XÁC NHẬN TRƯỚC KHI GHI DỮ LIỆU */
                <div className="p-5 space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-[14px]">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Xác nhận ghi dữ liệu thành viên PRO</span>
                    </div>
                    <p className="text-[12.5px] text-amber-900 leading-relaxed">
                      Thầy/Cô vui lòng kiểm tra kỹ thông tin trước khi lưu xuống hệ thống và Google Sheets:
                    </p>

                    <div className="bg-white p-3 rounded-lg border border-amber-200/80 text-[12px] space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500">Tài khoản:</span>
                        <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                          {grantModalUser.name || grantModalUser.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-mono text-[11.5px] text-slate-700">{grantModalUser.email}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Thời hạn cũ:</span>
                        <span className="font-semibold text-slate-700">{targetExpiryLabel}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-bold">Thời hạn mới:</span>
                        <span className="font-extrabold text-[13px] text-emerald-700">
                          {grantType === 'LIFETIME'
                            ? 'PRO Vĩnh viễn (Không thời hạn)'
                            : `${formatCalendarDate(computedExpiryDateStr)} (${grantMonths} tháng)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setGrantStep('FORM')}
                      disabled={isSubmittingGrant}
                      className="flex-1 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                    >
                      Quay lại sửa
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGrant}
                      disabled={isSubmittingGrant}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingGrant ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>XÁC NHẬN & LƯU</span>
                    </button>
                  </div>
                </div>
              )}
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

        {/* Modal Con 1B: CHỈNH SỬA THÔNG TIN NGƯỜI DÙNG TOÀN DIỆN */}
        {editModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4.5 h-4.5 text-purple-400" />
                  <h4 className="text-[15px] font-bold">CHỈNH SỬA NGƯỜI DÙNG</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Họ và tên */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Họ và tên:
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nhập họ và tên người dùng"
                    className="w-full px-3.5 py-2 text-[13.5px] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900"
                  />
                </div>

                {/* Địa chỉ Email */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Địa chỉ Email Google:
                  </label>
                  <input
                    type="email"
                    required
                    disabled={editModalUser.role === 'ADMIN'}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-[13.5px] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  {editModalUser.role === 'ADMIN' ? (
                    <p className="text-[11.5px] text-amber-600 mt-1">
                      🛡️ Bảo mật: Không thể thay đổi địa chỉ Email của Quản trị viên.
                    </p>
                  ) : editEmail.trim().toLowerCase() !== editModalUser.email.toLowerCase() ? (
                    <p className="text-[11.5px] text-purple-600 mt-1 font-semibold">
                      ℹ️ Đổi email sẽ chuyển quyền, lịch sử và bảo toàn định danh tài khoản sang email mới.
                    </p>
                  ) : (
                    <p className="text-[11.5px] text-slate-400 mt-1">
                      Bảo toàn mã ID định danh tài khoản khi thay đổi địa chỉ email.
                    </p>
                  )}
                </div>

                {/* Gói / Quyền sử dụng */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Gói quyền sử dụng:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPlan('PRO')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        editPlan === 'PRO'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900 font-bold ring-1 ring-purple-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-[13px]">Gói PRO</div>
                      <div className="text-[11px] text-slate-500 font-normal">Không giới hạn lượt</div>
                    </button>
                    <button
                      type="button"
                      disabled={editModalUser.role === 'ADMIN'}
                      onClick={() => setEditPlan('TRIAL')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        editPlan === 'TRIAL'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900 font-bold ring-1 ring-purple-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-[13px]">Gói Dùng thử</div>
                      <div className="text-[11px] text-slate-500 font-normal">Giới hạn số lượt</div>
                    </button>
                  </div>
                </div>

                {/* Nếu chọn PRO: Tùy chọn thời hạn */}
                {editPlan === 'PRO' && (
                  <div className="p-3 bg-purple-50/40 border border-purple-200 rounded-xl space-y-2.5">
                    <div className="text-[12px] font-bold text-purple-900">Thời hạn gói PRO:</div>
                    <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHasExpiry}
                        onChange={(e) => setEditHasExpiry(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>Có ngày hết hạn cụ thể</span>
                    </label>
                    {editHasExpiry && (
                      <input
                        type="date"
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-[13px] rounded-lg border border-purple-300 text-slate-900 font-semibold"
                      />
                    )}
                    {!editHasExpiry && (
                      <p className="text-[11.5px] text-emerald-700 font-medium">
                        ✓ Hiệu lực vĩnh viễn (Không thời hạn)
                      </p>
                    )}
                  </div>
                )}

                {/* Nếu chọn TRIAL: Cấu hình số lượt */}
                {editPlan === 'TRIAL' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="text-[12px] font-bold text-slate-700">Điều chỉnh số lượt khả dụng:</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11.5px] text-slate-500 mb-1">Cơ bản:</label>
                        <input
                          type="number"
                          min={0}
                          value={editEasyQuota}
                          onChange={(e) => setEditEasyQuota(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-[13px] font-bold rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] text-slate-500 mb-1">Chuyên sâu:</label>
                        <input
                          type="number"
                          min={0}
                          value={editAdvancedQuota}
                          onChange={(e) => setEditAdvancedQuota(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-[13px] font-bold rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Trạng thái tài khoản */}
                <div>
                  <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                    Trạng thái hoạt động:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditIsBlocked(false)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        !editIsBlocked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[12.5px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hoạt động</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      disabled={editModalUser.role === 'ADMIN'}
                      onClick={() => setEditIsBlocked(true)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        editIsBlocked
                          ? 'border-rose-600 bg-rose-50 text-rose-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-[12.5px] flex items-center justify-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Tạm khóa</span>
                      </div>
                    </button>
                  </div>
                  {editModalUser.role === 'ADMIN' && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Quản trị viên luôn ở trạng thái Hoạt động.
                    </p>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalUser(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmittingEdit ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Con 1C: XEM CHI TIẾT NGƯỜI DÙNG */}
        {detailModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-400" />
                  <h4 className="text-[15px] font-bold">CHI TIẾT TÀI KHOẢN NGƯỜI DÙNG</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailModalUser(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Header profile info */}
                <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                    {(detailModalUser.name || detailModalUser.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-900 text-[15px] truncate">{detailModalUser.name || 'Chưa cập nhật tên'}</h5>
                    <div className="text-[12.5px] text-slate-500 truncate font-mono flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{detailModalUser.email}</span>
                    </div>
                  </div>
                  <div>
                    {detailModalUser.isBlocked || detailModalUser.role === 'BLOCKED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <Lock className="w-3 h-3" /> Đã khóa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Vai trò</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {detailModalUser.role === 'ADMIN' ? '👑 Quản trị viên (ADMIN)' : detailModalUser.role === 'LICENSED' ? '⭐ Bản quyền (LICENSED)' : '👤 Người dùng (TRIAL)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Gói sử dụng</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {detailModalUser.plan === 'PRO' || detailModalUser.role === 'LICENSED' || detailModalUser.quota?.easy === -1
                        ? 'Đã cấp quyền (PRO / Vĩnh viễn)'
                        : 'Gói trải nghiệm (TRIAL)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Hạn mức & Số lượt còn lại</span>
                    <div className="mt-1 font-bold text-slate-800">
                      {detailModalUser.plan === 'PRO' || detailModalUser.role === 'LICENSED' || detailModalUser.quota?.easy === -1 ? (
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          Không giới hạn (UNLIMITED - Cơ bản & Chuyên sâu)
                        </span>
                      ) : (
                        <div className="flex items-center gap-4 text-[13px]">
                          <span>Cơ bản: <strong className="text-purple-700">{detailModalUser.quota?.easy ?? 0} lượt</strong></span>
                          <span>Chuyên sâu: <strong className="text-indigo-700">{detailModalUser.quota?.advanced ?? 0} lượt</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {detailModalUser.licenseKey && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2">
                      <span className="text-slate-400 block text-[11px] font-semibold uppercase">Mã bản quyền kích hoạt</span>
                      <span className="font-mono font-bold text-purple-700 mt-1 block text-[13px]">{detailModalUser.licenseKey}</span>
                    </div>
                  )}

                  <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Thời hạn hiệu lực PRO</span>
                    <span className="font-semibold text-slate-800 mt-1 block">
                      {detailModalUser.licenseExpiresAt ? (
                        new Date(detailModalUser.licenseExpiresAt).getTime() < Date.now() ? (
                          <span className="text-rose-600 font-bold">
                            Đã hết hạn vào ngày {new Date(detailModalUser.licenseExpiresAt).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">
                            Đến ngày: {new Date(detailModalUser.licenseExpiresAt).toLocaleDateString('vi-VN')} (còn {Math.ceil((new Date(detailModalUser.licenseExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày)
                          </span>
                        )
                      ) : (
                        <span className="text-emerald-700 font-bold">
                          {detailModalUser.plan === 'PRO' || detailModalUser.role === 'LICENSED' || detailModalUser.quota?.easy === -1
                            ? 'Vĩnh viễn (Không thời hạn)'
                            : 'Chưa kích hoạt gói PRO'}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">ID Định danh</span>
                    <span className="font-mono text-slate-600 mt-1 block text-[11.5px] truncate">{detailModalUser.id}</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Hoạt động gần nhất</span>
                    <span className="text-slate-600 mt-1 block text-[11.5px]">
                      {detailModalUser.lastActiveAt ? new Date(detailModalUser.lastActiveAt).toLocaleString('vi-VN') : 'Chưa có'}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDetailModalUser(null)}
                    className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailModalUser;
                      setDetailModalUser(null);
                      handleOpenEditModal(target);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa tài khoản</span>
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

        {/* Modal Con 8: Xác nhận Xóa người dùng */}
        {confirmDeleteUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">Xóa người dùng?</h4>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Xóa tài khoản <strong className="text-slate-900">{confirmDeleteUser.email}</strong>? Người dùng sẽ không thể đăng nhập hoặc sử dụng hệ thống.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUser(null)}
                    className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-[13px] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDeleteUser}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Con 9: Đối chiếu & Xử lý Xung đột Đồng bộ Google Sheets */}
        {syncConflicts && syncConflicts.length > 0 && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-900">XEM TRƯỚC XUNG ĐỘT DỮ LIỆU ĐỒNG BỘ</h4>
                    <p className="text-[12px] text-slate-500">
                      Phát hiện {syncConflicts.length} trường dữ liệu khác biệt giữa Web App và Google Sheets
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncConflicts(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-[13px]">
                <p className="text-slate-600 leading-relaxed">
                  Để đảm bảo tính bền vững dữ liệu, hệ thống không tự động ghi đè. Vui lòng đối chiếu các điểm khác nhau bên dưới và chọn phương án xử lý:
                </p>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[12px] font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tài khoản</th>
                        <th className="py-2.5 px-3">Trường dữ liệu</th>
                        <th className="py-2.5 px-3 text-blue-700">Dữ liệu Web App</th>
                        <th className="py-2.5 px-3 text-emerald-700">Dữ liệu Google Sheets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {syncConflicts.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold block text-slate-900">{c.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono block">{c.email}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{c.field}</td>
                          <td className="py-2.5 px-3 font-semibold text-blue-800 bg-blue-50/50">{String(c.localValue)}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-800 bg-emerald-50/50">{String(c.remoteValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[12px] text-slate-600 space-y-1 border border-slate-200">
                  <strong>Khuyến nghị an toàn:</strong>
                  <div>• <strong>Ưu tiên Google Sheets:</strong> Cập nhật dữ liệu Web App theo Google Sheets USERS (giữ nguyên các chỉnh sửa đã làm trên Sheet).</div>
                  <div>• <strong>Ưu tiên Web App:</strong> Ghi đè Google Sheets theo dữ liệu hiện tại trên ứng dụng.</div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSyncConflicts(null)}
                  className="px-3.5 py-2 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 font-bold text-[12.5px] rounded-xl transition-colors cursor-pointer"
                >
                  Hủy đồng bộ
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheets('keep_local')}
                  disabled={isSyncingSheet}
                  className="px-3.5 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-[12.5px] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Ưu tiên Web App (Ghi đè Sheet)
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheets('keep_remote')}
                  disabled={isSyncingSheet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Ưu tiên Google Sheets (Khuyên dùng)
                </button>
              </div>
            </div>
          </div>
        )}

      {/* 4. Footer Trang Quản trị Độc Lập */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3.5 sm:py-4 px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          {/* Khu vực Bên Trái */}
          <div className="text-left">
            <div className="text-[13.5px] sm:text-sm font-semibold text-slate-800 tracking-tight">
              SKKN REVIEW PRO
            </div>
            <div className="text-[11.5px] sm:text-xs text-slate-500 mt-0.5">
              Copyright © 2026 · Developed by GV.Hồ Nguyễn Đa Thiện
            </div>
          </div>

          {/* Khu vực Bên Phải */}
          <div className="text-left sm:text-right">
            <div className="text-[13px] sm:text-[13.5px] font-medium text-slate-700">
              Cổng Quản trị Hệ thống Giáo dục
            </div>
            <div className="text-[11.5px] sm:text-xs text-slate-500 mt-0.5">
              Phiên bản 2.7
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
