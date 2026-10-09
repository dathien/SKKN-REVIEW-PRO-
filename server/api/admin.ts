import {
  adminCreateUser,
  adminDeleteLicense,
  adminGenerateLicense,
  adminResetLicenseDevices,
  adminToggleLicenseStatus,
  adminUpdateUser,
  getAllLicenses,
  getAllUsersAndGuests,
  getSystemSettings,
  getSystemStats,
  isUserAdmin,
  ROOT_ADMIN_EMAILS,
  updateSystemSettings,
} from '../../src/server/authStore';
import { extractSubpath, getRequestBody, handleCors } from './_lib/routeHelper';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  const subpath = extractSubpath(req, '/api/admin');
  const body = getRequestBody(req);

  const operatorEmail = String(
    req.headers['x-user-email'] ||
    req.headers['x-user-id'] ||
    req.query?.adminEmail ||
    body?.operatorEmail ||
    ''
  ).toLowerCase().trim();

  const isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
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
      const result = adminCreateUser({
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
      return res.status(200).json({ success: true, user: result.user });
    }

    // POST /api/admin/update-user
    if (subpath === 'update-user') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
      const { email, role, plan, quota, isBlocked, expiresAt } = body || {};
      const result = adminUpdateUser({
        operatorEmail,
        email,
        role,
        plan,
        quota,
        isBlocked,
        expiresAt,
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Cập nhật người dùng thất bại' });
      }
      return res.status(200).json({ success: true, user: result.user });
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
