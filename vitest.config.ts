import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/utils/**/*.ts'],
			// content.ts only wraps Astro's content API and is covered by the build.
			exclude: ['src/utils/**/*.test.ts', 'src/utils/content.ts'],
			thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
		},
	},
});
