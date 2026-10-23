import {
  findUserByEmailOrId,
  getOrCreateGuest,
  consumeQuota,
  createAdminSession,
  verifyAdminSessionToken,
  verifyGoogleIdToken,
  ROOT_ADMIN_EMAILS
} from '../../src/server/authStore';
import {
  listUserEvaluations,
  createEvaluationRecord,
  getEvaluationDetail,
  saveEvaluationResultRecord,
  createEvaluationVersionRecord,
  renameEvaluationRecord,
  deleteEvaluationRecord,
  getStorageStatsData
} from '../../src/server/evaluationStore';
import { extractSubpath, getRequestBody, handleCors } from './_lib/routeHelper';

function getAuthenticatedUser(req: any, body?: any): { email: string; userId: string; isAdmin: boolean } | null {
  const authHeader = req.headers['authorization'] || '';
  const sessionHeader = req.headers['x-session-token'] || '';
  const googleHeader = req.headers['x-google-credential'] || '';
  const tokenCandidate = authHeader || sessionHeader || googleHeader;

  if (tokenCandidate) {
    const verifiedSession = verifyAdminSessionToken(tokenCandidate);
    if (verifiedSession) {
      const u = findUserByEmailOrId(verifiedSession.email);
      const isRoot = ROOT_ADMIN_EMAILS.includes(verifiedSession.email.toLowerCase());
      return {
        email: verifiedSession.email.toLowerCase(),
        userId: u?.id || verifiedSession.email.toLowerCase(),
        isAdmin: isRoot || verifiedSession.role === 'ADMIN',
      };
    }

    const verifiedGoogle = verifyGoogleIdToken(tokenCandidate);
    if (verifiedGoogle) {
      const u = findUserByEmailOrId(verifiedGoogle.email);
      const isRoot = ROOT_ADMIN_EMAILS.includes(verifiedGoogle.email.toLowerCase());
      return {
        email: verifiedGoogle.email.toLowerCase(),
        userId: u?.id || verifiedGoogle.email.toLowerCase(),
        isAdmin: isRoot || u?.role === 'ADMIN',
      };
    }
  }

  // Fallback kiểm tra tài khoản đã tồn tại trong store hoặc Root Admin
  const candidateEmail = String(req.headers['x-user-email'] || req.query?.email || body?.email || '').toLowerCase().trim();
  if (candidateEmail && candidateEmail.includes('@')) {
    const isRoot = ROOT_ADMIN_EMAILS.includes(candidateEmail);
    if (isRoot) {
      const u = findUserByEmailOrId(candidateEmail);
      return {
        email: candidateEmail,
        userId: u?.id || 'admin_6461746869',
        isAdmin: true,
      };
    }
    const u = findUserByEmailOrId(candidateEmail);
    if (u?.isBlocked || u?.role === 'BLOCKED') {
      return null;
    }
    return {
      email: candidateEmail,
      userId: u?.id || candidateEmail,
      isAdmin: u?.role === 'ADMIN',
    };
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  const rawSubpath = extractSubpath(req, '/api/user');
  const subpath = (typeof rawSubpath === 'string' ? rawSubpath : '').replace(/^\/+|\/+$/g, '');
  const body = getRequestBody(req);

  // GET /api/user/status
  if (subpath === 'status' || subpath === '') {
    const { guestId, email, userId } = req.query || {};
    const reqIdentifier = String(email || userId || body?.email || body?.userId || '').toLowerCase().trim();

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
          quota: user.quota,
        });
      }
    }

    const gId = String(guestId || body?.guestId || 'guest_default');
    const guest = getOrCreateGuest(gId);
    return res.status(200).json({
      isLoggedIn: false,
      guestId: guest.guestId,
      role: 'GUEST',
      plan: 'GUEST',
      quota: guest.quota,
    });
  }

  // POST /api/user/guest-init
  if (subpath === 'guest-init') {
    try {
      const guestId = body?.guestId || req.query?.guestId;
      const guest = getOrCreateGuest(guestId);
      return res.status(200).json({ success: true, guest });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/consume-quota
  if (subpath === 'consume-quota') {
    try {
      const { guestId, email, userId, mode = 'easy' } = body || {};
      const result = consumeQuota({ guestId, email, userId, mode });
      if (!result.allowed) {
        return res.status(403).json(result);
      }
      return res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ==========================================
  // CÁC TUYẾN ĐƯỜNG KHO HỒ SƠ CÁ NHÂN (EVALUATIONS)
  // ==========================================

  // GET /api/user/evaluations hoặc /api/user/evaluations/list
  if (subpath === 'evaluations' || subpath === 'evaluations/list') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập để truy cập kho hồ sơ' });
      }
      const evaluations = await listUserEvaluations(auth.email, auth.userId);
      return res.status(200).json({ success: true, evaluations });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/evaluations/create
  if (subpath === 'evaluations/create') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập để tạo hồ sơ' });
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
        title: title || 'Hồ sơ Sáng kiến kinh nghiệm',
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
        analysisResult,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET hoặc POST /api/user/evaluations/get
  if (subpath === 'evaluations/get') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập để xem hồ sơ' });
      }
      const evalId = String(req.query?.id || body?.id || body?.evaluationId || '');
      if (!evalId) {
        return res.status(400).json({ error: 'Thiếu mã hồ sơ (id)' });
      }
      const result = await getEvaluationDetail(evalId, auth.email);
      if (!result.success) {
        const isForbidden = result.error?.includes('Bảo mật') || result.error?.includes('quyền');
        return res.status(isForbidden ? 403 : 404).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/evaluations/save-result
  if (subpath === 'evaluations/save-result') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập để lưu kết quả hồ sơ' });
      }
      const { evaluationId, analysisResult, title, subject, score, draftText, changeSet, customProposals } = body || {};
      if (!evaluationId || !analysisResult) {
        return res.status(400).json({ error: 'Thiếu mã hồ sơ hoặc kết quả phân tích' });
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
      });
      if (!result.success) {
        const isForbidden = result.error?.includes('Bảo mật');
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/evaluations/new-version
  if (subpath === 'evaluations/new-version') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
      }
      const { evaluationId, newAnalysisResult, newScore, notes } = body || {};
      if (!evaluationId || !newAnalysisResult) {
        return res.status(400).json({ error: 'Thiếu mã hồ sơ hoặc kết quả phiên bản mới' });
      }
      const result = await createEvaluationVersionRecord({
        evaluationId,
        userEmail: auth.email,
        newAnalysisResult,
        newScore,
        notes,
      });
      if (!result.success) {
        const isForbidden = result.error?.includes('Bảo mật');
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/evaluations/rename
  if (subpath === 'evaluations/rename') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
      }
      const { evaluationId, newTitle } = body || {};
      if (!evaluationId || !newTitle) {
        return res.status(400).json({ error: 'Thiếu mã hồ sơ hoặc tên mới' });
      }
      const result = await renameEvaluationRecord({
        evaluationId,
        userEmail: auth.email,
        newTitle,
      });
      if (!result.success) {
        const isForbidden = result.error?.includes('Bảo mật');
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/user/evaluations/delete
  if (subpath === 'evaluations/delete') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
      }
      const { evaluationId } = body || {};
      if (!evaluationId) {
        return res.status(400).json({ error: 'Thiếu mã hồ sơ cần xóa' });
      }
      const result = await deleteEvaluationRecord({
        evaluationId,
        userEmail: auth.email,
      });
      if (!result.success) {
        const isForbidden = result.error?.includes('Bảo mật');
        return res.status(isForbidden ? 403 : 400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/user/evaluations/stats
  if (subpath === 'evaluations/stats') {
    try {
      const auth = getAuthenticatedUser(req, body);
      if (!auth) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
      }
      const stats = await getStorageStatsData(auth.email);
      return res.status(200).json({ success: true, stats });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: `Tuyến đường người dùng không tồn tại: /api/user/${subpath}` });
}
