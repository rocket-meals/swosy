// Count labels for the German UI copy. The app builds a lot of strings like
// "1 Partie" / "3 Partien"; inlining that choice inside another template string
// produces hard-to-read nested template literals, so it lives here instead.

/** `countLabel(1, 'Partie', 'Partien')` → "1 Partie", `countLabel(3, ...)` → "3 Partien". */
export function countLabel(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

/** Optional " · <suffix>" tail, empty when there is nothing to append. */
export function dotSuffix(suffix: string | null | undefined): string {
	return suffix ? ` · ${suffix}` : '';
}
