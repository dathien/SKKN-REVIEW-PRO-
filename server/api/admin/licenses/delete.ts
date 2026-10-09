import { adminDeleteLicense, isUserAdmin, ROOT_ADMIN_EMAILS } from '../../../../src/server/authStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const operatorEmail = String(
    req.headers['x-user-email'] || req.headers['x-user-id'] || req.query?.adminEmail || req.body?.operatorEmail || ''
  ).toLowerCase().trim();

  const isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed) {
    return res.status(403).json({ error: 'Truy cập bị từ chối. Quyền quản trị bắt buộc.', code: 'FORBIDDEN' });
  }

  try {
    const { key } = req.body || {};
    const result = adminDeleteLicense(key);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
