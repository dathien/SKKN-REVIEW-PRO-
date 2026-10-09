import { adminCreateUser, isUserAdmin, ROOT_ADMIN_EMAILS } from '../../../src/server/authStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const operatorEmail = String(
    req.headers['x-user-email'] || req.headers['x-user-id'] || req.query?.adminEmail || req.body?.operatorEmail || ''
  ).toLowerCase().trim();

  const isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed) {
    return res.status(403).json({
      error: 'Truy cập bị từ chối. Quyền quản trị (USERS.ROLE = ADMIN) bắt buộc.',
      code: 'FORBIDDEN',
    });
  }

  try {
    const { email, name, role, plan, quota, expiresAt } = req.body || {};
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
