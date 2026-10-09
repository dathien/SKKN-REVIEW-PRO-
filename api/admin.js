// src/server/authStore.ts
import fs from "fs";
import path from "path";
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
        quota: { easy: 9999, advanced: 9999 },
        licenseKey: "SKKN-ADMIN-SYSTEM",
        licenseExpiresAt: null,
        createdAt: now,
        lastActiveAt: now,
        isBlocked: false
      };
    } else {
      store.users[adminEmail].role = "ADMIN";
      store.users[adminEmail].plan = "PRO";
      store.users[adminEmail].quota = { easy: 9999, advanced: 9999 };
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
function isUserAdmin(identifier) {
  if (!identifier) return false;
  const user = findUserByEmailOrId(identifier);
  return user?.role === "ADMIN";
}
function getSystemStats() {
  const usersList = Object.values(store.users);
  const trialUsers = usersList.filter((u) => u.role === "TRIAL" || u.plan === "TRIAL").length;
  const licensedUsers = usersList.filter((u) => u.role === "LICENSED" || u.plan === "LICENSED" || u.role === "ADMIN").length;
  const activeLicenses = Object.values(store.licenses).filter((l) => l.status === "ACTIVE").length;
  return {
    totalGuests: Object.keys(store.guests).length,
    totalUsers: usersList.length,
    trialUsers,
    licensedUsers,
    totalAnalyses: store.stats.totalAnalyses,
    activeLicenses,
    geminiStatus: process.env.GEMINI_API_KEY ? "ONLINE" : "DEGRADED",
    licenseApiStatus: process.env.LICENSE_API_URL ? "CONNECTED" : "LOCAL_FALLBACK"
  };
}
async function getAllUsersAndGuests() {
  if (process.env.LICENSE_API_URL) {
    try {
      const url = new URL(process.env.LICENSE_API_URL);
      url.searchParams.set("action", "getUsers");
      const resp = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(3e3) });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
        list.forEach((u) => {
          if (u && u.email) {
            const email = String(u.email).toLowerCase().trim();
            const existing = store.users[email];
            if (!existing) {
              const role = u.role === "ADMIN" ? "ADMIN" : u.role === "LICENSED" ? "LICENSED" : u.role === "FREE_ACCESS" ? "FREE_ACCESS" : u.role === "BLOCKED" ? "BLOCKED" : "TRIAL";
              const plan = u.plan === "SCHOOL" ? "SCHOOL" : u.plan === "PREMIUM" ? "PREMIUM" : u.plan === "PRO" ? "PRO" : "TRIAL";
              const isUnlimited = role === "ADMIN" || role === "LICENSED" || role === "FREE_ACCESS";
              store.users[email] = {
                id: u.id || `usr_sheet_${email.split("@")[0]}`,
                email,
                name: u.name || email.split("@")[0],
                role,
                plan,
                quota: isUnlimited ? { easy: 9999, advanced: 9999 } : u.quota || { easy: 3, advanced: 1 },
                licenseKey: u.licenseKey,
                licenseExpiresAt: u.licenseExpiresAt || null,
                createdAt: u.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
                lastActiveAt: u.lastActiveAt || (/* @__PURE__ */ new Date()).toISOString(),
                isBlocked: Boolean(u.isBlocked)
              };
            }
          }
        });
      }
    } catch (_) {
    }
  }
  return {
    users: Object.values(store.users),
    guests: Object.values(store.guests),
    licenses: Object.values(store.licenses)
  };
}
function adminUpdateUser(params) {
  const user = findUserByEmailOrId(params.email);
  if (!user) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" };
  }
  if (params.operatorEmail && params.operatorEmail.toLowerCase() === user.email.toLowerCase()) {
    if (params.isBlocked === true) {
      return {
        success: false,
        error: "Quy t\u1EAFc an to\xE0n Qu\u1EA3n tr\u1ECB: Kh\xF4ng th\u1EC3 t\u1EF1 kh\xF3a t\xE0i kho\u1EA3n Qu\u1EA3n tr\u1ECB vi\xEAn c\u1EE7a ch\xEDnh m\xECnh."
      };
    }
    if (params.role && params.role !== "ADMIN") {
      return {
        success: false,
        error: "Quy t\u1EAFc an to\xE0n Qu\u1EA3n tr\u1ECB: Kh\xF4ng th\u1EC3 t\u1EF1 thu h\u1ED3i quy\u1EC1n Qu\u1EA3n tr\u1ECB vi\xEAn c\u1EE7a ch\xEDnh m\xECnh."
      };
    }
  }
  if (params.role !== void 0) user.role = params.role;
  if (params.plan !== void 0) {
    user.plan = params.plan;
    if (params.plan === "LICENSED") {
      if (user.role !== "ADMIN") user.role = "LICENSED";
      user.quota = { easy: 9999, advanced: 9999 };
      user.licenseExpiresAt = params.expiresAt !== void 0 ? params.expiresAt : user.licenseExpiresAt;
    } else if (params.plan === "TRIAL") {
      if (user.role !== "ADMIN") user.role = "TRIAL";
      user.licenseExpiresAt = null;
    }
  }
  if (params.expiresAt !== void 0) {
    user.licenseExpiresAt = params.expiresAt;
  }
  if (params.quota !== void 0) user.quota = params.quota;
  if (params.isBlocked !== void 0) {
    user.isBlocked = params.isBlocked;
    if (params.isBlocked && user.role !== "ADMIN") {
      user.role = "BLOCKED";
    } else if (!params.isBlocked && user.role === "BLOCKED") {
      user.role = user.plan === "LICENSED" ? "LICENSED" : "TRIAL";
    }
  }
  saveStore();
  return { success: true, user };
}
function adminCreateUser(params) {
  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email kh\xF4ng h\u1EE3p l\u1EC7" };
  }
  let user = findUserByEmailOrId(email);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
  if (user) {
    if (params.role !== void 0) user.role = isRootAdmin ? "ADMIN" : params.role;
    if (params.plan !== void 0) user.plan = isRootAdmin ? "PRO" : params.plan;
    if (params.name && !user.name) user.name = params.name;
    if (params.quota) user.quota = params.quota;
    if (params.expiresAt !== void 0) user.licenseExpiresAt = params.expiresAt;
    if (user.plan === "LICENSED") {
      if (user.role !== "ADMIN") user.role = "LICENSED";
      user.quota = { easy: 9999, advanced: 9999 };
    }
    user.lastActiveAt = now;
    saveStore();
    return { success: true, user };
  }
  const role = isRootAdmin ? "ADMIN" : params.role || "TRIAL";
  const plan = isRootAdmin ? "PRO" : params.plan || (role === "ADMIN" ? "PRO" : "TRIAL");
  const isUnlimited = role === "ADMIN" || role === "LICENSED" || role === "FREE_ACCESS";
  const defaultTrialEasy = store.settings?.trialEasyLimit ?? 3;
  const defaultTrialAdvanced = store.settings?.trialAdvancedLimit ?? 1;
  const quota = params.quota || (isUnlimited ? { easy: 9999, advanced: 9999 } : { easy: defaultTrialEasy, advanced: defaultTrialAdvanced });
  user = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email,
    name: params.name?.trim() || (isRootAdmin ? "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n" : email.split("@")[0]),
    role,
    plan,
    quota,
    licenseKey: isRootAdmin ? "SKKN-ADMIN-SYSTEM" : role === "LICENSED" ? `SKKN-DIRECT-${Date.now().toString(36).toUpperCase()}` : void 0,
    licenseExpiresAt: params.expiresAt || null,
    createdAt: now,
    lastActiveAt: now,
    isBlocked: false
  };
  store.users[email] = user;
  saveStore();
  return { success: true, user };
}
function getSystemSettings() {
  if (!store.settings) {
    store.settings = {
      guestEasyLimit: 3,
      guestAdvancedLimit: 1,
      trialEasyLimit: 3,
      trialAdvancedLimit: 1,
      freeAccessEnabled: false,
      freeAccessName: "Ch\u01B0\u01A1ng tr\xECnh Tr\u1EA3i nghi\u1EC7m Gi\xE1o d\u1EE5c",
      freeAccessStart: "",
      freeAccessEnd: ""
    };
    saveStore();
  }
  return store.settings;
}
function updateSystemSettings(partial) {
  const current = getSystemSettings();
  store.settings = { ...current, ...partial };
  saveStore();
  return store.settings;
}
function getAllLicenses() {
  const list = Object.values(store.licenses);
  return list.map((l) => ({
    ...l,
    boundDevices: l.boundDevices || [],
    status: l.status || (l.assignedEmail ? "ACTIVE" : "UNUSED")
  })).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}
function adminGenerateLicense(params) {
  const plan = params.plan || "PRO";
  const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `SKKN-${plan === "SCHOOL" ? "SCHOOL" : "PRO"}-${randPart1}-${randPart2}`;
  let expiresAt = null;
  if (params.durationMonths && params.durationMonths > 0) {
    const d = /* @__PURE__ */ new Date();
    d.setMonth(d.getMonth() + params.durationMonths);
    expiresAt = d.toISOString();
  } else if (params.durationDays && params.durationDays > 0) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + params.durationDays);
    expiresAt = d.toISOString();
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const lic = {
    key,
    plan,
    maxDevices: params.maxDevices && params.maxDevices > 0 ? params.maxDevices : plan === "SCHOOL" ? 5 : 1,
    boundDevices: [],
    assignedEmail: params.assignedEmail || void 0,
    status: params.assignedEmail ? "ACTIVE" : "UNUSED",
    expiresAt,
    customerNote: params.customerNote || params.reason || "",
    createdReason: params.reason || `M\xE3 t\u1EA1o b\u1EDFi Qu\u1EA3n tr\u1ECB vi\xEAn (${params.durationMonths ? `${params.durationMonths} th\xE1ng` : "V\u0129nh vi\u1EC5n"})`,
    createdAt: now
  };
  store.licenses[key] = lic;
  saveStore();
  return lic;
}
function adminResetLicenseDevices(params) {
  const lic = store.licenses[params.key];
  if (!lic) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y m\xE3 b\u1EA3n quy\u1EC1n tr\xEAn h\u1EC7 th\u1ED1ng." };
  }
  lic.boundDevices = lic.boundDevices || [];
  if (params.deviceId) {
    lic.boundDevices = lic.boundDevices.filter((d) => d.deviceId !== params.deviceId);
  } else {
    lic.boundDevices = [];
  }
  saveStore();
  return { success: true, license: lic };
}
function adminToggleLicenseStatus(params) {
  const lic = store.licenses[params.key];
  if (!lic) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y m\xE3 b\u1EA3n quy\u1EC1n." };
  }
  lic.status = params.status;
  if (params.status === "REVOKED" && lic.assignedEmail) {
    const user = findUserByEmailOrId(lic.assignedEmail);
    if (user && user.licenseKey === params.key && user.role !== "ADMIN") {
      user.role = "TRIAL";
      user.plan = "TRIAL";
      user.licenseKey = void 0;
    }
  } else if (params.status === "ACTIVE" && lic.assignedEmail) {
    const user = findUserByEmailOrId(lic.assignedEmail);
    if (user && user.role !== "ADMIN") {
      user.role = "LICENSED";
      user.plan = lic.plan || "LICENSED";
      user.licenseKey = params.key;
      user.licenseExpiresAt = lic.expiresAt;
      user.quota = { easy: 9999, advanced: 9999 };
    }
  }
  saveStore();
  return { success: true, license: lic };
}
function adminDeleteLicense(key) {
  if (!store.licenses[key]) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y m\xE3 b\u1EA3n quy\u1EC1n \u0111\u1EC3 x\xF3a." };
  }
  delete store.licenses[key];
  saveStore();
  return { success: true };
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

// server/api/admin.ts
async function handler(req, res) {
  if (handleCors(req, res)) return;
  res.setHeader("Content-Type", "application/json");
  const subpath = extractSubpath(req, "/api/admin");
  const body = getRequestBody(req);
  const operatorEmail = String(
    req.headers["x-user-email"] || req.headers["x-user-id"] || req.query?.adminEmail || body?.operatorEmail || ""
  ).toLowerCase().trim();
  const isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed) {
    return res.status(403).json({
      error: "Truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i. Quy\u1EC1n qu\u1EA3n tr\u1ECB (USERS.ROLE = ADMIN) b\u1EAFt bu\u1ED9c.",
      code: "FORBIDDEN"
    });
  }
  try {
    if (subpath === "check-access") {
      return res.status(200).json({ allowed: true, role: "ADMIN" });
    }
    if (subpath === "stats") {
      const stats = getSystemStats();
      return res.status(200).json(stats);
    }
    if (subpath === "users") {
      const data = await getAllUsersAndGuests();
      return res.status(200).json(data);
    }
    if (subpath === "create-user") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { email, name, role, plan, quota, expiresAt } = body || {};
      if (!email) {
        return res.status(400).json({ error: "Email ng\u01B0\u1EDDi d\xF9ng l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const result = adminCreateUser({
        email,
        name,
        role,
        plan,
        quota,
        expiresAt
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Th\xEAm ng\u01B0\u1EDDi d\xF9ng th\u1EA5t b\u1EA1i" });
      }
      return res.status(200).json({ success: true, user: result.user });
    }
    if (subpath === "update-user") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { email, role, plan, quota, isBlocked, expiresAt } = body || {};
      const result = adminUpdateUser({
        operatorEmail,
        email,
        role,
        plan,
        quota,
        isBlocked,
        expiresAt
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || "C\u1EADp nh\u1EADt ng\u01B0\u1EDDi d\xF9ng th\u1EA5t b\u1EA1i" });
      }
      return res.status(200).json({ success: true, user: result.user });
    }
    if (subpath === "settings") {
      if (req.method === "POST") {
        const updated = updateSystemSettings(body || {});
        return res.status(200).json({ success: true, settings: updated });
      }
      const settings = getSystemSettings();
      return res.status(200).json({ success: true, settings });
    }
    if (subpath === "licenses") {
      const licenses = getAllLicenses();
      return res.status(200).json({ success: true, licenses });
    }
    if (subpath === "licenses/create") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { plan, durationMonths, durationDays, maxDevices, assignedEmail, customerNote, reason } = body || {};
      const item = adminGenerateLicense({
        plan,
        durationMonths: durationMonths !== void 0 ? Number(durationMonths) : void 0,
        durationDays: durationDays !== void 0 ? Number(durationDays) : void 0,
        maxDevices: Number(maxDevices) || 1,
        assignedEmail,
        customerNote,
        reason
      });
      return res.status(200).json({ success: true, license: item });
    }
    if (subpath === "licenses/toggle-status") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { key, status } = body || {};
      const result = adminToggleLicenseStatus(typeof key === "object" ? key : { key, status });
      return res.status(result.success ? 200 : 400).json(result);
    }
    if (subpath === "licenses/reset-devices") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { key, deviceId } = body || {};
      const result = adminResetLicenseDevices(typeof key === "object" ? key : { key, deviceId });
      return res.status(result.success ? 200 : 400).json(result);
    }
    if (subpath === "licenses/delete") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { key } = body || {};
      const result = adminDeleteLicense(typeof key === "object" ? key.key : key);
      return res.status(result.success ? 200 : 400).json(result);
    }
    return res.status(404).json({ error: `Tuy\u1EBFn \u0111\u01B0\u1EDDng qu\u1EA3n tr\u1ECB kh\xF4ng t\u1ED3n t\u1EA1i: /api/admin/${subpath}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
export {
  handler as default
};
