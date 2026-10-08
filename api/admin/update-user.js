// api/_lib/authStore.ts
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
loadStore();

// api/admin/update-user.ts
function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const operatorEmail = String(
    req.headers["x-user-email"] || req.headers["x-user-id"] || req.query?.adminEmail || ""
  ).toLowerCase().trim();
  const ROOT_ADMIN_EMAILS2 = ["dathien2412@gmail.com"];
  if (!ROOT_ADMIN_EMAILS2.includes(operatorEmail)) {
    return res.status(403).json({
      error: "Truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i. Quy\u1EC1n qu\u1EA3n tr\u1ECB (USERS.ROLE = ADMIN) b\u1EAFt bu\u1ED9c.",
      code: "FORBIDDEN"
    });
  }
  try {
    const { email, role, plan, quota, isBlocked, expiresAt } = req.body || {};
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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
export {
  handler as default
};
