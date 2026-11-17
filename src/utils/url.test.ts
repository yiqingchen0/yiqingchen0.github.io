import { afterEach, describe, expect, it, vi } from 'vitest';
import { isActive, withBase } from './url';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('withBase', () => {
	it('leaves paths alone when the site is served from the root', () => {
		vi.stubEnv('BASE_URL', '/');
		expect(withBase('/about/')).toBe('/about/');
		expect(withBase('about/')).toBe('/about/');
		expect(withBase('/')).toBe('/');
	});

	it.each(['/repo', '/repo/'])('prefixes the base %s exactly once', (base) => {
		vi.stubEnv('BASE_URL', base);
		expect(withBase('/about/')).toBe('/repo/about/');
		expect(withBase('/')).toBe('/repo/');
		expect(withBase('/favicon.svg')).toBe('/repo/favicon.svg');
	});

	it('does not touch external, mailto and fragment links', () => {
		vi.stubEnv('BASE_URL', '/repo/');
		expect(withBase('https://doi.org/10.1000/x')).toBe('https://doi.org/10.1000/x');
		expect(withBase('mailto:a@example.com')).toBe('mailto:a@example.com');
		expect(withBase('#contact')).toBe('#contact');
		expect(withBase('//cdn.example.com/a.js')).toBe('//cdn.example.com/a.js');
	});
});

describe('isActive', () => {
	it('matches the page and its children, with or without a trailing slash', () => {
		vi.stubEnv('BASE_URL', '/');
		expect(isActive('/research/', '/research/')).toBe(true);
		expect(isActive('/research', '/research/')).toBe(true);
		expect(isActive('/research/project-one/', '/research/')).toBe(true);
	});

	it('does not match a different page that shares a prefix', () => {
		vi.stubEnv('BASE_URL', '/');
		expect(isActive('/researchers/', '/research/')).toBe(false);
		expect(isActive('/about/', '/research/')).toBe(false);
	});

	it('accounts for the base path', () => {
		vi.stubEnv('BASE_URL', '/repo/');
		expect(isActive('/repo/teaching/', '/teaching/')).toBe(true);
		expect(isActive('/teaching/', '/teaching/')).toBe(false);
	});
});
