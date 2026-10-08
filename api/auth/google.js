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
async function fetchUserFromLicenseApi(email, sub) {
  if (!process.env.LICENSE_API_URL) return null;
  try {
    const url = new URL(process.env.LICENSE_API_URL);
    url.searchParams.set("action", "getUser");
    url.searchParams.set("email", email);
    if (sub) url.searchParams.set("sub", sub);
    const resp = await fetch(url.toString(), { method: "GET" });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && (data.role || data.plan || data.userRole || data.freeAccess)) {
        const rawRole = (data.role || data.userRole || "").toUpperCase();
        const role = rawRole === "ADMIN" ? "ADMIN" : rawRole === "LICENSED" ? "LICENSED" : rawRole === "FREE_ACCESS" || rawRole === "FREE" || Boolean(data.freeAccess) ? "FREE_ACCESS" : rawRole === "BLOCKED" ? "BLOCKED" : rawRole === "TRIAL" ? "TRIAL" : void 0;
        const rawPlan = (data.plan || "").toUpperCase();
        const plan = rawPlan === "SCHOOL" ? "SCHOOL" : rawPlan === "PREMIUM" ? "PREMIUM" : rawPlan === "PRO" ? "PRO" : void 0;
        return {
          role,
          plan,
          name: data.name,
          freeAccess: Boolean(data.freeAccess || role === "FREE_ACCESS"),
          freeAccessName: data.freeAccessName || data.campaignName,
          freeAccessExpiresAt: data.freeAccessExpiresAt || data.expiresAt
        };
      }
    }
  } catch (err) {
    console.warn("Could not query user role from LICENSE_API_URL:", err);
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
    const isUnlimited = role === "ADMIN" || role === "LICENSED" || role === "FREE_ACCESS";
    const defaultTrialEasy = store.settings?.trialEasyLimit ?? 3;
    const defaultTrialAdvanced = store.settings?.trialAdvancedLimit ?? 1;
    user = {
      id: userId,
      email,
      name: isRootAdmin ? profile.name || "\u0110a Thi\u1EC7n H\u1ED3 Nguy\u1EC5n" : remoteData?.name || profile.name || email.split("@")[0],
      picture: profile.picture,
      role,
      plan,
      quota: isUnlimited ? { easy: 9999, advanced: 9999 } : { easy: defaultTrialEasy, advanced: defaultTrialAdvanced },
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
      user.quota = { easy: 9999, advanced: 9999 };
      user.isBlocked = false;
      user.licenseKey = "SKKN-ADMIN-SYSTEM";
    } else {
      if (remoteData?.role) {
        user.role = remoteData.role;
        if (remoteData.role === "ADMIN" || remoteData.role === "LICENSED" || remoteData.role === "FREE_ACCESS") {
          user.quota = { easy: 9999, advanced: 9999 };
        }
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

// api/auth/google.ts
async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { credential, email, name, picture, id } = req.body || {};
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
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
export {
  handler as default
};
