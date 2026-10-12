/**
 * =========================================================================
 * SKKN REVIEW PRO — GOOGLE APPS SCRIPT DATABASE ENDPOINT
 * Phiên bản: 2.7 (Bảo mật Server-to-Server, Root Admin Defense, Concurrency Lock & Universal Schema)
 * =========================================================================
 * HƯỚNG DẪN CÀI ĐẶT / CẬP NHẬT TRÊN GOOGLE SHEETS:
 * 1. Mở Google Sheet dự án của bạn (ví dụ: "SKKN REVIEW PRO - Database")
 * 2. Đảm bảo có các sheet: "USERS", "LICENSES", "SETTINGS"
 *    - Schema 13 cột hiện có:
 *      USER_ID | EMAIL | NAME | PLAN | STATUS | EASY_USED | EASY_LIMIT | ADVANCED_USED | ADVANCED_LIMIT | CREATED_AT | ACTIVATED_AT | EXPIRES_AT | LAST_USED_AT
 *    - Schema 12 cột chuẩn mới:
 *      ID | EMAIL | NAME | ROLE | PLAN | QUOTA_EASY | QUOTA_ADVANCED | LICENSE_KEY | EXPIRES_AT | STATUS | CREATED_AT | LAST_ACTIVE_AT
 *    => Script v2.7 tự động nhận diện cả 2 schema theo tên Header, bảo vệ dữ liệu 100%!
 * 3. CẤU HÌNH BẢO MẬT BẮT BUỘC (Script Properties):
 *    - Vào Cài đặt dự án (Project Settings) -> Thuộc tính tập lệnh (Script Properties):
 *      + Thêm thuộc tính: APPS_SCRIPT_SECRET (BẮT BUỘC: Đặt chuỗi bí mật khớp với biến môi trường APPS_SCRIPT_SECRET trên Vercel Backend)
 *      + Thêm thuộc tính: ROOT_ADMIN_EMAILS (mặc định: dathien2412@gmail.com)
 * 4. Vào menu Tiện ích mở rộng (Extensions) -> Apps Script
 * 5. Dán toàn bộ nội dung file này vào file Code.gs
 * 6. Nhấn Triển khai (Deploy) -> Quản lý bản triển khai (Manage deployments) -> Chỉnh sửa -> Phiên bản MỚI -> Triển khai
 * =========================================================================
 */

// Danh sách Root Admin mặc định (được bảo vệ tuyệt đối không thể xóa / hạ quyền)
var DEFAULT_ROOT_ADMINS = ['dathien2412@gmail.com'];

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

    // 1. PING HEALTH CHECK (Công khai, không lộ thông tin nhạy cảm)
    if (action === 'ping') {
      return jsonResponse({
        success: true,
        version: '2.7',
        status: 'ONLINE',
        service: 'SKKN REVIEW PRO DATABASE'
      });
    }

    // 2. INSPECT SCHEMA (Kiểm tra cấu trúc cột, không để lộ dữ liệu người dùng)
    if (action === 'inspectSchema') {
      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var licSheet = getOrCreateSheet(ss, 'LICENSES');
      var setSheet = getOrCreateSheet(ss, 'SETTINGS');

      var uValidation = validateSheetHeaders(usersSheet, 'USERS');
      var lValidation = validateSheetHeaders(licSheet, 'LICENSES');
      var sValidation = validateSheetHeaders(setSheet, 'SETTINGS');

      return jsonResponse({
        success: true,
        version: '2.7',
        isFullyCompatible: uValidation.isValid && lValidation.isValid && sValidation.isValid,
        usersSchema: {
          isValid: uValidation.isValid,
          type: uValidation.type,
          columnCount: uValidation.columnCount,
          missing: uValidation.missing
        },
        licensesSchema: {
          isValid: lValidation.isValid,
          columnCount: lValidation.columnCount,
          missing: lValidation.missing
        },
        settingsSchema: {
          isValid: sValidation.isValid,
          columnCount: sValidation.columnCount,
          missing: sValidation.missing
        }
      });
    }

    // 3. GET USER BY EMAIL (Tra cứu thông tin tài khoản an toàn)
    if (action === 'getUser') {
      var email = (params.email || (postData && postData.email) || '').toLowerCase().trim();
      if (!email) {
        return jsonResponse({ success: false, error: 'Thiếu tham số email' });
      }

      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var user = findUserInSheet(usersSheet, email);
      if (!user) {
        return jsonResponse({ success: true, found: false, user: null, message: 'Không tìm thấy người dùng' });
      }

      // RÀ SOÁT BẢO MẬT: Kiểm tra xem có Server Secret hợp lệ từ Backend không
      var requiredSecret = getScriptSecret();
      var providedSecret = postData && postData.serverSecret ? String(postData.serverSecret).trim() : '';
      var isServerAuth = requiredSecret && (providedSecret === requiredSecret);

      var safeUser = {
        id: user.id,
        email: user.email,
        name: isServerAuth ? user.name : (user.name ? (user.name.charAt(0) + '***') : ''),
        role: user.role,
        plan: user.plan,
        quota: user.quota,
        isUnlimited: user.isUnlimited,
        isBlocked: user.isBlocked,
        licenseKey: isServerAuth ? user.licenseKey : (user.licenseKey ? (user.licenseKey.substring(0, 8) + '****') : undefined),
        licenseExpiresAt: user.licenseExpiresAt,
        createdAt: isServerAuth ? user.createdAt : undefined,
        lastActiveAt: isServerAuth ? user.lastActiveAt : undefined
      };

      return jsonResponse({ success: true, found: true, user: safeUser });
    }

    // 4. VERIFY LICENSE (Kiểm tra mã bản quyền khi kích hoạt - Bảo mật danh tính)
    if (action === 'verifyLicense') {
      var key = (params.key || (postData && postData.key) || '').toUpperCase().trim();
      if (!key) {
        return jsonResponse({ success: false, message: 'Thiếu mã bản quyền' });
      }
      var licSheet = getOrCreateSheet(ss, 'LICENSES');
      var license = findLicenseInSheet(licSheet, key);
      if (!license) {
        return jsonResponse({ success: false, message: 'Mã bản quyền không tồn tại' });
      }

      // BẢO MẬT: Tuyệt đối không để lộ email người được cấp (assignedEmail), ghi chú (note), thiết bị
      return jsonResponse({
        success: true,
        license: {
          key: license.key,
          plan: license.plan,
          maxDevices: license.maxDevices,
          status: license.status,
          expiresAt: license.expiresAt,
          isAssigned: Boolean(license.assignedEmail)
        }
      });
    }

    // 5. GET SETTINGS (Yêu cầu xác thực Server Secret & loại bỏ cấu hình nhạy cảm)
    if (action === 'getSettings') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({
          success: false,
          error: authResult.message || 'Truy cập bị từ chối: Yêu cầu xác thực Server Secret.'
        });
      }

      var setSheet = getOrCreateSheet(ss, 'SETTINGS');
      var rawSettings = getSettingsFromSheet(setSheet);
      var safeSettings = {};
      for (var k in rawSettings) {
        if (Object.prototype.hasOwnProperty.call(rawSettings, k)) {
          var upper = k.toUpperCase();
          if (upper.indexOf('SECRET') === -1 &&
              upper.indexOf('PASSWORD') === -1 &&
              upper.indexOf('TOKEN') === -1 &&
              upper.indexOf('KEY') === -1 &&
              upper.indexOf('CREDENTIAL') === -1) {
            safeSettings[k] = rawSettings[k];
          }
        }
      }
      return jsonResponse({ success: true, settings: safeSettings });
    }

    // =========================================================================
    // CÁC THAO TÁC CẦN XÁC THỰC SERVER-TO-SERVER & QUYỀN QUẢN TRỊ VIÊN
    // (getUsers, saveUser, updateUser, deleteUser, syncUsers, updateSettings)
    // =========================================================================
    var authResult = verifyServerAuthorization(params, postData);
    if (!authResult.authorized) {
      return jsonResponse({
        success: false,
        error: authResult.message || 'Truy cập bị từ chối: Yêu cầu xác thực bảo mật Server Secret từ Backend.'
      });
    }

    // 6. GET ALL USERS (Yêu cầu xác thực Admin)
    if (action === 'getUsers') {
      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var users = getAllUsersFromSheet(usersSheet);
      return jsonResponse({ success: true, count: users.length, users: users });
    }

    // 7. SAVE / UPSERT SINGLE USER (Sử dụng LockService tránh race condition)
    if (action === 'saveUser' || action === 'updateUser') {
      var lock = LockService.getScriptLock();
      var lockSuccess = false;
      try {
        lockSuccess = lock.tryLock(10000);
      } catch (lockErr) {}

      if (!lockSuccess) {
        return jsonResponse({ success: false, error: 'Hệ thống bận: Đang có thao tác đồng bộ khác, vui lòng thử lại sau.' });
      }

      try {
        var userData = postData || params;
        var email = (userData.email || '').toLowerCase().trim();
        if (!email) {
          return jsonResponse({ success: false, error: 'Thiếu email người dùng' });
        }

        var usersSheet = getOrCreateSheet(ss, 'USERS');
        var validation = validateSheetHeaders(usersSheet, 'USERS');
        if (!validation.isValid) {
          return jsonResponse({
            success: false,
            error: 'Không thể ghi dữ liệu: Cấu trúc Sheet USERS thiếu cột bắt buộc (' + validation.missing.join(', ') + ').'
          });
        }

        var saved = upsertUserInSheet(usersSheet, userData);
        return jsonResponse({ success: true, user: saved });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 8. DELETE USER (Mặc định Soft Delete / Khóa tài khoản, bảo vệ Root Admin)
    if (action === 'deleteUser') {
      var lock = LockService.getScriptLock();
      var lockSuccess = false;
      try {
        lockSuccess = lock.tryLock(10000);
      } catch (lockErr) {}

      if (!lockSuccess) {
        return jsonResponse({ success: false, error: 'Hệ thống bận: Vui lòng thử lại sau ít giây.' });
      }

      try {
        var email = (params.email || (postData && postData.email) || '').toLowerCase().trim();
        if (!email) {
          return jsonResponse({ success: false, error: 'Thiếu email người dùng cần xử lý' });
        }

        // BẢO VỆ TUYỆT ĐỐI ROOT ADMIN
        if (isRootAdminEmail(email)) {
          return jsonResponse({
            success: false,
            error: 'Bảo mật Quản trị: Tuyệt đối không thể xóa hoặc vô hiệu hóa tài khoản Root Admin.'
          });
        }

        var usersSheet = getOrCreateSheet(ss, 'USERS');
        var validation = validateSheetHeaders(usersSheet, 'USERS');
        if (!validation.isValid) {
          return jsonResponse({
            success: false,
            error: 'Cấu trúc Sheet USERS không hợp lệ (' + validation.missing.join(', ') + ').'
          });
        }

        // Kiểm tra chế độ xóa vĩnh viễn (permanent)
        var isPermanent = Boolean((postData && postData.permanent) || params.permanent === 'true');
        var operatorEmail = authResult.operatorEmail || '';

        if (isPermanent) {
          // BẢO VỆ XÓA VĨNH VIỄN:
          // 1. Chỉ Root Admin mới có thẩm quyền xóa vĩnh viễn dòng vật lý
          if (!isRootAdminEmail(operatorEmail)) {
            return jsonResponse({
              success: false,
              error: 'Quyền hạn bị từ chối: Chỉ Root Admin mới có thẩm quyền yêu cầu xóa vĩnh viễn người dùng khỏi Google Sheets.'
            });
          }

          // 2. Mã xác nhận động theo email cụ thể, không chấp nhận chuỗi cố định đơn lẻ
          var confirmKey = String((postData && postData.confirmPermanent) || params.confirmPermanent || '').trim();
          var expectedCode = 'PERMANENT_DELETE_' + email.toUpperCase();
          if (confirmKey !== expectedCode && confirmKey !== email) {
            return jsonResponse({
              success: false,
              error: 'Mã xác nhận xóa vĩnh viễn không đúng. Yêu cầu mã: ' + expectedCode
            });
          }

          var hardDeleted = hardDeleteUserInSheet(usersSheet, email);
          return jsonResponse({ success: true, mode: 'HARD_DELETE', deleted: hardDeleted });
        } else {
          // MẶC ĐỊNH AN TOÀN TUYỆT ĐỐI: SOFT DELETE (Chuyển sang BLOCKED, không xóa dòng vật lý)
          var softDeleted = softDeleteUserInSheet(usersSheet, email);
          return jsonResponse({ success: true, mode: 'SOFT_DELETE_BLOCKED', deleted: softDeleted });
        }
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 9. BATCH SYNC USERS (Đồng bộ hàng loạt với Concurrency Lock)
    if (action === 'syncUsers') {
      var lock = LockService.getScriptLock();
      var lockSuccess = false;
      try {
        lockSuccess = lock.tryLock(15000);
      } catch (lockErr) {}

      if (!lockSuccess) {
        return jsonResponse({ success: false, error: 'Hệ thống bận: Đang có tiến trình đồng bộ khác đang chạy.' });
      }

      try {
        var list = (postData && Array.isArray(postData.users)) ? postData.users : [];
        if (!list || list.length === 0) {
          return jsonResponse({ success: false, error: 'Danh sách người dùng cần đồng bộ trống' });
        }

        var usersSheet = getOrCreateSheet(ss, 'USERS');
        var validation = validateSheetHeaders(usersSheet, 'USERS');
        if (!validation.isValid) {
          return jsonResponse({
            success: false,
            error: 'Không thể đồng bộ: Sheet USERS thiếu cột bắt buộc (' + validation.missing.join(', ') + ').'
          });
        }

        var syncedCount = 0;
        for (var i = 0; i < list.length; i++) {
          if (list[i] && list[i].email) {
            upsertUserInSheet(usersSheet, list[i]);
            syncedCount++;
          }
        }
        return jsonResponse({ success: true, syncedCount: syncedCount, total: list.length });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 10. UPDATE SETTINGS (Yêu cầu xác thực Admin)
    if (action === 'updateSettings') {
      var lock = LockService.getScriptLock();
      var lockSuccess = false;
      try {
        lockSuccess = lock.tryLock(8000);
      } catch (lockErr) {}

      if (!lockSuccess) {
        return jsonResponse({ success: false, error: 'Hệ thống bận: Vui lòng thử lại sau.' });
      }

      try {
        var setSheet = getOrCreateSheet(ss, 'SETTINGS');
        saveSettingsToSheet(setSheet, postData || params);
        return jsonResponse({ success: true, message: 'Đã cập nhật cấu hình hệ thống an toàn' });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    return jsonResponse({ success: false, error: 'Hành động không được hỗ trợ: ' + action });

  } catch (globalError) {
    // BẢO MẬT: Không bao giờ công khai stack trace hoặc chi tiết nhạy cảm
    return jsonResponse({
      success: false,
      error: 'Lỗi thực thi nội bộ trên Google Apps Script: ' + (globalError.message || 'Unknown Error')
    });
  }
}

// =========================================================================
// BẢO MẬT & XÁC THỰC SERVER-TO-SERVER
// =========================================================================

function getScriptSecret() {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('APPS_SCRIPT_SECRET') || '';
  } catch (_) {
    return '';
  }
}

function getRootAdminList() {
  var list = DEFAULT_ROOT_ADMINS.slice();
  try {
    var props = PropertiesService.getScriptProperties();
    var custom = props.getProperty('ROOT_ADMIN_EMAILS');
    if (custom) {
      var parts = custom.split(',');
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim().toLowerCase();
        if (p && list.indexOf(p) === -1) list.push(p);
      }
    }
  } catch (_) {}
  return list;
}

function isRootAdminEmail(email) {
  if (!email) return false;
  var target = String(email).trim().toLowerCase();
  var admins = getRootAdminList();
  return admins.indexOf(target) !== -1;
}

function verifyServerAuthorization(params, postData) {
  var requiredSecret = getScriptSecret();
  // BẢO MẬT: Khóa bí mật chỉ được chấp nhận từ POST body, tuyệt đối KHÔNG nhận qua URL query (params)
  var providedSecret = postData && postData.serverSecret ? String(postData.serverSecret).trim() : '';

  // 1. BẮT BUỘC: APPS_SCRIPT_SECRET phải được cấu hình trong Script Properties
  if (!requiredSecret) {
    return {
      authorized: false,
      message: 'Bảo mật: APPS_SCRIPT_SECRET chưa được thiết lập trong Script Properties của Google Sheet. Mọi thao tác quản trị bị từ chối.'
    };
  }

  // 2. BẮT BUỘC: Khóa bí mật phải được gửi lên và khớp chính xác (Loại bỏ hoàn toàn cờ tự khai báo)
  if (!providedSecret || providedSecret !== requiredSecret) {
    return {
      authorized: false,
      message: 'Xác thực Server thất bại: Khóa bí mật Server Secret không chính xác hoặc bị thiếu.'
    };
  }

  // 3. BẮT BUỘC: Danh tính người vận hành (operatorEmail) do Backend gửi kèm
  var operatorEmail = String((postData && postData.operatorEmail) || '').trim().toLowerCase();
  if (!operatorEmail) {
    return {
      authorized: false,
      message: 'Yêu cầu quản trị cần danh tính người vận hành (operatorEmail) được backend xác minh.'
    };
  }

  return { authorized: true, operatorEmail: operatorEmail };
}

// =========================================================================
// KIỂM TRA CHẶT CHẼ HEADER SCHEMA
// =========================================================================

function validateSheetHeaders(sheet, sheetType) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);

  if (sheetType === 'USERS') {
    // Sheet USERS bắt buộc phải có EMAIL (hoặc USER_EMAIL)
    var hasEmail = colMap['EMAIL'] !== undefined || colMap['USER_EMAIL'] !== undefined;
    var hasId = colMap['ID'] !== undefined || colMap['USER_ID'] !== undefined;
    var hasPlanOrRole = colMap['PLAN'] !== undefined || colMap['ROLE'] !== undefined || colMap['PACKAGE'] !== undefined;

    var missing = [];
    if (!hasEmail) missing.push('EMAIL / USER_EMAIL');
    if (!hasId) missing.push('ID / USER_ID');
    if (!hasPlanOrRole) missing.push('PLAN / ROLE');

    var isOld13 = colMap['USER_ID'] !== undefined && colMap['EASY_LIMIT'] !== undefined;
    var isNew12 = colMap['QUOTA_EASY'] !== undefined || colMap['ROLE'] !== undefined;

    return {
      isValid: missing.length === 0,
      headers: headers,
      columnCount: headers.length,
      missing: missing,
      type: isOld13 ? 'SCHEMA_13_OLD' : (isNew12 ? 'SCHEMA_12_NEW' : 'CUSTOM_COMPATIBLE')
    };
  }

  if (sheetType === 'LICENSES') {
    var hasKey = colMap['KEY'] !== undefined || colMap['LICENSE_KEY'] !== undefined;
    var missing = [];
    if (!hasKey) missing.push('KEY / LICENSE_KEY');
    return {
      isValid: missing.length === 0,
      headers: headers,
      columnCount: headers.length,
      missing: missing
    };
  }

  if (sheetType === 'SETTINGS') {
    var hasKey = colMap['KEY'] !== undefined;
    var hasVal = colMap['VALUE'] !== undefined;
    var missing = [];
    if (!hasKey) missing.push('KEY');
    if (!hasVal) missing.push('VALUE');
    return {
      isValid: missing.length === 0,
      headers: headers,
      columnCount: headers.length,
      missing: missing
    };
  }

  return { isValid: true, headers: headers, columnCount: headers.length, missing: [] };
}

// =========================================================================
// TIỆN ÍCH SHEET & TƯƠNG THÍCH LINH HOẠT
// =========================================================================

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
    // BẢO TOÀN NGHIỆP VỤ: Nếu không có cột ROLE nhưng PLAN là PRO/SCHOOL/PREMIUM -> Giữ nguyên là LICENSED
    role = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM') ? 'LICENSED' : 'TRIAL';
  }

  // Root Admin luôn là ADMIN / PRO
  if (isRootAdminEmail(email)) {
    role = 'ADMIN';
    plan = 'PRO';
  }

  // Status & Blocked
  var rawStatus = String(getVal(['STATUS', 'TRANG_THAI']) || '').toUpperCase().trim();
  var isBlocked = rawStatus === 'BLOCKED' || role === 'BLOCKED';
  if (isRootAdminEmail(email)) isBlocked = false;

  // Quotas:
  var isUnlimited = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'ADMIN');
  var easyQuota = isUnlimited ? -1 : 3;
  var advancedQuota = isUnlimited ? -1 : 1;

  var qEasy = getVal(['QUOTA_EASY', 'EASY_QUOTA']);
  if (qEasy !== undefined) {
    var val = String(qEasy).trim().toUpperCase();
    if (val === 'UNLIMITED' || val === '-1') {
      easyQuota = -1;
    } else {
      var num = Number(val);
      easyQuota = isNaN(num) ? 3 : num;
    }
  } else {
    // Schema 13 cột cũ
    var eLimit = getVal(['EASY_LIMIT']);
    var eUsed = Number(getVal(['EASY_USED'])) || 0;
    if (eLimit !== undefined && eLimit !== '') {
      var val = String(eLimit).trim().toUpperCase();
      if (val === 'UNLIMITED' || val === '-1' || Number(val) >= 99999) {
        easyQuota = -1;
      } else {
        var num = Number(val);
        if (!isNaN(num)) easyQuota = Math.max(0, num - eUsed);
      }
    }
  }

  var qAdv = getVal(['QUOTA_ADVANCED', 'ADVANCED_QUOTA']);
  if (qAdv !== undefined) {
    var val = String(qAdv).trim().toUpperCase();
    if (val === 'UNLIMITED' || val === '-1') {
      advancedQuota = -1;
    } else {
      var num = Number(val);
      advancedQuota = isNaN(num) ? 1 : num;
    }
  } else {
    // Schema 13 cột cũ
    var aLimit = getVal(['ADVANCED_LIMIT']);
    var aUsed = Number(getVal(['ADVANCED_USED'])) || 0;
    if (aLimit !== undefined && aLimit !== '') {
      var val = String(aLimit).trim().toUpperCase();
      if (val === 'UNLIMITED' || val === '-1' || Number(val) >= 99999) {
        advancedQuota = -1;
      } else {
        var num = Number(val);
        if (!isNaN(num)) advancedQuota = Math.max(0, num - aUsed);
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
    isUnlimited: isUnlimited || easyQuota === -1,
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

  // Đọc dữ liệu cũ nếu đã tồn tại để BẢO TOÀN DỮ LIỆU
  var parsedExisting = existingRowValues ? parseUserRowWithHeaders(existingRowValues, colMap) : null;
  var isRoot = isRootAdminEmail(email);

  var id = user.id || (parsedExisting ? parsedExisting.id : ('usr_' + Date.now().toString(36)));
  var name = (user.name !== undefined && user.name !== '') ? user.name : (parsedExisting ? parsedExisting.name : email.split('@')[0]);

  // BẢO VỆ ROOT ADMIN & BẢO TOÀN QUYỀN: Không tự hạ PRO thành TRIAL nếu payload thiếu role / plan
  var role = isRoot ? 'ADMIN' : (user.role !== undefined ? user.role : (parsedExisting ? parsedExisting.role : 'TRIAL'));
  var plan = isRoot ? 'PRO' : (user.plan !== undefined ? user.plan : (parsedExisting ? parsedExisting.plan : (role === 'LICENSED' ? 'PRO' : 'TRIAL')));

  // PHÂN QUYỀN: Tuyệt đối không cho phép client tự thăng cấp ADMIN nếu không phải Root Admin
  if (role === 'ADMIN' && !isRoot) {
    role = (parsedExisting && parsedExisting.role !== 'ADMIN') ? parsedExisting.role : 'LICENSED';
  }

  var isUnlimited = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'ADMIN');

  var easyQuota = user.quotaEasy !== undefined ? Number(user.quotaEasy) :
    (user.quota && user.quota.easy !== undefined ? Number(user.quota.easy) :
      (parsedExisting ? parsedExisting.quota.easy : (isUnlimited ? -1 : 3)));

  var advancedQuota = user.quotaAdvanced !== undefined ? Number(user.quotaAdvanced) :
    (user.quota && user.quota.advanced !== undefined ? Number(user.quota.advanced) :
      (parsedExisting ? parsedExisting.quota.advanced : (isUnlimited ? -1 : 1)));

  var licenseKey = user.licenseKey !== undefined ? user.licenseKey : (parsedExisting ? (parsedExisting.licenseKey || '') : '');
  var expiresAt = (user.licenseExpiresAt !== undefined || user.expiresAt !== undefined)
    ? (user.licenseExpiresAt || user.expiresAt || '')
    : (parsedExisting ? (parsedExisting.licenseExpiresAt || '') : '');

  var isBlocked = isRoot ? false : (user.isBlocked !== undefined ? Boolean(user.isBlocked) : (parsedExisting ? parsedExisting.isBlocked : false));
  var status = isBlocked ? 'BLOCKED' : 'ACTIVE';

  var createdAt = (parsedExisting && parsedExisting.createdAt) ? parsedExisting.createdAt : (user.createdAt || new Date().toISOString());
  var lastActiveAt = user.lastActiveAt || new Date().toISOString();

  // Biểu diễn Unlimited chuẩn: 'UNLIMITED' thay vì con số cứng 999999
  var easyQuotaCell = isUnlimited ? 'UNLIMITED' : easyQuota;
  var advQuotaCell = isUnlimited ? 'UNLIMITED' : advancedQuota;

  // GHI AN TOÀN THEO TÊN CỘT HEADER THỰC TẾ
  var explicitQuota = Boolean(user.explicitQuota);
  var isOld13 = colMap['USER_ID'] !== undefined && colMap['EASY_LIMIT'] !== undefined;

  if (isOld13) {
    var rowValues13 = existingRowValues ? existingRowValues.slice(0, 13) : new Array(13).fill('');

    if (colMap['USER_ID'] !== undefined) rowValues13[colMap['USER_ID']] = id;
    if (colMap['EMAIL'] !== undefined) rowValues13[colMap['EMAIL']] = email;
    if (colMap['NAME'] !== undefined) rowValues13[colMap['NAME']] = name;
    if (colMap['PLAN'] !== undefined) rowValues13[colMap['PLAN']] = (plan === 'PRO' ? 'Pro' : plan);
    if (colMap['STATUS'] !== undefined) rowValues13[colMap['STATUS']] = status;

    // BẢO TOÀN HẠN MỨC TRIAL TRONG SCHEMA 13 CỘT:
    if (isUnlimited) {
      if (colMap['EASY_LIMIT'] !== undefined) rowValues13[colMap['EASY_LIMIT']] = 'UNLIMITED';
      if (colMap['ADVANCED_LIMIT'] !== undefined) rowValues13[colMap['ADVANCED_LIMIT']] = 'UNLIMITED';
      // Tài khoản PRO không giới hạn, không trừ lượt
    } else if (existingRowValues && !explicitQuota && user.easyLimit === undefined && user.advancedLimit === undefined) {
      // Khi chỉ sửa tên, email, trạng thái hoặc thời hạn:
      // GIỮ NGUYÊN HOÀN TOÀN EASY_LIMIT, EASY_USED, ADVANCED_LIMIT, ADVANCED_USED từ dòng cũ
      // Tuyệt đối không lấy số lượt còn lại ghi đè vào cột tổng hạn mức
      if (colMap['EASY_LIMIT'] !== undefined) rowValues13[colMap['EASY_LIMIT']] = existingRowValues[colMap['EASY_LIMIT']];
      if (colMap['EASY_USED'] !== undefined) rowValues13[colMap['EASY_USED']] = existingRowValues[colMap['EASY_USED']];
      if (colMap['ADVANCED_LIMIT'] !== undefined) rowValues13[colMap['ADVANCED_LIMIT']] = existingRowValues[colMap['ADVANCED_LIMIT']];
      if (colMap['ADVANCED_USED'] !== undefined) rowValues13[colMap['ADVANCED_USED']] = existingRowValues[colMap['ADVANCED_USED']];
    } else {
      // Khi tạo mới hoặc Admin chủ động thay đổi hạn mức:
      var curEasyUsed = existingRowValues && colMap['EASY_USED'] !== undefined ? (Number(existingRowValues[colMap['EASY_USED']]) || 0) : 0;
      var curAdvUsed = existingRowValues && colMap['ADVANCED_USED'] !== undefined ? (Number(existingRowValues[colMap['ADVANCED_USED']]) || 0) : 0;

      // Phân biệt rõ nhập tổng hạn mức (easyLimit) hay số lượt còn lại (quotaEasy / quota.easy):
      // Nếu Admin nhập số lượt còn lại: TỔNG HẠN MỨC = SỐ LƯỢT CÒN LẠI + SỐ LƯỢT ĐÃ DÙNG
      var newEasyLimit;
      if (user.easyLimit !== undefined) {
        newEasyLimit = Number(user.easyLimit);
      } else if (easyQuota >= 0) {
        newEasyLimit = easyQuota + curEasyUsed;
      } else {
        newEasyLimit = 'UNLIMITED';
      }

      var newAdvLimit;
      if (user.advancedLimit !== undefined) {
        newAdvLimit = Number(user.advancedLimit);
      } else if (advancedQuota >= 0) {
        newAdvLimit = advancedQuota + curAdvUsed;
      } else {
        newAdvLimit = 'UNLIMITED';
      }

      if (colMap['EASY_LIMIT'] !== undefined) rowValues13[colMap['EASY_LIMIT']] = newEasyLimit;
      if (colMap['EASY_USED'] !== undefined && !existingRowValues) rowValues13[colMap['EASY_USED']] = 0;
      if (colMap['ADVANCED_LIMIT'] !== undefined) rowValues13[colMap['ADVANCED_LIMIT']] = newAdvLimit;
      if (colMap['ADVANCED_USED'] !== undefined && !existingRowValues) rowValues13[colMap['ADVANCED_USED']] = 0;
    }

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
    // Schema 12 cột mới: ID | EMAIL | NAME | ROLE | PLAN | QUOTA_EASY | QUOTA_ADVANCED | LICENSE_KEY | EXPIRES_AT | STATUS | CREATED_AT | LAST_ACTIVE_AT
    // Khởi tạo dòng mới hoặc bảo toàn mảng dòng cũ nếu có cột tùy biến
    var numCols = Math.max(12, headers.length);
    var rowValues = existingRowValues ? existingRowValues.slice(0, numCols) : new Array(numCols).fill('');

    function setField(aliases, val) {
      for (var i = 0; i < aliases.length; i++) {
        var col = colMap[aliases[i]];
        if (col !== undefined) {
          rowValues[col] = val;
          return;
        }
      }
    }

    setField(['ID', 'USER_ID'], id);
    setField(['EMAIL', 'USER_EMAIL'], email);
    setField(['NAME', 'FULL_NAME'], name);
    setField(['ROLE', 'USER_ROLE'], role);
    setField(['PLAN', 'PACKAGE'], plan);

    if (isUnlimited) {
      setField(['QUOTA_EASY', 'EASY_LIMIT'], 'UNLIMITED');
      setField(['QUOTA_ADVANCED', 'ADVANCED_LIMIT'], 'UNLIMITED');
    } else if (existingRowValues && !explicitQuota && user.easyLimit === undefined && user.quotaEasy === undefined && (!user.quota || user.quota.easy === undefined)) {
      // Giữ nguyên quota cũ nếu không được yêu cầu thay đổi
    } else {
      setField(['QUOTA_EASY', 'EASY_LIMIT'], easyQuotaCell);
      setField(['QUOTA_ADVANCED', 'ADVANCED_LIMIT'], advQuotaCell);
    }

    setField(['LICENSE_KEY', 'KEY'], licenseKey);
    setField(['EXPIRES_AT', 'LICENSE_EXPIRES_AT'], expiresAt);
    setField(['STATUS', 'TRANG_THAI'], status);
    setField(['CREATED_AT'], createdAt);
    setField(['LAST_ACTIVE_AT', 'LAST_USED_AT'], lastActiveAt);

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  }

  return {
    id: id,
    email: email,
    name: name,
    role: role,
    plan: plan,
    quota: {
      easy: isUnlimited ? -1 : easyQuota,
      advanced: isUnlimited ? -1 : advancedQuota
    },
    isUnlimited: isUnlimited,
    licenseKey: licenseKey,
    licenseExpiresAt: expiresAt || null,
    isBlocked: status === 'BLOCKED',
    createdAt: createdAt,
    lastActiveAt: lastActiveAt
  };
}

// XÓA MỀM (Soft Delete): Khóa tài khoản thành BLOCKED, không xóa dòng
function softDeleteUserInSheet(sheet, email) {
  var targetEmail = email.toLowerCase().trim();
  var data = sheet.getDataRange().getValues();
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var emailCol = colMap['EMAIL'] !== undefined ? colMap['EMAIL'] : (colMap['USER_EMAIL'] !== undefined ? colMap['USER_EMAIL'] : 1);
  var statusCol = colMap['STATUS'] !== undefined ? colMap['STATUS'] : (colMap['TRANG_THAI'] !== undefined ? colMap['TRANG_THAI'] : 9);

  for (var r = 1; r < data.length; r++) {
    var rowEmail = String(data[r][emailCol] || '').toLowerCase().trim();
    if (rowEmail === targetEmail) {
      sheet.getRange(r + 1, statusCol + 1).setValue('BLOCKED');
      return true;
    }
  }
  return false;
}

// XÓA VĨNH VIỄN (Hard Delete): Yêu cầu xác nhận tường minh
function hardDeleteUserInSheet(sheet, email) {
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

// Chuẩn hóa JSON phản hồi nhất quán, không dùng status code giả lập gây lỗi Apps Script
function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
