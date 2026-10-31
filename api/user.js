import { createRequire as _topCreateRequire } from 'module'; const require = _topCreateRequire(import.meta.url);

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
function getOrCreateGuest(guestId) {
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  reloadStoreFromDisk();
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
      if (user.role === "ADMIN" || ROOT_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        store.stats.totalAnalyses += 1;
        saveStore();
        return {
          allowed: true,
          role: "ADMIN",
          quota: user.quota
        };
      }
      const isProPlan = user.role === "LICENSED" || user.role === "FREE_ACCESS" || Boolean(user.freeAccess) || user.plan === "PRO" || user.plan === "SCHOOL" || user.plan === "PREMIUM";
      if (isProPlan) {
        if (user.proStatus === "EXPIRED") {
          return {
            allowed: false,
            code: "NOT_ALLOWED",
            message: "G\xF3i PRO c\u1EE7a Th\u1EA7y/C\xF4 \u0111\xE3 h\u1EBFt th\u1EDDi h\u1EA1n s\u1EED d\u1EE5ng. Vui l\xF2ng li\xEAn h\u1EC7 Qu\u1EA3n tr\u1ECB vi\xEAn \u0111\u1EC3 \u0111\u01B0\u1EE3c gia h\u1EA1n d\u1ECBch v\u1EE5.",
            role: user.role,
            quota: user.quota
          };
        }
        const expDate = user.proEndDate || user.licenseExpiresAt;
        if (expDate) {
          const expiryTime = new Date(expDate).getTime();
          if (!isNaN(expiryTime) && expiryTime < Date.now()) {
            user.proStatus = "EXPIRED";
            saveStore();
            return {
              allowed: false,
              code: "NOT_ALLOWED",
              message: "G\xF3i PRO c\u1EE7a Th\u1EA7y/C\xF4 \u0111\xE3 h\u1EBFt th\u1EDDi h\u1EA1n s\u1EED d\u1EE5ng. Vui l\xF2ng li\xEAn h\u1EC7 Qu\u1EA3n tr\u1ECB vi\xEAn \u0111\u1EC3 \u0111\u01B0\u1EE3c gia h\u1EA1n d\u1ECBch v\u1EE5.",
              role: user.role,
              quota: user.quota
            };
          }
        }
        store.stats.totalAnalyses += 1;
        saveStore();
        return {
          allowed: true,
          role: user.role,
          quota: user.quota,
          quotaType: "pro_unlimited"
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

// src/server/evaluationStore.ts
import fs2 from "fs";
import path2 from "path";
import os from "os";
import crypto2 from "crypto";

// src/utils/evaluationNotes.ts
function normalizeTeacherNotes(rawNotes, evalId) {
  if (!rawNotes || typeof rawNotes !== "object") return {};
  const normalized = {};
  const evalPrefix = evalId ? `${evalId}_` : "";
  for (const [key, value] of Object.entries(rawNotes)) {
    if (typeof value !== "string") continue;
    let cleanKey = key.trim();
    if (!cleanKey) continue;
    if (evalPrefix && cleanKey.startsWith(evalPrefix)) {
      cleanKey = cleanKey.slice(evalPrefix.length);
    } else if (cleanKey.includes("_rtc-")) {
      cleanKey = cleanKey.substring(cleanKey.lastIndexOf("_rtc-") + 1);
    } else if (cleanKey.includes("_PB-")) {
      cleanKey = cleanKey.substring(cleanKey.lastIndexOf("_PB-") + 1);
    }
    const existingVal = normalized[cleanKey];
    if (existingVal === void 0) {
      normalized[cleanKey] = value;
    } else if (!existingVal.trim() && value.trim()) {
      normalized[cleanKey] = value;
    } else if (value.trim() && value.trim() !== existingVal.trim()) {
      if (value.trim().length >= existingVal.trim().length) {
        normalized[cleanKey] = value;
      }
    }
  }
  return normalized;
}

// src/server/evaluationStore.ts
var DATA_DIR2 = path2.resolve("data");
var EVALUATIONS_FILE = path2.join(DATA_DIR2, "evaluations_store.json");
var TMP_DATA_DIR = path2.join(os.tmpdir(), "skkn_data");
var TMP_EVALUATIONS_FILE = path2.join(TMP_DATA_DIR, "evaluations_store.json");
var store2 = {
  evaluations: {},
  auditLogs: []
};
function ensureDefaultEvaluations() {
  const tinHoc11Id = "eval_tinhoc11_dathien2412";
  if (!store2.evaluations[tinHoc11Id]) {
    const defaultTinHoc11 = {
      id: tinHoc11Id,
      userId: "admin_6461746869",
      userEmail: "dathien2412@gmail.com",
      title: "\u1EE8ng d\u1EE5ng l\u1EADp tr\xECnh Python v\xE0 d\u1EF1 \xE1n th\u1EF1c t\u1EBF nh\u1EB1m n\xE2ng cao n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 m\xF4n Tin h\u1ECDc 11",
      subject: "Tin h\u1ECDc",
      gradeLevel: "L\u1EDBp 11",
      score: 35,
      status: "COMPLETED",
      versionCount: 1,
      currentVersion: 1,
      originalFileName: "SKKN_Tin_Hoc_11_Thuat_Toan_Python.docx",
      originalFileSize: 48520,
      wordCount: 4250,
      createdAt: "2026-10-18T10:15:00.000Z",
      updatedAt: "2026-10-18T10:15:00.000Z",
      originalText: `B\xC1O C\xC1O S\xC1NG KI\u1EBEN KINH NGHI\u1EC6M
T\xEAn s\xE1ng ki\u1EBFn: \u1EE8ng d\u1EE5ng l\u1EADp tr\xECnh Python v\xE0 d\u1EF1 \xE1n th\u1EF1c t\u1EBF nh\u1EB1m n\xE2ng cao n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 m\xF4n Tin h\u1ECDc 11
T\xE1c gi\u1EA3: GV. H\u1ED3 Nguy\u1EC5n \u0110a Thi\u1EC7n - Tr\u01B0\u1EDDng THPT Chuy\xEAn

Ph\u1EA7n I. \u0110\u1EB6T V\u1EA4N \u0110\u1EC0
Trong ch\u01B0\u01A1ng tr\xECnh GDPT 2018 m\xF4n Tin h\u1ECDc 11, m\u1EA1ch ki\u1EBFn th\u1EE9c Khoa h\u1ECDc m\xE1y t\xEDnh v\xE0 L\u1EADp tr\xECnh \u0111\xF3ng vai tr\xF2 then ch\u1ED1t nh\u01B0ng h\u1ECDc sinh th\u01B0\u1EDDng g\u1EB7p kh\xF3 kh\u0103n trong vi\u1EC7c t\u01B0 duy thu\u1EADt to\xE1n v\xE0 hi\u1EC7n th\u1EF1c h\xF3a b\xE0i to\xE1n th\u1EF1c t\u1EBF. H\u1ECDc sinh th\u01B0\u1EDDng h\u1ECDc thu\u1ED9c l\xF2ng c\xFA ph\xE1p Python nh\u01B0ng khi g\u1EB7p b\xE0i to\xE1n th\u1EF1c t\u1EBF th\xEC b\u1EBF t\u1EAFc kh\xF4ng bi\u1EBFt ph\xE2n t\xEDch b\xE0i to\xE1n.

Ph\u1EA7n II. N\u1ED8I DUNG V\xC0 BI\u1EC6N PH\xC1P TH\u1EF0C HI\u1EC6N
M\u1EE5c 3.2 & M\u1EE5c 4.1. Ti\u1EBFn h\xE0nh th\u1EF1c nghi\u1EC7m t\u1EA1i l\u1EDBp 11A1 v\xE0 \u0111\u1ED1i ch\u1EE9ng t\u1EA1i l\u1EDBp 11A2; sau m\u1ED9t h\u1ECDc k\u1EF3 \xE1p d\u1EE5ng d\u1EF1 \xE1n Python, k\u1EBFt qu\u1EA3 h\u1ECDc t\u1EADp l\u1EDBp 11A1 cao h\u01A1n r\xF5 r\u1EC7t.
M\u1EE5c 4.2. Thi\u1EBFt k\u1EBF 3 d\u1EF1 \xE1n nh\u1ECF: Qu\u1EA3n l\xFD th\u01B0 vi\u1EC7n, M\xF4 ph\u1ECFng chuy\u1EC3n \u0111\u1ED9ng v\u1EADt l\xFD v\xE0 Chatbot tra c\u1EE9u th\xF4ng tin.
M\u1EE5c 4.3. \u0110\u1EC3 ho\xE0n th\xE0nh c\xE1c d\u1EF1 \xE1n l\u1EDBn, h\u1ECDc sinh ti\u1EBFp t\u1EE5c ho\xE0n thi\u1EC7n code tr\xEAn m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0 v\xE0 n\u1ED9p link qua h\u1EC7 th\u1ED1ng tr\u1EF1c tuy\u1EBFn.

Ph\u1EA7n III. HI\u1EC6U QU\u1EA2 C\u1EE6A S\xC1NG KI\u1EBEN
M\u1EE5c 5, Trang 22. Sau th\u1EDDi gian \xE1p d\u1EE5ng gi\u1EA3i ph\xE1p, 100% h\u1ECDc sinh trong l\u1EDBp \u0111\u1EC1u say m\xEA h\u1ECDc t\u1EADp v\xE0 kh\xF4ng c\xF2n em n\xE0o c\u1EA3m th\u1EA5y s\u1EE3 l\u1EADp tr\xECnh Python.

Ph\u1EA7n IV. K\u1EBET LU\u1EACN V\xC0 KI\u1EBEN NGH\u1ECA
S\xE1ng ki\u1EBFn mang l\u1EA1i hi\u1EC7u qu\u1EA3 thi\u1EBFt th\u1EF1c trong vi\u1EC7c \u0111\u1ED5i m\u1EDBi ph\u01B0\u01A1ng ph\xE1p d\u1EA1y h\u1ECDc l\u1EADp tr\xECnh b\u1EADc THPT.`,
      draftText: `B\xC1O C\xC1O S\xC1NG KI\u1EBEN KINH NGHI\u1EC6M
T\xEAn s\xE1ng ki\u1EBFn: \u1EE8ng d\u1EE5ng l\u1EADp tr\xECnh Python v\xE0 d\u1EF1 \xE1n th\u1EF1c t\u1EBF nh\u1EB1m n\xE2ng cao n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 m\xF4n Tin h\u1ECDc 11
T\xE1c gi\u1EA3: GV. H\u1ED3 Nguy\u1EC5n \u0110a Thi\u1EC7n - Tr\u01B0\u1EDDng THPT Chuy\xEAn

Ph\u1EA7n I. \u0110\u1EB6T V\u1EA4N \u0110\u1EC0
Trong ch\u01B0\u01A1ng tr\xECnh GDPT 2018 m\xF4n Tin h\u1ECDc 11, m\u1EA1ch ki\u1EBFn th\u1EE9c Khoa h\u1ECDc m\xE1y t\xEDnh v\xE0 L\u1EADp tr\xECnh \u0111\xF3ng vai tr\xF2 then ch\u1ED1t nh\u01B0ng h\u1ECDc sinh th\u01B0\u1EDDng g\u1EB7p kh\xF3 kh\u0103n trong vi\u1EC7c t\u01B0 duy thu\u1EADt to\xE1n v\xE0 hi\u1EC7n th\u1EF1c h\xF3a b\xE0i to\xE1n th\u1EF1c t\u1EBF. H\u1ECDc sinh th\u01B0\u1EDDng h\u1ECDc thu\u1ED9c l\xF2ng c\xFA ph\xE1p Python nh\u01B0ng khi g\u1EB7p b\xE0i to\xE1n th\u1EF1c t\u1EBF th\xEC b\u1EBF t\u1EAFc kh\xF4ng bi\u1EBFt ph\xE2n t\xEDch b\xE0i to\xE1n.

Ph\u1EA7n II. N\u1ED8I DUNG V\xC0 BI\u1EC6N PH\xC1P TH\u1EF0C HI\u1EC6N
M\u1EE5c 3.2 & M\u1EE5c 4.1. Ti\u1EBFn h\xE0nh th\u1EF1c nghi\u1EC7m t\u1EA1i l\u1EDBp 11A1 v\xE0 \u0111\u1ED1i ch\u1EE9ng t\u1EA1i l\u1EDBp 11A2; sau m\u1ED9t h\u1ECDc k\u1EF3 \xE1p d\u1EE5ng d\u1EF1 \xE1n Python, k\u1EBFt qu\u1EA3 h\u1ECDc t\u1EADp l\u1EDBp 11A1 cao h\u01A1n r\xF5 r\u1EC7t.
M\u1EE5c 4.2. Thi\u1EBFt k\u1EBF 3 d\u1EF1 \xE1n nh\u1ECF: Qu\u1EA3n l\xFD th\u01B0 vi\u1EC7n, M\xF4 ph\u1ECFng chuy\u1EC3n \u0111\u1ED9ng v\u1EADt l\xFD v\xE0 Chatbot tra c\u1EE9u th\xF4ng tin.
M\u1EE5c 4.3. \u0110\u1EC3 ho\xE0n th\xE0nh c\xE1c d\u1EF1 \xE1n l\u1EDBn, h\u1ECDc sinh ti\u1EBFp t\u1EE5c ho\xE0n thi\u1EC7n code tr\xEAn m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0 v\xE0 n\u1ED9p link qua h\u1EC7 th\u1ED1ng tr\u1EF1c tuy\u1EBFn.

Ph\u1EA7n III. HI\u1EC6U QU\u1EA2 C\u1EE6A S\xC1NG KI\u1EBEN
M\u1EE5c 5, Trang 22. Sau th\u1EDDi gian \xE1p d\u1EE5ng gi\u1EA3i ph\xE1p, 100% h\u1ECDc sinh trong l\u1EDBp \u0111\u1EC1u say m\xEA h\u1ECDc t\u1EADp v\xE0 kh\xF4ng c\xF2n em n\xE0o c\u1EA3m th\u1EA5y s\u1EE3 l\u1EADp tr\xECnh Python.

Ph\u1EA7n IV. K\u1EBET LU\u1EACN V\xC0 KI\u1EBEN NGH\u1ECA
S\xE1ng ki\u1EBFn mang l\u1EA1i hi\u1EC7u qu\u1EA3 thi\u1EBFt th\u1EF1c trong vi\u1EC7c \u0111\u1ED5i m\u1EDBi ph\u01B0\u01A1ng ph\xE1p d\u1EA1y h\u1ECDc l\u1EADp tr\xECnh b\u1EADc THPT.`,
      changeSet: [],
      customProposals: {},
      versionsHistory: [
        {
          version: 1,
          createdAt: "2026-10-18T10:15:00.000Z",
          score: 35,
          notes: "Th\u1EA9m \u0111\u1ECBnh l\u1EA7n \u0111\u1EA7u (B\u1EA3n g\u1ED1c v1) - \u0110\u1EA1t 35.0/100 \u0111i\u1EC3m Rubric",
          resultSummary: "\u0110\u1EC1 t\xE0i c\xF3 \xFD t\u01B0\u1EDFng t\u1ED1t nh\u01B0ng thi\u1EBFu minh ch\u1EE9ng \u0111\u1ECBnh l\u01B0\u1EE3ng \u0111\u1ED1i ch\u1EE9ng v\xE0 \u0111\u1EE9t g\xE3y logic t\u1EEB l\xFD thuy\u1EBFt \u0111\u1EBFn th\u1EF1c h\xE0nh."
        }
      ],
      analysisResult: {
        metadata: {
          title: "\u1EE8ng d\u1EE5ng l\u1EADp tr\xECnh Python v\xE0 d\u1EF1 \xE1n th\u1EF1c t\u1EBF nh\u1EB1m n\xE2ng cao n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 m\xF4n Tin h\u1ECDc 11",
          author: "GV. H\u1ED3 Nguy\u1EC5n \u0110a Thi\u1EC7n",
          organization: "Tr\u01B0\u1EDDng THPT Chuy\xEAn",
          field: "Khoa h\u1ECDc T\u1EF1 nhi\xEAn & C\xF4ng ngh\u1EC7 - Ph\u01B0\u01A1ng ph\xE1p d\u1EA1y h\u1ECDc Tin h\u1ECDc",
          subject: "Tin h\u1ECDc",
          gradeLevel: "L\u1EDBp 11",
          targetAudience: "H\u1ECDc sinh l\u1EDBp 11 Tin h\u1ECDc n\u0103m h\u1ECDc 2024 - 2025",
          applicationTimeframe: "Th\xE1ng 09/2024 - Th\xE1ng 04/2025",
          scope: "Ph\u1EA1m vi t\u1ED5 chuy\xEAn m\xF4n Tin h\u1ECDc c\u1EA5p tr\u01B0\u1EDDng",
          appliedRubricName: "Phi\u1EBFu ch\u1EA5m S\xE1ng ki\u1EBFn Gi\xE1o d\u1EE5c theo H\u01B0\u1EDBng d\u1EABn S\u1EDF GD&\u0110T (Khung 100 \u0111i\u1EC3m)",
          isOfficialRubric: true,
          evidenceAdequacy: "C\u1EA7n b\u1ED5 sung minh ch\u1EE9ng",
          evidenceAdequacyReason: "T\xE0i li\u1EC7u c\xF3 \xFD t\u01B0\u1EDFng \u1EE9ng d\u1EE5ng d\u1EF1 \xE1n th\u1EF1c t\u1EBF nh\u01B0ng thi\u1EBFu s\u1ED1 li\u1EC7u kh\u1EA3o s\xE1t \u0111\u1ED1i ch\u1EE9ng tr\u01B0\u1EDBc - sau can thi\u1EC7p v\xE0 ch\u01B0a c\xF3 s\u1EA3n ph\u1EA9m minh ch\u1EE9ng \u0111\u1ED9c l\u1EADp c\u1EE7a h\u1ECDc sinh."
        },
        sectionsMap: [
          { id: "sec-1", sectionCode: "Ph\u1EA7n I", name: "\u0110\u1EB6T V\u1EA4N \u0110\u1EC0 (L\xFD do ch\u1ECDn \u0111\u1EC1 t\xE0i, m\u1EE5c ti\xEAu, \u0111\u1ED1i t\u01B0\u1EE3ng)", page: "M\u1EE5c 1", summary: "N\xEAu th\u1EF1c tr\u1EA1ng h\u1ECDc sinh h\u1ECDc c\xFA ph\xE1p th\u1EE5 \u0111\u1ED9ng, thi\u1EBFu n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 th\u1EF1c t\u1EBF trong l\u1EADp tr\xECnh Python 11." },
          { id: "sec-2", sectionCode: "Ph\u1EA7n II.1", name: "C\u01A0 S\u1EDE L\xDD LU\u1EACN V\xC0 TH\u1EF0C TI\u1EC4N", page: "M\u1EE5c 2", summary: "D\u1EA1y h\u1ECDc theo \u0111\u1ECBnh h\u01B0\u1EDBng ph\xE1t tri\u1EC3n ph\u1EA9m ch\u1EA5t, n\u0103ng l\u1EF1c CT GDPT 2018." },
          { id: "sec-3", sectionCode: "Ph\u1EA7n II.2", name: "TH\u1EF0C TR\u1EA0NG TR\u01AF\u1EDAC KHI \xC1P D\u1EE4NG", page: "M\u1EE5c 3", summary: "Kh\u1EA3o s\xE1t 75 h\u1ECDc sinh \u0111\u1EA7u n\u0103m: 68% c\u1EA3m th\u1EA5y l\u1EADp tr\xECnh kh\xF3 hi\u1EC3u v\xE0 kh\xF4 khan." },
          { id: "sec-4", sectionCode: "Ph\u1EA7n II.3", name: "C\xC1C BI\u1EC6N PH\xC1P TH\u1EF0C HI\u1EC6N", page: "M\u1EE5c 4", summary: "Thi\u1EBFt k\u1EBF 3 d\u1EF1 \xE1n nh\u1ECF: (1) Qu\u1EA3n l\xFD th\u01B0 vi\u1EC7n tr\u01B0\u1EDDng; (2) M\xF4 ph\u1ECFng chuy\u1EC3n \u0111\u1ED9ng v\u1EADt l\xFD; (3) Chatbot tra c\u1EE9u th\xF4ng tin." },
          { id: "sec-5", sectionCode: "Ph\u1EA7n II.4", name: "HI\u1EC6U QU\u1EA2 C\u1EE6A S\xC1NG KI\u1EBEN", page: "M\u1EE5c 5", summary: "T\u1EF7 l\u1EC7 h\u1ECDc sinh h\u1EE9ng th\xFA t\u0103ng, s\u1ED1 l\u01B0\u1EE3ng ho\xE0n th\xE0nh b\xE0i t\u1EADp d\u1EF1 \xE1n \u0111\u1EA1t 82%." },
          { id: "sec-6", sectionCode: "Ph\u1EA7n III", name: "K\u1EBET LU\u1EACN V\xC0 KI\u1EBEN NGH\u1ECA", page: "M\u1EE5c 6", summary: "\u0110\u1EC1 t\xE0i mang l\u1EA1i hi\u1EC7u qu\u1EA3 thi\u1EBFt th\u1EF1c, ki\u1EBFn ngh\u1ECB b\u1ED5 sung th\xEAm m\xE1y t\xEDnh cho ph\xF2ng m\xE1y." }
        ],
        rubricCriteria: [
          {
            id: "rub-1",
            groupName: "1. T\xEDnh c\u1EA5p thi\u1EBFt & C\u01A1 s\u1EDF nghi\xEAn c\u1EE9u",
            criterionName: "X\xE1c \u0111\u1ECBnh v\u1EA5n \u0111\u1EC1 th\u1EF1c ti\u1EC5n, t\xEDnh c\u1EA5p thi\u1EBFt v\xE0 m\u1EE5c ti\xEAu nghi\xEAn c\u1EE9u",
            maxScore: 10,
            proposedScore: 7,
            basisLocation: "Ph\u1EA7n I, M\u1EE5c 1.1",
            shortQuote: "H\u1ECDc sinh th\u01B0\u1EDDng h\u1ECDc thu\u1ED9c l\xF2ng c\xFA ph\xE1p Python nh\u01B0ng khi g\u1EB7p b\xE0i to\xE1n th\u1EF1c t\u1EBF th\xEC b\u1EBF t\u1EAFc kh\xF4ng bi\u1EBFt ph\xE2n t\xEDch b\xE0i to\xE1n.",
            strengths: "X\xE1c \u0111\u1ECBnh \u0111\xFAng \u0111i\u1EC3m ngh\u1EBDn th\u1EF1c ti\u1EC5n c\u1EE7a h\u1ECDc sinh l\u1EDBp 11 khi h\u1ECDc l\u1EADp tr\xECnh theo CT 2018.",
            limitations: "Ph\u1EA7n kh\u1EA3o s\xE1t ban \u0111\u1EA7u ch\u01B0a c\xF4ng b\u1ED1 phi\u1EBFu \u0111o \u0111\u1EA1c c\u1EE5 th\u1EC3 v\xE0 thang \u0111o chu\u1EA9n h\xF3a.",
            existingEvidence: "S\u1ED1 li\u1EC7u t\u1ED5ng h\u1EE3p ban \u0111\u1EA7u t\u1EA1i 2 l\u1EDBp 11.",
            missingEvidence: "Phi\u1EBFu kh\u1EA3o s\xE1t chi ti\u1EBFt k\xE8m minh ch\u1EE9ng th\u1EDDi \u0111i\u1EC3m thu th\u1EADp d\u1EEF li\u1EC7u.",
            deductionReason: "Tr\u1EEB 3.0 \u0111i\u1EC3m do c\xF4ng c\u1EE5 \u0111i\u1EC1u tra th\u1EF1c tr\u1EA1ng thi\u1EBFu m\u1EABu phi\u1EBFu \u0111\u1ECBnh l\u01B0\u1EE3ng.",
            improvementGuidance: "B\u1ED5 sung m\u1EABu phi\u1EBFu kh\u1EA3o s\xE1t n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 v\xE0o Ph\u1EE5 l\u1EE5c.",
            priority: "Trung b\xECnh"
          },
          {
            id: "rub-2",
            groupName: "2. T\xEDnh m\u1EDBi & T\xEDnh s\xE1ng t\u1EA1o",
            criterionName: "M\u1EE9c \u0111\u1ED9 m\u1EDBi v\u1EC1 gi\u1EA3i ph\xE1p, c\xE1ch ti\u1EBFp c\u1EADn v\xE0 t\xEDnh s\xE1ng t\u1EA1o khoa h\u1ECDc",
            maxScore: 20,
            proposedScore: 6.5,
            basisLocation: "Ph\u1EA7n II.3, M\u1EE5c 4.1",
            shortQuote: "S\xE1ng ki\u1EBFn \u0111\u01B0a vi\u1EC7c l\u1EADp tr\xECnh d\u1EF1 \xE1n Python th\u1EF1c t\u1EBF v\xE0o t\u1EEBng ti\u1EBFt d\u1EA1y th\u1EF1c h\xE0nh.",
            strengths: "C\xF3 chuy\u1EC3n bi\u1EBFn t\u1EEB b\xE0i t\u1EADp thu\u1EA7n l\xFD thuy\u1EBFt sang b\xE0i t\u1EADp g\u1EAFn v\u1EDBi b\u1ED1i c\u1EA3nh \u0111\u1EDDi s\u1ED1ng.",
            limitations: "D\u1EF1 \xE1n th\u1EF1c t\u1EBF ch\u01B0a c\xF3 quy tr\xECnh ph\xE2n b\u1EADc n\u0103ng l\u1EF1c r\xF5 r\u1EC7t; nhi\u1EC1u b\xE0i t\u1EADp v\u1EABn mang t\xEDnh m\u1EABu gi\xE1o khoa.",
            existingEvidence: "M\xF4 t\u1EA3 3 d\u1EF1 \xE1n nh\u1ECF trong n\u1ED9i dung.",
            missingEvidence: "Khung ph\xE2n h\xF3a nhi\u1EC7m v\u1EE5 theo 4 m\u1EE9c \u0111\u1ED9 nh\u1EADn th\u1EE9c (Bi\u1EBFt, Hi\u1EC3u, V\u1EADn d\u1EE5ng, V\u1EADn d\u1EE5ng cao).",
            deductionReason: "Tr\u1EEB 13.5 \u0111i\u1EC3m do t\xEDnh m\u1EDBi ch\u01B0a \u0111\u01B0\u1EE3c \u0111\u1ECBnh v\u1ECB r\xF5 \u1EDF quy tr\xECnh s\u01B0 ph\u1EA1m \u0111\u1ED9c l\u1EADp.",
            improvementGuidance: "X\xE2y d\u1EF1ng b\u1EA3ng ma tr\u1EADn k\u1EF9 n\u0103ng thu\u1EADt to\xE1n g\u1EAFn v\u1EDBi t\u1EEBng d\u1EF1 \xE1n c\u1EE5 th\u1EC3.",
            priority: "Cao"
          },
          {
            id: "rub-3",
            groupName: "3. T\xEDnh khoa h\u1ECDc & Logic s\u01B0 ph\u1EA1m",
            criterionName: "Ph\u01B0\u01A1ng ph\xE1p nghi\xEAn c\u1EE9u, chu\u1ED7i logic t\u1EEB th\u1EF1c tr\u1EA1ng \u0111\u1EBFn gi\u1EA3i ph\xE1p",
            maxScore: 20,
            proposedScore: 7.5,
            basisLocation: "Ph\u1EA7n II.2 & II.3",
            shortQuote: "Ti\u1EBFn h\xE0nh th\u1EF1c nghi\u1EC7m t\u1EA1i l\u1EDBp 11A1 v\xE0 \u0111\u1ED1i ch\u1EE9ng t\u1EA1i l\u1EDBp 11A2.",
            strengths: "C\xF3 b\u1ED1 tr\xED l\u1EDBp th\u1EF1c nghi\u1EC7m v\xE0 l\u1EDBp \u0111\u1ED1i ch\u1EE9ng c\xF9ng kh\u1ED1i.",
            limitations: "Ch\u01B0a ki\u1EC3m \u0111\u1ECBnh t\xEDnh t\u01B0\u01A1ng \u0111\u01B0\u01A1ng n\u0103ng l\u1EF1c \u0111\u1EA7u v\xE0o gi\u1EEFa 2 l\u1EDBp tr\u01B0\u1EDBc can thi\u1EC7p.",
            existingEvidence: "B\u1EA3ng \u0111i\u1EC3m t\u1ED5ng k\u1EBFt h\u1ECDc k\u1EF3.",
            missingEvidence: "B\xE0i ki\u1EC3m tra Pre-test ki\u1EC3m so\xE1t bi\u1EBFn \u0111\u1EA7u v\xE0o.",
            deductionReason: "Tr\u1EEB 12.5 \u0111i\u1EC3m v\xEC thi\u1EBFu ki\u1EC3m so\xE1t bi\u1EBFn \u0111\u1ED9c l\u1EADp v\xE0 \u0111\u1EE9t g\xE3y logic \u0111\u1ED1i ch\u1EE9ng.",
            improvementGuidance: "B\u1ED5 sung k\u1EBFt qu\u1EA3 b\xE0i ki\u1EC3m tra ti\u1EC1n th\u1EF1c nghi\u1EC7m ch\u1EE9ng minh \u0111\u1ED9 t\u01B0\u01A1ng \u0111\u01B0\u01A1ng c\u1EE7a 2 nh\xF3m.",
            priority: "Cao"
          },
          {
            id: "rub-4",
            groupName: "4. T\xEDnh th\u1EF1c ti\u1EC5n & Kh\u1EA3 n\u0103ng \xE1p d\u1EE5ng",
            criterionName: "Ph\xF9 h\u1EE3p \u0111i\u1EC1u ki\u1EC7n c\u01A1 s\u1EDF v\u1EADt ch\u1EA5t, kh\u1EA3 n\u0103ng nh\xE2n r\u1ED9ng trong b\u1ED9 m\xF4n",
            maxScore: 15,
            proposedScore: 6,
            basisLocation: "Ph\u1EA7n II.3, M\u1EE5c 4.3",
            shortQuote: "H\u1ECDc sinh ti\u1EBFp t\u1EE5c ho\xE0n thi\u1EC7n code tr\xEAn m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0.",
            strengths: "Ph\xF9 h\u1EE3p v\u1EDBi xu th\u1EBF chuy\u1EC3n \u0111\u1ED5i s\u1ED1 v\xE0 t\u1EF1 h\u1ECDc.",
            limitations: "Ph\u1EE5 thu\u1ED9c thi\u1EBFt b\u1ECB \u1EDF nh\xE0, ch\u01B0a c\xF3 gi\u1EA3i ph\xE1p cho h\u1ECDc sinh gia \u0111\xECnh kh\xF3 kh\u0103n.",
            existingEvidence: "Link GitHub/Replit n\u1ED9p b\xE0i c\u1EE7a h\u1ECDc sinh.",
            missingEvidence: "K\u1EBF ho\u1EA1ch h\u1ECDc t\u1EADp offline ho\u1EB7c b\u1ED1 tr\xED gi\u1EDD m\xE1y t\u1EA1i tr\u01B0\u1EDDng cho h\u1ECDc sinh kh\xF4ng c\xF3 m\xE1y.",
            deductionReason: "Tr\u1EEB 9.0 \u0111i\u1EC3m v\xEC ch\u01B0a \u0111\u1EA3m b\u1EA3o t\xEDnh c\xF4ng b\u1EB1ng h\u1ECDc t\u1EADp cho m\u1ECDi \u0111\u1ED1i t\u01B0\u1EE3ng.",
            improvementGuidance: "B\u1ED5 sung ph\u01B0\u01A1ng \xE1n ph\xF2ng m\xE1y t\xEDnh m\u1EDF ngo\xE0i gi\u1EDD \u0111\u1EC3 h\u1ECDc sinh th\u1EF1c h\xE0nh.",
            priority: "Trung b\xECnh"
          },
          {
            id: "rub-5",
            groupName: "5. T\xEDnh hi\u1EC7u qu\u1EA3 & Minh ch\u1EE9ng x\xE1c th\u1EF1c",
            criterionName: "K\u1EBFt qu\u1EA3 \u0111o l\u01B0\u1EDDng, d\u1EEF li\u1EC7u \u0111\u1ED1i s\xE1nh tr\u01B0\u1EDBc - sau v\xE0 minh ch\u1EE9ng c\u1EE5 th\u1EC3",
            maxScore: 20,
            proposedScore: 4.5,
            basisLocation: "Ph\u1EA7n II.4",
            shortQuote: "100% h\u1ECDc sinh \u0111\u1EC1u say m\xEA l\u1EADp tr\xECnh v\xE0 \u0111\u1EA1t k\u1EBFt qu\u1EA3 ki\u1EC3m tra h\u1ECDc k\u1EF3 ti\u1EBFn b\u1ED9 v\u01B0\u1EE3t b\u1EADc.",
            strengths: "C\xF3 s\u1ED1 li\u1EC7u th\u1ED1ng k\xEA \u0111i\u1EC3m ki\u1EC3m tra gi\u1EEFa k\u1EF3 v\xE0 cu\u1ED1i k\u1EF3.",
            limitations: "Tuy\xEAn b\u1ED1 100% h\u1ECDc sinh say m\xEA l\xE0 kh\u1EB3ng \u0111\u1ECBnh tuy\u1EC7t \u0111\u1ED1i thi\u1EBFu c\u0103n c\u1EE9 khoa h\u1ECDc; ch\xEAnh l\u1EC7ch c\u1EE1 m\u1EABu ch\u01B0a \u0111\u01B0\u1EE3c gi\u1EA3i tr\xECnh.",
            existingEvidence: "B\u1EA3ng \u0111i\u1EC3m 2 l\u1EDBp.",
            missingEvidence: "Phi\u1EBFu thu th\u1EADp d\u1EEF li\u1EC7u th\xF4 v\xE0 b\xE0i l\xE0m th\u1EF1c t\u1EBF c\u1EE7a h\u1ECDc sinh.",
            deductionReason: "Tr\u1EEB 15.5 \u0111i\u1EC3m do l\u1ED7i kh\u1EB3ng \u0111\u1ECBnh v\u01B0\u1EE3t qu\xE1 b\u1EB1ng ch\u1EE9ng v\xE0 thi\u1EBFu h\u1ED3 s\u01A1 minh ch\u1EE9ng \u0111\u1ED9c l\u1EADp.",
            improvementGuidance: "\u0110i\u1EC1u ch\u1EC9nh t\u1EF7 l\u1EC7 ph\u1EA7n tr\u0103m th\u1EF1c t\u1EBF theo s\u1ED1 li\u1EC7u kh\u1EA3o s\xE1t v\xE0 \u0111\xEDnh k\xE8m b\xE0i l\xE0m m\u1EABu.",
            priority: "Cao"
          },
          {
            id: "rub-6",
            groupName: "6. Kh\u1EA3 n\u0103ng chuy\u1EC3n giao & Nh\xE2n r\u1ED9ng",
            criterionName: "Kh\u1EA3 n\u0103ng chuy\u1EC3n giao v\xE0 nh\xE2n r\u1ED9ng gi\u1EA3i ph\xE1p",
            maxScore: 15,
            proposedScore: 3.5,
            basisLocation: "Ph\u1EA7n III, K\u1EBFt lu\u1EADn",
            shortQuote: "S\xE1ng ki\u1EBFn c\xF3 th\u1EC3 tri\u1EC3n khai \u0111\u1EA1i tr\xE0 cho t\u1EA5t c\u1EA3 c\xE1c tr\u01B0\u1EDDng THPT trong t\u1EC9nh.",
            strengths: "C\xF3 tinh th\u1EA7n chia s\u1EBB kinh nghi\u1EC7m trong sinh ho\u1EA1t t\u1ED5 chuy\xEAn m\xF4n.",
            limitations: "Ch\u01B0a c\xF3 c\u1EA9m nang h\u01B0\u1EDBng d\u1EABn ho\u1EB7c gi\xE1o \xE1n m\u1EABu 5512 ho\xE0n ch\u1EC9nh \u0111\u1EC3 \u0111\u1ED3ng nghi\u1EC7p t\u1EF1 tri\u1EC3n khai.",
            existingEvidence: "Bi\xEAn b\u1EA3n sinh ho\u1EA1t t\u1ED5 chuy\xEAn m\xF4n.",
            missingEvidence: "B\u1ED9 t\xE0i li\u1EC7u h\u01B0\u1EDBng d\u1EABn chuy\u1EC3n giao gi\u1EA3i ph\xE1p \u0111\u1ED9c l\u1EADp.",
            deductionReason: "Tr\u1EEB 11.5 \u0111i\u1EC3m do thi\u1EBFu h\u1ECDc li\u1EC7u chuy\u1EC3n giao v\xE0 \u0111i\u1EC1u ki\u1EC7n tri\u1EC3n khai c\u1EE5 th\u1EC3.",
            improvementGuidance: "B\u1ED5 sung \xEDt nh\u1EA5t 01 k\u1EBF ho\u1EA1ch b\xE0i d\u1EA1y minh h\u1ECDa ho\xE0n ch\u1EC9nh theo CV 5512.",
            priority: "Trung b\xECnh"
          }
        ],
        redTeamCards: [
          {
            id: "rtc-1",
            location: "M\u1EE5c 3.2 & M\u1EE5c 4.1",
            relatedQuote: "Ti\u1EBFn h\xE0nh th\u1EF1c nghi\u1EC7m t\u1EA1i l\u1EDBp 11A1 v\xE0 \u0111\u1ED1i ch\u1EE9ng t\u1EA1i l\u1EDBp 11A2; sau m\u1ED9t h\u1ECDc k\u1EF3 \xE1p d\u1EE5ng d\u1EF1 \xE1n Python, k\u1EBFt qu\u1EA3 h\u1ECDc t\u1EADp l\u1EDBp 11A1 cao h\u01A1n r\xF5 r\u1EC7t.",
            issueDetected: "Thi\u1EBFu b\xE0i ki\u1EC3m tra n\u0103ng l\u1EF1c \u0111\u1EA7u v\xE0o \u0111\u1ED1i ch\u1EE9ng (Pre-test) gi\u1EEFa hai nh\xF3m h\u1ECDc sinh",
            impactLevel: "Cao",
            affectedCriterion: "Ti\xEAu ch\xED 3: T\xEDnh khoa h\u1ECDc & Logic s\u01B0 ph\u1EA1m",
            status: "Ch\u01B0a x\u1EED l\xFD",
            criticismBasis: "Quy chu\u1EA9n nghi\xEAn c\u1EE9u s\u01B0 ph\u1EA1m \u1EE9ng d\u1EE5ng: Nghi\xEAn c\u1EE9u \u0111\u1ED1i ch\u1EE9ng b\u1EAFt bu\u1ED9c ph\u1EA3i ki\u1EC3m so\xE1t bi\u1EBFn \u0111\u1EA7u v\xE0o th\xF4ng qua b\xE0i ki\u1EC3m tra n\u0103ng l\u1EF1c t\u01B0\u01A1ng \u0111\u01B0\u01A1ng (Pre-test) ho\u1EB7c \u0111\u1ED1i so\xE1t h\u1ECDc l\u1EF1c h\u1ECDc k\u1EF3 tr\u01B0\u1EDBc.",
            whyItMatters: "H\u1ED9i \u0111\u1ED3ng s\u1EBD ch\u1EA5t v\u1EA5n: C\u0103n c\u1EE9 n\xE0o kh\u1EB3ng \u0111\u1ECBnh \u0111i\u1EC3m s\u1ED1 l\u1EDBp 11A1 cao h\u01A1n l\xE0 do ph\u01B0\u01A1ng ph\xE1p m\u1EDBi m\xE0 kh\xF4ng ph\u1EA3i do h\u1ECDc sinh l\u1EDBp n\xE0y v\u1ED1n \u0111\xE3 c\xF3 n\u0103ng l\u1EF1c t\u01B0 duy t\u1ED1t h\u01A1n t\u1EEB tr\u01B0\u1EDBc?",
            resolutionGuidance: "B\u1ED5 sung gi\u1EA3i tr\xECnh v\u1EC1 t\xEDnh t\u01B0\u01A1ng \u0111\u01B0\u01A1ng \u0111\u1EA7u v\xE0o ho\u1EB7c \u0111i\u1EC1u ch\u1EC9nh thi\u1EBFt k\u1EBF nghi\xEAn c\u1EE9u n\xEAu r\xF5 gi\u1EDBi h\u1EA1n kh\u1EA3o s\xE1t [C\u1EA6N B\u1ED4 SUNG MINH CH\u1EE8NG].",
            requiredEvidence: "Phi\u1EBFu kh\u1EA3o s\xE1t ho\u1EB7c \u0111i\u1EC3m s\u1ED1 h\u1ECDc k\u1EF3 tr\u01B0\u1EDBc l\xE0m \u0111\u1ED1i ch\u1EE9ng t\u01B0\u01A1ng \u0111\u01B0\u01A1ng.",
            councilChallenge: "H\u1ED9i \u0111\u1ED3ng nh\u1EADn th\u1EA5y hai l\u1EDBp 11A1 v\xE0 11A2 c\xF3 \u0111i\u1EC3m \u0111\u1EA7u v\xE0o ch\xEAnh l\u1EC7ch. C\u0103n c\u1EE9 n\xE0o \u0111\u1EC3 kh\u1EB3ng \u0111\u1ECBnh k\u1EBFt qu\u1EA3 ti\u1EBFn b\u1ED9 l\xE0 do ph\u01B0\u01A1ng ph\xE1p c\u1EE7a t\xE1c gi\u1EA3 ch\u1EE9 kh\xF4ng ph\u1EA3i do t\u1ED1 ch\u1EA5t s\u1EB5n c\xF3?",
            mitigationStrategy: "B\u1ED5 sung k\u1EBFt qu\u1EA3 b\xE0i ki\u1EC3m tra ti\u1EC1n th\u1EF1c nghi\u1EC7m ch\u1EE9ng minh \u0111\u1ED9 t\u01B0\u01A1ng \u0111\u01B0\u01A1ng p > 0.05."
          },
          {
            id: "rtc-2",
            location: "M\u1EE5c 5, Trang 22",
            relatedQuote: "Sau th\u1EDDi gian \xE1p d\u1EE5ng gi\u1EA3i ph\xE1p, 100% h\u1ECDc sinh trong l\u1EDBp \u0111\u1EC1u say m\xEA h\u1ECDc t\u1EADp v\xE0 kh\xF4ng c\xF2n em n\xE0o c\u1EA3m th\u1EA5y s\u1EE3 l\u1EADp tr\xECnh Python.",
            issueDetected: 'Kh\u1EB3ng \u0111\u1ECBnh "100% h\u1ECDc sinh say m\xEA l\u1EADp tr\xECnh" v\u01B0\u1EE3t qu\xE1 d\u1EEF li\u1EC7u minh ch\u1EE9ng',
            impactLevel: "Cao",
            affectedCriterion: "Ti\xEAu ch\xED 5: T\xEDnh hi\u1EC7u qu\u1EA3 & Minh ch\u1EE9ng x\xE1c th\u1EF1c",
            status: "Ch\u01B0a x\u1EED l\xFD",
            criticismBasis: "Chu\u1EA9n m\u1EF1c \u0111\xE1nh gi\xE1 SKKN ng\xE0nh GD&\u0110T: Tuy\u1EC7t \u0111\u1ED1i kh\xF4ng \u0111\u01B0a ra c\xE1c nh\u1EADn \u0111\u1ECBnh tuy\u1EC7t \u0111\u1ED1i h\xF3a (100%) khi ch\u01B0a c\xF3 c\xF4ng c\u1EE5 kh\u1EA3o s\xE1t chu\u1EA9n h\xF3a \u0111\u1ED9c l\u1EADp.",
            whyItMatters: "Tuy\xEAn b\u1ED1 100% say m\xEA h\u1ECDc t\u1EADp l\xE0 kh\u1EB3ng \u0111\u1ECBnh c\u1EA3m t\xEDnh, thi\u1EBFu chu\u1EA9n m\u1EF1c khoa h\u1ECDc, d\u1EC5 b\u1ECB gi\xE1m kh\u1EA3o tr\u1EEB \u0111i\u1EC3m n\u1EB7ng v\u1EC1 t\xEDnh trung th\u1EF1c v\xE0 ph\u01B0\u01A1ng ph\xE1p nghi\xEAn c\u1EE9u.",
            resolutionGuidance: "\u0110i\u1EC1u ch\u1EC9nh di\u1EC5n \u0111\u1EA1t chu\u1EA9n x\xE1c theo s\u1ED1 li\u1EC7u kh\u1EA3o s\xE1t th\u1EF1c t\u1EBF, kh\xF4ng d\xF9ng t\u1EEB tuy\u1EC7t \u0111\u1ED1i [C\u1EA6N B\u1ED4 SUNG S\u1ED0 LI\u1EC6U TH\u1EF0C T\u1EBE].",
            requiredEvidence: "Phi\u1EBFu kh\u1EA3o s\xE1t th\xE1i \u0111\u1ED9 h\u1ECDc t\u1EADp ho\u1EB7c bi\xEAn b\u1EA3n d\u1EF1 gi\u1EDD th\u1EF1c t\u1EBF.",
            councilChallenge: "Tuy\xEAn b\u1ED1 100% kh\xF4ng c\xF2n h\u1ECDc sinh s\u1EE3 l\u1EADp tr\xECnh mang t\xEDnh c\u1EA3m t\xEDnh, thi\u1EBFu chu\u1EA9n m\u1EF1c khoa h\u1ECDc.",
            mitigationStrategy: "\u0110i\u1EC1u ch\u1EC9nh theo t\u1EF7 l\u1EC7 kh\u1EA3o s\xE1t th\u1EF1c t\u1EBF c\xF3 \u0111\u1ED1i chi\u1EBFu."
          },
          {
            id: "rtc-3",
            location: "M\u1EE5c 4.3",
            relatedQuote: "\u0110\u1EC3 ho\xE0n th\xE0nh c\xE1c d\u1EF1 \xE1n l\u1EDBn, h\u1ECDc sinh ti\u1EBFp t\u1EE5c ho\xE0n thi\u1EC7n code tr\xEAn m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0 v\xE0 n\u1ED9p link qua h\u1EC7 th\u1ED1ng tr\u1EF1c tuy\u1EBFn.",
            issueDetected: "Ph\u1EE5 thu\u1ED9c v\xE0o m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0, thi\u1EBFu ph\u01B0\u01A1ng \xE1n c\xF4ng b\u1EB1ng h\u1ECDc t\u1EADp",
            impactLevel: "Trung b\xECnh",
            affectedCriterion: "Ti\xEAu ch\xED 4: T\xEDnh th\u1EF1c ti\u1EC5n & Kh\u1EA3 n\u0103ng \xE1p d\u1EE5ng",
            status: "Ch\u01B0a x\u1EED l\xFD",
            criticismBasis: "Nguy\xEAn t\u1EAFc s\u01B0 ph\u1EA1m: Gi\u1EA3i ph\xE1p gi\xE1o d\u1EE5c ph\u1EA3i b\u1EA3o \u0111\u1EA3m t\xEDnh kh\u1EA3 thi v\xE0 c\xF4ng b\u1EB1ng h\u1ECDc t\u1EADp cho m\u1ECDi h\u1ECDc sinh, k\u1EC3 c\u1EA3 h\u1ECDc sinh kh\xF4ng c\xF3 thi\u1EBFt b\u1ECB c\xE1 nh\xE2n \u1EDF nh\xE0.",
            whyItMatters: "Gi\xE1m kh\u1EA3o c\xF3 th\u1EC3 \u0111\xE1nh gi\xE1 s\xE1ng ki\u1EBFn kh\xF3 nh\xE2n r\u1ED9ng \u0111\u1EA1i tr\xE0 n\u1EBFu ph\u1EE5 thu\u1ED9c v\xE0o \u0111i\u1EC1u ki\u1EC7n kinh t\u1EBF gia \u0111\xECnh c\u1EE7a h\u1ECDc sinh.",
            resolutionGuidance: "B\u1ED5 sung ph\u01B0\u01A1ng \xE1n h\u1ED7 tr\u1EE3 h\u1ECDc sinh th\u1EF1c h\xE0nh t\u1EA1i tr\u01B0\u1EDDng ho\u1EB7c gh\xE9p nh\xF3m h\u1ECDc t\u1EADp (Pair programming).",
            requiredEvidence: "K\u1EBF ho\u1EA1ch m\u1EDF ph\xF2ng m\xE1y ngo\xE0i gi\u1EDD ho\u1EB7c quy ch\u1EBF l\xE0m vi\u1EC7c nh\xF3m.",
            councilChallenge: "N\u1EBFu h\u1ECDc sinh \u1EDF v\xF9ng s\xE2u ho\u1EB7c gia \u0111\xECnh kh\xF4ng c\xF3 m\xE1y t\xEDnh th\xEC s\xE1ng ki\u1EBFn n\xE0y \xE1p d\u1EE5ng th\u1EBF n\xE0o?",
            mitigationStrategy: "B\u1ED5 sung ph\u01B0\u01A1ng \xE1n th\u1EF1c h\xE0nh theo c\u1EB7p (Pair programming) t\u1EA1i ph\xF2ng m\xE1y tr\u01B0\u1EDDng."
          }
        ],
        novelty: {
          noveltyScore: 35,
          overallVerdict: "\xDD t\u01B0\u1EDFng \xE1p d\u1EE5ng d\u1EF1 \xE1n th\u1EF1c t\u1EBF trong l\u1EADp tr\xECnh Python l\xE0 h\u01B0\u1EDBng \u0111i ph\xF9 h\u1EE3p, tuy nhi\xEAn \u0111i\u1EC3m m\u1EDBi c\u1EA7n \u0111\u01B0\u1EE3c c\u1EA5u tr\xFAc th\xE0nh quy tr\xECnh d\u1EA1y h\u1ECDc r\xF5 r\xE0ng thay v\xEC \u0111\u1ED3ng nh\u1EA5t v\u1EDBi vi\u1EC7c cho h\u1ECDc sinh l\xE0m b\xE0i t\u1EADp.",
          strengths: ["\u0110\xE3 ti\u1EBFp c\u1EADn m\u1EA1ch ki\u1EBFn th\u1EE9c m\u1EDBi c\u1EE7a CT 2018", "B\xE0i t\u1EADp c\xF3 t\xEDnh \u1EE9ng d\u1EE5ng th\u1EF1c t\u1EBF"],
          limitations: ["Ch\u01B0a c\xF3 quy tr\xECnh d\u1EA1y h\u1ECDc 4 b\u01B0\u1EDBc \u0111\u1ED9c l\u1EADp", "C\xF4ng c\u1EE5 ph\u1ED5 th\xF4ng"]
        },
        evidenceChain: [
          { claim: "H\u1ECDc sinh ti\u1EBFn b\u1ED9 v\u01B0\u1EE3t b\u1EADc sau 6 th\xE1ng", evidenceFound: "B\u1EA3ng \u0111i\u1EC3m t\u1ED5ng k\u1EBFt h\u1ECDc k\u1EF3", verdict: "Ch\u01B0a \u0111\u1EE7 c\u0103n c\u1EE9 \u0111\u1ED1i ch\u1EE9ng", gap: "Thi\u1EBFu \u0111i\u1EC3m Pre-test \u0111\u1EA7u v\xE0o" },
          { claim: "H\u1ECDc sinh h\u1EE9ng th\xFA v\u1EDBi d\u1EF1 \xE1n th\u1EF1c t\u1EBF", evidenceFound: "\u1EA2nh ch\u1EE5p s\u1EA3n ph\u1EA9m h\u1ECDc t\u1EADp", verdict: "C\xF3 minh ch\u1EE9ng m\u1ED9t ph\u1EA7n", gap: "Thi\u1EBFu phi\u1EBFu kh\u1EA3o s\xE1t th\xE1i \u0111\u1ED9 \u0111\u1ED9c l\u1EADp" }
        ],
        dataAnomalies: [
          { description: "Ch\xEAnh l\u1EC7ch c\u1EE1 m\u1EABu gi\u1EEFa 75 h\u1ECDc sinh n\xEAu trong thuy\u1EBFt minh v\xE0 72 b\xE0i ki\u1EC3m tra thu \u0111\u01B0\u1EE3c", location: "M\u1EE5c 5, B\u1EA3ng 1", severity: "C\u1EA3nh b\xE1o" }
        ],
        logicGaps: [
          { description: "\u0110\u1EE9t g\xE3y gi\u1EEFa m\u1EE5c ti\xEAu ph\xE1t tri\u1EC3n t\u01B0 duy thu\u1EADt to\xE1n v\u1EDBi vi\u1EC7c ch\u1EC9 giao b\xE0i t\u1EADp l\u1EADp tr\xECnh m\u1EABu", location: "M\u1EE5c 4.2" }
        ],
        suggestions: [
          {
            id: "sug-rtc-1",
            targetSection: "M\u1EE5c 3.2 & M\u1EE5c 4.1",
            originalText: "Ti\u1EBFn h\xE0nh th\u1EF1c nghi\u1EC7m t\u1EA1i l\u1EDBp 11A1 v\xE0 \u0111\u1ED1i ch\u1EE9ng t\u1EA1i l\u1EDBp 11A2; sau m\u1ED9t h\u1ECDc k\u1EF3 \xE1p d\u1EE5ng d\u1EF1 \xE1n Python, k\u1EBFt qu\u1EA3 h\u1ECDc t\u1EADp l\u1EDBp 11A1 cao h\u01A1n r\xF5 r\u1EC7t.",
            problem: "Thi\u1EBFu b\xE0i ki\u1EC3m tra n\u0103ng l\u1EF1c \u0111\u1EA7u v\xE0o \u0111\u1ED1i ch\u1EE9ng (Pre-test) gi\u1EEFa hai nh\xF3m h\u1ECDc sinh.",
            whyRevise: "Nghi\xEAn c\u1EE9u \u0111\u1ED1i ch\u1EE9ng b\u1EAFt bu\u1ED9c ph\u1EA3i ki\u1EC3m so\xE1t bi\u1EBFn thi\xEAn \u0111\u1EA7u v\xE0o \u0111\u1EC3 kh\u1EB3ng \u0111\u1ECBnh t\xEDnh khoa h\u1ECDc c\u1EE7a gi\u1EA3i ph\xE1p.",
            basis: "Quy chu\u1EA9n nghi\xEAn c\u1EE9u s\u01B0 ph\u1EA1m \u1EE9ng d\u1EE5ng v\xE0 ti\xEAu chu\u1EA9n \u0111\xE1nh gi\xE1 SKKN.",
            category: "T\xEDnh khoa h\u1ECDc & Logic s\u01B0 ph\u1EA1m",
            revisionGoal: "Chu\u1EA9n h\xF3a thi\u1EBFt k\u1EBF th\u1EF1c nghi\u1EC7m v\xE0 minh b\u1EA1ch gi\u1EDBi h\u1EA1n nghi\xEAn c\u1EE9u \u0111\u1ED1i ch\u1EE9ng.",
            howToRevise: "B\u1ED5 sung gi\u1EA3i tr\xECnh v\u1EC1 \u0111\u1ED9 t\u01B0\u01A1ng \u0111\u01B0\u01A1ng \u0111\u1EA7u v\xE0o gi\u1EEFa hai l\u1EDBp 11A1 v\xE0 11A2.",
            lightRevision: "Ti\u1EBFn h\xE0nh th\u1EF1c nghi\u1EC7m t\u1EA1i l\u1EDBp 11A1 v\xE0 \u0111\u1ED1i ch\u1EE9ng t\u1EA1i l\u1EDBp 11A2. Sau m\u1ED9t h\u1ECDc k\u1EF3 tri\u1EC3n khai c\xE1c d\u1EF1 \xE1n Python, k\u1EBFt qu\u1EA3 ghi nh\u1EADn h\u1ECDc sinh l\u1EDBp 11A1 c\xF3 s\u1EF1 chuy\u1EC3n bi\u1EBFn t\xEDch c\u1EF1c trong vi\u1EC7c gi\u1EA3i quy\u1EBFt b\xE0i to\xE1n l\u1EADp tr\xECnh.",
            academicRevision: "Nghi\xEAn c\u1EE9u \u0111\u01B0\u1EE3c tri\u1EC3n khai th\u1EF1c nghi\u1EC7m s\u01B0 ph\u1EA1m c\xF3 \u0111\u1ED1i ch\u1EE9ng gi\u1EEFa hai nh\xF3m h\u1ECDc sinh: l\u1EDBp th\u1EF1c nghi\u1EC7m (11A1) v\xE0 l\u1EDBp \u0111\u1ED1i ch\u1EE9ng (11A2). Do ch\u01B0a th\u1EC3 ti\u1EBFn h\xE0nh b\xE0i ki\u1EC3m tra ti\u1EC1n th\u1EF1c nghi\u1EC7m (Pre-test) di\u1EC7n r\u1ED9ng, t\xE1c gi\u1EA3 \u0111\xE3 \u0111\u1ED1i so\xE1t \u0111i\u1EC3m s\u1ED1 h\u1ECDc k\u1EF3 tr\u01B0\u1EDBc \u0111\u1EC3 b\u1EA3o \u0111\u1EA3m s\u1EF1 t\u01B0\u01A1ng \u0111\u1ED3ng t\u01B0\u01A1ng \u0111\u1ED1i v\u1EC1 n\u0103ng l\u1EF1c ban \u0111\u1EA7u [GV \u0111i\u1EC1n: \u0111i\u1EC3m s\u1ED1 c\u1EE5 th\u1EC3], \u0111\u1ED3ng th\u1EDDi l\u01B0u \xFD gi\u1EDBi h\u1EA1n n\xE0y trong ph\u1EA1m vi nghi\xEAn c\u1EE9u.",
            deepRevision: "Quy tr\xECnh can thi\u1EC7p s\u01B0 ph\u1EA1m \u0111\u01B0\u1EE3c thi\u1EBFt l\u1EADp theo m\xF4 h\xECnh \u0111\u1ED1i ch\u1EE9ng: l\u1EDBp th\u1EF1c nghi\u1EC7m 11A1 \xE1p d\u1EE5ng h\u1ECDc t\u1EADp theo d\u1EF1 \xE1n, l\u1EDBp \u0111\u1ED1i ch\u1EE9ng 11A2 d\u1EA1y theo ph\u01B0\u01A1ng ph\xE1p truy\u1EC1n th\u1ED1ng. V\u1EC1 bi\u1EBFn ki\u1EC3m so\xE1t \u0111\u1EA7u v\xE0o: \u0111i\u1EC3m trung b\xECnh m\xF4n To\xE1n - Tin c\u1EE7a hai nh\xF3m tr\u01B0\u1EDBc can thi\u1EC7p \u0111\u01B0\u1EE3c \u0111\u1ED1i chi\u1EBFu \u1EDF m\u1EE9c t\u01B0\u01A1ng \u0111\u01B0\u01A1ng. To\xE0n b\u1ED9 b\u1EA3ng th\u1ED1ng k\xEA v\xE0 phi\u1EBFu quan s\xE1t th\u1EF1c nghi\u1EC7m \u0111\u01B0\u1EE3c \u0111\xEDnh k\xE8m t\u1EA1i Ph\u1EE5 l\u1EE5c s\u1ED1 2 [C\u1EA6N B\u1ED4 SUNG MINH CH\u1EE8NG \u0110\u1ED0I CH\u1EE8NG].",
            missingEvidenceAlert: "C\u1EA7n b\u1ED5 sung phi\u1EBFu kh\u1EA3o s\xE1t ho\u1EB7c \u0111i\u1EC3m s\u1ED1 h\u1ECDc k\u1EF3 tr\u01B0\u1EDBc l\xE0m \u0111\u1ED1i ch\u1EE9ng t\u01B0\u01A1ng \u0111\u01B0\u01A1ng.",
            insertPosition: "M\u1EE5c 3.2 & M\u1EE5c 4.1"
          },
          {
            id: "sug-rtc-2",
            targetSection: "M\u1EE5c 5, Trang 22",
            originalText: "Sau th\u1EDDi gian \xE1p d\u1EE5ng gi\u1EA3i ph\xE1p, 100% h\u1ECDc sinh trong l\u1EDBp \u0111\u1EC1u say m\xEA h\u1ECDc t\u1EADp v\xE0 kh\xF4ng c\xF2n em n\xE0o c\u1EA3m th\u1EA5y s\u1EE3 l\u1EADp tr\xECnh Python.",
            problem: "C\xE1ch di\u1EC5n \u0111\u1EA1t kh\u1EB3ng \u0111\u1ECBnh tuy\u1EC7t \u0111\u1ED1i 100% thi\u1EBFu chu\u1EA9n m\u1EF1c khoa h\u1ECDc.",
            whyRevise: "H\u1ED9i \u0111\u1ED3ng s\u1EBD ch\u1EA5t v\u1EA5n gay g\u1EAFt v\u1EC1 t\xEDnh trung th\u1EF1c v\xE0 \u0111\u1ED9 tin c\u1EADy c\u1EE7a s\u1ED1 li\u1EC7u n\u1EBFu \u0111\u01B0a ra tuy\xEAn b\u1ED1 tuy\u1EC7t \u0111\u1ED1i.",
            basis: "Chu\u1EA9n m\u1EF1c \u0111\xE1nh gi\xE1 SKKN ng\xE0nh GD&\u0110T v\xE0 quy t\u1EAFc li\xEAm ch\xEDnh khoa h\u1ECDc.",
            category: "T\xEDnh hi\u1EC7u qu\u1EA3 & Minh ch\u1EE9ng x\xE1c th\u1EF1c",
            revisionGoal: "Chu\u1EA9n h\xF3a ng\xF4n t\u1EEB, lo\u1EA1i b\u1ECF kh\u1EB3ng \u0111\u1ECBnh tuy\u1EC7t \u0111\u1ED1i v\xE0 b\xE1m s\xE1t s\u1ED1 li\u1EC7u kh\u1EA3o s\xE1t th\u1EF1c t\u1EBF.",
            howToRevise: "\u0110i\u1EC1u ch\u1EC9nh di\u1EC5n \u0111\u1EA1t theo k\u1EBFt qu\u1EA3 phi\u1EBFu \u0111i\u1EC1u tra th\u1EF1c t\u1EBF, kh\xF4ng d\xF9ng t\u1EEB 100%.",
            lightRevision: "Sau th\u1EDDi gian \xE1p d\u1EE5ng gi\u1EA3i ph\xE1p, \u0111\u1EA1i \u0111a s\u1ED1 h\u1ECDc sinh trong l\u1EDBp \u0111\u1EC1u h\xE0o h\u1EE9ng tham gia v\xE0 t\u1EF1 tin h\u01A1n trong c\xE1c gi\u1EDD h\u1ECDc l\u1EADp tr\xECnh Python.",
            academicRevision: "K\u1EBFt qu\u1EA3 \u0111\xE1nh gi\xE1 sau qu\xE1 tr\xECnh \xE1p d\u1EE5ng gi\u1EA3i ph\xE1p cho th\u1EA5y ph\u1EA7n l\u1EDBn h\u1ECDc sinh \u0111\xE3 h\xECnh th\xE0nh th\xE1i \u0111\u1ED9 h\u1ECDc t\u1EADp ch\u1EE7 \u0111\u1ED9ng v\xE0 c\u1EA3i thi\u1EC7n r\xF5 r\u1EC7t n\u0103ng l\u1EF1c thu\u1EADt to\xE1n [GV \u0111i\u1EC1n: t\u1EF7 l\u1EC7 % theo phi\u1EBFu kh\u1EA3o s\xE1t th\u1EF1c t\u1EBF].",
            deepRevision: "D\u1EF1a tr\xEAn phi\u1EBFu kh\u1EA3o s\xE1t th\xE1i \u0111\u1ED9 v\xE0 b\xE0i ki\u1EC3m tra k\u1EF9 n\u0103ng th\u1EF1c h\xE0nh thu \u0111\u01B0\u1EE3c t\u1EA1i l\u1EDBp 11A1: \u0111a s\u1ED1 h\u1ECDc sinh ghi nh\u1EADn s\u1EF1 chuy\u1EC3n bi\u1EBFn t\xEDch c\u1EF1c v\u1EC1 h\u1EE9ng th\xFA h\u1ECDc t\u1EADp v\xE0 n\u0103ng l\u1EF1c gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1 b\u1EB1ng Python. C\xE1c d\u1EEF li\u1EC7u \u0111\u1ECBnh l\u01B0\u1EE3ng c\u1EE5 th\u1EC3 v\xE0 phi\u1EBFu \u0111i\u1EC1u tra g\u1ED1c \u0111\u01B0\u1EE3c l\u01B0u tr\u1EEF t\u1EA1i Ph\u1EE5 l\u1EE5c [C\u1EA6N B\u1ED4 SUNG S\u1ED0 LI\u1EC6U KH\u1EA2O S\xC1T TH\u1EF0C T\u1EBE].",
            missingEvidenceAlert: "C\u1EA7n \u0111\xEDnh k\xE8m m\u1EABu phi\u1EBFu kh\u1EA3o s\xE1t v\xE0 b\u1EA3ng s\u1ED1 li\u1EC7u th\xF4 t\u1EA1i Ph\u1EE5 l\u1EE5c.",
            insertPosition: "M\u1EE5c 5, Trang 22"
          },
          {
            id: "sug-rtc-3",
            targetSection: "M\u1EE5c 4.3",
            originalText: "\u0110\u1EC3 ho\xE0n th\xE0nh c\xE1c d\u1EF1 \xE1n l\u1EDBn, h\u1ECDc sinh ti\u1EBFp t\u1EE5c ho\xE0n thi\u1EC7n code tr\xEAn m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0 v\xE0 n\u1ED9p link qua h\u1EC7 th\u1ED1ng tr\u1EF1c tuy\u1EBFn.",
            problem: "Ph\u1EE5 thu\u1ED9c v\xE0o m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0, thi\u1EBFu ph\u01B0\u01A1ng \xE1n c\xF4ng b\u1EB1ng h\u1ECDc t\u1EADp.",
            whyRevise: "S\xE1ng ki\u1EBFn c\u1EA7n b\u1EA3o \u0111\u1EA3m t\xEDnh kh\u1EA3 thi v\xE0 c\xF4ng b\u1EB1ng h\u1ECDc t\u1EADp cho m\u1ECDi h\u1ECDc sinh, k\u1EC3 c\u1EA3 h\u1ECDc sinh kh\xF4ng c\xF3 m\xE1y t\xEDnh \u1EDF nh\xE0.",
            basis: "Ti\xEAu chu\u1EA9n t\xEDnh kh\u1EA3 thi v\xE0 nh\xE2n r\u1ED9ng c\u1EE7a s\xE1ng ki\u1EBFn gi\xE1o d\u1EE5c.",
            category: "T\xEDnh th\u1EF1c ti\u1EC5n & Kh\u1EA3 n\u0103ng \xE1p d\u1EE5ng",
            revisionGoal: "B\u1ED5 sung gi\u1EA3i ph\xE1p th\u1EF1c h\xE0nh t\u1EA1i tr\u01B0\u1EDDng v\xE0 ph\u01B0\u01A1ng \xE1n h\u1ECDc t\u1EADp theo nh\xF3m.",
            howToRevise: "N\xEAu r\xF5 ph\u01B0\u01A1ng \xE1n m\u1EDF ph\xF2ng m\xE1y ngo\xE0i gi\u1EDD v\xE0 h\xECnh th\u1EE9c l\u1EADp tr\xECnh theo c\u1EB7p (Pair programming).",
            lightRevision: "\u0110\u1EC3 ho\xE0n th\xE0nh c\xE1c d\u1EF1 \xE1n h\u1ECDc t\u1EADp, h\u1ECDc sinh c\xF3 th\u1EC3 ti\u1EBFp t\u1EE5c th\u1EF1c h\xE0nh tr\xEAn m\xE1y t\xEDnh c\xE1 nh\xE2n \u1EDF nh\xE0 ho\u1EB7c \u0111\u0103ng k\xFD th\u1EF1c h\xE0nh th\xEAm t\u1EA1i ph\xF2ng m\xE1y t\xEDnh c\u1EE7a nh\xE0 tr\u01B0\u1EDDng.",
            academicRevision: "Nh\u1EB1m b\u1EA3o \u0111\u1EA3m t\xEDnh c\xF4ng b\u1EB1ng h\u1ECDc t\u1EADp cho m\u1ECDi h\u1ECDc sinh, nh\xE0 tr\u01B0\u1EDDng t\u1EA1o \u0111i\u1EC1u ki\u1EC7n m\u1EDF c\u1EEDa ph\xF2ng m\xE1y t\xEDnh ngo\xE0i gi\u1EDD \u0111\u1EC3 c\xE1c em kh\xF4ng c\xF3 m\xE1y t\xEDnh c\xE1 nh\xE2n v\u1EABn c\xF3 th\u1EC3 ho\xE0n th\xE0nh s\u1EA3n ph\u1EA9m d\u1EF1 \xE1n; \u0111\u1ED3ng th\u1EDDi \xE1p d\u1EE5ng ph\u01B0\u01A1ng ph\xE1p l\u1EADp tr\xECnh theo c\u1EB7p (Pair programming).",
            deepRevision: "Gi\u1EA3i ph\xE1p \u0111\u01B0\u1EE3c thi\u1EBFt k\u1EBF th\xEDch \u1EE9ng v\u1EDBi m\u1ECDi \u0111i\u1EC1u ki\u1EC7n c\u01A1 s\u1EDF v\u1EADt ch\u1EA5t: h\u1ECDc sinh \u0111\u01B0\u1EE3c ph\xE2n nh\xF3m linh ho\u1EA1t \u0111\u1EC3 t\u01B0\u01A1ng tr\u1EE3 l\u1EABn nhau; t\u1ED5 chuy\xEAn m\xF4n b\u1ED1 tr\xED l\u1ECBch m\u1EDF ph\xF2ng m\xE1y t\xEDnh tr\u01B0\u1EDDng v\xE0o c\xE1c bu\u1ED5i chi\u1EC1u c\xF3 gi\xE1o vi\xEAn h\u01B0\u1EDBng d\u1EABn, b\u1EA3o \u0111\u1EA3m 100% h\u1ECDc sinh \u0111\u1EC1u c\xF3 th\u1EDDi l\u01B0\u1EE3ng th\u1EF1c h\xE0nh b\xECnh \u0111\u1EB3ng tr\xEAn m\xE1y t\xEDnh.",
            missingEvidenceAlert: "C\u1EA7n \u0111\xEDnh k\xE8m l\u1ECBch tr\u1EF1c ph\xF2ng m\xE1y v\xE0 quy ch\u1EBF l\xE0m vi\u1EC7c nh\xF3m t\u1EA1i Ph\u1EE5 l\u1EE5c.",
            insertPosition: "M\u1EE5c 4.3"
          }
        ],
        councilQuestions: [
          {
            id: "cq-1",
            difficulty: "\u{1F534} C\xE2u h\u1ECFi kh\xF3",
            question: "H\u1ED9i \u0111\u1ED3ng ch\u1EA5t v\u1EA5n: \u0110\u1EC1 t\xE0i n\xEAu \xE1p d\u1EE5ng d\u1EF1 \xE1n th\u1EF1c t\u1EBF, xin t\xE1c gi\u1EA3 ch\u1EC9 r\xF5 quy tr\xECnh \u0111\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m c\u1EE7a t\u1EEBng c\xE1 nh\xE2n khi h\u1ECDc sinh l\xE0m vi\u1EC7c theo nh\xF3m?",
            whyCouncilAsks: "Ki\u1EC3m tra t\xEDnh c\xE1 th\u1EC3 h\xF3a trong \u0111\xE1nh gi\xE1 n\u0103ng l\u1EF1c h\u1ECDc sinh.",
            relatedLocation: "M\u1EE5c 4.2",
            requiredEvidenceToBring: "Rubric \u0111\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m d\u1EF1 \xE1n c\xF3 ph\xE2n \u0111\u1ECBnh \u0111\xF3ng g\xF3p c\u1EE7a t\u1EEBng th\xE0nh vi\xEAn.",
            suggestedAnswerStrategy: "Tr\xECnh b\xE0y Rubric 3 ti\xEAu ch\xED: \u0110\xF3ng g\xF3p \xFD t\u01B0\u1EDFng thu\u1EADt to\xE1n, Hi\u1EC7n th\u1EF1c h\xF3a m\xE3 code, v\xE0 Thuy\u1EBFt tr\xECnh b\u1EA3o v\u1EC7 s\u1EA3n ph\u1EA9m."
          }
        ],
        priorityActions: [
          { id: "pa-1", title: "\u0110\xEDnh ch\xEDnh con s\u1ED1 kh\u1EA3o s\xE1t v\xE0 b\u1ECF c\xE1c kh\u1EB3ng \u0111\u1ECBnh 100%", urgency: "Kh\u1EA9n c\u1EA5p" },
          { id: "pa-2", title: "B\u1ED5 sung Rubric \u0111\xE1nh gi\xE1 n\u0103ng l\u1EF1c \u0111\u1ED1i ch\u1EE9ng v\xE0o Ph\u1EE5 l\u1EE5c", urgency: "Quan tr\u1ECDng" }
        ],
        createdAt: "2026-10-18T10:15:00.000Z"
      }
    };
    store2.evaluations[tinHoc11Id] = defaultTinHoc11;
    saveEvaluationsStore();
  }
}
function loadEvaluationsStore() {
  try {
    if (!fs2.existsSync(DATA_DIR2)) {
      try {
        fs2.mkdirSync(DATA_DIR2, { recursive: true });
      } catch (_) {
      }
    }
    if (fs2.existsSync(EVALUATIONS_FILE)) {
      const content = fs2.readFileSync(EVALUATIONS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      store2 = {
        evaluations: parsed.evaluations || {},
        auditLogs: parsed.auditLogs || []
      };
    }
    if (fs2.existsSync(TMP_EVALUATIONS_FILE)) {
      try {
        const tmpContent = fs2.readFileSync(TMP_EVALUATIONS_FILE, "utf-8");
        const tmpParsed = JSON.parse(tmpContent);
        if (tmpParsed && tmpParsed.evaluations) {
          Object.entries(tmpParsed.evaluations).forEach(([id, item]) => {
            store2.evaluations[id] = {
              ...store2.evaluations[id] || {},
              ...item
            };
          });
        }
      } catch (_) {
      }
    }
    ensureDefaultEvaluations();
    Object.values(store2.evaluations).forEach((item) => {
      if (item.teacherNotes) {
        item.teacherNotes = normalizeTeacherNotes(item.teacherNotes, item.id);
      }
      if (item.analysisResult && item.analysisResult.teacherNotes) {
        item.analysisResult.teacherNotes = normalizeTeacherNotes(item.analysisResult.teacherNotes, item.id);
      }
    });
  } catch (err) {
    console.error("Kh\xF4ng th\u1EC3 t\u1EA3i evaluations_store.json, kh\u1EDFi t\u1EA1o b\u1ED9 nh\u1EDB r\u1ED7ng:", err);
    ensureDefaultEvaluations();
  }
}
loadEvaluationsStore();
function reloadEvaluationsStoreFromDisk() {
  try {
    if (fs2.existsSync(EVALUATIONS_FILE)) {
      const content = fs2.readFileSync(EVALUATIONS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed) {
        store2.evaluations = parsed.evaluations || {};
        store2.auditLogs = parsed.auditLogs || [];
      }
    }
    if (fs2.existsSync(TMP_EVALUATIONS_FILE)) {
      try {
        const tmpContent = fs2.readFileSync(TMP_EVALUATIONS_FILE, "utf-8");
        const tmpParsed = JSON.parse(tmpContent);
        if (tmpParsed && tmpParsed.evaluations) {
          Object.entries(tmpParsed.evaluations).forEach(([id, item]) => {
            store2.evaluations[id] = {
              ...store2.evaluations[id] || {},
              ...item
            };
          });
        }
      } catch (_) {
      }
    }
    ensureDefaultEvaluations();
    Object.values(store2.evaluations).forEach((item) => {
      if (item.teacherNotes) {
        item.teacherNotes = normalizeTeacherNotes(item.teacherNotes, item.id);
      }
      if (item.analysisResult && item.analysisResult.teacherNotes) {
        item.analysisResult.teacherNotes = normalizeTeacherNotes(item.analysisResult.teacherNotes, item.id);
      }
      if (!item.versionsHistory || !Array.isArray(item.versionsHistory) || item.versionsHistory.length === 0) {
        item.versionsHistory = [{
          version: item.currentVersion || item.versionCount || 1,
          createdAt: item.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          score: item.score,
          notes: "B\u1EA3n ph\xE2n t\xEDch \u0111\u1EA7u ti\xEAn",
          resultSummary: item.analysisResult?.executiveSummary?.strengthsSummary || item.analysisResult?.metadata?.title || item.title
        }];
      }
    });
  } catch (_) {
    ensureDefaultEvaluations();
  }
}
function saveEvaluationsStore() {
  const serialized = JSON.stringify(store2, null, 2);
  try {
    if (!fs2.existsSync(DATA_DIR2)) {
      fs2.mkdirSync(DATA_DIR2, { recursive: true });
    }
    fs2.writeFileSync(EVALUATIONS_FILE, serialized, "utf-8");
  } catch (err) {
  }
  try {
    if (!fs2.existsSync(TMP_DATA_DIR)) {
      fs2.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs2.writeFileSync(TMP_EVALUATIONS_FILE, serialized, "utf-8");
  } catch (_) {
  }
}
function addAuditLog(log) {
  const auditItem = {
    auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...log
  };
  store2.auditLogs.unshift(auditItem);
  if (store2.auditLogs.length > 500) {
    store2.auditLogs = store2.auditLogs.slice(0, 500);
  }
  saveEvaluationsStore();
  return auditItem;
}
async function callAppsScriptStorage(action, payload) {
  if (!process.env.LICENSE_API_URL) {
    return { success: false, error: "Ch\u01B0a c\u1EA5u h\xECnh LICENSE_API_URL" };
  }
  try {
    const resp = await fetch(process.env.LICENSE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        serverSecret: process.env.APPS_SCRIPT_SECRET || "",
        ...payload
      }),
      signal: AbortSignal.timeout(2e4)
    });
    if (!resp.ok) {
      return { success: false, error: `Apps Script HTTP ${resp.status}` };
    }
    const data = await resp.json().catch(() => null);
    if (!data) {
      return { success: false, error: "Kh\xF4ng th\u1EC3 gi\u1EA3i m\xE3 ph\u1EA3n h\u1ED3i t\u1EEB Apps Script" };
    }
    return { success: Boolean(data.success), data, error: data.error };
  } catch (err) {
    return { success: false, error: err.message || "L\u1ED7i k\u1EBFt n\u1ED1i Apps Script" };
  }
}
async function listUserEvaluations(userEmail, userId) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = userEmail.toLowerCase().trim();
  if (process.env.LICENSE_API_URL) {
    try {
      const remote = await callAppsScriptStorage("listEvaluations", {
        userEmail: cleanEmail,
        userId: userId || cleanEmail,
        operatorEmail: cleanEmail
      });
      if (remote.success && Array.isArray(remote.data?.evaluations)) {
        remote.data.evaluations.forEach((remoteItem) => {
          if (remoteItem.id && remoteItem.userEmail?.toLowerCase() === cleanEmail) {
            store2.evaluations[remoteItem.id] = {
              ...store2.evaluations[remoteItem.id],
              ...remoteItem
            };
          }
        });
        saveEvaluationsStore();
      }
    } catch (_) {
    }
  }
  const list = Object.values(store2.evaluations).filter((item) => {
    return item.userEmail.toLowerCase() === cleanEmail || userId && item.userId === userId;
  });
  list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  return list;
}
async function createEvaluationRecord(params) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const evalId = `eval_${Date.now()}_${crypto2.randomBytes(3).toString("hex")}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const initialScore = typeof params.score === "number" ? params.score : params.analysisResult?.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? 0;
  const initialVersion = 1;
  const versionsHistory = [];
  if (params.analysisResult) {
    versionsHistory.push({
      version: initialVersion,
      createdAt: now,
      score: initialScore,
      notes: "B\u1EA3n ph\xE2n t\xEDch \u0111\u1EA7u ti\xEAn",
      resultSummary: params.analysisResult?.executiveSummary?.strengthsSummary || params.analysisResult.metadata?.title || ""
    });
  }
  const initialOriginalText = params.originalText || params.analysisResult?.metadata?.originalText || "";
  const initialDraftText = params.draftText || initialOriginalText;
  const initialChangeSet = params.changeSet || params.analysisResult?.changeSet || [];
  const newEval = {
    id: evalId,
    userId: params.userId || cleanEmail,
    userEmail: cleanEmail,
    title: params.title.trim() || "H\u1ED3 s\u01A1 S\xE1ng ki\u1EBFn kinh nghi\u1EC7m",
    subject: params.subject?.trim() || "Chung",
    gradeLevel: params.gradeLevel?.trim() || "",
    score: initialScore,
    status: params.analysisResult ? "COMPLETED" : "DRAFT",
    versionCount: initialVersion,
    currentVersion: initialVersion,
    originalFileName: params.originalFileName || "",
    originalFileSize: params.originalFileSize || 0,
    wordCount: params.wordCount || 0,
    createdAt: now,
    updatedAt: now,
    analysisResult: params.analysisResult ? {
      ...params.analysisResult,
      changeSet: initialChangeSet
    } : void 0,
    originalText: initialOriginalText,
    draftText: initialDraftText,
    changeSet: initialChangeSet,
    versionsHistory
  };
  store2.evaluations[evalId] = newEval;
  saveEvaluationsStore();
  addAuditLog({
    action: "CREATE",
    userId: newEval.userId,
    userEmail: cleanEmail,
    evaluationId: evalId,
    details: `T\u1EA1o h\u1ED3 s\u01A1 m\u1EDBi: "${newEval.title}" (v1)`,
    status: "SUCCESS"
  });
  if (process.env.LICENSE_API_URL) {
    const remote = await callAppsScriptStorage("createEvaluation", {
      userEmail: cleanEmail,
      userId: newEval.userId,
      evaluation: {
        id: newEval.id,
        title: newEval.title,
        subject: newEval.subject,
        gradeLevel: newEval.gradeLevel,
        score: newEval.score,
        status: newEval.status,
        versionCount: newEval.versionCount,
        currentVersion: newEval.currentVersion,
        originalFileName: newEval.originalFileName,
        originalFileSize: newEval.originalFileSize,
        wordCount: newEval.wordCount,
        createdAt: newEval.createdAt,
        updatedAt: newEval.updatedAt
      },
      originalFileBase64: params.originalFileBase64 || "",
      analysisResult: params.analysisResult ? JSON.stringify(params.analysisResult) : "",
      operatorEmail: cleanEmail
    });
    if (remote.success && remote.data?.evaluation) {
      if (remote.data.evaluation.driveFolderId) newEval.driveFolderId = remote.data.evaluation.driveFolderId;
      if (remote.data.evaluation.latestResultFileId) newEval.latestResultFileId = remote.data.evaluation.latestResultFileId;
      if (remote.data.evaluation.originalFileId) newEval.originalFileId = remote.data.evaluation.originalFileId;
      saveEvaluationsStore();
    }
  }
  return { success: true, evaluation: newEval };
}
async function getEvaluationDetail(evalId, userEmail) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = userEmail.toLowerCase().trim();
  const item = store2.evaluations[evalId];
  if (!item) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1" };
  }
  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: "B\u1EA3o m\u1EADt: Th\u1EA7y/C\xF4 kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp h\u1ED3 s\u01A1 n\xE0y" };
  }
  if (!item.analysisResult && process.env.LICENSE_API_URL && item.driveFolderId) {
    const remote = await callAppsScriptStorage("getEvaluation", {
      evaluationId: evalId,
      userEmail: cleanEmail,
      operatorEmail: cleanEmail
    });
    if (remote.success && remote.data?.analysisResult) {
      try {
        item.analysisResult = typeof remote.data.analysisResult === "string" ? JSON.parse(remote.data.analysisResult) : remote.data.analysisResult;
        saveEvaluationsStore();
      } catch (_) {
      }
    }
  }
  if (item.analysisResult) {
    if (item.customProposals) {
      item.analysisResult.customProposals = {
        ...item.analysisResult.customProposals || {},
        ...item.customProposals
      };
    }
    const rawNotesToMerge = {
      ...item.analysisResult.teacherNotes || {},
      ...item.teacherNotes || {}
    };
    const cleanNotes = normalizeTeacherNotes(rawNotesToMerge, item.id);
    if (Array.isArray(item.analysisResult.redTeamCards)) {
      item.analysisResult.redTeamCards.forEach((c) => {
        const cleanCardNote = cleanNotes[c.id];
        if (typeof cleanCardNote === "string" && cleanCardNote.trim()) {
          c.userNotes = cleanCardNote;
        } else if (c.userNotes && typeof c.userNotes === "string" && c.userNotes.trim() && !cleanNotes[c.id]) {
          cleanNotes[c.id] = c.userNotes.trim();
        }
      });
    }
    item.teacherNotes = cleanNotes;
    item.analysisResult.teacherNotes = { ...cleanNotes };
  }
  return { success: true, evaluation: item };
}
async function saveEvaluationResultRecord(params) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store2.evaluations[params.evaluationId];
  if (!item) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 \u0111\u1EC3 l\u01B0u k\u1EBFt qu\u1EA3" };
  }
  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: "B\u1EA3o m\u1EADt: Quy\u1EC1n s\u1EDF h\u1EEFu kh\xF4ng h\u1EE3p l\u1EC7" };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const calculatedScore = typeof params.score === "number" ? params.score : params.analysisResult.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? item.score;
  item.score = calculatedScore;
  item.status = "COMPLETED";
  item.updatedAt = now;
  if (params.title?.trim()) item.title = params.title.trim();
  if (params.subject?.trim()) item.subject = params.subject.trim();
  const mergedProposals = {
    ...item.customProposals || {},
    ...item.analysisResult?.customProposals || {},
    ...params.customProposals || {},
    ...params.analysisResult?.customProposals || {}
  };
  item.customProposals = mergedProposals;
  const rawMergedNotes = {
    ...normalizeTeacherNotes(item.analysisResult?.teacherNotes, params.evaluationId),
    ...normalizeTeacherNotes(item.teacherNotes, params.evaluationId)
  };
  if (Array.isArray(params.analysisResult?.redTeamCards)) {
    params.analysisResult.redTeamCards.forEach((c) => {
      if (typeof c.userNotes === "string" && c.userNotes.trim()) {
        rawMergedNotes[c.id] = c.userNotes.trim();
      }
    });
  }
  if (params.analysisResult?.teacherNotes && typeof params.analysisResult.teacherNotes === "object") {
    const norm = normalizeTeacherNotes(params.analysisResult.teacherNotes, params.evaluationId);
    Object.entries(norm).forEach(([cardId, noteText]) => {
      if (typeof noteText === "string" && noteText.trim()) {
        rawMergedNotes[cardId] = noteText;
      }
    });
  }
  if (params.teacherNotes && typeof params.teacherNotes === "object") {
    const normDirect = normalizeTeacherNotes(params.teacherNotes, params.evaluationId);
    Object.entries(normDirect).forEach(([cardId, noteText]) => {
      if (typeof noteText === "string") {
        rawMergedNotes[cardId] = noteText;
      }
    });
  }
  const finalCleanNotes = normalizeTeacherNotes(rawMergedNotes, params.evaluationId);
  item.teacherNotes = finalCleanNotes;
  let synchronizedCards = params.analysisResult?.redTeamCards || item.analysisResult?.redTeamCards || [];
  if (Array.isArray(synchronizedCards)) {
    const existingCardsMap = new Map((item.analysisResult?.redTeamCards || []).map((c) => [c.id, c]));
    synchronizedCards = synchronizedCards.map((newCard) => {
      const existing = existingCardsMap.get(newCard.id);
      const noteFromMap = finalCleanNotes[newCard.id];
      let effectiveNote = "";
      if (params.teacherNotes && (params.teacherNotes[newCard.id] !== void 0 || params.teacherNotes[`${params.evaluationId}_${newCard.id}`] !== void 0)) {
        effectiveNote = finalCleanNotes[newCard.id] ?? "";
      } else if (typeof noteFromMap === "string" && noteFromMap.trim()) {
        effectiveNote = noteFromMap;
      } else if (typeof newCard.userNotes === "string" && newCard.userNotes.trim()) {
        effectiveNote = newCard.userNotes;
      } else if (typeof existing?.userNotes === "string" && existing.userNotes.trim()) {
        effectiveNote = existing.userNotes;
      }
      return {
        ...existing || {},
        ...newCard,
        userNotes: effectiveNote,
        status: newCard.status || existing?.status || "Ch\u01B0a x\u1EED l\xFD"
      };
    });
  }
  item.analysisResult = {
    ...params.analysisResult,
    redTeamCards: synchronizedCards,
    customProposals: mergedProposals,
    teacherNotes: finalCleanNotes
  };
  if (params.draftText !== void 0) {
    item.draftText = params.draftText;
    if (!item.originalText) {
      item.originalText = params.draftText;
    }
  }
  const finalChangeSet = params.changeSet || params.analysisResult.changeSet || item.changeSet || [];
  item.changeSet = finalChangeSet;
  if (item.analysisResult) {
    item.analysisResult.changeSet = finalChangeSet;
  }
  item.versionsHistory = item.versionsHistory || [];
  const existingV = item.versionsHistory.find((v) => v.version === item.currentVersion);
  if (existingV) {
    existingV.score = calculatedScore;
    existingV.createdAt = now;
    existingV.resultSummary = params.analysisResult?.executiveSummary?.strengthsSummary || params.analysisResult.metadata?.title || "";
  } else {
    item.versionsHistory.push({
      version: item.currentVersion,
      createdAt: now,
      score: calculatedScore,
      notes: `L\u01B0u k\u1EBFt qu\u1EA3 phi\xEAn b\u1EA3n ${item.currentVersion}`,
      resultSummary: params.analysisResult?.executiveSummary?.strengthsSummary || params.analysisResult.metadata?.title || ""
    });
  }
  saveEvaluationsStore();
  addAuditLog({
    action: "SAVE_RESULT",
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: item.id,
    details: `L\u01B0u k\u1EBFt qu\u1EA3 \u0111\xE1nh gi\xE1 cho "${item.title}" (\u0110i\u1EC3m: ${item.score})`,
    status: "SUCCESS"
  });
  if (process.env.LICENSE_API_URL) {
    const remote = await callAppsScriptStorage("saveEvaluationResult", {
      evaluationId: item.id,
      userEmail: cleanEmail,
      version: item.currentVersion,
      score: item.score,
      status: item.status,
      title: item.title,
      analysisResult: JSON.stringify(item.analysisResult),
      operatorEmail: cleanEmail
    });
    if (remote.success && remote.data?.latestResultFileId) {
      item.latestResultFileId = remote.data.latestResultFileId;
      saveEvaluationsStore();
    }
  }
  return { success: true, evaluation: item };
}
async function createEvaluationVersionRecord(params) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store2.evaluations[params.evaluationId];
  if (!item) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 \u0111\u1EC3 t\u1EA1o phi\xEAn b\u1EA3n m\u1EDBi" };
  }
  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: "B\u1EA3o m\u1EADt: Quy\u1EC1n s\u1EDF h\u1EEFu kh\xF4ng h\u1EE3p l\u1EC7" };
  }
  if (!params.newAnalysisResult || !Array.isArray(params.newAnalysisResult.rubricCriteria) || params.newAnalysisResult.rubricCriteria.length === 0) {
    return { success: false, error: "K\u1EBFt qu\u1EA3 ch\u1EA5m m\u1EDBi kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c thi\u1EBFu ti\xEAu ch\xED Rubric" };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const calculatedScore = typeof params.newScore === "number" ? params.newScore : params.newAnalysisResult.rubricCriteria?.reduce((acc, c) => acc + (c.proposedScore ?? 0), 0) ?? item.score;
  item.versionsHistory = item.versionsHistory || [];
  if (item.versionsHistory.length === 0) {
    item.versionsHistory.push({
      version: 1,
      createdAt: item.createdAt || now,
      score: item.score,
      notes: "B\u1EA3n ph\xE2n t\xEDch \u0111\u1EA7u ti\xEAn (v1)",
      resultSummary: item.analysisResult?.executiveSummary?.strengthsSummary || item.analysisResult?.metadata?.title || item.title,
      analysisResult: item.analysisResult ? JSON.parse(JSON.stringify(item.analysisResult)) : void 0
    });
  } else {
    const currentEntry = item.versionsHistory.find((v) => v.version === (item.currentVersion || 1));
    if (currentEntry && !currentEntry.analysisResult && item.analysisResult) {
      currentEntry.analysisResult = JSON.parse(JSON.stringify(item.analysisResult));
    }
  }
  const lastEntry = item.versionsHistory[item.versionsHistory.length - 1];
  if (lastEntry && lastEntry.version > 1 && Math.abs(lastEntry.score - calculatedScore) < 1e-3 && Date.now() - new Date(lastEntry.createdAt).getTime() < 4e3) {
    return { success: true, evaluation: item };
  }
  const maxExistingVersion = item.versionsHistory.reduce((max, v) => Math.max(max, v.version || 0), item.versionCount || 1);
  const newVersionNumber = maxExistingVersion + 1;
  item.versionCount = item.versionsHistory.length + 1;
  item.currentVersion = newVersionNumber;
  item.score = calculatedScore;
  item.status = "REVISED";
  item.updatedAt = now;
  item.analysisResult = params.newAnalysisResult;
  item.versionsHistory.push({
    version: newVersionNumber,
    createdAt: now,
    score: calculatedScore,
    notes: params.notes || `Phi\xEAn b\u1EA3n ch\u1EC9nh s\u1EEDa v${newVersionNumber}`,
    resultSummary: params.newAnalysisResult?.executiveSummary?.strengthsSummary || params.newAnalysisResult.metadata?.title || "",
    analysisResult: JSON.parse(JSON.stringify(params.newAnalysisResult))
  });
  saveEvaluationsStore();
  addAuditLog({
    action: "NEW_VERSION",
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: item.id,
    details: `T\u1EA1o phi\xEAn b\u1EA3n m\u1EDBi v${newVersionNumber} cho "${item.title}" (\u0110i\u1EC3m m\u1EDBi: ${calculatedScore})`,
    status: "SUCCESS"
  });
  if (process.env.LICENSE_API_URL) {
    const remote = await callAppsScriptStorage("createEvaluationVersion", {
      evaluationId: item.id,
      userEmail: cleanEmail,
      version: newVersionNumber,
      score: calculatedScore,
      status: item.status,
      notes: params.notes || `Phi\xEAn b\u1EA3n v${newVersionNumber}`,
      analysisResult: JSON.stringify(params.newAnalysisResult),
      operatorEmail: cleanEmail
    });
    if (remote.success && remote.data?.latestResultFileId) {
      item.latestResultFileId = remote.data.latestResultFileId;
      saveEvaluationsStore();
    }
  }
  return { success: true, evaluation: item };
}
async function renameEvaluationRecord(params) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store2.evaluations[params.evaluationId];
  if (!item) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 \u0111\u1EC3 \u0111\u1ED5i t\xEAn" };
  }
  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: "B\u1EA3o m\u1EADt: Quy\u1EC1n s\u1EDF h\u1EEFu kh\xF4ng h\u1EE3p l\u1EC7" };
  }
  const trimmed = params.newTitle.trim();
  if (!trimmed) {
    return { success: false, error: "T\xEAn h\u1ED3 s\u01A1 kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng" };
  }
  const oldTitle = item.title;
  item.title = trimmed;
  item.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveEvaluationsStore();
  addAuditLog({
    action: "RENAME",
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: item.id,
    details: `\u0110\u1ED5i t\xEAn h\u1ED3 s\u01A1 t\u1EEB "${oldTitle}" th\xE0nh "${trimmed}"`,
    status: "SUCCESS"
  });
  if (process.env.LICENSE_API_URL) {
    await callAppsScriptStorage("renameEvaluation", {
      evaluationId: item.id,
      newTitle: trimmed,
      userEmail: cleanEmail,
      operatorEmail: cleanEmail
    }).catch(() => {
    });
  }
  return { success: true, evaluation: item };
}
async function deleteEvaluationRecord(params) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = params.userEmail.toLowerCase().trim();
  const item = store2.evaluations[params.evaluationId];
  if (!item) {
    return { success: false, error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 \u0111\u1EC3 x\xF3a" };
  }
  if (params.evaluationId === "eval_tinhoc11_dathien2412") {
    return { success: false, error: "B\u1EA3o v\u1EC7 h\u1EC7 th\u1ED1ng: Kh\xF4ng th\u1EC3 x\xF3a h\u1ED3 s\u01A1 chu\u1EA9n SKKN Tin h\u1ECDc 11" };
  }
  if (item.userEmail.toLowerCase() !== cleanEmail) {
    return { success: false, error: "B\u1EA3o m\u1EADt: Quy\u1EC1n s\u1EDF h\u1EEFu kh\xF4ng h\u1EE3p l\u1EC7" };
  }
  const deletedTitle = item.title;
  const deletedFolderId = item.driveFolderId;
  delete store2.evaluations[params.evaluationId];
  saveEvaluationsStore();
  addAuditLog({
    action: "DELETE",
    userId: item.userId,
    userEmail: cleanEmail,
    evaluationId: params.evaluationId,
    details: `X\xF3a h\u1ED3 s\u01A1: "${deletedTitle}"`,
    status: "SUCCESS"
  });
  if (process.env.LICENSE_API_URL) {
    await callAppsScriptStorage("deleteEvaluation", {
      evaluationId: params.evaluationId,
      driveFolderId: deletedFolderId,
      userEmail: cleanEmail,
      operatorEmail: cleanEmail
    }).catch(() => {
    });
  }
  return { success: true };
}
async function getStorageStatsData(requesterEmail) {
  reloadEvaluationsStoreFromDisk();
  const cleanEmail = requesterEmail.toLowerCase().trim();
  const allList = Object.values(store2.evaluations);
  const totalEvaluations = allList.length;
  let totalVersions = 0;
  let totalSizeBytes = 0;
  let userEvaluationsCount = 0;
  allList.forEach((item) => {
    totalVersions += item.versionCount || 1;
    totalSizeBytes += item.originalFileSize || 0;
    if (item.userEmail.toLowerCase() === cleanEmail) {
      userEvaluationsCount += 1;
    }
  });
  return {
    totalEvaluations,
    totalVersions,
    totalSizeBytes,
    userEvaluationsCount
  };
}
loadEvaluationsStore();

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-email, x-user-id, x-session-token, x-google-credential");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

// server/api/user.ts
function getAuthenticatedUser(req, body) {
  const authHeader = req.headers["authorization"] || "";
  const sessionHeader = req.headers["x-session-token"] || "";
  const googleHeader = req.headers["x-google-credential"] || "";
  const tokenCandidate = authHeader || sessionHeader || googleHeader;
  if (tokenCandidate) {
    const verifiedSession = verifyAdminSessionToken(tokenCandidate);
    if (verifiedSession) {
      const u = findUserByEmailOrId(verifiedSession.email);
      const isRoot = ROOT_ADMIN_EMAILS.includes(verifiedSession.email.toLowerCase());
      return {
        email: verifiedSession.email.toLowerCase(),
        userId: u?.id || verifiedSession.email.toLowerCase(),
        isAdmin: isRoot || verifiedSession.role === "ADMIN"
      };
    }
    const verifiedGoogle = verifyGoogleIdToken(tokenCandidate);
    if (verifiedGoogle) {
      const u = findUserByEmailOrId(verifiedGoogle.email);
      const isRoot = ROOT_ADMIN_EMAILS.includes(verifiedGoogle.email.toLowerCase());
      return {
        email: verifiedGoogle.email.toLowerCase(),
        userId: u?.id || verifiedGoogle.email.toLowerCase(),
        isAdmin: isRoot || u?.role === "ADMIN"
      };
    }
  }
  const candidateEmail = String(req.headers["x-user-email"] || req.query?.email || body?.email || "").toLowerCase().trim();
  if (candidateEmail && candidateEmail.includes("@")) {
    const isRoot = ROOT_ADMIN_EMAILS.includes(candidateEmail);
    if (isRoot) {
      const u2 = findUserByEmailOrId(candidateEmail);
      return {
        email: candidateEmail,
        userId: u2?.id || "admin_6461746869",
        isAdmin: true
      };
    }
    const u = findUserByEmailOrId(candidateEmail);
    if (u?.isBlocked || u?.role === "BLOCKED") {
      return null;
    }
    return {
      email: candidateEmail,
      userId: u?.id || candidateEmail,
      isAdmin: u?.role === "ADMIN"
    };
  }
  return null;
}
async function handler(req, res) {
  if (handleCors(req, res)) return;
  res.setHeader("Content-Type", "application/json");
  const rawSubpath = extractSubpath(req, "/api/user");
  const subpath = (typeof rawSubpath === "string" ? rawSubpath : "").replace(/^\/+|\/+$/g, "");
  const body = getRequestBody(req);
  if (subpath === "status" || subpath === "") {
    const { guestId, email, userId } = req.query || {};
    const reqIdentifier = String(email || userId || body?.email || body?.userId || "").toLowerCase().trim();
    if (reqIdentifier) {
      const user = findUserByEmailOrId(reqIdentifier);
      if (user) {
        const sessionToken = createAdminSession(user.email, user.role);
        return res.status(200).json({
          isLoggedIn: true,
          user,
          sessionToken,
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
  if (subpath === "evaluations" || subpath === "evaluations/list") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp \u0111\u1EC3 truy c\u1EADp kho h\u1ED3 s\u01A1" });
      }
      const evaluations = await listUserEvaluations(auth.email, auth.userId);
      return res.status(200).json({ success: true, evaluations });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/create") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp \u0111\u1EC3 t\u1EA1o h\u1ED3 s\u01A1" });
      }
      const {
        title,
        subject,
        gradeLevel,
        score,
        originalFileName,
        originalFileSize,
        wordCount,
        originalFileBase64,
        originalText,
        draftText,
        changeSet,
        analysisResult
      } = body || {};
      const result = await createEvaluationRecord({
        userEmail: auth.email,
        userId: auth.userId,
        title: title || "H\u1ED3 s\u01A1 S\xE1ng ki\u1EBFn kinh nghi\u1EC7m",
        subject,
        gradeLevel,
        score,
        originalFileName,
        originalFileSize,
        wordCount,
        originalFileBase64,
        originalText,
        draftText,
        changeSet,
        analysisResult
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/get") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp \u0111\u1EC3 xem h\u1ED3 s\u01A1" });
      }
      const evalId = String(req.query?.id || body?.id || body?.evaluationId || "");
      if (!evalId) {
        return res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ED3 s\u01A1 (id)" });
      }
      const result = await getEvaluationDetail(evalId, auth.email);
      if (!result.success) {
        const isForbidden = result.error?.includes("B\u1EA3o m\u1EADt") || result.error?.includes("quy\u1EC1n");
        return res.status(isForbidden ? 403 : 404).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/save-result") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp \u0111\u1EC3 l\u01B0u k\u1EBFt qu\u1EA3 h\u1ED3 s\u01A1" });
      }
      const { evaluationId, analysisResult, title, subject, score, draftText, changeSet, customProposals, teacherNotes } = body || {};
      if (!evaluationId || !analysisResult) {
        return res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ED3 s\u01A1 ho\u1EB7c k\u1EBFt qu\u1EA3 ph\xE2n t\xEDch" });
      }
      const result = await saveEvaluationResultRecord({
        evaluationId,
        userEmail: auth.email,
        analysisResult,
        title,
        subject,
        score,
        draftText,
        changeSet,
        customProposals,
        teacherNotes
      });
      if (!result.success) {
        const isForbidden = result.error?.includes("B\u1EA3o m\u1EADt");
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/new-version") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp" });
      }
      const { evaluationId, newAnalysisResult, newScore, notes } = body || {};
      if (!evaluationId || !newAnalysisResult) {
        return res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ED3 s\u01A1 ho\u1EB7c k\u1EBFt qu\u1EA3 phi\xEAn b\u1EA3n m\u1EDBi" });
      }
      const result = await createEvaluationVersionRecord({
        evaluationId,
        userEmail: auth.email,
        newAnalysisResult,
        newScore,
        notes
      });
      if (!result.success) {
        const isForbidden = result.error?.includes("B\u1EA3o m\u1EADt");
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/rename") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp" });
      }
      const { evaluationId, newTitle } = body || {};
      if (!evaluationId || !newTitle) {
        return res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ED3 s\u01A1 ho\u1EB7c t\xEAn m\u1EDBi" });
      }
      const result = await renameEvaluationRecord({
        evaluationId,
        userEmail: auth.email,
        newTitle
      });
      if (!result.success) {
        const isForbidden = result.error?.includes("B\u1EA3o m\u1EADt");
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/delete") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp" });
      }
      const { evaluationId } = body || {};
      if (!evaluationId) {
        return res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ED3 s\u01A1 c\u1EA7n x\xF3a" });
      }
      const result = await deleteEvaluationRecord({
        evaluationId,
        userEmail: auth.email
      });
      if (!result.success) {
        const isForbidden = result.error?.includes("B\u1EA3o m\u1EADt");
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (subpath === "evaluations/stats") {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: "Y\xEAu c\u1EA7u \u0111\u0103ng nh\u1EADp" });
      }
      const stats = await getStorageStatsData(auth.email);
      return res.status(200).json({ success: true, stats });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(404).json({ error: `Tuy\u1EBFn \u0111\u01B0\u1EDDng ng\u01B0\u1EDDi d\xF9ng kh\xF4ng t\u1ED3n t\u1EA1i: /api/user/${subpath}` });
}
export {
  handler as default
};
