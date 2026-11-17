import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), href: z.url() });

/**
 * One Markdown file per project, directly in src/content/research/ (not in
 * subfolders: the file name becomes the page's URL, /research/<file-name>/).
 */
const research = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/research' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		period: z.string(),
		/** Shown only when set. */
		status: z.enum(['ongoing', 'completed']).optional(),
		/** Supervisors or collaborators, shown as "With". */
		collaborators: z.string().optional(),
		tags: z.array(z.string()).default([]),
		/** Lower numbers are listed first. */
		order: z.number().default(0),
		links: z.array(link).default([]),
	}),
});

/**
 * All publications in one file: src/data/publications.yaml. Astro skips an
 * entry with a missing id and lets a repeated id overwrite the earlier entry
 * without failing the build; src/data/publications.test.ts catches both.
 */
const publications = defineCollection({
	loader: file('src/data/publications.yaml'),
	schema: z.object({
		title: z.string(),
		authors: z.string(),
		venue: z.string(),
		/** Volume, issue and pages or article number, e.g. "122(1):31-42". */
		details: z.string().optional(),
		year: z.number().int(),
		/**
		 * article: peer-reviewed journal paper; conference: full proceedings paper;
		 * abstract: meeting abstract; manuscript: submitted or under review.
		 */
		type: z
			.enum(['article', 'preprint', 'conference', 'abstract', 'chapter', 'software', 'manuscript'])
			.default('article'),
		doi: z.string().optional(),
		url: z.url().optional(),
		/** Shown in the "Selected publications" list on the home page. */
		featured: z.boolean().default(false),
	}),
});

/**
 * A lab, handout or other resource for a course. `href` is either a full URL
 * or a file in public/, written from the site root (public/teaching/x.html is
 * "/teaching/x.html"); src/content/teaching.test.ts checks the file exists.
 */
const material = z.object({
	title: z.string(),
	description: z.string().optional(),
	href: z.union([z.url(), z.string().regex(/^\/(?!\/)/, 'Start a site path with a single "/"')]),
	/** Where it sits in the course, e.g. "Module 8". */
	module: z.string().optional(),
	kind: z.string().default('Interactive lab'),
});

/**
 * One Markdown file per course, directly in src/content/teaching/. Each course
 * gets a page of its own at /teaching/<file-name>/, which lists its materials.
 */
const teaching = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/teaching' }),
	schema: z.object({
		title: z.string(),
		code: z.string().optional(),
		institution: z.string(),
		role: z.string(),
		terms: z.array(z.string()).default([]),
		level: z.string().optional(),
		order: z.number().default(0),
		materials: z.array(material).default([]),
	}),
});

export const collections = { research, publications, teaching };
