// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL and BASE_PATH are filled in by the GitHub Pages workflow
// (.github/workflows/deploy.yml), so the same build works for
// <user>.github.io, <user>.github.io/<repo> and a custom domain.
// Locally both are unset and the site is served from the root.
const site = process.env.SITE_URL || undefined;
const base = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
	site,
	base,
});
