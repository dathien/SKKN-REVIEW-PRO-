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
