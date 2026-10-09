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
function getOrCreateGuest(guestId) {
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  if (!store.guests[guestId]) {
    store.guests[guestId] = {
      guestId,
      quota: {
        easy: 3,
        // Dễ dùng: 3 lượt
        advanced: 1
        // Chuyên sâu: 1 lượt
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
      analysisCount: 0
    };
    saveStore();
  } else {
    store.guests[guestId].lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  return store.guests[guestId];
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
function consumeQuota(params) {
  const { guestId, email, userId, mode } = params;
  if (email || userId) {
    const user = findUserByEmailOrId(email || userId || "");
    if (user) {
      if (user.isBlocked || user.role === "BLOCKED") {
        return {
          allowed: false,
          code: "ACCOUNT_BLOCKED",
          message: "T\xE0i kho\u1EA3n c\u1EE7a Th\u1EA7y/C\xF4 \u0111\xE3 b\u1ECB t\u1EA1m kh\xF3a. Vui l\xF2ng li\xEAn h\u1EC7 qu\u1EA3n tr\u1ECB vi\xEAn.",
          role: "BLOCKED",
          quota: user.quota
        };
      }
      if (user.role === "LICENSED" || user.role === "ADMIN" || user.role === "FREE_ACCESS" || user.freeAccess) {
        store.stats.totalAnalyses += 1;
        saveStore();
        return {
          allowed: true,
          role: user.role,
          quota: user.quota
        };
      }
      const currentQuota = user.quota[mode] ?? 0;
      if (currentQuota <= 0) {
        return {
          allowed: false,
          code: "TRIAL_QUOTA_EXCEEDED",
          message: `Th\u1EA7y/C\xF4 \u0111\xE3 d\xF9ng h\u1EBFt l\u01B0\u1EE3t d\xF9ng th\u1EED cho ch\u1EBF \u0111\u1ED9 ${mode === "easy" ? "C\u01A1 b\u1EA3n" : "Chuy\xEAn s\xE2u"}. Vui l\xF2ng k\xEDch ho\u1EA1t B\u1EA3n quy\u1EC1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c kh\xF4ng gi\u1EDBi h\u1EA1n.`,
          role: "TRIAL",
          quota: user.quota
        };
      }
      user.quota[mode] = Math.max(0, currentQuota - 1);
      store.stats.totalAnalyses += 1;
      saveStore();
      return {
        allowed: true,
        role: "TRIAL",
        quota: user.quota
      };
    }
  }
  const effectiveGuestId = guestId || "guest_default";
  const guest = getOrCreateGuest(effectiveGuestId);
  const guestCurrentQuota = guest.quota[mode] ?? 0;
  if (guestCurrentQuota <= 0) {
    return {
      allowed: false,
      code: "GUEST_QUOTA_EXCEEDED",
      message: `Qu\xFD Th\u1EA7y/C\xF4 \u0111\xE3 d\xF9ng h\u1EBFt l\u01B0\u1EE3t tr\u1EA3i nghi\u1EC7m mi\u1EC5n ph\xED cho ch\u1EBF \u0111\u1ED9 ${mode === "easy" ? "C\u01A1 b\u1EA3n" : "Chuy\xEAn s\xE2u"}. Vui l\xF2ng \u0111\u0103ng nh\u1EADp Google \u0111\u1EC3 nh\u1EADn th\xEAm l\u01B0\u1EE3t Trial ho\u1EB7c nh\u1EADp M\xE3 b\u1EA3n quy\u1EC1n.`,
      role: "GUEST",
      quota: guest.quota
    };
  }
  guest.quota[mode] = Math.max(0, guestCurrentQuota - 1);
  guest.analysisCount += 1;
  store.stats.totalAnalyses += 1;
  saveStore();
  return {
    allowed: true,
    role: "GUEST",
    quota: guest.quota
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

// server/api/user.ts
function handler(req, res) {
  if (handleCors(req, res)) return;
  res.setHeader("Content-Type", "application/json");
  const subpath = extractSubpath(req, "/api/user");
  const body = getRequestBody(req);
  if (subpath === "status" || subpath === "") {
    const { guestId, email, userId } = req.query || {};
    const reqIdentifier = String(email || userId || body?.email || body?.userId || "").toLowerCase().trim();
    if (reqIdentifier) {
      const user = findUserByEmailOrId(reqIdentifier);
      if (user) {
        return res.status(200).json({
          isLoggedIn: true,
          user,
          role: user.role,
          plan: user.plan,
          quota: user.quota
        });
      }
    }
    const gId = String(guestId || body?.guestId || "guest_default");
    const guest = getOrCreateGuest(gId);
    return res.status(200).json({
      isLoggedIn: false,
      guestId: guest.guestId,
      role: "GUEST",
      plan: "GUEST",
      quota: guest.quota
    });
  }
  if (subpath === "guest-init") {
    try {
      const guestId = body?.guestId || req.query?.guestId;
      const guest = getOrCreateGuest(guestId);
      return res.status(200).json({ success: true, guest });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "consume-quota") {
    try {
      const { guestId, email, userId, mode = "easy" } = body || {};
      const result = consumeQuota({ guestId, email, userId, mode });
      if (!result.allowed) {
        return res.status(403).json(result);
      }
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(404).json({ error: `Tuy\u1EBFn \u0111\u01B0\u1EDDng ng\u01B0\u1EDDi d\xF9ng kh\xF4ng t\u1ED3n t\u1EA1i: /api/user/${subpath}` });
}
export {
  handler as default
};
