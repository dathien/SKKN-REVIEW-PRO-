// server/api/auth/config.ts
function handler(_req, res) {
  const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  const cleanClientId = rawClientId.replace(/^["']|["']$/g, "").trim();
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    googleClientId: cleanClientId,
    hasLicenseApi: Boolean(process.env.LICENSE_API_URL)
  });
}
export {
  handler as default
};
