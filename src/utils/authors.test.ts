import { describe, expect, it } from 'vitest';
import { abbreviateAuthors, splitAuthors } from './authors';

const owners = (authors: string, name: string | string[]) =>
	splitAuthors(authors, name)
		.filter((part) => part.isOwner)
		.map((part) => part.text);

describe('splitAuthors', () => {
	it('marks the owner wherever they appear', () => {
		expect(splitAuthors('Lee K, Chen Y, Park J', 'Chen Y')).toEqual([
			{ text: 'Lee K, ', isOwner: false },
			{ text: 'Chen Y', isOwner: true },
			{ text: ', Park J', isOwner: false },
		]);
		expect(owners('Chen Y, Lee K', 'Chen Y')).toEqual(['Chen Y']);
		expect(owners('Lee K, Chen Y', 'Chen Y')).toEqual(['Chen Y']);
	});

	it('does not match a longer name that starts or ends the same way', () => {
		expect(owners('Chen YZ, Lee K', 'Chen Y')).toEqual([]);
		expect(owners('Xchen Y', 'chen Y')).toEqual([]);
	});

	it('matches any of several forms of the name, preferring the longest', () => {
		expect(owners('Mehanna M, Chen YE, Gong Y', ['Chen Y', 'Chen YE'])).toEqual(['Chen YE']);
		expect(owners('Chen Y, Lee K, Chen YE', ['Chen Y', 'Chen YE'])).toEqual(['Chen Y', 'Chen YE']);
		expect(owners('Chen YZ, Lee K', ['Chen Y', 'Chen YE'])).toEqual([]);
	});

	it('keeps the full text when the owner is absent or no name is given', () => {
		expect(splitAuthors('Lee K, Park J', 'Chen Y')).toEqual([{ text: 'Lee K, Park J', isOwner: false }]);
		expect(splitAuthors('Lee K', '  ')).toEqual([{ text: 'Lee K', isOwner: false }]);
		expect(splitAuthors('Lee K', [])).toEqual([{ text: 'Lee K', isOwner: false }]);
	});

	it('treats regex characters in the name literally', () => {
		expect(owners('Chen Y., Lee K', 'Chen Y.')).toEqual(['Chen Y.']);
		expect(owners('ChenAY, Lee K', 'Chen.Y')).toEqual([]);
	});

	it('round-trips the original string', () => {
		const authors = 'Chen Y, Lee K, Chen Y';
		expect(
			splitAuthors(authors, 'Chen Y')
				.map((p) => p.text)
				.join(''),
		).toBe(authors);
	});
});

describe('abbreviateAuthors', () => {
	const many = (n: number) => Array.from({ length: n }, (_, i) => `Author${i + 1} A`);

	it('leaves lists of up to `max` names unchanged', () => {
		const authors = many(10).join(', ');
		expect(abbreviateAuthors(authors, 'Chen Y', 10)).toBe(authors);
		expect(abbreviateAuthors('Lee K, Chen Y, et al.', 'Chen Y', 10)).toBe('Lee K, Chen Y, et al.');
	});

	it('keeps the first names and the owner when the owner comes later', () => {
		const names = many(20);
		const withOwner = [...names.slice(0, 12), 'Chen Y', ...names.slice(12)].join(', ');
		expect(abbreviateAuthors(withOwner, ['Chen Y'], 10)).toBe(
			`${names.slice(0, 7).join(', ')}, …, Chen Y, et al.`,
		);
	});

	it('does not repeat the owner when they are among the first names', () => {
		const authors = ['Chen Y', ...many(15)].join(', ');
		expect(abbreviateAuthors(authors, 'Chen Y', 10)).toBe(`Chen Y, ${many(6).join(', ')}, et al.`);
	});

	it('counts an existing "et al." only once', () => {
		const authors = [...many(12), 'et al.'].join(', ');
		expect(abbreviateAuthors(authors, 'Chen Y', 10)).toBe(`${many(7).join(', ')}, et al.`);
	});
});
