import {
  adminCreateUser,
  adminDeleteLicense,
  adminDeleteUser,
  adminGenerateLicense,
  adminManageProLicense,
  adminResetLicenseDevices,
  adminSyncGoogleSheets,
  adminToggleLicenseStatus,
  adminUpdateUser,
  checkSheetCompatibility,
  fetchUserFromLicenseApi,
  getAllLicenses,
  getAllUsersAndGuests,
  getOrCreateUser,
  getSystemSettings,
  getSystemStats,
  isUserAdmin,
  mapRawSheetUserToAccount,
  ROOT_ADMIN_EMAILS,
  updateSystemSettings,
  verifyAdminSessionToken,
  verifyGoogleIdToken,
} from '../../src/server/authStore';
import { extractSubpath, getRequestBody, handleCors } from './_lib/routeHelper';

export { mapRawSheetUserToAccount };

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  const subpath = extractSubpath(req, '/api/admin');
  const body = getRequestBody(req);

  // XÁC MINH PHIÊN ĐĂNG NHẬP / GOOGLE ID TOKEN HỢP LỆ TRÊN SERVER
  // TUYỆT ĐỐI KHÔNG CẤP QUYỀN CHỈ VÌ CLIENT GỬI x-user-email HOẶC x-user-role
  const authHeader = req.headers['authorization'] || '';
  const sessionHeader = req.headers['x-session-token'] || '';
  const googleHeader = req.headers['x-google-credential'] || '';
  const tokenCandidate = authHeader || sessionHeader || googleHeader;

  let verifiedEmail: string | null = null;

  // 1. Kiểm tra Admin Session Token đã cấp bởi server
  if (tokenCandidate) {
    const verifiedSession = verifyAdminSessionToken(tokenCandidate);
    if (verifiedSession) {
      verifiedEmail = verifiedSession.email;
    } else {
      // 2. Kiểm tra Google ID Token hợp lệ
      const googleVerified = verifyGoogleIdToken(tokenCandidate);
      if (googleVerified) {
        verifiedEmail = googleVerified.email;
      }
    }
  }

  // 3. Cho phép Server Secret (server-to-server backend auth)
  const serverSecretHeader = req.headers['x-server-secret'] || '';
  const expectedSecret = process.env.APPS_SCRIPT_SECRET || '';
  if (!verifiedEmail && expectedSecret && serverSecretHeader === expectedSecret) {
    verifiedEmail = String(req.headers['x-user-email'] || ROOT_ADMIN_EMAILS[0]).toLowerCase().trim();
  }

  // Nếu không có phiên xác thực hợp lệ -> Từ chối ngay lập tức
  if (!verifiedEmail) {
    return res.status(403).json({
      error: 'Truy cập bị từ chối: Yêu cầu phiên đăng nhập hợp lệ hoặc Google ID token đã xác minh trên server.',
      code: 'FORBIDDEN',
    });
  }

  const operatorEmail = verifiedEmail;
  let isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed && process.env.LICENSE_API_URL && operatorEmail) {
    try {
      const remote = await fetchUserFromLicenseApi(operatorEmail);
      if (remote?.role === 'ADMIN') {
        const u = await getOrCreateUser({ email: operatorEmail });
        u.role = 'ADMIN';
        isAllowed = true;
      }
    } catch {}
  }

  if (!isAllowed) {
    return res.status(403).json({
      error: 'Truy cập bị từ chối. Quyền quản trị (USERS.ROLE = ADMIN) bắt buộc.',
      code: 'FORBIDDEN',
    });
  }

  try {
    // GET /api/admin/check-access
    if (subpath === 'check-access') {
      return res.status(200).json({ allowed: true, role: 'ADMIN' });
    }

    // GET /api/admin/check-sheet-schema
    if (subpath === 'check-sheet-schema') {
      const checkResult = await checkSheetCompatibility();
      return res.status(200).json(checkResult);
    }

    // GET /api/admin/stats
    if (subpath === 'stats') {
      const stats = getSystemStats();
      return res.status(200).json(stats);
    }

    // GET /api/admin/users
    if (subpath === 'users') {
      const data = await getAllUsersAndGuests();
      return res.status(200).json(data);
    }

    // POST /api/admin/create-user
    if (subpath === 'create-user') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { email, name, role, plan, quota, expiresAt } = body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email người dùng là bắt buộc' });
      }
      const result = await adminCreateUser({
        email,
        name,
        role,
        plan,
        quota,
        expiresAt,
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Thêm người dùng thất bại' });
      }
      return res.status(200).json({
        success: true,
        user: result.user,
        sheetSynced: result.sheetSynced,
        warning: (result as any).warning,
        message: (result as any).message,
      });
    }

    // POST /api/admin/update-user
    if (subpath === 'update-user') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { email, name, newEmail, role, plan, quota, isBlocked, expiresAt, proStartDate, proDurationMonths, proEndDate, proStatus, proNote } = body || {};
      const result = await adminUpdateUser({
        operatorEmail,
        email,
        name,
        newEmail,
        role,
        plan,
        quota,
        isBlocked,
        expiresAt,
        proStartDate,
        proDurationMonths,
        proEndDate,
        proStatus,
        proNote,
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Cập nhật người dùng thất bại' });
      }
      return res.status(200).json({
        success: true,
        user: result.user,
        sheetSynced: result.sheetSynced,
        warning: (result as any).warning,
        message: (result as any).message,
      });
    }

    // POST /api/admin/manage-pro hoặc /api/admin/pro-license
    if (subpath === 'manage-pro' || subpath === 'pro-license') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { email, action, startDate, durationMonths, endDate, extendFrom, note, proStatus } = body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email người dùng là bắt buộc' });
      }
      if (!action) {
        return res.status(400).json({ error: 'Hành động quản lý PRO là bắt buộc (GRANT, EXTEND, ADJUST, REVOKE)' });
      }
      const result = await adminManageProLicense({
        operatorEmail,
        email,
        action,
        startDate,
        durationMonths: durationMonths !== undefined ? Number(durationMonths) : undefined,
        endDate,
        extendFrom,
        note,
        proStatus,
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Thao tác PRO thất bại' });
      }
      return res.status(200).json(result);
    }

    // POST /api/admin/delete-user
    if (subpath === 'delete-user') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { email } = body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email người dùng là bắt buộc' });
      }
      const result = await adminDeleteUser({ operatorEmail, email });
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Xóa người dùng thất bại' });
      }
      return res.status(200).json({ success: true });
    }

    // POST /api/admin/sync-sheet
    if (subpath === 'sync-sheet') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const result = await adminSyncGoogleSheets(body);
      return res.status(200).json(result);
    }

    // GET / POST /api/admin/settings
    if (subpath === 'settings') {
      if (req.method === 'POST') {
        const updated = updateSystemSettings(body || {});
        return res.status(200).json({ success: true, settings: updated });
      }
      const settings = getSystemSettings();
      return res.status(200).json({ success: true, settings });
    }

    // GET /api/admin/licenses
    if (subpath === 'licenses') {
      const licenses = getAllLicenses();
      return res.status(200).json({ success: true, licenses });
    }

    // POST /api/admin/licenses/create
    if (subpath === 'licenses/create') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { plan, durationMonths, durationDays, maxDevices, assignedEmail, customerNote, reason } = body || {};
      const item = adminGenerateLicense({
        plan,
        durationMonths: durationMonths !== undefined ? Number(durationMonths) : undefined,
        durationDays: durationDays !== undefined ? Number(durationDays) : undefined,
        maxDevices: Number(maxDevices) || 1,
        assignedEmail,
        customerNote,
        reason,
      });
      return res.status(200).json({ success: true, license: item });
    }

    // POST /api/admin/licenses/toggle-status
    if (subpath === 'licenses/toggle-status') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { key, status } = body || {};
      const result = adminToggleLicenseStatus(typeof key === 'object' ? key : { key, status });
      return res.status(result.success ? 200 : 400).json(result);
    }

    // POST /api/admin/licenses/reset-devices
    if (subpath === 'licenses/reset-devices') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { key, deviceId } = body || {};
      const result = adminResetLicenseDevices(typeof key === 'object' ? key : { key, deviceId });
      return res.status(result.success ? 200 : 400).json(result);
    }

    // POST /api/admin/licenses/delete
    if (subpath === 'licenses/delete') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { key } = body || {};
      const result = adminDeleteLicense(typeof key === 'object' ? key.key : key);
      return res.status(result.success ? 200 : 400).json(result);
    }

    return res.status(404).json({ error: `Tuyến đường quản trị không tồn tại: /api/admin/${subpath}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
