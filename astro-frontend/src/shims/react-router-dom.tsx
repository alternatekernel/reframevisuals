import React, { useEffect, useMemo, useState } from 'react';

let ssrPath = '/';
export const setSsrPath = (p: string) => { ssrPath = p; };

type To = string | { pathname?: string; search?: string; hash?: string };
const toHref = (to: To) => (typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}${to.hash ?? ''}`);

export const Link = React.forwardRef<HTMLAnchorElement, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: To; replace?: boolean; state?: unknown; reloadDocument?: boolean }>(
  ({ to, replace: _r, state: _s, reloadDocument: _d, ...rest }, ref) => <a ref={ref} href={toHref(to)} {...rest} />
);
Link.displayName = 'Link';
export const NavLink = Link;

export const useNavigate = () =>
  useMemo(
    () => (to: To | number, opts?: { replace?: boolean }) => {
      if (typeof to === 'number') return window.history.go(to);
      const href = toHref(to);
      if (opts?.replace) window.location.replace(href);
      else window.location.assign(href);
    },
    []
  );

export const useLocation = () => {
  const [loc, setLoc] = useState({ pathname: typeof window !== 'undefined' ? window.location.pathname : ssrPath, search: typeof window !== 'undefined' ? window.location.search : '', hash: typeof window !== 'undefined' ? window.location.hash : '', state: null as unknown, key: 'default' });
  useEffect(() => {
    const sync = () => setLoc((l) => ({ ...l, pathname: window.location.pathname, search: window.location.search, hash: window.location.hash }));
    sync();
    document.addEventListener('astro:page-load', sync);
    window.addEventListener('popstate', sync);
    return () => {
      document.removeEventListener('astro:page-load', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  return loc;
};

export const useSearchParams = (): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] => {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const set = (next: URLSearchParams | Record<string, string>) => {
    const qs = new URLSearchParams(next as Record<string, string>).toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  };
  return [params, set];
};

export const Navigate: React.FC<{ to: To; replace?: boolean }> = ({ to, replace }) => {
  useEffect(() => {
    const href = toHref(to);
    if (replace) window.location.replace(href);
    else window.location.assign(href);
  }, [to, replace]);
  return null;
};
