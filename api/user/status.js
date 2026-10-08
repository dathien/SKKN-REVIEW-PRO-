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
loadStore();

// api/user/status.ts
function handler(req, res) {
  const { guestId, email, userId } = req.query || {};
  res.setHeader("Content-Type", "application/json");
  const reqIdentifier = String(email || userId || "").toLowerCase().trim();
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
  const guest = getOrCreateGuest(String(guestId || "guest_default"));
  return res.status(200).json({
    isLoggedIn: false,
    guestId: guest.guestId,
    role: "GUEST",
    plan: "GUEST",
    quota: guest.quota
  });
}
export {
  handler as default
};
