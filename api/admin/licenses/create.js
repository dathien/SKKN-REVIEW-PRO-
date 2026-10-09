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
loadStore();

// server/api/admin/licenses/create.ts
function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  const operatorEmail = String(
    req.headers["x-user-email"] || req.headers["x-user-id"] || req.query?.adminEmail || req.body?.operatorEmail || ""
  ).toLowerCase().trim();
  const isAllowed = ROOT_ADMIN_EMAILS.includes(operatorEmail) || isUserAdmin(operatorEmail);
  if (!isAllowed) {
    return res.status(403).json({ error: "Truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i. Quy\u1EC1n qu\u1EA3n tr\u1ECB b\u1EAFt bu\u1ED9c.", code: "FORBIDDEN" });
  }
  try {
    const { plan, durationMonths, durationDays, maxDevices, assignedEmail, customerNote, reason } = req.body || {};
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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
export {
  handler as default
};
