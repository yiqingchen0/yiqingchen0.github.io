import { describe, expect, it } from 'vitest';
import { circlePath, markPath } from './mark';

const points = (path: string): Array<[number, number]> =>
	[...path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe('markPath', () => {
	const curve = points(markPath).slice(1, -1);

	it('samples x = 0…32 and closes below the curve', () => {
		expect(curve.map(([x]) => x)).toEqual(Array.from({ length: 33 }, (_, i) => i));
		expect(markPath.startsWith('M0,29')).toBe(true);
		expect(markPath.endsWith('L32,29Z')).toBe(true);
	});

	it('peaks at the centre and is symmetric', () => {
		const ys = curve.map(([, y]) => y);
		expect(Math.min(...ys)).toBe(ys[16]);
		expect(ys[16]).toBeCloseTo(5, 2);
		for (let i = 0; i < 16; i++) expect(ys[i]).toBeCloseTo(ys[32 - i], 2);
	});

	it('stays inside the 32 × 32 box', () => {
		for (const [x, y] of points(markPath)) {
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThanOrEqual(32);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(32);
		}
	});
});

describe('circlePath', () => {
	it('is a closed radius-10 circle centred in the box', () => {
		expect(circlePath).toBe('M6,16a10,10 0 1,0 20,0a10,10 0 1,0 -20,0Z');
	});
});
