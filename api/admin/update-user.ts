import { adminUpdateUser } from '../_lib/authStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const operatorEmail = String(
    req.headers['x-user-email'] || req.headers['x-user-id'] || req.query?.adminEmail || ''
  ).toLowerCase().trim();

  const ROOT_ADMIN_EMAILS = ['dathien2412@gmail.com'];
  if (!ROOT_ADMIN_EMAILS.includes(operatorEmail)) {
    return res.status(403).json({
      error: 'Truy cập bị từ chối. Quyền quản trị (USERS.ROLE = ADMIN) bắt buộc.',
      code: 'FORBIDDEN',
    });
  }

  try {
    const { email, role, plan, quota, isBlocked, expiresAt } = req.body || {};
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
