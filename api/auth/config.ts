export default function handler(_req: any, res: any) {
  const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  const cleanClientId = rawClientId.replace(/^["']|["']$/g, '').trim();
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    googleClientId: cleanClientId,
    hasLicenseApi: Boolean(process.env.LICENSE_API_URL),
  });
}
