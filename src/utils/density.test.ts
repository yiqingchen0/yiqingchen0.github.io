import { describe, expect, it } from 'vitest';
import { DISTRIBUTIONS, PLOT_BOX, buildCurve, gammaPdf, mixturePdf, normalPdf, type Pdf } from './density';

/** Composite Simpson's rule on [a, b] with n (even) intervals. */
function integrate(f: Pdf, a: number, b: number, n = 2000): number {
	const h = (b - a) / n;
	let sum = f(a) + f(b);
	for (let i = 1; i < n; i++) sum += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
	return (sum * h) / 3;
}

// The box the home-page figure actually uses.
const box = PLOT_BOX;

describe('normalPdf', () => {
	it('peaks at 1 / (σ√(2π)) at the mean', () => {
		expect(normalPdf(5, 1.2)(5)).toBeCloseTo(1 / (1.2 * Math.sqrt(2 * Math.PI)), 12);
	});

	it('integrates to 1', () => {
		expect(integrate(normalPdf(5, 1.2), -10, 20)).toBeCloseTo(1, 6);
	});

	it('rejects a non-positive sd', () => {
		expect(() => normalPdf(0, 0)).toThrow(RangeError);
	});
});

describe('gammaPdf', () => {
	it('matches x e^(-x/θ) / θ² for shape 2', () => {
		const theta = 1.2;
		expect(gammaPdf(2, theta)(3)).toBeCloseTo((3 * Math.exp(-3 / theta)) / theta ** 2, 12);
	});

	it('integrates to 1 and is zero for x ≤ 0', () => {
		expect(integrate(gammaPdf(3, 0.8), 0, 60)).toBeCloseTo(1, 6);
		expect(gammaPdf(2, 1)(0)).toBe(0);
		expect(gammaPdf(2, 1)(-1)).toBe(0);
	});

	it('rejects non-integer shapes and non-positive scales', () => {
		expect(() => gammaPdf(2.5, 1)).toThrow(RangeError);
		expect(() => gammaPdf(0, 1)).toThrow(RangeError);
		expect(() => gammaPdf(2, 0)).toThrow(RangeError);
	});
});

describe('mixturePdf', () => {
	it('integrates to 1', () => {
		const pdf = mixturePdf([
			{ weight: 0.3, pdf: normalPdf(2, 1) },
			{ weight: 0.7, pdf: normalPdf(6, 0.5) },
		]);
		expect(integrate(pdf, -10, 20)).toBeCloseTo(1, 6);
	});

	it('rejects weights that do not sum to 1', () => {
		expect(() => mixturePdf([{ weight: 0.6, pdf: normalPdf(0, 1) }])).toThrow(RangeError);
	});

	it('rejects negative or non-finite weights even when they sum to 1', () => {
		expect(() =>
			mixturePdf([
				{ weight: 1.5, pdf: normalPdf(3, 0.5) },
				{ weight: -0.5, pdf: normalPdf(3, 1) },
			]),
		).toThrow(RangeError);
		expect(() =>
			mixturePdf([
				{ weight: Number.NaN, pdf: normalPdf(0, 1) },
				{ weight: 1, pdf: normalPdf(0, 1) },
			]),
		).toThrow(RangeError);
	});
});

describe('DISTRIBUTIONS on the plotted range', () => {
	it.each(DISTRIBUTIONS.map((d) => [d.id, d] as const))('%s keeps almost all its mass in [0, 10]', (_, dist) => {
		expect(integrate(dist.pdf, box.xMin, box.xMax)).toBeGreaterThan(0.98);
	});

	it.each(DISTRIBUTIONS.map((d) => [d.id, d] as const))('%s fits under the shared y maximum', (_, dist) => {
		const peak = Math.max(...Array.from({ length: 1001 }, (_, i) => dist.pdf((i / 1000) * 10)));
		expect(peak).toBeLessThan(box.yMax);
	});
});

describe('buildCurve', () => {
	const numbers = (path: string): number => (path.match(/-?\d+\.\d+/g) ?? []).length;

	it('gives every curve the same path structure, so they can be tweened point by point', () => {
		const curves = DISTRIBUTIONS.map((d) => buildCurve(d, box));
		const commands = (path: string) => path.replace(/-?\d+\.\d+/g, '#');
		for (const curve of curves) {
			expect(commands(curve.line)).toBe(commands(curves[0].line));
			expect(commands(curve.area)).toBe(commands(curves[0].area));
		}
		expect(numbers(curves[0].line)).toBe(2 * (box.samples + 1));
	});

	it('maps density 0 to the bottom and yMax to the top of the box', () => {
		const flat = (value: number) => buildCurve({ id: 'flat', label: '', pdf: () => value }, box);
		expect(flat(0).line.startsWith(`M0.00,${box.height.toFixed(2)}`)).toBe(true);
		expect(flat(box.yMax).line.startsWith('M0.00,0.00')).toBe(true);
	});

	it('closes the area along the baseline', () => {
		const { area } = buildCurve(DISTRIBUTIONS[0], box);
		expect(area.endsWith(`L${box.width.toFixed(2)},${box.height.toFixed(2)}L0.00,${box.height.toFixed(2)}Z`)).toBe(
			true,
		);
	});
});
