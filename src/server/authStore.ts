import fs from 'fs';
import path from 'path';
import { UserAccount, GuestSession, LicenseItem, LicenseStatus, SystemStats, UserRole, LicensePlan, SystemSettings } from '../types';

const DATA_DIR = path.resolve('data');
const STORE_FILE = path.join(DATA_DIR, 'auth_store.json');

interface AuthStoreData {
  users: Record<string, UserAccount>; // keyed by email or id
  guests: Record<string, GuestSession>; // keyed by guestId
  licenses: Record<string, LicenseItem>; // keyed by key
  stats: {
    totalAnalyses: number;
  };
  settings?: SystemSettings;
}

let store: AuthStoreData = {
  users: {},
  guests: {},
  licenses: {},
  stats: { totalAnalyses: 0 },
};

// Initialize default sample licenses
function initDefaultData() {
  const now = new Date().toISOString();
  // Seed some sample VIP / Official licenses for testing & activation
  const defaultLicenses: LicenseItem[] = [
    {
      key: 'SKKN-PRO-2025-VIP',
      plan: 'PRO',
      maxDevices: 2,
      boundDevices: [],
      status: 'UNUSED',
      expiresAt: null,
      createdReason: 'Mã kích hoạt VIP 2025',
      customerNote: 'Khách hàng VIP Giáo viên',
      createdAt: now,
    },
    {
      key: 'SKKN-PRO-GIAO-VIEN',
      plan: 'PRO',
      maxDevices: 1,
      boundDevices: [],
      status: 'UNUSED',
      expiresAt: null,
      createdReason: 'Mã ưu đãi Giáo viên',
      customerNote: 'Giáo viên trải nghiệm',
      createdAt: now,
    },
    {
      key: 'SKKN-PREMIUM-SCHOOL',
      plan: 'SCHOOL',
      maxDevices: 5,
      boundDevices: [],
      status: 'UNUSED',
      expiresAt: null,
      createdReason: 'Gói Bản quyền Trường học',
      customerNote: 'Trường THPT Chuyên',
      createdAt: now,
    },
  ];

  defaultLicenses.forEach(lic => {
    if (!store.licenses[lic.key]) {
      store.licenses[lic.key] = lic;
    } else {
      // Normalize existing license
      store.licenses[lic.key].boundDevices = store.licenses[lic.key].boundDevices || [];
      if (!store.licenses[lic.key].status) {
        store.licenses[lic.key].status = store.licenses[lic.key].assignedEmail ? 'ACTIVE' : 'UNUSED';
      }
    }
  });
}

export function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      store = {
        users: parsed.users || {},
        guests: parsed.guests || {},
        licenses: parsed.licenses || {},
        stats: parsed.stats || { totalAnalyses: 0 },
      };
      // Normalize licenses
      Object.values(store.licenses).forEach(lic => {
        lic.boundDevices = lic.boundDevices || [];
        if (!lic.status) {
          lic.status = lic.assignedEmail ? 'ACTIVE' : 'UNUSED';
        }
      });
    }
  } catch (err) {
    console.error('Could not load auth store, using in-memory store:', err);
  }
  initDefaultData();
  saveStore();
}

export function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save auth store to disk:', err);
  }
}

// ----------------- GUEST OPERATIONS -----------------
export function getOrCreateGuest(guestId: string): GuestSession {
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  if (!store.guests[guestId]) {
    store.guests[guestId] = {
      guestId,
      quota: {
        easy: 3,      // Dễ dùng: 3 lượt
        advanced: 1,  // Chuyên sâu: 1 lượt
      },
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      analysisCount: 0,
    };
    saveStore();
  } else {
    store.guests[guestId].lastActiveAt = new Date().toISOString();
  }
  return store.guests[guestId];
}

// ----------------- USER OPERATIONS -----------------
export function findUserByEmailOrId(identifier: string): UserAccount | null {
  if (!identifier) return null;
  const lower = identifier.toLowerCase();
  for (const key of Object.keys(store.users)) {
    const u = store.users[key];
    if (u.email.toLowerCase() === lower || u.id === identifier) {
      return u;
    }
  }
  return null;
}

// ----------------- LICENSE API / GOOGLE SHEETS ROLE INTEGRATION -----------------
export async function fetchUserFromLicenseApi(
  email: string,
  sub?: string
): Promise<{
  role?: UserRole;
  plan?: LicensePlan;
  name?: string;
  freeAccess?: boolean;
  freeAccessName?: string;
  freeAccessExpiresAt?: string | null;
} | null> {
  if (!process.env.LICENSE_API_URL) return null;
  try {
    const url = new URL(process.env.LICENSE_API_URL);
    url.searchParams.set('action', 'getUser');
    url.searchParams.set('email', email);
    if (sub) url.searchParams.set('sub', sub);

    const resp = await fetch(url.toString(), { method: 'GET' });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && (data.role || data.plan || data.userRole || data.freeAccess)) {
        const rawRole = (data.role || data.userRole || '').toUpperCase();
        const role: UserRole | undefined = 
          rawRole === 'ADMIN' ? 'ADMIN' :
          rawRole === 'LICENSED' ? 'LICENSED' :
          rawRole === 'FREE_ACCESS' || rawRole === 'FREE' || Boolean(data.freeAccess) ? 'FREE_ACCESS' :
          rawRole === 'BLOCKED' ? 'BLOCKED' :
          rawRole === 'TRIAL' ? 'TRIAL' : undefined;

        const rawPlan = (data.plan || '').toUpperCase();
        const plan: LicensePlan | undefined =
          rawPlan === 'SCHOOL' ? 'SCHOOL' :
          rawPlan === 'PREMIUM' ? 'PREMIUM' :
          rawPlan === 'PRO' ? 'PRO' : undefined;

        return {
          role,
          plan,
          name: data.name,
          freeAccess: Boolean(data.freeAccess || role === 'FREE_ACCESS'),
          freeAccessName: data.freeAccessName || data.campaignName,
          freeAccessExpiresAt: data.freeAccessExpiresAt || data.expiresAt,
        };
      }
    }
  } catch (err) {
    console.warn('Could not query user role from LICENSE_API_URL:', err);
  }
  return null;
}

export function isUserAdmin(identifier?: string): boolean {
  if (!identifier) return false;
  const user = findUserByEmailOrId(identifier);
  return user?.role === 'ADMIN';
}

export async function getOrCreateUser(profile: {
  email: string;
  name?: string;
  picture?: string;
  id?: string;
}): Promise<UserAccount> {
  const email = profile.email.toLowerCase();
  let user = findUserByEmailOrId(email);

  // Tra cứu vai trò từ License API / Google Sheets nếu đã cấu hình LICENSE_API_URL
  const remoteData = await fetchUserFromLicenseApi(email, profile.id);

  if (!user) {
    const userId = profile.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const role: UserRole = remoteData?.role || 'TRIAL';
    const plan: LicensePlan = remoteData?.plan || (role === 'ADMIN' ? 'PRO' : 'TRIAL');
    const isUnlimited = role === 'ADMIN' || role === 'LICENSED' || role === 'FREE_ACCESS';

    user = {
      id: userId,
      email,
      name: remoteData?.name || profile.name || email.split('@')[0],
      picture: profile.picture,
      role,
      plan,
      quota: isUnlimited ? { easy: 9999, advanced: 9999 } : { easy: 5, advanced: 2 },
      licenseKey: role === 'ADMIN' ? 'SKKN-ADMIN-SYSTEM' : undefined,
      licenseExpiresAt: null,
      freeAccess: remoteData?.freeAccess || role === 'FREE_ACCESS',
      freeAccessName: remoteData?.freeAccessName,
      freeAccessExpiresAt: remoteData?.freeAccessExpiresAt,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isBlocked: role === 'BLOCKED',
    };
    store.users[email] = user;
    saveStore();
  } else {
    // Nếu có phân quyền cập nhật từ Google Sheets / License API thì đồng bộ
    if (remoteData?.role) {
      user.role = remoteData.role;
      if (remoteData.role === 'ADMIN' || remoteData.role === 'LICENSED' || remoteData.role === 'FREE_ACCESS') {
        user.quota = { easy: 9999, advanced: 9999 };
      }
    }
    if (remoteData?.freeAccess !== undefined) {
      user.freeAccess = remoteData.freeAccess;
    }
    if (remoteData?.freeAccessName) {
      user.freeAccessName = remoteData.freeAccessName;
    }
    if (remoteData?.freeAccessExpiresAt) {
      user.freeAccessExpiresAt = remoteData.freeAccessExpiresAt;
    }
    if (remoteData?.plan) {
      user.plan = remoteData.plan;
    }
    if (remoteData?.name) {
      user.name = remoteData.name;
    } else if (profile.name) {
      user.name = profile.name;
    }
    if (profile.picture) user.picture = profile.picture;
    user.lastActiveAt = new Date().toISOString();
    saveStore();
  }

  return user;
}

// ----------------- QUOTA CONSUMPTION -----------------
export interface QuotaCheckResult {
  allowed: boolean;
  code?: 'GUEST_QUOTA_EXCEEDED' | 'TRIAL_QUOTA_EXCEEDED' | 'ACCOUNT_BLOCKED' | 'NOT_ALLOWED';
  message?: string;
  role: UserRole;
  quota: { easy: number; advanced: number };
}

export function consumeQuota(params: {
  guestId?: string;
  email?: string;
  userId?: string;
  mode: 'easy' | 'advanced';
}): QuotaCheckResult {
  const { guestId, email, userId, mode } = params;

  // 1. Check logged-in user first
  if (email || userId) {
    const user = findUserByEmailOrId(email || userId || '');
    if (user) {
      if (user.isBlocked || user.role === 'BLOCKED') {
        return {
          allowed: false,
          code: 'ACCOUNT_BLOCKED',
          message: 'Tài khoản của Thầy/Cô đã bị tạm khóa. Vui lòng liên hệ quản trị viên.',
          role: 'BLOCKED',
          quota: user.quota,
        };
      }

      // LICENSED, ADMIN or FREE ACCESS -> Unlimited (không trừ lượt)
      if (user.role === 'LICENSED' || user.role === 'ADMIN' || user.role === 'FREE_ACCESS' || user.freeAccess) {
        store.stats.totalAnalyses += 1;
        saveStore();
        return {
          allowed: true,
          role: user.role,
          quota: user.quota,
        };
      }

      // TRIAL user
      const currentQuota = user.quota[mode] ?? 0;
      if (currentQuota <= 0) {
        return {
          allowed: false,
          code: 'TRIAL_QUOTA_EXCEEDED',
          message: `Thầy/Cô đã dùng hết lượt dùng thử cho chế độ ${mode === 'easy' ? 'Cơ bản' : 'Chuyên sâu'}. Vui lòng kích hoạt Bản quyền để tiếp tục không giới hạn.`,
          role: 'TRIAL',
          quota: user.quota,
        };
      }

      user.quota[mode] = Math.max(0, currentQuota - 1);
      store.stats.totalAnalyses += 1;
      saveStore();
      return {
        allowed: true,
        role: 'TRIAL',
        quota: user.quota,
      };
    }
  }

  // 2. Guest user
  const effectiveGuestId = guestId || 'guest_default';
  const guest = getOrCreateGuest(effectiveGuestId);
  const guestCurrentQuota = guest.quota[mode] ?? 0;

  if (guestCurrentQuota <= 0) {
    return {
      allowed: false,
      code: 'GUEST_QUOTA_EXCEEDED',
      message: `Quý Thầy/Cô đã dùng hết lượt trải nghiệm miễn phí cho chế độ ${mode === 'easy' ? 'Cơ bản' : 'Chuyên sâu'}. Vui lòng đăng nhập Google để nhận thêm lượt Trial hoặc nhập Mã bản quyền.`,
      role: 'GUEST',
      quota: guest.quota,
    };
  }

  guest.quota[mode] = Math.max(0, guestCurrentQuota - 1);
  guest.analysisCount += 1;
  store.stats.totalAnalyses += 1;
  saveStore();

  return {
    allowed: true,
    role: 'GUEST',
    quota: guest.quota,
  };
}

// ----------------- LICENSE VERIFICATION & ACTIVATION (DEVICE BINDING) -----------------
export async function activateLicenseKey(params: {
  licenseKey: string;
  email?: string;
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  guestId?: string;
}): Promise<{
  success: boolean;
  message: string;
  license?: LicenseItem;
  user?: UserAccount;
}> {
  const key = (params.licenseKey || '').trim().toUpperCase();
  if (!key) {
    return { success: false, message: 'Vui lòng nhập mã bản quyền hợp lệ.' };
  }

  if (!params.email) {
    return {
      success: false,
      message: 'Vui lòng đăng nhập tài khoản Google trước khi kích hoạt bản quyền để liên kết tài khoản và thiết bị.',
    };
  }

  const deviceId = (params.deviceId || '').trim() || 'DEV_BROWSER_DEFAULT';
  const deviceName = (params.deviceName || '').trim() || 'Thiết bị người dùng';
  const now = new Date().toISOString();

  // Check local licenses store
  let lic = store.licenses[key];

  // If key matches valid format SKKN-(PRO|PREMIUM|VIP|SCHOOL)-XXXX-XXXX and not yet in store, create as UNUSED
  if (!lic && /^SKKN-(PRO|PREMIUM|VIP|SCHOOL|GV|LIC)-[A-Z0-9]+-[A-Z0-9]+$/.test(key)) {
    lic = {
      key,
      plan: key.includes('SCHOOL') ? 'SCHOOL' : key.includes('PREMIUM') ? 'PREMIUM' : 'PRO',
      maxDevices: key.includes('SCHOOL') ? 5 : 1,
      boundDevices: [],
      status: 'UNUSED',
      expiresAt: null,
      createdReason: 'Mã chuẩn SKKN REVIEW PRO',
      createdAt: now,
    };
    store.licenses[key] = lic;
  }

  // Check external LICENSE_API_URL if configured and still not found
  if (!lic && process.env.LICENSE_API_URL) {
    try {
      const url = new URL(process.env.LICENSE_API_URL);
      url.searchParams.set('action', 'verifyLicense');
      url.searchParams.set('key', key);
      url.searchParams.set('email', params.email);

      const resp = await fetch(url.toString(), { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data && (data.valid === true || data.status === 'ACTIVE' || data.success === true)) {
          lic = {
            key,
            plan: data.plan || 'PRO',
            maxDevices: data.maxDevices || 1,
            boundDevices: [],
            status: 'UNUSED',
            expiresAt: data.expiresAt || null,
            createdReason: 'Xác thực từ Google Apps Script License API',
            createdAt: now,
          };
          store.licenses[key] = lic;
        }
      }
    } catch (apiErr) {
      console.warn('Could not reach LICENSE_API_URL, checking local database:', apiErr);
    }
  }

  if (!lic) {
    return {
      success: false,
      message: 'Mã bản quyền không tồn tại hoặc chưa chính xác. Vui lòng kiểm tra lại.',
    };
  }

  lic.boundDevices = lic.boundDevices || [];

  // 1. Kiểm tra trạng thái REVOKED
  if (lic.status === 'REVOKED') {
    return {
      success: false,
      message: 'Mã bản quyền này đã bị thu hồi hoặc tạm khóa bởi Quản trị viên.',
    };
  }

  // 2. Kiểm tra thời hạn EXPIRED
  if (lic.expiresAt && new Date(lic.expiresAt).getTime() < Date.now()) {
    lic.status = 'EXPIRED';
    saveStore();
    return {
      success: false,
      message: 'Mã bản quyền này đã hết hạn sử dụng.',
    };
  }

  // 3. Xử lý trạng thái UNUSED (Kích hoạt lần đầu: Bind License + Google Account + Device ID)
  if (lic.status === 'UNUSED') {
    lic.assignedEmail = params.email;
    lic.boundDevices = [
      {
        deviceId,
        deviceName,
        boundAt: now,
        lastActiveAt: now,
      },
    ];
    lic.status = 'ACTIVE';
    lic.activatedAt = now;

    let user = findUserByEmailOrId(params.email);
    if (!user) {
      user = await getOrCreateUser({ email: params.email });
    }

    user.role = 'LICENSED';
    user.plan = lic.plan || 'LICENSED';
    user.licenseKey = key;
    user.licenseExpiresAt = lic.expiresAt;
    user.quota = { easy: 9999, advanced: 9999 };

    saveStore();
    return {
      success: true,
      message: `Kích hoạt thành công mã bản quyền! Tài khoản ${params.email} và thiết bị hiện tại đã được liên kết chính thức.`,
      license: lic,
      user,
    };
  }

  // 4. Xử lý trạng thái ACTIVE (Đã kích hoạt trước đó)
  if (lic.status === 'ACTIVE') {
    // 4A. Kiểm tra xem có đúng Google Account sở hữu mã không
    if (lic.assignedEmail && lic.assignedEmail.toLowerCase() !== params.email.toLowerCase()) {
      return {
        success: false,
        message: `Mã bản quyền này đã được kích hoạt cho tài khoản Google ${lic.assignedEmail}. Mỗi mã bản quyền gắn cố định với 01 tài khoản Google sở hữu.`,
      };
    }

    // Nếu mã chưa có assignedEmail (ví dụ tạo trực tiếp), bind vào user này
    if (!lic.assignedEmail) {
      lic.assignedEmail = params.email;
    }

    // 4B. Kiểm tra thiết bị
    const existingDeviceIndex = lic.boundDevices.findIndex(d => d.deviceId === deviceId);
    if (existingDeviceIndex >= 0) {
      // Thiết bị đã bind trước đó -> Cập nhật lastActiveAt
      lic.boundDevices[existingDeviceIndex].lastActiveAt = now;
      let user = findUserByEmailOrId(params.email);
      if (!user) user = await getOrCreateUser({ email: params.email });
      if (user.role !== 'ADMIN') {
        user.role = 'LICENSED';
        user.plan = lic.plan || 'LICENSED';
        user.licenseKey = key;
        user.licenseExpiresAt = lic.expiresAt;
        user.quota = { easy: 9999, advanced: 9999 };
      }
      saveStore();
      return {
        success: true,
        message: 'Thiết bị và tài khoản đã được xác thực bản quyền thành công.',
        license: lic,
        user,
      };
    }

    // Thiết bị mới -> Kiểm tra giới hạn số thiết bị
    const maxAllowed = lic.maxDevices || 1;
    if (lic.boundDevices.length >= maxAllowed) {
      const boundNames = lic.boundDevices.map(d => d.deviceName || d.deviceId).join(', ');
      return {
        success: false,
        message: `Mã bản quyền đã được kích hoạt đủ số lượng thiết bị cho phép (${lic.boundDevices.length}/${maxAllowed} thiết bị: ${boundNames}). Để kích hoạt trên thiết bị mới này, vui lòng liên hệ Quản trị viên để Chuyển thiết bị (Reset Device).`,
      };
    }

    // Còn lượt thiết bị -> Bind thêm thiết bị mới
    lic.boundDevices.push({
      deviceId,
      deviceName,
      boundAt: now,
      lastActiveAt: now,
    });

    let user = findUserByEmailOrId(params.email);
    if (!user) user = await getOrCreateUser({ email: params.email });
    if (user.role !== 'ADMIN') {
      user.role = 'LICENSED';
      user.plan = lic.plan || 'LICENSED';
      user.licenseKey = key;
      user.licenseExpiresAt = lic.expiresAt;
      user.quota = { easy: 9999, advanced: 9999 };
    }

    saveStore();
    return {
      success: true,
      message: `Kích hoạt bản quyền trên thiết bị mới thành công! (Số thiết bị đã kích hoạt: ${lic.boundDevices.length}/${maxAllowed})`,
      license: lic,
      user,
    };
  }

  return {
    success: false,
    message: 'Trạng thái mã bản quyền không hợp lệ.',
  };
}

// ----------------- ADMIN OPERATIONS -----------------
export function getSystemStats(): SystemStats {
  const usersList = Object.values(store.users);
  const trialUsers = usersList.filter(u => u.role === 'TRIAL' || u.plan === 'TRIAL').length;
  const licensedUsers = usersList.filter(u => u.role === 'LICENSED' || u.plan === 'LICENSED' || u.role === 'ADMIN').length;
  const activeLicenses = Object.values(store.licenses).filter(l => l.status === 'ACTIVE').length;

  return {
    totalGuests: Object.keys(store.guests).length,
    totalUsers: usersList.length,
    trialUsers,
    licensedUsers,
    totalAnalyses: store.stats.totalAnalyses,
    activeLicenses,
    geminiStatus: process.env.GEMINI_API_KEY ? 'ONLINE' : 'DEGRADED',
    licenseApiStatus: process.env.LICENSE_API_URL ? 'CONNECTED' : 'LOCAL_FALLBACK',
  };
}

export function getAllUsersAndGuests() {
  return {
    users: Object.values(store.users),
    guests: Object.values(store.guests),
    licenses: Object.values(store.licenses),
  };
}

export function adminUpdateUser(params: {
  operatorEmail?: string;
  email: string;
  role?: UserRole;
  plan?: LicensePlan;
  quota?: { easy: number; advanced: number };
  isBlocked?: boolean;
  expiresAt?: string | null;
}): { success: boolean; user?: UserAccount; error?: string } {
  const user = findUserByEmailOrId(params.email);
  if (!user) {
    return { success: false, error: 'Không tìm thấy người dùng' };
  }

  // ROOT ADMIN SAFETY: Không cho tự khóa hoặc tự hạ quyền chính mình
  if (params.operatorEmail && params.operatorEmail.toLowerCase() === user.email.toLowerCase()) {
    if (params.isBlocked === true) {
      return {
        success: false,
        error: 'Quy tắc an toàn Quản trị: Không thể tự khóa tài khoản Quản trị viên của chính mình.',
      };
    }
    if (params.role && params.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Quy tắc an toàn Quản trị: Không thể tự thu hồi quyền Quản trị viên của chính mình.',
      };
    }
  }

  if (params.role !== undefined) user.role = params.role;
  if (params.plan !== undefined) {
    user.plan = params.plan;
    if (params.plan === 'LICENSED') {
      if (user.role !== 'ADMIN') user.role = 'LICENSED';
      user.quota = { easy: 9999, advanced: 9999 };
      user.licenseExpiresAt = params.expiresAt !== undefined ? params.expiresAt : user.licenseExpiresAt;
    } else if (params.plan === 'TRIAL') {
      if (user.role !== 'ADMIN') user.role = 'TRIAL';
      user.licenseExpiresAt = null;
    }
  }
  if (params.expiresAt !== undefined) {
    user.licenseExpiresAt = params.expiresAt;
  }
  if (params.quota !== undefined) user.quota = params.quota;
  if (params.isBlocked !== undefined) {
    user.isBlocked = params.isBlocked;
    if (params.isBlocked && user.role !== 'ADMIN') {
      user.role = 'BLOCKED';
    } else if (!params.isBlocked && user.role === 'BLOCKED') {
      user.role = user.plan === 'LICENSED' ? 'LICENSED' : 'TRIAL';
    }
  }

  saveStore();
  return { success: true, user };
}

export function getSystemSettings(): SystemSettings {
  if (!store.settings) {
    store.settings = {
      guestEasyLimit: 3,
      guestAdvancedLimit: 1,
      trialEasyLimit: 5,
      trialAdvancedLimit: 2,
      freeAccessEnabled: false,
      freeAccessName: 'Chương trình Trải nghiệm Giáo dục',
      freeAccessStart: '',
      freeAccessEnd: '',
    };
    saveStore();
  }
  return store.settings;
}

export function updateSystemSettings(partial: Partial<SystemSettings>): SystemSettings {
  const current = getSystemSettings();
  store.settings = { ...current, ...partial };
  saveStore();
  return store.settings;
}

export function getAllLicenses(): LicenseItem[] {
  const list = Object.values(store.licenses);
  return list.map(l => ({
    ...l,
    boundDevices: l.boundDevices || [],
    status: l.status || (l.assignedEmail ? 'ACTIVE' : 'UNUSED'),
  })).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export function adminGenerateLicense(params: {
  plan?: LicensePlan;
  durationMonths?: number; // 0 or undefined = lifetime
  maxDevices?: number;
  assignedEmail?: string;
  customerNote?: string;
  reason?: string;
}): LicenseItem {
  const plan = params.plan || 'PRO';
  const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `SKKN-${plan === 'SCHOOL' ? 'SCHOOL' : 'PRO'}-${randPart1}-${randPart2}`;

  let expiresAt: string | null = null;
  if (params.durationMonths && params.durationMonths > 0) {
    const d = new Date();
    d.setMonth(d.getMonth() + params.durationMonths);
    expiresAt = d.toISOString();
  }

  const now = new Date().toISOString();
  const lic: LicenseItem = {
    key,
    plan,
    maxDevices: params.maxDevices && params.maxDevices > 0 ? params.maxDevices : (plan === 'SCHOOL' ? 5 : 1),
    boundDevices: [],
    assignedEmail: params.assignedEmail || undefined,
    status: params.assignedEmail ? 'ACTIVE' : 'UNUSED',
    expiresAt,
    customerNote: params.customerNote || params.reason || '',
    createdReason: params.reason || `Mã tạo bởi Quản trị viên (${params.durationMonths ? `${params.durationMonths} tháng` : 'Vĩnh viễn'})`,
    createdAt: now,
  };

  store.licenses[key] = lic;
  saveStore();
  return lic;
}

export function adminResetLicenseDevices(params: {
  key: string;
  deviceId?: string;
}): { success: boolean; license?: LicenseItem; error?: string } {
  const lic = store.licenses[params.key];
  if (!lic) {
    return { success: false, error: 'Không tìm thấy mã bản quyền trên hệ thống.' };
  }

  lic.boundDevices = lic.boundDevices || [];

  if (params.deviceId) {
    lic.boundDevices = lic.boundDevices.filter(d => d.deviceId !== params.deviceId);
  } else {
    // Reset all devices
    lic.boundDevices = [];
  }

  saveStore();
  return { success: true, license: lic };
}

export function adminToggleLicenseStatus(params: {
  key: string;
  status: LicenseStatus;
}): { success: boolean; license?: LicenseItem; error?: string } {
  const lic = store.licenses[params.key];
  if (!lic) {
    return { success: false, error: 'Không tìm thấy mã bản quyền.' };
  }

  lic.status = params.status;

  // Nếu thu hồi mã, và có tài khoản đang dùng mã này, hạ quyền người dùng
  if (params.status === 'REVOKED' && lic.assignedEmail) {
    const user = findUserByEmailOrId(lic.assignedEmail);
    if (user && user.licenseKey === params.key && user.role !== 'ADMIN') {
      user.role = 'TRIAL';
      user.plan = 'TRIAL';
      user.licenseKey = undefined;
    }
  } else if (params.status === 'ACTIVE' && lic.assignedEmail) {
    const user = findUserByEmailOrId(lic.assignedEmail);
    if (user && user.role !== 'ADMIN') {
      user.role = 'LICENSED';
      user.plan = lic.plan || 'LICENSED';
      user.licenseKey = params.key;
      user.licenseExpiresAt = lic.expiresAt;
      user.quota = { easy: 9999, advanced: 9999 };
    }
  }

  saveStore();
  return { success: true, license: lic };
}

export function adminDeleteLicense(key: string): { success: boolean; error?: string } {
  if (!store.licenses[key]) {
    return { success: false, error: 'Không tìm thấy mã bản quyền để xóa.' };
  }
  delete store.licenses[key];
  saveStore();
  return { success: true };
}

// Initial load
loadStore();
