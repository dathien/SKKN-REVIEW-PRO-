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

  // 2. Check req.url
  if (typeof req.url === 'string') {
    const pathname = req.url.split('?')[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
      if (sub) return sub;
    }
  }

  // 3. Check req.originalUrl (Express or local dev proxy)
  if (typeof req.originalUrl === 'string') {
    const pathname = req.originalUrl.split('?')[0];
    if (pathname.startsWith(prefix)) {
      const sub = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
      if (sub) return sub;
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-email, x-user-id');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
