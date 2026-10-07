export default function handler(req: any, res: any) {
  const { guestId, email, userId } = req.query || {};
  res.setHeader('Content-Type', 'application/json');

  const ROOT_ADMIN_EMAILS = ['dathien2412@gmail.com'];
  const reqEmail = String(email || userId || '').toLowerCase().trim();

  if (ROOT_ADMIN_EMAILS.includes(reqEmail)) {
    return res.status(200).json({
      isLoggedIn: true,
      user: {
        id: 'admin_root_' + reqEmail.split('@')[0],
        email: reqEmail,
        name: 'Đa Thiện Hồ Nguyễn',
        role: 'ADMIN',
        plan: 'PRO',
        quota: { easy: 9999, advanced: 9999 },
        isBlocked: false,
      },
      role: 'ADMIN',
      plan: 'PRO',
      quota: { easy: 9999, advanced: 9999 },
    });
  }

  return res.status(200).json({
    isLoggedIn: false,
    guestId: guestId || 'guest_default',
    role: 'GUEST',
    plan: 'GUEST',
    quota: { easy: 3, advanced: 1 },
  });
}
