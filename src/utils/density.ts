/**
 * Probability density curves for the home-page figure. Every curve is drawn
 * on the same x range and the same vertical scale, so the areas are
 * comparable, and every path has the same number of points, so a linear
 * tween between two of them passes only through valid mixture densities
 * (1 - t) f + t g.
 */

export type Pdf = (x: number) => number;

export interface Distribution {
	id: string;
	label: string;
	pdf: Pdf;
}

export interface PlotBox {
	width: number;
	height: number;
	xMin: number;
	xMax: number;
	/** Density value mapped to the top of the box. */
	yMax: number;
	/** Number of intervals; the path has samples + 1 points. */
	samples: number;
}

export interface Curve {
	id: string;
	label: string;
	line: string;
	area: string;
}

const SQRT_2PI = Math.sqrt(2 * Math.PI);

export function normalPdf(mean: number, sd: number): Pdf {
	if (sd <= 0) throw new RangeError(`Normal sd must be positive, got ${sd}`);
	return (x) => Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * SQRT_2PI);
}

function factorial(n: number): number {
	return n <= 1 ? 1 : n * factorial(n - 1);
}

/** Gamma(shape k, scale θ). Integer shapes only, so Γ(k) = (k − 1)!. */
export function gammaPdf(shape: number, scale: number): Pdf {
	if (!Number.isInteger(shape) || shape < 1) {
		throw new RangeError(`Gamma shape must be a positive integer, got ${shape}`);
	}
	if (scale <= 0) throw new RangeError(`Gamma scale must be positive, got ${scale}`);
	const norm = factorial(shape - 1) * scale ** shape;
	return (x) => (x <= 0 ? 0 : (x ** (shape - 1) * Math.exp(-x / scale)) / norm);
}

export function mixturePdf(components: ReadonlyArray<{ weight: number; pdf: Pdf }>): Pdf {
	if (components.some((c) => !Number.isFinite(c.weight) || c.weight < 0)) {
		throw new RangeError('Mixture weights must be finite and non-negative');
	}
	const total = components.reduce((sum, c) => sum + c.weight, 0);
	if (Math.abs(total - 1) > 1e-9) throw new RangeError(`Mixture weights must sum to 1, got ${total}`);
	return (x) => components.reduce((sum, c) => sum + c.weight * c.pdf(x), 0);
}

/** The home-page figure's box. Every curve in DISTRIBUTIONS must peak below yMax (see the tests). */
export const PLOT_BOX: PlotBox = { width: 1000, height: 320, xMin: 0, xMax: 10, yMax: 0.36, samples: 160 };

export const DISTRIBUTIONS: readonly Distribution[] = [
	{ id: 'normal', label: 'Normal · μ = 5, σ = 1.2', pdf: normalPdf(5, 1.2) },
	{ id: 'gamma', label: 'Gamma · shape = 2, scale = 1.2', pdf: gammaPdf(2, 1.2) },
	{
		id: 'mixture',
		label: 'Mixture · ½ N(3.4, 0.8²) + ½ N(6.6, 0.9²)',
		pdf: mixturePdf([
			{ weight: 0.5, pdf: normalPdf(3.4, 0.8) },
			{ weight: 0.5, pdf: normalPdf(6.6, 0.9) },
		]),
	},
	{ id: 'wide', label: 'Normal · μ = 5, σ = 2', pdf: normalPdf(5, 2) },
];

function toPoints(pdf: Pdf, box: PlotBox): ReadonlyArray<readonly [number, number]> {
	return Array.from({ length: box.samples + 1 }, (_, i) => {
		const x = box.xMin + (i / box.samples) * (box.xMax - box.xMin);
		const px = (i / box.samples) * box.width;
		const py = box.height - (pdf(x) / box.yMax) * box.height;
		return [px, Math.max(0, py)] as const;
	});
}

const fmt = (n: number) => n.toFixed(2);

export function buildCurve(dist: Distribution, box: PlotBox): Curve {
	const points = toPoints(dist.pdf, box);
	const line = `M${points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join('L')}`;
	const area = `${line}L${fmt(box.width)},${fmt(box.height)}L0.00,${fmt(box.height)}Z`;
	return { id: dist.id, label: dist.label, line, area };
}
