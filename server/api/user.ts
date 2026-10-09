import { findUserByEmailOrId, getOrCreateGuest, consumeQuota } from '../../src/server/authStore';
import { extractSubpath, getRequestBody, handleCors } from './_lib/routeHelper';

export default function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  const subpath = extractSubpath(req, '/api/user');
  const body = getRequestBody(req);

  // GET /api/user/status
  if (subpath === 'status' || subpath === '') {
    const { guestId, email, userId } = req.query || {};
    const reqIdentifier = String(email || userId || body?.email || body?.userId || '').toLowerCase().trim();

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

    const gId = String(guestId || body?.guestId || 'guest_default');
    const guest = getOrCreateGuest(gId);
    return res.status(200).json({
      isLoggedIn: false,
      guestId: guest.guestId,
      role: 'GUEST',
      plan: 'GUEST',
      quota: guest.quota,
    });
  }

  // POST /api/user/guest-init
  if (subpath === 'guest-init') {
    try {
      const guestId = body?.guestId || req.query?.guestId;
      const guest = getOrCreateGuest(guestId);
      return res.status(200).json({ success: true, guest });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/consume-quota
  if (subpath === 'consume-quota') {
    try {
      const { guestId, email, userId, mode = 'easy' } = body || {};
      const result = consumeQuota({ guestId, email, userId, mode });
      if (!result.allowed) {
        return res.status(403).json(result);
      }
      return res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: `Tuyến đường người dùng không tồn tại: /api/user/${subpath}` });
}
