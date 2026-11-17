import { getCollection, type CollectionEntry } from 'astro:content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type ResearchEntry = CollectionEntry<'research'>;
export type PublicationEntry = CollectionEntry<'publications'>;
export type TeachingEntry = CollectionEntry<'teaching'>;

interface Ordered {
	data: { order: number; title: string };
}

const byOrderThenTitle = (a: Ordered, b: Ordered): number =>
	a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export async function getResearch(): Promise<ResearchEntry[]> {
	const entries = await getCollection('research');
	return [...entries].sort(byOrderThenTitle);
}

export async function getTeaching(): Promise<TeachingEntry[]> {
	const entries = await getCollection('teaching');
	return [...entries].sort(byOrderThenTitle);
}

/** Newest first; titles break ties so the order is stable between builds. */
export async function getPublications(): Promise<PublicationEntry[]> {
	const entries = await getCollection('publications');
	return [...entries].sort((a, b) => b.data.year - a.data.year || a.data.title.localeCompare(b.data.title));
}

/** True when public/cv.pdf exists, checked at build time. */
export const hasCv = existsSync(join(process.cwd(), 'public', 'cv.pdf'));
