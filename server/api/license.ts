import { activateLicenseKey } from '../../src/server/authStore';
import { extractSubpath, getRequestBody, handleCors } from './_lib/routeHelper';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  const subpath = extractSubpath(req, '/api/license');

  // POST /api/license/activate or POST /api/license
  if (subpath === 'activate' || subpath === '') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const body = getRequestBody(req);
      const { licenseKey, email, userId, guestId, deviceId, deviceName } = body || {};
      const result = await activateLicenseKey({
        licenseKey,
        email,
        userId,
        guestId,
        deviceId,
        deviceName,
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(404).json({ error: `Tuyến đường giấy phép không tồn tại: /api/license/${subpath}` });
}
