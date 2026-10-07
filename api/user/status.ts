import { findUserByEmailOrId, getOrCreateGuest } from '../../src/server/authStore';

export default function handler(req: any, res: any) {
  const { guestId, email, userId } = req.query || {};
  res.setHeader('Content-Type', 'application/json');

  const reqIdentifier = String(email || userId || '').toLowerCase().trim();

  if (reqIdentifier) {
    const user = findUserByEmailOrId(reqIdentifier);
    if (user) {
      return res.status(200).json({
        isLoggedIn: true,
        user,
        role: user.role,
        plan: user.plan,
        quota: user.quota,
      });
    }
  }

  const guest = getOrCreateGuest(String(guestId || 'guest_default'));
  return res.status(200).json({
    isLoggedIn: false,
    guestId: guest.guestId,
    role: 'GUEST',
    plan: 'GUEST',
    quota: guest.quota,
  });
}
