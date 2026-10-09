import { adminGenerateLicense, isUserAdmin, ROOT_ADMIN_EMAILS } from '../../../../src/server/authStore';

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
    const { plan, durationMonths, durationDays, maxDevices, assignedEmail, customerNote, reason } = req.body || {};
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
