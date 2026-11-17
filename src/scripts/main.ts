/**
 * Page lifecycle. Astro's <ClientRouter /> swaps pages without a full reload,
 * so everything is set up per page and torn down around each swap.
 *
 * - The first page is set up as soon as this module runs. Astro only fires
 *   astro:page-load for it on window `load`, which waits for every font and
 *   image and so can arrive seconds later.
 * - After each swap, astro:page-load sets up the new page.
 * - setUp() runs at most once per <body>: Astro can fire astro:page-load for a
 *   page that is already set up (the first document's late `load` after a
 *   quick navigation), and nothing may be set up while a swap is in progress.
 */
import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';
import { destroyAnimations, initAnimations } from './animations';
import { killIntro, playIntro } from './intro';
import { initMenu } from './menu';
import { destroySmoothScroll, initSmoothScroll } from './smooth-scroll';

declare global {
	interface Window {
		/** Failsafe timers started in BaseLayout's <head> script. */
		siteFailsafeTimers?: number[];
	}
}

let page: AbortController | null = null;
let setUpBody: HTMLElement | null = null;
let swapping = false;
let isFirstPage = true;

/** Stops listeners and the intro. Safe to call at any time. */
function stopPage(): void {
	page?.abort();
	page = null;
	killIntro();
}

/** Reverts every animation and Lenis. Safe to call at any time. */
function revertPage(): void {
	destroyAnimations();
	destroySmoothScroll();
	setUpBody = null;
}

function setUp(): void {
	if (swapping || setUpBody === document.body) return;
	stopPage();
	revertPage();
	page = new AbortController();
	setUpBody = document.body;

	const root = document.documentElement;
	// If the failsafe already revealed the page (slow load), don't hide content
	// the visitor can already see just to animate it in again.
	const late = isFirstPage && root.classList.contains('anim-ready');
	if (isFirstPage) window.siteFailsafeTimers?.forEach((id) => clearTimeout(id));

	try {
		initSmoothScroll(page.signal);
		initMenu(page.signal);
		const heroDelay = isFirstPage && !late ? playIntro() : skipIntro();
		initAnimations({ heroDelay, entrances: !late });
	} catch (error) {
		console.error('[site] Animations failed to start; showing the page without them.', error);
		stopPage();
		revertPage();
		skipIntro();
		setUpBody = document.body; // don't retry on this page
	} finally {
		root.classList.add('anim-ready');
		isFirstPage = false;
	}
}

function skipIntro(): number {
	document.documentElement.classList.remove('intro-pending');
	document.querySelector('[data-intro]')?.remove();
	return 0;
}

document.addEventListener('astro:before-swap', (event) => {
	swapping = true;
	stopPage();
	// The incoming page's <html> attributes replace ours. Keep `js` so its
	// elements stay hidden until setUp() has prepared their animations.
	const next = (event as TransitionBeforeSwapEvent).newDocument.documentElement;
	next.classList.remove('no-js');
	next.classList.add('js');
});

// Revert only once the old page is detached: in browsers without native view
// transitions the old page is still on screen, fading out, at before-swap.
document.addEventListener('astro:after-swap', () => {
	revertPage();
	swapping = false;
});

document.addEventListener('astro:page-load', setUp);

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', setUp, { once: true });
} else {
	setUp();
}
