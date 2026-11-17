import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { finalizeLabRelease, LAB_ASSETS } from '../../scripts/finalize-statsense.mjs';
import { releaseAction, releaseUrl } from '../../public/teaching/pheb-602/statsense-lab/update-check.js';

const directories: string[] = [];
afterEach(async () => {
	await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('StatSense release updates', () => {
	it('refreshes cached HTML on entry when a newer release exists', () => {
		expect(releaseAction({ current: 'old', latest: 'new', attempted: null, initial: true, interacted: false })).toBe('reload');
	});

	it('notifies instead of interrupting an active assessment', () => {
		expect(releaseAction({ current: 'old', latest: 'new', attempted: null, initial: false, interacted: false })).toBe('notify');
		expect(releaseAction({ current: 'old', latest: 'new', attempted: null, initial: true, interacted: true })).toBe('notify');
	});

	it('avoids repeated redirects if an edge still returns old HTML', () => {
		expect(releaseAction({ current: 'old', latest: 'new', attempted: 'new', initial: true, interacted: false })).toBe('notify');
		expect(releaseAction({ current: 'new', latest: 'new', attempted: 'new', initial: true, interacted: false })).toBe('none');
	});

	it('keeps the original path, other query parameters and fragment when refreshing', () => {
		expect(releaseUrl('https://example.test/lab/index.html?course=602#answers', 'new')).toBe(
			'https://example.test/lab/index.html?course=602&_lab_release=new#answers',
		);
	});

	it('changes cached resource URLs when files change and produces stable release metadata', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'statsense-release-'));
		directories.push(directory);
		const source = '<meta name="statsense-release" content="development">' + LAB_ASSETS.map((asset) => `<script src="${asset}?v=old"></script>`).join('');
		await writeFile(join(directory, 'index.html'), source);
		await Promise.all(LAB_ASSETS.map((asset) => writeFile(join(directory, asset), `original ${asset}`)));
		const original = await finalizeLabRelease(directory);
		const firstHtml = await readFile(join(directory, 'index.html'), 'utf8');
		expect(firstHtml).not.toContain('?v=old');
		expect(firstHtml).toContain(`content="${original}"`);
		expect(await finalizeLabRelease(directory)).toBe(original);
		await writeFile(join(directory, 'style.css'), 'updated green score button');
		const updated = await finalizeLabRelease(directory);
		expect(updated).not.toBe(original);
		expect(await readFile(join(directory, 'index.html'), 'utf8')).not.toBe(firstHtml);
		expect(JSON.parse(await readFile(join(directory, 'release.json'), 'utf8'))).toEqual({ version: updated });
	});
});
