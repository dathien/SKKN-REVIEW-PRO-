import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserAccount, GuestSession, LicenseItem, LicenseStatus, SystemStats, UserRole, LicensePlan, SystemSettings } from '../types/index';

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

export const ROOT_ADMIN_EMAILS: string[] = [
  'dathien2412@gmail.com',
];

// Initialize default sample licenses and Root Admin
function initDefaultData() {
  const now = new Date().toISOString();

  // Ensure Root Admin account is always present and has full ADMIN rights
  ROOT_ADMIN_EMAILS.forEach(adminEmail => {
    if (!store.users[adminEmail]) {
      store.users[adminEmail] = {
        id: 'admin_root_' + adminEmail.split('@')[0],
        email: adminEmail,
        name: 'Đa Thiện Hồ Nguyễn',
        role: 'ADMIN',
        plan: 'PRO',
        quota: { easy: -1, advanced: -1 },
        licenseKey: 'SKKN-ADMIN-SYSTEM',
        licenseExpiresAt: null,
        createdAt: now,
        lastActiveAt: now,
        isBlocked: false,
      };
    } else {
      // Đảm bảo không bị mất quyền ADMIN
      store.users[adminEmail].role = 'ADMIN';
      store.users[adminEmail].plan = 'PRO';
      store.users[adminEmail].isBlocked = false;
    }
  });

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
        settings: parsed.settings || undefined,
      };
      // Normalize licenses
      Object.values(store.licenses).forEach(lic => {
        lic.boundDevices = lic.boundDevices || [];
        if (!lic.status) {
          lic.status = lic.assignedEmail ? 'ACTIVE' : 'UNUSED';
        }
      });
      // Normalize users & PRO entitlements
      Object.values(store.users).forEach(u => {
        if (!u) return;
        const isRootAdmin = ROOT_ADMIN_EMAILS.includes(u.email?.toLowerCase());
        if (isRootAdmin) {
          u.role = 'ADMIN';
          u.plan = 'PRO';
          u.quota = { easy: -1, advanced: -1 };
          u.licenseKey = 'SKKN-ADMIN-SYSTEM';
          u.isBlocked = false;
          return;
        }
        // Normalize plan: LICENSED or PRO variants -> PRO
        const planUpper = String(u.plan || '').toUpperCase().trim();
        if (planUpper === 'LICENSED' || planUpper.includes('PRO')) {
          u.plan = 'PRO';
        }
        // Normalize role & quota for PRO / LICENSED accounts
        if (u.plan === 'PRO' || u.plan === 'PREMIUM' || u.plan === 'SCHOOL' || u.role === 'LICENSED') {
          if (u.role !== 'BLOCKED') {
            u.role = 'LICENSED';
          }
          if (u.quota?.easy === 3 && u.quota?.advanced === 1) {
            u.quota = { easy: -1, advanced: -1 };
          }
        }
      });
      // Ensure Nguyễn Thị Thanh Tâm account integrity
      const tamEmail = 'nguyenthithanhtam3410@gmail.com';
      if (store.users[tamEmail]) {
        store.users[tamEmail].role = 'LICENSED';
        store.users[tamEmail].plan = 'PRO';
        store.users[tamEmail].quota = { easy: -1, advanced: -1 };
        store.users[tamEmail].licenseKey = store.users[tamEmail].licenseKey || 'SKKN-PRO-THANHTAM-VIP';
        store.users[tamEmail].licenseExpiresAt = null;
        store.users[tamEmail].isBlocked = false;
      }
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
export interface MappedUserData {
  id?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  plan?: LicensePlan;
  quota?: { easy: number; advanced: number };
  licenseKey?: string;
  licenseExpiresAt?: string | null;
  isBlocked?: boolean;
  freeAccess?: boolean;
  freeAccessName?: string;
  freeAccessExpiresAt?: string | null;
}

export function mapRawSheetUserToAccount(raw: any): MappedUserData | null {
  if (!raw) return null;

  const id = raw.id || raw.ID || raw.userId || raw.USER_ID || '';
  const email = String(raw.email || raw.EMAIL || raw.userEmail || raw.USER_EMAIL || '').toLowerCase().trim();
  if (!email && !raw.role && !raw.plan) return null;

  const name = raw.name || raw.NAME || raw.fullName || raw.FULL_NAME || '';

  // Plan: Chuẩn hóa mọi biến thể Pro/PRO/pro/VIP/LICENSED/PREMIUM/SCHOOL -> PRO/PREMIUM/SCHOOL
  const rawPlan = String(raw.plan || raw.PLAN || raw.package || raw.PACKAGE || '').toUpperCase().trim();
  let plan: LicensePlan = 'TRIAL';
  if (rawPlan === 'SCHOOL' || rawPlan.includes('SCHOOL')) {
    plan = 'SCHOOL';
  } else if (rawPlan === 'PREMIUM' || rawPlan.includes('PREMIUM')) {
    plan = 'PREMIUM';
  } else if (
    rawPlan === 'PRO' ||
    rawPlan.includes('PRO') ||
    rawPlan === 'LICENSED' ||
    rawPlan === 'VIP' ||
    raw.role === 'LICENSED' ||
    raw.role === 'PRO'
  ) {
    plan = 'PRO';
  }

  // Role: Phân biệt vai trò quản trị (ADMIN), người dùng thông thường (USER/TRIAL) và quyền sử dụng (LICENSED)
  // Tuyệt đối không hiểu nhầm ROLE = USER là TRIAL nếu PLAN là PRO/SCHOOL/PREMIUM!
  const rawRole = String(raw.role || raw.ROLE || raw.userRole || raw.USER_ROLE || '').toUpperCase().trim();
  let role: UserRole;
  if (rawRole === 'ADMIN') {
    role = 'ADMIN';
  } else if (rawRole === 'BLOCKED') {
    role = 'BLOCKED';
  } else if (rawRole === 'FREE_ACCESS' || rawRole === 'FREE') {
    role = 'FREE_ACCESS';
  } else if (rawRole === 'LICENSED' || rawRole === 'PRO' || plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM') {
    role = 'LICENSED';
  } else {
    role = 'TRIAL';
  }

  // Root Admin luôn là ADMIN / PRO
  if (ROOT_ADMIN_EMAILS.includes(email)) {
    role = 'ADMIN';
    plan = 'PRO';
  }

  function parseQuotaVal(v: any, fallback: number): number {
    if (v === undefined || v === null || v === '') return fallback;
    const str = String(v).trim().toUpperCase();
    if (str === 'UNLIMITED' || str === '-1') return -1;
    const num = Number(str);
    if (isNaN(num)) return fallback;
    return Math.max(0, num);
  }

  // Quotas: Nếu là tài khoản PRO, SCHOOL, PREMIUM hoặc role ADMIN / LICENSED -> Mặc định là UNLIMITED (-1)
  const isUnlimitedPlan = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'ADMIN' || role === 'LICENSED' || role === 'FREE_ACCESS');
  const defaultEasy = isUnlimitedPlan ? -1 : 3;
  const defaultAdvanced = isUnlimitedPlan ? -1 : 1;

  let easyQuota = defaultEasy;
  let advancedQuota = defaultAdvanced;

  if (raw.quota?.easy !== undefined) easyQuota = parseQuotaVal(raw.quota.easy, defaultEasy);
  else if (raw.quotaEasy !== undefined) easyQuota = parseQuotaVal(raw.quotaEasy, defaultEasy);
  else if (raw.QUOTA_EASY !== undefined) easyQuota = parseQuotaVal(raw.QUOTA_EASY, defaultEasy);
  else if (raw.easyLimit !== undefined || raw.EASY_LIMIT !== undefined) {
    // Schema 13 cột cũ
    const limitRaw = raw.easyLimit !== undefined ? raw.easyLimit : raw.EASY_LIMIT;
    const limitParsed = parseQuotaVal(limitRaw, defaultEasy);
    if (limitParsed === -1) {
      easyQuota = -1;
    } else {
      const used = Number(raw.easyUsed !== undefined ? raw.easyUsed : (raw.EASY_USED || 0));
      easyQuota = Math.max(0, limitParsed - (isNaN(used) ? 0 : used));
    }
  }

  if (raw.quota?.advanced !== undefined) advancedQuota = parseQuotaVal(raw.quota.advanced, defaultAdvanced);
  else if (raw.quotaAdvanced !== undefined) advancedQuota = parseQuotaVal(raw.quotaAdvanced, defaultAdvanced);
  else if (raw.QUOTA_ADVANCED !== undefined) advancedQuota = parseQuotaVal(raw.QUOTA_ADVANCED, defaultAdvanced);
  else if (raw.advancedLimit !== undefined || raw.ADVANCED_LIMIT !== undefined) {
    // Schema 13 cột cũ
    const limitRaw = raw.advancedLimit !== undefined ? raw.advancedLimit : raw.ADVANCED_LIMIT;
    const limitParsed = parseQuotaVal(limitRaw, defaultAdvanced);
    if (limitParsed === -1) {
      advancedQuota = -1;
    } else {
      const used = Number(raw.advancedUsed !== undefined ? raw.advancedUsed : (raw.ADVANCED_USED || 0));
      advancedQuota = Math.max(0, limitParsed - (isNaN(used) ? 0 : used));
    }
  }

  // Status & Blocked
  const statusStr = String(raw.status || raw.STATUS || '').toUpperCase().trim();
  const isBlocked = statusStr === 'BLOCKED' || raw.isBlocked === true || role === 'BLOCKED';

  const licenseKey = raw.licenseKey || raw.LICENSE_KEY || raw.key || raw.KEY || undefined;
  const licenseExpiresAt = raw.licenseExpiresAt || raw.expiresAt || raw.EXPIRES_AT || null;

  return {
    id: id || undefined,
    email: email || undefined,
    name: name || undefined,
    role,
    plan,
    quota: { easy: easyQuota, advanced: advancedQuota },
    licenseKey: licenseKey ? String(licenseKey) : undefined,
    licenseExpiresAt: licenseExpiresAt ? String(licenseExpiresAt) : null,
    isBlocked,
    freeAccess: Boolean(raw.freeAccess || role === 'FREE_ACCESS'),
    freeAccessName: raw.freeAccessName || raw.campaignName,
    freeAccessExpiresAt: raw.freeAccessExpiresAt || licenseExpiresAt,
  };
}

export async function fetchUserFromLicenseApi(
  email: string,
  sub?: string
): Promise<MappedUserData | null> {
  if (!process.env.LICENSE_API_URL) return null;
  const targetEmail = email.toLowerCase().trim();

  // 1. Thử gọi POST an toàn có serverSecret qua request body (không lộ trên URL)
  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getUser',
        email: targetEmail,
        serverSecret: process.env.APPS_SCRIPT_SECRET || '',
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data?.found && data?.user) {
        const mapped = mapRawSheetUserToAccount(data.user);
        if (mapped) return mapped;
      } else if (data?.email || data?.role || data?.plan) {
        const mapped = mapRawSheetUserToAccount(data);
        if (mapped) return mapped;
      }
    }
  } catch (err) {
    console.warn('Could not query user role from LICENSE_API_URL via POST:', err);
  }

  // 2. Thử gọi GET fallback (không truyền secret qua URL)
  try {
    const url = new URL(process.env.LICENSE_API_URL);
    url.searchParams.set('action', 'getUser');
    url.searchParams.set('email', targetEmail);
    if (sub) url.searchParams.set('sub', sub);

    const resp = await fetch(url.toString(), { method: 'GET', signal: AbortSignal.timeout(4000) });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      const rawUser = data?.user || (data?.email || data?.role || data?.plan ? data : null);
      if (rawUser) {
        const mapped = mapRawSheetUserToAccount(rawUser);
        if (mapped) return mapped;
      }
    }
  } catch (_) {}

  return null;
}

export function isUserAdmin(identifier?: string): boolean {
  if (!identifier) return false;
  const user = findUserByEmailOrId(identifier);
  return user?.role === 'ADMIN';
}

// ----------------- ADMIN SESSIONS & TOKEN VERIFICATION -----------------
export interface AdminSession {
  token: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

function getSessionSecret(): string {
  return process.env.APPS_SCRIPT_SECRET || process.env.SESSION_SECRET || 'skkn_secure_session_secret_2026';
}

export function createAdminSession(email: string, role = 'ADMIN'): string {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `${cleanEmail}|${role}|${expiresAt}`;
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  const token = `skkn_sess_${Buffer.from(payload).toString('base64url')}.${sig}`;

  // Lưu thêm vào globalThis để đồng bộ giữa các module trong cùng process
  const g = globalThis as any;
  g.__skkn_sessions = g.__skkn_sessions || {};
  g.__skkn_sessions[token] = { email: cleanEmail, role, expiresAt };

  return token;
}

export function verifyAdminSessionToken(token: string): { email: string; role: string } | null {
  if (!token) return null;
  const clean = token.replace(/^Bearer\s+/i, '').trim();

  // 1. Kiểm tra Signed Token độc lập không phụ thuộc shared memory
  if (clean.startsWith('skkn_sess_')) {
    const withoutPrefix = clean.slice('skkn_sess_'.length);
    const dotIdx = withoutPrefix.indexOf('.');
    if (dotIdx !== -1) {
      const b64Payload = withoutPrefix.slice(0, dotIdx);
      const sig = withoutPrefix.slice(dotIdx + 1);
      try {
        const payload = Buffer.from(b64Payload, 'base64url').toString('utf-8');
        const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
        if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
          const parts = payload.split('|');
          const email = parts[0];
          const role = parts[1] || 'ADMIN';
          const expiresAt = Number(parts[2]);
          if (expiresAt > Date.now()) {
            return { email: email.toLowerCase().trim(), role };
          }
        }
      } catch {}
    }
  }

  // 2. Kiểm tra bộ nhớ global
  const g = globalThis as any;
  if (g.__skkn_sessions && g.__skkn_sessions[clean]) {
    const s = g.__skkn_sessions[clean];
    if (s.expiresAt > Date.now()) {
      return { email: s.email, role: s.role };
    }
  }

  return null;
}

export function verifyGoogleIdToken(token: string): { email: string; name?: string } | null {
  if (!token || typeof token !== 'string') return null;
  const clean = token.replace(/^Bearer\s+/i, '').trim();
  const parts = clean.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    if (payload.iss && !payload.iss.includes('accounts.google.com')) {
      return null;
    }
    if (payload.email) {
      return {
        email: String(payload.email).toLowerCase().trim(),
        name: payload.name,
      };
    }
  } catch {}
  return null;
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
  const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);

  if (!user) {
    const userId = profile.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const role: UserRole = isRootAdmin ? 'ADMIN' : (remoteData?.role || 'TRIAL');
    const plan: LicensePlan = isRootAdmin ? 'PRO' : (remoteData?.plan || (role === 'ADMIN' ? 'PRO' : 'TRIAL'));

    const defaultTrialEasy = store.settings?.trialEasyLimit ?? 3;
    const defaultTrialAdvanced = store.settings?.trialAdvancedLimit ?? 1;
    const isUnlimited = isRootAdmin || plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'ADMIN' || role === 'LICENSED';
    const quota = isUnlimited
      ? { easy: -1, advanced: -1 }
      : (remoteData?.quota || { easy: defaultTrialEasy, advanced: defaultTrialAdvanced });

    user = {
      id: userId,
      email,
      name: isRootAdmin ? (profile.name || 'Đa Thiện Hồ Nguyễn') : (remoteData?.name || profile.name || email.split('@')[0]),
      picture: profile.picture,
      role,
      plan,
      quota,
      licenseKey: isRootAdmin ? 'SKKN-ADMIN-SYSTEM' : (remoteData?.licenseKey || (role === 'ADMIN' ? 'SKKN-ADMIN-SYSTEM' : undefined)),
      licenseExpiresAt: remoteData?.licenseExpiresAt || null,
      freeAccess: remoteData?.freeAccess || role === 'FREE_ACCESS',
      freeAccessName: remoteData?.freeAccessName,
      freeAccessExpiresAt: remoteData?.freeAccessExpiresAt,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isBlocked: isRootAdmin ? false : role === 'BLOCKED',
    };
    store.users[email] = user;
    saveStore();
  } else {
    // Nếu là Root Admin, luôn đảm bảo quyền ADMIN cao nhất
    if (isRootAdmin) {
      user.role = 'ADMIN';
      user.plan = 'PRO';
      user.isBlocked = false;
      user.licenseKey = 'SKKN-ADMIN-SYSTEM';
      user.quota = { easy: -1, advanced: -1 };
    } else {
      // Nếu có phân quyền cập nhật từ Google Sheets / License API thì đồng bộ
      if (remoteData?.role) {
        user.role = remoteData.role;
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
      if (remoteData?.licenseKey) {
        user.licenseKey = remoteData.licenseKey;
      }
      if (remoteData?.licenseExpiresAt !== undefined) {
        user.licenseExpiresAt = remoteData.licenseExpiresAt;
      }
      if (remoteData?.name) {
        user.name = remoteData.name;
      } else if (profile.name) {
        user.name = profile.name;
      }
      // Bảo đảm PRO / LICENSED luôn có quota không giới hạn
      if (user.plan === 'PRO' || user.plan === 'SCHOOL' || user.plan === 'PREMIUM' || user.role === 'LICENSED') {
        user.quota = { easy: -1, advanced: -1 };
      } else if (remoteData?.quota) {
        user.quota = remoteData.quota;
      }
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

      // LICENSED, ADMIN or FREE ACCESS or PRO plan -> Unlimited (không trừ lượt thực tế)
      if (
        user.role === 'LICENSED' ||
        user.role === 'ADMIN' ||
        user.role === 'FREE_ACCESS' ||
        Boolean(user.freeAccess) ||
        user.plan === 'PRO' ||
        user.plan === 'SCHOOL' ||
        user.plan === 'PREMIUM'
      ) {
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
      const resp = await fetch(process.env.LICENSE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyLicense',
          key,
          email: params.email,
          serverSecret: process.env.APPS_SCRIPT_SECRET || '',
        }),
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data && (data.valid === true || data.status === 'ACTIVE' || data.success === true)) {
          const licInfo = data.license || data;
          lic = {
            key,
            plan: licInfo.plan || data.plan || 'PRO',
            maxDevices: licInfo.maxDevices || data.maxDevices || 1,
            boundDevices: [],
            status: 'UNUSED',
            expiresAt: licInfo.expiresAt || data.expiresAt || null,
            createdReason: 'Xác thực từ Google Apps Script License API',
            createdAt: now,
          };
          store.licenses[key] = lic;
        }
      }
    } catch (apiErr) {
      console.warn('Could not reach LICENSE_API_URL via POST, trying fallback:', apiErr);
      try {
        const url = new URL(process.env.LICENSE_API_URL);
        url.searchParams.set('action', 'verifyLicense');
        url.searchParams.set('key', key);
        url.searchParams.set('email', params.email);
        const resp = await fetch(url.toString(), { method: 'GET' });
        if (resp.ok) {
          const data = await resp.json().catch(() => null);
          if (data && (data.valid === true || data.status === 'ACTIVE' || data.success === true)) {
            const licInfo = data.license || data;
            lic = {
              key,
              plan: licInfo.plan || data.plan || 'PRO',
              maxDevices: licInfo.maxDevices || data.maxDevices || 1,
              boundDevices: [],
              status: 'UNUSED',
              expiresAt: licInfo.expiresAt || data.expiresAt || null,
              createdReason: 'Xác thực từ Google Apps Script License API',
              createdAt: now,
            };
            store.licenses[key] = lic;
          }
        }
      } catch (_) {}
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

export function getSystemStats(): SystemStats {
  const usersList = Object.values(store.users);
  const isLicensedUser = (u: UserAccount) =>
    u.role === 'LICENSED' ||
    u.plan === 'PRO' ||
    u.plan === 'PREMIUM' ||
    u.plan === 'SCHOOL' ||
    u.plan === 'LICENSED' ||
    u.role === 'ADMIN' ||
    u.quota?.easy === -1;

  const licensedUsers = usersList.filter(isLicensedUser).length;
  const trialUsers = usersList.filter(u => !isLicensedUser(u) && u.role !== 'BLOCKED' && !u.isBlocked).length;
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

export async function checkSheetCompatibility(): Promise<{
  success: boolean;
  compatible: boolean;
  version?: string;
  schemaType?: string;
  columnCount?: number;
  headers?: string[];
  message: string;
  error?: string;
}> {
  if (!process.env.LICENSE_API_URL) {
    return {
      success: false,
      compatible: true,
      message: 'LICENSE_API_URL chưa cấu hình trên môi trường này (sử dụng cơ sở dữ liệu cục bộ).',
    };
  }

  try {
    const url = new URL(process.env.LICENSE_API_URL);
    // 1. Thử gọi action inspectSchema (Code.gs v2.7+)
    url.searchParams.set('action', 'inspectSchema');
    const resp = await fetch(url.toString(), { method: 'GET', signal: AbortSignal.timeout(4000) });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.usersSchema) {
        return {
          success: true,
          compatible: Boolean(data.usersSchema.compatible),
          version: data.version || '2.7',
          schemaType: data.usersSchema.type,
          columnCount: data.usersSchema.columnCount,
          headers: data.usersSchema.headers,
          message: `Cấu trúc Google Sheets hoàn toàn tương thích (${data.usersSchema.type}, ${data.usersSchema.columnCount} cột).`,
        };
      }
    }

    // 2. Fallback: Kiểm tra bằng ping hoặc getUser
    const pingUrl = new URL(process.env.LICENSE_API_URL);
    pingUrl.searchParams.set('action', 'ping');
    const pingResp = await fetch(pingUrl.toString(), { method: 'GET', signal: AbortSignal.timeout(4000) });
    if (pingResp.ok) {
      const pingData = await pingResp.json().catch(() => null);
      if (pingData?.success) {
        return {
          success: true,
          compatible: true,
          version: pingData.version || 'v2.x',
          schemaType: 'COMPATIBLE_FALLBACK',
          message: 'Kết nối Apps Script thành công. Lớp tương thích ngược tự động nhận diện schema 13 cột hoặc 12 cột.',
        };
      }
    }

    return {
      success: false,
      compatible: false,
      message: 'Apps Script phản hồi không đúng định dạng. Cần kiểm tra lại mã nguồn triển khai.',
    };
  } catch (err: any) {
    return {
      success: false,
      compatible: false,
      message: `Không thể kết nối đến Google Sheets Apps Script: ${err.message}`,
      error: err.message,
    };
  }
}

export async function getAllUsersAndGuests() {
  if (process.env.LICENSE_API_URL) {
    try {
      const resp = await fetch(process.env.LICENSE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getUsers',
          operatorEmail: 'dathien2412@gmail.com',
          isBackendAuthorized: true,
          serverSecret: process.env.APPS_SCRIPT_SECRET || '',
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
        list.forEach((u: any) => {
          if (u) {
            const mapped = mapRawSheetUserToAccount(u);
            if (mapped && mapped.email) {
              const email = mapped.email;
              const existing = store.users[email];
              const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
              const role: UserRole = isRootAdmin ? 'ADMIN' : (mapped.role || 'TRIAL');
              const plan: LicensePlan = isRootAdmin ? 'PRO' : (mapped.plan || (role === 'ADMIN' ? 'PRO' : 'TRIAL'));
              const isUnlimited = isRootAdmin || plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'LICENSED';
              const quota = isUnlimited ? { easy: -1, advanced: -1 } : (mapped.quota || { easy: 3, advanced: 1 });

              if (!existing) {
                store.users[email] = {
                  id: mapped.id || `usr_sheet_${email.split('@')[0]}`,
                  email,
                  name: mapped.name || (isRootAdmin ? 'Đa Thiện Hồ Nguyễn' : email.split('@')[0]),
                  role,
                  plan,
                  quota,
                  licenseKey: mapped.licenseKey || (isRootAdmin ? 'SKKN-ADMIN-SYSTEM' : undefined),
                  licenseExpiresAt: mapped.licenseExpiresAt || null,
                  createdAt: new Date().toISOString(),
                  lastActiveAt: new Date().toISOString(),
                  isBlocked: isRootAdmin ? false : Boolean(mapped.isBlocked),
                };
              } else {
                // Cập nhật người dùng hiện có từ dữ liệu mới nhất của Google Sheets
                if (!isRootAdmin) {
                  existing.role = role;
                  existing.plan = plan;
                  existing.isBlocked = Boolean(mapped.isBlocked);
                }
                if (mapped.name) existing.name = mapped.name;
                if (mapped.licenseKey) existing.licenseKey = mapped.licenseKey;
                if (mapped.licenseExpiresAt !== undefined) existing.licenseExpiresAt = mapped.licenseExpiresAt;
                existing.quota = quota;
              }
            }
          }
        });
      }
    } catch (_) {
      // Silently continue if LICENSE_API_URL is unavailable or offline
    }
  }

  return {
    users: Object.values(store.users),
    guests: Object.values(store.guests),
    licenses: Object.values(store.licenses),
  };
}

export async function adminUpdateUser(params: {
  operatorEmail?: string;
  email: string;
  name?: string;
  newEmail?: string;
  role?: UserRole;
  plan?: LicensePlan;
  quota?: { easy: number; advanced: number };
  isBlocked?: boolean;
  expiresAt?: string | null;
}): Promise<{ success: boolean; user?: UserAccount; error?: string; sheetSynced?: boolean; warning?: string; message?: string }> {
  const user = findUserByEmailOrId(params.email);
  if (!user) {
    return { success: false, error: 'Không tìm thấy người dùng' };
  }

  const isTargetRoot = ROOT_ADMIN_EMAILS.includes(user.email.toLowerCase());

  // ROOT ADMIN SAFETY: Không cho tự khóa hoặc tự hạ quyền chính mình
  if (isTargetRoot) {
    if (params.isBlocked === true) {
      return {
        success: false,
        error: 'Quy tắc an toàn Quản trị: Không thể khóa tài khoản Root Admin.',
      };
    }
    if (params.role && params.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Quy tắc an toàn Quản trị: Không thể tự thu hồi quyền Quản trị viên của Root Admin.',
      };
    }
  }

  // Backup snapshot in case of failure
  const oldUserSnapshot: UserAccount = JSON.parse(JSON.stringify(user));
  const oldEmail = user.email.toLowerCase();

  // 1. Cập nhật họ tên
  if (params.name !== undefined && params.name.trim()) {
    user.name = params.name.trim();
  }

  // 2. Thay đổi email có kiểm tra trùng và bảo toàn định danh tài khoản
  let emailChanged = false;
  let newEmailNormalized = '';
  if (params.newEmail) {
    newEmailNormalized = params.newEmail.trim().toLowerCase();
    if (!newEmailNormalized || !newEmailNormalized.includes('@')) {
      return { success: false, error: 'Địa chỉ email mới không hợp lệ.' };
    }
    if (newEmailNormalized !== oldEmail) {
      if (isTargetRoot) {
        return { success: false, error: 'Bảo mật: Không được phép thay đổi email của Root Admin.' };
      }
      // Kiểm tra trùng email
      const existingUserWithNewEmail = findUserByEmailOrId(newEmailNormalized);
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== user.id) {
        return {
          success: false,
          error: `Email "${newEmailNormalized}" đã được sử dụng bởi một tài khoản khác trong hệ thống.`,
        };
      }

      // Cập nhật email và bảo toàn định danh (user.id giữ nguyên)
      user.email = newEmailNormalized;
      emailChanged = true;
      delete store.users[oldEmail];
      store.users[newEmailNormalized] = user;

      // Bảo toàn liên kết bản quyền nếu có
      Object.values(store.licenses).forEach(lic => {
        if (lic.assignedEmail && lic.assignedEmail.toLowerCase() === oldEmail) {
          lic.assignedEmail = newEmailNormalized;
        }
      });
    }
  }

  // 3. Cập nhật vai trò & gói bản quyền
  if (params.role !== undefined) {
    user.role = isTargetRoot ? 'ADMIN' : params.role;
  }
  if (params.plan !== undefined) {
    const rawP = String(params.plan).toUpperCase().trim();
    const normalizedPlan = (rawP === 'LICENSED' || rawP.includes('PRO')) ? 'PRO' : params.plan;
    user.plan = isTargetRoot ? 'PRO' : normalizedPlan;

    if (user.plan === 'PRO' || user.plan === 'PREMIUM' || user.plan === 'SCHOOL' || user.role === 'LICENSED') {
      if (user.role !== 'ADMIN') user.role = 'LICENSED';
      user.quota = { easy: -1, advanced: -1 };
      user.licenseExpiresAt = params.expiresAt !== undefined ? params.expiresAt : user.licenseExpiresAt;
    } else if (user.plan === 'TRIAL') {
      if (user.role !== 'ADMIN') user.role = 'TRIAL';
      user.licenseExpiresAt = null;
      if (!params.quota) {
        user.quota = {
          easy: store.settings?.trialEasyLimit ?? 3,
          advanced: store.settings?.trialAdvancedLimit ?? 1,
        };
      }
    }
  }

  // 4. Gia hạn / cập nhật ngày hết hạn bản quyền
  if (params.expiresAt !== undefined) {
    user.licenseExpiresAt = params.expiresAt;
  }

  // 5. Cập nhật lượt Trial
  if (params.quota !== undefined) {
    user.quota = params.quota;
  }

  // 6. Khóa / Mở khóa
  if (params.isBlocked !== undefined) {
    if (isTargetRoot) {
      user.isBlocked = false;
    } else {
      user.isBlocked = params.isBlocked;
      if (params.isBlocked) {
        user.role = 'BLOCKED';
      } else if (user.role === 'BLOCKED') {
        user.role = (user.plan === 'PRO' || user.plan === 'LICENSED' || user.plan === 'PREMIUM' || user.plan === 'SCHOOL') ? 'LICENSED' : 'TRIAL';
      }
    }
  }

  user.lastActiveAt = new Date().toISOString();
  saveStore();

  // 7. Đồng bộ an toàn xuống Google Sheets
  if (process.env.LICENSE_API_URL) {
    const sheetRes = await syncUserToGoogleSheet(user, {
      operatorEmail: params.operatorEmail,
      explicitQuota: params.quota !== undefined,
      previousEmail: emailChanged ? oldEmail : undefined,
    });

    if (!sheetRes.success) {
      // Khi ghi thất bại, khôi phục lại dữ liệu cũ và báo lỗi cụ thể
      if (emailChanged) {
        delete store.users[user.email];
      }
      store.users[oldEmail] = oldUserSnapshot;
      saveStore();
      return {
        success: false,
        error: `Lưu thất bại lên Google Sheets: ${sheetRes.error || 'Apps Script không phản hồi'}. Dữ liệu cũ đã được khôi phục nguyên vẹn.`,
      };
    }

    return {
      success: true,
      user,
      sheetSynced: true,
      message: 'Đã cập nhật và xác nhận lưu thành công xuống Google Sheets USERS.',
    };
  }

  return { success: true, user, sheetSynced: false, message: 'Đã cập nhật thông tin người dùng thành công.' };
}

export async function adminCreateUser(params: {
  email: string;
  name?: string;
  role?: UserRole;
  plan?: LicensePlan;
  quota?: { easy: number; advanced: number };
  expiresAt?: string | null;
}): Promise<{ success: boolean; user?: UserAccount; error?: string; sheetSynced?: boolean; warning?: string; message?: string }> {
  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email không hợp lệ' };
  }

  let user = findUserByEmailOrId(email);
  const now = new Date().toISOString();
  const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);

  if (user) {
    // Nếu user đã tồn tại, cập nhật quyền/gói/lượt nếu được chỉ định
    if (params.plan !== undefined) {
      const p = String(params.plan).toUpperCase().trim();
      user.plan = isRootAdmin ? 'PRO' : (p === 'LICENSED' || p.includes('PRO') ? 'PRO' : params.plan);
    }
    if (params.role !== undefined) user.role = isRootAdmin ? 'ADMIN' : params.role;
    if (user.plan === 'PRO' || user.plan === 'SCHOOL' || user.plan === 'PREMIUM' || user.role === 'LICENSED') {
      if (user.role !== 'ADMIN' && user.role !== 'BLOCKED') user.role = 'LICENSED';
      if (!params.quota) user.quota = { easy: -1, advanced: -1 };
    }
    if (params.name) user.name = params.name.trim();
    if (params.quota) user.quota = params.quota;
    if (params.expiresAt !== undefined) user.licenseExpiresAt = params.expiresAt;
    user.lastActiveAt = now;
    saveStore();

    if (process.env.LICENSE_API_URL) {
      const sheetRes = await syncUserToGoogleSheet(user);
      if (!sheetRes.success) {
        return {
          success: true,
          user,
          sheetSynced: false,
          warning: 'Cập nhật thành công vào cơ sở dữ liệu ứng dụng. Lưu ý: Google Sheets chưa ghi nhận (DEPLOY REQUIRED: Cần cập nhật Code.gs v2.7).',
        };
      }
      return { success: true, user, sheetSynced: true, message: 'Đã cập nhật và xác nhận lưu thành công xuống Google Sheets USERS.' };
    }

    return { success: true, user, sheetSynced: false };
  }

  let planCandidate: LicensePlan = params.plan || 'TRIAL';
  const rawP = String(planCandidate).toUpperCase().trim();
  if (rawP === 'LICENSED' || rawP.includes('PRO')) {
    planCandidate = 'PRO';
  }
  const role: UserRole = isRootAdmin ? 'ADMIN' : (params.role || (planCandidate === 'PRO' ? 'LICENSED' : 'TRIAL'));
  const plan: LicensePlan = isRootAdmin ? 'PRO' : planCandidate;

  const isUnlimited = isRootAdmin || plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'LICENSED';
  const defaultTrialEasy = isUnlimited ? -1 : (store.settings?.trialEasyLimit ?? 3);
  const defaultTrialAdvanced = isUnlimited ? -1 : (store.settings?.trialAdvancedLimit ?? 1);

  const quota = params.quota || { easy: defaultTrialEasy, advanced: defaultTrialAdvanced };

  user = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email,
    name: params.name?.trim() || (isRootAdmin ? 'Đa Thiện Hồ Nguyễn' : email.split('@')[0]),
    role,
    plan,
    quota,
    licenseKey: isRootAdmin ? 'SKKN-ADMIN-SYSTEM' : (role === 'LICENSED' ? `SKKN-DIRECT-${Date.now().toString(36).toUpperCase()}` : undefined),
    licenseExpiresAt: params.expiresAt || null,
    createdAt: now,
    lastActiveAt: now,
    isBlocked: false,
  };

  store.users[email] = user;
  saveStore();

  if (process.env.LICENSE_API_URL) {
    const sheetRes = await syncUserToGoogleSheet(user);
    if (!sheetRes.success) {
      return {
        success: true,
        user,
        sheetSynced: false,
        warning: 'Tạo tài khoản thành công vào cơ sở dữ liệu ứng dụng. Lưu ý: Google Sheets chưa ghi nhận (DEPLOY REQUIRED: Cần cập nhật Code.gs v2.7).',
      };
    }
    return { success: true, user, sheetSynced: true, message: 'Đã tạo và xác nhận lưu thành công xuống Google Sheets USERS.' };
  }

  return { success: true, user, sheetSynced: false };
}

// ----------------- GOOGLE SHEETS USERS SYNCHRONIZATION -----------------
export async function syncUserToGoogleSheet(
  user: UserAccount,
  options?: { operatorEmail?: string; explicitQuota?: boolean; previousEmail?: string } | string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.LICENSE_API_URL) return { success: false, error: 'Chưa cấu hình LICENSE_API_URL' };
  try {
    const operatorEmail = typeof options === 'string' ? options : options?.operatorEmail;
    const explicitQuota = typeof options === 'object' ? Boolean(options?.explicitQuota) : false;
    const previousEmail = typeof options === 'object' ? options?.previousEmail : undefined;

    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveUser',
        id: user.id,
        email: user.email,
        previousEmail,
        name: user.name,
        role: user.role,
        plan: user.plan,
        quotaEasy: user.quota?.easy ?? (user.plan === 'PRO' ? -1 : 3),
        quotaAdvanced: user.quota?.advanced ?? (user.plan === 'PRO' ? -1 : 1),
        explicitQuota,
        licenseKey: user.licenseKey || '',
        licenseExpiresAt: user.licenseExpiresAt || '',
        isBlocked: Boolean(user.isBlocked),
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        operatorEmail: operatorEmail || 'dathien2412@gmail.com',
        isBackendAuthorized: true,
        serverSecret: process.env.APPS_SCRIPT_SECRET || '',
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.success === false) {
        return { success: false, error: data.error || 'Google Apps Script từ chối ghi dữ liệu' };
      }
      return { success: Boolean(data?.success ?? true) };
    }
    return { success: false, error: `HTTP ${resp.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUserFromGoogleSheet(
  email: string,
  options?: { operatorEmail?: string; permanent?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.LICENSE_API_URL) return { success: false, error: 'Chưa cấu hình LICENSE_API_URL' };
  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteUser',
        email,
        operatorEmail: options?.operatorEmail || 'dathien2412@gmail.com',
        isBackendAuthorized: true,
        permanent: false, // Mặc định chỉ khóa (soft-delete), tạm vô hiệu hóa hard-delete qua API
        serverSecret: process.env.APPS_SCRIPT_SECRET || '',
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.success === false) {
        return { success: false, error: data.error || 'Google Apps Script từ chối xóa dữ liệu' };
      }
      return { success: Boolean(data?.success ?? true) };
    }
    return { success: false, error: `HTTP ${resp.status}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncAllUsersToGoogleSheet(operatorEmail?: string): Promise<{
  success: boolean;
  syncedCount: number;
  totalCount: number;
  error?: string;
}> {
  const users = Object.values(store.users);
  if (!process.env.LICENSE_API_URL) {
    return { success: false, syncedCount: 0, totalCount: users.length, error: 'Chưa cấu hình LICENSE_API_URL' };
  }

  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncUsers',
        users,
        operatorEmail: operatorEmail || 'dathien2412@gmail.com',
        isBackendAuthorized: true,
        serverSecret: process.env.APPS_SCRIPT_SECRET || '',
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.success === false) {
        return { success: false, syncedCount: 0, totalCount: users.length, error: data.error || 'Lỗi đồng bộ Apps Script' };
      }
      return {
        success: true,
        syncedCount: data?.syncedCount ?? users.length,
        totalCount: users.length,
      };
    }

    // Fallback: Sync individually
    let synced = 0;
    for (const u of users) {
      const res = await syncUserToGoogleSheet(u, operatorEmail);
      if (res.success) synced++;
    }
    return { success: synced > 0, syncedCount: synced, totalCount: users.length };
  } catch (err: any) {
    return { success: false, syncedCount: 0, totalCount: users.length, error: err.message };
  }
}

export interface UserConflict {
  email: string;
  name: string;
  field: string;
  localValue: string;
  remoteValue: string;
}

export async function adminSyncGoogleSheets(params?: {
  previewOnly?: boolean;
  resolveStrategy?: 'keep_remote' | 'keep_local';
  confirmConflicts?: boolean;
}): Promise<{
  success: boolean;
  hasConflicts?: boolean;
  conflicts?: UserConflict[];
  localUsersCount: number;
  remoteUsersCount: number;
  syncedToRemoteCount: number;
  message: string;
  error?: string;
}> {
  let remoteUsersCount = 0;
  const conflicts: UserConflict[] = [];

  // 1. Pull latest from Google Sheets
  if (process.env.LICENSE_API_URL) {
    try {
      const resp = await fetch(process.env.LICENSE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getUsers',
          operatorEmail: 'dathien2412@gmail.com',
          isBackendAuthorized: true,
          serverSecret: process.env.APPS_SCRIPT_SECRET || '',
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
        remoteUsersCount = list.length;

        // Check conflicts
        list.forEach((u: any) => {
          if (u) {
            const mapped = mapRawSheetUserToAccount(u);
            if (mapped && mapped.email) {
              const email = mapped.email;
              const existing = store.users[email];
              if (existing) {
                const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
                const remoteRole = isRootAdmin ? 'ADMIN' : (mapped.role || 'TRIAL');
                const remotePlan = isRootAdmin ? 'PRO' : (mapped.plan || 'TRIAL');
                const remoteBlocked = isRootAdmin ? false : Boolean(mapped.isBlocked);

                if (existing.role !== remoteRole) {
                  conflicts.push({
                    email,
                    name: existing.name || mapped.name || email,
                    field: 'Vai trò (Role)',
                    localValue: existing.role,
                    remoteValue: remoteRole,
                  });
                }
                if (existing.plan !== remotePlan) {
                  conflicts.push({
                    email,
                    name: existing.name || mapped.name || email,
                    field: 'Gói (Plan)',
                    localValue: existing.plan,
                    remoteValue: remotePlan,
                  });
                }
                if (Boolean(existing.isBlocked) !== remoteBlocked) {
                  conflicts.push({
                    email,
                    name: existing.name || mapped.name || email,
                    field: 'Trạng thái khóa',
                    localValue: existing.isBlocked ? 'Đang khóa' : 'Hoạt động',
                    remoteValue: remoteBlocked ? 'Đang khóa' : 'Hoạt động',
                  });
                }
              }
            }
          }
        });

        // Nếu có xung đột và chưa được Admin xác nhận phương án xử lý
        if (conflicts.length > 0 && !params?.confirmConflicts && !params?.resolveStrategy) {
          return {
            success: true,
            hasConflicts: true,
            conflicts,
            localUsersCount: Object.keys(store.users).length,
            remoteUsersCount,
            syncedToRemoteCount: 0,
            message: `Phát hiện ${conflicts.length} xung đột dữ liệu giữa Web App và Google Sheets. Vui lòng xem trước và chọn phương án giải quyết.`,
          };
        }

        // Áp dụng dữ liệu theo phương án
        list.forEach((u: any) => {
          if (u) {
            const mapped = mapRawSheetUserToAccount(u);
            if (mapped && mapped.email) {
              const email = mapped.email;
              const existing = store.users[email];
              const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
              const role: UserRole = isRootAdmin ? 'ADMIN' : (mapped.role || 'TRIAL');
              const plan: LicensePlan = isRootAdmin ? 'PRO' : (mapped.plan || 'TRIAL');

              const isUnlimited = isRootAdmin || plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'LICENSED';
              const quota = isUnlimited ? { easy: -1, advanced: -1 } : (mapped.quota || { easy: 3, advanced: 1 });

              if (!existing) {
                store.users[email] = {
                  id: mapped.id || `usr_sheet_${email.split('@')[0]}`,
                  email,
                  name: mapped.name || (isRootAdmin ? 'Đa Thiện Hồ Nguyễn' : email.split('@')[0]),
                  role,
                  plan,
                  quota,
                  licenseKey: mapped.licenseKey || (isRootAdmin ? 'SKKN-ADMIN-SYSTEM' : undefined),
                  licenseExpiresAt: mapped.licenseExpiresAt || null,
                  createdAt: new Date().toISOString(),
                  lastActiveAt: new Date().toISOString(),
                  isBlocked: isRootAdmin ? false : Boolean(mapped.isBlocked),
                };
              } else if (params?.resolveStrategy === 'keep_remote') {
                // Cập nhật theo Google Sheets (an toàn không ghi đè quyền Root Admin)
                if (!isRootAdmin) {
                  existing.role = role;
                  existing.plan = plan;
                  existing.isBlocked = Boolean(mapped.isBlocked);
                }
                if (mapped.name) existing.name = mapped.name;
                if (mapped.licenseKey) existing.licenseKey = mapped.licenseKey;
                if (mapped.licenseExpiresAt !== undefined) existing.licenseExpiresAt = mapped.licenseExpiresAt;
                existing.quota = quota;
              }
            }
          }
        });

        saveStore();
      }
    } catch (err: any) {
      console.warn('Could not pull from Google Sheets during admin sync:', err);
    }
  }

  // 2. Push all local users to Google Sheets (trừ khi resolveStrategy là keep_remote)
  let pushSynced = 0;
  if (params?.resolveStrategy !== 'keep_remote') {
    const pushRes = await syncAllUsersToGoogleSheet();
    pushSynced = pushRes.syncedCount;
  }

  return {
    success: true,
    hasConflicts: false,
    localUsersCount: Object.keys(store.users).length,
    remoteUsersCount,
    syncedToRemoteCount: pushSynced,
    message: process.env.LICENSE_API_URL
      ? `Đồng bộ hoàn tất: ${Object.keys(store.users).length} người dùng đã cập nhật bền vững với Google Sheets.`
      : 'Đã cập nhật dữ liệu cục bộ. LICENSE_API_URL chưa cấu hình trên môi trường này.',
  };
}

export async function adminDeleteUser(params: {
  operatorEmail?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const email = params.email.trim().toLowerCase();
  const user = findUserByEmailOrId(email);
  if (!user) {
    return { success: false, error: 'Không tìm thấy người dùng để xóa.' };
  }

  if (ROOT_ADMIN_EMAILS.includes(email) || user.role === 'ADMIN') {
    return {
      success: false,
      error: 'Quy tắc an toàn Quản trị: Không thể xóa tài khoản Quản trị viên (ADMIN).',
    };
  }

  delete store.users[email];
  saveStore();

  if (process.env.LICENSE_API_URL) {
    await deleteUserFromGoogleSheet(email).catch(() => {});
  }

  return { success: true };
}

export function getSystemSettings(): SystemSettings {
  if (!store.settings) {
    store.settings = {
      guestEasyLimit: 3,
      guestAdvancedLimit: 1,
      trialEasyLimit: 3,
      trialAdvancedLimit: 1,
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
  durationDays?: number;
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
  } else if (params.durationDays && params.durationDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + params.durationDays);
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
