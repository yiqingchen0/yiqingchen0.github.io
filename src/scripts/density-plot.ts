/**
 * Animates the home-page density figure (components/DensityPlot.astro).
 * All curves share one point grid, so tweening the path's `d` attribute
 * moves each point vertically: every in-between frame is itself a mixture
 * density (1 - t) f + t g, never an arbitrary shape.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

interface CurveData {
	label: string;
	line: string;
	area: string;
}

/** Seconds each curve is held before the next morph. */
const HOLD = 1.8;
const MORPH = 1.4;

function isCurveData(value: unknown): value is CurveData {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return typeof v.label === 'string' && typeof v.line === 'string' && typeof v.area === 'string';
}

function readCurves(figure: HTMLElement): CurveData[] {
	try {
		const parsed: unknown = JSON.parse(figure.dataset.curves ?? '[]');
		return Array.isArray(parsed) ? parsed.filter(isCurveData) : [];
	} catch (error) {
		console.error('[density-plot] Could not read curve data', error);
		return [];
	}
}

export interface DensityPlotOptions {
	/** Seconds before the entrance and the loop start. */
	delay: number;
	/** Wipe the plot in; false when it is already on screen. */
	entrance: boolean;
}

/** Call inside a gsap.matchMedia() context; everything it creates is reverted with it. */
export function initDensityPlot({ delay, entrance }: DensityPlotOptions): void {
	const figure = document.querySelector<HTMLElement>('[data-density]');
	if (!figure) return;
	const plot = figure.querySelector<HTMLElement>('[data-density-plot]');
	const area = figure.querySelector<SVGPathElement>('[data-density-area]');
	const line = figure.querySelector<SVGPathElement>('[data-density-line]');
	const label = figure.querySelector<HTMLElement>('[data-density-label]');
	const curves = readCurves(figure);
	if (!plot || !area || !line || !label || curves.length < 2) return;

	if (entrance) {
		// Wipe the plot in from the left.
		gsap.fromTo(
			plot,
			{ clipPath: 'inset(0% 100% 0% 0%)' },
			{ clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', delay },
		);
	}

	const cycle = gsap.timeline({ repeat: -1, paused: true, defaults: { duration: MORPH, ease: 'power2.inOut' } });
	curves.forEach((_, i) => {
		const next = curves[(i + 1) % curves.length];
		cycle
			.to(area, { attr: { d: next.area } }, `+=${HOLD}`)
			.to(line, { attr: { d: next.line } }, '<')
			.to(label, { duration: 0.9, scrambleText: { text: next.label, chars: '0123456789', speed: 0.6 } }, '<');
	});

	// Only run the loop while the figure is on screen, and not before the entrance is done.
	let started = false;
	const trigger = ScrollTrigger.create({
		trigger: figure,
		start: 'top bottom',
		end: 'bottom top',
		onToggle: (self) => {
			if (!started) return;
			if (self.isActive) cycle.play();
			else cycle.pause();
		},
	});
	gsap.delayedCall(delay + 1, () => {
		started = true;
		if (trigger.isActive) cycle.play();
	});
}
