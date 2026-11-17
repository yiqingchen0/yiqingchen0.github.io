export interface AuthorPart {
	text: string;
	isOwner: boolean;
}

const ET_AL = 'et al.';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toList = (names: string | readonly string[]): string[] =>
	(typeof names === 'string' ? [names] : [...names]).map((name) => name.trim()).filter((name) => name !== '');

/**
 * Splits an author list into plain text and occurrences of the owner's name,
 * so they can be emphasised. Matches whole names only: "Chen Y" matches in
 * "Chen Y, Lee K" but not in "Chen YZ". Pass every form of the name used in
 * your papers, e.g. ['Chen Y', 'Chen YE'].
 */
export function splitAuthors(authors: string, ownerNames: string | readonly string[]): AuthorPart[] {
	const names = toList(ownerNames).sort((a, b) => b.length - a.length);
	if (names.length === 0) return [{ text: authors, isOwner: false }];
	const alternatives = names.map(escapeRegExp).join('|');
	const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${alternatives})(?![\\p{L}\\p{N}])`, 'u');
	return authors
		.split(pattern)
		.map((text, i) => ({ text, isOwner: i % 2 === 1 }))
		.filter((part) => part.text !== '');
}

/**
 * Shortens a comma-separated author list longer than `max` names to the first
 * few authors, the owner (if they come later) and "et al.", so long
 * consortium papers stay readable without hiding the owner's position.
 */
export function abbreviateAuthors(authors: string, ownerNames: string | readonly string[], max = 10): string {
	const parts = authors
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part !== '');
	const names = parts.at(-1) === ET_AL ? parts.slice(0, -1) : parts;
	if (names.length <= max) return authors;

	const keep = Math.max(1, max - 3);
	const owners = new Set(toList(ownerNames));
	const ownerIndex = names.findIndex((name) => owners.has(name));
	const head = names.slice(0, keep);
	const shown = ownerIndex >= keep ? [...head, '…', names[ownerIndex]] : head;
	return [...shown, ET_AL].join(', ');
}
