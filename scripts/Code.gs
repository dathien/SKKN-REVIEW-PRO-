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

    // 3. GET USER BY EMAIL (Tra cứu thông tin tài khoản an toàn — Bắt buộc Server Secret)
    if (action === 'getUser') {
      var email = (params.email || (postData && postData.email) || '').toLowerCase().trim();
      if (!email) {
        return jsonResponse({ success: false, error: 'Thiếu tham số email' });
      }

      // RÀ SOÁT BẢO MẬT: Bắt buộc phải có Server Secret hợp lệ từ Backend
      var requiredSecret = getScriptSecret();
      var providedSecret = postData && postData.serverSecret ? String(postData.serverSecret).trim() : '';
      var isServerAuth = requiredSecret && (providedSecret === requiredSecret);

      if (!isServerAuth) {
        return jsonResponse({
          success: false,
          error: 'Truy cập bị từ chối: Yêu cầu xác thực Server Secret hợp lệ từ Backend để tra cứu thông tin tài khoản.'
        });
      }

      var usersSheet = getOrCreateSheet(ss, 'USERS');
      var user = findUserInSheet(usersSheet, email);
      if (!user) {
        return jsonResponse({ success: true, found: false, user: null, message: 'Không tìm thấy người dùng' });
      }

      var safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        quota: user.quota,
        isUnlimited: user.isUnlimited,
        isBlocked: user.isBlocked,
        licenseKey: user.licenseKey,
        licenseExpiresAt: user.licenseExpiresAt,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt
      };

      return jsonResponse({ success: true, found: true, user: safeUser });
    }

    // 4. VERIFY LICENSE (Kiểm tra mã bản quyền khi kích hoạt — Chống dò mã & Bảo mật danh tính)
    if (action === 'verifyLicense') {
      var key = (params.key || (postData && postData.key) || '').toUpperCase().trim();
      // Chống dò mã: Kiểm tra định dạng chuẩn và độ dài tối thiểu
      if (!key || key.length < 10) {
        return jsonResponse({ success: false, valid: false, message: 'Mã bản quyền không đúng định dạng.' });
      }
      var licSheet = getOrCreateSheet(ss, 'LICENSES');
      var license = findLicenseInSheet(licSheet, key);
      if (!license) {
        return jsonResponse({ success: false, valid: false, message: 'Mã bản quyền không tồn tại' });
      }

      // Kiểm tra trạng thái mã bản quyền
      if (license.status === 'REVOKED') {
        return jsonResponse({ success: false, valid: false, message: 'Mã bản quyền này đã bị thu hồi hoặc tạm khóa.' });
      }

      if (license.expiresAt) {
        var expTime = new Date(license.expiresAt).getTime();
        if (!isNaN(expTime) && expTime < new Date().getTime()) {
          return jsonResponse({ success: false, valid: false, message: 'Mã bản quyền này đã hết hạn sử dụng.' });
        }
      }

      // BẢO MẬT: Chỉ trả về thông tin tối thiểu cần thiết để xác minh bản quyền
      // Tuyệt đối không để lộ: assignedEmail, customerNote, lý do tạo, thiết bị đã liên kết
      return jsonResponse({
        success: true,
        valid: true,
        status: license.status || 'ACTIVE',
        license: {
          key: license.key,
          plan: license.plan,
          status: license.status,
          expiresAt: license.expiresAt
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

        // BẢO VỆ TUYỆT ĐỐI ROOT ADMIN: Không bao giờ được phép xóa hoặc khóa Root Admin
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

        // BẢO VỆ AN TOÀN DỮ LIỆU: Vô hiệu hóa hoàn toàn Hard Delete qua API ở phiên bản này
        var isPermanent = Boolean((postData && postData.permanent) || params.permanent === 'true');
        if (isPermanent) {
          return jsonResponse({
            success: false,
            error: 'Thao tác xóa vĩnh viễn (Hard Delete) qua API đã bị vô hiệu hóa hoàn toàn ở phiên bản này. Vui lòng sử dụng tính năng khóa tài khoản (BLOCKED).'
          });
        }

        // MẶC ĐỊNH AN TOÀN DUY NHẤT: SOFT DELETE (Chuyển sang BLOCKED, bảo toàn 100% dữ liệu lịch sử)
        var softDeleted = softDeleteUserInSheet(usersSheet, email);
        return jsonResponse({
          success: true,
          mode: 'SOFT_DELETE_BLOCKED',
          deleted: softDeleted,
          message: 'Đã khóa tài khoản người dùng an toàn (BLOCKED).'
        });
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
        var written = saveSettingsToSheet(setSheet, postData || params);
        return jsonResponse({
          success: true,
          message: 'Đã cập nhật cấu hình hệ thống an toàn (' + written + ' khóa hợp lệ được ghi).',
          writtenCount: written
        });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 11. LIST EVALUATIONS (Kho hồ sơ cá nhân - Phân quyền riêng tư tuyệt đối)
    if (action === 'listEvaluations') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var targetEmail = String((postData && postData.userEmail) || params.userEmail || '').trim().toLowerCase();
      var operatorEmail = authResult.operatorEmail;

      // BẢO MẬT: Người dùng A tuyệt đối không xem được hồ sơ của Người dùng B
      if (targetEmail !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({
          success: false,
          error: 'Bảo mật: Không có quyền truy cập hồ sơ của tài khoản khác.'
        });
      }

      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var list = findEvaluationsInSheet(evalSheet, targetEmail);
      return jsonResponse({ success: true, evaluations: list });
    }

    // 12. CREATE EVALUATION (Tạo hồ sơ và thư mục Google Drive)
    if (action === 'createEvaluation') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalData = (postData && postData.evaluation) || {};
      var operatorEmail = authResult.operatorEmail;
      var targetEmail = String(evalData.userEmail || postData.userEmail || '').trim().toLowerCase();

      if (targetEmail !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({ success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ.' });
      }

      var lock = LockService.getScriptLock();
      try { lock.tryLock(10000); } catch (_) {}

      var createdFiles = [];
      var evalFolder = null;
      try {
        var evalId = String(evalData.id || ('eval_' + new Date().getTime()));
        var userId = String(evalData.userId || postData.userId || targetEmail);

        // Tạo thư mục Google Drive chuyên biệt
        evalFolder = getOrCreateUserEvalFolder(userId, evalId);
        evalData.driveFolderId = evalFolder.getId();

        // Lưu file Word/PDF gốc nếu có
        if (postData && postData.originalFileBase64) {
          try {
            var fileName = evalData.originalFileName || ('original_' + evalId + '.docx');
            var mime = fileName.toLowerCase().endsWith('.pdf') ? MimeType.PDF : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            var blob = Utilities.newBlob(Utilities.base64Decode(postData.originalFileBase64), mime, fileName);
            var originalFile = evalFolder.createFile(blob);
            createdFiles.push(originalFile);
            evalData.originalFileId = originalFile.getId();
          } catch (fileErr) {
            console.warn('Lỗi ghi file gốc:', fileErr);
          }
        }

        // Lưu kết quả JSON phiên bản đầu tiên nếu có
        if (postData && postData.analysisResult) {
          try {
            var jsonStr = typeof postData.analysisResult === 'string'
              ? postData.analysisResult
              : JSON.stringify(postData.analysisResult);
            var resultFile = evalFolder.createFile('evaluation_v1.json', jsonStr, MimeType.PLAIN_TEXT);
            createdFiles.push(resultFile);
            evalData.latestResultFileId = resultFile.getId();
          } catch (jsonErr) {
            console.warn('Lỗi ghi JSON v1:', jsonErr);
          }
        }

        var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
        upsertEvaluationInSheet(evalSheet, evalData);

        recordStorageAudit(ss, 'CREATE', userId, targetEmail, evalId, 'Tạo hồ sơ: ' + (evalData.title || ''), 'SUCCESS');
        return jsonResponse({ success: true, evaluation: evalData });
      } catch (saveErr) {
        // Rollback dọn dẹp file mồ côi
        for (var f = 0; f < createdFiles.length; f++) {
          try { createdFiles[f].setTrashed(true); } catch (_) {}
        }
        if (evalFolder) {
          try { evalFolder.setTrashed(true); } catch (_) {}
        }
        recordStorageAudit(ss, 'CREATE', targetEmail, targetEmail, evalData.id || '', 'Thất bại: ' + saveErr.message, 'FAILED');
        return jsonResponse({ success: false, error: 'Lỗi lưu hồ sơ vào hệ thống: ' + saveErr.message });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 13. GET EVALUATION DETAIL
    if (action === 'getEvaluation') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalId = String((postData && postData.evaluationId) || params.evaluationId || '').trim();
      var operatorEmail = authResult.operatorEmail;
      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var item = findEvaluationByIdInSheet(evalSheet, evalId);

      if (!item) {
        return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ' });
      }

      if (item.userEmail.toLowerCase() !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({ success: false, error: 'Bảo mật: Không có quyền xem hồ sơ này.' });
      }

      var analysisResult = null;
      if (item.driveFolderId) {
        try {
          var folder = DriveApp.getFolderById(item.driveFolderId);
          var vNum = item.currentVersion || 1;
          var files = folder.getFilesByName('evaluation_v' + vNum + '.json');
          if (files.hasNext()) {
            analysisResult = files.next().getBlob().getDataAsString();
          }
        } catch (_) {}
      }

      return jsonResponse({ success: true, evaluation: item, analysisResult: analysisResult });
    }

    // 14. SAVE EVALUATION RESULT
    if (action === 'saveEvaluationResult') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalId = String((postData && postData.evaluationId) || '').trim();
      var operatorEmail = authResult.operatorEmail;
      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var item = findEvaluationByIdInSheet(evalSheet, evalId);

      if (!item) {
        return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ để lưu kết quả' });
      }

      if (item.userEmail.toLowerCase() !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({ success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ.' });
      }

      var lock = LockService.getScriptLock();
      try { lock.tryLock(10000); } catch (_) {}

      try {
        var version = postData.version || item.currentVersion || 1;
        var folder = item.driveFolderId ? DriveApp.getFolderById(item.driveFolderId) : getOrCreateUserEvalFolder(item.userId, evalId);
        var jsonStr = typeof postData.analysisResult === 'string'
          ? postData.analysisResult
          : JSON.stringify(postData.analysisResult || {});

        var existingFiles = folder.getFilesByName('evaluation_v' + version + '.json');
        var resFile = null;
        if (existingFiles.hasNext()) {
          resFile = existingFiles.next();
          resFile.setContent(jsonStr);
        } else {
          resFile = folder.createFile('evaluation_v' + version + '.json', jsonStr, MimeType.PLAIN_TEXT);
        }

        item.score = postData.score !== undefined ? postData.score : item.score;
        item.status = postData.status || 'COMPLETED';
        item.updatedAt = new Date().toISOString();
        item.latestResultFileId = resFile.getId();
        if (postData.title) item.title = postData.title;

        upsertEvaluationInSheet(evalSheet, item);
        recordStorageAudit(ss, 'SAVE_RESULT', item.userId, operatorEmail, evalId, 'Lưu kết quả v' + version, 'SUCCESS');
        return jsonResponse({ success: true, latestResultFileId: resFile.getId() });
      } catch (err) {
        recordStorageAudit(ss, 'SAVE_RESULT', item.userId, operatorEmail, evalId, 'Thất bại: ' + err.message, 'FAILED');
        return jsonResponse({ success: false, error: 'Lỗi lưu kết quả: ' + err.message });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 15. CREATE EVALUATION VERSION
    if (action === 'createEvaluationVersion') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalId = String((postData && postData.evaluationId) || '').trim();
      var operatorEmail = authResult.operatorEmail;
      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var item = findEvaluationByIdInSheet(evalSheet, evalId);

      if (!item) {
        return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ để tạo phiên bản mới' });
      }

      if (item.userEmail.toLowerCase() !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({ success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ.' });
      }

      var lock = LockService.getScriptLock();
      try { lock.tryLock(10000); } catch (_) {}

      try {
        var newV = postData.version || ((item.versionCount || 1) + 1);
        var folder = item.driveFolderId ? DriveApp.getFolderById(item.driveFolderId) : getOrCreateUserEvalFolder(item.userId, evalId);
        var jsonStr = typeof postData.analysisResult === 'string'
          ? postData.analysisResult
          : JSON.stringify(postData.analysisResult || {});

        var resFile = folder.createFile('evaluation_v' + newV + '.json', jsonStr, MimeType.PLAIN_TEXT);

        item.versionCount = newV;
        item.currentVersion = newV;
        item.score = postData.score !== undefined ? postData.score : item.score;
        item.status = postData.status || 'REVISED';
        item.updatedAt = new Date().toISOString();
        item.latestResultFileId = resFile.getId();

        upsertEvaluationInSheet(evalSheet, item);
        recordStorageAudit(ss, 'NEW_VERSION', item.userId, operatorEmail, evalId, 'Tạo phiên bản v' + newV, 'SUCCESS');
        return jsonResponse({ success: true, latestResultFileId: resFile.getId(), version: newV });
      } catch (err) {
        recordStorageAudit(ss, 'NEW_VERSION', item.userId, operatorEmail, evalId, 'Thất bại: ' + err.message, 'FAILED');
        return jsonResponse({ success: false, error: 'Lỗi tạo phiên bản mới: ' + err.message });
      } finally {
        try { lock.releaseLock(); } catch (_) {}
      }
    }

    // 16. RENAME EVALUATION
    if (action === 'renameEvaluation') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalId = String((postData && postData.evaluationId) || '').trim();
      var newTitle = String((postData && postData.newTitle) || '').trim();
      var operatorEmail = authResult.operatorEmail;
      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var item = findEvaluationByIdInSheet(evalSheet, evalId);

      if (!item) {
        return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ để đổi tên' });
      }

      if (item.userEmail.toLowerCase() !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({ success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ.' });
      }

      item.title = newTitle;
      item.updatedAt = new Date().toISOString();
      upsertEvaluationInSheet(evalSheet, item);
      recordStorageAudit(ss, 'RENAME', item.userId, operatorEmail, evalId, 'Đổi tên thành: ' + newTitle, 'SUCCESS');
      return jsonResponse({ success: true });
    }

    // 17. DELETE EVALUATION
    if (action === 'deleteEvaluation') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalId = String((postData && postData.evaluationId) || '').trim();
      var operatorEmail = authResult.operatorEmail;
      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var item = findEvaluationByIdInSheet(evalSheet, evalId);

      if (!item) {
        return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ để xóa' });
      }

      if (item.userEmail.toLowerCase() !== operatorEmail && !isRootAdminEmail(operatorEmail)) {
        return jsonResponse({ success: false, error: 'Bảo mật: Quyền sở hữu không hợp lệ.' });
      }

      deleteEvaluationRowInSheet(evalSheet, evalId);

      if (item.driveFolderId) {
        try {
          DriveApp.getFolderById(item.driveFolderId).setTrashed(true);
        } catch (_) {}
      }

      recordStorageAudit(ss, 'DELETE', item.userId, operatorEmail, evalId, 'Xóa hồ sơ: ' + item.title, 'SUCCESS');
      return jsonResponse({ success: true, deleted: true });
    }

    // 18. GET STORAGE STATS
    if (action === 'getStorageStats') {
      var authResult = verifyServerAuthorization(params, postData);
      if (!authResult.authorized) {
        return jsonResponse({ success: false, error: authResult.message });
      }

      var evalSheet = getOrCreateSheet(ss, 'EVALUATIONS');
      var rowCount = Math.max(0, evalSheet.getLastRow() - 1);
      return jsonResponse({ success: true, totalEvaluations: rowCount });
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

  if (sheetType === 'EVALUATIONS') {
    var hasId = colMap['EVALUATION_ID'] !== undefined || colMap['ID'] !== undefined;
    var hasEmail = colMap['USER_EMAIL'] !== undefined || colMap['EMAIL'] !== undefined;
    var missing = [];
    if (!hasId) missing.push('EVALUATION_ID');
    if (!hasEmail) missing.push('USER_EMAIL');
    return {
      isValid: missing.length === 0,
      headers: headers,
      columnCount: headers.length,
      missing: missing
    };
  }

  if (sheetType === 'STORAGE_AUDIT') {
    var hasAuditId = colMap['AUDIT_ID'] !== undefined || colMap['ID'] !== undefined;
    var missing = [];
    if (!hasAuditId) missing.push('AUDIT_ID');
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
        'LICENSE_KEY', 'EXPIRES_AT', 'STATUS', 'CREATED_AT', 'LAST_ACTIVE_AT',
        'PRO_START_DATE', 'PRO_DURATION_MONTHS', 'PRO_END_DATE', 'PRO_STATUS', 'PRO_UPDATED_AT', 'PRO_UPDATED_BY', 'PRO_NOTE'
      ]);
      sheet.getRange(1, 1, 1, 19).setFontWeight('bold').setBackground('#f1f5f9');
    } else if (name === 'LICENSES') {
      sheet.appendRow([
        'KEY', 'PLAN', 'MAX_DEVICES', 'STATUS', 'EXPIRES_AT', 'ASSIGNED_EMAIL',
        'BOUND_DEVICES', 'NOTE', 'CREATED_AT'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f1f5f9');
    } else if (name === 'SETTINGS') {
      sheet.appendRow(['KEY', 'VALUE', 'DESCRIPTION']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f1f5f9');
    } else if (name === 'EVALUATIONS') {
      sheet.appendRow([
        'EVALUATION_ID', 'USER_ID', 'USER_EMAIL', 'TITLE', 'SUBJECT', 'GRADE_LEVEL',
        'SCORE', 'STATUS', 'VERSION_COUNT', 'CURRENT_VERSION', 'ORIGINAL_FILENAME',
        'ORIGINAL_FILE_SIZE', 'DRIVE_FOLDER_ID', 'LATEST_RESULT_FILE_ID', 'ORIGINAL_FILE_ID',
        'CREATED_AT', 'UPDATED_AT'
      ]);
      sheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#eff6ff');
    } else if (name === 'STORAGE_AUDIT') {
      sheet.appendRow([
        'AUDIT_ID', 'TIMESTAMP', 'ACTION', 'USER_ID', 'USER_EMAIL',
        'EVALUATION_ID', 'DETAILS', 'STATUS'
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f8fafc');
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

  // Plan: Chuẩn hóa mọi biến thể Pro/PRO/pro/VIP/LICENSED/PREMIUM/SCHOOL -> PRO/PREMIUM/SCHOOL
  var rawPlan = String(getVal(['PLAN', 'PACKAGE']) || '').toUpperCase().trim();
  var plan = 'TRIAL';
  if (rawPlan === 'SCHOOL' || rawPlan.indexOf('SCHOOL') !== -1) {
    plan = 'SCHOOL';
  } else if (rawPlan === 'PREMIUM' || rawPlan.indexOf('PREMIUM') !== -1) {
    plan = 'PREMIUM';
  } else if (rawPlan === 'PRO' || rawPlan.indexOf('PRO') !== -1 || rawPlan === 'LICENSED' || rawPlan === 'VIP') {
    plan = 'PRO';
  }

  // Role: Phân biệt vai trò quản trị (ADMIN), người dùng (USER/TRIAL) và quyền sử dụng (LICENSED)
  // Tuyệt đối không hiểu nhầm ROLE = USER là TRIAL nếu PLAN là PRO/SCHOOL/PREMIUM!
  var rawRole = getVal(['ROLE', 'USER_ROLE']);
  var role;
  if (rawRole) {
    var rUpper = String(rawRole).toUpperCase().trim();
    if (rUpper === 'ADMIN') {
      role = 'ADMIN';
    } else if (rUpper === 'BLOCKED') {
      role = 'BLOCKED';
    } else if (rUpper === 'FREE_ACCESS' || rUpper === 'FREE') {
      role = 'FREE_ACCESS';
    } else if (rUpper === 'LICENSED' || rUpper === 'PRO' || plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM') {
      role = 'LICENSED';
    } else {
      // rUpper là USER, TRIAL,... nhưng nếu PLAN là PRO/SCHOOL/PREMIUM thì quyền sử dụng là LICENSED
      role = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM') ? 'LICENSED' : 'TRIAL';
    }
  } else {
    // Schema 13 cột không có cột ROLE: Ánh xạ theo PLAN
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

  // Quotas: Nếu là tài khoản PRO, SCHOOL, PREMIUM hoặc role ADMIN/LICENSED -> Luôn là UNLIMITED (-1)
  var isUnlimited = (plan === 'PRO' || plan === 'SCHOOL' || plan === 'PREMIUM' || role === 'ADMIN' || role === 'LICENSED');
  var easyQuota = isUnlimited ? -1 : 3;
  var advancedQuota = isUnlimited ? -1 : 1;

  if (!isUnlimited) {
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
  }

  var licenseKey = getVal(['LICENSE_KEY', 'KEY']);
  var expiresAt = getVal(['EXPIRES_AT', 'EXPIRE_AT', 'LICENSE_EXPIRES_AT']);
  var createdAt = getVal(['CREATED_AT', 'CREATE_TIME']);
  var lastActiveAt = getVal(['LAST_ACTIVE_AT', 'LAST_USED_AT', 'ACTIVATED_AT']);

  var proStartDate = getVal(['PRO_START_DATE', 'START_DATE', 'NGAY_BAT_DAU']);
  var proDurationMonths = getVal(['PRO_DURATION_MONTHS', 'DURATION_MONTHS', 'SO_THANG']);
  var proEndDate = getVal(['PRO_END_DATE', 'END_DATE', 'NGAY_KET_THUC']);
  var proStatus = getVal(['PRO_STATUS', 'TRANG_THAI_PRO']);
  var proUpdatedAt = getVal(['PRO_UPDATED_AT', 'CAP_NHAT_LUC']);
  var proUpdatedBy = getVal(['PRO_UPDATED_BY', 'NGUOI_CAP_NHAT']);
  var proNote = getVal(['PRO_NOTE', 'GHI_CHU_PRO', 'NOTE']);

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
    proStartDate: proStartDate ? String(proStartDate) : null,
    proDurationMonths: proDurationMonths !== undefined && proDurationMonths !== '' ? Number(proDurationMonths) : null,
    proEndDate: proEndDate ? String(proEndDate) : (expiresAt ? String(expiresAt).split('T')[0] : null),
    proStatus: proStatus ? String(proStatus) : (isUnlimited ? (expiresAt && new Date(expiresAt).getTime() < new Date().getTime() ? 'EXPIRED' : 'ACTIVE') : 'NONE'),
    proUpdatedAt: proUpdatedAt ? String(proUpdatedAt) : null,
    proUpdatedBy: proUpdatedBy ? String(proUpdatedBy) : null,
    proNote: proNote ? String(proNote) : undefined,
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
  var idCol = colMap['ID'] !== undefined ? colMap['ID'] : (colMap['USER_ID'] !== undefined ? colMap['USER_ID'] : -1);
  var prevEmail = String(user.previousEmail || user.oldEmail || '').toLowerCase().trim();

  for (var r = 1; r < data.length; r++) {
    var rowEmail = String(data[r][emailCol] || '').toLowerCase().trim();
    var rowId = idCol >= 0 ? String(data[r][idCol] || '').trim() : '';
    if (rowEmail === email || (prevEmail && rowEmail === prevEmail) || (user.id && rowId && rowId === String(user.id).trim())) {
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
    // Không dùng mảng cố định 13 phần tử nếu Sheet có nhiều hơn 13 cột; bảo toàn 100% cột bổ sung
    var maxCols13 = Math.max(headers.length, existingRowValues ? existingRowValues.length : 13);
    var rowValues13 = existingRowValues ? existingRowValues.slice(0) : [];
    while (rowValues13.length < maxCols13) {
      rowValues13.push('');
    }

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

    if (colMap['PRO_START_DATE'] !== undefined) rowValues13[colMap['PRO_START_DATE']] = user.proStartDate || (parsedExisting ? parsedExisting.proStartDate : '');
    if (colMap['PRO_DURATION_MONTHS'] !== undefined) rowValues13[colMap['PRO_DURATION_MONTHS']] = user.proDurationMonths !== undefined ? user.proDurationMonths : (parsedExisting ? parsedExisting.proDurationMonths : '');
    if (colMap['PRO_END_DATE'] !== undefined) rowValues13[colMap['PRO_END_DATE']] = user.proEndDate || (parsedExisting ? parsedExisting.proEndDate : '');
    if (colMap['PRO_STATUS'] !== undefined) rowValues13[colMap['PRO_STATUS']] = user.proStatus || (parsedExisting ? parsedExisting.proStatus : '');
    if (colMap['PRO_UPDATED_AT'] !== undefined) rowValues13[colMap['PRO_UPDATED_AT']] = user.proUpdatedAt || new Date().toISOString();
    if (colMap['PRO_UPDATED_BY'] !== undefined) rowValues13[colMap['PRO_UPDATED_BY']] = user.proUpdatedBy || user.operatorEmail || 'admin';
    if (colMap['PRO_NOTE'] !== undefined) rowValues13[colMap['PRO_NOTE']] = user.proNote !== undefined ? user.proNote : (parsedExisting ? parsedExisting.proNote : '');

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

    setField(['PRO_START_DATE', 'START_DATE'], user.proStartDate !== undefined ? (user.proStartDate || '') : (parsedExisting ? (parsedExisting.proStartDate || '') : ''));
    setField(['PRO_DURATION_MONTHS', 'DURATION_MONTHS'], user.proDurationMonths !== undefined ? (user.proDurationMonths || '') : (parsedExisting ? (parsedExisting.proDurationMonths || '') : ''));
    setField(['PRO_END_DATE', 'END_DATE'], user.proEndDate !== undefined ? (user.proEndDate || '') : (parsedExisting ? (parsedExisting.proEndDate || '') : ''));
    setField(['PRO_STATUS', 'TRANG_THAI_PRO'], user.proStatus !== undefined ? user.proStatus : (parsedExisting ? (parsedExisting.proStatus || '') : ''));
    setField(['PRO_UPDATED_AT'], user.proUpdatedAt || new Date().toISOString());
    setField(['PRO_UPDATED_BY'], user.proUpdatedBy || user.operatorEmail || 'admin');
    setField(['PRO_NOTE', 'GHI_CHU_PRO'], user.proNote !== undefined ? user.proNote : (parsedExisting ? (parsedExisting.proNote || '') : ''));

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  }

  // Đảm bảo ghi bền vững ngay lập tức và đọc lại đúng dữ liệu để xác nhận
  SpreadsheetApp.flush();
  var verifiedUser = findUserInSheet(sheet, email);
  if (verifiedUser) {
    return verifiedUser;
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
    proStartDate: user.proStartDate || (parsedExisting ? parsedExisting.proStartDate : null),
    proDurationMonths: user.proDurationMonths !== undefined ? user.proDurationMonths : (parsedExisting ? parsedExisting.proDurationMonths : null),
    proEndDate: user.proEndDate || (parsedExisting ? parsedExisting.proEndDate : null),
    proStatus: user.proStatus || (parsedExisting ? parsedExisting.proStatus : 'ACTIVE'),
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

// DANH SÁCH KHÓA CẤU HÌNH ĐƯỢC PHÉP GHI VÀO SETTINGS
var ALLOWED_SETTINGS_KEYS = [
  'MAINTENANCE_MODE',
  'DEFAULT_EASY_QUOTA',
  'DEFAULT_ADVANCED_QUOTA',
  'GUEST_EASY_LIMIT',
  'GUEST_ADVANCED_LIMIT',
  'TRIAL_EASY_LIMIT',
  'TRIAL_ADVANCED_LIMIT',
  'DEFAULT_PLAN',
  'APP_VERSION',
  'ANNOUNCEMENT',
  'ANNOUNCEMENT_BANNER',
  'TRIAL_DURATION_DAYS',
  'ALLOW_NEW_REGISTRATIONS',
  'FREE_ACCESS_ENABLED',
  'FREE_ACCESS_NAME',
  'FREE_ACCESS_START',
  'FREE_ACCESS_END',
  'SUPPORT_EMAIL',
  'SYSTEM_PROMPT_VERSION',
  'MAX_UPLOAD_SIZE_MB',
  'GEMINI_MODEL_VERSION',
  'AUTO_SYNC_ENABLED',
  'MAX_DEVICES_PER_LICENSE'
];

function isSafeSettingsKey(key) {
  if (!key || typeof key !== 'string') return false;
  var upper = key.trim().toUpperCase();

  // TUYỆT ĐỐI CẤM: Không bao giờ ghi secret, token, password, credentials, operator, action
  if (upper === 'ACTION' ||
      upper === 'SERVERSECRET' ||
      upper === 'OPERATOREMAIL' ||
      upper === 'CONFIRMPERMANENT' ||
      upper.indexOf('SECRET') !== -1 ||
      upper.indexOf('PASSWORD') !== -1 ||
      upper.indexOf('TOKEN') !== -1 ||
      upper.indexOf('CREDENTIAL') !== -1 ||
      upper.indexOf('COOKIE') !== -1 ||
      upper.indexOf('OPERATOR') !== -1) {
    return false;
  }

  // Khóa phải nằm trong danh sách cho phép
  return ALLOWED_SETTINGS_KEYS.indexOf(upper) !== -1;
}

function saveSettingsToSheet(sheet, payload) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var keyCol = colMap['KEY'] !== undefined ? colMap['KEY'] : 0;
  var valCol = colMap['VALUE'] !== undefined ? colMap['VALUE'] : 1;

  var settings = (payload && typeof payload.settings === 'object' && payload.settings !== null)
    ? payload.settings
    : (payload || {});

  var writtenCount = 0;
  for (var key in settings) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      if (!isSafeSettingsKey(key)) {
        continue; // Bỏ qua hoàn toàn các khóa không được phép hoặc nhạy cảm
      }

      var normalizedKey = key.trim().toUpperCase();
      var val = settings[key];
      var data = sheet.getDataRange().getValues();
      var found = false;

      for (var r = 1; r < data.length; r++) {
        if (String(data[r][keyCol] || '').trim().toUpperCase() === normalizedKey) {
          sheet.getRange(r + 1, valCol + 1).setValue(val);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([normalizedKey, val, 'Cấu hình hệ thống']);
      }
      writtenCount++;
    }
  }
  return writtenCount;
}

// Chuẩn hóa JSON phản hồi nhất quán, không dùng status code giả lập gây lỗi Apps Script
function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// =========================================================================
// TIỆN ÍCH LƯU TRỮ HỒ SƠ EVALUATIONS & GOOGLE DRIVE
// =========================================================================

var EVALUATIONS_HEADERS = [
  'EVALUATION_ID', 'USER_ID', 'USER_EMAIL', 'TITLE', 'SUBJECT', 'GRADE_LEVEL',
  'SCORE', 'STATUS', 'VERSION_COUNT', 'CURRENT_VERSION', 'ORIGINAL_FILENAME',
  'ORIGINAL_FILE_SIZE', 'DRIVE_FOLDER_ID', 'LATEST_RESULT_FILE_ID', 'ORIGINAL_FILE_ID',
  'CREATED_AT', 'UPDATED_AT'
];

var STORAGE_AUDIT_HEADERS = [
  'AUDIT_ID', 'TIMESTAMP', 'ACTION', 'USER_ID', 'USER_EMAIL',
  'EVALUATION_ID', 'DETAILS', 'STATUS'
];

function getOrCreateStorageRootFolder() {
  var props = PropertiesService.getScriptProperties();
  var configuredFolderId = props.getProperty('DRIVE_FOLDER_ID');
  if (configuredFolderId) {
    try {
      return DriveApp.getFolderById(configuredFolderId);
    } catch (_) {}
  }

  var folders = DriveApp.getFoldersByName('SKKN_REVIEW_PRO_STORAGE');
  if (folders.hasNext()) {
    var f = folders.next();
    try { props.setProperty('DRIVE_FOLDER_ID', f.getId()); } catch (_) {}
    return f;
  }

  var newRoot = DriveApp.createFolder('SKKN_REVIEW_PRO_STORAGE');
  try { props.setProperty('DRIVE_FOLDER_ID', newRoot.getId()); } catch (_) {}
  return newRoot;
}

function getOrCreateUserEvalFolder(userId, evalId) {
  var root = getOrCreateStorageRootFolder();
  var usersFolders = root.getFoldersByName('users');
  var usersFolder = usersFolders.hasNext() ? usersFolders.next() : root.createFolder('users');

  var cleanUserFolderId = String(userId || 'default_user').replace(/[^a-zA-Z0-9._-]/g, '_');
  var uFolders = usersFolder.getFoldersByName(cleanUserFolderId);
  var userFolder = uFolders.hasNext() ? uFolders.next() : usersFolder.createFolder(cleanUserFolderId);

  var cleanEvalId = String(evalId).replace(/[^a-zA-Z0-9._-]/g, '_');
  var eFolders = userFolder.getFoldersByName(cleanEvalId);
  var evalFolder = eFolders.hasNext() ? eFolders.next() : userFolder.createFolder(cleanEvalId);

  return evalFolder;
}

function recordStorageAudit(ss, action, userId, userEmail, evalId, details, status) {
  try {
    var auditSheet = getOrCreateSheet(ss, 'STORAGE_AUDIT');
    if (auditSheet.getLastRow() === 0) {
      auditSheet.appendRow(STORAGE_AUDIT_HEADERS);
    }
    var auditId = 'audit_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    var now = new Date().toISOString();
    auditSheet.appendRow([
      auditId,
      now,
      action,
      userId,
      userEmail,
      evalId,
      details,
      status || 'SUCCESS'
    ]);
  } catch (_) {}
}

function findEvaluationsInSheet(sheet, userEmail) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var emailCol = colMap['USER_EMAIL'] !== undefined ? colMap['USER_EMAIL'] : (colMap['EMAIL'] !== undefined ? colMap['EMAIL'] : 2);
  var data = sheet.getDataRange().getValues();
  var list = [];
  var cleanTarget = String(userEmail || '').toLowerCase().trim();

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var rowEmail = String(row[emailCol] || '').toLowerCase().trim();
    if (rowEmail === cleanTarget) {
      list.push(parseEvaluationRow(row, colMap));
    }
  }
  return list;
}

function findEvaluationByIdInSheet(sheet, evalId) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var idCol = colMap['EVALUATION_ID'] !== undefined ? colMap['EVALUATION_ID'] : (colMap['ID'] !== undefined ? colMap['ID'] : 0);
  var data = sheet.getDataRange().getValues();
  var target = String(evalId || '').trim();

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (String(row[idCol] || '').trim() === target) {
      return parseEvaluationRow(row, colMap);
    }
  }
  return null;
}

function parseEvaluationRow(row, colMap) {
  function getVal(key, def) {
    var idx = colMap[key];
    if (idx !== undefined && row[idx] !== undefined && row[idx] !== '') {
      return row[idx];
    }
    return def;
  }

  return {
    id: String(getVal('EVALUATION_ID', getVal('ID', ''))),
    userId: String(getVal('USER_ID', '')),
    userEmail: String(getVal('USER_EMAIL', getVal('EMAIL', ''))),
    title: String(getVal('TITLE', '')),
    subject: String(getVal('SUBJECT', 'Chung')),
    gradeLevel: String(getVal('GRADE_LEVEL', '')),
    score: Number(getVal('SCORE', 0)),
    status: String(getVal('STATUS', 'COMPLETED')),
    versionCount: Number(getVal('VERSION_COUNT', 1)),
    currentVersion: Number(getVal('CURRENT_VERSION', 1)),
    originalFileName: String(getVal('ORIGINAL_FILENAME', '')),
    originalFileSize: Number(getVal('ORIGINAL_FILE_SIZE', 0)),
    driveFolderId: String(getVal('DRIVE_FOLDER_ID', '')),
    latestResultFileId: String(getVal('LATEST_RESULT_FILE_ID', '')),
    originalFileId: String(getVal('ORIGINAL_FILE_ID', '')),
    createdAt: String(getVal('CREATED_AT', '')),
    updatedAt: String(getVal('UPDATED_AT', ''))
  };
}

function upsertEvaluationInSheet(sheet, item) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var idCol = colMap['EVALUATION_ID'] !== undefined ? colMap['EVALUATION_ID'] : (colMap['ID'] !== undefined ? colMap['ID'] : 0);
  var data = sheet.getDataRange().getValues();
  var targetId = String(item.id || '').trim();
  var targetRowIdx = -1;

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol] || '').trim() === targetId) {
      targetRowIdx = r + 1; // 1-based index in Sheet
      break;
    }
  }

  var rowValues = [
    item.id,
    item.userId || item.userEmail,
    item.userEmail,
    item.title || '',
    item.subject || 'Chung',
    item.gradeLevel || '',
    item.score || 0,
    item.status || 'COMPLETED',
    item.versionCount || 1,
    item.currentVersion || 1,
    item.originalFileName || '',
    item.originalFileSize || 0,
    item.driveFolderId || '',
    item.latestResultFileId || '',
    item.originalFileId || '',
    item.createdAt || new Date().toISOString(),
    item.updatedAt || new Date().toISOString()
  ];

  if (targetRowIdx > 0) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteEvaluationRowInSheet(sheet, evalId) {
  var headers = getSheetHeaders(sheet);
  var colMap = createColumnIndexMap(headers);
  var idCol = colMap['EVALUATION_ID'] !== undefined ? colMap['EVALUATION_ID'] : (colMap['ID'] !== undefined ? colMap['ID'] : 0);
  var data = sheet.getDataRange().getValues();
  var target = String(evalId || '').trim();

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol] || '').trim() === target) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

