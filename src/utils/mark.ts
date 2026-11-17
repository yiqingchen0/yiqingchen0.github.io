import { normalPdf } from './density';

/** The logo mark: a filled normal curve in a 32 × 32 box. */
export const MARK_VIEWBOX = '0 0 32 32';

const BASELINE = 27;
const PEAK_HEIGHT = 22;

export const markPath = (() => {
	const pdf = normalPdf(16, 4.2);
	const peak = pdf(16);
	const points = Array.from({ length: 33 }, (_, x) => `${x},${(BASELINE - (pdf(x) / peak) * PEAK_HEIGHT).toFixed(2)}`);
	return `M0,${BASELINE + 2}L${points.join('L')}L32,${BASELINE + 2}Z`;
})();

/** A circle of radius 10 centred in the box, used as the intro's starting shape. */
export const circlePath = 'M6,16a10,10 0 1,0 20,0a10,10 0 1,0 -20,0Z';
