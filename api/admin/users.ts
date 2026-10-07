import { getAllUsersAndGuests } from '../../src/server/authStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const operatorEmail = String(
    req.headers['x-user-email'] || req.headers['x-user-id'] || req.query?.adminEmail || ''
  ).toLowerCase().trim();

  // Kiểm tra quyền Admin tối thiểu (Root Admin)
  const ROOT_ADMIN_EMAILS = ['dathien2412@gmail.com'];
  if (!ROOT_ADMIN_EMAILS.includes(operatorEmail)) {
    return res.status(403).json({
      error: 'Truy cập bị từ chối. Quyền quản trị (USERS.ROLE = ADMIN) bắt buộc.',
      code: 'FORBIDDEN',
    });
  }

  try {
    const data = getAllUsersAndGuests();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
