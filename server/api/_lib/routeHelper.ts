/**
 * SKKN REVIEW PRO - Serverless Route Helper
 * Resolves subpaths from Vercel rewrites, raw URLs, or request headers
 */

export function extractSubpath(req: any, basePath: string): string {
  // 1. Check query parameter from Vercel rewrite (?__subpath=...)
  const querySubpath = req.query?.__subpath ?? req.query?.subpath ?? req.query?.path ?? req.query?.route;
  if (querySubpath !== undefined && querySubpath !== null && querySubpath !== '') {
    const raw = Array.isArray(querySubpath) ? querySubpath.join('/') : String(querySubpath);
    const cleaned = raw.replace(/^\/+|\/+$/g, '');
    if (cleaned) return cleaned;
  }

  const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;

  // 2. Check req.originalUrl (Express or local dev proxy)
  if (typeof req.originalUrl === 'string') {
    const pathname = req.originalUrl.split('?')[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
      if (sub) return sub;
    }
  }

  // 3. Check req.url
  if (typeof req.url === 'string') {
    const pathname = req.url.split('?')[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
      if (sub) return sub;
    }
    // Also handle case when req.url has prefix stripped by middleware mount (e.g. /evaluations/list)
    const stripped = pathname.replace(/^\/+|\/+$/g, '');
    if (stripped && !stripped.startsWith('api/')) {
      return stripped;
    }
  }

  // 4. Check headers passed by Edge / Reverse Proxies
  const headerKeys = ['x-matched-path', 'x-forwarded-uri', 'x-original-uri', 'x-rewrite-url'];
  for (const key of headerKeys) {
    const val = req.headers?.[key];
    if (typeof val === 'string') {
      const pathname = val.split('?')[0];
      if (pathname.startsWith(prefix)) {
        const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
        if (sub) return sub;
      }
    }
  }

  return '';
}

export function getRequestBody(req: any): any {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export function handleCors(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-email, x-user-id, x-session-token, x-google-credential');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function parseGeminiError(error: any): { status: number; code: string; message: string } {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = error?.message || 'Lỗi xử lý AI';

  if (typeof error?.status === 'number') {
    status = error.status;
  } else if (typeof error?.statusCode === 'number') {
    status = error.statusCode;
  } else if (typeof error?.code === 'number') {
    status = error.code;
  }

  const rawStr = typeof error?.message === 'string' ? error.message : JSON.stringify(error || {});

  // Try extracting inner JSON error e.g. {"error":{"code":503,"status":"UNAVAILABLE",...}}
  const jsonMatch = rawStr.match(/\{[\s\S]*"code"\s*:\s*(\d+)[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.code) status = Number(parsed.error.code);
      if (parsed.error?.status) code = String(parsed.error.status);
      if (parsed.error?.message) message = parsed.error.message;
    } catch (_) {}
  } else {
    if (rawStr.includes('503') || rawStr.includes('UNAVAILABLE') || rawStr.includes('high demand') || rawStr.includes('overloaded')) {
      status = 503;
      code = 'UNAVAILABLE';
    } else if (rawStr.includes('429') || rawStr.includes('RESOURCE_EXHAUSTED') || rawStr.includes('quota')) {
      status = 429;
      code = 'RESOURCE_EXHAUSTED';
    } else if (rawStr.includes('400') || rawStr.includes('INVALID_ARGUMENT')) {
      status = 400;
      code = 'INVALID_ARGUMENT';
    } else if (rawStr.includes('401') || rawStr.includes('403') || rawStr.includes('API_KEY') || rawStr.includes('PERMISSION_DENIED')) {
      status = 403;
      code = 'PERMISSION_DENIED';
    }
  }

  return { status, code, message };
}

