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
async function activateLicenseKey(params) {
  const key = (params.licenseKey || "").trim().toUpperCase();
  if (!key) {
    return { success: false, message: "Vui l\xF2ng nh\u1EADp m\xE3 b\u1EA3n quy\u1EC1n h\u1EE3p l\u1EC7." };
  }
  if (!params.email) {
    return {
      success: false,
      message: "Vui l\xF2ng \u0111\u0103ng nh\u1EADp t\xE0i kho\u1EA3n Google tr\u01B0\u1EDBc khi k\xEDch ho\u1EA1t b\u1EA3n quy\u1EC1n \u0111\u1EC3 li\xEAn k\u1EBFt t\xE0i kho\u1EA3n v\xE0 thi\u1EBFt b\u1ECB."
    };
  }
  const deviceId = (params.deviceId || "").trim() || "DEV_BROWSER_DEFAULT";
  const deviceName = (params.deviceName || "").trim() || "Thi\u1EBFt b\u1ECB ng\u01B0\u1EDDi d\xF9ng";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let lic = store.licenses[key];
  if (!lic && /^SKKN-(PRO|PREMIUM|VIP|SCHOOL|GV|LIC)-[A-Z0-9]+-[A-Z0-9]+$/.test(key)) {
    lic = {
      key,
      plan: key.includes("SCHOOL") ? "SCHOOL" : key.includes("PREMIUM") ? "PREMIUM" : "PRO",
      maxDevices: key.includes("SCHOOL") ? 5 : 1,
      boundDevices: [],
      status: "UNUSED",
      expiresAt: null,
      createdReason: "M\xE3 chu\u1EA9n SKKN REVIEW PRO",
      createdAt: now
    };
    store.licenses[key] = lic;
  }
  if (!lic && process.env.LICENSE_API_URL) {
    try {
      const url = new URL(process.env.LICENSE_API_URL);
      url.searchParams.set("action", "verifyLicense");
      url.searchParams.set("key", key);
      url.searchParams.set("email", params.email);
      const resp = await fetch(url.toString(), { method: "GET" });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data && (data.valid === true || data.status === "ACTIVE" || data.success === true)) {
          lic = {
            key,
            plan: data.plan || "PRO",
            maxDevices: data.maxDevices || 1,
            boundDevices: [],
            status: "UNUSED",
            expiresAt: data.expiresAt || null,
            createdReason: "X\xE1c th\u1EF1c t\u1EEB Google Apps Script License API",
            createdAt: now
          };
          store.licenses[key] = lic;
        }
      }
    } catch (apiErr) {
      console.warn("Could not reach LICENSE_API_URL, checking local database:", apiErr);
    }
  }
  if (!lic) {
    return {
      success: false,
      message: "M\xE3 b\u1EA3n quy\u1EC1n kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c ch\u01B0a ch\xEDnh x\xE1c. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i."
    };
  }
  lic.boundDevices = lic.boundDevices || [];
  if (lic.status === "REVOKED") {
    return {
      success: false,
      message: "M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\xE3 b\u1ECB thu h\u1ED3i ho\u1EB7c t\u1EA1m kh\xF3a b\u1EDFi Qu\u1EA3n tr\u1ECB vi\xEAn."
    };
  }
  if (lic.expiresAt && new Date(lic.expiresAt).getTime() < Date.now()) {
    lic.status = "EXPIRED";
    saveStore();
    return {
      success: false,
      message: "M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\xE3 h\u1EBFt h\u1EA1n s\u1EED d\u1EE5ng."
    };
  }
  if (lic.status === "UNUSED") {
    lic.assignedEmail = params.email;
    lic.boundDevices = [
      {
        deviceId,
        deviceName,
        boundAt: now,
        lastActiveAt: now
      }
    ];
    lic.status = "ACTIVE";
    lic.activatedAt = now;
    let user = findUserByEmailOrId(params.email);
    if (!user) {
      user = await getOrCreateUser({ email: params.email });
    }
    user.role = "LICENSED";
    user.plan = lic.plan || "LICENSED";
    user.licenseKey = key;
    user.licenseExpiresAt = lic.expiresAt;
    saveStore();
    return {
      success: true,
      message: `K\xEDch ho\u1EA1t th\xE0nh c\xF4ng m\xE3 b\u1EA3n quy\u1EC1n! T\xE0i kho\u1EA3n ${params.email} v\xE0 thi\u1EBFt b\u1ECB hi\u1EC7n t\u1EA1i \u0111\xE3 \u0111\u01B0\u1EE3c li\xEAn k\u1EBFt ch\xEDnh th\u1EE9c.`,
      license: lic,
      user
    };
  }
  if (lic.status === "ACTIVE") {
    if (lic.assignedEmail && lic.assignedEmail.toLowerCase() !== params.email.toLowerCase()) {
      return {
        success: false,
        message: `M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t cho t\xE0i kho\u1EA3n Google ${lic.assignedEmail}. M\u1ED7i m\xE3 b\u1EA3n quy\u1EC1n g\u1EAFn c\u1ED1 \u0111\u1ECBnh v\u1EDBi 01 t\xE0i kho\u1EA3n Google s\u1EDF h\u1EEFu.`
      };
    }
    if (!lic.assignedEmail) {
      lic.assignedEmail = params.email;
    }
    const existingDeviceIndex = lic.boundDevices.findIndex((d) => d.deviceId === deviceId);
    if (existingDeviceIndex >= 0) {
      lic.boundDevices[existingDeviceIndex].lastActiveAt = now;
      let user2 = findUserByEmailOrId(params.email);
      if (!user2) user2 = await getOrCreateUser({ email: params.email });
      if (user2.role !== "ADMIN") {
        user2.role = "LICENSED";
        user2.plan = lic.plan || "LICENSED";
        user2.licenseKey = key;
        user2.licenseExpiresAt = lic.expiresAt;
      }
      saveStore();
      return {
        success: true,
        message: "Thi\u1EBFt b\u1ECB v\xE0 t\xE0i kho\u1EA3n \u0111\xE3 \u0111\u01B0\u1EE3c x\xE1c th\u1EF1c b\u1EA3n quy\u1EC1n th\xE0nh c\xF4ng.",
        license: lic,
        user: user2
      };
    }
    const maxAllowed = lic.maxDevices || 1;
    if (lic.boundDevices.length >= maxAllowed) {
      const boundNames = lic.boundDevices.map((d) => d.deviceName || d.deviceId).join(", ");
      return {
        success: false,
        message: `M\xE3 b\u1EA3n quy\u1EC1n \u0111\xE3 \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t \u0111\u1EE7 s\u1ED1 l\u01B0\u1EE3ng thi\u1EBFt b\u1ECB cho ph\xE9p (${lic.boundDevices.length}/${maxAllowed} thi\u1EBFt b\u1ECB: ${boundNames}). \u0110\u1EC3 k\xEDch ho\u1EA1t tr\xEAn thi\u1EBFt b\u1ECB m\u1EDBi n\xE0y, vui l\xF2ng li\xEAn h\u1EC7 Qu\u1EA3n tr\u1ECB vi\xEAn \u0111\u1EC3 Chuy\u1EC3n thi\u1EBFt b\u1ECB (Reset Device).`
      };
    }
    lic.boundDevices.push({
      deviceId,
      deviceName,
      boundAt: now,
      lastActiveAt: now
    });
    let user = findUserByEmailOrId(params.email);
    if (!user) user = await getOrCreateUser({ email: params.email });
    if (user.role !== "ADMIN") {
      user.role = "LICENSED";
      user.plan = lic.plan || "LICENSED";
      user.licenseKey = key;
      user.licenseExpiresAt = lic.expiresAt;
    }
    saveStore();
    return {
      success: true,
      message: `K\xEDch ho\u1EA1t b\u1EA3n quy\u1EC1n tr\xEAn thi\u1EBFt b\u1ECB m\u1EDBi th\xE0nh c\xF4ng! (S\u1ED1 thi\u1EBFt b\u1ECB \u0111\xE3 k\xEDch ho\u1EA1t: ${lic.boundDevices.length}/${maxAllowed})`,
      license: lic,
      user
    };
  }
  return {
    success: false,
    message: "Tr\u1EA1ng th\xE1i m\xE3 b\u1EA3n quy\u1EC1n kh\xF4ng h\u1EE3p l\u1EC7."
  };
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

// server/api/license.ts
async function handler(req, res) {
  if (handleCors(req, res)) return;
  res.setHeader("Content-Type", "application/json");
  const subpath = extractSubpath(req, "/api/license");
  if (subpath === "activate" || subpath === "") {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
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
        deviceName
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  return res.status(404).json({ error: `Tuy\u1EBFn \u0111\u01B0\u1EDDng gi\u1EA5y ph\xE9p kh\xF4ng t\u1ED3n t\u1EA1i: /api/license/${subpath}` });
}
export {
  handler as default
};
