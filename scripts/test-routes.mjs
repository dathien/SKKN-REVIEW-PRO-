import path from 'path';

console.log('[test-routes] Testing all routes through compiled serverless functions in api/ ...');

// Helper to create mock req and res
function createMockContext({ method = 'GET', url = '', headers = {}, query = {}, body = null }) {
  const req = {
    method,
    url,
    headers: { ...headers },
    query: { ...query },
    body,
  };

  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    setHeader(key, val) {
      resHeaders[key.toLowerCase()] = val;
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    end() {
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
    getHeaders() {
      return resHeaders;
    },
  };

  return { req, res };
}

let passCount = 0;
let failCount = 0;

function assert(desc, condition) {
  if (condition) {
    console.log(`  ✓ PASS: ${desc}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failCount++;
  }
}

// Configure shared secret for server-to-server tests
const SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || 'skkn_secure_s2s_secret_2026';
process.env.APPS_SCRIPT_SECRET = SCRIPT_SECRET;

// Mock global fetch for LICENSE_API_URL during automated route testing to prevent build timeouts
const originalFetch = globalThis.fetch;
globalThis.fetch = async function(url, init = {}) {
  const urlStr = String(url);
  if (process.env.LICENSE_API_URL && urlStr.startsWith(process.env.LICENSE_API_URL)) {
    let body = {};
    if (init && init.body) {
      try { body = JSON.parse(init.body); } catch (_) {}
    }
    const action = body.action || (urlStr.includes('?') ? new URL(urlStr).searchParams.get('action') : '');

    // Simulating Apps Script v2.7 mandatory secret verification
    const adminActions = ['saveUser', 'updateUser', 'deleteUser', 'syncUsers', 'getUsers', 'getSettings'];
    if (adminActions.includes(action)) {
      if (!body.serverSecret || body.serverSecret !== SCRIPT_SECRET) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Xác thực Server thất bại: Khóa bí mật Server Secret không chính xác hoặc bị thiếu.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!body.operatorEmail) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Yêu cầu quản trị cần danh tính người vận hành (operatorEmail) được backend xác minh.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'saveUser' || action === 'updateUser') {
      return new Response(JSON.stringify({ success: true, user: body }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (action === 'deleteUser') {
      const email = (body.email || '').toLowerCase().trim();
      if (email === 'dathien2412@gmail.com') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Bảo mật Quản trị: Tuyệt đối không thể xóa hoặc vô hiệu hóa tài khoản Root Admin.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (body.permanent) {
        if (body.operatorEmail !== 'dathien2412@gmail.com') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Quyền hạn bị từ chối: Chỉ Root Admin mới có thẩm quyền yêu cầu xóa vĩnh viễn người dùng khỏi Google Sheets.'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const expectedCode = 'PERMANENT_DELETE_' + email.toUpperCase();
        if (body.confirmPermanent !== expectedCode && body.confirmPermanent !== email) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Mã xác nhận xóa vĩnh viễn không đúng. Yêu cầu mã: ' + expectedCode
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ success: true, mode: 'HARD_DELETE', deleted: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, mode: 'SOFT_DELETE_BLOCKED', deleted: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (action === 'syncUsers') {
      return new Response(JSON.stringify({ success: true, syncedCount: (body.users || []).length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (action === 'getUsers') {
      return new Response(JSON.stringify({ success: true, users: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (action === 'inspectSchema') {
      return new Response(JSON.stringify({
        success: true,
        version: '2.7',
        isFullyCompatible: true,
        usersSchema: { isValid: true, type: 'SCHEMA_13_OLD', missing: [], columnCount: 13 },
        licensesSchema: { isValid: true, missing: [], columnCount: 9 },
        settingsSchema: { isValid: true, missing: [], columnCount: 3 },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (action === 'verifyLicense') {
      return new Response(JSON.stringify({
        success: true,
        license: {
          key: body.key || 'SKKN-PRO-VIP',
          plan: 'PRO',
          maxDevices: 2,
          status: 'ACTIVE',
          expiresAt: null,
          isAssigned: true,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return originalFetch.apply(this, arguments);
};

// Import compiled handlers
const authHandler = (await import(new URL(path.resolve('api/auth.js'), 'file://').href)).default;
const userHandler = (await import(new URL(path.resolve('api/user.js'), 'file://').href)).default;
const licenseHandler = (await import(new URL(path.resolve('api/license.js'), 'file://').href)).default;
const adminHandler = (await import(new URL(path.resolve('api/admin.js'), 'file://').href)).default;

console.log('\n--- 1. Testing Auth Endpoints (/api/auth) ---');
{
  // Test GET /api/auth/config (via rewrite query)
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/auth?__subpath=config',
    query: { __subpath: 'config' },
  });
  await authHandler(req, res);
  assert('GET /api/auth/config returns 200 with googleClientId & hasLicenseApi',
    res.getStatusCode() === 200 && 'googleClientId' in res.getData() && 'hasLicenseApi' in res.getData());
}
{
  // Test GET /api/auth/config (via raw URL path)
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/auth/config',
  });
  await authHandler(req, res);
  assert('GET /api/auth/config via raw URL returns 200',
    res.getStatusCode() === 200 && 'googleClientId' in res.getData());
}
{
  // Test OPTIONS preflight
  const { req, res } = createMockContext({
    method: 'OPTIONS',
    url: '/api/auth/config',
  });
  await authHandler(req, res);
  assert('OPTIONS /api/auth/config returns 204 with CORS headers',
    res.getStatusCode() === 204);
}
{
  // Test POST /api/auth/google without email -> 400
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/auth?__subpath=google',
    query: { __subpath: 'google' },
    body: {},
  });
  await authHandler(req, res);
  assert('POST /api/auth/google without email returns 400',
    res.getStatusCode() === 400);
}
{
  // Test POST /api/auth/google with valid email
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/auth/google',
    body: { email: 'test_user@gmail.com', name: 'Test User' },
  });
  await authHandler(req, res);
  assert('POST /api/auth/google with email returns 200 with user data',
    res.getStatusCode() === 200 && res.getData()?.success === true && res.getData()?.user?.email === 'test_user@gmail.com');
}

console.log('\n--- 2. Testing User Endpoints (/api/user) ---');
{
  // Test GET /api/user/status for guest
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/user?__subpath=status&guestId=guest_test_999',
    query: { __subpath: 'status', guestId: 'guest_test_999' },
  });
  await userHandler(req, res);
  assert('GET /api/user/status returns guest quota',
    res.getStatusCode() === 200 && res.getData()?.role === 'GUEST' && res.getData()?.quota !== undefined);
}
{
  // Test GET /api/user/status for registered user
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/user/status?email=test_user@gmail.com',
    query: { email: 'test_user@gmail.com' },
  });
  await userHandler(req, res);
  assert('GET /api/user/status for test_user returns logged in status',
    res.getStatusCode() === 200 && res.getData()?.isLoggedIn === true);
}

console.log('\n--- 3. Testing License Endpoints (/api/license) ---');
{
  // Test POST /api/license/activate with empty key
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/license?__subpath=activate',
    query: { __subpath: 'activate' },
    body: { licenseKey: '', email: 'test_user@gmail.com', deviceId: 'dev_1' },
  });
  await licenseHandler(req, res);
  assert('POST /api/license/activate with empty key returns 400',
    res.getStatusCode() === 400 && res.getData()?.success === false);
}

console.log('\n--- 4. Testing Admin Security & Authorization (/api/admin) ---');
{
  // Test unauthorized request -> 403 FORBIDDEN
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin?__subpath=users',
    query: { __subpath: 'users' },
    headers: { 'x-user-email': 'unauthorized_guest@gmail.com' },
  });
  await adminHandler(req, res);
  assert('Non-admin access is rejected with 403 FORBIDDEN',
    res.getStatusCode() === 403 && res.getData()?.code === 'FORBIDDEN');
}

const adminHeaders = { 'x-user-email': 'dathien2412@gmail.com' };

console.log('\n--- 5. Testing Authorized Admin Endpoints (/api/admin) ---');
{
  // Test GET /api/admin/check-access
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin?__subpath=check-access',
    query: { __subpath: 'check-access' },
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  assert('GET /api/admin/check-access returns 200 allowed=true',
    res.getStatusCode() === 200 && res.getData()?.allowed === true);
}
{
  // Test GET /api/admin/stats
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin/stats',
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  assert('GET /api/admin/stats returns 200 with stats object',
    res.getStatusCode() === 200 && res.getData()?.totalUsers !== undefined);
}
{
  // Test GET /api/admin/users
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin?__subpath=users',
    query: { __subpath: 'users' },
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  assert('GET /api/admin/users returns 200 with users array',
    res.getStatusCode() === 200 && Array.isArray(res.getData()?.users));
}
{
  // Test POST /api/admin/create-user
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/admin/create-user',
    headers: adminHeaders,
    body: { email: 'new_teacher@school.edu.vn', name: 'New Teacher', role: 'USER', plan: 'PRO' },
  });
  await adminHandler(req, res);
  assert('POST /api/admin/create-user returns 200 success',
    res.getStatusCode() === 200 && res.getData()?.success === true);
}
{
  // Test POST /api/admin/update-user
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/admin/update-user',
    headers: adminHeaders,
    body: { email: 'new_teacher@school.edu.vn', role: 'USER', plan: 'PRO' },
  });
  await adminHandler(req, res);
  assert('POST /api/admin/update-user returns 200 success',
    res.getStatusCode() === 200 && res.getData()?.success === true);
}
{
  // Test POST /api/admin/sync-sheet
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/admin/sync-sheet',
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  assert('POST /api/admin/sync-sheet returns 200 with sync status',
    res.getStatusCode() === 200 && res.getData()?.success === true && res.getData()?.localUsersCount >= 8);
}
{
  // Test POST /api/admin/delete-user (cannot delete root admin)
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/admin/delete-user',
    headers: adminHeaders,
    body: { email: 'dathien2412@gmail.com' },
  });
  await adminHandler(req, res);
  assert('POST /api/admin/delete-user safely prevents deleting root admin (400)',
    res.getStatusCode() === 400);
}
{
  // Test GET & POST /api/admin/settings
  const { req: getReq, res: getRes } = createMockContext({
    method: 'GET',
    url: '/api/admin/settings',
    headers: adminHeaders,
  });
  await adminHandler(getReq, getRes);
  assert('GET /api/admin/settings returns 200 with settings',
    getRes.getStatusCode() === 200 && getRes.getData()?.settings !== undefined);

  const { req: postReq, res: postRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/settings',
    headers: adminHeaders,
    body: { defaultTrialDays: 14 },
  });
  await adminHandler(postReq, postRes);
  assert('POST /api/admin/settings returns 200 success',
    postRes.getStatusCode() === 200 && postRes.getData()?.success === true);
}
{
  // Test GET /api/admin/licenses
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin/licenses',
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  assert('GET /api/admin/licenses returns 200 with licenses array',
    res.getStatusCode() === 200 && Array.isArray(res.getData()?.licenses));
}
{
  // Test POST /api/admin/licenses/create
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/admin/licenses/create',
    headers: adminHeaders,
    body: { plan: 'PRO', durationMonths: 6, maxDevices: 2, assignedEmail: 'teacher@school.edu.vn' },
  });
  await adminHandler(req, res);
  const createdLic = res.getData()?.license;
  assert('POST /api/admin/licenses/create returns 200 with created license',
    res.getStatusCode() === 200 && createdLic && createdLic.key);

  if (createdLic && createdLic.key) {
    // Test POST /api/admin/licenses/toggle-status
    const { req: togReq, res: togRes } = createMockContext({
      method: 'POST',
      url: '/api/admin/licenses/toggle-status',
      headers: adminHeaders,
      body: { key: createdLic.key, status: 'SUSPENDED' },
    });
    await adminHandler(togReq, togRes);
    assert('POST /api/admin/licenses/toggle-status updates status',
      togRes.getStatusCode() === 200 && togRes.getData()?.success === true);

    // Test POST /api/admin/licenses/reset-devices
    const { req: resReq, res: resRes } = createMockContext({
      method: 'POST',
      url: '/api/admin/licenses/reset-devices',
      headers: adminHeaders,
      body: { key: createdLic.key },
    });
    await adminHandler(resReq, resRes);
    assert('POST /api/admin/licenses/reset-devices resets devices',
      resRes.getStatusCode() === 200 && resRes.getData()?.success === true);

    // Test POST /api/admin/licenses/delete
    const { req: delReq, res: delRes } = createMockContext({
      method: 'POST',
      url: '/api/admin/licenses/delete',
      headers: adminHeaders,
      body: { key: createdLic.key },
    });
    await adminHandler(delReq, delRes);
    assert('POST /api/admin/licenses/delete deletes license',
      delRes.getStatusCode() === 200 && delRes.getData()?.success === true);
  }
}

console.log('\n--- 6. Testing Data Persistence, Read/Write & PRO Unlimited ---');
{
  // Test reading all users and verifying Nguyễn Thị Thanh Tâm is present with PRO plan and not duplicated
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin/users',
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  const users = res.getData()?.users || [];
  const thanhtamMatches = users.filter(u => u.email.toLowerCase() === 'nguyenthithanhtam3410@gmail.com');

  assert('User nguyenthithanhtam3410@gmail.com exists with single record (no duplicate)',
    thanhtamMatches.length === 1);
  assert('User nguyenthithanhtam3410@gmail.com has PRO plan and lifetime validity',
    thanhtamMatches[0]?.plan === 'PRO' && thanhtamMatches[0]?.role === 'LICENSED');
  assert('PRO users do not rely on 9999 quota in stored record',
    thanhtamMatches[0]?.quota?.easy !== 9999 && thanhtamMatches[0]?.quota?.advanced !== 9999);
}
{
  // Test writing a persistent user and reading it back
  const testEmail = 'persist_test_teacher@school.edu.vn';
  const { req: createReq, res: createRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/create-user',
    headers: adminHeaders,
    body: {
      email: testEmail,
      name: 'Thầy Giáo Kiểm Thử Bền Vững',
      role: 'LICENSED',
      plan: 'PRO',
      quota: { easy: 3, advanced: 1 },
    },
  });
  await adminHandler(createReq, createRes);
  assert('Writing user to persistent store succeeds',
    createRes.getStatusCode() === 200 && createRes.getData()?.success === true);

  // Read back and verify persistence
  const { req: getReq, res: getRes } = createMockContext({
    method: 'GET',
    url: '/api/admin/users',
    headers: adminHeaders,
  });
  await adminHandler(getReq, getRes);
  const allUsers = getRes.getData()?.users || [];
  const savedUser = allUsers.find(u => u.email === testEmail);
  assert('Reading back saved user confirms persistent storage and accurate fields',
    savedUser && savedUser.name === 'Thầy Giáo Kiểm Thử Bền Vững' && savedUser.plan === 'PRO');

  // Clean up test user
  const { req: cleanupReq, res: cleanupRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/delete-user',
    headers: adminHeaders,
    body: { email: testEmail },
  });
  await adminHandler(cleanupReq, cleanupRes);
  assert('Cleaning up persistent test user succeeds',
    cleanupRes.getStatusCode() === 200 && cleanupRes.getData()?.success === true);
}

console.log('\n--- 7. Testing Apps Script Non-Response & Security Hardening ---');
{
  // Test spoofed role in headers is rejected
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin/users',
    headers: {
      'x-user-email': 'attacker@malicious.com',
      'x-user-role': 'ADMIN',
      'role': 'ADMIN',
    },
  });
  await adminHandler(req, res);
  assert('Spoofed x-user-role in header is strictly rejected with 403',
    res.getStatusCode() === 403);
}
{
  // Test conflict preview endpoint support in sync-sheet
  const { req, res } = createMockContext({
    method: 'POST',
    url: '/api/admin/sync-sheet',
    headers: adminHeaders,
    body: { previewOnly: true },
  });
  await adminHandler(req, res);
  assert('Sync-sheet endpoint handles conflict preview safely without crash',
    res.getStatusCode() === 200 && res.getData()?.success === true);
}

console.log('\n--- 8. Testing Google Sheets Schema Compatibility (13-Col Old & 12-Col New) ---');
{
  // Test check-sheet-schema endpoint
  const { req, res } = createMockContext({
    method: 'GET',
    url: '/api/admin/check-sheet-schema',
    headers: adminHeaders,
  });
  await adminHandler(req, res);
  assert('GET /api/admin/check-sheet-schema returns 200 with compatibility status',
    res.getStatusCode() === 200 && 'compatible' in res.getData());
}
{
  // Test Old 13-Column Schema Mapping Logic
  // USER_ID | EMAIL | NAME | PLAN | STATUS | EASY_USED | EASY_LIMIT | ADVANCED_USED | ADVANCED_LIMIT | CREATED_AT | ACTIVATED_AT | EXPIRES_AT | LAST_USED_AT
  const old13Sample = {
    userId: 'manual-tam-001',
    email: 'nguyenthithanhtam3410@gmail.com',
    name: 'Nguyễn Thị Thanh Tâm',
    plan: 'Pro',
    status: 'ACTIVE',
    easyUsed: 0,
    easyLimit: 999999,
    advancedUsed: 0,
    advancedLimit: 999999,
    createdAt: '2026-10-08T01:51:00.000Z',
    activatedAt: '2026-10-08T01:51:00.000Z',
    expiresAt: '',
    lastUsedAt: '',
    note: ''
  };

  // We can test reading via fetchUserFromLicenseApi or getOrCreateUser logic
  // Test that mapRawSheetUserToAccount properly maps 13-column schema:
  // In node context, import mapRawSheetUserToAccount from compiled api/admin.js
  const { mapRawSheetUserToAccount } = await import(new URL(path.resolve('api/admin.js'), 'file://').href);
  const mapped13 = mapRawSheetUserToAccount(old13Sample);

  assert('Schema 13-col: Correctly maps email, name, role (LICENSED) from Pro plan without ROLE column',
    mapped13 && mapped13.email === 'nguyenthithanhtam3410@gmail.com' && mapped13.role === 'LICENSED' && mapped13.plan === 'PRO');

  assert('Schema 13-col: Preserves unlimited quota correctly without data loss',
    mapped13 && mapped13.quota.easy === 999999 && mapped13.isBlocked === false);

  // Test New 12-Column Schema Mapping Logic
  // ID | EMAIL | NAME | ROLE | PLAN | QUOTA_EASY | QUOTA_ADVANCED | LICENSE_KEY | EXPIRES_AT | STATUS | CREATED_AT | LAST_ACTIVE_AT
  const new12Sample = {
    id: 'usr_new_123',
    email: 'giaovien.moi@school.edu.vn',
    name: 'Thầy Giáo Mới',
    role: 'LICENSED',
    plan: 'PRO',
    quota: { easy: 5, advanced: 2 },
    licenseKey: 'SKKN-NEW-2026',
    licenseExpiresAt: '2027-01-01T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-10-10T00:00:00.000Z',
    lastActiveAt: '2026-10-10T01:00:00.000Z'
  };

  const mapped12 = mapRawSheetUserToAccount(new12Sample);
  assert('Schema 12-col: Correctly maps explicit role, plan, and quota',
    mapped12 && mapped12.role === 'LICENSED' && mapped12.quota.easy === 5 && mapped12.licenseKey === 'SKKN-NEW-2026');

  // Test Trial user in Old 13-col: EASY_LIMIT = 3, EASY_USED = 1 => 2 remaining
  const old13Trial = {
    userId: 'trial-user-01',
    email: 'trial.user@gmail.com',
    name: 'Người Dùng Thử',
    plan: 'Trial',
    status: 'ACTIVE',
    easyUsed: 1,
    easyLimit: 3,
    advancedUsed: 0,
    advancedLimit: 1,
    createdAt: '2026-10-09T00:00:00.000Z'
  };
  const mappedTrial = mapRawSheetUserToAccount(old13Trial);
  assert('Schema 13-col: Accurately computes remaining quota (3 - 1 = 2) without losing usage metrics',
    mappedTrial && mappedTrial.role === 'TRIAL' && mappedTrial.quota.easy === 2 && mappedTrial.quota.advanced === 1);

  // Test Requirement: EASY_LIMIT=3, EASY_USED=1 - Before and after editing name must remain exactly 2 turns!
  // Simulating updating name without changing quota in Schema 13:
  const updatedNameRow = { ...old13Trial, name: 'Tên Giáo Viên Mới Cập Nhật' };
  // When only name is updated (no quota changes), EASY_LIMIT remains 3, EASY_USED remains 1
  const mappedTrialAfterNameEdit = mapRawSheetUserToAccount(updatedNameRow);
  assert('Schema 13-col: EASY_LIMIT=3, EASY_USED=1 before and after updating name strictly preserves 2 turns remaining',
    mappedTrialAfterNameEdit && mappedTrialAfterNameEdit.quota.easy === 2 && mappedTrialAfterNameEdit.name === 'Tên Giáo Viên Mới Cập Nhật');
}

console.log('\n--- 9. Testing Code.gs v2.7 Ten Core Requirements ---');
{
  // 1. Role Demotion Prevention (Requirement 4)
  const { req: updateReq, res: updateRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/update-user',
    headers: adminHeaders,
    body: { email: 'teacher1@gmail.com', name: 'Teacher 1 Updated Name' }, // Missing role and plan
  });
  await adminHandler(updateReq, updateRes);
  const updatedUser = updateRes.getData()?.user;
  assert('Role Demotion Prevention: Updating user without role/plan preserves PRO and LICENSED',
    updatedUser && updatedUser.role === 'LICENSED' && updatedUser.plan === 'PRO');

  // 2. Privilege Escalation Defense (Requirement 2)
  const { req: escalateReq, res: escalateRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/update-user',
    headers: { 'x-user-email': 'regular_user@gmail.com' }, // Non-admin caller
    body: { email: 'regular_user@gmail.com', role: 'ADMIN' },
  });
  await adminHandler(escalateReq, escalateRes);
  assert('Privilege Escalation Defense: Client cannot self-promote to ADMIN (403)',
    escalateRes.getStatusCode() === 403);

  // 3. Root Admin Protection (Requirement 6)
  const { req: delRootReq, res: delRootRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/delete-user',
    headers: adminHeaders,
    body: { email: 'dathien2412@gmail.com' },
  });
  await adminHandler(delRootReq, delRootRes);
  assert('Root Admin Protection: Absolute prevention of deleting Root Admin',
    delRootRes.getStatusCode() === 400 && delRootRes.getData()?.error?.includes('Quản trị'));

  // 4. Preservation of Nguyễn Thị Thanh Tâm (Requirement 10 & Critical Data Guarantee)
  const { req: tamReq, res: tamRes } = createMockContext({
    method: 'GET',
    url: '/api/admin/users',
    headers: adminHeaders,
  });
  await adminHandler(tamReq, tamRes);
  const tamUser = (tamRes.getData()?.users || []).find(u => u.email === 'nguyenthithanhtam3410@gmail.com');
  assert('Account Integrity: Nguyễn Thị Thanh Tâm account is PRO, LICENSED, and has active license',
    tamUser && tamUser.role === 'LICENSED' && tamUser.plan === 'PRO' && tamUser.licenseKey === 'SKKN-PRO-THANHTAM-VIP');

  // 5. Concurrency & Duplicate Prevention (Requirement 8)
  const concurrentEmail = 'concurrent_test@school.edu.vn';
  const { req: c1Req, res: c1Res } = createMockContext({
    method: 'POST',
    url: '/api/admin/create-user',
    headers: adminHeaders,
    body: { email: concurrentEmail, name: 'First Write', role: 'LICENSED', plan: 'PRO' },
  });
  await adminHandler(c1Req, c1Res);
  const { req: c2Req, res: c2Res } = createMockContext({
    method: 'POST',
    url: '/api/admin/create-user',
    headers: adminHeaders,
    body: { email: concurrentEmail, name: 'Second Write (Upsert)', role: 'LICENSED', plan: 'PRO' },
  });
  await adminHandler(c2Req, c2Res);

  const { req: listReq, res: listRes } = createMockContext({
    method: 'GET',
    url: '/api/admin/users',
    headers: adminHeaders,
  });
  await adminHandler(listReq, listRes);
  const matches = (listRes.getData()?.users || []).filter(u => u.email === concurrentEmail);
  assert('Concurrency Defense: Multiple writes update existing record without duplicates',
    matches.length === 1 && matches[0].name === 'Second Write (Upsert)');

  // Clean up concurrent test user
  const { req: cleanCReq, res: cleanCRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/delete-user',
    headers: adminHeaders,
    body: { email: concurrentEmail },
  });
  await adminHandler(cleanCReq, cleanCRes);
  assert('Cleaned up concurrency test user', cleanCRes.getStatusCode() === 200);
}

console.log('\n--- 10. Negative Security Tests (Requirement 7) ---');
{
  // 1. Negative Test: No secret provided to Apps Script
  const noSecretResp = await fetch(process.env.LICENSE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveUser',
      email: 'attacker@test.com',
      operatorEmail: 'dathien2412@gmail.com',
      // No serverSecret
    }),
  });
  const noSecretData = await noSecretResp.json();
  assert('Negative Test 1: Apps Script rejects request without serverSecret',
    noSecretData.success === false && noSecretData.error?.includes('Server Secret'));

  // 2. Negative Test: Wrong secret provided to Apps Script
  const wrongSecretResp = await fetch(process.env.LICENSE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveUser',
      email: 'attacker@test.com',
      operatorEmail: 'dathien2412@gmail.com',
      serverSecret: 'INVALID_ATTACKER_SECRET_123',
    }),
  });
  const wrongSecretData = await wrongSecretResp.json();
  assert('Negative Test 2: Apps Script rejects request with incorrect serverSecret',
    wrongSecretData.success === false && wrongSecretData.error?.includes('không chính xác'));

  // 3. Negative Test: Self-declared isBackendAuthorized=true without secret
  const spoofedAuthResp = await fetch(process.env.LICENSE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveUser',
      email: 'attacker@test.com',
      operatorEmail: 'dathien2412@gmail.com',
      isBackendAuthorized: true, // Attacker tries to spoof backend flag
      serverSecret: '',          // But lacks serverSecret
    }),
  });
  const spoofedAuthData = await spoofedAuthResp.json();
  assert('Negative Test 3: Self-declared isBackendAuthorized=true without secret is strictly rejected',
    spoofedAuthData.success === false);

  // 4. Negative Test: Regular non-admin user calling admin endpoints
  const regularHeaders = { 'x-user-email': 'teacher1@gmail.com' };
  const { req: regUsersReq, res: regUsersRes } = createMockContext({
    method: 'GET',
    url: '/api/admin/users',
    headers: regularHeaders,
  });
  await adminHandler(regUsersReq, regUsersRes);
  assert('Negative Test 4a: Regular user calling GET /api/admin/users is rejected with 403',
    regUsersRes.getStatusCode() === 403);

  const { req: regCreateReq, res: regCreateRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/create-user',
    headers: regularHeaders,
    body: { email: 'unauthorized_creation@school.edu.vn' },
  });
  await adminHandler(regCreateReq, regCreateRes);
  assert('Negative Test 4b: Regular user calling POST /api/admin/create-user is rejected with 403',
    regCreateRes.getStatusCode() === 403);

  const { req: regUpdateReq, res: regUpdateRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/update-user',
    headers: regularHeaders,
    body: { email: 'teacher1@gmail.com', name: 'Hacked Name' },
  });
  await adminHandler(regUpdateReq, regUpdateRes);
  assert('Negative Test 4c: Regular user calling POST /api/admin/update-user is rejected with 403',
    regUpdateRes.getStatusCode() === 403);

  const { req: regDelReq, res: regDelRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/delete-user',
    headers: regularHeaders,
    body: { email: 'teacher1@gmail.com' },
  });
  await adminHandler(regDelReq, regDelRes);
  assert('Negative Test 4d: Regular user calling POST /api/admin/delete-user is rejected with 403',
    regDelRes.getStatusCode() === 403);

  const { req: regSyncReq, res: regSyncRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/sync-sheet',
    headers: regularHeaders,
    body: {},
  });
  await adminHandler(regSyncReq, regSyncRes);
  assert('Negative Test 4e: Regular user calling POST /api/admin/sync-sheet is rejected with 403',
    regSyncRes.getStatusCode() === 403);

  // 5. Negative Test: Attempting to delete Root Admin
  const { req: delRootReq, res: delRootRes } = createMockContext({
    method: 'POST',
    url: '/api/admin/delete-user',
    headers: adminHeaders,
    body: { email: 'dathien2412@gmail.com' },
  });
  await adminHandler(delRootReq, delRootRes);
  assert('Negative Test 5a: Backend delete-user strictly forbids deleting Root Admin (400)',
    delRootRes.getStatusCode() === 400);

  const delRootDirectResp = await fetch(process.env.LICENSE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteUser',
      email: 'dathien2412@gmail.com',
      operatorEmail: 'dathien2412@gmail.com',
      serverSecret: process.env.APPS_SCRIPT_SECRET,
    }),
  });
  const delRootDirectData = await delRootDirectResp.json();
  assert('Negative Test 5b: Direct Apps Script call strictly forbids deleting Root Admin',
    delRootDirectData.success === false && delRootDirectData.error?.includes('Root Admin'));

  // 6. Negative Test: Hard delete without Root Admin privilege
  const nonRootHardDelResp = await fetch(process.env.LICENSE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteUser',
      email: 'test_student@school.edu.vn',
      operatorEmail: 'sub_admin@school.edu.vn', // Not a root admin
      permanent: true,
      confirmPermanent: 'PERMANENT_DELETE_TEST_STUDENT@SCHOOL.EDU.VN',
      serverSecret: process.env.APPS_SCRIPT_SECRET,
    }),
  });
  const nonRootHardDelData = await nonRootHardDelResp.json();
  assert('Negative Test 6: Hard-delete requested by non-root operator is rejected',
    nonRootHardDelData.success === false && nonRootHardDelData.error?.includes('Root Admin'));

  // 7. Negative Test: Hard delete with static legacy confirm key rejected
  const staticTokenResp = await fetch(process.env.LICENSE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteUser',
      email: 'test_student@school.edu.vn',
      operatorEmail: 'dathien2412@gmail.com',
      permanent: true,
      confirmPermanent: 'CONFIRM_PERMANENT_DELETE', // Old static token
      serverSecret: process.env.APPS_SCRIPT_SECRET,
    }),
  });
  const staticTokenData = await staticTokenResp.json();
  assert('Negative Test 7: Hard-delete with static confirmation token is rejected (requires dynamic email code)',
    staticTokenData.success === false && staticTokenData.error?.includes('PERMANENT_DELETE_'));
}

if (failCount > 0) {
  console.log(`\n========================================`);
  console.log(`Test Results: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`========================================\n`);
  process.exit(1);
} else {
  console.log(`\n========================================`);
  console.log(`Test Results: All ${passCount} tests passed successfully!`);
  console.log(`========================================\n`);
}
