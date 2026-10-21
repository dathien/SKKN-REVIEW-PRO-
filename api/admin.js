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
        quota: { easy: -1, advanced: -1 },
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
      Object.values(store.users).forEach((u) => {
        if (!u) return;
        const isRootAdmin = ROOT_ADMIN_EMAILS.includes(u.email?.toLowerCase());
        if (isRootAdmin) {
          u.role = "ADMIN";
          u.plan = "PRO";
          u.quota = { easy: -1, advanced: -1 };
          u.licenseKey = "SKKN-ADMIN-SYSTEM";
          u.isBlocked = false;
          return;
        }
        const planUpper = String(u.plan || "").toUpperCase().trim();
        if (planUpper === "LICENSED" || planUpper.includes("PRO")) {
          u.plan = "PRO";
        }
        if (u.plan === "PRO" || u.plan === "PREMIUM" || u.plan === "SCHOOL" || u.role === "LICENSED") {
          if (u.role !== "BLOCKED") {
            u.role = "LICENSED";
          }
          if (u.quota?.easy === 3 && u.quota?.advanced === 1) {
            u.quota = { easy: -1, advanced: -1 };
          }
        }
      });
      const tamEmail = "nguyenthithanhtam3410@gmail.com";
      if (store.users[tamEmail]) {
        store.users[tamEmail].role = "LICENSED";
        store.users[tamEmail].plan = "PRO";
        store.users[tamEmail].quota = { easy: -1, advanced: -1 };
        store.users[tamEmail].licenseKey = store.users[tamEmail].licenseKey || "SKKN-PRO-THANHTAM-VIP";
        store.users[tamEmail].licenseExpiresAt = null;
        store.users[tamEmail].isBlocked = false;
      }
    }
  } catch (err) {
    console.error("Could not load auth store, using in-memory store:", err);
  }
  initDefaultData();
  saveStore();
}
function reloadStoreFromDisk() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && parsed.users) {
        store.users = parsed.users;
        if (parsed.guests) store.guests = parsed.guests;
        if (parsed.licenses) store.licenses = parsed.licenses;
        if (parsed.stats) store.stats = parsed.stats;
        if (parsed.settings) store.settings = parsed.settings;
      }
    }
  } catch (_) {
  }
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
  reloadStoreFromDisk();
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
  let plan = "TRIAL";
  if (rawPlan === "SCHOOL" || rawPlan.includes("SCHOOL")) {
    plan = "SCHOOL";
  } else if (rawPlan === "PREMIUM" || rawPlan.includes("PREMIUM")) {
    plan = "PREMIUM";
  } else if (rawPlan === "PRO" || rawPlan.includes("PRO") || rawPlan === "LICENSED" || rawPlan === "VIP" || raw.role === "LICENSED" || raw.role === "PRO") {
    plan = "PRO";
  }
  const rawRole = String(raw.role || raw.ROLE || raw.userRole || raw.USER_ROLE || "").toUpperCase().trim();
  let role;
  if (rawRole === "ADMIN") {
    role = "ADMIN";
  } else if (rawRole === "BLOCKED") {
    role = "BLOCKED";
  } else if (rawRole === "FREE_ACCESS" || rawRole === "FREE") {
    role = "FREE_ACCESS";
  } else if (rawRole === "LICENSED" || rawRole === "PRO" || plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM") {
    role = "LICENSED";
  } else {
    role = "TRIAL";
  }
  if (ROOT_ADMIN_EMAILS.includes(email)) {
    role = "ADMIN";
    plan = "PRO";
  }
  function parseQuotaVal(v, fallback) {
    if (v === void 0 || v === null || v === "") return fallback;
    const str = String(v).trim().toUpperCase();
    if (str === "UNLIMITED" || str === "-1") return -1;
    const num = Number(str);
    if (isNaN(num)) return fallback;
    return Math.max(0, num);
  }
  const isUnlimitedPlan = plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" || role === "ADMIN" || role === "LICENSED" || role === "FREE_ACCESS";
  const defaultEasy = isUnlimitedPlan ? -1 : 3;
  const defaultAdvanced = isUnlimitedPlan ? -1 : 1;
  let easyQuota = defaultEasy;
  let advancedQuota = defaultAdvanced;
  if (raw.quota?.easy !== void 0) easyQuota = parseQuotaVal(raw.quota.easy, defaultEasy);
  else if (raw.quotaEasy !== void 0) easyQuota = parseQuotaVal(raw.quotaEasy, defaultEasy);
  else if (raw.QUOTA_EASY !== void 0) easyQuota = parseQuotaVal(raw.QUOTA_EASY, defaultEasy);
  else if (raw.easyLimit !== void 0 || raw.EASY_LIMIT !== void 0) {
    const limitRaw = raw.easyLimit !== void 0 ? raw.easyLimit : raw.EASY_LIMIT;
    const limitParsed = parseQuotaVal(limitRaw, defaultEasy);
    if (limitParsed === -1) {
      easyQuota = -1;
    } else {
      const used = Number(raw.easyUsed !== void 0 ? raw.easyUsed : raw.EASY_USED || 0);
      easyQuota = Math.max(0, limitParsed - (isNaN(used) ? 0 : used));
    }
  }
  if (raw.quota?.advanced !== void 0) advancedQuota = parseQuotaVal(raw.quota.advanced, defaultAdvanced);
  else if (raw.quotaAdvanced !== void 0) advancedQuota = parseQuotaVal(raw.quotaAdvanced, defaultAdvanced);
  else if (raw.QUOTA_ADVANCED !== void 0) advancedQuota = parseQuotaVal(raw.QUOTA_ADVANCED, defaultAdvanced);
  else if (raw.advancedLimit !== void 0 || raw.ADVANCED_LIMIT !== void 0) {
    const limitRaw = raw.advancedLimit !== void 0 ? raw.advancedLimit : raw.ADVANCED_LIMIT;
    const limitParsed = parseQuotaVal(limitRaw, defaultAdvanced);
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
function isUserAdmin(identifier) {
  if (!identifier) return false;
  const user = findUserByEmailOrId(identifier);
  return user?.role === "ADMIN";
}
function getSessionSecret() {
  return process.env.APPS_SCRIPT_SECRET || process.env.SESSION_SECRET || "skkn_secure_session_secret_2026";
}
function verifyAdminSessionToken(token) {
  if (!token) return null;
  const clean = token.replace(/^Bearer\s+/i, "").trim();
  if (clean.startsWith("skkn_sess_")) {
    const withoutPrefix = clean.slice("skkn_sess_".length);
    const dotIdx = withoutPrefix.indexOf(".");
    if (dotIdx !== -1) {
      const b64Payload = withoutPrefix.slice(0, dotIdx);
      const sig = withoutPrefix.slice(dotIdx + 1);
      try {
        const payload = Buffer.from(b64Payload, "base64url").toString("utf-8");
        const expectedSig = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
        if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
          const parts = payload.split("|");
          const email = parts[0];
          const role = parts[1] || "ADMIN";
          const expiresAt = Number(parts[2]);
          if (expiresAt > Date.now()) {
            return { email: email.toLowerCase().trim(), role };
          }
        }
      } catch {
      }
    }
  }
  const g = globalThis;
  if (g.__skkn_sessions && g.__skkn_sessions[clean]) {
    const s = g.__skkn_sessions[clean];
    if (s.expiresAt > Date.now()) {
      return { email: s.email, role: s.role };
    }
  }
  return null;
}
function verifyGoogleIdToken(token) {
  if (!token || typeof token !== "string") return null;
  const clean = token.replace(/^Bearer\s+/i, "").trim();
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    if (payload.exp && payload.exp * 1e3 < Date.now()) {
      return null;
    }
    if (payload.iss && !payload.iss.includes("accounts.google.com")) {
      return null;
    }
    if (payload.email) {
      return {
        email: String(payload.email).toLowerCase().trim(),
        name: payload.name
      };
    }
  } catch {
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
    const isUnlimited = isRootAdmin || plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" || role === "ADMIN" || role === "LICENSED";
    const quota = isUnlimited ? { easy: -1, advanced: -1 } : remoteData?.quota || { easy: defaultTrialEasy, advanced: defaultTrialAdvanced };
    user = {
      id: userId,
      email,
      name: isRootAdmin ? profile.name || "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n" : remoteData?.name || profile.name || email.split("@")[0],
      picture: profile.picture,
      role,
      plan,
      quota,
      licenseKey: isRootAdmin ? "SKKN-ADMIN-SYSTEM" : remoteData?.licenseKey || (role === "ADMIN" ? "SKKN-ADMIN-SYSTEM" : void 0),
      licenseExpiresAt: remoteData?.licenseExpiresAt || null,
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
      user.quota = { easy: -1, advanced: -1 };
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
      if (remoteData?.licenseKey) {
        user.licenseKey = remoteData.licenseKey;
      }
      if (remoteData?.licenseExpiresAt !== void 0) {
        user.licenseExpiresAt = remoteData.licenseExpiresAt;
      }
      if (remoteData?.name) {
        user.name = remoteData.name;
      } else if (profile.name) {
        user.name = profile.name;
      }
      if (user.plan === "PRO" || user.plan === "SCHOOL" || user.plan === "PREMIUM" || user.role === "LICENSED") {
        user.quota = { easy: -1, advanced: -1 };
      } else if (remoteData?.quota) {
        user.quota = remoteData.quota;
      }
    }
    if (profile.picture) user.picture = profile.picture;
    user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
    saveStore();
  }
  return user;
}
function getSystemStats() {
  const usersList = Object.values(store.users);
  const isLicensedUser = (u) => u.role === "LICENSED" || u.plan === "PRO" || u.plan === "PREMIUM" || u.plan === "SCHOOL" || u.plan === "LICENSED" || u.role === "ADMIN" || u.quota?.easy === -1;
  const licensedUsers = usersList.filter(isLicensedUser).length;
  const trialUsers = usersList.filter((u) => !isLicensedUser(u) && u.role !== "BLOCKED" && !u.isBlocked).length;
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
async function checkSheetCompatibility() {
  if (!process.env.LICENSE_API_URL) {
    return {
      success: false,
      compatible: true,
      message: "LICENSE_API_URL ch\u01B0a c\u1EA5u h\xECnh tr\xEAn m\xF4i tr\u01B0\u1EDDng n\xE0y (s\u1EED d\u1EE5ng c\u01A1 s\u1EDF d\u1EEF li\u1EC7u c\u1EE5c b\u1ED9)."
    };
  }
  try {
    const url = new URL(process.env.LICENSE_API_URL);
    url.searchParams.set("action", "inspectSchema");
    const resp = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(15e3) });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.usersSchema) {
        return {
          success: true,
          compatible: Boolean(data.usersSchema.compatible),
          version: data.version || "2.7",
          schemaType: data.usersSchema.type,
          columnCount: data.usersSchema.columnCount,
          headers: data.usersSchema.headers,
          message: `C\u1EA5u tr\xFAc Google Sheets ho\xE0n to\xE0n t\u01B0\u01A1ng th\xEDch (${data.usersSchema.type}, ${data.usersSchema.columnCount} c\u1ED9t).`
        };
      }
    }
    const pingUrl = new URL(process.env.LICENSE_API_URL);
    pingUrl.searchParams.set("action", "ping");
    const pingResp = await fetch(pingUrl.toString(), { method: "GET", signal: AbortSignal.timeout(15e3) });
    if (pingResp.ok) {
      const pingData = await pingResp.json().catch(() => null);
      if (pingData?.success) {
        return {
          success: true,
          compatible: true,
          version: pingData.version || "v2.x",
          schemaType: "COMPATIBLE_FALLBACK",
          message: "K\u1EBFt n\u1ED1i Apps Script th\xE0nh c\xF4ng. L\u1EDBp t\u01B0\u01A1ng th\xEDch ng\u01B0\u1EE3c t\u1EF1 \u0111\u1ED9ng nh\u1EADn di\u1EC7n schema 13 c\u1ED9t ho\u1EB7c 12 c\u1ED9t."
        };
      }
    }
    return {
      success: false,
      compatible: false,
      message: "Apps Script ph\u1EA3n h\u1ED3i kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng. C\u1EA7n ki\u1EC3m tra l\u1EA1i m\xE3 ngu\u1ED3n tri\u1EC3n khai."
    };
  } catch (err) {
    return {
      success: false,
      compatible: false,
      message: `Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i \u0111\u1EBFn Google Sheets Apps Script: ${err.message}`,
      error: err.message
    };
  }
}
async function getAllUsersAndGuests() {
  reloadStoreFromDisk();
  if (process.env.LICENSE_API_URL) {
    try {
      const resp = await fetch(process.env.LICENSE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getUsers",
          operatorEmail: "dathien2412@gmail.com",
          isBackendAuthorized: true,
          serverSecret: process.env.APPS_SCRIPT_SECRET || ""
        }),
        signal: AbortSignal.timeout(15e3)
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
        list.forEach((u) => {
          if (u) {
            const mapped = mapRawSheetUserToAccount(u);
            if (mapped && mapped.email) {
              const email = mapped.email;
              const existing = store.users[email];
              const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
              const role = isRootAdmin ? "ADMIN" : mapped.role || "TRIAL";
              const plan = isRootAdmin ? "PRO" : mapped.plan || (role === "ADMIN" ? "PRO" : "TRIAL");
              const isUnlimited = isRootAdmin || plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" || role === "LICENSED";
              const quota = isUnlimited ? { easy: -1, advanced: -1 } : mapped.quota || { easy: 3, advanced: 1 };
              if (!existing) {
                store.users[email] = {
                  id: mapped.id || `usr_sheet_${email.split("@")[0]}`,
                  email,
                  name: mapped.name || (isRootAdmin ? "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n" : email.split("@")[0]),
                  role,
                  plan,
                  quota,
                  licenseKey: mapped.licenseKey || (isRootAdmin ? "SKKN-ADMIN-SYSTEM" : void 0),
                  licenseExpiresAt: mapped.licenseExpiresAt || null,
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
                  isBlocked: isRootAdmin ? false : Boolean(mapped.isBlocked)
                };
              } else {
                if (!isRootAdmin) {
                  existing.role = role;
                  existing.plan = plan;
                  existing.isBlocked = Boolean(mapped.isBlocked);
                }
                if (mapped.name) existing.name = mapped.name;
                if (mapped.licenseKey) existing.licenseKey = mapped.licenseKey;
                if (mapped.licenseExpiresAt !== void 0) existing.licenseExpiresAt = mapped.licenseExpiresAt;
                existing.quota = quota;
              }
            }
          }
        });
        saveStore();
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
async function adminUpdateUser(params) {
  let user = findUserByEmailOrId(params.email);
  if (!user && process.env.LICENSE_API_URL) {
    try {
      await getAllUsersAndGuests();
      user = findUserByEmailOrId(params.email);
    } catch {
    }
  }
  if (!user) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" };
  }
  const isTargetRoot = ROOT_ADMIN_EMAILS.includes(user.email.toLowerCase());
  if (isTargetRoot) {
    if (params.isBlocked === true) {
      return {
        success: false,
        error: "Quy t\u1EAFc an to\xE0n Qu\u1EA3n tr\u1ECB: Kh\xF4ng th\u1EC3 kh\xF3a t\xE0i kho\u1EA3n Root Admin."
      };
    }
    if (params.role && params.role !== "ADMIN") {
      return {
        success: false,
        error: "Quy t\u1EAFc an to\xE0n Qu\u1EA3n tr\u1ECB: Kh\xF4ng th\u1EC3 t\u1EF1 thu h\u1ED3i quy\u1EC1n Qu\u1EA3n tr\u1ECB vi\xEAn c\u1EE7a Root Admin."
      };
    }
  }
  const oldUserSnapshot = JSON.parse(JSON.stringify(user));
  const oldEmail = user.email.toLowerCase();
  if (params.name !== void 0 && params.name.trim()) {
    user.name = params.name.trim();
  }
  let emailChanged = false;
  let newEmailNormalized = "";
  if (params.newEmail) {
    newEmailNormalized = params.newEmail.trim().toLowerCase();
    if (!newEmailNormalized || !newEmailNormalized.includes("@")) {
      return { success: false, error: "\u0110\u1ECBa ch\u1EC9 email m\u1EDBi kh\xF4ng h\u1EE3p l\u1EC7." };
    }
    if (newEmailNormalized !== oldEmail) {
      if (isTargetRoot) {
        return { success: false, error: "B\u1EA3o m\u1EADt: Kh\xF4ng \u0111\u01B0\u1EE3c ph\xE9p thay \u0111\u1ED5i email c\u1EE7a Root Admin." };
      }
      const existingUserWithNewEmail = findUserByEmailOrId(newEmailNormalized);
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== user.id) {
        return {
          success: false,
          error: `Email "${newEmailNormalized}" \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng b\u1EDFi m\u1ED9t t\xE0i kho\u1EA3n kh\xE1c trong h\u1EC7 th\u1ED1ng.`
        };
      }
      user.email = newEmailNormalized;
      emailChanged = true;
      delete store.users[oldEmail];
      store.users[newEmailNormalized] = user;
      Object.values(store.licenses).forEach((lic) => {
        if (lic.assignedEmail && lic.assignedEmail.toLowerCase() === oldEmail) {
          lic.assignedEmail = newEmailNormalized;
        }
      });
    }
  }
  if (params.role !== void 0) {
    user.role = isTargetRoot ? "ADMIN" : params.role;
  }
  if (params.plan !== void 0) {
    const rawP = String(params.plan).toUpperCase().trim();
    const normalizedPlan = rawP === "LICENSED" || rawP.includes("PRO") ? "PRO" : params.plan;
    user.plan = isTargetRoot ? "PRO" : normalizedPlan;
    if (user.plan === "PRO" || user.plan === "PREMIUM" || user.plan === "SCHOOL" || user.role === "LICENSED") {
      if (user.role !== "ADMIN") user.role = "LICENSED";
      user.quota = { easy: -1, advanced: -1 };
      user.licenseExpiresAt = params.expiresAt !== void 0 ? params.expiresAt : user.licenseExpiresAt;
    } else if (user.plan === "TRIAL") {
      if (user.role !== "ADMIN") user.role = "TRIAL";
      user.licenseExpiresAt = null;
      if (!params.quota) {
        user.quota = {
          easy: store.settings?.trialEasyLimit ?? 3,
          advanced: store.settings?.trialAdvancedLimit ?? 1
        };
      }
    }
  }
  if (params.expiresAt !== void 0) {
    user.licenseExpiresAt = params.expiresAt;
  }
  if (params.quota !== void 0) {
    user.quota = params.quota;
  }
  if (params.isBlocked !== void 0) {
    if (isTargetRoot) {
      user.isBlocked = false;
    } else {
      user.isBlocked = params.isBlocked;
      if (params.isBlocked) {
        user.role = "BLOCKED";
      } else if (user.role === "BLOCKED") {
        user.role = user.plan === "PRO" || user.plan === "LICENSED" || user.plan === "PREMIUM" || user.plan === "SCHOOL" ? "LICENSED" : "TRIAL";
      }
    }
  }
  user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
  saveStore();
  if (process.env.LICENSE_API_URL) {
    const sheetRes = await syncUserToGoogleSheet(user, {
      operatorEmail: params.operatorEmail,
      explicitQuota: params.quota !== void 0,
      previousEmail: emailChanged ? oldEmail : void 0
    });
    if (!sheetRes.success) {
      if (emailChanged) {
        delete store.users[user.email];
      }
      store.users[oldEmail] = oldUserSnapshot;
      saveStore();
      return {
        success: false,
        error: `L\u01B0u th\u1EA5t b\u1EA1i l\xEAn Google Sheets: ${sheetRes.error || "Apps Script kh\xF4ng ph\u1EA3n h\u1ED3i"}. D\u1EEF li\u1EC7u c\u0169 \u0111\xE3 \u0111\u01B0\u1EE3c kh\xF4i ph\u1EE5c nguy\xEAn v\u1EB9n.`
      };
    }
    if (sheetRes.verifiedUser) {
      if (sheetRes.verifiedUser.name) {
        user.name = sheetRes.verifiedUser.name;
      }
      if (sheetRes.verifiedUser.id) {
        user.id = sheetRes.verifiedUser.id;
      }
    }
    saveStore();
    return {
      success: true,
      user,
      sheetSynced: true,
      message: "\u0110\xE3 c\u1EADp nh\u1EADt v\xE0 x\xE1c nh\u1EADn l\u01B0u th\xE0nh c\xF4ng xu\u1ED1ng Google Sheets USERS."
    };
  }
  return { success: true, user, sheetSynced: false, message: "\u0110\xE3 c\u1EADp nh\u1EADt th\xF4ng tin ng\u01B0\u1EDDi d\xF9ng th\xE0nh c\xF4ng." };
}
async function adminCreateUser(params) {
  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email kh\xF4ng h\u1EE3p l\u1EC7" };
  }
  let user = findUserByEmailOrId(email);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
  if (user) {
    if (params.plan !== void 0) {
      const p = String(params.plan).toUpperCase().trim();
      user.plan = isRootAdmin ? "PRO" : p === "LICENSED" || p.includes("PRO") ? "PRO" : params.plan;
    }
    if (params.role !== void 0) user.role = isRootAdmin ? "ADMIN" : params.role;
    if (user.plan === "PRO" || user.plan === "SCHOOL" || user.plan === "PREMIUM" || user.role === "LICENSED") {
      if (user.role !== "ADMIN" && user.role !== "BLOCKED") user.role = "LICENSED";
      if (!params.quota) user.quota = { easy: -1, advanced: -1 };
    }
    if (params.name) user.name = params.name.trim();
    if (params.quota) user.quota = params.quota;
    if (params.expiresAt !== void 0) user.licenseExpiresAt = params.expiresAt;
    user.lastActiveAt = now;
    saveStore();
    if (process.env.LICENSE_API_URL) {
      const sheetRes = await syncUserToGoogleSheet(user);
      if (!sheetRes.success) {
        return {
          success: true,
          user,
          sheetSynced: false,
          warning: "C\u1EADp nh\u1EADt th\xE0nh c\xF4ng v\xE0o c\u01A1 s\u1EDF d\u1EEF li\u1EC7u \u1EE9ng d\u1EE5ng. L\u01B0u \xFD: Google Sheets ch\u01B0a ghi nh\u1EADn (DEPLOY REQUIRED: C\u1EA7n c\u1EADp nh\u1EADt Code.gs v2.7)."
        };
      }
      return { success: true, user, sheetSynced: true, message: "\u0110\xE3 c\u1EADp nh\u1EADt v\xE0 x\xE1c nh\u1EADn l\u01B0u th\xE0nh c\xF4ng xu\u1ED1ng Google Sheets USERS." };
    }
    return { success: true, user, sheetSynced: false };
  }
  let planCandidate = params.plan || "TRIAL";
  const rawP = String(planCandidate).toUpperCase().trim();
  if (rawP === "LICENSED" || rawP.includes("PRO")) {
    planCandidate = "PRO";
  }
  const role = isRootAdmin ? "ADMIN" : params.role || (planCandidate === "PRO" ? "LICENSED" : "TRIAL");
  const plan = isRootAdmin ? "PRO" : planCandidate;
  const isUnlimited = isRootAdmin || plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" || role === "LICENSED";
  const defaultTrialEasy = isUnlimited ? -1 : store.settings?.trialEasyLimit ?? 3;
  const defaultTrialAdvanced = isUnlimited ? -1 : store.settings?.trialAdvancedLimit ?? 1;
  const quota = params.quota || { easy: defaultTrialEasy, advanced: defaultTrialAdvanced };
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
  if (process.env.LICENSE_API_URL) {
    const sheetRes = await syncUserToGoogleSheet(user);
    if (!sheetRes.success) {
      return {
        success: true,
        user,
        sheetSynced: false,
        warning: "T\u1EA1o t\xE0i kho\u1EA3n th\xE0nh c\xF4ng v\xE0o c\u01A1 s\u1EDF d\u1EEF li\u1EC7u \u1EE9ng d\u1EE5ng. L\u01B0u \xFD: Google Sheets ch\u01B0a ghi nh\u1EADn (DEPLOY REQUIRED: C\u1EA7n c\u1EADp nh\u1EADt Code.gs v2.7)."
      };
    }
    return { success: true, user, sheetSynced: true, message: "\u0110\xE3 t\u1EA1o v\xE0 x\xE1c nh\u1EADn l\u01B0u th\xE0nh c\xF4ng xu\u1ED1ng Google Sheets USERS." };
  }
  return { success: true, user, sheetSynced: false };
}
async function syncUserToGoogleSheet(user, options) {
  if (!process.env.LICENSE_API_URL) return { success: false, error: "Ch\u01B0a c\u1EA5u h\xECnh LICENSE_API_URL" };
  try {
    const operatorEmail = typeof options === "string" ? options : options?.operatorEmail;
    const explicitQuota = typeof options === "object" ? Boolean(options?.explicitQuota) : false;
    const previousEmail = typeof options === "object" ? options?.previousEmail : void 0;
    const payload = {
      action: "saveUser",
      id: user.id,
      email: user.email,
      previousEmail,
      name: user.name,
      role: user.role,
      plan: user.plan,
      explicitQuota,
      licenseKey: user.licenseKey || "",
      licenseExpiresAt: user.licenseExpiresAt || "",
      isBlocked: Boolean(user.isBlocked),
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      operatorEmail: operatorEmail || "dathien2412@gmail.com",
      isBackendAuthorized: true,
      serverSecret: process.env.APPS_SCRIPT_SECRET || ""
    };
    if (explicitQuota) {
      payload.quotaEasy = user.quota?.easy ?? (user.plan === "PRO" ? -1 : 3);
      payload.quotaAdvanced = user.quota?.advanced ?? (user.plan === "PRO" ? -1 : 1);
    }
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15e3)
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.success === false) {
        return { success: false, error: data.error || "Google Apps Script t\u1EEB ch\u1ED1i ghi d\u1EEF li\u1EC7u" };
      }
      return { success: Boolean(data?.success ?? true), verifiedUser: data?.user };
    }
    return { success: false, error: `HTTP ${resp.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function deleteUserFromGoogleSheet(email, options) {
  if (!process.env.LICENSE_API_URL) return { success: false, error: "Ch\u01B0a c\u1EA5u h\xECnh LICENSE_API_URL" };
  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteUser",
        email,
        operatorEmail: options?.operatorEmail || "dathien2412@gmail.com",
        isBackendAuthorized: true,
        permanent: false,
        // Mặc định chỉ khóa (soft-delete), tạm vô hiệu hóa hard-delete qua API
        serverSecret: process.env.APPS_SCRIPT_SECRET || ""
      }),
      signal: AbortSignal.timeout(15e3)
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.success === false) {
        return { success: false, error: data.error || "Google Apps Script t\u1EEB ch\u1ED1i x\xF3a d\u1EEF li\u1EC7u" };
      }
      return { success: Boolean(data?.success ?? true) };
    }
    return { success: false, error: `HTTP ${resp.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function syncAllUsersToGoogleSheet(operatorEmail) {
  const users = Object.values(store.users);
  if (!process.env.LICENSE_API_URL) {
    return { success: false, syncedCount: 0, totalCount: users.length, error: "Ch\u01B0a c\u1EA5u h\xECnh LICENSE_API_URL" };
  }
  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "syncUsers",
        users,
        operatorEmail: operatorEmail || "dathien2412@gmail.com",
        isBackendAuthorized: true,
        serverSecret: process.env.APPS_SCRIPT_SECRET || ""
      }),
      signal: AbortSignal.timeout(2e4)
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.success === false) {
        return { success: false, syncedCount: 0, totalCount: users.length, error: data.error || "L\u1ED7i \u0111\u1ED3ng b\u1ED9 Apps Script" };
      }
      return {
        success: true,
        syncedCount: data?.syncedCount ?? users.length,
        totalCount: users.length
      };
    }
    let synced = 0;
    for (const u of users) {
      const res = await syncUserToGoogleSheet(u, operatorEmail);
      if (res.success) synced++;
    }
    return { success: synced > 0, syncedCount: synced, totalCount: users.length };
  } catch (err) {
    return { success: false, syncedCount: 0, totalCount: users.length, error: err.message };
  }
}
async function adminSyncGoogleSheets(params) {
  let remoteUsersCount = 0;
  const conflicts = [];
  if (process.env.LICENSE_API_URL) {
    try {
      const resp = await fetch(process.env.LICENSE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getUsers",
          operatorEmail: "dathien2412@gmail.com",
          isBackendAuthorized: true,
          serverSecret: process.env.APPS_SCRIPT_SECRET || ""
        }),
        signal: AbortSignal.timeout(6e3)
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
        remoteUsersCount = list.length;
        list.forEach((u) => {
          if (u) {
            const mapped = mapRawSheetUserToAccount(u);
            if (mapped && mapped.email) {
              const email = mapped.email;
              const existing = store.users[email];
              if (existing) {
                const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
                const remoteRole = isRootAdmin ? "ADMIN" : mapped.role || "TRIAL";
                const remotePlan = isRootAdmin ? "PRO" : mapped.plan || "TRIAL";
                const remoteBlocked = isRootAdmin ? false : Boolean(mapped.isBlocked);
                if (existing.role !== remoteRole) {
                  conflicts.push({
                    email,
                    name: existing.name || mapped.name || email,
                    field: "Vai tr\xF2 (Role)",
                    localValue: existing.role,
                    remoteValue: remoteRole
                  });
                }
                if (existing.plan !== remotePlan) {
                  conflicts.push({
                    email,
                    name: existing.name || mapped.name || email,
                    field: "G\xF3i (Plan)",
                    localValue: existing.plan,
                    remoteValue: remotePlan
                  });
                }
                if (Boolean(existing.isBlocked) !== remoteBlocked) {
                  conflicts.push({
                    email,
                    name: existing.name || mapped.name || email,
                    field: "Tr\u1EA1ng th\xE1i kh\xF3a",
                    localValue: existing.isBlocked ? "\u0110ang kh\xF3a" : "Ho\u1EA1t \u0111\u1ED9ng",
                    remoteValue: remoteBlocked ? "\u0110ang kh\xF3a" : "Ho\u1EA1t \u0111\u1ED9ng"
                  });
                }
              }
            }
          }
        });
        if (conflicts.length > 0 && !params?.confirmConflicts && !params?.resolveStrategy) {
          return {
            success: true,
            hasConflicts: true,
            conflicts,
            localUsersCount: Object.keys(store.users).length,
            remoteUsersCount,
            syncedToRemoteCount: 0,
            message: `Ph\xE1t hi\u1EC7n ${conflicts.length} xung \u0111\u1ED9t d\u1EEF li\u1EC7u gi\u1EEFa Web App v\xE0 Google Sheets. Vui l\xF2ng xem tr\u01B0\u1EDBc v\xE0 ch\u1ECDn ph\u01B0\u01A1ng \xE1n gi\u1EA3i quy\u1EBFt.`
          };
        }
        list.forEach((u) => {
          if (u) {
            const mapped = mapRawSheetUserToAccount(u);
            if (mapped && mapped.email) {
              const email = mapped.email;
              const existing = store.users[email];
              const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email);
              const role = isRootAdmin ? "ADMIN" : mapped.role || "TRIAL";
              const plan = isRootAdmin ? "PRO" : mapped.plan || "TRIAL";
              const isUnlimited = isRootAdmin || plan === "PRO" || plan === "SCHOOL" || plan === "PREMIUM" || role === "LICENSED";
              const quota = isUnlimited ? { easy: -1, advanced: -1 } : mapped.quota || { easy: 3, advanced: 1 };
              if (!existing) {
                store.users[email] = {
                  id: mapped.id || `usr_sheet_${email.split("@")[0]}`,
                  email,
                  name: mapped.name || (isRootAdmin ? "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n" : email.split("@")[0]),
                  role,
                  plan,
                  quota,
                  licenseKey: mapped.licenseKey || (isRootAdmin ? "SKKN-ADMIN-SYSTEM" : void 0),
                  licenseExpiresAt: mapped.licenseExpiresAt || null,
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
                  isBlocked: isRootAdmin ? false : Boolean(mapped.isBlocked)
                };
              } else if (params?.resolveStrategy === "keep_remote") {
                if (!isRootAdmin) {
                  existing.role = role;
                  existing.plan = plan;
                  existing.isBlocked = Boolean(mapped.isBlocked);
                }
                if (mapped.name) existing.name = mapped.name;
                if (mapped.licenseKey) existing.licenseKey = mapped.licenseKey;
                if (mapped.licenseExpiresAt !== void 0) existing.licenseExpiresAt = mapped.licenseExpiresAt;
                existing.quota = quota;
              }
            }
          }
        });
        saveStore();
      }
    } catch (err) {
      console.warn("Could not pull from Google Sheets during admin sync:", err);
    }
  }
  let pushSynced = 0;
  if (params?.resolveStrategy !== "keep_remote") {
    const pushRes = await syncAllUsersToGoogleSheet();
    pushSynced = pushRes.syncedCount;
  }
  return {
    success: true,
    hasConflicts: false,
    localUsersCount: Object.keys(store.users).length,
    remoteUsersCount,
    syncedToRemoteCount: pushSynced,
    message: process.env.LICENSE_API_URL ? `\u0110\u1ED3ng b\u1ED9 ho\xE0n t\u1EA5t: ${Object.keys(store.users).length} ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 c\u1EADp nh\u1EADt b\u1EC1n v\u1EEFng v\u1EDBi Google Sheets.` : "\u0110\xE3 c\u1EADp nh\u1EADt d\u1EEF li\u1EC7u c\u1EE5c b\u1ED9. LICENSE_API_URL ch\u01B0a c\u1EA5u h\xECnh tr\xEAn m\xF4i tr\u01B0\u1EDDng n\xE0y."
  };
}
async function adminDeleteUser(params) {
  const email = params.email.trim().toLowerCase();
  const user = findUserByEmailOrId(email);
  if (!user) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng \u0111\u1EC3 x\xF3a." };
  }
  if (ROOT_ADMIN_EMAILS.includes(email) || user.role === "ADMIN") {
    return {
      success: false,
      error: "Quy t\u1EAFc an to\xE0n Qu\u1EA3n tr\u1ECB: Kh\xF4ng th\u1EC3 x\xF3a t\xE0i kho\u1EA3n Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN)."
    };
  }
  delete store.users[email];
  saveStore();
  if (process.env.LICENSE_API_URL) {
    await deleteUserFromGoogleSheet(email).catch(() => {
    });
  }
  return { success: true };
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
  if (typeof req.originalUrl === "string") {
    const pathname = req.originalUrl.split("?")[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
      if (sub) return sub;
    }
  }
  if (typeof req.url === "string") {
    const pathname = req.url.split("?")[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
      if (sub) return sub;
    }
    const stripped = pathname.replace(/^\/+|\/+$/g, "");
    if (stripped && !stripped.startsWith("api/")) {
      return stripped;
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
  const authHeader = req.headers["authorization"] || "";
  const sessionHeader = req.headers["x-session-token"] || "";
  const googleHeader = req.headers["x-google-credential"] || "";
  const tokenCandidate = authHeader || sessionHeader || googleHeader;
  let verifiedEmail = null;
  if (tokenCandidate) {
    const verifiedSession = verifyAdminSessionToken(tokenCandidate);
    if (verifiedSession) {
      verifiedEmail = verifiedSession.email;
    } else {
      const googleVerified = verifyGoogleIdToken(tokenCandidate);
      if (googleVerified) {
        verifiedEmail = googleVerified.email;
      }
    }
  }
  const serverSecretHeader = req.headers["x-server-secret"] || "";
  const expectedSecret = process.env.APPS_SCRIPT_SECRET || "";
  if (!verifiedEmail && expectedSecret && serverSecretHeader === expectedSecret) {
    verifiedEmail = String(req.headers["x-user-email"] || ROOT_ADMIN_EMAILS[0]).toLowerCase().trim();
  }
  if (!verifiedEmail) {
    return res.status(403).json({
      error: "Truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i: Y\xEAu c\u1EA7u phi\xEAn \u0111\u0103ng nh\u1EADp h\u1EE3p l\u1EC7 ho\u1EB7c Google ID token \u0111\xE3 x\xE1c minh tr\xEAn server.",
      code: "FORBIDDEN"
    });
  }
  const operatorEmail = verifiedEmail;
  let isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed && process.env.LICENSE_API_URL && operatorEmail) {
    try {
      const remote = await fetchUserFromLicenseApi(operatorEmail);
      if (remote?.role === "ADMIN") {
        const u = await getOrCreateUser({ email: operatorEmail });
        u.role = "ADMIN";
        isAllowed = true;
      }
    } catch {
    }
  }
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
    if (subpath === "check-sheet-schema") {
      const checkResult = await checkSheetCompatibility();
      return res.status(200).json(checkResult);
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
      const result = await adminCreateUser({
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
      return res.status(200).json({
        success: true,
        user: result.user,
        sheetSynced: result.sheetSynced,
        warning: result.warning,
        message: result.message
      });
    }
    if (subpath === "update-user") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { email, name, newEmail, role, plan, quota, isBlocked, expiresAt } = body || {};
      const result = await adminUpdateUser({
        operatorEmail,
        email,
        name,
        newEmail,
        role,
        plan,
        quota,
        isBlocked,
        expiresAt
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || "C\u1EADp nh\u1EADt ng\u01B0\u1EDDi d\xF9ng th\u1EA5t b\u1EA1i" });
      }
      return res.status(200).json({
        success: true,
        user: result.user,
        sheetSynced: result.sheetSynced,
        warning: result.warning,
        message: result.message
      });
    }
    if (subpath === "delete-user") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const { email } = body || {};
      if (!email) {
        return res.status(400).json({ error: "Email ng\u01B0\u1EDDi d\xF9ng l\xE0 b\u1EAFt bu\u1ED9c" });
      }
      const result = await adminDeleteUser({ operatorEmail, email });
      if (!result.success) {
        return res.status(400).json({ error: result.error || "X\xF3a ng\u01B0\u1EDDi d\xF9ng th\u1EA5t b\u1EA1i" });
      }
      return res.status(200).json({ success: true });
    }
    if (subpath === "sync-sheet") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
      const result = await adminSyncGoogleSheets(body);
      return res.status(200).json(result);
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
  handler as default,
  mapRawSheetUserToAccount
};
