export interface YearGroup<T> {
	year: number;
	items: readonly T[];
}

/** Groups items by `data.year`, newest year first, keeping each group's order. */
export function groupByYear<T extends { data: { year: number } }>(items: readonly T[]): YearGroup<T>[] {
	const years = [...new Set(items.map((item) => item.data.year))].sort((a, b) => b - a);
	return years.map((year) => ({ year, items: items.filter((item) => item.data.year === year) }));
}

/** Two-digit index used in lists: 0 -> "01". */
export function indexLabel(i: number): string {
	return String(i + 1).padStart(2, '0');
}
