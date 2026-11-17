/**
 * Scroll and entrance animations, driven by data attributes in the markup:
 *
 *   data-split          heading whose lines slide up out of a mask
 *   data-reveal         element that fades and rises into place
 *   data-line           hairline that draws in from the left
 *   data-scramble       link whose [data-scramble-text] scrambles on hover
 *   data-density        the home-page density figure (see density-plot.ts)
 *
 * Inside an element with data-hero, these run on page load (after the intro)
 * instead of on scroll. Everything is created inside one gsap.matchMedia()
 * context, so it only runs when motion is allowed and is reverted (inline
 * styles, split text, ScrollTriggers) by destroyAnimations().
 *
 * Start and end values are always given explicitly (fromTo, set + to): the
 * global CSS hides these elements until the scripts are ready, so a from()
 * tween would read that hidden state as its end value.
 */
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { initDensityPlot } from './density-plot';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const STAGGER = 0.08;
const HEADING_START = 'top 88%';
const ITEM_START = 'top 92%';
const RULE_START = 'top 96%';

let media: gsap.MatchMedia | null = null;

const inHero = (el: Element): boolean => el.closest('[data-hero]') !== null;

/**
 * Calls `reveal` once, the first time `el` reaches `start`, and also if the
 * visitor jumps past it (an in-page link, a fast fling) or the page opens
 * scrolled below it, so nothing is left hidden.
 */
function revealWhenSeen(el: Element, start: string, reveal: () => void): void {
	let done = false;
	let trigger: ScrollTrigger | null = null;
	const run = (): void => {
		if (done) return;
		done = true;
		trigger?.kill();
		reveal();
	};
	// The callbacks can fire while create() is still running, before `trigger` is assigned.
	trigger = ScrollTrigger.create({ trigger: el, start, end: 'bottom top', onEnter: run, onLeave: run, onEnterBack: run });
	if (done) trigger.kill();
	else if (el.getBoundingClientRect().bottom < 0) run();
}

/** Like revealWhenSeen, but elements revealed in the same frame animate together with a stagger. */
function revealInBatches(items: readonly HTMLElement[], start: string, animate: (batch: HTMLElement[]) => void): void {
	let pending: HTMLElement[] = [];
	const flush = (): void => {
		const batch = pending;
		pending = [];
		animate(batch);
	};
	items.forEach((el) =>
		revealWhenSeen(el, start, () => {
			if (pending.length === 0) gsap.delayedCall(0, flush);
			pending = [...pending, el];
		}),
	);
}

function splitHeadings(heroDelay: number): void {
	document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
		const hero = inHero(el);
		let revealed = hero;
		let tween: gsap.core.Tween | null = null;
		SplitText.create(el, {
			type: 'lines',
			mask: 'lines',
			linesClass: 'split-line',
			autoSplit: true,
			// Runs again whenever the text re-wraps; SplitText carries the
			// returned tween's progress over to the new one.
			onSplit: (self) => {
				tween = gsap.fromTo(
					self.lines,
					{ yPercent: 110 },
					{
						yPercent: 0,
						duration: 1.1,
						ease: 'expo.out',
						stagger: STAGGER,
						delay: hero ? heroDelay : 0,
						paused: !revealed,
					},
				);
				return tween;
			},
		});
		if (!hero) {
			revealWhenSeen(el, HEADING_START, () => {
				revealed = true;
				tween?.play();
			});
		}
	});
}

function fadeIns(heroDelay: number): void {
	const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
	const from = { opacity: 0, y: 24 };
	const to = { opacity: 1, y: 0, ease: 'power3.out' };
	gsap.set(items, from);

	const heroItems = items.filter(inHero);
	if (heroItems.length > 0) {
		gsap.to(heroItems, { ...to, duration: 1, stagger: STAGGER, delay: heroDelay + 0.35 });
	}

	revealInBatches(
		items.filter((el) => !inHero(el)),
		ITEM_START,
		(batch) => gsap.to(batch, { ...to, duration: 0.9, stagger: 0.07 }),
	);
}

function drawRules(heroDelay: number): void {
	const rules = gsap.utils.toArray<HTMLElement>('[data-line]');
	const from = { scaleX: 0, transformOrigin: 'left center' };
	const to = { scaleX: 1, duration: 1.4, ease: 'expo.inOut' };
	gsap.set(rules, from);

	const heroRules = rules.filter(inHero);
	if (heroRules.length > 0) gsap.to(heroRules, { ...to, delay: heroDelay });

	revealInBatches(
		rules.filter((el) => !inHero(el)),
		RULE_START,
		(batch) => gsap.to(batch, { ...to, stagger: 0.06 }),
	);
}

function scrambleOnHover(signal: AbortSignal): void {
	document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
		const target = el.querySelector<HTMLElement>('[data-scramble-text]') ?? el;
		const text = target.textContent ?? '';
		el.addEventListener(
			'pointerenter',
			() => gsap.to(target, { duration: 0.6, scrambleText: { text, chars: '01', speed: 0.8 }, overwrite: true }),
			{ signal },
		);
	});
}

export interface AnimationOptions {
	/** Seconds the on-load (data-hero) entrances wait, e.g. for the intro. */
	heroDelay: number;
	/**
	 * Hide and animate content in. False when the page is already visible
	 * (it loaded slowly and the failsafe revealed it): only the ambient
	 * motion and hover effects run then.
	 */
	entrances: boolean;
}

export function initAnimations({ heroDelay, entrances }: AnimationOptions): void {
	media = gsap.matchMedia();
	media.add('(prefers-reduced-motion: no-preference)', () => {
		const listeners = new AbortController();
		if (entrances) {
			splitHeadings(heroDelay);
			fadeIns(heroDelay);
			drawRules(heroDelay);
		}
		initDensityPlot({ delay: heroDelay, entrance: entrances });
		scrambleOnHover(listeners.signal);
		return () => listeners.abort();
	});
	// Web fonts change line heights; re-measure once they have loaded.
	document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export function destroyAnimations(): void {
	media?.revert();
	media = null;
}
