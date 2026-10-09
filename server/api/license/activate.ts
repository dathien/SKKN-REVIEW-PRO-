import { activateLicenseKey } from '../../../src/server/authStore';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { licenseKey, email, userId, guestId, deviceId, deviceName } = req.body || {};
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
