const ADMIN_LAST_ROUTE_KEY = 'uid_admin_last_route';

export function saveAdminRoute(pathname: string) {
  if (pathname.startsWith('/admin')) {
    localStorage.setItem(ADMIN_LAST_ROUTE_KEY, pathname);
  }
}

export function getSavedAdminRoute(): string | null {
  const saved = localStorage.getItem(ADMIN_LAST_ROUTE_KEY);
  if (saved?.startsWith('/admin')) return saved;
  return null;
}

export function resolveAdminLoginRedirect(searchRedirect: string | null): string {
  if (searchRedirect?.startsWith('/admin')) return searchRedirect;
  return getSavedAdminRoute() ?? '/admin';
}
