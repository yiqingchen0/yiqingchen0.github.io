import { describe, expect, it } from 'vitest';
import { groupByYear, indexLabel } from './list';

const item = (id: string, year: number) => ({ id, data: { year } });

describe('groupByYear', () => {
	it('groups newest year first and keeps the order within a year', () => {
		const items = [item('a', 2024), item('b', 2026), item('c', 2024), item('d', 2025)];
		expect(groupByYear(items).map((g) => [g.year, g.items.map((i) => i.id)])).toEqual([
			[2026, ['b']],
			[2025, ['d']],
			[2024, ['a', 'c']],
		]);
	});

	it('returns no groups for no items and does not modify its input', () => {
		expect(groupByYear([])).toEqual([]);
		const items = Object.freeze([item('a', 2020), item('b', 2021)]);
		expect(() => groupByYear(items)).not.toThrow();
		expect(items.map((i) => i.id)).toEqual(['a', 'b']);
	});
});

describe('indexLabel', () => {
	it('is one-based and zero-padded to two digits', () => {
		expect(indexLabel(0)).toBe('01');
		expect(indexLabel(8)).toBe('09');
		expect(indexLabel(11)).toBe('12');
		expect(indexLabel(99)).toBe('100');
	});
});
