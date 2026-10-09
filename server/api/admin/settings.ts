import { getSystemSettings, updateSystemSettings, isUserAdmin, ROOT_ADMIN_EMAILS } from '../../../src/server/authStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const operatorEmail = String(
    req.headers['x-user-email'] || req.headers['x-user-id'] || req.query?.adminEmail || ''
  ).toLowerCase().trim();

  const isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed) {
    return res.status(403).json({
      error: 'Truy cập bị từ chối. Quyền quản trị (USERS.ROLE = ADMIN) bắt buộc.',
      code: 'FORBIDDEN',
    });
  }

  try {
    if (req.method === 'POST') {
      const updated = updateSystemSettings(req.body || {});
      return res.status(200).json({ success: true, settings: updated });
    }
    const settings = getSystemSettings();
    return res.status(200).json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
