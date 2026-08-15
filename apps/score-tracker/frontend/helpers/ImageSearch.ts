// ─── Image search for game images ─────────────────────────────────────────────
//
// A game can carry a picture instead of (or next to) its emoji, and only the
// image URL is stored - never the image itself. The URL comes either from a
// picked search result or, for a game that has none yet, automatically from
// the first hit for "<name> Logo".
//
// Providers are tried in order and the first one that returns something wins:
//
//  1. Google Programmable Search (Custom Search JSON API, `searchType=image`) -
//     this is the literal "first image from Google". It needs an API key and a
//     search-engine id, which are read from the Expo config (see
//     `extra.googleImageSearch` in app.config.ts); without them the provider is
//     skipped.
//  2. BoardGameGeek - keyless, and by far the most relevant source for this
//     app: it returns the actual box art of a board game. BGG sends no CORS
//     headers, so it only contributes on native (on web the request fails and
//     the provider is skipped).
//  3. Wikimedia Commons - keyless and CORS-friendly, but a Creative-Commons
//     catalogue: fine for well-known logos, thin for everything else.
//  4. Openverse - keyless and CORS-friendly, the broader CC catch-all.
//
// Because the keyless providers only cover Creative-Commons material, a game
// can also be given an image the user picks themselves (see GameImageUpload) -
// that one is stored inline instead of by URL.
//
// Everything here is plain `fetch` against public JSON APIs; no key is ever
// required for the app to work, the Google one only makes the results match
// what a Google image search would show.

import Constants from 'expo-constants';

export type ImageSearchResult = {
	/** Stable key for list rendering (the image URL). */
	id: string;
	/** Full-size image URL - this is what a game stores. */
	url: string;
	/** Smaller preview used in the picker grid; falls back to `url`. */
	thumbnailUrl: string;
	title: string;
	/** Which provider produced the result, shown in the picker. */
	source: string;
};

/** Default search term for a game: what the user would type into an image search. */
export function defaultImageQuery(gameName: string): string {
	const trimmed = gameName.trim();
	return trimmed === '' ? 'Logo' : `${trimmed} Logo`;
}

type GoogleImageSearchConfig = {
	apiKey: string;
	searchEngineId: string;
};

/** Google credentials from the Expo config, if the app was built with them. */
function getGoogleConfig(): GoogleImageSearchConfig | null {
	const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
	const config = extra?.googleImageSearch as Partial<GoogleImageSearchConfig> | undefined;
	if (!config?.apiKey || !config?.searchEngineId) return null;
	return { apiKey: config.apiKey, searchEngineId: config.searchEngineId };
}

/** True when the app is configured for Google results (otherwise the keyless providers are used). */
export function isGoogleImageSearchConfigured(): boolean {
	return getGoogleConfig() !== null;
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
	const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
	if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
	return response.json();
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}

// ─── Providers ────────────────────────────────────────────────────────────────

async function searchGoogle(query: string, limit: number, signal?: AbortSignal): Promise<ImageSearchResult[]> {
	const config = getGoogleConfig();
	if (!config) return [];
	const url =
		'https://www.googleapis.com/customsearch/v1' +
		`?key=${encodeURIComponent(config.apiKey)}` +
		`&cx=${encodeURIComponent(config.searchEngineId)}` +
		`&searchType=image&num=${Math.min(10, limit)}&q=${encodeURIComponent(query)}`;
	const json = (await fetchJson(url, signal)) as { items?: unknown };
	return asRecordArray(json.items)
		.map((item) => {
			const link = typeof item.link === 'string' ? item.link : null;
			if (!link) return null;
			const image = (item.image ?? {}) as Record<string, unknown>;
			const thumbnail = typeof image.thumbnailLink === 'string' ? image.thumbnailLink : link;
			return {
				id: link,
				url: link,
				thumbnailUrl: thumbnail,
				title: typeof item.title === 'string' ? item.title : query,
				source: 'Google',
			};
		})
		.filter((result): result is ImageSearchResult => result !== null);
}

async function searchWikimediaCommons(query: string, limit: number, signal?: AbortSignal): Promise<ImageSearchResult[]> {
	const url =
		'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
		'&generator=search&gsrnamespace=6&gsrlimit=' + limit +
		'&prop=imageinfo&iiprop=url&iiurlwidth=320' +
		`&gsrsearch=${encodeURIComponent(query)}`;
	const json = (await fetchJson(url, signal)) as { query?: { pages?: Record<string, unknown> } };
	const pages = json.query?.pages;
	if (!pages) return [];
	return Object.values(pages)
		.map((page) => {
			const info = asRecordArray((page as Record<string, unknown>).imageinfo)[0];
			const full = info && typeof info.url === 'string' ? info.url : null;
			if (!full) return null;
			const thumb = info && typeof info.thumburl === 'string' ? info.thumburl : full;
			const title = (page as Record<string, unknown>).title;
			return {
				id: full,
				url: full,
				thumbnailUrl: thumb,
				title: typeof title === 'string' ? title : query,
				source: 'Wikimedia Commons',
			};
		})
		.filter((result): result is ImageSearchResult => result !== null);
}

async function searchOpenverse(query: string, limit: number, signal?: AbortSignal): Promise<ImageSearchResult[]> {
	const url = `https://api.openverse.org/v1/images/?page_size=${limit}&q=${encodeURIComponent(query)}`;
	const json = (await fetchJson(url, signal)) as { results?: unknown };
	return asRecordArray(json.results)
		.map((item) => {
			const full = typeof item.url === 'string' ? item.url : null;
			if (!full) return null;
			const thumb = typeof item.thumbnail === 'string' ? item.thumbnail : full;
			return {
				id: typeof item.id === 'string' ? item.id : full,
				url: full,
				thumbnailUrl: thumb,
				title: typeof item.title === 'string' ? item.title : query,
				source: 'Openverse',
			};
		})
		.filter((result): result is ImageSearchResult => result !== null);
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
	return response.text();
}

/**
 * Drop a trailing "Logo"/"Cover"/"Box" from the search term. Done without a
 * regex: `/\s+(logo|cover|box)$/i` has super-linear runtime due to backtracking
 * on long whitespace runs.
 */
function stripImageSearchSuffix(query: string): string {
	const trimmed = query.trim();
	const lastSpace = Math.max(trimmed.lastIndexOf(' '), trimmed.lastIndexOf('\t'), trimmed.lastIndexOf('\n'));
	if (lastSpace === -1) return trimmed;
	const lastWord = trimmed.slice(lastSpace + 1).toLowerCase();
	if (lastWord !== 'logo' && lastWord !== 'cover' && lastWord !== 'box') return trimmed;
	return trimmed.slice(0, lastSpace).trim();
}

/**
 * BoardGameGeek's XML API: search for the game, then read the box art of the
 * best matches. Two round trips, but it is the only keyless source that
 * actually knows board games. Parsed with narrow regexes rather than a full XML
 * parser - the two tags we need are plain attributes.
 */
async function searchBoardGameGeek(query: string, limit: number, signal?: AbortSignal): Promise<ImageSearchResult[]> {
	// The stored search term usually ends in "Logo"; BGG only knows game titles.
	const title = stripImageSearchSuffix(query);
	if (title === '') return [];

	const searchXml = await fetchText(
		`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(title)}`,
		signal,
	);
	const ids = Array.from(searchXml.matchAll(/<item[^>]*\sid="(\d+)"/g))
		.map((match) => match[1])
		.slice(0, Math.min(10, limit));
	if (ids.length === 0) return [];

	const thingXml = await fetchText(`https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}`, signal);
	const items = thingXml.split('<item ').slice(1);
	return items
		.map((item) => {
			const image = /<image>([^<]+)<\/image>/.exec(item)?.[1];
			if (!image) return null;
			const thumbnail = /<thumbnail>([^<]+)<\/thumbnail>/.exec(item)?.[1] ?? image;
			const name = /<name[^>]*\svalue="([^"]+)"/.exec(item)?.[1] ?? title;
			return {
				id: image,
				url: image.startsWith('//') ? `https:${image}` : image,
				thumbnailUrl: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
				title: name,
				source: 'BoardGameGeek',
			};
		})
		.filter((result): result is ImageSearchResult => result !== null);
}

const PROVIDERS = [searchGoogle, searchBoardGameGeek, searchWikimediaCommons, searchOpenverse];

/**
 * Search images for `query`. Providers are tried in order until one returns
 * results; a provider that fails (offline, rate limited, blocked) is skipped
 * rather than failing the whole search. Returns an empty list when nothing was
 * found anywhere - the caller decides what to show for that.
 */
export async function searchImages(
	query: string,
	options?: { limit?: number; signal?: AbortSignal },
): Promise<ImageSearchResult[]> {
	const trimmed = query.trim();
	if (trimmed === '') return [];
	const limit = options?.limit ?? 20;

	for (const provider of PROVIDERS) {
		try {
			const results = await provider(trimmed, limit, options?.signal);
			if (results.length > 0) return results.slice(0, limit);
		} catch (err) {
			if (options?.signal?.aborted) return [];
			console.warn('[ImageSearch] provider failed:', err);
		}
	}
	return [];
}

/**
 * URL of the first search hit for a game name, used to give a game an image
 * automatically as soon as it is named. Returns `null` when nothing is found
 * (the game then simply keeps its emoji).
 */
export async function findImageUrlForGameName(gameName: string, signal?: AbortSignal): Promise<string | null> {
	const results = await searchImages(defaultImageQuery(gameName), { limit: 1, signal });
	return results[0]?.url ?? null;
}
