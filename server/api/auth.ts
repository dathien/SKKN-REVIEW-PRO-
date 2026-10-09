import { getOrCreateUser } from '../../src/server/authStore';
import { extractSubpath, getRequestBody, handleCors } from './_lib/routeHelper';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  const subpath = extractSubpath(req, '/api/auth');
  const body = getRequestBody(req);

  // GET /api/auth/config
  if (subpath === 'config') {
    const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    const cleanClientId = rawClientId.replace(/^["']|["']$/g, '').trim();
    return res.status(200).json({
      googleClientId: cleanClientId,
      hasLicenseApi: Boolean(process.env.LICENSE_API_URL),
    });
  }

  // POST /api/auth/google
  if (subpath === 'google') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { credential, email, name, picture, id } = body || {};
      let userEmail = email ? String(email).trim().toLowerCase() : '';
      let userName = name ? String(name).trim() : '';
      let userPicture = picture;
      let userId = id;

      if (credential && typeof credential === 'string') {
        try {
          const parts = credential.split('.');
          if (parts.length >= 2) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
            if (!userEmail && decoded.email) userEmail = decoded.email.trim().toLowerCase();
            if (!userName && decoded.name) userName = decoded.name;
            if (!userPicture && decoded.picture) userPicture = decoded.picture;
            if (!userId && decoded.sub) userId = decoded.sub;
          }
        } catch {}
      }

      if (!userEmail) {
        return res.status(400).json({ error: 'Không thể xác định email Google' });
      }

      // Persist into unified USERS database
      const user = await getOrCreateUser({
        email: userEmail,
        name: userName,
        picture: userPicture,
        id: userId,
      });

      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: `Tuyến đường xác thực không tồn tại: /api/auth/${subpath}` });
}
