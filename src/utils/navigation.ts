export type ActiveTab = 
  | 'my_evaluations'
  | 'dashboard'
  | 'rubric'
  | 'red_team'
  | 'novelty'
  | 'evidence'
  | 'data_logic'
  | 'ai_markers'
  | 'similarity_citations'
  | 'suggestions'
  | 'council'
  | 'rescore'
  | 'report';

export interface RouteDefinition {
  path: string;
  tab: ActiveTab;
  title: string;
}

export const CLEAN_ROUTES: RouteDefinition[] = [
  { path: '/ho-so', tab: 'my_evaluations', title: 'Hồ sơ của tôi' },
  { path: '/tong-quan', tab: 'dashboard', title: 'Tổng quan' },
  { path: '/can-xu-ly', tab: 'red_team', title: 'Cần xử lý' },
  { path: '/goi-y-chinh-sua', tab: 'suggestions', title: 'Gợi ý sửa & hoàn thiện' },
  { path: '/cham-lai', tab: 'rescore', title: 'Chấm lại' },
  { path: '/bao-cao', tab: 'report', title: 'Báo cáo' },
  { path: '/quan-tri', tab: 'dashboard', title: 'Quản trị' },
  // Các module chuyên sâu
  { path: '/tieu-chi', tab: 'rubric', title: 'Chấm Rubric' },
  { path: '/tinh-moi', tab: 'novelty', title: 'Tính mới' },
  { path: '/minh-chung', tab: 'evidence', title: 'Minh chứng' },
  { path: '/so-lieu-logic', tab: 'data_logic', title: 'Số liệu & Logic' },
  { path: '/dau-hieu-ai', tab: 'ai_markers', title: 'Dấu hiệu AI' },
  { path: '/trung-lap-trich-dan', tab: 'similarity_citations', title: 'Nguồn & Trích dẫn' },
  { path: '/hoi-dong', tab: 'council', title: 'Hội đồng giả lập' },
];

export const VALID_CLEAN_PATHS = new Set([
  '/',
  '/ho-so',
  '/tong-quan',
  '/can-xu-ly',
  '/goi-y-chinh-sua',
  '/cham-lai',
  '/bao-cao',
  '/quan-tri',
  '/tieu-chi',
  '/tinh-moi',
  '/minh-chung',
  '/so-lieu-logic',
  '/dau-hieu-ai',
  '/trung-lap-trich-dan',
  '/hoi-dong',
]);

/**
 * Trích xuất ActiveTab từ clean pathname
 */
export function getTabFromPath(pathname: string): ActiveTab {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/tong-quan') return 'dashboard';
  const found = CLEAN_ROUTES.find(r => r.path === clean);
  return found ? found.tab : 'dashboard';
}

/**
 * Lấy clean pathname từ ActiveTab
 */
export function getPathFromTab(tab: ActiveTab): string {
  if (tab === 'dashboard') return '/tong-quan';
  const found = CLEAN_ROUTES.find(r => r.tab === tab);
  return found ? found.path : '/tong-quan';
}

/**
 * Xử lý di chuyển và chuẩn hóa URL cũ có query string (?tab=...&evalId=...)
 * sang Clean URL (/cham-lai, /ho-so, /tong-quan...)
 */
export function migrateLegacyUrl(): {
  migratedTab: ActiveTab;
  migratedEvalId: string | null;
  migratedIssueId: string | null;
  migratedTier: 'light' | 'academic' | 'deep';
  cleanPath: string;
} {
  if (typeof window === 'undefined') {
    return {
      migratedTab: 'dashboard',
      migratedEvalId: null,
      migratedIssueId: null,
      migratedTier: 'academic',
      cleanPath: '/',
    };
  }

  const pathname = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);

  const oldTab = params.get('tab') as ActiveTab | null;
  const oldEvalId = params.get('evalId');
  const oldIssueId = params.get('issueId');
  const oldTier = params.get('tier') as 'light' | 'academic' | 'deep' | null;

  let evalId: string | null = null;
  if (oldEvalId && oldEvalId.trim()) {
    evalId = oldEvalId.trim();
    try {
      sessionStorage.setItem('skkn_active_eval_id', evalId);
      localStorage.setItem('skkn_active_eval_id', evalId);
    } catch (_) {}
  } else {
    try {
      evalId = sessionStorage.getItem('skkn_active_eval_id') || localStorage.getItem('skkn_active_eval_id') || null;
    } catch (_) {}
  }

  let tab: ActiveTab = 'dashboard';
  let cleanPath = pathname;

  if (oldTab) {
    tab = oldTab;
    cleanPath = getPathFromTab(oldTab);
  } else if (pathname === '/quan-tri') {
    tab = 'dashboard';
    cleanPath = '/quan-tri';
  } else if (pathname === '/') {
    tab = 'dashboard';
    cleanPath = '/';
  } else {
    tab = getTabFromPath(pathname);
    cleanPath = pathname;
  }

  const issueId = oldIssueId && oldIssueId.trim() ? oldIssueId.trim() : null;
  const tier = (oldTier === 'light' || oldTier === 'academic' || oldTier === 'deep') ? oldTier : 'academic';

  // Nếu URL đang chứa query string, lập tức loại bỏ bằng history.replaceState
  if (window.location.search) {
    try {
      window.history.replaceState({}, '', cleanPath);
    } catch (_) {}
  }

  return {
    migratedTab: tab,
    migratedEvalId: evalId,
    migratedIssueId: issueId,
    migratedTier: tier,
    cleanPath,
  };
}
