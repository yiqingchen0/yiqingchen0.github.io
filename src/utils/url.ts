const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

/** Prefixes a site path with the configured base, e.g. '/about/' -> '/repo/about/'. */
export function withBase(path: string): string {
	if (EXTERNAL.test(path)) return path;
	const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
	return `${base}/${path.replace(/^\/+/, '')}`;
}

/** True when `pathname` is the page for `href` or one of its child pages. */
export function isActive(pathname: string, href: string): boolean {
	const target = withBase(href).replace(/\/+$/, '');
	const current = pathname.replace(/\/+$/, '');
	return current === target || current.startsWith(`${target}/`);
}
