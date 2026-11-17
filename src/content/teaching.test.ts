import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// A material whose href starts with "/" points at a file in public/. Astro
// copies public/ as it is and never checks these links, so a renamed or
// missing lab would only show up as a 404 on the live site.
const courseDir = new URL('./teaching/', import.meta.url);
const publicDir = new URL('../../public/', import.meta.url);

interface Link {
	course: string;
	href: string;
}

function frontmatter(source: string): unknown {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
	return match ? parse(match[1]) : {};
}

function sitePaths(course: string, data: unknown): Link[] {
	if (typeof data !== 'object' || data === null || !('materials' in data) || !Array.isArray(data.materials)) return [];
	return data.materials.flatMap((material: unknown) =>
		typeof material === 'object' &&
		material !== null &&
		'href' in material &&
		typeof material.href === 'string' &&
		material.href.startsWith('/')
			? [{ course, href: material.href }]
			: [],
	);
}

function isPublicFile(href: string): boolean {
	const path = decodeURI(href.replace(/[?#].*$/, '').slice(1));
	try {
		return statSync(new URL(path, publicDir)).isFile();
	} catch {
		return false;
	}
}

const links = readdirSync(courseDir)
	.filter((name) => name.endsWith('.md'))
	.flatMap((name) => sitePaths(name, frontmatter(readFileSync(new URL(name, courseDir), 'utf8'))));

describe('src/content/teaching/*.md materials', () => {
	it('link only to files that exist in public/', () => {
		const missing = links.filter(({ href }) => !isPublicFile(href)).map(({ course, href }) => `${course}: ${href}`);
		expect(missing, `missing files: ${missing.join(', ')}`).toEqual([]);
	});
});
