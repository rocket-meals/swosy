/**
 * The "contains" search of the settings screen: a setting is shown when its
 * label contains what was typed, ignoring case and surrounding spaces.
 */

export const normalizeSearchText = (text: string | null | undefined): string => (text ?? '').trim().toLocaleLowerCase();

/** Whether `text` contains the already normalized `query`. An empty query matches everything. */
export const matchesSearch = (text: string | null | undefined, query: string): boolean => {
	if (!query) {
		return true;
	}
	return normalizeSearchText(text).includes(query);
};
