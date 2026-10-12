/**
 * =========================================================================
 * SKKN REVIEW PRO — GOOGLE APPS SCRIPT DATABASE ENDPOINT
 * Phiên bản: 2.6 (Tương thích ngược Schema 13 cột cũ và Schema 12 cột mới)
 * Tương thích linh hoạt theo tên cột Header, bảo vệ toàn vẹn dữ liệu
 * =========================================================================
 * HƯỚNG DẪN CÀI ĐẶT / CẬP NHẬT TRÊN GOOGLE SHEETS:
 * 1. Mở Google Sheet dự án của bạn (ví dụ: "SKKN REVIEW PRO - Database")
 * 2. Đảm bảo có các sheet: "USERS", "LICENSES", "SETTINGS"
 *    - Schema 13 cột cũ:
 *      USER_ID | EMAIL | NAME | PLAN | STATUS | EASY_USED | EASY_LIMIT | ADVANCED_USED | ADVANCED_LIMIT | CREATED_AT | ACTIVATED_AT | EXPIRES_AT | LAST_USED_AT
 *    - Schema 12 cột mới:
 *      ID | EMAIL | NAME | ROLE | PLAN | QUOTA_EASY | QUOTA_ADVANCED | LICENSE_KEY | EXPIRES_AT | STATUS | CREATED_AT | LAST_ACTIVE_AT
 *    => Script v2.6 tự động nhận diện cả 2 schema mà KHÔNG làm mất bất kỳ dữ liệu nào!
 * 3. Vào menu Tiện ích mở rộng (Extensions) -> Apps Script
 * 4. Dán toàn bộ nội dung file này vào file Code.gs
 * 5. Nhấn Triển khai (Deploy) -> Quản lý bản triển khai (Manage deployments) -> Chỉnh sửa -> Phiên bản MỚI -> Triển khai
 * =========================================================================
 */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var postData = null;
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }

    var action = (params.action || (postData && postData.action) || 'ping').toString().trim();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. PING HEALTH CHECK
    if (action === 'ping') {
      return jsonResponse({
        success: true,
        version: '2.6',
        status: 'ONLINE',
        service: 'SKKN REVIEW PRO DATABASE',
        timestamp: new Date().toISOString()
      });
    }

    // 2. INSPECT SCHEMA
    if (action === 'inspectSchema') {
      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var licSheet = getOrCreateSheet(ss, 'LICENSES');
      var setSheet = getOrCreateSheet(ss, 'SETTINGS');

      var uHeaders = getSheetHeaders(usersSheet);
      var lHeaders = getSheetHeaders(licSheet);
      var sHeaders = getSheetHeaders(setSheet);

      var isOld13 = uHeaders.indexOf('USER_ID') !== -1 && uHeaders.indexOf('EASY_LIMIT') !== -1;
      var isNew12 = uHeaders.indexOf('QUOTA_EASY') !== -1 || uHeaders.indexOf('ROLE') !== -1;

      return jsonResponse({
        success: true,
        version: '2.6',
        usersSchema: {
          headers: uHeaders,
          columnCount: uHeaders.length,
          type: isOld13 ? 'SCHEMA_13_OLD' : (isNew12 ? 'SCHEMA_12_NEW' : 'CUSTOM_COMPATIBLE'),
          compatible: true
        },
        licensesSchema: {
          headers: lHeaders,
          columnCount: lHeaders.length,
          compatible: lHeaders.indexOf('KEY') !== -1
        },
        settingsSchema: {
          headers: sHeaders,
          columnCount: sHeaders.length,
          compatible: sHeaders.indexOf('KEY') !== -1
        }
      });
    }

    // 3. GET USER BY EMAIL
    if (action === 'getUser') {
      var email = (params.email || (postData && postData.email) || '').toLowerCase().trim();
      if (!email) {
        return jsonResponse({ success: false, error: 'Thiếu tham số email' }, 400);
      }

      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var user = findUserInSheet(usersSheet, email);
      if (user) {
        return jsonResponse({ success: true, found: true, user: user });
      } else {
        return jsonResponse({ success: true, found: false, user: null, message: 'Không tìm thấy người dùng' });
      }
    }

    // 4. GET ALL USERS
    if (action === 'getUsers') {
      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var users = getAllUsersFromSheet(usersSheet);
      return jsonResponse({ success: true, count: users.length, users: users });
    }

    // 5. SAVE / UPSERT SINGLE USER
    if (action === 'saveUser' || action === 'updateUser') {
      var userData = postData || params;
      var email = (userData.email || '').toLowerCase().trim();
      if (!email) {
        return jsonResponse({ success: false, error: 'Thiếu email người dùng' }, 400);
      }

      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var saved = upsertUserInSheet(usersSheet, userData);
      return jsonResponse({ success: true, user: saved });
    }

    // 6. DELETE SINGLE USER
    if (action === 'deleteUser') {
      var email = (params.email || (postData && postData.email) || '').toLowerCase().trim();
      if (!email) {
        return jsonResponse({ success: false, error: 'Thiếu email người dùng' }, 400);
      }
      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var deleted = deleteUserInSheet(usersSheet, email);
      return jsonResponse({ success: true, deleted: deleted });
    }

    // 7. BATCH SYNC USERS
    if (action === 'syncUsers') {
      var list = (postData && Array.isArray(postData.users)) ? postData.users : [];
      if (!list || list.length === 0) {
        return jsonResponse({ success: false, error: 'Danh sách users trống' }, 400);
      }

      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var syncedCount = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].email) {
          upsertUserInSheet(usersSheet, list[i]);
          syncedCount++;
        }
      }
      return jsonResponse({ success: true, syncedCount: syncedCount, total: list.length });
    }

    // 8. VERIFY LICENSE
    if (action === 'verifyLicense') {
      var key = (params.key || (postData && postData.key) || '').toUpperCase().trim();
      var licSheet = getOrCreateSheet(ss, 'LICENSES');
      var license = findLicenseInSheet(licSheet, key);
      if (!license) {
        return jsonResponse({ success: false, message: 'Mã bản quyền không tồn tại' });
      }
      return jsonResponse({ success: true, license: license });
    }

    // 9. GET SETTINGS
    if (action === 'getSettings') {
      var setSheet = getOrCreateSheet(ss, 'SETTINGS');
      var settings = getSettingsFromSheet(setSheet);
      return jsonResponse({ success: true, settings: settings });
    }

    // 10. UPDATE SETTINGS
    if (action === 'updateSettings') {
      var setSheet = getOrCreateSheet(ss, 'SETTINGS');
      saveSettingsToSheet(setSheet, postData || params);
      return jsonResponse({ success: true, message: 'Đã cập nhật cấu hình hệ thống' });
    }

    return jsonResponse({ success: false, error: 'Hành động không được hỗ trợ: ' + action }, 404);

  } catch (globalError) {
    return jsonResponse({
      success: false,
      error: globalError.toString(),
      stack: globalError.stack
    }, 500);
  }
}

// ==========================================
// SHEET HELPER FUNCTIONS & COMPATIBILITY LAYER
// ==========================================

function getSheetHeaders(sheet) {
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) return [];
  var headerRow = data[0];
  var headers = [];
  for (var i = 0; i < headerRow.length; i++) {
    headers.push(String(headerRow[i] || '').trim());
  }
  return headers;
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'USERS') {
      sheet.appendRow([
        'ID', 'EMAIL', 'NAME', 'ROLE', 'PLAN', 'QUOTA_EASY', 'QUOTA_ADVANCED',
        'LICENSE_KEY', 'EXPIRES_AT', 'STATUS', 'CREATED_AT', 'LAST_ACTIVE_AT'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#f1f5f9');
    } else if (name === 'LICENSES') {
      sheet.appendRow([
        'KEY', 'PLAN', 'MAX_DEVICES', 'STATUS', 'EXPIRES_AT', 'ASSIGNED_EMAIL',
        'BOUND_DEVICES', 'NOTE', 'CREATED_AT'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f1f5f9');
    } else if (name === 'SETTINGS') {
      sheet.appendRow(['KEY', 'VALUE', 'DESCRIPTION']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f1f5f9');
    }
  }
  return sheet;
}

function createColumnIndexMap(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var norm = String(headers[i] || '').toUpperCase().trim();
    if (norm) {
      map[norm] = i;
    }
  }
  return map;
}

function parseUserRowWithHeaders(row, colMap) {
  function getVal(aliases) {
    for (var i = 0; i < aliases.length; i++) {
      var col = colMap[aliases[i]];
      if (col !== undefined && row[col] !== undefined && row[col] !== '') {
        return row[col];
      }
    }
    return undefined;
  }

  var email = String(getVal(['EMAIL', 'USER_EMAIL']) || '').toLowerCase().trim();
  var id = String(getVal(['ID', 'USER_ID']) || '');
  var name = String(getVal(['NAME', 'FULL_NAME', 'DISPLAY_NAME']) || '');

  // Plan
  var rawPlan = String(getVal(['PLAN', 'PACKAGE']) || '').toUpperCase().trim();
  var plan = (rawPlan === 'SCHOOL' || rawPlan === 'PREMIUM' || rawPlan === 'PRO') ? rawPlan : 'TRIAL';

  // Role
  var rawRole = getVal(['ROLE', 'USER_ROLE']);
  var role;
  if (rawRole) {
    var rUpper = String(rawRole).toUpperCase().trim();
    role = (rUpper === 'ADMIN') ? 'ADMIN' : ((rUpper === 'LICENSED' || rUpper === 'PRO') ? 'LICENSED' : (rUpper === 'FREE_ACCESS' ? 'FREE_ACCESS' : (rUpper === 'BLOCKED' ? 'BLOCKED' : 'TRIAL')));
  } else {
    // Trường hợp schema 13 cột cũ không có cột ROLE:
    // Nếu PLAN là Pro / School / Premium -> Giữ nguyên ý nghĩa nghiệp vụ là LICENSED
    role = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM') ? 'LICENSED' : 'TRIAL';
  }

  // Status & Blocked
  var rawStatus = String(getVal(['STATUS', 'TRANG_THAI']) || '').toUpperCase().trim();
  var isBlocked = rawStatus === 'BLOCKED' || role === 'BLOCKED';

  // Quotas
  var easyQuota = 3;
  var advancedQuota = 1;

  var qEasy = getVal(['QUOTA_EASY', 'EASY_QUOTA']);
  if (qEasy !== undefined) {
    easyQuota = Number(qEasy);
    if (isNaN(easyQuota)) easyQuota = 3;
  } else {
    // Schema 13 cột cũ: EASY_LIMIT & EASY_USED
    var eLimit = getVal(['EASY_LIMIT']);
    var eUsed = Number(getVal(['EASY_USED'])) || 0;
    if (eLimit !== undefined && eLimit !== '') {
      var numLimit = Number(eLimit);
      if (!isNaN(numLimit)) {
        easyQuota = Math.max(0, numLimit - eUsed);
      }
    }
  }

  var qAdv = getVal(['QUOTA_ADVANCED', 'ADVANCED_QUOTA']);
  if (qAdv !== undefined) {
    advancedQuota = Number(qAdv);
    if (isNaN(advancedQuota)) advancedQuota = 1;
  } else {
    // Schema 13 cột cũ: ADVANCED_LIMIT & ADVANCED_USED
    var aLimit = getVal(['ADVANCED_LIMIT']);
    var aUsed = Number(getVal(['ADVANCED_USED'])) || 0;
    if (aLimit !== undefined && aLimit !== '') {
      var numALimit = Number(aLimit);
      if (!isNaN(numALimit)) {
        advancedQuota = Math.max(0, numALimit - aUsed);
      }
    }
  }

  var licenseKey = getVal(['LICENSE_KEY', 'KEY']);
  var expiresAt = getVal(['EXPIRES_AT', 'EXPIRE_AT', 'LICENSE_EXPIRES_AT']);
  var createdAt = getVal(['CREATED_AT', 'CREATE_TIME']);
  var lastActiveAt = getVal(['LAST_ACTIVE_AT', 'LAST_USED_AT', 'ACTIVATED_AT']);

  return {
    id: id || ('usr_' + email.split('@')[0]),
    email: email,
    name: name || email.split('@')[0],
    role: role,
    plan: plan,
    quota: {
      easy: easyQuota,
      advanced: advancedQuota
    },
    licenseKey: licenseKey ? String(licenseKey) : undefined,
    licenseExpiresAt: expiresAt ? String(expiresAt) : null,
    isBlocked: isBlocked,
    createdAt: createdAt ? String(createdAt) : new Date().toISOString(),
    lastActiveAt: lastActiveAt ? String(lastActiveAt) : new Date().toISOString()
  };
}

function findUserInSheet(sheet, email) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var emailCol = colMap['EMAIL'] !== undefined ? colMap['EMAIL'] : (colMap['USER_EMAIL'] !== undefined ? colMap['USER_EMAIL'] : 1);

  var targetEmail = email.toLowerCase().trim();
  for (var r = 1; r < data.length; r++) {
    var rowEmail = String(data[r][emailCol] || '').toLowerCase().trim();
    if (rowEmail === targetEmail) {
      return parseUserRowWithHeaders(data[r], colMap);
    }
  }
  return null;
}

function getAllUsersFromSheet(sheet) {
  var data = sheet.getDataRange().getValues();
  var users = [];
  if (data.length <= 1) return users;

  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var emailCol = colMap['EMAIL'] !== undefined ? colMap['EMAIL'] : (colMap['USER_EMAIL'] !== undefined ? colMap['USER_EMAIL'] : 1);

  for (var r = 1; r < data.length; r++) {
    var email = String(data[r][emailCol] || '').trim();
    if (email) {
      users.push(parseUserRowWithHeaders(data[r], colMap));
    }
  }
  return users;
}

function upsertUserInSheet(sheet, user) {
  var email = String(user.email || '').toLowerCase().trim();
  var data = sheet.getDataRange().getValues();
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var emailCol = colMap['EMAIL'] !== undefined ? colMap['EMAIL'] : (colMap['USER_EMAIL'] !== undefined ? colMap['USER_EMAIL'] : 1);

  var targetRow = -1;
  var existingRowValues = null;

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][emailCol] || '').toLowerCase().trim() === email) {
      targetRow = r + 1; // 1-indexed in sheet
      existingRowValues = data[r];
      break;
    }
  }

  // Chuẩn bị dữ liệu cập nhật
  var id = user.id || (existingRowValues && existingRowValues[colMap['ID'] !== undefined ? colMap['ID'] : (colMap['USER_ID'] || 0)]) || ('usr_' + Date.now().toString(36));
  var name = user.name || (existingRowValues && existingRowValues[colMap['NAME'] || 2]) || email.split('@')[0];
  var role = user.role || 'TRIAL';
  var plan = user.plan || (role === 'LICENSED' || role === 'ADMIN' ? 'PRO' : 'TRIAL');
  var easyQuota = user.quotaEasy !== undefined ? Number(user.quotaEasy) : (user.quota && user.quota.easy !== undefined ? Number(user.quota.easy) : 3);
  var advancedQuota = user.quotaAdvanced !== undefined ? Number(user.quotaAdvanced) : (user.quota && user.quota.advanced !== undefined ? Number(user.quota.advanced) : 1);
  var licenseKey = user.licenseKey || '';
  var expiresAt = user.licenseExpiresAt || user.expiresAt || '';
  var status = user.isBlocked ? 'BLOCKED' : 'ACTIVE';
  var createdAt = user.createdAt || (existingRowValues && existingRowValues[colMap['CREATED_AT'] || 10]) || new Date().toISOString();
  var lastActiveAt = user.lastActiveAt || new Date().toISOString();

  // Kiểm tra xem sheet đang dùng schema nào dựa trên headers
  var isOld13 = colMap['USER_ID'] !== undefined && colMap['EASY_LIMIT'] !== undefined;

  if (isOld13) {
    // Ghi vào schema 13 cột hiện có mà KHÔNG làm vỡ cấu trúc:
    // USER_ID | EMAIL | NAME | PLAN | STATUS | EASY_USED | EASY_LIMIT | ADVANCED_USED | ADVANCED_LIMIT | CREATED_AT | ACTIVATED_AT | EXPIRES_AT | LAST_USED_AT
    var rowValues13 = existingRowValues ? existingRowValues.slice(0, 13) : new Array(13).fill('');
    
    // Ánh xạ an toàn theo tên cột header
    if (colMap['USER_ID'] !== undefined) rowValues13[colMap['USER_ID']] = id;
    if (colMap['EMAIL'] !== undefined) rowValues13[colMap['EMAIL']] = email;
    if (colMap['NAME'] !== undefined) rowValues13[colMap['NAME']] = name;
    if (colMap['PLAN'] !== undefined) rowValues13[colMap['PLAN']] = plan === 'PRO' ? 'Pro' : plan;
    if (colMap['STATUS'] !== undefined) rowValues13[colMap['STATUS']] = status;
    
    // Với người dùng PRO / LICENSED / ADMIN: giữ limit cao hoặc số lượt lớn
    var isUnlimited = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'ADMIN');
    if (colMap['EASY_LIMIT'] !== undefined) rowValues13[colMap['EASY_LIMIT']] = isUnlimited ? 999999 : easyQuota;
    if (colMap['EASY_USED'] !== undefined && !existingRowValues) rowValues13[colMap['EASY_USED']] = 0;
    if (colMap['ADVANCED_LIMIT'] !== undefined) rowValues13[colMap['ADVANCED_LIMIT']] = isUnlimited ? 999999 : advancedQuota;
    if (colMap['ADVANCED_USED'] !== undefined && !existingRowValues) rowValues13[colMap['ADVANCED_USED']] = 0;
    
    if (colMap['CREATED_AT'] !== undefined) rowValues13[colMap['CREATED_AT']] = createdAt;
    if (colMap['ACTIVATED_AT'] !== undefined && !existingRowValues) rowValues13[colMap['ACTIVATED_AT']] = createdAt;
    if (colMap['EXPIRES_AT'] !== undefined) rowValues13[colMap['EXPIRES_AT']] = expiresAt;
    if (colMap['LAST_USED_AT'] !== undefined) rowValues13[colMap['LAST_USED_AT']] = lastActiveAt;

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues13.length).setValues([rowValues13]);
    } else {
      sheet.appendRow(rowValues13);
    }
  } else {
    // Schema 12 cột mới:
    // ID | EMAIL | NAME | ROLE | PLAN | QUOTA_EASY | QUOTA_ADVANCED | LICENSE_KEY | EXPIRES_AT | STATUS | CREATED_AT | LAST_ACTIVE_AT
    var rowValues12 = [
      id, email, name, role, plan, easyQuota, advancedQuota,
      licenseKey, expiresAt, status, createdAt, lastActiveAt
    ];

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues12.length).setValues([rowValues12]);
    } else {
      sheet.appendRow(rowValues12);
    }
  }

  return {
    id: id,
    email: email,
    name: name,
    role: role,
    plan: plan,
    quota: { easy: easyQuota, advanced: advancedQuota },
    licenseKey: licenseKey,
    licenseExpiresAt: expiresAt || null,
    isBlocked: status === 'BLOCKED',
    createdAt: createdAt,
    lastActiveAt: lastActiveAt
  };
}

function deleteUserInSheet(sheet, email) {
  var targetEmail = email.toLowerCase().trim();
  var data = sheet.getDataRange().getValues();
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var emailCol = colMap['EMAIL'] !== undefined ? colMap['EMAIL'] : (colMap['USER_EMAIL'] !== undefined ? colMap['USER_EMAIL'] : 1);

  for (var r = 1; r < data.length; r++) {
    var rowEmail = String(data[r][emailCol] || '').toLowerCase().trim();
    if (rowEmail === targetEmail) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function findLicenseInSheet(sheet, key) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var keyCol = colMap['KEY'] !== undefined ? colMap['KEY'] : 0;

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][keyCol] || '').toUpperCase().trim() === key) {
      var planCol = colMap['PLAN'] !== undefined ? colMap['PLAN'] : 1;
      var devCol = colMap['MAX_DEVICES'] !== undefined ? colMap['MAX_DEVICES'] : 2;
      var statusCol = colMap['STATUS'] !== undefined ? colMap['STATUS'] : 3;
      var expCol = colMap['EXPIRES_AT'] !== undefined ? colMap['EXPIRES_AT'] : 4;
      var emailCol = colMap['ASSIGNED_EMAIL'] !== undefined ? colMap['ASSIGNED_EMAIL'] : 5;
      var noteCol = colMap['NOTE'] !== undefined ? colMap['NOTE'] : 7;

      return {
        key: String(data[r][keyCol]),
        plan: String(data[r][planCol] || 'PRO'),
        maxDevices: Number(data[r][devCol] || 1),
        status: String(data[r][statusCol] || 'ACTIVE'),
        expiresAt: data[r][expCol] ? String(data[r][expCol]) : null,
        assignedEmail: data[r][emailCol] ? String(data[r][emailCol]) : undefined,
        note: data[r][noteCol] ? String(data[r][noteCol]) : ''
      };
    }
  }
  return null;
}

function getSettingsFromSheet(sheet) {
  var data = sheet.getDataRange().getValues();
  var result = {};
  if (data.length <= 1) return result;

  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var keyCol = colMap['KEY'] !== undefined ? colMap['KEY'] : 0;
  var valCol = colMap['VALUE'] !== undefined ? colMap['VALUE'] : 1;

  for (var r = 1; r < data.length; r++) {
    var k = String(data[r][keyCol] || '').trim();
    var v = data[r][valCol];
    if (k) result[k] = v;
  }
  return result;
}

function saveSettingsToSheet(sheet, settings) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var keyCol = colMap['KEY'] !== undefined ? colMap['KEY'] : 0;
  var valCol = colMap['VALUE'] !== undefined ? colMap['VALUE'] : 1;

  for (var key in settings) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      var val = settings[key];
      var data = sheet.getDataRange().getValues();
      var found = false;
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][keyCol] || '').trim() === key) {
          sheet.getRange(r + 1, valCol + 1).setValue(val);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([key, val, 'Cấu hình tự động lưu']);
      }
    }
  }
}

function jsonResponse(data, statusCode) {
  var code = statusCode || 200;
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
