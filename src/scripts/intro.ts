/**
 * The first-visit intro on the home page (components/Intro.astro). The <head>
 * script decides whether it should show and sets html.intro-pending.
 */
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { getLenis } from './smooth-scroll';

gsap.registerPlugin(MorphSVGPlugin);

const SEEN_KEY = 'intro-seen';
/** How long before the end of the intro the page content starts animating in. */
const OVERLAP = 0.55;

let timeline: gsap.core.Timeline | null = null;

function markSeen(): void {
	try {
		sessionStorage.setItem(SEEN_KEY, '1');
	} catch {
		// Storage blocked: the intro shows again on the next full page load.
	}
}

/**
 * Plays the intro if this page has one and it is pending, and returns the
 * number of seconds the page's own entrance animations should wait.
 * Whatever page the visitor lands on first, the intro is then marked as seen.
 */
export function playIntro(): number {
	const root = document.documentElement;
	const intro = document.querySelector<HTMLElement>('[data-intro]');
	const pending = root.classList.contains('intro-pending');
	markSeen();

	const mark = intro?.querySelector<SVGSVGElement>('.intro__mark');
	const shape = intro?.querySelector<SVGPathElement>('[data-intro-shape]');
	const chars = intro?.querySelectorAll<HTMLElement>('.intro__char');
	if (!intro || !pending || !mark || !shape || !chars?.length) {
		root.classList.remove('intro-pending');
		intro?.remove();
		return 0;
	}

	// The script is running, so the CSS failsafe that hides the overlay at 6 s
	// (Intro.astro) must not cut the intro short.
	intro.style.animation = 'none';
	const lenis = getLenis();
	lenis?.stop();
	const finish = (): void => {
		intro.remove();
		root.classList.remove('intro-pending');
		lenis?.start();
		timeline = null;
	};

	timeline = gsap
		.timeline({ onComplete: finish })
		.fromTo(mark, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' })
		.to(shape, { morphSVG: shape.dataset.to ?? '', duration: 0.7, ease: 'expo.inOut' })
		.fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.03 }, '-=0.4')
		.to(intro, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '+=0.3');

	return Math.max(0, timeline.duration() - OVERLAP);
}

/** Stops the intro if the visitor navigates away while it is playing. */
export function killIntro(): void {
	timeline?.kill();
	timeline = null;
	getLenis()?.start();
}
