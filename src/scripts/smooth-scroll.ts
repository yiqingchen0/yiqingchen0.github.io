/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis
 * read the same scroll position on every frame. Skipped entirely when the
 * visitor prefers reduced motion.
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

function onTick(time: number): void {
	lenis?.raf(time * 1000);
}

function focusTarget(target: HTMLElement): void {
	if (!target.matches('a, button, input, select, textarea, [tabindex]')) {
		target.setAttribute('tabindex', '-1');
	}
	target.focus({ preventScroll: true });
}

/**
 * Same-page links (#contact, #top) scroll smoothly through Lenis. The listener
 * runs in the capture phase so it gets the click before Astro's router, which
 * would otherwise jump to the fragment instantly. Lenis subtracts the sticky
 * header itself, via html's scroll-padding-top.
 *
 * While Lenis is stopped (intro, open menu) its scrollTo() does nothing, so the
 * click is left to the browser and the router.
 */
function onAnchorClick(event: MouseEvent): void {
	if (!lenis || lenis.isStopped || event.defaultPrevented || event.button !== 0) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
	if (!(link instanceof HTMLAnchorElement) || !link.hash) return;
	const url = new URL(link.href);
	if (url.origin !== location.origin || url.pathname !== location.pathname) return;
	const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
	if (!target) return;
	event.preventDefault();
	// Move focus now rather than when the scroll ends: a wheel or touch during
	// the scroll replaces it, and its onComplete would never run.
	focusTarget(target);
	lenis.scrollTo(target === document.body ? 0 : target);
}

export function initSmoothScroll(signal: AbortSignal): void {
	if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	lenis = new Lenis({ autoRaf: false });
	lenis.on('scroll', ScrollTrigger.update);
	gsap.ticker.add(onTick);
	gsap.ticker.lagSmoothing(0);
	document.addEventListener('click', onAnchorClick, { capture: true, signal });
}

export function destroySmoothScroll(): void {
	if (!lenis) return;
	gsap.ticker.remove(onTick);
	lenis.destroy();
	lenis = null;
}

export function getLenis(): Lenis | null {
	return lenis;
}
