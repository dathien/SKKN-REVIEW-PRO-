// src/server/authStore.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var DATA_DIR = path.resolve("data");
var STORE_FILE = path.join(DATA_DIR, "auth_store.json");
var store = {
  users: {},
  guests: {},
  licenses: {},
  stats: { totalAnalyses: 0 }
};
var ROOT_ADMIN_EMAILS = [
  "dathien2412@gmail.com"
];
function initDefaultData() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  ROOT_ADMIN_EMAILS.forEach((adminEmail) => {
    if (!store.users[adminEmail]) {
      store.users[adminEmail] = {
        id: "admin_root_" + adminEmail.split("@")[0],
        email: adminEmail,
        name: "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n",
        role: "ADMIN",
        plan: "PRO",
        quota: { easy: 3, advanced: 1 },
        licenseKey: "SKKN-ADMIN-SYSTEM",
        licenseExpiresAt: null,
        createdAt: now,
        lastActiveAt: now,
        isBlocked: false
      };
    } else {
      store.users[adminEmail].role = "ADMIN";
      store.users[adminEmail].plan = "PRO";
      store.users[adminEmail].isBlocked = false;
    }
  });
  const defaultLicenses = [
    {
      key: "SKKN-PRO-2025-VIP",
      plan: "PRO",
      maxDevices: 2,
      boundDevices: [],
      status: "UNUSED",
      expiresAt: null,
      createdReason: "M\xE3 k\xEDch ho\u1EA1t VIP 2025",
      customerNote: "Kh\xE1ch h\xE0ng VIP Gi\xE1o vi\xEAn",
      createdAt: now
    },
    {
      key: "SKKN-PRO-GIAO-VIEN",
      plan: "PRO",
      maxDevices: 1,
      boundDevices: [],
      status: "UNUSED",
      expiresAt: null,
      createdReason: "M\xE3 \u01B0u \u0111\xE3i Gi\xE1o vi\xEAn",
      customerNote: "Gi\xE1o vi\xEAn tr\u1EA3i nghi\u1EC7m",
      createdAt: now
    },
    {
      key: "SKKN-PREMIUM-SCHOOL",
      plan: "SCHOOL",
      maxDevices: 5,
      boundDevices: [],
      status: "UNUSED",
      expiresAt: null,
      createdReason: "G\xF3i B\u1EA3n quy\u1EC1n Tr\u01B0\u1EDDng h\u1ECDc",
      customerNote: "Tr\u01B0\u1EDDng THPT Chuy\xEAn",
      createdAt: now
    }
  ];
  defaultLicenses.forEach((lic) => {
    if (!store.licenses[lic.key]) {
      store.licenses[lic.key] = lic;
    } else {
      store.licenses[lic.key].boundDevices = store.licenses[lic.key].boundDevices || [];
      if (!store.licenses[lic.key].status) {
        store.licenses[lic.key].status = store.licenses[lic.key].assignedEmail ? "ACTIVE" : "UNUSED";
      }
    }
  });
}
function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      store = {
        users: parsed.users || {},
        guests: parsed.guests || {},
        licenses: parsed.licenses || {},
        stats: parsed.stats || { totalAnalyses: 0 },
        settings: parsed.settings || void 0
      };
      Object.values(store.licenses).forEach((lic) => {
        lic.boundDevices = lic.boundDevices || [];
        if (!lic.status) {
          lic.status = lic.assignedEmail ? "ACTIVE" : "UNUSED";
        }
      });
    }
  } catch (err) {
    console.error("Could not load auth store, using in-memory store:", err);
  }
  initDefaultData();
  saveStore();
}
function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Could not save auth store to disk:", err);
  }
}
function findUserByEmailOrId(identifier) {
  if (!identifier) return null;
  const lower = identifier.toLowerCase();
  for (const key of Object.keys(store.users)) {
    const u = store.users[key];
    if (u.email.toLowerCase() === lower || u.id === identifier) {
      return u;
    }
  }
  return null;
}
function mapRawSheetUserToAccount(raw) {
  if (!raw) return null;
  const id = raw.id || raw.ID || raw.userId || raw.USER_ID || "";
  const email = String(raw.email || raw.EMAIL || raw.userEmail || raw.USER_EMAIL || "").toLowerCase().trim();
  if (!email && !raw.role && !raw.plan) return null;
  const name = raw.name || raw.NAME || raw.fullName || raw.FULL_NAME || "";
  const rawPlan = String(raw.plan || raw.PLAN || raw.package || raw.PACKAGE || "").toUpperCase().trim();
  const plan = rawPlan === "SCHOOL" ? "SCHOOL" : rawPlan === "PREMIUM" ? "PREMIUM" : rawPlan === "PRO" || rawPlan === "PRO_MAX" ? "PRO" : rawPlan === "TRIAL" ? "TRIAL" : void 0;
  const rawRole = String(raw.role || raw.ROLE || raw.userRole || raw.USER_ROLE || "").toUpperCase().trim();
  let role;
  if (rawRole) {
    role = rawRole === "ADMIN" ? "ADMIN" : rawRole === "LICENSED" || rawRole === "PRO" ? "LICENSED" : rawRole === "FREE_ACCESS" || rawRole === "FREE" ? "FREE_ACCESS" : rawRole === "BLOCKED" ? "BLOCKED" : rawRole === "TRIAL" ? "TRIAL" : void 0;
  } else if (plan) {
    role = plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" ? "LICENSED" : "TRIAL";
  }
  const isUnlimitedPlan = plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" || role === "ADMIN" || role === "LICENSED" || role === "FREE_ACCESS";
  let easyQuota = isUnlimitedPlan ? -1 : 3;
  let advancedQuota = isUnlimitedPlan ? -1 : 1;
  function parseQuotaVal(v, fallback) {
    if (v === void 0 || v === null || v === "") return fallback;
    const str = String(v).trim().toUpperCase();
    if (str === "UNLIMITED" || str === "-1") return -1;
    const num = Number(str);
    if (isNaN(num)) return fallback;
    return Math.max(0, num);
  }
  if (raw.quota?.easy !== void 0) easyQuota = parseQuotaVal(raw.quota.easy, easyQuota);
  else if (raw.quotaEasy !== void 0) easyQuota = parseQuotaVal(raw.quotaEasy, easyQuota);
  else if (raw.QUOTA_EASY !== void 0) easyQuota = parseQuotaVal(raw.QUOTA_EASY, easyQuota);
  else if (raw.easyLimit !== void 0 || raw.EASY_LIMIT !== void 0) {
    const limitRaw = raw.easyLimit !== void 0 ? raw.easyLimit : raw.EASY_LIMIT;
    const limitParsed = parseQuotaVal(limitRaw, 3);
    if (limitParsed === -1) {
      easyQuota = -1;
    } else {
      const used = Number(raw.easyUsed !== void 0 ? raw.easyUsed : raw.EASY_USED || 0);
      easyQuota = Math.max(0, limitParsed - (isNaN(used) ? 0 : used));
    }
  }
  if (raw.quota?.advanced !== void 0) advancedQuota = parseQuotaVal(raw.quota.advanced, advancedQuota);
  else if (raw.quotaAdvanced !== void 0) advancedQuota = parseQuotaVal(raw.quotaAdvanced, advancedQuota);
  else if (raw.QUOTA_ADVANCED !== void 0) advancedQuota = parseQuotaVal(raw.QUOTA_ADVANCED, advancedQuota);
  else if (raw.advancedLimit !== void 0 || raw.ADVANCED_LIMIT !== void 0) {
    const limitRaw = raw.advancedLimit !== void 0 ? raw.advancedLimit : raw.ADVANCED_LIMIT;
    const limitParsed = parseQuotaVal(limitRaw, 1);
    if (limitParsed === -1) {
      advancedQuota = -1;
    } else {
      const used = Number(raw.advancedUsed !== void 0 ? raw.advancedUsed : raw.ADVANCED_USED || 0);
      advancedQuota = Math.max(0, limitParsed - (isNaN(used) ? 0 : used));
    }
  }
  const statusStr = String(raw.status || raw.STATUS || "").toUpperCase().trim();
  const isBlocked = statusStr === "BLOCKED" || raw.isBlocked === true || role === "BLOCKED";
  const licenseKey = raw.licenseKey || raw.LICENSE_KEY || raw.key || raw.KEY || void 0;
  const licenseExpiresAt = raw.licenseExpiresAt || raw.expiresAt || raw.EXPIRES_AT || null;
  return {
    id: id || void 0,
    email: email || void 0,
    name: name || void 0,
    role,
    plan,
    quota: { easy: easyQuota, advanced: advancedQuota },
    licenseKey: licenseKey ? String(licenseKey) : void 0,
    licenseExpiresAt: licenseExpiresAt ? String(licenseExpiresAt) : null,
    isBlocked,
    freeAccess: Boolean(raw.freeAccess || role === "FREE_ACCESS"),
    freeAccessName: raw.freeAccessName || raw.campaignName,
    freeAccessExpiresAt: raw.freeAccessExpiresAt || licenseExpiresAt
  };
}
async function fetchUserFromLicenseApi(email, sub) {
  if (!process.env.LICENSE_API_URL) return null;
  const targetEmail = email.toLowerCase().trim();
  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getUser",
        email: targetEmail,
        serverSecret: process.env.APPS_SCRIPT_SECRET || ""
      }),
      signal: AbortSignal.timeout(4e3)
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data?.found && data?.user) {
        const mapped = mapRawSheetUserToAccount(data.user);
        if (mapped) return mapped;
      } else if (data?.email || data?.role || data?.plan) {
        const mapped = mapRawSheetUserToAccount(data);
        if (mapped) return mapped;
      }
    }
  } catch (err) {
    console.warn("Could not query user role from LICENSE_API_URL via POST:", err);
  }
  try {
    const url = new URL(process.env.LICENSE_API_URL);
    url.searchParams.set("action", "getUser");
    url.searchParams.set("email", targetEmail);
    if (sub) url.searchParams.set("sub", sub);
    const resp = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(4e3) });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      const rawUser = data?.user || (data?.email || data?.role || data?.plan ? data : null);
      if (rawUser) {
        const mapped = mapRawSheetUserToAccount(rawUser);
        if (mapped) return mapped;
      }
    }
  } catch (_) {
  }
  return null;
}
function getSessionSecret() {
  return process.env.APPS_SCRIPT_SECRET || process.env.SESSION_SECRET || "skkn_secure_session_secret_2026";
}
function createAdminSession(email, role = "ADMIN") {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1e3;
  const payload = `${cleanEmail}|${role}|${expiresAt}`;
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  const token = `skkn_sess_${Buffer.from(payload).toString("base64url")}.${sig}`;
  const g = globalThis;
  g.__skkn_sessions = g.__skkn_sessions || {};
  g.__skkn_sessions[token] = { email: cleanEmail, role, expiresAt };
  return token;
}
async function getOrCreateUser(profile) {
  const email = profile.email.toLowerCase();
  let user = findUserByEmailOrId(email);
  const remoteData = await fetchUserFromLicenseApi(email, profile.id);
  const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
  if (!user) {
    const userId = profile.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const role = isRootAdmin ? "ADMIN" : remoteData?.role || "TRIAL";
    const plan = isRootAdmin ? "PRO" : remoteData?.plan || (role === "ADMIN" ? "PRO" : "TRIAL");
    const defaultTrialEasy = store.settings?.trialEasyLimit ?? 3;
    const defaultTrialAdvanced = store.settings?.trialAdvancedLimit ?? 1;
    user = {
      id: userId,
      email,
      name: isRootAdmin ? profile.name || "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n" : remoteData?.name || profile.name || email.split("@")[0],
      picture: profile.picture,
      role,
      plan,
      quota: { easy: defaultTrialEasy, advanced: defaultTrialAdvanced },
      licenseKey: isRootAdmin ? "SKKN-ADMIN-SYSTEM" : role === "ADMIN" ? "SKKN-ADMIN-SYSTEM" : void 0,
      licenseExpiresAt: null,
      freeAccess: remoteData?.freeAccess || role === "FREE_ACCESS",
      freeAccessName: remoteData?.freeAccessName,
      freeAccessExpiresAt: remoteData?.freeAccessExpiresAt,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
      isBlocked: isRootAdmin ? false : role === "BLOCKED"
    };
    store.users[email] = user;
    saveStore();
  } else {
    if (isRootAdmin) {
      user.role = "ADMIN";
      user.plan = "PRO";
      user.isBlocked = false;
      user.licenseKey = "SKKN-ADMIN-SYSTEM";
    } else {
      if (remoteData?.role) {
        user.role = remoteData.role;
      }
      if (remoteData?.freeAccess !== void 0) {
        user.freeAccess = remoteData.freeAccess;
      }
      if (remoteData?.freeAccessName) {
        user.freeAccessName = remoteData.freeAccessName;
      }
      if (remoteData?.freeAccessExpiresAt) {
        user.freeAccessExpiresAt = remoteData.freeAccessExpiresAt;
      }
      if (remoteData?.plan) {
        user.plan = remoteData.plan;
      }
      if (remoteData?.name) {
        user.name = remoteData.name;
      } else if (profile.name) {
        user.name = profile.name;
      }
    }
    if (profile.picture) user.picture = profile.picture;
    user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStore();
  }
  return user;
}
loadStore();

// server/api/_lib/routeHelper.ts
function extractSubpath(req, basePath) {
  const querySubpath = req.query?.__subpath ?? req.query?.subpath ?? req.query?.path ?? req.query?.route;
  if (querySubpath !== void 0 && querySubpath !== null && querySubpath !== "") {
    const raw = Array.isArray(querySubpath) ? querySubpath.join("/") : String(querySubpath);
    const cleaned = raw.replace(/^\/+|\/+$/g, "");
    if (cleaned) return cleaned;
  }
  const prefix = basePath.endsWith("/") ? basePath : `${basePath}/`;
  if (typeof req.url === "string") {
    const pathname = req.url.split("?")[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
      if (sub) return sub;
    }
  }
  if (typeof req.originalUrl === "string") {
    const pathname = req.originalUrl.split("?")[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
      if (sub) return sub;
    }
  }
  const headerKeys = ["x-matched-path", "x-forwarded-uri", "x-original-uri", "x-rewrite-url"];
  for (const key of headerKeys) {
    const val = req.headers?.[key];
    if (typeof val === "string") {
      const pathname = val.split("?")[0];
      if (pathname.startsWith(prefix)) {
        const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
        if (sub) return sub;
      }
    }
  }
  return "";
}
function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string" && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
function handleCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-email, x-user-id");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

// server/api/auth.ts
async function handler(req, res) {
  if (handleCors(req, res)) return;
  res.setHeader("Content-Type", "application/json");
  const subpath = extractSubpath(req, "/api/auth");
  const body = getRequestBody(req);
  if (subpath === "config") {
    const rawClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
    const cleanClientId = rawClientId.replace(/^["']|["']$/g, "").trim();
    return res.status(200).json({
      googleClientId: cleanClientId,
      hasLicenseApi: Boolean(process.env.LICENSE_API_URL)
    });
  }
  if (subpath === "google") {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    try {
      const { credential, email, name, picture, id } = body || {};
      let userEmail = email ? String(email).trim().toLowerCase() : "";
      let userName = name ? String(name).trim() : "";
      let userPicture = picture;
      let userId = id;
      if (credential && typeof credential === "string") {
        try {
          const parts = credential.split(".");
          if (parts.length >= 2) {
            const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
            if (!userEmail && decoded.email) userEmail = decoded.email.trim().toLowerCase();
            if (!userName && decoded.name) userName = decoded.name;
            if (!userPicture && decoded.picture) userPicture = decoded.picture;
            if (!userId && decoded.sub) userId = decoded.sub;
          }
        } catch {
        }
      }
      if (!userEmail) {
        return res.status(400).json({ error: "Kh\xF4ng th\u1EC3 x\xE1c \u0111\u1ECBnh email Google" });
      }
      const user = await getOrCreateUser({
        email: userEmail,
        name: userName,
        picture: userPicture,
        id: userId
      });
      let sessionToken;
      if (user.role === "ADMIN" || ROOT_ADMIN_EMAILS.includes(userEmail)) {
        sessionToken = createAdminSession(userEmail, user.role);
      }
      return res.status(200).json({ success: true, user, sessionToken });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(404).json({ error: `Tuy\u1EBFn \u0111\u01B0\u1EDDng x\xE1c th\u1EF1c kh\xF4ng t\u1ED3n t\u1EA1i: /api/auth/${subpath}` });
}
export {
  handler as default
};
