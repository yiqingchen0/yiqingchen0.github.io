import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// Astro's file() loader drops an entry without an id and lets a repeated id
// overwrite the earlier entry, with only a log message. Fail loudly instead.
const raw: unknown = parse(readFileSync(new URL('./publications.yaml', import.meta.url), 'utf8'));

describe('src/data/publications.yaml', () => {
	it('is a list of entries', () => {
		expect(Array.isArray(raw)).toBe(true);
	});

	const entries = Array.isArray(raw) ? (raw as unknown[]) : [];
	const ids = entries.map((entry) =>
		typeof entry === 'object' && entry !== null && 'id' in entry ? String(entry.id ?? '').trim() : '',
	);

	it('gives every entry an id', () => {
		const missing = ids.flatMap((id, i) => (id === '' ? [`entry ${i + 1}`] : []));
		expect(missing, `entries without an id: ${missing.join(', ')}`).toEqual([]);
	});

	it('uses each id only once', () => {
		const duplicates = ids.filter((id, i) => id !== '' && ids.indexOf(id) !== i);
		expect(duplicates, `repeated ids: ${duplicates.join(', ')}`).toEqual([]);
	});
});
